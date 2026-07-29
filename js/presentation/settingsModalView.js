/**
 * [Presentation] 설정 모달 뷰
 * 내 QT 목록 전체 리스트, 체크박스 선택 삭제 및 이름 변경을 명확하게 처리합니다.
 */

export class SettingsModalView {
    constructor(callbacks = {}) {
        this.callbacks = callbacks; // { onRename, onDelete, onDeleteMultiple }
        this.activeQt = null;
        this.allQts = [];
        this.modalElement = null;
        this.initModalElement();
    }

    initModalElement() {
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal-backdrop hidden';
        this.modalElement.id = 'settings-modal';

        this.modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>⚙️ QT 설정 및 삭제 관리</h3>
                    <button class="btn-close-modal" id="btn-close-settings">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- 이름 변경 섹션 -->
                    <div class="form-group">
                        <label for="input-qt-name">현재 선택된 QT 이름 변경</label>
                        <div id="target-qt-info-badge" class="target-badge"></div>
                        <input type="text" id="input-qt-name" class="form-control" placeholder="테이블 이름을 입력하세요">
                        <button id="btn-save-qt-name" class="btn-action btn-primary" style="margin-top: 8px;">이름 변경 저장</button>
                    </div>

                    <hr class="modal-divider">

                    <!-- 내 QT 목록 삭제 선택 섹션 -->
                    <div class="form-group danger-zone">
                        <div class="danger-header">
                            <h4>🗑️ 삭제할 QT 선택 목록</h4>
                            <p class="text-sub">삭제할 테이블 체크박스를 선택 후 아래 [선택한 QT 삭제하기] 버튼을 누르세요.</p>
                        </div>

                        <div id="delete-qt-list-container" class="delete-qt-checkbox-list">
                            <!-- JS 동적 체크박스 리스트 -->
                        </div>

                        <button id="btn-delete-selected-qts" class="btn-action btn-danger style-full" style="margin-top: 14px;" disabled>
                            선택한 0개 QT 삭제하기
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modalElement);
        this.bindEvents();
    }

    bindEvents() {
        const closeBtn = this.modalElement.querySelector('#btn-close-settings');
        closeBtn.addEventListener('click', () => this.hide());

        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) this.hide();
        });

        // 이름 변경 저장
        const saveNameBtn = this.modalElement.querySelector('#btn-save-qt-name');
        saveNameBtn.addEventListener('click', () => {
            const input = this.modalElement.querySelector('#input-qt-name');
            const newName = input.value.trim();
            if (newName && this.activeQt && this.callbacks.onRename) {
                this.callbacks.onRename(this.activeQt.instanceId, newName);
                this.hide();
            }
        });

        // 선택 삭제 버튼
        const deleteBtn = this.modalElement.querySelector('#btn-delete-selected-qts');
        deleteBtn.addEventListener('click', () => {
            const checkedBoxes = this.modalElement.querySelectorAll('.chk-delete-qt:checked');
            const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.instanceId);

            if (selectedIds.length === 0) return;

            const selectedNames = Array.from(checkedBoxes).map(cb => cb.dataset.title).join(', ');

            if (confirm(`선택한 ${selectedIds.length}개 테이블 ('${selectedNames}')을 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                if (this.callbacks.onDeleteMultiple) {
                    this.callbacks.onDeleteMultiple(selectedIds);
                } else if (this.callbacks.onDelete && selectedIds.length === 1) {
                    this.callbacks.onDelete(selectedIds[0]);
                }
                this.hide();
            }
        });
    }

    show(activeQt, allUserQts = []) {
        this.activeQt = activeQt;
        this.allQts = allUserQts;

        const input = this.modalElement.querySelector('#input-qt-name');
        const badge = this.modalElement.querySelector('#target-qt-info-badge');

        if (activeQt) {
            if (input) input.value = activeQt.title || '';
            if (badge) badge.textContent = `🎯 대상: ${activeQt.title} (ID: ${activeQt.id})`;
        } else {
            if (input) input.value = '';
            if (badge) badge.textContent = '';
        }

        this.renderDeleteList();
        this.modalElement.classList.remove('hidden');
    }

    renderDeleteList() {
        const listContainer = this.modalElement.querySelector('#delete-qt-list-container');
        const deleteBtn = this.modalElement.querySelector('#btn-delete-selected-qts');

        if (!listContainer) return;

        if (this.allQts.length === 0) {
            listContainer.innerHTML = `<p class="empty-text-sub">삭제할 QT 목록이 없습니다.</p>`;
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.textContent = '삭제할 QT가 없습니다';
            }
            return;
        }

        listContainer.innerHTML = this.allQts.map(qt => {
            const isCurrentActive = this.activeQt && qt.instanceId === this.activeQt.instanceId;
            return `
                <label class="delete-qt-item ${isCurrentActive ? 'is-active-target' : ''}">
                    <input type="checkbox" class="chk-delete-qt" data-instance-id="${qt.instanceId}" data-title="${this.escapeHtml(qt.title)}">
                    <div class="delete-item-info">
                        <span class="delete-item-title">${this.escapeHtml(qt.title)}</span>
                        <span class="delete-item-meta">ID: ${qt.id} | ${qt.getAttemptLabel()}</span>
                    </div>
                    ${isCurrentActive ? '<span class="active-tag">현재 선택됨</span>' : ''}
                </label>
            `;
        }).join('');

        // 체크박스 클릭에 따른 버튼 상태 업데이트
        const updateDeleteBtnState = () => {
            const checkedBoxes = this.modalElement.querySelectorAll('.chk-delete-qt:checked');
            const count = checkedBoxes.length;

            if (deleteBtn) {
                if (count > 0) {
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = `⚠️ 선택한 ${count}개 QT 삭제하기`;
                } else {
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = '삭제할 QT를 체크박스로 선택하세요';
                }
            }
        };

        listContainer.querySelectorAll('.chk-delete-qt').forEach(chk => {
            chk.addEventListener('change', updateDeleteBtnState);
        });

        updateDeleteBtnState();
    }

    hide() {
        this.modalElement.classList.add('hidden');
        this.activeQt = null;
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, match => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[match];
        });
    }
}
