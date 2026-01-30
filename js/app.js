// js/app.js

window.currentMode = 'miles';

async function init() {
    loadUserData(); // 來自 core.js
    
    // 更新分類選單 (動態過濾)
    updateCategoryDropdown(userProfile.ownedCards);

    if (typeof HolidayManager !== 'undefined') await HolidayManager.init();
    
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
    document.querySelectorAll('.tab-content').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${t}`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active', 'text-blue-600'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.add('text-gray-400'));
    document.getElementById(`btn-${t}`).classList.add('active');
    document.getElementById(`btn-${t}`).classList.remove('text-gray-400');
    
    if (t === 'ledger') renderLedger(userProfile.transactions);
    if (t === 'dashboard') renderDashboard(userProfile);
};

window.toggleMode = function(m) {
    window.currentMode = m;
    const isMiles = m === 'miles';
    document.getElementById('btn-mode-miles').className = isMiles ? "flex-1 py-2 rounded-lg text-xs font-black transition-all bg-white text-blue-600 shadow-sm" : "flex-1 py-2 rounded-lg text-xs font-black text-gray-500";
    document.getElementById('btn-mode-cash').className = !isMiles ? "flex-1 py-2 rounded-lg text-xs font-black transition-all bg-white text-blue-600 shadow-sm" : "flex-1 py-2 rounded-lg text-xs font-black text-gray-500";
    runCalc();
};

window.runCalc = function() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const cat = document.getElementById('category').value;
    const dateInput = document.getElementById('tx-date').value;
    const date = dateInput || new Date().toISOString().split('T')[0];
    const isHoliday = (typeof HolidayManager !== 'undefined') ? HolidayManager.isHoliday(date) : false;
    
    // 調用核心計算 (嚴格執行 original core.js 的參數)
    const results = calculateResults(amt, cat, window.currentMode, userProfile, date, isHoliday, {
        deductFcfForRanking: window.currentMode === 'cash'
    });
    renderCalculatorResults(results, window.currentMode);
};

window.handleRecord = function(name, dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    if (!confirm(`確認記帳：${name} $${data.amount.toLocaleString()}？`)) return;
    
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
    if (confirm("清除全部歷史紀錄？")) { userProfile.transactions = []; saveUserData(); renderLedger([]); }
};

function initNewsScroller() {
    const news = ["🌟 2026 恒生 Travel+ 海外高達 7%！", "💻 HSBC Red 網購 4% 穩定領先！", "🍱 中銀 Cheers 指定餐飲 10X！", "✈️ EveryMile 指定里數 $2/里！"];
    let i = 0;
    setInterval(() => {
        const el = document.getElementById('news-scroller');
        if (el) el.innerText = news[++i % news.length];
    }, 5000);
}

init();
