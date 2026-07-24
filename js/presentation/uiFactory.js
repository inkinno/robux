import {
    renderChecklist,
    renderProgress,
    renderConditional,
    renderMilestone,
    renderRecord
} from './components.js';
import { QuestStore } from '../application/store.js';

/**
 * [Layer 3] Presentation - QuestCardFactory
 * Factory Pattern을 적용하여 퀘스트의 type과 status에 따라 알맞은 카드 UI 및 액션 버튼을 반환합니다.
 */
export class QuestCardFactory {
    /**
     * @param {Object} quest - 퀘스트 JSON 객체
     * @param {Function} [onApproveSuccess] - 승인 완료 시 보상금 전달 콜백 (애니메이션 유도용)
     * @returns {HTMLElement} 동적 생성된 퀘스트 카드 DOM 요소
     */
    static createCard(quest, onApproveSuccess) {
        const card = document.createElement('div');
        card.className = `quest-card ${quest.status}`;
        card.id = quest.id;

        const statusLabels = {
            'pending': '대기 중',
            'in_progress': '수행 중',
            'pending_approval': '부모 승인 대기',
            'completed': '보상 완료'
        };

        const icon = quest.uiStyle?.icon || '🎯';

        // 1. 공통 퀘스트 헤더
        card.innerHTML = `
            <div class="card-header">
                <h3>${icon} ${quest.title}</h3>
                <span class="badge ${quest.type.toLowerCase()}">${quest.type}</span>
            </div>
            <div>
                <span class="status-indicator ${quest.status}">${statusLabels[quest.status] || quest.status}</span>
            </div>
            <p class="card-description">${quest.description}</p>
            <div class="card-body"></div>
            <div class="card-footer">
                <div class="reward-info">기본 보상: ${quest.baseReward} R$</div>
                <div class="card-actions btn-group"></div>
            </div>
        `;

        const cardBody = card.querySelector('.card-body');
        const cardActions = card.querySelector('.card-actions');

        // 2. 타입별 다형성 컴포넌트 렌더링
        switch (quest.type) {
            case 'CHECKLIST':
                cardBody.appendChild(renderChecklist(quest));
                break;
            case 'PROGRESS':
                cardBody.appendChild(renderProgress(quest));
                break;
            case 'CONDITIONAL':
                cardBody.appendChild(renderConditional(quest));
                break;
            case 'MILESTONE':
                cardBody.appendChild(renderMilestone(quest));
                break;
            case 'RECORD':
                cardBody.appendChild(renderRecord(quest));
                break;
            default:
                cardBody.innerHTML = `<div style="color:red;">알 수 없는 타입: ${quest.type}</div>`;
        }

        // 3. 상태(status)별 액션 버튼 주입
        if (quest.status === 'pending') {
            const btnStart = document.createElement('button');
            btnStart.className = 'btn-action btn-primary';
            btnStart.textContent = '▶ 퀘스트 시작';
            btnStart.addEventListener('click', () => QuestStore.startQuest(quest.id));

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-action btn-secondary';
            btnDelete.textContent = '삭제';
            btnDelete.addEventListener('click', () => QuestStore.deleteQuest(quest.id));

            cardActions.appendChild(btnStart);
            cardActions.appendChild(btnDelete);
        } else if (quest.status === 'in_progress') {
            const btnSubmit = document.createElement('button');
            btnSubmit.className = 'btn-action btn-success';
            btnSubmit.textContent = '📩 검증 요청';
            btnSubmit.addEventListener('click', () => {
                try {
                    QuestStore.requestApproval(quest.id);
                } catch (err) {
                    alert(err.message);
                }
            });

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-action btn-secondary';
            btnDelete.textContent = '취소';
            btnDelete.addEventListener('click', () => QuestStore.deleteQuest(quest.id));

            cardActions.appendChild(btnSubmit);
            cardActions.appendChild(btnDelete);
        } else if (quest.status === 'pending_approval') {
            const btnApprove = document.createElement('button');
            btnApprove.className = 'btn-action btn-success';
            btnApprove.textContent = '✅ 부모 승인';
            btnApprove.addEventListener('click', () => {
                try {
                    const rewardAmount = QuestStore.approveQuest(quest.id);
                    if (rewardAmount !== null && typeof onApproveSuccess === 'function') {
                        onApproveSuccess(rewardAmount);
                    }
                } catch (err) {
                    alert(`[승인 불가] ${err.message}`);
                }
            });

            const btnReject = document.createElement('button');
            btnReject.className = 'btn-action btn-danger';
            btnReject.textContent = '❌ 반려';
            btnReject.addEventListener('click', () => {
                QuestStore.rejectQuest(quest.id);
            });

            cardActions.appendChild(btnApprove);
            cardActions.appendChild(btnReject);
        } else if (quest.status === 'completed') {
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-action btn-secondary';
            btnDelete.textContent = '기록 삭제';
            btnDelete.addEventListener('click', () => QuestStore.deleteQuest(quest.id));

            cardActions.appendChild(btnDelete);
        }

        return card;
    }
}
