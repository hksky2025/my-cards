function init() {
    loadUserData();
    
    // 初始化分類選單
    const select = document.getElementById('category');
    const cats = [
        {v:"general", t:"🛒 本地零售"}, {v:"dining", t:"🍱 肚子餓了"}, {v:"online", t:"💻 網上購物"},
        {v:"overseas", t:"🌍 海外簽賬"}, {v:"transport", t:"🚌 交通出行"}, {v:"grocery", t:"🥦 超市補貨"}
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
    document.getElementById(`nav-btn-${t}`).classList.add('tab-active');
    
    if (t === 'ledger') renderLedger(userProfile.transactions);
    if (t === 'dashboard') renderDashboard(userProfile);
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
    const date = new Date().toISOString().split('T')[0];
    const results = calculateResults(amt, cat, window.currentMode, userProfile, date, HolidayManager.isHoliday(date));
    renderCalculatorResults(results);
};

window.handleRecord = function(cardId, dataStr) {
    const res = JSON.parse(decodeURIComponent(dataStr));
    if (!confirm(`確認使用 [${res.cardName}] 簽賬 $${res.amount}？`)) return;

    // 1. 更新總計
    userProfile.stats.totalSpend += res.amount;
    userProfile.stats.totalVal += res.estValue;
    userProfile.stats.txCount += 1;

    // 2. 更新額度 (Cap) - 這是最關鍵的修正
    res.trackingData.forEach(item => {
        if (item.key) {
            const increment = item.mode === 'reward' ? (item.amount * item.rate) : item.amount;
            userProfile.usage[item.key] = (userProfile.usage[item.key] || 0) + increment;
        }
    });
    
    // 3. 紀錄特定卡片簽賬 (用於門檻)
    userProfile.usage[`spend_${cardId}`] = (userProfile.usage[`spend_${cardId}`] || 0) + res.amount;

    // 4. 存入紀錄
    userProfile.transactions.unshift({
        date: new Date().toISOString(),
        cardName: res.cardName,
        amount: res.amount,
        rebateText: `${res.displayVal} ${res.displayUnit}`
    });

    saveUserData();
    refreshUI();
    switchTab('dashboard');
    alert("已記錄！秘書幫你記好帳了 🎀");
};

window.toggleCard = function(id) {
    const i = userProfile.ownedCards.indexOf(id);
    if (i > -1) userProfile.ownedCards.splice(i, 1);
    else userProfile.ownedCards.push(id);
    saveUserData();
    refreshUI();
};

window.toggleSetting = function(id) {
    userProfile.settings[id] = !userProfile.settings[id];
    saveUserData();
    refreshUI();
};

window.handleClearLedger = function() {
    if (confirm("確定清除所有紀錄？")) {
        userProfile.transactions = [];
        saveUserData();
        renderLedger([]);
    }
};

function initNewsScroller() {
    const news = ["🌟 2026 恒生 Travel+ 海外高達 7% 回贈！", "💻 HSBC Red 網上購物 4% 穩定發揮 🚀", "🍱 中銀 Cheers 指定餐飲 10X 積分達成！"];
    let i = 0;
    setInterval(() => {
        const el = document.getElementById('news-scroller');
        if (el) el.innerText = news[++i % news.length];
    }, 5000);
}

// 啟動
init();
