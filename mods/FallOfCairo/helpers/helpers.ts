import { BotHandler } from '../classes/BotHandler';
import { AI_SPAWN_POINTS, TEAMS } from '../constants';
import { UIManager } from '../interfaces/UI/UIManager';

export function isAI(player: mod.Player): boolean {
  if (!player) {
    return true;
  }

  return mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
}

export function isObjectIDsEqual(left: mod.Object, right: mod.Object): boolean {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}

export function IsAIAllowedVehicle(vehicle: mod.Vehicle) {
  return mod.CompareVehicleName(vehicle, mod.VehicleList.M2Bradley)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams);
}

export async function triggerDefeat(uiManager: UIManager) {
  const team = mod.GetTeam(TEAMS.PAX_ARMATA);
  uiManager.ShowDefeatWidget();
  freezePlayers();
  await mod.Wait(10);
  mod.EndGameMode(team);
}

export async function triggerVictory(uiManager: UIManager) {
  const team = mod.GetTeam(TEAMS.NATO);
  uiManager.ShowVictoryWidget();
  freezePlayers();
  await mod.Wait(10);
  mod.EndGameMode(team);
}

export function freezePlayers(): void {
  const players = mod.AllPlayers();
  const playerCount = mod.CountOf(players);

  for (let i = 0; i < playerCount; i++) {
    const player = mod.ValueInArray(players, i);
    const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

    if (isAI) {
      mod.AIEnableTargeting(player, false);
      mod.AIIdleBehavior(player);
    } else {
      mod.EnableAllInputRestrictions(player, true);
    }
  }
}

export function unfreezePlayers(): void {
  const players = mod.AllPlayers();
  const playerCount = mod.CountOf(players);

  for (let i = 0; i < playerCount; i++) {
    const player = mod.ValueInArray(players, i);
    const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

    if (isAI) {
      mod.AIEnableTargeting(player, true);
      mod.AIBattlefieldBehavior(player);
    } else {
      mod.EnableAllInputRestrictions(player, false);
    }
  }
}

let isBackFillRunning = false;

/**
 * Maintains a team size of 4 players on NATO team by adding/removing AI bots as needed.
 * Safe to call repeatedly - will adjust bot count based on current human players.
 */
export async function backfillNATO(): Promise<void> {
  if (isBackFillRunning) {
    return;
  }

  isBackFillRunning = true;

  try {
    const TARGET_TEAM_SIZE = 4;
    const natoTeam = mod.GetTeam(TEAMS.NATO);

    const allPlayers = mod.AllPlayers();
    const playerCount = mod.CountOf(allPlayers);

    let natoHumanCount = 0;
    let natoBots: mod.Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      const player = mod.ValueInArray(allPlayers, i);
      const playerTeam = mod.GetTeam(player);

      // Check if player is on NATO team
      if (mod.GetObjId(playerTeam) === mod.GetObjId(natoTeam)) {
        const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

        if (isAI) {
          natoBots.push(player);
        } else {
          natoHumanCount++;
        }
      }
    }

    const currentNATOCount = natoHumanCount + natoBots.length;
    const botsNeeded = TARGET_TEAM_SIZE - currentNATOCount;

    if (botsNeeded > 0) {
      console.log(`Spawning ${botsNeeded} NATO bots (current: ${currentNATOCount}, humans: ${natoHumanCount})`);

      const spawner = mod.GetSpawner(AI_SPAWN_POINTS.NATO);

      for (let i = 0; i < botsNeeded; i++) {
        mod.SpawnAIFromAISpawner(spawner, BotHandler.GetSoldierClass(), BotHandler.GetSoldierName(), natoTeam);
        await mod.Wait(2);
      }
    } else if (botsNeeded < 0) {
      const botsToRemove = Math.abs(botsNeeded);
      console.log(`Removing ${botsToRemove} NATO bots (current: ${currentNATOCount}, humans: ${natoHumanCount})`);

      for (let i = 0; i < botsToRemove && i < natoBots.length; i++) {
        mod.Kill(natoBots[i]);
      }
    } else {
      console.log(`NATO team at target size: ${currentNATOCount} (${natoHumanCount} humans, ${natoBots.length} bots)`);
    }
  } catch (error) {
    console.log('Error in backfillNATO:', error);
  } finally {
    isBackFillRunning = false;
  }
}
