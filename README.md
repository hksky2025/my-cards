# 💳 智能簽賬軍師 V56.0

模組化重構版，JSON 驅動，Firebase 雲端同步。

## 📁 文件結構

```
├── index.html              # 主界面（純 UI）
├── js/
│   ├── app.js              # 主程式入口
│   ├── calculator.js       # 計算邏輯（Pure Functions）
│   ├── matcher.js          # 商戶識別
│   ├── renderer.js         # UI 渲染
│   └── firebase.js         # Firebase Auth + Firestore
├── data/
│   ├── merchants.json      # ✅ 商戶資料庫（日常更新）
│   ├── cards.json          # ✅ 信用卡資料（優惠變動時更新）
│   └── promotions.json     # ✅ 限時優惠（最常更新）
├── firebase.json           # Firebase Hosting 設定
└── firestore.rules         # Firestore 安全規則
```

---

## 🔧 一次性設定

### 1. Firebase 設定
在 `js/firebase.js` 填入你的 Firebase 設定：
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    ...
};
```

### 2. Firebase Console 開啟服務
- **Authentication** → 啟用「匿名」登入方式
- **Firestore Database** → 建立資料庫（Production 模式）
- **Hosting** → 啟用

### 3. 部署
```bash
npm install -g firebase-tools
firebase login
firebase init   # 選 Hosting + Firestore
firebase deploy
```

---

## 📝 日常數據更新（最重要）

### 新增商戶（`data/merchants.json`）
```json
{
  "name": "商戶名稱",
  "aliases": ["別名1", "alias2"],
  "cat": "Dining",
  "sub": "BOC_CRAZY",
  "meth": "ApplePay"
}
```

**cat 可選值：**
`General` / `Dining` / `Online` / `Electronics` / `Super` / `Transport` / `Home` / `Pet` / `Leisure` / `Medical` / `Travel` / `Jewelry` / `Coffee` / `Overseas`

**sub 可選值：**
`EM` (EveryMile) / `VS` (賞家居) / `BOC_CRAZY` (狂賞派) / `CX_CRAZY` (國泰) / `Red8_BOC` (8% Red) / `EYE` (eye卡) / `MANNINGS`

---

### 新增限時優惠（`data/promotions.json`）
```json
{
  "id": "唯一ID",
  "bank": "hsbc",
  "name": "優惠名稱",
  "startDate": "2026-03-01",
  "endDate": "2026-05-31",
  "keywords": ["商戶關鍵字"],
  "minAmt": 300,
  "remarks": "⚠️ 備注",
  "bonus": {
    "type": "percentage_cap",
    "baseRate": 0.05,
    "baseCap": 200,
    "redDayRate": 0.03,
    "redDayCap": 100
  }
}
```

**更新後：**
```bash
git add data/
git commit -m "更新XX優惠"
git push
firebase deploy --only hosting
```

---

## 🚀 GitHub Pages 部署（替代方案）

如果不使用 Firebase Hosting，可直接用 GitHub Pages：
1. Repo Settings → Pages → Branch: main
2. 注意：Firebase Auth 仍需要正確設定 Authorized domains（加入 `yourusername.github.io`）

---

## ⚠️ 注意事項

- 所有 `.js` 檔案使用 ES Module（`type="module"`），必須透過 HTTP 伺服器運行，**不可直接開啟 HTML 檔案**
- Firebase Anonymous Auth 會為每部裝置生成唯一 UID，清除瀏覽器資料會重置
- `data/` 資料夾下的 JSON 修改後，瀏覽器會在下次訪問時自動讀取最新版本（Cache-Control: 1小時）
