import Phaser from 'phaser';
import { COLORS, HEX } from '../utils/Colors';

export interface TouchSnapshot {
  desiredY: number | null;
  catchDown: boolean;
  catchHeld: boolean;
  catchReleased: boolean;
  boost: boolean;
  useItem: 0 | 1 | 2 | 3;
}

interface ButtonHandle {
  container: Phaser.GameObjects.Container;
  hit: Phaser.GameObjects.Zone;
}

export class TouchControls {
  private moveDesiredY: number | null = null;
  private movePointerId: number | null = null;

  private catchHeld = false;
  private catchPointerId: number | null = null;
  private catchEdgeDown = false;
  private catchEdgeReleased = false;

  private boost = false;
  private boostPointerId: number | null = null;

  private useItemQueued: 0 | 1 | 2 | 3 = 0;
  public available: boolean;

  constructor(
    private scene: Phaser.Scene,
    fieldW: number,
    fieldH: number,
  ) {
    this.available = scene.sys.game.device.input.touch || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!this.available) return;

    scene.input.addPointer(3);

    const moveZone = scene.add
      .zone(0, 0, fieldW * 0.55, fieldH)
      .setOrigin(0, 0)
      .setInteractive();
    moveZone.setDepth(50);
    moveZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.movePointerId === null) {
        this.movePointerId = pointer.id;
        this.moveDesiredY = pointer.y;
      }
    });
    moveZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.movePointerId) this.moveDesiredY = pointer.y;
    });
    const releaseMove = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.id === this.movePointerId) {
        this.movePointerId = null;
        this.moveDesiredY = null;
      }
    };
    moveZone.on('pointerup', releaseMove);
    moveZone.on('pointerupoutside', releaseMove);

    this.makeButton(
      fieldW - 130,
      fieldH - 140,
      110,
      COLORS.cyan,
      'CATCH /\nTHROW',
      (pointer) => {
        if (this.catchPointerId === null) {
          this.catchPointerId = pointer.id;
          this.catchHeld = true;
          this.catchEdgeDown = true;
        }
      },
      (pointer) => {
        if (pointer.id === this.catchPointerId) {
          this.catchPointerId = null;
          this.catchHeld = false;
          this.catchEdgeReleased = true;
        }
      },
    );

    this.makeButton(
      fieldW - 270,
      fieldH - 140,
      80,
      COLORS.sun,
      'BOOST',
      (pointer) => {
        if (this.boostPointerId === null) {
          this.boostPointerId = pointer.id;
          this.boost = true;
        }
      },
      (pointer) => {
        if (pointer.id === this.boostPointerId) {
          this.boostPointerId = null;
          this.boost = false;
        }
      },
    );

    for (let i = 0; i < 3; i++) {
      const slot = (i + 1) as 1 | 2 | 3;
      this.makeButton(
        20 + i * 70,
        fieldH - 140,
        50,
        COLORS.magenta,
        String(slot),
        () => {
          this.useItemQueued = slot;
        },
        () => {},
      );
    }

    scene.add
      .text(fieldW * 0.55 / 2, 100, 'DRAG TO MOVE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: HEX.cyan,
      })
      .setOrigin(0.5)
      .setAlpha(0.55)
      .setDepth(40);
  }

  private makeButton(
    x: number,
    y: number,
    radius: number,
    color: number,
    label: string,
    onDown: (p: Phaser.Input.Pointer) => void,
    onUp: (p: Phaser.Input.Pointer) => void,
  ): ButtonHandle {
    const g = this.scene.add.graphics();
    g.lineStyle(3, color, 0.9);
    g.fillStyle(COLORS.night, 0.55);
    g.fillCircle(0, 0, radius);
    g.strokeCircle(0, 0, radius);

    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: radius < 60 ? '20px' : '18px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        align: 'center',
      })
      .setOrigin(0.5);

    const container = this.scene.add.container(x, y, [g, text]).setDepth(60).setAlpha(0.85);

    const hit = this.scene.add.zone(x, y, radius * 2, radius * 2).setOrigin(0.5).setCircleDropZone(radius);
    hit.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
    hit.setDepth(61);

    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.scene.tweens.add({ targets: container, scale: 0.92, duration: 60, yoyo: true });
      onDown(pointer);
    });
    hit.on('pointerup', onUp);
    hit.on('pointerupoutside', onUp);

    return { container, hit };
  }

  read(): TouchSnapshot {
    const snap: TouchSnapshot = {
      desiredY: this.moveDesiredY,
      catchDown: this.catchEdgeDown,
      catchHeld: this.catchHeld,
      catchReleased: this.catchEdgeReleased,
      boost: this.boost,
      useItem: this.useItemQueued,
    };
    this.catchEdgeDown = false;
    this.catchEdgeReleased = false;
    this.useItemQueued = 0;
    return snap;
  }
}
