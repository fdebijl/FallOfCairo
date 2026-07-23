// === gibraltarGrandprix.ts ===
const VERSION = [1, 0, 26];









// Version Format [ship, delivery, patch/compile]
const debugPlayer = false;

const catchupMechanicSprintDisable = true;

const MinimumPlayerToStart = 1;
const MapPlayers = 8;

const CIRCLE_MAX = 6;
const CIRCLE_MIN = 6;

enum GameType {
    race = 0,
    timeSurvival = 1,
}

type Checkpoint = {
    id: number;
    position: Vector3;
    checkpointStart: Vector3;
    checkpointEnd: Vector3;
    flipdir?: boolean;
    lookDir?: Vector3;
};

type RaceTrack = {
    trackId: string;
    name: string;
    laps: number;
    gametype: GameType;
    availableVehicles: mod.VehicleList[]
    checkPoints: Checkpoint[];
};

type Vector3 = { x: number; y: number, z: number };

function getTrackById(id: string): RaceTrack | undefined {
    return tracks.find(track => track.trackId === id);
}

class TrackData {

    trackId: string;
    checkPoints: Checkpoint[];
    laps: number;
    playersInRace: PlayerProfile[] = [];
    raceTime: number = 0;
    winner: boolean = false;
    #maxReadyupCountdown: number = 350;
    readyupCountDown: number = 350;
    countdownToStart: number = 3;
    countdownToEnd: number = 45;
    winnerPlayer: PlayerProfile | undefined;
    availableVehicles: mod.VehicleList[] = [];
    trackState: TrackState = TrackState.none
    gametype: GameType = GameType.race;
    firstPlayerHasJoined: boolean = false

    constructor(track: RaceTrack) {

        console.log("Prepere Track " + track.name)

        this.checkPoints = track.checkPoints;
        this.laps = track.laps;
        this.availableVehicles = track.availableVehicles;
        this.trackId = track.trackId;
        this.trackState = TrackState.selected;
        this.gametype = track.gametype;
    }

    PlayerCompletedTrack(playerProfile: PlayerProfile) {
        playerProfile.playerRaceTime = mod.GetMatchTimeElapsed();
        playerProfile.completedTrack = true;

        this.playersInRace.forEach(playerProfile => {
            playerProfile.ScoreboardUI?.update()
        })

        if (this.winnerPlayer == undefined) {
            console.log("Winner Found")
            this.Winner(playerProfile)

        } else {
            this.CompletedTrackShowPlacement(playerProfile)
        }
    }

    CompletedTrackShowPlacement(playerProfile: PlayerProfile) {
        playerProfile.PlacementUI?.Open(mod.stringkeys.header_placement, currentRace.playersInRace.findIndex(pp => pp.player == playerProfile.player) + 1, 45)
    }

    async Winner(playerProfile: PlayerProfile) {

        this.winnerPlayer = playerProfile;
        playerProfile.PlacementUI?.Open(mod.stringkeys.victory, 0, 85)
        currentRace.trackState = TrackState.winnerFound;

        await mod.Wait(2)

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.EndingCountDownUI?.Open(this.countdownToEnd)
        });

        while (this.countdownToEnd > 0 && this.hasActiveRacers()) {
            currentRace.playersInRace.forEach(playerProfile => {
                playerProfile.EndingCountDownUI?.update(this.countdownToEnd)
            });
            await mod.Wait(1)
            this.countdownToEnd--;
        }

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.EndingCountDownUI?.Close()
        });

        currentRace.trackState = TrackState.over;

        console.log("Ending game")
        mod.EndGameMode(playerProfile.player)
    }


    hasActiveRacers() {
        return currentRace.playersInRace.some(player => player.completedTrack === false);
    }

    async AddPlayerToTrack(player: mod.Player) {
        const playerP = PlayerProfile.get(player);

        if (playerP) {

            if (this.playersInRace.includes(playerP)) {
                console.log("Player already in the race")
                return
            }

            playerP.readyUp = false;
            playerP.lap = 0;
            playerP.checkpoint = 0;
            playerP.nextCheckpoint = 0;
            playerP.playerRaceTime = null;
            playerP.completedTrack = false;
            playerP.currentTrackID = currentRace.trackId;
            playerP.checkPointPosition = ConverVector3ToModVector(currentRace.checkPoints[0].position)
            this.playersInRace.push(playerP)
            currentRace.AssignPlayerNumber(playerP)

            if (currentRace.trackState == TrackState.selected) {
                playerP.VehicleShopUI?.cameraTeleport()
                playerP.OpenVehicleOptionsUI()

                currentRace.playersInRace.forEach(PlayerProfile => {
                    PlayerProfile.VehicleShopUI?.UIUpdatePlayersReady()
                });
            }

            console.log("player pushed to race array")
        } else {
            console.log("could not find player to put into race")
        }

    }

    PlayerLeftGame() {
        // Remove invalid players and clean them up
        currentRace.playersInRace = currentRace.playersInRace.filter(playerProfile => {
            if (!this.isValidPlayer(playerProfile.player)) {
                playerProfile.CloseAllUI()
                playerProfile.DestroyVehicle();
                playerProfile.RemoveWorldIcons();

                return false; // remove from list
            }
            return true; // keep
        });

        // Update UI and possibly start countdown
        if (currentRace.trackState === TrackState.selected) {
            currentRace.playersInRace.forEach(player => {
                player.VehicleShopUI?.UIUpdatePlayersReady();
            });
            // Updated scoreboard   
        } else if (currentRace.trackState === TrackState.running || currentRace.trackState === TrackState.winnerFound) {
            currentRace.playersInRace.forEach(player => {
                player.ScoreboardUI?.update();
            });
        }
    }


    isValidPlayer(player: mod.Player | null | undefined): boolean {
        return player != null && mod.IsPlayerValid(player);
    }

    AssignPlayerNumber(playerProfile: PlayerProfile) {

        const usedIds = currentRace.playersInRace.map(p => p.playerRacerNumber);

        // Find the first free ID
        let freeId = -1;
        for (let i = 0; i < MapPlayers; i++) {
            if (!usedIds.includes(i)) {
                freeId = i;
                break;
            }
        }

        if (freeId === -1) {
            console.log("ERROR: No available slots for new players!");
        }

        // Assign the ID to the joining player
        playerProfile.playerRacerNumber = freeId;
        console.log("Player joined race, Assign race number: " + freeId)
    }

    async RaceStartCountdown() {

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.StartCountDownUI?.Open(mod.stringkeys.scoreboard_1_name, this.countdownToStart)
        });

        await mod.Wait(1)
        while (this.countdownToStart > 1) {
            this.countdownToStart--;

            currentRace.playersInRace.forEach(playerProfile => {
                playerProfile.StartCountDownUI?.update(mod.stringkeys.scoreboard_1_name, this.countdownToStart)
            });

            await mod.Wait(1)
        }

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.StartCountDownUI?.update(mod.stringkeys.gamestart, this.countdownToStart)
        });

        currentRace.playersInRace.forEach(playerProfile => {
            playerProfile.StartCountDownUI?.Close(3)
        });

    }

    countdownInProgress: boolean = false;

    async StartCountdown() {

        if (this.countdownInProgress === true) {
            console.log("Countdown already running");
            return;
        }

        if (!this.HasMinimumPlayers()) {
            console.log("Countdown cancelled: not enough players in game");
            return
        }

        this.countdownInProgress = true;
        this.readyupCountDown = this.#maxReadyupCountdown;

        while (this.readyupCountDown > 0) {
            this.readyupCountDown--;

            this.playersInRace.forEach(player => {
                player.VehicleShopUI?.UIUpdatePlayersReady()
            });

            await mod.Wait(1)

            const playerReady = this.GetPlayersReady();

            if (playerReady.total == 0) {
                console.log("Countdown cancelled: No players in lobby");
                this.countdownInProgress = false;
                return
            } else if (playerReady.ready == playerReady.total) {
                this.readyupCountDown = 0;
            }
        }

        console.log("Starting game...");

        await this.StartGame()
        this.countdownInProgress = false;
    }
    HasMinimumPlayers() {
        return this.playersInRace.length >= MinimumPlayerToStart
    }

    IsPlayersReady() {
        return this.playersInRace.every(player => player.readyUp === true);
    }

    IndexExists<T>(array: T[], index: number): boolean {
        return index >= 0 && index < array.length;
    }

    GetPlayersReady() {
        const readyCount = this.playersInRace.filter(p => p.readyUp).length;
        return { ready: readyCount, total: this.playersInRace.length };
    }

    IsPlayerInRace(player: mod.Player) {

        const playerPro = PlayerProfile.get(player)

        if (!playerPro) {
            return false;
        }

        return currentRace?.playersInRace?.some(
            item => mod.GetObjId(item.player) == mod.GetObjId(playerPro.player)
        ) ?? false;
    }

    async StartGame() {
        mod.DisablePlayerJoin()
        currentRace.trackState = TrackState.starting

        this.playersInRace.forEach(playerProfile => {
            playerProfile.VehicleShopUI?.close();
            if (mod.IsPlayerValid(playerProfile.player) && mod.GetSoldierState(playerProfile.player, mod.SoldierStateBool.IsAlive)) {
                mod.EnableAllInputRestrictions(playerProfile.player, true)
            }
            playerProfile.FadeInScreenUI?.FadeIn()
        });


        await mod.Wait(1)

        this.playersInRace.forEach(playerProfile => {
            playerProfile.InitRacer();
        });

        await mod.Wait(5)


        this.playersInRace.forEach(playerProfile => {
            playerProfile.FadeInScreenUI?.FadeOut()
             this.playersInRace.forEach(playerProfile => {
            mod.SetCameraTypeForPlayer(playerProfile.player, mod.Cameras.FirstPerson)
            });
        });

        await mod.Wait(2)


        await this.RaceStartCountdown()

        this.playersInRace.forEach(playerProfile => {
            playerProfile.UpdateWorldIconPosition();
        });

        currentRace.trackState = TrackState.running

        currentRace.raceTime = mod.GetMatchTimeElapsed();

        this.playersInRace.forEach(playerProfile => {
            if (mod.IsPlayerValid(playerProfile.player) && mod.GetSoldierState(playerProfile.player, mod.SoldierStateBool.IsAlive)) {
                mod.EnableAllInputRestrictions(playerProfile.player, false)
            }

        });

        this.playersInRace.forEach(playerProfile => {
            playerProfile.ScoreboardUI?.update()
        })
        this.DistanceCheckToCheckpoint();
        this.SpawnAiEnemyVehicle();
        this.UpdateScoreboard();

    }
    async DebugLoop() {

        while (true) {

            currentRace.playersInRace.forEach(element => {

                element.boosterDisabled = true

            });

            await mod.Wait(5)
            currentRace.playersInRace.forEach(element => {
                element.boosterDisabled = false
            });
            await mod.Wait(5)
        }


    }


    async DistanceCheckToCheckpoint() {

        while (this.trackState == TrackState.running || this.trackState == TrackState.winnerFound) {
            this.playersInRace.forEach(playerProfile => {

                if (playerProfile.completedTrack == true) {
                    console.log("Player have already completed track")
                    return;
                }


                if (!playerProfile.player) {
                    return;
                }


                if (!mod.GetSoldierState(playerProfile.player, mod.SoldierStateBool.IsAlive)) {
                    return
                }

                const playerPosition = mod.GetSoldierState(playerProfile.player, mod.SoldierStateVector.GetPosition)

                if (!playerPosition) {
                    return
                }

                const targetCheckpoint = ConverVector3ToModVector(this.checkPoints[playerProfile.nextCheckpoint].position)

                const distance = mod.DistanceBetween(playerPosition, targetCheckpoint)


                if (distance <= playerProfile.checkpointCircleSize) {

                    playerProfile.checkpoint++;

                    const positionInRace = this.playersInRace.indexOf(playerProfile)
                    playerProfile.checkpointCircleSize = getCheckpointSize(positionInRace, currentRace.playersInRace.length);

                    //update checkpoint position
                    playerProfile.nextCheckpoint = (playerProfile.checkpoint) % this.checkPoints.length
                    playerProfile.checkPointPosition = ConverVector3ToModVector(this.checkPoints[playerProfile.nextCheckpoint].position)

                    const lapsCompl = Math.floor((playerProfile.checkpoint / this.checkPoints.length))

                    if (lapsCompl != playerProfile.lap) {
                        playerProfile.lap = lapsCompl;
                        console.log("lap" + playerProfile.lap)
                    }

                    if ( playerProfile.lap > this.laps || (playerProfile.lap === this.laps && playerProfile.checkpoint % this.checkPoints.length === 0 && !playerProfile.completedTrack)) {
                        this.PlayerCompletedTrack(playerProfile)
                        console.log("player win " + playerProfile.playerRaceTime)
                    }

                    playerProfile.UpdateWorldIconPosition();
                    this.UpdateOrder()
                }

            });
            await mod.Wait(0.1)
        }
    }


    async SpawnAiEnemyVehicle() {
        console.log("start SpawnAi EnemyVehicle")

        const aiArray = [
            mod.GetSpawner(1),
            mod.GetSpawner(2),
            mod.GetSpawner(3),
            mod.GetSpawner(4)
        ]

        for (let index = 0; index < aiArray.length; index++) {
            mod.SpawnAIFromAISpawner(aiArray[index], mod.SoldierClass.Support, mod.GetTeam(9))
            await mod.Wait(0.1)
        }

        console.log("completed SpawnAiEnemyVehicle")
    }

    async TimeLoop() {
        console.log("Starting: TimeLoop")


        while (currentRace.trackState == TrackState.running || currentRace.trackState == TrackState.winnerFound) {
            let foundPlayerInRace = false;

            for (let index = 0; index < this.playersInRace.length; index++) {
                const pp = this.playersInRace[index];

                if (pp) {
                    // pp.UITest.open();
                }

                if (pp.completedTrack) {
                    continue
                }




                let timeleft = pp.timeLeft - 0.1

                if (timeleft < 0) {
                    pp.timeLeft = 0;
                } else {
                    pp.timeLeft = timeleft;
                }

                if (pp.timeLeft == 0) {
                    continue;
                }


                if (pp.timeLeft > 0) {
                    foundPlayerInRace = true;
                }
            }


            if (foundPlayerInRace == false) {
                return
            }

            await mod.Wait(0.1)
        }
    }

    async UpdateScoreboard() {
        console.log("Start UpdateScoreboard loop")
        while (this.trackState == TrackState.running || this.trackState == TrackState.winnerFound) {
            await mod.Wait(1.0)
            this.UpdateOrder();
        }
    }




    UpdateOrder() {

        const oldarray = JSON.parse(JSON.stringify(this.playersInRace));

        const updatedArray = sortRaceStanding(this.playersInRace);

        let overtakingPlayers = detectOvertakes(oldarray, updatedArray);
        for (let playerProfile of overtakingPlayers) {
            playerProfile.OvertookPlayer();
        }

        if (hasOrderChangedByKey(oldarray, updatedArray)) {
            console.log("Race Order Changed")
            this.playersInRace = updatedArray

            currentRace.playersInRace.forEach(playerProfile => {
                playerProfile.ScoreboardUI?.update()
            })

            if (currentRace.playersInRace.length > 1 && catchupMechanicSprintDisable) {
                const players = currentRace.playersInRace;

                // Calculate how many players should have sprint disabled (round up to at least 1)
                const disableCount = Math.max(1, Math.ceil(players.length * 0.3));

                for (let i = 0; i < players.length; i++) {
                    const disableSprint = i < disableCount; // First X players have sprint disabled
                    mod.EnableInputRestriction(players[i].player, mod.RestrictedInputs.Sprint, disableSprint);
                    players[i].boosterDisabled = disableSprint;
                }
            } else {
                // If a player leaves the game, and only one player is left. reactivate sprint.
                const playerProf = currentRace.playersInRace[0];
                if (playerProf && playerProf.boosterDisabled) {
                    mod.EnableInputRestriction(playerProf.player, mod.RestrictedInputs.Sprint, false);
                    playerProf.boosterDisabled = false;
                }
            }


        }
    }

}

function detectOvertakes(oldOrder: PlayerProfile[], newOrder: PlayerProfile[]) {
    let overtakes: PlayerProfile[] = [];

    for (let player of newOrder) {
        const id = player.playerProfileId;
        const oldPos = oldOrder.findIndex(p => p.playerProfileId === id);
        const newPos = newOrder.findIndex(p => p.playerProfileId === id);

        if (newPos < oldPos) {
            overtakes.push(player);
        }
    }
    return overtakes;
}

function hasOrderChangedByKey(prev: PlayerProfile[], current: PlayerProfile[]): boolean {
    if (prev.length !== current.length) return true;
    return prev.some((p, i) =>
        p.playerProfileId !== current[i].playerProfileId
    );
}

function compareRacers(a: PlayerProfile, b: PlayerProfile): number {


    if (a.completedTrack && b.completedTrack) return a.playerRaceTime! - b.playerRaceTime!;
    if (a.completedTrack) return -1;
    if (b.completedTrack) return 1;


    if (a.lap !== b.lap) return b.lap - a.lap;
    if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;


    const aDistance = mod.DistanceBetween(mod.GetSoldierState(a.player, mod.SoldierStateVector.GetPosition), a.checkPointPosition)
    const bDistance = mod.DistanceBetween(mod.GetSoldierState(b.player, mod.SoldierStateVector.GetPosition), b.checkPointPosition)

    if (aDistance !== bDistance) return aDistance - bDistance;

    return 0;
}

function sortRaceStanding(racers: PlayerProfile[]): PlayerProfile[] {
    return [...racers].sort(compareRacers);
}

let currentRace: TrackData;

function PrepareRace(trackId: string) {
    const track = getTrackById(trackId);
    if (track) {
        currentRace = new TrackData(track);
    } else {
        console.log("Could not find trackid")
    }
}

export async function OnGameModeStarted() {
    console.log("HoH Test Game Mode Started");

    PrepareRace("track_03")

    mod.SetAIToHumanDamageModifier(0.5)
    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn)
}

function MakeMessage(message: string, ...args: any[]) {
    switch (args.length) {
        case 0:
            return mod.Message(message);
        case 1:
            return mod.Message(message, args[0]);
        case 2:
            return mod.Message(message, args[0], args[1]);
        case 3:
            return mod.Message(message, args[0], args[1], args[2]);
        default:
            throw new Error("Invalid number of arguments");
    }
}

enum TrackState {
    none = 0,
    selected = 1,
    starting = 2,
    running = 3,
    winnerFound = 4,
    over = 5
}

let uniqueID: number = 0;

class PlayerProfile {

    timeLeft: number = 30;
    player: mod.Player;
    checkpoint: number = 0;
    nextCheckpoint: number = 1;
    lap: number = 0;
    currentTrackID: string = "";
    playerRaceTime: number | null = null;
    completedTrack: boolean = false;
    checkPointPosition: mod.Vector = mod.CreateVector(0, 0, 0);
    checkPointPositionLookDirection2: Vector3 = { x: 0, y: 0, z: 0 }
    checkPointPosition2: Vector3 = { x: 0, y: 0, z: 0 }
    selectedVehicle: mod.VehicleList = mod.VehicleList.Quadbike;
    playerProfileId: number = -1;
    playerRacerNumber: number = -1;
    readyUp: boolean = false;
    checkpointCircleSize: number = 6;
    boosterDisabled: boolean = false;

    checkpointWorldIcons: mod.WorldIcon[] = [];
    checkpointDirectionWorldIcons: mod.WorldIcon[] = [];

    checkpointWorldIconsTwo: mod.WorldIcon[] = [];
    checkpointDirectionWorldIconsTwo: mod.WorldIcon[] = [];

    checkpointWorldIconsHolder: HoH_CheckpointWorldIconsHolder | undefined;
    nextcheckpointWorldIconsHolder: HoH_CheckpointWorldIconsHolder | undefined;



    VehicleShopUI: HoH_UIVehicleSelect | undefined;
    FadeInScreenUI: HoH_UIBlackScreen | undefined;
    StartCountDownUI: HoH_UIStartCountdown | undefined;
    PlacementUI: HoH_UIPlacementHeader | undefined;
    EndingCountDownUI: HoH_UIEndingGameCountdown | undefined;
    OvertakeUI: HoH_BenjiOvertakeUI | undefined;
    VersionNumberUI: HoH_Version | undefined;
    ScoreboardUI: HoH_ScoreboardUI | undefined;

    playerSpawnedVeh: mod.Vehicle | undefined;
    playerSpawnedVehSpawner: mod.VehicleSpawner | undefined;

    static playerInstances: mod.Player[] = [];

    static #allHoHPlayers: { [key: number]: PlayerProfile } = {};


    constructor(player: mod.Player) {
        this.player = player;
        this.playerProfileId = uniqueID++;

        this.FadeInScreenUI = new HoH_UIBlackScreen(this);
        this.StartCountDownUI = new HoH_UIStartCountdown(this);
        this.PlacementUI = new HoH_UIPlacementHeader(this);
        this.EndingCountDownUI = new HoH_UIEndingGameCountdown(this);
        this.OvertakeUI = new HoH_BenjiOvertakeUI(this);
        this.VersionNumberUI = new HoH_Version(this)
        this.ScoreboardUI = new HoH_ScoreboardUI(this)
    }

    CloseAllUI() {
        this.FadeInScreenUI?.Close()
        this.StartCountDownUI?.Close()
        this.PlacementUI?.Close()
        this.EndingCountDownUI?.Close()
        this.OvertakeUI?.Close()
        this.VersionNumberUI?.Close()
        this.ScoreboardUI?.Close()
        this.VehicleShopUI?.close()
    }


    static get(player: mod.Player) {
        if (mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            let hohPlayer = this.#allHoHPlayers[index];
            if (!hohPlayer) {
                hohPlayer = new PlayerProfile(player);
                if (debugPlayer) console.log("Creating Player Profile");
                this.#allHoHPlayers[index] = hohPlayer;
                this.playerInstances.push(player)
            }
            return hohPlayer;
        }
        if (debugPlayer) console.log("Error: could not finds an valid player object ID.");
        return undefined;
    }

    DeletePlayerWidgets() {

        this.FadeInScreenUI?.Delete()
        this.StartCountDownUI?.Delete()
        this.PlacementUI?.Delete()
        this.EndingCountDownUI?.Delete()
        this.OvertakeUI?.Delete()
        this.VersionNumberUI?.Delete()
        this.ScoreboardUI?.Delete()


    }

    DestroyVehicle() {

        if (this.playerSpawnedVeh) {
            mod.DealDamage(this.playerSpawnedVeh, 9999)
        }
        if (this.playerSpawnedVehSpawner) {
            mod.UnspawnObject(this.playerSpawnedVehSpawner)
            this.playerSpawnedVehSpawner = undefined;
        }
    }

    SetVehicle(vehicle: mod.VehicleList) {
        this.selectedVehicle = vehicle
    }

    InitRacer() {
        this.checkPointPosition = ConverVector3ToModVector(currentRace.checkPoints[0].position);
        this.checkPointPosition2 = currentRace.checkPoints[0].position;

        this.checkpointWorldIconsHolder = new HoH_CheckpointWorldIconsHolder(this, mod.CreateVector(0, 1, 0))
        this.nextcheckpointWorldIconsHolder = new HoH_CheckpointWorldIconsHolder(this, mod.CreateVector(1, 0, 0))

        VehicleHandler.RequestVehicle(this)
    }

    OpenVehicleOptionsUI() {

        if (this.VehicleShopUI == undefined) {
            this.VehicleShopUI = new HoH_UIVehicleSelect(this)
        }
        this.VehicleShopUI.open();
    }


    RefreshWorldIcons() {
        this.checkpointWorldIconsHolder?.Refresh()
        if ((this.checkpoint) < currentRace.laps * currentRace.checkPoints.length) {
            this.nextcheckpointWorldIconsHolder?.Refresh()
        }
    }


    RemoveWorldIcons() {

        if (this.checkpointWorldIconsHolder) {
            this.checkpointWorldIconsHolder.checkpointWorldIcons.forEach(element => {
                mod.UnspawnObject(element)
            });
        }

        if (this.nextcheckpointWorldIconsHolder) {
            this.nextcheckpointWorldIconsHolder.checkpointWorldIcons.forEach(element => {
                mod.UnspawnObject(element)
            });
        }

    }

    UpdateWorldIconPosition() {
        if (this.completedTrack) {
            this.checkpointWorldIconsHolder?.Hide()
            this.nextcheckpointWorldIconsHolder?.Hide()
            console.log("Hide ui since player completed track")
            return;
        }

        this.checkPointPosition2 = currentRace.checkPoints[this.nextCheckpoint].position

        const overideLookDir = currentRace.checkPoints[(this.checkpoint) % currentRace.checkPoints.length].lookDir
        

        if (overideLookDir) {
            this.checkPointPositionLookDirection2 = overideLookDir
        } else {
            this.checkPointPositionLookDirection2 = currentRace.checkPoints[(this.checkpoint + 1) % currentRace.checkPoints.length].position
        }


        if (!this.checkpointWorldIconsHolder) {
            console.log("checkpointWorldIconsHolder not found")
        }

        this.checkpointWorldIconsHolder?.Update(this.checkPointPosition2, this.checkPointPositionLookDirection2, this.checkpointCircleSize)


        //upcoming checkpoint after target checkpoint
        const upcomingCheckpoint = (this.checkpoint + 1) % currentRace.checkPoints.length
        const upcomingcheckpointPosition2 = currentRace.checkPoints[upcomingCheckpoint].position

        let upcomingLookPosition = currentRace.checkPoints[(this.checkpoint + 2) % currentRace.checkPoints.length].position
        let overideNextCheckpointLookDir = currentRace.checkPoints[(this.checkpoint+1) % currentRace.checkPoints.length].lookDir
        if(overideNextCheckpointLookDir){
            upcomingLookPosition = overideNextCheckpointLookDir
        }
        this.nextcheckpointWorldIconsHolder?.Update(upcomingcheckpointPosition2, upcomingLookPosition, this.checkpointCircleSize)

        if (!this.nextcheckpointWorldIconsHolder) {
            console.log("nextcheckpointWorldIconsHolder not found")
        }

        // Make the final checkpoint not have a next checkpoint.
        if ((this.checkpoint) >= currentRace.laps * currentRace.checkPoints.length) {
            this.nextcheckpointWorldIconsHolder?.Hide()
            console.log("hide last checkpoint")
        }

    }


    static removePlayer(player: mod.Player) {
        let index = mod.GetObjId(player);

        let hohPlayer = this.#allHoHPlayers[index];
        if (hohPlayer) {
            this.playerInstances.filter(item => item !== player);
            delete this.#allHoHPlayers[index];
        } else {
            if (debugPlayer) console.log("Error: could not find player with profile to remove");
        }
    }


    static removeInvalidPlayers() {
        // Remove invalid from array
        PlayerProfile.playerInstances = PlayerProfile.playerInstances.filter(player =>
            this.isValidPlayer(player)
        );

        // Remove invalid from object
        for (const id in PlayerProfile.#allHoHPlayers) {
            const { player } = PlayerProfile.#allHoHPlayers[id];
            if (!this.isValidPlayer(player)) {
                delete PlayerProfile.#allHoHPlayers[id];
            }
        }
    }

    static isValidPlayer(player: mod.Player | null | undefined): boolean {
        // Check for null/undefined before calling mod function
        return player != null && mod.IsPlayerValid(player);
    }



    OvertookPlayer() {
        this.OvertakeUI?.Trigger()
    }

}

function getCheckpointSize(index: number, totalPlayers: number) {


    if (index < 0 || index >= totalPlayers) {
        return CIRCLE_MIN;
    }


    if (totalPlayers === 1) {
        return CIRCLE_MIN
    }


    const normalized = index / (totalPlayers - 1);


    return CIRCLE_MIN + normalized * (CIRCLE_MAX - CIRCLE_MIN);
}

class HoH_CheckpointWorldIconsHolder {

    #playerprofile: PlayerProfile;

    color: mod.Vector;
    circleSize: number = 6;
    directionForwardOffset: number = 35
    amountoficons: number = 12;
    checkpointWorldIcons: mod.WorldIcon[] = [];



    constructor(playerprofile: PlayerProfile, color: mod.Vector) {
        this.#playerprofile = playerprofile;
        this.color = color;

        const checkpointWidgets = generatePointsInHalfCircle(this.#playerprofile.checkPointPosition2, this.#playerprofile.checkPointPositionLookDirection2, this.circleSize, this.amountoficons)

        this.circleSize = CIRCLE_MIN

        //Circle widgets
        checkpointWidgets.forEach(element => {
            const worldicon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, mod.CreateVector(element.x, element.y, element.z), mod.CreateVector(0, 0, 0))
            mod.SetWorldIconPosition(worldicon, mod.CreateVector(element.x, element.y, element.z))
            mod.SetWorldIconColor(worldicon, color)
            mod.SetWorldIconImage(worldicon, mod.WorldIconImages.Triangle)
            mod.EnableWorldIconImage(worldicon, false)
            mod.SetWorldIconOwner(worldicon, mod.GetTeam(this.#playerprofile.player))
            this.checkpointWorldIcons.push(worldicon)
        });
    }


    Hide() {
        this.checkpointWorldIcons.forEach(worldicon => {
            mod.EnableWorldIconImage(worldicon, false)
        });
    }

    async Refresh() {
        if (!this.#playerprofile.completedTrack) {
            this.Hide()

            await mod.Wait(1)

            this.checkpointWorldIcons.forEach(worldicon => {
                mod.EnableWorldIconImage(worldicon, true)
                mod.GetObjectPosition(worldicon)
            });
        }
    }

    Update(checkpointposition: Vector3, nextcheckpointPosition: Vector3, circleSize: number = this.circleSize) {
        console.log("Update world icon positions")

        const checkpointWidgets = generatePointsInHalfCircle(checkpointposition, nextcheckpointPosition, circleSize, this.amountoficons)

        for (let index = 0; index < this.checkpointWorldIcons.length; index++) {

            const position = checkpointWidgets[index]
            const widget = this.checkpointWorldIcons[index]

            mod.SetWorldIconPosition(widget, mod.CreateVector(position.x, position.y, position.z))
            mod.EnableWorldIconImage(widget, true)
        }

    }
}

function getLookAtRotation(from: Vector3, to: Vector3): Vector3 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;

    const distanceXZ = Math.sqrt(dx * dx + dz * dz);

    const pitch = Math.atan2(dy, distanceXZ);
    const yaw = Math.atan2(dx, dz);
    const roll = 0;

    return { x: pitch, y: yaw, z: roll };
}

async function SpawnVFXAtPosition(targetpoint: mod.Vector, vfx: any, rotation?: mod.Vector, scale?: mod.Vector) {


    const flareVFX = mod.SpawnObject(vfx, targetpoint, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));

    mod.EnableVFX(flareVFX, true)
}

export async function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
    VehicleHandler.OnVehicleSpawned(eventVehicle)
}

type VehicleAssignment = {
    player: mod.Player;
    position: mod.Vector;
    vehicleSpawner: mod.VehicleSpawner;
    vehicle?: mod.Vehicle;
};

class VehicleHandler {

    static playerNeedingVehicle: VehicleAssignment[] = [];


    static RequestVehicle(playerProfile: PlayerProfile) {
        if (currentRace?.trackState == TrackState.starting || currentRace?.trackState == TrackState.running || currentRace?.trackState == TrackState.winnerFound || currentRace?.trackState == TrackState.over) {

            const currentCheckpoint = (playerProfile.checkpoint) % currentRace.checkPoints.length
            const checkPoint = currentRace.checkPoints[currentCheckpoint];
            if (!checkPoint) {
                return;
            }

            const spawnPosition = generateSpawnLine(checkPoint.checkpointStart, checkPoint.checkpointEnd, MapPlayers, checkPoint.flipdir ? "right" : "left")
            const targetSpawnPoint = spawnPosition[playerProfile.playerRacerNumber]


            const vehSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, ConverVector3ToModVector(targetSpawnPoint.position), ConverVector3ToModVector(getLookAtRotation(targetSpawnPoint.position, targetSpawnPoint.forwardPosition)))


            console.log("Target Spawn point " + targetSpawnPoint.position.x + " " + targetSpawnPoint.position.y + " " + targetSpawnPoint.position.z)

            VehicleHandler.playerNeedingVehicle.push({ player: playerProfile.player, position: ConverVector3ToModVector(targetSpawnPoint.position), vehicleSpawner: vehSpawner })


            playerProfile.playerSpawnedVehSpawner = vehSpawner;

            mod.SetVehicleSpawnerVehicleType(vehSpawner, playerProfile.selectedVehicle)
            mod.ForceVehicleSpawnerSpawn(vehSpawner)
        }

    }

    static async OnVehicleSpawned(eventVehicle: mod.Vehicle) {

        console.log("OnVehicleSpawned")

        if (VehicleHandler.playerNeedingVehicle.length == 0) {
            return;
        }

        const vehiclePos = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition)
        let closestDistance: number | null = null;
        let targetVehicleSpawner: VehicleAssignment | undefined;

        for (const veh of VehicleHandler.playerNeedingVehicle) {
            const distance = mod.DistanceBetween(vehiclePos, veh.position);
            console.log("Distance between vehicle and point: " + distance)
            if (distance <= 25 && (closestDistance === null || distance < closestDistance)) {
                closestDistance = distance;
                targetVehicleSpawner = veh;
            }
        }

        if (targetVehicleSpawner == undefined) {
            console.log("Could not find a vehicle close enough to the vehicle spawnpoint")
            return
        }

        const index = VehicleHandler.playerNeedingVehicle.indexOf(targetVehicleSpawner);
        if (index !== -1) {
            VehicleHandler.playerNeedingVehicle.splice(index, 1);
        }


        while (currentRace.IsPlayerInRace(targetVehicleSpawner.player) && !mod.GetSoldierState(targetVehicleSpawner.player, mod.SoldierStateBool.IsAlive)) {
            await mod.Wait(0.1)
        }


        const pprofile = PlayerProfile.get(targetVehicleSpawner.player)
        if (!pprofile) {
            return
        }


        pprofile.playerSpawnedVeh = eventVehicle;

        // If player disconected remove their vehicle we just spawned.
        if (!currentRace.IsPlayerInRace(targetVehicleSpawner.player)) {
            pprofile.DestroyVehicle()
            return
        }

        const spawnOffset = mod.Add(vehiclePos, mod.CreateVector(0, 10, 0))

        mod.Teleport(targetVehicleSpawner.player, spawnOffset, 0)

        await mod.Wait(0.5)
        mod.ForcePlayerToSeat(targetVehicleSpawner.player, eventVehicle, 0)


        console.log("Vehicle ready: Seating player")
    }
}

export function ConverVector3ToModVector(vector3: Vector3): mod.Vector {
    return mod.CreateVector(vector3.x, vector3.y, vector3.z)
}

interface SpawnPoint {
    position: Vector3;        // point on the line
    forwardPosition: Vector3; // 10 units to the left
}

function generateSpawnLine(
  start: Vector3,
  end: Vector3,
  count: number,
  direction: "left" | "right" = "left",
  distance: number = 2,
  up: Vector3 = { x: 0, y: 1, z: 0 }
): SpawnPoint[] {
  if (count < 1) {
    throw new Error("Count must be at least 1.");
  }

  const maxPerRow = 4;
  const rowSpacing = distance; // space between rows (vertical)
  const colSpacing = distance; // normalize spacing along the line

  const totalRows = Math.ceil(count / maxPerRow);
  const spawnPoints: SpawnPoint[] = [];

  // Direction vector from start to end (defines row direction)
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const rowDir = { x: dx / len, y: dy / len, z: dz / len }; // "horizontal" direction

  // Left vector = up × rowDir
  const left = {
    x: up.y * rowDir.z - up.z * rowDir.y,
    y: up.z * rowDir.x - up.x * rowDir.z,
    z: up.x * rowDir.y - up.y * rowDir.x,
  };

  // Normalize left
  const leftLen = Math.sqrt(left.x ** 2 + left.y ** 2 + left.z ** 2);
  const leftNorm = { x: left.x / leftLen, y: left.y / leftLen, z: left.z / leftLen };

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / maxPerRow);
    const col = i % maxPerRow;

    // Position = start + (rowDir * col * spacing) + (leftNorm * row * rowSpacing)
    const position = {
      x: start.x + rowDir.x * colSpacing * col + leftNorm.x * rowSpacing * row,
      y: start.y + rowDir.y * colSpacing * col + leftNorm.y * rowSpacing * row,
      z: start.z + rowDir.z * colSpacing * col + leftNorm.z * rowSpacing * row,
    };

    // Forward position = position + leftNorm * distance (same as before)
    const forwardPosition = {
      x: position.x + leftNorm.x * distance,
      y: position.y + leftNorm.y * distance,
      z: position.z + leftNorm.z * distance,
    };

    spawnPoints.push({ position, forwardPosition });
  }

  if (direction === "right") {
    return spawnPoints.reverse();
  }

  return spawnPoints;
}

export async function OnPlayerLeaveGame(eventNumber: number) {
    console.log("Player left the game. Removing invalid players")
    currentRace?.PlayerLeftGame()
    PlayerProfile.removeInvalidPlayers()
}

export async function OnPlayerDeployed(player: mod.Player) {

    try {

        //Add remove weapons code
        mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon)
        mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon)
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne)
        mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo)
        mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget)

    } catch (error) {

    }

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        if (currentRace?.trackState == TrackState.selected) {
            currentRace.AddPlayerToTrack(player)
            currentRace.StartCountdown();

        } else if (currentRace?.trackState == TrackState.running ||
            currentRace?.trackState == TrackState.winnerFound ||
            currentRace?.trackState == TrackState.over) {

            const playerprofile = PlayerProfile.get(player)

            if (!currentRace.IsPlayerInRace(player)) {
                currentRace.AddPlayerToTrack(player)
                playerprofile?.ScoreboardUI?.open()
                playerprofile?.InitRacer();
                playerprofile?.UpdateWorldIconPosition();
                playerprofile?.RefreshWorldIcons()

                currentRace.playersInRace.forEach(playerProfile => {
                    playerProfile.ScoreboardUI?.update()
                })
                return
            }

            if (playerprofile) {
                VehicleHandler.RequestVehicle(playerprofile)
                playerprofile.RefreshWorldIcons()
            }
        }

    } else {
        mod.AddEquipment(player, mod.Gadgets.Launcher_Unguided_Rocket)
        mod.ForceSwitchInventory(player, mod.InventorySlots.GadgetOne)
        if (currentRace?.trackState == TrackState.running || currentRace?.trackState == TrackState.winnerFound) {

            const position = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition)
            const closesVeh = GetUnoccupiedVehicleInRange(position)

            if (closesVeh) {
                mod.ForcePlayerToSeat(player, closesVeh, 0)
                TargetFirstPlayer(player)
            } else {
                //AiStingerAmmo(player)
            }


        } else {
            console.log("Debug Ai Spawned")

            mod.AIEnableShooting(player, false)
            mod.AIEnableTargeting(player, false)
            currentRace.AddPlayerToTrack(player)
            const playerprofile = PlayerProfile.get(player)
            if (playerprofile) {
                playerprofile.readyUp = true;
            }

        }
    }
}

async function TargetFirstPlayer(player: mod.Player) {
    while (mod.IsPlayerValid(player) && currentRace.trackState == TrackState.running) {

        mod.AISetTarget(player, currentRace.playersInRace[0].player)

        await mod.Wait(0.1);
        const inputduration = 5; //getRandomFloatInRange(0.1,2);
        mod.AIForceFire(player, inputduration);

        //mod.AIForceFire(player,10)

        await mod.Wait(5)
    }

}

function GetUnoccupiedVehicleInRange(pos: mod.Vector): mod.Vehicle | undefined {

    const allVeh = mod.AllVehicles();

    for (let index = 0; index < mod.CountOf(allVeh); index++) {
        const veh = mod.ValueInArray(allVeh, index)
        if (!mod.IsVehicleOccupied(veh)) {
            const vehPos = mod.GetVehicleState(veh, mod.VehicleStateVector.VehiclePosition);
            if (mod.DistanceBetween(pos, vehPos) <= 15) {
                return veh;
            }
        }
    }
    console.log("Could not find vehicle close enough.")
    return undefined
}

export async function OnPlayerDied(player: mod.Player) {

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {

        const playerProf = PlayerProfile.get(player);

        if (playerProf) {
            playerProf.DestroyVehicle()
        }

    }
}

function generatePointsInHalfCircle(
    center: Vector3,
    lookAt: Vector3,
    radius: number,
    segments: number
): Vector3[] {
    const positions: Vector3[] = [];

    const forward = normalizeVector(subtractVectors(lookAt, center));
    const worldUp = { x: 0, y: 1, z: 0 };

    let right = crossProduct(worldUp, forward);
    if (length(right) < 0.0001) {
        right = crossProduct({ x: 1, y: 0, z: 0 }, forward);
    }
    right = normalizeVector(right);

    const up = normalizeVector(crossProduct(forward, right));

    for (let i = 0; i < segments; i++) {
        const angle = (i / (segments - 1)) * Math.PI; // Half-circle only
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const point = {
            x: center.x + right.x * x + up.x * y,
            y: center.y + right.y * x + up.y * y,
            z: center.z + right.z * x + up.z * y,
        };

        positions.push(point);
    }

    return positions;
}

function subtractVectors(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function normalizeVector(v: Vector3): Vector3 {
    const len = length(v);
    return len === 0 ? { x: 0, y: 0, z: 0 } : { x: v.x / len, y: v.y / len, z: v.z / len };
}

function crossProduct(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

function length(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export async function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {

    const playerProfile = PlayerProfile.get(eventPlayer)

    if (!playerProfile) {
        return
    }

    playerProfile.VehicleShopUI?.OnButtonPressed(eventPlayer, eventUIWidget, eventUIButtonEvent)
}

function Lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}





// === gibraltarGrandprixRawData.ts ===



const tracks: RaceTrack[] = [
    {
        trackId: "track_01",
        name: "Quad_Chaos",
        laps: 1,
        availableVehicles: [mod.VehicleList.Quadbike, mod.VehicleList.GolfCart],
        gametype: GameType.race,
        checkPoints: [
            //First Section
                    
            //1
            { id: 102, checkpointStart: { x: -152.617324829102, y: 54.3976898193359, z: -350.003234863281 }, checkpointEnd: { x: -144.449234008789, y: 54.3974838256836, z: -349.907562255859 }, position: { x: -152.021102905273, y: 52.2462005615234, z: -425.114593505859 }, lookDir: { x: -156.857955932617, y: 52.2462005615234, z: -426.937927246094 }},
            { id: 103, checkpointStart: { x: -152.617324829102, y: 54.3976898193359, z: -350.003234863281 }, checkpointEnd: { x: -144.449234008789, y: 54.3974838256836, z: -349.907562255859 }, position: { x: -240.135726928711, y: 52.2462005615234, z: -423.405853271484 }, lookDir: { x: -248.259506225586, y: 52.2462005615234, z: -414.6650390625 }},
            
            //2
            { id: 104, checkpointStart: { x: -237.871322631836, y: 52.1492004394531, z: -431.007385253906 }, checkpointEnd: { x: -247.984252929688, y: 52.0625, z: -430.9169921875 }, position: { x: -240.84375, y: 52.9939804077148, z: -351.877716064453 }, lookDir: { x: -234.058731079102, y: 52.9939880371094, z: -343.223388671875 }},
            { id: 105, checkpointStart: { x: -237.871322631836, y: 52.1492004394531, z: -431.007385253906 }, checkpointEnd: { x: -247.984252929688, y: 52.0625, z: -430.9169921875 }, position: { x: -150.376556396484, y: 53.6923751831055, z: -353.767120361328 }, lookDir: { x: -142.144470214844, y: 53.6923751831055, z: -362.393463134766 }},  
            { id: 107, checkpointStart: { x: -237.871322631836, y: 52.1492004394531, z: -431.007385253906 }, checkpointEnd: { x: -247.984252929688, y: 52.0625, z: -430.9169921875 }, position: { x: -150.576217651367, y: 52.2462005615234, z: -434.602813720703 }, lookDir: { x: -150.576217651367, y: 52.2462005615234, z: -446.637878417969 }},
            
            //3
            { id: 108, checkpointStart: { x: -150.268005371094, y: 52.2613983154297, z: -481.4423828125 }, checkpointEnd: { x: -150.274154663086, y: 52.3107986450195, z: -472.671600341797 }, position: { x: -139.815902709961, y: 52.2462005615234, z: -477.555267333984 }, lookDir: { x: -131.015441894531, y: 52.2462005615234, z: -477.555267333984 }},
            { id: 109, checkpointStart: { x: -150.268005371094, y: 52.2613983154297, z: -481.4423828125 }, checkpointEnd: { x: -150.274154663086, y: 52.3107986450195, z: -472.671600341797 }, position: { x: -115.202857971191, y: 52.2462005615234, z: -476.706268310547 }, lookDir: { x: -107.049797058105, y: 52.2462005615234, z: -464.039947509766 }},
            { id: 110, checkpointStart: { x: -150.268005371094, y: 52.2613983154297, z: -481.4423828125 }, checkpointEnd: { x: -150.274154663086, y: 52.3107986450195, z: -472.671600341797 }, position: { x: -78.9804992675781, y: 52.2462005615234, z: -436.223815917969 }, lookDir: { x: -67.6515808105469, y: 52.2462005615234, z: -426.295715332031 }},

            //Under Bridge Section
            //4
            { id: 201, checkpointStart: { x: -67.9637222290039, y: 53.0414390563965, z: -433.199829101563 }, checkpointEnd: { x: -72.2665863037109, y: 53.2573394775391, z: -425.296020507813 }, position: { x: -40.526683807373, y: 53.6054992675781, z: -412.703948974609 }, lookDir: { x: -37.812255859375, y: 53.6054992675781, z: -406.911895751953 }},
            { id: 204, checkpointStart: { x: -67.9637222290039, y: 53.0414390563965, z: -433.199829101563 }, checkpointEnd: { x: -72.2665863037109, y: 53.2573394775391, z: -425.296020507813 }, position: { x: -22.74147605896, y: 54.5468978881836, z: -352.341430664063 }, lookDir: { x: -32.986011505127, y: 54.5468978881836, z: -347.292236328125 }},      
            
            //5
            { id: 205, checkpointStart: { x: -14.703408241272, y: 53.9015998840332, z: -374.466827392578 }, checkpointEnd: { x: -21.9963207244873, y: 53.8496017456055, z: -375.128692626953 }, position: { x: -68.4931945800781, y: 54.6907043457031, z: -327.882202148438 }, lookDir: { x: -71.981575012207, y: 54.6907043457031, z: -320.031402587891 }},    
            
            //6
            { id: 206, checkpointStart: { x: -74.2696685791016, y: 54.4036026000977, z: -350.427307128906 }, checkpointEnd: { x: -82.0299224853516, y: 54.3296012878418, z: -347.913848876953 }, position: { x: -65.5973052978516, y: 54.5222625732422, z: -271.857635498047 }, lookDir: { x: -65.5973052978516, y: 54.5222625732422, z: -259.916381835938 }},
            //7
            { id: 209, checkpointStart: { x: -65.9992523193359, y: 56.0828857421875, z: -253.292572021484 }, checkpointEnd: { x: -66.23388671875, y: 56.0826873779297, z: -245.418914794922 }, position: { x: -51.4164009094238, y: 55.988899230957, z: -248.390014648438 }, lookDir: { x: -39.0789947509766, y: 55.988899230957, z: -248.390014648438 }},
            { id: 210, checkpointStart: { x: -65.9992523193359, y: 56.0828857421875, z: -253.292572021484 }, checkpointEnd: { x: -66.23388671875, y: 56.0826873779297, z: -245.418914794922 }, position: {x: 18.2253360748291, y: 57.4927291870117, z: -238.313278198242 }, lookDir: { x: 22.4854965209961, y: 57.4927291870117, z: -233.758331298828 }},
            { id: 211, checkpointStart: { x: -65.9992523193359, y: 56.0828857421875, z: -253.292572021484 }, checkpointEnd: { x: -66.23388671875, y: 56.0826873779297, z: -245.418914794922 }, position: { x: 33.7116355895996, y: 61.1101989746094, z: -182.909606933594 }, lookDir: { x: 45.4965057373047, y: 61.1101989746094, z: -174.181030273438 }},   

            //Construction Section
            //8
            { id: 301, checkpointStart: { x: 27.3554916381836, y: 61.0613098144531, z: -179.885513305664 }, checkpointEnd: { x: 27.4598808288574, y: 60.9766120910645, z: -171.614852905273 }, position: { x: 137.641006469727, y: 61.9806365966797, z: -175.945007324219 }, lookDir: { x: 149.642486572266, y: 61.9806365966797, z: -192.895782470703 }},
            { id: 302, checkpointStart: { x: 27.3554916381836, y: 61.0613098144531, z: -179.885513305664 }, checkpointEnd: { x: 27.4598808288574, y: 60.9766120910645, z: -171.614852905273 }, position: { x: 155.483261108398, y: 64.5652008056641, z: -195.144012451172 }, lookDir: { x: 161.604217529297, y: 65.9321365356445, z: -200.081893920898 }}, 
            
            //9
            { id: 305, checkpointStart: { x: 166.864822387695, y: 57.2663688659668, z: -212.088287353516 }, checkpointEnd: { x: 173.268844604492, y: 57.2669677734375, z: -206.636505126953 }, position: { x: 211.233932495117, y: 57.3575973510742, z: -232.957977294922 }, lookDir: { x: 211.233932495117, y: 57.3575973510742, z: -236.861114501953 }},
            { id: 308, checkpointStart: { x: 166.864822387695, y: 57.2663688659668, z: -212.088287353516 }, checkpointEnd: { x: 173.268844604492, y: 57.2669677734375, z: -206.636505126953 }, position: { x: 195.723007202148, y: 57.2669982910156, z: -248.884460449219 }, lookDir: { x: 189.567993164063, y: 57.2669982910156, z: -248.884460449219 }},
            { id: 309, checkpointStart: { x: 166.864822387695, y: 57.2663688659668, z: -212.088287353516 }, checkpointEnd: { x: 173.268844604492, y: 57.2669677734375, z: -206.636505126953 }, position: { x: 146.446350097656, y: 57.8484878540039, z: -263.969299316406 }, lookDir: { x: 137.139877319336, y: 57.8484878540039, z: -274.788696289063 }},         
            
            //10
            { id: 310, checkpointStart: { x: 140.906112670898, y: 58.7355461120605, z: -272.439178466797 }, checkpointEnd: { x: 140.791290283203, y: 58.6628265380859, z: -282.595489501953 }, position: { x: 82.9648513793945, y: 56.4530029296875, z: -278.115417480469 }, lookDir: { x: 73.6866607666016, y: 56.4530029296875, z: -288.749389648438 }},
            { id: 311, checkpointStart: { x: 140.906112670898, y: 58.7355461120605, z: -272.439178466797 }, checkpointEnd: { x: 140.791290283203, y: 58.6628265380859, z: -282.595489501953 }, position: { x: 83.3203659057617, y: 54.9460983276367, z: -349.306518554688 }, lookDir: { x: 87.2165222167969, y: 54.9460983276367, z: -351.351287841797 }},
            { id: 312, checkpointStart: { x: 140.906112670898, y: 58.7355461120605, z: -272.439178466797 }, checkpointEnd: { x: 140.791290283203, y: 58.6628265380859, z: -282.595489501953 }, position: { x: 132.604110717773, y: 55.4968719482422, z: -350.926513671875 }, lookDir: { x: 139.619918823242, y: 55.4968719482422, z: -359.758331298828 }}, 
            { id: 313, checkpointStart: { x: 140.906112670898, y: 58.7355461120605, z: -272.439178466797 }, checkpointEnd: { x: 140.791290283203, y: 58.6628265380859, z: -282.595489501953 }, position: { x: 136.462921142578, y: 55.0185089111328, z: -384.005279541016 }, lookDir: { x: 128.273803710938, y: 54.9300231933594, z: -391.470428466797 }},
            
            //11
            { id: 314, checkpointStart: { x: 138.728363037109, y: 55.1738700866699, z: -383.969268798828 }, checkpointEnd: { x: 138.622817993164, y: 55.0257720947266, z: -392.228302001953 }, position: { x: 104.39315032959, y: 54.6074981689453, z: -401.285797119141 }, lookDir: { x: 94.4542617797852, y: 54.6074981689453, z: -411.502899169922 }},
            { id: 315, checkpointStart: { x: 138.728363037109, y: 55.1738700866699, z: -383.969268798828 }, checkpointEnd: { x: 138.622817993164, y: 55.0257720947266, z: -392.228302001953 }, position: { x: 25.3933353424072, y: 53.7190017700195, z: -403.693389892578 }, lookDir: { x: 20.7458915710449, y: 53.7190017700195, z: -398.448028564453 }},
            { id: 316, checkpointStart: { x: 138.728363037109, y: 55.1738700866699, z: -383.969268798828 }, checkpointEnd: { x: 138.622817993164, y: 55.0257720947266, z: -392.228302001953 }, position: { x: 15.96803855896, y: 54.4785003662109, z: -345.646301269531 }, lookDir: { x: 13.2080688476563, y: 54.4785003662109, z: -343.631958007813 }},
            { id: 320, checkpointStart: { x: 138.728363037109, y: 55.1738700866699, z: -383.969268798828 }, checkpointEnd: { x: 138.622817993164, y: 55.0257720947266, z: -392.228302001953 }, position: { x: -3.67642974853516, y: 54.4785003662109, z: -343.618011474609 }, lookDir: { x: -10.6072540283203, y: 54.4785003662109, z: -350.48583984375 }},
            
            //12
            { id: 317, checkpointStart: { x: -10.9711532592773, y: 54.5527687072754, z: -343.98828125 }, checkpointEnd: { x: -3.46448612213135, y: 54.7328720092773, z: -347.951782226563 }, position: { x: -39.6728553771973, y: 53.200927734375, z: -420.278747558594 }, lookDir: { x: -31.1819953918457, y: 53.200927734375, z: -428.621063232422 }},
            { id: 318, checkpointStart: { x: -10.9711532592773, y: 54.5527687072754, z: -343.98828125 }, checkpointEnd: { x: -3.46448612213135, y: 54.7328720092773, z: -347.951782226563 }, position: { x: 20.0639533996582, y: 53.3627014160156, z: -426.612426757813 }, lookDir: { x: 28.787389755249, y: 53.3627014160156, z: -437.563323974609 }},
            { id: 319, checkpointStart: { x: -10.9711532592773, y: 54.5527687072754, z: -343.98828125 }, checkpointEnd: { x: -3.46448612213135, y: 54.7328720092773, z: -347.951782226563 }, position: { x: 15.2622585296631, y: 52.4129943847656, z: -509.500732421875 }, lookDir: { x: 5.3206958770752, y: 52.4129943847656, z: -520.791625976563 }},
                                    
            //Park Section
            //13
            { id: 401, checkpointStart: { x: 29.9763813018799, y: 52.6369705200195, z: -486.192962646484 }, checkpointEnd: { x: 29.8891448974609, y: 52.6656684875488, z: -494.814422607422 }, position: { x: -53.4503364562988, y: 52.5223846435547, z: -507.031463623047 }, lookDir: { x: -63.0229148864746, y: 52.5223846435547, z: -507.031463623047 }},
            { id: 402, checkpointStart: { x: 29.9763813018799, y: 52.6369705200195, z: -486.192962646484 }, checkpointEnd: { x: 29.8891448974609, y: 52.6656684875488, z: -494.814422607422 }, position: { x: -94.7740936279297, y: 52.7163543701172, z: -503.626281738281 }, lookDir: { x: -114.839752197266, y: 52.7163543701172, z: -509.900665283203 }},
            { id: 403, checkpointStart: { x: 29.9763813018799, y: 52.6369705200195, z: -486.192962646484 }, checkpointEnd: { x: 29.8891448974609, y: 52.6656684875488, z: -494.814422607422 }, position: { x: -137.334014892578, y: 53.8198699951172, z: -513.792846679688 }, lookDir: { x: -149.602798461914, y: 53.8198699951172, z: -502.848724365234 }},
            
            //14
            { id: 404, checkpointStart: { x: -139.322662353516, y: 53.7591705322266, z: -521.484680175781 }, checkpointEnd: { x: -148.729095458984, y: 53.7607803344727, z: -524.070861816406 }, position: { x: -157.753005981445, y: 53.1951599121094, z: -495.542205810547 }, lookDir: { x: -164.871078491211, y: 54.4668426513672, z: -495.542205810547 }},
            { id: 405, checkpointStart: { x: -139.322662353516, y: 53.7591705322266, z: -521.484680175781 }, checkpointEnd: { x: -148.729095458984, y: 53.7607803344727, z: -524.070861816406 }, position: { x: -171.435302734375, y: 54.8112030029297, z: -508.156402587891 }, lookDir: { x: -163.969039916992, y: 54.8112030029297, z: -517.765441894531 }},
            { id: 407, checkpointStart: { x: -139.322662353516, y: 53.7591705322266, z: -521.484680175781 }, checkpointEnd: { x: -148.729095458984, y: 53.7607803344727, z: -524.070861816406 }, position: { x: -183.713119506836, y: 55.7439575195313, z: -514.77099609375 }, lookDir: { x: -186.761611938477, y: 55.7439575195313, z: -497.504028320313 }},
            { id: 408, checkpointStart: { x: -139.322662353516, y: 53.7591705322266, z: -521.484680175781 }, checkpointEnd: { x: -148.729095458984, y: 53.7607803344727, z: -524.070861816406 }, position: { x: -182.441513061523, y: 55.1398773193359, z: -483.60791015625 }, lookDir: { x: -174.50895690918, y: 55.1398773193359, z: -472.690704345703 }},
            { id: 409, checkpointStart: { x: -139.322662353516, y: 53.7591705322266, z: -521.484680175781 }, checkpointEnd: { x: -148.729095458984, y: 53.7607803344727, z: -524.070861816406 }, position: { x: -189.953094482422, y: 55.2002716064453, z: -472.261260986328 }, lookDir: { x: -200.191314697266, y: 55.2002716064453, z: -481.205352783203 }},           
            { id: 410, checkpointStart: { x: -139.322662353516, y: 53.7591705322266, z: -521.484680175781 }, checkpointEnd: { x: -148.729095458984, y: 53.7607803344727, z: -524.070861816406 }, position: { x: -210.712036132813, y: 54.0535736083984, z: -481.495941162109 }, lookDir: { x: -214.880477905273, y: 54.0535736083984, z: -474.536834716797 }},
           
            //15
            { id: 411, checkpointStart: { x: -209.680313110352, y: 54.1140823364258, z: -463.940765380859 }, checkpointEnd: { x: -212.902770996094, y: 54.1488800048828, z: -472.865905761719 }, position: { x: -234.861633300781, y: 52.1542663574219, z: -450.420806884766 }, lookDir: { x: -253.596832275391, y: 52.1542663574219, z: -434.48989868164 }},
            { id: 412, checkpointStart: { x: -209.680313110352, y: 54.1140823364258, z: -463.940765380859 }, checkpointEnd: { x: -212.902770996094, y: 54.1488800048828, z: -472.865905761719 }, position: { x: -256.066955566406, y: 52.0873718261719, z: -462.944671630859 }, lookDir: { x: -244.999664306641, y: 52.0873718261719, z: -462.944671630859 }},
            { id: 413, checkpointStart: { x: -209.680313110352, y: 54.1140823364258, z: -463.940765380859 }, checkpointEnd: { x: -212.902770996094, y: 54.1488800048828, z: -472.865905761719 }, position: { x: -245.276519775391, y: 51.3667984008789, z: -476.758514404297 }, lookDir: { x: -250.889022827148, y: 51.3667984008789, z: -485.511260986328 }},
            { id: 418, checkpointStart: { x: -209.680313110352, y: 54.1140823364258, z: -463.940765380859 }, checkpointEnd: { x: -212.902770996094, y: 54.1488800048828, z: -472.865905761719 }, position: { x: -237.826141357422, y: 51.3667984008789, z: -517.083190917969 }, lookDir: { x: -232.326797485352, y: 51.3667984008789, z: -509.827514648438 }},
            { id: 414, checkpointStart: { x: -209.680313110352, y: 54.1140823364258, z: -463.940765380859 }, checkpointEnd: { x: -212.902770996094, y: 54.1488800048828, z: -472.865905761719 }, position: { x: -205.348724365234, y: 54.1342315673828, z: -500.073120117188 }, lookDir: { x: -203.301116943359, y: 54.1342315673828, z: -506.895263671875 }},
           
            //16
            { id: 415, checkpointStart: { x: -200.408050537109, y: 55.0924034118652, z: -529.634948730469 }, checkpointEnd: { x: -195.706329345703, y: 55.1104202270508, z: -519.703735351563 }, position: { x: -198.677276611328, y: 54.9901123046875, z: -525.158935546875 }, lookDir: { x: -186.844177246094, y: 54.9901123046875, z: -532.082275390625 }},
            { id: 419, checkpointStart: { x: -200.408050537109, y: 55.0924034118652, z: -529.634948730469 }, checkpointEnd: { x: -195.706329345703, y: 55.1104202270508, z: -519.703735351563 }, position: { x: -177.462844848633, y: 54.990104675293, z: -530.705688476563 }, lookDir: { x: -164.010162353516, y: 54.990104675293, z: -527.580627441406 }},
            { id: 416, checkpointStart: { x: -200.408050537109, y: 55.0924034118652, z: -529.634948730469 }, checkpointEnd: { x: -195.706329345703, y: 55.1104202270508, z: -519.703735351563 }, position: { x: -150.126678466797, y: 52.9684753417969, z: -503.289337158203 }, lookDir: { x: -150.126678466797, y: 52.9684753417969, z: -484.937652587891 }},
            { id: 417, checkpointStart: { x: -200.408050537109, y: 55.0924034118652, z: -529.634948730469 }, checkpointEnd: { x: -195.706329345703, y: 55.1104202270508, z: -519.703735351563 }, position: { x: -150.850570678711, y: 52.6950531005859, z: -448.837249755859 }, lookDir: { x: -150.850570678711, y: 52.6950531005859, z: -436.185760498047 }}, 
             
            
            //Final Section
            //17
            { id: 501, checkpointStart: { x: -156.986587524414, y: 52.5462875366211, z: -431.683258056641 }, checkpointEnd: { x: -157.073013305664, y: 52.5460891723633, z: -422.202667236328 }, position: { x: -140.64323425293, y: 52.583740234375, z: -428.067443847656 }, lookDir: { x: -135.094802856445, y: 52.583740234375, z: -419.118988037109 }},
            { id: 502, checkpointStart: { x: -156.986587524414, y: 52.5462875366211, z: -431.683258056641 }, checkpointEnd: { x: -157.073013305664, y: 52.5460891723633, z: -422.202667236328 }, position: { x: -79.7107849121094, y: 52.5223999023438, z: -422.361450195313 }, lookDir: { x: -75.8333969116211, y: 53.0719375610352, z: -412.859222412109 }}, 
            { id: 503, checkpointStart: { x: -156.986587524414, y: 52.5462875366211, z: -431.683258056641 }, checkpointEnd: { x: -157.073013305664, y: 52.5460891723633, z: -422.202667236328 }, position: { x: -80.0895233154297, y: 54.5400085449219, z: -349.7607421875 }, lookDir: { x: -75.2408599853516, y: 54.5400085449219, z: -339.395477294922 }},    
            { id: 504, checkpointStart: { x: -156.986587524414, y: 52.5462875366211, z: -431.683258056641 }, checkpointEnd: { x: -157.073013305664, y: 52.5460891723633, z: -422.202667236328 }, position: { x: -61.2806663513184, y: 54.4488983154297, z: -278.604125976563 }, lookDir: { x: -55.3175315856934, y: 54.4488983154297, z: -274.078643798828 }}, 
           
            //18
            { id: 505, checkpointStart: { x: -82.1573791503906, y: 54.5528869628906, z: -279.644592285156 }, checkpointEnd: { x: -82.1218872070313, y: 54.5240898132324, z: -271.60888671875 }, position: { x: 23.6777992248535, y: 55.4387512207031, z: -276.126007080078 }, lookDir: { x: 33.7640190124512, y: 55.4387512207031, z: -276.126007080078 }}, 
            { id: 506, checkpointStart: { x: -82.1573791503906, y: 54.5528869628906, z: -279.644592285156 }, checkpointEnd: { x: -82.1218872070313, y: 54.5240898132324, z: -271.60888671875 }, position: { x: 137.188446044922, y: 57.5524444580078, z: -275.455108642578 }, lookDir: { x: 153.764587402344, y: 57.5524444580078, z: -275.455108642578 }},           
           
            //19
            { id: 507, checkpointStart: { x: 128.596740722656, y: 57.5616493225098, z: -280.582122802734  }, checkpointEnd: { x: 128.632217407227, y: 57.5679779052734, z: -271.520355224609  }, position: { x: 214.202835083008, y: 62.9375991821289, z: -275.358001708984 }, lookDir: { x: 232.7919921875, y: 62.9375991821289, z: -275.358001708984 }}        ]
    },
    {
        trackId: "track_02",
        name: "Air_Lap",
        laps: 1,
        availableVehicles: [mod.VehicleList.F22, mod.VehicleList.F16, mod.VehicleList.JAS39],
        gametype: GameType.race,
        checkPoints: [
            { id: 106, checkpointStart: { x: 224.177551269531, y: 185.776763916016, z: -25.1318969726563 }, checkpointEnd: { x: 88.1495590209961, y: 185.776763916016, z: 105.332855224609 }, position: { x: 547.106201171875, y: 183.570999145508, z: 453.183319091797 } },
            { id: 107, checkpointStart: { x: 224.177551269531, y: 185.776763916016, z: -25.1318969726563 }, checkpointEnd: { x: 88.1495590209961, y: 185.776763916016, z: 105.332855224609 }, position: { x: 883.77880859375, y: 201.873992919922, z: 898.134033203125 } },

            { id: 108, checkpointStart: { x: 1174.2579345, y: 187.2900, z: 1043.66088 }, checkpointEnd: { x: 1047.197265625, y: 186.30224609375, z: 1181.48742675781 }, position: { x: 1552.362, y: 201.8742, z: 1429.677 } },
            { id: 109, checkpointStart: { x: 1174.2579345, y: 187.2900, z: 1043.66088 }, checkpointEnd: { x: 1047.197265625, y: 186.30224609375, z: 1181.48742675781 }, position: { x: 2048.393, y: 208.4673, z: 1706.873 } },

            { id: 110, checkpointStart: { x: 2296.06323242188, y: 188.086486816406, z: 1665.53356933594 }, checkpointEnd: { x: 2205.1943359375, y: 187.098724365234, z: 1829.49523925781 }, position: { x: 2676.97, y: 208.4673, z: 1946.0 } },
            { id: 111, checkpointStart: { x: 2296.06323242188, y: 188.086486816406, z: 1665.53356933594 }, checkpointEnd: { x: 2205.1943359375, y: 187.098724365234, z: 1829.49523925781 }, position: { x: 3299.96630859375, y: 261.307495117188, z: 2330.958984375 } },

            { id: 112, checkpointStart: { x: 3409.69604492188, y: 187.067138671875, z: 2247.3193359375 }, checkpointEnd: { x: 3268.25463867188, y: 186.079376220703, z: 2370.34326171875 }, position: { x: 3939.844, y: 263.038, z: 2924.436 } },
            { id: 113, checkpointStart: { x: 3409.69604492188, y: 187.067138671875, z: 2247.3193359375 }, checkpointEnd: { x: 3268.25463867188, y: 186.079376220703, z: 2370.34326171875 }, position: { x: 4617.52392578125, y: 271.122009277344, z: 3677.669921875 } },
           
            { id: 114, checkpointStart: { x: 4671.20703125, y: 310.601776123047, z: 4259.2900390625 }, checkpointEnd:  { x: 4805.0439453125, y: 310.499969482422, z: 4372.10498046875 }, position: { x: 5288.721, y: 355.434, z: 3896.095 }, },
            { id: 115, checkpointStart: { x: 4671.20703125, y: 310.601776123047, z: 4259.2900390625 }, checkpointEnd:  { x: 4805.0439453125, y: 310.499969482422, z: 4372.10498046875 }, position: { x: 5466.977, y: 423.387, z: 3535.378 }, },

            { id: 116, checkpointStart: { x: 5552.3984375, y: 530.694274902344, z: 3811.77294921875 }, checkpointEnd: { x: 5708.0478515625, y: 529.706481933594, z: 3722.24780273438 }, position: { x: 5326.602, y: 557.992, z: 3181.616 } },
            { id: 117, checkpointStart: { x: 5552.3984375, y: 530.694274902344, z: 3811.77294921875 }, checkpointEnd: { x: 5708.0478515625, y: 529.706481933594, z: 3722.24780273438 }, position: { x: 4515.22607421875, y: 441.529144287109, z: 2739.50341796875 } },

            { id: 118, checkpointStart: { x: 4541.82080078125, y: 328.444671630859, z: 2850.97265625 }, checkpointEnd: { x: 4629.31396484375, y: 327.456909179688, z: 2685.18530273438 }, position: { x: 3970.04, y: 334.594, z: 2572.894 } },
            { id: 119, checkpointStart: { x: 4541.82080078125, y: 328.444671630859, z: 2850.97265625 }, checkpointEnd: { x: 4629.31396484375, y: 327.456909179688, z: 2685.18530273438 }, position: { x: 3342.115, y: 260.9633, z: 2219.49 } },

            { id: 120, checkpointStart: { x: 3309.59326171875, y: 187.919281005859, z: 2412.44750976563 }, checkpointEnd: { x: 3450.93359375, y: 186.931518554688, z: 2289.3076171875 }, position: { x: 2624.016, y: 293.6768, z: 2070.868 }, flipdir: true },
            { id: 121, checkpointStart: { x: 3309.59326171875, y: 187.919281005859, z: 2412.44750976563 }, checkpointEnd: { x: 3450.93359375, y: 186.931518554688, z: 2289.3076171875 }, position: { x: 2050.632, y: 311.7585, z: 1620.939 }, flipdir: true },

            { id: 1210, checkpointStart: { x: 2259.86279296875, y: 187.481216430664, z: 1861.27551269531 }, checkpointEnd: { x: 2349.51904296875, y: 186.493453979492, z: 1696.64758300781 }, position: { x: 1518.23, y: 323.8511, z: 1482.588 }, flipdir: true },
            { id: 122, checkpointStart: { x: 2259.86279296875, y: 187.481216430664, z: 1861.27551269531 }, checkpointEnd: { x: 2349.51904296875, y: 186.493453979492, z: 1696.64758300781 }, position: { x: 1042.26672363281, y: 292.134704589844, z: 854.870483398438 }, flipdir: true },

            { id: 123, checkpointStart: { x: 1088.71118164063, y: 186.349456787109, z: 1222.66943359375 }, checkpointEnd: { x: 1216.44152832031, y: 185.361694335938, z: 1085.46325683594 }, position: { x: 393.625457763672, y: 350.244506835938, z: 96.0521240234375 }, flipdir: true },

            { id: 1230, checkpointStart: { x: 127.68977355957, y: 185.05647277832, z: 148.481643676758 }, checkpointEnd: { x: 262.190673828125, y: 183.409637451172, z: 17.2779006958008 }, position: { x: -78.9294662475586, y: 213.880004882813, z: -173.546005249023 }, flipdir: true },
            { id: 124, checkpointStart: { x: 127.68977355957, y: 185.05647277832, z: 148.481643676758 }, checkpointEnd: { x: 262.190673828125, y: 183.409637451172, z: 17.2779006958008 }, position: { x: -530.65, y: 301.9926, z: -101.325 }, flipdir: true },
            { id: 125, checkpointStart: { x: 127.68977355957, y: 185.05647277832, z: 148.481643676758 }, checkpointEnd: { x: 262.190673828125, y: 183.409637451172, z: 17.2779006958008 }, position: { x: -1235.055, y: 251.483, z: -262.1271 }, flipdir: true },

            { id: 126, checkpointStart: { x: -2109.8779296875, y: 483.681701660156, z: -280.909484863281 }, checkpointEnd: { x: -2105.28930664063, y: 482.693939208984, z: -468.311492919922 }, position: { x: -2510.07, y: 675.4128, z: -367.911 } },
            { id: 127, checkpointStart: { x: -2109.8779296875, y: 483.681701660156, z: -280.909484863281 }, checkpointEnd: { x: -2105.28930664063, y: 482.693939208984, z: -468.311492919922 }, position: { x: -3051.823, y: 992.7201, z: -134.6379 } },
            { id: 1280, checkpointStart: { x: -2109.8779296875, y: 483.681701660156, z: -280.909484863281 }, checkpointEnd: { x: -2105.28930664063, y: 482.693939208984, z: -468.311492919922 }, position: { x: -3324.713, y: 924.931, z: 221.4012 } },

            { id: 128, checkpointStart: { x: -2947.99340820313, y: 739.220336914063, z: 93.411865234375 }, checkpointEnd: { x: -3132.34106445313, y: 738.232543945313, z: 59.4026794433594 }, position: { x: -3465.781, y: 875.6663, z: 683.3296 } },
            { id: 129, checkpointStart: { x: -2947.99340820313, y: 739.220336914063, z: 93.411865234375 }, checkpointEnd: { x: -3132.34106445313, y: 738.232543945313, z: 59.4026794433594 }, position: { x: -3273.344, y: 829.738, z: 973.0317 } },
            { id: 130, checkpointStart: { x: -2947.99340820313, y: 739.220336914063, z: 93.411865234375 }, checkpointEnd: { x: -3132.34106445313, y: 738.232543945313, z: 59.4026794433594 }, position: { x: -2918.56, y: 751.904, z: 941.331 } },

            { id: 1300, checkpointStart: { x: -2819.57739257813, y: 607.91748046875, z: 672.408569335938 }, checkpointEnd: { x: -2648.84423828125, y: 606.9296875, z: 749.808410644531 }, position: { x: -2617.48413085938, y: 633.155151367188, z: 378.069183349609 } },
            { id: 131, checkpointStart: { x: -2819.57739257813, y: 607.91748046875, z: 672.408569335938 }, checkpointEnd: { x: -2648.84423828125, y: 606.9296875, z: 749.808410644531 }, position: { x: -2477.86, y: 537.821, z: 174.285 } },

            { id: 132, checkpointStart: { x: -2157.56713867188, y: 482.034240722656, z: -155.647933959961 }, checkpointEnd: { x: -2166.33764648438, y: 481.046478271484, z: 31.6049041748047 }, position: { x: -1207.372, y: 354.4803, z: -96.10004 } },
            { id: 133, checkpointStart: { x: -2157.56713867188, y: 482.034240722656, z: -155.647933959961 }, checkpointEnd: { x: -2166.33764648438, y: 481.046478271484, z: 31.6049041748047 }, position: { x: -80.90897, y: 260.4618, z: 68.27824 } },

        ]
    },
    {
        trackId: "track_03",
        name: "CQR",
        laps: 2,
        availableVehicles: [mod.VehicleList.Quadbike, mod.VehicleList.GolfCart],
        gametype: GameType.race,
        checkPoints: [
            //First Section
                    
            //1
            { id: 101, checkpointStart: { x: 588.829284667969, y: 71.4838562011719, z: 126.785049438477 }, checkpointEnd: { x: 583.372741699219, y: 71.4838562011719, z: 126.785057067871 }, position: { x: 590.818725585938, y: 73.2213745117188, z: 170.303421020508 }, lookDir: { x: 594.783569335938, y: 73.2213745117188, z: 174.305953979492 }},
            { id: 102, checkpointStart: { x: 588.829284667969, y: 71.4838562011719, z: 126.785049438477 }, checkpointEnd: { x: 583.372741699219, y: 71.4838562011719, z: 126.785057067871 }, position: { x: 659.32275390625, y: 73.2226791381836, z: 167.995239257813 }, lookDir: { x: 666.231201171875, y: 73.2226791381836, z: 157.392227172852 }},
            { id: 103, checkpointStart: { x: 588.829284667969, y: 71.4838562011719, z: 126.785049438477 }, checkpointEnd: { x: 583.372741699219, y: 71.4838562011719, z: 126.785057067871 }, position: { x: 669.473693847656, y: 70.8615798950195, z: 108.514427185059 }, lookDir: { x: 675.364990234375, y: 70.8615798950195, z: 99.0321197509766 }},
           
            { id: 104, checkpointStart: { x: 672.681518554688, y: 71.4838790893555, z: 96.1397018432617 }, checkpointEnd: { x: 676.539916992188, y: 71.4838790893555, z: 99.9980773925781 }, position: { x: 708.399780273438, y: 71.5235137939453, z: 69.7846527099609 }, lookDir: { x: 718.506652832031, y: 71.5235137939453, z: 71.565544128418 }},
            { id: 105, checkpointStart: { x: 672.681518554688, y: 71.4838790893555, z: 96.1397018432617 }, checkpointEnd: { x: 676.539916992188, y: 71.4838790893555, z: 99.9980773925781 }, position: { x: 733.464599609375, y: 72.5542907714844, z: 70.5446929931641 }, lookDir: { x: 745.743408203125, y: 72.5542907714844, z: 63.231315612793 }},
            { id: 106, checkpointStart: { x: 672.681518554688, y: 71.4838790893555, z: 96.1397018432617 }, checkpointEnd: { x: 676.539916992188, y: 71.4838790893555, z: 99.9980773925781 }, position: { x: 787.020080566406, y: 73.8905715942383, z: 38.7105560302734 }, lookDir: { x: 794.901916503906, y: 73.8905715942383, z: 40.75390625 }},

            //2
            { id: 201, checkpointStart: { x: 796.280029296875, y: 76.1431427001953, z: 51.5130004882813 }, checkpointEnd: { x: 799.728576660156, y: 76.1431427001953, z: 55.7416534423828 }, position: { x: 805.5927734375, y: 73.8905715942383, z: 48.6513595581055 }, lookDir: { x: 809.755493164063, y: 73.8905715942383, z: 45.4444732666016 }},
            { id: 202, checkpointStart: { x: 796.280029296875, y: 76.1431427001953, z: 51.5130004882813 }, checkpointEnd: { x: 799.728576660156, y: 76.1431427001953, z: 55.7416534423828 }, position: { x: 838.528076171875, y: 73.8905715942383, z: 45.5472564697266 }, lookDir: { x: 842.8798828125, y: 73.8905715942383, z: 50.3938522338867 }},
            { id: 203, checkpointStart: { x: 796.280029296875, y: 76.1431427001953, z: 51.5130004882813 }, checkpointEnd: { x: 799.728576660156, y: 76.1431427001953, z: 55.7416534423828 }, position: { x: 833.315185546875, y: 73.8905715942383, z: 78.3191909790039 }, lookDir: { x: 829.793334960938, y: 73.8905715942383, z: 82.0229568481445 }},
            
            //3
            { id: 301, checkpointStart: { x: 821.947387695313, y: 76.1431427001953, z: 72.0452728271484 }, checkpointEnd: { x: 818.75537109375, y: 76.1431427001953, z: 76.4707870483398 }, position: { x: 851.898559570313, y: 78.1860961914063, z: 116.520225524902 }, lookDir: { x: 857.3896484375, y: 78.1860961914063, z: 116.520225524902 }},
            { id: 302, checkpointStart: { x: 821.947387695313, y: 76.1431427001953, z: 72.0452728271484 }, checkpointEnd: { x: 818.75537109375, y: 76.1431427001953, z: 76.4707870483398 }, position: { x: 887.012878417969, y: 79.1503219604492, z: 128.871963500977 }, lookDir: { x: 888.667724609375, y: 79.1503219604492, z: 130.991165161133 }},
            { id: 303, checkpointStart: { x: 821.947387695313, y: 76.1431427001953, z: 72.0452728271484 }, checkpointEnd: { x: 818.75537109375, y: 76.1431427001953, z: 76.4707870483398 }, position: { x: 928.99609375, y: 74.366340637207, z: 126.587127685547 }, lookDir: { x: 937.198547363281, y: 74.366340637207, z: 134.789566040039 }},
            
            { id: 304, checkpointStart: { x: 901.557006835938, y: 76.143180847168, z: 134.796096801758 }, checkpointEnd: { x: 896.734130859375, y: 76.143180847168, z: 137.348373413086 }, position: { x: 910.1826171875, y: 76.5349502563477, z: 163.632781982422 }, lookDir: { x: 911.287780761719, y: 76.5349502563477, z: 166.974884033203 }},
            { id: 305, checkpointStart: { x: 901.557006835938, y: 76.143180847168, z: 134.796096801758 }, checkpointEnd: { x: 896.734130859375, y: 76.143180847168, z: 137.348373413086 }, position: { x: 904.10888671875, y: 85.3056793212891, z: 216.421569824219 }, lookDir: { x: 898.360290527344, y: 85.3056793212891, z: 215.775405883789 }},
            { id: 305, checkpointStart: { x: 901.557006835938, y: 76.143180847168, z: 134.796096801758 }, checkpointEnd: { x: 896.734130859375, y: 76.143180847168, z: 137.348373413086 }, position: { x: 886.64794921875, y: 85.4971542358398, z: 197.948364257813 }, lookDir: { x: 880.470336914063, y: 85.4971542358398, z: 189.450668334961 }},

            //4
            { id: 401, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 859.334899902344, y: 83.9314346313477, z: 171.347152709961 }, lookDir: { x: 853.81689453125, y: 83.9314346313477, z: 174.210815429688 }},
            { id: 402, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 836.45263671875, y: 85.5184097290039, z: 196.28434753418 }, lookDir: { x: 839.307189941406, y: 85.5184097290039, z: 203.254653930664 }},
            { id: 403, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 858.004943847656, y: 85.62744140625, z: 213.069381713867 }, lookDir: { x: 865.545349121094, y: 85.62744140625, z: 210.987365722656 }},
            { id: 404, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 876.470092773438, y: 85.6274871826172, z: 195.384170532227 }, lookDir: { x: 881.539123535156, y: 85.6274871826172, z: 195.384170532227 }},
            { id: 405, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 888.516906738281, y: 85.5357284545898, z: 208.786239624023 }, lookDir: { x: 888.516906738281, y: 85.5357284545898, z: 215.882369995117 }},
            { id: 406, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 883.962341308594, y: 86.2075805664063, z: 234.281448364258 }, lookDir: { x: 885.747985839844, y: 86.2075805664063, z: 238.993453979492 }},
            { id: 407, checkpointStart: { x: 906.182861328125, y: 85.5082397460938, z: 227.766525268555 }, checkpointEnd: { x: 911.152465820313, y: 85.9550399780273, z: 224.326721191406 }, position: { x: 889.240112304688, y: 86.9995651245117, z: 251.599594116211 }, lookDir: { x: 886.898010253906, y: 86.9995651245117, z: 253.245681762695 }},

            //5
            { id: 501, checkpointStart: { x: 871.3359375, y: 88.7368698120117, z: 244.144287109375 }, checkpointEnd: { x: 872.505676269531, y: 88.7368698120117, z: 238.814575195313 }, position: { x: 839.822814941406, y: 89.2003021240234, z: 235.093048095703 }, lookDir: { x: 833.979431152344, y: 89.2003021240234, z: 232.563659667969 }},
            { id: 502, checkpointStart: { x: 871.3359375, y: 88.7368698120117, z: 244.144287109375 }, checkpointEnd: { x: 872.505676269531, y: 88.7368698120117, z: 238.814575195313 }, position: { x: 774.735046386719, y: 86.8938446044922, z: 224.028686523438 }, lookDir: { x: 764.880737304688, y: 86.8938446044922, z: 227.683685302734 }},
            { id: 503, checkpointStart: { x: 871.3359375, y: 88.7368698120117, z: 244.144287109375 }, checkpointEnd: { x: 872.505676269531, y: 88.7368698120117, z: 238.814575195313 }, position: { x: 709.930480957031, y: 82.4707717895508, z: 237.285858154297 }, lookDir: { x: 706.537414550781, y: 82.4707717895508, z: 237.285858154297 }},
            
            { id: 504, checkpointStart: { x: 680.183959960938, y: 80.046142578125, z: 233.471374511719 }, checkpointEnd: { x: 681.353698730469, y: 80.046142578125, z: 228.141662597656 }, position: { x: 667.368957519531, y: 80.1208114624023, z: 229.498916625977 }, lookDir: { x: 662.567138671875, y: 80.1208114624023, z: 229.498916625977 }},
            { id: 505, checkpointStart: { x: 680.183959960938, y: 80.046142578125, z: 233.471374511719 }, checkpointEnd: { x: 681.353698730469, y: 80.046142578125, z: 228.141662597656 }, position: { x: 612.535278320313, y: 79.1797180175781, z: 228.355865478516 }, lookDir: { x: 608.95556640625, y: 79.1797180175781, z: 225.352462768555 }},
            { id: 506, checkpointStart: { x: 680.183959960938, y: 80.046142578125, z: 233.471374511719 }, checkpointEnd: { x: 681.353698730469, y: 80.046142578125, z: 228.141662597656 }, position: { x: 606.1044921875, y: 75.7174453735352, z: 209.318756103516 }, lookDir: { x: 608.911010742188, y: 75.7174453735352, z: 207.122909545898 }},
            { id: 507, checkpointStart: { x: 680.183959960938, y: 80.046142578125, z: 233.471374511719 }, checkpointEnd: { x: 681.353698730469, y: 80.046142578125, z: 228.141662597656 }, position: { x: 622.014587402344, y: 75.4745483398438, z: 199.926330566406 }, lookDir: { x: 622.014587402344, y: 75.4745483398438, z: 196.620056152344 }},
            { id: 508, checkpointStart: { x: 680.183959960938, y: 80.046142578125, z: 233.471374511719 }, checkpointEnd: { x: 681.353698730469, y: 80.046142578125, z: 228.141662597656 }, position: { x: 643.352172851563, y: 75.5242080688477, z: 199.882019042969 }, lookDir: { x: 643.352172851563, y: 75.5242080688477, z: 201.911697387695 }},
            { id: 509, checkpointStart: { x: 680.183959960938, y: 80.046142578125, z: 233.471374511719 }, checkpointEnd: { x: 681.353698730469, y: 80.046142578125, z: 228.141662597656 }, position: { x: 653.374816894531, y: 75.8539733886719, z: 207.803573608398 }, lookDir: { x: 657.702087402344, y: 75.8539733886719, z: 207.803573608398 }},

            
            //6
            { id: 601, checkpointStart: { x: 667.101013183594, y: 75.9365844726563, z: 200.092849731445 }, checkpointEnd: { x: 662.494506835938, y: 75.9365844726563, z: 203.740661621094 }, position: { x: 670.351013183594, y: 76.7522964477539, z: 209.480239868164 }, lookDir: { x: 674.445739746094, y: 76.7522964477539, z: 212.609649658203 }},
            { id: 602, checkpointStart: { x: 667.101013183594, y: 75.9365844726563, z: 200.092849731445 }, checkpointEnd: { x: 662.494506835938, y: 75.9365844726563, z: 203.740661621094 }, position: { x: 706.313842773438, y: 81.3098754882813, z: 222.339859008789 }, lookDir: { x: 711.419128417969, y: 81.3098754882813, z: 220.140106201172 }},
            { id: 603, checkpointStart: { x: 667.101013183594, y: 75.9365844726563, z: 200.092849731445 }, checkpointEnd: { x: 662.494506835938, y: 75.9365844726563, z: 203.740661621094 }, position: { x: 763.723205566406, y: 84.220329284668, z: 198.184188842773 }, lookDir: { x: 765.057800292969, y: 84.220329284668, z: 193.657852172852 }},
            
            { id: 604, checkpointStart: { x: 760.257873535156, y: 83.8783187866211, z: 192.246063232422 }, checkpointEnd: { x: 765.867309570313, y: 83.8783187866211, z: 190.496643066406 }, position: { x: 746.305908203125, y: 77.4132690429688, z: 141.492492675781 }, lookDir: { x: 750.788818359375, y: 77.4132690429688, z: 136.325973510742 }},
            
             //7
            { id: 701, checkpointStart: { x: 762.660888671875, y: 78.2568893432617, z: 123.728805541992 }, checkpointEnd: { x: 759.814147949219, y: 78.2568893432617, z: 128.383926391602 }, position: { x: 771.691589355469, y: 78.2625503540039, z: 131.701904296875 }, lookDir: { x: 776.196838378906, y: 78.2625503540039, z: 132.286239624023 }},
            { id: 702, checkpointStart: { x: 762.660888671875, y: 78.2568893432617, z: 123.728805541992 }, checkpointEnd: { x: 759.814147949219, y: 78.2568893432617, z: 128.383926391602 }, position: { x: 859.532165527344, y: 82.9623870849609, z: 157.234436035156 }, lookDir: { x: 864.550231933594, y: 82.9623870849609, z: 153.006408691406 }},
             
            { id: 703, checkpointStart: { x: 856.95556640625, y: 82.98974609375, z: 147.114807128906 }, checkpointEnd: { x: 862.260192871094, y: 82.98974609375, z: 145.836090087891 }, position: { x: 818.486450195313, y: 74.3407363891602, z: 75.9260864257813 }, lookDir: { x: 813.28759765625, y: 74.3407363891602, z: 75.7330017089844 }},
             
            { id: 704, checkpointStart: { x: 813.122497558594, y: 75.0009231567383, z: 81.7920074462891 }, checkpointEnd: { x: 810.063781738281, y: 75.0009231567383, z: 77.273323059082 }, position: { x: 760.928283691406, y: 78.2656936645508, z: 132.416046142578 }, lookDir: { x: 759.045166015625, y: 78.2656936645508, z: 136.474868774414 }},
           
            { id: 705, checkpointStart: { x: 747.823486328125, y: 78.5203552246094, z: 142.315093994141 }, checkpointEnd: { x: 745.941162109375, y: 78.2568817138672, z: 137.200256347656 }, position: { x: 671.697937011719, y: 71.6268310546875, z: 158.0361328125 }, lookDir: { x: 668.745910644531, y: 71.6268310546875, z: 154.870025634766 }},
           
            { id: 706, checkpointStart: { x: 666.535888671875, y: 72.7935485839844, z: 161.548934936523 }, checkpointEnd: { x: 671.979858398438, y: 72.7883682250977, z: 161.919250488281 }, position: { x: 667.371398925781, y: 70.9365158081055, z: 125.771850585938 }, lookDir: { x: 663.454223632813, y: 70.9365158081055, z: 123.18677520752 }},
            { id: 707, checkpointStart: { x: 666.535888671875, y: 72.7935485839844, z: 161.548934936523 }, checkpointEnd: { x: 671.979858398438, y: 72.7883682250977, z: 161.919250488281 }, position: { x: 588.416442871094, y: 69.5625915527344, z: 122.221405029297 }, lookDir: { x: 585.868469238281, y: 69.5625915527344, z: 127.595138549805 }},

        ]
    }
];


// === UI_BenjiOvertake.ts ===


class HoH_BenjiOvertakeUI {

    #playerprofile: PlayerProfile;

    rootwidgets: mod.UIWidget[] = [];

    constructor(playerProfile: PlayerProfile) {
        this.#playerprofile = playerProfile;
        this.#Create();
    }

    Delete() {
        this.rootwidgets.forEach(rootwidget => {
            mod.DeleteUIWidget(rootwidget)
        });
    }

    Close(){
           this.rootwidgets.forEach(rootwidget => {
            mod.SetUIWidgetVisible(rootwidget, false)
        });
    }

    #Create() {
        const coolahhuiname: string = "overtake_message_" + this.#playerprofile.playerProfileId;
        mod.AddUIText(coolahhuiname, mod.CreateVector(0, 100, 0), mod.CreateVector(200, 40, 0), mod.UIAnchor.TopCenter, MakeMessage(mod.stringkeys.overtakenmessage), this.#playerprofile.player);
        const widget = mod.FindUIWidgetWithName(coolahhuiname);
        mod.SetUITextColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUITextSize(widget, 40);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);
        mod.SetUIWidgetPadding(widget, -100);
        mod.SetUIWidgetVisible(widget, true);
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0.678, 0.753, 0.800));
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);
        this.rootwidgets.push(widget)

        this.rootwidgets.push(this.CreateFadeLineUI(true))
        this.rootwidgets.push(this.CreateFadeLineUI(false))
    }


    CreateFadeLineUI(right: boolean): mod.UIWidget {
        const coolahhuiname: string = "overtake_message_line_" + right + "_" + this.#playerprofile.playerProfileId;
        let horizontalOffset: number = right ? 175 : -175;
        mod.AddUIContainer(coolahhuiname, mod.CreateVector(horizontalOffset, 100, 0), mod.CreateVector(150, 40, 0), mod.UIAnchor.TopCenter, this.#playerprofile.player);
        let widget = mod.FindUIWidgetWithName(coolahhuiname);
        mod.SetUIWidgetPadding(widget, 1);
        right ? mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientLeft) : mod.SetUIWidgetBgFill(widget, mod.UIBgFill.GradientRight);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0.678, 0.753, 0.800));
        mod.SetUIWidgetBgAlpha(widget, 0.9);
        mod.SetUIWidgetVisible(widget, false);

        return widget;
    }


    async Trigger() {

        if (this.FeedbackBeingShown) {
            return;
        }
        this.FeedbackBeingShown = true;


        mod.SetUIWidgetVisible(this.rootwidgets[0], true);
        mod.SetUIWidgetBgAlpha(this.rootwidgets[0], 1);
        mod.SetUITextAlpha(this.rootwidgets[0], 1);

        mod.SetUIWidgetVisible(this.rootwidgets[1], true);
        mod.SetUIWidgetVisible(this.rootwidgets[2], true);
        mod.SetUIWidgetBgAlpha(this.rootwidgets[1], 1);
        mod.SetUIWidgetBgAlpha(this.rootwidgets[2], 1);

        await mod.Wait(2.0);
        this.InterpFeedback();
        await mod.Wait(5.0);

        this.FeedbackBeingShown = false;
        mod.SetUIWidgetVisible(this.rootwidgets[0], false);
        mod.SetUIWidgetVisible(this.rootwidgets[1], false);
        mod.SetUIWidgetVisible(this.rootwidgets[2], false);
    }
    FeedbackBeingShown: boolean = false;
    FeedbackQueued: boolean = false;

    async InterpFeedback() {


        let currentLerpvalue: number = 0;
        let lerpIncrement: number = 0;
        while (currentLerpvalue < 1.0) {
            if (!this.FeedbackBeingShown) break;
            lerpIncrement = lerpIncrement + 0.1;
            currentLerpvalue = Lerp(currentLerpvalue, 1, lerpIncrement);
            mod.SetUIWidgetBgAlpha(this.rootwidgets[0], 1 - currentLerpvalue);
            mod.SetUITextAlpha(this.rootwidgets[0], 1 - currentLerpvalue);
            mod.SetUIWidgetBgAlpha(this.rootwidgets[1], 1 - currentLerpvalue);
            mod.SetUIWidgetBgAlpha(this.rootwidgets[2], 1 - currentLerpvalue);
            await mod.Wait(0.1);
        }

    }

}

// === UI_EndingGameCountdown.ts ===



class HoH_UIEndingGameCountdown {
    #Player: PlayerProfile

    headerWidget: mod.UIWidget | undefined
    textWidget: mod.UIWidget | undefined

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf;

        const bfBlueColor = [0.678, 0.753, 0.800]
        const height = 35;
        const width = 240;
        this.headerWidget = ParseUI(
            {
                type: "Container",
                size: [width, height],
                position: [0, 155],
                name: "ending_countdown_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.TopCenter,
                bgFill: mod.UIBgFill.Blur,
                bgColor: [0.2, 0.2, 0.3],
                bgAlpha: 0.8,
                playerId: playerProf.player,
                visible: false,
                children: [
                    {
                        type: "Text",
                        name: "ending_countdown_text_" + this.#Player.playerProfileId,
                        size: [width, height],
                        position: [0, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.None,
                        textColor: bfBlueColor,
                        textAnchor: mod.UIAnchor.Center,
                        textLabel: MakeMessage(mod.stringkeys.gameending, 12),
                        textSize: 25
                    },
                ]
            }
        )
        this.textWidget = mod.FindUIWidgetWithName("ending_countdown_text_" + this.#Player.playerProfileId)
    }


    Delete() {
        this.headerWidget && mod.DeleteUIWidget(this.headerWidget)
        this.textWidget && mod.DeleteUIWidget(this.textWidget)
    }


    Open(timeleft: number) {
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, true)
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(mod.stringkeys.gameending, timeleft))
    }


    update(timeleft: number) {
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(mod.stringkeys.gameending, timeleft))
    }

    async Close(delayclose: number = 0) {
        await mod.Wait(delayclose)
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, false)
    }
}


// === UI_FadeInBlackScreen.ts ===



class HoH_UIBlackScreen {
    #Player: PlayerProfile

    #black_screen_widget: mod.UIWidget | undefined;

    fadeinTime: number = 1;
    fadeOutTime: number = 1;

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf

        this.#black_screen_widget = ParseUI(
            {
                type: "Container",
                size: [2500, 2500],
                position: [0, 0],
                name: "fadeScreen_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: [0, 0, 0],
                bgAlpha: 0.0,
                playerId: playerProf.player
            }
        )
    }

    Close() {
        this.#black_screen_widget && mod.SetUIWidgetVisible(this.#black_screen_widget, false)
    }

    Delete() {
        this.#black_screen_widget && mod.DeleteUIWidget(this.#black_screen_widget)
    }

    async FadeIn() {

        if (this.#black_screen_widget) {

            this.#black_screen_widget && mod.SetUIWidgetVisible(this.#black_screen_widget, true)
            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 0);


            let time = 0;

            while (time < 1) {

                time += 0.1


                if (time > 1) {
                    time = 1;
                }

                mod.SetUIWidgetBgAlpha(this.#black_screen_widget, time)
                await mod.Wait(0.1)

            }

            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 1)

        }
    }

    async FadeOut() {

        if (this.#black_screen_widget) {

            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 1);

            let time = 1;

            while (time > 0) {

                time -= 0.1

                if (time < 0) {
                    time = 0;
                }

                mod.SetUIWidgetBgAlpha(this.#black_screen_widget, time)
                await mod.Wait(0.1)

            }

            mod.SetUIWidgetBgAlpha(this.#black_screen_widget, 0);
            this.#black_screen_widget && mod.SetUIWidgetVisible(this.#black_screen_widget, false)
        }
    }
}

// === UI_GlobalHelpers.ts ===



type UIVector = mod.Vector | number[];

interface UIParams {
    name: string;
    type: string;
    position: any;
    size: any;
    anchor: mod.UIAnchor;
    parent: mod.UIWidget;
    visible: boolean;
    textLabel: string;
    textColor: UIVector;
    textAlpha: number;
    textSize: number;
    textAnchor: mod.UIAnchor;
    padding: number;
    bgColor: UIVector;
    bgAlpha: number;
    bgFill: mod.UIBgFill;
    imageType: mod.UIImageType;
    imageColor: UIVector;
    imageAlpha: number;
    teamId?: mod.Team;
    playerId?: mod.Player;
    children?: any[];
    buttonEnabled: boolean;
    buttonColorBase: UIVector;
    buttonAlphaBase: number;
    buttonColorDisabled: UIVector;
    buttonAlphaDisabled: number;
    buttonColorPressed: UIVector;
    buttonAlphaPressed: number;
    buttonColorHover: UIVector;
    buttonAlphaHover: number;
    buttonColorFocused: UIVector;
    buttonAlphaFocused: number;
}

function __asModVector(param: number[] | mod.Vector) {
    if (Array.isArray(param))
        return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
    else
        return param;
}

function __asModMessage(param: string | mod.Message) {
    if (typeof (param) === "string")
        return mod.Message(param);
    return param;
}

function __fillInDefaultArgs(params: UIParams) {
    if (!params.hasOwnProperty('name'))
        params.name = "";
    if (!params.hasOwnProperty('position'))
        params.position = mod.CreateVector(0, 0, 0);
    if (!params.hasOwnProperty('size'))
        params.size = mod.CreateVector(100, 100, 0);
    if (!params.hasOwnProperty('anchor'))
        params.anchor = mod.UIAnchor.TopLeft;
    if (!params.hasOwnProperty('parent'))
        params.parent = mod.GetUIRoot();
    if (!params.hasOwnProperty('visible'))
        params.visible = true;
    if (!params.hasOwnProperty('padding'))
        params.padding = (params.type == "Container") ? 0 : 8;
    if (!params.hasOwnProperty('bgColor'))
        params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('bgAlpha'))
        params.bgAlpha = 0.5;
    if (!params.hasOwnProperty('bgFill'))
        params.bgFill = mod.UIBgFill.Solid;
}

function __setNameAndGetWidget(uniqueName: any, params: any) {
    let widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
    mod.SetUIWidgetName(widget, params.name);
    return widget;
}

const __cUniqueName = "----uniquename----";

function __addUIContainer(params: UIParams) {
    __fillInDefaultArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIContainer(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            restrict);
    } else {
        mod.AddUIContainer(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill);
    }
    let widget = __setNameAndGetWidget(__cUniqueName, params);
    if (params.children) {
        params.children.forEach((childParams: any) => {
            childParams.parent = widget;
            __addUIWidget(childParams);
        });
    }
    return widget;
}

function __fillInDefaultTextArgs(params: UIParams) {
    if (!params.hasOwnProperty('textLabel'))
        params.textLabel = "";
    if (!params.hasOwnProperty('textSize'))
        params.textSize = 0;
    if (!params.hasOwnProperty('textColor'))
        params.textColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('textAlpha'))
        params.textAlpha = 1;
    if (!params.hasOwnProperty('textAnchor'))
        params.textAnchor = mod.UIAnchor.CenterLeft;
}

function __addUIText(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultTextArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIText(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            __asModMessage(params.textLabel),
            params.textSize,
            __asModVector(params.textColor),
            params.textAlpha,
            params.textAnchor,
            restrict);
    } else {
        mod.AddUIText(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            __asModMessage(params.textLabel),
            params.textSize,
            __asModVector(params.textColor),
            params.textAlpha,
            params.textAnchor);
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultImageArgs(params: any) {
    if (!params.hasOwnProperty('imageType'))
        params.imageType = mod.UIImageType.None;
    if (!params.hasOwnProperty('imageColor'))
        params.imageColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('imageAlpha'))
        params.imageAlpha = 1;
}

function __addUIImage(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultImageArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIImage(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.imageType,
            __asModVector(params.imageColor),
            params.imageAlpha,
            restrict);
    } else {
        mod.AddUIImage(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.imageType,
            __asModVector(params.imageColor),
            params.imageAlpha);
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultArg(params: any, argName: any, defaultValue: any) {
    if (!params.hasOwnProperty(argName))
        params[argName] = defaultValue;
}

function __fillInDefaultButtonArgs(params: any) {
    if (!params.hasOwnProperty('buttonEnabled'))
        params.buttonEnabled = true;
    if (!params.hasOwnProperty('buttonColorBase'))
        params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
    if (!params.hasOwnProperty('buttonAlphaBase'))
        params.buttonAlphaBase = 1;
    if (!params.hasOwnProperty('buttonColorDisabled'))
        params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
    if (!params.hasOwnProperty('buttonAlphaDisabled'))
        params.buttonAlphaDisabled = 0.5;
    if (!params.hasOwnProperty('buttonColorPressed'))
        params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('buttonAlphaPressed'))
        params.buttonAlphaPressed = 1;
    if (!params.hasOwnProperty('buttonColorHover'))
        params.buttonColorHover = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaHover'))
        params.buttonAlphaHover = 1;
    if (!params.hasOwnProperty('buttonColorFocused'))
        params.buttonColorFocused = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaFocused'))
        params.buttonAlphaFocused = 1;
}

function __addUIButton(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultButtonArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIButton(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.buttonEnabled,
            __asModVector(params.buttonColorBase), params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled), params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed), params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover), params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused), params.buttonAlphaFocused,
            restrict);
    } else {
        mod.AddUIButton(__cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            params.buttonEnabled,
            __asModVector(params.buttonColorBase), params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled), params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed), params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover), params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused), params.buttonAlphaFocused);
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __addUIWidget(params: UIParams) {
    if (params == null)
        return undefined;
    if (params.type == "Container")
        return __addUIContainer(params);
    else if (params.type == "Text")
        return __addUIText(params);
    else if (params.type == "Image")
        return __addUIImage(params);
    else if (params.type == "Button")
        return __addUIButton(params);
    return undefined;
}

function ParseUI(...params: any[]) {
    let widget: mod.UIWidget | undefined;
    for (let a = 0; a < params.length; a++) {
        widget = __addUIWidget(params[a] as UIParams);
    }
    return widget;
}

// === UI_PlacementHeader.ts ===



class HoH_UIPlacementHeader {
    #Player: PlayerProfile

    headerWidget: mod.UIWidget | undefined
    textWidget: mod.UIWidget | undefined

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf;

        const bfBlueColor = [0.678, 0.753, 0.800]
        const height = 100;
        const width = 500;
        this.headerWidget = ParseUI(
            {
                type: "Container",
                size: [width, height],
                position: [0, 50],
                name: "placement_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.TopCenter,
                bgFill: mod.UIBgFill.Blur,
                bgColor: [0.2, 0.2, 0.3],
                bgAlpha: 0.9,
                playerId: playerProf.player,
                visible: false,
                children: [
                    {
                        type: "Container",
                        name: "placement_line_right_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [width / 2, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Container",
                        name: "placement_line_left_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [-width / 2, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Text",
                        name: "placement_text" + this.#Player.playerProfileId,
                        size: [width, height],
                        position: [0, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.None,
                        textColor: bfBlueColor,
                        textAnchor: mod.UIAnchor.Center,
                        textLabel: MakeMessage(mod.stringkeys.header_placement, 0),
                        textSize: 45
                    },
                ]
            }
        )
        this.textWidget = mod.FindUIWidgetWithName("placement_text" + this.#Player.playerProfileId)
    }


    Delete() {
        this.headerWidget && mod.DeleteUIWidget(this.headerWidget)
        this.textWidget && mod.DeleteUIWidget(this.textWidget)
    }

    Open(text: string, placement: number, scale: number) {
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, true)
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(text, placement))
        this.textWidget && mod.SetUITextSize(this.textWidget, scale)
    }

    update() {
    }

    async Close(delayclose: number = 0) {
        await mod.Wait(delayclose)
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, false)
    }

}

// === UI_Scoreboard.ts ===



class HoH_ScoreboardUI {

    #playerProfile: PlayerProfile;
    #CoreWidget: mod.UIWidget | undefined;

    #scoreboardPlacement_text: mod.UIWidget | undefined

    #ScoreboardplayerName: mod.UIWidget[] = []
    #ScoreboardPlacement: mod.UIWidget[] = []
    #ScoreboardTimeOne: mod.UIWidget[] = []
    #ScoreboardTimeTwo: mod.UIWidget[] = []

    constructor(playerprofile: PlayerProfile) {
        this.#playerProfile = playerprofile
        this.Create()
    }


    Delete() {
      this.#CoreWidget &&  mod.DeleteUIWidget(this.#CoreWidget)
    }

    update() {
        console.log("Update Scoreboard positions")

        this.#CoreWidget && mod.SetUIWidgetVisible(this.#CoreWidget, true)

        const playerPositionInRace = currentRace.playersInRace.indexOf(this.#playerProfile)

        this.#scoreboardPlacement_text && mod.SetUITextLabel(this.#scoreboardPlacement_text, MakeMessage(mod.stringkeys.position_in_race, playerPositionInRace + 1, currentRace.playersInRace.length))

        for (let index = 0; index < this.#ScoreboardplayerName.length; index++) {
            const playerInPos = this.indexExists(currentRace.playersInRace, index)


            if (playerInPos) {

                const playerTime = currentRace.playersInRace[index].playerRaceTime;

                if (playerTime) {
                    const formatTime = this.FormatTime(playerTime - currentRace.raceTime)

                    mod.SetUITextLabel(this.#ScoreboardTimeOne[index], MakeMessage(mod.stringkeys.scoreboard_1_time_1, formatTime[0], formatTime[1]))
                    mod.SetUITextLabel(this.#ScoreboardTimeTwo[index], MakeMessage(mod.stringkeys.scoreboard_1_time_2, formatTime[2], formatTime[3], formatTime[4]))

                    mod.SetUIWidgetVisible(this.#ScoreboardTimeOne[index], true)
                    mod.SetUIWidgetVisible(this.#ScoreboardTimeTwo[index], true)
                } else {
                    mod.SetUIWidgetVisible(this.#ScoreboardTimeOne[index], false)
                    mod.SetUIWidgetVisible(this.#ScoreboardTimeTwo[index], false)
                }

                mod.SetUIWidgetVisible(this.#ScoreboardplayerName[index], true)
                mod.SetUIWidgetVisible(this.#ScoreboardPlacement[index], true)


                mod.SetUITextLabel(this.#ScoreboardplayerName[index], MakeMessage(mod.stringkeys.scoreboard_1_name, currentRace.playersInRace[index].player))

                if (index == playerPositionInRace) {
                    mod.SetUITextColor(this.#ScoreboardplayerName[index], mod.CreateVector(1, 1, 0))
                    mod.SetUITextColor(this.#ScoreboardPlacement[index], mod.CreateVector(1, 1, 0))
                    mod.SetUITextColor(this.#ScoreboardTimeOne[index], mod.CreateVector(1, 1, 0))
                    mod.SetUITextColor(this.#ScoreboardTimeTwo[index], mod.CreateVector(1, 1, 0))
                } else {
                    mod.SetUITextColor(this.#ScoreboardplayerName[index], mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUITextColor(this.#ScoreboardPlacement[index], mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUITextColor(this.#ScoreboardTimeOne[index], mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUITextColor(this.#ScoreboardTimeTwo[index], mod.CreateVector(0.678, 0.753, 0.800))
                }

            } else {

                mod.SetUIWidgetVisible(this.#ScoreboardplayerName[index], false)
                mod.SetUIWidgetVisible(this.#ScoreboardPlacement[index], false)
                mod.SetUIWidgetVisible(this.#ScoreboardTimeOne[index], false)
                mod.SetUIWidgetVisible(this.#ScoreboardTimeTwo[index], false)
            }

        }
    }

    indexExists<T>(array: T[], index: number): boolean {
        return index >= 0 && index < array.length;
    }

    FormatTime(time: number,): number[] {


        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const tenths = Math.floor((time % 1) * 10);

        const result: number[] = [];

        // Ensure minutes are always 2 digits
        result.push(Math.floor(minutes / 10));
        result.push(minutes % 10);

        // Ensure seconds are always 2 digits
        result.push(Math.floor(seconds / 10));
        result.push(seconds % 10);

        // Tenths is always 1 digit
        result.push(tenths);

        return result;
    }

    Create() {

        console.log("Creating Scoreboard UI")
        let children = []

        const ScoreboardplayerPlacement = `Scoreboard2Placement_text_${this.#playerProfile.playerProfileId}`

        const Scoreboardlaps = `Scoreboard2laps_text_${this.#playerProfile.playerProfileId}`

        children.push(
            {
                type: "Text",
                name: ScoreboardplayerPlacement,
                textLabel: MakeMessage(mod.stringkeys.position_in_race, 1, MapPlayers),
                position: [0, -180, 1],
                size: [170, 140, 0],
                textSize: 110,
                bgFill: mod.UIBgFill.Blur,
                textColor: [0.678, 0.753, 0.800],
                textAnchor: mod.UIAnchor.Center,
                anchor: mod.UIAnchor.TopLeft,
                visible: true
            }
        )

        for (let index = 0; index < MapPlayers; index++) {

            const ScoreboardplayerName = `Scoreboard2playerName${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardPlacement = `Scoreboard2Placement${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeOne = `Scoreboard2TimeOne${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeTwo = `Scoreboard2TimeTwo${index}text_${this.#playerProfile.playerProfileId}`

            const rowPadding = 30;
            const startY = -125
            const y = startY + index * rowPadding;

            const textBoxHeight = 30;

            const textSize = 20;
            const textNameSize = 15;
            const timeSize = 15;

            children.push(
                {
                    type: "Text",
                    name: ScoreboardPlacement,
                    textLabel: MakeMessage(mod.stringkeys.scoreboard_1_name, index + 1),
                    position: [-15, y, 1],
                    size: [30, textBoxHeight, 0],
                    textSize: textSize,
                    bgFill: mod.UIBgFill.Blur,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true
                },
                {
                    type: "Text",
                    name: ScoreboardplayerName,
                    textLabel: MakeMessage(mod.stringkeys.X),
                    position: [20, y, 1],
                    size: [200, textBoxHeight, 0],
                    textSize: textNameSize,
                    bgFill: mod.UIBgFill.Blur,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true
                },
                {
                    type: "Text",
                    name: ScoreboardTimeOne,
                    textLabel: MakeMessage(mod.stringkeys.X),
                    position: [160, y, 1],
                    size: [250, textBoxHeight, 0],
                    textSize: timeSize,
                    bgFill: mod.UIBgFill.None,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true

                },
                {
                    type: "Text",
                    name: ScoreboardTimeTwo,
                    textLabel: MakeMessage(mod.stringkeys.X),
                    position: [180, y, 1],
                    size: [250, textBoxHeight, 0],
                    textSize: timeSize,
                    bgFill: mod.UIBgFill.None,
                    textColor: [0.678, 0.753, 0.800],
                    textAnchor: mod.UIAnchor.CenterLeft,
                    anchor: mod.UIAnchor.CenterLeft,
                    visible: true

                }
            )

        }

        const scoreboardContainerWidget = ParseUI({
            type: "Container",
            name: `scoreboard_Container_${this.#playerProfile.playerProfileId}`,
            position: [0, -200, 0],
            size: [250, 300, 0],
            anchor: mod.UIAnchor.CenterLeft,
            bgColor: [1, 1, 1],
            bgFill: mod.UIBgFill.None,
            bgAlpha: 1,
            padding: 20,
            children: children,
            playerId: this.#playerProfile.player,
            visible: false
        })


        this.#CoreWidget = scoreboardContainerWidget;
        this.#scoreboardPlacement_text = mod.FindUIWidgetWithName(ScoreboardplayerPlacement)

        for (let index = 0; index < MapPlayers; index++) {

            const ScoreboardPlacement = `Scoreboard2Placement${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardplayerName = `Scoreboard2playerName${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeOne = `Scoreboard2TimeOne${index}text_${this.#playerProfile.playerProfileId}`
            const ScoreboardTimeTwo = `Scoreboard2TimeTwo${index}text_${this.#playerProfile.playerProfileId}`

            this.#ScoreboardPlacement.push(mod.FindUIWidgetWithName(ScoreboardPlacement))
            this.#ScoreboardplayerName.push(mod.FindUIWidgetWithName(ScoreboardplayerName))
            this.#ScoreboardTimeOne.push(mod.FindUIWidgetWithName(ScoreboardTimeOne))
            this.#ScoreboardTimeTwo.push(mod.FindUIWidgetWithName(ScoreboardTimeTwo))
        }


        //Extra settings 
        this.#CoreWidget && mod.SetUIWidgetDepth(this.#CoreWidget, mod.UIDepth.BelowGameUI)
    }

    open() {
        if (this.#CoreWidget == undefined) {
            this.Create()
        }

        this.update()

        this.#CoreWidget && mod.SetUIWidgetVisible(this.#CoreWidget, true)
    }


    Close() {
        this.#CoreWidget && mod.SetUIWidgetVisible(this.#CoreWidget, false)
    }

}

// === UI_StartCountdown.ts ===



class HoH_UIStartCountdown {
    #Player: PlayerProfile

    headerWidget: mod.UIWidget | undefined
    textWidget: mod.UIWidget | undefined

    constructor(playerProf: PlayerProfile) {
        this.#Player = playerProf;

        const bfBlueColor = [0.678, 0.753, 0.800]
        const height = 125;
        this.headerWidget = ParseUI(
            {
                type: "Container",
                size: [150, height],
                position: [0, 50],
                name: "start_countdown_" + this.#Player.playerProfileId,
                anchor: mod.UIAnchor.TopCenter,
                bgFill: mod.UIBgFill.Blur,
                bgColor: [0.2, 0.2, 0.3],
                bgAlpha: 0.9,
                playerId: playerProf.player,
                visible: false,
                children: [
                    {
                        type: "Container",
                        name: "start_countdown_line_right_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [75, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Container",
                        name: "start_countdown_line_left_" + this.#Player.playerProfileId,
                        size: [2, height],
                        position: [-75, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.Solid,
                        bgColor: bfBlueColor,
                        bgAlpha: 1
                    },
                    {
                        type: "Text",
                        name: "start_countdown_text" + this.#Player.playerProfileId,
                        size: [100, height],
                        position: [0, 0],
                        anchor: mod.UIAnchor.Center,
                        bgFill: mod.UIBgFill.None,
                        textColor: bfBlueColor,
                        textAnchor: mod.UIAnchor.Center,
                        textLabel: MakeMessage(mod.stringkeys.scoreboard_1_name),
                        textSize: 85
                    }
                ]
            }
        )
        this.textWidget = mod.FindUIWidgetWithName("start_countdown_text" + this.#Player.playerProfileId)
    }


    Delete() {
        this.headerWidget && mod.DeleteUIWidget(this.headerWidget)
        this.textWidget && mod.DeleteUIWidget(this.textWidget)
    }

    Open(text: string, countdowntime: number) {
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, true)
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(text, countdowntime))
    }


    update(text: string, countdowntime: number) {
        this.textWidget && mod.SetUITextLabel(this.textWidget, MakeMessage(text, countdowntime))
    }

    async Close(delayclose: number = 0) {
        await mod.Wait(delayclose)
        this.headerWidget && mod.SetUIWidgetVisible(this.headerWidget, false)
    }

}

// === UI_VehicleSelect.ts ===



type HoH_ClickFunction = () => void;
type HoH_FocusFunction = (focusIn: boolean) => void;

class HoH_UIButtonHolder {

    playerProfile: PlayerProfile;

    button_id: string
    button_widget: mod.UIWidget

    button_text_id: string
    button_text_widget: mod.UIWidget

    select_text_id: string | undefined
    select_widget: mod.UIWidget | undefined

    click: HoH_ClickFunction;
    focus: HoH_FocusFunction;

    constructor(playerProfile: PlayerProfile, uniqueButtonName: string, uniqueTextName: string, uniqueSelectName?: string, clickFunction?: HoH_ClickFunction, focusFunction?: HoH_FocusFunction) {
        this.button_id = uniqueButtonName;
        this.button_widget = mod.FindUIWidgetWithName(uniqueButtonName);
        this.button_text_id = uniqueTextName;
        this.button_text_widget = mod.FindUIWidgetWithName(uniqueTextName);
        this.playerProfile = playerProfile;

        if (uniqueSelectName) {
            this.select_text_id = uniqueSelectName;
            this.select_widget = mod.FindUIWidgetWithName(uniqueSelectName)
        }

        if (focusFunction) {
            mod.EnableUIButtonEvent(this.button_widget, mod.UIButtonEvent.FocusIn, true)
            mod.EnableUIButtonEvent(this.button_widget, mod.UIButtonEvent.FocusOut, true)
        }

        this.focus = focusFunction?.bind(this) ?? this.defaultFocus;
        this.click = clickFunction?.bind(this) ?? this.defaultClick;
    }

    defaultClick() { console.log("default Click") }
    defaultFocus() { console.log("default focus") }

}

class HoH_UIVehicleSelect {

    #Left_Button_Holder: HoH_UIButtonHolder | undefined = undefined;
    #Right_Button_Holder: HoH_UIButtonHolder | undefined = undefined;

    #Readyup_Button_Holder: HoH_UIButtonHolder | undefined = undefined;

    #LEFT_BUTTON: string
    #LEFT_BUTTON_TEXT: string
    #LEFT_BUTTON_SELECTED: string

    #RIGHT_BUTTON: string
    #RIGHT_BUTTON_TEXT: string
    #RIGHT_BUTTON_SELECTED: string

    #RootWidgets: mod.UIWidget[] = []

    #PLAYERS_WAITING_TEXT: string;
    #players_ready_text_widget: mod.UIWidget | undefined;

    #PLAYERS_READY_COUNT_TEXT: string
    #players_ready_count_widget: mod.UIWidget | undefined;

    #CURRENT_SELECT_VEH_TEXT: string;
    #current_select_veh_Widget: mod.UIWidget | undefined;

    #READYUP_BUTTON: string
    #READYUP_BUTTON_TEXT: string
    #READYUP_BUTTON_SELECT: string

    #readyup_button_widget: mod.UIWidget | undefined;

    #playerProfile: PlayerProfile;

    UIOpen: boolean = false;

    selectVehNb: number = 0


    constructor(player: PlayerProfile) {
        this.#playerProfile = player;

        this.#LEFT_BUTTON = `left_veh_button_${this.#playerProfile.playerProfileId}`
        this.#LEFT_BUTTON_TEXT = `left_veh_button_text_${this.#playerProfile.playerProfileId}`
        this.#LEFT_BUTTON_SELECTED = `left_veh_button_selected_${this.#playerProfile.playerProfileId}`

        this.#RIGHT_BUTTON = `right_veh_button_${this.#playerProfile.playerProfileId}`
        this.#RIGHT_BUTTON_TEXT = `right_veh_button_text_${this.#playerProfile.playerProfileId}`
        this.#RIGHT_BUTTON_SELECTED = `right_veh_button_select_${this.#playerProfile.playerProfileId}`

        this.#READYUP_BUTTON = `readyup_veh_button_${this.#playerProfile.playerProfileId}`
        this.#READYUP_BUTTON_TEXT = `readyup_veh_button_text_${this.#playerProfile.playerProfileId}`
        this.#READYUP_BUTTON_SELECT = `readyup_veh_button_select_text_${this.#playerProfile.playerProfileId}`

        this.#PLAYERS_READY_COUNT_TEXT = `players_ready_count_text_${this.#playerProfile.playerProfileId}`
        this.#CURRENT_SELECT_VEH_TEXT = `current_select_veh_text_${this.#playerProfile.playerProfileId}`
        this.#PLAYERS_WAITING_TEXT = `players_waiting_text_${this.#playerProfile.playerProfileId}`

        this.selectVehNb = currentRace.availableVehicles.indexOf(this.#playerProfile.selectedVehicle)
    }

    UIUpdatePlayersReady() {
        const { ready, total } = currentRace.GetPlayersReady();
        this.#players_ready_count_widget && mod.SetUITextLabel(this.#players_ready_count_widget, MakeMessage(mod.stringkeys.readyplayers, ready, total))

        if (total < MinimumPlayerToStart) {
            this.#players_ready_text_widget && mod.SetUITextLabel(this.#players_ready_text_widget, MakeMessage(mod.stringkeys.waitingforplayersX, total, MapPlayers, MinimumPlayerToStart))

        }

        this.#players_ready_text_widget && mod.SetUITextLabel(this.#players_ready_text_widget, MakeMessage(mod.stringkeys.startsin, currentRace.readyupCountDown))

    }

    EnableSwitchButtons(enabled: boolean) {
        this.#Left_Button_Holder && mod.SetUIButtonEnabled(this.#Left_Button_Holder.button_widget, enabled)
        this.#Right_Button_Holder && mod.SetUIButtonEnabled(this.#Right_Button_Holder.button_widget, enabled)

        if (enabled) {
            this.#Readyup_Button_Holder && mod.SetUIWidgetBgColor(this.#Readyup_Button_Holder.button_widget, mod.CreateVector(1, 1, 1))
            this.#Left_Button_Holder && mod.SetUIWidgetVisible(this.#Left_Button_Holder.button_widget, true)
            this.#Right_Button_Holder && mod.SetUIWidgetVisible(this.#Right_Button_Holder.button_widget, true)
        } else {
            this.#Readyup_Button_Holder && mod.SetUIWidgetBgColor(this.#Readyup_Button_Holder.button_widget, mod.CreateVector(0.4196, 0.9098, 0.0745))
            this.#Left_Button_Holder && mod.SetUIWidgetVisible(this.#Left_Button_Holder.button_widget, false)
            this.#Right_Button_Holder && mod.SetUIWidgetVisible(this.#Right_Button_Holder.button_widget, false)
        }
    }

    VehicleSelectIncrease() {
        if (this.selectVehNb > 0) {

            this.selectVehNb--;
            this.cameraTeleport();
            this.refresh();
        }
    }

    VehicleSelectDecrease() {
        if (this.selectVehNb < currentRace.availableVehicles.length - 1) {

            this.selectVehNb++;
            this.cameraTeleport()
            this.refresh();
        }
    }

    #create() {

        const { ready, total } = currentRace.GetPlayersReady();

        const bfBlueColor = [0.678, 0.753, 0.800]
        const buttonBgColor = [1, 1, 1]

        this.#RootWidgets.push(ParseUI({
            type: "Container",
            size: [500, 110],
            position: [0, 75],
            anchor: mod.UIAnchor.TopCenter,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0.2, 0.2, 0.3],
            bgAlpha: 0.9,
            playerId: this.#playerProfile.player,
            children: [{
                type: "Text",
                name: this.#PLAYERS_WAITING_TEXT,
                size: [500, 110],
                position: [0, -28],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.None,
                textColor: bfBlueColor,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.startsin, currentRace.readyupCountDown),
                textSize: 38
            },
            {
                type: "Text",
                name: this.#PLAYERS_READY_COUNT_TEXT,
                size: [250, 110],
                position: [0, 25],
                anchor: mod.UIAnchor.Center,
                textColor: bfBlueColor,
                bgFill: mod.UIBgFill.None,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.readyplayers, ready, total),
                textSize: 24
            },
            {
                type: "Container",
                name: this.#PLAYERS_READY_COUNT_TEXT + "_left_side_line",
                size: [1, 110],
                position: [-252, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: bfBlueColor,
                bgAlpha: 1
            }, {
                type: "Container",
                name: this.#PLAYERS_READY_COUNT_TEXT + "_right_side_line",
                size: [1, 110],
                position: [251, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: bfBlueColor,
                bgAlpha: 1
            },
            {
                type: "Container",
                name: this.#PLAYERS_READY_COUNT_TEXT + "_middle_line",
                size: [425, 3],
                position: [0, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.Solid,
                bgColor: bfBlueColor,
                bgAlpha: 1
            },
            ]
        }) as mod.UIWidget)


        this.#players_ready_text_widget = mod.FindUIWidgetWithName(this.#PLAYERS_WAITING_TEXT)
        this.#players_ready_count_widget = mod.FindUIWidgetWithName(this.#PLAYERS_READY_COUNT_TEXT)



        this.#RootWidgets.push(ParseUI({
            type: "Container",
            size: [500, 100],
            position: [0, 75],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.None,
            bgColor: mod.CreateVector(1, 1, 1),
            bgAlpha: 0.0,
            playerId: this.#playerProfile.player,
            children: [
                {
                    type: "Container",
                    name: this.#LEFT_BUTTON_SELECTED,
                    size: [60, 60],
                    position: [-150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.8,
                    visible: false
                },
                {
                    type: "Button",
                    name: this.#LEFT_BUTTON,
                    size: [50, 50],
                    position: [-150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Blur,
                    buttonColorHover: [1, 1, 1],
                    bgColor: [1, 1, 1],
                    bgAlpha: 1.0,
                }, {
                    type: "Text",
                    parent: this.#LEFT_BUTTON,
                    name: this.#LEFT_BUTTON_TEXT,
                    size: [50, 50],
                    position: [-150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.leftArrow),
                    textSize: 35,

                },


                {
                    type: "Container",
                    name: this.#READYUP_BUTTON_SELECT,
                    size: [240, 60],
                    position: [0, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.8,
                    visible: false
                },
                {
                    type: "Button",
                    name: this.#READYUP_BUTTON,
                    size: [230, 50],
                    position: [0, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Blur,
                    buttonColorHover: [1, 1, 1],
                    bgColor: [1, 1, 1],
                    bgAlpha: 1.0
                },
                {
                    type: "Text",
                    parent: this.#READYUP_BUTTON,
                    name: this.#READYUP_BUTTON_TEXT,
                    size: [230, 50],
                    position: [0, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.ready),
                    textSize: 25
                },

                {
                    type: "Container",
                    name: this.#RIGHT_BUTTON_SELECTED,
                    size: [60, 60],
                    position: [150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.OutlineThin,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.8,
                    visible: false
                },
                {
                    type: "Button",
                    name: this.#RIGHT_BUTTON,
                    size: [50, 50],
                    position: [150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Blur,
                    buttonColorHover: [1, 1, 1],
                    bgColor: [1, 1, 1],
                    bgAlpha: 1.0
                }, {

                    type: "Text",
                    parent: this.#RIGHT_BUTTON,
                    name: this.#RIGHT_BUTTON_TEXT,
                    size: [50, 50],
                    position: [150, 0],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.rightArrow),
                    textSize: 35
                },

                {
                    type: "Container",
                    name: this.#CURRENT_SELECT_VEH_TEXT + "_line",
                    size: [300, 3],
                    position: [0, -35],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: bfBlueColor,
                    bgAlpha: 0.5
                },
                {
                    type: "Text",
                    name: this.#CURRENT_SELECT_VEH_TEXT,
                    size: [350, 80],
                    position: [0, -70],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.selectVeh),
                    textSize: 60
                },
                {
                    type: "Text",
                    name: this.#CURRENT_SELECT_VEH_TEXT + "_chosen_veh",
                    size: [300, 50],
                    position: [0, -105],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.None,
                    textColor: bfBlueColor,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: MakeMessage(mod.stringkeys.chosenvehicle),
                    textSize: 20
                }
            ]
        }) as mod.UIWidget)

        this.#Left_Button_Holder = new HoH_UIButtonHolder(
            this.#playerProfile,
            this.#LEFT_BUTTON,
            this.#LEFT_BUTTON_TEXT,
            this.#LEFT_BUTTON_SELECTED,
            function (this: HoH_UIButtonHolder) {
                this.playerProfile.VehicleShopUI?.VehicleSelectIncrease();
            },
            function (this: HoH_UIButtonHolder, focusIn: boolean) {
                if (focusIn) {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Solid)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.2, 0.2, 0.2))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, true)
                } else {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Blur)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(1, 1, 1))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, false)
                }
            }
        );

        this.#Right_Button_Holder = new HoH_UIButtonHolder(
            this.#playerProfile,
            this.#RIGHT_BUTTON,
            this.#RIGHT_BUTTON_TEXT,
            this.#RIGHT_BUTTON_SELECTED,
            function (this: HoH_UIButtonHolder) {
                this.playerProfile.VehicleShopUI?.VehicleSelectDecrease()

            },
            function (this: HoH_UIButtonHolder, focusIn: boolean) {
                if (focusIn) {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Solid)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.2, 0.2, 0.2))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, true)
                } else {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Blur)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(1, 1, 1))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, false)
                }
            }
        )

        this.#Readyup_Button_Holder = new HoH_UIButtonHolder(
            this.#playerProfile,
            this.#READYUP_BUTTON,
            this.#READYUP_BUTTON_TEXT,
            this.#READYUP_BUTTON_SELECT,
            function (this: HoH_UIButtonHolder) {
                if (this.playerProfile.readyUp) {
                    this.playerProfile.VehicleShopUI?.EnableSwitchButtons(false)

                } else {
                    this.playerProfile.VehicleShopUI?.EnableSwitchButtons(true)

                }
            },
            function (this: HoH_UIButtonHolder, focusIn: boolean) {


                if (focusIn) {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Solid)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.2, 0.2, 0.2))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, true)
                } else {
                    mod.SetUIWidgetBgFill(this.button_widget, mod.UIBgFill.Blur)
                    mod.SetUITextColor(this.button_text_widget, mod.CreateVector(0.678, 0.753, 0.800))
                    mod.SetUIWidgetBgColor(this.button_widget, mod.CreateVector(1, 1, 1))
                    this.select_widget && mod.SetUIWidgetVisible(this.select_widget, false)
                }
            }
        )

        this.#current_select_veh_Widget = mod.FindUIWidgetWithName(this.#CURRENT_SELECT_VEH_TEXT)



        // CatchupMechanic Information



        const PLAYER_CATCHUP_MECHANIC_TITLE = `players_catchup_mechanic_title_${this.#playerProfile.playerProfileId}`
        const PLAYER_CATCHUP_MECHANIC_DESC = `players_catchup_mechanic_desc_${this.#playerProfile.playerProfileId}`

    }

    cameraTeleport() {
        const VehiclePositions = [
            { x: 893.075561523438, y: 98.7342910766602, z: 112.841690063477 },
            { x: 881.608703613281, y: 98.7342910766602, z: 98.7557754516602 }
        ]

        const playerVehicleSelectPositions = [
            [
                { x: 883.636047363281, y: 98.7342910766602, z: 112.445426940918 },
                { x: 891.895629882813, y: 98.7342910766602, z: 123.063980102539 }
            ],
            [
                { x: 873.334533691406, y: 98.7342910766602, z: 98.0709915161133 },
                { x: 880.04296875, y: 98.7342910766602, z: 106.541053771973 }
            ],
        ]
        console.log("selectVehNb:", this.selectVehNb);
        console.log("selectVehNb:", playerVehicleSelectPositions[this.selectVehNb][0]);
        let startPos = playerVehicleSelectPositions[this.selectVehNb][0]
        let endPod = playerVehicleSelectPositions[this.selectVehNb][1]

        const spawnPositions = generateSpawnLine(startPos, endPod, MapPlayers, "right")
        const spawnposition = spawnPositions[this.#playerProfile.playerRacerNumber].position

        const lookrotation = this.lookAtYaw(spawnposition, VehiclePositions[this.selectVehNb])
        mod.Teleport(this.#playerProfile.player, mod.CreateVector(spawnposition.x, spawnposition.y, spawnposition.z), lookrotation)

    }

    lookAtYaw(from: Vector3, to: Vector3): number {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        return Math.atan2(dx, dz); // radians
    }


    refresh() {

        this.#playerProfile.SetVehicle(currentRace.availableVehicles[this.selectVehNb])
        const vehicleEnumValue = currentRace.availableVehicles[this.selectVehNb];

        this.#current_select_veh_Widget && mod.SetUITextLabel(this.#current_select_veh_Widget, MakeMessage(this.getVehName(vehicleEnumValue)))
    }

    getVehName(veh: mod.VehicleList) {
        if (veh == mod.VehicleList.Quadbike) {
            return mod.stringkeys.vehicle_1
        }if (veh == mod.VehicleList.GolfCart) {
            return mod.stringkeys.vehicle_2
        }
        return ""
    }

    async open() {
        if (!this.#players_ready_count_widget)
            this.#create();

        if (this.UIOpen == true) {
            return
        }

        this.UIOpen = true;

        this.#RootWidgets.forEach(Rootwidget => {
            mod.SetUIWidgetVisible(Rootwidget, true)
        });


        mod.EnableUIInputMode(true, this.#playerProfile.player)

        this.refresh()
        this.UIUpdatePlayersReady();
        this.cameraTeleport();
        await mod.Wait(1)
        this.cameraTeleport();
    }

    close() {
        if (this.UIOpen == false) {
            return
        }

        this.UIOpen = false;
        this.#RootWidgets.forEach(Rootwidget => {
            mod.SetUIWidgetVisible(Rootwidget, false)
        });

        mod.EnableUIInputMode(false, this.#playerProfile.player)
    }

    OnButtonPressed(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
        if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusIn)) {
            //console.log("FocusIn")
            this.buttonFocused(mod.GetUIWidgetName(eventUIWidget), true)
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.FocusOut)) {
            //console.log("FocusOut ")
            this.buttonFocused(mod.GetUIWidgetName(eventUIWidget), false)
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown)) {
            // console.log("ButtonDown")
            this.buttonPressed(mod.GetUIWidgetName(eventUIWidget))
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp)) {
            // console.log("ButtonUp")
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverIn)) {
            // console.log("HoverIn")
        } else if (mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.HoverOut)) {
            //console.log("HoverOut")
        }

    }

    buttonFocused(widgetName: string, focusIn: boolean = false) {
        if (widgetName == this.#LEFT_BUTTON && this.#Left_Button_Holder) {
            this.#Left_Button_Holder.focus(focusIn);
        } else if (widgetName == this.#RIGHT_BUTTON && this.#Right_Button_Holder) {
            this.#Right_Button_Holder.focus(focusIn);
        } else if (widgetName == this.#READYUP_BUTTON && this.#Readyup_Button_Holder) {
            this.#Readyup_Button_Holder.focus(focusIn);
        }
    }

    buttonPressed(widgetName: string) {

        if (widgetName == this.#LEFT_BUTTON) {

            this.#Left_Button_Holder?.click()


        } else if (widgetName == this.#READYUP_BUTTON) {

            if (!this.#playerProfile.readyUp) {
                this.#playerProfile.readyUp = true;

            } else {
                this.#playerProfile.readyUp = false;
            }

            this.#Readyup_Button_Holder?.click()

            currentRace.playersInRace.forEach(pp => {
                pp.VehicleShopUI?.UIUpdatePlayersReady()
            });

        } else if (widgetName == this.#RIGHT_BUTTON) {

            this.#Right_Button_Holder?.click()

        }
    }
}

// === UI_VersionNB.ts ===



class HoH_Version {

    VersionWidget: mod.UIWidget | undefined;

    constructor(playerProfile: PlayerProfile) {
        const bfBlueColor = [0.678, 0.753, 0.800]

        this.VersionWidget = ParseUI({
            type: "Container",
            size: [200, 25],
            position: [0, 0],
            anchor: mod.UIAnchor.BottomRight,
            bgFill: mod.UIBgFill.Blur,
            bgColor: [0.2, 0.2, 0.3],
            bgAlpha: 0.7,
            playerId: playerProfile.player,
            children: [{
                type: "Text",
                name: "game_version_" + playerProfile.playerProfileId,
                size: [200, 25],
                position: [0, 0],
                anchor: mod.UIAnchor.Center,
                bgFill: mod.UIBgFill.None,
                textColor: bfBlueColor,
                textAnchor: mod.UIAnchor.Center,
                textLabel: MakeMessage(mod.stringkeys.modversion, VERSION[0], VERSION[1], VERSION[2]),
                textSize: 20
            }]
        })
    }

    Close() {
        this.VersionWidget && mod.SetUIWidgetVisible(this.VersionWidget, false)
    }

    Delete() {
        this.VersionWidget && mod.DeleteUIWidget(this.VersionWidget)
    }

}

