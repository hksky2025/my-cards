// progress.js — 進度面板：門檻進度 + 推廣剩餘天數

/**
 * 渲染進度面板
 * @param {Array} cards - 已啟用的卡片（來自 cards.json）
 * @param {Array} promos - 來自 promotions.json
 * @param {number} monthTotal - 當月累積簽賬
 * @param {Function} getCardTotal - (cardId) => number
 */
export function renderProgress(cards, promos, monthTotal, getCardTotal, getYearTotal, getCardYearTotal, getYearMonthly) {
    renderThresholdProgress(cards, monthTotal, getCardTotal);
    renderPromoCountdown(promos, cards);
    renderCapProgress(cards, getCardTotal);
}

// ── 門檻進度 ($5000) ─────────────────────────────────
function renderThresholdProgress(cards, monthTotal, getCardTotal) {
    const el = document.getElementById('progress-threshold');
    if (!el) return;

    const THRESHOLD = 5000;

    // 中銀受門檻影響的卡
    const bocCards = cards.filter(c => c.bank === 'boc' && c.logic?.requiresMet);
    // 恒生受門檻影響的卡
    const hangsengCards = cards.filter(c => c.bank === 'hangseng' && c.logic?.requiresMet);

    if (bocCards.length === 0 && hangsengCards.length === 0) {
        el.innerHTML = '';
        return;
    }

    // 各銀行當月累積簽賬（所有已啟用卡合計）
    const bocTotal = bocCards.reduce((sum, c) => sum + (getCardTotal ? getCardTotal(c.id) : 0), 0);
    const hangsengTotal = hangsengCards.reduce((sum, c) => sum + (getCardTotal ? getCardTotal(c.id) : 0), 0);

    function barHTML(label, bankClass, total, affectedCards) {
        const pct = Math.min((total / THRESHOLD) * 100, 100);
        const reached = total >= THRESHOLD;
        const remaining = Math.max(THRESHOLD - total, 0);
        const barColor = reached ? '#4caf50' : (bankClass === 'boc' ? '#c8960c' : '#008154');
        return `
            <div class="threshold-block">
                <div class="progress-title" style="margin-top:8px;">
                    <span>${label}</span>
                    <span class="progress-amt ${reached ? 'reached' : ''}">
                        $${total.toLocaleString()} / $${THRESHOLD.toLocaleString()}
                    </span>
                </div>
                <div class="progress-bar-wrap">
                    <div class="progress-bar" style="width:${pct}%; background:${barColor}"></div>
                </div>
                <div class="progress-sub">
                    ${reached
                        ? '✅ 已達門檻！優惠已激活'
                        : `⏳ 再簽 <strong>$${remaining.toLocaleString()}</strong> 可達門檻`}
                </div>
                <div class="progress-affected">
                    ${affectedCards.map(c => `
                        <span class="affected-tag ${c.bank}-tag ${reached ? 'active' : ''}">
                            ${c.name}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let html = '<div class="progress-card"><div class="progress-title"><span>📊 月度門檻進度（$5,000）</span></div>';

    if (bocCards.length > 0) {
        html += barHTML('🏦 中銀', 'boc', bocTotal, bocCards);
    }
    if (bocCards.length > 0 && hangsengCards.length > 0) {
        html += '<hr style="border:none;border-top:1px solid #eee;margin:12px 0;">';
    }
    if (hangsengCards.length > 0) {
        html += barHTML('🏦 恒生', 'hangseng', hangsengTotal, hangsengCards);
    }

    html += '</div>';
    el.innerHTML = html;
}

// ── 推廣倒數 ─────────────────────────────────────────
function renderPromoCountdown(promos, cards) {
    const el = document.getElementById('progress-promos');
    if (!el) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activePromos = promos.filter(p => {
        const end = new Date(p.endDate);
        return end >= today;
    });

    if (activePromos.length === 0) {
        el.innerHTML = '<div class="progress-card"><div class="progress-title">📅 推廣優惠</div><div class="progress-sub">目前沒有進行中優惠</div></div>';
        return;
    }

    el.innerHTML = `
        <div class="progress-card">
            <div class="progress-title">📅 推廣優惠倒數</div>
            ${activePromos.map(p => {
                const end = new Date(p.endDate);
                const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 7;
                const isWarning = daysLeft <= 14;
                const colorClass = isUrgent ? 'days-urgent' : isWarning ? 'days-warning' : 'days-ok';
                const bankCard = cards.find(c => c.bank === p.bank);
                const bankClass = p.bank;

                return `
                    <div class="promo-progress-row">
                        <div class="promo-progress-info">
                            <div class="promo-progress-name">${p.name}</div>
                            <div class="promo-progress-date">
                                ${p.startDate} → ${p.endDate}
                                ${p.remarks ? `<span class="promo-remark">${p.remarks}</span>` : ''}
                            </div>
                        </div>
                        <div class="days-badge ${colorClass}">
                            剩 ${daysLeft} 日
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ── 各卡封頂進度 ─────────────────────────────────────
function renderCapProgress(cards, getCardTotal) {
    const el = document.getElementById('progress-caps');
    if (!el) return;

    // 定義各卡封頂資訊
    const CAP_INFO = {
        red:    [{ label: '網購4%封頂', cap: 10000 }],
        sogo:   [{ label: '崇光 ApplePay 10.4%(手機5%上限$100/月)', cap: 0 }],
        motion: [{ label: '餐飲/網購6%封頂', cap: 3636 }],
        waku:   [{ label: '網購6%封頂', cap: 3571 }],
        mmpower:[{ label: '海外6%封頂', cap: Math.round(500/0.06) }, { label: '網購5%封頂', cap: Math.round(500/0.05) }],
    };

    const cardsWithCap = cards.filter(c => CAP_INFO[c.id]);
    if (cardsWithCap.length === 0) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
        <div class="progress-card">
            <div class="progress-title">🔒 本月封頂進度</div>
            ${cardsWithCap.map(c => {
                const total = getCardTotal(c.id);
                return CAP_INFO[c.id].map(info => {
                    const pct = Math.min((total / info.cap) * 100, 100);
                    const reached = total >= info.cap;
                    return `
                        <div class="cap-row">
                            <div class="cap-label">
                                <span class="cap-card-name">${c.name}</span>
                                <span class="cap-detail">${info.label}</span>
                            </div>
                            <div class="cap-bar-wrap">
                                <div class="cap-bar" style="width:${pct}%; background:${reached ? '#9e9e9e' : '#db0011'}"></div>
                            </div>
                            <div class="cap-numbers">
                                <span class="${reached ? 'cap-reached' : ''}">
                                    $${total.toLocaleString()} / $${info.cap.toLocaleString()}
                                </span>
                                ${reached ? '<span class="cap-full-tag">已封頂</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }).join('')}
        </div>
    `;
}


// ── 年度簽賬進度（各卡） ──────────────────────────────────
export function renderAnnualCardProgress(cards, getCardYearTotal) {
    const el = document.getElementById('progress-annual-cards');
    if (!el) return;

    const year = new Date().getFullYear();
    const cardsWithData = cards.filter(c => (getCardYearTotal ? getCardYearTotal(c.id) : 0) > 0);

    if (cardsWithData.length === 0) {
        el.innerHTML = '';
        return;
    }

    const BANK_COLOR = {
        hsbc: '#db0011', boc: '#c8960c', dbs: '#e2001a',
        hangseng: '#008154', citic: '#003087', ccb: '#da291c',
        sc: '#00a09b', mox: '#ff585d', aeon: '#0057a8', citi: '#003b8e'
    };

    const rows = cardsWithData.map(c => {
        const total = getCardYearTotal(c.id);
        const color = BANK_COLOR[c.bank] || '#888';
        return `
            <div class="annual-progress-row">
                <div class="annual-progress-info">
                    <span class="annual-progress-name">${c.name}</span>
                    <span class="annual-progress-amt">$${total.toLocaleString()}</span>
                </div>
                <div class="annual-progress-bar-wrap">
                    <div class="annual-progress-bar" style="background:${color};"></div>
                </div>
            </div>`;
    }).join('');

    const yearTotal = cardsWithData.reduce((s, c) => s + getCardYearTotal(c.id), 0);

    el.innerHTML = `
        <div class="progress-card">
            <div class="progress-title">📊 ${year}年度各卡簽賬進度</div>
            <div class="annual-progress-total">全年合計 <strong>$${yearTotal.toLocaleString()}</strong></div>
            ${rows}
        </div>`;

    // 計算最大值後設定長度
    const max = Math.max(...cardsWithData.map(c => getCardYearTotal(c.id)), 1);
    el.querySelectorAll('.annual-progress-row').forEach((row, i) => {
        const total = getCardYearTotal(cardsWithData[i].id);
        const pct = Math.max((total / max) * 100, 2);
        row.querySelector('.annual-progress-bar').style.width = `${pct}%`;
    });
}

// ── 年度進度 ──────────────────────────────────────────
export function renderAnnualProgress(cards, getCardYearTotal, getYearMonthly) {
    const el = document.getElementById('progress-annual');
    if (!el) return;

    const year = new Date().getFullYear();
    const monthly = getYearMonthly ? getYearMonthly() : {};
    const yearTotal = Object.values(monthly).reduce((s, v) => s + v, 0);
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const maxVal = Math.max(...Object.values(monthly), 1);
    const curMonth = new Date().getMonth() + 1;

    // 各卡年度合計
    const cardRows = cards.map(c => {
        const total = getCardYearTotal ? getCardYearTotal(c.id) : 0;
        return total > 0 ? `
            <div class="annual-card-row">
                <span class="annual-card-name">${c.name}</span>
                <span class="annual-card-amt">$${total.toLocaleString()}</span>
            </div>` : '';
    }).join('');

    // 月份長條圖
    const bars = monthNames.map((label, i) => {
        const m = i + 1;
        const val = monthly[m] || 0;
        const pct = Math.round((val / maxVal) * 100);
        const isCur = m === curMonth;
        const isFuture = m > curMonth;
        return `
            <div class="annual-bar-col">
                <div class="annual-bar-amt">${val > 0 ? '$' + (val >= 10000 ? (val/1000).toFixed(0)+'k' : val.toLocaleString()) : ''}</div>
                <div class="annual-bar-wrap">
                    <div class="annual-bar ${isCur ? 'current-month' : ''} ${isFuture ? 'future-month' : ''}"
                         style="height:${isFuture ? 0 : Math.max(pct, val > 0 ? 4 : 0)}%"></div>
                </div>
                <div class="annual-bar-label ${isCur ? 'current-label' : ''}">${label}</div>
            </div>`;
    }).join('');

    el.innerHTML = `
        <div class="progress-card">
            <div class="progress-title">📆 ${year}年度簽賬總覽</div>
            <div class="annual-total">全年合計 <strong>$${yearTotal.toLocaleString()}</strong></div>
            <div class="annual-chart">${bars}</div>
            <div class="annual-cards">${cardRows || '<div class="annual-empty">今年暫無記錄</div>'}</div>
        </div>`;
}
