// 시드 기반 난수 (mulberry32): 같은 시드면 같은 작품 재현 -> "직전 패턴으로 돌아가기"에 사용
let _rngState = 1;

function setSeed(seed) {
  _rngState = (seed >>> 0) || 1;
}

function rand() {
  _rngState = (_rngState + 0x6D2B79F5) >>> 0;
  let t = _rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randRange(a, b) {
  return a + rand() * (b - a);
}

function newSeed() {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
