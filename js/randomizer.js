// 팔레트 프리셋 및 전체 랜덤 조합
function applyPalettePreset(key) {
  const cols = PALETTES[key];
  if (!cols) return;
  cols.forEach((hex, idx) => { document.getElementById('col' + idx).value = hex; });
  document.getElementById('palette-name').textContent = key.toUpperCase();
}

function pickRandomSelect(id) {
  const sel = document.getElementById(id);
  sel.selectedIndex = Math.floor(Math.random() * sel.options.length);
}

function randomizeAll() {
  ['material-algo', 'substrate-algo', 'core-algo', 'composite-algo', 'pattern-algo'].forEach(pickRandomSelect);

  const ext = document.getElementById('extreme-algo');
  ext.selectedIndex = Math.random() < 0.65 ? 0 : Math.floor(Math.random() * ext.options.length);

  if (Math.random() < 0.65) {
    pickRandomSelect('palette-preset');
    applyPalettePreset(document.getElementById('palette-preset').value);
  } else {
    const baseHue = Math.floor(Math.random() * 360);
    document.getElementById('col0').value = '#08090f';
    for (let i = 1; i <= 4; i++) {
      document.getElementById('col' + i).value = hslToHex((baseHue + i * 45) % 360, 80, 45 + i * 10);
    }
    document.getElementById('palette-name').textContent = 'Procedural Harmonic';
  }
  initArtwork();
}
