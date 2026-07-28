// src/nav.js
// Shared sidebar nav — included on all calculator pages
// Active state auto-detected from window.location.pathname
(function () {
    const path = window.location.pathname;
    const pages = [
        { label: 'Dimensions Calculator', href: 'calculator.html',          match: 'calculator',          tooltip: 'Estimate building dimensions and base costs' },
        { label: 'Master Estimator',      href: 'cost_estimate_scope.html', match: 'cost_estimate_scope', tooltip: 'Detailed WBS/BOQ cost worksheet' },
        { label: 'Estimate Summary',      href: 'estimate_summary.html',    match: 'estimate_summary',    tooltip: 'Consolidated BOQ and financial ledger view' },
        // { label: 'Labor Database Ref.', href: 'labor_resources.html',     match: 'labor_resources' },
    ];
    const libraryPages = [
        // { label: 'Contingency Score', href: 'contingency_scorecard.html', match: 'contingency_scorecard' },
        { label: 'History', href: 'history.html', match: 'history', tooltip: 'Browse saved estimate records' },
    ];

    function tooltipSpan(text) {
        return `
            <span class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                ${text}
            </span>
        `;
    }

    function navButton(p) {
        const isActive = path.includes(p.match);
        const button = isActive
            ? `<button class="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl bg-neutral-100 text-neutral-900 cursor-pointer text-left">${p.label}</button>`
            : `<button onclick="window.location.href='${p.href}'" class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-neutral-600 hover:bg-neutral-50 cursor-pointer text-left transition-colors">${p.label}</button>`;
        return `<div class="relative group">${button}${p.tooltip ? tooltipSpan(p.tooltip) : ''}</div>`;
    }

    const navItems     = pages.map(navButton).join('');
    const libraryItems = libraryPages.map(navButton).join('');
    const navHTML = `
        <aside class="w-64 border-r border-neutral-200 flex flex-col flex-shrink-0 bg-white p-6">
            <div class="flex items-center gap-2.5">
                <img src="urclogo.png" alt="URC" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
                <h1 class="text-lg font-extrabold tracking-tight text-neutral-900 leading-[1.15]">UNIVERSAL<br>ROBINA</h1>
            </div>
            <p class="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-1.5">Civil Cost Calculator</p>
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
