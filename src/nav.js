// src/nav.js
// Shared sidebar nav — included on all calculator pages
// Active state auto-detected from window.location.pathname

(function () {
    const path = window.location.pathname;

    const pages = [
        { label: 'Building Summary',  href: 'calculator.html',          match: 'calculator' },
        { label: 'Master Estimator',    href: 'cost_estimate_scope.html', match: 'cost_estimate_scope' },
        // { label: 'Labor Database Ref.', href: 'labor_resources.html',     match: 'labor_resources' },
    ];

    const libraryPages = [
        // { label: 'Contingency Score', href: 'contingency_scorecard.html', match: 'contingency_scorecard' },
        { label: 'History',           href: 'history.html',               match: 'history' },
    ];

    function navButton(p) {
        const isActive = path.includes(p.match);
        return isActive
            ? `<button class="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl bg-neutral-100 text-neutral-900 cursor-pointer text-left">${p.label}</button>`
            : `<button onclick="window.location.href='${p.href}'" class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-neutral-600 hover:bg-neutral-50 cursor-pointer text-left transition-colors">${p.label}</button>`;
    }

    const navItems    = pages.map(navButton).join('');
    const libraryItems = libraryPages.map(navButton).join('');

    const navHTML = `
        <aside class="w-64 border-r border-neutral-200 flex flex-col flex-shrink-0 bg-white p-6">
            <h1 class="text-xl font-bold tracking-tight text-neutral-900">URC CCC</h1>
            <p class="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-1">Civil Cost Calculator</p>
            <nav class="flex-1 mt-8 space-y-1">
                ${navItems}
                <div class="pt-6">
                    <span class="text-xs font-bold text-neutral-900 block px-3 mb-2">Library</span>
                    ${libraryItems}
                </div>
            </nav>
            <div class="pt-4 border-t border-neutral-100 mt-auto">
                <button onclick="window.location.href='index.html'" class="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-sm cursor-pointer">
                    Main Page
                </button>
            </div>
        </aside>
    `;

    function render() {
        const placeholder = document.getElementById('nav-placeholder');
        if (placeholder) placeholder.outerHTML = navHTML;
    }

    render();
})();