export function OnGameModeStarted(): void {
    RotatingLift();
    void SpawnWavePattern();
    void SpawnStepsPattern();
}

function RotatingLift(): void {
    const placedObjId1 = 1;
    const placedObjId2 = 2;
    const placedObjId3 = 3;

    const placedObj1 = mod.GetSpatialObject(placedObjId1);
    const placedObj2 = mod.GetSpatialObject(placedObjId2);
    const placedObj3 = mod.GetSpatialObject(placedObjId3);

    const rise = 10.0;
    const time = 3.0;

    mod.MoveObjectOverTime(placedObj1, mod.CreateVector(0, rise, 0), mod.CreateVector(0, 0, 90), time, true, true);
    mod.MoveObjectOverTime(placedObj2, mod.CreateVector(0, rise, 0), mod.CreateVector(0, 0, 90), time, true, true);
    mod.MoveObjectOverTime(placedObj3, mod.CreateVector(0, rise, 0), mod.CreateVector(0, 0, 90), time, true, true);
}

async function SpawnWavePattern(): Promise<void> {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const platform = mod.SpawnObject(
                mod.RuntimeSpawn_Common.BarrierStoneBlock_01_H_PortalPlatform,
                mod.CreateVector(i * 3.9, 37 + i, j * 5.2),
                mod.CreateVector(0, 0, 0)
            );
            mod.MoveObjectOverTime(platform, mod.CreateVector(0, 6, 0), mod.CreateVector(0, 0, 0), Math.random() * 4 + 0.5, true, true);
        }
        await mod.Wait(0.1);
    }

    for (let i = 0; i < 15; i++) {
        void SpawnEscalatorSteps(mod.RuntimeSpawn_Common.BarrierStoneBlock_01_H_PortalPlatform, mod.CreateVector(40, 45, 20), mod.CreateVector(65, 55, 20));
        await mod.Wait(1.2);
    }
}

async function SpawnEscalatorSteps(objectType: mod.Any, startPos: mod.Vector, endPos: mod.Vector): Promise<void> {
    const step = mod.SpawnObject(objectType, startPos, mod.CreateVector(0, 0, 0));
    const up = mod.CreateVector(0, mod.YComponentOf(mod.Subtract(endPos, startPos)), 0);
    const down = mod.CreateVector(0, mod.YComponentOf(mod.Subtract(startPos, endPos)), 0);
    const right = mod.CreateVector(0, 0, 7);
    const left = mod.CreateVector(0, 0, -7);
    while (true) {
        mod.MoveObjectOverTime(step, up, mod.CreateVector(0, 0, 0), 8, false, false);
        await mod.Wait(8.1);
        mod.MoveObjectOverTime(step, left, mod.CreateVector(0, 0, 0), 1, false, false);
        await mod.Wait(1.1);
        mod.MoveObjectOverTime(step, down, mod.CreateVector(0, 0, 0), 8, false, false);
        await mod.Wait(8.1);
        mod.MoveObjectOverTime(step, right, mod.CreateVector(0, 0, 0), 1, false, false);
        await mod.Wait(1.1);
    }
}

async function SpawnStepsPattern(): Promise<void> {
    const platformPrefab = mod.RuntimeSpawn_Common.BarrierStoneBlock_01_H_PortalPlatform;

    const originX = 66;
    const originY = 56;
    const originZ = 21;

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX, originY, originZ), mod.CreateVector(0, 0, 0));

    for (let i = 0; i < 4; i++) {
        const x = originX;
        const y = originY + i * 2.5;
        const z = originZ + 7 + i * 6;

        const platform = mod.SpawnObject(platformPrefab, mod.CreateVector(x, y, z), mod.CreateVector(0, 0, 0));

        const rise = 3 + i * 0.6;
        const time = 2.0 + i * 0.4;

        mod.MoveObjectOverTime(platform, mod.CreateVector(0, rise, 0), mod.CreateVector(0, 0, 0), time, true, true);

        await mod.Wait(0.15);
    }

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX, originY + 9, originZ + 34), mod.CreateVector(0, 0, 0), mod.CreateVector(2, 2, 2));

    for (let i = 0; i < 3; i++) {
        const x = originX + (-8 + i * 7);
        const y = originY + 11 + i;
        const z = originZ + 44 + i * 7;

        const platform = mod.SpawnObject(platformPrefab, mod.CreateVector(x, y, z), mod.CreateVector(0, 0, 0));

        const moveX = i % 2 === 0 ? 7 : -7;
        const duration = 2.5 + i * 0.75;

        mod.MoveObjectOverTime(platform, mod.CreateVector(moveX, 0, 0), mod.CreateVector(0, 0, 0), duration, true, true);

        await mod.Wait(0.2);
    }

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX, originY + 14, originZ + 68), mod.CreateVector(0, 0, 0), mod.CreateVector(2, 2, 2));

    for (let i = 0; i < 5; i++) {
        const x = originX + (i % 2 === 0 ? -3 : 3);
        const y = originY + 16 + i;
        const z = originZ + 76 + i * 6;

        const platform = mod.SpawnObject(platformPrefab, mod.CreateVector(x, y, z), mod.CreateVector(0, 0, 0));

        const delay = i * 0.5;
        void AlternatingLift(platform, 4 + i * 0.4, 2.2, delay);
    }

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX, originY + 25, originZ + 108), mod.CreateVector(0, 0, 0), mod.CreateVector(2, 2, 2));

    const orbitCenterX = originX;
    const orbitCenterY = originY + 26;
    const orbitCenterZ = originZ + 124;

    mod.SpawnObject(platformPrefab, mod.CreateVector(orbitCenterX, orbitCenterY, orbitCenterZ), mod.CreateVector(0, 0, 0));

    const orbitRadius = 8;

    for (let i = 0; i < 4; i++) {
        const platform = mod.SpawnObject(
            platformPrefab,
            mod.CreateVector(orbitCenterX + orbitRadius, orbitCenterY + i * 1.5, orbitCenterZ),
            mod.CreateVector(0, 0, 0)
        );

        mod.OrbitObjectOverTime(
            platform,
            mod.CreateTransform(mod.CreateVector(orbitCenterX, orbitCenterY + i * 1.5, orbitCenterZ), mod.CreateVector(0, 0, 0)),
            8 - i * 1.2,
            orbitRadius + i * 2.5,
            true,
            false,
            i % 2 === 0
        );

        await mod.Wait(0.6);
    }

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX, originY + 32, originZ + 148), mod.CreateVector(0, 0, 0), mod.CreateVector(2, 2, 2));

    for (let i = 0; i < 6; i++) {
        const startPos = mod.CreateVector(originX + (-8 + i * 3), originY + 34 + i, originZ + 156 + i * 4);

        const endPos = mod.CreateVector(originX + (-2 + i * 3), originY + 42 + i, originZ + 162 + i * 4);

        void LoopEscalatorStep(platformPrefab, startPos, endPos);
        await mod.Wait(0.9);
    }

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX + 12, originY + 46, originZ + 190), mod.CreateVector(0, 0, 0), mod.CreateVector(2, 2, 2));

    let height = originY + 48;
    let radius = 4;
    let loopTime = 10;
    let clockwise = true;

    const spiralCenterX = originX + 10;
    const spiralCenterZ = originZ + 205;

    while (radius < 24) {
        const platform = mod.SpawnObject(platformPrefab, mod.CreateVector(spiralCenterX + radius, height, spiralCenterZ), mod.CreateVector(0, 0, 0));

        mod.OrbitObjectOverTime(
            platform,
            mod.CreateTransform(mod.CreateVector(spiralCenterX, height, spiralCenterZ), mod.CreateVector(0, 0, 0)),
            loopTime,
            radius,
            true,
            false,
            clockwise
        );

        height += 2.2;
        radius += 3.0;
        loopTime -= 1;

        if (loopTime < 4) {
            loopTime = 4;
        }

        clockwise = !clockwise;

        await mod.Wait(0.8);
    }

    mod.SpawnObject(platformPrefab, mod.CreateVector(originX + 10, originY + 55, originZ + 240), mod.CreateVector(0, 0, 0), mod.CreateVector(3, 3, 3));
}

async function AlternatingLift(platform: mod.Any, height: number, duration: number, initialDelay: number): Promise<void> {
    if (initialDelay > 0) {
        await mod.Wait(initialDelay);
    }

    while (true) {
        mod.MoveObjectOverTime(platform, mod.CreateVector(0, height, 0), mod.CreateVector(0, 0, 0), duration, false, false);
        await mod.Wait(duration + 0.1);

        mod.MoveObjectOverTime(platform, mod.CreateVector(0, -height, 0), mod.CreateVector(0, 0, 0), duration, false, false);
        await mod.Wait(duration + 0.1);
    }
}

async function LoopEscalatorStep(objectType: mod.Any, startPos: mod.Vector, endPos: mod.Vector): Promise<void> {
    const step = mod.SpawnObject(objectType, startPos, mod.CreateVector(0, 0, 0));

    const up = mod.CreateVector(0, mod.YComponentOf(mod.Subtract(endPos, startPos)), 0);
    const down = mod.CreateVector(0, mod.YComponentOf(mod.Subtract(startPos, endPos)), 0);
    const sideA = mod.CreateVector(0, 0, 6);
    const sideB = mod.CreateVector(0, 0, -6);

    while (true) {
        mod.MoveObjectOverTime(step, up, mod.CreateVector(0, 0, 0), 5.5, false, false);
        await mod.Wait(5.6);

        mod.MoveObjectOverTime(step, sideA, mod.CreateVector(0, 0, 0), 0.9, false, false);
        await mod.Wait(1.0);

        mod.MoveObjectOverTime(step, down, mod.CreateVector(0, 0, 0), 5.5, false, false);
        await mod.Wait(5.6);

        mod.MoveObjectOverTime(step, sideB, mod.CreateVector(0, 0, 0), 0.9, false, false);
        await mod.Wait(1.0);
    }
}
