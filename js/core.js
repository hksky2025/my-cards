// js/core.js
const Engine = {
    calculate: (amount, category, mode, ownedCards) => {
        let results = [];
        const isRedDay = new Date().getDay() === 0; // 今天是否星期日

        ownedCards.forEach(id => {
            const card = CARDS.find(c => c.id === id);
            if (!card) return;

            let totalRate = 0;
            let descList = [];

            card.modules.forEach(mId => {
                const m = MODULES[mId];
                if (!m) return;

                // 檢查類別匹配
                const isMatch = !m.match || m.match.includes(category);
                
                if (isMatch) {
                    let rate = m.rate;
                    
                    // 特殊邏輯：中銀狂賞派紅日加乘 (模擬邏輯)
                    if (isRedDay && card.bank === "BOC" && category !== "general") {
                        rate += 0.01; // 假設紅日多1%
                    }

                    if (m.mode === "replace") {
                        totalRate = rate;
                        descList = [m.desc];
                    } else {
                        totalRate += rate;
                        descList.push(m.desc);
                    }
                }
            });

            const curr = CONFIG.CURRENCIES[card.currency];
            const rawCash = amount * totalRate * curr.cash;
            const fee = (category === "overseas") ? amount * card.fcf : 0;
            const netCash = rawCash - fee;
            const miles = amount * totalRate * curr.miles;

            results.push({
                bank: card.bank,
                name: card.name,
                val: mode === 'miles' ? Math.floor(miles) : netCash.toFixed(1),
                unit: mode === 'miles' ? "里" : "元",
                desc: descList.join(" + "),
                score: mode === 'miles' ? miles : netCash
            });
        });

        return results.sort((a, b) => b.score - a.score);
    }
};