// firebase.js — Firebase Auth + Firestore 雲端同步 (v2)
// 管理：卡片狀態 + 交易記錄

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ⚠️ 填入你的 Firebase 項目設定
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// ── Auth ──────────────────────────────────────────────
export async function initAuth(onReady) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            updateSyncStatus('✅ 雲端同步已連接');
            onReady(user);
        } else {
            try {
                const result = await signInAnonymously(auth);
                currentUser = result.user;
                updateSyncStatus('✅ 雲端同步已連接');
                onReady(currentUser);
            } catch (err) {
                console.error('Firebase Auth 失敗:', err);
                updateSyncStatus('⚠️ 離線模式（本地儲存）');
                onReady(null);
            }
        }
    });
}

// ── 卡片狀態 ──────────────────────────────────────────
export async function loadCardStatus() {
    if (!currentUser) return loadFromLocal('cardStatus');
    try {
        const ref = doc(db, 'users', currentUser.uid, 'settings', 'cardStatus');
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data().status : null;
    } catch (err) {
        console.warn('Firestore 讀取失敗，降級至 localStorage', err);
        return loadFromLocal('cardStatus');
    }
}

export async function saveCardStatus(cardStatus) {
    if (!currentUser) return saveToLocal('cardStatus', cardStatus);
    try {
        const ref = doc(db, 'users', currentUser.uid, 'settings', 'cardStatus');
        await setDoc(ref, { status: cardStatus, updatedAt: new Date().toISOString() });
    } catch (err) {
        console.warn('Firestore 儲存失敗', err);
        saveToLocal('cardStatus', cardStatus);
    }
}

// ── 交易記錄 ──────────────────────────────────────────
export async function loadTransactions() {
    if (!currentUser) return loadFromLocal('transactions') || [];
    try {
        const col = collection(db, 'users', currentUser.uid, 'transactions');
        const snap = await getDocs(col);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
        console.warn('交易記錄讀取失敗', err);
        return loadFromLocal('transactions') || [];
    }
}

export async function saveTransaction(txn) {
    if (!currentUser) {
        const local = loadFromLocal('transactions') || [];
        local.unshift(txn);
        saveToLocal('transactions', local);
        return txn;
    }
    try {
        const col = collection(db, 'users', currentUser.uid, 'transactions');
        const ref = await addDoc(col, { ...txn, createdAt: new Date().toISOString() });
        return { ...txn, id: ref.id };
    } catch (err) {
        console.warn('交易記錄儲存失敗', err);
        return txn;
    }
}

export async function removeTransaction(id) {
    if (!currentUser) {
        const local = (loadFromLocal('transactions') || []).filter(t => t.id !== id);
        saveToLocal('transactions', local);
        return;
    }
    try {
        const ref = doc(db, 'users', currentUser.uid, 'transactions', id);
        await deleteDoc(ref);
    } catch (err) {
        console.warn('交易記錄刪除失敗', err);
    }
}

// ── 工具 ──────────────────────────────────────────────
function updateSyncStatus(msg) {
    const el = document.getElementById('syncStatus');
    if (el) el.textContent = msg;
}

const LOCAL_KEY_PREFIX = 'cardAdvisor_';
function loadFromLocal(key) {
    const s = localStorage.getItem(LOCAL_KEY_PREFIX + key);
    return s ? JSON.parse(s) : null;
}
function saveToLocal(key, data) {
    localStorage.setItem(LOCAL_KEY_PREFIX + key, JSON.stringify(data));
}
