import { AIBehaviorHandler } from './classes/AIBehaviorHandler';
import { PlayerHandler } from './classes/PlayerHandler';
import { CAPTURE_POINTS, TEAMS, VERSION } from './constants';
import { isAI, IsAIAllowedVehicle, triggerDefeat } from './helpers/helpers';
import { Setup } from './helpers/setup';
import { TriggerWaveSpawns } from './helpers/waves';
import { UIManager } from './UI/UIManager';

export let uiManager: UIManager;

export async function OnGameModeStarted(): Promise<void> {
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing`);
  uiManager = new UIManager();

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const teamNato = mod.GetTeam(TEAMS.NATO);

  mod.EnableGameModeObjective(capturePoint, true);

  // Almost all of these are currently broken, seemingly
  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);

  mod.DeployAllPlayers();

  await mod.Wait(1);
  Setup(uiManager);

  // FastTick();
  SlowTick();
}

export async function OnCapturePointCaptured(capturePoint: mod.CapturePoint): Promise<void> {
  const capturePointId = mod.GetObjId(capturePoint);
  const controllingTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint));

  if (capturePointId === CAPTURE_POINTS.HUMAN_CAPTURE_POINT && controllingTeamId === TEAMS.PAX_ARMATA) {
    triggerDefeat(uiManager);
  }
}

export async function OnPlayerDeployed(player: mod.Player) {
  if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
    return AIBehaviorHandler.OnAIPlayerSpawn(player);
  } else {
    return PlayerHandler.OnHumanPlayerSpawn(player);
  }
}

export async function OnVehicleSpawned(vehicle: mod.Vehicle) {
  console.log('Vehicle spawned, checking for nearby AI to enter vehicle');
  await AIBehaviorHandler.VehicleSpawned(vehicle);
}

export async function OnPlayerEnterVehicle(player: mod.Player, vehicle: mod.Vehicle) {
  const isBot = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
  const isAIAllowedToDriveThis = IsAIAllowedVehicle(vehicle);

  if (isBot && !isAIAllowedToDriveThis) {
    await mod.Wait(0.5);
    mod.ForcePlayerExitVehicle(player);
  }
}

export async function OnPlayerJoinGame(eventPlayer: mod.Player): Promise<void> {
  if (isAI(eventPlayer)) {
    // Might want to do something for AI players here later
  } else {
    PlayerHandler.OnHumanPlayerJoin(eventPlayer);
  }
}

export async function OnPlayerLeaveGame(eventPlayer: mod.Player): Promise<void> {
  if (isAI(eventPlayer)) {
    // Might want to do something for AI players here later
  } else {
    PlayerHandler.OnHumanPlayerLeave(eventPlayer);
  }
}

// ======
// Logic
// ======

async function FastTick() {
  await mod.Wait(0.1);
}

async function SlowTick() {
  await mod.Wait(1);
  await TriggerWaveSpawns();
  SlowTick();
}
