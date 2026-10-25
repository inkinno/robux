// 레이어 페인터: 획 경로(선분 목록)를 그리는 공용 도구.
// 획 단위 디테일은 scratch에 불투명하게 그린 뒤 한 번에 합성해 선분 이음새가 생기지 않게 한다.
const scratch = document.createElement('canvas');
const sctx = scratch.getContext('2d');

function ensureScratch() {
  if (scratch.width !== state.width || scratch.height !== state.height) {
    scratch.width = state.width;
    scratch.height = state.height;
  }
}

// 점마다 진행 방향의 법선 벡터
function computeNormals(pts) {
  const n = pts.length;
  const out = new Array(n);
  let last = { x: 0, y: 1 };
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len > 0.0001) last = { x: -dy / len, y: dx / len };
    out[i] = last;
  }
  return out;
}

function runBox(pts, pad) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pts.forEach(p => {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  });
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

// 화면 범위로 자른 정수 박스 (비면 null)
function clampBox(b) {
  if (!b) return null;
  const x = Math.max(0, Math.floor(b.x));
  const y = Math.max(0, Math.floor(b.y));
  const w = Math.min(state.width, Math.ceil(b.x + b.w)) - x;
  const h = Math.min(state.height, Math.ceil(b.y + b.h)) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

// 법선 방향으로 o(굵기 비율)만큼 띄운 선분들을 c에 그림 (round cap/join)
function traceSegments(c, pts, normals, o, wm, color) {
  const dynamic = typeof color === 'function';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (!dynamic) c.strokeStyle = color;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const na = normals[i];
    const nb = normals[i + 1];
    c.lineWidth = Math.max(1, ((a.w + b.w) / 2) * wm);
    if (dynamic) c.strokeStyle = color({ ang: Math.atan2(b.y - a.y, b.x - a.x), d: a.d, i });
    c.beginPath();
    c.moveTo(a.x + na.x * o * a.w, a.y + na.y * o * a.w);
    c.lineTo(b.x + nb.x * o * b.w, b.y + nb.y * o * b.w);
    c.stroke();
  }
}

// 획 단위 레이어 1장 합성. L: { o, wm, color, alpha, op }
function paintLayer(target, run, normals, maxW, L) {
  const o = L.o || 0;
  const wm = L.wm === undefined ? 1 : L.wm;
  const box = clampBox(runBox(run.pts, maxW * (Math.abs(o) + wm) + 4));
  if (!box) return;
  ensureScratch();
  sctx.clearRect(box.x, box.y, box.w, box.h);
  traceSegments(sctx, run.pts, normals, o, wm, L.color);
  target.save();
  target.globalAlpha = L.alpha === undefined ? 1 : L.alpha;
  target.globalCompositeOperation = L.op || 'source-over';
  target.drawImage(scratch, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
  target.restore();
}
