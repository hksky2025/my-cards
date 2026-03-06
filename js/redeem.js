// redeem.js — 積分／里數／RC 兌換頁

// ── 卡片資料 ──────────────────────────────────────────
const REDEEM_CARDS = [
    {
        id: 'red',
        name: 'HSBC Red',
        bank: 'hsbc',
        color: '#db0011',
        type: 'rc',
        unit: 'RC（獎賞錢）',
        cash: { rc: 1, hkd: 1 },
        miles: { rc: 1, miles: 10 },
        milesProgram: '亞洲萬里通 / Avios / KrisFlyer',
        note: '$1 RC = HK$1 現金 或 10里',
    },
    {
        id: 'vs',
        name: 'HSBC VS (賞家居)',
        bank: 'hsbc',
        color: '#db0011',
        type: 'rc',
        unit: 'RC（獎賞錢）',
        cash: { rc: 1, hkd: 1 },
        miles: { rc: 1, miles: 10 },
        milesProgram: '亞洲萬里通 / Avios / KrisFlyer',
        note: '$1 RC = HK$1 現金 或 10里',
    },
    {
        id: 'everymile',
        name: 'HSBC EveryMile',
        bank: 'hsbc',
        color: '#db0011',
        type: 'rc',
        unit: 'RC（獎賞錢）',
        cash: { rc: 1, hkd: 1 },
        miles: { rc: 1, miles: 20 },
        milesProgram: '亞洲萬里通 / Avios / KrisFlyer 等16個計劃',
        note: '$1 RC = HK$1 現金 或 20里（係其他 HSBC 卡兩倍）',
    },
    {
        id: 'dbs_black',
        name: 'DBS Black World',
        bank: 'dbs',
        color: '#e4002b',
        type: 'dbs',
        unit: 'DBS$',
        localSpendPerDBS: 125,
        milesPerDBS: 1000 / 48,
        milesProgram: '亞洲萬里通',
        note: '本地簽賬：HK$250 = DBS$2；DBS$48 = 1,000里；即 HK$6 = 1里\nDBS$ 永不過期；兌換里數免手續費',
    },
    {
        id: 'bea_world',
        name: '東亞 World Mastercard',
        bank: 'bea',
        color: '#c8102e',
        type: 'points',
        unit: '獎分',
        cash: { points: 200, hkd: 1 },
        miles: { points: 10, miles: 1 },
        milesProgram: '亞洲萬里通',
        note: '200獎分 = $1 現金回贈；10獎分 = 1亞洲萬里通里數\n海外/餐飲/電子/運動醫療享5倍獎分（需登記BEA Mall App + 達$4,000/月）',
    },
    {
        id: 'ccb_eye',
        name: '建銀 eye卡',
        bank: 'ccb',
        color: '#da291c',
        type: 'points',
        unit: '積分',
        cash: { points: 25000, hkd: 100 },
        miles: { points: 15, miles: 1 },
        milesProgram: '亞洲萬里通',
        minRedeemPoints: 25000,
        note: '最低兌換：25,000積分 = $100 現金回贈\n15積分 = 1亞洲萬里通里數（需另繳手續費）',
    },
    {
        id: 'cheers',
        name: '中銀 Cheers VI',
        bank: 'boc',
        color: '#c8960c',
        type: 'points',
        unit: '積分',
        cash: { points: 250, hkd: 1 },
        miles: { points: 15, miles: 1 },
        milesProgram: '亞洲萬里通',
        note: '250積分 = $1 現金回贈；15積分 = 1亞洲萬里通里數',
    },
];

// ── 主 render 函數 ────────────────────────────────────
export function renderRedeem(enabledCards) {
    const el = document.getElementById('redeem-container');
    if (!el) return;

    const enabledIds = enabledCards.map(c => c.id);
    const cards = REDEEM_CARDS.filter(c => enabledIds.includes(c.id));

    if (cards.length === 0) {
        el.innerHTML = '<div style="text-align:center;color:#aaa;padding:40px 20px;font-size:14px;">請先喺「計算」頁啟用積分/里數信用卡</div>';
        return;
    }

    el.innerHTML = cards.map(card => renderCard(card)).join('');

    cards.forEach(card => {
        const input = document.getElementById('redeem-input-' + card.id);
        if (input) {
            input.addEventListener('input', function() {
                updateCardResult(card, parseFloat(input.value) || 0);
            });
        }
    });
}

// ── 各卡 HTML ─────────────────────────────────────────
function renderCard(card) {
    const bankColors = { bea: '#c8102e', ccb: '#da291c', boc: '#c8960c', dbs: '#e4002b', hsbc: '#db0011' };
    const color = bankColors[card.bank] || '#888';
    const noteHTML = card.note.split('\n').map(function(l) { return '<div>' + l + '</div>'; }).join('');

    if (card.type === 'rc') {
        return '<div class="redeem-card">'
            + '<div class="redeem-card-header">'
            + '<div class="redeem-bank-dot" style="background:' + color + ';"></div>'
            + '<div><div class="redeem-card-name">' + card.name + '</div>'
            + '<div class="redeem-card-unit">' + card.unit + ' · $1 RC = HK$1 或 ' + card.miles.miles + '里</div></div>'
            + '</div>'
            + '<div class="redeem-input-row">'
            + '<label>輸入 RC</label>'
            + '<input class="redeem-input" id="redeem-input-' + card.id + '" type="number" placeholder="0" min="0" step="0.01">'
            + '<span style="font-size:12px;color:#666;">RC</span>'
            + '</div>'
            + '<div class="redeem-results">'
            + '<div class="redeem-result-box highlight" id="redeem-cash-' + card.id + '">'
            + '<div class="redeem-result-label">💰 兌換現金</div>'
            + '<div class="redeem-result-val">HK$0</div>'
            + '<div class="redeem-result-sub">$1 RC = HK$1</div>'
            + '</div>'
            + '<div class="redeem-result-box" id="redeem-miles-' + card.id + '">'
            + '<div class="redeem-result-label">✈️ 兌換里數</div>'
            + '<div class="redeem-result-val">0 里</div>'
            + '<div class="redeem-result-sub">' + card.milesProgram + '</div>'
            + '</div>'
            + '</div>'
            + '<div class="redeem-note">' + noteHTML + '</div>'
            + '</div>';
    }

    if (card.type === 'dbs') {
        return '<div class="redeem-card">'
            + '<div class="redeem-card-header">'
            + '<div class="redeem-bank-dot" style="background:' + color + ';"></div>'
            + '<div><div class="redeem-card-name">' + card.name + '</div>'
            + '<div class="redeem-card-unit">' + card.unit + ' · DBS$1 = HK$1；DBS$48 = 1,000里</div></div>'
            + '</div>'
            + '<div class="redeem-input-row">'
            + '<label>輸入 DBS$</label>'
            + '<input class="redeem-input" id="redeem-input-' + card.id + '" type="number" placeholder="0" min="0" step="1">'
            + '<span style="font-size:12px;color:#666;">DBS$</span>'
            + '</div>'
            + '<div class="redeem-results">'
            + '<div class="redeem-result-box" id="redeem-spend-' + card.id + '">'
            + '<div class="redeem-result-label">💳 對應簽賬</div>'
            + '<div class="redeem-result-val">HK$0</div>'
            + '<div class="redeem-result-sub">DBS$1 = HK$1</div>'
            + '</div>'
            + '<div class="redeem-result-box highlight" id="redeem-miles-' + card.id + '">'
            + '<div class="redeem-result-label">✈️ 兌換里數</div>'
            + '<div class="redeem-result-val">0 里</div>'
            + '<div class="redeem-result-sub">' + card.milesProgram + '</div>'
            + '</div>'
            + '</div>'
            + '<div class="redeem-note">' + noteHTML + '</div>'
            + '</div>';
    }

    // 一般積分卡
    return '<div class="redeem-card">'
        + '<div class="redeem-card-header">'
        + '<div class="redeem-bank-dot" style="background:' + color + ';"></div>'
        + '<div><div class="redeem-card-name">' + card.name + '</div>'
        + '<div class="redeem-card-unit">' + card.unit + ' · ' + card.cash.points + card.unit + ' = $' + card.cash.hkd + '</div></div>'
        + '</div>'
        + '<div class="redeem-input-row">'
        + '<label>輸入' + card.unit + '</label>'
        + '<input class="redeem-input" id="redeem-input-' + card.id + '" type="number" placeholder="0" min="0">'
        + '<span style="font-size:12px;color:#666;">' + card.unit + '</span>'
        + '</div>'
        + '<div class="redeem-results">'
        + '<div class="redeem-result-box highlight" id="redeem-cash-' + card.id + '">'
        + '<div class="redeem-result-label">💰 兌換現金</div>'
        + '<div class="redeem-result-val">$0</div>'
        + '<div class="redeem-result-sub">' + card.cash.points + card.unit + ' = $' + card.cash.hkd + '</div>'
        + '</div>'
        + '<div class="redeem-result-box" id="redeem-miles-' + card.id + '">'
        + '<div class="redeem-result-label">✈️ 兌換里數</div>'
        + '<div class="redeem-result-val">0 里</div>'
        + '<div class="redeem-result-sub">' + card.miles.points + card.unit + ' = ' + card.miles.miles + '里（' + card.milesProgram + '）</div>'
        + '</div>'
        + '</div>'
        + '<div class="redeem-note">' + noteHTML + '</div>'
        + '</div>';
}

// ── 計算更新 ──────────────────────────────────────────
function updateCardResult(card, val) {
    if (card.type === 'rc') {
        var cashEl = document.getElementById('redeem-cash-' + card.id);
        var milesEl = document.getElementById('redeem-miles-' + card.id);
        if (cashEl) cashEl.querySelector('.redeem-result-val').textContent = 'HK$' + val.toLocaleString();
        if (milesEl) milesEl.querySelector('.redeem-result-val').textContent = Math.floor(val * card.miles.miles).toLocaleString() + ' 里';
        return;
    }

    if (card.type === 'dbs') {
        var spendEl = document.getElementById('redeem-spend-' + card.id);
        var milesEl = document.getElementById('redeem-miles-' + card.id);
        var spendVal = val;  // 1 DBS$ = HK$1
        var milesVal = Math.floor(val * card.milesPerDBS);
        if (spendEl) spendEl.querySelector('.redeem-result-val').textContent = 'HK$' + spendVal.toLocaleString();
        if (milesEl) milesEl.querySelector('.redeem-result-val').textContent = milesVal.toLocaleString() + ' 里';
        return;
    }

    // 一般積分卡
    var cashEl = document.getElementById('redeem-cash-' + card.id);
    var milesEl = document.getElementById('redeem-miles-' + card.id);
    var isMin = card.minRedeemPoints && val > 0 && val < card.minRedeemPoints;
    var cashVal = Math.floor(val / card.cash.points * card.cash.hkd);
    var milesVal = Math.floor(val / card.miles.points) * card.miles.miles;

    if (cashEl) {
        var valEl = cashEl.querySelector('.redeem-result-val');
        var subEl = cashEl.querySelector('.redeem-result-sub');
        valEl.textContent = isMin ? '未達最低' : ('$' + cashVal.toLocaleString());
        valEl.style.color = isMin ? '#bbb' : '#db0011';
        if (subEl) subEl.textContent = isMin
            ? ('最低 ' + card.minRedeemPoints.toLocaleString() + card.unit)
            : (card.cash.points + card.unit + ' = $' + card.cash.hkd);
    }
    if (milesEl) {
        milesEl.querySelector('.redeem-result-val').textContent = milesVal.toLocaleString() + ' 里';
    }
}
