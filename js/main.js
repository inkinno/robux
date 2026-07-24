import { PRESETS } from './infrastructure/presets.js';
import { QuestStore } from './application/store.js';
import { LedgerService } from './application/ledger.js';
import { QuestCardFactory } from './presentation/uiFactory.js';

class App {
    constructor() {
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindDOM();
        this.seedInitialQuestsIfEmpty();
        this.renderPresets();
        this.renderBalance(false);
        this.renderLedger();
        this.renderQuestBoard();
        this.bindEvents();

        // QuestStore 전역 상태 변경 구독
        QuestStore.subscribe(() => {
            this.renderQuestBoard();
            this.renderBalance(true);
            this.renderLedger();
        });
    }

    bindDOM() {
        this.presetListEl = document.getElementById('preset-list');
        this.questBoardEl = document.getElementById('quest-board');
        this.emptyStateEl = document.getElementById('empty-state');
        this.balanceEl = document.getElementById('current-balance');
        this.ledgerListEl = document.getElementById('ledger-list');
        this.filterTabBtns = document.querySelectorAll('.filter-tabs .tab-btn');

        this.countAllEl = document.getElementById('count-all');
        this.countProgressEl = document.getElementById('count-progress');
        this.countApprovalEl = document.getElementById('count-approval');
        this.countCompletedEl = document.getElementById('count-completed');
    }

    bindEvents() {
        // 필터 탭 클릭 이벤트
        this.filterTabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterTabBtns.forEach(b => b.classList.remove('active'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');
                this.currentFilter = targetBtn.dataset.filter || 'all';
                this.renderQuestBoard();
            });
        });
    }

    seedInitialQuestsIfEmpty() {
        const existing = QuestStore.getQuests();
        if (!existing || existing.length === 0) {
            // 초기 시드 퀘스트 3개 생성 (체스, 독서, 놀이터 달리기)
            const presetThinker = PRESETS.find(p => p.presetId === 'p_thinker_01');
            const presetMover = PRESETS.find(p => p.presetId === 'p_mover_01');
            const presetAchiever = PRESETS.find(p => p.presetId === 'p_achiever_01');

            if (presetThinker) QuestStore.createFromPreset(presetThinker);
            if (presetMover) QuestStore.createFromPreset(presetMover);
            if (presetAchiever) QuestStore.createFromPreset(presetAchiever);
        }
    }

    renderPresets() {
        if (!this.presetListEl) return;
        this.presetListEl.innerHTML = '';

        PRESETS.forEach(preset => {
            const card = document.createElement('div');
            card.className = `preset-card ${preset.uiStyle.categoryClass || 'category-thinker'}`;
            
            card.innerHTML = `
                <div>
                    <div class="preset-top">
                        <span class="preset-icon">${preset.uiStyle.icon}</span>
                        <span class="preset-category">${preset.category}</span>
                    </div>
                    <div class="preset-title">${preset.title}</div>
                    <div class="preset-desc">${preset.description}</div>
                </div>
                <div class="preset-bottom">
                    <span>보상: ${preset.baseReward} R$</span>
                    <button class="btn-add-preset">+ 퀘스트 추가</button>
                </div>
            `;

            const btnAdd = card.querySelector('.btn-add-preset');
            btnAdd.addEventListener('click', (e) => {
                e.stopPropagation();
                QuestStore.createFromPreset(preset);
            });

            this.presetListEl.appendChild(card);
        });
    }

    renderQuestBoard() {
        if (!this.questBoardEl) return;
        this.questBoardEl.innerHTML = '';

        const allQuests = QuestStore.getQuests();
        this.updateFilterCounts(allQuests);

        const filtered = allQuests.filter(q => {
            if (this.currentFilter === 'all') return true;
            return q.status === this.currentFilter;
        });

        if (filtered.length === 0) {
            this.emptyStateEl.classList.remove('hidden');
        } else {
            this.emptyStateEl.classList.add('hidden');
            filtered.forEach(quest => {
                const cardEl = QuestCardFactory.createCard(quest, (issuedAmount) => {
                    this.onApproveSuccess(issuedAmount);
                });
                this.questBoardEl.appendChild(cardEl);
            });
        }
    }

    updateFilterCounts(quests) {
        const counts = {
            all: quests.length,
            in_progress: quests.filter(q => q.status === 'in_progress' || q.status === 'pending').length,
            pending_approval: quests.filter(q => q.status === 'pending_approval').length,
            completed: quests.filter(q => q.status === 'completed').length
        };

        if (this.countAllEl) this.countAllEl.textContent = counts.all;
        if (this.countProgressEl) this.countProgressEl.textContent = counts.in_progress;
        if (this.countApprovalEl) this.countApprovalEl.textContent = counts.pending_approval;
        if (this.countCompletedEl) this.countCompletedEl.textContent = counts.completed;
    }

    renderBalance(animate = false) {
        const balance = LedgerService.getBalance();
        if (this.balanceEl) {
            const oldBalance = parseInt(this.balanceEl.textContent || '0', 10);
            this.balanceEl.textContent = balance;

            if (animate && balance !== oldBalance) {
                this.balanceEl.classList.remove('pulse');
                void this.balanceEl.offsetWidth; // trigger reflow
                this.balanceEl.classList.add('pulse');
            }
        }
    }

    onApproveSuccess(amount) {
        // 승인 축하 효과 메시지
        alert(`🎉 축하합니다! 퀘스트 승인이 완료되어 +${amount} R$ 보상이 장부에 적재되었습니다!`);
    }

    renderLedger() {
        if (!this.ledgerListEl) return;
        const transactions = LedgerService.getTransactions();

        if (transactions.length === 0) {
            this.ledgerListEl.innerHTML = `
                <div style="font-size: 0.85rem; color: #94a3b8; padding: 12px; text-align: center;">
                    아직 획득한 보상 내역이 없습니다. 퀘스트를 완료해보세요!
                </div>
            `;
            return;
        }

        this.ledgerListEl.innerHTML = '';
        transactions.forEach(tx => {
            const item = document.createElement('div');
            item.className = 'ledger-item';
            
            const dateStr = new Date(tx.timestamp).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            item.innerHTML = `
                <div class="ledger-item-info">
                    <span class="ledger-title">${tx.description}</span>
                    <span class="ledger-time">${dateStr}</span>
                </div>
                <div class="ledger-amount">+${tx.amount} R$</div>
            `;

            this.ledgerListEl.appendChild(item);
        });
    }
}

// DOMContentLoaded 시 앱 구동
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
