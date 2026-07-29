/**
 * [Domain] QuestTable 도메인 모델
 * 테이블 메타데이터 및 유저 복사 인스턴스 (N번째 재도전 / 첫 도전) 관리를 전담합니다.
 */

import { QuestItem } from './questItem.js';

export class QuestTable {
    constructor({
        id,
        instanceId = null,
        title = '새 퀘스트 테이블',
        authorId = 'anonymous',
        authorName = '익명 작성자',
        userId = null,
        userName = null,
        createdAt = new Date().toISOString(),
        downloadedAt = null,
        completedAt = null,
        attemptCount = 1,
        quests = []
    }) {
        this.id = id; // 알파벳2+숫자6 (예: AB123456)
        this.instanceId = instanceId || `${id}_${userId || 'guest'}_${attemptCount}`;
        this.title = title;
        this.authorId = authorId;
        this.authorName = authorName;
        this.userId = userId;
        this.userName = userName;
        this.createdAt = createdAt;
        this.downloadedAt = downloadedAt;
        this.completedAt = completedAt;
        this.attemptCount = Number(attemptCount) || 1;

        // QuestItem 객체 변환
        this.quests = quests.map(q => q instanceof QuestItem ? q : new QuestItem(q));
    }

    /**
     * 도전 멘트 텍스트 생성
     * 1회: "첫 도전! 🔥", 2회 이상: "2번째 재도전! 🚀"
     */
    getAttemptLabel() {
        if (this.attemptCount <= 1) {
            return '첫 도전! 🔥';
        }
        return `${this.attemptCount}번째 재도전! 🚀`;
    }

    /**
     * 전체 QT의 진행률 (0 ~ 100%)
     */
    getProgressPercent() {
        if (this.quests.length === 0) return 0;

        let totalChecks = 0;
        let completedChecks = 0;

        this.quests.forEach(quest => {
            totalChecks += quest.checks.length;
            completedChecks += quest.getCompletedCount();
        });

        if (totalChecks === 0) return 0;
        return Math.round((completedChecks / totalChecks) * 100);
    }

    /**
     * QT 내부의 모든 퀘스트가 완전 완료되었는지 여부
     */
    isAllQuestsFinished() {
        if (this.quests.length === 0) return false;
        return this.quests.every(quest => quest.isAllCompleted());
    }

    /**
     * 최종 완료 처리
     */
    markFinalCompletion() {
        if (this.isAllQuestsFinished() && !this.completedAt) {
            this.completedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * JSON 변환용 객체 리턴
     */
    toPlainObject() {
        return {
            id: this.id,
            instanceId: this.instanceId,
            title: this.title,
            authorId: this.authorId,
            authorName: this.authorName,
            userId: this.userId,
            userName: this.userName,
            createdAt: this.createdAt,
            downloadedAt: this.downloadedAt,
            completedAt: this.completedAt,
            attemptCount: this.attemptCount,
            quests: this.quests.map(q => ({
                id: q.id,
                title: q.title,
                description: q.description,
                natureType: q.natureType,
                checkType: q.checkType,
                stepGap: q.stepGap,
                totalDuration: q.totalDuration,
                bestRecord: q.bestRecord,
                checks: q.checks
            }))
        };
    }
}
