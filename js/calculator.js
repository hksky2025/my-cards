// calculator.js — 純計算邏輯，不接觸任何 DOM
// 所有函數均為 pure function，方便單元測試

/**
 * 計算單張信用卡的基礎回報
 * @param {Object} card - 來自 cards.json 的卡片資料
 * @param {Object} params - { amt, cat, meth, isMet, sub }
 * @returns {{ val: number, miles?: number, rate: string }}
 */
export function calcBaseReward(card, params) {
    const { amt, cat, meth, isMet, sub } = params;
    const logic = card.logic;

    switch (logic.type) {

        case 'miles_tiered': {
            const tier = logic.tiers.find(t => matchTierCondition(t.condition, params));
            const ratePerMile = tier ? tier.ratePerMile : logic.tiers.at(-1).ratePerMile;
            const miles = Math.floor(amt / ratePerMile);
            return { val: miles * 0.1, miles, rate: `$${ratePerMile}/里` };
        }

        case 'cheers': {
            const isBonus = logic.requiresMet ? isMet && logic.bonusCats.includes(cat) : logic.bonusCats.includes(cat);
            if (isBonus) {
                return {
                    val: amt * logic.bonusCashRate,
                    miles: Math.floor(amt / logic.bonusRatePerMile),
                    rate: `$${logic.bonusRatePerMile}/里 (${logic.bonusCashRate * 100}%)`
                };
            }
            return {
                val: amt * logic.baseCashRate,
                miles: Math.floor(amt / logic.baseRatePerMile),
                rate: `$${logic.baseRatePerMile}/里 (${logic.baseCashRate * 100}%)`
            };
        }

        case 'red': {
            // Red8_HSBC 指定商戶：calcPromoBonus 負責計8%差額，此處只計基本0.4%
            if (meth === 'Online') {
                // 網購4%，無上限
                return { val: amt * logic.onlineRate, rate: `${logic.onlineRate * 100}% (網購)` };
            }
            if (cat === 'Super') {
                // 超市2%
                return { val: amt * logic.superRate, rate: `${logic.superRate * 100}% (超市)` };
            }
            // 其他零售0.4%
            return { val: amt * logic.baseRate, rate: `${logic.baseRate * 100}%` };
        }

        case 'mmpower': {
            if (!isMet) return { val: amt * logic.baseRate, rate: `${logic.baseRate * 100}%` };
            if (cat === 'Overseas') {
                const val = Math.min(amt * logic.overseasRate, logic.overseaCapBonus + amt * logic.baseRate);
                return { val, rate: `${logic.overseasRate * 100}%` };
            }
            if (meth === 'Online') {
                const val = Math.min(amt * logic.onlineRate, logic.onlineCapBonus + amt * logic.baseRate);
                return { val, rate: `${logic.onlineRate * 100}%` };
            }
            return { val: amt * logic.localRate, rate: `${logic.localRate * 100}%` };
        }

        case 'vs': {
            const isBonus = (sub && logic.bonusSubs.some(s => sub.includes(s))) || logic.bonusCats.includes(cat);
            return { val: amt * (isBonus ? logic.bonusRate : logic.baseRate), rate: `${(isBonus ? logic.bonusRate : logic.baseRate) * 100}%` };
        }

        case 'sogo': {
            if (meth === 'ApplePay') {
                const val = amt <= logic.applePayCap
                    ? amt * logic.applePayRate
                    : logic.applePayCap * logic.applePayRate + (amt - logic.applePayCap) * logic.overCapRate;
                return { val, rate: `${logic.applePayRate * 100}% (ApplePay首$${logic.applePayCap})` };
            }
            return { val: amt * logic.baseRate, rate: `${logic.baseRate * 100}%` };
        }

        case 'go': {
            const r = cat === 'Super' ? logic.superRate : logic.baseRate;
            return { val: amt * r, rate: `${r * 100}%` };
        }

        case 'motion': {
            const isBonus = logic.bonusCats.includes(cat) || (logic.onlineBonus && meth === 'Online');
            if (isBonus) {
                const val = amt <= logic.bonusCap
                    ? amt * logic.bonusRate
                    : logic.bonusCap * logic.bonusRate + (amt - logic.bonusCap) * logic.overCapRate;
                return { val, rate: `${logic.bonusRate * 100}% (首$${logic.bonusCap})` };
            }
            return { val: amt * logic.baseRate, rate: `${logic.baseRate * 100}%` };
        }

        case 'mox': {
            const r = cat === 'Super' ? logic.superRate : logic.baseRate;
            return { val: amt * r, rate: `${r * 100}%` };
        }

        case 'waku': {
            if (meth === 'Online') {
                const val = amt <= logic.onlineCap
                    ? amt * logic.onlineRate
                    : logic.onlineCap * logic.onlineRate + (amt - logic.onlineCap) * logic.overCapRate;
                return { val, rate: `${logic.onlineRate * 100}% (首$${logic.onlineCap})` };
            }
            return { val: amt * logic.baseRate, rate: `${logic.baseRate * 100}%` };
        }

        case 'flat':
        default:
            return { val: amt * logic.rate, rate: `${logic.rate * 100}%` };
    }
}

/**
 * 計算狂賞派額外獎賞
 * @param {Object} card
 * @param {Object} params - { amt, meth, isMet, isRedDay }
 * @returns {number} 額外現金回贈
 */
export function calcCrazyBonus(card, params) {
    if (!card.crazyEligible) return 0;
    const { amt, meth, isMet, isCrazyRedDay } = params;

    // 必須達當月累積 $5,000 門檻
    if (!isMet) return 0;

    if (meth === 'Online') {
        // 網購：不限單筆金額
        // 平日額外2%，上限$60；紅日額外5%，上限$200
        return isCrazyRedDay ? Math.min(amt * 0.05, 200) : Math.min(amt * 0.02, 60);
    }

    // 本地實體店：單筆須 $500 或以上
    if (amt >= 500) {
        // 平日額外2%，上限$120；紅日額外5%，上限$300
        return isCrazyRedDay ? Math.min(amt * 0.05, 300) : Math.min(amt * 0.02, 120);
    }

    return 0;
}

/**
 * 計算限時優惠額外獎賞
 * @param {Object} promo - 來自 promotions.json
 * @param {Object} params - { amt, isRedDay }
 * @returns {number}
 */
export function calcPromoBonus(promo, params) {
    const { amt, isRedDay } = params;
    const b = promo.bonus;

    if (b.type === 'percentage_cap') {
        const base = Math.min(amt * b.baseRate, b.baseCap);
        const redExtra = isRedDay ? Math.min(amt * b.redDayRate, b.redDayCap) : 0;
        return base + redExtra;
    }
    // Red 指定商戶：只計差額（8% - 0.4% = 7.6%），因基本0.4%已在 calcBaseReward 計算
    // 超額部分：基本率已包含0.4%，故差額為0
    if (b.type === 'red_designated') {
        const BASE_RATE = 0.004;
        if (amt <= b.cashCap) {
            return amt * (b.cashRate - BASE_RATE); // 7.6% 差額
        } else {
            return b.cashCap * (b.cashRate - BASE_RATE); // 只有首$1,250有差額，超額部分差額=0
        }
    }
    return 0;
}

// ── 內部輔助 ──────────────────────────────────────────
function matchTierCondition(condition, { cat, meth, sub }) {
    if (condition === 'default') return true;
    if (condition.startsWith('sub_includes:')) return sub && sub.includes(condition.split(':')[1]);
    if (condition.startsWith('sub_eq:')) return sub === condition.split(':')[1];
    if (condition.startsWith('cat_in:')) return condition.split(':')[1].split(',').includes(cat);
    if (condition.startsWith('meth_in:')) return condition.split(':')[1].split(',').includes(meth);
    return false;
}
