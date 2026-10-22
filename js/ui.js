// UI 동기화 및 이벤트 바인딩
const $ = id => document.getElementById(id);

function syncSettingsFromUI() {
  state.material = $('material-algo').value;
  state.substrate = $('substrate-algo').value;
  state.core = $('core-algo').value;
  state.composite = $('composite-algo').value;
  state.pattern = $('pattern-algo').value;
  state.extreme = $('extreme-algo').value;
  state.speed = parseInt($('speed-slider').value, 10);
  for (let i = 0; i < 5; i++) state.palette[i] = $('col' + i).value;
  applySvgHardwareFilter();
  updateHUD();
}

function updateHUD() {
  const matText = $('material-algo').selectedOptions[0].text.split('(')[0];
  const coreText = $('core-algo').selectedOptions[0].text.split(':')[0];
  const patText = $('pattern-algo').selectedOptions[0].text.split('(')[0];
  $('current-schema-hud').textContent =
    `${matText} | ${coreText} + ${patText} (${state.width}×${state.height})`;
}

function toggleUI() {
  $('ui-panel').classList.toggle('hidden');
}

function bindEvents() {
  $('palette-preset').addEventListener('change', e => {
    applyPalettePreset(e.target.value);
    initArtwork();
  });

  ['material-algo', 'substrate-algo', 'core-algo', 'composite-algo',
   'pattern-algo', 'extreme-algo', 'resolution-select']
    .forEach(id => $(id).addEventListener('change', () => initArtwork()));

  ['col0', 'col1', 'col2', 'col3', 'col4']
    .forEach(id => $(id).addEventListener('input', () => syncSettingsFromUI()));

  $('speed-slider').addEventListener('input', e => {
    state.speed = parseInt(e.target.value, 10);
    const ratio = (state.speed / 8).toFixed(1);
    $('speed-label').textContent = state.speed <= 8 ? `차분함 (x${ratio})` : `빠름 (x${ratio})`;
  });

  $('btn-restart').addEventListener('click', () => initArtwork());
  $('btn-random').addEventListener('click', () => randomizeAll());

  $('btn-auto').addEventListener('click', e => {
    state.autoMode = !state.autoMode;
    e.target.classList.toggle('active-auto', state.autoMode);
    e.target.textContent = state.autoMode ? '🌿 자동 감상 모드 ON' : '자동 감상 모드 OFF';
    if (state.autoMode && state.step >= state.maxSteps) randomizeAll();
  });

  $('btn-pause').addEventListener('click', e => {
    state.paused = !state.paused;
    e.target.textContent = state.paused ? '▶ 이어서 재생' : '일시정지 / 재생';
  });

  $('btn-save').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `generative_4k_${state.material}_${state.core}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  $('btn-toggle-ui').addEventListener('click', toggleUI);
  window.addEventListener('keydown', e => {
    if (e.key === 'h' || e.key === 'H') toggleUI();
  });
}
