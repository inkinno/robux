import { presets } from './domain/evaluators.js';
import { QuestStore } from './application/store.js';
import { LedgerService } from './application/ledger.js';
import { QuestCardFactory } from './presentation/uiFactory.js';
import { renderTransaction } from './presentation/components.js';
import { loginWithGoogle, logoutUser, subscribeAuth } from './infrastructure/auth.js';

/**
 * [Main Entry Point] 앱 초기화 및 이벤트 바인딩
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnLogout = document.getElementById('btn-logout');
    const userNameEl = document.getElementById('user-name');
    const userAvatarEl = document.getElementById('user-avatar');
    
    const presetList = document.getElementById('preset-list');
    const questBoard = document.getElementById('quest-board');
    const ledgerList = document.getElementById('ledger-list');
    const currentBalanceEl = document.getElementById('current-balance');
    const emptyState = document.getElementById('empty-state');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // 모달 DOM Elements
    const questModal = document.getElementById('quest-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const questForm = document.getElementById('quest-form');
    const qIcon = document.getElementById('q-icon');
    const qTitle = document.getElementById('q-title');
    const qDesc = document.getElementById('q-desc');
    const qType = document.getElementById('q-type');
    const qReward = document.getElementById('q-reward');
    const dynamicConfigSection = document.getElementById('dynamic-config-section');

    let currentFilter = 'all';
    let currentUser = null;

    // --- Authentication ---
    btnGoogleLogin.addEventListener('click', async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            alert("로그인 중 오류가 발생했습니다.");
        }
    });

    btnLogout.addEventListener('click', async () => {
        await logoutUser();
    });

    subscribeAuth(async (user) => {
        if (user) {
            currentUser = user;
            // UI 업데이트
            loginScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userNameEl.textContent = user.displayName || user.email.split('@')[0];
            if (user.photoURL) {
                userAvatarEl.src = user.photoURL;
                userAvatarEl.classList.remove('hidden');
            }
            
            // 데이터 연동 설정
            QuestStore.setUid(user.uid);
            LedgerService.setUid(user.uid);
            
            // 로딩 상태 표시
            loadingSpinner.classList.remove('hidden');
            questBoard.innerHTML = '';
            
            // 데이터 비동기 로드
            await Promise.all([
                QuestStore.loadQuests(),
                LedgerService.loadTransactions()
            ]);
            
            loadingSpinner.classList.add('hidden');
        } else {
            currentUser = null;
            loginScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
            userAvatarEl.classList.add('hidden');
        }
    });

    // --- State Subscriptions ---
    QuestStore.subscribe((quests) => {
        renderQuests(quests);
        updateFilterCounts(quests);
    });

    LedgerService.subscribe(() => {
        renderLedger();
        updateBalance();
    });

    // --- Initialize Presets UI ---
    function initPresets() {
        presetList.innerHTML = '';
        
        // 1. 직접 만들기 버튼 추가
        const customCard = document.createElement('div');
        customCard.className = 'preset-card';
        customCard.style.border = '2px dashed #3b82f6';
        customCard.style.background = '#eff6ff';
        customCard.innerHTML = `
            <div class="preset-icon">➕</div>
            <div class="preset-info">
                <h4>직접 퀘스트 만들기</h4>
                <p>처음부터 퀘스트를 설계합니다.</p>
                <div class="preset-footer">
                    <span class="badge" style="background:#3b82f6; color:white;">CUSTOM</span>
                </div>
            </div>
        `;
        customCard.addEventListener('click', () => openQuestModal(null));
        presetList.appendChild(customCard);

        // 2. 기본 템플릿들 추가
        presets.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.innerHTML = `
                <div class="preset-icon">${preset.uiStyle.icon}</div>
                <div class="preset-info">
                    <h4>${preset.title}</h4>
                    <p>${preset.description}</p>
                    <div class="preset-footer">
                        <span class="badge ${preset.type.toLowerCase()}">${preset.type}</span>
                        <span class="reward-tag">기본 ${preset.baseReward} R$</span>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                openQuestModal(preset);
            });
            presetList.appendChild(card);
        });
    }

    // --- Modal Form UI 로직 ---
    function openQuestModal(preset) {
        if (preset) {
            // 프리셋 값으로 채우기
            qIcon.value = preset.uiStyle.icon;
            qTitle.value = preset.title;
            qDesc.value = preset.description;
            qType.value = preset.type;
            qReward.value = preset.baseReward;
        } else {
            // 기본값 설정 (직접 만들기)
            qIcon.value = '💡';
            qTitle.value = '';
            qDesc.value = '';
            qType.value = 'CHECKLIST';
            qReward.value = 10;
        }
        
        renderDynamicConfig();
        
        // 프리셋의 상세 config가 있다면 (배열 등 복잡한 구조 제외하고 기본 수치만 세팅)
        if (preset && preset.config) {
            if (preset.type === 'PROGRESS' && preset.config.targetValue) {
                const tv = document.getElementById('cfg-targetValue');
                if (tv) tv.value = preset.config.targetValue;
            }
        }
        
        questModal.classList.remove('hidden');
    }

    function closeModal() {
        questModal.classList.add('hidden');
        questForm.reset();
    }

    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    // 타입 변경 시 동적 폼 렌더링
    qType.addEventListener('change', renderDynamicConfig);

    function renderDynamicConfig() {
        const type = qType.value;
        let html = '';
        if (type === 'CHECKLIST') {
            html = `<p style="font-size:0.85rem; color:#64748b;">* 체크리스트 세부 항목은 퀘스트 시작 후 추가할 수 있습니다.</p>`;
        } else if (type === 'PROGRESS') {
            html = `
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="cfg-targetValue">목표 수치 (예: 10)</label>
                        <input type="number" id="cfg-targetValue" name="cfg-targetValue" required min="1" value="10">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="cfg-unit">단위 (예: 페이지, 회)</label>
                        <input type="text" id="cfg-unit" name="cfg-unit" required value="회">
                    </div>
                </div>
            `;
        } else if (type === 'CONDITIONAL') {
            html = `<p style="font-size:0.85rem; color:#64748b;">* 조건부 퀘스트는 부모의 주관적 평가(A,B,C)에 따라 보상이 차등 지급됩니다.</p>`;
        } else if (type === 'MILESTONE') {
            html = `<p style="font-size:0.85rem; color:#64748b;">* 마일스톤 단계는 퀘스트 시작 후 설정 가능합니다.</p>`;
        } else if (type === 'RECORD') {
            html = `
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="cfg-targetValue">목표 기록 수치</label>
                        <input type="number" id="cfg-targetValue" name="cfg-targetValue" required min="1" value="100">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="cfg-unit">단위 (예: 점, 초)</label>
                        <input type="text" id="cfg-unit" name="cfg-unit" required value="점">
                    </div>
                </div>
                <div class="form-group">
                    <label>기록 경신 조건</label>
                    <select id="cfg-condition" name="cfg-condition">
                        <option value="HIGHER">높을수록 좋음 (예: 점수)</option>
                        <option value="LOWER">낮을수록 좋음 (예: 달리기 시간)</option>
                    </select>
                </div>
            `;
        }
        dynamicConfigSection.innerHTML = html;
    }

    // 폼 제출 (퀘스트 생성)
    questForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = qType.value;
        const config = {};
        
        // 동적 config 파싱
        if (type === 'PROGRESS' || type === 'RECORD') {
            config.targetValue = parseInt(document.getElementById('cfg-targetValue').value, 10);
            config.unit = document.getElementById('cfg-unit').value;
            config.currentValue = 0;
            if (type === 'RECORD') {
                config.condition = document.getElementById('cfg-condition').value;
                config.currentRecord = (config.condition === 'HIGHER') ? 0 : 999999;
            }
        } else if (type === 'CHECKLIST') {
            config.items = []; // 초기 빈 리스트
        } else if (type === 'CONDITIONAL') {
            config.evaluation = 'B';
        } else if (type === 'MILESTONE') {
            config.milestones = [];
        }

        const customQuestData = {
            presetId: 'custom',
            category: 'CUSTOM',
            title: qTitle.value,
            description: qDesc.value,
            type: type,
            baseReward: parseInt(qReward.value, 10),
            config: config,
            uiStyle: {
                icon: qIcon.value,
                color: 'blue'
            }
        };

        try {
            await QuestStore.createFromPreset(customQuestData);
            closeModal();
            // 스크롤 이동
            document.getElementById('active-quests-section').scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            alert("퀘스트 생성 중 오류가 발생했습니다.");
        }
    });

    // --- Render Logic ---
    function renderQuests(quests) {
        questBoard.innerHTML = '';
        let filteredQuests = quests;

        if (currentFilter !== 'all') {
            filteredQuests = quests.filter(q => q.status === currentFilter);
        }

        if (filteredQuests.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            filteredQuests.forEach(quest => {
                const card = QuestCardFactory.createCard(quest, (reward) => {
                    // 보상 애니메이션 또는 알림 가능
                });
                questBoard.appendChild(card);
            });
        }
    }

    function renderLedger() {
        ledgerList.innerHTML = '';
        const txs = LedgerService.getTransactions();
        
        if (txs.length === 0) {
            ledgerList.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">아직 보상 획득 내역이 없습니다.</div>';
            return;
        }

        txs.forEach(tx => {
            ledgerList.appendChild(renderTransaction(tx));
        });
    }

    function updateBalance() {
        const balance = LedgerService.getBalance();
        currentBalanceEl.textContent = balance.toLocaleString();
    }

    function updateFilterCounts(quests) {
        document.getElementById('count-all').textContent = quests.length;
        document.getElementById('count-progress').textContent = quests.filter(q => q.status === 'in_progress').length;
        document.getElementById('count-approval').textContent = quests.filter(q => q.status === 'pending_approval').length;
        document.getElementById('count-completed').textContent = quests.filter(q => q.status === 'completed').length;
    }

    // --- Event Listeners for Filters ---
    const filterTabs = document.querySelectorAll('.tab-btn');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderQuests(QuestStore.getQuests());
        });
    });

    initPresets();
});
