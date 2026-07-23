let trainLocator: mod.WorldIcon;
let mainPlayer: mod.Player;
const redColor = mod.CreateVector(1, 0, 0);
const whiteColor = mod.CreateVector(1, 1, 1);

export function OnPlayerDeployed(player: mod.Player) {
    let players = mod.AllPlayers();
    let n = mod.CountOf(players);
    console.log('LOG> OnPlayerDeployed: player: ', mod.GetObjId(player), ' Count of Players: ', n);
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        console.log('LOG> Found a player: ', mod.GetObjId(player));

        // Grant Recon Drone to the player. Useful to watch the train without moving too far from the Interact Points.
        mod.AddEquipment(player, mod.Gadgets.Deployable_Recon_Drone, mod.InventorySlots.GadgetOne);
        // Grant the Portal Gadget to the player. Allows teleportation back to the Command Post with the different Interact Points.
        mod.AddEquipment(player, mod.Gadgets.Misc_PortalGadget, mod.InventorySlots.GadgetTwo);
        mainPlayer = player;
    }
}

export function OnPortalGadgetFireStop(player: mod.Player) {
    let teleportDestination = mod.CreateVector(-115.645, 711.285, 538.267);
    mod.Teleport(player, teleportDestination, 0);
}

export async function OnGameModeStarted() {
    // Dynamically create a WorldIcon on Game Mode Started.
    trainLocator = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    mod.SetWorldIconImage(trainLocator, mod.WorldIconImages.Cross);
    mod.EnableWorldIconImage(trainLocator, true);
    mod.SetWorldIconColor(trainLocator, mod.CreateVector(1, 1, 0));
    mod.EnableWorldIconText(trainLocator, true);
    mod.SetWorldIconText(trainLocator, mod.Message('Train at {}m', 0));

    let trainLocVec3 = mod.GetGolmudTrainLocation();
    let iconLocVec3 = mod.CreateVector(mod.XComponentOf(trainLocVec3), mod.YComponentOf(trainLocVec3) + 5, mod.ZComponentOf(trainLocVec3));

    mod.SetWorldIconPosition(trainLocator, iconLocVec3);

    SetUpHUD();
    UpdateTrainLocation();
}

export function OnCapturePointCaptured(capturePoint: mod.CapturePoint) {
    // If CapturePoint is ConnectedToGolmudTrain, then Capturing will move the train in a set direction based on Team.
    // East for Team 1, West for Team 2
    // Note: Soldiers may only deploy on the Moving Capture Point once it is immobile at either end.

    let statusWidget = mod.FindUIWidgetWithName('Status');

    if (mod.GetObjId(capturePoint) == 1) {
        if (mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint)) == 1) {
            mod.SetUITextLabel(statusWidget, mod.Message('Moving East'));
            DisableInteractPoints();
        }
        if (mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint)) == 2) {
            mod.SetUITextLabel(statusWidget, mod.Message('Moving West'));
            DisableInteractPoints();
        }
    }
}

export function OnCapturePointLost(capturePoint: mod.CapturePoint) {
    // If CapturePoint is ConnectedToGolmudTrain, then Neutralisation will cause the train to stop.

    let statusWidget = mod.FindUIWidgetWithName('Status');

    if (mod.GetObjId(capturePoint) == 1) {
        mod.SetUITextLabel(statusWidget, mod.Message('Stopping'));
        DisableInteractPoints();
    }
}

async function DisableInteractPoints() {
    // Train cannot receive new commands while accelerating or deccelerating.

    mod.EnableInteractPoint(mod.GetInteractPoint(1), false);
    mod.EnableInteractPoint(mod.GetInteractPoint(2), false);
    mod.EnableInteractPoint(mod.GetInteractPoint(3), false);
    mod.SetWorldIconColor(mod.GetWorldIcon(1), redColor);
    mod.SetWorldIconColor(mod.GetWorldIcon(2), redColor);
    mod.SetWorldIconColor(mod.GetWorldIcon(3), redColor);

    await mod.Wait(6);

    mod.EnableInteractPoint(mod.GetInteractPoint(1), true);
    mod.EnableInteractPoint(mod.GetInteractPoint(2), true);
    mod.EnableInteractPoint(mod.GetInteractPoint(3), true);
    mod.SetWorldIconColor(mod.GetWorldIcon(1), whiteColor);
    mod.SetWorldIconColor(mod.GetWorldIcon(2), whiteColor);
    mod.SetWorldIconColor(mod.GetWorldIcon(3), whiteColor);
}

export function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint) {
    let statusWidget = mod.FindUIWidgetWithName('Status');
    if (mod.GetObjId(interactPoint) == 1) {
        mod.GolmudTrainSendMoveCommand(mod.GolmudTrainMoveCommands.MoveWest);
        mod.SetUITextLabel(statusWidget, mod.Message('Moving West'));
        DisableInteractPoints();
    }
    if (mod.GetObjId(interactPoint) == 2) {
        mod.GolmudTrainSendMoveCommand(mod.GolmudTrainMoveCommands.Stop);
        mod.SetUITextLabel(statusWidget, mod.Message('Stopping'));
        DisableInteractPoints();
    }
    if (mod.GetObjId(interactPoint) == 3) {
        mod.GolmudTrainSendMoveCommand(mod.GolmudTrainMoveCommands.MoveEast);
        mod.SetUITextLabel(statusWidget, mod.Message('Moving East'));
        DisableInteractPoints();
    }
    if (mod.GetObjId(interactPoint) == 4) {
        let trainLocVec3 = mod.GetGolmudTrainLocation();
        let teleportDestVec3 = mod.CreateVector(mod.XComponentOf(trainLocVec3), mod.YComponentOf(trainLocVec3) + 2, mod.ZComponentOf(trainLocVec3));
        mod.Teleport(player, teleportDestVec3, 0);
    }
}

export async function OnGolmudTrainStopped(stopReason: mod.GolmudTrainStopReason) {
    let statusWidget = mod.FindUIWidgetWithName('Status');

    if (mod.Equals(stopReason, mod.GolmudTrainStopReason.ReachedEastTerminal)) {
        mod.SetUITextLabel(statusWidget, mod.Message('At Eastmost point'));
    }

    if (mod.Equals(stopReason, mod.GolmudTrainStopReason.ReachedWestTerminal)) {
        mod.SetUITextLabel(statusWidget, mod.Message('At Westmost point'));
    }

    if (mod.Equals(stopReason, mod.GolmudTrainStopReason.StoppedInTransit)) {
        mod.SetUITextLabel(statusWidget, mod.Message('Stopped'));
    }
}

async function UpdateTrainLocation() {
    while (true) {
        await mod.Wait(0.0333);
        let trainLocVec3 = mod.GetGolmudTrainLocation();
        let iconLocVec3 = mod.CreateVector(mod.XComponentOf(trainLocVec3), mod.YComponentOf(trainLocVec3) + 5, mod.ZComponentOf(trainLocVec3));
        mod.SetWorldIconPosition(trainLocator, iconLocVec3);

        if (mod.GetSoldierState(mainPlayer, mod.SoldierStateBool.IsAlive)) {
            let playerLocVec3 = mod.GetSoldierState(mainPlayer, mod.SoldierStateVector.GetPosition);
            let dist = mod.Floor(mod.DistanceBetween(trainLocVec3, playerLocVec3) * 10) / 10;
            mod.SetWorldIconText(trainLocator, mod.Message('Train at {}m', dist));
        }
    }
}

function SetUpHUD() {
    mod.AddUIText('Header', mod.CreateVector(0, -440, 0), mod.CreateVector(800, 100, 0), mod.UIAnchor.Center, mod.Message('Train Status:'));
    mod.AddUIText('Status', mod.CreateVector(0, -380, 0), mod.CreateVector(800, 100, 0), mod.UIAnchor.Center, mod.Message('Stopped'));

    let headerWidget = mod.FindUIWidgetWithName('Header');
    let statusWidget = mod.FindUIWidgetWithName('Status');

    mod.SetUITextSize(headerWidget, 80);
    mod.SetUITextColor(headerWidget, mod.CreateVector(1, 1, 1));
    mod.SetUIWidgetBgColor(headerWidget, mod.CreateVector(0, 0, 0));
    mod.SetUIWidgetVisible(headerWidget, true);
    mod.SetUIWidgetBgAlpha(headerWidget, 0);
    mod.SetUITextAlpha(headerWidget, 1);
    mod.SetUITextAnchor(headerWidget, mod.UIAnchor.Center);

    mod.SetUITextSize(statusWidget, 50);
    mod.SetUITextColor(statusWidget, mod.CreateVector(0, 1, 0));
    mod.SetUIWidgetBgColor(statusWidget, mod.CreateVector(0, 0, 0));
    mod.SetUIWidgetVisible(statusWidget, true);
    mod.SetUIWidgetBgAlpha(statusWidget, 0);
    mod.SetUITextAlpha(statusWidget, 0.5);
    mod.SetUITextAnchor(statusWidget, mod.UIAnchor.Center);

    mod.SetWorldIconText(mod.GetWorldIcon(1), mod.Message('Move Train West'));
    mod.SetWorldIconText(mod.GetWorldIcon(2), mod.Message('Stop Train'));
    mod.SetWorldIconText(mod.GetWorldIcon(3), mod.Message('Move Train East'));
    mod.SetWorldIconText(mod.GetWorldIcon(4), mod.Message('Teleport To Train'));
}
