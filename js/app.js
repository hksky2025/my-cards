// app.js — 主程式入口 (v2.2: 修復卡片選擇器時序問題)

import { calcBaseReward, calcCrazyBonus, calcPromoBonus } from './calculator.js';
import { loadMerchants, findMerchant } from './matcher.js';
import { renderResults, renderCardManager, renderMatchHint, renderDateStatus } from './renderer.js';
import { initAuth, loadCardStatus, saveCardStatus, loadTransactions, saveTransaction, removeTransaction } from './firebase.js';
import { initTransactions, addTransaction, deleteTransaction, getCurrentMonthTotal, getCardMonthTotal, renderTransactions, getTransactions } from './transactions.js';
import { renderProgress } from './progress.js';

const HOLIDAYS_2026 = [
    "2026-01-01","2026-02-17","2026-02-18","2026-02-19",
    "2026-04-03","2026-04-04","2026-04-06","2026-04-07",
    "2026-05-01","2026-05-25","2026-06-19","2026-07-01",
    "2026-09-26","2026-10-01","2026-10-19","2026-12-25","2026-12-26"
];

// 狂賞派專用紅日（2026年1月1日至6月30日推廣期，每個星期日+指定假期）
// 來源：中銀狂賞派條款及細則
const BOC_CRAZY_RED_DAYS = new Set([
    "2026-01-01","2026-01-04","2026-01-11","2026-01-18","2026-01-25",
    "2026-02-01","2026-02-08","2026-02-15","2026-02-17","2026-02-18","2026-02-19","2026-02-22",
    "2026-03-01","2026-03-08","2026-03-15","2026-03-22","2026-03-29",
    "2026-04-03","2026-04-04","2026-04-05","2026-04-06","2026-04-07","2026-04-12","2026-04-19","2026-04-26",
    "2026-05-01","2026-05-03","2026-05-10","2026-05-17","2026-05-24","2026-05-25","2026-05-31",
    "2026-06-07","2026-06-14","2026-06-19","2026-06-21","2026-06-28"
]);

let allCards = [], allPromos = [], cardStatus = {};
let globalMethod = 'ApplePay', isRedDay = false, isCrazyRedDay = false;

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

    // 匯出 Excel
    document.getElementById('exportExcelBtn').addEventListener('click', () => {
        const txns = getTransactions();
        if (!txns.length) return alert('未有任何交易記錄');

        const CAT_LABELS = {
            Dining:'餐飲食肆', Online:'一般網購', Electronics:'電子產品/電訊',
            Super:'超級市場', Transport:'交通/叫車/油站', Home:'家居用品',
            Pet:'寵物護理', Leisure:'休閒娛樂', Medical:'醫療服務',
            Sport:'運動服飾', Fitness:'健身中心', Travel:'旅遊機票/酒店',
            Jewelry:'珠寶服飾', Coffee:'咖啡輕食', Overseas:'海外外幣',
            General:'一般本地消費'
        };
        const METH_LABELS = { ApplePay:'Apple Pay / 實體', Online:'網上簽賬', Octopus:'八達通' };

        const rows = txns.map(t => {
            const card = allCards.find(c => c.id === t.cardId);
            return {
                '日期': t.date,
                '商戶': t.merchant || '',
                '類別': CAT_LABELS[t.cat] || t.cat,
                '金額 (HK$)': t.amt,
                '信用卡': card ? card.name : t.cardId,
                '付款方式': METH_LABELS[t.method] || t.method || '',
            };
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [12, 20, 16, 12, 18, 16].map(w => ({ wch: w }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '交易記錄');

        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `智能簽賬軍師_交易記錄_${today}.xlsx`);
    });

    // 匯入 Excel
    document.getElementById('importExcelInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws);

                const CAT_MAP = {
                    '餐飲食肆':'Dining', '一般網購':'Online', '電子產品/電訊':'Electronics',
                    '超級市場':'Super', '交通/叫車/油站':'Transport', '家居用品':'Home',
                    '寵物護理':'Pet', '休閒娛樂':'Leisure', '醫療服務':'Medical',
                    '運動服飾':'Sport', '健身中心':'Fitness', '旅遊機票/酒店':'Travel',
                    '珠寶服飾':'Jewelry', '咖啡輕食':'Coffee', '海外外幣':'Overseas',
                    '一般本地消費':'General'
                };
                const METH_MAP = { 'Apple Pay / 實體':'ApplePay', '網上簽賬':'Online', '八達通':'Octopus' };

                let imported = 0;
                for (const row of rows) {
                    const cardName = row['信用卡'] || '';
                    const card = allCards.find(c => c.name === cardName);
                    if (!row['日期'] || !row['金額 (HK$)']) continue;

                    const txn = {
                        date: String(row['日期']).substring(0, 10),
                        merchant: row['商戶'] || '',
                        cat: CAT_MAP[row['類別']] || 'General',
                        amt: Number(row['金額 (HK$)']),
                        cardId: card ? card.id : cardName,
                        method: METH_MAP[row['付款方式']] || 'ApplePay',
                    };
                    const saved = await saveTransaction(txn);
                    if (saved) imported++;
                }
                alert(`✅ 成功匯入 ${imported} 筆記錄`);
                renderTransactions(allCards);
            } catch (err) {
                alert('❌ 匯入失敗，請確認檔案格式正確');
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; // reset input
    });
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
            let needSave = false;
            // 所有卡片：若從未出現在 Firebase 記錄，預設開啟
            allCards.forEach(c => {
                if (!(c.id in saved)) {
                    cardStatus[c.id] = true;
                    needSave = true;
                }
            });
            if (needSave) await saveCardStatus(cardStatus);
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
    const current = sel.value;
    sel.innerHTML = '<option value="">-- 選擇信用卡 --</option>';

    // 按銀行次序排列，同卡片管理面板一致
    const BANK_ORDER = ['hsbc', 'boc', 'hangseng', 'sc', 'dbs', 'citi', 'citic', 'ccb', 'mox', 'aeon'];
    const BANK_LABELS = { hsbc: '匯豐', boc: '中銀', hangseng: '恒生', sc: '渣打', dbs: 'DBS', citi: 'Citi', citic: '中信', ccb: '建行', mox: 'Mox', aeon: 'AEON' };

    BANK_ORDER.forEach(bankId => {
        const bankCards = allCards.filter(c => c.bank === bankId);
        if (!bankCards.length) return;

        // 加銀行分隔標題
        const group = document.createElement('optgroup');
        group.label = BANK_LABELS[bankId];
        bankCards.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = cardStatus[c.id] ? c.name : `${c.name}（未啟用）`;
            group.appendChild(opt);
        });
        sel.appendChild(group);
    });

    if (current) sel.value = current;
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
    const d = new Date(s);
    isRedDay = [0,5,6].includes(d.getDay()) || HOLIDAYS_2026.includes(s);
    isCrazyRedDay = BOC_CRAZY_RED_DAYS.has(s);
    renderDateStatus(isRedDay, isCrazyRedDay);
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
    // 中信 Motion：當月累積零售簽賬是否已達 $3,800
    const motionMonthSpent = getCardMonthTotal('citic_motion');
    const motionMet = (motionMonthSpent + amt) >= 3800;

    const params = { amt, cat, meth: globalMethod, isMet, sub, isRedDay, isCrazyRedDay, motionMet };

    const processed = [];
    for (const c of allCards.filter(c => cardStatus[c.id])) {
        // DBS Eminent：每月首$8,000指定類別@5%；其他零售首$20,000@1%，超額均降@0.4%
        let adjustedParams = { ...params };
        if (c.id === 'dbs_eminent') {
            // 排除海外港幣交易（Netflix/Spotify/App Store/Airbnb 等）：唔計任何回贈
            if (sub && sub.includes('OVERSEAS_HKD')) {
                processed.push({ card: c, baseRes: { val: 0, rate: '不適用(海外港幣)' }, crazyBonus: 0, extraCash: 0, activePromos: ['⚠️ 海外港幣不計回贈'] });
                continue;
            }
            const isBonus = c.logic.bonusCats.includes(cat) && amt >= c.logic.minAmt;
            if (isBonus) {
                const capSpent = getCardMonthTotal('dbs_eminent');
                const remaining = Math.max(0, c.logic.bonusCap - capSpent);
                if (remaining <= 0) {
                    // 指定類別已爆 $8,000，降至 0.4%
                    adjustedParams = { ...params, cat: 'Override0.4' };
                } else if (amt > remaining) {
                    // 跨越封頂：部分@5%，部分@0.4%
                    const val = remaining * c.logic.bonusRate + (amt - remaining) * c.logic.overCapRate;
                    const baseRes = { val, rate: `5%(首$${remaining}) + 0.4%(超額)` };
                    processed.push({ card: c, baseRes, crazyBonus: 0, extraCash: 0, activePromos: [`DBS指定類別首$${remaining}@5%`] });
                    continue;
                }
            } else if (!c.logic.bonusCats.includes(cat)) {
                // 其他零售：追蹤 $20,000 封頂
                const retailSpent = getCardMonthTotal('dbs_eminent_retail');
                const retailRemaining = Math.max(0, c.logic.retailCap - retailSpent);
                if (retailRemaining <= 0) {
                    // 零售已爆 $20,000，降至 0.4%
                    adjustedParams = { ...params, cat: 'Override0.4' };
                } else if (amt > retailRemaining) {
                    // 跨越封頂：部分@1%，部分@0.4%
                    const val = retailRemaining * c.logic.retailRate + (amt - retailRemaining) * c.logic.overCapRate;
                    const baseRes = { val, rate: `1%(首$${retailRemaining}) + 0.4%(超額)` };
                    processed.push({ card: c, baseRes, crazyBonus: 0, extraCash: 0, activePromos: [`DBS零售首$${retailRemaining}@1%`] });
                    continue;
                }
            }
        }
        const baseRes = calcBaseReward(c, adjustedParams);

        // 中信 Motion：每月回贈上限 $200
        if (c.id === 'citic_motion' && baseRes.val > c.logic.bonusCap) {
            baseRes.val = c.logic.bonusCap;
            baseRes.rate = `6% (已達上限 $${c.logic.bonusCap})`;
        }

        // Citi The Club：每月回贈上限 $300
        if (c.id === 'citi_club' && baseRes.val > 300) {
            baseRes.val = 300;
            baseRes.rate = `4% (已達上限 $300)`;
        }

        const crazyBonus = isCrazyCat(cat, sub) ? calcCrazyBonus(c, params) : 0;
        let extraCash = 0;
        const activePromos = [];
        if (crazyBonus > 0) activePromos.push('狂賞派');
        allPromos.forEach(p => {
            const kw = rawInput.toLowerCase();
            const keywordMatch = p.keywords.some(k => kw.includes(k.toLowerCase()));
            const dateOk = today >= new Date(p.startDate) && today <= new Date(p.endDate);
            const bankMatch = p.bank === c.bank;
            const cardMatch = !p.cardId || p.cardId === c.id;
            const notExcluded = !p.excludeSubs || !sub || !p.excludeSubs.includes(sub);
            const amtOk = amt >= p.minAmt;
            if (keywordMatch && dateOk && bankMatch && cardMatch && notExcluded && amtOk) {
                extraCash += calcPromoBonus(p, params);
                activePromos.push(p.name);
            }
        });
        processed.push({ card: c, baseRes, crazyBonus, extraCash, activePromos });
    }

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
