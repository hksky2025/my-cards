// progress.js — 進度面板：門檻進度 + 推廣剩餘天數

/**
 * 渲染進度面板
 * @param {Array} cards - 已啟用的卡片（來自 cards.json）
 * @param {Array} promos - 來自 promotions.json
 * @param {number} monthTotal - 當月累積簽賬
 * @param {Function} getCardTotal - (cardId) => number
 */
export function renderProgress(cards, promos, monthTotal, getCardTotal) {
    renderThresholdProgress(cards, monthTotal);
    renderPromoCountdown(promos, cards);
    renderCapProgress(cards, getCardTotal);
}

// ── 門檻進度 ($5000) ─────────────────────────────────
function renderThresholdProgress(cards, monthTotal) {
    const el = document.getElementById('progress-threshold');
    if (!el) return;

    const THRESHOLD = 5000;
    const pct = Math.min((monthTotal / THRESHOLD) * 100, 100);
    const reached = monthTotal >= THRESHOLD;
    const remaining = Math.max(THRESHOLD - monthTotal, 0);

    // 找出受門檻影響的啟用卡
    const affectedCards = cards.filter(c => c.logic?.requiresMet || c.crazyEligible);

    el.innerHTML = `
        <div class="progress-card">
            <div class="progress-title">
                <span>📊 月度門檻進度</span>
                <span class="progress-amt ${reached ? 'reached' : ''}">
                    $${monthTotal.toLocaleString()} / $${THRESHOLD.toLocaleString()}
                </span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar" style="width:${pct}%; background:${reached ? '#4caf50' : '#db0011'}"></div>
            </div>
            <div class="progress-sub">
                ${reached
                    ? '✅ 已達門檻！以下優惠已激活'
                    : `⏳ 再簽 <strong>$${remaining.toLocaleString()}</strong> 可達門檻`}
            </div>
            ${affectedCards.length > 0 ? `
                <div class="progress-affected">
                    ${affectedCards.map(c => `
                        <span class="affected-tag ${c.bank}-tag ${reached ? 'active' : ''}">
                            ${c.name}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
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
        sogo:   [{ label: 'ApplePay 5.4%封頂', cap: 2000 }],
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
