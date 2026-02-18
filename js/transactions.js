// transactions.js — 交易記錄管理

let transactions = []; // { id, date, merchant, cat, amt, cardId, method }
let onChangeCallback = null;

/**
 * 載入交易記錄
 * @param {Array} data
 * @param {Function} onChange - 每次新增/刪除後觸發
 */
export function initTransactions(data, onChange) {
    transactions = data || [];
    onChangeCallback = onChange;
}

/**
 * 新增交易
 */
export function addTransaction(txn) {
    const record = { ...txn, id: Date.now().toString() };
    transactions.unshift(record); // 最新在最前
    onChangeCallback && onChangeCallback(transactions);
    return record;
}

/**
 * 刪除交易
 */
export function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    onChangeCallback && onChangeCallback(transactions);
}

/**
 * 取得所有交易
 */
export function getTransactions() {
    return transactions;
}

/**
 * 計算當月累積（自動判斷本月）
 * @returns {number}
 */
export function getCurrentMonthTotal() {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
        .filter(t => t.date.startsWith(ym))
        .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * 計算指定卡當月累積
 * @param {string} cardId
 * @returns {number}
 */
export function getCardMonthTotal(cardId) {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
        .filter(t => t.date.startsWith(ym) && t.cardId === cardId)
        .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * 渲染交易記錄列表
 * @param {Array} cards - cards.json 資料
 */
export function renderTransactions(cards) {
    const el = document.getElementById('txn-list');
    if (!el) return;

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = transactions.filter(t => t.date.startsWith(ym));
    const older = transactions.filter(t => !t.date.startsWith(ym));

    const monthTotal = thisMonth.reduce((s, t) => s + t.amt, 0);

    el.innerHTML = `
        <div class="txn-month-header">
            <span>本月 (${ym})</span>
            <span class="txn-month-total">合計 $${monthTotal.toLocaleString()}</span>
        </div>
        ${thisMonth.length === 0 ? '<div class="txn-empty">未有本月記錄</div>' : ''}
        ${thisMonth.map(t => txnRow(t, cards)).join('')}
        ${older.length > 0 ? `
            <div class="txn-month-header" style="margin-top:16px">
                <span>較早記錄</span>
            </div>
            ${older.map(t => txnRow(t, cards)).join('')}
        ` : ''}
    `;

    // 綁定刪除按鈕
    el.querySelectorAll('.txn-delete-btn').forEach(btn => {
        btn.onclick = () => {
            if (confirm('確定刪除此記錄？')) deleteTransaction(btn.dataset.id);
        };
    });
}

function txnRow(t, cards) {
    const card = cards.find(c => c.id === t.cardId);
    const cardName = card ? card.name : t.cardId;
    const bankClass = card ? card.bank : '';
    return `
        <div class="txn-row ${bankClass}-card">
            <div class="txn-info">
                <div class="txn-merchant">${t.merchant || t.cat}</div>
                <div class="txn-meta">${t.date} · ${cardName}</div>
            </div>
            <div class="txn-right">
                <div class="txn-amt">$${t.amt.toLocaleString()}</div>
                <button class="txn-delete-btn" data-id="${t.id}">✕</button>
            </div>
        </div>
    `;
}
