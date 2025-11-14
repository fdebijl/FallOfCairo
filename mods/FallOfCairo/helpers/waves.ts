import { AIBehaviorHandler } from '../classes/AIBehaviorHandler';
import { TARGET_GAME_LENGTH_SECONDS, INTERSPAWN_DELAY, WAVES } from '../constants';
import { uiManager } from '../FallOfCairo';
import { Wave } from '../interfaces/Wave';
import { triggerVictory } from './helpers';

export async function SpawnWave(wave: Wave) {
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
    console.log(`Wave ${wave.waveNumber} has ${totalInfantry} infantry and ${totalVehicles} vehicles`);
    uiManager.UpdateWaveInfoMixed(wave.waveNumber, totalInfantry, totalVehicles);
  } else if (wave.infantryCounts) {
    console.log(`Wave ${wave.waveNumber} has ${totalInfantry} infantry`);
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
        console.log(`Spawning vehicle for wave ${wave.waveNumber}`);
        const vehicleType = wave.vehicleTypes[index];
        mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
        // mod.SetVehicleSpawnerAutoSpawn(spawnPoint, true);
        mod.ForceVehicleSpawnerSpawn(spawnPoint);
        await mod.Wait(INTERSPAWN_DELAY);
      }
    }
  }
}

export async function TriggerWaveSpawns() {
  const gameTime = mod.GetMatchTimeElapsed();

  for (const wave of WAVES) {
    if (gameTime >= wave.startsAt) {
      await SpawnWave(wave);

      // Remove the wave from the list to prevent re-spawning
      WAVES.splice(WAVES.indexOf(wave), 1);
    }
  }

  const aiCount = AIBehaviorHandler.botPlayerCount;
  const hasNoAIAlive = aiCount === 0;
  const hasNoWaves = WAVES.length === 0;
  const isLateGame = gameTime > TARGET_GAME_LENGTH_SECONDS - 60;
  if (hasNoAIAlive && hasNoWaves && isLateGame) {
    triggerVictory(uiManager);
  }
}

