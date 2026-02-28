// matcher.js — 商戶搜尋與識別

let merchantDB = [];

/**
 * 載入商戶資料庫
 * @param {Array} data - 來自 merchants.json
 */
export function loadMerchants(data) {
    merchantDB = data;
}

/**
 * 搜尋商戶（三層 fallback）
 * @param {string} input
 * @returns {Object|null} 符合的商戶
 */
export function findMerchant(input) {
    if (!input) return null;
    const q = input.toLowerCase().trim();

    // 第一層：完全符合（名稱或別名）
    let match = merchantDB.find(m =>
        m.name.toLowerCase() === q ||
        m.aliases.some(a => a.toLowerCase() === q)
    );
    if (match) return match;

    // 第二層：單詞符合
    match = merchantDB.find(m =>
        m.name.toLowerCase().split(/[\s()\/]+/).includes(q) ||
        m.aliases.some(a => a.toLowerCase().split(/[\s()\/]+/).includes(q))
    );
    if (match) return match;

    // 第三層：包含搜尋（最少 2 個字符，避免誤匹配）
    if (q.length >= 2) {
        match = merchantDB.find(m =>
            m.name.toLowerCase().includes(q) ||
            m.aliases.some(a => a.toLowerCase().includes(q))
        );
        if (match) return match;
    }
    return null;
}

/**
 * 取得所有商戶名稱 + 別名（供 autocomplete 使用）
 * @returns {string[]}
 */
export function getAllMerchantKeywords() {
    return merchantDB.flatMap(m => [m.name, ...m.aliases]);
}
