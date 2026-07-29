/**
 * [Infrastructure] Google 인증 서비스
 * signInWithPopup 실패 시 signInWithRedirect 폴백을 수행하여 모든 브라우저 환경 지원
 */

import { 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.warn("구글 팝업 로그인 실패, 리다이렉트 로그인 시도 중...", error);
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
        console.error("리다이렉트 결과 처리 중 오류:", error);
        return null;
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("로그아웃 실패:", error);
        throw error;
    }
}

export function subscribeAuth(callback) {
    return onAuthStateChanged(auth, callback);
}
