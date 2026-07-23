let gadgetIdx: number = 0;
let playerFacingDirection: number = 0;
const maxDistance: number = 100;
let isAiming: boolean = false;
let isEnabled: boolean = true;

const interactPoint1 = 1
const interactPoint2 = 2

//Switch
let currentSwitchMode: number = 1;

mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);

export function OnGameModeStarted() {
    console.log("Started")
	mod.SetWorldIconText(mod.GetWorldIcon(interactPoint1), mod.Message(mod.stringkeys.activateTeleport));
	mod.SetWorldIconText(mod.GetWorldIcon(interactPoint2), mod.Message(mod.stringkeys.activateObjectSpawner));
}

export function OnPlayerDeployed(player: mod.Player) {
    console.log('OnPlayerDeployed');

    console.log('==========================================');
    console.log('============ PORTAL GADGET TEST ==========');
    console.log('==========================================');

    mod.AddEquipment(player, mod.Gadgets.Misc_PortalGadget);

    mod.SpawnLoot(mod.GetLootSpawner(1), mod.Gadgets.Misc_PortalGadget);
}

function UnpackLogVector(vec: mod.Vector): string {
    return `${mod.XComponentOf(vec)},${mod.YComponentOf(vec)},${mod.ZComponentOf(vec)}`;
}

function GetRayCastVectors(player: mod.Player): { startPoint: mod.Vector; endPoint: mod.Vector} {
    const facingDirection = mod.Normalize(mod.GetSoldierState(player, mod.SoldierStateVector.GetFacingDirection));
    const startPoint = mod.Add(mod.GetSoldierState(player, mod.SoldierStateVector.EyePosition), facingDirection); // offset to prevent raycast self colliding
    const endPoint = mod.Add(startPoint, mod.Multiply(facingDirection, maxDistance));

    playerFacingDirection = Math.atan2(mod.XComponentOf(facingDirection), mod.ZComponentOf(facingDirection));

    console.log('Start point: ', UnpackLogVector(startPoint));
    console.log('Facing direction: ', UnpackLogVector(facingDirection));
    console.log('End point: ', UnpackLogVector(endPoint));

    return { startPoint, endPoint };
}

export function OnPortalGadgetFireStart(player: mod.Player) {
    if (!isEnabled) {
        return;
    }

    switch (currentSwitchMode) {
        case 1: {
            console.log("Fire Mode 1");
            const { startPoint, endPoint } = GetRayCastVectors(player);
            mod.RayCast(player, startPoint, endPoint);

            break;
        }
        case 2: {
            console.log("Fire Mode 2");
            const { startPoint, endPoint } = GetRayCastVectors(player);
            mod.RayCast(player, startPoint, endPoint);

            break;
        }
        case 3:
            console.log("Fire Mode 3");
            break;
        default:
            console.log("Defaulting to Switch Mode 1");
            break;
    }
}

export async function OnRayCastHit(eventPlayer: mod.Player, eventPoint: mod.Vector, eventNormal: mod.Vector) {
    switch (currentSwitchMode) {
        case 1: {
            const teleportSound: mod.SFX = mod.SpawnObject(
                mod.RuntimeSpawn_Common.SFX_Gadgets_Defibrillator_Equipped_Fire_OneShot2D,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(1, 1, 1)
            );

            console.log('Raycast hit at: ', UnpackLogVector(eventPoint));
            mod.Teleport(eventPlayer, eventPoint, playerFacingDirection);
            mod.PlaySound(teleportSound, 1, eventPlayer);
            break;            
        }
        case 2: {
            const spawnObjectSound: mod.SFX = mod.SpawnObject(
                mod.RuntimeSpawn_Common.SFX_GameModes_BR_Mission_CTF_DataDrive_Insert_OneShot3D,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(1, 1, 1)
            );

            const facingDirection = mod.Normalize(mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetFacingDirection));
            let objectToSpawn = mod.SpawnObject(mod.RuntimeSpawn_Sand.ACModule_01, eventPoint, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1))
            break;
        }
        case 3: {
            break;
        }
    }
}

export function OnRayCastMissed(eventPlayer: mod.Player) {
    const teleportFailSound: mod.SFX = mod.SpawnObject(
        mod.RuntimeSpawn_Common.SFX_Gadgets_Defibrillator_Equipped_Fire_Miss_OneShot2D,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1, 1, 1)
    );

    ShowMessagePopup(eventPlayer, 'Max range exceeded.');
    mod.PlaySound(teleportFailSound, 1, eventPlayer);
}

export function OnPortalGadgetAimStart(player: mod.Player) {
    isAiming = true;
}

export function OnPortalGadgetAimStop(player: mod.Player) {
    isAiming = false;
}

export function OnPortalGadgetFireStop(player: mod.Player) {
    //ShowMessagePopup(player, 'Fire Stopped');
    console.log("Fire Stopped")
}

export function OnPortalGadgetLaserToggle(player: mod.Player, isLaserActive: boolean) {
    ShowMessagePopup(player, isLaserActive ? 'PortalGadget ON' : 'PortalGadget OFF');
    isEnabled = isLaserActive;
}

export function ShowMessagePopup(player: mod.Player, message: string) {
    console.log(message);
    mod.DisplayHighlightedWorldLogMessage(mod.Message(message), player);
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    console.log("INTERACT");
    //console.log(eventPlayer);
    //console.log(eventInteractPoint);
    let InteractPointId = mod.GetObjId(eventInteractPoint)
    currentSwitchMode = InteractPointId
    console.log("New Switch Mode: " + InteractPointId)

    switch (currentSwitchMode) {
        case 1: {
            ShowMessagePopup(eventPlayer, "Teleport Activated");
            break;
        }
        case 2: {
            ShowMessagePopup(eventPlayer, "ObjectSpawner Activated")
            break;
        }
    }
}