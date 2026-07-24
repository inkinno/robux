import { QuestEvaluator } from '../domain/evaluators.js';
import { LedgerService } from './ledger.js';

/**
 * [Layer 2] Application - QuestStateMachine
 * 퀘스트의 수명주기 및 상태 전이를 엄격히 제어하는 유효성 검증 스테이트 머신입니다.
 */
export class QuestStateMachine {
    /**
     * 아이가 퀘스트 수행을 시작합니다. (pending -> in_progress)
     */
    static startQuest(quest) {
        if (quest.status !== 'pending') {
            throw new Error("'pending' 상태의 퀘스트만 시작할 수 있습니다.");
        }
        return {
            ...quest,
            status: 'in_progress',
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * 아이가 퀘스트 수행을 완료하고 부모 승인을 요청합니다. (in_progress -> pending_approval)
     */
    static requestApproval(quest) {
        if (quest.status !== 'in_progress') {
            throw new Error("'in_progress' 상태의 퀘스트만 승인 요청할 수 있습니다.");
        }
        return {
            ...quest,
            status: 'pending_approval',
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * 부모가 퀘스트 완료를 승인합니다. (pending_approval -> completed)
     * QuestEvaluator를 호출하여 최종 보상금을 산출하고 장부에 적재합니다.
     */
    static approveQuest(quest) {
        if (quest.status !== 'pending_approval') {
            throw new Error("'pending_approval' 상태의 퀘스트만 승인할 수 있습니다.");
        }

        // Layer 1 domain evaluator 호출 (조건 미충족 시 예외 발생)
        const rewardToIssue = QuestEvaluator.calculateFinalReward(quest);

        // Layer 2 ledger 서비스 호출하여 보상 적재
        LedgerService.issueRewardTransaction(quest, rewardToIssue);

        const updatedQuest = {
            ...quest,
            status: 'completed',
            updatedAt: new Date().toISOString()
        };

        return { updatedQuest, rewardToIssue };
    }

    /**
     * 부모가 승인 요청을 반려하여 다시 수행 단계로 돌려보냅니다. (pending_approval -> in_progress)
     */
    static rejectQuest(quest) {
        if (quest.status !== 'pending_approval') {
            throw new Error("'pending_approval' 상태의 퀘스트만 반려할 수 있습니다.");
        }
        return {
            ...quest,
            status: 'in_progress',
            updatedAt: new Date().toISOString()
        };
    }
}

/**
 * [Layer 2] Application - QuestStore
 * 퀘스트 컬렉션 전역 상태를 관리하고 localStorage 와 동기화하며, 구독자 패턴을 통해 UI를 갱신합니다.
 */
export class QuestStore {
    static STORAGE_KEY = 'robux_active_quests';
    static listeners = [];

    static subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
        }
    }

    static notify() {
        const quests = this.getQuests();
        this.listeners.forEach(fn => fn(quests));
    }

    static getQuests() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("QuestStore 로드 실패:", e);
            return [];
        }
    }

    static getQuestById(id) {
        return this.getQuests().find(q => q.id === id);
    }

    static saveQuests(quests) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quests));
            this.notify();
        } catch (e) {
            console.error("QuestStore 저장 실패:", e);
        }
    }

    /**
     * 프리셋 템플릿으로부터 신규 퀘스트 인스턴스를 생성합니다.
     */
    static createFromPreset(preset) {
        const newQuest = {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            presetId: preset.presetId,
            category: preset.category,
            title: preset.title,
            description: preset.description,
            type: preset.type,
            status: 'pending',
            baseReward: preset.baseReward,
            config: JSON.parse(JSON.stringify(preset.config)),
            uiStyle: preset.uiStyle || { icon: '🎯', color: 'blue' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const quests = this.getQuests();
        quests.unshift(newQuest);
        this.saveQuests(quests);
        return newQuest;
    }

    static updateQuestConfig(id, configUpdater) {
        const quests = this.getQuests();
        const index = quests.findIndex(q => q.id === id);
        if (index === -1) return;

        const currentQuest = quests[index];
        const newConfig = typeof configUpdater === 'function' 
            ? configUpdater(currentQuest.config) 
            : { ...currentQuest.config, ...configUpdater };

        quests[index] = {
            ...currentQuest,
            config: newConfig,
            updatedAt: new Date().toISOString()
        };

        this.saveQuests(quests);
    }

    static startQuest(id) {
        const quest = this.getQuestById(id);
        if (!quest) return;
        const updated = QuestStateMachine.startQuest(quest);
        this.replaceQuest(updated);
    }

    static requestApproval(id) {
        const quest = this.getQuestById(id);
        if (!quest) return;
        const updated = QuestStateMachine.requestApproval(quest);
        this.replaceQuest(updated);
    }

    static approveQuest(id) {
        const quest = this.getQuestById(id);
        if (!quest) return null;
        const { updatedQuest, rewardToIssue } = QuestStateMachine.approveQuest(quest);
        this.replaceQuest(updatedQuest);
        return rewardToIssue;
    }

    static rejectQuest(id) {
        const quest = this.getQuestById(id);
        if (!quest) return;
        const updated = QuestStateMachine.rejectQuest(quest);
        this.replaceQuest(updated);
    }

    static deleteQuest(id) {
        const quests = this.getQuests().filter(q => q.id !== id);
        this.saveQuests(quests);
    }

    static replaceQuest(updatedQuest) {
        const quests = this.getQuests();
        const index = quests.findIndex(q => q.id === updatedQuest.id);
        if (index !== -1) {
            quests[index] = updatedQuest;
            this.saveQuests(quests);
        }
    }
}
