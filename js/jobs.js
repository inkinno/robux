// 작업(Job) 구성: 면 분할 -> 면 단위 job 큐 -> 붓 에이전트 생성
function makeFillJob(poly, bounds, color) {
  const u = state.uScale;
  const minDim = Math.min(bounds.w, bounds.h);
  const serp = state.core === 'serpentine';
  const single = state.extreme === 'singleStroke';
  const job = { type: 'fill', poly, bounds, color, clipped: false };
  if (serp) {
    // 페인트통: 붓 한 개가 면 전체를 지그재그로 채움
    job.size = (clamp(minDim / 8, 8 * u, 100 * u) * state.brushScale) / 2;
    job.life = 0;
    job.agents = 1;
  } else {
    job.size = clamp(minDim / 18, 2.5 * u, 12 * u) * state.brushScale;
    job.life = single ? 900 : 110;
    const area = poly ? polyArea(poly) : bounds.w * bounds.h;
    job.agents = single ? 1
      : clamp(Math.round((0.9 * area) / (job.life * job.size * 0.7 * job.size * 2)), 3, 60);
  }
  return job;
}

function buildJobs() {
  const W = state.width;
  const H = state.height;
  if (state.region === 'none') {
    return [makeFillJob(null, { x: 0, y: 0, w: W, h: H }, null)];
  }
  const { polys, lines } = splitRegions(state.splitCount, state.region === 'mondrian' ? 'axis' : 'free');
  shuffleInPlace(polys);
  const jobs = polys.map(poly => {
    const color = rand() < 0.15 ? state.palette[4] : state.palette[1 + Math.floor(rand() * 4)];
    return makeFillJob(poly, polyBounds(poly), color);
  });
  jobs.push({
    type: 'dividers',
    lines,
    color: state.palette[0],
    width: (state.region === 'mondrian' ? 7 : 3) * state.uScale
  });
  return jobs;
}

function randomPointIn(job) {
  const b = job.bounds;
  for (let i = 0; i < 40; i++) {
    const x = b.x + rand() * b.w;
    const y = b.y + rand() * b.h;
    if (!job.poly || pointInConvex(job.poly, x, y)) return { x, y };
  }
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

function spawnAgent(job, i) {
  const u = state.uScale;
  const serp = state.core === 'serpentine';
  const color = job.color ? shiftHex(job.color, (rand() - 0.5) * 40) : state.palette[1 + (i % 4)];
  const ag = {
    index: i, color, serp,
    angle: rand() * TAU,
    size: job.size * (serp ? 1 : 0.6 + rand() * 0.8),
    age: 0, life: job.life, dist: 0, acc: 0,
    pen: rand() < state.connect,
    done: false, teleport: false,
    bristles: Array.from({ length: 5 }, () => ({ o: rand() - 0.5, l: (rand() - 0.4) * 70 }))
  };
  ag.v = Math.max(1.5 * u, ag.size * 0.7);
  if (serp) {
    ag.bw = job.size * 2;
    ag.spacing = ag.bw * 0.7;
    ag.dir = 1;
    ag.phase = 'row';
    ag.y = job.bounds.y + ag.bw * 0.35;
    setSerpRow(ag);
  } else {
    const p = randomPointIn(job);
    ag.x = p.x;
    ag.y = p.y;
  }
  return ag;
}

function startJob(job) {
  state.job = job;
  state.agentIdx = 0;
  state.agent = null;
  if (job.type === 'dividers') {
    drawDividers(job.lines, job.color, job.width);
    state.job = null;
    state.jobIdx++;
    return;
  }
  state.bounds = job.bounds;
  ctx.save();
  if (job.poly) {
    ctx.beginPath();
    job.poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();
  }
}

function endJob() {
  endRun();
  wetCommit();
  ctx.restore();
  state.job = null;
  state.agent = null;
  state.jobIdx++;
}

// 0~1 진행률
function simulationProgress() {
  if (state.done) return 1;
  const n = state.jobs.length;
  if (!state.job) return clamp(state.jobIdx / n, 0, 1);
  const j = state.job;
  const ag = state.agent;
  let ap = 0;
  if (ag) ap = ag.serp ? clamp((ag.y - j.bounds.y) / j.bounds.h, 0, 1) : clamp(ag.age / ag.life, 0, 1);
  return clamp((state.jobIdx + (state.agentIdx - 1 + ap) / j.agents) / n, 0, 1);
}
