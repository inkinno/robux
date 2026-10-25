// 면 채움 패턴: 위치에 따른 붓 굵기 배율과 이어짐 편향 (현재 면 bounds 기준)
function patternFactor(x, y) {
  const b = state.bounds;
  const u = state.uScale;
  const cx = b.x + b.w * 0.5;
  const cy = b.y + b.h * 0.5;
  const dist = Math.hypot(x - cx, y - cy);
  const norm = dist / Math.hypot(b.w * 0.5, b.h * 0.5);
  switch (state.pattern) {
    case 'inverseScale': return 0.2 + Math.pow(norm, 2.2) * 2.6;
    case 'fractal': return 0.4 + Math.abs(Math.sin((dist * 0.02) / u)) * 2.0;
    case 'pulse': return 0.5 + 1.6 * Math.pow(Math.sin((dist * 0.008) / u - state.step * 0.02), 2);
    case 'gravity': return 0.3 + ((y - b.y) / b.h) * 2.5;
    case 'morph': return 0.5 + ((x - b.x) / b.w) * 1.2;
    case 'moire': return 0.35 + 1.2 * Math.abs(Math.sin((x * 0.03) / u + Math.sin((y * 0.02) / u) * 3));
    case 'magnetic': return 0.6 + 0.8 * Math.abs(Math.sin(Math.atan2(y - cy, x - cx) * 6));
    default: return 1;
  }
}

// 위치별 이어짐 정도: 모핑 패턴은 왼쪽(연결) -> 오른쪽(점)으로 전이
function connectAt(x) {
  if (state.pattern !== 'morph') return state.connect;
  const b = state.bounds;
  const t = clamp((x - b.x) / b.w, 0, 1);
  return clamp(state.connect * (1 - 0.9 * t), 0, 1);
}
