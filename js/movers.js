// 붓(에이전트) 이동 규칙: 코어 알고리즘별. 에이전트는 한 번에 한 개씩 순차 실행된다.
function setSerpRow(ag) {
  const b = state.bounds;
  const poly = state.job.poly;
  let lo = b.x;
  let hi = b.x + b.w;
  if (poly) {
    const s = spanOfBand(poly, ag.y, ag.spacing * 0.5);
    if (s) { lo = s[0]; hi = s[1]; } else { lo = hi = b.x + b.w / 2; }
  }
  const over = ag.bw * 0.3;
  ag.xmin = lo - over;
  ag.xmax = hi + over;
  const startX = ag.dir > 0 ? ag.xmin : ag.xmax;
  if (ag.x === undefined || Math.abs(ag.x - startX) > ag.v * 1.5) {
    ag.x = startX;
    ag.teleport = true;
  }
}

const CORE_MOVERS = {
  // 페인트통: 면을 지그재그로 한 줄씩 채움
  serpentine(ag) {
    const b = state.bounds;
    if (ag.phase === 'row') {
      ag.x += ag.dir * ag.v;
      if ((ag.dir > 0 && ag.x >= ag.xmax) || (ag.dir < 0 && ag.x <= ag.xmin)) {
        ag.phase = 'down';
        ag.targetY = ag.y + ag.spacing;
      }
    } else {
      ag.y += ag.v;
      if (ag.y >= ag.targetY) {
        ag.y = ag.targetY;
        ag.dir *= -1;
        ag.phase = 'row';
        setSerpRow(ag);
      }
    }
    if (ag.y > b.y + b.h + ag.bw * 0.2) ag.done = true;
  },

  partition(ag) {
    ag.x += Math.cos(ag.angle) * ag.v * 1.4;
    ag.y += Math.sin(ag.angle) * ag.v * 1.4;
    if (rand() < 0.05) ag.angle += (rand() < 0.5 ? 1 : -1) * (Math.PI / 3);
  },

  growth(ag) {
    ag.angle += pseudoNoise(ag.x, ag.y, state.step * 0.01) * 0.3;
    ag.x += Math.cos(ag.angle) * ag.v * 0.8;
    ag.y += Math.sin(ag.angle) * ag.v * 0.8;
  },

  layering(ag) {
    ag.x += ag.v;
    ag.y += Math.sin(ag.x * 0.004 + ag.index) * ag.v * 0.35;
  },

  weaving(ag) {
    if (ag.index % 2 === 0) {
      ag.x += ag.v;
      ag.y += Math.sin(state.step * 0.1 + ag.index) * ag.v * 0.4;
    } else {
      ag.y += ag.v;
      ag.x += Math.cos(state.step * 0.1 + ag.index) * ag.v * 0.4;
    }
  },

  scattering(ag) {
    const b = state.bounds;
    const cx = b.x + b.w * 0.5;
    const cy = b.y + b.h * 0.5;
    const r0 = Math.hypot(ag.x - cx, ag.y - cy) || 1;
    const a = Math.atan2(ag.y - cy, ag.x - cx) + ag.v / r0;
    const r = r0 + (rand() - 0.48) * ag.v * 0.5;
    ag.x = cx + Math.cos(a) * r;
    ag.y = cy + Math.sin(a) * r;
  },

  topology(ag) {
    ag.angle = pseudoNoise(ag.x * 1.4, ag.y * 1.4, 0.5) * TAU;
    ag.x += Math.cos(ag.angle) * ag.v * 0.7;
    ag.y += Math.sin(ag.angle) * ag.v * 0.7;
  },

  subtractive(ag) {
    ag.angle += (rand() - 0.5) * 0.4;
    ag.x += Math.cos(ag.angle) * ag.v * 0.8;
    ag.y += Math.sin(ag.angle) * ag.v * 0.8;
  }
};

// 이동 방향으로 angle을 갱신해야 하는 코어 (나머지는 angle 자체가 상태)
const DIRECTION_DERIVED_CORES = ['serpentine', 'layering', 'weaving', 'scattering'];

// 글리치: 붓이 갑자기 튀어 이동 (복합/극단 옵션). 튀었으면 true
function applyGlitch(ag) {
  if (state.composite !== 'glitch' && state.extreme !== 'chaosBurst') return false;
  const prob = state.extreme === 'chaosBurst' ? 0.12 : 0.035;
  if (rand() >= prob) return false;
  ag.x += (rand() - 0.5) * 220 * state.uScale;
  ag.y += (rand() - 0.5) * 60 * state.uScale;
  return true;
}

// 현재 면 bounds 안에서 순환. 순환했으면 true
function wrapAgent(ag) {
  const b = state.bounds;
  let wrapped = false;
  if (ag.x < b.x) { ag.x = b.x + b.w; wrapped = true; }
  if (ag.x > b.x + b.w) { ag.x = b.x; wrapped = true; }
  if (ag.y < b.y) { ag.y = b.y + b.h; wrapped = true; }
  if (ag.y > b.y + b.h) { ag.y = b.y; wrapped = true; }
  return wrapped;
}
