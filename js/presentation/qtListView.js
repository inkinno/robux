/**
 * [Presentation] active QT 목록 & 퀘스트 체킹 뷰
 * 고정형 사전입력 날짜/라벨 표기, 자율형 유저 자율 칸 추가/삭제(-1시 끝번호 삭제) 및 간격 조절 반영
 */

export class QtListView {
    constructor(containerElement, audioService, particleService, callbacks = {}) {
        this.container = containerElement;
        this.audio = audioService;
        this.particles = particleService;
        this.callbacks = callbacks; // { onCheckChanged, onFinalCompleted }
        this.activeQt = null;
        this.expandedQuestId = null;
    }

    render(questTable) {
        this.activeQt = questTable;

        if (!this.container) return;

        if (!questTable) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p class="empty-icon">🎈</p>
                    <p class="empty-text">선택된 퀘스트 테이블이 없습니다.</p>
                    <p class="empty-sub">하단 네비게이션에서 [새 QT 만들기] 또는 [QT 받기]를 눌러 시작해보세요!</p>
                </div>
            `;
            return;
        }

        const isFullyFinished = questTable.isAllQuestsFinished();
        const progressPercent = questTable.getProgressPercent();

        this.container.innerHTML = `
            <div class="qt-header-card">
                <div class="qt-title-group">
                    <div class="qt-badges">
                        <span class="badge-attempt">${questTable.getAttemptLabel()}</span>
                        <span class="badge-id">ID: ${questTable.id}</span>
                        ${questTable.completedAt ? '<span class="badge-finished">🏆 최종 완료됨</span>' : ''}
                    </div>
                    <h2 class="qt-main-title">${this.escapeHtml(questTable.title)}</h2>
                    <p class="qt-author-text">작성자: ${this.escapeHtml(questTable.authorName)} | 시작일: ${new Date(questTable.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>

                <!-- 전체 진행률 바 -->
                <div class="progress-container">
                    <div class="progress-label">
                        <span>전체 달성률</span>
                        <strong>${progressPercent}%</strong>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>

                <!-- 모든 퀘스트 완료 시 나타나는 최종 완료 버튼 -->
                ${isFullyFinished ? `
                    <div class="final-completion-banner">
                        <button id="btn-trigger-final" class="btn-action btn-final-celebrate">
                            🎉 최종 완료 선언하기 (축하 세레머니)
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- 퀘스트 목록 아코디언 컨테이너 (독립 스크롤 적용) -->
            <div class="quest-accordion-container ${this.expandedQuestId ? 'has-expanded' : 'no-expanded'}">
                ${questTable.quests.map((quest, qIdx) => {
                    const isExpanded = this.expandedQuestId === quest.id;
                    const completedCount = quest.getCompletedCount();
                    const isQuestDone = quest.isAllCompleted();

                    return `
                        <div class="quest-accordion-item ${isExpanded ? 'expanded' : ''} ${isQuestDone ? 'quest-done' : ''}" data-quest-id="${quest.id}">
                            <div class="quest-item-header">
                                <div class="quest-header-left">
                                    <span class="quest-num">#${qIdx + 1}</span>
                                    <strong class="quest-title-text">${this.escapeHtml(quest.title)}</strong>
                                    <span class="badge-type">${quest.natureType === 'fix' ? '고정형(날짜고정)' : `자율형(${quest.stepGap}칸간격)`}</span>
                                    <span class="badge-type">${quest.checkType === 'button' ? '체크형' : '수치형'}</span>
                                </div>
                                <div class="quest-header-right">
                                    <span class="quest-count-badge">${completedCount} / ${quest.totalDuration}</span>
                                    <span class="arrow-icon">${isExpanded ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            <!-- 펼쳐지는 세부 체크박스 & 스크롤 영역 -->
                            <div class="quest-item-body ${isExpanded ? 'show' : 'hidden'}">
                                <div class="quest-body-top">
                                    <p class="quest-desc-full">${this.escapeHtml(quest.description || '퀘스트 설명이 없습니다.')}</p>

                                    <!-- 자율형 일 경우 유저가 직접 칸 추가/삭제(-1시 끝번호 삭제) 및 간격 조절 컨트롤 -->
                                    ${quest.natureType === 'custom' ? `
                                        <div class="custom-quest-controls">
                                            <span class="control-label">🛠️ 자율 설정:</span>
                                            <button class="btn-action btn-secondary btn-sm btn-add-step" data-quest-id="${quest.id}">
                                                ➕ 칸 추가
                                            </button>
                                            <button class="btn-action btn-outline btn-sm btn-remove-step" data-quest-id="${quest.id}" title="-1 클릭 시 마지막 끝번호 삭제">
                                                ➖ 칸 줄이기 (끝번호 삭제)
                                            </button>
                                            <div class="gap-control">
                                                <span>우측 간격:</span>
                                                <input type="number" class="input-step-gap form-control" data-quest-id="${quest.id}" value="${quest.stepGap}" min="1" max="10" style="width: 50px; padding: 2px 6px; font-size: 0.8rem;">
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>

                                ${quest.checkType === 'numeric' && quest.bestRecord > 0 ? `
                                    <div class="best-record-badge" id="best-badge-${quest.id}">
                                        👑 개인 최고 기록: <strong>${quest.bestRecord}</strong>
                                    </div>
                                ` : ''}

                                <div class="check-grid-scrollable">
                                    ${quest.checks.map((chk, cIdx) => {
                                        const labelText = chk.label || (quest.stepLabels ? quest.stepLabels[cIdx] : null) || `${chk.step}일차`;
                                        return `
                                            <button class="check-box-btn ${chk.done ? 'checked' : ''}" 
                                                    data-quest-id="${quest.id}" 
                                                    data-step-index="${cIdx}"
                                                    data-check-type="${quest.checkType}"
                                                    style="margin-right: ${quest.natureType === 'custom' ? (quest.stepGap * 6) + 'px' : '0px'};">
                                                <span class="step-label">${this.escapeHtml(labelText)}</span>
                                                ${chk.done ? `
                                                    <span class="check-icon">✓</span>
                                                    ${quest.checkType === 'numeric' ? `<span class="check-val">${chk.value}</span>` : ''}
                                                ` : `<span class="uncheck-icon">+</span>`}
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        if (!this.container || !this.activeQt) return;

        // 아코디언 헤더 토글
        const headers = this.container.querySelectorAll('.quest-item-header');
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.check-box-btn') || e.target.closest('.custom-quest-controls')) return;

                const item = header.closest('.quest-accordion-item');
                const questId = item.dataset.questId;

                this.expandedQuestId = this.expandedQuestId === questId ? null : questId;
                this.render(this.activeQt);
            });
        });

        // 자율형: 칸 추가 (+1)
        const addStepBtns = this.container.querySelectorAll('.btn-add-step');
        addStepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questId = btn.dataset.questId;
                const quest = this.activeQt.quests.find(q => q.id === questId);
                if (quest) {
                    quest.addCustomStep();
                    this.notifyProgress();
                    this.render(this.activeQt);
                }
            });
        });

        // 자율형: 칸 줄이기 (-1시 끝번호 삭제)
        const removeStepBtns = this.container.querySelectorAll('.btn-remove-step');
        removeStepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questId = btn.dataset.questId;
                const quest = this.activeQt.quests.find(q => q.id === questId);
                if (quest) {
                    const removed = quest.removeLastCustomStep();
                    if (removed) {
                        this.notifyProgress();
                        this.render(this.activeQt);
                    } else {
                        alert('최소 1개 이상의 칸이 유지되어야 합니다.');
                    }
                }
            });
        });

        // 자율형: 우측 간격 조절
        const gapInputs = this.container.querySelectorAll('.input-step-gap');
        gapInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const questId = input.dataset.questId;
                const val = Number(input.value) || 1;
                const quest = this.activeQt.quests.find(q => q.id === questId);
                if (quest) {
                    quest.stepGap = Math.min(Math.max(val, 1), 10);
                    this.notifyProgress();
                    this.render(this.activeQt);
                }
            });
        });

        // 체크 버튼 클릭 이벤트
        const checkBtns = this.container.querySelectorAll('.check-box-btn');
        checkBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                const questId = btn.dataset.questId;
                const stepIndex = Number(btn.dataset.stepIndex);
                const checkType = btn.dataset.checkType;
                const rect = btn.getBoundingClientRect();
                const clickX = rect.left + rect.width / 2;
                const clickY = rect.top + rect.height / 2;

                const quest = this.activeQt.quests.find(q => q.id === questId);
                if (!quest) return;

                if (checkType === 'numeric') {
                    this.showNumericInputDialog(quest, stepIndex, (val) => {
                        const result = quest.toggleCheck(stepIndex, val);
                        this.handleCheckResult(quest, stepIndex, result, clickX, clickY);
                    });
                } else {
                    const result = quest.toggleCheck(stepIndex);
                    this.handleCheckResult(quest, stepIndex, result, clickX, clickY);
                }
            });
        });

        // 최종 완료 버튼
        const finalBtn = this.container.querySelector('#btn-trigger-final');
        if (finalBtn) {
            finalBtn.addEventListener('click', () => {
                this.audio.playFanfareSound();
                this.particles.triggerFinalCompletionParticles();
                this.showFinalCelebrationModal();
                if (this.callbacks.onFinalCompleted) {
                    this.callbacks.onFinalCompleted(this.activeQt);
                }
            });
        }
    }

    notifyProgress() {
        if (this.callbacks.onCheckChanged) {
            this.callbacks.onCheckChanged(this.activeQt);
        }
    }

    handleCheckResult(quest, stepIndex, result, clickX, clickY) {
        if (result.isNewBest) {
            this.audio.playBestRecordSound();
            this.particles.triggerBestRecordParticles(clickX, clickY);

            const bestBadge = this.container.querySelector(`#best-badge-${quest.id}`);
            if (bestBadge) {
                bestBadge.classList.add('pulse-highlight');
                setTimeout(() => bestBadge.classList.remove('pulse-highlight'), 1500);
            }
        } else {
            this.audio.playCheckSound();
            this.particles.triggerCheckParticles(clickX, clickY);
        }

        this.notifyProgress();
        this.render(this.activeQt);
    }

    showNumericInputDialog(quest, stepIndex, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'modal-backdrop shake-dialog';

        const currentCheck = quest.checks[stepIndex];
        const defaultValue = currentCheck && currentCheck.value ? currentCheck.value : '';
        const stepLabel = currentCheck && currentCheck.label ? currentCheck.label : `${stepIndex + 1}일차`;

        dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>📊 [${this.escapeHtml(stepLabel)}] 수치 기록 입력</h3>
                    <button class="btn-close-modal" id="btn-close-num">&times;</button>
                </div>
                <div class="modal-body">
                    <p>현재 최고 기록: <strong>${quest.bestRecord}</strong></p>
                    <div class="form-group" style="margin-top: 12px;">
                        <label for="input-num-val">기록 수치 입력</label>
                        <input type="number" id="input-num-val" class="form-control" value="${defaultValue}" placeholder="숫자를 입력하세요" autofocus>
                    </div>
                    <button id="btn-confirm-num" class="btn-action btn-primary style-full" style="margin-top: 16px;">
                        저장 및 완료
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const close = () => dialog.remove();
        dialog.querySelector('#btn-close-num').addEventListener('click', close);

        const confirm = () => {
            const val = dialog.querySelector('#input-num-val').value;
            if (val !== '' && !isNaN(val)) {
                onConfirm(Number(val));
                close();
            } else {
                alert('유효한 숫자를 입력하세요.');
            }
        };

        dialog.querySelector('#btn-confirm-num').addEventListener('click', confirm);
    }

    showFinalCelebrationModal() {
        const dialog = document.createElement('div');
        dialog.className = 'modal-backdrop celebrate-modal-backdrop';

        dialog.innerHTML = `
            <div class="modal-dialog celebrate-dialog bounce-in">
                <div class="celebrate-content">
                    <span class="celebrate-icon">🏆</span>
                    <h2>축하합니다! 최종 완료 달성!</h2>
                    <p>'${this.escapeHtml(this.activeQt.title)}' 테이블의 모든 퀘스트를 성공적으로 마무리하셨습니다!</p>
                    <p class="celebrate-sub">꾸준함으로 만들어낸 소중한 성장을 응원합니다! 🔥</p>
                    <button id="btn-close-celebrate" class="btn-action btn-primary btn-large" style="margin-top: 20px;">
                        멋져요! 확인
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        dialog.querySelector('#btn-close-celebrate').addEventListener('click', () => dialog.remove());
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, match => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[match];
        });
    }
}
