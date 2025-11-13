import { AIBehaviorHandler } from './classes/AIBehaviorHandler';
import { PlayerHandler } from './classes/PlayerHandler';
import { CAPTURE_POINTS, INTERSPAWN_DELAY, TEAMS, VERSION, WAVES } from './constants';
import { backfillNATO, IsAIAllowedVehicle, triggerDefeat } from './helpers/helpers';
import { Setup } from './helpers/setup';
import { Wave } from './interfaces/Wave';
import { UIManager } from './UI/UIManager';

let uiManager: UIManager;

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
  PlayerHandler.OnHumanPlayerJoin(eventPlayer);
}

export async function OnPlayerLeaveGame(eventPlayer: mod.Player): Promise<void> {
  PlayerHandler.OnHumanPlayerLeave(eventPlayer);
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

async function TriggerWaveSpawns() {
  const gameTime = mod.GetMatchTimeElapsed();

  for (const wave of WAVES) {
    if (gameTime >= wave.startsAt) {
      await SpawnWave(wave);

      // Remove the wave from the list to prevent re-spawning
      WAVES.splice(WAVES.indexOf(wave), 1);
    }
  }
}

async function SpawnWave(wave: Wave) {
  console.log(`Spawning wave ${wave.waveNumber} at ${wave.startsAt} seconds`);

  // Calculate total infantry count
  const totalInfantry = wave.infantryCounts
    ? wave.infantryCounts.reduce((sum, count) => sum + count, 0)
    : 0;

  // Calculate total vehicle count
  const totalVehicles = wave.vehicleCounts
    ? wave.vehicleCounts.reduce((sum, count) => sum + count, 0)
    : 0;

  // Update UI based on wave composition
  if (wave.infantryCounts && wave.vehicleCounts) {
    uiManager.UpdateWaveInfoMixed(wave.waveNumber, totalInfantry, totalVehicles);
  } else if (wave.infantryCounts) {
    uiManager.UpdateWaveInfoInfantry(wave.waveNumber, totalInfantry);
  }

  if (wave.spawnPoints && wave.infantryCounts) {
    for (const spawnPointId of wave.spawnPoints) {
      const index = wave.spawnPoints.indexOf(spawnPointId);
      const infantryPerSpawnPoint = wave.infantryCounts[index] || 0;

      const spawnPoint = mod.GetSpawner(spawnPointId);
      for (let i = 0; i < infantryPerSpawnPoint; i++) {
        AIBehaviorHandler.SpawnAI(spawnPoint);
        await mod.Wait(INTERSPAWN_DELAY);
      }
    }

    const players = mod.AllPlayers();
    const n = mod.CountOf(players);

    for (let i = 0; i < n; i++) {
      const loopPlayer = mod.ValueInArray(players, i);

      if (mod.IsPlayerValid(loopPlayer) && mod.GetSoldierState(loopPlayer, mod.SoldierStateBool.IsAISoldier)) {
        mod.AIBattlefieldBehavior(loopPlayer);
      }
    }
  }

  if (wave.vehicleCounts && wave.vehicleSpawnPoints && wave.vehicleTypes) {
    for (const spawnPointId of wave.vehicleSpawnPoints) {
      const index = wave.vehicleSpawnPoints.indexOf(spawnPointId);
      const vehiclesPerSpawnPoint = wave.vehicleCounts[index] || 0;

      const spawnPoint = mod.GetVehicleSpawner(spawnPointId);

      for (let i = 0; i < vehiclesPerSpawnPoint; i++) {
        const vehicleType = wave.vehicleTypes[i % wave.vehicleTypes.length];
        mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
        mod.SetVehicleSpawnerAutoSpawn(spawnPoint, true);
        mod.ForceVehicleSpawnerSpawn(spawnPoint);
        await mod.Wait(INTERSPAWN_DELAY);
      }
    }
  }
}
