// ============================================
// DripCheck — Trend Database & Matching Engine
// ============================================
//
// DYNAMIC TRENDS: Trends rotate based on:
//  - Current season (auto-detected from date)
//  - Weekly freshness rotation (different trends surface each week)
//  - "Trending Now" scores decay/boost over time
//  - Date-seeded shuffle so the order changes weekly
//

const TREND_DATABASE = [
    // ====== UNISEX / ALL ======
    {
        id: 'quiet-luxury',
        name: 'Quiet Luxury',
        season: 'all',
        peakMonths: [0, 1, 2, 9, 10, 11], // fall/winter peak
        image: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=600&q=80',
        description: 'Understated opulence. Premium fabrics, muted tones, minimal branding. Old money aesthetics.',
        colors: ['#2C2C2C', '#4A4A4A', '#8B8378', '#F5F0E8', '#C4A87C', '#3C3C3C'],
        combos: [
            { top: 'sweater', bottom: 'trousers', footwear: 'loafers', accessory: 'watch' },
            { top: 'coat', bottom: 'trousers', footwear: 'boots', accessory: 'belt' },
        ],
        suggestedItems: [
            { name: 'Cashmere Crewneck', category: 'sweater', color: 'Charcoal', colorHex: '#4A4A4A' },
            { name: 'Tailored Wool Trousers', category: 'trousers', color: 'Slate', colorHex: '#6B6B6B' },
            { name: 'Penny Loafers', category: 'loafers', color: 'Burgundy', colorHex: '#722F37' },
            { name: 'Minimalist Leather Watch', category: 'watch', color: 'Brown', colorHex: '#8B6914' },
        ],
        gender: 'all', tags: ['minimal', 'luxe', 'understated', 'premium'],
    },
    {
        id: 'scandi-minimalism',
        name: 'Scandinavian Minimalism',
        season: 'winter',
        peakMonths: [10, 11, 0, 1],
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
        description: 'Clean lines, neutral palette, functional design. Quality over quantity.',
        colors: ['#F5F0E8', '#3C3C3C', '#6B6B6B', '#1A1A1A', '#C4B5A0', '#E0D8CA'],
        combos: [
            { top: 'sweater', bottom: 'jeans', footwear: 'boots', accessory: 'scarf' },
            { top: 'coat', bottom: 'trousers', footwear: 'boots', accessory: 'bag' },
        ],
        suggestedItems: [
            { name: 'Oversized Wool Coat', category: 'coat', color: 'Camel', colorHex: '#C4A87C' },
            { name: 'Straight-Leg Jeans', category: 'jeans', color: 'Dark Wash', colorHex: '#2C3E50' },
            { name: 'Chunky Knit Scarf', category: 'scarf', color: 'Cream', colorHex: '#F5F0E8' },
            { name: 'Chelsea Boots', category: 'boots', color: 'Black', colorHex: '#1A1A1A' },
        ],
        gender: 'all', tags: ['minimal', 'clean', 'functional', 'nordic'],
    },
    {
        id: 'modern-workwear',
        name: 'Modern Professional',
        season: 'all',
        peakMonths: [0, 1, 2, 3, 8, 9, 10, 11], // school/work months
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        description: 'Contemporary office style. Sharp tailoring with strategic color pops.',
        colors: ['#2C3E50', '#34495E', '#F5F0E8', '#1A1A1A', '#8B6914', '#7B241C'],
        combos: [
            { top: 'shirt', bottom: 'trousers', footwear: 'loafers', accessory: 'watch' },
            { top: 'sweater', bottom: 'chinos', footwear: 'boots', accessory: 'belt' },
        ],
        suggestedItems: [
            { name: 'Fitted Oxford Shirt', category: 'shirt', color: 'Light Blue', colorHex: '#6CA6D9' },
            { name: 'Slim Tailored Pants', category: 'trousers', color: 'Navy', colorHex: '#2C3E50' },
            { name: 'Oxford Shoes', category: 'loafers', color: 'Dark Brown', colorHex: '#3B2112' },
            { name: 'Leather Briefcase', category: 'bag', color: 'Cognac', colorHex: '#8B4513' },
        ],
        gender: 'all', tags: ['professional', 'sharp', 'tailored', 'office'],
    },

    // ====== MALE SPECIFIC ======
    {
        id: 'streetwear-techwear',
        name: 'Techwear Streetwear',
        season: 'all',
        peakMonths: [0, 1, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80',
        description: 'Futuristic utility meets urban style. Dark palettes and technical fabrics.',
        colors: ['#1A1A1A', '#2D2D2D', '#0A0A0A', '#3D5A3D', '#C0C0C0', '#4A4A4A'],
        combos: [
            { top: 'jacket', bottom: 'joggers', footwear: 'sneakers', accessory: 'bag' },
            { top: 'hoodie', bottom: 'joggers', footwear: 'sneakers', accessory: 'belt' },
        ],
        suggestedItems: [
            { name: 'Waterproof Shell Jacket', category: 'jacket', color: 'Black', colorHex: '#1A1A1A' },
            { name: 'Cargo Joggers', category: 'joggers', color: 'Olive', colorHex: '#3D5A3D' },
            { name: 'All-Black Runners', category: 'sneakers', color: 'Black', colorHex: '#0A0A0A' },
            { name: 'Utility Crossbody Bag', category: 'bag', color: 'Gunmetal', colorHex: '#4A4A4A' },
        ],
        gender: 'male', tags: ['urban', 'futuristic', 'utility', 'dark'],
    },
    {
        id: 'clean-athletic',
        name: 'Clean Athletic',
        season: 'all',
        peakMonths: [3, 4, 5, 6, 7, 8], // spring/summer
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80',
        description: 'Athleisure elevated. Monochromatic schemes and performance fabrics.',
        colors: ['#F5F5F5', '#E0E0E0', '#2C2C2C', '#1B4D3E', '#4169E1', '#1A1A1A'],
        combos: [
            { top: 't-shirt', bottom: 'joggers', footwear: 'sneakers', accessory: 'watch' },
            { top: 'hoodie', bottom: 'shorts', footwear: 'sneakers', accessory: 'hat' },
        ],
        suggestedItems: [
            { name: 'Slim-Fit Performance Tee', category: 't-shirt', color: 'White', colorHex: '#F5F5F5' },
            { name: 'Tapered Training Joggers', category: 'joggers', color: 'Dark Grey', colorHex: '#2C2C2C' },
            { name: 'Running Sneakers', category: 'sneakers', color: 'White/Grey', colorHex: '#E0E0E0' },
            { name: 'Digital Sport Watch', category: 'watch', color: 'Black', colorHex: '#1A1A1A' },
        ],
        gender: 'male', tags: ['athleisure', 'sporty', 'clean', 'minimal'],
    },
    {
        id: 'desert-earth',
        name: 'Desert Earth Tones',
        season: 'spring',
        peakMonths: [2, 3, 4, 8, 9],
        image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600&q=80',
        description: 'Warm, sun-baked palette. Rustic textures and organic silhouettes.',
        colors: ['#8B4513', '#A0522D', '#DEB887', '#CD853F', '#D2691E', '#F4A460'],
        combos: [
            { top: 'shirt', bottom: 'chinos', footwear: 'boots', accessory: 'belt' },
            { top: 'jacket', bottom: 'jeans', footwear: 'boots', accessory: 'hat' },
        ],
        suggestedItems: [
            { name: 'Suede Overshirt', category: 'jacket', color: 'Caramel', colorHex: '#A0522D' },
            { name: 'Straight Chinos', category: 'chinos', color: 'Khaki', colorHex: '#DEB887' },
            { name: 'Desert Boots', category: 'boots', color: 'Sand', colorHex: '#CD853F' },
            { name: 'Wide-Brim Hat', category: 'hat', color: 'Tan', colorHex: '#D2691E' },
        ],
        gender: 'male', tags: ['earthy', 'warm', 'rustic', 'desert'],
    },
    {
        id: 'coastal-prep',
        name: 'Coastal Prep',
        season: 'summer',
        peakMonths: [4, 5, 6, 7, 8],
        image: 'https://images.unsplash.com/photo-1523264653568-d3d4032bb397?w=600&q=80',
        description: 'Relaxed seaside style. Linen, neutrals, and effortless sophistication.',
        colors: ['#F5F0E8', '#C4B5A0', '#8B7355', '#4A6741', '#E8DED1', '#2C3E50'],
        combos: [
            { top: 'shirt', bottom: 'chinos', footwear: 'loafers', accessory: 'sunglasses' },
            { top: 'shirt', bottom: 'shorts', footwear: 'sandals', accessory: 'hat' },
        ],
        suggestedItems: [
            { name: 'Linen Camp Collar Shirt', category: 'shirt', color: 'Ivory', colorHex: '#F5F0E8' },
            { name: 'Tailored Chino Shorts', category: 'shorts', color: 'Sand', colorHex: '#C4B5A0' },
            { name: 'Leather Slide Sandals', category: 'sandals', color: 'Tan', colorHex: '#8B7355' },
            { name: 'Tortoise Sunglasses', category: 'sunglasses', color: 'Brown', colorHex: '#8B6914' },
        ],
        gender: 'male', tags: ['relaxed', 'coastal', 'linen', 'prep'],
    },

    // ====== FEMALE SPECIFIC ======
    {
        id: 'coastal-grandma',
        name: 'Coastal Grandmother',
        season: 'summer',
        peakMonths: [4, 5, 6, 7, 8],
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
        description: 'Relaxed elegance inspired by seaside living. Linen textures and effortless sophistication.',
        colors: ['#F5F0E8', '#C4B5A0', '#8B7355', '#4A6741', '#E8DED1', '#2C3E50'],
        combos: [
            { top: 'blouse', bottom: 'trousers', footwear: 'sandals', accessory: 'hat' },
            { top: 'blouse', bottom: 'chinos', footwear: 'loafers', accessory: 'sunglasses' },
        ],
        suggestedItems: [
            { name: 'Oversized Linen Blouse', category: 'blouse', color: 'Ivory', colorHex: '#F5F0E8' },
            { name: 'Wide-Leg Linen Trousers', category: 'trousers', color: 'Sand', colorHex: '#C4B5A0' },
            { name: 'Leather Slide Sandals', category: 'sandals', color: 'Tan', colorHex: '#8B7355' },
            { name: 'Woven Straw Tote', category: 'bag', color: 'Natural', colorHex: '#DDD0B6' },
        ],
        gender: 'female', tags: ['relaxed', 'elegant', 'linen', 'coastal'],
    },
    {
        id: 'boho-maximalism',
        name: 'Boho Maximalism',
        season: 'summer',
        peakMonths: [4, 5, 6, 7],
        image: 'https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?w=600&q=80',
        description: 'Expressive layering with rich patterns and eclectic accessories.',
        colors: ['#8B4513', '#CD853F', '#DAA520', '#B22222', '#228B22', '#FF8C00'],
        combos: [
            { fullbody: 'dress', footwear: 'sandals', accessory: 'jewelry' },
            { top: 'blouse', bottom: 'skirt', footwear: 'sandals', accessory: 'scarf' },
        ],
        suggestedItems: [
            { name: 'Flowy Maxi Dress', category: 'dress', color: 'Terracotta', colorHex: '#CD853F' },
            { name: 'Embroidered Peasant Blouse', category: 'blouse', color: 'Cream', colorHex: '#FFFDD0' },
            { name: 'Layered Gold Necklaces', category: 'jewelry', color: 'Gold', colorHex: '#DAA520' },
            { name: 'Braided Leather Sandals', category: 'sandals', color: 'Tan', colorHex: '#8B6914' },
        ],
        gender: 'female', tags: ['boho', 'eclectic', 'layered', 'earthy'],
    },
    {
        id: 'dark-romance',
        name: 'Dark Romance',
        season: 'winter',
        peakMonths: [9, 10, 11, 0, 1],
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
        description: 'Gothic-inspired elegance. Deep jewel tones and dramatic accessories.',
        colors: ['#1A0A1A', '#4A0E4E', '#8B0A1A', '#2C1A2C', '#C0C0C0', '#722F37'],
        combos: [
            { fullbody: 'dress', footwear: 'boots', accessory: 'jewelry' },
            { top: 'blouse', bottom: 'skirt', footwear: 'heels', accessory: 'scarf' },
        ],
        suggestedItems: [
            { name: 'Velvet Wrap Dress', category: 'dress', color: 'Burgundy', colorHex: '#722F37' },
            { name: 'Silk Blouse', category: 'blouse', color: 'Deep Plum', colorHex: '#4A0E4E' },
            { name: 'Statement Silver Ring', category: 'jewelry', color: 'Silver', colorHex: '#C0C0C0' },
            { name: 'Pointed Ankle Boots', category: 'boots', color: 'Black', colorHex: '#1A0A1A' },
        ],
        gender: 'female', tags: ['gothic', 'dramatic', 'jewel-tones', 'elegant'],
    },
    {
        id: 'y2k-revival',
        name: 'Y2K Revival',
        season: 'summer',
        peakMonths: [3, 4, 5, 6, 7, 8],
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
        description: 'Early 2000s nostalgia. Low-rise, baby tees, metallics, and playful accessories.',
        colors: ['#FF69B4', '#00CED1', '#FFD700', '#C0C0C0', '#FF1493', '#9B59B6'],
        combos: [
            { top: 'crop-top', bottom: 'jeans', footwear: 'sneakers', accessory: 'sunglasses' },
            { top: 'tank-top', bottom: 'skirt', footwear: 'heels', accessory: 'bag' },
        ],
        suggestedItems: [
            { name: 'Metallic Baby Tee', category: 'crop-top', color: 'Silver', colorHex: '#C0C0C0' },
            { name: 'Low-Rise Flared Jeans', category: 'jeans', color: 'Light Wash', colorHex: '#8DA7BE' },
            { name: 'Platform Sneakers', category: 'sneakers', color: 'White/Pink', colorHex: '#FFB6C1' },
            { name: 'Butterfly Sunglasses', category: 'sunglasses', color: 'Purple', colorHex: '#9B59B6' },
        ],
        gender: 'female', tags: ['y2k', 'nostalgic', 'playful', 'metallic'],
    },
    {
        id: 'soft-girl',
        name: 'Soft Girl Aesthetic',
        season: 'all',
        peakMonths: [2, 3, 4, 5],
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80',
        description: 'Pastel dreamland. Blush pinks, lilacs, and cozy knits with delicate accessories.',
        colors: ['#FFB6C1', '#E6E6FA', '#FFF0F5', '#DDA0DD', '#F5E6CC', '#FFDAB9'],
        combos: [
            { top: 'sweater', bottom: 'skirt', footwear: 'sneakers', accessory: 'jewelry' },
            { top: 'crop-top', bottom: 'jeans', footwear: 'flats', accessory: 'bag' },
        ],
        suggestedItems: [
            { name: 'Pastel Knit Cardigan', category: 'sweater', color: 'Blush', colorHex: '#FFB6C1' },
            { name: 'Pleated Mini Skirt', category: 'skirt', color: 'Lilac', colorHex: '#E6E6FA' },
            { name: 'White Platform Sneakers', category: 'sneakers', color: 'White', colorHex: '#F5F5F5' },
            { name: 'Pearl Pendant Necklace', category: 'jewelry', color: 'Cream', colorHex: '#FAEBD7' },
        ],
        gender: 'female', tags: ['pastel', 'cute', 'cozy', 'feminine'],
    },
    {
        id: 'power-blazer',
        name: 'Power Blazer',
        season: 'all',
        peakMonths: [0, 1, 2, 8, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80',
        description: 'Boss energy. Oversized blazers, structured tailoring, and confident silhouettes.',
        colors: ['#1A1A1A', '#2C3E50', '#8B7355', '#F5F0E8', '#722F37', '#C4A87C'],
        combos: [
            { top: 'jacket', bottom: 'trousers', footwear: 'heels', accessory: 'bag' },
            { top: 'jacket', bottom: 'jeans', footwear: 'boots', accessory: 'watch' },
        ],
        suggestedItems: [
            { name: 'Oversized Double-Breasted Blazer', category: 'jacket', color: 'Black', colorHex: '#1A1A1A' },
            { name: 'High-Waist Wide Trousers', category: 'trousers', color: 'Camel', colorHex: '#C4A87C' },
            { name: 'Pointed Stiletto Heels', category: 'heels', color: 'Nude', colorHex: '#C4A87C' },
            { name: 'Structured Leather Tote', category: 'bag', color: 'Black', colorHex: '#1A1A1A' },
        ],
        gender: 'female', tags: ['boss', 'tailored', 'power', 'structured'],
    },
    {
        id: 'cottagecore',
        name: 'Cottagecore',
        season: 'spring',
        peakMonths: [2, 3, 4, 5],
        image: 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=600&q=80',
        description: 'Romantic countryside living. Florals, prairie dresses, and handmade charm.',
        colors: ['#8FBC8F', '#F5DEB3', '#DEB887', '#BC8F8F', '#FFFDD0', '#6B8E23'],
        combos: [
            { fullbody: 'dress', footwear: 'flats', accessory: 'hat' },
            { top: 'blouse', bottom: 'skirt', footwear: 'sandals', accessory: 'scarf' },
        ],
        suggestedItems: [
            { name: 'Floral Prairie Dress', category: 'dress', color: 'Sage', colorHex: '#8FBC8F' },
            { name: 'Puffed-Sleeve Blouse', category: 'blouse', color: 'Cream', colorHex: '#FFFDD0' },
            { name: 'Straw Bucket Hat', category: 'hat', color: 'Wheat', colorHex: '#F5DEB3' },
            { name: 'Ballet Flats', category: 'flats', color: 'Tan', colorHex: '#DEB887' },
        ],
        gender: 'female', tags: ['romantic', 'rural', 'floral', 'vintage'],
    },
    {
        id: 'athleisure-chic',
        name: 'Athleisure Chic',
        season: 'all',
        peakMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&q=80',
        description: 'Sporty meets polished. Matching sets, sleek sneakers, and minimal accessories.',
        colors: ['#F5F5F5', '#1A1A1A', '#E0E0E0', '#C4A87C', '#2C2C2C', '#A08468'],
        combos: [
            { top: 'crop-top', bottom: 'leggings', footwear: 'sneakers', accessory: 'bag' },
            { top: 'hoodie', bottom: 'joggers', footwear: 'sneakers', accessory: 'sunglasses' },
        ],
        suggestedItems: [
            { name: 'Ribbed Sports Bra Top', category: 'crop-top', color: 'White', colorHex: '#F5F5F5' },
            { name: 'High-Waist Leggings', category: 'leggings', color: 'Black', colorHex: '#1A1A1A' },
            { name: 'Chunky Dad Sneakers', category: 'sneakers', color: 'Off-White', colorHex: '#E0E0E0' },
            { name: 'Mini Crossbody Bag', category: 'bag', color: 'Taupe', colorHex: '#A08468' },
        ],
        gender: 'female', tags: ['sporty', 'polished', 'matching', 'minimal'],
    },
    {
        id: 'old-money-feminine',
        name: 'Old Money Elegance',
        season: 'all',
        peakMonths: [0, 1, 8, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707998?w=600&q=80',
        description: 'Timeless class. Neutral knits, pearl accessories, pleated skirts, and quiet refinement.',
        colors: ['#F5F0E8', '#C4B5A0', '#2C3E50', '#FAEBD7', '#8B7355', '#1A1A1A'],
        combos: [
            { top: 'sweater', bottom: 'trousers', footwear: 'loafers', accessory: 'jewelry' },
            { top: 'blouse', bottom: 'skirt', footwear: 'flats', accessory: 'bag' },
        ],
        suggestedItems: [
            { name: 'Cashmere V-Neck Sweater', category: 'sweater', color: 'Ivory', colorHex: '#F5F0E8' },
            { name: 'Pleated Midi Skirt', category: 'skirt', color: 'Navy', colorHex: '#2C3E50' },
            { name: 'Leather Penny Loafers', category: 'loafers', color: 'Tan', colorHex: '#8B7355' },
            { name: 'Pearl Stud Earrings', category: 'jewelry', color: 'Pearl', colorHex: '#FAEBD7' },
        ],
        gender: 'female', tags: ['classic', 'elegant', 'timeless', 'refined'],
    },
    {
        id: 'hijabi-modest',
        name: 'Modern Modest',
        season: 'all',
        peakMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=600&q=80',
        description: 'Elegant modest fashion. Flowing layers, coordinated hijabs, and refined accessories.',
        colors: ['#8B7355', '#F5F0E8', '#2C3E50', '#C4A87C', '#DEB887', '#1A1A1A'],
        combos: [
            { fullbody: 'dress', footwear: 'flats', accessory: 'hijab' },
            { top: 'blouse', bottom: 'trousers', footwear: 'heels', accessory: 'hijab' },
        ],
        suggestedItems: [
            { name: 'Flowing Maxi Dress', category: 'dress', color: 'Sage', colorHex: '#8FBC8F' },
            { name: 'Drape Hijab', category: 'hijab', color: 'Camel', colorHex: '#C4A87C' },
            { name: 'Wide-Leg Palazzo Pants', category: 'trousers', color: 'Navy', colorHex: '#2C3E50' },
            { name: 'Pointed Kitten Heels', category: 'heels', color: 'Nude', colorHex: '#DEB887' },
        ],
        gender: 'female', tags: ['modest', 'elegant', 'hijab', 'refined'],
    },

    // ====== REGIONAL TRENDS ======
    {
        id: 'pk-kurta-modern',
        name: 'Modern Kurta Style',
        season: 'all',
        peakMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80',
        description: 'Contemporary Pakistani kurta pairings. Slim-fit kurtas with western bottoms for a fusion look.',
        colors: ['#F5F0E8', '#2C3E50', '#8B6914', '#1A1A1A', '#C4A87C', '#DEB887'],
        combos: [
            { top: 'shirt', bottom: 'trousers', footwear: 'loafers', accessory: 'watch' },
        ],
        suggestedItems: [
            { name: 'Slim-Fit Kurta', category: 'shirt', color: 'Ivory', colorHex: '#F5F0E8' },
            { name: 'Tailored Shalwar', category: 'trousers', color: 'Navy', colorHex: '#2C3E50' },
            { name: 'Peshawari Chappal', category: 'sandals', color: 'Brown', colorHex: '#8B6914' },
            { name: 'Leather Watch', category: 'watch', color: 'Gold', colorHex: '#C4A87C' },
        ],
        gender: 'male', tags: ['kurta', 'desi', 'fusion', 'festive'],
        regions: ['pk', 'in', 'sa', 'ae'],
    },
    {
        id: 'pk-festive-embroidery',
        name: 'Festive Embroidered',
        season: 'all',
        peakMonths: [0, 1, 2, 5, 6, 10, 11],
        image: 'https://images.unsplash.com/photo-1610030469668-6e98999e2e50?w=600&q=80',
        description: 'Richly embroidered traditional wear. Perfect for Eid, weddings, and celebrations.',
        colors: ['#722F37', '#DAA520', '#1A1A1A', '#4A0E4E', '#C4A87C', '#8B0A1A'],
        combos: [
            { fullbody: 'dress', footwear: 'heels', accessory: 'jewelry' },
        ],
        suggestedItems: [
            { name: 'Embroidered Anarkali', category: 'dress', color: 'Maroon', colorHex: '#722F37' },
            { name: 'Gold Jhumka Earrings', category: 'jewelry', color: 'Gold', colorHex: '#DAA520' },
            { name: 'Embellished Khussa', category: 'flats', color: 'Gold', colorHex: '#C4A87C' },
            { name: 'Chiffon Dupatta', category: 'scarf', color: 'Deep Red', colorHex: '#8B0A1A' },
        ],
        gender: 'female', tags: ['festive', 'embroidered', 'desi', 'bridal'],
        regions: ['pk', 'in'],
    },
    {
        id: 'pk-lawn-chic',
        name: 'Lawn Season Chic',
        season: 'summer',
        peakMonths: [2, 3, 4, 5, 6, 7],
        image: 'https://images.unsplash.com/photo-1583391733981-8b530b07f590?w=600&q=80',
        description: 'Vibrant printed lawn suits. Light, breathable fabric for the South Asian summer.',
        colors: ['#FF69B4', '#00CED1', '#FFD700', '#8FBC8F', '#FF8C00', '#E6E6FA'],
        combos: [
            { top: 'blouse', bottom: 'trousers', footwear: 'sandals', accessory: 'jewelry' },
        ],
        suggestedItems: [
            { name: 'Printed Lawn Kurta', category: 'blouse', color: 'Coral', colorHex: '#FF69B4' },
            { name: 'Cigarette Pants', category: 'trousers', color: 'White', colorHex: '#F5F5F5' },
            { name: 'Kolhapuri Sandals', category: 'sandals', color: 'Tan', colorHex: '#DEB887' },
            { name: 'Statement Bangles', category: 'jewelry', color: 'Gold', colorHex: '#DAA520' },
        ],
        gender: 'female', tags: ['lawn', 'summer', 'desi', 'vibrant'],
        regions: ['pk', 'in'],
    },
    {
        id: 'me-thobe-modern',
        name: 'Modern Thobe',
        season: 'all',
        peakMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80',
        description: 'Sleek contemporary thobes and dishdashas with modern accessories.',
        colors: ['#F5F5F5', '#1A1A1A', '#C4A87C', '#2C3E50', '#E0D8CA', '#8B6914'],
        combos: [
            { fullbody: 'dress', footwear: 'sandals', accessory: 'watch' },
        ],
        suggestedItems: [
            { name: 'White Thobe', category: 'dress', color: 'White', colorHex: '#F5F5F5' },
            { name: 'Leather Sandals', category: 'sandals', color: 'Brown', colorHex: '#8B6914' },
            { name: 'Gold Watch', category: 'watch', color: 'Gold', colorHex: '#C4A87C' },
        ],
        gender: 'male', tags: ['thobe', 'elegant', 'arab', 'traditional'],
        regions: ['sa', 'ae'],
    },
    {
        id: 'kr-hanbok-modern',
        name: 'Modern Hanbok Fusion',
        season: 'spring',
        peakMonths: [2, 3, 4, 8, 9],
        image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80',
        description: 'Korean-inspired silhouettes. Wide sleeves, pastel palettes, and structured layers.',
        colors: ['#E6E6FA', '#FFB6C1', '#F5F0E8', '#8FBC8F', '#DDA0DD', '#FAEBD7'],
        combos: [
            { top: 'blouse', bottom: 'skirt', footwear: 'flats', accessory: 'jewelry' },
        ],
        suggestedItems: [
            { name: 'Wide-Sleeve Blouse', category: 'blouse', color: 'Lavender', colorHex: '#E6E6FA' },
            { name: 'Pleated Maxi Skirt', category: 'skirt', color: 'Blush', colorHex: '#FFB6C1' },
            { name: 'Ballet Flats', category: 'flats', color: 'Cream', colorHex: '#FAEBD7' },
            { name: 'Minimalist Pendant', category: 'jewelry', color: 'Silver', colorHex: '#C0C0C0' },
        ],
        gender: 'female', tags: ['korean', 'hanbok', 'pastel', 'elegant'],
        regions: ['kr', 'jp'],
    },
    {
        id: 'tr-ottoman-luxe',
        name: 'Ottoman Luxe',
        season: 'winter',
        peakMonths: [9, 10, 11, 0, 1],
        image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b38?w=600&q=80',
        description: 'Rich textures inspired by Turkish heritage. Velvet, brocade, and jewel tones.',
        colors: ['#722F37', '#DAA520', '#2C1A2C', '#8B4513', '#C4A87C', '#4A0E4E'],
        combos: [
            { top: 'jacket', bottom: 'trousers', footwear: 'boots', accessory: 'scarf' },
        ],
        suggestedItems: [
            { name: 'Velvet Blazer', category: 'jacket', color: 'Burgundy', colorHex: '#722F37' },
            { name: 'Slim Wool Trousers', category: 'trousers', color: 'Charcoal', colorHex: '#2C2C2C' },
            { name: 'Suede Chelsea Boots', category: 'boots', color: 'Tan', colorHex: '#8B4513' },
            { name: 'Silk Scarf', category: 'scarf', color: 'Gold', colorHex: '#DAA520' },
        ],
        gender: 'all', tags: ['ottoman', 'luxe', 'velvet', 'heritage'],
        regions: ['tr'],
    },
    {
        id: 'western-streetcore',
        name: 'Western Streetcore',
        season: 'all',
        peakMonths: [0, 1, 2, 3, 9, 10, 11],
        image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&q=80',
        description: 'Raw US/UK street style. Oversized hoodies, distressed denim, and chunky sneakers.',
        colors: ['#1A1A1A', '#2C2C2C', '#4A4A4A', '#F5F5F5', '#8DA7BE', '#A0522D'],
        combos: [
            { top: 'hoodie', bottom: 'jeans', footwear: 'sneakers', accessory: 'hat' },
        ],
        suggestedItems: [
            { name: 'Oversized Graphic Hoodie', category: 'hoodie', color: 'Black', colorHex: '#1A1A1A' },
            { name: 'Distressed Wide Jeans', category: 'jeans', color: 'Light Wash', colorHex: '#8DA7BE' },
            { name: 'Chunky High-Tops', category: 'sneakers', color: 'White', colorHex: '#F5F5F5' },
            { name: 'Snapback Cap', category: 'hat', color: 'Black', colorHex: '#2C2C2C' },
        ],
        gender: 'all', tags: ['street', 'urban', 'oversized', 'raw'],
        regions: ['us', 'uk'],
    },
    {
        id: 'fr-parisian-chic',
        name: 'Parisian Chic',
        season: 'all',
        peakMonths: [2, 3, 4, 8, 9, 10],
        image: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&q=80',
        description: 'Effortless French elegance. Breton stripes, trench coats, and silk scarves.',
        colors: ['#1A1A1A', '#F5F0E8', '#722F37', '#2C3E50', '#C4A87C', '#FAEBD7'],
        combos: [
            { top: 'shirt', bottom: 'trousers', footwear: 'flats', accessory: 'scarf' },
        ],
        suggestedItems: [
            { name: 'Breton Stripe Top', category: 'shirt', color: 'Navy/White', colorHex: '#2C3E50' },
            { name: 'Tailored Trench Coat', category: 'coat', color: 'Camel', colorHex: '#C4A87C' },
            { name: 'Pointed Ballet Flats', category: 'flats', color: 'Black', colorHex: '#1A1A1A' },
            { name: 'Silk Neck Scarf', category: 'scarf', color: 'Red', colorHex: '#722F37' },
        ],
        gender: 'female', tags: ['french', 'chic', 'effortless', 'elegant'],
        regions: ['fr'],
    },
];

// ========== DYNAMIC TIMING ==========

function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) return 'summer';
    if (month >= 9 || month <= 1) return 'winter';
    return 'spring';
}

/** Get the ISO week number for date-seeded rotation */
function getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

/** Seeded shuffle — same seed = same order (deterministic per week) */
function seededShuffle(arr, seed) {
    const shuffled = [...arr];
    let s = seed;
    for (let i = shuffled.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Compute a "freshness" score for a trend based on the current date.
 * Trends in their peak months get boosted; trends approaching their
 * peak get a rising score; post-peak trends decay.
 */
function getFreshnessScore(trend) {
    const currentMonth = new Date().getMonth();
    if (!trend.peakMonths || trend.peakMonths.length === 0) return 50;

    if (trend.peakMonths.includes(currentMonth)) return 100;

    // Check distance to nearest peak month
    let minDist = 12;
    for (const peak of trend.peakMonths) {
        const dist = Math.min(
            Math.abs(currentMonth - peak),
            12 - Math.abs(currentMonth - peak)
        );
        if (dist < minDist) minDist = dist;
    }

    // 1 month away = 80, 2 = 60, 3 = 40, 4+ = 20
    return Math.max(20, 100 - minDist * 20);
}

// ========== COLOR DISTANCE ==========
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return { r: parseInt(hex.substring(0, 2), 16), g: parseInt(hex.substring(2, 4), 16), b: parseInt(hex.substring(4, 6), 16) };
}

function colorDistance(hex1, hex2) {
    const a = hexToRgb(hex1), b = hexToRgb(hex2);
    return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

// ========== TREND MATCHING ==========

/**
 * DYNAMIC trend retrieval. Every call:
 *  1. Filters by season (current + year-round)
 *  2. Filters by gender (strict: female never sees male, and vice versa)
 *  3. Computes freshness scores based on peak months
 *  4. Sorts by (wardrobe match × 0.5 + freshness × 0.3 + weekly rotation × 0.2)
 *  5. Adds a "trendingNow" flag to top 3
 *
 * Because freshness changes each month and weekly seed changes each week,
 * the trend list naturally rotates without external API calls.
 */
export function getRelevantTrends(userClothes, gender = 'all', region = 'global') {
    const season = getCurrentSeason();
    const weekSeed = getWeekNumber() + new Date().getFullYear();

    const filtered = TREND_DATABASE.filter(t => {
        if (t.season !== 'all' && t.season !== season) return false;
        if (gender === 'female' && t.gender === 'male') return false;
        if (gender === 'male' && t.gender === 'female') return false;
        // Region filter: if trend has regions, show only if user's region matches OR if global
        if (t.regions && t.regions.length > 0) {
            if (region !== 'global' && !t.regions.includes(region)) return false;
        }
        return true;
    });

    // Shuffle deterministically per week so order changes weekly
    const shuffled = seededShuffle(filtered, weekSeed);

    const scored = shuffled.map((trend, idx) => {
        const matchData = scoreTrendMatch(trend, userClothes);
        const freshness = getFreshnessScore(trend);
        // Composite rank: wardrobe match + freshness + shuffle position bonus
        const shuffleBonus = (shuffled.length - idx) / shuffled.length * 100;
        const compositeScore = Math.round(
            matchData.ownedMatchScore * 0.5 +
            freshness * 0.3 +
            shuffleBonus * 0.2
        );
        return { ...trend, ...matchData, freshness, compositeScore };
    });

    // Sort by composite score
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    // Mark top 3 as "Trending Now"
    scored.forEach((t, i) => { t.trendingNow = i < 3; });

    return scored;
}

/** Get the last time trends were refreshed (for display) */
export function getTrendRefreshInfo() {
    const week = getWeekNumber();
    const season = getCurrentSeason();
    const month = new Date().toLocaleString('en', { month: 'long' });
    return {
        season: season.charAt(0).toUpperCase() + season.slice(1),
        month,
        week,
        label: `${month} · Week ${week} · ${season.charAt(0).toUpperCase() + season.slice(1)} Collection`,
    };
}

function scoreTrendMatch(trend, userClothes) {
    let ownedMatches = [];
    let missingItems = [];

    for (const suggested of trend.suggestedItems) {
        const candidates = userClothes.filter(c => c.category === suggested.category);
        if (candidates.length > 0) {
            let bestMatch = candidates[0];
            let bestDist = colorDistance(bestMatch.colorHex, suggested.colorHex);
            for (const c of candidates) {
                const d = colorDistance(c.colorHex, suggested.colorHex);
                if (d < bestDist) { bestDist = d; bestMatch = c; }
            }
            const colorFit = Math.max(0, Math.round((1 - bestDist / 400) * 100));
            ownedMatches.push({ item: bestMatch, suggested, colorFit });
        } else {
            missingItems.push(suggested);
        }
    }

    const totalItems = trend.suggestedItems.length;
    const matchedCount = ownedMatches.length;
    const avgColorFit = matchedCount > 0 ? ownedMatches.reduce((s, m) => s + m.colorFit, 0) / matchedCount : 0;
    const coverageScore = (matchedCount / totalItems) * 100;
    const ownedMatchScore = Math.round((coverageScore * 0.6) + (avgColorFit * 0.4));

    return { ownedMatches, missingItems, ownedMatchScore, coverageScore: Math.round(coverageScore) };
}

export function buildTrendOutfit(trend, userClothes) {
    const result = {};
    const combo = trend.combos[0];
    for (const [slot, category] of Object.entries(combo)) {
        const candidates = userClothes.filter(c => c.category === category);
        if (candidates.length === 0) continue;
        let bestItem = candidates[0];
        let bestScore = Infinity;
        for (const c of candidates) {
            const minDist = Math.min(...trend.colors.map(tc => colorDistance(c.colorHex, tc)));
            if (minDist < bestScore) { bestScore = minDist; bestItem = c; }
        }
        result[slot] = bestItem;
    }
    return result;
}

export function getAllTrends() { return TREND_DATABASE; }
export function getTrendById(id) { return TREND_DATABASE.find(t => t.id === id) || null; }
