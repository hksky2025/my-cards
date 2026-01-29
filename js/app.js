// js/app.js - 主控制器

window.currentMode = 'miles';

async function init() {
    loadUserData(); // 來自 core.js
    
    // 初始化分類選單 (與 ui.js 保持一致)
    const select = document.getElementById('category');
    select.innerHTML = CATEGORY_DEF.map(c => `<option value="${c.v}">${c.t}</option>`).join('');

    // 初始化假日資訊並渲染
    if (typeof HolidayManager !== 'undefined') {
        await HolidayManager.init();
    }
    
    refreshUI();
    initNewsScroller();
    
    if (userProfile.ownedCards.length === 0) switchTab('settings');
}

function refreshUI() {
    renderDashboard(userProfile);
    renderSettings(userProfile);
    runCalc();
}

window.switchTab = function(t) {
    document.querySelectorAll('.tab-content').forEach(v => v.classList.add('hidden'));
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
    const date = document.getElementById('tx-date').value || new Date().toISOString().split('T')[0];
    const isHoliday = HolidayManager.isHoliday(date);
    
    // 調用核心計算邏輯 (core.js)
    const results = calculateResults(amt, cat, window.currentMode, userProfile, date, isHoliday);
    renderCalculatorResults(results, window.currentMode);
};

window.handleRecord = function(name, dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    if (!confirm(`確認記帳：${name} $${data.amount}？`)) return;
    
    // 調用 core.js 的 commitTransaction 處理複雜的 Cap 扣減與追溯邏輯
    commitTransaction(data); 
    
    alert("秘書已記好帳了！🐾");
    refreshUI();
    switchTab('dashboard');
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

// 啟動程式
init();
