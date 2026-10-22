// 해상도, SVG 필터 클래스, 바탕지 질감
const RESOLUTIONS = {
  '4k': { w: 3840, h: 2160, label: '4K UHD (3840×2160)' },
  wqhd: { w: 2560, h: 1440, label: 'WQHD (2560×1440)' },
  fhd: { w: 1920, h: 1080, label: 'FHD (1920×1080)' }
};

function setupResolution() {
  const res = RESOLUTIONS[document.getElementById('resolution-select').value] || RESOLUTIONS.fhd;
  state.width = res.w;
  state.height = res.h;
  document.getElementById('res-badge').textContent = res.label;
  canvas.width = state.width;
  canvas.height = state.height;
  state.uScale = state.width / 1920;
}

function applySvgHardwareFilter() {
  canvas.className = '';
  if (state.substrate !== 'svgShader') return;
  if (state.material === 'impasto' || state.material === 'metallic') {
    canvas.classList.add('svg-impasto');
  } else if (state.material === 'watercolor') {
    canvas.classList.add('svg-watercolor');
  } else if (state.material === 'neon' || state.material === 'iridescent') {
    canvas.classList.add('svg-neon');
  }
}

// 리넨 직조 / 코튼 수채화지 프로시저럴 질감
function renderSubstrateTexture() {
  if (state.substrate === 'smooth' || state.substrate === 'svgShader') return;
  ctx.save();
  const step = Math.round(4 * state.uScale);
  if (state.substrate === 'canvasGrain') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.022)';
    ctx.lineWidth = state.uScale;
    ctx.beginPath();
    for (let x = 0; x < state.width; x += step * 2) { ctx.moveTo(x, 0); ctx.lineTo(x, state.height); }
    for (let y = 0; y < state.height; y += step * 2) { ctx.moveTo(0, y); ctx.lineTo(state.width, y); }
    ctx.stroke();
  } else if (state.substrate === 'paperGrain') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let i = 0; i < 4500; i++) {
      const pr = (1 + Math.random() * 3) * state.uScale;
      ctx.fillRect(Math.random() * state.width, Math.random() * state.height, pr, pr);
    }
  }
  ctx.restore();
}
