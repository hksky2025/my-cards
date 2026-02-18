// firebase.js — Firebase Auth + Firestore 卡片狀態雲端同步
// 需要在 index.html 先引入 Firebase SDK

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ⚠️ 填入你的 Firebase 項目設定
const firebaseConfig = {
  apiKey: "AIzaSyDI_l82e8kf1AmtGd03-pHy_huNl-84TA0",
  authDomain: "card-46fe5.firebaseapp.com",
  projectId: "card-46fe5",
  storageBucket: "card-46fe5.firebasestorage.app",
  messagingSenderId: "1022014496693",
  appId: "1:1022014496693:web:265f9317cbc40dba4443fc",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

/**
 * 初始化 Firebase Auth（匿名登入）
 * @param {Function} onReady - 認證完成後的 callback(user)
 */
export async function initAuth(onReady) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('✅ Firebase: 已登入', user.uid);
            onReady(user);
        } else {
            try {
                const result = await signInAnonymously(auth);
                currentUser = result.user;
                console.log('✅ Firebase: 匿名登入成功', currentUser.uid);
                onReady(currentUser);
            } catch (err) {
                console.error('❌ Firebase Auth 失敗:', err);
                // 降級至 localStorage
                onReady(null);
            }
        }
    });
}

/**
 * 從 Firestore 讀取用戶卡片狀態
 * @returns {Object|null} cardStatus 或 null（失敗時）
 */
export async function loadCardStatus() {
    if (!currentUser) return loadFromLocal();
    try {
        const ref = doc(db, 'users', currentUser.uid, 'settings', 'cardStatus');
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data().status;
        return null;
    } catch (err) {
        console.warn('Firestore 讀取失敗，降級至 localStorage', err);
        return loadFromLocal();
    }
}

/**
 * 儲存用戶卡片狀態至 Firestore
 * @param {Object} cardStatus
 */
export async function saveCardStatus(cardStatus) {
    if (!currentUser) return saveToLocal(cardStatus);
    try {
        const ref = doc(db, 'users', currentUser.uid, 'settings', 'cardStatus');
        await setDoc(ref, { status: cardStatus, updatedAt: new Date().toISOString() });
    } catch (err) {
        console.warn('Firestore 儲存失敗，降級至 localStorage', err);
        saveToLocal(cardStatus);
    }
}

// ── localStorage 降級方案 ──────────────────────────────
const LOCAL_KEY = 'cardAdvisor_cardStatus';

function loadFromLocal() {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? JSON.parse(saved) : null;
}

function saveToLocal(status) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(status));
}
