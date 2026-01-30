// js/app.js

window.currentMode = 'miles';

// 初始化
async function init() {
    loadUserData(); // 來自 core.js
    
    // 初始化分類 (動態生成)
    updateCategoryDropdown(userProfile.ownedCards);

    // 假日判定 (來自 core.js)
    if (typeof HolidayManager !== 'undefined') await HolidayManager.init();
    
    refreshUI();
    
    // 如果沒選擇卡片，強制跳轉設定
    if (!userProfile.ownedCards || userProfile.ownedCards.length === 0) switchTab('settings');
}

// 刷新全域介面
function refreshUI() {
    renderDashboard(userProfile);
    renderSettings(userProfile);
    runCalc();
}

// 動態分類選單
function updateCategoryDropdown(ownedCards) {
    const select = document.getElementById('category');
    if (!select) return;
    const filtered = CATEGORY_DEF.filter(cat => {
        if (!cat.req) return true;
        if (typeof cat.req === 'function') return cat.req(ownedCards);
        return ownedCards.includes(cat.req);
    });
    select.innerHTML = filtered.map(c => `<option value="${c.v}">${c.t}</option>`).join('');
}

// --- 暴露給 HTML 的全局函數 ---

window.switchTab = function(t) {
    document.querySelectorAll('.tab-content').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${t}`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.add('text-gray-400'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active', 'text-blue-600'));
    
    document.getElementById(`btn-${t}`).classList.add('active', 'text-blue-600');
    document.getElementById(`btn-${t}`).classList.remove('text-gray-400');
    
    if (t === 'ledger') renderLedger(userProfile.transactions);
    if (t === 'dashboard') renderDashboard(userProfile);
};

window.toggleMode = function(m) {
    window.currentMode = m;
    const isMiles = m === 'miles';
    document.getElementById('btn-mode-miles').className = isMiles ? "flex-1 py-1.5 rounded-md text-xs font-bold bg-white text-blue-600 shadow-sm" : "flex-1 py-1.5 rounded-md text-xs font-bold text-gray-500";
    document.getElementById('btn-mode-cash').className = !isMiles ? "flex-1 py-1.5 rounded-md text-xs font-bold bg-white text-blue-600 shadow-sm" : "flex-1 py-1.5 rounded-md text-xs font-bold text-gray-500";
    runCalc();
};

window.runCalc = function() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const cat = document.getElementById('category').value;
    const dateInput = document.getElementById('tx-date').value;
    const date = dateInput || new Date().toISOString().split('T')[0];
    const isHoliday = (typeof HolidayManager !== 'undefined') ? HolidayManager.isHoliday(date) : false;
    
    const badge = document.getElementById('holiday-badge');
    if (badge) isHoliday ? badge.classList.remove('hidden') : badge.classList.add('hidden');

    // 調用核心計算 (來自 core.js)
    const results = calculateResults(amt, cat, window.currentMode, userProfile, date, isHoliday, {
        deductFcfForRanking: window.currentMode === 'cash'
    });
    renderCalculatorResults(results, window.currentMode);
};

window.handleRecord = function(name, dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    if (!confirm(`確認記帳：${name} $${data.amount.toLocaleString()}？`)) return;
    
    // 調用核心邏輯 (來自 core.js)
    commitTransaction(data); 
    
    refreshUI();
    switchTab('dashboard');
};

window.toggleCard = function(id) {
    const i = userProfile.ownedCards.indexOf(id);
    if (i > -1) userProfile.ownedCards.splice(i, 1);
    else userProfile.ownedCards.push(id);
    saveUserData();
    updateCategoryDropdown(userProfile.ownedCards);
    refreshUI();
};

window.toggleSetting = function(k) {
    userProfile.settings[k] = !userProfile.settings[k];
    saveUserData();
    refreshUI();
};

window.saveDrop = function(k, v) {
    userProfile.settings[k] = v;
    saveUserData();
    refreshUI();
};

window.changeAllocation = function(key, delta) {
    const rh = userProfile.settings.red_hot_allocation;
    const total = Object.values(rh).reduce((a,b)=>a+b, 0);
    if (delta > 0 && total >= 5) return;
    if (delta < 0 && rh[key] <= 0) return;
    rh[key] += delta;
    saveUserData();
    refreshUI();
};

window.handleClearHistory = function() {
    if (confirm("清除全部紀錄？")) { userProfile.transactions = []; saveUserData(); renderLedger([]); }
};

// 啟動
init();
