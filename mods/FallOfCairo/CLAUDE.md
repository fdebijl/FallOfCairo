# CLAUDE.md — Fall of Cairo (Portal SDK Mod)

## Project Overview

**Battlefield Portal mod** in TypeScript using the Portal SDK. Portal is a game-mode
creator for Battlefield where custom logic is event-driven TypeScript that interfaces
with game objects placed in Godot scenes.

**Concept**: A defensive, CoD-Zombies-style scenario. Human players defend a capture
point in Cairo from timed waves of AI invaders. Survive all waves to win; lose the
point to lose.

- **Team 1 = NATO** (`TEAMS.NATO`) — human players. NATO is also backfilled with friendly
  AI bots to keep the squad at 4 (see `backfillNATO`).
- **Team 2 = PAX Armata** (`TEAMS.PAX_ARMATA`) — the enemy AI invaders.

## Build & Distribution — IMPORTANT

There **is** a build step. Portal only accepts a single uploaded `.ts` file, so all
source is combined into one file.

```sh
npm run build
```

This runs (via `prebuild` then `build` in [package.json](package.json)):
1. **[bin/charmancer.js](bin/charmancer.js)** — fails the build if any `.ts` / `.strings.json`
   file contains a character outside Latin-1 (`> 0x7F`). Portal rejects non-Latin-1 chars.
   Use plain ASCII — no smart quotes, em-dashes, emoji, etc. in source strings.
2. **[bin/widgetter.js](bin/widgetter.js)** — validates that every `mod.stringkeys.X`
   referenced in a `*Widget.ts` `textLabel` exists as a key in `FallOfCairo.strings.json`.
3. **[bin/combine.js](bin/combine.js)** — walks all `.ts` files, builds a dependency graph
   from cross-file function calls, topologically sorts them, strips `import`/`export`
   (keeping `export` only on recognized Portal event handlers), prepends
   `import * as modlib from 'modlib'`, and writes **[combined.ts](combined.ts)**.

**`combined.ts` is a generated artifact — never edit it by hand.** It is regenerated on
every build. Edit the real source files, then rebuild. (Note: some source files import
type-only symbols like `Difficulty` from `'../combined'`; this resolves fine because
combine strips imports, but prefer importing from the real source module.)

There is no separate `tsc` compile of the app for distribution; `tsconfig.json` exists
for editor type-checking against `index.d.ts`, `globals.d.ts`, and `modlib.d.ts`.

## Project Structure

- **[FallOfCairo.ts](FallOfCairo.ts)** — entry point. Exports all Portal event handlers
  (`OnGameModeStarted`, `OnPlayerDeployed`, `OnPlayerDied`, etc.) and owns the two tick
  loops. Event handlers dispatch to the handler classes based on whether the player is AI.
- **[constants.ts](constants.ts)** — `VERSION`, all ObjId constants, and the `WAVES` array.
  Bump `VERSION` here when releasing; also update `announcementTitle` in the strings file.
- **classes/**
  - `Actor.ts` → base class; `BotPlayer.ts` / `HumanPlayer.ts` extend it.
  - `BotHandler.ts` — static class managing PAX AI: spawning, soldier class/name
    randomization, movement/attack direction, vehicle crewing. `botPlayers` holds **only
    PAX AI** (not NATO backfill bots). Cap: `maxAmountOfAi = 32`.
  - `PlayerHandler.ts` — static class tracking human players and their state.
  - `WaveManager.ts` — drives the timed wave system (see below).
  - `DifficultyManager.ts` — static; sets AI damage modifier and bot health per difficulty.
    Currently always initialized to `Difficulty.Medium` in `setup.ts` (no UI yet).
- **helpers/**
  - `helpers.ts` — `isAI`, `isObjectIDsEqual`, `IsAIAllowedVehicle`, `backfillNATO`,
    `triggerVictory`/`triggerDefeat`, `freeze`/`unfreezePlayers`.
  - `setup.ts` — one-time setup (scoreboard, emplacements, intro widget, difficulty).
- **interfaces/**
  - `Wave.ts`, `Difficulty.ts` — shared type/enum definitions.
  - `UI/` — widget definition objects + `UIManager.ts`.

## Architecture & Core Concepts

### Event-Driven System
All game logic hangs off exported event-handler functions the Portal runtime calls.
Handler names must **exactly** match the Portal API. The combiner detects event handlers
by reading the `EventHandlerSignatures` namespace in `index.d.ts` and preserves their
`export`; a hardcoded fallback list lives in [bin/combine.js](bin/combine.js).

```typescript
export async function OnGameModeStarted(): Promise<void> {}
export async function OnPlayerDeployed(player: mod.Player) {}
```

### The `mod` global & `modlib`
- `mod` is the Portal API, injected globally by the runtime — **do not import it**.
- `modlib` is a helper namespace (see [modlib.d.ts](modlib.d.ts)) providing `ParseUI`,
  condition-state helpers, array utilities, etc. The combiner adds its import automatically.
- Extra globals are declared in [globals.d.ts](globals.d.ts): `console.log`, `print`, `scriptArgs`.

### Object Reference System & ID Conventions
Game objects live in Godot scenes and are fetched by numeric ObjId. **[constants.ts](constants.ts)**
documents the ID-range convention — respect it when adding objects:

```
Core logic:          0-99
Capture Points:      100-199
Sectors:             200-299
AI Spawn Points:     300-399
Vehicle Spawn Points:400-499
Weapon Emplacements: 500-599
Area Triggers:       600-699
Loot Spawners:       700-799
```

```typescript
const cp = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT); // 100
const id = mod.GetObjId(cp);
```

### Wave System
`WAVES` in [constants.ts](constants.ts) is an array of `Wave` objects (infantry counts +
spawn points, optional vehicle counts/types/spawn points). `WaveManager.DoWaveLoop()` runs
every second from `SlowTick`: it spawns the next wave when its scheduled time is reached,
tracks `infantryRemaining`/`vehiclesRemaining`, updates the wave-info UI, schedules the
next wave (with `INTERMISSION_DURATION_SECONDS` gap) once all AI are dead, and triggers
victory when no waves and no AI remain.

### Tick Loops
Two recursive `async` loops started in `OnGameModeStarted`, using `await mod.Wait()`
(never `setTimeout`):
- `SlowTick` — every 1s: `waveManager.DoWaveLoop()`.
- `SlowestTick` — every 10s: `backfillNATO()` + `BotHandler.PurgeBotList()`.

### UI / Widgets & Localization
- User-facing text lives in **[FallOfCairo.strings.json](FallOfCairo.strings.json)**, keyed
  by name. Reference via `mod.stringkeys.<key>` and `mod.Message(mod.stringkeys.key, ...args)`.
  `{}` placeholders in the string are filled by the `Message` args in order.
- Widget layouts are plain object definitions in `interfaces/UI/*Widget.ts`. `UIManager`
  registers them via `modlib.ParseUI(...)`, then grabs handles with
  `mod.FindUIWidgetWithName('Container_...')`. Toggle visibility with `mod.SetUIWidgetVisible`.
- **Adding UI text**: add the key to the strings file (or `widgetter` fails the build),
  reference it in the widget definition, and wire show/hide + update methods in `UIManager`.
- **Never hardcode user-facing text.** Always go through `mod.stringkeys` / the strings file.
  The runtime runs a profanity filter over raw string literals passed to `mod.Message` and
  friends, so a hardcoded label gets filtered out and never renders. This includes
  "harmless" fallbacks like `mod.stringkeys.Foo || 'Foo'` — the fallback branch is dead
  weight that silently produces nothing. Note that interpolated values also need to be in the strings file, only
  integers can be interpolated without being in the strings file.

### Async/Await for Timing
```typescript
await mod.Wait(5); // seconds
```

### Vectors
`mod.CreateVector(x, y, z)` — X = left/right, Y = up/down, Z = forward/back. Extract with
`mod.XComponentOf()`, `mod.YComponentOf()`, `mod.ZComponentOf()`.

## API Discovery

- **[index.d.ts](index.d.ts)** (~1M lines) is the complete Portal API: functions, enums
  (weapons, gadgets, vehicles, maps, factions), event-handler signatures, opaque object
  types. Always grep here for available functions and enum values.
- Opaque types (`Player`, `CapturePoint`, `Vehicle`, …) are never constructed directly —
  obtain them via `mod.Get*()` APIs.

## Common Gotchas

- **Never hand-edit `combined.ts`** — it is generated. Edit source and run `npm run build`.
- **ASCII only** in source strings — charmancer rejects anything above 0x7F.
- **New `mod.stringkeys` used in widgets must exist in the strings file** — widgetter enforces this.
- Event handlers must be **exported** with **exact Portal API names**.
- `BotHandler.botPlayers` contains **only PAX AI**; NATO backfill bots are not tracked there.
- `IsAIAllowedVehicle` in [helpers/helpers.ts](helpers/helpers.ts) must list **every** vehicle
  type spawned in `WAVES` — otherwise `OnPlayerEnterVehicle` force-ejects freshly seated PAX bots.
- Use `await mod.Wait()` for delays, never `setTimeout`.
- Vectors use a Y-up coordinate system.
- Godot objects need an assigned ObjId (and area triggers a `CollisionPolygon3D`) before scripting.
- Known upstream bug: `EmplacementSpawner`s spawn TOWs instead of MGs, so emplacement setup
  is currently disabled in `setup.ts`.

## Workflow Notes

- Build for distribution: `npm run build` → upload `combined.ts` to the Portal website.
- Test by loading the mod in Battlefield Portal's game-mode editor.
- See [README.md](README.md) for the current to-do list and playtest notes.
- Don't bother running tsc, it won't work - as long as 'npm run build' clears you're good
