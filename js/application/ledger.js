import { fetchLedgerFromDB, saveTransactionToDB } from '../infrastructure/db.js';

/**
 * [Layer 2] Application - LedgerService (Async DB 버전)
 * 로벅스(R$) 보상의 획득 및 차감 내역을 불변 장부(Ledger) 형태로 기록하고 관리합니다.
 */
export class LedgerService {
    static transactions = [];
    static currentUid = null;
    static listeners = [];

    static subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
        }
    }

    static notify() {
        this.listeners.forEach(fn => fn());
    }

    static setUid(uid) {
        this.currentUid = uid;
    }

    /**
     * DB에서 전체 트랜잭션을 비동기로 불러와 메모리에 적재합니다.
     */
    static async loadTransactions() {
        if (!this.currentUid) return;
        this.transactions = await fetchLedgerFromDB(this.currentUid);
        this.notify();
    }

    static getTransactions() {
        return this.transactions;
    }

    static getBalance() {
        return this.transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    }

    /**
     * 퀘스트 승인 시 지급 트랜잭션을 생성하고 DB에 비동기 저장합니다.
     */
    static async issueRewardTransaction(quest, rewardAmount) {
        if (!this.currentUid) throw new Error("로그인 유저 정보가 없습니다.");

        const transaction = {
            transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            questId: quest.id,
            amount: rewardAmount,
            type: 'EARN',
            description: `퀘스트 완료: [${quest.title}]`,
            timestamp: new Date().toISOString()
        };

        // 로컬에 먼저 반영 (낙관적 UI 업데이트)
        this.transactions.unshift(transaction);
        this.notify();

        // 원격 DB 저장
        await saveTransactionToDB(this.currentUid, transaction);

        return transaction;
    }
}
