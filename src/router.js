// ============================================
// DripCheck — SPA Router (hash-based)
// ============================================

const routes = {};
let currentPage = null;

export function registerRoute(name, renderFn) {
    routes[name] = renderFn;
}

export function navigateTo(page) {
    window.location.hash = page;
}

export function getCurrentPage() {
    return currentPage;
}

export function initRouter(defaultPage = 'wardrobe') {
    function handleRoute() {
        const hash = window.location.hash.replace('#', '') || defaultPage;
        const page = hash.split('?')[0];

        if (!routes[page]) {
            navigateTo(defaultPage);
            return;
        }

        currentPage = page;

        // Update nav active states
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Render page
        const container = document.getElementById('pageContainer');
        container.innerHTML = '';
        container.style.animation = 'none';
        // Force reflow
        void container.offsetHeight;
        container.style.animation = 'pageIn 0.4s var(--ease-out)';

        routes[page](container);
    }

    window.addEventListener('hashchange', handleRoute);

    // Nav click handlers
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    // Initial route
    handleRoute();
}
