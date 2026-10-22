// 시스템 알고리즘: 에이전트 초기화 및 스텝 시뮬레이션
function initArtwork() {
  setupResolution();
  syncSettingsFromUI();
  state.step = 0;
  state.waitingNext = false;
  state.lightAngle = -Math.PI * 0.3;
  state.maxSteps = 860;

  if (state.core === 'subtractive') {
    ctx.fillStyle = state.palette[1];
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = 'rgba(5, 6, 10, 0.92)';
  } else {
    ctx.fillStyle = state.palette[0];
  }
  ctx.fillRect(0, 0, state.width, state.height);
  renderSubstrateTexture();

  state.seeds = [];
  state.agents = [];
  const count = state.extreme === 'singleStroke' ? 1 : 88;
  for (let i = 0; i < 24; i++) {
    state.seeds.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      color: state.palette[1 + (i % 4)],
      angle: Math.random() * Math.PI * 2
    });
  }
  for (let i = 0; i < count; i++) {
    const seed = state.seeds[i % state.seeds.length];
    const grow = state.core === 'growth';
    state.agents.push({
      x: grow ? seed.x : Math.random() * state.width,
      y: grow ? seed.y : Math.random() * state.height,
      angle: Math.random() * Math.PI * 2,
      color: state.palette[1 + (i % 4)],
      size: (2.2 + Math.random() * 8.5) * state.uScale
    });
  }
}

// 코어 알고리즘별 이동 규칙
const CORE_MOVERS = {
  partition(ag) {
    const u = state.uScale;
    ag.x += Math.cos(ag.angle) * 14 * u;
    ag.y += Math.sin(ag.angle) * 14 * u;
    if (Math.random() < 0.04) ag.angle += (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 3);
  },
  growth(ag) {
    ag.angle += pseudoNoise(ag.x, ag.y, state.step * 0.01) * 0.25;
    ag.x += Math.cos(ag.angle) * 4.5 * state.uScale;
    ag.y += Math.sin(ag.angle) * 4.5 * state.uScale;
  },
  layering(ag, i) {
    ag.x += 12 * state.uScale;
    ag.y += Math.sin(ag.x * 0.004 + i) * 3.5 * state.uScale;
  },
  weaving(ag, i) {
    const u = state.uScale;
    if (i % 2 === 0) {
      ag.x += 10 * u;
      ag.y += Math.sin(state.step * 0.1 + i) * 4 * u;
    } else {
      ag.y += 10 * u;
      ag.x += Math.cos(state.step * 0.1 + i) * 4 * u;
    }
  },
  scattering(ag) {
    const cx = state.width * 0.5;
    const cy = state.height * 0.5;
    const a = Math.atan2(ag.y - cy, ag.x - cx) + 0.05;
    const r = Math.hypot(ag.x - cx, ag.y - cy) + (Math.random() - 0.48) * 18 * state.uScale;
    ag.x = cx + Math.cos(a) * r;
    ag.y = cy + Math.sin(a) * r;
    ag.angle = a;
  },
  topology(ag) {
    ag.angle = pseudoNoise(ag.x * 1.4, ag.y * 1.4, 0.5) * Math.PI * 2;
    ag.x += Math.cos(ag.angle) * 6 * state.uScale;
    ag.y += Math.sin(ag.angle) * 6 * state.uScale;
  },
  subtractive(ag) {
    ag.angle += (Math.random() - 0.5) * 0.4;
    ag.x += Math.cos(ag.angle) * 9 * state.uScale;
    ag.y += Math.sin(ag.angle) * 9 * state.uScale;
  }
};

function applyGlitch(ag) {
  if (state.composite !== 'glitch' && state.extreme !== 'chaosBurst') return;
  const prob = state.extreme === 'chaosBurst' ? 0.12 : 0.035;
  if (Math.random() < prob) {
    ag.x += (Math.random() - 0.5) * 220 * state.uScale;
    ag.y += (Math.random() - 0.5) * 60 * state.uScale;
  }
}

// 화면 가장자리 순환. 순환했으면 true
function wrapAgent(ag) {
  let wrapped = false;
  if (ag.x < 0) { ag.x = state.width; wrapped = true; }
  if (ag.x > state.width) { ag.x = 0; wrapped = true; }
  if (ag.y < 0) { ag.y = state.height; wrapped = true; }
  if (ag.y > state.height) { ag.y = 0; wrapped = true; }
  return wrapped;
}

function drawErosion(ag, r) {
  ctx.save();
  ctx.fillStyle = state.palette[0];
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(
    ag.x + (Math.random() - 0.5) * 30 * state.uScale,
    ag.y + (Math.random() - 0.5) * 30 * state.uScale,
    r * 1.3, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

function stepSimulation() {
  state.step++;
  state.lightAngle += 0.004;
  const strokeCores = state.core === 'partition' || state.core === 'weaving';

  state.agents.forEach((ag, i) => {
    const prevX = ag.x;
    const prevY = ag.y;
    const mover = CORE_MOVERS[state.core];
    if (mover) mover(ag, i);
    if (state.pattern === 'gravity') ag.y += 2.2 * state.uScale;
    applyGlitch(ag);
    const wrapped = wrapAgent(ag);

    const r = computePatternScale(ag.x, ag.y, ag.size);
    ctx.globalAlpha = state.core === 'layering' ? 0.25 : 0.72;

    if (!wrapped && (strokeCores || state.extreme === 'singleStroke')) {
      ctx.strokeStyle = ag.color;
      ctx.lineWidth = Math.max(0.8, r * 0.42);
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(ag.x, ag.y);
      ctx.stroke();
    }

    drawMaterialUnit(ag.x, ag.y, r, ag.color, ag.angle);
    if (state.composite === 'erosion' && Math.random() < 0.28) drawErosion(ag, r);
  });
}
