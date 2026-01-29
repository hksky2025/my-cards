window.currentMode = 'miles';
function init() {
    loadUserData();
    HolidayManager.init().then(() => {
        updateCategoryDropdown();
        refreshUI();
    });
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
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active', 'text-pink-500'));
    document.getElementById(`btn-${t}`).classList.add('tab-active');
    if(t === 'ledger') renderLedger(userProfile.transactions);
};

window.runCalc = function() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const cat = document.getElementById('category').value;
    const date = new Date().toISOString().split('T')[0];
    const results = calculateResults(amt, cat, window.currentMode, userProfile, date, HolidayManager.isHoliday(date));
    renderCalculatorResults(results, window.currentMode);
};

function updateCategoryDropdown() {
    const select = document.getElementById('category');
    const cats = [
        {v:"general", t:"🛒 本地零售"}, {v:"dining", t:"🍱 肚子餓了"}, {v:"online", t:"💻 網上購物"},
        {v:"overseas_jkt", t:"🇯🇵 海外(日韓泰)"}, {v:"transport", t:"🚌 交通出行"}, {v:"grocery", t:"🥦 超市補貨"}
    ];
    select.innerHTML = cats.map(c => `<option value="${c.v}">${c.t}</option>`).join('');
}

window.handleRecord = function(name, data) {
    if(!confirm(`確認以 [${name}] 簽賬?`)) return;
    const res = JSON.parse(decodeURIComponent(data));
    userProfile.stats.totalSpend += res.amount;
    userProfile.stats.totalVal += res.estValue;
    userProfile.transactions.unshift({ date: new Date(), cardId: name, amount: res.amount, rebateText: `${res.displayVal}${res.displayUnit}` });
    saveUserData();
    refreshUI();
    switchTab('dashboard');
};

function initNewsScroller() {
    const news = ["🌟 2026 恒生 Travel+ 海外高達 7% 回贈！", "🍱 中銀 Cheers 指定餐飲 10X 積分達成！", "💻 HSBC Red 網購 4% 持續發力中 🚀"];
    let i = 0;
    setInterval(() => {
        document.getElementById('news-scroller').innerText = news[++i % news.length];
    }, 5000);
}

// 簡單的 Setting 渲染
function renderSettings(profile) {
    const container = document.getElementById('settings-container');
    container.innerHTML = `
        <div class="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm space-y-4">
            <h3 class="font-black text-gray-800">我的卡片</h3>
            ${cardsDB.map(c => {
                const checked = profile.ownedCards.includes(c.id) ? 'checked' : '';
                return `<div class="flex justify-between"><span>${c.name}</span><input type="checkbox" ${checked} onchange="toggleCard('${c.id}')"></div>`;
            }).join('')}
        </div>`;
}
window.toggleCard = function(id) {
    const i = userProfile.ownedCards.indexOf(id);
    if(i > -1) userProfile.ownedCards.splice(i, 1);
    else userProfile.ownedCards.push(id);
    saveUserData();
    refreshUI();
};

init();
