import { db } from './firebase.js';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

/**
 * [Layer 3 - Infrastructure] Firestore DB
 */

export async function fetchQuestsFromDB(uid) {
    if (!uid) return [];
    try {
        const questsRef = collection(db, 'users', uid, 'quests');
        const q = query(questsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const quests = [];
        snapshot.forEach(docSnap => {
            quests.push(docSnap.data());
        });
        return quests;
    } catch (e) {
        console.error("DB 퀘스트 로드 에러:", e);
        return [];
    }
}

export async function saveQuestToDB(uid, quest) {
    if (!uid) return;
    try {
        const questDoc = doc(db, 'users', uid, 'quests', quest.id);
        await setDoc(questDoc, quest);
    } catch (e) {
        console.error("DB 퀘스트 저장 에러:", e);
        throw e;
    }
}

export async function deleteQuestFromDB(uid, questId) {
    if (!uid) return;
    try {
        const questDoc = doc(db, 'users', uid, 'quests', questId);
        await deleteDoc(questDoc);
    } catch (e) {
        console.error("DB 퀘스트 삭제 에러:", e);
        throw e;
    }
}

export async function fetchLedgerFromDB(uid) {
    if (!uid) return [];
    try {
        const ledgerRef = collection(db, 'users', uid, 'ledger');
        const q = query(ledgerRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const txs = [];
        snapshot.forEach(docSnap => {
            txs.push(docSnap.data());
        });
        return txs;
    } catch (e) {
        console.error("DB 장부 로드 에러:", e);
        return [];
    }
}

export async function saveTransactionToDB(uid, transaction) {
    if (!uid) return;
    try {
        const txDoc = doc(db, 'users', uid, 'ledger', transaction.transactionId);
        await setDoc(txDoc, transaction);
    } catch (e) {
        console.error("DB 트랜잭션 저장 에러:", e);
        throw e;
    }
}
