// 전역 상태 및 팔레트 정의
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const state = {
  width: 3840,
  height: 2160,
  uScale: 2.0,
  step: 0,
  maxSteps: 860,
  speed: 8,
  paused: false,
  autoMode: true,
  waitingNext: false,
  palette: ['#090a10', '#6366f1', '#ec4899', '#14b8a6', '#f8fafc'],
  material: 'impasto',
  substrate: 'canvasGrain',
  core: 'partition',
  composite: 'none',
  pattern: 'inverseScale',
  extreme: 'standard',
  seeds: [],
  agents: [],
  lightAngle: -Math.PI * 0.25
};

const PALETTES = {
  cyber: ['#070810', '#6366f1', '#ec4899', '#06b6d4', '#f8fafc'],
  coral: ['#11161b', '#f43f5e', '#fb923c', '#fde047', '#cbd5e1'],
  ink: ['#0d0d0f', '#27272a', '#d4af37', '#a1a1aa', '#f4f4f5'],
  forest: ['#041014', '#10b981', '#3b82f6', '#a855f7', '#ecfdf5'],
  gallery: ['#161311', '#c2410c', '#eab308', '#0f766e', '#fef3c7'],
  monolith: ['#050505', '#262626', '#525252', '#a3a3a3', '#ffffff']
};
