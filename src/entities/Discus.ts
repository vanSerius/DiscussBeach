import Phaser from 'phaser';
import { COLORS } from '../utils/Colors';

export type DiscusOwner = 'none' | 'left' | 'right';

export class Discus {
  public sprite: Phaser.GameObjects.Image;
  public vx = 0;
  public vy = 0;
  public spin = 0;
  public owner: DiscusOwner = 'none';
  public attached = false;
  public slowFactor = 1;
  public slowUntil = 0;
  public magnetSide: 'left' | 'right' | null = null;

  private trail: Phaser.GameObjects.Image[] = [];
  private trailIndex = 0;
  private trailMax = 16;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    for (let i = 0; i < this.trailMax; i++) {
      const t = scene.add.image(x, y, 'discus').setAlpha(0).setDepth(2);
      this.trail.push(t);
    }
    this.sprite = scene.add.image(x, y, 'discus').setDepth(3);
    this.sprite.postFX.addGlow(COLORS.cyan, 1.5, 0, false, 0.2, 12);
  }

  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  attachTo(x: number, y: number, side: 'left' | 'right'): void {
    this.attached = true;
    this.owner = side;
    this.vx = 0;
    this.vy = 0;
    this.spin = 0;
    this.sprite.setPosition(x, y);
  }

  release(vx: number, vy: number, spin: number): void {
    this.attached = false;
    this.vx = vx;
    this.vy = vy;
    this.spin = spin;
    this.owner = 'none';
  }

  resetTo(x: number, y: number, towards: 'left' | 'right' = 'left'): void {
    this.attached = false;
    this.owner = 'none';
    this.vx = (towards === 'left' ? -1 : 1) * 280;
    this.vy = Phaser.Math.Between(-120, 120);
    this.spin = 0;
    this.sprite.setPosition(x, y);
    for (const t of this.trail) t.setAlpha(0);
  }

  applySlow(durationMs: number, now: number, factor = 0.4): void {
    this.slowUntil = now + durationMs;
    this.slowFactor = factor;
  }

  update(dt: number, fieldW: number, fieldH: number, now: number): void {
    if (this.attached) return;

    const slow = now < this.slowUntil ? this.slowFactor : 1;

    this.vy += this.spin * 220 * dt;

    if (this.magnetSide) {
      const target = this.magnetSide === 'left' ? 60 : fieldW - 60;
      const dx = target - this.sprite.x;
      this.vx += Math.sign(dx) * 60 * dt;
    }

    this.sprite.x += this.vx * dt * slow;
    this.sprite.y += this.vy * dt * slow;

    const r = 18;
    if (this.sprite.y < 80 + r) {
      this.sprite.y = 80 + r;
      this.vy = Math.abs(this.vy);
      this.spin = -this.spin * 0.6;
    } else if (this.sprite.y > fieldH - 50 - r) {
      this.sprite.y = fieldH - 50 - r;
      this.vy = -Math.abs(this.vy);
      this.spin = -this.spin * 0.6;
    }

    this.sprite.rotation += (this.vx * 0.0015 + this.spin * 0.6);

    const tIdx = this.trailIndex;
    const ti = this.trail[tIdx];
    ti.setPosition(this.sprite.x, this.sprite.y);
    ti.setAlpha(0.55);
    ti.setScale(0.9);
    this.trailIndex = (this.trailIndex + 1) % this.trailMax;
    for (const t of this.trail) {
      if (t !== ti && t.alpha > 0) t.setAlpha(t.alpha - dt * 2.5);
    }
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }
  set x(v: number) {
    this.sprite.x = v;
  }
  set y(v: number) {
    this.sprite.y = v;
  }

  destroy(): void {
    for (const t of this.trail) t.destroy();
    this.sprite.destroy();
  }
}
