const USER_DATA_KEY = 'cc_secretary_v1_data';

let userProfile = {
    ownedCards: ["hsbc_red", "hsbc_everymile"],
    settings: { guru_level: 0, red_hot_rewards_enabled: true, red_hot_allocation: { dining: 5, world: 0, home: 0, enjoyment: 0, style: 0 }, em_promo_enabled: false, mmpower_promo_enabled: false, boc_amazing_enabled: false },
    usage: {},
    stats: { totalSpend: 0, totalVal: 0, txCount: 0 },
    transactions: []
};

function saveUserData() { localStorage.setItem(USER_DATA_KEY, JSON.stringify(userProfile)); }
function loadUserData() {
    const saved = localStorage.getItem(USER_DATA_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            userProfile = { ...userProfile, ...parsed };
        } catch(e) { console.error("Load failed", e); }
    }
}

function calculateResults(amount, category, mode, profile) {
    let results = [];
    profile.ownedCards.forEach(cardId => {
        const card = cardsDB.find(c => c.id === cardId);
        if (!card) return;

        let totalRate = 0;
        let breakdown = [];
        let trackingData = [];

        card.modules.forEach(mid => {
            const m = modulesDB[mid];
            if (!m) return;
            if (m.setting_key && profile.settings[m.setting_key] === false) return;

            let rate = 0;
            if (m.type === 'always') rate = m.rate;
            else if (m.type === 'category' && m.match.includes(category)) {
                const used = profile.usage[m.cap_key] || 0;
                if (used < (m.cap_limit || Infinity)) rate = m.rate;
            } else if (m.type === 'red_hot_allocation') {
                for (let [rh, cats] of Object.entries(redHotCategories)) {
                    if (cats.includes(category)) rate = (profile.settings.red_hot_allocation[rh] || 0) * 0.004;
                }
            } else if (m.type === 'guru_capped' && category === 'overseas') {
                const lv = parseInt(profile.settings.guru_level);
                if (lv > 0) rate = m.config[lv].rate;
            }

            if (rate > 0) {
                totalRate += rate;
                breakdown.push(m.desc);
                if (m.cap_key) trackingData.push({ key: m.cap_key, mode: m.cap_mode, rate: rate });
            }
        });

        const conv = conversionDB.find(c => c.src === card.currency) || {miles_rate:0, cash_rate:1};
        const val = amount * totalRate;
        results.push({
            cardId: card.id, cardName: card.name, amount: amount,
            displayVal: mode === 'miles' ? Math.floor(val * conv.miles_rate).toLocaleString() : (val * conv.cash_rate).toFixed(1),
            displayUnit: mode === 'miles' ? '里' : 'HKD',
            estValue: val * conv.cash_rate, breakdown, trackingData
        });
    });
    return results.sort((a, b) => b.estValue - a.estValue);
}
