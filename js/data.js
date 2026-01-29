// js/data.js
const CONFIG = {
    CATEGORIES: [
        { id: "online", name: "💻 網上購物" },
        { id: "dining", name: "🍱 餐廳飲食" },
        { id: "overseas", name: "✈️ 外幣簽賬" },
        { id: "supermarket", name: "🥦 超市百貨" },
        { id: "transport", name: "🚌 交通工具" },
        { id: "sogo", name: "🛍️ SOGO 消費" },
        { id: "insurance", name: "🛡️ 保險繳費" },
        { id: "general", name: "🛒 其他零售" }
    ],
    CURRENCIES: {
        "RC": { miles: 10, cash: 1 },
        "RC_EM": { miles: 20, cash: 1 },
        "BOC_PTS": { miles: 0.0667, cash: 0.004 },
        "HASE_FUN": { miles: 0, cash: 1 },
        "AM_DIRECT": { miles: 1, cash: 0 },
        "CASH": { miles: 0, cash: 1 },
        "DBS_D": { miles: 20.83, cash: 1 },
        "CCB_PTS": { miles: 0.0667, cash: 0.004 },
        "CNCBI_CASH": { miles: 0, cash: 1 }
    }
};

const CARDS = [
    { id: "hsbc_em", bank: "HSBC", name: "EveryMile", currency: "RC_EM", fcf: 0.0195, modules: ["em_base", "em_designated"] },
    { id: "hsbc_red", bank: "HSBC", name: "Red Card", currency: "RC", fcf: 0.0195, modules: ["red_online", "red_supermarket", "red_base"] },
    { id: "hsbc_vs", bank: "HSBC", name: "Visa Signature", currency: "RC", fcf: 0.0195, modules: ["vs_base", "vs_extra", "rh_dining"] },
    { id: "boc_sogo", bank: "BOC", name: "SOGO VS", currency: "BOC_PTS", fcf: 0, modules: ["boc_base", "sogo_5pct"] },
    { id: "boc_cheers", bank: "BOC", name: "Cheers VI", currency: "BOC_PTS", fcf: 0.0195, modules: ["boc_base", "cheers_dining", "cheers_overseas"] },
    { id: "boc_go", bank: "BOC", name: "Go UnionPay", currency: "BOC_PTS", fcf: 0, modules: ["boc_base", "boc_go_mobile"] },
    { id: "sc_miles", bank: "SC", name: "Cathay Mastercard", currency: "AM_DIRECT", fcf: 0.0195, modules: ["sc_am_base", "sc_am_special"] },
    { id: "aeon_waku", bank: "AEON", name: "WAKUWAKU", currency: "CASH", fcf: 0.0195, modules: ["waku_base", "waku_online", "waku_japan"] },
    { id: "mox", bank: "Mox", name: "Mox Credit", currency: "CASH", fcf: 0.0195, modules: ["mox_base", "mox_bonus", "mox_supermarket"] },
    { id: "hase_mmpower", bank: "HASE", name: "MMPower", currency: "HASE_FUN", fcf: 0.0195, modules: ["mmp_base", "mmp_online", "mmp_overseas"] },
    { id: "ccb_eye", bank: "CCB", name: "eye 信用卡", currency: "CCB_PTS", fcf: 0.0195, modules: ["ccb_base", "ccb_eye_5x"] },
    { id: "ccb_aia", bank: "CCB", name: "AIA 信用卡", currency: "CCB_PTS", fcf: 0.0195, modules: ["ccb_base", "ccb_aia_ins"] },
    { id: "cncbi_motion", bank: "CNCBI", name: "Motion", currency: "CNCBI_CASH", fcf: 0.0195, modules: ["motion_base", "motion_6pct"] },
    { id: "dbs_black", bank: "DBS", name: "Black World", currency: "DBS_D", fcf: 0.0195, modules: ["dbs_black_local", "dbs_black_overseas"] }
];

const MODULES = {
    // HSBC 2026
    "em_base": { rate: 0.01, desc: "基本 1.0%" },
    "em_designated": { match: ["transport", "dining"], rate: 0.025, desc: "指定 $2/里", mode: "replace" },
    "red_online": { match: ["online"], rate: 0.04, desc: "網購 4% (首$1萬)", mode: "replace" },
    "red_supermarket": { match: ["supermarket"], rate: 0.01, desc: "超市 1%", mode: "replace" },
    "red_base": { rate: 0.004, desc: "基本 0.4%" },
    "vs_base": { rate: 0.004, desc: "基本 0.4%" },
    "vs_extra": { rate: 0.012, desc: "VS 額外 1.2%" },
    "rh_dining": { match: ["dining"], rate: 0.024, desc: "最紅自主 3.6%", mode: "add" },
    // BOC 2026
    "boc_base": { rate: 0.004, desc: "基本 0.4%" },
    "sogo_5pct": { match: ["sogo"], rate: 0.05, desc: "SOGO 5%回贈", mode: "replace" },
    "cheers_dining": { match: ["dining"], rate: 0.04, desc: "餐飲 10X (需紅日更優)", mode: "replace" },
    "cheers_overseas": { match: ["overseas"], rate: 0.04, desc: "海外 10X ($1.5/里)", mode: "replace" },
    "boc_go_mobile": { match: ["online"], rate: 0.04, desc: "手機支付 4%", mode: "replace" },
    // 恆生/AEON/Mox/CNCBI
    "mmp_base": { rate: 0.004, desc: "基本 0.4%" },
    "mmp_online": { match: ["online"], rate: 0.05, desc: "網購 5% (需簽滿$5k)", mode: "replace" },
    "mmp_overseas": { match: ["overseas"], rate: 0.06, desc: "海外 6% (需簽滿$5k)", mode: "replace" },
    "waku_online": { match: ["online"], rate: 0.06, desc: "網購 6%", mode: "replace" },
    "waku_japan": { match: ["overseas"], rate: 0.03, desc: "日本 3%", mode: "replace" },
    "waku_base": { rate: 0.005, desc: "基本 0.5%" },
    "motion_6pct": { match: ["dining", "online", "overseas"], rate: 0.06, desc: "指定 6% (首$3333)", mode: "replace" },
    "motion_base": { rate: 0.005, desc: "基本 0.5%" },
    "mox_base": { rate: 0.01, desc: "基本 1%" },
    "mox_bonus": { rate: 0.01, desc: "活期任務 +1%", mode: "add" },
    "mox_supermarket": { match: ["supermarket"], rate: 0.03, desc: "超市 3%", mode: "replace" },
    // CCB / SC / DBS
    "ccb_base": { rate: 0.004, desc: "基本 0.4%" },
    "ccb_eye_5x": { match: ["online"], rate: 0.02, desc: "網購 5X積分", mode: "replace" },
    "ccb_aia_ins": { match: ["insurance"], rate: 0.004, desc: "保險 1X積分" },
    "sc_am_base": { rate: 0.1667, desc: "基本 $6/里" },
    "sc_am_special": { match: ["dining", "overseas", "online"], rate: 0.25, desc: "指定 $4/里", mode: "replace" },
    "dbs_black_local": { rate: 0.008, desc: "本地 $6/里" },
    "dbs_black_overseas": { match: ["overseas"], rate: 0.012, desc: "海外 $4/里", mode: "replace" }
};
