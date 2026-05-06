# DiscussBeach

A retro-but-modern **neon-vibe** 1v1 arcade game. Two avatars on a synthwave beach throw a glowing discus at each other's goal — like Pong, but you actively **catch and throw**, with **spin**, **items**, and **boosts**.

Tech: **Phaser 3** + TypeScript + Vite. Single-player vs. AI (3 difficulty levels).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # preview production build
```

## Controls

| Action | Key |
|---|---|
| Move up / down | `W` / `S` |
| Step forward / back | `D` / `A` |
| Catch / charge throw (hold) | `Space` |
| Sprint boost | `Shift` |
| Use item slot 1 / 2 / 3 | `1` / `2` / `3` |
| Pause to title | `Esc` |

Charge longer = more power but slightly less accuracy. Release to throw.

## Items

| Item | Effect |
|---|---|
| **Curve+** | Next throw gets extreme spin curve |
| **Multi** | Throws 3 discs in spread |
| **Slow** | Slows incoming opponent disc for 2 s |
| **Mirror** | Inverts opponent controls for 3 s |
| **Magnet** | Slight pull toward thrower on next flight |
| **Shrink** | Shrinks opponent avatar for 5 s |

## Project structure

```
src/
  main.ts             # Phaser game bootstrap
  scenes/             # BootScene, TitleScene, GameScene, ResultScene
  entities/           # Player, Discus
  systems/            # Input, AI, Items
  visuals/            # Background generator
  utils/Colors.ts     # Neon palette
docs/game-design.md   # Design source of truth
```

## Design

See [`docs/game-design.md`](docs/game-design.md) for vibes, palette, mechanics, AI tuning, and the item table.

## License

MIT — see `LICENSE`.
