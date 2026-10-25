// UI 이벤트 바인딩 및 인터랙션 모듈
function syncSettingsFromUI() {
  if ($('line-width-slider')) {
    state.lineWidth = parseInt($('line-width-slider').value, 10);
    if ($('line-width-label')) $('line-width-label').textContent = state.lineWidth + 'px';
  }
  if ($('line-color-picker')) {
    state.lineColor = $('line-color-picker').value;
  }
  if ($('fill-type-select')) {
    state.fillType = $('fill-type-select').value;
  }
  if ($('palette-preset')) {
    state.palettePreset = $('palette-preset').value;
  }
}

function bindUIEvents() {
  // 모드 전환 탭 (선 긋기 / 면 채우기)
  const tabLine = $('tab-mode-line');
  const tabFill = $('tab-mode-fill');
  const panelLine = $('panel-line-tools');
  const panelFill = $('panel-fill-tools');

  if (tabLine && tabFill) {
    tabLine.addEventListener('click', () => {
      state.mode = 'line';
      tabLine.classList.add('active');
      tabFill.classList.remove('active');
      panelLine.style.display = 'block';
      panelFill.style.display = 'none';
      if ($('status-text')) $('status-text').textContent = '모드: 선 긋기 (랜덤 또는 드래그로 그리기)';
    });

    tabFill.addEventListener('click', () => {
      state.mode = 'fill';
      tabFill.classList.add('active');
      tabLine.classList.remove('active');
      panelFill.style.display = 'block';
      panelLine.style.display = 'none';
      detectRegionsFromLines();
      if ($('status-text')) $('status-text').textContent = '모드: 면 채우기 (칸을 클릭하거나 자동 채우기)';
    });
  }

  // 선 두께 슬라이더
  if ($('line-width-slider')) {
    $('line-width-slider').addEventListener('input', e => {
      state.lineWidth = parseInt(e.target.value, 10);
      if ($('line-width-label')) $('line-width-label').textContent = state.lineWidth + 'px';
      // 기존 선 두께 일괄 업데이트
      for (const line of state.lines) {
        line.width = state.lineWidth * state.uScale;
      }
      renderLineCanvas();
      compositeToView();
    });
  }

  // 선 개수 슬라이더
  if ($('line-count-slider')) {
    $('line-count-slider').addEventListener('input', e => {
      if ($('line-count-label')) $('line-count-label').textContent = e.target.value + '개';
    });
  }

  // 랜덤 선 생성 버튼
  if ($('btn-random-lines')) {
    $('btn-random-lines').addEventListener('click', () => {
      const count = parseInt($('line-count-slider').value, 10);
      generateRandomLines(count);
      detectRegionsFromLines();
      compositeToView();
      if ($('status-text')) $('status-text').textContent = `${count}개의 선이 랜덤 생성되었습니다.`;
    });
  }

  // 선 전체 지우기
  if ($('btn-clear-lines')) {
    $('btn-clear-lines').addEventListener('click', () => {
      clearLines();
      clearFillCanvas();
      compositeToView();
      if ($('status-text')) $('status-text').textContent = '선과 채움이 초기화되었습니다.';
    });
  }

  // 직전 선 취소 (Undo Line)
  if ($('btn-undo-line')) {
    $('btn-undo-line').addEventListener('click', () => {
      if (state.lines.length > 0) {
        state.lines.pop();
        renderLineCanvas();
        detectRegionsFromLines();
        compositeToView();
        if ($('status-text')) $('status-text').textContent = '마지막 선을 취소했습니다.';
      }
    });
  }

  // 브러시 이어짐 정도 (Continuity)
  if ($('continuity-slider')) {
    $('continuity-slider').addEventListener('input', e => {
      state.brushContinuity = parseInt(e.target.value, 10) / 100;
      if ($('continuity-label')) $('continuity-label').textContent = e.target.value + '%';
    });
  }

  // 선 색상
  if ($('line-color-picker')) {
    $('line-color-picker').addEventListener('input', e => {
      state.lineColor = e.target.value;
      for (const line of state.lines) {
        line.color = state.lineColor;
      }
      renderLineCanvas();
      compositeToView();
    });
  }

  // 채움 방식 선택
  if ($('fill-type-select')) {
    $('fill-type-select').addEventListener('change', e => {
      state.fillType = e.target.value;
    });
  }

  // 팔레트 프리셋
  if ($('palette-preset')) {
    $('palette-preset').addEventListener('change', e => {
      const key = e.target.value;
      if (PALETTES[key]) {
        state.palette = [...PALETTES[key]];
        for (let i = 0; i < 5; i++) {
          if ($('col' + i)) $('col' + i).value = state.palette[i];
        }
        detectRegionsFromLines();
      }
    });
  }

  // 전체 자동 채우기 버튼
  if ($('btn-auto-fill')) {
    $('btn-auto-fill').addEventListener('click', () => {
      startAutoFillSequence();
    });
  }

  // 채움 초기화 버튼
  if ($('btn-clear-fill')) {
    $('btn-clear-fill').addEventListener('click', () => {
      stopAutoFillSequence();
      clearFillCanvas();
      compositeToView();
      if ($('status-text')) $('status-text').textContent = '채움이 지워졌습니다. (선 유지)';
    });
  }

  // 직전 채움 취소 (Undo Fill)
  if ($('btn-undo-fill')) {
    $('btn-undo-fill').addEventListener('click', () => {
      const filledRegs = state.regions.filter(r => r.filled);
      if (filledRegs.length > 0) {
        filledRegs[filledRegs.length - 1].filled = false;
        clearFillCanvas();
        for (const reg of state.regions) {
          if (reg.filled) {
            fillRegion(reg, state.fillType);
          }
        }
        compositeToView();
        if ($('status-text')) $('status-text').textContent = '직전 채움을 취소했습니다.';
      }
    });
  }

  // 화면 녹화 토글
  if ($('btn-record')) {
    $('btn-record').addEventListener('click', () => {
      if (typeof toggleRecording === 'function') {
        toggleRecording();
      }
    });
  }

  // 마우스 수동 드로잉 & 클릭 채우기 이벤트
  let isMouseDown = false;
  let dragStart = null;

  canvas.addEventListener('mousedown', e => {
    isMouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = state.width / rect.width;
    const scaleY = state.height / rect.height;
    dragStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };

    if (state.mode === 'line') {
      state.activeDrawingLine = {
        type: 'segment',
        x1: dragStart.x,
        y1: dragStart.y,
        x2: dragStart.x,
        y2: dragStart.y
      };
    }
  });

  window.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = state.width / rect.width;
    const scaleY = state.height / rect.height;
    const curX = (e.clientX - rect.left) * scaleX;
    const curY = (e.clientY - rect.top) * scaleY;

    if (state.mode === 'line' && state.activeDrawingLine) {
      state.activeDrawingLine.x2 = curX;
      state.activeDrawingLine.y2 = curY;
      renderLineCanvas();
      compositeToView();
    }
  });

  window.addEventListener('mouseup', e => {
    if (!isMouseDown) return;
    isMouseDown = false;

    const rect = canvas.getBoundingClientRect();
    const scaleX = state.width / rect.width;
    const scaleY = state.height / rect.height;
    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const dist = Math.hypot(endX - dragStart.x, endY - dragStart.y);

    if (state.mode === 'line') {
      if (dist > 10 * state.uScale) {
        // 드래그된 선을 캔버스 끝까지 확장해서 추가
        const borders = getBorderIntersections(dragStart, { x: endX, y: endY }, state.width, state.height);
        if (borders) {
          addManualLine(borders[0].x, borders[0].y, borders[1].x, borders[1].y);
        } else {
          addManualLine(dragStart.x, dragStart.y, endX, endY);
        }
        detectRegionsFromLines();
      }
      state.activeDrawingLine = null;
      renderLineCanvas();
      compositeToView();
    } else if (state.mode === 'fill') {
      // 채우기 모드에서는 클릭 시 해당 면 채우기
      if (dist < 15 * state.uScale) {
        handleCanvasClick(e);
      }
    }
  });

  // UI 숨기기 토글 (H키)
  if ($('btn-toggle-ui')) {
    $('btn-toggle-ui').addEventListener('click', () => {
      $('ui-panel').classList.toggle('hidden');
    });
  }

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'h' || e.key === 'H') {
      $('ui-panel').classList.toggle('hidden');
    }
  });

  // 이미지 저장
  if ($('btn-save')) {
    $('btn-save').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `art_split_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }
}
