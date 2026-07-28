# Developing
To build the script for Portal distribution, run
```sh
npm run build
```

This will run the [charmancer](./bin/charmancer.js) to detect illegal chars, [widgetter](./bin/widgetter.js) to validate strings.json inclusion and finally the script [combiner](./bin/combine.js) to output a single TS file to upload to the Portal website you can find this at [combined.ts](./combined.ts).

# To-do

## Features
- Flesh out cap area with more cover and fun verticality
- Difficulty
  - UI for selecting difficulty
  - DifficultyManager class
- Number-of-players scaling
  - With 1 human player, the bots should be pretty tame - maybe the enemy count could be reduced as well
- Ensure waves are balanced
- Player scoring
  - Track their bot kills, vehicle kills and potentially flag defenses
- Upgrades for players?
  - Some kind of system for players to upgrade their capabilities
  - More weapons, better armor, etc.
- Cash system?
  - Buy killstreaks, more emplacements or even vehicles
- Out of bounds area
- UI?
- SFX?

## Bugs
- First NATO backfill runs too soon, before game has initted

Upstream blocked bugs:
- Emplacements spawn TOWS instead of MG's
  - Might be fixed, let's retry down the line

## Playtest notes

### Playtest 1
- Replace 'Wave N' with 'Next wave in' if all bots dead
- Also hide wave desc in that case?
- Add flag capture UI from conquest
  - When on point, there's no feedback you're capping

### Playtest 2
- Destroy PAX vehicles at end of wave
- Give humans vehicles as well?
  - Probably not
- Add more emplacements along road
- ~~More time between waves~~
- ~~MG crossroads hovers (one inch), too far back (one inch)~~
- ~~Side apartment MG is too high (two inches)~~
- ~~Mosque spawn no longer works because the map geometry changed, vehicles get stuck~~
  - No longer using this spawn, maybe remove it?
- ~~Enemy infantry counter gets stuck at 5 for large waves~~
  - Hopefully fixed with the do-wave-logic await bug
- ~~Is interspawn delay respected??~~
- Add end of wave 'WAVE CLEARED' announcement or sum
- Additional time method doesn't work - waveElapsed not respected?
- Encase TOW's more
- Retaking the point is not fun, add more paths
- Auto-recap flag after wave
  - Or not? Recapping is pretty fun
- More cover for bots, especially main street spawn
