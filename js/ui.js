// js/ui.js - 信用卡秘書介面渲染層

// 1. 類別定義 (與 index.html 同步)
const CATEGORY_DEF = [
    { v: "general", t: "🛒 本地零售 (General)" },
    { v: "dining", t: "🍱 肚子餓了 (Dining)" },
    { v: "online", t: "💻 網上購物 (Online)" },
    { v: "overseas_jkt", t: "🇯🇵🇰🇷🇹🇭 海外 (日韓泰)" },
    { v: "overseas_tw", t: "🇹🇼 海外 (台灣)" },
    { v: "overseas_cn", t: "🇨🇳🇲🇴 海外 (內地澳門)" },
    { v: "overseas_other", t: "🌎 海外 (其他)" },
    { v: "transport", t: "🚌 交通出行 (Transport)" },
    { v: "grocery", t: "🥦 超市補貨 (Grocery)" },
    { v: "travel", t: "🧳 想要旅遊 (Travel)" },
    { v: "entertainment", t: "🎬 看場電影 (Cinema)" },
    { v: "apparel", t: "👕 買漂亮衣服 (Apparel)" },
    { v: "red_designated", t: "🌹 Red 指定 8% 商戶", req: 'hsbc_red' },
    { v: "smart_designated", t: "🛍️ Smart 指定 5% 商戶", req: 'sc_smart' }
];

// 2. 核心 UI 組件
function createProgressCard(config) {
    const { title, theme, badge, sections, actionButton } = config;
    const t = { 
        pink: 'bg-[#FFECF0] border-[#FFD1DC] text-[#FF8BA7] bar:bg-[#FF8BA7]',
        blue: 'bg-[#EBF8FF] border-[#BEE3F8] text-[#4299E1] bar:bg-[#4299E1]',
        yellow: 'bg-[#FFF9E6] border-[#FAF089] text-[#B7791F] bar:bg-[#ECC94B]',
        red: 'bg-[#FFF5F5] border-[#FED7D7] text-[#E53E3E] bar:bg-[#E53E3E]'
    }[theme] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', bar: 'bg-gray-400' };

    let sectionsHtml = sections.map(sec => `
        <div class="space-y-2">
            <div class="flex justify-between text-[11px] font-black uppercase">
                <span>${sec.label}</span>
                <span class="font-mono">${sec.valueText}</span>
            </div>
            <div class="w-full bg-white/60 rounded-full h-4 relative p-0.5 border border-white">
                <div class="progress-fill h-full ${sec.barColor || 'bg-blue-400'}" style="width: ${sec.progress}%"></div>
                ${sec.overlay || ''}
            </div>
            ${sec.markers ? `<div class="flex justify-between text-[8px] text-gray-400 px-1">${sec.markers}</div>` : ''}
            ${sec.subText ? `<div class="text-[10px] text-right font-bold text-gray-400">${sec.subText}</div>` : ''}
        </div>
    `).join('');

    return `
        <div class="${t.split(' bar:')[0]} border-2 rounded-[2rem] p-5 shadow-sm mb-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-black text-sm uppercase tracking-tight">${title}</h3>
                ${badge ? `<span class="bg-white/80 text-[10px] px-3 py-1 rounded-full font-black shadow-sm">${badge}</span>` : ''}
            </div>
            <div class="space-y-6">${sectionsHtml}</div>
            ${actionButton ? `
                <button onclick="${actionButton.onClick}" class="w-full mt-4 bg-white py-3 rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all">
                    ${actionButton.label}
                </button>
            ` : ''}
        </div>
    `;
}

// 3. 渲染 Dashboard (對接 core.js 的 usage)
function renderDashboard(profile) {
    const container = document.getElementById('dashboard-container');
    document.getElementById('total-rebate').innerText = `$${Math.floor(profile.stats.totalVal)}`;
    document.getElementById('total-spend').innerText = `$${Math.floor(profile.stats.totalSpend)}`;

    let html = "";
    
    // Travel Guru 模組
    const level = parseInt(profile.settings.guru_level);
    if (level > 0) {
        const lvName = ["無", "🐣 GO級", "🐥 GING級", "👑 GURU級"][level];
        const spend = profile.usage["guru_spend_accum"] || 0;
        const target = level < 3 ? (level === 1 ? 30000 : 70000) : 70000;
        html += createProgressCard({
            title: "Travel Guru 旅人進化", theme: "yellow", badge: lvName,
            sections: [{ label: "🚀 進化壓力 (簽賬)", valueText: `$${spend}/$${target}`, progress: Math.min(100, (spend/target)*100) }],
            actionButton: spend >= target && level < 3 ? { label: "🎉 立即進化", onClick: "handleGuruUpgrade()" } : null
        });
    }

    // 自動循環 profile.ownedCards 顯示 Cap (這部分對接了 data_modules.js 中的 cap_key)
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
            html += createProgressCard({
                title: card.name, theme: "blue", badge: "每月重置",
                sections: [{ label: mod.desc, valueText: `${Math.floor(used)}/${mod.cap_limit}`, progress: pct }]
            });
        });
    });

    container.innerHTML = html || `<div class="text-center py-10 text-gray-400 font-bold">秘書在等你新增卡片 🐾</div>`;
}

// 4. 渲染計算結果
function renderCalculatorResults(results, mode) {
    const container = document.getElementById('calc-results');
    container.innerHTML = results.map((res, i) => {
        const dataStr = encodeURIComponent(JSON.stringify(res));
        return `
            <div class="relative p-5 chiikawa-card mb-4 cursor-pointer active:scale-95 transition-all ${i===0?'bg-chiikawa-yellow border-yellow-200 shadow-md':''}" 
                 onclick="handleRecord('${res.cardName}','${dataStr}')">
                ${i===0?'<span class="absolute -top-3 -left-2 bg-yellow-400 text-white text-[10px] px-2 py-1 rounded-lg font-black z-10">秘書最推 🎀</span>':''}
                <div class="flex justify-between items-center">
                    <div class="max-w-[60%]">
                        <div class="font-black text-gray-800 text-sm truncate">${res.cardName}</div>
                        <div class="text-[10px] text-gray-400 font-bold">${res.breakdown.join(' + ')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-black text-blue-500">${res.displayVal}<span class="text-[10px] ml-1">${res.displayUnit}</span></div>
                        <div class="text-[10px] text-pink-400 font-bold tracking-tighter">+ 點擊記帳 📝</div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// 5. 渲染記帳本
function renderLedger(transactions) {
    const container = document.getElementById('ledger-container');
    if (!transactions.length) {
        container.innerHTML = `<div class="text-center py-20 text-gray-300 font-black">筆記本是空的 📖</div>`;
        return;
    }
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="font-black text-gray-800 uppercase text-xs">最近筆記</h3>
            <button onclick="handleClearHistory()" class="text-[10px] text-red-400 font-bold underline">全部刪除</button>
        </div>
        <div class="space-y-3">
            ${transactions.map(tx => `
                <div class="bg-white p-4 rounded-3xl border-2 border-gray-50 flex justify-between items-center shadow-sm">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-gray-300 uppercase">${new Date(tx.date).toLocaleDateString()}</span>
                        <span class="text-sm font-black text-gray-700">${tx.cardId}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-black text-gray-800">$${tx.amount.toLocaleString()}</div>
                        <div class="text-[10px] font-bold text-pink-400">+${tx.rebateText}</div>
                    </div>
                </div>`).join('')}
        </div>`;
}

// 6. 渲染設定頁面
function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    let html = `
        <div class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-6">
            <h3 class="font-black text-gray-800 text-sm border-b pb-2 uppercase tracking-widest">我的錢包 💳</h3>
            <div class="space-y-4">
                ${cardsDB.map(c => `
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-bold text-gray-600">${c.name}</span>
                        <input type="checkbox" ${profile.ownedCards.includes(c.id)?'checked':''} onchange="toggleCard('${c.id}')" class="w-6 h-6 accent-pink-400">
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm mt-4 space-y-4">
             <h3 class="font-black text-gray-800 text-sm border-b pb-2 uppercase tracking-widest">登記推廣 📢</h3>
             <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-gray-500">HSBC Travel Guru 等級</span>
                <select onchange="saveDrop('guru_level', this.value)" id="st-guru" class="text-xs font-bold p-1 bg-gray-50 rounded">
                    <option value="0">無</option><option value="1">GO級</option><option value="2">GING級</option><option value="3">GURU級</option>
                </select>
             </div>
        </div>
    `;
    container.innerHTML = html;
    document.getElementById('st-guru').value = profile.settings.guru_level;
}
