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
- Replace 'Wave N' with 'Next wave in' if all bots dead
- Also hide wave desc in that case?
- Add flag capture UI from conquest
