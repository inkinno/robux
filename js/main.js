/**
 * [Main] 애플리케이션 진입점 & 모듈 이벤트를 조율하는 매니저
 */

import { 
    loginWithGoogle, 
    loginAsGuest, 
    logoutUser, 
    subscribeAuth, 
    checkRedirectResult 
} from './infrastructure/authService.js';
import { StorageService } from './infrastructure/storageService.js';
import { AudioService } from './presentation/audioService.js';
import { ParticleService } from './presentation/particleService.js';
import { QuestTable } from './domain/questTable.js';
import { QuestItem } from './domain/questItem.js';

import { BottomNavView } from './presentation/bottomNavView.js';
import { QtListView } from './presentation/qtListView.js';
import { QtEditorView } from './presentation/qtEditorView.js';
import { QtCopyView } from './presentation/qtCopyView.js';
import { SettingsModalView } from './presentation/settingsModalView.js';

class App {
    constructor() {
        this.currentUser = null;
        this.userQuestTables = [];
        this.activeInstanceId = null;
        this.currentViewMode = 'list';

        this.storage = new StorageService();
        this.audio = new AudioService();
        this.particles = new ParticleService();

        this.initViews();
        this.bindGlobalEvents();
    }

    initViews() {
        const bottomNavEl = document.getElementById('bottom-nav-container');
        const mainContentEl = document.getElementById('main-content-container');

        this.bottomNavView = new BottomNavView(bottomNavEl, {
            onSelectQT: (instanceId) => this.selectQT(instanceId),
            onCreateQT: () => this.switchViewMode('create'),
            onCopyQT: () => this.switchViewMode('copy'),
            onOpenSettings: () => this.openSettings()
        });

        this.qtListView = new QtListView(mainContentEl, this.audio, this.particles, {
            onCheckChanged: (qt) => this.onQTProgressChanged(qt),
            onFinalCompleted: (qt) => this.onQTFinalCompleted(qt)
        });

        this.qtEditorView = new QtEditorView(mainContentEl, {
            onCheckId: (id) => this.storage.isIdAvailable(id),
            onSaveQT: (newQtData) => this.handleSaveNewQT(newQtData)
        });

        this.qtCopyView = new QtCopyView(mainContentEl, {
            onFetchQT: (id) => this.handleFetchPublicQT(id),
            onCopyConfirm: (qtData, customTitle, attemptCount) => this.handleCopyConfirm(qtData, customTitle, attemptCount)
        });

        this.settingsModalView = new SettingsModalView({
            onRename: (instanceId, newName) => this.handleRenameQT(instanceId, newName),
            onDelete: (instanceId) => this.handleDeleteQT(instanceId)
        });
    }

    async init() {
        // 리다이렉트 로그인 결과 확인
        const redirectUser = await checkRedirectResult();
        if (redirectUser) {
            this.currentUser = redirectUser;
        }

        // Auth 상태 구독
        subscribeAuth(async (user) => {
            this.currentUser = user;
            this.renderUserHeader(user);

            if (user) {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app-container').classList.remove('hidden');
                await this.loadUserQTs();
            } else {
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('app-container').classList.add('hidden');
            }
        });
    }

    bindGlobalEvents() {
        const loginGoogleBtn = document.getElementById('btn-google-login');
        if (loginGoogleBtn) {
            loginGoogleBtn.addEventListener('click', async () => {
                try {
                    await loginWithGoogle();
                } catch (e) {
                    console.error('구글 로그인 시도 실패:', e);
                    const choice = confirm(
                        '구글 로그인(Firebase Auth)을 실행할 수 없는 브라우저/도메인 환경입니다.\n' +
                        '(file:// 로딩 또는 Firebase 인증 도메인 미등록)\n\n' +
                        '닉네임으로 즉시 시작(게스트 로그인)하시겠습니까?'
                    );
                    if (choice) {
                        this.handleGuestLogin();
                    }
                }
            });
        }

        const loginGuestBtn = document.getElementById('btn-guest-login');
        if (loginGuestBtn) {
            loginGuestBtn.addEventListener('click', () => {
                this.handleGuestLogin();
            });
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await logoutUser();
                window.location.reload();
            });
        }
    }

    handleGuestLogin() {
        const inputName = prompt('사용하실 닉네임이나 성함을 입력해주세요:', '즐거운 우리가족');
        if (inputName !== null) {
            const nickname = inputName.trim() || '즐거운 우리가족';
            const guestUser = loginAsGuest(nickname);
            this.currentUser = guestUser;
            this.renderUserHeader(guestUser);
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            this.loadUserQTs();
        }
    }

    renderUserHeader(user) {
        const avatarImg = document.getElementById('user-avatar');
        const nameSpan = document.getElementById('user-name');

        if (user) {
            if (user.photoURL && avatarImg) {
                avatarImg.src = user.photoURL;
                avatarImg.classList.remove('hidden');
            } else if (avatarImg) {
                avatarImg.classList.add('hidden');
            }
            if (nameSpan) {
                nameSpan.textContent = user.displayName || user.email || '유저';
            }
        }
    }

    async loadUserQTs() {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        const rawList = await this.storage.getUserQuestTables(uid);
        this.userQuestTables = rawList.map(item => new QuestTable(item));

        if (this.userQuestTables.length > 0) {
            if (!this.activeInstanceId || !this.userQuestTables.some(q => q.instanceId === this.activeInstanceId)) {
                this.activeInstanceId = this.userQuestTables[0].instanceId;
            }
            this.switchViewMode('list');
        } else {
            await this.createDefaultInitialQT();
        }

        this.startAutoSaveManager();
    }

    async createDefaultInitialQT() {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        const userName = this.currentUser ? (this.currentUser.displayName || '가족') : '가족';

        const defaultQt = new QuestTable({
            id: 'QT-DEMO01',
            title: '🔥 우리아이 첫 성장 퀘스트 보드',
            authorId: uid,
            authorName: userName,
            userId: uid,
            userName: userName,
            attemptCount: 1,
            quests: [
                new QuestItem({
                    title: '📖 매일 책 15분 읽기',
                    description: '타이머를 켜고 즐겁게 집중해서 읽어요!',
                    natureType: 'fix',
                    checkType: 'button',
                    totalDuration: 7
                }),
                new QuestItem({
                    title: '🏃‍♂️ 운동 / 팔굽혀펴기 수치 기록',
                    description: '기존 최고 기록을 깨면 대형 파티클이 폭발합니다!',
                    natureType: 'custom',
                    checkType: 'numeric',
                    stepGap: 2,
                    totalDuration: 5
                })
            ]
        });

        await this.storage.savePublicQuestTable(defaultQt.toPlainObject());
        await this.storage.saveUserQuestTable(uid, defaultQt.toPlainObject());
        
        this.userQuestTables = [defaultQt];
        this.activeInstanceId = defaultQt.instanceId;
        this.switchViewMode('list');
    }

    selectQT(instanceId) {
        this.activeInstanceId = instanceId;
        this.switchViewMode('list');
    }

    switchViewMode(mode) {
        this.currentViewMode = mode;

        if (mode === 'list') {
            const activeQt = this.userQuestTables.find(q => q.instanceId === this.activeInstanceId);
            this.qtListView.render(activeQt);
        } else if (mode === 'create') {
            this.qtEditorView.render();
        } else if (mode === 'copy') {
            this.qtCopyView.render();
        }

        this.bottomNavView.render(this.userQuestTables, this.activeInstanceId);
    }

    async handleSaveNewQT(newQtData) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        const userName = this.currentUser ? (this.currentUser.displayName || '가족') : '가족';

        const newQt = new QuestTable({
            id: newQtData.id,
            title: newQtData.title,
            authorId: uid,
            authorName: userName,
            userId: uid,
            userName: userName,
            attemptCount: 1,
            quests: newQtData.quests.map(q => new QuestItem(q))
        });

        const plain = newQt.toPlainObject();
        await this.storage.savePublicQuestTable(plain);
        await this.storage.saveUserQuestTable(uid, plain);

        alert(`✨ '${newQt.title}' 테이블이 성공적으로 생성 및 저장되었습니다!`);
        await this.loadUserQTs();
        this.selectQT(newQt.instanceId);
    }

    async handleFetchPublicQT(id) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        const publicQt = await this.storage.getPublicQuestTable(id);
        if (!publicQt) return null;

        const nextAttemptCount = await this.storage.calculateNextAttemptCount(uid, id);
        return {
            ...publicQt,
            nextAttemptCount
        };
    }

    async handleCopyConfirm(qtData, customTitle, attemptCount) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        const userName = this.currentUser ? (this.currentUser.displayName || '가족') : '가족';

        const copiedQt = new QuestTable({
            id: qtData.id,
            title: customTitle,
            authorId: qtData.authorId || 'anonymous',
            authorName: qtData.authorName || '익명',
            userId: uid,
            userName: userName,
            downloadedAt: new Date().toISOString(),
            attemptCount: attemptCount,
            quests: (qtData.quests || []).map(q => new QuestItem({
                ...q,
                checks: []
            }))
        });

        const plain = copiedQt.toPlainObject();
        await this.storage.saveUserQuestTable(uid, plain);

        alert(`📥 '${customTitle}' 테이블이 내 계정으로 추가되었습니다! (${copiedQt.getAttemptLabel()})`);
        await this.loadUserQTs();
        this.selectQT(copiedQt.instanceId);
    }

    async onQTProgressChanged(qt) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        await this.storage.saveUserQuestTable(uid, qt.toPlainObject());
        this.bottomNavView.render(this.userQuestTables, this.activeInstanceId);
    }

    async onQTFinalCompleted(qt) {
        qt.markFinalCompletion();
        await this.onQTProgressChanged(qt);
    }

    openSettings() {
        const activeQt = this.userQuestTables.find(q => q.instanceId === this.activeInstanceId);
        if (activeQt) {
            this.settingsModalView.show(activeQt);
        } else {
            alert('현재 선택된 QT가 없습니다.');
        }
    }

    async handleRenameQT(instanceId, newName) {
        const target = this.userQuestTables.find(q => q.instanceId === instanceId);
        if (target) {
            target.title = newName;
            const uid = this.currentUser ? this.currentUser.uid : 'guest';
            await this.storage.saveUserQuestTable(uid, target.toPlainObject());
            this.switchViewMode('list');
        }
    }

    async handleDeleteQT(instanceId) {
        const uid = this.currentUser ? this.currentUser.uid : 'guest';
        await this.storage.deleteUserQuestTable(uid, instanceId);
        this.activeInstanceId = null;
        await this.loadUserQTs();
    }

    startAutoSaveManager() {
        this.storage.startAutoSave(
            () => {
                const activeQt = this.userQuestTables.find(q => q.instanceId === this.activeInstanceId);
                return activeQt ? activeQt.toPlainObject() : null;
            },
            (count, max) => {
                console.log(`⏱️ 자동 저장 완료! 오늘 자동저장: ${count}/${max}회`);
            }
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
