// 전역 상태 및 상수 정의
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;

const canvas = $('artCanvas');
const viewCtx = canvas.getContext('2d', { alpha: false });

// 백버퍼 캔버스 (면 채움 레이어)
const fillCanvas = document.createElement('canvas');
const fillCtx = fillCanvas.getContext('2d', { alpha: false });

// 선(라인/테이프) 레이어 캔버스
const lineCanvas = document.createElement('canvas');
const lineCtx = lineCanvas.getContext('2d');

const state = {
  width: 3840,
  height: 2160,
  uScale: 2.0,

  // 모드: 'line' (선 긋기 모드), 'fill' (채우기 모드)
  mode: 'line',
  
  // 도화지 및 선 설정
  canvasBg: '#f8fafc',     // 기본 캔버스 도화지 색상 (밝은 미색)
  lineTool: 'random',      // 'random', 'manualStraight', 'manualFree'
  lineWidth: 18,           // 선 두께 (px)
  lineColor: '#1e293b',    // 선(테이프) 색상 (진한 잉크/마스킹 테이프)
  lines: [],               // 저장된 선 데이터 목록 [{type:'segment', x1, y1, x2, y2}, {type:'curve', pts:[]}]
  activeDrawingLine: null, // 수동 드로잉 중인 임시 선

  // 채움 설정
  fillType: 'gradient',    // 'solid', 'gradient', 'continuous', 'pointillism', 'watercolor', 'oil'
  brushContinuity: 0.85,   // 이어짐 정도 (0.0: 점묘 도트 분리, 1.0: 완전 이어지는 유화/수채화 스트로크)
  fillDensity: 1.0,        // 0.5 ~ 1.0
  pointDensity: 24,        // 점묘화 점 개수 배율
  gradientDirection: 'auto', // 'auto', 'horizontal', 'vertical', 'diagonal'

  // 색상 팔레트
  palette: ['#090a10', '#6366f1', '#ec4899', '#14b8a6', '#f8fafc'],
  palettePreset: 'gallery',

  // 면(Region) 데이터
  regions: [],             // 감지된 닫힌 면 폴리곤 목록
  currentRegionIndex: 0,
  isAutoFilling: false,
  autoFillTimer: null,
  autoFillSpeed: 5,        // 면 채우기 진행 속도

  // 뷰 및 UI
  paused: false
};

const PALETTES = {
  cyber: ['#070810', '#6366f1', '#ec4899', '#06b6d4', '#f8fafc'],
  coral: ['#11161b', '#f43f5e', '#fb923c', '#fde047', '#cbd5e1'],
  ink: ['#0d0d0f', '#27272a', '#d4af37', '#a1a1aa', '#f4f4f5'],
  forest: ['#041014', '#10b981', '#3b82f6', '#a855f7', '#ecfdf5'],
  gallery: ['#161311', '#c2410c', '#eab308', '#0f766e', '#fef3c7'],
  monolith: ['#050505', '#262626', '#525252', '#a3a3a3', '#ffffff']
};
