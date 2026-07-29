/**
 * [Presentation] QT 만들기/편집 뷰
 * 고정형(Fix) 날짜/라벨 사전 입력 미리보기 및 자율형(Custom) 실시간 유저 조절 안내 반영
 */

import { generateQuestTableId } from '../domain/idGenerator.js';

export class QtEditorView {
    constructor(containerElement, callbacks = {}) {
        this.container = containerElement;
        this.callbacks = callbacks; // { onCheckId, onSaveQT }
        this.currentTableId = generateQuestTableId();
        this.isIdChecked = false;
        this.questDrafts = [];
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="editor-card">
                <div class="editor-header">
                    <h2>✨ 새 퀘스트 테이블 (QT) 만들기</h2>
                    <p class="editor-desc">가족 모두가 꾸준함을 기를 수 있도록 퀘스트를 설계하세요.</p>
                </div>

                <div class="form-section">
                    <div class="form-row">
                        <div class="form-group flex-1">
                            <label>QT ID (자동 부여 - 알파벳2 + 숫자6)</label>
                            <div class="input-with-btn">
                                <input type="text" id="input-editor-id" class="form-control font-mono" value="${this.currentTableId}" readonly>
                                <button id="btn-regenerate-id" class="btn-action btn-secondary" type="button">🎲 새로고침</button>
                                <button id="btn-check-id" class="btn-action btn-outline" type="button">🔍 중복검사</button>
                            </div>
                            <div id="id-check-status" class="status-badge status-pending">중복검사가 필요합니다.</div>
                        </div>

                        <div class="form-group flex-2">
                            <label for="input-table-title">QT 대표 제목</label>
                            <input type="text" id="input-table-title" class="form-control" placeholder="예: 우리아이 매일 30분 독서 & 러닝 퀘스트">
                        </div>
                    </div>
                </div>

                <hr class="section-divider">

                <div class="form-section">
                    <div class="section-sub-header">
                        <h3>📋 퀘스트 항목 추가</h3>
                        <p>고정형(Fix: 날짜/라벨 고정) 또는 완전 자율형(Custom: 퀘스트 화면에서 유저가 칸 갯수 직접 조절)을 선택하세요.</p>
                    </div>

                    <div class="quest-draft-form card-sub">
                        <div class="form-row">
                            <div class="form-group flex-2">
                                <label for="draft-title">퀘스트 이름</label>
                                <input type="text" id="draft-title" class="form-control" placeholder="예: 하루 책 10페이지 읽기">
                            </div>

                            <div class="form-group flex-1">
                                <label for="draft-nature">유형 (유지/간격)</label>
                                <select id="draft-nature" class="form-control">
                                    <option value="fix">고정형 (Fix - 날짜/라벨 사전지정)</option>
                                    <option value="custom">완전 자율형 (Custom - 유저 직접 조절)</option>
                                </select>
                            </div>

                            <div class="form-group flex-1">
                                <label for="draft-check-type">체크 방식</label>
                                <select id="draft-check-type" class="form-control">
                                    <option value="button">완료 버튼형</option>
                                    <option value="numeric">수치 입력형 (기록)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group flex-3">
                                <label for="draft-desc">설명 및 달성 조건</label>
                                <input type="text" id="draft-desc" class="form-control" placeholder="예: 정독 후 맘에 드는 문장 1개 말하기">
                            </div>

                            <div class="form-group flex-1">
                                <label for="draft-duration">총 횟수 / 기간 (칸 수)</label>
                                <input type="number" id="draft-duration" class="form-control" value="7" min="1" max="100">
                            </div>

                            <div class="form-group flex-1 hidden" id="group-step-gap">
                                <label for="draft-step-gap">우측 이동 간격 (자율형)</label>
                                <input type="number" id="draft-step-gap" class="form-control" value="1" min="1" max="10">
                            </div>
                        </div>

                        <!-- 고정형 일 때 날짜/라벨 직접 입력 칸 미리보기 영역 -->
                        <div id="fix-labels-preview-section" class="form-group">
                            <label>📅 각 칸에 표시될 날짜/라벨 직접 입력 (고정형)</label>
                            <p class="text-sub">아래 입력한 문자(예: 7/29, 월요일, 1주차 등)가 받은 사람의 화면 퀘스트 칸에 고정되어 보입니다.</p>
                            <div id="labels-grid-container" class="labels-grid">
                                <!-- JS 동적 생성 -->
                            </div>
                        </div>

                        <!-- 자율형 일 때 안내 배너 -->
                        <div id="custom-info-banner" class="info-banner hidden">
                            💡 <strong>자율형 (Custom)</strong>: 퀘스트를 수행하는 유저가 퀘스트 화면에서 <strong>[+ 칸 추가]</strong> 및 <strong>[- 칸 줄이기 (클릭 시 5번 등 마지막 번호 삭제)]</strong>를 자유롭게 조절합니다.
                        </div>

                        <button id="btn-add-draft" class="btn-action btn-secondary style-full" type="button" style="margin-top: 12px;">
                            ➕ 이 퀘스트 목록에 추가
                        </button>
                    </div>

                    <!-- 추가된 퀘스트 드래프트 리스트 -->
                    <div id="draft-list-container" class="draft-list-group">
                        <p class="empty-text-sub">아직 추가된 퀘스트가 없습니다. 위에서 작성 후 추가해보세요.</p>
                    </div>
                </div>

                <div class="editor-footer">
                    <div id="autosave-info-badge" class="autosave-badge">
                        ⏱️ 자동저장 활성화 (3분 1회 / 1일 최대 10회)
                    </div>
                    <button id="btn-save-final-qt" class="btn-action btn-primary btn-large">
                        💾 QT 확정 및 저장하기
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
        this.renderLabelsGrid();
    }

    bindEvents() {
        const regenBtn = this.container.querySelector('#btn-regenerate-id');
        const idInput = this.container.querySelector('#input-editor-id');
        const statusBadge = this.container.querySelector('#id-check-status');

        regenBtn.addEventListener('click', () => {
            this.currentTableId = generateQuestTableId();
            idInput.value = this.currentTableId;
            this.isIdChecked = false;
            statusBadge.className = 'status-badge status-pending';
            statusBadge.textContent = '중복검사가 필요합니다.';
        });

        const checkBtn = this.container.querySelector('#btn-check-id');
        checkBtn.addEventListener('click', async () => {
            if (this.callbacks.onCheckId) {
                statusBadge.className = 'status-badge status-loading';
                statusBadge.textContent = '중복 검사 중...';
                const isAvailable = await this.callbacks.onCheckId(this.currentTableId);

                if (isAvailable) {
                    this.isIdChecked = true;
                    statusBadge.className = 'status-badge status-success';
                    statusBadge.textContent = '✅ 사용 가능한 ID입니다!';
                } else {
                    this.isIdChecked = false;
                    statusBadge.className = 'status-badge status-danger';
                    statusBadge.textContent = '❌ 이미 존재하는 ID입니다. 새로고침 해주세요.';
                }
            }
        });

        // 유형 변경 시 UI 토글
        const natureSelect = this.container.querySelector('#draft-nature');
        const fixLabelsSection = this.container.querySelector('#fix-labels-preview-section');
        const customBanner = this.container.querySelector('#custom-info-banner');
        const stepGapGroup = this.container.querySelector('#group-step-gap');

        natureSelect.addEventListener('change', () => {
            if (natureSelect.value === 'fix') {
                fixLabelsSection.classList.remove('hidden');
                customBanner.classList.add('hidden');
                stepGapGroup.classList.add('hidden');
            } else {
                fixLabelsSection.classList.add('hidden');
                customBanner.classList.remove('hidden');
                stepGapGroup.classList.remove('hidden');
            }
        });

        // 총 횟수 변경 시 라벨 입력 칸 재구성
        const durationInput = this.container.querySelector('#draft-duration');
        durationInput.addEventListener('input', () => {
            this.renderLabelsGrid();
        });

        // 드래프트 퀘스트 추가
        const addDraftBtn = this.container.querySelector('#btn-add-draft');
        addDraftBtn.addEventListener('click', () => {
            const title = this.container.querySelector('#draft-title').value.trim();
            const desc = this.container.querySelector('#draft-desc').value.trim();
            const natureType = this.container.querySelector('#draft-nature').value;
            const checkType = this.container.querySelector('#draft-check-type').value;
            const duration = Number(this.container.querySelector('#draft-duration').value) || 7;
            const stepGap = Number(this.container.querySelector('#draft-step-gap').value) || 1;

            if (!title) {
                alert('퀘스트 이름을 입력해주세요.');
                return;
            }

            // 고정형인 경우 각 칸에 작성된 라벨들 읽어오기
            let stepLabels = [];
            if (natureType === 'fix') {
                const labelInputs = this.container.querySelectorAll('.input-step-label');
                stepLabels = Array.from(labelInputs).map((input, idx) => input.value.trim() || `${idx + 1}일차`);
            } else {
                stepLabels = Array.from({ length: duration }, (_, i) => `${i + 1}일차`);
            }

            this.questDrafts.push({
                id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                title,
                description: desc,
                natureType,
                checkType,
                totalDuration: duration,
                stepGap,
                stepLabels
            });

            // 입력 필드 초기화
            this.container.querySelector('#draft-title').value = '';
            this.container.querySelector('#draft-desc').value = '';

            this.renderDraftList();
        });

        // 최종 저장 버튼
        const saveFinalBtn = this.container.querySelector('#btn-save-final-qt');
        saveFinalBtn.addEventListener('click', () => {
            const titleInput = this.container.querySelector('#input-table-title').value.trim();

            if (!this.isIdChecked) {
                alert('QT ID 중복검사를 진행해주세요.');
                return;
            }

            if (!titleInput) {
                alert('QT 대표 제목을 입력해주세요.');
                return;
            }

            if (this.questDrafts.length === 0) {
                alert('최소 1개 이상의 퀘스트를 추가해주세요.');
                return;
            }

            if (this.callbacks.onSaveQT) {
                this.callbacks.onSaveQT({
                    id: this.currentTableId,
                    title: titleInput,
                    quests: this.questDrafts
                });
            }
        });
    }

    renderLabelsGrid() {
        const container = this.container.querySelector('#labels-grid-container');
        if (!container) return;

        const duration = Number(this.container.querySelector('#draft-duration').value) || 7;
        const validDuration = Math.min(Math.max(duration, 1), 30); // 최대 30개 표시

        let html = '';
        for (let i = 1; i <= validDuration; i++) {
            html += `
                <div class="label-input-box">
                    <span class="label-step-num">#${i}</span>
                    <input type="text" class="form-control input-step-label" placeholder="${i}일차 (예: 7/${28+i})" value="${i}일차">
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderDraftList() {
        const draftContainer = this.container.querySelector('#draft-list-container');
        if (!draftContainer) return;

        if (this.questDrafts.length === 0) {
            draftContainer.innerHTML = `<p class="empty-text-sub">아직 추가된 퀘스트가 없습니다. 위에서 작성 후 추가해보세요.</p>`;
            return;
        }

        draftContainer.innerHTML = this.questDrafts.map((q, idx) => `
            <div class="draft-item-card">
                <div class="draft-item-info">
                    <span class="draft-index">#${idx + 1}</span>
                    <strong>${this.escapeHtml(q.title)}</strong>
                    <span class="badge-type">${q.natureType === 'fix' ? '고정형(라벨지정)' : `자율형(간격:${q.stepGap})`}</span>
                    <span class="badge-type">${q.checkType === 'button' ? '완료버튼' : '수치입력'}</span>
                    <span class="text-sub">(${q.totalDuration}회)</span>
                    <p class="draft-desc">${this.escapeHtml(q.description)}</p>
                    ${q.natureType === 'fix' && q.stepLabels ? `
                        <div class="draft-labels-preview">
                            <span class="text-sub font-mono">지정 라벨: [ ${q.stepLabels.slice(0, 5).join(', ')}${q.stepLabels.length > 5 ? ' ...' : ''} ]</span>
                        </div>
                    ` : ''}
                </div>
                <button class="btn-remove-draft btn-action btn-danger" data-index="${idx}">&times; 삭제</button>
            </div>
        `).join('');

        // 삭제 버튼 이벤트
        draftContainer.querySelectorAll('.btn-remove-draft').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.target.dataset.index);
                this.questDrafts.splice(idx, 1);
                this.renderDraftList();
            });
        });
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, match => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[match];
        });
    }
}
