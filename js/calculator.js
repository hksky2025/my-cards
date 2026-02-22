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

    // ── 保險保費特別處理 ──────────────────────────────
    if (cat === 'Insurance') {
        // 只計 HSBC、中銀、建銀；其他銀行唔顯示（return null 由 app.js 過濾）
        if (!['hsbc', 'boc', 'ccb'].includes(card.bank)) {
            return null;
        }
        // HSBC：首$10,000 有0.4%，超出冇回贈
        if (card.bank === 'hsbc') {
            const effectiveAmt = Math.min(amt, 10000);
            const overAmt = amt - effectiveAmt;
            const miles = card.type === 'miles' || card.type === 'both'
                ? Math.floor(effectiveAmt / (logic.spendPerMile || 12.5)) : 0;
            const rateLabel = overAmt > 0
                ? `0.4%（首$10,000，超出$${overAmt.toLocaleString()}冇回贈，⚠️需網上理財繳費）`
                : `0.4%（首$10,000，⚠️需網上理財繳費）`;
            return { val: effectiveAmt * 0.004, miles, rate: rateLabel };
        }
        // 中銀：首$10,000 有0.4%，超出冇回贈
        if (card.bank === 'boc') {
            const effectiveAmt = Math.min(amt, 10000);
            const overAmt = amt - effectiveAmt;
            const rateLabel = overAmt > 0
                ? `0.4%（首$10,000，超出$${overAmt.toLocaleString()}冇回贈，⚠️需網上理財繳費）`
                : `0.4%（首$10,000，⚠️需網上理財繳費）`;
            return { val: effectiveAmt * 0.004, miles: 0, rate: rateLabel };
        }
        // 建銀：0.4%，全年上限 $42,000 信用額（即最多賺 $168/年）
        if (card.bank === 'ccb') {
            const CCB_INSURANCE_ANNUAL_CAP = 42000;
            return { val: amt * 0.004, miles: 0, rate: `0.4%（⚠️需網上繳費，備註：信用額只有$${CCB_INSURANCE_ANNUAL_CAP.toLocaleString()}，全年保費上限$${CCB_INSURANCE_ANNUAL_CAP.toLocaleString()}）` };
        }
    }

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
            const isSogoCat = (sub && sub.includes('SOGO')) || cat === 'Dining';
            // 喺崇光百貨簽賬（有SOGO sub tag）
            if (isSogoCat && (meth === 'ApplePay' || meth === '實體')) {
                const sogoBase = amt * (logic.baseRate + logic.sogoRate); // 0.4% + 5%
                if (logic.isSig && meth === 'ApplePay') {
                    // Signature 卡手機支付額外5%，上限$100/月
                    const mobileBonus = Math.min(amt * logic.mobileRate, logic.mobileCap);
                    return { val: sogoBase + mobileBonus, rate: `${((logic.baseRate + logic.sogoRate) * 100).toFixed(1)}%+手機5%(上限$${logic.mobileCap}/月)` };
                }
                return { val: sogoBase, rate: `${((logic.baseRate + logic.sogoRate) * 100).toFixed(1)}% (崇光)` };
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

        case 'citi_club': {
            // 指定商戶(CITI_CLUB sub) 4% 現金；其他 1%；海外港幣/繳費無回贈；每月上限$300
            if (sub && sub.includes('OVERSEAS_HKD')) return { val: 0, rate: '不適用(海外港幣CBF)' };
            if (cat === 'Bill') return { val: 0, rate: '不適用(繳費)' };
            const isClub = sub && sub.includes('CITI_CLUB');
            const rate = isClub ? logic.bonusRate : logic.baseRate;
            return { val: amt * rate, rate: `${rate * 100}% Club積分${isClub ? ' (指定商戶)' : ''}` };
        }

        case 'citic_motion': {
            // 當月累積零售 >= $3,800 後，食肆/網上享 6%（上限 $200/月）
            // isMet 由 app.js 根據當月累積額判斷後傳入
            const isBonus = logic.bonusCats.includes(cat) && params.motionMet;
            if (isBonus) {
                return { val: amt * logic.bonusRate, rate: `${logic.bonusRate * 100}% (食肆/網上，已達$${logic.minMonthlySpend})` };
            }
            return { val: amt * logic.baseRate, rate: `${logic.baseRate * 100}% (基本)` };
        }

        case 'dbs_black': {
            // 八達通增值 $12=1里；iBanking繳費不計；其他 $6=1里
            let ratePerMile = 6; // 預設
            if (meth === 'Octopus') ratePerMile = 12;
            if (cat === 'Bill') return { val: 0, miles: 0, rate: '不計里數(繳費)' };
            const miles = Math.floor(amt / ratePerMile);
            const milesVal = miles * 0.1; // Asia Miles 估值 $0.1/里
            return { val: milesVal, miles, rate: `$${ratePerMile}/里 (Asia Miles)` };
        }

        case 'dbs_eminent': {
            // 指定4類(餐飲/醫療/運動服飾/健身)：單筆>=$300，每月首$8,000@5%，超額@0.4%
            // 其他零售：每月首$20,000@1%，超額@0.4%
            if (cat === 'Override0.4') return { val: amt * logic.overCapRate, rate: '0.4% (超封頂)' };
            const isBonus = logic.bonusCats.includes(cat) && amt >= logic.minAmt;
            if (isBonus) {
                return { val: amt * logic.bonusRate, rate: `${logic.bonusRate * 100}% (指定類別首$${logic.bonusCap})` };
            }
            // 其他零售：首$20,000@1%，超額@0.4%
            return { val: amt * logic.retailRate, rate: `${logic.retailRate * 100}% (零售首$${logic.retailCap})` };
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

    if (meth === 'Online') {
        // 網購狂賞：不需要 $5,000 門檻，不限單筆金額
        // 平日額外2%，上限$60；紅日額外5%，上限$200
        return isCrazyRedDay ? Math.min(amt * 0.05, 200) : Math.min(amt * 0.02, 60);
    }

    // 本地實體店：需達當月累積 $5,000 門檻，單筆須 $500 或以上
    if (!isMet) return 0;
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
    if (!b) return 0; // 純顯示用推廣，無需計算

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
