/**
 * [Layer 2] Application - LedgerService
 * 로벅스(R$) 보상의 획득 및 차감 내역을 불변 장부(Ledger) 형태로 기록하고 관리합니다.
 * 단순 단일 숫자 변환이 아닌, 트랜잭션의 합(SUM)으로 잔액을 산출합니다.
 */
export class LedgerService {
    static STORAGE_KEY = 'robux_ledger_transactions';

    /**
     * @returns {Array<Object>} 트랜잭션 목록
     */
    static getTransactions() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Ledger 로드 실패:", e);
            return [];
        }
    }

    /**
     * 현재 사용자의 총 잔액을 계산합니다.
     * @returns {number} 총 로벅스 잔액
     */
    static getBalance() {
        const transactions = this.getTransactions();
        return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    }

    /**
     * 퀘스트 승인 시 지급 트랜잭션을 생성하고 저장합니다.
     * 
     * @param {Object} quest - 승인된 퀘스트 객체
     * @param {number} rewardAmount - QuestEvaluator가 계산한 최종 보상금액
     * @returns {Object} 생성된 트랜잭션 객체
     */
    static issueRewardTransaction(quest, rewardAmount) {
        const transaction = {
            transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            questId: quest.id,
            amount: rewardAmount,
            type: 'EARN',
            description: `퀘스트 완료: [${quest.title}]`,
            timestamp: new Date().toISOString()
        };

        const transactions = this.getTransactions();
        transactions.unshift(transaction); // 최신순

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
        } catch (e) {
            console.error("Ledger 저장 실패:", e);
        }

        return transaction;
    }
}
