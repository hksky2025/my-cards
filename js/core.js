const USER_DATA_KEY = 'cc_secretary_v1_data';
const HolidayManager = {
    holidays: [],
    init: async function() {
        const STATIC = ["20260101", "20260217", "20260218", "20260219", "20260403", "20260404", "20260406", "20260501", "20260701", "20261001", "20261225", "20261226"];
        this.holidays = STATIC;
        try {
            const res = await fetch('https://www.1823.gov.hk/common/ical/gc/en.json');
            if(res.ok) {
                const json = await res.json();
                const apiHolidays = json.vcalendar[0].vevent.map(e => e.dtstart[0]);
                this.holidays = [...new Set([...STATIC, ...apiHolidays])];
            }
        } catch(e) { console.log("Using static holidays"); }
    },
    isHoliday: function(dateStr) { return this.holidays.includes(dateStr.replace(/-/g, '')); }
};

let userProfile = {
    ownedCards: ["hsbc_red", "hsbc_everymile"],
    settings: { guru_level: 0, red_hot_rewards_enabled: true, red_hot_allocation: { dining: 5, world: 0, home: 0, enjoyment: 0, style: 0 } },
    usage: {}, stats: { totalSpend: 0, totalVal: 0, txCount: 0 }, transactions: []
};

function loadUserData() {
    const s = localStorage.getItem(USER_DATA_KEY);
    if(s) userProfile = { ...userProfile, ...JSON.parse(s) };
}
function saveUserData() { localStorage.setItem(USER_DATA_KEY, JSON.stringify(userProfile)); }

function calculateResults(amount, category, mode, profile, date, isHoliday) {
    let results = [];
    profile.ownedCards.forEach(id => {
        const card = cardsDB.find(c => c.id === id);
        if(!card) return;
        
        let totalRate = 0;
        let breakdown = [];
        let guruRC = 0;

        card.modules.forEach(mid => {
            const m = modulesDB[mid];
            if(!m) return;
            if(m.setting_key && profile.settings[m.setting_key] === false) return;
            
            // BOC Holiday Check
            if(m.valid_on_red_day !== undefined) {
                const isRed = isHoliday || new Date(date).getDay() === 0;
                if(m.valid_on_red_day !== isRed) return;
            }

            let rate = 0;
            if(m.type === 'always') rate = m.rate;
            else if(m.type === 'category' && m.match.includes(category)) {
                const used = profile.usage[m.cap_key] || 0;
                if(used < (m.cap_limit || Infinity)) rate = m.rate;
            }
            else if(m.type === 'guru_capped' && (category.startsWith('overseas'))) {
                const lv = parseInt(profile.settings.guru_level);
                if(lv > 0) {
                    const conf = m.config[lv];
                    const used = profile.usage[m.usage_key] || 0;
                    if(used < conf.cap_rc) {
                        rate = conf.rate;
                        guruRC = amount * rate;
                    }
                }
            }
            else if(m.type === 'red_hot_allocation') {
                for(let [rh, cats] of Object.entries(redHotCategories)) {
                    if(cats.includes(category)) {
                        rate = (profile.settings.red_hot_allocation[rh] || 0) * 0.004;
                    }
                }
            }
            else if(m.type === 'red_hot_fixed_bonus' && redHotCategories.dining.includes(category)) rate = 0.012;

            if(rate > 0) {
                totalRate += rate;
                breakdown.push(m.desc);
            }
        });

        const conv = conversionDB.find(c => c.src === card.currency);
        const estCash = amount * totalRate * conv.cash_rate;
        const estMiles = amount * totalRate * conv.miles_rate;

        results.push({
            cardId: card.id, cardName: card.name,
            displayVal: mode === 'miles' ? Math.floor(estMiles).toLocaleString() : Math.floor(estCash).toLocaleString(),
            displayUnit: mode === 'miles' ? '里' : 'HKD',
            estValue: estCash, breakdown, guruRC, category, amount
        });
    });
    return results.sort((a, b) => b.estValue - a.estValue);
}
