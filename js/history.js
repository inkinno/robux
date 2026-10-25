// 설정 스냅샷 히스토리: 시드 + UI 설정을 저장해 직전 패턴을 그대로 재현
const SNAP_IDS = [
  'palette-preset', 'col0', 'col1', 'col2', 'col3', 'col4',
  'material-algo', 'substrate-algo', 'region-algo', 'core-algo',
  'composite-algo', 'pattern-algo', 'extreme-algo',
  'connect-slider', 'brush-slider', 'split-slider'
];
const HISTORY_LIMIT = 30;
const historyStack = [];
let currentSnap = null;

function takeSnapshot(seed) {
  const values = {};
  SNAP_IDS.forEach(id => { values[id] = $(id).value; });
  return { seed, values, paletteName: $('palette-name').textContent };
}

function applySnapshot(snap) {
  SNAP_IDS.forEach(id => { $(id).value = snap.values[id]; });
  $('palette-name').textContent = snap.paletteName;
  updateSliderLabels();
}

function updateBackButtons() {
  const n = historyStack.length;
  $('btn-back').textContent = `⏮ 직전 패턴 (${n})`;
  $('btn-back').disabled = n === 0;
  $('btn-back-hud').disabled = n === 0;
}

// push=true면 직전 작품 설정을 히스토리에 쌓고, 현재 설정을 새 기준으로 저장
function recordHistory(push, seed) {
  if (push && currentSnap) {
    historyStack.push(currentSnap);
    if (historyStack.length > HISTORY_LIMIT) historyStack.shift();
  }
  currentSnap = takeSnapshot(seed);
  updateBackButtons();
}

function goBack() {
  if (!historyStack.length) return;
  const snap = historyStack.pop();
  applySnapshot(snap);
  initArtwork({ seed: snap.seed, push: false });
}
