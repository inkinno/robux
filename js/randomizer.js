// 팔레트 프리셋, 재질 기본값, 전체 랜덤 조합 (UI 수준 랜덤은 Math.random 사용)
function applyPalettePreset(key) {
  const cols = PALETTES[key];
  if (!cols) return;
  cols.forEach((hex, idx) => { $('col' + idx).value = hex; });
  $('palette-name').textContent = key.toUpperCase();
}

// 재질에 맞는 기본 이어짐 정도 적용 (유화/수채화는 높게)
function applyMaterialDefaults() {
  const v = MATERIAL_CONNECT[$('material-algo').value];
  if (v !== undefined) $('connect-slider').value = v;
  updateSliderLabels();
}

function pickRandomSelect(id) {
  const sel = $(id);
  sel.selectedIndex = Math.floor(Math.random() * sel.options.length);
}

function randomizeAll() {
  ['material-algo', 'substrate-algo', 'core-algo', 'composite-algo', 'pattern-algo'].forEach(pickRandomSelect);
  applyMaterialDefaults();

  const r = Math.random();
  $('region-algo').value = r < 0.4 ? 'mondrian' : r < 0.8 ? 'random' : 'none';
  $('split-slider').value = 4 + Math.floor(Math.random() * 11);
  $('brush-slider').value = 70 + Math.floor(Math.random() * 80);

  const ext = $('extreme-algo');
  ext.selectedIndex = Math.random() < 0.65 ? 0 : Math.floor(Math.random() * ext.options.length);

  if (Math.random() < 0.65) {
    pickRandomSelect('palette-preset');
    applyPalettePreset($('palette-preset').value);
  } else {
    const baseHue = Math.floor(Math.random() * 360);
    $('col0').value = '#08090f';
    for (let i = 1; i <= 4; i++) {
      $('col' + i).value = hslToHex((baseHue + i * 45) % 360, 80, 45 + i * 10);
    }
    $('palette-name').textContent = 'Procedural Harmonic';
  }
  updateSliderLabels();
  initArtwork();
}
