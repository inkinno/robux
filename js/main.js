// 애니메이션 루프 및 진입점
function animate() {
  if (!state.paused) {
    if (state.step < state.maxSteps) {
      const stepsPerFrame = Math.max(1, Math.floor(state.speed / 4));
      for (let s = 0; s < stepsPerFrame && state.step < state.maxSteps; s++) stepSimulation();
      const pct = Math.min(100, Math.floor((state.step / state.maxSteps) * 100));
      $('progress-bar').style.width = pct + '%';
      $('step-counter').textContent = pct + '%';
      $('status-text').textContent = '재질과 면을 차분히 직조하는 중...';
    } else if (state.autoMode && !state.waitingNext) {
      state.waitingNext = true;
      $('status-text').textContent = '완성! 4.5초 후 다음 작품이 시작됩니다...';
      setTimeout(() => {
        if (state.autoMode && !state.paused) randomizeAll();
        else state.waitingNext = false;
      }, 4500);
    } else if (!state.autoMode) {
      $('status-text').textContent = '작품 완성 (대기 중)';
    }
  }
  requestAnimationFrame(animate);
}

bindEvents();
applyPalettePreset('gallery');
initArtwork();
requestAnimationFrame(animate);
