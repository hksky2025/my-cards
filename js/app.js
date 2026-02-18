// app.js — 主程式入口 (v2.2: 修復卡片選擇器時序問題)

import { calcBaseReward, calcCrazyBonus, calcPromoBonus } from './calculator.js';
import { loadMerchants, findMerchant } from './matcher.js';
import { renderResults, renderCardManager, renderMatchHint, renderDateStatus } from './renderer.js';
import { initAuth, loadCardStatus, saveCardStatus, loadTransactions, saveTransaction, removeTransaction } from './firebase.js';
import { initTransactions, addTransaction, deleteTransaction, getCurrentMonthTotal, getCardMonthTotal, renderTransactions } from './transactions.js';
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

    // 步驟一：先載入所有 JSON（確保 allCards 有值先）
    const [merchants, cards, promos] = await Promise.all([
        fetchJSON('./data/merchants.json'),
        fetchJSON('./data/cards.json'),
        fetchJSON('./data/promotions.json')
    ]);
    allCards = cards;
    allPromos = promos;
    loadMerchants(merchants);

    console.log('✅ JSON 載入完成，卡片數量:', allCards.length);

    // 步驟二：預設全部啟用（Firebase 載入前先填充選擇器）
    allCards.forEach(c => cardStatus[c.id] = true);
    populateCardSelect(); // ← 提前呼叫，唔等 Firebase

    document.getElementById('txnDate').value = new Date().toISOString().split('T')[0];
    checkDateStatus();

    // 步驟三：綁定所有事件
    document.getElementById('merchantSearch').addEventListener('input', handleMerchantSearch);
    document.getElementById('txnDate').addEventListener('change', checkDateStatus);
    document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
    document.getElementById('managerToggleBtn').addEventListener('click', toggleManager);
    document.getElementById('meth-ap').addEventListener('click', () => updateMethod('ApplePay'));
    document.getElementById('meth-on').addEventListener('click', () => updateMethod('Online'));
    document.getElementById('addTxnBtn').addEventListener('click', handleAddTransaction);
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // 步驟四：Firebase 異步初始化（完成後更新狀態）
    await initAuth(async () => {
        console.log('✅ Firebase Auth 完成');

        const saved = await loadCardStatus();
        console.log('✅ 讀取卡片狀態:', saved);

        if (saved) {
            Object.assign(cardStatus, saved);
        } else {
            await saveCardStatus(cardStatus);
        }

        // 用 Firebase 狀態更新 UI
        renderCardManager(allCards, cardStatus, handleCardToggle);
        populateCardSelect(); // 再次更新（反映 Firebase 的啟用狀態）

        const txnData = await loadTransactions();
        console.log('✅ 載入交易記錄:', txnData.length, '筆');

        initTransactions(txnData, () => {
            syncMonthTotal();
            refreshProgress();
            renderTransactions(allCards);
        });

        syncMonthTotal();
        refreshProgress();
        renderTransactions(allCards);
    });
});

// ── 填充卡片選擇器 ────────────────────────────────────
function populateCardSelect() {
    const sel = document.getElementById('txnCardSelect');
    if (!sel) return;
    const current = sel.value; // 保留已選的值
    sel.innerHTML = '<option value="">-- 選擇信用卡 --</option>';
    allCards.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = cardStatus[c.id] ? c.name : `${c.name}（未啟用）`;
        sel.appendChild(opt);
    });
    if (current) sel.value = current; // 還原選擇
    console.log('✅ 卡片選擇器已填充，共', allCards.length, '張');
}

// ── Tab 切換 ──────────────────────────────────────────
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = p.id === `tab-${tab}` ? 'block' : 'none');
    if (tab === 'progress') refreshProgress();
    if (tab === 'txn') renderTransactions(allCards);
}

// ── 事件處理 ──────────────────────────────────────────
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
    populateCardSelect();
    refreshProgress();
}

function toggleManager() {
    const p = document.getElementById('cardManagerPanel');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

// ── 新增交易 ──────────────────────────────────────────
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
    alert(`✅ 已記錄：${merchant} $${amt}`);
}

window.handleDeleteTxn = async (id) => {
    if (!confirm('確定刪除此記錄？')) return;
    await removeTransaction(id);
    deleteTransaction(id);
};

// ── 核心運算 ──────────────────────────────────────────
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
        let extraCash = 0;
        const activePromos = [];
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

// ── 進度 ──────────────────────────────────────────────
function refreshProgress() {
    const enabledCards = allCards.filter(c => cardStatus[c.id]);
    renderProgress(enabledCards, allPromos, getCurrentMonthTotal(), getCardMonthTotal);
}

function syncMonthTotal() {
    const el = document.getElementById('currentSpent');
    if (el) el.value = getCurrentMonthTotal();
}

function isCrazyCat(cat, sub) {
    return ['Dining','Electronics','Pet','Leisure','Medical','Travel','Jewelry'].includes(cat)
        || (sub && sub.includes('CRAZY'));
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`無法載入 ${url}`);
    return res.json();
}
