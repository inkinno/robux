/**
 * [Presentation] 하단 네비게이션 바 뷰
 * 좌우 스크롤 가능한 QT 목록 탭 + 우측 고정 설정(Settings) 섹션을 렌더링합니다.
 */

export class BottomNavView {
    constructor(containerElement, callbacks = {}) {
        this.container = containerElement;
        this.callbacks = callbacks; // { onSelectQT, onCreateQT, onCopyQT, onOpenSettings }
    }

    render(userQuestTables = [], activeInstanceId = null) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="bottom-nav-wrapper">
                <!-- 좌우 스크롤 가능한 QT 목록 영역 -->
                <div class="bottom-nav-scroll-area">
                    <button class="nav-btn btn-action-tab" id="btn-nav-create">
                        <span class="btn-icon">✨</span>
                        <span>새 QT 만들기</span>
                    </button>

                    <button class="nav-btn btn-action-tab" id="btn-nav-copy">
                        <span class="btn-icon">📥</span>
                        <span>QT 받기</span>
                    </button>

                    <div class="nav-divider"></div>

                    ${userQuestTables.map(qt => {
                        const isActive = qt.instanceId === activeInstanceId ? 'active' : '';
                        const isFinished = qt.completedAt ? 'finished' : '';
                        return `
                            <button class="nav-btn qt-tab ${isActive} ${isFinished}" data-instance-id="${qt.instanceId}">
                                <span class="qt-tab-badge">${qt.attemptCount > 1 ? `${qt.attemptCount}회` : '1회'}</span>
                                <span class="qt-tab-title">${this.escapeHtml(qt.title)}</span>
                                ${qt.completedAt ? '<span class="qt-completed-badge">🏆완료</span>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- 우측 고정 설정 섹션 -->
                <div class="bottom-nav-fixed-area">
                    <button class="nav-btn settings-btn" id="btn-nav-settings">
                        <span class="btn-icon">⚙️</span>
                        <span>설정</span>
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const createBtn = this.container.querySelector('#btn-nav-create');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (this.callbacks.onCreateQT) this.callbacks.onCreateQT();
            });
        }

        const copyBtn = this.container.querySelector('#btn-nav-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (this.callbacks.onCopyQT) this.callbacks.onCopyQT();
            });
        }

        const settingsBtn = this.container.querySelector('#btn-nav-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                if (this.callbacks.onOpenSettings) this.callbacks.onOpenSettings();
            });
        }

        const qtTabs = this.container.querySelectorAll('.qt-tab');
        qtTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const instanceId = tab.dataset.instanceId;
                if (instanceId && this.callbacks.onSelectQT) {
                    this.callbacks.onSelectQT(instanceId);
                }
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
