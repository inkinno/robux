/**
 * [Infrastructure] Google & 게스트 인증 서비스
 * signInWithPopup 실패 시 signInWithRedirect 및 게스트 로그인 폴백을 제공합니다.
 */

import { 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';

const GUEST_SESSION_KEY = 'family_quest_guest_user';

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.warn("구글 팝업 로그인 실패, 리다이렉트 시도 중...", error);
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
            console.error("구글 리다이렉트 로그인 실패:", redirectError);
            throw redirectError;
        }
    }
}

export async function checkRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        return result ? result.user : null;
    } catch (error) {
        console.error("리다이렉트 결과 처리 에러:", error);
        return null;
    }
}

export function loginAsGuest(nickname = '즐거운 우리가족') {
    const guestUser = {
        uid: `guest_${Date.now()}`,
        displayName: nickname,
        email: `${nickname}@guest.local`,
        isGuest: true
    };
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestUser));
    return guestUser;
}

export function getSavedGuestUser() {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

export async function logoutUser() {
    localStorage.removeItem(GUEST_SESSION_KEY);
    try {
        await signOut(auth);
    } catch (error) {
        console.warn("Firebase 로그아웃 실패 (게스트 세션 정리 완료):", error);
    }
}

export function subscribeAuth(callback) {
    // 1. 게스트 세션 우선 체크
    const savedGuest = getSavedGuestUser();
    if (savedGuest) {
        callback(savedGuest);
    }

    // 2. Firebase auth 상태 연동
    return onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            callback(firebaseUser);
        } else if (!getSavedGuestUser()) {
            callback(null);
        }
    });
}
