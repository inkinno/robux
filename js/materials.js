// 색채 물성(Materiality) 정의
//  - MATERIAL_MASK_LAYERS: 젖음 레이어의 합집합 마스크에서 만드는 레이어 (몸통, 외곽 링, 그림자, 블룸)
//    src: 'mask'(합집합) | 'inner'(침식된 안쪽) | 'ring'(합집합 경계) | 'detail'(획 단위 디테일 누적)
//  - MATERIAL_RUN_DETAILS: 획마다 그리는 디테일 (붓모 결, 정반사, 색상환 등)
const lum = adjustColorLuminance;

const MATERIAL_MASK_LAYERS = {
  // 1. 유화 임파스토: 합집합 그림자 → 몸통 → 광원쪽 테두리 하이라이트 → 붓모 결
  impasto(c, k) {
    const s = k * 1.8;
    return [
      { src: 'mask', color: lum(c, -65), dx: s, dy: s, alpha: 0.9 },
      { src: 'mask', color: c },
      { src: 'ring', color: lum(c, 80), dx: -k * 0.5, dy: -k * 0.5, alpha: 0.55 },
      { src: 'detail' }
    ];
  },

  // 2. 수채화: 번짐 후광 → 반투명 몸통 → 합집합 경계에만 안료 응집
  watercolor(c, k) {
    return [
      { src: 'mask', color: c, alpha: 0.08, blur: k * 6, blurColor: c },
      { src: 'mask', color: c, alpha: 0.14 },
      { src: 'ring', color: lum(c, -20), alpha: 0.55 }
    ];
  },

  // 3. 금속박: 어두운 가장자리(마스크) → 안쪽 본체(침식) → 밝은 띠/정반사
  metallic(c) {
    return [
      { src: 'mask', color: lum(c, -70) },
      { src: 'inner', color: c },
      { src: 'detail' }
    ];
  },

  // 4. 홀로그램 진주박: 옅은 바탕 → 색상환 디테일(screen) → 흰 경계
  iridescent(c) {
    return [
      { src: 'mask', color: c, alpha: 0.12 },
      { src: 'detail', op: 'screen' },
      { src: 'ring', color: '#ffffff', alpha: 0.3, op: 'screen' }
    ];
  },

  // 5. 파스텔·목탄: 옅은 몸통 (가루 입자는 stroke-run.js에서 base에 직접)
  pastel(c) {
    return [{ src: 'mask', color: c, alpha: 0.2 }];
  },

  // 6. 네온 플라즈마: 합집합 전체에 블룸 1회 → 백색 코어
  neon(c) {
    return [
      { src: 'mask', color: c, op: 'lighter', alpha: 0.85, blur: 18 * state.uScale, blurColor: c },
      { src: 'detail', op: 'lighter' }
    ];
  },

  // 7. 순수 디지털 매트
  matte(c) {
    return [{ src: 'mask', color: c }];
  }
};

const MATERIAL_RUN_DETAILS = {
  impasto(run) {
    const c = run.color;
    return run.ag.bristles.map(b => ({ o: b.o * 0.8, wm: 0.07, color: lum(c, b.l), alpha: 0.55 }));
  },

  metallic(run) {
    const light = shiftHex(run.color, 50);
    return [
      { o: -0.12, wm: 0.34, color: light },
      {
        o: -0.12, wm: 0.14,
        color: seg => mixColor(light, '#ffffff', 0.15 + 0.85 * Math.pow(Math.abs(Math.cos(seg.ang - run.light)), 10))
      }
    ];
  },

  iridescent(run) {
    const base = rgbToHue(run.color);
    const u = state.uScale;
    const hue = (seg, add) => (base + seg.d * 0.3 / u + seg.ang * 40 + add + 720) % 360;
    return [
      { color: seg => `hsl(${hue(seg, 0)}, 90%, 60%)`, alpha: 0.45 },
      { o: 0.14, wm: 0.7, color: seg => `hsl(${hue(seg, 120)}, 95%, 62%)`, alpha: 0.35 },
      { o: -0.14, wm: 0.7, color: seg => `hsl(${hue(seg, 240)}, 95%, 62%)`, alpha: 0.35 },
      { wm: 0.1, color: '#ffffff', alpha: 0.55 }
    ];
  },

  neon() {
    return [{ wm: 0.26, color: '#ffffff', alpha: 0.9 }];
  }
};

function buildMaskLayers(color, k) {
  const layers = (MATERIAL_MASK_LAYERS[state.material] || MATERIAL_MASK_LAYERS.matte)(color, k);
  if (state.composite === 'shadow') {
    const d = 18 * state.uScale;
    layers.unshift({
      src: 'mask', color: '#000000', alpha: 0.2,
      dx: Math.cos(state.lightAngle) * d, dy: Math.sin(state.lightAngle) * d
    });
  }
  return layers;
}

function buildRunDetails(run) {
  const fn = MATERIAL_RUN_DETAILS[state.material];
  return fn ? fn(run) : [];
}
