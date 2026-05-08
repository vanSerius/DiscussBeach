import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, HEX } from '../utils/Colors';
import { drawArenaOverlay, drawSynthwaveBackground } from '../visuals/Background';
import { Player } from '../entities/Player';
import { Discus } from '../entities/Discus';
import { InputSystem } from '../systems/Input';
import { AIController } from '../systems/AI';
import { Difficulty } from './TitleScene';
import { ITEM_DEFS, ItemId, WorldItem, randomItem } from '../systems/Items';
import { TouchControls } from '../systems/TouchControls';

interface GameSceneData {
  difficulty: Difficulty;
}

const SCORE_TO_WIN = 3;
const FIELD_W = GAME_WIDTH;
const FIELD_H = GAME_HEIGHT;
const LEFT_HOME = 80;
const RIGHT_HOME = FIELD_W - 80;
const GOAL_INSET = 20;

export class GameScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private touch!: TouchControls;
  private leftPlayer!: Player;
  private rightPlayer!: Player;
  private discusList: Discus[] = [];
  private ai!: AIController;
  private difficulty: Difficulty = 'normal';

  private scoreLeft = 0;
  private scoreRight = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private chargeBarLeft!: Phaser.GameObjects.Graphics;
  private chargeBarRight!: Phaser.GameObjects.Graphics;
  private staminaLeft!: Phaser.GameObjects.Graphics;
  private staminaRight!: Phaser.GameObjects.Graphics;

  private inventoryLeft: ItemId[] = [];
  private inventoryRight: ItemId[] = [];
  private inventoryUI: { left: Phaser.GameObjects.Container; right: Phaser.GameObjects.Container } = {
    left: undefined as unknown as Phaser.GameObjects.Container,
    right: undefined as unknown as Phaser.GameObjects.Container,
  };

  private worldItems: WorldItem[] = [];
  private nextItemSpawn = 0;

  private nextThrowFlags = {
    left: { curveBoost: 0, multi: false, magnet: false },
    right: { curveBoost: 0, multi: false, magnet: false },
  };

  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  private goalCooldownUntil = 0;
  private matchOver = false;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.difficulty = data.difficulty ?? 'normal';
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.discusList = [];
    this.worldItems = [];
    this.inventoryLeft = [];
    this.inventoryRight = [];
    this.matchOver = false;
    this.goalCooldownUntil = 0;
    this.nextThrowFlags = {
      left: { curveBoost: 0, multi: false, magnet: false },
      right: { curveBoost: 0, multi: false, magnet: false },
    };
  }

  create(): void {
    drawSynthwaveBackground(this, FIELD_W, FIELD_H);
    drawArenaOverlay(this, FIELD_W, FIELD_H);

    this.particles = this.add.particles(0, 0, 'particle', {
      lifespan: 600,
      speed: { min: 80, max: 240 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitting: false,
    });
    this.particles.setDepth(5);

    this.inputSys = new InputSystem(this);
    this.touch = new TouchControls(this, FIELD_W, FIELD_H);
    this.leftPlayer = new Player(this, 'left', LEFT_HOME, FIELD_H / 2);
    this.rightPlayer = new Player(this, 'right', RIGHT_HOME, FIELD_H / 2);
    this.ai = new AIController(this.difficulty, FIELD_H);

    this.scoreText = this.add
      .text(FIELD_W / 2, 30, '0  :  0', {
        fontFamily: 'Courier New, monospace',
        fontSize: '40px',
        color: HEX.white,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.scoreText.setShadow(0, 0, HEX.cyan, 14, true, true);

    this.centerText = this.add
      .text(FIELD_W / 2, FIELD_H / 2, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '60px',
        color: HEX.sun,
        stroke: HEX.magenta,
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.chargeBarLeft = this.add.graphics().setDepth(8);
    this.chargeBarRight = this.add.graphics().setDepth(8);
    this.staminaLeft = this.add.graphics().setDepth(8);
    this.staminaRight = this.add.graphics().setDepth(8);

    this.inventoryUI.left = this.add.container(20, FIELD_H - 50).setDepth(9);
    this.inventoryUI.right = this.add.container(FIELD_W - 20 - 132, FIELD_H - 50).setDepth(9);
    this.refreshInventoryUI();

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('TitleScene');
    });

    this.spawnDiscus(FIELD_W / 2, FIELD_H / 2, Math.random() < 0.5 ? 'left' : 'right');
    this.scheduleNextItem();
    this.showCenter('READY', 600);
  }

  override update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const now = this.time.now;

    if (this.matchOver) return;

    const kb = this.inputSys.read(this.leftPlayer.isMirrored(now));
    const tc = this.touch.read();
    const aiDecision = this.ai.decide(
      dt,
      now,
      this.rightPlayer,
      this.nearestThreatTo(this.rightPlayer),
      FIELD_W,
      FIELD_H,
      this.inventoryRight.length,
    );

    let vx = kb.vx;
    let vy = kb.vy;
    if (tc.desiredY !== null) {
      const dy = tc.desiredY - this.leftPlayer.y;
      vy = Phaser.Math.Clamp(dy / 18, -1, 1);
    }
    const boost = kb.boost || tc.boost;
    const catchDown = kb.catchOrThrowDown || tc.catchDown;
    const catchHeld = kb.catchOrThrowHeld || tc.catchHeld;
    const catchReleased = kb.catchOrThrowReleased || tc.catchReleased;
    const useItem = (kb.useItem || tc.useItem) as 0 | 1 | 2 | 3;

    this.leftPlayer.applyMovement(dt, vx, vy, boost, FIELD_H);
    this.rightPlayer.applyMovement(dt, aiDecision.vx, aiDecision.vy, aiDecision.boost, FIELD_H);

    this.handleCatchAndThrow(this.leftPlayer, catchDown, catchHeld, catchReleased, dt);
    this.handleCatchAndThrow(this.rightPlayer, aiDecision.catchDown, aiDecision.catchHeld, aiDecision.catchReleased, dt);

    if (useItem > 0) this.useItem('left', useItem as 1 | 2 | 3);
    if (aiDecision.useItemSlot > 0) this.useItem('right', aiDecision.useItemSlot as 1 | 2 | 3);

    for (const d of this.discusList) {
      d.update(dt, FIELD_W, FIELD_H, now);
      if (d.attached && d.owner !== 'none') {
        const p = d.owner === 'left' ? this.leftPlayer : this.rightPlayer;
        const offX = p.side === 'left' ? p.width / 2 + 10 : -(p.width / 2 + 10);
        d.sprite.setPosition(p.x + offX, p.y);
        d.sprite.rotation += dt * 6;
      }
    }

    this.checkGoals(now);
    this.checkItemPickup();
    this.maybeSpawnItem(now);

    this.drawHUD();
  }

  private nearestThreatTo(p: Player): Discus {
    let best = this.discusList[0];
    let bestDist = Infinity;
    for (const d of this.discusList) {
      if (d.attached && d.owner === (p.side === 'left' ? 'left' : 'right')) continue;
      const dx = d.x - p.x;
      const dy = d.y - p.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  private handleCatchAndThrow(p: Player, down: boolean, held: boolean, released: boolean, dt: number): void {
    if (down) {
      if (p.hasDiscus) {
        p.startCharge();
      } else {
        const bounds = p.getCatchBounds();
        for (const d of this.discusList) {
          if (d.attached) continue;
          if (Phaser.Geom.Rectangle.Contains(bounds, d.x, d.y)) {
            const incomingFromOpponent =
              (p.side === 'left' && d.vx <= 0) || (p.side === 'right' && d.vx >= 0);
            if (incomingFromOpponent || Math.abs(d.vx) < 60) {
              this.catchDiscus(p, d);
              break;
            }
          }
        }
      }
    }
    if (held && p.charging) p.tickCharge(dt);
    if (released && p.charging) {
      const { power } = p.releaseCharge();
      this.throwDiscus(p, power);
    }
  }

  private catchDiscus(p: Player, d: Discus): void {
    p.hasDiscus = true;
    d.attachTo(p.x, p.y, p.side);
    this.particles.emitParticleAt(d.x, d.y, 14);
    this.flashTint(p.color);
    this.cameras.main.shake(80, 0.003);
  }

  private throwDiscus(p: Player, power: number): void {
    const heldDiscus = this.discusList.find((d) => d.owner === p.side && d.attached);
    if (!heldDiscus) {
      p.hasDiscus = false;
      return;
    }

    const flags = p.side === 'left' ? this.nextThrowFlags.left : this.nextThrowFlags.right;
    const dir = p.side === 'left' ? 1 : -1;
    const baseSpeed = 480 + power * 360;

    const releaseY = p.y;
    const aimY = (this.input.keyboard?.addKey('S').isDown ? 1 : 0) - (this.input.keyboard?.addKey('W').isDown ? 1 : 0);
    const aimVy = (aimY * 220) + Phaser.Math.Between(-30, 30);
    const baseSpin = (Math.random() - 0.5) * 1.4 * (1 - power * 0.4);
    const finalSpin = baseSpin + flags.curveBoost;
    flags.curveBoost = 0;

    const releaseX = p.x + dir * (p.width / 2 + 24);

    if (flags.multi) {
      flags.multi = false;
      heldDiscus.release(dir * baseSpeed, aimVy - 140, finalSpin);
      heldDiscus.x = releaseX;
      heldDiscus.y = releaseY - 140;
      const d2 = this.spawnDiscus(releaseX, releaseY, p.side === 'left' ? 'right' : 'left');
      d2.release(dir * baseSpeed, aimVy, finalSpin);
      const d3 = this.spawnDiscus(releaseX, releaseY + 140, p.side === 'left' ? 'right' : 'left');
      d3.release(dir * baseSpeed, aimVy + 140, finalSpin);
    } else {
      heldDiscus.x = releaseX;
      heldDiscus.y = releaseY;
      heldDiscus.release(dir * baseSpeed, aimVy, finalSpin);
    }

    if (flags.magnet) {
      flags.magnet = false;
      heldDiscus.magnetSide = p.side;
    }

    p.hasDiscus = false;
    this.particles.emitParticleAt(releaseX, releaseY, 18);
    this.cameras.main.shake(60, 0.005);
  }

  private spawnDiscus(x: number, y: number, towards: 'left' | 'right'): Discus {
    const d = new Discus(this, x, y);
    d.resetTo(x, y, towards);
    this.discusList.push(d);
    return d;
  }

  private checkGoals(now: number): void {
    if (now < this.goalCooldownUntil) return;
    for (const d of this.discusList) {
      if (d.attached) continue;
      if (d.x < GOAL_INSET) {
        this.onGoal('right');
        return;
      }
      if (d.x > FIELD_W - GOAL_INSET) {
        this.onGoal('left');
        return;
      }
    }
  }

  private onGoal(scoringSide: 'left' | 'right'): void {
    const now = this.time.now;
    this.goalCooldownUntil = now + 1400;
    if (scoringSide === 'left') this.scoreLeft++;
    else this.scoreRight++;

    this.scoreText.setText(`${this.scoreLeft}  :  ${this.scoreRight}`);
    this.cameras.main.shake(280, 0.012);
    this.cameras.main.flash(180, scoringSide === 'left' ? 255 : 0, 110, scoringSide === 'right' ? 255 : 110);
    this.particles.emitParticleAt(scoringSide === 'left' ? FIELD_W - GOAL_INSET : GOAL_INSET, FIELD_H / 2, 60);

    this.showCenter(scoringSide === 'left' ? 'YOU SCORE!' : 'AI SCORES', 900);

    for (const d of this.discusList) d.destroy();
    this.discusList = [];
    this.leftPlayer.hasDiscus = false;
    this.rightPlayer.hasDiscus = false;
    this.leftPlayer.x = LEFT_HOME;
    this.rightPlayer.x = RIGHT_HOME;

    if (this.scoreLeft >= SCORE_TO_WIN || this.scoreRight >= SCORE_TO_WIN) {
      this.matchOver = true;
      this.time.delayedCall(900, () => {
        this.scene.start('ResultScene', {
          winner: this.scoreLeft > this.scoreRight ? 'left' : 'right',
          difficulty: this.difficulty,
          scoreLeft: this.scoreLeft,
          scoreRight: this.scoreRight,
        });
      });
      return;
    }

    this.time.delayedCall(900, () => {
      const towards = scoringSide === 'left' ? 'right' : 'left';
      this.spawnDiscus(FIELD_W / 2, FIELD_H / 2, towards);
    });
  }

  private maybeSpawnItem(now: number): void {
    if (now < this.nextItemSpawn) return;
    if (this.worldItems.length >= 3) {
      this.scheduleNextItem();
      return;
    }
    const x = Phaser.Math.Between(FIELD_W * 0.25, FIELD_W * 0.75);
    const y = Phaser.Math.Between(140, FIELD_H - 100);
    this.worldItems.push(new WorldItem(this, x, y, randomItem()));
    this.scheduleNextItem();
  }

  private scheduleNextItem(): void {
    this.nextItemSpawn = this.time.now + Phaser.Math.Between(7000, 13000);
  }

  private checkItemPickup(): void {
    const players = [this.leftPlayer, this.rightPlayer];
    for (let i = this.worldItems.length - 1; i >= 0; i--) {
      const item = this.worldItems[i];
      const r = item.bounds();
      for (const p of players) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(r, p.getCatchBounds())) {
          this.pickupItem(p.side, item.id);
          item.destroy();
          this.worldItems.splice(i, 1);
          break;
        }
      }
    }
  }

  private pickupItem(side: 'left' | 'right', id: ItemId): void {
    const inv = side === 'left' ? this.inventoryLeft : this.inventoryRight;
    if (inv.length >= 3) return;
    inv.push(id);
    this.refreshInventoryUI();
    const def = ITEM_DEFS[id];
    this.flashTint(def.color);
  }

  private useItem(side: 'left' | 'right', slot: 1 | 2 | 3): void {
    const inv = side === 'left' ? this.inventoryLeft : this.inventoryRight;
    const id = inv[slot - 1];
    if (!id) return;
    inv.splice(slot - 1, 1);
    this.applyItemEffect(side, id);
    this.refreshInventoryUI();
  }

  private applyItemEffect(side: 'left' | 'right', id: ItemId): void {
    const now = this.time.now;
    const flags = side === 'left' ? this.nextThrowFlags.left : this.nextThrowFlags.right;
    const opponent = side === 'left' ? this.rightPlayer : this.leftPlayer;
    const def = ITEM_DEFS[id];
    this.flashTint(def.color);

    switch (id) {
      case 'curve':
        flags.curveBoost = side === 'left' ? 1.6 : -1.6;
        break;
      case 'multi':
        flags.multi = true;
        break;
      case 'magnet':
        flags.magnet = true;
        break;
      case 'slow':
        for (const d of this.discusList) {
          if (!d.attached && ((side === 'left' && d.vx > 0) || (side === 'right' && d.vx < 0))) {
            d.applySlow(2000, now, 0.4);
          }
        }
        break;
      case 'mirror':
        opponent.setMirrored(3000, now);
        break;
      case 'shrink':
        opponent.setScaleMul(0.65);
        this.time.delayedCall(5000, () => opponent.setScaleMul(1));
        break;
    }
  }

  private refreshInventoryUI(): void {
    [this.inventoryUI.left, this.inventoryUI.right].forEach((c) => c.removeAll(true));
    const draw = (container: Phaser.GameObjects.Container, inv: ItemId[]) => {
      for (let i = 0; i < 3; i++) {
        const id = inv[i];
        const x = i * 44;
        const slotG = this.add.graphics();
        slotG.lineStyle(2, COLORS.cyan, 0.6);
        slotG.strokeRoundedRect(x, 0, 40, 40, 6);
        container.add(slotG);
        if (id) {
          const def = ITEM_DEFS[id];
          const img = this.add.image(x + 20, 20, def.texKey);
          const lbl = this.add
            .text(x + 20, 20, def.label[0], {
              fontFamily: 'Courier New, monospace',
              fontSize: '20px',
              color: def.hex,
            })
            .setOrigin(0.5);
          container.add([img, lbl]);
        }
      }
    };
    draw(this.inventoryUI.left, this.inventoryLeft);
    draw(this.inventoryUI.right, this.inventoryRight);
  }

  private drawHUD(): void {
    this.chargeBarLeft.clear();
    this.chargeBarRight.clear();
    this.staminaLeft.clear();
    this.staminaRight.clear();

    if (this.leftPlayer.charging) {
      const w = 80;
      const t = Math.min(1, this.leftPlayer.chargeTime / 1.0);
      this.chargeBarLeft.fillStyle(COLORS.magenta, 1);
      this.chargeBarLeft.fillRect(this.leftPlayer.x - w / 2, this.leftPlayer.y - 80, w * t, 6);
      this.chargeBarLeft.lineStyle(1, COLORS.white, 0.8);
      this.chargeBarLeft.strokeRect(this.leftPlayer.x - w / 2, this.leftPlayer.y - 80, w, 6);
    }
    if (this.rightPlayer.charging) {
      const w = 80;
      const t = Math.min(1, this.rightPlayer.chargeTime / 1.0);
      this.chargeBarRight.fillStyle(COLORS.cyan, 1);
      this.chargeBarRight.fillRect(this.rightPlayer.x - w / 2, this.rightPlayer.y - 80, w * t, 6);
      this.chargeBarRight.lineStyle(1, COLORS.white, 0.8);
      this.chargeBarRight.strokeRect(this.rightPlayer.x - w / 2, this.rightPlayer.y - 80, w, 6);
    }

    this.staminaLeft.fillStyle(COLORS.sun, 1);
    this.staminaLeft.fillRect(20, 30, 200 * this.leftPlayer.stamina, 6);
    this.staminaLeft.lineStyle(1, COLORS.white, 0.6);
    this.staminaLeft.strokeRect(20, 30, 200, 6);

    this.staminaRight.fillStyle(COLORS.sun, 1);
    this.staminaRight.fillRect(FIELD_W - 220, 30, 200 * this.rightPlayer.stamina, 6);
    this.staminaRight.lineStyle(1, COLORS.white, 0.6);
    this.staminaRight.strokeRect(FIELD_W - 220, 30, 200, 6);
  }

  private showCenter(text: string, durationMs: number): void {
    this.centerText.setText(text);
    this.centerText.setAlpha(1);
    this.tweens.add({
      targets: this.centerText,
      alpha: 0,
      duration: durationMs,
      ease: 'Quad.easeIn',
    });
  }

  private flashTint(color: number): void {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    this.cameras.main.flash(120, r, g, b, true);
  }
}
