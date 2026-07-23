# Developing
To build the script for Portal distribution, run
```sh
npm run build
```

This will run the [charmancer](./bin/charmancer.js) to detect illegal chars, [widgetter](./bin/widgetter.js) to validate strings.json inclusion and finally the script [combiner](./bin/combine.js) to output a single TS file to upload to the Portal website you can find this at [combined.ts](./combined.ts).

# To-do
- Fix vehicle pathing
  - Might have to resort to waypoints for each spawn :(
- Flesh out waves
- Player scoring
- Upgrades for players?
- Cash system?
- Difficulty
  - UI for selecting difficulty
  - DifficultyManager class
- Number-of-players scaling
- UI?
- Out of bounds area
- SFX?
- Change vehicle types to PAX
- Driver jumps out of vehicle when they hit the spawn
- First NATO backfill runs too soon, before game has initted

Upstream blocked bugs:
- Emplacements spawn TOWS instead of MG's
  - Might be fixed, let's retry down the line

Playtest notes:
- Replace 'Wave N' with 'Next wave in' if all bots dead
- Also hide wave desc in that case?
- Remove bus ladder
- Add flag capture UI from conquest
