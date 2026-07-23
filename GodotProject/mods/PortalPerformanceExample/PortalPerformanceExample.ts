let portalFrameUI: mod.UIWidget;
let serverFrameUI: mod.UIWidget;

let allowAISpawn = false;
let allowAILogic = false;
let runningAILogic = false;

export function OnGameModeStarted(): void {
    console.log('Log> OnGameModeStarted');

    // Performance UI Widget setup
    portalFrameUI = TrackerSetup(
        'PortalFrameTime',
        mod.CreateVector(200, 40, 0),
        mod.stringkeys.PortalFrameTime
    );
    serverFrameUI = TrackerSetup(
        'ServerFrameTime',
        mod.CreateVector(200, 77, 0),
        mod.stringkeys.ServerFrameTime
    );

    // Icon indicating the trigger area (for the experiment)
    IconSetup(mod.CreateVector(0.5, 35, 7), mod.WorldIconImages.Alert, mod.stringkeys.SpawnAIs);
    IconSetup(mod.CreateVector(0.5, 35, 4), mod.WorldIconImages.Flag, mod.stringkeys.UnspawnAIs);
    IconSetup(
        mod.CreateVector(0.5, 35, -2.6),
        mod.WorldIconImages.Alert,
        mod.stringkeys.RunAILogic
    );
    IconSetup(
        mod.CreateVector(0.5, 35, -5.6),
        mod.WorldIconImages.Flag,
        mod.stringkeys.StopAILogic
    );

    void UpdateFrameTime();
}

async function UpdateFrameTime(): Promise<void> {
    while (true) {
        // update the performance UI widget every 0.5s
        mod.SetUITextLabel(
            portalFrameUI,
            mod.Message(mod.stringkeys.PortalFrameTime, +mod.GetPortalAverageFrameTime().toFixed(2))
        );
        mod.SetUITextLabel(
            serverFrameUI,
            mod.Message(mod.stringkeys.ServerFrameTime, +mod.GetServerAverageFrameTime().toFixed(2))
        );
        await mod.Wait(1);
    }
}

export async function OnPlayerEnterAreaTrigger(
    eventPlayer: mod.Player,
    eventAreaTrigger: mod.AreaTrigger
): Promise<void> {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier))
        // Human player trigger only
        return;

    const areaId = mod.GetObjId(eventAreaTrigger);
    if (areaId === 1) {
        // spawn 40 AI bots
        allowAISpawn = true;
        for (let i = 0; i < 40; i += 1) {
            if (!allowAISpawn) break;
            mod.SpawnAIFromAISpawner(mod.GetSpawner(0), mod.GetTeam(1));
            await mod.Wait(0.5);
        }
    } else if (areaId === 2) {
        // unspawn all AI bots
        allowAISpawn = false;
        mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(0));
    } else if (areaId === 3) {
        // start expensive script AI logic to iterate and manage all AI bots
        allowAILogic = true;
        void RunAILogic();
    } else if (areaId === 4) {
        // stop expensive script AI logic
        allowAILogic = false;
    }
}

function TrackerSetup(name: string, pos: mod.Vector, message: string): mod.UIWidget {
    mod.AddUIText(
        name,
        pos,
        mod.CreateVector(320, 35, 0),
        mod.UIAnchor.TopRight,
        mod.Message(message, 0)
    );
    const widget = mod.FindUIWidgetWithName(name);
    mod.SetUITextSize(widget, 30);
    mod.SetUITextAnchor(widget, mod.UIAnchor.CenterLeft);
    mod.SetUIWidgetVisible(widget, true);
    return widget;
}

function IconSetup(pos: mod.Vector, image: mod.WorldIconImages, message: string): void {
    const icon = mod.SpawnObject(
        mod.RuntimeSpawn_Common.WorldIcon,
        pos,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1, 1, 1)
    );
    mod.SetWorldIconImage(icon, image);
    mod.EnableWorldIconImage(icon, true);
    mod.SetWorldIconColor(icon, mod.CreateVector(1, 1, 1));
    mod.SetWorldIconText(icon, mod.Message(message));
    mod.EnableWorldIconText(icon, true);
}

async function RunAILogic(): Promise<void> {
    if (runningAILogic) return;

    runningAILogic = true;
    const points = [
        mod.CreateVector(35, 33, 30),
        mod.CreateVector(35, 33, -30),
        mod.CreateVector(5, 33, 0),
    ];
    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    const playersTarget = new Array(n).fill(0);
    const playersBlocked = new Array(n).fill(0);

    while (allowAILogic && allowAISpawn) {
        for (let i = 0; i < n; i++) {
            const player = mod.ValueInArray(players, i);
            const playerLocation = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            const targetLocation = points[playersTarget[i]];
            const distance = mod.DistanceBetween(playerLocation, targetLocation);
            if (distance > 2.5) {
                mod.AIMoveToBehavior(player, targetLocation);
            } else {
                playersTarget[i] = mod.Modulo(mod.Add(playersTarget[i], 1), points.length); // next target
                mod.AIForceFire(player, 1);
            }

            // just making it more expensive ...
            const playerFacing = mod.GetSoldierState(
                player,
                mod.SoldierStateVector.GetFacingDirection
            );
            let marked = 0;
            for (let j = 0; j < n; j++) {
                const other = mod.ValueInArray(players, j);
                const otherLocation = mod.GetSoldierState(
                    other,
                    mod.SoldierStateVector.GetPosition
                );
                if (mod.DistanceBetween(playerLocation, otherLocation) < 10) {
                    const otherFacing = mod.GetSoldierState(
                        other,
                        mod.SoldierStateVector.GetFacingDirection
                    );
                    const dotOther = mod.DotProduct(playerFacing, otherFacing);
                    const crossOther = mod.CrossProduct(playerFacing, otherFacing);
                    const dirToward = mod.DirectionTowards(playerLocation, otherLocation);
                    const dotDirToward = mod.DotProduct(playerFacing, dirToward);
                    if (
                        dotOther < -0.3 &&
                        dotDirToward > 0 &&
                        mod.DistanceBetween(crossOther, mod.CreateVector(0, 0, 0)) > 0.5
                    )
                        marked = mod.Add(marked, 1);
                }
            }

            if (marked > 20) playersBlocked[i] = 100;
            else if (marked > 5 && playersBlocked[i] < 50) playersBlocked[i] = 20;
            else if (playersBlocked[i] > 0) playersBlocked[i]--;

            if (playersBlocked[i] > 20) mod.AISetStance(player, mod.Stance.Prone);
            else if (playersBlocked[i] > 0) mod.AISetStance(player, mod.Stance.Crouch);
            else mod.AISetStance(player, mod.Stance.Stand);
        }

        await mod.Wait(0.05);
    }
    runningAILogic = false;
}
