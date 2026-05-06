import Phaser from 'phaser';
import { COLORS, HEX } from '../utils/Colors';

export type ItemId = 'curve' | 'multi' | 'slow' | 'mirror' | 'magnet' | 'shrink';

export interface ItemDef {
  id: ItemId;
  texKey: string;
  label: string;
  color: number;
  hex: string;
}

export const ITEM_DEFS: Record<ItemId, ItemDef> = {
  curve: { id: 'curve', texKey: 'item_curve', label: 'CURVE+', color: COLORS.magenta, hex: HEX.magenta },
  multi: { id: 'multi', texKey: 'item_multi', label: 'MULTI', color: COLORS.cyan, hex: HEX.cyan },
  slow: { id: 'slow', texKey: 'item_slow', label: 'SLOW', color: COLORS.purple, hex: HEX.purple },
  mirror: { id: 'mirror', texKey: 'item_mirror', label: 'MIRROR', color: COLORS.sun, hex: HEX.sun },
  magnet: { id: 'magnet', texKey: 'item_magnet', label: 'MAGNET', color: COLORS.cyan, hex: HEX.cyan },
  shrink: { id: 'shrink', texKey: 'item_shrink', label: 'SHRINK', color: COLORS.magenta, hex: HEX.magenta },
};

const ALL_IDS: ItemId[] = ['curve', 'multi', 'slow', 'mirror', 'magnet', 'shrink'];

export class WorldItem {
  public sprite: Phaser.GameObjects.Container;
  public id: ItemId;

  constructor(scene: Phaser.Scene, x: number, y: number, id: ItemId) {
    this.id = id;
    const def = ITEM_DEFS[id];
    const img = scene.add.image(0, 0, def.texKey);
    const label = scene.add
      .text(0, 0, def.label[0], {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: def.hex,
        stroke: '#0d0221',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.sprite = scene.add.container(x, y, [img, label]).setDepth(2);

    scene.tweens.add({
      targets: this.sprite,
      y: y - 8,
      yoyo: true,
      repeat: -1,
      duration: 1100,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      repeat: -1,
      duration: 4000,
      ease: 'Linear',
    });
  }

  bounds(): Phaser.Geom.Rectangle {
    const w = 40;
    return new Phaser.Geom.Rectangle(this.sprite.x - w / 2, this.sprite.y - w / 2, w, w);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

export function randomItem(): ItemId {
  return ALL_IDS[Phaser.Math.Between(0, ALL_IDS.length - 1)];
}
