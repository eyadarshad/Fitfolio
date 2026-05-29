"""
Fitfolio — Flask Server
========================
Serves the Vite production build + /api/search for trend image discovery.
Uses Pexels API (free) for fashion image search.
Run with: python server.py
"""

from flask import Flask, send_from_directory, send_file, request, jsonify
import os, re, json, urllib.request, urllib.parse

app = Flask(__name__, static_folder='dist')

# ============================================
# Pexels API - Free, reliable image search
# Get your own key at https://www.pexels.com/api/
# ============================================
PEXELS_API_KEY = 'euC0O4vqXfeRj5D9rF2Hc4JHvkJPWBCAvdKCuisZFG48gawBV4CHR1Cq'

FASHION_COLORS = {
    'black':'#1A1A1A','white':'#F5F5F5','navy':'#2C3E50','red':'#C0392B',
    'blue':'#3498DB','green':'#27AE60','beige':'#DEB887','cream':'#FAEBD7',
    'brown':'#8B4513','tan':'#D2B48C','grey':'#808080','gray':'#808080',
    'pink':'#FFB6C1','purple':'#8E44AD','orange':'#E67E22','yellow':'#F1C40F',
    'gold':'#DAA520','silver':'#C0C0C0','maroon':'#722F37','olive':'#808000',
    'coral':'#FF7F50','teal':'#008080','lavender':'#E6E6FA','burgundy':'#722F37',
    'khaki':'#C3B091','charcoal':'#36454F','nude':'#F2D2BD','camel':'#C4A87C',
    'rust':'#B7410E','mint':'#98FB98','peach':'#FFDAB9','denim':'#4A6FA5',
}

CLOTHING_MAP = {
    'jacket':('Jacket','jacket','#2C3E50'),'blazer':('Blazer','jacket','#1A1A1A'),
    'coat':('Coat','coat','#8B4513'),'hoodie':('Hoodie','hoodie','#4A4A4A'),
    'sweater':('Sweater','sweater','#DEB887'),'shirt':('Shirt','shirt','#F5F5F5'),
    'blouse':('Blouse','blouse','#FFB6C1'),'t-shirt':('T-Shirt','t-shirt','#808080'),
    'jeans':('Jeans','jeans','#4A6FA5'),'denim':('Denim','jeans','#4A6FA5'),
    'trousers':('Trousers','trousers','#2C3E50'),'pants':('Pants','trousers','#1A1A1A'),
    'skirt':('Skirt','skirt','#E6E6FA'),'dress':('Dress','dress','#C0392B'),
    'sneakers':('Sneakers','sneakers','#F5F5F5'),'boots':('Boots','boots','#8B4513'),
    'heels':('Heels','heels','#1A1A1A'),'sandals':('Sandals','sandals','#DEB887'),
    'scarf':('Scarf','scarf','#C0392B'),'bag':('Bag','bag','#8B4513'),
    'kurta':('Kurta','shirt','#F5F0E8'),'shalwar':('Shalwar','trousers','#F5F5F5'),
}

TAG_KEYWORDS = [
    'casual','formal','street','elegant','minimal','vintage','retro','modern',
    'boho','chic','sporty','luxury','modest','sustainable','oversized','slim',
    'layered','monochrome','pastel','bold','classic','trendy','cozy',
    'summer','winter','spring','festive','desi','korean','streetwear','aesthetic',
]


def extract_colors(text):
    t = text.lower()
    found = []
    for name, hx in FASHION_COLORS.items():
        if name in t and hx not in found:
            found.append(hx)
    return (found or ['#1A1A1A','#F5F5F5','#2C3E50','#DEB887','#C4A87C'])[:6]


def guess_items(text):
    t = text.lower()
    items = []
    for kw, (name, cat, color) in CLOTHING_MAP.items():
        if kw in t and len(items) < 4 and not any(i['category'] == cat for i in items):
            items.append({'name': name, 'category': cat, 'color': name, 'colorHex': color})
    return items or [
        {'name':'Top','category':'shirt','color':'Neutral','colorHex':'#808080'},
        {'name':'Bottom','category':'trousers','color':'Dark','colorHex':'#2C2C2C'},
    ]


def extract_tags(text):
    t = text.lower()
    return [tag for tag in TAG_KEYWORDS if tag in t][:5]


# ============================================
# Pexels Image Search
# ============================================

def search_pexels(query, page=1, per_page=10):
    """Search Pexels for fashion images. Returns structured trend data."""
    fashion_query = f'{query} fashion outfit'
    encoded = urllib.parse.quote_plus(fashion_query)
    url = f'https://api.pexels.com/v1/search?query={encoded}&per_page={per_page}&page={page}'
    
    req = urllib.request.Request(url, headers={
        'Authorization': PEXELS_API_KEY,
        'User-Agent': 'Fitfolio/1.0',
    })
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"[Pexels Error] {e}")
        # Fallback: return curated results
        return generate_fallback_results(query, page, per_page)
    
    results = []
    photos = data.get('photos', [])
    
    for i, photo in enumerate(photos):
        alt = photo.get('alt', '') or f'{query.title()} Look'
        photographer = photo.get('photographer', '')
        src = photo.get('src', {})
        img_url = src.get('medium', '') or src.get('large', '') or src.get('small', '')
        page_url = photo.get('url', '')
        avg_color = photo.get('avg_color', '#808080')
        
        # Build color palette from photo avg_color + text extraction
        combined = f'{alt} {query}'
        colors = extract_colors(combined)
        if avg_color and avg_color not in colors:
            colors.insert(0, avg_color)
        colors = colors[:6]
        
        results.append({
            'id': f'pex_{photo.get("id", i)}',
            'name': alt[:60] or f'{query.title()} Style #{i+1}',
            'description': f'by {photographer}' if photographer else '',
            'image': img_url,
            'colors': colors,
            'source': page_url,
            'suggestedItems': guess_items(combined),
            'tags': extract_tags(combined),
            'isSearchResult': True,
        })
    
    return results


def generate_fallback_results(query, page, per_page):
    """Generate placeholder results when API is unavailable."""
    combined = f'{query} fashion outfit'
    return [{
        'id': f'fallback_{i}',
        'name': f'{query.title()} Trend #{i+1+(page-1)*per_page}',
        'description': 'API unavailable — showing placeholder',
        'image': '',
        'colors': extract_colors(combined),
        'source': '',
        'suggestedItems': guess_items(combined),
        'tags': extract_tags(combined),
        'isSearchResult': True,
    } for i in range(min(per_page, 3))]


# ============================================
# API Endpoint
# ============================================

@app.route('/api/search')
def api_search():
    query = request.args.get('q', 'fashion trends').strip()
    region = request.args.get('region', '').strip()
    page = int(request.args.get('page', '0'))
    
    q = f'{query} {region}'.strip() if region and region.lower() != 'global' else query
    
    # Pexels uses 1-indexed pages
    results = search_pexels(q, page=page+1)
    
    return jsonify({
        'results': results,
        'query': query,
        'page': page,
        'hasMore': len(results) >= 8,
    })


# ============================================
# Static File Serving
# ============================================

@app.route('/')
def index():
    return send_file(os.path.join(app.static_folder, 'index.html'))

@app.route('/<path:path>')
def static_files(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    return send_file(os.path.join(app.static_folder, 'index.html'))

if __name__ == '__main__':
    if not os.path.exists('dist'):
        print("ERROR: No 'dist' folder found! Run 'npm run build' first.")
        exit(1)
    print("=" * 50)
    print("  Fitfolio Server  (Pexels-powered)")
    print("=" * 50)
    print(f"  Local:   http://localhost:5000")
    print(f"  API:     http://localhost:5000/api/search?q=modest+fashion")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
