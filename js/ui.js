// js/ui.js

// 🔴 完整保留所有類別，不刪減任何一項
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

    // 1. Travel Guru 模塊
    const level = parseInt(profile.settings.guru_level);
    if (level > 0) {
        const spend = profile.usage["guru_spend_accum"] || 0;
        const target = level === 1 ? 30000 : 70000;
        const pct = Math.min(100, (spend / target) * 100);
        html += `
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div class="flex justify-between items-center font-bold text-xs">
                    <span class="text-blue-600">Travel Guru 等級: ${["無","🐣 GO","🐥 GING","👑 GURU"][level]}</span>
                    <span class="text-gray-400 font-mono">${spend.toLocaleString()} / ${target.toLocaleString()}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div class="bg-blue-600 h-full transition-all duration-1000" style="width: ${pct}%"></div>
                </div>
            </div>`;
    }

    // 2. 卡片上限進度
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
                        <span class="text-[11px] font-bold text-gray-700 uppercase tracking-tight">${card.name}</span>
                        <span class="text-[10px] font-mono text-gray-400">${Math.floor(used).toLocaleString()} / ${mod.cap_limit.toLocaleString()}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-blue-500 h-full" style="width: ${pct}%"></div>
                    </div>
                    <p class="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">${mod.desc}</p>
                </div>`;
        });
    });
    container.innerHTML = html || `<div class="text-center py-10 text-gray-400 text-xs font-bold uppercase">請到設定中選擇信用卡 💳</div>`;
}

function renderCalculatorResults(results, mode) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => {
        const dataStr = encodeURIComponent(JSON.stringify(res));
        
        // 核心修改：嚴格里數/現金分離顯示
        let mainVal = "";
        let mainUnit = "";

        if (mode === 'miles') {
            // 里數模式：直接取 core.js 計算後的 displayVal (已正確處理 EveryMile 1:20 vs 他卡 1:10)
            mainVal = res.displayVal; 
            mainUnit = "里";
        } else {
            // 現金模式：取 estValue
            mainVal = res.estValue.toFixed(1);
            mainUnit = "HKD";
        }

        return `
            <div class="bg-white p-4 rounded-xl border ${i===0?'border-blue-400 bg-blue-50/20':'border-gray-100'} flex justify-between items-center shadow-sm cursor-pointer active:scale-[0.98] transition-all" 
                 onclick="handleRecord('${res.cardName}','${dataStr}')">
                <div class="max-w-[65%]">
                    <div class="font-black text-gray-800 text-sm truncate flex items-center gap-1">
                        ${res.cardName} ${i===0?'<span class="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded tracking-tighter">BEST</span>':''}
                    </div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase tracking-tight truncate">${res.breakdown.join(' + ')}</div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-black text-blue-600 leading-tight">${mainVal}<span class="text-[9px] ml-1 text-gray-400">${mainUnit}</span></div>
                    <div class="text-[9px] text-gray-300 font-black uppercase mt-1 tracking-tighter italic">📝 點擊記帳</div>
                </div>
            </div>`;
    }).join('');
}

function renderLedger(transactions) {
    const container = document.getElementById('ledger-container');
    if (!transactions.length) {
        container.innerHTML = `<div class="text-center py-10 text-gray-300 font-bold uppercase text-xs">筆記本是空的 📖</div>`;
        return;
    }
    container.innerHTML = transactions.map(tx => `
        <div class="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
            <div class="flex flex-col">
                <span class="text-[9px] font-black text-gray-300 uppercase">${new Date(tx.date).toLocaleDateString()}</span>
                <span class="text-xs font-black text-gray-700">${tx.cardId}</span>
            </div>
            <div class="text-right">
                <div class="text-sm font-black text-gray-800">$${tx.amount.toLocaleString()}</div>
                <div class="text-[10px] font-bold text-green-600">+${tx.rebateText}</div>
            </div>
        </div>`).join('');
}

function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    let html = `
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 class="font-black text-gray-800 text-xs border-b pb-2 uppercase tracking-widest">我的卡片錢包 💳</h3>
            <div class="grid grid-cols-1 gap-2">
                ${cardsDB.map(c => `
                    <div class="flex justify-between items-center py-1">
                        <span class="text-sm font-bold text-gray-600">${c.name}</span>
                        <input type="checkbox" ${profile.ownedCards.includes(c.id)?'checked':''} onchange="toggleCard('${c.id}')" class="w-5 h-5 accent-blue-600">
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-4 space-y-4">
            <h3 class="font-black text-gray-800 text-xs border-b pb-2 uppercase tracking-widest">參數設定</h3>
            <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-gray-500 italic uppercase">Travel Guru 等級</span>
                <select onchange="saveDrop('guru_level', this.value)" id="st-guru" class="text-xs font-bold p-1 bg-gray-50 rounded border border-gray-100 outline-none">
                    <option value="0">無</option><option value="1">GO級</option><option value="2">GING級</option><option value="3">GURU級</option>
                </select>
            </div>
            <button onclick="localStorage.clear();location.reload();" class="w-full text-[10px] text-gray-300 font-bold hover:text-red-500 uppercase transition-colors tracking-widest">重設所有數據</button>
        </div>
    `;
    container.innerHTML = html;
    document.getElementById('st-guru').value = profile.settings.guru_level || 0;
}
