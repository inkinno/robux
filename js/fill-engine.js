// 면 채움 엔진 (단색 페인트, 그라데이션, 완전 연속 붓질, 고밀도 점묘화)
function clearFillCanvas() {
  fillCtx.fillStyle = state.canvasBg || '#f8fafc';
  fillCtx.fillRect(0, 0, state.width, state.height);
  renderSubstrateTextureTo(fillCtx);
}

// 캔버스 바탕지 텍스처
function renderSubstrateTextureTo(targetCtx) {
  if (state.substrate === 'smooth') return;
  targetCtx.save();
  const step = Math.round(4 * state.uScale);
  if (state.substrate === 'canvasGrain') {
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.022)';
    targetCtx.lineWidth = state.uScale;
    targetCtx.beginPath();
    for (let x = 0; x < state.width; x += step * 2) {
      targetCtx.moveTo(x, 0); targetCtx.lineTo(x, state.height);
    }
    for (let y = 0; y < state.height; y += step * 2) {
      targetCtx.moveTo(0, y); targetCtx.lineTo(state.width, y);
    }
    targetCtx.stroke();
  } else if (state.substrate === 'paperGrain') {
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let i = 0; i < 4500; i++) {
      const pr = (1 + rand() * 3) * state.uScale;
      targetCtx.fillRect(rand() * state.width, rand() * state.height, pr, pr);
    }
  }
  targetCtx.restore();
}

// 면 다각형 클리핑 경로 적용 헬퍼
function clipToRegion(targetCtx, poly) {
  targetCtx.beginPath();
  poly.forEach((pt, idx) => {
    if (idx === 0) targetCtx.moveTo(pt.x, pt.y);
    else targetCtx.lineTo(pt.x, pt.y);
  });
  targetCtx.closePath();
  targetCtx.clip();
}

// 1. 단색 페인트통 채우기 (Solid Paint Bucket)
function fillSolid(targetCtx, region, color) {
  targetCtx.save();
  clipToRegion(targetCtx, region.poly);
  targetCtx.fillStyle = color;
  targetCtx.fillRect(region.bounds.x, region.bounds.y, region.bounds.w, region.bounds.h);
  targetCtx.restore();
}

// 2. 그라데이션 채우기 (Gradient Fill)
function fillGradient(targetCtx, region, color1, color2, angle = null) {
  targetCtx.save();
  clipToRegion(targetCtx, region.poly);

  const b = region.bounds;
  const ang = angle !== null ? angle : (b.w > b.h ? 0 : Math.PI / 2);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const halfLen = Math.hypot(b.w, b.h) / 2;

  const x0 = cx - Math.cos(ang) * halfLen;
  const y0 = cy - Math.sin(ang) * halfLen;
  const x1 = cx + Math.cos(ang) * halfLen;
  const y1 = cy + Math.sin(ang) * halfLen;

  const grad = targetCtx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.5, mixColor(color1, color2, 0.5));
  grad.addColorStop(1, color2);

  targetCtx.fillStyle = grad;
  targetCtx.fillRect(b.x, b.y, b.w, b.h);
  targetCtx.restore();
}

// 3. 완전 연속 붓질 (Continuous Brush - 절대 끊어지지 않고 한 획처럼 면을 채움)
function fillContinuousBrush(targetCtx, region, color) {
  targetCtx.save();
  clipToRegion(targetCtx, region.poly);

  const b = region.bounds;
  const u = state.uScale;
  const brushSize = clamp(Math.min(b.w, b.h) / 6, 16 * u, 100 * u);
  const step = brushSize * 0.55; // 촘촘한 겹침으로 완전 밀폐

  // 면의 고유 각도 (면마다 다채로운 흐름)
  const angle = (region.id * 37) % 180 * (Math.PI / 180);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // 면 중심 및 대각 회전 바운딩
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const diag = Math.hypot(b.w, b.h) / 2 + brushSize;

  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';

  // 1단계: 면 바탕을 부드럽게 받쳐주는 기본 베이스 톤 (빈틈 완전 차단)
  targetCtx.fillStyle = rgbaString(color, 0.35);
  targetCtx.fillRect(b.x, b.y, b.w, b.h);

  // 2단계: 연속 붓질 스트로크 (지그재그 궤적)
  let dir = 1;
  for (let offset = -diag; offset <= diag; offset += step) {
    const xMid = cx + (-sinA) * offset;
    const yMid = cy + cosA * offset;

    const xStart = xMid - cosA * diag * dir;
    const yStart = yMid - sinA * diag * dir;
    const xEnd = xMid + cosA * diag * dir;
    const yEnd = yMid + sinA * diag * dir;

    // 메인 연속 붓 획 (내부 겹침 없이 하나의 유기적 획으로 안착)
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = brushSize;
    targetCtx.beginPath();
    targetCtx.moveTo(xStart, yStart);
    targetCtx.lineTo(xEnd, yEnd);
    targetCtx.stroke();

    // 붓결(Bristle) 입체 질감 및 젖은 모서리 하이라이트/음영
    for (let k = -2; k <= 2; k++) {
      if (k === 0) continue;
      const bOffset = (k / 2.5) * (brushSize * 0.35);
      const bxStart = xStart - sinA * bOffset;
      const byStart = yStart + cosA * bOffset;
      const bxEnd = xEnd - sinA * bOffset;
      const byEnd = yEnd + cosA * bOffset;

      const lumShift = k > 0 ? 18 * k : -14 * Math.abs(k);
      targetCtx.strokeStyle = adjustColorLuminance(color, lumShift);
      targetCtx.lineWidth = Math.max(1.5 * u, brushSize * 0.14);
      targetCtx.beginPath();
      targetCtx.moveTo(bxStart, byStart);
      targetCtx.lineTo(bxEnd, byEnd);
      targetCtx.stroke();
    }

    dir *= -1;
  }

  targetCtx.restore();
}

// 4. 정돈된 고밀도 점묘화 (Dense Pointillism - 쇠라 스타일 완성형 점묘)
function fillDensePointillism(targetCtx, region, baseColor, accentColor) {
  targetCtx.save();
  clipToRegion(targetCtx, region.poly);

  const b = region.bounds;
  const u = state.uScale;
  const dotRadius = Math.max(4 * u, Math.min(b.w, b.h) / 36);
  const spacing = dotRadius * 1.45;

  // 1단계: 면 바탕에 따뜻하고 화사한 베이스 톤 깔기 (흰 빈틈 방지)
  targetCtx.fillStyle = rgbaString(baseColor, 0.45);
  targetCtx.fillRect(b.x, b.y, b.w, b.h);

  // 2단계: 탁한 색을 배제한 화사한 병치혼합 점묘 색상 세트
  const cols = [
    baseColor,
    shiftHex(baseColor, 28),
    shiftHex(baseColor, 52),
    shiftHex(baseColor, -16),
    accentColor,
    shiftHex(accentColor, 32)
  ];

  for (let y = b.y - dotRadius; y <= b.y + b.h + dotRadius; y += spacing) {
    const rowOffset = ((Math.floor((y - b.y) / spacing) % 2) * spacing) / 2;
    for (let x = b.x - dotRadius + rowOffset; x <= b.x + b.w + dotRadius; x += spacing) {
      // 쇠라식 자연스러운 지터 및 크기 변화
      const jx = x + (rand() - 0.5) * spacing * 0.35;
      const jy = y + (rand() - 0.5) * spacing * 0.35;
      const r = dotRadius * (0.8 + rand() * 0.45);

      const colorPick = cols[Math.floor(rand() * cols.length)];
      targetCtx.fillStyle = rgbaString(colorPick, 0.9);
      targetCtx.beginPath();
      targetCtx.arc(jx, jy, r, 0, TAU);
      targetCtx.fill();
    }
  }

  targetCtx.restore();
}

// 개별 면 채우기 디스패처
function fillRegion(region, type = null) {
  if (!region) return;
  const fillMode = type || state.fillType;
  const c1 = region.color;
  const paletteOthers = state.palette.slice(1).filter(c => c !== c1);
  const c2 = paletteOthers.length > 0 ? paletteOthers[Math.floor(rand() * paletteOthers.length)] : state.palette[4];

  switch (fillMode) {
    case 'solid':
      fillSolid(fillCtx, region, c1);
      break;
    case 'gradient':
      fillGradient(fillCtx, region, c1, c2);
      break;
    case 'continuous':
    case 'oil':
      fillContinuousBrush(fillCtx, region, c1);
      break;
    case 'pointillism':
      fillDensePointillism(fillCtx, region, c1, c2);
      break;
    default:
      fillGradient(fillCtx, region, c1, c2);
      break;
  }

  region.filled = true;
  compositeToView();
}

// 최종 뷰 합성: 면 채움 레이어 위에 티 없이 깨끗한 선 레이어를 얹음 (선 보호)
function compositeToView() {
  viewCtx.clearRect(0, 0, state.width, state.height);
  // 1. 채움 캔버스 복사
  viewCtx.drawImage(fillCanvas, 0, 0);
  // 2. 최상단 선 레이어 합성 (선 영역에는 그림이 절대로 침범하지 않음)
  viewCtx.drawImage(lineCanvas, 0, 0);
}
