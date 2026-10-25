// 색상 변환 유틸리티
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function hexToRgb(hex) {
  if (typeof hex !== 'string') return { r: 128, g: 128, b: 128 };
  if (hex.startsWith('rgb')) {
    const m = hex.match(/\d+/g);
    if (m && m.length >= 3) {
      return { r: parseInt(m[0], 10), g: parseInt(m[1], 10), b: parseInt(m[2], 10) };
    }
  }
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 128, g: 128, b: 128 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

function rgbaString(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 명도 가감 후 CSS rgb 문자열 반환 (스타일 전용)
function adjustColorLuminance(hex, delta) {
  const { r, g, b } = hexToRgb(hex);
  const c = v => Math.round(clamp(v + delta, 0, 255));
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`;
}

// 명도 가감 후 HEX 반환 (다시 hexToRgb에 넣을 수 있는 값)
function shiftHex(hex, delta) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + delta, g + delta, b + delta);
}

// 두 HEX 색을 t(0~1) 비율로 섞은 CSS rgb 문자열
function mixColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const m = k => Math.round(a[k] + (b[k] - a[k]) * t);
  return `rgb(${m('r')}, ${m('g')}, ${m('b')})`;
}

function rgbToHue(hex) {
  const { r, g, b } = hexToRgb(hex);
  const mx = Math.max(r, g, b);
  const d = mx - Math.min(r, g, b);
  if (!d) return 0;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function pseudoNoise(x, y, z = 0) {
  return Math.sin(x * 0.0025 + z) * Math.cos(y * 0.0025 - z) +
         Math.sin((x + y) * 0.0012 + z * 0.5) * 0.5;
}
