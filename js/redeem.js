// redeem.js — 積分／里數兌換頁

const REDEEM_CARDS = [
    {
        id: 'bea_world',
        name: '東亞 World Mastercard',
        bank: 'bea',
        color: '#c8102e',
        unit: '獎分',
        pointsPerHKD: 1,        // 簽 $1 = 1分（基本）
        cash: { points: 200, hkd: 1 },           // 200分 = $1
        miles: { points: 10, miles: 1 },          // 10分 = 1里（亞洲萬里通）
        milesProgram: '亞洲萬里通',
        note: '海外/餐飲/電子/運動醫療簽賬享5倍獎分（需登記BEA Mall App + 達$4,000/月）',
    },
    {
        id: 'ccb_eye',
        name: '建銀 eye卡',
        bank: 'ccb',
        color: '#da291c',
        unit: '積分',
        pointsPerHKD: 1,        // $1 = 1分（基本）；網上/拍卡 $1 = 5分
        cash: { points: 25000, hkd: 100 },        // 25,000分 = $100（最低兌換單位）
        miles: { points: 15, miles: 1 },          // $3 = 1里（即15分 = 1里，網上/拍卡5倍積分）
        milesProgram: '亞洲萬里通',
        minRedeemPoints: 25000,
        note: '最低兌換單位 25,000分 = $100現金回贈；兌換里數需另繳手續費',
    },
    {
        id: 'cheers',
        name: '中銀 Cheers VI',
        bank: 'boc',
        color: '#c8960c',
        unit: '積分',
        pointsPerHKD: 1,
        cash: { points: 250, hkd: 1 },            // 250分 = $1
        miles: { points: 15, miles: 1 },          // 15分 = 1里（亞洲萬里通）
        milesProgram: '亞洲萬里通',
        note: '積分換里數比率：15積分 = 1亞洲萬里通里數',
    },
    {
        id: 'dbs_black',
        name: 'DBS Black World',
        bank: 'dbs',
        color: '#e4002b',
        unit: 'DBS$',
        isDBS: true,
        // 簽賬賺 DBS$：本地 $6 = 1 DBS$；海外 $4 = 1 DBS$
        localRate: 6,    // $6 = 1 DBS$
        overseasRate: 4, // $4 = 1 DBS$
        // 兌換
        cash: { dbs: 8, hkd: 10 },               // DBS$8 = $10（即1.25倍）
        miles: { dbs: 1, miles: 1 },             // DBS$1 = 1里（多個航空公司）
        milesProgram: '亞洲萬里通 / Avios / KrisFlyer',
        note: 'DBS$ 永不過期；兌換里數免手續費；iGO Rewards 兌換機票/酒店享55折',
    },
    {
        id: 'everymile',
        name: 'HSBC EveryMile',
        bank: 'hsbc',
        color: '#db0011',
        unit: '里數',
        isMilesOnly: true,
        // 本地 $5 = 1里
        localRate: 5,
        milesProgram: '亞洲萬里通',
        milesValue: { miles: 1, hkd: 5 },    // 每里成本 $5
        note: 'EveryMile 直接賺里數，唔設積分系統；本地簽賬 $5 = 1里',
    },
];

// 渲染兌換頁
export function renderRedeem(enabledCards) {
    const el = document.getElementById('redeem-container');
    if (!el) return;

    // 只顯示用戶已啟用嘅積分/里數卡
    const enabledIds = enabledCards.map(c => c.id);
    const cards = REDEEM_CARDS.filter(c => enabledIds.includes(c.id));

    if (cards.length === 0) {
        el.innerHTML = '<div style="text-align:center;color:#aaa;padding:40px 20px;font-size:14px;">請先喺「計算」頁啟用積分/里數信用卡</div>';
        return;
    }

    el.innerHTML = cards.map(card => renderCard(card)).join('');

    // 加 input 事件
    cards.forEach(card => {
        const input = document.getElementById(`redeem-input-${card.id}`);
        if (input) {
            input.addEventListener('input', () => updateCardResult(card, input.value));
        }
    });
}

function renderCard(card) {
    const bankColors = { bea: '#c8102e', ccb: '#da291c', boc: '#c8960c', dbs: '#e4002b', hsbc: '#db0011' };
    const color = bankColors[card.bank] || '#888';

    if (card.isMilesOnly) {
        // EveryMile：純里數卡，顯示里數成本參考
        return `
        <div class="redeem-card">
            <div class="redeem-card-header">
                <div class="redeem-bank-dot" style="background:${color};"></div>
                <div>
                    <div class="redeem-card-name">${card.name}</div>
                    <div class="redeem-card-unit">直接賺里數 · 本地 $${card.localRate} = 1里</div>
                </div>
            </div>
            <div class="redeem-input-row">
                <label>輸入里數</label>
                <input class="redeem-input" id="redeem-input-${card.id}" type="number" placeholder="0" min="0">
                <span style="font-size:12px;color:#666;">里</span>
            </div>
            <div class="redeem-results">
                <div class="redeem-result-box highlight" id="redeem-cash-${card.id}">
                    <div class="redeem-result-label">💳 對應簽賬金額</div>
                    <div class="redeem-result-val">$0</div>
                    <div class="redeem-result-sub">本地 @$${card.localRate}/里</div>
                </div>
            </div>
            <div class="redeem-note">${card.note}</div>
        </div>`;
    }

    if (card.isDBS) {
        // DBS：特殊 DBS$ 系統
        return `
        <div class="redeem-card">
            <div class="redeem-card-header">
                <div class="redeem-bank-dot" style="background:${color};"></div>
                <div>
                    <div class="redeem-card-name">${card.name}</div>
                    <div class="redeem-card-unit">${card.unit}（本地 $${card.localRate}=1 DBS$；海外 $${card.overseasRate}=1 DBS$）</div>
                </div>
            </div>
            <div class="redeem-input-row">
                <label>輸入 DBS$</label>
                <input class="redeem-input" id="redeem-input-${card.id}" type="number" placeholder="0" min="0">
                <span style="font-size:12px;color:#666;">DBS$</span>
            </div>
            <div class="redeem-results">
                <div class="redeem-result-box highlight" id="redeem-cash-${card.id}">
                    <div class="redeem-result-label">💰 兌換現金</div>
                    <div class="redeem-result-val">$0</div>
                    <div class="redeem-result-sub">DBS$8 = HK$10</div>
                </div>
                <div class="redeem-result-box" id="redeem-miles-${card.id}">
                    <div class="redeem-result-label">✈️ 兌換里數</div>
                    <div class="redeem-result-val">0里</div>
                    <div class="redeem-result-sub">${card.milesProgram}</div>
                </div>
            </div>
            <div class="redeem-note">${card.note}</div>
        </div>`;
    }

    // 一般積分卡（東亞、建銀、中銀）
    return `
    <div class="redeem-card">
        <div class="redeem-card-header">
            <div class="redeem-bank-dot" style="background:${color};"></div>
            <div>
                <div class="redeem-card-name">${card.name}</div>
                <div class="redeem-card-unit">${card.unit}（${card.cash.points}分 = $${card.cash.hkd}）</div>
            </div>
        </div>
        <div class="redeem-input-row">
            <label>輸入${card.unit}</label>
            <input class="redeem-input" id="redeem-input-${card.id}" type="number" placeholder="0" min="0">
            <span style="font-size:12px;color:#666;">${card.unit}</span>
        </div>
        <div class="redeem-results">
            <div class="redeem-result-box highlight" id="redeem-cash-${card.id}">
                <div class="redeem-result-label">💰 兌換現金</div>
                <div class="redeem-result-val">$0</div>
                <div class="redeem-result-sub">${card.cash.points}${card.unit} = $${card.cash.hkd}</div>
            </div>
            <div class="redeem-result-box" id="redeem-miles-${card.id}">
                <div class="redeem-result-label">✈️ 兌換里數</div>
                <div class="redeem-result-val">0里</div>
                <div class="redeem-result-sub">${card.miles.points}${card.unit} = ${card.miles.miles}里（${card.milesProgram}）</div>
            </div>
        </div>
        ${card.minRedeemPoints ? `<div class="redeem-note">⚠️ 最低兌換：${card.minRedeemPoints.toLocaleString()}${card.unit}</div>` : ''}
        <div class="redeem-note">${card.note}</div>
    </div>`;
}

function updateCardResult(card, rawVal) {
    const val = parseFloat(rawVal) || 0;

    if (card.isMilesOnly) {
        // EveryMile：里數 → 對應簽賬金額
        const spendVal = val * card.localRate;
        const cashEl = document.getElementById(`redeem-cash-${card.id}`);
        if (cashEl) cashEl.querySelector('.redeem-result-val').textContent = `$${spendVal.toLocaleString()}`;
        return;
    }

    if (card.isDBS) {
        // DBS$：→ 現金（DBS$8=$10）；→ 里數（DBS$1=1里）
        const cashVal = (val / 8) * 10;
        const milesVal = Math.floor(val);
        const cashEl = document.getElementById(`redeem-cash-${card.id}`);
        const milesEl = document.getElementById(`redeem-miles-${card.id}`);
        if (cashEl) cashEl.querySelector('.redeem-result-val').textContent = `$${cashVal.toFixed(0)}`;
        if (milesEl) milesEl.querySelector('.redeem-result-val').textContent = `${milesVal.toLocaleString()}里`;
        return;
    }

    // 一般積分卡
    const cashVal = (val / card.cash.points) * card.cash.hkd;
    const milesVal = Math.floor(val / card.miles.points) * card.miles.miles;

    const cashEl = document.getElementById(`redeem-cash-${card.id}`);
    const milesEl = document.getElementById(`redeem-miles-${card.id}`);

    if (cashEl) {
        const display = card.minRedeemPoints
            ? val >= card.minRedeemPoints
                ? `$${Math.floor(val / card.cash.points * card.cash.hkd)}`
                : `未達最低（${card.minRedeemPoints.toLocaleString()}分）`
            : `$${cashVal.toFixed(0)}`;
        cashEl.querySelector('.redeem-result-val').textContent = display;
        cashEl.querySelector('.redeem-result-val').style.color = 
            (card.minRedeemPoints && val < card.minRedeemPoints) ? '#aaa' : '#db0011';
    }
    if (milesEl) {
        milesEl.querySelector('.redeem-result-val').textContent = `${milesVal.toLocaleString()}里`;
    }
}
