import { QuestEvaluator } from '../domain/evaluators.js';
import { LedgerService } from './ledger.js';
import { fetchQuestsFromDB, saveQuestToDB, deleteQuestFromDB } from '../infrastructure/db.js';

export class QuestStateMachine {
    static startQuest(quest) {
        if (quest.status !== 'pending') throw new Error("'pending' 상태만 시작 가능합니다.");
        return { ...quest, status: 'in_progress', updatedAt: new Date().toISOString() };
    }

    static requestApproval(quest) {
        if (quest.status !== 'in_progress') throw new Error("'in_progress' 상태만 승인 요청 가능합니다.");
        return { ...quest, status: 'pending_approval', updatedAt: new Date().toISOString() };
    }

    static async approveQuest(quest) {
        if (quest.status !== 'pending_approval') throw new Error("'pending_approval' 상태만 승인 가능합니다.");
        
        // 동기 평가 로직
        const rewardToIssue = QuestEvaluator.calculateFinalReward(quest);
        
        // 비동기 장부 적재
        await LedgerService.issueRewardTransaction(quest, rewardToIssue);
        
        const updatedQuest = { ...quest, status: 'completed', updatedAt: new Date().toISOString() };
        return { updatedQuest, rewardToIssue };
    }

    static rejectQuest(quest) {
        if (quest.status !== 'pending_approval') throw new Error("'pending_approval' 상태만 반려 가능합니다.");
        return { ...quest, status: 'in_progress', updatedAt: new Date().toISOString() };
    }
}

export class QuestStore {
    static quests = [];
    static currentUid = null;
    static listeners = [];

    static subscribe(listener) {
        if (typeof listener === 'function') this.listeners.push(listener);
    }

    static notify() {
        this.listeners.forEach(fn => fn(this.quests));
    }

    static setUid(uid) {
        this.currentUid = uid;
    }

    static async loadQuests() {
        if (!this.currentUid) return;
        this.quests = await fetchQuestsFromDB(this.currentUid);
        this.notify();
    }

    static getQuests() {
        return this.quests;
    }

    static getQuestById(id) {
        return this.quests.find(q => q.id === id);
    }

    static async createFromPreset(preset) {
        if (!this.currentUid) return null;
        
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

        this.quests.unshift(newQuest);
        this.notify(); // 낙관적 렌더링
        await saveQuestToDB(this.currentUid, newQuest);
        return newQuest;
    }

    static async updateQuestConfig(id, configUpdater) {
        if (!this.currentUid) return;
        const index = this.quests.findIndex(q => q.id === id);
        if (index === -1) return;

        const currentQuest = this.quests[index];
        const newConfig = typeof configUpdater === 'function' 
            ? configUpdater(currentQuest.config) 
            : { ...currentQuest.config, ...configUpdater };

        const updatedQuest = {
            ...currentQuest,
            config: newConfig,
            updatedAt: new Date().toISOString()
        };

        this.quests[index] = updatedQuest;
        this.notify();
        await saveQuestToDB(this.currentUid, updatedQuest);
    }

    static async startQuest(id) {
        const quest = this.getQuestById(id);
        if (!quest) return;
        const updated = QuestStateMachine.startQuest(quest);
        await this.replaceQuest(updated);
    }

    static async requestApproval(id) {
        const quest = this.getQuestById(id);
        if (!quest) return;
        const updated = QuestStateMachine.requestApproval(quest);
        await this.replaceQuest(updated);
    }

    static async approveQuest(id) {
        const quest = this.getQuestById(id);
        if (!quest) return null;
        
        // approveQuest가 이제 async
        const { updatedQuest, rewardToIssue } = await QuestStateMachine.approveQuest(quest);
        await this.replaceQuest(updatedQuest);
        return rewardToIssue;
    }

    static async rejectQuest(id) {
        const quest = this.getQuestById(id);
        if (!quest) return;
        const updated = QuestStateMachine.rejectQuest(quest);
        await this.replaceQuest(updated);
    }

    static async deleteQuest(id) {
        if (!this.currentUid) return;
        this.quests = this.quests.filter(q => q.id !== id);
        this.notify();
        await deleteQuestFromDB(this.currentUid, id);
    }

    static async replaceQuest(updatedQuest) {
        if (!this.currentUid) return;
        const index = this.quests.findIndex(q => q.id === updatedQuest.id);
        if (index !== -1) {
            this.quests[index] = updatedQuest;
            this.notify();
            await saveQuestToDB(this.currentUid, updatedQuest);
        }
    }
}
