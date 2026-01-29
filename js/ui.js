function renderDashboard(profile) {
    const container = document.getElementById('dashboard-container');
    document.getElementById('total-rebate').innerText = `$${Math.floor(profile.stats.totalVal)}`;
    document.getElementById('total-spend').innerText = `$${Math.floor(profile.stats.totalSpend)}`;

    let html = "";
    profile.ownedCards.forEach(cardId => {
        const card = cardsDB.find(c => c.id === cardId);
        if (!card) return;

        // 找這張卡有 Cap 的模組
        card.modules.forEach(mid => {
            const m = modulesDB[mid];
            if (!m || !m.cap_key) return;

            const used = profile.usage[m.cap_key] || 0;
            const limit = m.cap_limit;
            const pct = Math.min(100, (used / limit) * 100);

            html += `
                <div class="bg-chiikawa-blue border-2 border-blue-100 rounded-[2rem] p-5 shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-black text-blue-500">${card.name} - ${m.desc}</span>
                        <span class="text-[10px] font-bold text-gray-400">${Math.floor(used)} / ${limit}</span>
                    </div>
                    <div class="w-full bg-white rounded-full h-3 border border-white">
                        <div class="progress-fill bg-blue-400 h-full" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        });
    });
    container.innerHTML = html || `<div class="text-center py-10 text-gray-400 font-bold">秘書在等你新增卡片 🐾</div>`;
}

function renderCalculatorResults(results) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => `
        <div class="relative p-5 rounded-[2rem] border-2 ${i===0?'bg-chiikawa-yellow border-yellow-200 shadow-md':'bg-white border-gray-100'} mb-4 cursor-pointer active:scale-95 transition-all" 
             onclick="handleRecord('${res.cardId}','${encodeURIComponent(JSON.stringify(res))}')">
            ${i===0?'<span class="absolute -top-3 -left-2 bg-yellow-400 text-white text-[10px] px-2 py-1 rounded-lg font-black z-10">秘書最推 🎀</span>':''}
            <div class="flex justify-between items-center">
                <div>
                    <div class="font-black text-gray-800 text-sm">${res.cardName}</div>
                    <div class="text-[10px] text-gray-400 font-bold">${res.breakdown.join(' + ') || '基本回贈'}</div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-black text-blue-500">${res.displayVal}<span class="text-[10px] ml-1">${res.displayUnit}</span></div>
                    <div class="text-[10px] text-gray-400 font-bold">+ 記一筆 📝</div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderLedger(transactions) {
    const container = document.getElementById('ledger-container');
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `<div class="text-center py-20 text-gray-300 font-black">筆記本是空的 📖</div>`;
        return;
    }
    container.innerHTML = transactions.map(tx => `
        <div class="bg-white p-4 rounded-3xl border-2 border-gray-50 flex justify-between items-center shadow-sm">
            <div class="flex flex-col">
                <span class="text-[10px] font-black text-gray-300">${new Date(tx.date).toLocaleDateString()}</span>
                <span class="text-sm font-black text-gray-700">${tx.cardName}</span>
            </div>
            <div class="text-right">
                <div class="text-sm font-black text-gray-800">$${tx.amount}</div>
                <div class="text-[10px] font-bold text-pink-400">+${tx.rebateText}</div>
            </div>
        </div>
    `).join('');
}

function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    let html = `<div class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-4"><h3 class="font-black text-gray-800">我的卡片 💳</h3>`;
    cardsDB.forEach(c => {
        const checked = profile.ownedCards.includes(c.id) ? 'checked' : '';
        html += `
            <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span class="text-sm font-bold text-gray-600">${c.name}</span>
                <input type="checkbox" ${checked} onchange="toggleCard('${c.id}')" class="w-5 h-5 accent-pink-400">
            </div>
        `;
    });
    html += `</div>`;
    
    // 加一些開關
    html += `<div class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-4"><h3 class="font-black text-gray-800">登記推廣 📣</h3>`;
    const promos = [
        { id: 'em_promo_enabled', name: 'EveryMile 海外推廣' },
        { id: 'mmpower_promo_enabled', name: 'MMPower 5/6% 優惠' },
        { id: 'boc_amazing_enabled', name: '中銀 狂賞派' }
    ];
    promos.forEach(p => {
        const checked = profile.settings[p.id] ? 'checked' : '';
        html += `<div class="flex justify-between"><span>${p.name}</span><input type="checkbox" ${checked} onchange="toggleSetting('${p.id}')"></div>`;
    });
    html += `</div>`;
    
    container.innerHTML = html;
}
