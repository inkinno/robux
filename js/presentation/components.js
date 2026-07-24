import { QuestStore } from '../application/store.js';

/**
 * [Layer 3] Presentation - Individual Quest Type UI Components
 * 각 퀘스트 타입별 렌더링 및 UI 조작 핸들러
 */

export function renderChecklist(quest) {
    const container = document.createElement('div');
    container.className = 'checklist-container';
    
    const isDone = quest.config.isCompleted;
    const isDisabled = quest.status === 'completed' || quest.status === 'pending_approval';

    container.innerHTML = `
        <label class="outcome-label" style="cursor: ${isDisabled ? 'default' : 'pointer'};">
            <span>실천 여부 체크</span>
            <input type="checkbox" id="chk-${quest.id}" ${isDone ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} style="transform: scale(1.3);">
        </label>
    `;

    const checkbox = container.querySelector(`#chk-${quest.id}`);
    if (checkbox && !isDisabled) {
        checkbox.addEventListener('change', (e) => {
            QuestStore.updateQuestConfig(quest.id, { isCompleted: e.target.checked });
        });
    }

    return container;
}

export function renderProgress(quest) {
    const container = document.createElement('div');
    container.className = 'progress-container';

    const { currentValue, targetValue, unit } = quest.config;
    const percentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
    const isDisabled = quest.status === 'completed' || quest.status === 'pending_approval';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
            <span>진행 상황</span>
            <span>${currentValue} / ${targetValue} ${unit} (${percentage}%)</span>
        </div>
        <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
        </div>
        ${!isDisabled && quest.status === 'in_progress' ? `
            <div class="progress-controls">
                <div class="btn-group">
                    <button class="btn-stepper btn-minus">-1</button>
                    <button class="btn-stepper btn-plus">+1</button>
                    <button class="btn-stepper btn-plus-5">+5</button>
                </div>
                <span style="font-size: 0.75rem; color: #64748b;">목표 달성 시 검증 요청 버튼 클릭</span>
            </div>
        ` : ''}
    `;

    if (!isDisabled && quest.status === 'in_progress') {
        const btnMinus = container.querySelector('.btn-minus');
        const btnPlus = container.querySelector('.btn-plus');
        const btnPlus5 = container.querySelector('.btn-plus-5');

        if (btnMinus) {
            btnMinus.addEventListener('click', () => {
                const nextVal = Math.max(0, currentValue - 1);
                QuestStore.updateQuestConfig(quest.id, { currentValue: nextVal });
            });
        }
        if (btnPlus) {
            btnPlus.addEventListener('click', () => {
                const nextVal = Math.min(targetValue * 2, currentValue + 1);
                QuestStore.updateQuestConfig(quest.id, { currentValue: nextVal });
            });
        }
        if (btnPlus5) {
            btnPlus5.addEventListener('click', () => {
                const nextVal = Math.min(targetValue * 2, currentValue + 5);
                QuestStore.updateQuestConfig(quest.id, { currentValue: nextVal });
            });
        }
    }

    return container;
}

export function renderConditional(quest) {
    const container = document.createElement('div');
    container.className = 'conditional-container';

    const { outcomeRewards, selectedOutcome } = quest.config;
    const isApprovalState = quest.status === 'pending_approval';
    const isCompleted = quest.status === 'completed';

    let optionsHtml = '';
    Object.entries(outcomeRewards).forEach(([outcomeKey, rewardVal]) => {
        const isSelected = selectedOutcome === outcomeKey;
        optionsHtml += `
            <label class="outcome-label">
                <div>
                    ${isApprovalState ? `
                        <input type="radio" name="outcome-${quest.id}" value="${outcomeKey}" ${isSelected ? 'checked' : ''} style="margin-right: 8px;">
                    ` : ''}
                    <strong>${outcomeKey}</strong>
                </div>
                <span style="font-weight: 800; color: #b45309;">${rewardVal} R$</span>
            </label>
        `;
    });

    container.innerHTML = `
        <div style="font-size: 0.82rem; color: #475569; margin-bottom: 8px;">
            ${isApprovalState ? '💡 부모님: 수행 결과(WIN/DRAW/LOSE 등)를 선택해 주세요.' : '결과별 보상 차등 산정'}
        </div>
        <div class="outcome-options">
            ${optionsHtml}
        </div>
    `;

    if (isApprovalState) {
        const radios = container.querySelectorAll(`input[name="outcome-${quest.id}"]`);
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                QuestStore.updateQuestConfig(quest.id, { selectedOutcome: e.target.value });
            });
        });
    }

    return container;
}

export function renderMilestone(quest) {
    const container = document.createElement('div');
    container.className = 'milestone-container';

    const { totalSteps, currentStep, stepTitles, finalBonus } = quest.config;
    const isDisabled = quest.status === 'completed' || quest.status === 'pending_approval';

    let stepsHtml = '';
    for (let i = 0; i < totalSteps; i++) {
        const isReached = i < currentStep;
        const isCurrent = i === currentStep;
        const title = (stepTitles && stepTitles[i]) ? stepTitles[i] : `${i + 1}단계`;

        stepsHtml += `
            <div class="step-item ${isReached ? 'active' : ''}">
                <div class="step-number">${isReached ? '✓' : i + 1}</div>
                <div style="flex: 1; font-weight: 600;">${title}</div>
                ${isCurrent && !isDisabled && quest.status === 'in_progress' ? `
                    <button class="btn-action btn-primary btn-next-step" style="padding: 4px 8px; font-size: 0.75rem;">완료</button>
                ` : ''}
            </div>
        `;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">
            <span>마일스톤 스테퍼</span>
            <span>달성: ${currentStep} / ${totalSteps} 단계</span>
        </div>
        <div class="milestone-stepper">
            ${stepsHtml}
        </div>
        <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700; margin-top: 8px;">
            🎁 최종 완료 시 추가 보너스: +${finalBonus} R$
        </div>
    `;

    if (!isDisabled && quest.status === 'in_progress') {
        const btnNextStep = container.querySelector('.btn-next-step');
        if (btnNextStep) {
            btnNextStep.addEventListener('click', () => {
                const nextStep = Math.min(totalSteps, currentStep + 1);
                QuestStore.updateQuestConfig(quest.id, { currentStep: nextStep });
            });
        }
    }

    return container;
}

export function renderRecord(quest) {
    const container = document.createElement('div');
    container.className = 'record-container';

    const { targetRecord, currentRecord, unit, successBonus, isLowerBetter } = quest.config;
    const isDisabled = quest.status === 'completed' || quest.status === 'pending_approval';

    container.innerHTML = `
        <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>목표 기록: <strong>${targetRecord} ${unit} ${isLowerBetter ? '이하' : '이상'}</strong></span>
            <span style="color: #ea580c;">신기록 보너스: +${successBonus} R$</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="font-size: 0.85rem; font-weight: 700;">측정된 기록:</span>
            ${!isDisabled && quest.status === 'in_progress' ? `
                <input type="number" class="input-number input-record-${quest.id}" value="${currentRecord !== null ? currentRecord : ''}" placeholder="${unit}" min="0">
                <span style="font-size: 0.85rem;">${unit}</span>
            ` : `
                <span style="font-size: 1rem; font-weight: 800; color: #2563eb;">
                    ${currentRecord !== null && currentRecord !== undefined ? `${currentRecord} ${unit}` : '미제출'}
                </span>
            `}
        </div>
    `;

    if (!isDisabled && quest.status === 'in_progress') {
        const input = container.querySelector(`.input-record-${quest.id}`);
        if (input) {
            input.addEventListener('change', (e) => {
                const val = parseFloat(e.target.value);
                QuestStore.updateQuestConfig(quest.id, { currentRecord: isNaN(val) ? null : val });
            });
        }
    }

    return container;
}
