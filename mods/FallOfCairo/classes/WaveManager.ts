import { FIRST_WAVE_START_TIME, INTERMISSION_ADDITIONAL_SECONDS_PER_WAVE, INTERMISSION_DURATION_SECONDS, INFANTRY_INTERSPAWN_DELAY, TEAMS, WAVES, VEHICLE_INTERSPAWN_DELAY, WAVE_CLEARED_ANNOUNCEMENT_SECONDS, AUTOSPOT_BOT_COUNT } from '../constants';
import { isAI, isObjectIDsEqual, triggerVictory } from '../helpers/helpers';
import { UIManager } from '../interfaces/UI/UIManager';
import { Wave } from '../interfaces/Wave';
import { BotHandler } from './BotHandler';
import { VehicleHandler } from './VehicleHandler';

export class WaveManager {
  nextWaveStartsAtSeconds: number = FIRST_WAVE_START_TIME;
  uiManager: UIManager;
  waves: Wave[];
  currentWave: Wave | null = null;
  canAdvanceWave: boolean = true;
  isSpawning: boolean = false;
  elapsedWaves = 0;
  lastWaveStartedAt = 0;

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

  get elapsedWaveTimeSeconds(): number {
    return this.elapsedMatchTimeSeconds - this.lastWaveStartedAt;
  }

  get enemyAICount(): number {
    return BotHandler.paxBotPlayerCount;
  }

  get hasNoAIAlive(): boolean {
    return this.enemyAICount === 0;
  }

  get hasFewAIAlive(): boolean {
    return this.enemyAICount <= AUTOSPOT_BOT_COUNT && this.enemyAICount > 0;
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
    // Waves are chronological and only one can ever be pending, so waves[0] is the
    // only candidate. Removing it up front keeps hasWaves accurate while it spawns.
    const pendingWave = this.waves[0];

    if (pendingWave && this.canAdvanceWave && this.elapsedMatchTimeSeconds >= this.nextWaveStartsAtSeconds) {
      // Case: time to spawn the next wave

      this.canAdvanceWave = false;
      this.waves.splice(0, 1);
      this.elapsedWaves++;
      this.lastWaveStartedAt = this.elapsedMatchTimeSeconds;

      // Deliberately not awaited: spawning a wave takes infantryCount *
      // INFANTRY_INTERSPAWN_DELAY seconds, which would stall this whole tick loop
      // (and with it the UI and the victory check) for minutes at a time. isSpawning
      // is set synchronously inside SpawnWave, before the first await, so the checks
      // below already see it on this pass.
      this.SpawnWave(pendingWave);
    }

    if (this.hasWaves && this.hasNoAIAlive && !this.isSpawning) {
      // Case: all bots from the current wave have been killed, prepare for the next wave
      const nextWave = this.waves[0];

      if (this.nextWaveStartsAtSeconds <= this.elapsedMatchTimeSeconds) {
        // Scheduling the next wave pushes nextWaveStartsAtSeconds into the future, so
        // this branch runs exactly once per cleared wave - the right spot to announce it.
        this.AnnounceWaveCleared();

        // Next wave hasn't been scheduled yet, do it now
        this.nextWaveStartsAtSeconds = this.elapsedMatchTimeSeconds + INTERMISSION_DURATION_SECONDS + (INTERMISSION_ADDITIONAL_SECONDS_PER_WAVE * this.elapsedWaves);
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
      // Wave is still ongoing (hasAiAlive) or there are no more waves (hasNoWaves)
      if (this.currentWave) {
        await this.SetWaveDetailsUI(this.currentWave, true);
      }

      // Spot the last few bots if the wave has been going on for a bit
      if (this.hasFewAIAlive && this.elapsedWaveTimeSeconds >= 60) {
        BotHandler.SpotAllBots();
      }

      this.uiManager.HideWaveTime();
    }

    // isSpawning guards against the final wave winning the match the instant it starts,
    // before any of its bots have registered as alive.
    if (this.hasNoAIAlive && this.hasNoWaves && !this.isSpawning) {
      triggerVictory(this.uiManager);
    }
  }

  private AnnounceWaveCleared() {
    if (!this.currentWave) {
      return;
    }

    console.log(`Wave ${this.currentWave.waveNumber} cleared at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);

    // Not awaited: the banner stays up for WAVE_CLEARED_ANNOUNCEMENT_SECONDS, which
    // would otherwise stall the tick loop for the length of the announcement.
    this.uiManager.AnnounceWaveCleared(this.currentWave.waveNumber, WAVE_CLEARED_ANNOUNCEMENT_SECONDS);
  }

  async DoBeforeSpawnWave() {
    VehicleHandler.DestroyVehicles();
  }

  async SpawnWave(wave: Wave) {
    console.log(`Spawning wave ${wave.waveNumber} at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);

    this.isSpawning = true;
    this.currentWave = wave;

    try {
      await this.SetWaveDetailsUI(wave, true);

      await this.DoBeforeSpawnWave();

      this.SpawnWaveVehicles(wave);
      await this.SpawnWaveInfantry(wave);
    } finally {
      // Nobody awaits SpawnWave, so a throw here would otherwise leave isSpawning
      // stuck and the wave loop deadlocked.
      this.isSpawning = false;
    }
  }

  private async SpawnWaveInfantry(wave: Wave) {
    if (!wave.spawnPoints || !wave.infantryCounts) {
      return;
    }

    const maxInfantryCount = Math.max(...wave.infantryCounts);
    let hasSpawnedAny = false;

    for (let round = 0; round < maxInfantryCount; round++) {
      for (let index = 0; index < wave.spawnPoints.length; index++) {
        const infantryPerSpawnPoint = wave.infantryCounts[index] || 0;

        if (round < infantryPerSpawnPoint) {
          // Delay before the spawn rather than after it, so we don't idle for an
          // extra INFANTRY_INTERSPAWN_DELAY once the final bot is out.
          if (hasSpawnedAny) {
            await mod.Wait(INFANTRY_INTERSPAWN_DELAY);
          }

          const spawnPoint = mod.GetSpawner(wave.spawnPoints[index]);
          // Awaited so the AI-cap backoff inside SpawnAI stalls this loop instead of
          // spawning a pile of detached retries that burst past the interspawn delay.
          await BotHandler.SpawnAI(spawnPoint);
          hasSpawnedAny = true;
        }
      }
    }
  }

  private async SpawnWaveVehicles(wave: Wave) {
    if (wave.vehicleCounts && wave.vehicleSpawnPoints && wave.vehicleTypes) {
      const maxVehicleCount = Math.max(...wave.vehicleCounts);

      for (let round = 0; round < maxVehicleCount; round++) {
        for (const spawnPointId of wave.vehicleSpawnPoints) {
          const index = wave.vehicleSpawnPoints.indexOf(spawnPointId);
          const vehiclesPerSpawnPoint = wave.vehicleCounts[index] || 0;

          if (round < vehiclesPerSpawnPoint) {
            console.log(`Spawning vehicle for wave ${wave.waveNumber} at ${Math.round(this.elapsedMatchTimeSeconds)} seconds`);
            const spawnPoint = mod.GetVehicleSpawner(spawnPointId);
            const vehicleType = wave.vehicleTypes[index];
            mod.SetVehicleSpawnerVehicleType(spawnPoint, vehicleType);
            mod.ForceVehicleSpawnerSpawn(spawnPoint);
          }
        }

        if (round < maxVehicleCount - 1) {
          await mod.Wait(VEHICLE_INTERSPAWN_DELAY);
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
