const DATA_RULES = {
    zeroRewardByCardPrefix: { hsbc: ["alipay", "wechat"] },
    categoryAliases: { citysuper: { default: "grocery", byPrefix: { hsbc: "style" } } }
};
const DATA = { cards: cardsDB, modules: modulesDB, conversions: conversionDB, redHotCategories: redHotCategories, rules: DATA_RULES };
