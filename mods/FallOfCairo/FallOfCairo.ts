import { AIBehaviorHandler } from './classes/AIBehaviorHandler';
import { PlayerHandler } from './classes/PlayerHandler';
import { CAPTURE_POINTS, INTERSPAWN_DELAY, TEAMS, VERSION, WAVES } from './constants';
import { Setup } from './helpers/setup';
import { Wave } from './interfaces/Wave';

export async function OnGameModeStarted(): Promise<void> {
  await mod.Wait(5);

  console.log(`Fall of Cairo v${VERSION} initializing`);
  mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.announcementTitle, VERSION));

  const capturePoint = mod.GetCapturePoint(CAPTURE_POINTS.HUMAN_CAPTURE_POINT);
  const teamNato = mod.GetTeam(TEAMS.NATO);

  mod.EnableGameModeObjective(capturePoint, true);

  mod.SetCapturePointCapturingTime(capturePoint, 5);
  mod.SetCapturePointNeutralizationTime(capturePoint, 5);
  mod.SetMaxCaptureMultiplier(capturePoint, 1);
  mod.SetCapturePointOwner(capturePoint, teamNato);

  mod.DeployAllPlayers();

  Setup();
  await mod.Wait(5);

  // FastTick();
  SlowTick();
}

export async function OnCapturePointCaptured(capturePoint: mod.CapturePoint): Promise<void> {
  console.log('Capture point captured, checking conditions');
  const capturePointId = mod.GetObjId(capturePoint);
  const controllingTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint));

  if (capturePointId === CAPTURE_POINTS.HUMAN_CAPTURE_POINT && controllingTeamId === TEAMS.PAX_ARMATA) {
    const teamPax = mod.GetTeam(TEAMS.PAX_ARMATA);
    console.log('Team 2 captured the point, ending game mode with defeat for humans.');
    mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.announcementDefeat));
    await mod.Wait(5);
    mod.EndGameMode(teamPax);
  }
}


export async function OnPlayerDeployed(player: mod.Player) {
  if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
    console.log('AI Player deployed, setting up behavior');
    AIBehaviorHandler.OnAIPlayerSpawn(player);
    return;
  } else {
    PlayerHandler.OnHumanPlayerSpawn(player);
    console.log('Human Player deployed, setup complete');
    return;
  }
}

export async function OnVehicleSpawned(vehicle: mod.Vehicle) {
  console.log('Vehicle spawned, checking for nearby AI to enter vehicle');
  await AIBehaviorHandler.VehicleSpawned(vehicle);
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
  console.log(`Spawning wave at ${wave.startsAt} seconds`);

  if (wave.infantryCount && wave.spawnPoints) {
    const infantryPerSpawnPoint = Math.floor(wave.infantryCount / wave.spawnPoints.length);

    for (const spawnPointId of wave.spawnPoints) {
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

  if (wave.vehicleCount && wave.vehicleSpawnPoints && wave.vehicleTypes) {
    const vehiclesPerSpawnPoint = Math.floor(wave.vehicleCount / wave.vehicleSpawnPoints.length);

    for (const spawnPointId of wave.vehicleSpawnPoints) {
      const spawnPoint = mod.GetVehicleSpawner(spawnPointId);

      for (let i = 0; i < vehiclesPerSpawnPoint; i++) {
        const vehicleType = wave.vehicleTypes[i % wave.vehicleTypes.length];
        mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
        mod.ForceVehicleSpawnerSpawn(spawnPoint);
        await mod.Wait(2); // Small delay between spawns
      }
    }
  }
}
