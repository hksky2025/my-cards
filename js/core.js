const USER_DATA_KEY = 'cc_secretary_v1_data';

// 初始用戶檔案
let userProfile = {
    ownedCards: ["hsbc_red", "hsbc_everymile"],
    settings: {
        guru_level: 0,
        red_hot_rewards_enabled: true,
        red_hot_allocation: { dining: 5, world: 0, home: 0, enjoyment: 0, style: 0 },
        em_promo_enabled: false,
        mmpower_promo_enabled: false,
        boc_amazing_enabled: false
    },
    usage: {},
    stats: { totalSpend: 0, totalVal: 0, txCount: 0 },
    transactions: []
};

function saveUserData() {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userProfile));
}

function loadUserData() {
    const saved = localStorage.getItem(USER_DATA_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        userProfile = { ...userProfile, ...parsed };
    }
}

const HolidayManager = {
    holidays: ["20260101", "20260217", "20260218", "20260219"], 
    isHoliday: function(dateStr) {
        return this.holidays.includes(dateStr.replace(/-/g, ''));
    }
};

function calculateResults(amount, category, mode, profile, date, isHoliday) {
    let results = [];
    
    profile.ownedCards.forEach(cardId => {
        const card = cardsDB.find(c => c.id === cardId);
        if (!card) return;

        let totalRate = 0;
        let breakdown = [];
        let trackingData = []; // 用於記錄這筆交易命中了哪些模組

        card.modules.forEach(mid => {
            const m = modulesDB[mid];
            if (!m) return;
            
            // 檢查設定開關
            if (m.setting_key && profile.settings[m.setting_key] === false) return;

            // 檢查紅日 (中銀)
            if (m.valid_on_red_day !== undefined) {
                const isRed = isHoliday || new Date(date).getDay() === 0;
                if (m.valid_on_red_day !== isRed) return;
            }

            // 檢查累積門檻 (MMPower)
            if (m.req_mission_spend) {
                const currentSpend = profile.usage[m.req_mission_key] || 0;
                if (currentSpend < m.req_mission_spend) return;
            }

            let rate = 0;
            if (m.type === 'always') rate = m.rate;
            else if (m.type === 'category' && m.match.includes(category)) {
                // 檢查上限
                const used = profile.usage[m.cap_key] || 0;
                if (used < (m.cap_limit || Infinity)) {
                    rate = m.rate;
                    // 如果是 reward cap，計算賺取的 reward 是否超標
                    if (m.cap_mode === 'reward') {
                        const potential = amount * rate;
                        const remaining = m.cap_limit - used;
                        if (potential > remaining) rate = remaining / amount;
                    }
                }
            } else if (m.type === 'red_hot_allocation') {
                for (let [rh, cats] of Object.entries(redHotCategories)) {
                    if (cats.includes(category)) {
                        rate = (profile.settings.red_hot_allocation[rh] || 0) * 0.004;
                    }
                }
            }

            if (rate > 0) {
                totalRate += rate;
                breakdown.push(m.desc);
                // 存下追蹤資訊
                trackingData.push({ key: m.cap_key, mode: m.cap_mode, rate: rate, amount: amount });
            }
        });

        const conv = conversionDB.find(c => c.src === card.currency);
        const estCash = amount * totalRate * conv.cash_rate;
        const estMiles = amount * totalRate * conv.miles_rate;

        results.push({
            cardId: card.id,
            cardName: card.name,
            displayVal: mode === 'miles' ? Math.floor(estMiles).toLocaleString() : estCash.toFixed(1),
            displayUnit: mode === 'miles' ? '里' : 'HKD',
            estValue: estCash,
            breakdown,
            trackingData,
            amount
        });
    });

    return results.sort((a, b) => b.estValue - a.estValue);
}
