// js/core.js - 2026 Pro 核心計算引擎

// --- 用戶狀態管理 (儲存在 LocalStorage) ---
let userProfile = {
    ownedCards: ["hsbc_red", "hsbc_em", "cncbi_motion", "hase_mmpower"], // 預設持有的卡
    usage: {
        "mmp_monthly_spend": 5500, // 模擬已簽金額，用於觸發 5% 門檻
        "motion_monthly_spend": 1000,
        "red_online_usage": 2000,
        "cheers_monthly_spend": 6000
    },
    settings: {
        guru_level: 1, // Travel Guru 等級
        fcf_deduction: true // 是否自動扣除外幣手續費
    }
};

// --- 2026 公眾假期數據 (用於中銀紅日判斷) ---
const HOLIDAYS_2026 = [
    "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19", 
    "2026-04-03", "2026-04-04", "2026-04-06", "2026-05-01",
    "2026-05-25", "2026-06-19", "2026-07-01", "2026-10-01"
];

const Engine = {
    // 判斷今日是否紅日 (星期日或公眾假期)
    isRedDay: (txDate) => {
        const d = txDate ? new Date(txDate) : new Date();
        const dateStr = d.toISOString().split('T')[0];
        const isSunday = d.getDay() === 0;
        return isSunday || HOLIDAYS_2026.includes(dateStr);
    },

    // 核心計算函數
    calculateResults: (amount, category, displayMode) => {
        let results = [];
        const isRed = Engine.isRedDay();

        userProfile.ownedCards.forEach(cardId => {
            const card = cardsDB.find(c => c.id === cardId);
            if (!card) return;

            let totalRate = 0;
            let breakdown = [];
            let isCapped = false;

            // 處理該卡片的所有回贈模組
            card.modules.forEach(modId => {
                const mod = modulesDB[modId];
                if (!mod) return;

                let apply = false;
                let rate = mod.rate || 0;

                // 1. 始終生效模組 (Always)
                if (mod.type === "always") apply = true;

                // 2. 類別匹配模組 (Category Match)
                if (mod.type === "category" && mod.match.includes(category)) {
                    apply = true;
                    
                    // 檢查門檻 (Mission Check)
                    if (mod.req_mission_spend && mod.req_mission_key) {
                        const currentSpend = userProfile.usage[mod.req_mission_key] || 0;
                        if (currentSpend < mod.req_mission_spend) {
                            apply = false; // 門檻未達標
                            breakdown.push(`<span class="text-gray-400">🔒 未達簽賬門檻</span>`);
                        }
                    }

                    // 檢查額度 (Cap Check)
                    if (mod.cap_limit && mod.cap_key) {
                        const used = userProfile.usage[mod.cap_key] || 0;
                        if (used >= mod.cap_limit) {
                            rate = 0; // 已爆 Cap
                            isCapped = true;
                        }
                    }

                    // 處理覆蓋邏輯 (Replace Mode)
                    if (apply && mod.mode === "replace") {
                        totalRate = rate;
                        breakdown = [mod.desc];
                        return;
                    }
                }

                if (apply) {
                    totalRate += rate;
                    if (rate > 0) breakdown.push(mod.desc);
                }
            });

            // 取得該卡貨幣的兌換率
            const conv = conversionDB.find(c => c.src === card.currency) || conversionDB[0];
            
            // 計算原始價值
            const nativeValue = amount * totalRate;
            const estMiles = nativeValue * conv.miles_rate;
            const estCash = nativeValue * conv.cash_rate;

            // 處理海外手續費淨值 (Net Rebate)
            let fcf = 0;
            if (category === "overseas" || category === "online_foreign") {
                fcf = amount * (card.fcf || 0);
            }
            const netCash = estCash - fcf;

            // 建立結果對象
            results.push({
                cardId: card.id,
                cardName: card.name,
                bank: card.bank,
                amount: amount,
                // UI 顯示數值
                displayVal: displayMode === 'miles' ? Math.floor(estMiles) : netCash.toFixed(1),
                displayUnit: displayMode === 'miles' ? "里" : "元",
                // 用於排序的權重
                score: displayMode === 'miles' ? estMiles : netCash,
                breakdown: breakdown,
                isCapped: isCapped,
                fcf: fcf
            });
        });

        // 根據權重由高至低排序
        return results.sort((a, b) => b.score - a.score);
    },

    // 儲存數據
    saveData: () => {
        localStorage.setItem('cc_pro_user_data', JSON.stringify(userProfile));
    },

    // 讀取數據
    loadData: () => {
        const saved = localStorage.getItem('cc_pro_user_data');
        if (saved) userProfile = JSON.parse(saved);
    }
};

// 初始化讀取
Engine.loadData();
