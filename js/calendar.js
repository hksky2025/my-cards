// calendar.js — 月曆記帳視圖

let currentYear, currentMonth;
let _transactions = [], _cards = [];

export function initCalendar() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
}

export function renderCalendar(transactions, cards) {
    _transactions = transactions || [];
    _cards = cards || [];
    if (currentYear === undefined) initCalendar();

    const el = document.getElementById('calendar-container');
    if (!el) return;

    const year = currentYear;
    const month = currentMonth;
    const ym = `${year}-${String(month + 1).padStart(2, '0')}`;

    // 按日期聚合
    const dayTotals = {};
    const dayTxns = {};
    _transactions.forEach(t => {
        if (!t.date || !t.date.startsWith(ym)) return;
        const d = t.date;
        const amt = parseFloat(t.amt) || 0;
        dayTotals[d] = (dayTotals[d] || 0) + amt;
        if (!dayTxns[d]) dayTxns[d] = [];
        dayTxns[d].push({ ...t, amt });
    });

    const monthTotal = Object.values(dayTotals).reduce((s, v) => s + v, 0);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // 月曆格
    let cells = '';
    for (let i = 0; i < firstDay; i++) {
        cells += `<div class="cal-day empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${ym}-${String(d).padStart(2,'0')}`;
        const total = dayTotals[dateStr];
        const isToday = dateStr === todayStr;
        const amt = total ? (total >= 10000 ? `${(total/1000).toFixed(1)}k` : total.toLocaleString()) : '';
        cells += `
            <div class="cal-day ${total ? 'has-txn' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <span class="cal-day-num">${d}</span>
                ${amt ? `<span class="cal-day-amt">$${amt}</span>` : ''}
            </div>`;
    }

    el.innerHTML = `
        <div class="cal-container">
            <div class="cal-header">
                <button class="cal-nav" id="calPrev">‹</button>
                <div class="cal-title-wrap">
                    <div class="cal-title">${year}年${month + 1}月</div>
                    <div class="cal-month-total">本月合計 <strong>$${monthTotal.toLocaleString()}</strong></div>
                </div>
                <button class="cal-nav" id="calNext">›</button>
            </div>
            <div class="cal-weekdays">
                ${['日','一','二','三','四','五','六'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
            </div>
            <div class="cal-grid">${cells}</div>
            <div class="cal-detail" id="calDetail"></div>
        </div>`;

    // 上月/下月
    el.querySelector('#calPrev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(_transactions, _cards);
    });
    el.querySelector('#calNext').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(_transactions, _cards);
    });

    // 點擊任何日期格顯示明細（有記錄或無記錄）
    el.querySelectorAll('.cal-day:not(.empty)').forEach(cell => {
        cell.addEventListener('click', () => {
            el.querySelectorAll('.cal-day.active').forEach(c => c.classList.remove('active'));
            cell.classList.add('active');
            showDayDetail(cell.dataset.date, dayTxns[cell.dataset.date] || []);
        });
    });
}

function showDayDetail(dateStr, txns) {
    const detail = document.getElementById('calDetail');
    if (!detail) return;

    const weekdays = ['日','一','二','三','四','五','六'];
    const dateObj = new Date(dateStr + 'T00:00:00');
    const [y, m, d] = dateStr.split('-');
    const dayTotal = txns.reduce((s, t) => s + t.amt, 0);

    const CAT_LABEL = {
        Dining:'餐飲食肆', Super:'超級市場', Online:'一般網購', Electronics:'電子產品',
        Transport:'交通/叫車', Pet:'寵物護理', Entertainment:'休閒娛樂', Medical:'醫療服務',
        Sport:'運動服飾', Fitness:'健身中心', Travel:'旅遊機票', Fashion:'珠寶服飾',
        Coffee:'咖啡輕食', Overseas:'海外外幣', General:'一般本地消費', Home:'家居用品'
    };

    const rows = txns.length === 0
        ? `<div class="cal-no-txn">此日無簽賬記錄</div>`
        : txns.map(t => {
            const card = _cards.find(c => c.id === t.cardId);
            const cardName = card ? card.name : (t.cardId || '—');
            const bankClass = card ? card.bank + '-card' : '';
            const catLabel = CAT_LABEL[t.cat] || t.cat || '';
            return `
                <div class="cal-txn-row ${bankClass}">
                    <div class="cal-txn-info">
                        <div class="cal-txn-merchant">${t.merchant || catLabel}</div>
                        <div class="cal-txn-meta">${catLabel}　·　${cardName}</div>
                    </div>
                    <div class="cal-txn-amt">$${t.amt.toLocaleString()}</div>
                </div>`;
        }).join('');

    detail.innerHTML = `
        <div class="cal-detail-header">
            <span>${y}年${parseInt(m)}月${parseInt(d)}日（星期${weekdays[dateObj.getDay()]}）</span>
            <span class="cal-detail-total">-$${dayTotal.toLocaleString()}</span>
        </div>
        ${rows}`;
    detail.style.display = 'block';

    // 滑動到明細位置
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
