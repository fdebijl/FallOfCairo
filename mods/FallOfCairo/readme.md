TODO:
- Flesh out waves
- Player scoring
- Upgrades for players?
- Cash system?
- Difficulty
  - DifficultyManager class
  - UI for selecting difficulty
- Number-of-players scaling
- UI?
- Out of bounds area

Notes:
- Vehicles dont spawn
- SpawnCam is fucked

Upstream blocked bugs:
- Emplacements spawn TOWS instead of MG's
- Setting capture point owner doesn't work

Playtest notes:
- Hide intro on death
- Waveinfo widget init text overflows
- Increase waveinfo widget opacity
- Once all bots dead, show next wave info
- Depluralize vehicles in wave info

Issue:
```js
Exception: NoMatchingOverload
Function: GetObjId
Error info:
	Provided parameters () do not match any overload. Function supports the following overloads: (Object).
QuickJS: Exception:Error: Captured stack (ignore first line of callstack)
    at <eval> (<input>:1)
    at GetObjId (native)
    at <anonymous> (main:423)
    at filter (native)
    at OnHumanPlayerLeave (main:423)
    at OnPlayerLeaveGame (main:667)
```
