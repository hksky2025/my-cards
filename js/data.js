// js/data.js
const cardsDB = [
    // --- HSBC ---
    { id: "hsbc_em", name: "HSBC EveryMile", currency: "HSBC_RC_EM", fcf: 0.0195, modules: ["em_base", "em_designated", "travel_guru_v2"] },
    { id: "hsbc_red", name: "HSBC Red Card", currency: "HSBC_RC", fcf: 0.0195, modules: ["red_online_4pct", "red_base"] },
    { id: "hsbc_vs", name: "HSBC Visa Signature", currency: "HSBC_RC", fcf: 0.0195, modules: ["vs_base", "red_hot_5x", "winter_2026"] },
    // --- BOC ---
    { id: "boc_sogo", name: "中銀 SOGO 信用卡", currency: "BOC_PTS", fcf: 0, modules: ["boc_base", "sogo_5pct"] },
    { id: "boc_cheers", name: "中銀 Cheers VI", currency: "BOC_PTS", fcf: 0.0195, modules: ["boc_base", "cheers_10x_dining", "cheers_10x_travel"] },
    { id: "boc_go", name: "中銀 Go 銀聯", currency: "BOC_PTS", fcf: 0, modules: ["boc_base", "boc_go_mobile"] },
    // --- Others ---
    { id: "sc_miles", name: "SC Cathay Mastercard", currency: "AM_DIRECT", fcf: 0.0195, modules: ["sc_am_base", "sc_am_dining"] },
    { id: "aeon_waku", name: "AEON WAKUWAKU", currency: "CASH", fcf: 0.0195, modules: ["waku_6pct_online"] },
    { id: "mox_credit", name: "Mox Credit", currency: "CASH", fcf: 0.0195, modules: ["mox_base", "mox_2pct_goal"] },
    { id: "hase_mmpower", name: "恆生 MMPower", currency: "FUN_DOLLARS", fcf: 0.0195, modules: ["mmpower_5pct_online", "mmpower_base"] },
    { id: "ccb_eye", name: "建行 eye 信用卡", currency: "CCB_PTS", fcf: 0.0195, modules: ["ccb_eye_5x"] },
    { id: "ccb_aia", name: "建行 AIA 信用卡", currency: "CCB_PTS", fcf: 0.0195, modules: ["ccb_aia_insurance"] },
    { id: "cncbi_motion", name: "信銀 Motion", currency: "CASH", fcf: 0.0195, modules: ["motion_6pct"] },
    { id: "dbs_black", name: "DBS Black World", currency: "DBS_D", fcf: 0.0195, modules: ["dbs_black_base", "dbs_black_overseas"] }
];

const modulesDB = {
    "em_base": { type: "always", rate: 0.01, desc: "基本 1% ($5/里)" },
    "em_designated": { type: "category", match: ["transport", "dining"], rate: 0.025, mode: "replace", desc: "指定 $2/里" },
    "red_online_4pct": { type: "category", match: ["online"], rate: 0.04, cap_limit: 10000, cap_key: "red_cap", desc: "網購 4%" },
    "motion_6pct": { type: "category", match: ["dining", "online"], rate: 0.06, cap_limit: 3333, cap_key: "motion_cap", desc: "食肆/網購 6%" },
    "mmpower_5pct_online": { type: "category", match: ["online"], rate: 0.05, req_mission_spend: 5000, req_mission_key: "mmp_spend", desc: "網購 5% (需簽滿$5k)" },
    "cheers_10x_dining": { type: "category", match: ["dining"], rate: 0.04, req_mission_spend: 5000, req_mission_key: "cheers_spend", desc: "餐飲 10X ($1.5/里)" },
    "ccb_eye_5x": { type: "category", match: ["online", "contactless"], rate: 0.02, desc: "5X 積分 ($3/里)" },
    "ccb_aia_insurance": { type: "category", match: ["insurance"], rate: 0.004, desc: "保險 1X 積分" }
    // ... 更多 Module 根據 core.js 邏輯運作
};

const conversionDB = [
    { src: "HSBC_RC_EM", miles_rate: 20, cash_rate: 1 },
    { src: "HSBC_RC", miles_rate: 10, cash_rate: 1 },
    { src: "BOC_PTS", miles_rate: 1/15, cash_rate: 0.004 },
    { src: "AM_DIRECT", miles_rate: 1, cash_rate: 0 },
    { src: "DBS_D", miles_rate: 20.83, cash_rate: 1 }
];
