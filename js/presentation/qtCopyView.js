/**
 * [Presentation] QT 받기/복사 뷰
 * 공유받은 8자리 QT ID를 입력하고 내 계정으로 가져와 시도 횟수(재도전/첫도전)를 부여합니다.
 */

export class QtCopyView {
    constructor(containerElement, callbacks = {}) {
        this.container = containerElement;
        this.callbacks = callbacks; // { onFetchQT, onCopyConfirm }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="copy-card">
                <div class="copy-header">
                    <h2>📥 퀘스트 테이블 (QT) 받기</h2>
                    <p class="copy-desc">가족이나 친구가 공유해 준 8자리 QT ID를 입력하여 내 목록에 추가하세요.</p>
                </div>

                <div class="form-group">
                    <label for="input-search-id">8자리 QT ID 입력</label>
                    <div class="input-with-btn">
                        <input type="text" id="input-search-id" class="form-control font-mono" placeholder="예: AB123456" maxlength="8">
                        <button id="btn-search-qt" class="btn-action btn-primary">🔍 QT 찾기</button>
                    </div>
                </div>

                <div id="qt-preview-container" class="preview-box hidden">
                    <!-- 조회 결과 표시 영역 -->
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const searchBtn = this.container.querySelector('#btn-search-qt');
        const inputId = this.container.querySelector('#input-search-id');

        const doSearch = async () => {
            const id = inputId.value.trim().toUpperCase();
            if (!id || id.length < 8) {
                alert('8자리 QT ID를 정확히 입력해주세요.');
                return;
            }

            if (this.callbacks.onFetchQT) {
                const previewContainer = this.container.querySelector('#qt-preview-container');
                previewContainer.className = 'preview-box';
                previewContainer.innerHTML = `<p class="loading-text">QT 정보를 조회하는 중입니다...</p>`;

                const fetchedQtData = await this.callbacks.onFetchQT(id);

                if (!fetchedQtData) {
                    previewContainer.innerHTML = `<p class="danger-text">❌ 해당 ID(${id})의 QT를 찾을 수 없습니다. ID를 확인해주세요.</p>`;
                    return;
                }

                this.renderPreview(fetchedQtData);
            }
        };

        searchBtn.addEventListener('click', doSearch);
        inputId.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    renderPreview(qtData) {
        const previewContainer = this.container.querySelector('#qt-preview-container');
        if (!previewContainer) return;

        const attemptCount = qtData.nextAttemptCount || 1;
        const attemptText = attemptCount <= 1 ? '첫 도전! 🔥' : `${attemptCount}번째 재도전! 🚀`;

        previewContainer.innerHTML = `
            <div class="preview-card">
                <div class="preview-badge-group">
                    <span class="badge-attempt">${attemptText}</span>
                    <span class="badge-author">작성자: ${this.escapeHtml(qtData.authorName || '익명')}</span>
                </div>

                <h3 class="preview-title">${this.escapeHtml(qtData.title)}</h3>
                <p class="preview-sub">포함된 퀘스트 항목: 총 ${qtData.quests ? qtData.quests.length : 0}개</p>

                <div class="form-group" style="margin-top: 16px;">
                    <label for="input-custom-copy-name">내 목록에서 사용할 테이블 이름</label>
                    <input type="text" id="input-custom-copy-name" class="form-control" value="${this.escapeHtml(qtData.title)}">
                </div>

                <button id="btn-confirm-copy" class="btn-action btn-primary btn-large style-full" style="margin-top: 16px;">
                    📥 이 QT 내 계정에 복사하여 시작하기
                </button>
            </div>
        `;

        const confirmBtn = previewContainer.querySelector('#btn-confirm-copy');
        confirmBtn.addEventListener('click', () => {
            const customTitle = previewContainer.querySelector('#input-custom-copy-name').value.trim();
            if (!customTitle) {
                alert('테이블 이름을 입력해주세요.');
                return;
            }

            if (this.callbacks.onCopyConfirm) {
                this.callbacks.onCopyConfirm(qtData, customTitle, attemptCount);
            }
        });
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, match => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[match];
        });
    }
}
