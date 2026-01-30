// js/ui.js

const CATEGORY_DEF = [
    { v: "general", t: "🛒 本地零售 (General)" },
    { v: "dining", t: "🍱 肚子餓了 (Dining)" },
    { v: "online", t: "💻 網上購物 (Online)" },
    { v: "overseas_jkt", t: "🇯🇵🇰🇷🇹🇭 海外 (日韓泰)" },
    { v: "overseas_tw", t: "🇹🇼 海外 (台灣)" },
    { v: "overseas_cn", t: "🇨🇳🇲🇴 海外 (內地澳門)" },
    { v: "overseas_other", t: "🌎 海外 (其他)" },
    { v: "alipay", t: "📱 Alipay / WeChat Pay" },
    { v: "transport", t: "🚌 交通出行 (Transport)" },
    { v: "grocery", t: "🥦 超市補貨 (Grocery)" },
    { v: "travel", t: "🧳 想要旅遊 (Travel)" },
    { v: "entertainment", t: "🎬 看場電影 (Cinema)" },
    { v: "apparel", t: "👕 買漂亮衣服 (Apparel)" },
    { v: "health_beauty", t: "💄 美妝護理 (Beauty)" },
    { v: "telecom", t: "📱 電訊電器 (Telecom)" },
    { v: "moneyback_merchant", t: "🅿️ 易賞錢商戶 (百佳/屈臣氏)", req: 'hsbc_easy' },
    { v: "tuition", t: "🎓 大學學費 (Tuition)", req: 'hsbc_gold_student' },
    { v: "red_designated", t: "🌹 Red 指定 8% 商戶", req: 'hsbc_red' },
    { v: "em_designated_spend", t: "🚋 EveryMile $2/里商戶", req: 'hsbc_everymile' },
    { v: "smart_designated", t: "🛍️ Smart 指定 5% 商戶", req: 'sc_smart' },
    { v: "chill_merchant", t: "☕ Chill 指定 10% 商戶", req: 'boc_chill' },
    { v: "go_merchant", t: "🚀 Go 商戶", req: 'boc_go_diamond' }
];

function renderDashboard(profile) {
    const container = document.getElementById('dashboard-container');
    document.getElementById('total-rebate').innerText = `$${Math.floor(profile.stats.totalVal).toLocaleString()}`;
    document.getElementById('total-spend').innerText = `$${Math.floor(profile.stats.totalSpend).toLocaleString()}`;

    let html = "";
    const renderedCaps = new Set();

    profile.ownedCards.forEach(cardId => {
        const card = cardsDB.find(c => c.id === cardId);
        if (!card || !card.modules) return;
        card.modules.forEach(mid => {
            const mod = modulesDB[mid];
            if (!mod || !mod.cap_key || renderedCaps.has(mod.cap_key)) return;
            renderedCaps.add(mod.cap_key);
            const used = profile.usage[mod.cap_key] || 0;
            const pct = Math.min(100, (used / mod.cap_limit) * 100);
            html += `
                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[11px] font-bold text-gray-700 uppercase">${card.name}</span>
                        <span class="text-[10px] font-mono text-gray-400">${Math.floor(used).toLocaleString()} / ${mod.cap_limit.toLocaleString()}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-blue-500 h-full" style="width: ${pct}%"></div>
                    </div>
                    <p class="text-[9px] text-gray-400 font-bold uppercase mt-1 italic">${mod.desc}</p>
                </div>`;
        });
    });
    container.innerHTML = html || `<div class="text-center py-10 text-gray-300 text-xs">未有進度資料 🐾</div>`;
}

function renderCalculatorResults(results, mode) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => {
        const dataStr = encodeURIComponent(JSON.stringify(res));
        // 核心：里數與現金完全分離顯示
        let val = mode === 'miles' ? res.displayVal : res.estValue.toFixed(1);
        let unit = mode === 'miles' ? '里' : 'HKD';
        
        return `
            <div class="bg-white p-4 rounded-xl border ${i===0?'border-blue-400 bg-blue-50/20':'border-gray-100'} flex justify-between items-center shadow-sm cursor-pointer" 
                 onclick="handleRecord('${res.cardName}','${dataStr}')">
                <div class="max-w-[65%]">
                    <div class="font-bold text-gray-800 text-sm truncate">${res.cardName} ${i===0?'⭐':''}</div>
                    <div class="text-[9px] text-gray-400 font-medium truncate uppercase tracking-tighter">${res.breakdown.join(' + ')}</div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-blue-600">${val}<span class="text-[9px] ml-1 text-gray-400">${unit}</span></div>
                    <div class="text-[9px] text-gray-300 font-bold uppercase mt-1">📝 點擊記帳</div>
                </div>
            </div>`;
    }).join('');
}

function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    const groups = [
        { name: "🦁 HSBC 滙豐", filter: id => id.startsWith('hsbc_') },
        { name: "🔵 STANDARD CHARTERED 渣打", filter: id => id.startsWith('sc_') },
        { name: "🏦 CITI 花旗", filter: id => id.startsWith('citi_') },
        { name: "⚫ DBS 星展", filter: id => id.startsWith('dbs_') },
        { name: "🌿 HANG SENG 恒生", filter: id => id.startsWith('hangseng_') },
        { name: "🏛️ BOC 中銀", filter: id => id.startsWith('boc_') },
        { name: "🏛️ AMERICAN EXPRESS", filter: id => id.startsWith('ae_') },
        { name: "🏦 FUBON 富邦", filter: id => id.startsWith('fubon_') },
        { name: "💳 SIM / AEON / WEWA", filter: id => ['sim_','aeon_','wewa','earnmore','mox_'].some(p => id.startsWith(p)) }
    ];

    let html = `<h2 class="text-sm font-bold text-gray-800 mb-4 px-1 uppercase tracking-widest border-b pb-2">我的錢包</h2>`;
    
    groups.forEach(g => {
        const cards = cardsDB.filter(c => g.filter(c.id));
        if (cards.length === 0) return;
        html += `<h3 class="text-[10px] font-bold text-gray-400 mt-6 mb-2 px-1 uppercase tracking-widest">${g.name}</h3>`;
        html += `<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">`;
        cards.forEach(c => {
            const checked = profile.ownedCards.includes(c.id) ? 'checked' : '';
            html += `
                <div class="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                    <span class="text-sm font-medium text-gray-700">${c.name}</span>
                    <label class="flex items-center cursor-pointer relative">
                        <input type="checkbox" class="sr-only" ${checked} onchange="toggleCard('${c.id}')">
                        <div class="block bg-gray-200 w-10 h-6 rounded-full"></div>
                        <div class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                    </label>
                </div>`;
        });
        html += `</div>`;
    });

    // 設定區域 (對接截圖 5-6)
    html += `<h2 class="text-sm font-bold text-gray-800 mt-10 mb-4 px-1 uppercase tracking-widest border-b pb-2">設定</h2>`;
    html += `<div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">`;
    
    // Guru Select
    html += `<div><label class="text-[10px] font-bold text-gray-400 uppercase block mb-2">Travel Guru</label>
        <select onchange="saveDrop('guru_level', this.value)" class="w-full p-2 bg-gray-50 rounded-lg text-sm font-bold outline-none border border-gray-100">
            <option value="0" ${profile.settings.guru_level == 0 ? 'selected' : ''}>無</option>
            <option value="1" ${profile.settings.guru_level == 1 ? 'selected' : ''}>GO級</option>
            <option value="2" ${profile.settings.guru_level == 2 ? 'selected' : ''}>GING級</option>
            <option value="3" ${profile.settings.guru_level == 3 ? 'selected' : ''}>GURU級</option>
        </select></div>`;

    // 最紅自主分配
    const rh = profile.settings.red_hot_allocation;
    html += `<div class="border p-4 rounded-xl space-y-3"><div class="flex justify-between items-center"><label class="text-[11px] font-bold text-red-500">已登記「最紅自主獎賞」</label>
        <input type="checkbox" ${profile.settings.red_hot_rewards_enabled ? 'checked' : ''} onchange="toggleSetting('red_hot_rewards_enabled')"></div>
        <div class="text-[9px] text-gray-400">分配 5X 獎賞錢 (總和: ${Object.values(rh).reduce((a,b)=>a+b,0)}/5)</div>
        ${["dining", "world", "enjoyment", "home", "style"].map(k => `
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-gray-600 capitalize">${k}</span>
                <div class="flex items-center gap-3">
                    <button onclick="changeAllocation('${k}',-1)" class="w-6 h-6 bg-white border rounded text-gray-500 font-bold">-</button>
                    <span class="text-xs font-mono w-4 text-center">${rh[k]}</span>
                    <button onclick="changeAllocation('${k}',1)" class="w-6 h-6 bg-white border rounded text-gray-500 font-bold">+</button>
                </div>
            </div>`).join('')}
    </div>`;

    // 推廣開關 (截圖 6)
    const promos = [
        { id: 'winter_promo_enabled', name: '冬日賞 2026', color: 'bg-red-50' },
        { id: 'boc_amazing_enabled', name: 'BOC 狂賞派 + 狂賞飛', color: 'bg-blue-50' },
        { id: 'mmpower_promo_enabled', name: 'MMPower +FUN Dollars', color: 'bg-gray-100' },
        { id: 'em_promo_enabled', name: 'EM 推廣', color: 'bg-purple-50' }
    ];
    
    promos.forEach(p => {
        html += `<div class="flex justify-between items-center ${p.color} p-3 rounded-xl border border-gray-50">
            <span class="text-xs font-bold text-gray-700">${p.name}</span>
            <input type="checkbox" ${profile.settings[p.id] ? 'checked' : ''} onchange="toggleSetting('${p.id}')">
        </div>`;
    });

    html += `<button onclick="localStorage.clear();location.reload();" class="w-full text-[10px] text-red-400 font-bold uppercase tracking-widest pt-4">Reset All</button></div>`;
    
    container.innerHTML = html;
}

function renderLedger(transactions) {
    const container = document.getElementById('ledger-container');
    if (!transactions.length) {
        container.innerHTML = `<div class="text-center py-20 text-gray-300 text-xs">筆記本是空的 📖</div>`;
        return;
    }
    container.innerHTML = transactions.map(tx => `
        <div class="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
            <div class="flex flex-col">
                <span class="text-[9px] font-bold text-gray-400 uppercase">${new Date(tx.date).toLocaleDateString()}</span>
                <span class="text-xs font-bold text-gray-700">${tx.cardId}</span>
            </div>
            <div class="text-right">
                <div class="text-sm font-bold text-gray-800">$${tx.amount.toLocaleString()}</div>
                <div class="text-[10px] font-bold text-green-600">+${tx.rebateText}</div>
            </div>
        </div>`).join('');
}
