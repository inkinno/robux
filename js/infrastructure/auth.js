import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';

/**
 * [Layer 3 - Infrastructure] Authentication
 */

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("구글 로그인 실패:", error);
        throw error;
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
