// 연속 획(Run) 관리: 펜이 내려간 동안의 점을 모아 하나의 획으로 만든다.
// 끝난 획은 젖음 레이어(wet-layer.js)에 누적되어 같은 색 획들과 합집합으로 합쳐진다.
const RUN_MAX_POINTS = 300; // 프레임당 재렌더 비용 상한. 마스크 합집합이라 이어 붙여도 이음새 없음

// 합쳐지는 단위(젖음 그룹) 키: 면 색이 있으면 면 색, 없으면 붓 색
function wetKeyFor(ag) {
  return state.job && state.job.color ? state.job.color : ag.color;
}

function beginRun(ag, x, y, w) {
  return {
    ag, color: ag.color, key: wetKeyFor(ag), light: state.lightAngle,
    pts: [{ x, y, w, d: 0 }]
  };
}

// 파스텔 가루 입자: 캡슐(선분 + 양끝 반원) 영역 안 2D 균일 분포. base에 바로 찍음
function scatterGrains(a, b, w, color) {
  const u = state.uScale;
  const r = w / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = len > 0.0001 ? (b.x - a.x) / len : 1;
  const uy = len > 0.0001 ? (b.y - a.y) / len : 0;
  const n = clamp(Math.ceil((len + w) * w * 0.03), 4, 60);
  for (let i = 0; i < n; i++) {
    const t = -r + rand() * (len + 2 * r);
    const o = (rand() * 2 - 1) * r;
    const g = (0.6 + rand() * 1.6) * u;
    const alpha = 0.5 + rand() * 0.4;
    if (t < 0 && t * t + o * o > r * r) continue;
    if (t > len && (t - len) * (t - len) + o * o > r * r) continue;
    ctx.fillStyle = rgbaString(color, alpha);
    ctx.fillRect(a.x + ux * t - uy * o, a.y + uy * t + ux * o, g, g);
  }
}

function addRunPoint(run, x, y, w) {
  const last = run.pts[run.pts.length - 1];
  const p = { x, y, w, d: last.d + Math.hypot(x - last.x, y - last.y) };
  run.pts.push(p);
  if (state.material === 'pastel') scatterGrains(last, p, w, run.color);
}

function endRun() {
  if (state.run) wetAddRun(state.run);
  state.run = null;
}

// 펜이 내려간 상태에서 한 스텝 진행
function extendRun(ag, x0, y0, x1, y1, w) {
  if (!state.run) state.run = beginRun(ag, x0, y0, w);
  addRunPoint(state.run, x1, y1, w);
  if (state.run.pts.length >= RUN_MAX_POINTS) {
    endRun();
    state.run = beginRun(ag, x1, y1, w);
  }
}

// 붓이 떨어진 상태의 점: 짧은 캡슐 획. 같은 젖음 그룹에 들어가 맞닿은 점끼리 합쳐짐
function drawDotRun(ag, x, y, w) {
  const l = Math.max(1, w * 0.15);
  const run = beginRun(ag, x, y, w);
  addRunPoint(run, x + Math.cos(ag.angle) * l, y + Math.sin(ag.angle) * l, w);
  wetAddRun(run);
}

// 화면 표시: 확정된 base + 젖음 레이어 + 진행 중인 획
function presentFrame() {
  viewCtx.drawImage(baseCanvas, 0, 0);
  if (wet.key === null && !state.run) return;
  viewCtx.save();
  const poly = state.job && state.job.poly;
  if (poly) {
    viewCtx.beginPath();
    poly.forEach((p, i) => (i ? viewCtx.lineTo(p.x, p.y) : viewCtx.moveTo(p.x, p.y)));
    viewCtx.closePath();
    viewCtx.clip();
  }
  renderWetView(viewCtx, state.run);
  viewCtx.restore();
}
