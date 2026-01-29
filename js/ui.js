// js/ui.js - 信用卡秘書介面渲染層 (Chiikawa Skin)

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

// 核心進度組件 (完美對接 Core 輸出的所有欄位)
function createProgressCard(config) {
    const { title, theme, badge, sections, actionButton, warning } = config;
    const t = { 
        pink: 'bg-[#FFECF0] border-[#FFD1DC] text-[#FF8BA7]',
        blue: 'bg-[#EBF8FF] border-[#BEE3F8] text-[#4299E1]',
        yellow: 'bg-[#FFF9E6] border-[#FAF089] text-[#B7791F]',
        purple: 'bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]'
    }[theme] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' };

    let sectionsHtml = (sections || []).map(sec => `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] font-black uppercase">
                <span>${sec.label}</span>
                <span class="font-mono">${sec.valueText}</span>
            </div>
            <div class="w-full bg-white/60 rounded-full h-4 relative p-0.5 border border-white overflow-hidden shadow-inner">
                <div class="progress-fill h-full ${sec.barColor || 'bg-blue-400'} ${sec.striped ? 'progress-stripe' : ''}" style="width: ${sec.progress}%"></div>
                ${sec.overlay || ''}
            </div>
            ${sec.markers ? `<div class="flex justify-between text-[8px] text-gray-400 px-1">${sec.markers}</div>` : ''}
            ${sec.subText ? `<div class="text-[9px] text-right font-bold text-gray-400 mt-1 italic">${sec.subText}</div>` : ''}
        </div>
    `).join('');

    return `
        <div class="${t.split(' ')[0]} ${t.split(' ')[1]} border-2 rounded-[2rem] p-5 shadow-sm mb-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-black text-sm tracking-tight uppercase">${title}</h3>
                ${badge ? `<span class="bg-white/80 text-[10px] px-3 py-1 rounded-full font-black shadow-sm">${badge}</span>` : ''}
            </div>
            ${warning ? `<div class="bg-yellow-100 p-2 rounded-xl text-[10px] font-bold text-yellow-700 mb-4">${warning}</div>` : ''}
            <div class="space-y-6">${sectionsHtml}</div>
            ${actionButton ? `
                <button onclick="${actionButton.onClick}" class="w-full mt-4 bg-white py-3 rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all">
                    ${actionButton.label}
                </button>
            ` : ''}
        </div>
    `;
}

// 渲染 Dashboard (100% 繼承自原版 ui.js 邏輯)
function renderDashboard(profile) {
    const container = document.getElementById('dashboard-container');
    document.getElementById('total-rebate').innerText = `$${Math.floor(profile.stats.totalVal).toLocaleString()}`;
    document.getElementById('total-spend').innerText = `$${Math.floor(profile.stats.totalSpend).toLocaleString()}`;

    let html = "";
    const renderedCaps = new Set();
    const monthEndStr = "於月底重置"; 

    // 1. Travel Guru
    const level = parseInt(profile.settings.guru_level);
    if (level > 0) {
        const spend = profile.usage["guru_spend_accum"] || 0;
        const target = level === 1 ? 30000 : 70000;
        const rcUsed = profile.usage["guru_rc_used"] || 0;
        const rcCap = [0, 500, 1200, 2200][level];
        html += createProgressCard({
            title: "旅人進化 (Guru)", theme: "yellow", badge: ["無", "🐣 GO", "🐥 GING", "👑 GURU"][level],
            sections: [
                { label: "🚀 進化壓力", valueText: `$${spend.toLocaleString()}/$${target.toLocaleString()}`, progress: Math.min(100, (spend/target)*100) },
                { label: "💰 本級回贈", valueText: `${Math.floor(rcUsed)}/${rcCap} RC`, progress: Math.min(100, (rcUsed/rcCap)*100), barColor: "bg-yellow-400" }
            ],
            actionButton: spend >= target && level < 3 ? { label: "🎉 立即進化!", onClick: "handleGuruUpgrade()" } : null
        });
    }

    // 2. 顯示卡片 Cap (對接原版邏輯)
    profile.ownedCards.forEach(cardId => {
        const card = cardsDB.find(c => c.id === cardId);
        if (!card || !card.modules) return;
        card.modules.forEach(mid => {
            const mod = modulesDB[mid];
            if (!mod || !mod.cap_key || renderedCaps.has(mod.cap_key)) return;
            renderedCaps.add(mod.cap_key);
            
            const used = profile.usage[mod.cap_key] || 0;
            const limit = mod.cap_limit;
            const pct = Math.min(100, (used / limit) * 100);
            
            html += createProgressCard({
                title: card.name, theme: "blue", badge: monthEndStr,
                sections: [{ label: mod.desc, valueText: `${Math.floor(used).toLocaleString()}/${limit.toLocaleString()}`, progress: pct }]
            });
        });
    });

    container.innerHTML = html || `<div class="text-center py-20 text-gray-300 font-black">秘書在等你新增卡片 🐾</div>`;
}

// 渲染計算結果 (Chiikawa 卡片樣式)
function renderCalculatorResults(results, mode) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => {
        const dataStr = encodeURIComponent(JSON.stringify(res));
        const isTop = i === 0 && res.displayVal !== '---';
        return `
            <div class="relative p-6 chiikawa-card mb-4 cursor-pointer active:scale-95 transition-all ${isTop ? 'bg-chiikawa-yellow border-yellow-200 shadow-md' : ''}" 
                 onclick="handleRecord('${res.cardName}','${dataStr}')">
                ${isTop ? '<span class="absolute -top-3 -left-2 bg-yellow-400 text-white text-[10px] px-2 py-1 rounded-lg font-black z-10">秘書最推 🎀</span>' : ''}
                <div class="flex justify-between items-center">
                    <div class="max-w-[65%]">
                        <div class="font-black text-gray-800 text-sm truncate">${res.cardName}</div>
                        <div class="text-[10px] text-gray-400 font-bold mt-1 leading-tight">${res.breakdown.join(' + ')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-black text-blue-500">${res.displayVal}<span class="text-[10px] ml-1">${res.displayUnit}</span></div>
                        <div class="text-[10px] text-pink-400 font-bold mt-1">+ 點擊記帳 📝</div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// 渲染記帳本 (秘書筆記風格)
function renderLedger(transactions) {
    const container = document.getElementById('ledger-container');
    if (!transactions || !transactions.length) {
        container.innerHTML = `<div class="text-center py-20 text-gray-300 font-black">筆記本是空的 📖</div>`;
        return;
    }
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6 px-4">
            <h3 class="font-black text-gray-800 text-xs uppercase">最近筆記</h3>
            <button onclick="handleClearHistory()" class="text-[10px] text-red-400 font-bold underline">清除全部</button>
        </div>
        <div class="space-y-4 px-2">${transactions.map(tx => `
            <div class="bg-white p-5 rounded-[2rem] border-2 border-gray-50 flex justify-between items-center shadow-sm">
                <div class="flex flex-col">
                    <span class="text-[10px] font-black text-gray-300 uppercase">${new Date(tx.date).toLocaleDateString()}</span>
                    <span class="text-sm font-black text-gray-700">${tx.cardId}</span>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-gray-800">$${tx.amount.toLocaleString()}</div>
                    <div class="text-[10px] font-bold text-pink-400">+${tx.rebateText}</div>
                </div>
            </div>`).join('')}</div>`;
}

// 渲染設定頁面
function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    let html = `
        <div class="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm space-y-6">
            <h3 class="font-black text-gray-800 text-sm border-b pb-3 uppercase">我的卡片 💳</h3>
            <div class="space-y-4">
                ${cardsDB.map(c => `
                    <div class="flex justify-between items-center py-1">
                        <span class="text-sm font-bold text-gray-600">${c.name}</span>
                        <input type="checkbox" ${profile.ownedCards.includes(c.id)?'checked':''} onchange="toggleCard('${c.id}')" class="w-6 h-6 accent-pink-400 rounded-full">
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="p-8 text-center">
             <button onclick="localStorage.clear();location.reload();" class="text-[10px] text-gray-300 underline">重置秘書數據 (清除快取)</button>
        </div>
    `;
    container.innerHTML = html;
}
