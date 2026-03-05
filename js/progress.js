// progress.js — 進度面板：門檻進度 + 推廣剩餘天數

/**
 * 渲染進度面板
 * @param {Array} cards - 已啟用的卡片（來自 cards.json）
 * @param {Array} promos - 來自 promotions.json
 * @param {number} monthTotal - 當月累積簽賬
 * @param {Function} getCardTotal - (cardId) => number
 */
export function renderProgress(cards, promos, monthTotal, getCardTotal, getYearTotal, getCardYearTotal, getYearMonthly, getCCBInsuranceYear) {
    renderThresholdProgress(cards, monthTotal, getCardTotal, getCCBInsuranceYear);
    renderPromoCountdown(promos, cards, getCardTotal);
    renderCapProgress(cards, getCardTotal);
}

// ── 門檻進度 ($5000) ─────────────────────────────────
function renderThresholdProgress(cards, monthTotal, getCardTotal, getCCBInsuranceYear) {
    const el = document.getElementById('progress-threshold');
    if (!el) return;

    const THRESHOLD = 5000;

    // 中銀受門檻影響的卡
    const bocCards = cards.filter(c => c.bank === 'boc' && c.logic?.requiresMet);
    // 恒生受門檻影響的卡
    const hangsengCards = cards.filter(c => c.bank === 'hangseng' && c.logic?.requiresMet);
    // 獨立門檻的卡（Bliss $2,000 / BEA World $4,000 / BEA Titanium $2,000）
    const indivThreshCards = cards.filter(c => ['bliss','bea_world','bea_titanium'].includes(c.id));

    if (bocCards.length === 0 && hangsengCards.length === 0 && indivThreshCards.length === 0) {
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
    // 建銀保費年度上限追蹤（信用額 $130,000）
    const ccbCards = cards.filter(c => c.bank === 'ccb');
    if (ccbCards.length > 0 && getCCBInsuranceYear) {
        const ccbInsYear = getCCBInsuranceYear();
        const CCB_CAP = 130000;
        const ccbPct = Math.min((ccbInsYear / CCB_CAP) * 100, 100);
        const reached = ccbInsYear >= CCB_CAP;
        html += `
        <div class="progress-card" style="margin-top:8px;">
            <div class="progress-title">🏦 建銀 年度保費上限進度（信用額 $${CCB_CAP.toLocaleString()}）</div>
            <div class="progress-row">
                <span class="progress-label">保費簽賬</span>
                <span class="progress-amt ${reached ? 'reached' : ''}">$${ccbInsYear.toLocaleString()} / $${CCB_CAP.toLocaleString()}</span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar" style="width:${ccbPct}%;background:${reached ? '#4caf50' : '#da291c'};"></div>
            </div>
            ${reached ? '' : `<div class="progress-remaining">⏳ 再簽 $${(CCB_CAP - ccbInsYear).toLocaleString()} 達年度上限</div>`}
        </div>`;
    }

    if (bocCards.length > 0 && hangsengCards.length > 0) {
        html += '<hr style="border:none;border-top:1px solid #eee;margin:12px 0;">';
    }
    if (hangsengCards.length > 0) {
        html += barHTML('🏦 恒生', 'hangseng', hangsengTotal, hangsengCards);
    }

    // 獨立門檻卡（Bliss / BEA）
    if (indivThreshCards.length > 0) {
        indivThreshCards.forEach(c => {
            const thresh = c.logic.monthlyThreshold;
            const spent = getCardTotal ? getCardTotal(c.id) : 0;
            const pct = Math.min((spent / thresh) * 100, 100);
            const reached = spent >= thresh;
            const remaining = Math.max(thresh - spent, 0);
            const bankColor = { boc: '#c8960c', bea: '#c8102e' }[c.bank] || '#888';
            html += `
            <div class="threshold-block">
                <div class="progress-title" style="margin-top:8px;">
                    <span>${c.name}</span>
                    <span class="progress-amt ${reached ? 'reached' : ''}">
                        $${spent.toLocaleString()} / $${thresh.toLocaleString()}
                    </span>
                </div>
                <div class="progress-bar-wrap">
                    <div class="progress-bar" style="width:${pct}%; background:${reached ? '#4caf50' : bankColor}"></div>
                </div>
                <div class="progress-sub">
                    ${reached ? '✅ 已達門檻！優惠已激活' : `⏳ 再簽 <strong>$${remaining.toLocaleString()}</strong> 可達門檻`}
                </div>
            </div>`;
        });
    }

    html += '</div>';
    el.innerHTML = html;
}

// ── 推廣倒數 ─────────────────────────────────────────
function renderPromoCountdown(promos, cards, getCardTotal) {
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

    // 分開春日自主賞同一般推廣
    const springPromos = activePromos.filter(p => p.springPromo);
    const regularPromos = activePromos.filter(p => !p.springPromo);

    // 計算東亞所有卡當月簽賬合計
    const beaCards = cards.filter(c => c.bank === 'bea');
    const beaMonthTotal = getCardTotal
        ? beaCards.reduce((sum, c) => sum + getCardTotal(c.id), 0)
        : 0;

    // 春日自主賞：顯示當前進行中階段
    const currentSpring = springPromos.find(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return today >= start && today <= end;
    }) || springPromos[0];

    let springHTML = '';
    if (currentSpring) {
        const end = new Date(currentSpring.endDate);
        const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        const colorClass = daysLeft <= 7 ? 'days-urgent' : daysLeft <= 14 ? 'days-warning' : 'days-ok';
        const tiers = currentSpring.tiers || [];

        const currentTier = [...tiers].reverse().find(t => beaMonthTotal >= t.threshold);
        const nextTier = tiers.find(t => beaMonthTotal < t.threshold);
        const maxTier = tiers[tiers.length - 1];
        const progressTarget = nextTier ? nextTier.threshold : maxTier.threshold;
        const pct = Math.min((beaMonthTotal / progressTarget) * 100, 100);
        const remaining = Math.max(progressTarget - beaMonthTotal, 0);

        springHTML = `
        <div class="progress-card" style="border-left:4px solid #c8102e;margin-bottom:10px;">
            <div class="progress-title">
                <span>🌸 ${currentSpring.name}</span>
                <div class="days-badge ${colorClass}">剩 ${daysLeft} 日</div>
            </div>
            <div class="progress-sub" style="margin:2px 0 8px;">${currentSpring.startDate} → ${currentSpring.endDate}</div>
            <div class="progress-title" style="margin-top:4px;">
                <span>東亞卡合計簽賬</span>
                <span class="progress-amt ${currentTier ? 'reached' : ''}">$${beaMonthTotal.toLocaleString()}</span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar" style="width:${pct}%;background:${currentTier ? '#4caf50' : '#c8102e'};"></div>
            </div>
            <div class="progress-sub" style="margin-top:4px;">
                ${currentTier
                    ? `✅ 已達 <strong>$${currentTier.threshold.toLocaleString()}</strong>，獲 <strong>$${currentTier.reward}</strong> 現金回贈${nextTier ? `；再簽 <strong>$${remaining.toLocaleString()}</strong> 升至 $${nextTier.reward}` : '（已達最高獎賞！🎉）'}`
                    : `⏳ 再簽 <strong>$${remaining.toLocaleString()}</strong> 達 $${progressTarget.toLocaleString()} 獲 $${(nextTier || maxTier).reward} 回贈`
                }
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                ${tiers.map(t => {
                    const achieved = beaMonthTotal >= t.threshold;
                    return `<span style="font-size:10px;padding:3px 8px;border-radius:8px;font-weight:700;background:${achieved ? '#c8102e' : '#f0f0f0'};color:${achieved ? '#fff' : '#888'};">$${(t.threshold/1000).toFixed(0)}K → $${t.reward}</span>`;
                }).join('')}
            </div>
        </div>`;
    }

    // 一般推廣倒數
    const regularHTML = regularPromos.length > 0 ? `
        <div class="progress-card">
            <div class="progress-title">📅 推廣優惠倒數</div>
            ${regularPromos.map(p => {
                const end = new Date(p.endDate);
                const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                const colorClass = daysLeft <= 7 ? 'days-urgent' : daysLeft <= 14 ? 'days-warning' : 'days-ok';
                return `
                    <div class="promo-progress-row">
                        <div class="promo-progress-info">
                            <div class="promo-progress-name">${p.name}</div>
                            <div class="promo-progress-date">
                                ${p.startDate} → ${p.endDate}
                                ${p.remarks ? `<span class="promo-remark">${p.remarks}</span>` : ''}
                            </div>
                        </div>
                        <div class="days-badge ${colorClass}">剩 ${daysLeft} 日</div>
                    </div>`;
            }).join('')}
        </div>` : '';

    el.innerHTML = springHTML + regularHTML;
}

// ── 各卡封頂進度 ─────────────────────────────────────
function renderCapProgress(cards, getCardTotal) {
    const el = document.getElementById('progress-caps');
    if (!el) return;

    // 定義各卡封頂資訊
    const CAP_INFO = {
        red:         [{ label: '網購4%封頂', cap: 10000 }],
        dbs_eminent: [{ label: '指定類別5%封頂', cap: 8000 }, { label: '一般零售1%封頂', cap: 20000 }],
        citi_club:   [{ label: '全部回贈上限$300/月', cap: 300/0.04 }],
        sogo:   [{ label: 'ApplePay 額外+5%手機回贈封頂（上限$100/月）', cap: 2000 }],
        motion: [{ label: '餐飲/網購6%封頂', cap: 3636 }],
        waku:   [{ label: '網購6%封頂', cap: 3571 }],
        mmpower:[{ label: '三類共享額外回贈上限$500（海外>網上>自選）', cap: Math.round(500/0.056) }],
        bliss:      [{ label: '網上4%封頂（首$10,000）', cap: 10000 }, { label: '指定商戶6%封頂（首$10,000）', cap: 10000 }],
        bea_world:   [{ label: 'World MC 5%上限$460（約$9,200）', cap: Math.round(460/0.046) }],
        bea_titanium:[{ label: 'i-Titanium 網上/手機4%上限$300', cap: Math.round(300/0.04) }],
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
