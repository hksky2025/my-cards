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
 * 計算當年全部簽賬總計
 */
export function getCurrentYearTotal() {
    const year = new Date().getFullYear();
    return transactions
        .filter(t => t.date.startsWith(`${year}-`))
        .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * 計算指定卡當年累積
 */
export function getCardYearTotal(cardId) {
    const year = new Date().getFullYear();
    return transactions
        .filter(t => t.date.startsWith(`${year}-`) && t.cardId === cardId)
        .reduce((sum, t) => sum + t.amt, 0);
}

// 指定卡按類別/方式/sub篩選當月簽賬（用於 MMPower、Bliss 上限追蹤）
export function getCardMonthCatTotal(cardId, cats, meths, sub) {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
        .filter(t => {
            if (!t.date.startsWith(ym) || t.cardId !== cardId) return false;
            if (cats && cats.length && !cats.includes(t.cat)) return false;
            if (meths && meths.length && !meths.includes(t.method)) return false;
            // sub 篩選：傳入 sub 字串時，只計匹配的；傳入 null 時計全部（包括冇 sub 的）
            if (sub !== undefined && sub !== null) {
                if (t.sub !== sub) return false;
            }
            return true;
        })
        .reduce((sum, t) => sum + t.amt, 0);
}

// 建銀保費年度合計（用於追蹤 $42,000 信用額上限）
export function getCCBInsuranceYearTotal() {
    const year = new Date().getFullYear();
    return transactions
        .filter(t => t.date.startsWith(`${year}-`) && ['ccb_eye','aia'].includes(t.cardId) && t.cat === 'Insurance')
        .reduce((sum, t) => sum + t.amt, 0);
}

/**
 * 按月份分組當年簽賬
 */
export function getYearMonthlyBreakdown() {
    const year = new Date().getFullYear();
    const monthly = {};
    for (let m = 1; m <= 12; m++) {
        const ym = `${year}-${String(m).padStart(2, '0')}`;
        monthly[m] = transactions
            .filter(t => t.date.startsWith(ym))
            .reduce((sum, t) => sum + t.amt, 0);
    }
    return monthly;
}

/**
 * 渲染交易記錄列表
 * @param {Array} cards - cards.json 資料
 */

// ── 分類統計 ──────────────────────────────────────────
const CAT_META = {
    'Dining':      { label: '餐飲食肆',       icon: '🍽️' },
    'Super':       { label: '超級市場',       icon: '🛒' },
    'Online':      { label: '一般網購',       icon: '🛍️' },
    'Electronics': { label: '電子產品/電訊',  icon: '🔌' },
    'Transport':   { label: '交通/叫車/油站', icon: '🚌' },
    'Home':        { label: '家居用品',       icon: '🏠' },
    'Pet':         { label: '寵物護理',       icon: '🐾' },
    'Leisure':     { label: '休閒娛樂',       icon: '🎡' },
    'Medical':     { label: '醫療服務',       icon: '🏥' },
    'Sport':       { label: '運動服飾',       icon: '👟' },
    'Fitness':     { label: '健身中心',       icon: '🏋️' },
    'Travel':      { label: '旅遊機票/酒店',  icon: '✈️' },
    'Jewelry':     { label: '珠寶服飾',       icon: '💍' },
    'Coffee':      { label: '咖啡輕食',       icon: '☕' },
    'Overseas':    { label: '海外外幣',       icon: '🌍' },
    'Insurance':   { label: '保險保費',       icon: '🛡️' },
    'SOGO':        { label: '崇光百貨/SOGO', icon: '🏬' },
    'General':     { label: '一般本地消費',   icon: '🏷️' },
};


export function getLastMonthTotal() {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ym = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
    return transactions
        .filter(t => t.date.startsWith(ym))
        .reduce((sum, t) => sum + t.amt, 0);
}

export function renderCatStats() {
    const el = document.getElementById('txn-cat-stats');
    if (!el) return;

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = transactions.filter(t => t.date.startsWith(ym));

    if (thisMonth.length === 0) {
        el.innerHTML = '';
        return;
    }

    // 統計每個類別
    const totals = {};
    thisMonth.forEach(t => {
        const cat = t.cat || 'General';
        totals[cat] = (totals[cat] || 0) + t.amt;
    });

    // 按金額排序
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const grandTotal = thisMonth.reduce((s, t) => s + t.amt, 0);
    const maxAmt = sorted[0][1];

    const rows = sorted.map(([cat, amt]) => {
        const meta = CAT_META[cat] || { label: cat, icon: '🏷️' };
        const pct = Math.round((amt / grandTotal) * 100);
        const barPct = Math.round((amt / maxAmt) * 100);
        return `
        <div class="cat-stat-row">
            <div class="cat-stat-left">
                <span class="cat-stat-icon">${meta.icon}</span>
                <span class="cat-stat-label">${meta.label}</span>
            </div>
            <div class="cat-stat-bar-wrap">
                <div class="cat-stat-bar" style="width:${barPct}%"></div>
            </div>
            <div class="cat-stat-right">
                <span class="cat-stat-amt">$${amt.toLocaleString()}</span>
                <span class="cat-stat-pct">${pct}%</span>
            </div>
        </div>`;
    }).join('');

    el.innerHTML = `
        <div class="cat-stats-card">
            <div class="cat-stats-title">📂 本月分類統計
                <span class="cat-stats-total">合計 $${grandTotal.toLocaleString()}</span>
            </div>
            ${rows}
        </div>`;
}

export function renderTransactions(cards) {
    const el = document.getElementById('txn-list');
    if (!el) return;

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = transactions.filter(t => t.date.startsWith(ym));
    const older = transactions.filter(t => !t.date.startsWith(ym));

    const monthTotal = thisMonth.reduce((s, t) => s + t.amt, 0);

    // 較早記錄按月分組
    const olderGroups = {};
    older.forEach(t => {
        const grpYm = t.date.substring(0, 7); // 'YYYY-MM'
        if (!olderGroups[grpYm]) olderGroups[grpYm] = [];
        olderGroups[grpYm].push(t);
    });
    // 按月份倒序排列（最近先）
    const sortedGrpKeys = Object.keys(olderGroups).sort((a, b) => b.localeCompare(a));

    // 月份 label helper
    function ymLabel(ymStr) {
        const [y, m] = ymStr.split('-');
        return `${y}年${parseInt(m)}月`;
    }

    const olderHTML = sortedGrpKeys.map(grpYm => {
        const grpTxns = olderGroups[grpYm].sort((a, b) => b.date.localeCompare(a.date));
        const grpTotal = grpTxns.reduce((s, t) => s + t.amt, 0);
        const grpId = 'grp-' + grpYm.replace('-', '');
        return `
            <div class="txn-month-header txn-group-toggle" data-grp="${grpId}" style="margin-top:12px;cursor:pointer;">
                <span>📅 ${ymLabel(grpYm)}</span>
                <span style="display:flex;align-items:center;gap:8px;">
                    <span class="txn-month-total">$${grpTotal.toLocaleString()}</span>
                    <span class="txn-grp-arrow" id="arrow-${grpId}">▾</span>
                </span>
            </div>
            <div class="txn-grp-body" id="${grpId}">
                ${grpTxns.map(t => txnRow(t, cards)).join('')}
            </div>`;
    }).join('');

    el.innerHTML = `
        <div class="txn-month-header">
            <span>本月 (${ym})</span>
            <span class="txn-month-total">合計 $${monthTotal.toLocaleString()}</span>
        </div>
        ${thisMonth.length === 0 ? '<div class="txn-empty">未有本月記錄</div>' : ''}
        ${thisMonth.sort((a,b) => b.date.localeCompare(a.date)).map(t => txnRow(t, cards)).join('')}
        ${olderHTML}
    `;

    // 摺疊/展開舊月份
    el.querySelectorAll('.txn-group-toggle').forEach(header => {
        header.addEventListener('click', () => {
            const grpId = header.dataset.grp;
            const body = document.getElementById(grpId);
            const arrow = document.getElementById('arrow-' + grpId);
            if (!body) return;
            const isOpen = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : 'block';
            if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
        });
    });

    // 預設摺疊所有舊月份
    el.querySelectorAll('.txn-grp-body').forEach(body => {
        body.style.display = 'none';
    });
    el.querySelectorAll('.txn-grp-arrow').forEach(arrow => {
        arrow.textContent = '▸';
    });

    // 綁定刪除按鈕
    el.querySelectorAll('.txn-delete-btn').forEach(btn => {
        btn.onclick = () => {
            if (window.handleDeleteTxn) {
                window.handleDeleteTxn(btn.dataset.id);
            } else {
                if (confirm('確定刪除此記錄？')) deleteTransaction(btn.dataset.id);
            }
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
