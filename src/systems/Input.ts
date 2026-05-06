import Phaser from 'phaser';

export interface PlayerInput {
  vx: number;
  vy: number;
  catchOrThrowDown: boolean;
  catchOrThrowHeld: boolean;
  catchOrThrowReleased: boolean;
  boost: boolean;
  useItem: 0 | 1 | 2 | 3;
}

export class InputSystem {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;
  private keyShift: Phaser.Input.Keyboard.Key;
  private key1: Phaser.Input.Keyboard.Key;
  private key2: Phaser.Input.Keyboard.Key;
  private key3: Phaser.Input.Keyboard.Key;

  private spaceWasDown = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keyW = kb.addKey('W');
    this.keyA = kb.addKey('A');
    this.keyS = kb.addKey('S');
    this.keyD = kb.addKey('D');
    this.keySpace = kb.addKey('SPACE');
    this.keyShift = kb.addKey('SHIFT');
    this.key1 = kb.addKey('ONE');
    this.key2 = kb.addKey('TWO');
    this.key3 = kb.addKey('THREE');
  }

  read(mirrored: boolean): PlayerInput {
    let vy = (this.keyS.isDown ? 1 : 0) - (this.keyW.isDown ? 1 : 0);
    let vx = (this.keyD.isDown ? 1 : 0) - (this.keyA.isDown ? 1 : 0);
    if (mirrored) {
      vy = -vy;
      vx = -vx;
    }
    const spaceDown = this.keySpace.isDown;
    const justDown = spaceDown && !this.spaceWasDown;
    const justUp = !spaceDown && this.spaceWasDown;
    this.spaceWasDown = spaceDown;

    const useItem: 0 | 1 | 2 | 3 = Phaser.Input.Keyboard.JustDown(this.key1)
      ? 1
      : Phaser.Input.Keyboard.JustDown(this.key2)
        ? 2
        : Phaser.Input.Keyboard.JustDown(this.key3)
          ? 3
          : 0;

    return {
      vx,
      vy,
      catchOrThrowDown: justDown,
      catchOrThrowHeld: spaceDown,
      catchOrThrowReleased: justUp,
      boost: this.keyShift.isDown,
      useItem,
    };
  }
}
