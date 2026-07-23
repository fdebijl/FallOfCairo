# Copilot Instructions for Fall of Cairo (Portal SDK Mod)

## Project Overview

This is a **Battlefield Portal mod** written in TypeScript using the Portal SDK. Portal is a game mode creator for Battlefield where custom game logic is implemented via event-driven TypeScript that interfaces with game objects placed in Godot scenes.

## Architecture & Core Concepts

### Event-Driven System
All game logic is built around exported event handler functions. The Portal runtime calls these functions when specific game events occur:

```typescript
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {}
export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, ...): void {}
export async function OnGameModeStarted() {}
```

**Critical**: Event handlers MUST be exported functions with exact names matching the Portal API (see `Template.ts` for common events).

### Object Reference System
Game objects (spawn points, capture zones, triggers) are placed in Godot scenes and referenced by numeric IDs:

```typescript
const hq = mod.GetHQ(0);  // Get HQ with ObjId 0
const capturePoint = mod.GetCapturePoint(0);
const objId = mod.GetObjId(capturePoint);  // Get ID from object
```

Objects must be configured in Godot with:
- An assigned `ObjId` for script reference
- Required components (e.g., `HQArea`, `CapturePointArea`, `CollisionPolygon3D`)

### Type System & Opaque Types
`index.d.ts` defines the Portal API with opaque types (not directly constructible):

```typescript
export type Player = { _opaque: typeof PlayerSymbol };
export type CapturePoint = { _opaque: typeof CapturePointSymbol };
```

Objects are obtained through API functions (`mod.GetPlayer()`, `mod.GetCapturePoint()`), never instantiated directly. The `mod` import is injected automatically by the game runtime, no need to import it.

## Key Development Patterns

### Async/Await for Timing
Use `async`/`await` with `mod.Wait()` for sequential logic with delays:

```typescript
export async function OnGameModeStarted() {
    await mod.Wait(5);  // Wait 5 seconds for initialization
    mod.Teleport(player, position, angle);
}
```

### Vector Operations
3D positions/directions use `mod.CreateVector(x, y, z)`:
- X = left/right
- Y = up/down  
- Z = forward/back

Extract components with `mod.XComponentOf()`, `mod.YComponentOf()`, `mod.ZComponentOf()`.

### Team & Player Management
```typescript
const team = mod.GetTeam(player);  // Get player's team
const teamObj = mod.GetTeam(0);    // Get team by ID (0 or 1)
```

### Message Display
Three scopes for notifications:
```typescript
mod.DisplayNotificationMessage(msg);           // All players
mod.DisplayNotificationMessage(msg, player);   // Single player
mod.DisplayNotificationMessage(msg, team);     // Team only
```

## API Discovery

**Primary Reference**: `index.d.ts` contains the complete Portal API with ~16,000 lines of type definitions, enums, and function signatures. Always search this file when looking for:
- Available functions for game objects
- Enum values (weapons, gadgets, maps, factions)
- Event handler signatures
- Object types and their capabilities

**Template Reference**: `Template.ts` contains annotated examples of common patterns and frequently used events.

## Entry Point

Your mod's logic starts in `FallOfCairo.ts`. This file should export event handlers that implement your custom game mode logic.

## Common Gotchas

- Event handlers must be **exported** with **exact API names**
- Game objects need Godot scene setup with ObjIds before scripting
- Use `await mod.Wait()` for initialization delays, not `setTimeout()`
- Vectors use Y-up coordinate system
- Area triggers require `CollisionPolygon3D` components in Godot
- String localization uses `mod.stringkeys` (see `index.d.ts` enums)

## Workflow Notes

- No build/compile commands needed in this workspace context
- TypeScript provides autocomplete for the `mod` namespace
- Test by loading the mod in Battlefield Portal's game mode editor

## Mod context
- Human players will be in Team 1 (NATO)
- AI bots will be in Team 2 (PAX Forces)
- The concept is a defensive scenario where human players defend Cairo from AI invaders, sort of like CoD Zombies