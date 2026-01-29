const cardsDB = [
    { id: "hsbc_everymile", name: "✈️ EveryMile", currency: "HSBC_RC_EM", type: "master", fcf: 0.0195, modules: ["em_base", "em_designated", "travel_guru_v2"] },
    { id: "hsbc_vs", name: "💎 Visa Signature", currency: "HSBC_RC", type: "visa", fcf: 0.0195, modules: ["vs_base", "vs_red_hot_bonus", "red_hot_variable", "travel_guru_v2"] },
    { id: "hsbc_red", name: "🍎 HSBC Red", currency: "HSBC_RC", type: "master", fcf: 0.0195, modules: ["red_base", "red_online", "red_designated_bonus", "travel_guru_v2"] },
    { id: "hangseng_mmpower", name: "⚡ MMPower", currency: "Fun_Dollars", type: "master", fcf: 0.0195, modules: ["hangseng_base", "mmpower_overseas_bonus", "mmpower_online_bonus"] },
    { id: "boc_cheers_vi", name: "🥂 Cheers VI", currency: "BOC_Points", type: "visa", fcf: 0.0195, modules: ["boc_cheers_base", "boc_cheers_dining", "boc_amazing_holiday"] },
    { id: "sc_smart", name: "🛍️ SC Smart", currency: "CASH_Direct", type: "visa", fcf: 0, modules: ["sc_smart_base", "sc_smart_designated"] },
    { id: "aeon_wakuwaku", name: "🎎 WAKUWAKU", currency: "CASH_Direct", type: "master", fcf: 0.0195, modules: ["aeon_waku_base", "aeon_waku_online"] },
    { id: "earnmore", name: "💪 EarnMORE", currency: "CASH_Direct", type: "unionpay", fcf: 0, modules: ["earnmore_base"] }
];

const modulesDB = {
    "hsbc_std_base": { type: "always", rate: 0.004, desc: "🐾 基本回贈 (0.4%)" },
    "vs_base": { type: "always", rate: 0.004, desc: "🐾 基本回贈 (0.4%)" },
    "red_hot_variable": { type: "red_hot_allocation", rate_per_x: 0.004, desc: "💖 最紅自主賞", setting_key: "red_hot_rewards_enabled" },
    "vs_red_hot_bonus": { type: "red_hot_fixed_bonus", multiplier: 3, rate_per_x: 0.004, desc: "💎 VS 專屬 (1.2%)" },
    "red_base": { type: "always", rate: 0.004, desc: "🐾 基本 (0.4%)" },
    "red_online": { type: "category", match: ["online"], rate: 0.04, desc: "💻 網購 4%", mode: "replace", cap_limit: 400, cap_key: "red_online_cap", cap_mode: "reward" },
    "red_designated_bonus": { type: "category", match: ["red_designated"], rate: 0.08, desc: "🌟 指定 8%", cap_limit: 100, cap_key: "red_designated_cap", cap_mode: "reward" },
    "em_base": { type: "always", rate: 0.01, desc: "🐾 $5/里 (1%)" },
    "em_designated": { type: "category", match: ["transport", "travel"], rate: 0.025, desc: "🚋 指定 $2/里", mode: "replace" },
    "travel_guru_v2": { type: "guru_capped", category: "overseas", config: { 1: { rate: 0.03, cap_rc: 500, desc: "🐣 GO級" }, 2: { rate: 0.04, cap_rc: 1200, desc: "🐥 GING級" }, 3: { rate: 0.06, cap_rc: 2200, desc: "👑 GURU級" } }, usage_key: "guru_rc_used" },
    "mmpower_overseas_bonus": { type: "category", match: ["overseas"], rate: 0.056, desc: "✈️ 海外 6%", mode: "add", setting_key: "mmpower_promo_enabled", cap_limit: 500, cap_key: "mmpower_reward_cap", cap_mode: "reward", req_mission_spend: 5000, req_mission_key: "spend_mmpower" },
    "mmpower_online_bonus": { type: "category", match: ["online"], rate: 0.046, desc: "💻 網購 5%", mode: "add", setting_key: "mmpower_promo_enabled", cap_limit: 500, cap_key: "mmpower_reward_cap", cap_mode: "reward", req_mission_spend: 5000, req_mission_key: "spend_mmpower" },
    "boc_cheers_base": { type: "always", rate: 0.004, desc: "🐾 基本回贈" },
    "boc_cheers_dining": { type: "category", match: ["dining"], rate: 0.04, desc: "🍱 餐飲 10X (4%)", mode: "replace", cap_limit: 100000, cap_key: "boc_cheers_dining_cap", cap_mode: "reward" },
    "boc_amazing_holiday": { type: "category", match: ["dining", "travel"], rate: 0.05, desc: "🎈 狂賞紅日 5%", setting_key: "boc_amazing_enabled", cap_limit: 300, cap_key: "boc_amazing_holiday_cap", cap_mode: "reward" },
    "sc_smart_base": { type: "always", rate: 0.0055, desc: "🐾 基本 0.55%" },
    "sc_smart_designated": { type: "category", match: ["smart_designated", "grocery"], rate: 0.05, desc: "🛒 指定 5%", mode: "replace", cap_limit: 60000, cap_key: "sc_smart_cap", cap_mode: "spending" },
    "aeon_waku_base": { type: "always", rate: 0.005, desc: "🐾 基本 0.5%" },
    "aeon_waku_online": { type: "category", match: ["online"], rate: 0.06, desc: "🎎 網購 6%", mode: "replace", cap_limit: 300, cap_key: "aeon_waku_cap", cap_mode: "reward" },
    "earnmore_base": { type: "always", rate: 0.02, desc: "💪 全能 2%", cap_limit: 150000, cap_key: "earnmore_annual_spend", cap_mode: "spending" },
    "hangseng_base": { type: "always", rate: 0.004, desc: "🐾 基本 0.4%" }
};

const conversionDB = [
    { src: "HSBC_RC_EM", miles_rate: 20, cash_rate: 1 },
    { src: "HSBC_RC", miles_rate: 10, cash_rate: 1 },
    { src: "AM_Direct", miles_rate: 1, cash_rate: 0 },
    { src: "CASH_Direct", miles_rate: 0, cash_rate: 1 },
    { src: "Fun_Dollars", miles_rate: 0, cash_rate: 1 },
    { src: "BOC_Points", miles_rate: 1/15, cash_rate: 0.004 }
];

const redHotCategories = {
    "dining": ["dining"],
    "world": ["overseas"],
    "home": ["grocery"],
    "enjoyment": ["transport", "travel"],
    "style": ["apparel"]
};
