export async function OnGameModeStarted() {
    console.log('Log> OnGameModeStarted');

    LoopingAreaImpulse();

    LoopingAreaImpulseWithDirectionOverride();
}

async function LoopingAreaImpulse() {
    const centerPoint = mod.CreateVector(10, 31, -10);
    const radius = 8.0;
    const impulseStrength = 3000.0;
    const damage = 0.01;
    // Looping Area impulse at the 1st Pole every 0.1s
    // [Perfomance alert!!] - this is just for demonstration, please don't abuse the call,
    // as Area query, iterating objects to apply impulse are not cheap.
    while (true) {
        mod.ApplyAreaImpulseAndDamage(centerPoint, radius, impulseStrength, damage);
        await mod.Wait(0.1);
    }
}

async function LoopingAreaImpulseWithDirectionOverride() {
    const centerPoint = mod.CreateVector(10, 31, -30);
    const radius = 8.0;
    const impulseStrength = 2000.0;
    const damage = 0.01;
    const impulseDirection = mod.CreateVector(0, 1, 0);
    // Looping Area impulse at the 2nd Pole every 0.1s
    // [Perfomance alert!!] - this is just for demonstration, please don't abuse the call,
    // as Area query, iterating objects to apply impulse are not cheap.
    while (true) {
        mod.ApplyAreaImpulseAndDamage(centerPoint, radius, impulseStrength, damage, impulseDirection);
        await mod.Wait(0.1);
    }
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    // Since AreaTrigger is working on Player only, we are detecing the passenger that entering the Area to
    // trigger this impulse on Vehicle. More passengers will generate multiple impusle on the same vehicle!
    // You can avoid that by checking driver only.
    const vehicle = mod.GetVehicleFromPlayer(eventPlayer);
    const pos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
    const impulsePointInWorld = mod.Add(pos, mod.CreateVector(0.3, 0.2, 0)); // slightly offset forward the impulse point
    const impulseDirection = mod.CreateVector(1, 2, 0);
    const impulseStrength = 5000.0;
    mod.ApplyImpulse(vehicle, impulsePointInWorld, impulseDirection, impulseStrength);
}
