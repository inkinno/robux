/**
 * [Domain] 퀘스트 항목 (QuestItem) 모델
 * 고정형(fix) 및 자율형(custom) 퀘스트와 완료형(button) 및 수치형(numeric) 체킹을 지원합니다.
 */

export class QuestItem {
    constructor({
        id = `quest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title = '',
        description = '',
        natureType = 'fix', // 'fix' | 'custom'
        checkType = 'button', // 'button' | 'numeric'
        stepGap = 1, // 칸당 이동 간격
        totalDuration = 7, // 총 횟수 / 기간
        checks = [],
        bestRecord = 0
    }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.natureType = natureType;
        this.checkType = checkType;
        this.stepGap = Number(stepGap) || 1;
        this.totalDuration = Number(totalDuration) || 7;
        this.bestRecord = Number(bestRecord) || 0;

        // checks 배열 초기화 (없을 경우 totalDuration만큼 기본 생성)
        if (checks && checks.length > 0) {
            this.checks = checks;
        } else {
            this.checks = Array.from({ length: this.totalDuration }, (_, index) => ({
                step: index + 1,
                done: false,
                value: 0,
                completedAt: null
            }));
        }
    }

    /**
     * 체크 완료 상태 업데이트
     * @param {number} stepIndex - 체크 항목 인덱스 (0-indexed)
     * @param {number|null} inputValue - 수치형일 경우 입력값
     * @returns {{ isCompleted: boolean, isNewBest: boolean, previousBest: number }}
     */
    toggleCheck(stepIndex, inputValue = null) {
        if (stepIndex < 0 || stepIndex >= this.checks.length) {
            return { isCompleted: false, isNewBest: false, previousBest: this.bestRecord };
        }

        const target = this.checks[stepIndex];
        let isNewBest = false;
        const previousBest = this.bestRecord;

        if (this.checkType === 'numeric') {
            const numValue = Number(inputValue) || 0;
            target.done = true;
            target.value = numValue;
            target.completedAt = new Date().toISOString();

            if (numValue > this.bestRecord) {
                this.bestRecord = numValue;
                isNewBest = true;
            }
        } else {
            // 버튼형
            target.done = !target.done;
            target.completedAt = target.done ? new Date().toISOString() : null;
        }

        return {
            isCompleted: target.done,
            isNewBest,
            previousBest
        };
    }

    /**
     * 완료된 체크 수 반환
     */
    getCompletedCount() {
        return this.checks.filter(c => c.done).length;
    }

    /**
     * 전체 퀘스트 항목 완료 여부
     */
    isAllCompleted() {
        return this.checks.length > 0 && this.checks.every(c => c.done);
    }
}
