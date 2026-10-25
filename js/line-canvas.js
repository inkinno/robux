// 선(테이프/경계선) 레이어 관리 모듈
function resizeLineCanvas() {
  lineCanvas.width = state.width;
  lineCanvas.height = state.height;
  fillCanvas.width = state.width;
  fillCanvas.height = state.height;
}

// 캔버스 외곽 경계와 직선의 교차점 계산
function getBorderIntersections(p1, p2, width, height) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return null;

  const pts = [];
  // 좌측 x = 0
  if (Math.abs(dx) > 1e-6) {
    const t = (0 - p1.x) / dx;
    const y = p1.y + t * dy;
    if (y >= -1 && y <= height + 1) pts.push({ x: 0, y });
  }
  // 우측 x = width
  if (Math.abs(dx) > 1e-6) {
    const t = (width - p1.x) / dx;
    const y = p1.y + t * dy;
    if (y >= -1 && y <= height + 1) pts.push({ x: width, y });
  }
  // 상단 y = 0
  if (Math.abs(dy) > 1e-6) {
    const t = (0 - p1.y) / dy;
    const x = p1.x + t * dx;
    if (x >= -1 && x <= width + 1) pts.push({ x, y: 0 });
  }
  // 하단 y = height
  if (Math.abs(dy) > 1e-6) {
    const t = (height - p1.y) / dy;
    const x = p1.x + t * dx;
    if (x >= -1 && x <= width + 1) pts.push({ x, y: height });
  }

  // 중복 및 너무 가까운 점 제거
  const unique = [];
  for (const pt of pts) {
    if (!unique.some(u => Math.hypot(u.x - pt.x, u.y - pt.y) < 1)) {
      unique.push(pt);
    }
  }
  return unique.length >= 2 ? [unique[0], unique[1]] : null;
}

// 랜덤 선 생성 (화면을 시원하게 가로지르는 테이핑 분할선)
function generateRandomLines(count = 7) {
  state.lines = [];
  const W = state.width;
  const H = state.height;

  for (let i = 0; i < count; i++) {
    // 캔버스 내부 중심부 20%~80% 영역에서 랜덤 기준점 2개 선택 후 경계까지 확장
    const p1 = {
      x: W * (0.15 + rand() * 0.7),
      y: H * (0.15 + rand() * 0.7)
    };
    const angle = rand() * Math.PI;
    const p2 = {
      x: p1.x + Math.cos(angle) * 100,
      y: p1.y + Math.sin(angle) * 100
    };

    const borders = getBorderIntersections(p1, p2, W, H);
    if (borders) {
      state.lines.push({
        type: 'segment',
        x1: borders[0].x,
        y1: borders[0].y,
        x2: borders[1].x,
        y2: borders[1].y,
        width: state.lineWidth * state.uScale,
        color: state.lineColor
      });
    }
  }

  renderLineCanvas();
}

// 수동 직선 추가
function addManualLine(x1, y1, x2, y2) {
  state.lines.push({
    type: 'segment',
    x1, y1, x2, y2,
    width: state.lineWidth * state.uScale,
    color: state.lineColor
  });
  renderLineCanvas();
}

// 수동 자유 곡선 추가
function addManualFreeLine(points) {
  if (!points || points.length < 2) return;
  state.lines.push({
    type: 'curve',
    pts: points,
    width: state.lineWidth * state.uScale,
    color: state.lineColor
  });
  renderLineCanvas();
}

// 모든 선 지우기
function clearLines() {
  state.lines = [];
  state.regions = [];
  lineCtx.clearRect(0, 0, state.width, state.height);
}

// 선 레이어 전체 렌더링
function renderLineCanvas() {
  lineCtx.clearRect(0, 0, state.width, state.height);
  
  // 외곽 테두리 선
  lineCtx.save();
  lineCtx.strokeStyle = state.lineColor;
  lineCtx.lineWidth = state.lineWidth * state.uScale;
  lineCtx.lineCap = 'round';
  lineCtx.lineJoin = 'round';
  lineCtx.strokeRect(0, 0, state.width, state.height);

  // 내부 분할선들 렌더링
  for (const line of state.lines) {
    lineCtx.beginPath();
    lineCtx.lineWidth = line.width;
    lineCtx.strokeStyle = line.color || state.lineColor;

    if (line.type === 'segment') {
      lineCtx.moveTo(line.x1, line.y1);
      lineCtx.lineTo(line.x2, line.y2);
    } else if (line.type === 'curve' && line.pts.length >= 2) {
      lineCtx.moveTo(line.pts[0].x, line.pts[0].y);
      for (let i = 1; i < line.pts.length; i++) {
        lineCtx.lineTo(line.pts[i].x, line.pts[i].y);
      }
    }
    lineCtx.stroke();
  }

  // 임시 드로잉 선 표시
  if (state.activeDrawingLine) {
    const act = state.activeDrawingLine;
    lineCtx.beginPath();
    lineCtx.lineWidth = state.lineWidth * state.uScale;
    lineCtx.strokeStyle = 'rgba(99, 102, 241, 0.85)'; // 활성 드로잉 가이드 색
    if (act.type === 'segment') {
      lineCtx.moveTo(act.x1, act.y1);
      lineCtx.lineTo(act.x2, act.y2);
    } else if (act.type === 'curve' && act.pts.length >= 2) {
      lineCtx.moveTo(act.pts[0].x, act.pts[0].y);
      for (let i = 1; i < act.pts.length; i++) {
        lineCtx.lineTo(act.pts[i].x, act.pts[i].y);
      }
    }
    lineCtx.stroke();
  }

  lineCtx.restore();
}
