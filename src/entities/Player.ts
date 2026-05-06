import Phaser from 'phaser';
import { COLORS } from '../utils/Colors';

export type Side = 'left' | 'right';

export class Player {
  public readonly side: Side;
  public readonly sprite: Phaser.GameObjects.Container;
  public readonly outline: Phaser.GameObjects.Graphics;
  public x: number;
  public y: number;
  public width = 30;
  public height = 110;
  public moveSpeed = 380;
  public sprintSpeed = 580;
  public stamina = 1;
  public readonly maxStamina = 1;
  public charging = false;
  public chargeTime = 0;
  public hasDiscus = false;
  public scaleMul = 1;
  public color: number;

  private homeX: number;
  private readonly maxForwardOffset = 80;
  private mirroredUntil = 0;

  constructor(scene: Phaser.Scene, side: Side, homeX: number, y: number) {
    this.side = side;
    this.homeX = homeX;
    this.x = homeX;
    this.y = y;
    this.color = side === 'left' ? COLORS.magenta : COLORS.cyan;

    this.outline = scene.add.graphics();
    this.sprite = scene.add.container(this.x, this.y, [this.outline]);
    this.redraw();
  }

  redraw(): void {
    const w = this.width * this.scaleMul;
    const h = this.height * this.scaleMul;
    this.outline.clear();
    this.outline.lineStyle(3, this.color, 1);
    this.outline.fillStyle(COLORS.night, 0.55);
    this.outline.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.outline.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

    this.outline.fillStyle(this.color, 0.9);
    this.outline.fillCircle(0, -h / 2 + 16, 12 * this.scaleMul);

    this.outline.lineStyle(2, this.color, 0.8);
    this.outline.lineBetween(0, -h / 2 + 28, this.side === 'left' ? 18 : -18, -h / 2 + 50);
  }

  setMirrored(durationMs: number, now: number): void {
    this.mirroredUntil = now + durationMs;
  }

  isMirrored(now: number): boolean {
    return now < this.mirroredUntil;
  }

  setScaleMul(s: number): void {
    if (this.scaleMul !== s) {
      this.scaleMul = s;
      this.redraw();
    }
  }

  applyMovement(dt: number, vx: number, vy: number, sprint: boolean, fieldH: number): void {
    const speed = sprint && this.stamina > 0 ? this.sprintSpeed : this.moveSpeed;
    if (sprint && this.stamina > 0 && (vx !== 0 || vy !== 0)) {
      this.stamina = Math.max(0, this.stamina - dt * 0.5);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 0.25);
    }
    this.y += vy * speed * dt;
    this.x += vx * speed * dt;

    const halfH = (this.height * this.scaleMul) / 2;
    this.y = Phaser.Math.Clamp(this.y, 80 + halfH, fieldH - 50 - halfH);

    if (this.side === 'left') {
      this.x = Phaser.Math.Clamp(this.x, this.homeX, this.homeX + this.maxForwardOffset);
    } else {
      this.x = Phaser.Math.Clamp(this.x, this.homeX - this.maxForwardOffset, this.homeX);
    }

    this.sprite.setPosition(this.x, this.y);
  }

  startCharge(): void {
    if (!this.hasDiscus) return;
    this.charging = true;
    this.chargeTime = 0;
  }

  tickCharge(dt: number): void {
    if (this.charging) this.chargeTime = Math.min(1.4, this.chargeTime + dt);
  }

  releaseCharge(): { power: number } {
    const power = Phaser.Math.Clamp(this.chargeTime / 1.0, 0.25, 1.4);
    this.charging = false;
    this.chargeTime = 0;
    return { power };
  }

  getCatchBounds(): Phaser.Geom.Rectangle {
    const w = this.width * this.scaleMul + 24;
    const h = this.height * this.scaleMul + 18;
    return new Phaser.Geom.Rectangle(this.x - w / 2, this.y - h / 2, w, h);
  }
}
