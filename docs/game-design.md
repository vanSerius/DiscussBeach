# DiscussBeach — Game Design Document

## Vibe

**"Retro but modern"** — 80s synthwave aesthetic with modern juice (particles, screen-shake, smooth tweens).

### Palette

| Role | Hex | Use |
|---|---|---|
| Magenta | `#ff006e` | Player 1 (left), warm accents, glow stroke |
| Cyan | `#00f5ff` | Player 2 / AI (right), cool accents, primary text |
| Purple | `#8338ec` | Sky, item glows |
| Sun-Yellow | `#ffbe0b` | Sun, score highlights, headlines |
| Deep-Night | `#0d0221` | Background base, panel fills |

### Mood references

- Synthwave grid-horizon, sliced sun (Outrun-style)
- CRT scanlines and bloom on neon edges
- Trails behind every projectile

## Field

- Aspect 16:9, logical resolution **1280×720**, scaled to fit browser
- Top 55%: synthwave sky + sun + grid
- Bottom: darkened "sand" overlay
- Goals: vertical neon bars on left (magenta) and right (cyan), ~55% of field height
- Pulsing dashed center line

## Players

Two silhouetted avatars with neon outlines.

- Vertical movement (Pong-like) **plus** small forward/back X-axis range (limited to ~80 px in front of own goal)
- Player 1 left (`magenta`), AI right (`cyan`)

### Controls (Player 1)

| Action | Key |
|---|---|
| Move up / down | `W` / `S` |
| Step forward / back | `D` / `A` |
| Catch / charge throw | `Space` (tap to catch, hold to charge) |
| Sprint boost (drains stamina) | `Shift` |
| Use item slot | `1` / `2` / `3` |
| Back to title | `Esc` |

### Stamina

- Bar 0–1, regenerates 0.25 / s, drains 0.5 / s while sprinting
- Sprint boost only works when stamina > 0 and movement key held

## Discus mechanic

- **Catch**: tap `Space` while incoming discus is in your catch box → attaches to your avatar
- **Charge**: hold `Space` after catching, power ramps 0.25 → 1.4 over up to 1.0 s
- **Aim**: `W`/`S` while charging biases vertical release velocity
- **Release**: let go of `Space` → discus released with `power × baseSpeed` and small random spin
- **Spin**: extra angular velocity adds curve via vertical force per second; visualized by trail rotation
- **Bounce**: top/bottom walls reflect Y velocity; spin slightly inverted on bounce
- **Goal**: discus crossing left edge → AI scores; right edge → player scores

## Match flow

- Best of **5** (first to **3 points**)
- 1.4 s cooldown after each goal
- Discus respawns in middle, fired toward whoever just got scored on
- Match end → ResultScene

## Items

Items spawn every 7–13 s at random non-goal positions (max 3 on field). Pick up by walking into them. Inventory: 3 slots per side.

| Item | Effect | Notes |
|---|---|---|
| **Curve+** | Adds `±1.6` spin to next throw | Direction signed by side |
| **Multi** | Next throw fans out 3 discs | Center + ±140 px Y offset |
| **Slow** | Incoming opponent discs slowed to 40% for 2 s | Filters by velocity direction |
| **Mirror** | Inverts opponent's `vx`/`vy` for 3 s | Read in `InputSystem` |
| **Magnet** | Next throw pulls discus toward own goal mid-flight | Used for fakes |
| **Shrink** | Shrinks opponent avatar to 65% for 5 s | Smaller catch box |

## Boosts

- **Sprint** (`Shift`): faster movement while held
- **Charged throw**: longer hold = more power; randomized aim error grows with charge slightly

## AI

Three difficulty profiles (`src/systems/AI.ts`):

| Profile | Reaction (s) | Aim error (px) | Item bias | Prediction depth | Fake chance |
|---|---|---|---|---|---|
| Easy | 0.35 | 80 | 0 | 0 | 0 |
| Normal | 0.18 | 35 | 0.4 | 0.6 | 0.05 |
| Hard | 0.07 | 12 | 0.85 | 1.0 | 0.18 |

- AI predicts discus Y by extrapolating velocity + spin × ½ a t² with wall reflection
- Holds catch when not yet charged; releases at random target charge `0.6–1.0`
- Hard fakes: cancels charge mid-throw to bait Player commitment
- Item usage: small per-frame chance scaled by `itemBias`

## Audio (placeholder)

Currently silent — synthwave loop + SFX (catch snap, whoosh, goal boom, item chime) are listed for future work.

## Visual effects

- **Glow**: Phaser FX `addGlow` on discus + scaled-up neon stroke on text
- **Particles**: 8×8 white circle additive, used for catch burst, goal explosion, throw release
- **Screen-shake**: small on catch, bigger on goal, biggest on Mega-Throw
- **Camera flash**: brief tint on goals + powerful events
- **Trail**: 16 fading copies of the discus image

## Performance targets

- 60 fps in modern desktop browsers (Chrome, Firefox, Safari)
- Production bundle ~350 kB gzipped (Phaser dominates — accepted tradeoff)

## Out of scope (for now)

- Online multiplayer (deliberately not implemented)
- Mobile touch controls
- Custom asset pipeline (sprites currently generated procedurally)
- Audio (planned, not yet implemented)
