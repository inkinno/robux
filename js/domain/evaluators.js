/**
 * [Layer 1] Domain - QuestEvaluator
 * DOM API 및 외부 상태에 전혀 의존하지 않고, 순수 JSON 퀘스트 객체를 평가하여
 * 최종 지급될 보상 금액을 산출하는 순수 비즈니스 로직 클래스입니다.
 */
export class QuestEvaluator {
    /**
     * 퀘스트 조건 달성 여부를 검증하고 최종 보상 금액(R$)을 반환합니다.
     * 조건 미충족 시 예외(Error)를 발생시킵니다.
     * 
     * @param {Object} quest - 퀘스트 JSON 데이터
     * @returns {number} 최종 보상 금액
     */
    static calculateFinalReward(quest) {
        if (!quest || !quest.type || !quest.config) {
            throw new Error("유효하지 않은 퀘스트 데이터 구조입니다.");
        }

        switch (quest.type) {
            case 'CHECKLIST':
                return this.evaluateChecklist(quest);
            case 'PROGRESS':
                return this.evaluateProgress(quest);
            case 'CONDITIONAL':
                return this.evaluateConditional(quest);
            case 'MILESTONE':
                return this.evaluateMilestone(quest);
            case 'RECORD':
                return this.evaluateRecord(quest);
            default:
                throw new Error(`지원하지 않는 퀘스트 타입입니다: ${quest.type}`);
        }
    }

    static evaluateChecklist(quest) {
        if (!quest.config.isCompleted) {
            throw new Error("체크리스트가 완료 상태가 아닙니다.");
        }
        return quest.baseReward;
    }

    static evaluateProgress(quest) {
        const { currentValue, targetValue } = quest.config;
        if (typeof currentValue !== 'number' || typeof targetValue !== 'number') {
            throw new Error("프로그레스 진행 값 데이터가 올바르지 않습니다.");
        }
        if (currentValue < targetValue) {
            throw new Error(`목표치(${targetValue})에 도달하지 못했습니다. (현재: ${currentValue})`);
        }
        return quest.baseReward;
    }

    static evaluateConditional(quest) {
        const outcome = quest.config.selectedOutcome;
        if (!outcome || !quest.config.outcomeRewards || typeof quest.config.outcomeRewards[outcome] !== 'number') {
            throw new Error("부모 승인 시 유효한 수행 결과(WIN/DRAW/LOSE 등)를 선택해야 합니다.");
        }
        return quest.config.outcomeRewards[outcome];
    }

    static evaluateMilestone(quest) {
        const { currentStep, totalSteps, finalBonus } = quest.config;
        if (currentStep < totalSteps) {
            throw new Error(`모든 마일스톤 단계(${totalSteps}단계)를 달성해야 최종 완수가 가능합니다.`);
        }
        return quest.baseReward + (finalBonus || 0);
    }

    static evaluateRecord(quest) {
        const { currentRecord, targetRecord, isLowerBetter, successBonus } = quest.config;
        if (currentRecord === null || currentRecord === undefined || isNaN(currentRecord)) {
            throw new Error("측정된 기록 값이 제출되지 않았습니다.");
        }

        const isSuccess = isLowerBetter
            ? currentRecord <= targetRecord
            : currentRecord >= targetRecord;

        return isSuccess
            ? quest.baseReward + (successBonus || 0)
            : quest.baseReward;
    }
}
