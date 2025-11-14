import { BotHandler } from '../classes/BotHandler';
import { TARGET_GAME_LENGTH_SECONDS, INTERSPAWN_DELAY, WAVES } from '../constants';
import { uiManager } from '../FallOfCairo';
import { Wave } from '../interfaces/Wave';
import { triggerVictory } from './helpers';

export async function SpawnWave(wave: Wave) {
  console.log(`Spawning wave ${wave.waveNumber} at ${wave.startsAt} seconds`);

  await SetWaveDetailsUI(wave);

  if (wave.spawnPoints && wave.infantryCounts) {
    for (const spawnPointId of wave.spawnPoints) {
      const index = wave.spawnPoints.indexOf(spawnPointId);
      const infantryPerSpawnPoint = wave.infantryCounts[index] || 0;

      const spawnPoint = mod.GetSpawner(spawnPointId);
      for (let i = 0; i < infantryPerSpawnPoint; i++) {
        BotHandler.SpawnAI(spawnPoint);
        await mod.Wait(INTERSPAWN_DELAY);
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

export async function SetWaveDetailsUI(wave: Wave) {
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
}

export async function DoWaveLoop() {
  const elapsedMatchTimeSeconds = mod.GetMatchTimeElapsed();
  const isLateGame = elapsedMatchTimeSeconds > TARGET_GAME_LENGTH_SECONDS - 60;
  const enemyAICount = BotHandler.paxBotPlayerCount;
  const hasNoAIAlive = enemyAICount === 0;
  const hasAIAlive = !hasNoAIAlive;
  const hasNoWaves = WAVES.length === 0;
  const hasWaves = !hasNoWaves;

  for (const wave of WAVES) {
    if (elapsedMatchTimeSeconds >= wave.startsAt) {
      await SpawnWave(wave);

      // Remove the wave from the list to prevent re-spawning
      WAVES.splice(WAVES.indexOf(wave), 1);
    }
  }

  // Show the time to next wave if all the bots from the last wave are dead
  if (hasWaves && hasNoAIAlive) {
    const nextWave = WAVES[0];
    const timeUntilNextWave = nextWave.startsAt - elapsedMatchTimeSeconds;

    if (timeUntilNextWave <= 1) {
      uiManager.HideWaveTime();
      return;
    } else {
      uiManager.UpdateWaveInfoTime(timeUntilNextWave);
      uiManager.ShowWaveTime();
    }
  } else {
    uiManager.HideWaveTime();
  }

  if (hasNoAIAlive && hasNoWaves && isLateGame) {
    triggerVictory(uiManager);
  }
}

