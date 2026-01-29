// js/data.js
const CARDS_DB = [
    { id: "hsbc_em", bank: "HSBC", name: "EveryMile", curr: "RC_EM", fcf: 0.0195, tags: ["em_base", "em_travel", "hsbc_guru"] },
    { id: "hsbc_red", bank: "HSBC", name: "Red Card", curr: "RC", fcf: 0.0195, tags: ["red_online", "red_base"] },
    { id: "hsbc_vs", bank: "HSBC", name: "Visa Signature", curr: "RC", fcf: 0.0195, tags: ["vs_base", "hsbc_rh", "winter_2026"] },
    { id: "boc_sogo", bank: "BOC", name: "SOGO VS", curr: "BOC_PTS", fcf: 0, tags: ["boc_base", "sogo_5pct", "boc_amazing"] },
    { id: "boc_cheers", bank: "BOC", name: "Cheers VI", curr: "BOC_PTS", fcf: 0.0195, tags: ["boc_base", "cheers_10x", "boc_amazing"] },
    { id: "boc_go", bank: "BOC", name: "Go UnionPay", curr: "BOC_PTS", fcf: 0, tags: ["boc_base", "boc_go_mobile"] },
    { id: "sc_cathay", bank: "SC", name: "Cathay Mastercard", curr: "AM", fcf: 0.0195, tags: ["sc_base", "sc_dining"] },
    { id: "aeon_waku", bank: "AEON", name: "WAKUWAKU", curr: "CASH", fcf: 0.0195, tags: ["waku_6pct", "waku_base"] },
    { id: "mox_credit", bank: "Mox", name: "Mox Credit", curr: "CASH", fcf: 0.0195, tags: ["mox_base", "mox_bonus"] },
    { id: "hase_mmp", bank: "HASE", name: "MMPower", curr: "FUN", fcf: 0.0195, tags: ["mmp_online", "mmp_overseas", "mmp_base"] },
    { id: "ccb_eye", bank: "CCB", name: "eye Card", curr: "CCB_PTS", fcf: 0.0195, tags: ["ccb_eye_5x", "ccb_base"] },
    { id: "ccb_aia", bank: "CCB", name: "AIA Card", curr: "CCB_PTS", fcf: 0.0195, tags: ["ccb_aia_bonus"] },
    { id: "ctbc_motion", bank: "CNCBI", name: "Motion", curr: "CASH", fcf: 0.0195, tags: ["motion_6pct", "motion_base"] },
    { id: "dbs_black", bank: "DBS", name: "Black World", curr: "DBS_D", fcf: 0.0195, tags: ["dbs_base", "dbs_overseas"] }
];

const MODULES_DB = {
    "em_base": { type: "always", rate: 0.01, label: "基本 1.0%" },
    "em_travel": { type: "cat", match: ["transport", "travel"], rate: 0.025, mode: "replace", label: "$2/里 指定類別" },
    "red_online": { type: "cat", match: ["online"], rate: 0.04, cap: 10000, key: "red_cap", label: "網購 4%" },
    "motion_6pct": { type: "cat", match: ["online", "dining"], rate: 0.06, cap: 3333, key: "motion_cap", label: "6% 神卡回贈" },
    "mmp_online": { type: "cat", match: ["online"], rate: 0.05, threshold: 5000, key: "mmp_spend", label: "網購 5% (需簽滿$5k)" },
    "cheers_10x": { type: "cat", match: ["dining"], rate: 0.04, threshold: 5000, key: "cheers_spend", label: "餐飲 10X ($1.5/里)" },
    "ccb_eye_5x": { type: "cat", match: ["online"], rate: 0.02, label: "網購 5X 積分" },
    "ccb_aia_bonus": { type: "cat", match: ["insurance"], rate: 0.01, label: "保險繳費 1%" }
};

const CATEGORIES = [
    { id: "online", name: "💻 網上購物" },
    { id: "dining", name: "🍱 餐廳飲食" },
    { id: "overseas", name: "✈️ 外幣簽賬" },
    { id: "transport", name: "🚌 交通出行" },
    { id: "insurance", name: "🛡️ 保險繳費" },
    { id: "supermarket", name: "🥦 超市百貨" },
    { id: "general", name: "🛒 其他零售" }
];

const FX_RATES = {
    "RC": { m: 10, c: 1 }, "RC_EM": { m: 20, c: 1 }, "BOC_PTS": { m: 1/15, c: 0.004 },
    "AM": { m: 1, c: 0 }, "FUN": { m: 0, c: 1 }, "DBS_D": { m: 20.83, c: 1 },
    "CCB_PTS": { m: 1/15, c: 0.004 }, "CASH": { m: 0, c: 1 }
};
