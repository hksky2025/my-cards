// js/ui.js

function createProgressCard(config) {
    const { title, icon, theme, badge, sections } = config;
    const themeMap = {
        'blue': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
        'red': { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', bar: 'bg-red-500' },
        'yellow': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-400' }
    };
    const t = themeMap[theme] || themeMap['blue'];

    let sectionsHtml = sections.map(sec => `
        <div>
            <div class="flex justify-between text-xs mb-1">
                <span class="${t.text} font-bold">${sec.label}</span>
                <span class="text-gray-500 font-mono">${sec.valueText}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div class="${t.bar} h-full transition-all duration-700" style="width: ${sec.progress}%"></div>
            </div>
        </div>
    `).join('');

    return `
    <div class="bg-white border-2 ${t.border} rounded-3xl shadow-sm overflow-hidden mb-4">
        <div class="${t.bg} p-4 border-b ${t.border} flex justify-between items-center">
            <h3 class="${t.text} font-black text-sm uppercase tracking-wider"><i class="${icon} mr-2"></i>${title}</h3>
            ${badge ? `<span class="bg-white/50 text-[10px] px-2 py-0.5 rounded-full font-bold">${badge}</span>` : ''}
        </div>
        <div class="p-5 space-y-4">${sectionsHtml}</div>
    </div>`;
}

function renderDashboard(userProfile) {
    const container = document.getElementById('dashboard-container');
    // 範例：渲染 Motion 的 6% 進度條
    let html = createProgressCard({
        title: "信銀 Motion 6%",
        icon: "fas fa-bolt",
        theme: "blue",
        badge: "每月重置",
        sections: [
            { label: "簽賬進度", valueText: `$${userProfile.usage.motion_spend || 0} / $3,333`, progress: Math.min(100, (userProfile.usage.motion_spend || 0)/3333*100) }
        ]
    });
    // 範例：渲染 HSBC Red 的 4% 進度條
    html += createProgressCard({
        title: "HSBC Red 網購",
        icon: "fas fa-shopping-cart",
        theme: "red",
        badge: "Cap: $10,000",
        sections: [
            { label: "網購額度", valueText: `$${userProfile.usage.red_spend || 0} / $10,000`, progress: Math.min(100, (userProfile.usage.red_spend || 0)/10000*100) }
        ]
    });
    container.innerHTML = html;
}
