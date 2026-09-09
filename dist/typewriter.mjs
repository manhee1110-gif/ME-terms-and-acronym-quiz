// A cancellable text reveal. It never owns quiz progress.
export class Typewriter {
  constructor({requestFrame, cancelFrame, now, onTick = () => {}} = {}) {
    this.requestFrame = requestFrame ?? (fn => requestAnimationFrame(fn));
    this.cancelFrame = cancelFrame ?? (id => cancelAnimationFrame(id));
    this.now = now ?? (() => performance.now());
    this.onTick = onTick;
    this.active = false;
    this.generation = 0;
    this.frame = null;
  }
  start(text, {onUpdate, onDone, instant = false, speed = 23} = {}) {
    this.cancel();
    this.characters = Array.from(text);
    this.onUpdate = onUpdate ?? (() => {});
    this.onDone = onDone ?? (() => {});
    this.position = 0;
    this.active = true;
    this.speed = speed;
    this.started = this.now();
    this.onUpdate('');
    if (instant || !this.characters.length) return this.finish();
    const generation = this.generation;
    const tick = () => {
      if (!this.active || generation !== this.generation) return;
      const position = Math.min(this.characters.length, Math.floor((this.now() - this.started) / this.speed));
      if (position !== this.position) {
        this.position = position;
        this.onUpdate(this.characters.slice(0, position).join(''));
        this.onTick(position);
      }
      if (position === this.characters.length) this.finish();
      else this.frame = this.requestFrame(tick);
    };
    this.frame = this.requestFrame(tick);
  }
  finish() {
    if (!this.active) return false;
    this.active = false;
    if (this.frame !== null) this.cancelFrame(this.frame);
    this.frame = null;
    this.onUpdate(this.characters.join(''));
    const done = this.onDone;
    this.onDone = null;
    done?.();
    return true;
  }
  cancel() {
    this.generation++;
    this.active = false;
    if (this.frame !== null) this.cancelFrame(this.frame);
    this.frame = null;
    this.onDone = null;
  }
}
