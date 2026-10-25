// 젖음(Wet) 레이어: 같은 면·같은 색의 획을 커버리지 마스크에 누적한다.
// 외곽선은 매번 "마스크 합집합 - 침식된 마스크"로 다시 계산하므로,
// 나중 획이 앞 획의 가장자리를 덮으면 그 부분은 외곽선에서 자동으로 빠진다.
function makeBuffer() {
  const c = document.createElement('canvas');
  return { c, x: c.getContext('2d') };
}

const WB = {
  mask: makeBuffer(),       // 확정된 획들의 합집합 (불투명 흰색)
  detail: makeBuffer(),     // 확정된 획들의 디테일
  workMask: makeBuffer(),   // mask + 진행 중인 획
  workDetail: makeBuffer(), // detail + 진행 중인 획
  inner: makeBuffer(),      // 침식된 workMask
  ring: makeBuffer(),       // workMask - inner
  tint: makeBuffer()        // 색 입히기용 임시
};

const wet = { key: null, box: null, maxW: 0, avgW: 0 };

function ensureWetBuffers() {
  Object.values(WB).forEach(b => {
    if (b.c.width !== state.width || b.c.height !== state.height) {
      b.c.width = state.width;
      b.c.height = state.height;
    }
  });
}

function unionBox(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

function padBox(b, p) {
  return { x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 };
}

// 획 통계(평균/최대 굵기)와 법선
function prepRun(run) {
  let sum = 0;
  let maxW = 0;
  run.pts.forEach(p => { sum += p.w; maxW = Math.max(maxW, p.w); });
  run.avgW = sum / run.pts.length;
  return { normals: computeNormals(run.pts), maxW };
}

function drawRunInto(maskCtx, detailCtx, run, prep) {
  traceSegments(maskCtx, run.pts, prep.normals, 0, 1, '#ffffff');
  buildRunDetails(run).forEach(L => paintLayer(detailCtx, run, prep.normals, prep.maxW * 1.3, L));
}

function wetReset() {
  ensureWetBuffers();
  WB.mask.x.clearRect(0, 0, state.width, state.height);
  WB.detail.x.clearRect(0, 0, state.width, state.height);
  wet.key = null;
  wet.box = null;
  wet.maxW = 0;
  wet.avgW = 0;
}

// 획을 젖음 레이어에 누적. 색(key)이 바뀌면 이전 레이어를 먼저 말려 확정
function wetAddRun(run) {
  if (run.pts.length < 2) return;
  ensureWetBuffers();
  if (wet.key !== null && wet.key !== run.key) wetCommit();
  wet.key = run.key;
  const prep = prepRun(run);
  drawRunInto(WB.mask.x, WB.detail.x, run, prep);
  wet.box = unionBox(wet.box, runBox(run.pts, prep.maxW));
  wet.maxW = Math.max(wet.maxW, prep.maxW);
  wet.avgW = Math.max(wet.avgW, run.avgW);
}

function copyRegion(dst, src, b) {
  dst.x.clearRect(b.x, b.y, b.w, b.h);
  if (src) dst.x.drawImage(src.c, b.x, b.y, b.w, b.h, b.x, b.y, b.w, b.h);
}

// 8방향 이동 교집합 = k픽셀 침식
function erodeMask(b, k) {
  const I = WB.inner.x;
  const M = WB.workMask.c;
  copyRegion(WB.inner, WB.workMask, b);
  I.save();
  I.globalCompositeOperation = 'destination-in';
  [[k, 0], [-k, 0], [0, k], [0, -k], [k, k], [k, -k], [-k, k], [-k, -k]].forEach(([dx, dy]) => {
    I.drawImage(M, b.x, b.y, b.w, b.h, b.x + dx, b.y + dy, b.w, b.h);
  });
  I.restore();
}

function makeRing(b) {
  copyRegion(WB.ring, WB.workMask, b);
  const R = WB.ring.x;
  R.save();
  R.globalCompositeOperation = 'destination-out';
  R.drawImage(WB.inner.c, b.x, b.y, b.w, b.h, b.x, b.y, b.w, b.h);
  R.restore();
}

function compositeMaskLayer(target, b, L) {
  let srcCanvas;
  if (L.src === 'detail') {
    srcCanvas = WB.workDetail.c;
  } else {
    const src = { mask: WB.workMask, inner: WB.inner, ring: WB.ring }[L.src];
    const T = WB.tint.x;
    copyRegion(WB.tint, src, b);
    T.save();
    T.globalCompositeOperation = 'source-in';
    T.fillStyle = L.color;
    T.fillRect(b.x, b.y, b.w, b.h);
    T.restore();
    srcCanvas = WB.tint.c;
  }
  target.save();
  target.globalAlpha = L.alpha === undefined ? 1 : L.alpha;
  target.globalCompositeOperation = L.op || 'source-over';
  if (L.blur) {
    target.shadowColor = L.blurColor;
    target.shadowBlur = L.blur;
  }
  target.drawImage(srcCanvas, b.x, b.y, b.w, b.h, b.x + (L.dx || 0), b.y + (L.dy || 0), b.w, b.h);
  target.restore();
}

// 한 젖음 그룹 렌더: withCommitted=확정 획 포함, run=진행 중 획(없으면 null)
function renderWetGroup(target, withCommitted, run, color) {
  let box = withCommitted ? wet.box : null;
  let prep = null;
  let avgW = withCommitted ? wet.avgW : 0;
  if (run) {
    prep = prepRun(run);
    box = unionBox(box, runBox(run.pts, prep.maxW));
    avgW = Math.max(avgW, run.avgW);
  }
  const b = clampBox(box && padBox(box, 40 * state.uScale + 8));
  if (!b || !color) return;
  ensureWetBuffers();
  copyRegion(WB.workMask, withCommitted ? WB.mask : null, b);
  copyRegion(WB.workDetail, withCommitted ? WB.detail : null, b);
  if (run) drawRunInto(WB.workMask.x, WB.workDetail.x, run, prep);

  const k = Math.max(1, Math.round(avgW * 0.08));
  const layers = buildMaskLayers(color, k);
  const srcs = layers.map(L => L.src);
  if (srcs.includes('inner') || srcs.includes('ring')) erodeMask(b, k);
  if (srcs.includes('ring')) makeRing(b);
  layers.forEach(L => compositeMaskLayer(target, b, L));
}

// 말림: 확정 획 그룹을 base(ctx, 현재 면 클립 적용 중)에 확정하고 비움
function wetCommit() {
  if (wet.key === null) return;
  renderWetGroup(ctx, true, null, wet.key);
  wetReset();
}

// 화면 표시용: 확정 그룹 + 진행 중인 획 (색이 다르면 별도 그룹)
function renderWetView(target, run) {
  if (run && run.pts.length < 2) run = null;
  if (run && wet.key !== null && run.key !== wet.key) {
    renderWetGroup(target, true, null, wet.key);
    renderWetGroup(target, false, run, run.key);
  } else if (wet.key !== null || run) {
    renderWetGroup(target, true, run, wet.key !== null ? wet.key : run.key);
  }
}
