window.currentMode = 'miles';

function init() {
    loadUserData();
    const select = document.getElementById('category');
    const cats = [
        {v:"general", t:"🛒 本地零售"}, {v:"dining", t:"🍱 肚子餓了"}, {v:"online", t:"💻 網上購物"},
        {v:"overseas", t:"🌍 海外簽賬"}, {v:"transport", t:"🚌 交通出行"}, {v:"grocery", t:"🥦 超市補貨"},
        {v:"red_designated", t:"🌹 Red 指定商戶"}, {v:"smart_designated", t:"🛍️ Smart 指定商戶"}
    ];
    select.innerHTML = cats.map(c => `<option value="${c.v}">${c.t}</option>`).join('');
    refreshUI();
    initNewsScroller();
}

function refreshUI() {
    renderDashboard(userProfile);
    renderSettings(userProfile);
    runCalc();
}

window.switchTab = function(t) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${t}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    document.getElementById(`nav-${t}`).classList.add('tab-active');
    if (t === 'ledger') renderLedger(userProfile.transactions);
};

window.toggleMode = function(m) {
    window.currentMode = m;
    document.getElementById('btn-mode-miles').className = m === 'miles' ? "flex-1 py-2 rounded-xl text-xs font-bold bg-white shadow-sm text-pink-500" : "flex-1 py-2 rounded-xl text-xs font-bold text-gray-400";
    document.getElementById('btn-mode-cash').className = m === 'cash' ? "flex-1 py-2 rounded-xl text-xs font-bold bg-white shadow-sm text-pink-500" : "flex-1 py-2 rounded-xl text-xs font-bold text-gray-400";
    runCalc();
};

window.runCalc = function() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const cat = document.getElementById('category').value;
    const results = calculateResults(amt, cat, window.currentMode, userProfile);
    renderCalculatorResults(results);
};

window.handleRecord = function(dataStr) {
    const res = JSON.parse(decodeURIComponent(dataStr));
    if (!confirm(`確認記帳 $${res.amount}？`)) return;
    userProfile.stats.totalSpend += res.amount;
    userProfile.stats.totalVal += res.estValue;
    res.trackingData.forEach(item => {
        const inc = item.mode === 'reward' ? (res.amount * item.rate) : res.amount;
        userProfile.usage[item.key] = (userProfile.usage[item.key] || 0) + inc;
    });
    userProfile.transactions.unshift({ date: new Date().toISOString(), cardName: res.cardName, amount: res.amount, rebateText: `${res.displayVal} ${res.displayUnit}` });
    saveUserData();
    refreshUI();
    switchTab('dashboard');
};

window.toggleCard = function(id) {
    const i = userProfile.ownedCards.indexOf(id);
    if (i > -1) userProfile.ownedCards.splice(i, 1);
    else userProfile.ownedCards.push(id);
    saveUserData();
    refreshUI();
};

window.handleClearLedger = function() {
    if (confirm("清除紀錄？")) { userProfile.transactions = []; saveUserData(); renderLedger([]); }
};

function initNewsScroller() {
    const news = ["🌟 2026 恒生 Travel+ 海外高達 7%！", "💻 HSBC Red 網購 4% 穩！", "🍱 中銀 Cheers 指定餐飲 10X！"];
    let i = 0; setInterval(() => { const el = document.getElementById('news-scroller'); if(el) el.innerText = news[++i % news.length]; }, 5000);
}

init();
