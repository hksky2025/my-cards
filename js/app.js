// js/app.js
let state = {
    mode: 'miles',
    wallet: JSON.parse(localStorage.getItem('my_wallet_2026')) || ["hsbc_em", "hsbc_red", "ctbc_motion"],
    usage: JSON.parse(localStorage.getItem('my_usage_2026')) || { mmp_spend: 6000, motion_cap: 1500 }
};

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`view-${id}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.replace('text-brand-primary', 'text-slate-300'));
    document.getElementById(`nav-${id}`).classList.replace('text-slate-300', 'text-brand-primary');
}

function changeMode(m) {
    state.mode = m;
    const btnM = document.getElementById('mode-miles');
    const btnC = document.getElementById('mode-cash');
    if(m === 'miles') {
        btnM.className = "flex-1 py-2 text-xs font-bold rounded-xl bg-white text-brand-primary shadow-sm";
        btnC.className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-500";
    } else {
        btnC.className = "flex-1 py-2 text-xs font-bold rounded-xl bg-white text-brand-primary shadow-sm";
        btnM.className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-500";
    }
    executeLogic();
}

function executeLogic() {
    const amt = document.getElementById('spend-amount').value || 0;
    const cat = document.getElementById('spend-category').value;
    const res = LogicEngine.calculate(amt, cat, state.mode, state.wallet, state.usage);
    UI_Renderer.renderList(res, state.mode);
}

function init() {
    // 填充下拉選單
    const sel = document.getElementById('spend-category');
    sel.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    UI_Renderer.updateStatus();
    executeLogic();
    lucide.createIcons();
}

window.onload = init;
