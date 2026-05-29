// ============================================
// DripCheck — Color Matching Engine
// ============================================

// ---------- Color Conversion Helpers ----------

/** Hex (#rrggbb) → { r, g, b } */
export function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

/** { r, g, b } → { h (0-360), s (0-100), l (0-100) } */
export function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
}

// ---------- Color Classification ----------

/** Determine if a color is a neutral (black, white, gray, beige, navy) */
export function isNeutral(hex) {
    const { h, s, l } = hexToHsl(hex);
    // Very low saturation  =  gray / black / white
    if (s <= 15) return true;
    // Very dark = near-black
    if (l <= 12) return true;
    // Very light = near-white
    if (l >= 92) return true;
    // Navy blue range (deep dark blue)
    if (h >= 210 && h <= 250 && s <= 60 && l <= 25) return true;
    // Beige / cream
    if (h >= 25 && h <= 50 && s <= 40 && l >= 70) return true;
    return false;
}

/** Get a human-friendly color family name */
export function getColorFamily(hex) {
    const { h, s, l } = hexToHsl(hex);

    if (l <= 12) return 'black';
    if (l >= 92) return 'white';
    if (s <= 12) return l > 50 ? 'light-gray' : 'dark-gray';

    // Beige / cream
    if (h >= 25 && h <= 50 && s <= 40 && l >= 65) return 'beige';

    // Color wheel sectors
    if (h < 15 || h >= 345) return 'red';
    if (h < 40) return 'orange';
    if (h < 65) return 'yellow';
    if (h < 160) return 'green';
    if (h < 195) return 'teal';
    if (h < 250) return 'blue';
    if (h < 290) return 'purple';
    if (h < 345) return 'pink';
    return 'red';
}

// ---------- Matching Rules ----------

/** Hue distance (circular 0-180) */
function hueDist(h1, h2) {
    const d = Math.abs(h1 - h2);
    return Math.min(d, 360 - d);
}

/**
 * Score how well two clothing items match (0-100).
 * Higher = better match.
 */
export function matchScore(hexA, hexB) {
    const a = hexToHsl(hexA);
    const b = hexToHsl(hexB);
    const neutralA = isNeutral(hexA);
    const neutralB = isNeutral(hexB);

    let score = 0;

    // ----- RULE 1: Neutral + Anything = great -----
    if (neutralA || neutralB) {
        score += 40;
        // Two neutrals together
        if (neutralA && neutralB) {
            // Black + white is classic
            if ((a.l <= 15 && b.l >= 85) || (b.l <= 15 && a.l >= 85)) {
                score += 50; // 90 total
            } else {
                score += 30; // 70 total
            }
        } else {
            // Neutral + color → give bonus if L contrast is good
            const lDiff = Math.abs(a.l - b.l);
            score += Math.min(lDiff * 0.6, 40); // up to 80 total
        }
        return Math.min(score, 100);
    }

    // ----- RULE 2: Complementary colors (opposite hue) -----
    const hd = hueDist(a.h, b.h);
    if (hd >= 150 && hd <= 180) {
        score += 72;
        // Bonus if saturation isn't clashing wildly
        const sDiff = Math.abs(a.s - b.s);
        if (sDiff < 30) score += 15;
        return Math.min(score, 100);
    }

    // ----- RULE 3: Analogous (close hue ≤30°) -----
    if (hd <= 30) {
        score += 60;
        // Different lightness levels help
        const lDiff = Math.abs(a.l - b.l);
        if (lDiff >= 15) score += 20;
        return Math.min(score, 100);
    }

    // ----- RULE 4: Triadic (≈120° apart) -----
    if (hd >= 100 && hd <= 140) {
        score += 55;
        return Math.min(score, 100);
    }

    // ----- RULE 5: Split-complementary (≈150°) -----
    if (hd >= 130 && hd < 150) {
        score += 60;
        return Math.min(score, 100);
    }

    // ----- Fallback: general scoring -----
    // Moderate hue distance (>30, <100) — can be okay
    score += 30;
    // Bonus for lightness contrast
    const lDiff = Math.abs(a.l - b.l);
    score += Math.min(lDiff * 0.3, 20);
    // Penalty for very close saturation AND hue (looks muddy)
    if (Math.abs(a.s - b.s) < 10 && hd < 60) {
        score -= 10;
    }

    return Math.max(0, Math.min(score, 100));
}

/** Get a tag description for the match type */
export function getMatchType(hexA, hexB) {
    const a = hexToHsl(hexA);
    const b = hexToHsl(hexB);
    const neutralA = isNeutral(hexA);
    const neutralB = isNeutral(hexB);
    const hd = hueDist(a.h, b.h);

    const tags = [];

    if (neutralA && neutralB) {
        if ((a.l <= 15 && b.l >= 85) || (b.l <= 15 && a.l >= 85)) {
            tags.push('Classic B&W');
        } else {
            tags.push('Neutral Duo');
        }
    } else if (neutralA || neutralB) {
        tags.push('Neutral Pairing');
    }

    if (!neutralA && !neutralB) {
        if (hd >= 150) tags.push('Complementary');
        else if (hd <= 30) tags.push('Analogous');
        else if (hd >= 100 && hd <= 140) tags.push('Triadic');
        else if (hd >= 60 && hd < 100) tags.push('Bold');
    }

    // Lightness contrast
    const lDiff = Math.abs(a.l - b.l);
    if (lDiff >= 40) tags.push('High Contrast');
    else if (lDiff <= 15) tags.push('Tonal');

    return tags.length > 0 ? tags : ['Color Match'];
}

/** Score a full outfit (array of hex colors). Returns 0-100. */
export function scoreOutfit(hexColors) {
    if (hexColors.length < 2) return 100;

    let totalScore = 0;
    let pairs = 0;

    for (let i = 0; i < hexColors.length; i++) {
        for (let j = i + 1; j < hexColors.length; j++) {
            totalScore += matchScore(hexColors[i], hexColors[j]);
            pairs++;
        }
    }

    return Math.round(totalScore / pairs);
}

/** Get match fill color based on score */
export function getScoreColor(score) {
    if (score >= 80) return 'var(--accent-success)';
    if (score >= 60) return 'var(--accent-secondary)';
    if (score >= 40) return 'var(--accent-warning)';
    return 'var(--accent-tertiary)';
}

/** Get label for score */
export function getScoreLabel(score) {
    if (score >= 85) return '🔥 Perfect';
    if (score >= 70) return '✨ Great';
    if (score >= 55) return '👍 Good';
    if (score >= 40) return '🤔 Okay';
    return '⚡ Bold';
}
