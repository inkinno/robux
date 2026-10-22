// 색채 물성(Materiality) 셰이더: 재질별 유닛 렌더러
const MATERIAL_RENDERERS = {
  // 1. 유화 임파스토
  impasto(color, radius, angle, normX) {
    const bevel = Math.max(1.2, radius * 0.28);
    ctx.fillStyle = ctx.strokeStyle = adjustColorLuminance(color, -65);
    ctx.lineWidth = 1.6 * state.uScale;
    ctx.save();
    ctx.translate(bevel, bevel);
    paintShape(normX, radius);
    ctx.restore();

    ctx.fillStyle = ctx.strokeStyle = color;
    paintShape(normX, radius);

    ctx.fillStyle = adjustColorLuminance(color, 75);
    ctx.strokeStyle = adjustColorLuminance(color, 85);
    ctx.lineWidth = Math.max(0.7, radius * 0.18);
    ctx.save();
    ctx.translate(-bevel * 0.7, -bevel * 0.7);
    traceUnitShapePath(ctx, normX, radius * 0.75);
    ctx.stroke();
    ctx.restore();
  },

  // 2. 수채화 번짐 (피그먼트 링)
  watercolor(color, radius) {
    const rMax = Math.max(2, radius * 1.65);
    const grad = ctx.createRadialGradient(0, 0, rMax * 0.1, 0, 0, rMax);
    grad.addColorStop(0, rgbaString(color, 0.08));
    grad.addColorStop(0.72, rgbaString(color, 0.22));
    grad.addColorStop(0.92, rgbaString(color, 0.58));
    grad.addColorStop(1, rgbaString(color, 0.0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rMax, 0, Math.PI * 2);
    ctx.fill();
  },

  // 3. 금속박 정반사
  metallic(color, radius, angle, normX) {
    const rMax = Math.max(1.5, radius * 1.2);
    const alignment = Math.cos(angle - state.lightAngle);
    const grad = ctx.createLinearGradient(-rMax, -rMax, rMax, rMax);
    grad.addColorStop(0, adjustColorLuminance(color, -70));
    grad.addColorStop(0.45, color);
    grad.addColorStop(0.52, '#ffffff');
    grad.addColorStop(0.65, adjustColorLuminance(color, 45));
    grad.addColorStop(1, adjustColorLuminance(color, -85));
    ctx.fillStyle = grad;
    ctx.strokeStyle = alignment > 0.6 ? '#ffffff' : grad;
    ctx.lineWidth = 1.3 * state.uScale;
    paintShape(normX, radius);
  },

  // 4. 홀로그램 진주박 / 프리즘
  iridescent(color, radius, angle, normX) {
    ctx.globalCompositeOperation = 'screen';
    const hue = (state.step * 1.5 + (angle * 180) / Math.PI) % 360;
    const iri = `hsla(${hue}, 90%, 68%, 0.48)`;
    const comp = `hsla(${(hue + 120) % 360}, 95%, 65%, 0.42)`;
    ctx.fillStyle = ctx.strokeStyle = iri;
    ctx.lineWidth = 1.2 * state.uScale;
    paintShape(normX, radius);

    ctx.translate(2.2 * state.uScale, -1.8 * state.uScale);
    ctx.fillStyle = comp;
    ctx.strokeStyle = '#ffffff';
    traceUnitShapePath(ctx, normX, radius * 0.82);
    ctx.stroke();
  },

  // 5. 파스텔·목탄 건식 입자
  pastel(color, radius) {
    ctx.fillStyle = rgbaString(color, 0.62);
    const count = Math.max(5, Math.min(28, Math.floor(radius * 1.4)));
    for (let g = 0; g < count; g++) {
      const gr = (0.6 + Math.random() * 1.6) * state.uScale;
      ctx.fillRect((Math.random() - 0.5) * radius * 2.1, (Math.random() - 0.5) * radius * 2.1, gr, gr);
    }
  },

  // 6. 네온 플라즈마 블룸
  neon(color, radius, angle, normX) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 * state.uScale;
    ctx.fillStyle = ctx.strokeStyle = color;
    ctx.lineWidth = 1.6 * state.uScale;
    paintShape(normX, radius);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.5, radius * 0.38), 0, Math.PI * 2);
    ctx.fill();
  },

  // 7. 순수 디지털 매트
  matte(color, radius, angle, normX) {
    ctx.fillStyle = ctx.strokeStyle = color;
    ctx.lineWidth = 1.1 * state.uScale;
    paintShape(normX, radius);
  }
};

function drawMaterialUnit(x, y, radius, color, angle) {
  const dist = Math.hypot(x - state.width * 0.5, y - state.height * 0.5);
  if (state.extreme === 'missingCore' && dist < state.height * 0.26) return;

  // 복합: 광원 그림자 물질화
  if (state.composite === 'shadow') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(state.lightAngle) * 18 * state.uScale,
      y + Math.sin(state.lightAngle) * 18 * state.uScale,
      radius * 1.2, 0, Math.PI * 2
    );
    ctx.fill();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const render = MATERIAL_RENDERERS[state.material] || MATERIAL_RENDERERS.matte;
  render(color, radius, angle, x / state.width);
  ctx.restore();
}
