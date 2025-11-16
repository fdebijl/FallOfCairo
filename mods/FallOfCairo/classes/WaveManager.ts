import { FIRST_WAVE_START_TIME, INTERMISSION_DURATION_SECONDS, INTERSPAWN_DELAY, TEAMS, WAVES } from '../constants';
import { isAI, isObjectIDsEqual, triggerVictory } from '../helpers/helpers';
import { UIManager } from '../interfaces/UI/UIManager';
import { Wave } from '../interfaces/Wave';
import { BotHandler } from './BotHandler';

export class WaveManager {
  nextWaveStartsAtSeconds: number = FIRST_WAVE_START_TIME;
  uiManager: UIManager;
  waves: Wave[];
  currentWave: Wave | null = null;
  canAdvanceWave: boolean = true;

  infantryRemaining = 0;
  vehiclesRemaining = 0;

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
    this.waves = WAVES;

    // Gotta set this here for the first wave since the loop hasn't started yet
    const nextWave = this.waves[0];
    this.infantryRemaining = nextWave.infantryCounts ? nextWave.infantryCounts.reduce((sum, count) => sum + count, 0) : 0;
    this.vehiclesRemaining = nextWave.vehicleCounts ? nextWave.vehicleCounts.reduce((sum, count) => sum + count, 0) : 0;
  }

  get elapsedMatchTimeSeconds(): number {
    return mod.GetMatchTimeElapsed();
  }

  get enemyAICount(): number {
    return BotHandler.paxBotPlayerCount;
  }

  get hasNoAIAlive(): boolean {
    return this.enemyAICount === 0;
  }

  get hasAIAlive(): boolean {
    return !this.hasNoAIAlive;
  }

  get hasNoWaves(): boolean {
    return WAVES.length === 0;
  }

  get hasWaves(): boolean {
    return !this.hasNoWaves;
  }

  async DoWaveLoop() {
    for (const wave of this.waves) {
      if (this.elapsedMatchTimeSeconds >= this.nextWaveStartsAtSeconds && this.canAdvanceWave) {
        this.canAdvanceWave = false;
        await this.SpawnWave(wave);

        // Remove the wave from the list to prevent re-spawning
        this.waves.splice(this.waves.indexOf(wave), 1);
      }
    }

    if (this.hasWaves && this.hasNoAIAlive) {
      // All bots from the current wave have been killed, prepare for the next wave
      const nextWave = this.waves[0];

      if (this.nextWaveStartsAtSeconds <= this.elapsedMatchTimeSeconds) {
        // Next wave hasn't been scheduled yet, do it now
        this.nextWaveStartsAtSeconds = this.elapsedMatchTimeSeconds + INTERMISSION_DURATION_SECONDS;
        this.infantryRemaining = nextWave.infantryCounts ? nextWave.infantryCounts.reduce((sum, count) => sum + count, 0) : 0;
        this.vehiclesRemaining = nextWave.vehicleCounts ? nextWave.vehicleCounts.reduce((sum, count) => sum + count, 0) : 0;
        this.canAdvanceWave = true;
      }

      const timeUntilNextWave = this.nextWaveStartsAtSeconds - this.elapsedMatchTimeSeconds;

      if (timeUntilNextWave <= 1) {
        // Wave is gonna start between now and the next tick, hide the UI
        this.uiManager.HideWaveTime();
        await this.SetWaveDetailsUI(nextWave, true);
        return;
      } else {
        // Show the details for the upcoming wave
        this.SetWaveDetailsUI(nextWave, false);
        this.uiManager.UpdateWaveInfoTime(timeUntilNextWave);
        this.uiManager.ShowWaveTime();
      }
    } else {
      // Wave is still ongoing or there are no more waves
      if (this.currentWave) {
        await this.SetWaveDetailsUI(this.currentWave, true);
      }

      this.uiManager.HideWaveTime();
    }

    if (this.hasNoAIAlive && this.hasNoWaves) {
      triggerVictory(this.uiManager);
    }
  }

  async SpawnWave(wave: Wave) {
    console.log(`Spawning wave ${wave.waveNumber} at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);

    this.currentWave = wave;
    await this.SetWaveDetailsUI(wave, true);

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

  async SetWaveDetailsUI(wave: Wave, current: boolean) {
    if (current) {
      if (wave.infantryCounts && wave.vehicleCounts) {
        this.uiManager.UpdateWaveInfoMixed(wave.waveNumber, this.infantryRemaining, this.vehiclesRemaining);
      } else if (wave.infantryCounts) {
        this.uiManager.UpdateWaveInfoInfantry(wave.waveNumber, this.infantryRemaining);
      }
    } else {
      const totalInfantry = wave.infantryCounts ? wave.infantryCounts.reduce((sum, count) => sum + count, 0) : 0;
      const totalVehicles = wave.vehicleCounts ? wave.vehicleCounts.reduce((sum, count) => sum + count, 0) : 0;

      if (wave.infantryCounts && wave.vehicleCounts) {
        this.uiManager.UpdateNextWaveInfoMixed(wave.waveNumber, totalInfantry, totalVehicles);
      } else if (wave.infantryCounts) {
        this.uiManager.UpdateNextWaveInfoInfantry(wave.waveNumber, totalInfantry);
      }
    }
  }

  async OnPlayerDied(player: mod.Player) {
    if (isAI(player) && (mod.GetObjId(mod.GetTeam(player)) == TEAMS.PAX_ARMATA)) {
      if (this.infantryRemaining > 0) {
        this.infantryRemaining -= 1;
      }
    }
  }

  async OnVehicleDestroyed(vehicle: mod.Vehicle) {
    this.vehiclesRemaining -= 1;
  }
}
