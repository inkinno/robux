// 메인 컨트롤러 및 실행 루프
function initStudio() {
  setupResolution();
  resizeLineCanvas();
  clearFillCanvas();
  clearLines();

  // 기본 랜덤 선 생성 및 면 감지
  const lineCount = parseInt($('line-count-slider') ? $('line-count-slider').value : '8', 10);
  generateRandomLines(lineCount);
  detectRegionsFromLines();
  compositeToView();
}

// 전체 면 순차 자동 채우기 시작
function startAutoFillSequence() {
  stopAutoFillSequence();
  if (!state.regions || state.regions.length === 0) {
    detectRegionsFromLines();
  }

  state.isAutoFilling = true;
  state.currentRegionIndex = 0;

  // 모든 면 채움 상태 리셋
  clearFillCanvas();
  compositeToView();

  const autoHide = $('chk-auto-hide') && $('chk-auto-hide').checked;
  if (autoHide) {
    $('ui-panel').classList.add('hidden');
    if ($('status-text')) $('status-text').textContent = '2초 후 자동 채우기가 시작됩니다...';
  }

  const startDelay = autoHide ? 2000 : 50;

  function nextStep() {
    if (!state.isAutoFilling) return;
    if (state.currentRegionIndex < state.regions.length) {
      const reg = state.regions[state.currentRegionIndex];
      fillRegion(reg, state.fillType);
      state.currentRegionIndex++;

      const pct = Math.floor((state.currentRegionIndex / state.regions.length) * 100);
      if ($('progress-bar')) $('progress-bar').style.width = pct + '%';
      if ($('step-counter')) $('step-counter').textContent = pct + '%';
      if ($('status-text')) $('status-text').textContent = `면 채우는 중... (${state.currentRegionIndex}/${state.regions.length})`;

      const delay = Math.max(80, 500 - state.autoFillSpeed * 40);
      state.autoFillTimer = setTimeout(nextStep, delay);
    } else {
      state.isAutoFilling = false;
      if ($('status-text')) $('status-text').textContent = '완성되었습니다!';
      if ($('progress-bar')) $('progress-bar').style.width = '100%';
      if ($('step-counter')) $('step-counter').textContent = '100%';
    }
  }

  state.autoFillTimer = setTimeout(nextStep, startDelay);
}

// 자동 채우기 중지
function stopAutoFillSequence() {
  state.isAutoFilling = false;
  if (state.autoFillTimer) {
    clearTimeout(state.autoFillTimer);
    state.autoFillTimer = null;
  }
}

// 캔버스 클릭 시 해당 칸(면) 수동 채우기
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = state.width / rect.width;
  const scaleY = state.height / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  const targetRegion = findRegionAtPoint(clickX, clickY);
  if (targetRegion) {
    fillRegion(targetRegion, state.fillType);
  }
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
  if (typeof bindUIEvents === 'function') {
    bindUIEvents();
  }
  initStudio();
});
