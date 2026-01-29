// js/core.js
const LogicEngine = {
    // 檢查今日是否紅日
    checkRedDay: () => {
        const d = new Date();
        return d.getDay() === 0 || ["2026-01-01", "2026-02-17"].includes(d.toISOString().split('T')[0]);
    },

    calculate: (amt, cat, mode, wallet, usage) => {
        const isRed = LogicEngine.checkRedDay();
        
        const output = wallet.map(id => {
            const card = CARDS_DB.find(c => c.id === id);
            let totalRate = 0, desc = [], isCapped = false;

            card.tags.forEach(tId => {
                const mod = MODULES_DB[tId];
                if (!mod) return;

                let apply = (mod.type === "always") || (mod.type === "cat" && mod.match.includes(cat));
                
                // 門檻判斷
                if (mod.threshold && (usage[mod.key] || 0) < mod.threshold) apply = false;

                if (apply) {
                    let rate = mod.rate;
                    // 紅日邏輯
                    if (isRed && tId === "boc_amazing") rate += 0.01;

                    if (mod.mode === "replace") { totalRate = rate; desc = [mod.label]; }
                    else { totalRate += rate; desc.push(mod.label); }

                    // 上限判斷
                    if (mod.cap && (usage[mod.key] || 0) >= mod.cap) { totalRate = 0; isCapped = true; }
                }
            });

            const fx = FX_RATES[card.curr];
            const netCash = (amt * totalRate * fx.c) - (cat === "overseas" ? amt * card.fcf : 0);
            const miles = amt * totalRate * fx.m;

            return {
                ...card,
                val: mode === 'miles' ? Math.floor(miles) : netCash.toFixed(1),
                unit: mode === 'miles' ? "里" : "元",
                desc: desc.join(" + "),
                isCapped,
                score: mode === 'miles' ? miles : netCash
            };
        });

        return output.sort((a, b) => b.score - a.score);
    }
};
