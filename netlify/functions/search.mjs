// Netlify Serverless Function: Trend Image Search via Pexels API
// Auto-deployed at /.netlify/functions/search
// Redirected from /api/search via netlify.toml

const PEXELS_API_KEY = 'euC0O4vqXfeRj5D9rF2Hc4JHvkJPWBCAvdKCuisZFG48gawBV4CHR1Cq';

const FASHION_COLORS = {
    black: '#1A1A1A', white: '#F5F5F5', navy: '#2C3E50', red: '#C0392B',
    blue: '#3498DB', green: '#27AE60', beige: '#DEB887', cream: '#FAEBD7',
    brown: '#8B4513', tan: '#D2B48C', grey: '#808080', gray: '#808080',
    pink: '#FFB6C1', purple: '#8E44AD', orange: '#E67E22', yellow: '#F1C40F',
    gold: '#DAA520', silver: '#C0C0C0', maroon: '#722F37', olive: '#808000',
    coral: '#FF7F50', teal: '#008080', lavender: '#E6E6FA', burgundy: '#722F37',
    khaki: '#C3B091', charcoal: '#36454F', nude: '#F2D2BD', camel: '#C4A87C',
    rust: '#B7410E', mint: '#98FB98', peach: '#FFDAB9', denim: '#4A6FA5',
};

const CLOTHING_MAP = {
    jacket: ['Jacket', 'jacket', '#2C3E50'], blazer: ['Blazer', 'jacket', '#1A1A1A'],
    coat: ['Coat', 'coat', '#8B4513'], hoodie: ['Hoodie', 'hoodie', '#4A4A4A'],
    sweater: ['Sweater', 'sweater', '#DEB887'], shirt: ['Shirt', 'shirt', '#F5F5F5'],
    blouse: ['Blouse', 'blouse', '#FFB6C1'], 't-shirt': ['T-Shirt', 't-shirt', '#808080'],
    jeans: ['Jeans', 'jeans', '#4A6FA5'], denim: ['Denim', 'jeans', '#4A6FA5'],
    trousers: ['Trousers', 'trousers', '#2C3E50'], pants: ['Pants', 'trousers', '#1A1A1A'],
    skirt: ['Skirt', 'skirt', '#E6E6FA'], dress: ['Dress', 'dress', '#C0392B'],
    sneakers: ['Sneakers', 'sneakers', '#F5F5F5'], boots: ['Boots', 'boots', '#8B4513'],
    heels: ['Heels', 'heels', '#1A1A1A'], sandals: ['Sandals', 'sandals', '#DEB887'],
    scarf: ['Scarf', 'scarf', '#C0392B'], bag: ['Bag', 'bag', '#8B4513'],
    kurta: ['Kurta', 'shirt', '#F5F0E8'], shalwar: ['Shalwar', 'trousers', '#F5F5F5'],
};

const TAG_KEYWORDS = [
    'casual', 'formal', 'street', 'elegant', 'minimal', 'vintage', 'retro', 'modern',
    'boho', 'chic', 'sporty', 'luxury', 'modest', 'sustainable', 'oversized', 'slim',
    'layered', 'monochrome', 'pastel', 'bold', 'classic', 'trendy', 'cozy',
    'summer', 'winter', 'spring', 'festive', 'desi', 'korean', 'streetwear', 'aesthetic',
];

function extractColors(text) {
    const t = text.toLowerCase();
    const found = [];
    for (const [name, hx] of Object.entries(FASHION_COLORS)) {
        if (t.includes(name) && !found.includes(hx)) found.push(hx);
    }
    return (found.length ? found : ['#1A1A1A', '#F5F5F5', '#2C3E50', '#DEB887', '#C4A87C']).slice(0, 6);
}

function guessItems(text) {
    const t = text.toLowerCase();
    const items = [];
    for (const [kw, [name, cat, color]] of Object.entries(CLOTHING_MAP)) {
        if (t.includes(kw) && items.length < 4 && !items.some(i => i.category === cat)) {
            items.push({ name, category: cat, color: name, colorHex: color });
        }
    }
    return items.length ? items : [
        { name: 'Top', category: 'shirt', color: 'Neutral', colorHex: '#808080' },
        { name: 'Bottom', category: 'trousers', color: 'Dark', colorHex: '#2C2C2C' },
    ];
}

function extractTags(text) {
    const t = text.toLowerCase();
    return TAG_KEYWORDS.filter(tag => t.includes(tag)).slice(0, 5);
}

export async function handler(event) {
    const params = event.queryStringParameters || {};
    const query = params.q || 'fashion trends';
    const region = params.region || '';
    const page = parseInt(params.page || '0', 10);

    const q = region && region.toLowerCase() !== 'global' ? `${query} ${region}` : query;
    const fashionQuery = `${q} fashion outfit`;

    try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(fashionQuery)}&per_page=10&page=${page + 1}`;
        const resp = await fetch(url, {
            headers: { Authorization: PEXELS_API_KEY },
        });
        const data = await resp.json();
        const photos = data.photos || [];

        const results = photos.map((photo, i) => {
            const alt = photo.alt || `${query} Look`;
            const photographer = photo.photographer || '';
            const src = photo.src || {};
            const imgUrl = src.medium || src.large || src.small || '';
            const avgColor = photo.avg_color || '#808080';
            const combined = `${alt} ${query}`;
            const colors = extractColors(combined);
            if (avgColor && !colors.includes(avgColor)) colors.unshift(avgColor);

            return {
                id: `pex_${photo.id || i}`,
                name: (alt || `${query} Style #${i + 1}`).slice(0, 60),
                description: photographer ? `by ${photographer}` : '',
                image: imgUrl,
                colors: colors.slice(0, 6),
                source: photo.url || '',
                suggestedItems: guessItems(combined),
                tags: extractTags(combined),
                isSearchResult: true,
            };
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ results, query, page, hasMore: results.length >= 8 }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: [], query, page, hasMore: false, error: err.message }),
        };
    }
}
