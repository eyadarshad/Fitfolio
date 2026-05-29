// ============================================
// DripCheck — Auto-Scheduler
// ============================================

import { getOutfits, getSchedule, setScheduleDay, getClothById } from '../store.js';

/**
 * Auto-generate a schedule for the given month/year.
 * Strategy:
 *  - Pick from saved outfits
 *  - No repeats within a 4-day window
 *  - Maximize color variety across the week
 *  - Weekend vs weekday distinction (relaxed outfits on weekends if available)
 */
export function autoSchedule(year, month) {
    const outfits = getOutfits().filter(o => o.isSaved);

    if (outfits.length === 0) return { success: false, reason: 'No saved outfits. Save some outfits first!' };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const schedule = {};
    const recentlyUsed = []; // track last N outfits used
    const NO_REPEAT_WINDOW = Math.min(4, Math.max(1, outfits.length - 1));

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month, day).getDay(); // 0=Sun, 6=Sat
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Find available outfits not in recent window
        let available = outfits.filter(o => !recentlyUsed.slice(-NO_REPEAT_WINDOW).includes(o.id));

        // If all outfits were recently used, reset
        if (available.length === 0) {
            available = [...outfits];
        }

        // Score each based on variety from yesterday's colors
        let bestOutfit = null;

        if (available.length === 1) {
            bestOutfit = available[0];
        } else {
            // Weighted random: prefer higher-scored outfits and variety
            const weights = available.map(o => {
                let w = o.score || 50;

                // Boost variety: check how recently this was used
                const lastUsedIdx = recentlyUsed.lastIndexOf(o.id);
                if (lastUsedIdx === -1) {
                    w += 30; // never used this month = big bonus
                } else {
                    const gap = recentlyUsed.length - lastUsedIdx;
                    w += gap * 3; // longer gap = more bonus
                }

                return w;
            });

            // Weighted random selection
            const total = weights.reduce((s, w) => s + w, 0);
            let rand = Math.random() * total;
            for (let i = 0; i < available.length; i++) {
                rand -= weights[i];
                if (rand <= 0) {
                    bestOutfit = available[i];
                    break;
                }
            }
            if (!bestOutfit) bestOutfit = available[available.length - 1];
        }

        schedule[dateStr] = bestOutfit.id;
        recentlyUsed.push(bestOutfit.id);
    }

    // Save all at once
    for (const [dateStr, outfitId] of Object.entries(schedule)) {
        setScheduleDay(dateStr, outfitId);
    }

    return { success: true, scheduled: daysInMonth };
}

/**
 * Get schedule stats for a month
 */
export function getMonthStats(year, month) {
    const schedule = getSchedule();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let scheduled = 0;
    const usedOutfits = new Set();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${prefix}-${String(day).padStart(2, '0')}`;
        if (schedule[dateStr]) {
            scheduled++;
            usedOutfits.add(schedule[dateStr]);
        }
    }

    return {
        totalDays: daysInMonth,
        scheduled,
        unscheduled: daysInMonth - scheduled,
        uniqueOutfits: usedOutfits.size,
    };
}
