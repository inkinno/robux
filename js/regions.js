// 면 분할: 캔버스를 볼록 다각형 여러 개로 쪼갬 (몬드리안 = 축 정렬, 랜덤 = 임의 방향 선)
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

// 직선(점 p, 법선 n)의 한쪽 반평면만 남김 (Sutherland-Hodgman)
function clipHalf(poly, px, py, nx, ny, keepPositive) {
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

// 직선과 다각형의 교차 선분 (경계선 그리기용)
function cutSegment(poly, px, py, nx, ny) {
  const pts = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = (a.x - px) * nx + (a.y - py) * ny;
    const db = (b.x - px) * nx + (b.y - py) * ny;
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return pts.length >= 2 ? [pts[0], pts[1]] : null;
}

function splitRegions(count, mode) {
  const W = state.width;
  const H = state.height;
  const polys = [[{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }]];
  const lines = [];
  const minArea = (W * H) / (count * 5);
  let guard = 0;
  while (polys.length < count && guard++ < count * 40) {
    // 큰 면을 우선 선택 (두 후보 중 큰 쪽)
    let idx = Math.floor(rand() * polys.length);
    const j = Math.floor(rand() * polys.length);
    if (polyArea(polys[j]) > polyArea(polys[idx])) idx = j;
    const poly = polys[idx];
    const bb = polyBounds(poly);
    const px = bb.x + bb.w * randRange(0.3, 0.7);
    const py = bb.y + bb.h * randRange(0.3, 0.7);
    let ang;
    if (mode === 'axis') {
      const cutVertical = (bb.w >= bb.h) === (rand() < 0.8);
      ang = cutVertical ? Math.PI / 2 : 0;
    } else {
      ang = rand() * Math.PI;
    }
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const a = clipHalf(poly, px, py, nx, ny, true);
    const b = clipHalf(poly, px, py, nx, ny, false);
    if (a.length < 3 || b.length < 3 || polyArea(a) < minArea || polyArea(b) < minArea) continue;
    const seg = cutSegment(poly, px, py, nx, ny);
    if (seg) lines.push(seg);
    polys.splice(idx, 1, a, b);
  }
  return { polys, lines };
}

// 다각형이 y 주변 밴드에서 차지하는 가로 범위 (페인트통 지그재그용)
function spanAtY(poly, y) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a.y <= y) !== (b.y <= y)) {
      const x = a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
  }
  return lo <= hi ? [lo, hi] : null;
}

function spanOfBand(poly, y, half) {
  let lo = Infinity;
  let hi = -Infinity;
  [y - half, y, y + half].forEach(yy => {
    const s = spanAtY(poly, yy);
    if (s) { lo = Math.min(lo, s[0]); hi = Math.max(hi, s[1]); }
  });
  return lo <= hi ? [lo, hi] : null;
}

function drawDividers(lines, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.beginPath();
  lines.forEach(([a, b]) => { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); });
  ctx.stroke();
  ctx.strokeRect(0, 0, state.width, state.height);
  ctx.restore();
}
