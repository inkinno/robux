// 시뮬레이션: 작품 초기화와 스텝 진행 (붓은 한 번에 하나씩)
function initArtwork(opts = {}) {
  const seed = opts.seed !== undefined ? opts.seed : newSeed();
  const push = opts.push !== undefined ? opts.push : true;

  stopRecording(0);
  setupResolution();
  syncSettingsFromUI();
  recordHistory(push, seed);

  state.seed = seed;
  setSeed(seed);

  if (state.core === 'subtractive') {
    ctx.fillStyle = state.palette[1];
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = 'rgba(5, 6, 10, 0.92)';
  } else {
    ctx.fillStyle = state.palette[0];
  }
  ctx.fillRect(0, 0, state.width, state.height);
  renderSubstrateTexture();

  state.step = 0;
  state.stepAcc = 0;
  state.done = false;
  state.finishHandled = false;
  state.waitingNext = false;
  state.started = false;
  state.lightAngle = -Math.PI * 0.3;
  state.bounds = { x: 0, y: 0, w: state.width, h: state.height };
  state.jobs = buildJobs();
  state.jobIdx = 0;
  state.job = null;
  state.agent = null;
  state.agentIdx = 0;
  state.run = null;
  wetReset();

  // 패널 숨기고 2초 뒤 시작 옵션
  if ($('chk-hide').checked) {
    $('ui-panel').classList.add('hidden');
    state.startAt = performance.now() + 2000;
  } else {
    state.startAt = 0;
  }
}

// 붓 펜 상태: 이어짐이 높으면 거의 안 떨어지고, 낮으면 점으로 흩어진다
function updatePen(ag, c) {
  if (ag.pen) {
    if (rand() < Math.pow(1 - c, 1.5) * 0.3) ag.pen = false;
  } else if (c > 0.04 && rand() < 0.08 + 0.5 * c) {
    ag.pen = true;
  }
}

function drawErosion(ag, r) {
  ctx.save();
  ctx.fillStyle = state.palette[0];
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(
    ag.x + (rand() - 0.5) * 30 * state.uScale,
    ag.y + (rand() - 0.5) * 30 * state.uScale,
    r * 1.3, 0, TAU
  );
  ctx.fill();
  ctx.restore();
}

function stepAgent(ag) {
  const u = state.uScale;
  const prevX = ag.x;
  const prevY = ag.y;
  CORE_MOVERS[state.core](ag);
  ag.age++;
  if (state.pattern === 'gravity' && !ag.serp) ag.y += 1.5 * u;

  let broke = ag.teleport;
  ag.teleport = false;
  if (applyGlitch(ag)) broke = true;
  if (!ag.serp && wrapAgent(ag)) broke = true;

  const moved = Math.hypot(ag.x - prevX, ag.y - prevY);
  if (DIRECTION_DERIVED_CORES.includes(state.core) && moved > 0.01) {
    ag.angle = Math.atan2(ag.y - prevY, ag.x - prevX);
  }
  ag.dist += moved;

  const f = patternFactor(ag.x, ag.y);
  const r = ag.size * (ag.serp ? clamp(f, 0.8, 1.5) : f);
  const w = clamp(r * 2, 1.2 * u, 90 * u);

  const cx = state.width * 0.5;
  const cy = state.height * 0.5;
  if (state.extreme === 'missingCore' && Math.hypot(ag.x - cx, ag.y - cy) < state.height * 0.26) broke = true;

  const c = connectAt(ag.x);
  updatePen(ag, c);

  if (broke || !ag.pen) endRun();
  if (broke) {
    ag.acc = 0;
  } else if (ag.pen) {
    extendRun(ag, prevX, prevY, ag.x, ag.y, w);
  } else {
    ag.acc += moved;
    if (ag.acc >= w * (1.2 + 3 * (1 - c))) {
      ag.acc = 0;
      drawDotRun(ag, ag.x, ag.y, w);
    }
  }

  if (state.composite === 'erosion' && rand() < 0.28) drawErosion(ag, r);
  if ((ag.life && ag.age >= ag.life) || ag.age > 20000) ag.done = true;
}

function stepSimulation() {
  if (state.done) return;
  if (!state.job) {
    if (state.jobIdx >= state.jobs.length) { state.done = true; return; }
    startJob(state.jobs[state.jobIdx]);
    if (!state.job) return;
  }
  const job = state.job;
  if (!state.agent) {
    if (state.agentIdx >= job.agents) { endJob(); return; }
    state.agent = spawnAgent(job, state.agentIdx++);
  }
  state.step++;
  state.lightAngle += 0.002;
  stepAgent(state.agent);
  if (state.agent.done) {
    endRun();
    state.agent = null;
  }
}
