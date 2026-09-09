// Canvas choreography for the existing pixel art: parallax, camera drift,
// character entrances, speaking movement, and answer reactions.
const assetPaths = {
  office: './assets/office.png',
  people: './assets/npcs.png',
  player: './assets/player.png'
};
let assetPromise;
export function loadSceneAssets() {
  return assetPromise ??= Promise.all(Object.entries(assetPaths).map(([key, path]) =>
    new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve([key, image]);
      image.onerror = () => resolve([key, null]);
      image.src = new URL(path, import.meta.url).href;
    })
  )).then(entries => Object.fromEntries(entries));
}
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - Math.pow(1 - clamp(value), 3);
export function faceFrame(elapsed, mood) {
  if (mood === 'talk') return elapsed % 2400 > 2070 ? 3 : [0, 2, 2, 0][Math.floor(elapsed / 140) % 4];
  if (mood === 'happy') return elapsed < 1400 ? [3, 3, 0, 3][Math.floor(elapsed / 320) % 4] : 0;
  if (mood === 'wrong') return elapsed < 750 ? 1 : 0;
  return elapsed % 3700 > 3480 && elapsed % 3700 < 3630 ? 1 : 0;
}
export class MotionScene {
  constructor(canvas, {mode = 'encounter', chapter = 0, entering = false, duration = 2800} = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', {alpha: false});
    this.mode = mode;
    this.chapter = chapter;
    this.entering = entering;
    this.duration = duration;
    this.started = performance.now();
    this.moodStarted = this.started;
    this.mood = mode === 'ending' ? 'happy' : 'idle';
    this.pointer = {x: 0, y: 0};
    this.camera = {x: 0, y: 0};
    this.assets = {};
    this.disposed = false;
    this.lastPaint = -100;
    this.dirty = true;
    this.media = matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this.media.matches;
    this.abort = new AbortController();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.parentElement.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const bounds = canvas.getBoundingClientRect();
      this.pointer.x = (e.clientX - bounds.left) / bounds.width - 0.5;
      this.pointer.y = (e.clientY - bounds.top) / bounds.height - 0.5;
    }, {signal: this.abort.signal});
    canvas.parentElement.addEventListener('pointerleave', () => { this.pointer = {x: 0, y: 0}; }, {signal: this.abort.signal});
    this.media.addEventListener('change', e => { this.reduced = e.matches; this.dirty = true; }, {signal: this.abort.signal});
    loadSceneAssets().then(assets => { if (!this.disposed) { this.assets = assets; this.dirty = true; } });
    this.resize();
    const loop = now => {
      if (this.disposed) return;
      if (!document.hidden && now - this.lastPaint >= 32 && (!this.reduced || this.dirty)) {
        this.paint(now);
        this.lastPaint = now;
        this.dirty = false;
      }
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, bounds.width);
    this.height = Math.max(1, bounds.height);
    this.scale = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * this.scale);
    this.canvas.height = Math.round(this.height * this.scale);
    this.dirty = true;
  }
  react(mood) {
    this.mood = mood;
    this.moodStarted = performance.now();
    this.dirty = true;
    this.canvas.parentElement.dataset.mood = mood;
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.abort.abort();
  }
  drawFrame(image, columns, rows, column, row, x, y, height, opacity = 1) {
    if (!image) return;
    const cellWidth = image.naturalWidth / columns, cellHeight = image.naturalHeight / rows;
    const width = height * cellWidth / cellHeight;
    this.context.globalAlpha = opacity;
    this.context.drawImage(image, cellWidth * column, cellHeight * row, cellWidth, cellHeight, x - width / 2, y, width, height);
    this.context.globalAlpha = 1;
  }
  background(now, progress) {
    const ctx = this.context, w = this.width, h = this.height;
    const image = this.assets.office;
    ctx.fillStyle = '#30443f';
    ctx.fillRect(0, 0, w, h);
    if (!image) return;
    const columns = 1, rows = 1;
    const cellWidth = image.naturalWidth / columns, cellHeight = image.naturalHeight / rows;
    const scale = Math.max(w / cellWidth, h / cellHeight) * 1.12;
    const dw = cellWidth * scale, dh = cellHeight * scale;
    const sway = this.reduced ? 0 : Math.sin(now / 7000) * w * .008;
    const walkPan = this.mode === 'travel' ? (0.5 - progress) * w * .08 : 0;
    const x = (w - dw) / 2 + sway + this.camera.x * 14 + walkPan;
    const y = (h - dh) * .57 + this.camera.y * 8;
    ctx.drawImage(image, 0, 0, cellWidth, cellHeight, x, y, dw, dh);
    if (!this.reduced) {
      const monitorGlow = .04 + (Math.sin(now / 700) + 1) * .025;
      ctx.fillStyle = `rgba(141, 214, 214, ${monitorGlow})`;
      ctx.fillRect(w * .425, h * .38, w * .105, h * .15);
    }
    if (this.chapter === 3 || this.mode === 'ending') {
      ctx.fillStyle = '#ff94341a';
      ctx.fillRect(0, 0, w, h);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, '#0b202655'); shade.addColorStop(.52, '#0b202600'); shade.addColorStop(1, '#0b202666');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
    if (!this.reduced) {
      for (let i = 0; i < 11; i++) {
        const x = ((i * .127 + now / (130000 + i * 670)) % 1) * w;
        const y = ((i * .183 - now / (210000 + i * 1300)) % 1 + 1) % 1 * h;
        ctx.globalAlpha = .15 + (Math.sin(now / 1800 + i) + 1) * .12;
        ctx.fillStyle = '#ffe6a0'; ctx.fillRect(x, y, i % 3 === 0 ? 3 : 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }
  paint(now) {
    const ctx = this.context, w = this.width, h = this.height;
    const elapsed = this.reduced ? 10000 : now - this.started;
    const moodElapsed = this.reduced ? 2000 : now - this.moodStarted;
    const progress = clamp(elapsed / this.duration);
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.camera.x += (this.pointer.x - this.camera.x) * .04;
    this.camera.y += (this.pointer.y - this.camera.y) * .04;
    if (this.reduced) this.camera = {x: 0, y: 0};
    ctx.save();
    if (this.mood === 'wrong' && moodElapsed < 450) ctx.translate(Math.sin(moodElapsed / 27) * 3 * (1 - moodElapsed / 450), 0);
    this.background(this.reduced ? 0 : now, progress);
    if (this.mode === 'travel') {
      const x = w * (-.13 + progress * 1.03);
      const step = this.reduced ? 0 : Math.sin(elapsed / 110);
      const bob = this.reduced ? 0 : Math.abs(step) * 7;
      const stride = this.reduced ? 0 : step * 4;
      this.drawFrame(this.assets.player, 1, 1, 0, 0, x + stride, h * -.11 + bob, h * .93);
    } else {
      let npcX = w * (w < 550 ? .76 : .72) + this.camera.x * 8;
      if (this.entering) npcX += (1 - ease(elapsed / 750)) * w * .45;
      let npcHeight = this.mode === 'start' ? h * .64 : h * 1.03;
      let npcY = this.mode === 'start' ? h * .45 : h * .05;
      if (!this.reduced) npcY += Math.sin(now / 850) * 2;
      if (this.mood === 'talk' && !this.reduced) {
        npcY += Math.sin(now / 95) * 1.7;
        npcHeight += Math.sin(now / 155) * 2.4;
      }
      if (this.mood === 'happy' && moodElapsed < 620) npcY -= Math.sin(clamp(moodElapsed / 620) * Math.PI) * 15;
      if (this.mood === 'wrong' && moodElapsed < 550) npcX += Math.sin(moodElapsed / 33) * 7;
      this.drawFrame(this.assets.people, 4, 1, this.chapter, 0, npcX, npcY, npcHeight, this.mode === 'start' ? .65 : 1);
      if (this.mode === 'ending') {
        const p = this.reduced ? .65 : (elapsed % 9000) / 9000;
        const step = this.reduced ? 0 : Math.sin(elapsed / 110);
        this.drawFrame(this.assets.player, 1, 1, 0, 0, w * (.1 + p * .85) + step * 4, h * .1 + Math.abs(step) * 5, h * .86);
      } else {
        const breathing = this.reduced ? 0 : Math.sin(now / 1000 + 1) * 2;
        const playerX = this.mode === 'start' ? w * .20 : w * (w < 650 ? .31 : .35);
        const playerY = this.mode === 'start' ? h * -.08 : h * -.055;
        this.drawFrame(this.assets.player, 1, 1, 0, 0, playerX - this.camera.x * 7, playerY + breathing, h * 1.04, this.mode === 'start' ? .75 : 1);
      }
      if (this.mood === 'happy' && moodElapsed < 1400 && !this.reduced) {
        const p = moodElapsed / 1400;
        for (let i = 0; i < 14; i++) {
          const angle = i / 14 * Math.PI * 2;
          ctx.fillStyle = i % 2 ? '#ffd276' : '#9ae9c1';
          ctx.globalAlpha = 1 - p;
          ctx.fillRect(npcX + Math.cos(angle) * p * 95, h * .45 + Math.sin(angle) * p * 75 - p * 45, 4, 4);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
}
