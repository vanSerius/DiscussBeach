import Phaser from 'phaser';
import { Discus } from '../entities/Discus';
import { Player } from '../entities/Player';
import { Difficulty } from '../scenes/TitleScene';
import { ItemId } from './Items';

export interface AIDecision {
  vx: number;
  vy: number;
  catchDown: boolean;
  catchHeld: boolean;
  catchReleased: boolean;
  boost: boolean;
  useItemSlot: 0 | 1 | 2 | 3;
}

interface AIState {
  reactionDelay: number;
  aimError: number;
  itemBias: number;
  predictionDepth: number;
  fakeChance: number;
}

const PROFILES: Record<Difficulty, AIState> = {
  easy: { reactionDelay: 0.35, aimError: 80, itemBias: 0, predictionDepth: 0, fakeChance: 0 },
  normal: { reactionDelay: 0.18, aimError: 35, itemBias: 0.4, predictionDepth: 0.6, fakeChance: 0.05 },
  hard: { reactionDelay: 0.07, aimError: 12, itemBias: 0.85, predictionDepth: 1.0, fakeChance: 0.18 },
};

export class AIController {
  private state: AIState;
  private targetY: number;
  private holdUntil = 0;
  private fakeUntil = 0;

  constructor(public difficulty: Difficulty, fieldH: number) {
    this.state = PROFILES[difficulty];
    this.targetY = fieldH / 2;
  }

  decide(
    _dt: number,
    now: number,
    self: Player,
    discus: Discus,
    fieldW: number,
    fieldH: number,
    inventoryCount: number,
  ): AIDecision {
    const decision: AIDecision = {
      vx: 0,
      vy: 0,
      catchDown: false,
      catchHeld: false,
      catchReleased: false,
      boost: false,
      useItemSlot: 0,
    };

    const predictedY = this.predictY(discus, self, fieldH);
    if (now > this.holdUntil) {
      this.targetY = predictedY + Phaser.Math.Between(-this.state.aimError, this.state.aimError);
      this.holdUntil = now + this.state.reactionDelay * 1000;
    }

    const dy = this.targetY - self.y;
    if (Math.abs(dy) > 8) decision.vy = Math.sign(dy);

    if (self.hasDiscus) {
      const desiredCharge = 0.6 + Math.random() * 0.4;
      decision.catchHeld = true;

      if (Math.random() < this.state.fakeChance && now > this.fakeUntil && self.chargeTime > 0.3) {
        this.fakeUntil = now + 700;
        decision.catchReleased = false;
        decision.catchHeld = false;
        return decision;
      }

      if (self.chargeTime >= desiredCharge) {
        decision.catchReleased = true;
        decision.catchHeld = false;
      } else if (!self.charging) {
        decision.catchDown = true;
      }
    } else {
      const incoming = discus.vx > 0 && discus.x > fieldW / 2;
      const closeX = Math.abs(discus.x - self.x) < 90;
      if (incoming && closeX && !discus.attached) {
        decision.catchDown = true;
        if (this.difficulty === 'hard') decision.boost = true;
      }
    }

    if (inventoryCount > 0 && Math.random() < 0.005 * (1 + this.state.itemBias * 4)) {
      decision.useItemSlot = (Phaser.Math.Between(1, Math.min(3, inventoryCount)) as 1 | 2 | 3);
    }

    return decision;
  }

  private predictY(discus: Discus, self: Player, fieldH: number): number {
    if (this.state.predictionDepth <= 0) return discus.y;
    if (discus.attached) return fieldH / 2;
    if (discus.vx <= 0 && self.side === 'right') return fieldH / 2;
    if (discus.vx >= 0 && self.side === 'left') return fieldH / 2;

    const distX = self.side === 'right' ? self.x - discus.x : discus.x - self.x;
    if (distX <= 0) return discus.y;
    const t = distX / Math.max(60, Math.abs(discus.vx));
    let y = discus.y + discus.vy * t + 0.5 * discus.spin * 220 * t * t;
    const minY = 80 + 18;
    const maxY = fieldH - 50 - 18;
    while (y < minY || y > maxY) {
      if (y < minY) y = minY + (minY - y);
      if (y > maxY) y = maxY - (y - maxY);
    }
    const blend = this.state.predictionDepth;
    return discus.y * (1 - blend) + y * blend;
  }

  pickItemForUse(_inventory: ItemId[]): ItemId | null {
    return null;
  }
}
