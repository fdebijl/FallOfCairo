export interface Wave {
  startsAt: number; // in seconds
  spawnPoints?: number[]; // AI spawn point IDs
  infantryCount?: number; // Total number of infantry to spawn for this wave
  vehicleCount?: number; // Total number of vehicles to spawn for this wave
  vehicleTypes?: mod.VehicleList[]; // Types of vehicles to spawn
  vehicleSpawnPoints?: number[]; // Vehicle spawn point IDs
}
