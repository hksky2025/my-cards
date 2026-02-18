// app.js — 主程式入口 (v2: 加入進度面板 + 交易記錄)

import { calcBaseReward, calcCrazyBonus, calcPromoBonus } from './calculator.js';
import { loadMerchants, findMerchant } from './matcher.js';
import { renderResults, renderCardManager, renderMatchHint, renderDateStatus } from './renderer.js';
import { initAuth, loadCardStatus, saveCardStatus, loadTransactions, saveTransaction, removeTransaction } from './firebase.js';
import { initTransactions, addTransaction, deleteTransaction, getTransactions, getCurrentMonthTotal, getCardMonthTotal, renderTransactions } from './transactions.js';
import { renderProgress } from './progress.js';

const HOLIDAYS_2026 = [
    "2026-01-01","2026-02-17","2026-02-18","2026-02-19",
    "2026-04-03","2026-04-04","2026-04-06","2026-04-07",
    "2026-05-01","2026-05-25","2026-06-19","2026-07-01",
    "2026-09-26","2026-10-01","2026-10-19","2026-12-25","2026-12-26"
];

let allCards = [], allPromos = [], cardStatus = {};
let globalMethod = 'ApplePay', isRedDay = false;

window.addEventListener('DOMContentLoaded', async () => {
    const [merchants, cards, promos] = await Promise.all([
        fetchJSON('./data/merchants.json'),
        fetchJSON('./data/cards.json'),
        fetchJSON('./data/promotions.json')
    ]);
    allCards = cards; allPromos = promos;
    loadMerchants(merchants);

    document.getElementById('txnDate').value = new Date().toISOString().split('T')[0];
    checkDateStatus();

    await initAuth(async () => {
        const saved = await loadCardStatus();
        cardStatus = saved || {};
        if (!saved) allCards.forEach(c => cardStatus[c.id] = true);
        if (!saved) await saveCardStatus(cardStatus);
        renderCardManager(allCards, cardStatus, handleCardToggle);

        // 填充卡片選擇器
        const sel = document.getElementById('txnCardSelect');
        allCards.filter(c => cardStatus[c.id]).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; opt.textContent = c.name;
            sel.appendChild(opt);
        });

        const txnData = await loadTransactions();
        initTransactions(txnData, () => { syncMonthTotal(); refreshProgress(); renderTransactions(allCards); });
        syncMonthTotal();
        refreshProgress();
        renderTransactions(allCards);
    });

    document.getElementById('merchantSearch').addEventListener('input', handleMerchantSearch);
    document.getElementById('txnDate').addEventListener('change', checkDateStatus);
    document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
    document.getElementById('managerToggleBtn').addEventListener('click', toggleManager);
    document.getElementById('meth-ap').addEventListener('click', () => updateMethod('ApplePay'));
    document.getElementById('meth-on').addEventListener('click', () => updateMethod('Online'));
    document.getElementById('addTxnBtn').addEventListener('click', handleAddTransaction);
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
});

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.id === `tab-${tab}` ? 'block' : 'none');
    if (tab === 'progress') refreshProgress();
    if (tab === 'txn') renderTransactions(allCards);
}

function handleMerchantSearch() {
    const match = findMerchant(document.getElementById('merchantSearch').value);
    renderMatchHint(match);
    if (match) { document.getElementById('category').value = match.cat; updateMethod(match.meth); }
}

function checkDateStatus() {
    const s = document.getElementById('txnDate').value;
    isRedDay = [0,5,6].includes(new Date(s).getDay()) || HOLIDAYS_2026.includes(s);
    renderDateStatus(isRedDay);
}

function updateMethod(m) {
    globalMethod = m;
    document.getElementById('meth-ap').classList.toggle('active', m === 'ApplePay');
    document.getElementById('meth-on').classList.toggle('active', m === 'Online');
}

async function handleCardToggle(cardId, newStatus) {
    cardStatus[cardId] = newStatus;
    await saveCardStatus(cardStatus);
    refreshProgress();
}

function toggleManager() {
    const p = document.getElementById('cardManagerPanel');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

async function handleAddTransaction() {
    const merchant = document.getElementById('merchantSearch').value.trim() || document.getElementById('category').value;
    const amt = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('txnDate').value;
    const cardId = document.getElementById('txnCardSelect').value;
    const cat = document.getElementById('category').value;
    if (!amt || amt <= 0) return alert('請輸入有效金額');
    if (!cardId) return alert('請選擇信用卡');
    const txn = { merchant, amt, date, cardId, cat, method: globalMethod };
    const saved = await saveTransaction(txn);
    addTransaction(saved);
    document.getElementById('amount').value = '';
}

// 全局刪除（供 renderer 呼叫）
window.handleDeleteTxn = async (id) => {
    if (!confirm('確定刪除此記錄？')) return;
    await removeTransaction(id);
    deleteTransaction(id);
};

async function handleAnalyze() {
    const spent = parseFloat(document.getElementById('currentSpent').value) || 0;
    const amt = parseFloat(document.getElementById('amount').value);
    const cat = document.getElementById('category').value;
    const rawInput = document.getElementById('merchantSearch').value.trim();
    if (!amt || amt <= 0) return alert('請輸入有效金額');
    const isMet = (spent + amt) >= 5000;
    const merchant = findMerchant(rawInput);
    const sub = merchant ? merchant.sub : null;
    const today = new Date();
    const params = { amt, cat, meth: globalMethod, isMet, sub, isRedDay };

    const processed = allCards.filter(c => cardStatus[c.id]).map(c => {
        const baseRes = calcBaseReward(c, params);
        const crazyBonus = isCrazyCat(cat, sub) ? calcCrazyBonus(c, params) : 0;
        let extraCash = 0; const activePromos = [];
        if (crazyBonus > 0) activePromos.push('狂賞派');
        allPromos.forEach(p => {
            const kw = rawInput.toLowerCase();
            if (p.keywords.some(k => kw.includes(k.toLowerCase())) &&
                today >= new Date(p.startDate) && today <= new Date(p.endDate) &&
                p.bank === c.bank && amt >= p.minAmt) {
                extraCash += calcPromoBonus(p, params);
                activePromos.push(p.name);
            }
        });
        return { card: c, baseRes, crazyBonus, extraCash, activePromos };
    });
    renderResults(processed);
}

function refreshProgress() {
    const enabledCards = allCards.filter(c => cardStatus[c.id]);
    renderProgress(enabledCards, allPromos, getCurrentMonthTotal(), getCardMonthTotal);
}

function syncMonthTotal() {
    const total = getCurrentMonthTotal();
    const el = document.getElementById('currentSpent');
    if (el) el.value = total;
}

function isCrazyCat(cat, sub) {
    return ['Dining','Electronics','Pet','Leisure','Medical','Travel','Jewelry'].includes(cat) || (sub && sub.includes('CRAZY'));
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`無法載入 ${url}`);
    return res.json();
}
