// 면 채움 패턴: 스케일 변주 및 단위 형태 경로
function computePatternScale(x, y, baseSize) {
  const cx = state.width * 0.5;
  const cy = state.height * 0.5;
  const dist = Math.hypot(x - cx, y - cy);
  const normDist = dist / Math.hypot(cx, cy);
  switch (state.pattern) {
    case 'inverseScale': return baseSize * (0.15 + Math.pow(normDist, 2.2) * 3.8);
    case 'fractal': return baseSize * (0.4 + Math.abs(Math.sin(dist * 0.02)) * 2.0);
    case 'pulse': return baseSize * (0.5 + 1.6 * Math.pow(Math.sin(dist * 0.008 - state.step * 0.05), 2));
    case 'gravity': return baseSize * (0.3 + (y / state.height) * 2.5);
    default: return baseSize;
  }
}

function isLinePattern() {
  return state.pattern === 'moire' || state.pattern === 'magnetic';
}

function traceUnitShapePath(c, normX, radius) {
  c.beginPath();
  if (state.pattern === 'morph') {
    if (normX < 0.35) {
      c.moveTo(0, -radius);
      c.lineTo(radius, radius);
      c.lineTo(-radius, radius);
      c.closePath();
    } else if (normX < 0.7) {
      c.arc(0, 0, radius, 0, Math.PI * 2);
    } else {
      c.moveTo(-radius * 1.8, -radius * 0.25);
      c.lineTo(radius * 1.8, 0);
      c.lineTo(0, radius * 0.45);
      c.closePath();
    }
  } else if (state.pattern === 'moire') {
    c.arc(0, 0, radius * 2.1, 0, Math.PI * 2);
    c.moveTo(-radius * 2.8, 0);
    c.lineTo(radius * 2.8, 0);
  } else if (state.pattern === 'magnetic') {
    c.moveTo(-radius * 2.4, 0);
    c.quadraticCurveTo(0, radius * 1.5, radius * 2.4, 0);
  } else {
    c.arc(0, 0, Math.max(0.6, radius), 0, Math.PI * 2);
  }
}

// 채움 또는 선 그리기 (패턴 종류에 따라)
function paintShape(normX, radius) {
  traceUnitShapePath(ctx, normX, radius);
  isLinePattern() ? ctx.stroke() : ctx.fill();
}
