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

### Desktop / Keyboard

| Action | Key |
|---|---|
| Move up / down | `W` / `S` |
| Step forward / back | `D` / `A` |
| Catch / charge throw (hold) | `Space` |
| Sprint boost | `Shift` |
| Use item slot 1 / 2 / 3 | `1` / `2` / `3` |
| Pause to title | `Esc` |

### Mobile / Touch

- **Drag** anywhere on the **left half of the screen** → your avatar follows your finger up/down.
- **CATCH/THROW** button (right side) — tap to catch; hold to charge throw; release to throw.
- **BOOST** button (next to throw) — hold for sprint.
- **1 / 2 / 3** buttons (bottom-left) — use the matching item slot.
- Best played in **landscape orientation**.

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

## Deployment to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy.yml` that builds with Vite and publishes `dist/` to GitHub Pages on every push.

**One-time setup:**
1. Repository → **Settings** → **Pages** → **Build and deployment** → set **Source** to **GitHub Actions**.
2. Push any commit (or run the workflow manually). The Action installs deps, runs `npm run build`, and deploys.
3. Your site will appear at `https://<owner>.github.io/<repo>/`.

> ⚠️ Pushing the source files alone won't work — GitHub Pages serves static files and cannot execute TypeScript. The Actions workflow does the build for you.

## Ruflo as dev support

[Ruflo](https://github.com/ruvnet/ruflo) is set up as an external Claude Code dev tool — it is **not** vendored into this repo. To use it:

```bash
npx ruflo@latest init wizard      # creates .claude/ agent configs
claude mcp add ruflo -- npx ruflo@latest mcp start
```

Useful Ruflo capabilities for this project:
- **`tester` agent** + **`ruflo-testgen` plugin** — auto-generate unit tests for systems (AI, Discus physics).
- **`ruflo-browser` plugin** (Playwright) — automated end-to-end browser tests of menus and gameplay flows.
- **`reviewer` agent** + **`ruflo-jujutsu`** — code review with diff/risk scoring before each push.
- **`security` agent** — periodic vulnerability checks on dependencies.
- **`testgaps` background worker** — flags untested code as it lands.

## License

MIT — see `LICENSE`.
