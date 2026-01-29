// js/app.js
let currentMode = 'miles';
let ownedCards = JSON.parse(localStorage.getItem('ownedCards_2026')) || ["hsbc_em", "hsbc_red"];

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.replace('text-blue-600', 'text-gray-400'));
    document.getElementById('nav-' + (tab === 'calculator' ? 'calc' : 'set')).classList.replace('text-gray-400', 'text-blue-600');
}

function setMode(m) {
    currentMode = m;
    document.getElementById('btn-miles').className = m === 'miles' ? "flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-white shadow-sm text-blue-600" : "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-gray-500";
    document.getElementById('btn-cash').className = m === 'cash' ? "flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-white shadow-sm text-blue-600" : "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-gray-500";
    updateCalc();
}

function updateCalc() {
    const amt = document.getElementById('input-amount').value || 0;
    const cat = document.getElementById('input-category').value;
    const results = Engine.calculate(amt, cat, currentMode, ownedCards);
    UI.renderResults(results, currentMode);
}

function toggleCard(id) {
    if (ownedCards.includes(id)) ownedCards = ownedCards.filter(i => i !== id);
    else ownedCards.push(id);
    localStorage.setItem('ownedCards_2026', JSON.stringify(ownedCards));
    updateCalc();
    renderSettings();
}

function renderSettings() {
    const container = document.getElementById('card-selection');
    container.innerHTML = CARDS.map(c => `
        <label class="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span class="text-sm font-bold text-gray-700">${c.bank} ${c.name}</span>
            <input type="checkbox" onchange="toggleCard('${c.id}')" ${ownedCards.includes(c.id) ? 'checked' : ''} class="w-6 h-6 accent-blue-600">
        </label>`).join('');
}

function init() {
    document.getElementById('input-category').innerHTML = CONFIG.CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    UI.updateHolidayStatus();
    renderSettings();
    updateCalc();
}

init();