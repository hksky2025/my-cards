// app.js — 主程式入口
// 負責：載入資料、協調各模組、處理用戶互動

import { calcBaseReward, calcCrazyBonus, calcPromoBonus } from './calculator.js';
import { loadMerchants, findMerchant } from './matcher.js';
import { renderResults, renderCardManager, renderMatchHint, renderDateStatus } from './renderer.js';
import { initAuth, loadCardStatus, saveCardStatus } from './firebase.js';

// 2026 公眾假期
const HOLIDAYS_2026 = [
    "2026-01-01","2026-02-17","2026-02-18","2026-02-19",
    "2026-04-03","2026-04-04","2026-04-06","2026-04-07",
    "2026-05-01","2026-05-25","2026-06-19","2026-07-01",
    "2026-09-26","2026-10-01","2026-10-19","2026-12-25","2026-12-26"
];

// ── 全局狀態 ──────────────────────────────────────────
let allCards = [];
let allPromos = [];
let cardStatus = {};
let globalMethod = 'ApplePay';
let isRedDay = false;

// ── 初始化 ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    // 並行載入所有 JSON 資料
    const [merchants, cards, promos] = await Promise.all([
        fetchJSON('./data/merchants.json'),
        fetchJSON('./data/cards.json'),
        fetchJSON('./data/promotions.json')
    ]);

    allCards = cards;
    allPromos = promos;
    loadMerchants(merchants);

    // 設定今日日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('txnDate').value = today;
    checkDateStatus();

    // Firebase Auth 初始化
    await initAuth(async (user) => {
        const saved = await loadCardStatus();
        if (saved) {
            cardStatus = saved;
        } else {
            // 預設全部啟用
            allCards.forEach(c => cardStatus[c.id] = true);
            await saveCardStatus(cardStatus);
        }
        renderCardManager(allCards, cardStatus, handleCardToggle);
    });

    // 綁定事件
    document.getElementById('merchantSearch').addEventListener('input', handleMerchantSearch);
    document.getElementById('txnDate').addEventListener('change', checkDateStatus);
    document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);
    document.getElementById('managerToggleBtn').addEventListener('click', toggleManager);
    document.getElementById('meth-ap').addEventListener('click', () => updateMethod('ApplePay'));
    document.getElementById('meth-on').addEventListener('click', () => updateMethod('Online'));
});

// ── 事件處理 ──────────────────────────────────────────
function handleMerchantSearch() {
    const input = document.getElementById('merchantSearch').value;
    const match = findMerchant(input);
    renderMatchHint(match);
    if (match) {
        document.getElementById('category').value = match.cat;
        updateMethod(match.meth);
    }
}

function checkDateStatus() {
    const s = document.getElementById('txnDate').value;
    const d = new Date(s);
    isRedDay = [0, 5, 6].includes(d.getDay()) || HOLIDAYS_2026.includes(s);
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
}

function toggleManager() {
    const panel = document.getElementById('cardManagerPanel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

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

    const processed = allCards
        .filter(c => cardStatus[c.id])
        .map(c => {
            const baseRes = calcBaseReward(c, params);
            const crazyBonus = isCrazyCat(cat, sub) ? calcCrazyBonus(c, params) : 0;

            // 限時優惠
            let extraCash = 0;
            const activePromos = [];
            if (crazyBonus > 0) activePromos.push('狂賞派');

            allPromos.forEach(p => {
                const keyword = rawInput.toLowerCase();
                const isMatch = p.keywords.some(k => keyword.includes(k.toLowerCase()));
                const isActive = today >= new Date(p.startDate) && today <= new Date(p.endDate);
                const isBank = p.bank === c.bank;
                const isMinAmt = amt >= p.minAmt;

                if (isMatch && isActive && isBank && isMinAmt) {
                    extraCash += calcPromoBonus(p, params);
                    activePromos.push(p.name);
                }
            });

            return { card: c, baseRes, crazyBonus, extraCash, activePromos };
        });

    renderResults(processed);
}

// ── 輔助 ──────────────────────────────────────────────
function isCrazyCat(cat, sub) {
    const crazyCats = ['Dining', 'Electronics', 'Pet', 'Leisure', 'Medical', 'Travel', 'Jewelry'];
    return crazyCats.includes(cat) || (sub && sub.includes('CRAZY'));
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`無法載入 ${url}`);
    return res.json();
}
