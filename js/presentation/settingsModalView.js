/**
 * [Presentation] 설정 모달 뷰
 * 현재 활성화된 QT의 이름 변경 및 삭제를 처리하는 대화상자입니다.
 */

export class SettingsModalView {
    constructor(callbacks = {}) {
        this.callbacks = callbacks; // { onRename, onDelete }
        this.activeQt = null;
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
                    <h3>⚙️ QT 설정 및 관리</h3>
                    <button class="btn-close-modal" id="btn-close-settings">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="input-qt-name">테이블 이름 변경</label>
                        <input type="text" id="input-qt-name" class="form-control" placeholder="테이블 이름을 입력하세요">
                        <button id="btn-save-qt-name" class="btn-action btn-primary" style="margin-top: 8px;">이름 변경 저장</button>
                    </div>
                    <hr class="modal-divider">
                    <div class="form-group danger-zone">
                        <h4>⚠️ Danger Zone</h4>
                        <p class="text-sub">이 QT를 내 목록에서 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
                        <button id="btn-delete-qt" class="btn-action btn-danger">이 QT 삭제하기</button>
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

        const saveNameBtn = this.modalElement.querySelector('#btn-save-qt-name');
        saveNameBtn.addEventListener('click', () => {
            const input = this.modalElement.querySelector('#input-qt-name');
            const newName = input.value.trim();
            if (newName && this.activeQt && this.callbacks.onRename) {
                this.callbacks.onRename(this.activeQt.instanceId, newName);
                this.hide();
            }
        });

        const deleteBtn = this.modalElement.querySelector('#btn-delete-qt');
        deleteBtn.addEventListener('click', () => {
            if (this.activeQt && confirm(`'${this.activeQt.title}' 테이블을 삭제하시겠습니까?`)) {
                if (this.callbacks.onDelete) {
                    this.callbacks.onDelete(this.activeQt.instanceId);
                }
                this.hide();
            }
        });
    }

    show(qt) {
        this.activeQt = qt;
        const input = this.modalElement.querySelector('#input-qt-name');
        if (input && qt) {
            input.value = qt.title || '';
        }
        this.modalElement.classList.remove('hidden');
    }

    hide() {
        this.modalElement.classList.add('hidden');
        this.activeQt = null;
    }
}
