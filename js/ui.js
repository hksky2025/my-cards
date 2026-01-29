function renderDashboard(profile) {
    const container = document.getElementById('dashboard-container');
    document.getElementById('total-rebate').innerText = `$${Math.floor(profile.stats.totalVal)}`;
    document.getElementById('total-spend').innerText = `$${Math.floor(profile.stats.totalSpend)}`;

    let html = "";
    profile.ownedCards.forEach(cardId => {
        const card = cardsDB.find(c => c.id === cardId);
        if (!card) return;
        card.modules.forEach(mid => {
            const m = modulesDB[mid];
            if (!m || !m.cap_key) return;
            const used = profile.usage[m.cap_key] || 0;
            const pct = Math.min(100, (used / m.cap_limit) * 100);
            html += `
                <div class="bg-chiikawa-blue border-2 border-blue-100 rounded-[2rem] p-5 shadow-sm">
                    <div class="flex justify-between items-center mb-2"><span class="text-xs font-black text-blue-500">${card.name} - ${m.desc}</span><span class="text-[10px] font-bold text-gray-400">${Math.floor(used)} / ${m.cap_limit}</span></div>
                    <div class="w-full bg-white rounded-full h-3"><div class="progress-fill bg-blue-400 h-full" style="width:${pct}%"></div></div>
                </div>`;
        });
    });
    container.innerHTML = html || `<div class="text-center py-10 text-gray-400 font-bold">快去「設定」新增你的信用卡吧 🐾</div>`;
}

function renderCalculatorResults(results) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => `
        <div class="relative p-5 rounded-[2rem] border-2 ${i===0?'bg-chiikawa-yellow border-yellow-200 shadow-md':'bg-white border-gray-100'} mb-4 cursor-pointer" onclick="handleRecord('${encodeURIComponent(JSON.stringify(res))}')">
            ${i===0?'<span class="absolute -top-3 -left-2 bg-yellow-400 text-white text-[10px] px-2 py-1 rounded-lg font-black z-10">秘書最推 🎀</span>':''}
            <div class="flex justify-between items-center">
                <div><div class="font-black text-gray-800 text-sm">${res.cardName}</div><div class="text-[10px] text-gray-400 font-bold">${res.breakdown.join(' + ') || '基本回贈'}</div></div>
                <div class="text-right"><div class="text-xl font-black text-blue-500">${res.displayVal}<span class="text-[10px] ml-1">${res.displayUnit}</span></div><div class="text-[10px] text-gray-400 font-bold">+ 記一筆 📝</div></div>
            </div>
        </div>`).join('');
}

function renderLedger(transactions) {
    const container = document.getElementById('ledger-container');
    container.innerHTML = transactions.length ? transactions.map(tx => `
        <div class="bg-white p-4 rounded-3xl border-2 border-gray-50 flex justify-between items-center shadow-sm">
            <div class="flex flex-col"><span class="text-[10px] font-black text-gray-300">${new Date(tx.date).toLocaleDateString()}</span><span class="text-sm font-black text-gray-700">${tx.cardName}</span></div>
            <div class="text-right"><div class="text-sm font-black text-gray-800">$${tx.amount}</div><div class="text-[10px] font-bold text-pink-400">+${tx.rebateText}</div></div>
        </div>`).join('') : `<div class="text-center py-20 text-gray-300 font-black">筆記本是空的 📖</div>`;
}

function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    let html = `<div class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-4"><h3 class="font-black text-gray-800 text-sm border-b pb-2">我的卡片 💳</h3>`;
    cardsDB.forEach(c => {
        const checked = profile.ownedCards.includes(c.id) ? 'checked' : '';
        html += `<div class="flex justify-between items-center"><span class="text-sm font-bold text-gray-600">${c.name}</span><input type="checkbox" ${checked} onchange="toggleCard('${c.id}')" class="w-5 h-5 accent-pink-400"></div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}
