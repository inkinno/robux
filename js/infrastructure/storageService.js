/**
 * [Infrastructure] 스토리지 & 자동저장 서비스
 * Firestore 데이터베이스 저장소 + LocalStorage 백업 및 3분 주기 자동저장 (1일 10회 제한)을 전담합니다.
 */

import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const LOCAL_STORAGE_KEY_USER_QTS = 'family_quest_user_qts';
const LOCAL_STORAGE_KEY_PUBLIC_QTS = 'family_quest_public_qts';
const AUTO_SAVE_LIMIT_KEY = 'family_quest_autosave_count';

export class StorageService {
    constructor() {
        this.autoSaveTimer = null;
        this.autoSaveIntervalMs = 3 * 60 * 1000; // 3분
        this.maxDailyAutoSaves = 10;
    }

    /**
     * 오늘 사용한 자동 저장 횟수 가져오기
     */
    getTodayAutoSaveCount() {
        const todayStr = new Date().toISOString().split('T')[0];
        const raw = localStorage.getItem(AUTO_SAVE_LIMIT_KEY);
        if (!raw) return 0;

        try {
            const data = JSON.parse(raw);
            if (data.date === todayStr) {
                return data.count || 0;
            }
        } catch (e) {
            console.error('자동저장 카운트 파싱 에러:', e);
        }
        return 0;
    }

    /**
     * 오늘 자동 저장 횟수 증가
     */
    incrementTodayAutoSaveCount() {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentCount = this.getTodayAutoSaveCount();
        const newCount = currentCount + 1;
        localStorage.setItem(AUTO_SAVE_LIMIT_KEY, JSON.stringify({
            date: todayStr,
            count: newCount
        }));
        return newCount;
    }

    /**
     * QT ID 중복검사 (Firestore + LocalStorage)
     * @param {string} tableId 
     * @returns {Promise<boolean>} 사용 가능 여부 (true: 사용가능)
     */
    async isIdAvailable(tableId) {
        if (!tableId || tableId.length < 8) return false;

        try {
            // Firestore 확인
            const docRef = doc(db, 'shared_quest_tables', tableId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return false;
            }
        } catch (e) {
            console.warn('Firestore 중복검사 실패, LocalStorage 검사로 대체:', e);
        }

        // LocalStorage 확인
        const localPublic = this.getLocalPublicQTs();
        return !localPublic.some(qt => qt.id === tableId);
    }

    /**
     * 원본 공개 QT 저장 (QT 생성 시)
     */
    async savePublicQuestTable(plainQt) {
        // Firestore 저장 시도
        try {
            await setDoc(doc(db, 'shared_quest_tables', plainQt.id), plainQt);
        } catch (e) {
            console.warn('Firestore public QT 저장 에러, LocalStorage 저장 진행:', e);
        }

        // LocalStorage 동시 저장
        const publicQTs = this.getLocalPublicQTs();
        const index = publicQTs.findIndex(q => q.id === plainQt.id);
        if (index >= 0) {
            publicQTs[index] = plainQt;
        } else {
            publicQTs.push(plainQt);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY_PUBLIC_QTS, JSON.stringify(publicQTs));
        return true;
    }

    /**
     * 원본 공개 QT 단건 가져오기 (복사용)
     */
    async getPublicQuestTable(tableId) {
        try {
            const docRef = doc(db, 'shared_quest_tables', tableId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
        } catch (e) {
            console.warn('Firestore public QT 조회 에러, LocalStorage 검색:', e);
        }

        const publicQTs = this.getLocalPublicQTs();
        return publicQTs.find(q => q.id === tableId) || null;
    }

    /**
     * 유저의 내 QT 목록 저장 (수동 저장)
     */
    async saveUserQuestTable(userId, plainQt) {
        const uid = userId || 'guest';
        
        // Firestore 저장 시도
        try {
            const docRef = doc(db, `users/${uid}/user_quest_tables`, plainQt.instanceId);
            await setDoc(docRef, plainQt);
        } catch (e) {
            console.warn('Firestore user QT 저장 에러, LocalStorage 저장 진행:', e);
        }

        // LocalStorage 동시 저장
        const userQTs = this.getLocalUserQTs(uid);
        const idx = userQTs.findIndex(q => q.instanceId === plainQt.instanceId);
        if (idx >= 0) {
            userQTs[idx] = plainQt;
        } else {
            userQTs.push(plainQt);
        }
        localStorage.setItem(`${LOCAL_STORAGE_KEY_USER_QTS}_${uid}`, JSON.stringify(userQTs));
        return true;
    }

    /**
     * 유저의 내 QT 목록 불러오기
     */
    async getUserQuestTables(userId) {
        const uid = userId || 'guest';
        let result = [];

        try {
            const querySnapshot = await getDocs(collection(db, `users/${uid}/user_quest_tables`));
            querySnapshot.forEach(doc => {
                result.push(doc.data());
            });
        } catch (e) {
            console.warn('Firestore user QT 목록 조회 에러, LocalStorage 검색으로 대체:', e);
        }

        if (result.length === 0) {
            result = this.getLocalUserQTs(uid);
        }
        return result;
    }

    /**
     * 특정 QT 삭제
     */
    async deleteUserQuestTable(userId, instanceId) {
        const uid = userId || 'guest';

        try {
            await deleteDoc(doc(db, `users/${uid}/user_quest_tables`, instanceId));
        } catch (e) {
            console.warn('Firestore QT 삭제 에러:', e);
        }

        const userQTs = this.getLocalUserQTs(uid);
        const filtered = userQTs.filter(q => q.instanceId !== instanceId);
        localStorage.setItem(`${LOCAL_STORAGE_KEY_USER_QTS}_${uid}`, JSON.stringify(filtered));
        return true;
    }

    /**
     * 시도 횟수(Attempt Count) 계산
     * 기존 유저가 동일한 tableId를 몇 번 받았는지 조회
     */
    async calculateNextAttemptCount(userId, tableId) {
        const userQTs = await this.getUserQuestTables(userId);
        const sameTableCount = userQTs.filter(q => q.id === tableId).length;
        return sameTableCount + 1;
    }

    /**
     * 자동 저장 타이머 시작 (3분 간격, 1일 최대 10회)
     */
    startAutoSave(getPlainQtCallback, onAutoSaveTriggered) {
        this.stopAutoSave();

        this.autoSaveTimer = setInterval(async () => {
            const todayCount = this.getTodayAutoSaveCount();
            if (todayCount >= this.maxDailyAutoSaves) {
                console.info('오늘의 일일 자동 저장 한도(10회)를 초과했습니다.');
                return;
            }

            const currentQt = getPlainQtCallback();
            if (currentQt && currentQt.instanceId) {
                await this.saveUserQuestTable(currentQt.userId, currentQt);
                const newCount = this.incrementTodayAutoSaveCount();
                if (onAutoSaveTriggered) {
                    onAutoSaveTriggered(newCount, this.maxDailyAutoSaves);
                }
            }
        }, this.autoSaveIntervalMs);
    }

    /**
     * 자동 저장 타이머 해제
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // LocalStorage Helper 메서드
    getLocalPublicQTs() {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PUBLIC_QTS);
        return raw ? JSON.parse(raw) : [];
    }

    getLocalUserQTs(uid) {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_USER_QTS}_${uid}`);
        return raw ? JSON.parse(raw) : [];
    }
}
