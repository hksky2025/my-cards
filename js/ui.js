function createProgressCard(config) {
    const { title, theme, sections, actionButton } = config;
    const t = { pink: 'bg-[#FFECF0] border-[#FFD1DC] text-[#FF8BA7]', blue: 'bg-[#EBF8FF] border-[#BEE3F8] text-[#4299E1]', yellow: 'bg-[#FFF9E6] border-[#FAF089] text-[#B7791F]' }[theme] || 'bg-gray-50';
    return `
        <div class="${t} border-2 rounded-[2rem] p-5 shadow-sm mb-4">
            <h3 class="font-black text-sm mb-4">${title}</h3>
            ${sections.map(s => `
                <div class="space-y-1">
                    <div class="flex justify-between text-[10px] font-bold"><span>${s.label}</span><span>${s.val}</span></div>
                    <div class="w-full bg-white/50 rounded-full h-3"><div class="progress-fill bg-current h-full" style="width:${s.pct}%"></div></div>
                </div>
            `).join('')}
            ${actionButton ? `<button onclick="${actionButton.onClick}" class="w-full mt-4 bg-white py-2 rounded-xl font-black text-xs shadow-sm">${actionButton.label}</button>` : ''}
        </div>`;
}

function renderDashboard(profile) {
    const container = document.getElementById('dashboard-container');
    document.getElementById('total-rebate').innerText = `$${Math.floor(profile.stats.totalVal)}`;
    document.getElementById('total-spend').innerText = `$${profile.stats.totalSpend}`;
    let html = "";
    profile.ownedCards.forEach(id => {
        const card = cardsDB.find(c => c.id === id);
        html += createProgressCard({ title: card.name, theme: 'blue', sections: [{ label: '基本進度', val: '進行中', pct: 50 }] });
    });
    container.innerHTML = html || `<div class="text-center py-10 text-gray-400 font-bold">秘書在等你新增卡片 🐾</div>`;
}

function renderCalculatorResults(results, mode) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => `
        <div class="relative p-5 rounded-[2rem] border-2 ${i===0?'bg-chiikawa-yellow border-yellow-200':'bg-white border-gray-100'} shadow-sm mb-4 cursor-pointer" onclick="handleRecord('${res.cardName}','${encodeURIComponent(JSON.stringify(res))}')">
            ${i===0?'<span class="absolute -top-3 -left-2 bg-yellow-400 text-white text-[10px] px-2 py-1 rounded-lg font-black shadow-sm z-10">秘書推介 🎀</span>':''}
            <div class="flex justify-between items-center">
                <div><div class="font-black text-gray-800 text-sm">${res.cardName}</div><div class="text-[10px] text-gray-400 font-bold">${res.breakdown.join(' + ')}</div></div>
                <div class="text-right"><div class="text-xl font-black text-blue-500">${res.displayVal}<span class="text-[10px] ml-1">${res.displayUnit}</span></div><div class="text-[10px] text-gray-400 font-bold">+ 記一筆 📝</div></div>
            </div>
        </div>
    `).join('');
}
