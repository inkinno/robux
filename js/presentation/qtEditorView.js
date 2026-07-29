/**
 * [Presentation] QT 만들기/편집 뷰
 * 랜덤 8자리 ID 부여, 비동기 ID 중복검사, 퀘스트 세부 세팅(Fix/자율, 완료/수치), 수동/자동 저장 UI 관리
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
                        <p>고정형(Fix) 또는 완전 자율형(Custom)으로 자유롭게 추가하세요.</p>
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
                                    <option value="fix">고정형 (Fix)</option>
                                    <option value="custom">완전 자율형 (Custom)</option>
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
                                <label for="draft-duration">총 횟수 / 기간</label>
                                <input type="number" id="draft-duration" class="form-control" value="7" min="1" max="100">
                            </div>

                            <div class="form-group flex-1" id="group-step-gap">
                                <label for="draft-step-gap">우측 이동 간격 (자율형)</label>
                                <input type="number" id="draft-step-gap" class="form-control" value="1" min="1" max="10">
                            </div>
                        </div>

                        <button id="btn-add-draft" class="btn-action btn-secondary style-full" type="button">
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

            this.questDrafts.push({
                id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                title,
                description: desc,
                natureType,
                checkType,
                totalDuration: duration,
                stepGap
            });

            // 입력필드 클리어
            this.container.querySelector('#draft-title').value = '';
            this.container.querySelector('#draft-desc').value = '';

            this.renderDraftList();
        });

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
                    <span class="badge-type">${q.natureType === 'fix' ? '고정형' : `자율형(간격:${q.stepGap})`}</span>
                    <span class="badge-type">${q.checkType === 'button' ? '완료버튼' : '수치입력'}</span>
                    <span class="text-sub">(${q.totalDuration}회)</span>
                    <p class="draft-desc">${this.escapeHtml(q.description)}</p>
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
