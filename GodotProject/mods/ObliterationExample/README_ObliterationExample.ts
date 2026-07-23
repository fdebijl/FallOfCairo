/* 

The official Obliteration mode offers a Bomb pick up and a new MCOM setting.

The example .TS file provided here shows examples of how to use both in custom experiences.

Creators will be to spawn bombs through the object spawner, as well as place bombs in the
spatial editor. The following is the list of interactions for the bomb:

- Spawn Bomb
- Reset Bomb
- Drop Bomb
- Give Bomb (to a player)
- Set Bomb Fuse Time

In tandem with that change, the MCOM's can be configured to only be armable while carrying
a bomb.

You'll also be able to react to bomb state changes and query a soldier for it's current
carry state.

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL FUNCTIONS //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// Query player for has bomb
export function DoesPlayerHaveBomb(player: mod.Player) {
    var hasBomb = mod.GetSoldierState(player, mod.SoldierStateBool.HasBomb);
    return hasBomb;
}

//
// Spawn bomb through SpawnObject, can also place it in Godot
//
const BOMB_ID = 5;
mod.GetBomb(BOMB_ID);
//OR
mod.SpawnObject(mod.RuntimeSpawn_Common.Bomb, mod.CreateVector(-20, 33, 23), mod.CreateVector(0, 0, 0));

// Sets the bomb fuse time, this timer starts when the bomb is dropped. Once the timer ends the bomb will explode.
mod.SetBombDropFuseTime(mod.GetBomb(BOMB_ID), 10);

// Sets the bomb to only be accessible to team 2. Meaning only team 2 can pick it up.
mod.SetBombTeam(mod.GetBomb(BOMB_ID), mod.GetTeam(2));

// Bomb will only be visible to the attacking team.
mod.SetBombWorldIconGlobalVisibility(mod.GetBomb(BOMB_ID), false);

// Basic bomb usage
export function OnPlayerDeployed(player: mod.Player) {
    // Gives the bomb to a player, even if they are on the enemy team
    mod.GiveBombToPlayer(player, mod.GetBomb(BOMB_ID));

    // Drops the bomb at the player location, if the bomb was already dropped it starts the fuse time
    mod.ForceBombDrop(mod.GetBomb(BOMB_ID));

    // Bomb will be unspawned and spawned at the original base location
    mod.ForceBombReset(mod.GetBomb(BOMB_ID));
}

//Setting MCOM to only be able to be armed with a bomb
mod.SetMCOMArmType(mod.GetMCOM(1), mod.MCOMArmType.Bomb);

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL EVENTS /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// This will trigger when a player picks up a bomb.
export function OnBombPickedUp(eventBomb: mod.Bomb, eventPlayer: mod.Player): void {}

// This will trigger when a player drops the bomb.
export function OnBombDropped(eventBomb: mod.Bomb, eventPlayer: mod.Player): void {}

// This will trigger when a bomb changes state.
export function OnBombStateChanged(eventBomb: mod.Bomb, eventBombState: mod.BombState): void {
    switch (eventBombState) {
        case mod.BombState.Planting: {
            break;
        }
        case mod.BombState.Defusing: {
            break;
        }
        // etc.
    }
}

////////////////////////////////////////////////////////////////////////////////////////////
//////// Also check out '_StartHere_BasicTemplate' for more examples and references! ///////
////////////////////////////////////////////////////////////////////////////////////////////
