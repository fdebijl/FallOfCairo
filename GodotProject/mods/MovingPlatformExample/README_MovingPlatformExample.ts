/* 

MovingPlatform is an asset type that drastically improves player interaction replication with moving platforms.

This asset type can be pre-place in Spatial Editor and assigned an ObjId or dynamically spawned at run time via script. 

Using the two provided MoveFunctions, these assets can replicate movement patterns to create various puzzles and gameplay scenarios. 

*/

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// HOW TO INSTANTIATE MOVING PLATFORMS ///////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// Below are two ways to instantiate MovingPlatforms.

// 1. Spawn Object
export function SpawnMovingPlatform(): void {
    const testPlatformType = mod.RuntimeSpawn_Common.BarrierStoneBlock_01_H_PortalPlatform;
    const testPlatform = mod.SpawnObject(
        testPlatformType,
        mod.CreateVector(0, 0, 0), //Position
        mod.CreateVector(0, 0, 0) //Rotation
    );

    const rise = 10.0;
    const time = 3.0;

    mod.MoveObjectOverTime(testPlatform, mod.CreateVector(0, rise, 0), mod.CreateVector(0, 0, 0), time, true, true);
}

//2. Place the object 'BarrierStoneBlock_01_H_PortalPlatform' in Godot level editor and assign it an ObjId in the inspector.
export function TestPlacedPlatform(): void {
    const testObjId = 1;
    const testObj = mod.GetSpatialObject(testObjId);

    const rise = 10.0;
    const time = 3.0;

    mod.MoveObjectOverTime(testObj, mod.CreateVector(0, rise, 0), mod.CreateVector(0, 0, 0), time, true, true);
}

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// USEFUL FUNCTIONS AND EVENTS ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

// Below are two main ways to manipulate MovingPlatforms.

// Moves the Object by the delta position and rotation over the time provided. Options to loop indefinitely and reverse
export function MoveObjectOverTime(
    _object: mod.Object,
    _positionDelta: mod.Vector,
    _rotationDelta: mod.Vector,
    _timeInSeconds: number,
    _shouldLoop: boolean,
    _shouldReverse: boolean
): void {
    /* stub */
}

// Orbits the Object around the provided transform over time. Optional orbitAxis otherwise transform's up vector is used
export function OrbitObjectOverTime(
    _object: mod.Object,
    _orbitTransform: mod.Transform,
    _timeInSeconds: number,
    _radius: number,
    _shouldLoop: boolean,
    _shouldReverse: boolean,
    _clockwise: boolean
): void {
    /* stub */
}
