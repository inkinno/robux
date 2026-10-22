// 색상 변환 유틸리티
function hexToRgb(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbaString(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 명도 가감 (임파스토 하이라이트/쉐도우 및 금속 반사용)
function adjustColorLuminance(hex, delta) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = v => Math.min(255, Math.max(0, Math.round(v + delta)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
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
