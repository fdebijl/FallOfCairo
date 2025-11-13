import { AIBehaviorHandler } from '../classes/AIBehaviorHandler';
import { AI_SPAWN_POINTS, TEAMS } from '../constants';
import { UIManager } from '../UI/UIManager';

export function IsObjectIDsEqual(left: any, right: any) {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}

export function IsAIAllowedVehicle(vehicle: mod.Vehicle) {
  return mod.CompareVehicleName(vehicle, mod.VehicleList.M2Bradley)
  || mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams);
}

/**
 * Spawn a vehicle supply station at the given position and orientation, by having a bot deploy one.
 * Caveat 1: The position is not exact, the bot will teleport to that position and deploy the station there.
 * Play around with position and orientation to get the desired result.
 * Caveat 2: Supply stations spawned this way will only last a couple of minutes, you may want to loop this method to keep them up.
 * Caveat 3: I recommend setting `mod.AISetUnspawnOnDead(spawner, false)` on the spawner you use for this so the crate doesn't get removed when the bot dies.
 *
 * @param position The position to spawn the supply station from
 * @param orientation The orientation (in radians) to spawn the supply station towards
 * @param team The team to spawn the supply station for
 * @param spawnerId The ID of the spawner to use to spawn the bot that will deploy the supply station
 *
 * @example SpawnSupplyStation(pos, 270, mod.GetTeam(0), 200);
 * @author Fdebijl
 */
export async function spawnSupplyStation(position: mod.Vector, orientation: number, team: mod.Team, spawnerId: number = 0) {
  const spawner = mod.GetSpawner(spawnerId);
  const soldierClass = mod.SoldierClass.Engineer;
  mod.SpawnAIFromAISpawner(spawner, soldierClass, team);

  await mod.Wait(1);

  let botPlayer: mod.Player | undefined;
  const players = mod.AllPlayers();
  const playerCount = mod.CountOf(players);

  // Find our bot by looping over the most recently spawned players, this prevents us having to hook into OnPlayerDeployed
  for (let i = playerCount - 1; i >= 0; i--) {
    const player = mod.ValueInArray(players, i);
    const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
    const isEngineer = mod.IsSoldierClass(player, soldierClass);
    const playerTeam = mod.GetTeam(player);

    if (isAI && isEngineer && (mod.GetObjId(playerTeam) == mod.GetObjId(team))) {
      botPlayer = player;
      break;
    }
  }

  if (!botPlayer) {
    console.log('No AI bot found on specified team to spawn supply station');
    return;
  }

  mod.AddEquipment(botPlayer, mod.Gadgets.Deployable_Vehicle_Supply_Crate, mod.InventorySlots.GadgetOne);
  mod.Teleport(botPlayer, position, orientation);
  await mod.Wait(1);
  mod.ForceSwitchInventory(botPlayer, mod.InventorySlots.GadgetOne);
  mod.AIGadgetSettings(botPlayer, false, false, false);
  await mod.Wait(1);
  mod.AIForceFire(botPlayer, 1);
  await mod.Wait(1.1);

  mod.Kill(botPlayer);
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

/**
 * Maintains a team size of 4 players on NATO team by adding/removing AI bots as needed.
 * Safe to call repeatedly - will adjust bot count based on current human players.
 */
export async function backfillNATO(): Promise<void> {
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
      AIBehaviorHandler;
      mod.SpawnAIFromAISpawner(spawner, AIBehaviorHandler.GetSoldierClass(), AIBehaviorHandler.GetSoldierName(), natoTeam);
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
}
