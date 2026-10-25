// 선 레이어 기반 면(Region) 감지 및 마스킹 모듈
function polyArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i].x * q.y - q.x * p[i].y;
  }
  return Math.abs(a) / 2;
}

function polyBounds(p) {
  const xs = p.map(v => v.x);
  const ys = p.map(v => v.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

function pointInConvex(poly, x, y) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross !== 0) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

// 직선(점 p, 법선 n)에 의한 볼록 다각형 클리핑 (Sutherland-Hodgman)
function clipHalfPoly(poly, px, py, nx, ny, keepPositive) {
  const sgn = keepPositive ? 1 : -1;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = sgn * ((a.x - px) * nx + (a.y - py) * ny);
    const db = sgn * ((b.x - px) * nx + (b.y - py) * ny);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

// 현재 저장된 모든 분할선들을 기준으로 캔버스 전체를 면(Regions)들로 계산
function detectRegionsFromLines() {
  const W = state.width;
  const H = state.height;
  let polys = [[{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }]];

  for (const line of state.lines) {
    if (line.type !== 'segment') continue;
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) continue;

    // 직선의 법선 벡터
    const nx = -dy / len;
    const ny = dx / len;
    const px = line.x1;
    const py = line.y1;

    const nextPolys = [];
    for (const poly of polys) {
      const a = clipHalfPoly(poly, px, py, nx, ny, true);
      const b = clipHalfPoly(poly, px, py, nx, ny, false);
      const minArea = 100 * state.uScale * state.uScale;
      if (a.length >= 3 && polyArea(a) > minArea) nextPolys.push(a);
      if (b.length >= 3 && polyArea(b) > minArea) nextPolys.push(b);
      // 만약 둘 다 분할되지 않은 경우 원본 유지
      if (nextPolys.length === 0 || (a.length < 3 && b.length < 3)) {
        nextPolys.push(poly);
      }
    }
    polys = nextPolys;
  }

  // 중복 및 무효 폴리곤 정제
  state.regions = polys.map((poly, idx) => ({
    id: idx,
    poly,
    bounds: polyBounds(poly),
    area: polyArea(poly),
    color: state.palette[1 + (idx % (state.palette.length - 1))],
    filled: false
  }));

  return state.regions;
}

// 특정 좌표 (x, y)가 속한 면 찾기 (수동 클릭 채우기용)
function findRegionAtPoint(x, y) {
  if (!state.regions || state.regions.length === 0) {
    detectRegionsFromLines();
  }
  for (const reg of state.regions) {
    if (pointInConvex(reg.poly, x, y)) {
      return reg;
    }
  }
  return null;
}
