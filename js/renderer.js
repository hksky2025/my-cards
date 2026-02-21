// renderer.js — 所有 DOM 操作集中在這裡

const BANK_COLORS = {
    boc: '#c8960c', hsbc: '#db0011', hangseng: '#008154',
    sc: '#1a56a0', ccb: '#003b8e', aeon: '#800080',
    citic: '#7b5ea7', mox: '#05d5a1', dbs: '#e85d04', citi: '#003087'
};

const MILES_COLOR = '#004a99';
const CASH_COLOR = '#d32f2f';

/**
 * 渲染完整結果
 * @param {Array} processed - 已計算好的卡片結果陣列
 */
export function renderResults(processed) {
    const resultsEl = document.getElementById('results');
    const milesEl = document.getElementById('miles-results');
    const cashEl = document.getElementById('cash-results');

    resultsEl.style.display = 'block';
    milesEl.innerHTML = '';
    cashEl.innerHTML = '';

    // 里數排序：只顯示有里數的卡
    processed
        .filter(c => (c.card.type === 'miles' || c.card.type === 'both') && c.baseRes.miles > 0)
        .sort((a, b) => b.baseRes.miles - a.baseRes.miles)
        .forEach(c => milesEl.appendChild(createCardEl(c, true)));

    // 現金排序
    processed
        .filter(c => c.card.type === 'cash' || c.card.type === 'both')
        .sort((a, b) => (b.baseRes.val + b.extraCash + b.crazyBonus) - (a.baseRes.val + a.extraCash + a.crazyBonus))
        .forEach(c => cashEl.appendChild(createCardEl(c, false)));
}

/**
 * 渲染卡片管理面板（分銀行分組）
 * @param {Array} cards - cards.json 資料
 * @param {Object} cardStatus - { cardId: boolean }
 * @param {Function} onToggle - callback(cardId, newStatus)
 */
export function renderCardManager(cards, cardStatus, onToggle) {
    const BANK_LABELS = {
        hsbc: '匯豐', boc: '中銀', hangseng: '恒生',
        sc: '渣打', dbs: '星展', citi: 'Citi', citic: '中信', ccb: '建行', mox: 'Mox', aeon: 'AEON'
    };

    const container = document.getElementById('bankGroupsContainer');
    container.innerHTML = '';

    Object.entries(BANK_LABELS).forEach(([bankId, label]) => {
        const bankCards = cards.filter(c => c.bank === bankId);
        if (!bankCards.length) return;

        const group = document.createElement('div');
        group.innerHTML = `<div class="bank-name-label">${label}</div><div class="toggle-grid"></div>`;

        bankCards.forEach(c => {
            const btn = document.createElement('button');
            btn.textContent = c.name;
            btn.className = `toggle-card-btn ${bankId} ${cardStatus[c.id] ? 'active' : ''}`;
            btn.onclick = () => {
                const next = !cardStatus[c.id];
                btn.classList.toggle('active', next);
                onToggle(c.id, next);
            };
            group.querySelector('.toggle-grid').appendChild(btn);
        });

        container.appendChild(group);
    });
}

/**
 * 更新商戶識別提示
 * @param {Object|null} match
 */
export function renderMatchHint(match) {
    const el = document.getElementById('matchHint');
    el.textContent = match ? `✅ 自動識別: ${match.name}` : '';
}

/**
 * 更新日期狀態 Tag
 * @param {boolean} isRed
 */
export function renderDateStatus(isRed, isCrazyRed = false, isMannRed = false) {
    const el = document.getElementById('dateStatus');
    const parts = [];
    if (isCrazyRed) parts.push('中銀 Cheers VI / Sogo Visa 狂賞派' + (isRed ? '+5%' : '+5%'));
    if (isMannRed) parts.push('HSBC 萬寧額外+5%（星期五至日）');

    if (isCrazyRed || isMannRed) {
        el.innerHTML = `🔥 今日紅日優惠激活<br><span style="font-size:11px;font-weight:500;opacity:0.9;">${parts.join(' ｜ ')}</span>`;
        el.className = 'date-status-tag is-red';
    } else {
        el.textContent = '📅 平日（中銀 Cheers VI / Sogo Visa 額外+2%）';
        el.className = 'date-status-tag is-normal';
    }
}

// ── 內部輔助 ──────────────────────────────────────────
function createCardEl(c, isMile) {
    const total = (c.baseRes.val + c.extraCash + c.crazyBonus).toFixed(1);
    const color = BANK_COLORS[c.card.bank] || '#ccc';
    const valueColor = isMile ? MILES_COLOR : CASH_COLOR;

    const div = document.createElement('div');
    div.className = `card-box ${c.card.bank}-card`;
    div.style.borderLeftColor = color;

    const promoTags = c.activePromos.map(p => `<span class="promo-tag">🔥 ${p}</span>`).join('');
    const milesExtra = isMile && (c.extraCash + c.crazyBonus) > 0
        ? `<div style="font-size:11px;color:orange">+$${(c.extraCash + c.crazyBonus).toFixed(0)}</div>`
        : '';

    const milesDisplay = isMile
        ? `<div style="font-size:18px;font-weight:700;color:${valueColor}">${c.baseRes.miles} 里</div>`
        : `<div style="font-size:18px;font-weight:700;color:${valueColor}">$${total}</div>`;

    div.innerHTML = `
        <div class="card-top">
            <div class="card-name">${c.card.name}${promoTags ? '<br>' + promoTags : ''}</div>
            <div class="earn-val" style="color:${valueColor}">
                ${milesDisplay}
                ${milesExtra}
            </div>
        </div>
        <div class="card-desc">基礎回饋: ${c.baseRes.rate}</div>
        ${c.card.notes ? `<div class="remark-tip">${c.card.notes}</div>` : ''}
        <div class="card-bottom">
            <button class="record-btn" data-cardid="${c.card.id}">記帳</button>
        </div>
    `;

    // 點擊記帳按鈕
    div.querySelector('.record-btn').addEventListener('click', () => {
        const sel = document.getElementById('txnCardSelect');
        if (sel) sel.value = c.card.id;
        window._quickRecordCardId = c.card.id;
        document.getElementById('addTxnBtn').click();
    });

    return div;
}
