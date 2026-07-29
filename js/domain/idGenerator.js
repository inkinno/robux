/**
 * [Domain] Quest Table ID 생성기
 * 알파벳 2자리 + 숫자 6자리 조합의 8자리 랜덤 ID를 생성합니다. (예: AB123456)
 */

export function generateQuestTableId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let result = '';
    
    // 알파벳 2자리
    for (let i = 0; i < 2; i++) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        result += letters[randomIndex];
    }
    
    // 숫자 6자리
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        result += numbers[randomIndex];
    }
    
    return result;
}
