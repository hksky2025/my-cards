// js/app.js

window.currentMode = 'miles';

async function init() {
    loadUserData(); // 來自 core.js
    
    // 初始化分類選單
    updateCategoryDropdown(userProfile.ownedCards);

    // 初始化假日資訊 (來自 core.js)
    if (typeof HolidayManager !== 'undefined') {
        await HolidayManager.init();
    }
    
    refreshUI();
    initNewsScroller();
    
    if (!userProfile.ownedCards || userProfile.ownedCards.length === 0) switchTab('settings');
}

function refreshUI() {
    renderDashboard(userProfile);
    renderSettings(userProfile);
    runCalc();
}

window.switchTab = function(t) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${t}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('tab-active', 'text-gray-300'));
    document.getElementById(`btn-${t}`).classList.replace('text-gray-300', 'tab-active');
    
    if (t === 'ledger') renderLedger(userProfile.transactions);
    if (t === 'dashboard') renderDashboard(userProfile);
};

window.toggleMode = function(m) {
    window.currentMode = m;
    const isMiles = m === 'miles';
    document.getElementById('btn-mode-miles').className = isMiles ? "flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-white shadow-sm text-pink-500" : "flex-1 py-2 rounded-xl text-xs font-bold text-gray-400";
    document.getElementById('btn-mode-cash').className = !isMiles ? "flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-white shadow-sm text-pink-500" : "flex-1 py-2 rounded-xl text-xs font-bold text-gray-400";
    runCalc();
};

window.runCalc = function() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const cat = document.getElementById('category').value;
    const dateInput = document.getElementById('tx-date').value;
    const date = dateInput || new Date().toISOString().split('T')[0];
    const isHoliday = HolidayManager.isHoliday(date);
    
    // 假日 UI 提示
    const badge = document.getElementById('holiday-badge');
    if(badge) {
        if(isHoliday) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }

    // 調用核心計算 (來自 core.js)
    const results = calculateResults(amt, cat, window.currentMode, userProfile, date, isHoliday, {
        deductFcfForRanking: window.currentMode === 'cash'
    });
    renderCalculatorResults(results, window.currentMode);
};

window.handleRecord = function(name, dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    if (!confirm(`確認記帳：${name} $${data.amount.toLocaleString()}？`)) return;
    
    // 調用 core.js 的 commitTransaction
    commitTransaction(data); 
    
    refreshUI();
    switchTab('dashboard');
};

function updateCategoryDropdown(ownedCards) {
    const select = document.getElementById('category');
    if(!select) return;
    const filtered = CATEGORY_DEF.filter(cat => {
        if (!cat.req) return true;
        if (typeof cat.req === 'function') return cat.req(ownedCards);
        return ownedCards.includes(cat.req);
    });
    select.innerHTML = filtered.map(c => `<option value="${c.v}">${c.t}</option>`).join('');
}

window.toggleCard = function(id) {
    const i = userProfile.ownedCards.indexOf(id);
    if (i > -1) userProfile.ownedCards.splice(i, 1);
    else userProfile.ownedCards.push(id);
    saveUserData();
    updateCategoryDropdown(userProfile.ownedCards);
    refreshUI();
};

window.saveDrop = function(k, v) {
    userProfile.settings[k] = v;
    saveUserData();
    refreshUI();
};

window.handleClearHistory = function() {
    if (confirm("清除全部筆記紀錄？")) { userProfile.transactions = []; saveUserData(); renderLedger([]); }
};

function initNewsScroller() {
    const news = [
        "🌟 2026 恒生 Travel+ 海外高達 7% 回贈！",
        "💻 HSBC Red 網購 4% 穩定發揮中 🚀",
        "🍱 中銀 Cheers 指定餐飲 10X 積分達成！",
        "✈️ EveryMile 指定里數低至 $2/里 🐾"
    ];
    let i = 0;
    setInterval(() => {
        const el = document.getElementById('news-scroller');
        if (el) el.innerText = news[++i % news.length];
    }, 5000);
}

init();
