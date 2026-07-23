const debugJSPlayer = false;
const debugJSEnemy = false;
const debugAIBehavior = false;
const debugSpawning = false;
const debugCombat = false;
const debugAIAutoDie = false;
const spawnRectifierActive = true;
const testSpawnOverDeploy = false;
const testSpawnUnderDeploy = false;
const testAreaTriggers = false;

let modversionMonth: number = 0;
let modversionDay: number = 0;
let modversionYear: number = 0;
let modversionMinutes: number = 0;
let modversionWidget: any = null;
let modversionWidget2: any = null;

const drawDebugUI = true;

//const nullUIWidget = null as mod.UIWidget; // Brad made me do this hack.
//const nullUIWidget: mod.UIWidget;

// AI Stance Variables
const standStance = mod.Stance.Stand;
const crouchStance = mod.Stance.Crouch;
const proneStance = mod.Stance.Prone;

const weapon1 = 1; // Primary
const weapon2 = 2; // Secondary
const weapon3 = 3; // Gadget

// AI Move Speed Variables
const iSlowWalkSpeed = mod.MoveSpeed.InvestigateSlowWalk;
const iWalkSpeed = mod.MoveSpeed.InvestigateWalk;
const patrolSpeed = mod.MoveSpeed.Patrol;
const walkSpeed = mod.MoveSpeed.Walk;
const runSpeed = mod.MoveSpeed.Run;
const iRunSpeed = mod.MoveSpeed.InvestigateRun;
const sprintSpeed = mod.MoveSpeed.Sprint;

type SpawnerId = number;
type Widget = mod.UIWidget;
type Dict = { [key: string]: any };

let isUiCreated = false;

let globalGameTime = 0;

let gametimeWidget = null;
let gameroundWidget: mod.UIWidget;
let enemiesremainingWidget: mod.UIWidget;
let currentenemiesremainingWidget: mod.UIWidget;
let teamRedeployWidget: mod.UIWidget;
let combatStartCountdownWidget: mod.UIWidget;

const maxConcurrentAI = 20;
let currentLivingAI = 0;
let maxLivingAI = 0;
let aiKilledCount = 0;
let totalAiSpawned = 0;
let totalAiSpawnAttempts = 0;

let havePlayersDeployed = false;

let isPreCombatPhase = false;
let isCombatPhase = false;
let isPostCombatPhase = false;

let isPrePurchasePhase = false;
let isPurchasePhase = false;
let isPostPurchasePhase = false;

let delayDuration = 2;

let preCombatDelayDuration = 1;
let combatPhaseBannerDuration = 2;
let postCombatPhaseDuration = 2;

let prePurchasePhaseDuration = 1;
let maxPurchasePhaseDuration = 60;

let delayUntil = 0;

let combatStarted = false;

//let humanPlayers = [];

let gruntSpawners = [];
let waypointPaths = [];
let gruntWaypointPairs = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
];
let randomizedGruntWaypointPairs: number[] = [];

let teamRespawns = 0;
let freeRespawnsPerPlayer = 2;
let maxFreeRespawns = 8;

let currentTeamRespawnCost = 1000;
let respawnCostIncrease = 1000;
let respawnsDisabled = false;
let gameOver = false;

// WaveSpawner index identifiers
const idxClassType = 0;
const idxNumberToSpawn = 1;
const idxRandomSpawnerId = 2;
const idxSpawnDelay = 3;

// Setup Initial Money

let initialCash = 1000;

// Setup overal enemy counts per round and initial values
const maxRoundCount = 5;

let enemyCashValuePerRound = [0, 100, 150, 200, 250, 300, 500];
let enemyDamageModifierPerRound = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1]; // Modifies enemy damage ouput
let enemyHealthModifierPerRound = [0, 1.0, 1.2, 1.3, 1.4, 1.5, 2]; // Multiplies enemy max health
let enemyFixedHealthIncreasePerRound = [0, 0, 5, 10, 15, 20, 25]; // Adds to enemy max health (super low health guys dont get much benefit from the multiplier)

// Wait for a full team to join before starting the game.

const minimumInitialPlayerCount = 4;
const maximumInitialPlayerCount = 4;
let initialPlayerCount = 0;

let combatCountdownStarted = false;
let combatStartDelayRemaining = 10;

const buyStationPos = mod.CreateVector(-81.717, 66.5, -23.946);

const EnableEasyMode = false;
const EasyModeCash = 100000;

// string file automation workaround
const store = {
    cashFmt: 'Cash: ${}',
    costFmt: '${}',
    healthFmt: 'Health: {}',
    killsFmt: 'Kills: {}',
    closeStore: 'X',
    disabledMsg: {
        locked: 'LOCKED',
        buyAmmo: 'BUY ANY AMMO',
    },
    gunstab: 'Guns',
    attachmentstab: 'Attachments',
    gadgetstab: 'Gadgets',
    ammotab: 'Ammo',
    upgradestab: 'Upgrades',
    randomize: 'Reroll This Tab',
    gun1: 'G36',
    gun2: 'Tavor 7',
    gun3: 'G3A4',
    gun4: '',
    primary1: 'B36A4 SILVER',
    primary1A: 'B36A4 GOLD',
    primary1B: 'B36A4 PLATINUM',
    primary2: 'TR-7',
    primary3: 'G3A4',
    primary4: 'NVO-228E',
    primary5: 'HK433',
    primary6: 'SCAR MK17',
    primary7: 'L85A3',
    primary8: 'KORD 6P67',
    primary9: 'M417 A2',
    primary10: 'XM7',
    primary11: 'M4A1 SILVER',
    primary11A: 'M4A1 GOLD',
    primary11B: 'M4A1 PLATINUM',
    M4A1: {
        M4A1_SCP_RMR: 'M4A1_SCP_RMR',
        M4A1_SCP_TrijiconMRO: 'M4A1_SCP_TrijiconMRO',
        M4A1_SCP_TrijiconSDO: 'M4A1_SCP_TrijiconSDO',
        M4A1_SCP_TrijiconVCOG: 'M4A1_SCP_TrijiconVCOG',
        M4A1_SCP_NX81: 'M4A1_SCP_NX81',
        M4A1_SCP_Mark4M2: 'M4A1_SCP_Mark4M2',
        M4A1_SCP_VortexM157: 'M4A1_SCP_VortexM157',
    },
    primary12: 'SCAR-SC .300',
    primary13: 'QBZ-192',
    primary14: 'AK-205',
    primary15: 'MSBS GROT B10 C',
    primary16: 'SCW-10',
    primary17: 'Kriss Vector',
    primary18: 'UMP-40',
    primary19: 'PW7A2 SILVER',
    primary19A: 'PW7A2 GOLD',
    primary19B: 'PW7A2 PLATINUM',
    primary20: 'MP5 MLI',
    primary21: 'P90 Tactical',
    primary22: 'MPX',
    primary23: 'M27 IAR',
    primary24: 'KTS100 MK8',
    primary25: 'RPK',
    primary26: 'M60E6',
    primary27: 'M250',
    primary28: 'L110',
    primary29: 'M240L SILVER',
    primary29A: 'M240L GOLD',
    primary29B: 'M240L PLATINUM',
    primary30: 'MG4k',
    primary31: 'SVK-8.6',
    primary32: 'M39 EMR',
    primary33: 'SVDM SILVER',
    primary33A: 'SVDM GOLD',
    primary33B: 'SVDM PLATINUM',
    primary34: 'ARA Light DMR',
    primary35: 'PSR',
    primary36: 'SV-98',
    primary37: 'M2010 ESR SILVER',
    primary37A: 'M2010 ESR GOLD',
    primary37B: 'M2010 ESR PLATINUM',
    primary38: 'M87A1',
    primary39: 'KSG',
    primary40: 'M4/M1014',
    primary41: '18.5KS-K SILVER',
    primary41A: '18.5KS-K GOLD',
    primary41B: '18.5KS-K PLATINUM',
    ammo1: 'Primary Ammo',
    ammo2: 'Secondary Ammo',
    ammo3: 'Primary Mag',
    ammo4: 'Secondary Mag',
    upgrade1: 'More Speed',
    upgrade2: 'More Bullets',
    upgrade3: 'More Lunch',
    upgrade4: '<-- buy me to unlock',
    upgrade5: 'Bonus Health',
    upgrade6: 'Bonus Damage',
    upgrade7: '+1 Redeploy',
    upgrade8: 'Start Combat',
    gadgetTEST: 'Test Gadget',
    gadget1: 'C-4 Explosives',
    gadget2: 'RPG-7V2',
    gadget3: 'Deployable Cover',
    gadget5: 'Adrenaline Shot',
    gadget6: 'Motion Sensor',
    gadget7: 'Supply Crate',
    gadget8: 'Recon Drone',
    gadget9: 'Throwing Knife',
    gadget10: 'AT Mine',
    gadget11: 'Defibrillator',
    gadget12: 'Aim-Guided Launcher',
    gadget13: 'Proximity Detector',
    gadget14: 'MBT-LAW',
    gadget15: 'MP-APS',
    gadget16: 'Sniper Decoy',
    gadget17: 'Sticky Grenade Launcher',
    gadget18: 'AP Mine',
    gadget19: 'Concussion Grenade',
    gadget20: 'M4A1 SLAM',
    gadget21: 'Frag Grenade',
    gadget22: 'LWCMS',
    gadget23: 'EOD BOT',
    gadget24: 'Incendiary Launcher',
};

const scoreboard = {
    victory: 'VICTORY',
    nameHeader: 'NAME',
    nameFmt: '{}',
    killsHeader: 'K',
    killsFmt: '{}',
    deathsHeader: 'D',
    deathsFmt: '{}',
    incarcerationsHeader: 'I',
    incarcerationsFmt: '{}',
    cashHeader: '$',
    cashFmt: '${}',
};

// string declarations
const teamrespawns = 'Team Redeploys Remaining: {}';
const titleLineOne = 'PORTAL Besieged';
const titleLineTwo = 'PVE HOLDOUT';
const gearStore = 'Weapons & Ammo';
const waitingforplayersX = '{}/{} IN LOBBY - 4 REQUIRED';
const waitingforplayers = 'Waiting for Players: {}/{}';
const combatStartDelayCountdown = 'THE BATTLE BEGINS IN {}';
const gameround = 'Round {}';
const goodguys = 'GOOD GUYS';
const kills = 'KILLS';
const deaths = 'DEATHS';
const earned = 'EARNED';
const spent = 'SPENT';
const jailed = 'JAILED';
const enemiesremaining = 'Enemies Remaining: {}';
const playerwallet = 'Cash Remaining: ${}';
const healthState = '{} / {}';
const combatStartCountdown = '{} Enemies Inbound!';
const bigEnemyIncoming = 'Powerful Enemy Inbound!';
const purchasePhaseCountdown = 'Spend your cash! {}';
const combatPrePhaseBanner = 'Enemy ETA {} Seconds';
const combatRoundBanner = 'Round {}';
const combatPostPhaseBanner = 'Enemy Attack Repulsed';
const purchasePrePhaseBanner = 'Pre Purchase Phase Banner';
const purchasePhaseBanner = 'Purchase Phase {}';
const youAreInJail = 'You Are In No-Redeploy Jail';
const autoPurchasedRespawn = 'Redeploy Purchased: -${}';
const outOfInventory = 'Out of Inventory';
const modversion = 'Script ver: {}-{}-{}';
const sneakySnake = 'Sneaky Snake';
const speedySnake = 'Speedy Snake';
const slasher = 'Slasher';
const smasher = 'Smasher';
const sniper = 'Sniper';
const soldier = 'Soldier';
const shotgun = 'Skeeter';
const hmgClassString = 'SAW-er';
const rpgClassString = 'Splasher';
const sacrificerString = 'Sacrificer';
const paratrooperString = 'Sky Soldier';
const tankerClassString = 'SuperHeavy';
const stalkerClassString = 'Stalker';

function modMessageDebug(message: string, ...args: any[]) {
    //console.log(message);
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
            throw new Error('Invalid number of arguments');
    }
}

function enableEasyMode() {
    // Super Easy Tuning for Debugging
    console.log('Besieged Super Easy Debug Tuning ENABLED');
    enemyCashValuePerRound = [0, 1000, 1500, 2000, 2500, 3000, 5000];
    enemyDamageModifierPerRound = [0, 0.1, 0.1, 0.1, 0.1, 0.1, 1]; // Modifies enemy damage ouput
    enemyHealthModifierPerRound = [0, 0.1, 0.1, 0.1, 0.1, 0.1, 1]; // Multiplies enemy max health
    enemyFixedHealthIncreasePerRound = [0, 0, 0, 0, 0, 0, 0]; // Adds to enemy max health (super low health guys dont get much benefit from the multiplier)
}

let enemiesRemaining = 0;

let enemiesSpawnedThisRound = 0;
let enemiesDeployedThisRound = 0;

let totalEnemiesSpawned = 0;
let totalEnemiesDeployed = 0;

let currentRound = 0;
let initializedHQ = false;
let minimumSpawnSafeSpawnDelay = 3;

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Game Mode Startup:
//-----------------------------------------------------------------------------------------------//

export function OngoingGlobal() {
    // if (!initializedHQ) {
    //     mod.SetHQTeam(mod.GetHQ(1), mod.GetTeam(1));
    //     mod.SetHQTeam(mod.GetHQ(2), mod.GetTeam(2));
    // }
    //console.log("gameOver = ", gameOver)
}

export function OnPlayerInteract(player: mod.Player, interactPoint: any) {
    // Only used for MCOM Buy Station interact at the moment, if you add more interacts, you'll need to grab the ObjID of the MCOM.
    if (mod.GetObjId(interactPoint) == 1) {
        console.log('Player [', mod.GetObjId(player), '] is using the buy-station!');
        let jsPlayer = JsPlayer.get(player, 1);
        if (!jsPlayer) return;
        if (!jsPlayer.playerNotificationWidget) return;
        mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, false); // Close the notification widget so we can see the store.
        jsPlayer.lobbyUI.close();
        jsPlayer.store.open();
        mod.EnableUIInputMode(true, player);
    }

    if (mod.GetObjId(interactPoint) == 66) {
        let jsPlayer = JsPlayer.get(player, 1);
        if (!jsPlayer) return;
        if (!jsPlayer.playerNotificationWidget) return;
        mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, false); // Close the notification widget so we can see the store.
        jsPlayer.lobbyUI.close();
        TestVFXSpawn();
    }
}

const vfxSpawnList = [
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_01_Brown,
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_01_Green,
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_01_White,
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_02_Brown,
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_02_Green,
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_02_Red,
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_02_White,
    mod.RuntimeSpawn_Common.FX_Sparks,
    mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Green,
    mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Red,
    mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Violet,
    mod.RuntimeSpawn_Common.FX_Granite_Strike_Smoke_Marker_Yellow,
    mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Dirt,
    mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Grass,
    mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Sand,
    mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Snow,
    mod.RuntimeSpawn_Common.FX_Airplane_Jetwash_Water,
    mod.RuntimeSpawn_Common.fx_ambwar_artillarystrike,
    mod.RuntimeSpawn_Common.FX_AmbWar_UAV_Circling,
    mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_01,
    mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS,
    mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_GS,
    mod.RuntimeSpawn_Common.FX_Autocannon_30mm_AP_Hit_Metal_GS,
    mod.RuntimeSpawn_Common.FX_AW_Distant_Cluster_Bomb_Line_Outskirts,
    mod.RuntimeSpawn_Common.FX_BASE_Birds_Black_Circulating,
    mod.RuntimeSpawn_Common.FX_BASE_DeployClouds_Var_A,
    mod.RuntimeSpawn_Common.FX_BASE_DeployClouds_Var_B,
    mod.RuntimeSpawn_Common.FX_BASE_Dust_Large_Area,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_L,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_M,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_M_NoSmoke,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_Oil_Medium,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_S,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_S_NoSmoke,
    mod.RuntimeSpawn_Common.FX_BASE_Fire_XL,
    mod.RuntimeSpawn_Common.FX_BASE_Flies_Small,
    mod.RuntimeSpawn_Common.FX_BASE_Seagull_Flock,
    mod.RuntimeSpawn_Common.FX_BASE_Smoke_Column_XXL,
    mod.RuntimeSpawn_Common.FX_BASE_Smoke_Dark_M,
    mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_Black_L,
    mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_Black_L_Dist,
    mod.RuntimeSpawn_Common.FX_BASE_Smoke_Pillar_White_L,
    mod.RuntimeSpawn_Common.FX_BASE_Smoke_Soft_S_GS,
    mod.RuntimeSpawn_Common.FX_BASE_Sparks_Pulse_L,
    mod.RuntimeSpawn_Common.FX_BD_Huge_Horizon_Exp,
    mod.RuntimeSpawn_Common.FX_BD_Med_Horizon_Exp,
    mod.RuntimeSpawn_Common.FX_BD_Med_Horizon_Exp_Multi,
    mod.RuntimeSpawn_Common.FX_Blackhawk_Rotor_HaloGlow,
    mod.RuntimeSpawn_Common.FX_Blackhawk_Rotor_Vortex_Vapor,
    mod.RuntimeSpawn_Common.FX_BlackLocust_Tree_Branch_L_GS,
    mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation,
    mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Trail_Ballute_AirStrike,
    mod.RuntimeSpawn_Common.FX_BreachingDart_Breach_Detonation,
    mod.RuntimeSpawn_Common.FX_BreachingDart_Generic_BreachthroughSmoke,
    mod.RuntimeSpawn_Common.FX_BreachingDart_NoBreach_Detonation,
    mod.RuntimeSpawn_Common.FX_Building_FallingDustSand,
    mod.RuntimeSpawn_Common.FX_Bullet_L_Vegetation_DeadLeaves_PropDest,
    mod.RuntimeSpawn_Common.FX_CAP_AmbWar_Rocket_Strike,
    mod.RuntimeSpawn_Common.FX_CarFire_Bumper_01,
    mod.RuntimeSpawn_Common.FX_CarFire_FrameCrawl,
    mod.RuntimeSpawn_Common.FX_Carrier_Explosion_Dist,
    mod.RuntimeSpawn_Common.FX_Car_Fire_M_GS,
    mod.RuntimeSpawn_Common.FX_Chaingun_30mm_HEDP_Hit,
    mod.RuntimeSpawn_Common.FX_CIN_MF_Large_Static_Fire,
    mod.RuntimeSpawn_Common.FX_CIN_MF_Large_Static_VortexFire,
    mod.RuntimeSpawn_Common.FX_CIN_MF_Medium_Static_Fire,
    mod.RuntimeSpawn_Common.FX_CIN_MF_Medium_Static_Smoke,
    mod.RuntimeSpawn_Common.FX_CIN_MF_Small_Static_Fire,
    mod.RuntimeSpawn_Common.FX_CIN_MF_Small_Static_Smoke,
    mod.RuntimeSpawn_Common.FX_CivCar_SUV_Explosion,
    mod.RuntimeSpawn_Common.FX_CivCar_Tire_fire_S_GS,
    mod.RuntimeSpawn_Common.FX_WireGuidedMissile_SpooledWire,
];

let fxInt = 0;
let vfx: mod.VFX = mod.SpawnObject(
    mod.RuntimeSpawn_Abbasid.FX_PropDest_Metal_ShutterMetal_01_Brown,
    mod.CreateVector(-15.4, 93, -3.24),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(1, 1, 1)
);

async function TestVFXSpawn() {
    mod.EnableVFX(vfx, false);
    console.log('Spawning Test VFX: ', fxInt);
    vfx = mod.SpawnObject(vfxSpawnList[fxInt], mod.CreateVector(-15.4, 96, -3.24), mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    console.log('VFX ID: ', vfx);
    mod.EnableVFX(vfx, true);
    fxInt++;
}

async function SpawnVFXAtLocation(vfx: any, location: mod.Vector, rotation: mod.Vector, scale: mod.Vector, lifetime: number) {
    let spawnedVFX: mod.VFX = mod.SpawnObject(vfx, location, rotation, scale);
    mod.EnableVFX(spawnedVFX, true);

    if (lifetime > 0) {
        await mod.Wait(lifetime);
        mod.EnableVFX(spawnedVFX, false);
        mod.UnspawnObject(spawnedVFX);
    }
}

export async function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (testAreaTriggers) {
        console.log('Player ', mod.GetObjId(eventPlayer), ' entered Area Trigger ', mod.GetObjId(eventAreaTrigger));
        let playerLocation = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetPosition);

        let vfxTest = mod.SpawnObject(
            mod.RuntimeSpawn_Common.FX_Sparks,
            playerLocation,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(0.25, 0.25, 0.25)
        );
        mod.EnableVFX(vfxTest, true);
    }
}

export async function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (testAreaTriggers) {
        console.log('Player ', mod.GetObjId(eventPlayer), ' exited Area Trigger ', mod.GetObjId(eventAreaTrigger));
        let playerLocation = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetPosition);

        let vfx = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Sparks, playerLocation, mod.CreateVector(0, 0, 0), mod.CreateVector(0.25, 0.25, 0.25));
        mod.EnableVFX(mod.GetVFX(vfx), true);
    }
}

export async function OnGameModeStarted() {
    CreateScriptVersionUI();
    mod.SetGameModeTimeLimit(3600);

    SetupCustomScoreboard();

    initializedHQ = true;

    if (EnableEasyMode) {
        enableEasyMode();
    }
    OnGameModeStartedDebug().then();

    console.log('Besieged Game Mode Started');

    mod.EnableGameModeObjective(mod.GetMCOM(1), false);
    mod.EnableGameModeObjective(mod.GetMCOM(2), false);

    //TestObjectMover()

    // mod.EnableVFX(61, true);

    let gruntSpawnerWaypointPairCount = gruntWaypointPairs.length;

    while (gruntSpawnerWaypointPairCount > 0) {
        PickRandomSpawnerWaypointPair(randomizedGruntWaypointPairs);
        gruntSpawnerWaypointPairCount--;
    }

    // wait for required number of players to join the game.
    while (initialPlayerCount < minimumInitialPlayerCount) {
        await mod.Wait(1);
    }

    //mod.TriggerAudioAtLocation(mod.SoundEvents3D.Alarm_Start, mod.CreateVector(-82.31, 69.25, -20.78));

    ForceSpawnPlayers();

    await CombatCountdown();

    if (drawDebugUI) {
        CreateUI();
        CreateRoundHeaderUI();
    }

    GamePhaseManager();

    while (!gameOver) {
        await mod.Wait(1);
        ThrottledUpdate();
    }
}

async function TestObjectMover() {
    let testObjectId = mod.SpawnObject(
        mod.RuntimeSpawn_Abbasid.MosqueMinaret_01,
        mod.CreateVector(-79.42, 70.42, -5.884),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1, 1, 1)
    );
    let testObject = mod.GetSpatialObject(testObjectId);

    let moveDist = 0.1;

    while (!gameOver) {
        await mod.Wait(0.1);
        //mod.MoveObject(testObject, mod.CreateVector(0, moveDist, 0))
        //mod.RotateObject(testObject, mod.CreateVector(0, 0.1, 0))
    }
}

function ThrottledUpdate() {
    if (!gameOver) {
        UpdateUI();
        DisciplinePrisoners();
        CheckVictoryState();
    }

    //console.log("Besieged ThrottledUpdate ", currentRound);
}

export async function OnPlayerLeaveGame(playerId: number) {
    if (debugCombat) {
        console.log('Player [', playerId, '] left game');
    }

    JsPlayer.removeInvalidJSPlayers(playerId);
    JSEnemy.removeInvalidJSEnemies(playerId);
    // reduce player count.

    // Updated valid combatants count

    if (combatCountdownStarted && !gameOver) {
        //validCombatants = GetNumberOfPlayersOnTeam(combatTeam);
        //UpdateValidCombatantsUI();
        CheckVictoryState();
    } else if (!combatCountdownStarted) {
        if (!gameOver) {
            initialPlayerCount--;
            UpdateAllLobbyUI();
        }
    }
}

function SetupCustomScoreboard() {
    mod.SetScoreboardType(mod.ScoreboardType.CustomFFA); // You can also use CustomFFA, if you only want one list.
    mod.SetScoreboardHeader(mod.Message('goodguys')); // Will have to place those with mod.message() eventually. "Team2" name is optional, it'll just repeat Team1 on both if you skip it.
    mod.SetScoreboardColumnNames(mod.Message('kills'), mod.Message('deaths'), mod.Message('earned'), mod.Message('spent'), mod.Message('jailed')); // Will have to place those with mod.message() eventually.
    mod.SetScoreboardColumnWidths(10, 10, 10, 10, 10); // This is relative length. You could say 1, 2, 3, 2, 1  or 1000, 2000, 3000, 2000, 1000 -- it'll figure out the exact pixels length itself
    mod.SetScoreboardSorting(3, false); // sortingColumn = [0..4], reversesorting = true/false. (I think "default" sorting is Decreasing Order?)
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// End Game:
//-----------------------------------------------------------------------------------------------//
function PlayerRespawnManager() {
    if (teamRespawns <= 0) {
        // Turn off respawns
        console.log('Besieged Disabling Player Redeploy');
        //respawnsDisabled = true;
        //mod.EnablePlayerSpawning(false);

    
    } else if (teamRespawns < 5 && teamRespawns > 0) {
        // change UI color to Red
        if (respawnsDisabled === true) {
            respawnsDisabled = false;

            let players = mod.AllPlayers();
            let n = mod.CountOf(players);
            for (let i = 0; i < n; i++) {
                let player = mod.ValueInArray(players, i);
                if (mod.GetSoldierState(player as mod.Player, mod.SoldierStateBool.IsAISoldier) == false) {
                    //mod.EnablePlayerSpawning(true);
                    //let jsPlayer = JsPlayer.get(player)
                    //console.log("Besieged Enabling Player Redeploy");
                }
            }
        }
    } else {
        // change UI color to White
    }
}

function CheckVictoryState() {
    if (currentRound > maxRoundCount) {
        //victory
        EndGamePlayerVictory();
    } else if (true) {
        // Check if players are alive, otherwise end game in ignoble defeat.

        let anyPlayersStillAlive = false;

        let humanPlayersToUndeployOnDefeat = [];

        let players = mod.AllPlayers();
        let n = mod.CountOf(players);
        for (let i = 0; i < n; i++) {
            let player = mod.ValueInArray(players, i);
            if (player != null) {
                if (mod.GetSoldierState(player as mod.Player, mod.SoldierStateBool.IsAISoldier) == false) {
                    let jsPlayer = JsPlayer.get(player as mod.Player, 2);
                    if (!jsPlayer) continue;
                    if (jsPlayer.isPrisoner == false) {
                        if (
                            jsPlayer.cash >= currentTeamRespawnCost ||
                            mod.GetSoldierState(player as mod.Player, mod.SoldierStateBool.IsAlive) == true ||
                            teamRespawns > 0
                        ) {
                            anyPlayersStillAlive = true;
                        }
                    } else {
                        humanPlayersToUndeployOnDefeat.push(player);
                    }
                }
            }
        }

        if (anyPlayersStillAlive == false) {
            mod.EnableAllPlayerDeploy(false);
            console.log('Besieged Players to spawn length: ', humanPlayersToUndeployOnDefeat.length);
            EndGamePlayerDefeat(humanPlayersToUndeployOnDefeat);
        }
    } else {
        // Do nothing. Game Keeps going.
    }
}

function ForceSpawnPlayers() {
    mod.EnableAllPlayerDeploy(true);

    JsPlayer.playerInstances.forEach((player) => {
        if (debugSpawning) {
            console.log('Spawning All JsPlayers');
        }
        //DistributePlayersToTeams(player);
        mod.DeployPlayer(player as mod.Player);
    });

    //mod.ForceSpawnAllPlayers();
}

async function EndGamePlayerVictory() {
    gameOver = true;

    // nuke all portal UI:
    mod.DeleteAllUIWidgets();

    // show the end of round screen: - Deprecated for custom scoreboard.
    // CreateEndOfRoundUI(JsPlayer.getAllAsArray());

    // wait a bit:
    await mod.Wait(15);

    // end game:
    mod.DeleteAllUIWidgets();
    mod.EndGameMode(mod.GetTeam(1));
}

function EndGamePlayerDefeat(playersToUndeploy: any) {
    UpdateUI();
    playersToUndeploy.forEach((deadGuy: mod.Player) => {
        let jsPlayer = JsPlayer.get(deadGuy, 3);
        if (!jsPlayer) return;
        if (!jsPlayer.playerwalletWidget || !jsPlayer.playerNotificationWidget) return;
        console.log('Besieged End Game: ', deadGuy, jsPlayer);
        mod.SetUIWidgetVisible(jsPlayer.playerwalletWidget, false);
        mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, false);
        mod.UndeployPlayer(deadGuy);
    });

    //mod.UnspawnAllPlayers();

    console.log('Besieged end game in defeat');
    gameOver = true;
    mod.EndGameMode(mod.GetTeam(2));
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Player Functions:
//-----------------------------------------------------------------------------------------------//

export async function OnPlayerJoinGame(player: mod.Player) {
    // Check if this is a human player or not.
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        if (maxFreeRespawns > 0) {
            teamRespawns += freeRespawnsPerPlayer;
            maxFreeRespawns -= freeRespawnsPerPlayer;
        }

        // // If the player isn't on team 1, move them to team 1.
        // if (mod.GetObjId(mod.GetTeam(player)) != mod.GetObjId(mod.GetTeam(1))) {
        //     mod.SetTeam(player, mod.GetTeam(1));
        //     console.log('Besieged Human Player [', mod.GetObjId(player), '] on team [', mod.GetObjId(mod.GetTeam(player)), '] moved to team 1');
        // }


        // increase the initial player count.
        if (initialPlayerCount < minimumInitialPlayerCount) {
            initialPlayerCount++;
        }

        let jsPlayer = JsPlayer.get(player, 4);
        if (!jsPlayer) return;

        // Show the pre-game lobby window, assuming combat hasn't started.
        if (!combatStarted) {
            jsPlayer.lobbyUI.open();
            UpdateAllLobbyUI();
        }
    } else {
        if (mod.GetObjId(mod.GetTeam(player)) != mod.GetObjId(mod.GetTeam(2))) {
            mod.SetTeam(player, mod.GetTeam(2));
            console.log('Besieged AI Player [', mod.GetObjId(player), '] on team [', mod.GetObjId(mod.GetTeam(player)), '] moved to team 2');}
        // The player is not a human so we will ignore them.
    }
}

export async function OnPlayerDeployed(player: mod.Player) {
    //console.log("Besieged Player Deploying");

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false && !gameOver) {
        //humanPlayers.push(player);
        //console.log("Besieged Human Player Count = ", humanPlayers.length);
        SetBuyStationIcon(true);
        havePlayersDeployed = true;
        teamRespawns--;

        let jsPlayer = JsPlayer.get(player, 5);

        // this should never happen but adding it makes the compiler happy
        if (!jsPlayer) return;

        jsPlayer.isDeployed = true;
        let didWeAutoPurchaseARespawn = false;

        if (!jsPlayer.playerNotificationWidget) return;
        if (teamRespawns < 0) {
            if (jsPlayer.cash >= currentTeamRespawnCost) {
                // Lets just give them a respawn since they have the money.

                mod.SetUITextLabel(jsPlayer.playerNotificationWidget, modMessageDebug(autoPurchasedRespawn, currentTeamRespawnCost));
                mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, true);

                jsPlayer.cash -= currentTeamRespawnCost;
                currentTeamRespawnCost += respawnCostIncrease;
                //console.log("Besieged Current Team Respawn Cost: ", currentTeamRespawnCost);
                jsPlayer.isPrisoner = false;
                jsPlayer.timesIncarcerated = 0;

                didWeAutoPurchaseARespawn = true;
            } else {
                jsPlayer.isPrisoner = true;
            }

            teamRespawns = 0;
            UpdateUI();
        } else {
            jsPlayer.isPrisoner = false;
            jsPlayer.timesIncarcerated = 0;
            mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, false);
        }

        if (jsPlayer.isPrisoner == true) {
            // Straight to Jail.
            SendToPrison(player);
        } else {
            SetPlayerLoadout(player);
            // let playerY = mod.YComponentOf(mod.GetSoldierState(jsPlayer.player, mod.SoldierStateVector.GetPosition));
            // if (playerY > 78) {
            //     mod.Teleport(player, mod.CreateVector(-76.5, 63, -13.5), 4.7); // naughty players shouldn't try to deploy to prison.
            // }
        }

        PlayerRespawnManager();

        if (didWeAutoPurchaseARespawn) {
            await mod.Wait(10);
            mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, false);
            mod.SetUITextLabel(jsPlayer.playerNotificationWidget, modMessageDebug(youAreInJail));
        }

        if (jsPlayer.hasDeployed == false) {
            jsPlayer.hasDeployed = true;
            if (combatCountdownStarted == false) {
                jsPlayer.lobbyUI.open();
                UpdateAllLobbyUI();
            }
        } else {
            jsPlayer.updateHealthUI();
        }
    } else if (true && !gameOver) {
        if (debugSpawning) {
            console.log('AI Player [', mod.GetObjId(player), '] Deployed!');
        }

        let jsEnemy = JSEnemy.get(player, 1);
        let waveDefinition = EnemyWaveDefinition.currentWaveDefinition;
        let hasClassBeenAssigned = false;
        mod.SkipManDown(player, true);

        waveDefinition.forEach((row) => {
            if (debugSpawning) {
                console.log('Besieged SpawnEnemyAIOfClass Row: ', row);
            }
            if (row[0] == jsEnemy.spawnerId && hasClassBeenAssigned == false) {
                if (row[2] > 0) {
                    let enemyType = row[1];
                    SetAiLoadout(player, enemyType);
                    hasClassBeenAssigned = true;
                    row[2]--;

                    if (debugSpawning) {
                        console.log('Besieged AI Deploying Specific Class from Spawner: ', row[0], ' Time: ', mod.GetMatchTimeElapsed());
                    }
                }
            }
        });

        if (hasClassBeenAssigned == false) {
            console.log('WARNING: No Class Was Assigned For AI Player [', mod.GetObjId(player), ']');

            if (spawnRectifierActive) {
                console.log('WARNING: AI Player [', mod.GetObjId(player), '] is a class-less abomoination and will be destroyed');
                await mod.Wait(1);
                mod.Kill(player);
            }
        }

        enemiesDeployedThisRound++;
        totalEnemiesDeployed++;
        if (debugSpawning) {
            console.log('Besieged Total Enemies Deployed: ', totalEnemiesDeployed);
        }
        UpdateUI();
        mod.SpotTarget(player, 2);

        if (debugAIAutoDie) {
            await mod.Wait(5);
            mod.Kill(player);
        }
    }
}

function UpdateAllLobbyUI() {
    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player, 6);
        if (!jsPlayer) return;
        jsPlayer.lobbyUI.refresh();
    });
}

function HideAllLobbyUI() {
    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player, 7);
        if (!jsPlayer) return;
        jsPlayer.lobbyUI.close();
        jsPlayer.openWalletUI();
        jsPlayer.openHealthUI();
    });
}

async function CombatCountdown() {
    combatCountdownStarted = true;

    while (combatStartDelayRemaining > -1) {
        UpdateAllLobbyUI();
        await mod.Wait(1);
        combatStartDelayRemaining--;
    }

    combatStarted = true;
    HideAllLobbyUI();
}

function SetBuyStationIcon(showStation: boolean) {
    console.log('Besieged: Showing buy station');

    //mod.SetWorldIconPosition(mod.GetWorldIcon(2), buyStationPos);
    mod.SetWorldIconImage(mod.GetWorldIcon(2), mod.WorldIconImages.Flag)
    mod.SetWorldIconText(mod.GetWorldIcon(2), mod.Message("Weapons & Ammo"))
}

function SetPlayerLoadout(player: mod.Player) {

    console.log("Removing Class Gadget")
    mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget)
    console.log("Removing GadgetOne")
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne)
    console.log("Removing GadgetTwo")
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo)
    // console.log("Removing MiscGadget")
    // mod.RemoveEquipment(player, mod.InventorySlots.MiscGadget)
    console.log("Removing MeleeWeapon")
    mod.RemoveEquipment(player, mod.InventorySlots.MeleeWeapon)
    console.log("Removing PrimaryWeapon")
    mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon)
    console.log("Removing SecondaryWeapon")
    mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon)
    console.log("Removing Throwable")
    mod.RemoveEquipment(player, mod.InventorySlots.Throwable)

    //give them the proper sidearm
    mod.AddEquipment(player, mod.Weapons.Sidearm_P18)
    mod.AddEquipment(player, mod.Gadgets.Melee_Combat_Knife)

    

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        let jsPlayer = JsPlayer.get(player, 8);
        if (!jsPlayer) return;
        mod.SetPlayerMaxHealth(jsPlayer.player, jsPlayer.maxHealth);
        jsPlayer.updateHealthUI();
    }
}

export function OnPlayerDamaged(player: mod.Player, otherplayer: mod.Player, damageType: any, weapon: any) {
    //console.log('Besieged Damage to player [', mod.GetObjId(player), '] from [', mod.GetObjId(otherplayer), ']');

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        let jsPlayer = JsPlayer.get(player, 9);
        if (!jsPlayer) return;

        if (mod.GetSoldierState(otherplayer, mod.SoldierStateBool.IsAISoldier) == true){
            let jsEnemy = JSEnemy.get(otherplayer);
            if (jsEnemy.enemyClass.className == sacrificerClass.className || jsEnemy.enemyClass.className == RPGClass.className) {
                //mod.DealDamage(player, 200, otherplayer) // This is bad and probably causing a loop. 
                mod.DealDamage(player, 200)
            }
        }

        jsPlayer.updateHealthUI();
    } else {
        let jsEnemy = JSEnemy.get(player);
        if (jsEnemy.enemyClass.className == stalkerClass.className) {
            //console.log('Stalker Class Took Damage');
            if (mod.GetSoldierState(otherplayer, mod.SoldierStateBool.IsAISoldier) == false) {
                jsEnemy.target = otherplayer;
            }
            if (mod.GetSoldierState(player, mod.SoldierStateNumber.CurrentHealth) > 0) {
                TeleportSoldier(player, otherplayer);
            }
        } else if (jsEnemy.enemyClass.className == sacrificerClass.className && player == otherplayer) {
            mod.Kill(player);
        } else {
            // console.log("Some Other AI class took damage.")
        }
    }
}

function TeleportSoldier(player: mod.Player, otherplayer: mod.Player) {
    let teleportSoldierLocation = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
    let damagerLocation = mod.GetSoldierState(otherplayer, mod.SoldierStateVector.GetPosition);

    let enemyRange = mod.DistanceBetween(teleportSoldierLocation, damagerLocation);

    if (enemyRange < 1) {
        console.log('Stalker Enemy too close to teleport too');
        return;
    }

    let teleportTargetPosition = mod.Add(
        mod.GetSoldierState(otherplayer, mod.SoldierStateVector.GetPosition),
        mod.Multiply(mod.GetSoldierState(otherplayer, mod.SoldierStateVector.GetFacingDirection), enemyRange * 0.5)
    ) as mod.Vector;
    let adjustedTargetPosition = mod.CreateVector(
        mod.XComponentOf(teleportTargetPosition),
        mod.YComponentOf(teleportTargetPosition) + 0.5,
        mod.ZComponentOf(teleportTargetPosition)
    );

    let teleportVFX = mod.SpawnObject(
        mod.RuntimeSpawn_Common.FX_BASE_Sparks_Pulse_L,
        teleportSoldierLocation,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(5, 5, 5)
    );
    let teleportTargetVFX = mod.SpawnObject(
        mod.RuntimeSpawn_Common.FX_BASE_Sparks_Pulse_L,
        adjustedTargetPosition,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(5, 5, 5)
    );

    let rotationAngle: number = FindAngleToLocation2D(
        mod.XComponentOf(teleportTargetPosition),
        mod.ZComponentOf(teleportTargetPosition),
        mod.XComponentOf(damagerLocation),
        mod.ZComponentOf(damagerLocation)
    );

    mod.EnableVFX(teleportVFX, true);
    mod.EnableVFX(teleportTargetVFX, true);

    mod.Teleport(player, adjustedTargetPosition, rotationAngle);
}

function FindAngleToLocation2D(currentX: number, currentY: number, targetX: number, targetY: number) {
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    // Calculate the angle using atan2
    const angle = Math.atan2(dx, dy);

    return angle;
}

export function OnPlayerDied(player: mod.Player, otherPlayer: mod.Player) {
    if (debugCombat) {
        console.log('Besieged OnPlayer Died Player [', mod.GetObjId(player), '] OtherPlayer [', mod.GetObjId(otherPlayer), ']');
    }

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == true) {
        enemiesRemaining--;
        currentLivingAI--;

        let jsEnemy = JSEnemy.get(player, 2);
        let spawnerId = jsEnemy.spawnerId;
        let killer = otherPlayer;

        if (debugCombat) {
            console.log(
                'Besieged AI [',
                mod.GetObjId(player),
                '] from SpawnerId:',
                spawnerId,
                ' Killed by player [',
                mod.GetObjId(killer),
                '] at Time: ',
                mod.GetMatchTimeElapsed()
            );
        }

        if (jsEnemy.squadLeader == true) {
            // Demote me from squad leader so I don't get assigned to anyone else.
            jsEnemy.squadLeader = false;

            // Let my squad members know I'm dead and they should be mad about it.
            let players = mod.AllPlayers();
            let n = mod.CountOf(players);
            for (let i = 0; i < n; i++) {
                let aiSoldier = mod.ValueInArray(players, i);
                if (
                    mod.GetSoldierState(aiSoldier as mod.Player, mod.SoldierStateBool.IsAISoldier) == true &&
                    mod.GetSoldierState(aiSoldier as mod.Player, mod.SoldierStateBool.IsAlive) == true
                ) {
                    let jsEnemyAiSoldier = JSEnemy.get(aiSoldier as mod.Player, 3);
                    if (jsEnemyAiSoldier.mySquadLeader == jsEnemy.player) {
                        //console.log("Besieged AI [", mod.GetObjId(killer), "] has been set as priority target for AI [", mod.GetObjId(aiSoldier), "]");
                        jsEnemyAiSoldier.priorityTarget = killer;
                        // Clear your squad leader cause he's dead
                        jsEnemyAiSoldier.mySquadLeader = null;
                    } else {
                        //console.log("Besieged AI [", mod.GetObjId(jsEnemyAiSoldier.player),"] does not have Squad Leader = ", player, " ", mod.GetObjId(player), " ", jsEnemyAiSoldier.mySquadLeader, " ", mod.GetObjId(jsEnemyAiSoldier.mySquadLeader));
                    }
                } else {
                    //console.log("Besieged Not Qualified For Priority Target Assigment =", mod.GetObjId(aiSoldier));
                }
            }
        } else {
            //console.log("Besieged AI [", mod.GetObjId(jsEnemy.player), "] Is not a squad leader.");
        }

        if (jsEnemy.enemyClass.className == sacrificerClass.className) {
            // Spawn VFX Here.
            SpawnVFXAtLocation(
                mod.RuntimeSpawn_Common.FX_ArtilleryStrike_Explosion_GS,
                mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition),
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(1, 1, 1),
                10
            );
        }

        // console.log("Besieged - Trying to unspawn")
        // if (jsEnemy.spawnerId)
        //     spawnManager.UnspawnEnemyBySpawnerId(jsEnemy.spawnerId);
    } else {
        if (debugCombat) {
            console.log('Besieged Player [', mod.GetObjId(player), '] Killed by player [', mod.GetObjId(otherPlayer), '] at Time: ', mod.GetMatchTimeElapsed());
        }
    }
}

export function OnPlayerEarnedKill(player: mod.Player, otherplayer: mod.Player) {
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        let jsPlayer = JsPlayer.get(player, 10);
        if (!jsPlayer) return;
        jsPlayer.kills++;
        let cash = enemyCashValuePerRound[currentRound];
        jsPlayer.cash += cash;
        jsPlayer.totalCashEarned += cash;
        jsPlayer.updateWalletUI();
        mod.SetScoreboardPlayerValues(
            player,
            jsPlayer.kills,
            jsPlayer.deaths,
            jsPlayer.totalCashEarned,
            jsPlayer.totalCashEarned - jsPlayer.cash + initialCash,
            jsPlayer.timesIncarcerated
        );
    }
}

export function OnPlayerUndeploy(player: mod.Player) {
    if (JsPlayer.IsPlayer(mod.GetObjId(player)) === true) {
        //
        let jsPlayer = JsPlayer.get(player, 11);
        if (!jsPlayer) return;
        jsPlayer.isDeployed = false;
        if (debugCombat) {
            console.log('Besieged Player [', mod.GetObjId(player), '] Undeployed');
        }
        jsPlayer.deaths++;
        mod.SetScoreboardPlayerValues(
            player,
            jsPlayer.kills,
            jsPlayer.deaths,
            jsPlayer.totalCashEarned,
            jsPlayer.totalCashEarned - jsPlayer.cash + initialCash,
            jsPlayer.timesIncarcerated
        );
        if (teamRespawns <= 0) {
            if (jsPlayer.cash < currentTeamRespawnCost) {
                jsPlayer.isPrisoner = true;
                mod.SpawnPlayerFromSpawnPoint(player, 5000);
                PlayerRespawnManager();
                
            }
        }
        CheckVictoryState();
    } else if (JsPlayer.IsPlayer(mod.GetObjId(player)) === false) {
        //let jsEnemy = JSEnemy.get(player, 4);
        if (debugCombat) {
            console.log('Besieged Enemy Player [', mod.GetObjId(player), '] Undeployed');
        }
    }
}

export function OnMandown(player: mod.Player) {
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        if (debugCombat) {
            console.log('Besieged DBNO');
        }
    }
}

export function OnRevived(player: mod.Player) {
    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        if (debugCombat) {
            console.log('Besieged Revived');
        }
    }
}

function SendToPrison(player: mod.Player) {
    mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon);
    mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon);
    mod.RemoveEquipment(player, mod.InventorySlots.MeleeWeapon);
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne);
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo);
    mod.RemoveEquipment(player, mod.InventorySlots.Throwable);
    mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget);
    mod.RemoveEquipment(player, mod.InventorySlots.MiscGadget);

    mod.AddEquipment(player, mod.Gadgets.Deployable_Recon_Drone);

    mod.ForceSwitchInventory(player, mod.InventorySlots.GadgetOne);

    let jsPlayer = JsPlayer.get(player, 12);
    if (!jsPlayer) return;

    if (!jsPlayer.playerNotificationWidget) return;

    jsPlayer.timesIncarcerated++;
    mod.SetScoreboardPlayerValues(
        player,
        jsPlayer.kills,
        jsPlayer.deaths,
        jsPlayer.totalCashEarned,
        jsPlayer.totalCashEarned - jsPlayer.cash,
        jsPlayer.timesIncarcerated
    );
    mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, true);
}

function DisciplinePrisoners() {
    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player, 13);
        if (!jsPlayer) return;

        if (jsPlayer.isPrisoner == true && jsPlayer.timesIncarcerated > 0) {
            let prisonerY = mod.YComponentOf(mod.GetSoldierState(jsPlayer.player, mod.SoldierStateVector.GetPosition));
            if (prisonerY < 78) {
                // You've been naughty trying to escape from prison. We're sendin you back and taking some money from you.
                SendToPrison(jsPlayer.player);

                if (jsPlayer.cash >= 500) {
                    jsPlayer.cash -= 500;
                } else {
                    jsPlayer.cash = 0;
                }

                UpdateUI();
            }
        }
    });
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Game Phase Setups:
//-----------------------------------------------------------------------------------------------//

async function GamePhaseManager() {
    currentRound++;
    console.log('Besieged GamePhase Manager', currentRound);

    while (true && !gameOver) {
        PreCombatPhase();

        while (isPreCombatPhase == true) {
            await mod.Wait(1);
        }

        CombatPhaseSetup(currentRound);

        await CombatPhase();

        while (isCombatPhase == true) {
            await mod.Wait(1);
        }

        currentRound++;
        CheckVictoryState();

        PostCombatPhase();

        while (isPostCombatPhase == true) {
            await mod.Wait(1);
        }

        PrePurchasePhase();

        while (isPrePurchasePhase == true) {
            await mod.Wait(1);
        }

        PurchasePhaseSetup(currentRound);

        PurchasePhase(delayUntil);

        while (isPurchasePhase == true) {
            await mod.Wait(1);
        }
    }
}

//-----------------------------------------------------------------------------------------------//
// Combat Phases:
//-----------------------------------------------------------------------------------------------//

async function PreCombatPhase() {
    isPreCombatPhase = true;

    delayUntil = mod.GetMatchTimeElapsed() + preCombatDelayDuration;

    mod.SetUIWidgetVisible(combatStartCountdownWidget, false);

    while (delayUntil > mod.GetMatchTimeElapsed()) {
        await mod.Wait(1);
    }

    isPreCombatPhase = false;
    console.log('Besieged Pre Combat Phase Ended');
}

function CombatPhaseSetup(currentRound: number) {
    console.log('Besieged Combat Phase Setup ', currentRound);

    if (currentRound <= maxRoundCount) {
        mod.SetAIToHumanDamageModifier(enemyDamageModifierPerRound[currentRound]);

        enemiesSpawnedThisRound = 0;
        enemiesDeployedThisRound = 0;

        // mod.TriggerAudioAtLocation(mod.SoundEvents3D.Alarm_Stop, mod.CreateVector(-82.31, 69.25, -20.78));
        // mod.TriggerAudio(mod.SoundEvents2D.NewObjectiveGiven);
        mod.SetUITextLabel(combatStartCountdownWidget, modMessageDebug('Round {}', currentRound));
        mod.SetUIWidgetVisible(combatStartCountdownWidget, true);

        isCombatPhase = true;
    }
}

async function WaitForWaveCompletion(waveDefinition: any[]){
    let waveSpawnedAICount = CalculateWaveSpawnEnemyCount(waveDefinition)
    let targetSpawnedAICount = totalAiSpawned + waveSpawnedAICount

    while (targetSpawnedAICount > totalAiSpawned){
        await mod.Wait(0.5)
    }
}

async function CombatPhase() {
    console.log('Besieged Combat Phase Round: ', currentRound);

    delayUntil = mod.GetMatchTimeElapsed() + combatPhaseBannerDuration;

    let expectedEnemyCount = 0;

    switch (currentRound) {
        case 0:
            break;
        case 1:
            const testWave = false;
            if (testWave) {
                // ------ Test Wave ------ //
                expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(TestWaveDefinition);
                enemiesRemaining = expectedEnemyCount;
                SpawnEnemyAIOfClass(TestWaveDefinition);
                await mod.Wait(CalculateWaveSpawnDuration(TestWaveDefinition));
            } else if (testSpawnOverDeploy) {
                console.log("Manually spawning additonal AI's to test Spawning");
                mod.SpawnAIFromAISpawner(mod.GetSpawner(6));
                mod.SpawnAIFromAISpawner(mod.GetSpawner(7));
                mod.SpawnAIFromAISpawner(mod.GetSpawner(8));
                mod.SpawnAIFromAISpawner(mod.GetSpawner(9));
            } else if (testSpawnUnderDeploy) {
                console.log('Spawning a smaller wave than expected to test Spawning');
                SpawnEnemyAIOfClass(R1_W1_WaveDefinition);
                await mod.Wait(CalculateWaveSpawnDuration(R1_W1_WaveDefinition));
            } else if (testWave == false) {
                // ------ Actual Round 1 wave ------ //
                expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W1_WaveDefinition);
                expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W2_WaveDefinition);
                enemiesRemaining = expectedEnemyCount;
                console.log('Besieged Combat Phase Wave [', currentRound, ']. Expected Enemy Count [', expectedEnemyCount, ']');
                SpawnEnemyAIOfClass(R1_W1_WaveDefinition);
                await WaitForWaveCompletion(R1_W1_WaveDefinition);
                SpawnEnemyAIOfClass(R1_W2_WaveDefinition);
                await WaitForWaveCompletion(R1_W2_WaveDefinition);

            }

            break;

        case 2:
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W3_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W2_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W1_WaveDefinition);
            enemiesRemaining = expectedEnemyCount;
            console.log('Besieged Combat Phase Wave [', currentRound, ']. Expected Enemy Count [', expectedEnemyCount, ']');

            SpawnEnemyAIOfClass(R1_W3_WaveDefinition);
            await WaitForWaveCompletion(R1_W3_WaveDefinition);
            await mod.Wait(15);
            SpawnEnemyAIOfClass(R1_W2_WaveDefinition);
            await WaitForWaveCompletion(R1_W2_WaveDefinition);
            await mod.Wait(15);
            SpawnEnemyAIOfClass(R1_W1_WaveDefinition);
            await WaitForWaveCompletion(R1_W1_WaveDefinition);
            break;

        case 3:
            // Boss Fight!
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W3_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W2_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R3_Paradrop);
            enemiesRemaining = expectedEnemyCount;
            console.log('Besieged Combat Phase Wave [', currentRound, ']. Expected Enemy Count [', expectedEnemyCount, ']');

            SpawnEnemyAIOfClass(R3_Paradrop, 0.5);
            await WaitForWaveCompletion(R3_Paradrop);
            await mod.Wait(15);
            SpawnEnemyAIOfClass(R1_W3_WaveDefinition);
            await WaitForWaveCompletion(R1_W3_WaveDefinition);
            await mod.Wait(15);
            SpawnEnemyAIOfClass(R1_W2_WaveDefinition);
            await WaitForWaveCompletion(R1_W2_WaveDefinition);
            await mod.Wait(15);
            break;

        case 4:
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R4_Stalker_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R4_W1_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W4_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W1_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W2_WaveDefinition);
            enemiesRemaining = expectedEnemyCount;
            console.log('Besieged Combat Phase Wave [', currentRound, ']. Expected Enemy Count [', expectedEnemyCount, ']');

            R4_Stalker_WaveDefinition;
            SpawnEnemyAIOfClass(R4_Stalker_WaveDefinition);
            await WaitForWaveCompletion(R4_Stalker_WaveDefinition);
            SpawnEnemyAIOfClass(R4_W1_WaveDefinition);
            await WaitForWaveCompletion(R4_W1_WaveDefinition);
            await mod.Wait(45);
            SpawnEnemyAIOfClass(R1_W4_WaveDefinition);
            await WaitForWaveCompletion(R1_W4_WaveDefinition);
            await mod.Wait(30);
            SpawnEnemyAIOfClass(R1_W1_WaveDefinition);
            await WaitForWaveCompletion(R1_W1_WaveDefinition);
            await mod.Wait(30);
            SpawnEnemyAIOfClass(R1_W2_WaveDefinition);
            await WaitForWaveCompletion(R1_W2_WaveDefinition);
            await mod.Wait(20);
            break;

        case 5:
            //spawnManager.SpawnWave(Test_Wave_Spawn_Limit);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W1_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W2_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W3_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R1_W4_WaveDefinition);
            expectedEnemyCount = expectedEnemyCount + CalculateWaveSpawnEnemyCount(R4_W1_WaveDefinition);
            enemiesRemaining = expectedEnemyCount;
            console.log('Besieged Combat Phase Wave [', currentRound, ']. Expected Enemy Count [', expectedEnemyCount, ']');

            SpawnEnemyAIOfClass(R1_W1_WaveDefinition);
            await WaitForWaveCompletion(R1_W1_WaveDefinition);
            await mod.Wait(15);
            SpawnEnemyAIOfClass(R1_W2_WaveDefinition);
            await WaitForWaveCompletion(R1_W2_WaveDefinition);
            await mod.Wait(20);
            SpawnEnemyAIOfClass(R1_W3_WaveDefinition);
            await WaitForWaveCompletion(R1_W3_WaveDefinition);
            await mod.Wait(30);
            SpawnEnemyAIOfClass(R1_W4_WaveDefinition);
            await WaitForWaveCompletion(R1_W4_WaveDefinition);
            await mod.Wait(45);
            SpawnEnemyAIOfClass(R4_W1_WaveDefinition);
            await WaitForWaveCompletion(R4_W1_WaveDefinition);
            break;
        default:
    }

    while (delayUntil > mod.GetMatchTimeElapsed()) {
        await mod.Wait(1);
    }

    if (expectedEnemyCount == enemiesSpawnedThisRound && enemiesSpawnedThisRound == enemiesDeployedThisRound) {
        console.log(
            'ExpectedEnemyCount[',
            expectedEnemyCount,
            '], EnemiesSpawnedThisRound[',
            enemiesSpawnedThisRound,
            '], & EnemiesDeployedThisRound[',
            enemiesDeployedThisRound,
            '] ARE EQUAL. We done good.'
        );
    } else {
        console.log(
            'WARNING: ExpectedEnemyCount[',
            expectedEnemyCount,
            '], EnemiesSpawnedThisRound[',
            enemiesSpawnedThisRound,
            '], & EnemiesDeployedThisRound[',
            enemiesDeployedThisRound,
            '] ARE NOT EQUAL. We done goofed.'
        );
        if (spawnRectifierActive) {
            console.log('Current enemies remaining = ', enemiesRemaining);
            enemiesRemaining = SpawnRectifier(expectedEnemyCount, enemiesSpawnedThisRound, enemiesDeployedThisRound, enemiesRemaining);
            console.log('New enemies remaining = ', enemiesRemaining);
            mod.SetUITextColor(enemiesremainingWidget, mod.CreateVector(1, 0, 0));
        }
    }

    mod.SetUIWidgetVisible(combatStartCountdownWidget, false);

    while (enemiesRemaining > 0) {
        await mod.Wait(1);
        //console.log("Besieged: Waiting for enemiesRemaining >0.");
    }

    isCombatPhase = false;
}

function SpawnRectifier(expected: number, spawned: number, deployed: number, current: number): number {
    // This is a shameful hack to allow our playtest to continue even when spawning is broken.
    console.log('WARNING: The Spawn Rectifier is running. Something bad has happened.');

    let newEnemiesRemaining: number;
    let delta: number;

    if (expected > deployed) {
        // we spawned too few, so reduce the count players need to kill.
        delta = expected - deployed;
        console.log('Spawn Rectifier Underspawn Detected = ', delta);
        newEnemiesRemaining = current - delta;
    } else if (expected < deployed) {
        // we spawned too many, so increased the count players need to kill.
        delta = deployed - expected;
        console.log('Spawn Rectifier Overspawn Detected = ', delta);
        newEnemiesRemaining = current + delta;
    } else {
        newEnemiesRemaining = current; // handle any weird cases where our expected and spawn count didn't match, but the deploy count did?
        console.log('WARNING: Spawn Rectifier ran when expected and Deployed Player Count are Equal. ');
    }

    console.log('Spawn Rectifier current: ', current);
    console.log('Spawn Rectifier returning: ', newEnemiesRemaining);
    return newEnemiesRemaining;
}

async function PostCombatPhase() {
    delayUntil = mod.GetMatchTimeElapsed() + preCombatDelayDuration;
    isPostCombatPhase = true;

    // mod.TriggerAudio(mod.SoundEvents2D.ObjectiveCompleted);
    mod.SetUITextLabel(combatStartCountdownWidget, modMessageDebug('Enemy Attack Repulsed'));
    mod.SetUIWidgetVisible(combatStartCountdownWidget, true);

    //await UnspawnAIPlayers()

    while (delayUntil > mod.GetMatchTimeElapsed()) {
        await mod.Wait(1);
    }

    mod.SetUIWidgetVisible(combatStartCountdownWidget, false);

    isPostCombatPhase = false;
    console.log('Besieged Post Combat Phase Ended');
}

//-----------------------------------------------------------------------------------------------//
// Purchase Phases:
//-----------------------------------------------------------------------------------------------//

async function PrePurchasePhase() {
    console.log('Besieged Pre Purchase Phase');

    isPrePurchasePhase = true;

    delayUntil = mod.GetMatchTimeElapsed() + prePurchasePhaseDuration;

    mod.SetUIWidgetVisible(combatStartCountdownWidget, false);

    let players = mod.AllPlayers();
    let n = mod.CountOf(players);
    for (let i = 0; i < n; i++) {
        let player = mod.ValueInArray(players, i);
        if (mod.GetSoldierState(player as mod.Player, mod.SoldierStateBool.IsAISoldier) == false) {
            mod.ForceRevive(player as mod.Player);
        }
    }

    while (delayUntil > mod.GetMatchTimeElapsed()) {
        await mod.Wait(1);
    }

    isPrePurchasePhase = false;

    console.log('Besieged Pre Purchase Phase Ended');
}

function PurchasePhaseSetup(currentRound: number) {
    console.log('Besieged Purchase Phase Setup ', currentRound);

    delayUntil = mod.GetMatchTimeElapsed() + maxPurchasePhaseDuration;

    mod.SetUITextLabel(combatStartCountdownWidget, modMessageDebug('Purchase Phase {}', Math.floor(delayUntil - mod.GetMatchTimeElapsed())));
    mod.SetUIWidgetVisible(combatStartCountdownWidget, true);

    isPurchasePhase = true;
}

async function PurchasePhase(delayUntil: number) {
    // reset the buy count of all items in the store
    JsPlayer.resetItemBuysPerRound();

    JsPlayer.playerInstances.forEach((player: mod.Player) => {
        let jsPlayer = JsPlayer.get(player, 14);
        if (!jsPlayer) return;

        if (!jsPlayer.playerNotificationWidget) return;
        mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, false); // Close the notification widget so we can see the store.
        jsPlayer.store.open();

        PurchasePhaseOpenDebug(player).then();
    });

    RefreshAllStores();

    mod.EnableUIInputMode(true);

    let anyStoreOpen = true;

    //JSEnemy.unspawnAllJSEnemies(); // clean up any stragglers from the last combat round. Doing this while the store is open to hide our shame.

    while (delayUntil > mod.GetMatchTimeElapsed() && anyStoreOpen == true) {
        anyStoreOpen = false;

        // Check to see if everyone has closed their store, so we can bail out of the purchase phase early.
        JsPlayer.playerInstances.forEach((player) => {
            let jsPlayer = JsPlayer.get(player, 15);
            if (!jsPlayer) return;
            const i = mod.GetObjId(player);
            const isOpen = jsPlayer.store.isOpen();
            //console.log("Besieged ", i, " Store Open? ", isOpen);
            if (isOpen) {
                anyStoreOpen = true;
            }
        });

        await mod.Wait(1);

        mod.SetUITextLabel(combatStartCountdownWidget, modMessageDebug('Purchase Phase {}', Math.floor(delayUntil - mod.GetMatchTimeElapsed())));

        //console.log("Besieged Waiting for Purchase phase ", delayUntil, " game time: ", mod.GetMatchTimeElapsed());
    }

    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player, 16);
        if (!jsPlayer) return;
        if (!jsPlayer.playerNotificationWidget) return;
        jsPlayer.store.close();
        if (jsPlayer.isPrisoner == true) {
            mod.SetUIWidgetVisible(jsPlayer.playerNotificationWidget, true);
        }
    });

    mod.EnableUIInputMode(false);

    mod.SetUIWidgetVisible(combatStartCountdownWidget, false);

    isPurchasePhase = false;
    console.log('Besieged Purchase Phase Ended');
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Enemy AI:
//-----------------------------------------------------------------------------------------------//

class JSEnemy {
    player: mod.Player;
    enemyTypeName = 'AI Enemy';
    maxHealth = 100;
    primaryWeapon: any;
    secondaryWeapon: any;
    meleeWeapon: any;
    openGadet: any;
    throwable: any;
    spawnerId?: SpawnerId;
    moveToSucceeded = false;
    enemyClass: any;

    currenttarget = null;
    lineOfSight: boolean;

    static enemyInstances: mod.Player[] = [];

    // Squad Behavior Stuff

    squadLeader;
    squadMember;
    mySquadLeader: any;

    prioritytarget = null;

    isPrisoner = false;

    constructor(player: mod.Player) {
        this.player = player;
        this.squadLeader = false;
        this.squadMember = false;
        this.lineOfSight = false;
    }

    static #allJsEnemies: any = {};
    static get(player: mod.Player, instance?: number) {
        if (!gameOver) {
            let index = mod.GetObjId(player);

            if (instance == null) {
                instance = 2000;
            }
            if (debugJSEnemy) {
                console.log('Calling JSEnemy.get Instance [', instance, '] on Player [', index, ']');
            }

            if (!this.#allJsEnemies[index]) {
                this.#allJsEnemies[index] = new JSEnemy(player);
                JSEnemy.enemyInstances.push(player);
                if (debugJSEnemy) {
                    console.log(
                        'Creating new JSEnemy for player[',
                        mod.GetObjId(player),
                        '], JSEnemy.enemyInstances.length = [',
                        JSEnemy.enemyInstances.length,
                        ']'
                    );
                }
            }

            return this.#allJsEnemies[index];
        }
    }

    static removeInvalidJSEnemies(invalidPlayerId: number) {
        if (!gameOver) {
            if (debugJSEnemy) {
                console.log('Removing Invalid JSEnemy. length = ', JSEnemy.enemyInstances.length);
            }
            let enemiesLength = Object.keys(JSEnemy.#allJsEnemies).length;
            if (debugJSEnemy) {
                console.log('Starting #allJsEnemies length = ', enemiesLength);
            }

            let n = 0;
            let indexToRemove = -1;

            // identify JSEnemy.enemyInstance that need to be removed.

            JSEnemy.enemyInstances.forEach((indexPlayer) => {
                if (mod.GetObjId(JSEnemy.enemyInstances[n]) < 0) {
                    if (debugJSEnemy) {
                        console.log('Removing JSEnemy.enemyInstances [', mod.GetObjId(JSEnemy.enemyInstances[n]), '] at index: ', n);
                    }
                    indexToRemove = n;
                } else {
                    if (debugJSEnemy) {
                        console.log('This Enemy is alive and well #', mod.GetObjId(JSEnemy.enemyInstances[n]));
                    }
                }
                n++;
            });

            // This function should have been passed in the player id by the Player leave game event.
            delete this.#allJsEnemies[invalidPlayerId];

            if (indexToRemove > -1) {
                JSEnemy.enemyInstances.splice(indexToRemove, 1);
                if (debugJSEnemy) {
                    console.log('JSEnemy Instance Removed at: ', indexToRemove);
                }
                indexToRemove = -1;
            }

            if (debugJSEnemy) {
                enemiesLength = Object.keys(JSEnemy.#allJsEnemies).length;
                console.log('JS Enemies Remaining = ', JSEnemy.enemyInstances.length);
                console.log('New #allJsEnemies length = ', enemiesLength);
            }
        }
    }

    static unspawnAllJSEnemies() {
        let n = 0;

        if (debugJSEnemy) {
            console.log('JSEnemy.enemyInstances.length = [', JSEnemy.enemyInstances.length, ']');
        }

        JSEnemy.enemyInstances.forEach((enemy) => {
            if (debugJSEnemy) {
                console.log('Got enemy [', mod.GetObjId(enemy), '], getting JSEnemy');
            }

            let jsEnemy = JSEnemy.get(enemy, 5);

            let index = mod.GetObjId(enemy);
            delete this.#allJsEnemies[index];

            if (debugJSEnemy) {
                console.log('Trying to get spawner[', jsEnemy.spawnerId, '] from enemy [', mod.GetObjId(enemy), ']');
            }
            mod.UndeployPlayer(jsEnemy.player);

            n++;
        });

        JSEnemy.enemyInstances.length = 0;

        if (debugJSEnemy) {
            console.log('Attempted to Unspawn ', n, ' enemy AI');
        }
    }
}

class EnemyClassData {
    maxHealth = 100;
    primaryWeapon: any;
    weaponPackagePrimary: any;

    secondaryWeapon: any;
    
    
    meleeWeapon: any;
    openGadet: any;
    throwable: any;

    aiBehavior: any;
    squadFallbackBehavior: any;
    lineOfSight?: boolean;
    baseClass?: mod.SoldierClass;
    className?: string;

    static instances: EnemyClassData[] = [];
    static PI = 3.14;

    constructor(
        maxHealth: number,
        primaryWeapon: any,
        weaponPackagePrimary: any,
        secondaryWeapon: any,
        meleeWeapon: any,
        openGadet: any,
        throwable: any,
        aiBehavior: any,
        squadFallbackBehavior?: any,
        lineOfSight?: boolean,
        baseClass?: mod.SoldierClass,
        className?: string,
        
    ) {
        this.maxHealth = maxHealth;
        this.primaryWeapon = primaryWeapon;
        this.weaponPackagePrimary = weaponPackagePrimary;
        this.secondaryWeapon = secondaryWeapon;
        this.meleeWeapon = meleeWeapon;
        this.openGadet = openGadet;
        this.throwable = throwable;
        this.aiBehavior = aiBehavior;
        this.squadFallbackBehavior = squadFallbackBehavior;
        this.lineOfSight = lineOfSight;
        this.baseClass = baseClass;
        this.className = className;
        
        EnemyClassData.instances.push(this);
    }

    static getRandomEnemyClassData() {
        let i = getRandomInt(EnemyClassData.instances.length);
        return EnemyClassData.instances[i];
    }

    runAIBehavior(player: mod.Player, func: any, target: mod.Player) {
        func(player, target);
    }
}

// Enemy Wave Definitions:

class EnemyWaveDefinition {
    waveDefinitionArray: any[][];
    static currentWaveDefinition: any[];

    spawnerId?: number;
    classtype?: any;
    numberToSpawn?: number;
    spawnDelay?: number;

    round = 0;
    wave = 0;

    getRandomWaveForRound(round: number, wave: number) {
        let randomWave = 0;
        return randomWave;
    }

    static cloneWaveDefinition(waveDefinition: any[]) {
        EnemyWaveDefinition.currentWaveDefinition = deepCopyArray(waveDefinition) as any[];
        //console.log("Besieged Cloning Wave Definition");
    }

    static randomizeSpawnerID(waveDefinition: any[][]) {
        waveDefinition.forEach((row) => {
            if (row[4] == true) {
                //console.log("Besieged Randomizing Spawner ID. [", row[0], "] => [", randomizedGruntWaypointPairs[row[0]]);
                row[0] = randomizedGruntWaypointPairs[row[0]];
            }
        });
    }

    constructor(waveDefinitionArray: any[][]) {
        this.waveDefinitionArray = waveDefinitionArray;
    }
}

// Enemy Class Definitions:

let nullClassWeaponPackagePrimary = mod.CreateNewWeaponPackage()

const testEnemyClass = new EnemyClassData(
    10,
    null,
    nullClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    slasherClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Slasher'
);

const slasherClass = new EnemyClassData(
    10,
    null,
    nullClassWeaponPackagePrimary,
    null,
    mod.Gadgets.Melee_Combat_Knife,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    slasherClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Slasher'
);

const smasherClass = new EnemyClassData(
    10,
    null,
    nullClassWeaponPackagePrimary,
    null,
    mod.Gadgets.Melee_Sledgehammer,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    slasherClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Smasher'
);
const speedySnakeClass = new EnemyClassData(
    100,
    null,
    nullClassWeaponPackagePrimary,
    null,
    mod.Gadgets.Melee_Combat_Knife,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    speedySnakeClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Speedy Snake'
);
const sneakySnakeClass = new EnemyClassData(
    100,
    null,
    nullClassWeaponPackagePrimary,
    null,
    mod.Gadgets.Melee_Combat_Knife,
    null,
    null,
    sneakySnakeClassBehavior,
    null,
    false,
    mod.SoldierClass.Recon,
    'Sneaky Snake'
);

let sniperClassWeaponPackagePrimary = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SSDS_600x, sniperClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, sniperClassWeaponPackagePrimary)

const sniperClass = new EnemyClassData(
    30,
    mod.Weapons.Sniper_SV_98,
    sniperClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Motion_Sensor,
    null,
    sniperClassBehavior,
    null,
    false,
    mod.SoldierClass.Recon,
    'Sniper'
);

const sniperSquadClass = new EnemyClassData(
    50,
    mod.Weapons.Sniper_SV_98,
    nullClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Motion_Sensor,
    null,
    sniperSquadClassBehavior,
    sniperClassBehavior,
    false,
    mod.SoldierClass.Recon,
    'Sniper'
);

//// - SoldierClass - ////


let soldierClassWeaponPackagePrimary = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Baker_300x, soldierClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, soldierClassWeaponPackagePrimary)

const soldierClass = new EnemyClassData(
    30,
    mod.Weapons.AssaultRifle_AK4D,
    soldierClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    soldierClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Soldier'
);

const soldierSquadClass = new EnemyClassData(
    50,
    mod.Weapons.AssaultRifle_AK4D,
    soldierClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    soldierSquadClassBehavior,
    soldierClassBehavior,
    false,
    mod.SoldierClass.Assault,
    'Soldier'
);

//// - ShotgunClass - ////

let shotgunClassWeaponPackagePrimary = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_50_mW_Green, shotgunClassWeaponPackagePrimary)

const shotgunClass = new EnemyClassData(
    50,
    mod.Weapons.Shotgun_M1014,
    shotgunClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    shotgunClassBehavior,
    null,
    false,
    mod.SoldierClass.Engineer,
    'Skeeter'
);

const shotgunSquadClass = new EnemyClassData(
    50,
    mod.Weapons.Shotgun_M1014,
    shotgunClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    shotgunSquadClassBehavior,
    shotgunClassBehavior,
    false,
    mod.SoldierClass.Engineer,
    'Skeeter'
);

//// - HMGClass - ////

let hmgClassWeaponPackagePrimary = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Vertical, hmgClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, hmgClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_100rnd_Belt_Box, hmgClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, hmgClassWeaponPackagePrimary)

const hmgClass = new EnemyClassData(
    150,
    mod.Weapons.LMG_M240L,
    hmgClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    hmgClassBehavior,
    null,
    false,
    mod.SoldierClass.Support,
    'SAW-er'
);

const hmgSquadClass = new EnemyClassData(
    50,
    mod.Weapons.LMG_M240L,
    hmgClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    hmgSquadClassBehavior,
    hmgClassBehavior,
    false,
    mod.SoldierClass.Support,
    'SAW-er'
);

//// - paratrooperClass - ////

let paratrooperClassWeaponPackagePrimary = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_15rnd_Fast_Mag, paratrooperClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_CQB_Suppressor, paratrooperClassWeaponPackagePrimary)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_CQ_RDS_125x, paratrooperClassWeaponPackagePrimary)


const paratrooperClass = new EnemyClassData(
    50,
    mod.Weapons.SMG_SCW_10,
    paratrooperClassWeaponPackagePrimary,
    null,
    mod.Gadgets.Melee_Combat_Knife,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    paratrooperClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Sky Soldier'
);

//// - RPGClass - ////
const RPGClass = new EnemyClassData(
    200, 
    null, 
    nullClassWeaponPackagePrimary,
    null, 
    null, 
    mod.Gadgets.Launcher_Unguided_Rocket, 
    null, 
    rpgClassBehavior,
    null, 
    false, 
    mod.SoldierClass.Assault, 
    'Splasher');

//// - SacrificerClass - ////

const sacrificerClass = new EnemyClassData(
    20,
    null,
    nullClassWeaponPackagePrimary,
    null,
    null, 
    mod.Gadgets.Launcher_Unguided_Rocket,
    null,
    sacrificerClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'Sacrificer'
);

// Experimental Classes

const tankerClass = new EnemyClassData(
    20,
    null,
    nullClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Launcher_Unguided_Rocket,
    null,
    superHeavyClassBehavior,
    null,
    false,
    mod.SoldierClass.Assault,
    'SuperHeavy'
);
const stalkerClass = new EnemyClassData(
    500,
    null,
    nullClassWeaponPackagePrimary,
    null,
    mod.Gadgets.Melee_Combat_Knife,
    mod.Gadgets.Misc_Defibrillator,
    null,
    stalkerClassBehavior,
    null,
    false,
    mod.SoldierClass.Support,
    'Stalker'
);
const summonerClass = new EnemyClassData(
    150,
    null,
    nullClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Misc_Defibrillator,
    null,
    stalkerClassBehavior,
    null,
    false,
    mod.SoldierClass.Support,
    'SAW-er'
);



// Squad Classes




const slasherSquadClass = new EnemyClassData(
    10,
    null,
    nullClassWeaponPackagePrimary,
    null,
    null,
    mod.Gadgets.Class_Adrenaline_Injector,
    null,
    slasherSquadClassBehavior,
    slasherClassBehavior,
    false,
    mod.SoldierClass.Assault,
    'Slasher'
);


// Enemy Wave Definitions:

const TestWaveDefinition = [
    // [20, hmgSquadClass, 1, 1, true],
    // [20, slasherSquadClass, 3, 2, true],
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    //[36, hmgSquadClass, 1, 1, false],
    //[36, stalkerClass, 1, 1, false],
    // [20, hmgSquadClass, 1, 1, true],
    //[35, slasherClass, 3, 2, false],
    // [36, sniperSquadClass, 1, 1, false],
    //[36, sneakySnakeClass, 10, 1, false],
     [1, hmgClass, 10, 1, false],
    // [1, smasherClass, 10, 1, false],
    // [1, sniperClass, 4, 2, false],
    // [2, sniperClass, 4, 2, false],
    // [3, sniperClass, 4, 2, false],
    // [4, sniperClass, 1, 1, false],
    // [5, sniperClass, 1, 1, false],
    // [36, sniperClass, 5, 1, false],
    // [7, sniperClass, 1, 1, false],
    // [8, sniperClass, 1, 1, false],
    // [9, sniperClass, 1, 1, false],
    // [10, sniperClass, 1, 1, false],
    // [11, sniperClass, 1, 1, false],
    // [12, sniperClass, 1, 1, false],
    // [13, sniperClass, 1, 1, false],
    // [14, sniperClass, 1, 1, false],
    // [15, sniperClass, 1, 1, false],
    // [16, sniperClass, 1, 1, false],
    // [17, sniperClass, 1, 1, false],
    // [18, sniperClass, 1, 1, false],
    // [19, sniperClass, 1, 1, false],
    // [20, sniperClass, 1, 1, false],
    // [21, sniperClass, 1, 1, false],
    // [22, sniperClass, 1, 1, false],
    // [23, sniperClass, 1, 1, false],
    // [24, sniperClass, 1, 1, false],
    // [25, sniperClass, 1, 1, false],
    // [26, sniperClass, 1, 1, false],
    // [27, sniperClass, 1, 1, false],
    // [28, sniperClass, 1, 1, false],
    // [29, sniperClass, 1, 1, false],
    // [30, sniperClass, 1, 1, false],
    // [31, sniperClass, 1, 1, false],
    // [32, sniperClass, 1, 1, false],
    // [33, sniperClass, 1, 1, false],
    // [34, sniperClass, 1, 1, false],
    // [35, sniperClass, 1, 1, false],
    // [36, sniperClass, 5, 1, false],
    // [101, paratrooperClass, 1, 1, false],
    // [102, paratrooperClass, 1, 1, false],
    // [103, paratrooperClass, 1, 1, false],
    // [104, paratrooperClass, 1, 1, false],
    // [105, paratrooperClass, 1, 1, false],
    // [106, paratrooperClass, 1, 1, false],
    // [107, paratrooperClass, 1, 1, false],
    // [108, paratrooperClass, 1, 1, false],
    // [109, paratrooperClass, 1, 1, false],
    // [110, paratrooperClass, 1, 1, false],
    // [111, paratrooperClass, 1, 1, false],
    // [112, paratrooperClass, 1, 1, false]
];

const R3_Paradrop = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [101, paratrooperClass, 1, 1, false],
    [102, paratrooperClass, 1, 1, false],
    [103, paratrooperClass, 1, 1, false],
    [104, paratrooperClass, 1, 1, false],
    [105, paratrooperClass, 1, 1, false],
    [106, paratrooperClass, 1, 1, false],
    [107, paratrooperClass, 1, 1, false],
    [108, paratrooperClass, 1, 1, false],
    [109, paratrooperClass, 1, 1, false],
    [110, paratrooperClass, 1, 1, false],
    [111, paratrooperClass, 1, 1, false],
    [112, paratrooperClass, 1, 1, false],
];

const R5_Tanker = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [201, tankerClass, 1, 1, false],
];

const R1_W1_WaveDefinition = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [0, smasherClass, 3, 2, true],
    [1, shotgunClass, 1, 2, true],
    [2, slasherClass, 2, 1, true],
    [3, soldierClass, 1, 2, true],
];

const R1_W2_WaveDefinition = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    //[35, slasherClass, 3, 2, true],
    [4, sniperClass, 1, 2, true],
    [5, slasherClass, 2, 1, true],
    [6, soldierClass, 1, 2, true],
    [10, shotgunClass, 2, 2, true],
    [9, sniperClass, 1, 2, true],
    [7, smasherClass, 2, 1, true],
    [8, soldierClass, 1, 2, true],
];

const R1_W3_WaveDefinition = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [8, slasherClass, 3, 2, true],
    [9, sniperSquadClass, 3, 2, true],
    [10, smasherClass, 2, 1, true],
    [11, sniperClass, 1, 2, true],
    [11, shotgunClass, 1, 2, true],
    [13, sacrificerClass, 1, 2, true],
    [12, soldierClass, 2, 1, true],
    [14, sacrificerClass, 1, 2, true],
    [20, hmgSquadClass, 1, 1, true],
    [20, slasherSquadClass, 3, 2, true],
];

const R1_W4_WaveDefinition = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [13, stalkerClass, 3, 2, true],
    [14, sniperClass, 1, 2, true],
    [15, slasherClass, 2, 1, true],
    [16, hmgSquadClass, 3, 1, true],
    [17, sniperClass, 1, 2, true],
    [17, shotgunClass, 1, 2, true],
    [18, soldierSquadClass, 4, 1, true],
    [18, speedySnakeClass, 4, 1, true],
    [19, hmgClass, 2, 1, true],
    [1, RPGClass, 2, 1, true],
];

const R4_W1_WaveDefinition = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [20, hmgSquadClass, 1, 1, true],
    [21, hmgSquadClass, 1, 1, true],
    [22, speedySnakeClass, 10, 2, true],
    [23, slasherClass, 2, 1, true],
    [24, hmgClass, 2, 1, true],
    [26, sniperSquadClass, 3, 2, true],
    [27, soldierSquadClass, 4, 1, true],
    [28, hmgClass, 2, 1, true],
    [0, smasherClass, 3, 2, true],
    [1, shotgunClass, 1, 2, true],
    [14, sacrificerClass, 1, 2, true],
    [2, slasherClass, 2, 1, true],
    [3, soldierClass, 1, 2, true],
    [14, sacrificerClass, 1, 2, true],
    [17, sniperClass, 1, 2, true],
    [17, RPGClass, 1, 2, true],
    [18, soldierSquadClass, 4, 1, true],
    [19, hmgClass, 2, 1, true],
    [1, shotgunClass, 2, 1, true],
];

const R4_Stalker_WaveDefinition = [
    //[spawnerid, classtype, numberToSpawn, spawnDelay, randomizeSpawnerid]
    [20, stalkerClass, 1, 1, true],
    [21, stalkerClass, 1, 1, true],
    [22, stalkerClass, 1, 1, true],
    [23, stalkerClass, 1, 1, true],
];

function CalculateWaveSpawnDuration(waveDefinition: any[]) {
    let unitCount = 0;
    let spawnDelay = 0;

    let spawnerAmountMap = new Map<number, number>();

    waveDefinition.forEach((row) => {
        unitCount = row[2];
        spawnDelay = row[3];
        if (spawnDelay < minimumSpawnSafeSpawnDelay) {
            spawnDelay = minimumSpawnSafeSpawnDelay;
        }

        let key = row[0] as number;
        let rowDuration = (unitCount * spawnDelay) as number;

        if (!spawnerAmountMap.has(key)) {
            spawnerAmountMap.set(key, rowDuration);
        } else {
            let previousDuration = spawnerAmountMap.get(key) as number;
            let newDuration = (previousDuration + rowDuration) as number;
            spawnerAmountMap.set(key, newDuration);
        }
    });

    let longestDuration = 0;

    spawnerAmountMap.forEach((value, key) => {
        if (value > longestDuration) {
            longestDuration = value;
        }
    });

    if (debugSpawning) {
        console.log('Estimated Wave Spawn Duration [', longestDuration, '] seconds');
    }
    return longestDuration;
}
function CalculateSequencialWaveSpawnDuration(waveDefinition: any[]) {
    let estimatedTime = 0;

    waveDefinition.forEach((row) => {
        let unitCount = row[2];
        let spawnDelay = row[3];
        if (spawnDelay < minimumSpawnSafeSpawnDelay) {
            spawnDelay = minimumSpawnSafeSpawnDelay;
        }
        estimatedTime = estimatedTime + unitCount * spawnDelay;
    });

    if (debugSpawning) {
        console.log('Estimated Sequencial Spawn Duration [', estimatedTime, '] seconds');
    }
    return estimatedTime;
}

function CalculateWaveSpawnEnemyCount(waveDefinition: any[]) {
    let totalEnemyCount = 0;

    waveDefinition.forEach((row) => {
        totalEnemyCount = totalEnemyCount + row[2];
    });

    if (debugSpawning) {
        console.log('Estimated Enemy Count For this wave [', totalEnemyCount, ']');
    }
    return totalEnemyCount;
}

async function SpawnEnemyAIOfClass(waveDefinition: any[], sequentialSpawnDelay = 0) {

    //Clone the existing array so we can maintain the original for future use.
    EnemyWaveDefinition.cloneWaveDefinition(waveDefinition);

    let clonedWaveDefinition = EnemyWaveDefinition.currentWaveDefinition;

    //Check each row and randomize the spawner ID if option set to true in Spawn instructions
    EnemyWaveDefinition.randomizeSpawnerID(clonedWaveDefinition);

    //console.log("Besieged clonedWaveDefinition = ", clonedWaveDefinition)

    if (sequentialSpawnDelay > 0) {
        // Spawn each set of spawn instructions sequentially. Spanwers will spawn one after another rather than all going at the same time.

        SequentialSpawnQueue(clonedWaveDefinition, sequentialSpawnDelay);
    } else {
        // Process each set of spawn instructions in parallel. Each individual spawner will process its on queue sequentailly.

        //Check clonedWaveDefinition for which spawners will be used.
        let usedSpawners: any[] = [];

        clonedWaveDefinition.forEach((row) => {
            if (usedSpawners.includes(row[0])) {
            } else {
                usedSpawners.push(row[0]);
            }
        });

        //console.log("Besieged usedSpawners: ", usedSpawners);

        //For each spawner we're using, grab all the relevant rows of spawn instructions and add them to a new array, per spawnerId.
        for (let i = 0; i < usedSpawners.length; i++) {
            let listOfArraysToSpawn: any[] = [];

            clonedWaveDefinition.forEach((row) => {
                if (row[0] == usedSpawners[i]) {
                    //If we match the spawner in the list, we are going to add it to a new array.
                    const spawnerId = row[0];
                    const enemyClass = row[1];
                    const countToSpawn = row[2];
                    const spawnDelay = row[3];
                    listOfArraysToSpawn.push([spawnerId, enemyClass, countToSpawn, spawnDelay]);
                }
            });

            //Send a the new array of spawn instructions for each spawner.
            if (debugSpawning) {
                console.log('Besieged Firing off SpawnInstructionQueue for spawner:', usedSpawners[i], ' ', listOfArraysToSpawn);
            }
            SpawnInstructionsQueue(listOfArraysToSpawn);
        }
    }
}

// Process each spawn instruction sequentially in the order specified by the wave definition, with a set delay between each spawner.
async function SequentialSpawnQueue(waveDefinition: any[], sequentialSpawnDelay: number) {
    for (let i = 0; i < waveDefinition.length; i++) {
        let spawnerId = waveDefinition[i][0];
        let enemyClass = waveDefinition[i][1];
        let countToSpawn = waveDefinition[i][2];
        let spawnDelay = waveDefinition[i][3];

        await SpawnEnemyAI(spawnerId, enemyClass, countToSpawn, spawnDelay);
        if (debugSpawning) {
            console.log('Besieged SequentialSpawnQueue spawned @ Time: ', mod.GetMatchTimeElapsed());
        }
        await mod.Wait(sequentialSpawnDelay);
    }
}

// Here we take all the current spawn instructions for a given spawner, and pass them in sequentally.
// In most cases this should prevent Spawners from trying to spawn multiple AI at the same time.
// (In those cases only a single AI will survive the process and the round logic will break).
async function SpawnInstructionsQueue(listOfArraysToSpawn: any[]) {
    for (let i = 0; i < listOfArraysToSpawn.length; i++) {
        let spawnerId = listOfArraysToSpawn[i][0];
        let enemyClass = listOfArraysToSpawn[i][1];
        let countToSpawn = listOfArraysToSpawn[i][2];
        let spawnDelay = listOfArraysToSpawn[i][3];

        await SpawnEnemyAI(spawnerId, enemyClass, countToSpawn, spawnDelay);
        await mod.Wait(minimumSpawnSafeSpawnDelay);
        if (debugSpawning) {
            console.log('Besieged SpawnInstructionQueue spawned at [', spawnerId, '] @ Time: ', mod.GetMatchTimeElapsed());
        }
    }
}

// Spawn a set of enemies, with a delay between each.
async function SpawnEnemyAI(spawnerId: SpawnerId, enemyClass: any, countToSpawn: number, spawnDelay: number) {
    if (countToSpawn > 0) {
        //enemiesRemaining += countToSpawn;

        while (countToSpawn > 0 && !gameOver) {
            if (debugSpawning) {
                console.log(mod.GetMatchTimeElapsed(), ' Attempting to spawn an AI from Spawner[', spawnerId, '] Total Spawn Attemps: ',  totalAiSpawnAttempts);
            }

            while (currentLivingAI >= maxConcurrentAI){
                await mod.Wait(0.5)
            }

            //Temporarily removing AI names to fix Linux server issue. 
            totalAiSpawnAttempts++
            //mod.AISetUnspawnOnDead(mod.GetSpawner(spawnerId), false)
            mod.SpawnAIFromAISpawner(mod.GetSpawner(spawnerId), enemyClass.baseClass, modMessageDebug(enemyClass.className));
            // mod.SetUnspawnDelayInSeconds(mod.GetSpawner(spawnerId), 3)
            enemiesSpawnedThisRound++;
            totalEnemiesSpawned++;


            if (debugSpawning) {
                console.log(mod.GetMatchTimeElapsed(), ' Besieged Spawning AI from Spawner[', spawnerId, '] Count to spawn [', countToSpawn, ']');
            }

            //enemiesRemaining++;
            countToSpawn--;
            UpdateUI();

            if (spawnDelay <= minimumSpawnSafeSpawnDelay && countToSpawn > 0) {
                spawnDelay = minimumSpawnSafeSpawnDelay;
                await mod.Wait(spawnDelay);
            } else if (countToSpawn > 0) {
                await mod.Wait(spawnDelay);
            }
        }

        //console.log("Besieged Spawner Exhausted: ", spawnerId, " Time: ", mod.GetMatchTimeElapsed())
    }
}

//-----------------------------------------------------------------------------------------------//
// Enemy AI Setup Functions:
//-----------------------------------------------------------------------------------------------//
export function OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner) {
    //console.log("Besieged SpawnerId[", mod.GetObjId(spawner),"]", " just spawned Player ID[", mod.GetObjId(player), "]");
    //console.log("Besieged AI from SpawnerId:", jsEnemy.spawnerId, " Time: ", mod.GetMatchTimeElapsed());

    currentLivingAI++;
    totalAiSpawned++
    if (currentLivingAI > maxLivingAI){
        maxLivingAI = currentLivingAI;
    }

    if (debugAIBehavior || debugSpawning) {
        console.log(mod.GetMatchTimeElapsed(), ' AI Spawned Player: ', mod.GetObjId(player), ' from Spawner: ', mod.GetObjId(spawner), ' currentLivingAI: ', currentLivingAI, ' MaxConcurrentAI: ', maxLivingAI, ' Total AI Spawned: ', totalAiSpawned,);
    }
    let jsEnemy = JSEnemy.get(player, 6);
    jsEnemy.spawnerId = mod.GetObjId(spawner);
}

function SetAiLoadout(player: mod.Player, enemyType: any) {
    if (debugAIBehavior) {
        console.log('SetAILoadout Running on Player [', mod.GetObjId(player), ']');
    }

    mod.RemoveEquipment(player, mod.InventorySlots.ClassGadget)
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetOne)
    mod.RemoveEquipment(player, mod.InventorySlots.GadgetTwo)
    //mod.RemoveEquipment(player, mod.InventorySlots.MiscGadget)
    mod.RemoveEquipment(player, mod.InventorySlots.MeleeWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.PrimaryWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.SecondaryWeapon)
    mod.RemoveEquipment(player, mod.InventorySlots.Throwable)

    AISetup(player, enemyType);
}

// Enemy AI Setup

function AISetup(player: mod.Player, enemyClass: any) {
    if (debugAIBehavior) {
        console.log('AISetup Running on Player [', mod.GetObjId(player), ']');
    }
    let jsEnemy = JSEnemy.get(player, 7);
    jsEnemy.enemyClass = enemyClass;

    if (enemyClass.maxHealth > 0) {
        let newMaxHealth = (enemyClass.maxHealth + enemyFixedHealthIncreasePerRound[currentRound]) * enemyHealthModifierPerRound[currentRound];
        if (newMaxHealth > 0) {
            mod.SetPlayerMaxHealth(player, newMaxHealth);
        }
    } else {
        // A fallback just incase we pass in a bad multiplier.
        mod.SetPlayerMaxHealth(player, enemyClass.maxHealth);
    }


    if (enemyClass.primaryWeapon != null) {
        if (debugAIBehavior) {console.log('Equipping Primary on Player [', mod.GetObjId(player), ']');}
        mod.AddEquipment(player,enemyClass.primaryWeapon, enemyClass.weaponPackagePrimary, mod.InventorySlots.PrimaryWeapon)

    }
    if (enemyClass.secondaryWeapon != null) {
        if (debugAIBehavior) {console.log('Equipping Secondary on Player [', mod.GetObjId(player), ']');}
        mod.AddEquipment(player,enemyClass.secondaryWeapon,mod.InventorySlots.SecondaryWeapon)

    }
    if (enemyClass.meleeWeapon != null) {
        if (debugAIBehavior) {console.log('Equipping Melee on Player [', mod.GetObjId(player), ']');}
        mod.AddEquipment(player,enemyClass.meleeWeapon,mod.InventorySlots.MeleeWeapon)
    }

    if (enemyClass.openGadet != null) {
        if (debugAIBehavior) {console.log('Besieged Giving Gadget to Player [', mod.GetObjId(player), '] ', enemyClass.openGadet);}
        mod.AddEquipment(player,enemyClass.openGadet,mod.InventorySlots.GadgetOne)
    }

    if (enemyClass.throwable != null) {
        if (debugAIBehavior) {console.log('Equipping Throwable on Player [', mod.GetObjId(player), ']');}
        mod.AddEquipment(player,enemyClass.throwable,mod.InventorySlots.Throwable); 
        
    }

    if (enemyClass.aiBehavior != null) {
        if (debugAIBehavior) {console.log('Equipping Behavior on Player [', mod.GetObjId(player), ']');}
        enemyClass.runAIBehavior(player, enemyClass.aiBehavior);
    }
}

//-----------------------------------------------------------------------------------------------//
// Enemy AI Behavior Functions:
//-----------------------------------------------------------------------------------------------//

async function getRandomValidJSPlayer() {
    let validPlayer = null;
    while (validPlayer == null && !gameOver) {
        validPlayer = JsPlayer.getValidJsPlayer();
        if (validPlayer == null) {
            await mod.Wait(1);
        }
    }

    return validPlayer as mod.Player;

    //console.log("Besieged Get Random Valid JS Player returning: ", validPlayer, " ", mod.GetObjId(validPlayer))
}

async function slasherClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Slasher Behavior Running on Player [', mod.GetObjId(player), ']');
    }

    mod.ForceSwitchInventory(player, mod.InventorySlots.MeleeWeapon)

    let tempTarget: any;

    if (target == null) {
        target = await getRandomValidJSPlayer();
    }

    AIFollowPlayer(player, target, 1, 0, 0, sprintSpeed, standStance, 0).then();
}

async function stalkerClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Stalker Behavior Running on Player [', mod.GetObjId(player), ']');
    }

    let tempTarget: any;

    if (target == null) {
        target = await getRandomValidJSPlayer();
    }

    AIFollowPlayer(player, target, 1, 0, 0, walkSpeed, standStance, 0).then();
}

async function slasherSquadClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Slasher Squad Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    let mySquadLeader = joinOrCreateSquad(player);

    if (mySquadLeader == null) {
        // You're the leader so do what you want:
        if (target == null) {
            target = await getRandomValidJSPlayer();
        }
        slasherClassBehavior(player, target);
    } else {
        // You're a squad member so follow your leader:
        AIFollowPlayer(player, mySquadLeader, 1, 5, 0, sprintSpeed, crouchStance);
    }
}

async function speedySnakeClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Speedy Snake Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    if (target == null) {
        target = await getRandomValidJSPlayer();
    }

    mod.AIMoveToBehavior(player, mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition));

    while (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true && !gameOver) {
        mod.AIMoveToBehavior(player, mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition));
        mod.AISetStance(player, proneStance);
        mod.AISetMoveSpeed(player, sprintSpeed);
        mod.SetPlayerMovementSpeedMultiplier(player, 10);

        await mod.Wait(1);

        if (mod.GetSoldierState(target, mod.SoldierStateBool.IsAlive) == false) {
            target = await getRandomValidJSPlayer();
        }
    }
}

async function sneakySnakeClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Sneaky Snake Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    if (target == null) {
        target = await getRandomValidJSPlayer();
    }

    mod.AIMoveToBehavior(player, mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition));

    while (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true && !gameOver) {
        mod.AIMoveToBehavior(player, mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition));
        mod.AISetStance(player, proneStance);
        mod.AISetMoveSpeed(player, sprintSpeed);
        await mod.Wait(1);

        if (mod.GetSoldierState(target, mod.SoldierStateBool.IsAlive) == false) {
            target = await getRandomValidJSPlayer();
        }
    }
}

async function sniperClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Sniper Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    AIFollowPlayer(player, target, 2, 25, 10, walkSpeed, crouchStance, 25).then();
}

async function sniperSquadClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Sniper Squad Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    let mySquadLeader = joinOrCreateSquad(player);

    if (mySquadLeader == null) {
        // You're the leader so do what you want:
        if (target == null) {
            target = await getRandomValidJSPlayer();
        }
        await sniperClassBehavior(player, target);
    } else {
        // You're a squad member so follow your leader:
        AIFollowPlayer(player, mySquadLeader, 2, 5, 0, runSpeed, crouchStance).then();
    }
}

async function soldierClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Soldier Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    AIFollowPlayer(player, target, 2, 20, 10, runSpeed, standStance).then();
}

async function shotgunClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Shotgun Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    AIFollowPlayer(player, target, 2, 10, 0, walkSpeed, standStance, 10).then();
}

async function shotgunSquadClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Shotgun Squad Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    let mySquadLeader = joinOrCreateSquad(player);

    if (mySquadLeader == null) {
        // You're the leader so do what you want:
        if (target == null) {
            target = await getRandomValidJSPlayer();
        }
        shotgunClassBehavior(player, target);
    } else {
        // You're a squad member so follow your leader:
        AIFollowPlayer(player, mySquadLeader, 2, 2, 0, walkSpeed, standStance);
    }
}

async function hmgClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: HMG Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    AIFollowPlayer(player, target, 2, 5, 0, iWalkSpeed, standStance).then();
}

let tankDriverPlayer: mod.Player;

async function superHeavyClassBehavior(player: mod.Player, vehicle: mod.Vehicle) {
    if (debugAIBehavior) {
        console.log('Besieged: Super Heavy Behavior Running on Player [', mod.GetObjId(player), ']');
    }

    tankDriverPlayer = player;
    mod.SetVehicleSpawnerVehicleType(mod.GetVehicleSpawner(200), mod.VehicleList.Abrams);
    mod.SetVehicleSpawnerRespawnTime(mod.GetVehicleSpawner(200), 5);
    mod.ForceVehicleSpawnerSpawn(mod.GetVehicleSpawner(200));
}

export async function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
    console.log('Tank Spawned for AI');
    mod.ForcePlayerToSeat(tankDriverPlayer, eventVehicle, -1);
}

async function rpgClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: RPG Behavior Running on Player [', mod.GetObjId(player), ']');
    }

    let jsEnemy = JSEnemy.get(player, 8);

    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    jsEnemy.currentTarget = target;
    AIFollowPlayer(player, target, 2, 20, 10, iWalkSpeed, standStance).then();

    mod.AIGadgetSettings(player, false, false, false);

    while (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true && !gameOver) {
        mod.SetInventoryAmmo(player, mod.InventorySlots.GadgetOne, 10);
        mod.AIStartUsingGadget(player, mod.Gadgets.Launcher_Unguided_Rocket, jsEnemy.currentTarget as mod.Player);
        await mod.Wait(1);
    }
}

async function sacrificerClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Sacrificer Behavior Running on Player [', mod.GetObjId(player), ']');
    }

    let detonationDistance = 3;

    mod.AIEnableTargeting(player, false);
    mod.AIEnableShooting(player, false);

    let applyUsageCriteria = false;
    let applyCoolDownAfterUse = false;
    let applyInaccuracy = false;

    mod.AIGadgetSettings(player, applyUsageCriteria, applyCoolDownAfterUse, applyInaccuracy);
    //mod.AIForceEquip(player, mod.InventorySlots.GadgetOne);
    mod.ForceSwitchInventory(player, mod.InventorySlots.GadgetOne)

    let jsEnemy = JSEnemy.get(player, 9);

    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    jsEnemy.currentTarget = target as mod.Player;

    let targetPosition = mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition);
    let destinationPosition = targetPosition;

    mod.AIMoveToBehavior(player, destinationPosition);

    await mod.Wait(1);

    mod.AISetMoveSpeed(player, sprintSpeed); // sprint
    mod.AISetStance(player, standStance); // stand

    while (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true && !gameOver) {
        if (mod.GetSoldierState(target, mod.SoldierStateBool.IsAlive) == false) {
            //console.log("Sacrificer Target Not Alive. Waiting for new target.")
            target = await getRandomValidJSPlayer();
            jsEnemy.currentTarget = target;
        }

        targetPosition = mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition);

        if (mod.DistanceBetween(targetPosition, destinationPosition) > detonationDistance) {
            destinationPosition = targetPosition;
            //console.log("Sacrificer Updating destination position");
        }

        let currentPosition = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
        let currentDistanceToTarget = mod.DistanceBetween(targetPosition, currentPosition);
        //console.log("Sacrificer Current Distance To Target: ", currentDistanceToTarget);

        if (currentDistanceToTarget < detonationDistance) {
            //console.log("Besieged Sacrifice Target In Range")

            let firingTarget = interpolateVectors(currentPosition, targetPosition, 0.25);

            mod.AIStartUsingGadget(player, mod.Gadgets.Launcher_Unguided_Rocket, firingTarget);

            await mod.Wait(0.75);
            const inputduration = 0.1; //getRandomFloatInRange(0.1,2);
            mod.AIForceFire(player, inputduration);

            //console.log("Besieged Using Rocket Launcher")

            await mod.Wait(5);
        } else {
            mod.AIMoveToBehavior(player, destinationPosition);
            await mod.Wait(0.25);
        }
    }
}

async function paratrooperClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Paratrooper Behavior Running on Player [', mod.GetObjId(player), ']');
    }

    let i = 5;
    while (i > 0) {
        mod.AIParachuteBehavior(player);
        await mod.Wait(1);
        i--;
    }

    if (target == null) {
        target = await getRandomValidJSPlayer();
    }
    AIFollowPlayer(player, target, 2, 20, 10, runSpeed, standStance).then();
}

async function soldierSquadClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: Soldier Squad Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    let mySquadLeader = joinOrCreateSquad(player);

    if (mySquadLeader === null) {
        // You're the leader so do what you want:
        if (target == null) {
            target = await getRandomValidJSPlayer();
        }
        soldierClassBehavior(player, target);
    } else {
        // You're a squad member so follow your leader:
        AIFollowPlayer(player, mySquadLeader, 2, 5, 0, runSpeed, standStance);
    }
}

async function hmgSquadClassBehavior(player: mod.Player, target: mod.Player) {
    if (debugAIBehavior) {
        console.log('Besieged: HMG Squad Behavior Running on Player [', mod.GetObjId(player), ']');
    }
    let mySquadLeader = joinOrCreateSquad(player);

    if (mySquadLeader === null) {
        // You're the leader so do what you want:
        if (target == null) {
            target = await getRandomValidJSPlayer();
        }
        hmgClassBehavior(player, target);
    } else {
        // You're a squad member so follow your leader:
        AIFollowPlayer(player, mySquadLeader, 2, 5, 0, runSpeed, standStance);
    }
}

function interpolateVectors(vec1: mod.Vector, vec2: mod.Vector, t: number) {
    //if (vec1.length !== vec2.length) {
    //throw new Error('Vectors must be of the same dimension');
    //}

    //if (t < 0 || t > 1) {
    //throw new Error('Interpolation factor t must be in the range [0, 1]');
    //}

    let vec1X = mod.XComponentOf(vec1);
    let vec1Y = mod.YComponentOf(vec1);
    let vec1Z = mod.ZComponentOf(vec1);

    let vec2X = mod.XComponentOf(vec2);
    let vec2Y = mod.YComponentOf(vec2);
    let vec2Z = mod.ZComponentOf(vec2);

    var nx = vec1X + (vec2X - vec1X) * t;
    var ny = vec1Y + (vec2Y - vec1Y) * t;
    var nz = vec1Z + (vec2Z - vec1Z) * t;

    let finalVector = mod.CreateVector(nx, ny, nz);
    return finalVector;
}

export function OnRayCastHit(player: mod.Player, point: any, normal: any) {
    //on raycast hit means hit a wall
    let jsEnemy = JSEnemy.get(player, 10);
    jsEnemy.lineOfSight = false;
}

export function OnRayCastMissed(player: mod.Player) {
    //on raycast missed means reached the player
    let jsEnemy = JSEnemy.get(player, 11);
    jsEnemy.lineOfSight = true;
}

function AIBehaviorWanderAroundPoint(player: mod.Player, targetPoint: any) {}

async function AIFollowPlayer(
    player: mod.Player,
    target: mod.Player,
    updateDelay = 1,
    maxDistance = 10,
    minDistance = 0,
    moveSpeed = 4,
    stance = 0,
    sprintDistance = 100,
    avoidRunningPastTarget = true

    
)

{
    let initialFollowDelay = mod.GetObjId(player) % 30 * (1/30);
    console.log("Awaiting follow for ", initialFollowDelay);
    await mod.Wait(initialFollowDelay); // Initial start up delay. 


    if (minDistance > maxDistance || updateDelay == 0 || player === null || target === null) {
        console.log('Besieged AIFollowPlayer Parameters Invalid');
    } else {
        let continueFollowing = true;

        let JsEnemy = JSEnemy.get(player, 12);
        let jsTarget: JSEnemy | JsPlayer | undefined;

        if (mod.GetSoldierState(target, mod.SoldierStateBool.IsAISoldier) == false) {
            if (debugAIBehavior) {
                console.log('Player [', mod.GetObjId(player), "] is setting it's target as Player (not AI) [", mod.GetObjId(target), '] In AIFollowTarget ');
            }
            jsTarget = JsPlayer.get(target, 20);
        } else {
            jsTarget = JSEnemy.get(target, 13);
        }

        if (!jsTarget) return;

        sprintDistance += maxDistance;

        while (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) == true && !gameOver && continueFollowing) {
            if (target == null) {
                if (debugAIBehavior) {
                    console.log('AI follow player target null for AI [', player, ']');
                }
                target = await getRandomValidJSPlayer();
            }

            if (JsEnemy.target != null) {
                target = JsEnemy.target;
            }

            //console.log("This AI is following a player");
            let targetPosition = mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition);
            //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer target is [", mod.GetObjId(target), "] at [", targetPosition, "]");

            let currentPosition = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            let currentDistanceToTarget = mod.DistanceBetween(targetPosition, currentPosition);
            //console.log("Besieged AIfollowPlayer Distance To Target: ", currentDistanceToTarget);

            // if (currentDistanceToTarget >= sprintDistance || sprintDistance > maxDistance) {

            // }
            // else {

            // }

            if (maxDistance <= 0) {
                // max distance is zero so don't bother randomizing target location. Also, a max distance of 0 will hang the game if we don't catch it here.
                //console.log("Besieged AIFollowPlayer Max Distance 0");
                //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer 1 target is [", mod.GetObjId(target), "] at [", mod.XComponentOf(targetPosition),",", mod.YComponentOf(targetPosition), ",",mod.ZComponentOf(targetPosition), "]");
                mod.AIMoveToBehavior(player, targetPosition);

                if (currentDistanceToTarget >= sprintDistance && sprintDistance > maxDistance) {
                    mod.AISetMoveSpeed(player, 4); // sprint
                    mod.AISetStance(player, 0); // stand
                } else {
                    mod.AISetMoveSpeed(player, moveSpeed);
                    mod.AISetStance(player, stance);
                }
            } else if (currentDistanceToTarget <= maxDistance && currentDistanceToTarget > minDistance) {
                // we are within the specified min-max range of the target
                // eventually we want a LOS check here so AI isn't just hiding away from combat.
                //console.log("Besieged AI [", mod.GetObjId(player), "]  Within acceptable range of target ");

                let currentEyePosition = mod.GetSoldierState(player, mod.SoldierStateVector.EyePosition);
                let targetEyePosition = mod.GetSoldierState(target, mod.SoldierStateVector.EyePosition);
                mod.RayCast(player, currentEyePosition, targetEyePosition);

                let JsEnemy = JSEnemy.get(player, 14);
                if (!JsEnemy.lineOfSight) {
                    let proposedNewPosition = GetRandomPositionFromPoint(targetPosition, maxDistance);
                    let proposedDistanceToTarget = mod.DistanceBetween(proposedNewPosition, currentPosition);
                    if (proposedDistanceToTarget > 50) {
                        //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer 2 target is [", mod.GetObjId(target), "] at [", mod.XComponentOf(proposedNewPosition),",", mod.YComponentOf(proposedNewPosition), ",",mod.ZComponentOf(proposedNewPosition), "]");
                        mod.AIMoveToBehavior(player, proposedNewPosition);
                    } else {
                        //console.log("Besieged AI [", mod.GetObjId(player), "] No line of sight, move to LOS position ");
                        //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer 3 target is [", mod.GetObjId(target), "] at [", mod.XComponentOf(proposedNewPosition),",", mod.YComponentOf(proposedNewPosition), ",",mod.ZComponentOf(proposedNewPosition), "]");
                        mod.AILOSMoveToBehavior(player, proposedNewPosition);
                    }

                    mod.AISetMoveSpeed(player, moveSpeed);
                    mod.AISetStance(player, stance);
                }
            } else if (currentDistanceToTarget > maxDistance) {
                //console.log("Besieged AI Too Far From Target ");
                // we are too far away from the target and need to move closer to them, but ideally without running by them.
                let proposedNewPosition = GetRandomPositionFromPoint(targetPosition, maxDistance);
                let proposedDistanceToTarget = mod.DistanceBetween(proposedNewPosition, currentPosition);

                if ((proposedDistanceToTarget < currentDistanceToTarget && proposedDistanceToTarget >= minDistance) || avoidRunningPastTarget == false) {
                    //mod.AIValidatedMoveToBehavior(player, proposedNewPosition);

                    if (currentDistanceToTarget >= sprintDistance && sprintDistance > maxDistance) {
                        //console.log("Besieged AI Too Far From Target: IF ");
                        if (mod.XComponentOf(targetPosition) == 0 && mod.YComponentOf(targetPosition) == 0 && mod.ZComponentOf(targetPosition) == 0) {
                            console.log(
                                'Besieged AI [',
                                mod.GetObjId(player),
                                '] AIfollowPlayer State 4 target is [',
                                mod.GetObjId(target),
                                '] at [',
                                mod.XComponentOf(targetPosition),
                                ',',
                                mod.YComponentOf(targetPosition),
                                ',',
                                mod.ZComponentOf(targetPosition),
                                '] Something Went Wrong. Attempting to find new Target.'
                            );

                            target = await getRandomValidJSPlayer();
                            targetPosition = mod.GetSoldierState(target, mod.SoldierStateVector.GetPosition);
                        }
                        mod.AIMoveToBehavior(player, targetPosition); // Run directly to player position, don't worry about randomizing / validating
                        mod.AISetMoveSpeed(player, sprintSpeed); // sprint
                        mod.AISetStance(player, standStance); // stand
                    } else {
                        //console.log("Besieged AI Too Far From Target: ELSE ");

                        // let initialX = mod.XComponentOf(proposedNewPosition);
                        // let initialY = mod.YComponentOf(proposedNewPosition);
                        // let initialZ = mod.ZComponentOf(proposedNewPosition);

                        //console.log("Besieged Proposed New Position [", initialX, "] [", initialY, "] [", initialZ, "]");

                        if (proposedDistanceToTarget > 50) {
                            //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer 5 target is [", mod.GetObjId(target), "] at [", mod.XComponentOf(proposedNewPosition),",", mod.YComponentOf(proposedNewPosition), ",",mod.ZComponentOf(proposedNewPosition), "]");
                            mod.AIMoveToBehavior(player, proposedNewPosition);
                        } else {
                            mod.AIValidatedMoveToBehavior(player, proposedNewPosition);
                        }

                        mod.AISetMoveSpeed(player, moveSpeed);
                        mod.AISetStance(player, stance);
                    }
                }
            } else if (currentDistanceToTarget < minDistance) {
                //console.log("Besieged AI [", mod.GetObjId(player), "] a  Too Close To Target ");
                // we are too close to the target and need to move away from them (if ai is farther away from proposed destination than target is, we're bad.)
                let proposedNewPosition = GetRandomPositionFromPoint(targetPosition, maxDistance);
                let proposedDistanceToTarget = mod.DistanceBetween(proposedNewPosition, currentPosition);
                let targetsDistanceToNewPosition = mod.DistanceBetween(proposedNewPosition, targetPosition);
                if ((proposedDistanceToTarget < targetsDistanceToNewPosition && proposedDistanceToTarget >= minDistance) || avoidRunningPastTarget == false) {
                    if (proposedDistanceToTarget > 50) {
                        //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer 6 target is [", mod.GetObjId(target), "] at [", mod.XComponentOf(proposedNewPosition),",", mod.YComponentOf(proposedNewPosition), ",",mod.ZComponentOf(proposedNewPosition), "]");
                        mod.AIMoveToBehavior(player, proposedNewPosition);
                    } else {
                        //console.log("Besieged AI [", mod.GetObjId(player), "] AIfollowPlayer 7 target is [", mod.GetObjId(target), "] at [", mod.XComponentOf(proposedNewPosition),",", mod.YComponentOf(proposedNewPosition), ",",mod.ZComponentOf(proposedNewPosition), "]");
                        mod.AIValidatedMoveToBehavior(player, proposedNewPosition);
                    }

                    mod.AISetMoveSpeed(player, moveSpeed);
                    mod.AISetStance(player, stance);
                }
            } else {
                //console.log("Besieged Distance From Target: ", currentDistanceToTarget);
            }

            if (mod.GetSoldierState(target, mod.SoldierStateBool.IsAlive) == false || jsTarget.isPrisoner == true) {
                if (JsEnemy.priorityTarget) {
                    // The squad leader I was following just got killed. I'm going to recklessly throw myself at whoever did it.

                    target = JsEnemy.priorityTarget as mod.Player;
                    const enemyClass = JsEnemy.enemyClass;

                    if (enemyClass.squadFallbackBehavior != null) {
                        enemyClass.runAIBehavior(player, enemyClass.squadFallbackBehavior, target);
                        continueFollowing = false; // stop this loop so the new behavior can take over.
                    } else {
                        // In case we don't have a fallback behavior
                        moveSpeed = sprintSpeed;
                        stance = 0;
                        maxDistance = 0;
                    }

                    //console.log("Besieged AI [", mod.GetObjId(player), "] attacking priority target [", mod.GetObjId(JsEnemy.priorityTarget), "]")
                } else {
                    //console.log("Besieged AI [", mod.GetObjId(player), "] Looking for new target");
                    if (!gameOver) {
                        target = await getRandomValidJSPlayer();
                        const jsPlayer = JsPlayer.get(target, 21);
                        JsEnemy.currentTarget = target;
                    }

                    //console.log("Besieged AI [", mod.GetObjId(player), "] following new target [", mod.GetObjId(target), "]")
                }
            }

            await mod.Wait(updateDelay); // Wait before re-running the loop.
        }
    }
    if (debugAIBehavior) {
        console.log('Besieged AI Following Target Terminated');
    }
}

async function OnValidatedMoveToFailed(player: mod.Player) {
    console.log('Besieged Validated Move To Failed');
}

async function OnValidatedMoveToSucceeded(player: mod.Player) {
    console.log('Besieged Validated Move To Succeeded');
}

function joinOrCreateSquad(player: mod.Player) {
    let thisAI = JSEnemy.get(player, 15);
    let haveSquadLeader = false;
    let squadLeader;

    // Check to see if there are any leaders that came out of my spawn point.
    let players = mod.AllPlayers();
    let n = mod.CountOf(players);
    for (let i = 0; i < n; i++) {
        let aiSoldier = mod.ValueInArray(players, i) as mod.Player;
        if (mod.GetSoldierState(aiSoldier, mod.SoldierStateBool.IsAISoldier) == true && haveSquadLeader == false) {
            let jsEnemyAiSoldier = JSEnemy.get(aiSoldier, 16);
            if (
                jsEnemyAiSoldier.squadLeader == true &&
                jsEnemyAiSoldier.spawnerId == thisAI.spawnerId &&
                mod.GetSoldierState(aiSoldier, mod.SoldierStateBool.IsAlive) == true &&
                mod.GetObjId(aiSoldier) > -1
            ) {
                if (debugAIBehavior) {
                    console.log('Besieged AI [', mod.GetObjId(player), '] has has reported to Squad Leader [', mod.GetObjId(aiSoldier), ']');
                }
                squadLeader = jsEnemyAiSoldier.player;
                haveSquadLeader = true;
            }
        }
    }

    if (haveSquadLeader == false) {
        thisAI.squadLeader = true;
        if (debugAIBehavior) {
            console.log('Besieged AI [', mod.GetObjId(player), '] has been promoted to Squad Leader of spawner [', thisAI.spawnerId, ']');
        }
        return null;
    } else {
        thisAI.squadMember = true;
        thisAI.mySquadLeader = squadLeader;
        if (debugAIBehavior) {
            console.log('Besieged AI [', mod.GetObjId(player), '] is returning Squad Leader [', mod.GetObjId(squadLeader as mod.Player), ']');
        }
        return squadLeader as mod.Player;
    }
}

async function OnMoveToSucceeded(player: mod.Player) {
    //console.log("Besieged Move To Succeeded");

    let jsEnemy = JSEnemy.get(player, 17);
    jsEnemy.moveToSucceeded = true;
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// UI Stuff
//-----------------------------------------------------------------------------------------------//

function CreateUI() {
    // mod.AddUIText("gameround", mod.CreateVector(50, 50, 0), mod.CreateVector(400, 40, 0), mod.UIAnchor.TopLeft, modMessageDebug("Round {}", currentRound));
    // gameroundWidget = mod.FindUIWidgetWithName("gameround");

    mod.AddUIText(
        'enemiesremaining',
        mod.CreateVector(50, 150, 0),
        mod.CreateVector(400, 40, 0),
        mod.UIAnchor.TopLeft,
        modMessageDebug('Enemies Remaining: {}', enemiesRemaining)
    );
    enemiesremainingWidget = mod.FindUIWidgetWithName('enemiesremaining') as mod.UIWidget;

    mod.AddUIText(
        'teamrespawns',
        mod.CreateVector(50, 100, 0),
        mod.CreateVector(400, 40, 0),
        mod.UIAnchor.TopLeft,
        modMessageDebug('Team Redeploys Remaining: {}', teamRespawns)
    );
    teamRedeployWidget = mod.FindUIWidgetWithName('teamrespawns') as mod.UIWidget;

    if (debugSpawning) {
    mod.AddUIText(
        'currentenemiesremaining',
        mod.CreateVector(50, 200, 0),
        mod.CreateVector(400, 40, 0),
        mod.UIAnchor.TopLeft,
        modMessageDebug('Current AI: {}', currentLivingAI)
    );
    currentenemiesremainingWidget = mod.FindUIWidgetWithName('currentenemiesremaining') as mod.UIWidget;
    }

    isUiCreated = true;
}

function CreateRoundHeaderUI() {
    mod.AddUIText(
        'combatStartCountdown',
        mod.CreateVector(0, 75, 0),
        mod.CreateVector(1000, 125, 0),
        mod.UIAnchor.TopCenter,
        modMessageDebug('{} Enemies Inbound!', globalGameTime)
    );
    combatStartCountdownWidget = mod.FindUIWidgetWithName('combatStartCountdown') as mod.UIWidget;
    mod.SetUITextSize(combatStartCountdownWidget, 72);
    mod.SetUITextAnchor(combatStartCountdownWidget, mod.UIAnchor.Center);
    mod.SetUIWidgetVisible(combatStartCountdownWidget, false);
}

function UpdateUI() {
    if (isUiCreated && !gameOver) {
        // mod.SetUITextLabel(gameroundWidget, modMessageDebug("Round {}", currentRound));
        mod.SetUITextLabel(enemiesremainingWidget, modMessageDebug('Enemies Remaining: {}', enemiesRemaining));
        mod.SetUITextLabel(teamRedeployWidget, modMessageDebug('Team Redeploys Remaining: {}', teamRespawns));
        if (debugSpawning) {mod.SetUITextLabel(currentenemiesremainingWidget, modMessageDebug('Current AI: {}', currentLivingAI));}

        JsPlayer.playerInstances.forEach((player) => {
            let jsPlayer = JsPlayer.get(player, 17);
            if (!jsPlayer) return;
            jsPlayer.updateWalletUI();
            jsPlayer.updateHealthUI();
        });

        // let players = mod.AllPlayers()
        // let n = mod.CountOf(players)
        // for (let i = 0; i < n; i++) {
        //     let player = mod.ValueInArray(players, i)
        //     if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier) == false) {
        //         let jsPlayer = JsPlayer.get(player)
        //         jsPlayer.updateWalletUI();
        //         //console.log("Besieged is store visible? ", jsPlayer.store.isOpen());
        //     }
        // }
    }
    if (gameOver) {
        // mod.SetUIWidgetVisible(gameroundWidget, false);
        mod.SetUIWidgetVisible(enemiesremainingWidget, false);
        mod.SetUIWidgetVisible(teamRedeployWidget, false);
        mod.SetUIWidgetVisible(combatStartCountdownWidget, false);
        if (debugSpawning) {mod.SetUIWidgetVisible(currentenemiesremainingWidget, false);}
    }
}



async function UnspawnAIPlayers(){
    console.log("UnspawningAIPlayers")

    randomizedGruntWaypointPairs.forEach(spawnerId => {
        mod.UnspawnAllAIsFromAISpawner(mod.GetSpawner(spawnerId))
        console.log("Unspawning All AI From AI Spawner: ", spawnerId)
    });

}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Helper Functions:
//-----------------------------------------------------------------------------------------------//

function Precise(x: number) {
    x = Math.trunc(x);
    return x;
}

function PickRandomSpawnerWaypointPair(toBeRandomized: any[]) {
    let i = getRandomInt(gruntWaypointPairs.length);

    //console.log("Besieged Random GSID ", i, " Array Element ", gruntWaypointPairs[i], " Length ", gruntWaypointPairs.length)

    toBeRandomized.push(gruntWaypointPairs[i]);

    gruntWaypointPairs.splice(i, 1);
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function getRandomFloatInRange(max: number, min: number) {
    return Math.random() * (max - min) + min;
}

function GetRandom(min: number, max: number) {
    const floatRandom = Math.random();
    const difference = max - min;
    const randomDifference = floatRandom * difference;
    const randomRange = randomDifference + min;
    return randomRange;
}

function deepCopyArray(inputArray: any[]) {
    let copy: any[] = [];
    for (let i = 0; i < inputArray.length; i++) {
        if (inputArray[i] instanceof Array) {
            //console.log("Besieged deepCopyArray trying to array copy at i ", i);
            copy[i] = deepCopyArray(inputArray[i]);
        } else if (typeof inputArray[i] == 'object' && inputArray[i] !== null) {
            //copy[i] = deepCopyObject(inputArray[i]);
            //console.log("Besieged deepCopyArray trying to deepcopy at i ", i);
            copy[i] = deepCopy(inputArray[i]);
        } else {
            //console.log("Besieged deepCopyArray trying to direct copy at i ", i);
            copy[i] = inputArray[i];
        }
    }
    return copy;
}

function deepCopyObject(inputObject: { [key: string]: any }) {
    let copy: { [key: string]: any } = {};
    for (let i in inputObject) {
        if (inputObject[i] instanceof Array) {
            copy[i] = deepCopyArray(inputObject[i]);
        } else if (typeof inputObject[i] == 'object' && inputObject[i] !== null) {
            copy[i] = deepCopyObject(inputObject[i]);
            //copy[i] = deepCopy(inputObject[i]);
        } else {
            copy[i] = inputObject[i];
        }
    }
    return copy;
}

function deepCopy(obj: any) {
    let copy: any;

    // Check if it's a class instance
    if (obj instanceof EnemyClassData) {
        let objAny = obj as any;
        //console.log("Besieged deepCopy trying to copy enemyClassData.", obj);
        copy = new EnemyClassData(1, null, null, null, null, null, null, null) as object;
        for (let attr in objAny) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(objAny[attr]);
        }
    }
    // Handle other data types
    else if (null == obj || 'object' != typeof obj) {
        //console.log("Besieged deepCopy trying to copy null?.", obj);
        return obj;
    } else if (obj instanceof Array) {
        //console.log("Besieged deepCopy trying to copy Array Instance.", obj);
        copy = [];
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i]);
        }
    } else if (obj instanceof Object) {
        //console.log("Besieged deepCopy trying to copy Object Instance.", obj);
        return obj;
        // copy = {};
        // for (let attr in obj) {
        //     if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(obj[attr]);
        // }
    } else {
        //console.log("Besieged deepCopy Unable to copy obj! Its type isn't supported.");
    }

    return copy;
}

function GetRandomPositionFromPoint(initialVector: mod.Vector, maxRange: number) {
    let initialX = mod.XComponentOf(initialVector);
    let initialY = mod.YComponentOf(initialVector);
    let initialZ = mod.ZComponentOf(initialVector);

    if (maxRange <= 0) {
        return mod.CreateVector(initialX, initialY, initialZ);
    } else {
        const minRange = maxRange * -1;

        const randomX = getRandomFloatInRange(maxRange, minRange) + initialX;
        // Ignore Y
        const randomZ = getRandomFloatInRange(maxRange, minRange) + initialZ;

        //console.log("Besieged Random Vector: ", randomX, ", ", y, ", ", randomZ)

        return mod.CreateVector(randomX, initialY, randomZ);
    }
}

function RandomiseArray(array: any[]) {
    // Used to created a shuffled list of spawner IDs
    let arrayPosition = array.length;
    let tempStorageValue;
    let randomIndex;

    while (arrayPosition != 0) {
        randomIndex = getRandomInt(arrayPosition);
        arrayPosition--;

        tempStorageValue = array[arrayPosition];
        array[arrayPosition] = array[randomIndex];
        array[randomIndex] = tempStorageValue;
    }
}

function RefreshAllStores() {
    JsPlayer.playerInstances.forEach((player) => {
        let jsPlayer = JsPlayer.get(player, 18);
        if (!jsPlayer) return;
        jsPlayer.store.refresh();
        console.log('Besieged refreshing store for player: ', mod.GetObjId(jsPlayer.player));
    });
}

//// - Assault Rifle Weapon Packages - ////

let assaultRiflePackage_Basic = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Basic)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, assaultRiflePackage_Basic)


let assaultRiflePackage_Standard = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_1p87_150x, assaultRiflePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, assaultRiflePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, assaultRiflePackage_Standard)


let assaultRiflePackage_Elite = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Fast_Mag, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_R4T_200x, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Full_Angled, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, assaultRiflePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Standard_Suppressor, assaultRiflePackage_Elite)


let assaultRiflePackage_Basic_B36A4 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Basic_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, assaultRiflePackage_Basic_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_480mm_Factory, assaultRiflePackage_Basic_B36A4)

let assaultRiflePackage_Standard_B36A4 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_1p87_150x, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, assaultRiflePackage_Standard_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_480mm_Factory, assaultRiflePackage_Standard_B36A4)

let assaultRiflePackage_Elite_B36A4 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Fast_Mag, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_R4T_200x, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Full_Angled, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Standard_Suppressor, assaultRiflePackage_Elite_B36A4)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_480mm_Factory, assaultRiflePackage_Elite_B36A4)

//// - Carbine Weapon Packages - ////

let carbinePackage_Basic = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, carbinePackage_Basic)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, carbinePackage_Basic)


let carbinePackage_Standard = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, carbinePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_CCO_200x, carbinePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Vertical, carbinePackage_Standard)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, carbinePackage_Standard)


let carbinePackage_Elite = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Fast_Mag, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_ST_Prism_500x, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, carbinePackage_Elite)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Standard_Suppressor, carbinePackage_Elite)

let carbinePackage_Basic_M4A1 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, carbinePackage_Basic_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, carbinePackage_Basic_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_145_Carbine, carbinePackage_Basic_M4A1)

let carbinePackage_Standard_M4A1 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Fast_Mag, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_1p87_150x, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Compensated_Brake, carbinePackage_Standard_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_145_Carbine, carbinePackage_Standard_M4A1)

let carbinePackage_Elite_M4A1 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_40rnd_Fast_Mag, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_R4T_200x, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Lightened_Suppressor, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_115_Commando, carbinePackage_Elite_M4A1)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ergonomic_Improved_Mag_Catch, carbinePackage_Elite_M4A1)


//// - PDW Weapon Packages - ////

let PDWPackage_Basic_SMG_PW7A2 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, PDWPackage_Basic_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, PDWPackage_Basic_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_180mm_Standard, PDWPackage_Basic_SMG_PW7A2)

let PDWPackage_Standard_SMG_PW7A2 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_30rnd_Magazine, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Mini_Flex_100x, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Compact_Handstop, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_180mm_Standard, PDWPackage_Standard_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_5_mW_Red, PDWPackage_Standard_SMG_PW7A2)

let PDWPackage_Elite_SMG_PW7A2 = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_40rnd_Magazine, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SU_123_150x, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Folding_Vertical, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_CQB_Suppressor, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_180mm_Prototype, PDWPackage_Elite_SMG_PW7A2)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_5_mW_Red, PDWPackage_Elite_SMG_PW7A2)


//// - DMR Weapon Packages - ////

let DMRPackage_Basic_SVDM = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_10rnd_Magazine, DMRPackage_Basic_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Baker_300x, DMRPackage_Basic_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_550mm_Factory, DMRPackage_Basic_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, DMRPackage_Basic_SVDM)

let DMRPackage_Standard_SVDM = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_10rnd_Fast_Mag, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_6H64_Vertical, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_550mm_Factory, DMRPackage_Standard_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, DMRPackage_Standard_SVDM)


let DMRPackage_Elite_SVDM = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_20rnd_Magazine, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_PAS_35_300x, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_FMJ, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Long_Suppressor, DMRPackage_Elite_SVDM)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_620mm_Classic, DMRPackage_Elite_SVDM)

//// - Sniper Weapon Packages - ////

let SniperPackage_Basic_M2010ESR = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_5rnd_Magazine, SniperPackage_Basic_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, SniperPackage_Basic_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, SniperPackage_Basic_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_24_Full, SniperPackage_Basic_M2010ESR)

let SniperPackage_Standard_M2010ESR = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_5rnd_Fast_Mag, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SSDS_600x, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_24_Full, SniperPackage_Standard_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, SniperPackage_Standard_M2010ESR)

let SniperPackage_Elite_M2010ESR = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_8rnd_Magazine, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_NFX_800x, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Match_Grade, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Long_Suppressor, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_26_Carbon, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Left_Range_Finder, SniperPackage_Elite_M2010ESR)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ergonomic_DLC_Bolt, SniperPackage_Elite_M2010ESR)


//// - LMG Weapon Packages - ////

let LMGPackage_Basic_M240L = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_50rnd_Loose_Belt, LMGPackage_Basic_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, LMGPackage_Basic_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Classic_Grip_Pod, LMGPackage_Basic_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_20_Lima, LMGPackage_Basic_M240L)

let LMGPackage_Standard_M240L = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_75rnd_Belt_Box, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_BF_2M_250x, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_20_Lima, LMGPackage_Standard_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Flash_Hider, LMGPackage_Standard_M240L)

let LMGPackage_Elite_M240L = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_100rnd_Belt_Box, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_LDS_450x, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Bipod, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Tungsten_Core, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_Linear_Comp, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_24_Bravo, LMGPackage_Elite_M240L)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_120_mW_Blue, LMGPackage_Elite_M240L)

//// - Shotgun Weapon Packages - ////

let ShotgunPackage_Basic_185KS_K = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_4rnd_Magazine, ShotgunPackage_Basic_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Iron_Sights, ShotgunPackage_Basic_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_430mm_Factory, ShotgunPackage_Basic_185KS_K)

let ShotgunPackage_Standard_185KS_K = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_4rnd_Fast_Mag, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_Mini_Flex_100x, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Flechette, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Folding_Stubby, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_430mm_Factory, ShotgunPackage_Standard_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_5_mW_Red, ShotgunPackage_Standard_185KS_K)

let ShotgunPackage_Elite_185KS_K = mod.CreateNewWeaponPackage()
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Magazine_8rnd_Fast_Mag, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Scope_SU_123_150x, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Bottom_Ribbed_Vertical, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Ammo_Slugs, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Muzzle_CQB_Suppressor, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Barrel_430mm_Cut, ShotgunPackage_Elite_185KS_K)
mod.AddAttachmentToWeaponPackage(mod.WeaponAttachments.Right_120_mW_Blue, ShotgunPackage_Elite_185KS_K)


//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-------------------------------------- GREG W STORE -------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//

export function OnPlayerUIButtonEvent(player: mod.Player, widget: any, event: any) {
    //    console.log("got button event for widget: " + mod.GetUIWidgetName(widget));

    // send to the store?
    let jsPlayer = JsPlayer.get(player, 19);
    if (!jsPlayer) return;
    jsPlayer.store.onUIButtonEvent(widget as mod.UIWidget, event);
}

let isUnlocked = false;

function BuyToUnlock(jsPlayer: JsPlayer, itemData: any) {
    isUnlocked = true;
}

function LockedFromTest(jsplayer: mod.Player, itemData: any) {
    return isUnlocked ? null : store.disabledMsg.locked;
}

//let isUnlockedPrimaryAmmo = true;

//-----------------------------------------------------------------------------------------------//

class StoreItemData {
    id: any;
    name: any; // string or mod.Message
    image: any;
    cost = 1;
    //    inventoryPerRound = 1;
    bonusDamage = 0;
    bonusHealth = 0;

    constructor(params: { [key: string]: any }) {
        const fields: { [key: string]: any } = this;
        for (const id in params) fields[id] = params[id];
    }

    canAffordIt(jsPlayer: JsPlayer, itemData: any) {
        return jsPlayer.cash >= itemData.cost;
    }

    // return null if unlocked, or a String or mod.Message with the locked reason
    getDisabledMessageCallback(jsPlayer: JsPlayer, itemData: any) {
        if (itemData.inventoryPerRound > 0) {
            let buysThisRound = jsPlayer.itemBuysPerRound[itemData.id];
            if (buysThisRound >= itemData.inventoryPerRound) return outOfInventory;
        }
        return null;
    }

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();
        //console.log("Make Player " + mod.GetObjId(jsPlayer.player) + " buy: " + itemData.id);
    }
}

class StoreItemDataWeapon extends StoreItemData {
    // weapon;

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();
        if (itemData.weaponPackage != null){
            console.log("removing and adding new equipment");
            mod.RemoveEquipment(jsPlayer.player, mod.InventorySlots.PrimaryWeapon)
            
            mod.AddEquipment(jsPlayer.player, itemData.weapon, itemData.weaponPackage);
        }
        else {
            mod.AddEquipment(jsPlayer.player, itemData.weapon);
        }
        
        mod.ForceSwitchInventory(jsPlayer.player, mod.InventorySlots.PrimaryWeapon);
        // every time you buy a new gun, reroll the attachments tab,
        // so that the visible attachments are the ones that correspond to the new gun
        jsPlayer.store.refilterAttachmentsTab();
    }
}

class StoreItemDataGadget extends StoreItemData {
    // weapon;

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();

        mod.AddEquipment(jsPlayer.player, itemData.gadget);
        //mod.ForceSwitchInventory(jsPlayer.player, mod.InventorySlots.GadgetOne)
        // every time you buy a new gun, reroll the attachments tab,
        // so that the visible attachments are the ones that correspond to the new gun
        jsPlayer.store.refilterAttachmentsTab();
    }
}

class StoreItemDataAttachment extends StoreItemData {
    // weapon;
    // attachment;

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();
        //mod.ReplacePlayerInventory(jsPlayer.player, itemData.filter_weapon, itemData.attachment);
    }
}

class StoreItemUpgrade extends StoreItemData {
    // weapon;

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();

        if (itemData.bonusHealth > 0) {
            jsPlayer.maxHealth += itemData.bonusHealth;
            // jsPlayer.currentBonusHealthCost += jsPlayer.bonusHealthCostIncrease;
            // itemData.cost = jsPlayer.currentBonusHealthCost;
            mod.SetPlayerMaxHealth(jsPlayer.player, jsPlayer.maxHealth);
            jsPlayer.updateHealthUI();
            RefreshAllStores();
            //console.log("Besieged Human Player Deployed Max Health: ", mod.GetSoldierState(jsPlayer.player, mod.SoldierStateNumber.MaxHealth), " Current Health: ", mod.GetSoldierState(jsPlayer.player, mod.SoldierStateNumber.CurrentHealth));
        }

        if (itemData.bonusDamage > 0) {
            jsPlayer.bonusDamage += itemData.bonusDamage;
        }

        if (itemData.respawnIncrease > 0) {
            teamRespawns += itemData.respawnIncrease;
            currentTeamRespawnCost += 1000;
            itemData.cost = currentTeamRespawnCost;
            PlayerRespawnManager();
            RefreshAllStores();
        }

        if (itemData.startGame > 0) {
            console.log('Prematurely starting the game.');
            initialPlayerCount = minimumInitialPlayerCount;
        }

        if (itemData.startObserverCamera > 0) {
            console.log('Testing Observer Camera');
            mod.SetCameraTypeForPlayer(jsPlayer.player, mod.Cameras.ThirdPerson);
        }
    }
}

class StoreItemDataAmmo extends StoreItemData {
    // ammo;

    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        console.log('Buying Ammo');

        let initialPrimaryAmmo;
        let initialPrimaryMagAmmo;
        let initialSecondaryAmmo;
        let initialSecondaryMagAmmo;

        if (itemData.primaryAmmo > 0) {
            //if (mod.IsInventorySlotActive(jsPlayer.player, mod.InventorySlots.PrimaryWeapon)) {
            console.log('Buying Primary Ammo');
            initialPrimaryAmmo = mod.GetInventoryAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon);
            initialPrimaryMagAmmo = mod.GetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon);

            if (itemData.primaryAmmo > 0) {
                let ammo = mod.GetInventoryAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon);
                console.log('Besieged Primary Weapon Has Ammo:  ', ammo);
                ammo += itemData.primaryAmmo;
                mod.SetInventoryAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon, ammo);
                console.log('Besieged Giving Ammo ', ammo);
            }
            if (itemData.primaryMagAmmo > 0) {
                let magazineAmmo = mod.GetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon);
                console.log('Besieged Primary Weapon Has MagAmmo:  ', magazineAmmo);
                magazineAmmo += itemData.primaryMagAmmo;
                mod.SetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon, magazineAmmo);
                console.log('Besieged Giving Magazine Ammo ', magazineAmmo);
            }
            if (
                initialPrimaryAmmo < mod.GetInventoryAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon) ||
                initialPrimaryMagAmmo < mod.GetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.PrimaryWeapon)
            ) {
                jsPlayer.cash -= itemData.cost;
                jsPlayer.updateWalletUI();
            }
        }
        if (itemData.secondaryAmmo > 0) {
            //if (mod.IsInventorySlotActive(jsPlayer.player, mod.InventorySlots.SecondaryWeapon)) {
            console.log('Buying Secondary Ammo');
            initialSecondaryAmmo = mod.GetInventoryAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon);
            initialSecondaryMagAmmo = mod.GetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon);

            if (itemData.secondaryAmmo > 0) {
                let ammo = mod.GetInventoryAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon);
                console.log('Besieged Secondary Weapon Has Ammo:  ', ammo);
                ammo += itemData.secondaryAmmo;
                mod.SetInventoryAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon, ammo);
                console.log('Besieged Giving Ammo ', ammo);
            }
            if (itemData.secondaryMagAmmo > 0) {
                let magazineAmmo = mod.GetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon);
                console.log('Besieged Secondary Weapon Has MagAmmo:  ', magazineAmmo);
                magazineAmmo += itemData.secondaryMagAmmo;
                mod.SetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon, magazineAmmo);
                console.log('Besieged Giving Secondary Magazine Ammo ', magazineAmmo);
            }
            if (
                initialSecondaryAmmo < mod.GetInventoryAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon) ||
                initialSecondaryMagAmmo < mod.GetInventoryMagazineAmmo(jsPlayer.player, mod.InventorySlots.SecondaryWeapon)
            ) {
                jsPlayer.cash -= itemData.cost;
                jsPlayer.updateWalletUI();
            }
        }
    }
}

class StoreItemDataRandomizeTab extends StoreItemData {
    onBuyCallback(jsPlayer: JsPlayer, itemData: any) {
        jsPlayer.cash -= itemData.cost;
        jsPlayer.updateWalletUI();
        // reroll this store tab:
        let tabIndex = getTabIndexForItemData(itemData);
        jsPlayer.store.rerollTabItems(tabIndex);
    }
}

//-----------------------------------------------------------------------------------------------//

const cStoreData = [
    {
        tabName: store.gunstab,
        tabRandomized: true,
        itemDatas: [
            new StoreItemDataRandomizeTab({
                id: 'gun_randomize',
                name: store.randomize,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 100,
                itemRandomized: false,
            }),

            // Basic guns:
            new StoreItemDataWeapon({
                id: 'gun_b36a4',
                name: store.primary1,
                cost: 1250,
                weapon: mod.Weapons.AssaultRifle_B36A4,
                weaponPackage: assaultRiflePackage_Basic_B36A4,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M4A1_basic',
                name: store.primary11,
                cost: 1000,
                weapon: mod.Weapons.Carbine_M4A1,
                weaponPackage: carbinePackage_Basic_M4A1,
            }),
            new StoreItemDataWeapon({
                id: 'gun_PW7A2_basic',
                name: store.primary19,
                cost: 750,
                weapon: mod.Weapons.SMG_PW7A2,
                weaponPackage: PDWPackage_Basic_SMG_PW7A2,
            }),
            new StoreItemDataWeapon({
                id: 'gun_185KS_basic',
                name: store.primary41,
                cost: 750,
                weapon: mod.Weapons.Shotgun__185KS_K,
                weaponPackage: ShotgunPackage_Basic_185KS_K,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M240L_basic',
                name: store.primary29,
                cost: 1500,
                weapon: mod.Weapons.LMG_M240L,
                weaponPackage: LMGPackage_Basic_M240L,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M2010_ESR_basic',
                name: store.primary37,
                cost: 1500,
                weapon: mod.Weapons.Sniper_M2010_ESR,
                weaponPackage: SniperPackage_Basic_M2010ESR,
            }),
            new StoreItemDataWeapon({
                id: 'gun_SVDM_basic',
                name: store.primary33,
                cost: 1000,
                weapon: mod.Weapons.DMR_SVDM,
                weaponPackage: DMRPackage_Basic_SVDM,
            }),

            // Standard guns:
            new StoreItemDataWeapon({
                id: 'gun_b36a4_standard',
                name: store.primary1A,
                cost: 2500,
                weapon: mod.Weapons.AssaultRifle_B36A4,
                weaponPackage: assaultRiflePackage_Standard_B36A4,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M4A1_standard',
                name: store.primary11A,
                cost: 2000,
                weapon: mod.Weapons.Carbine_M4A1,
                weaponPackage: carbinePackage_Standard_M4A1,
            }),
            new StoreItemDataWeapon({
                id: 'gun_PW7A2_standard',
                name: store.primary19A,
                cost: 1500,
                weapon: mod.Weapons.SMG_PW7A2,
                weaponPackage: PDWPackage_Standard_SMG_PW7A2,
            }),
            new StoreItemDataWeapon({
                id: 'gun_185KS_standard',
                name: store.primary41A,
                cost: 1500,
                weapon: mod.Weapons.Shotgun__185KS_K,
                weaponPackage: ShotgunPackage_Standard_185KS_K,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M240L_standard',
                name: store.primary29A,
                cost: 2500,
                weapon: mod.Weapons.LMG_M240L,
                weaponPackage: LMGPackage_Standard_M240L,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M2010_ESR_standard',
                name: store.primary37A,
                cost: 2500,
                weapon: mod.Weapons.Sniper_M2010_ESR,
                weaponPackage: SniperPackage_Standard_M2010ESR,
            }),
            new StoreItemDataWeapon({
                id: 'gun_SVDM_standard',
                name: store.primary33A,
                cost: 1500,
                weapon: mod.Weapons.DMR_SVDM,
                weaponPackage: DMRPackage_Standard_SVDM,
            }),


            // Elite guns:
            new StoreItemDataWeapon({
                id: 'gun_b36a4_elite',
                name: store.primary1B,
                cost: 5000,
                weapon: mod.Weapons.AssaultRifle_B36A4,
                weaponPackage: assaultRiflePackage_Elite_B36A4,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M4A1_elite',
                name: store.primary11B,
                cost: 4000,
                weapon: mod.Weapons.Carbine_M4A1,
                weaponPackage: carbinePackage_Elite_M4A1,
            }),
            new StoreItemDataWeapon({
                id: 'gun_PW7A2_elite',
                name: store.primary19B,
                cost: 3000,
                weapon: mod.Weapons.SMG_PW7A2,
                weaponPackage: PDWPackage_Elite_SMG_PW7A2,
            }),
            new StoreItemDataWeapon({
                id: 'gun_185KS_elite',
                name: store.primary41B,
                cost: 3000,
                weapon: mod.Weapons.Shotgun__185KS_K,
                weaponPackage: ShotgunPackage_Elite_185KS_K,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M240L_elite',
                name: store.primary29B,
                cost: 5000,
                weapon: mod.Weapons.LMG_M240L,
                weaponPackage: LMGPackage_Elite_M240L,
            }),
            new StoreItemDataWeapon({
                id: 'gun_M2010_ESR_elite',
                name: store.primary37B,
                cost: 5000,
                weapon: mod.Weapons.Sniper_M2010_ESR,
                weaponPackage: SniperPackage_Elite_M2010ESR,
            }),
            new StoreItemDataWeapon({
                id: 'gun_SVDM_elite',
                name: store.primary33B,
                cost: 3000,
                weapon: mod.Weapons.DMR_SVDM,
                weaponPackage: DMRPackage_Elite_SVDM,
            }),
        ],
    },
    
    {
        tabName: store.gadgetstab,
        tabRandomized: true,
        itemDatas: [
            new StoreItemDataRandomizeTab({
                id: 'gadget_randomize',
                name: store.randomize,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 100,
                itemRandomized: false,
            }),
            new StoreItemDataGadget({
                id: 'gadget_ThrowingKnife',
                name: store.gadget9,
                cost: 100,
                gadget: mod.Gadgets.Throwable_Throwing_Knife,
            }),
            new StoreItemDataGadget({
                id: 'gadget_TUGS',
                name: store.gadget6,
                cost: 250,
                gadget: mod.Gadgets.Class_Motion_Sensor,
            }),
            new StoreItemDataGadget({
                id: 'gadget_ATMine',
                name: store.gadget10,
                cost: 500,
                gadget: mod.Gadgets.Misc_Anti_Vehicle_Mine,
            }),
            new StoreItemDataGadget({
                id: 'gadget_Defibrillator',
                name: store.gadget11,
                cost: 750,
                gadget: mod.Gadgets.Misc_Defibrillator,
            }),
            new StoreItemDataGadget({
                id: 'gadget_DeployableCover',
                name: store.gadget3,
                cost: 1000,
                gadget: mod.Gadgets.Deployable_Cover,
            }),
            new StoreItemDataGadget({
                id: 'gadget_C5',
                name: store.gadget1,
                cost: 1500,
                gadget: mod.Gadgets.Misc_Demolition_Charge,
            }),
            new StoreItemDataGadget({
                id: 'gadget_AdrenalineInjector',
                name: store.gadget5,
                cost: 250,
                gadget: mod.Gadgets.Class_Adrenaline_Injector,
            }),
            new StoreItemDataGadget({
                id: 'gadget_AimGuidedLauncher',
                name: store.gadget12,
                cost: 2000,
                gadget: mod.Gadgets.Launcher_Aim_Guided,
            }),
            new StoreItemDataGadget({
                id: 'gadget_ThrowableMotionSensor',
                name: store.gadget13,
                cost: 250,
                gadget: mod.Gadgets.Throwable_Proximity_Detector,
            }),
            new StoreItemDataGadget({
                id: 'gadget_MissileInterceptSystem',
                name: store.gadget15,
                cost: 1000,
                gadget: mod.Gadgets.Deployable_Missile_Intercept_System,
            }),
            new StoreItemDataGadget({
                id: 'gadget_Decoy',
                name: store.gadget16,
                cost: 250,
                gadget: mod.Gadgets.Misc_Sniper_Decoy,
            }),
            new StoreItemDataGadget({
                id: 'gadget_AP_Mine',
                name: store.gadget18,
                cost: 750,
                gadget: mod.Gadgets.Misc_Anti_Personnel_Mine,
            }),
            new StoreItemDataGadget({
                id: 'gadget_StunGrenade',
                name: store.gadget19,
                cost: 250,
                gadget: mod.Gadgets.Throwable_Stun_Grenade,
            }),
            new StoreItemDataGadget({
                id: 'gadget_TripwireSensorMine',
                name: store.gadget20,
                cost: 1000,
                gadget: mod.Gadgets.Misc_Tripwire_Sensor_AV_Mine,
            }),
            new StoreItemDataGadget({
                id: 'gadget_FRAG',
                name: store.gadget21,
                cost: 250,
                gadget: mod.Gadgets.Throwable_Fragmentation_Grenade,
            }),
            new StoreItemDataGadget({
                id: 'gadget_SupplyBag',
                name: store.gadget7,
                cost: 5000,
                gadget: mod.Gadgets.Class_Supply_Bag,
            }),
            new StoreItemDataGadget({
                id: 'gadget_ReconDrone',
                name: store.gadget8,
                cost: 250,
                gadget: mod.Gadgets.Deployable_Recon_Drone,
            }),
            new StoreItemDataGadget({
                id: 'gadget_Mortar',
                name: store.gadget22,
                cost: 500,
                gadget: mod.Gadgets.Deployable_Portable_Mortar,
            }),
            new StoreItemDataGadget({
                id: 'gadget_RPG7',
                name: store.gadget2,
                cost: 1000,
                gadget: mod.Gadgets.Launcher_Unguided_Rocket,
            }),
            new StoreItemDataGadget({
                id: 'gadget_EODBot',
                name: store.gadget23,
                cost: 500,
                gadget: mod.Gadgets.Deployable_EOD_Bot,
            }),
            new StoreItemDataGadget({
                id: 'gadget_IncenLauncher',
                name: store.gadget24,
                cost: 1250,
                gadget: mod.Gadgets.Launcher_Incendiary_Airburst,
            }),
        ],
    },
    {
        tabName: store.ammotab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemDataAmmo({
                id: 'ammo1',
                name: store.ammo1,
                image: mod.UIImageType.RifleAmmo,
                cost: 500,
                inventoryPerRound: 1,
                primaryAmmo: 100,
                primaryMagAmmo: 1000,
            }),
            new StoreItemDataAmmo({
                id: 'ammo2',
                name: store.ammo2,
                image: mod.UIImageType.RifleAmmo,
                cost: 250,
                inventoryPerRound: 1,
                secondaryAmmo: 30,
                secondaryMagAmmo: 250,
            }),
        ],
    },
    {
        tabName: store.upgradestab,
        tabRandomized: false,
        itemDatas: [
            new StoreItemUpgrade({
                id: 'upgrade5',
                name: store.upgrade5,
                image: mod.UIImageType.SelfHeal,
                bonusHealth: 20,
                inventoryPerRound: 1,
                cost: 500,
            }),
            new StoreItemUpgrade({
                id: 'upgrade7',
                name: store.upgrade7,
                image: mod.UIImageType.SpawnBeacon,
                cost: currentTeamRespawnCost,
                respawnIncrease: 1,
            }),
            new StoreItemUpgrade({
                id: 'upgrade8',
                name: store.upgrade8,
                image: mod.UIImageType.TEMP_PortalIcon,
                cost: 0,
                startGame: 1,
            }),
        ],
    },
];

function getTabIndexForItemData(itemData: any) {
    for (let i = 0; i < cStoreData.length; i++) {
        for (let j = 0; j < cStoreData[i].itemDatas.length; j++) {
            if (cStoreData[i].itemDatas[j] == itemData) return i;
        }
    }
    return -1;
}

//-----------------------------------------------------------------------------------------------//

class Store {
    #jsPlayer: JsPlayer;
    #storeData: Dict;
    #rootWidget: mod.UIWidget | undefined;

    #storeWidth = 1200;
    #storeHeight = 600;
    #headerHeight = 60;
    #tabHeight = 50;
    #tabSpacing = 10;
    #tabNamePrefix = '__tab';
    #currentTabIndex = 0;
    #activeTabBgColor = [0.44, 0.42, 0.4];
    #inactiveTabBgColor = [0.34, 0.32, 0.3];
    #itemSize = 250;
    #itemSizeH = 250;
    #itemSizeV = 166;
    #itemSpacingHorizontal = 20;
    #itemSpacingVertical = 20;
    #closeButtonName = '__close';

    #tabWidgets: Widget[] = []; // UIWidgets, in order by cStoreData[]
    #itemButtons: { [key: string]: any } = {}; // ItemButton objects, keyed by itemDatas.id
    #cashText: mod.UIWidget | undefined;
    #healthText: mod.UIWidget | undefined;

    #isStoreVisible = false;

    constructor(jsPlayer: JsPlayer, storeData: any) {
        this.#jsPlayer = jsPlayer;
        this.#storeData = storeData;
    }

    open() {
        if (!this.#rootWidget) this.#create();
        if (!this.#rootWidget) return;
        this.refresh();
        this.refilterAttachmentsTab();
        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isStoreVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isStoreVisible = false;

            if (combatStartDelayRemaining > 0) {
                this.#jsPlayer.lobbyUI.open();
            }
        } else {
            console.log('Store not yet opened for this player.');
        }
    }

    isOpen() {
        return this.#isStoreVisible;
    }

    onUIButtonEvent(widget: Widget, event: any) {
        let widgetName = mod.GetUIWidgetName(widget);
        // click on a tab?
        if (widgetName.slice(0, this.#tabNamePrefix.length) == this.#tabNamePrefix) {
            //mod.TriggerAudio( mod.SoundEvents2D.ShowObjective, this.#jsPlayer.player);
            let tabIndex = parseInt(widgetName.slice(this.#tabNamePrefix.length));
            this.selectTab(tabIndex);
        }
        // close button?
        if (widgetName == this.#closeButtonName) {
            //mod.TriggerAudio( mod.SoundEvents2D.ObjectiveCappingStop, this.#jsPlayer.player);
            this.close();
            mod.EnableUIInputMode(false, this.#jsPlayer.player);
            //tell everyone you closed your store.
        }
        // click on a store item:
        if (this.#itemButtons.hasOwnProperty(widgetName)) {
            //mod.TriggerAudio( mod.SoundEvents2D.ObjectiveCappingComplete, this.#jsPlayer.player);
            // call the buy callback:
            let itemData = this.#itemButtons[widgetName].itemData;
            itemData.onBuyCallback?.(this.#jsPlayer, itemData);
            this.#jsPlayer.itemBuysPerRound[itemData.id] = (this.#jsPlayer.itemBuysPerRound[itemData.id] || 0) + 1;
            this.refresh();
            this.#jsPlayer.player;
            mod.SetScoreboardPlayerValues(
                this.#jsPlayer.player,
                this.#jsPlayer.kills,
                this.#jsPlayer.deaths,
                this.#jsPlayer.totalCashEarned,
                this.#jsPlayer.totalCashEarned - this.#jsPlayer.cash + initialCash,
                this.#jsPlayer.timesIncarcerated
            );
        }
    }

    selectTab(tabIndex: number) {
        if (tabIndex < 0 || tabIndex >= this.#tabWidgets.length || tabIndex == this.#currentTabIndex) return;
        // turn off the old one:
        mod.SetUIWidgetVisible(this.#tabWidgets[this.#currentTabIndex], false);
        // turn on the new one:
        this.#currentTabIndex = tabIndex;
        mod.SetUIWidgetVisible(this.#tabWidgets[this.#currentTabIndex], true);
    }

    refresh() {
        if (this.#rootWidget) {
            // refresh all store items:
            for (const id in this.#itemButtons) {
                this.#itemButtons[id].refresh();
            }
            // refresh the cash text:
            if (!this.#cashText || !this.#healthText) return;
            mod.SetUITextLabel(this.#cashText, modMessageDebug(store.cashFmt, this.#jsPlayer.cash));
            mod.SetUITextLabel(this.#healthText, modMessageDebug(store.healthFmt, this.#jsPlayer.maxHealth));
        } else {
            console.log('Store not yet opened for this player.');
        }
    }

    #create() {
        // background:
        this.#rootWidget = ParseUI({
            type: 'Container',
            size: [this.#storeWidth, this.#storeHeight],
            position: [0, 40],
            anchor: mod.UIAnchor.Center,
            bgFill: mod.UIBgFill.Solid,
            bgColor: this.#activeTabBgColor,
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [
                {
                    type: 'Container',
                    position: [0, -this.#headerHeight],
                    size: [this.#storeWidth, this.#headerHeight],
                    anchor: mod.UIAnchor.TopLeft,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [0.1, 0.1, 0.1],
                    bgAlpha: 1,
                },
                {
                    // close button:
                    type: 'Button',
                    name: this.#closeButtonName,
                    size: [this.#headerHeight - 16, this.#headerHeight - 16],
                    position: [8, 8 - this.#headerHeight],
                    anchor: mod.UIAnchor.TopRight,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [1, 0.3, 0.3],
                    bgAlpha: 1,
                },
                {
                    // close button X:
                    type: 'Text',
                    parent: this.#closeButtonName,
                    size: [this.#headerHeight - 16, this.#headerHeight - 16],
                    position: [8, 8 - this.#headerHeight],
                    anchor: mod.UIAnchor.TopRight,
                    bgFill: mod.UIBgFill.None,
                    textAnchor: mod.UIAnchor.Center,
                    textLabel: modMessageDebug(store.closeStore),
                    textSize: 50,
                },
            ],
        });
        // cash text:
        this.#cashText = ParseUI({
            type: 'Text',
            parent: this.#rootWidget,
            size: [500, 50],
            position: [-100, 0],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.None,
            textAnchor: mod.UIAnchor.Center,
            textLabel: modMessageDebug(store.cashFmt, this.#jsPlayer.cash),
        });
        // health text:
        this.#healthText = ParseUI({
            type: 'Text',
            parent: this.#rootWidget,
            position: [100, 0],
            size: [500, 50],
            anchor: mod.UIAnchor.BottomCenter,
            bgFill: mod.UIBgFill.None,
            textAnchor: mod.UIAnchor.Center,
            textLabel: modMessageDebug(store.healthFmt, this.#jsPlayer.maxHealth),
        });

        // tabs:
        this.#createTabs();
    }

    #createTabs() {
        // how many tabs are there?
        let tabDatas = this.#storeData;
        let tabCnt = tabDatas.length;
        // tab size, clamped if there's only a few tabs:
        let widthForTabs = this.#storeWidth - this.#tabSpacing * 2 - this.#headerHeight;
        let tabWidth = Math.min(250, widthForTabs / (tabCnt + 1));
        for (let a = 0; a < tabCnt; a++) this.#createTab(a, tabWidth, tabDatas[a]);
    }

    #createTab(tabIndex: number, tabWidth: number, tabData: any) {
        let headerPosition = [this.#tabSpacing + tabIndex * tabWidth, -this.#tabHeight];
        let headerSize = [tabWidth - 10, this.#tabHeight];
        // tab header bg.  not part of the tab / always shown:
        ParseUI({
            type: 'Button',
            name: this.#tabNamePrefix + tabIndex,
            parent: this.#rootWidget,
            position: headerPosition,
            size: headerSize,
            anchor: mod.UIAnchor.TopLeft,
            bgFill: mod.UIBgFill.OutlineThick,
            bgColor: this.#inactiveTabBgColor,
            //bgColor: [1,0,0],
            bgAlpha: 1,
        });

        // tab container.  this is the part that turns on and off:
        let tabWidget = ParseUI({
            type: 'Container',
            visible: tabIndex == 0,
            parent: this.#rootWidget,
            size: [this.#storeWidth, this.#headerHeight],
            bgFill: mod.UIBgFill.None,
            children: [
                {
                    // selected header outline if active:
                    type: 'Container',
                    position: headerPosition,
                    size: headerSize,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: this.#activeTabBgColor,
                    bgAlpha: 0.25,
                },
            ],
        });
        if (!tabWidget) return;
        this.#tabWidgets.push(tabWidget);
        this.#createItems(tabIndex, tabData.itemDatas, tabData.tabRandomized);

        // header label.  not part of the tab / always shown.  after the tab so it gets drawn on top.
        ParseUI({
            type: 'Text',
            parent: this.#rootWidget,
            position: headerPosition,
            size: headerSize,
            bgFill: mod.UIBgFill.None,
            textLabel: tabData.tabName,
            textSize: 30,
            textAnchor: mod.UIAnchor.Center,
            textColor: [1, 0.9, 0.8],
        });
    }

    #createItems(tabIndex: number, itemDatas: any[], randomize: boolean) {
        let itemCount = itemDatas.length;
        let maxItems = 12;
        let selectedItems: any[] = [];

        if (itemCount < maxItems) {
            maxItems = itemCount;
        }

        let isItemFiltered = function (jsPlayer: JsPlayer, itemData: any) {
            if (jsPlayer.isDeployed == false) return true;

            try {
                return itemData.hasOwnProperty('filter_weapon') && !mod.HasEquipment(jsPlayer.player, itemData.filter_weapon);
            } catch (e) {
                console.log('HasEquipment exception: ' + e);
                return true;
            }
            return false;
        };

        if (randomize == true) {
            let isItemRandomized = function (itemData: any) {
                return !itemData.hasOwnProperty('itemRandomized') || itemData.itemRandomized == true;
            };
            // get all the non-randomized items first:
            let nonRandomCount = 0;
            for (let itemIndex = 0; itemIndex < itemCount; ++itemIndex) {
                if (!isItemRandomized(itemDatas[itemIndex])) {
                    if (!isItemFiltered(this.#jsPlayer, itemDatas[itemIndex])) {
                        this.#createItem(tabIndex, itemDatas[itemIndex], itemIndex);
                        nonRandomCount++;
                    }
                }
            }

            // add randomized items:
            for (let itemIndex = nonRandomCount; itemIndex < maxItems; ++itemIndex) {
                let randomItem = Math.floor(Math.random() * itemCount);

                if (selectedItems.includes(randomItem) || !isItemRandomized(itemDatas[randomItem])) {
                    itemIndex--;
                } else {
                    this.#createItem(tabIndex, itemDatas[randomItem], itemIndex);
                    selectedItems.push(randomItem);
                }
            }
        } else {
            let itemsCreated = 0;
            for (let itemIndex = 0; itemIndex < itemCount; ++itemIndex) {
                if (!isItemFiltered(this.#jsPlayer, itemDatas[itemIndex])) {
                    this.#createItem(tabIndex, itemDatas[itemIndex], itemsCreated++);
                }
            }
        }
    }

    #createItem(tabIndex: number, itemData: any, itemIndex: number) {
        let yi = Math.floor(itemIndex / 4);
        let xi = Math.floor(itemIndex % 4);
        let x = 50 + (1 + xi) * this.#itemSpacingHorizontal + xi * this.#itemSizeH;
        let y = (1 + yi) * this.#itemSpacingVertical + yi * this.#itemSizeV;
        let itemPos = [x, y];
        this.#itemButtons[itemData.id] = new ItemButton(
            this.#jsPlayer,
            this.#tabWidgets[tabIndex],
            tabIndex,
            itemData,
            itemPos,
            this.#itemSize,
            this.#itemSizeH,
            this.#itemSizeV
        );
    }

    rerollTabItems(tabIndex: number) {
        this.#deleteTabItems(tabIndex);
        let tabData = this.#storeData[tabIndex];
        this.#createItems(tabIndex, tabData.itemDatas, tabData.tabRandomized);
    }

    refilterAttachmentsTab() {
        const attachmentsTabIndex = 1; // hardcoded to tab 1 for attachments!
        this.rerollTabItems(attachmentsTabIndex);
    }

    #deleteTabItems(tabIndex: number) {
        for (const id in this.#itemButtons) {
            if (this.#itemButtons[id].tabIndex == tabIndex) {
                this.#itemButtons[id].destroy();
                delete this.#itemButtons[id];
            }
        }
    }

    autoBuyRandom() {
        let itemKeys = Object.keys(this.#itemButtons);
        let rnd = getRandomInt(itemKeys.length);
        debugger;
        let itemData = this.#itemButtons[itemKeys[rnd]].itemData;
        itemData.onBuyCallback?.(this.#jsPlayer, itemData);
    }
}

class ItemButton {
    #jsPlayer;
    #itemBgColor = [0.9, 0.6, 0.4];
    tabIndex;
    itemData;
    #isDisabled;
    #widget: mod.UIWidget | undefined;
    #widgetButton: mod.UIWidget | undefined;
    #widgetCost: mod.UIWidget | undefined;
    #widgetCostName = '__cost';
    #widgetDisabled: mod.UIWidget | undefined;
    #widgetDisabledName = '__disabled';

    constructor(
        jsPlayer: JsPlayer,
        parentWidget: Widget,
        tabIndex: number,
        itemData: any,
        position: any,
        itemSize: number,
        itemSizeH: number,
        itemSizeV: number
    ) {
        this.#jsPlayer = jsPlayer;
        this.tabIndex = tabIndex;
        this.itemData = itemData;
        //let size = [itemSize, itemSize];
        let size = [itemSizeH, itemSizeV];
        const itemSizePadding = .65
        let paddedSize = [itemSizeH * itemSizePadding, itemSizeV * itemSizePadding]
        let disabledMsg = itemData.getDisabledMessageCallback?.(jsPlayer, itemData);
        this.#isDisabled = disabledMsg != null;
        let canAffordIt = this.itemData.canAffordIt(this.#jsPlayer, this.itemData);

        if (itemData.weapon != null){ // This is a weapon / gadget item button so use the new image path
            this.#widget = ParseUI({
            type: 'Container',
            parent: parentWidget,
            position: position,
            size: size,
            bgFill: mod.UIBgFill.None,
            playerID: jsPlayer.player,
            children: [
                {
                    type: 'Button',
                    name: itemData.id,
                    size: size,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: this.#itemBgColor,
                    bgAlpha: 1,
                    buttonEnabled: !this.#isDisabled && canAffordIt,
                },
                {
                    type: 'WeaponImage',
                    size: size,
                    anchor: mod.UIAnchor.Center,
                    padding: itemSize * 0.2,
                    bgFill: mod.UIBgFill.None,
                    imageType: itemData.image,
                    weapon: itemData.weapon,
                    weaponPackage: itemData.weaponPackage,
                },
                {
                    type: 'Text',
                    size: [itemSize, 100],
                    anchor: mod.UIAnchor.TopCenter,
                    bgFill: mod.UIBgFill.None,
                    textLabel: itemData.name,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 20,
                },
                {
                    type: 'Text',
                    name: this.#widgetCostName,
                    anchor: mod.UIAnchor.BottomRight,
                    bgFill: mod.UIBgFill.None,
                    textLabel: modMessageDebug(store.costFmt, itemData.cost),
                    textAnchor: mod.UIAnchor.BottomRight,
                    textColor: canAffordIt ? [1, 1, 1] : [1, 0, 0],
                    textSize: 30,
                },
                {
                    type: 'Text',
                    name: this.#widgetDisabledName,
                    visible: this.#isDisabled,
                    size: size,
                    padding: 10,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [0.25, 0.25, 0.25],
                    bgAlpha: 0.8,
                    textLabel: disabledMsg ?? store.disabledMsg.locked,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 30,
                    textAlpha: 1,
                },
            ],
        });
        if (!this.#widget) return;
        this.#widgetButton = mod.FindUIWidgetWithName(itemData.id, this.#widget);
        this.#widgetCost = mod.FindUIWidgetWithName(this.#widgetCostName, this.#widget);
        this.#widgetDisabled = mod.FindUIWidgetWithName(this.#widgetDisabledName, this.#widget);
        this.refresh();
        }
        else if (itemData.gadget != null){
            this.#widget = ParseUI({
            type: 'Container',
            parent: parentWidget,
            position: position,
            size: size,
            bgFill: mod.UIBgFill.None,
            playerID: jsPlayer.player,
            children: [
                {
                    type: 'Button',
                    name: itemData.id,
                    size: size,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: this.#itemBgColor,
                    bgAlpha: 1,
                    buttonEnabled: !this.#isDisabled && canAffordIt,
                },
                {
                    type: 'GadgetImage',
                    size: paddedSize,
                    anchor: mod.UIAnchor.Center,
                    padding: itemSize * 0.2,
                    bgFill: mod.UIBgFill.None,
                    imageType: itemData.image,
                    gadget: itemData.gadget,
                },
                {
                    type: 'Text',
                    size: [itemSize, 100],
                    anchor: mod.UIAnchor.TopCenter,
                    bgFill: mod.UIBgFill.None,
                    textLabel: itemData.name,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 20,
                },
                {
                    type: 'Text',
                    name: this.#widgetCostName,
                    anchor: mod.UIAnchor.BottomRight,
                    bgFill: mod.UIBgFill.None,
                    textLabel: modMessageDebug(store.costFmt, itemData.cost),
                    textAnchor: mod.UIAnchor.BottomRight,
                    textColor: canAffordIt ? [1, 1, 1] : [1, 0, 0],
                    textSize: 30,
                },
                {
                    type: 'Text',
                    name: this.#widgetDisabledName,
                    visible: this.#isDisabled,
                    size: size,
                    padding: 10,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [0.25, 0.25, 0.25],
                    bgAlpha: 0.8,
                    textLabel: disabledMsg ?? store.disabledMsg.locked,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 30,
                    textAlpha: 1,
                },
            ],
        });
        if (!this.#widget) return;
        this.#widgetButton = mod.FindUIWidgetWithName(itemData.id, this.#widget);
        this.#widgetCost = mod.FindUIWidgetWithName(this.#widgetCostName, this.#widget);
        this.#widgetDisabled = mod.FindUIWidgetWithName(this.#widgetDisabledName, this.#widget);
        this.refresh();
        }
        else{ // This is not an weapon / gadget item button so use the old image path
            this.#widget = ParseUI({
            type: 'Container',
            parent: parentWidget,
            position: position,
            size: size,
            bgFill: mod.UIBgFill.None,
            playerID: jsPlayer.player,
            children: [
                {
                    type: 'Button',
                    name: itemData.id,
                    size: size,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: this.#itemBgColor,
                    bgAlpha: 1,
                    buttonEnabled: !this.#isDisabled && canAffordIt,
                },
                {
                    type: 'Image',
                    size: size,
                    anchor: mod.UIAnchor.Center,
                    padding: itemSize * 0.2,
                    bgFill: mod.UIBgFill.None,
                    imageType: itemData.image,
                },
                {
                    type: 'Text',
                    size: [itemSize, 100],
                    anchor: mod.UIAnchor.TopCenter,
                    bgFill: mod.UIBgFill.None,
                    textLabel: itemData.name,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 20,
                },
                {
                    type: 'Text',
                    name: this.#widgetCostName,
                    anchor: mod.UIAnchor.BottomRight,
                    bgFill: mod.UIBgFill.None,
                    textLabel: modMessageDebug(store.costFmt, itemData.cost),
                    textAnchor: mod.UIAnchor.BottomRight,
                    textColor: canAffordIt ? [1, 1, 1] : [1, 0, 0],
                    textSize: 30,
                },
                {
                    type: 'Text',
                    name: this.#widgetDisabledName,
                    visible: this.#isDisabled,
                    size: size,
                    padding: 10,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [0.25, 0.25, 0.25],
                    bgAlpha: 0.8,
                    textLabel: disabledMsg ?? store.disabledMsg.locked,
                    textAnchor: mod.UIAnchor.TopCenter,
                    textSize: 30,
                    textAlpha: 1,
                },
            ],
        });
        if (!this.#widget) return;
        this.#widgetButton = mod.FindUIWidgetWithName(itemData.id, this.#widget);
        this.#widgetCost = mod.FindUIWidgetWithName(this.#widgetCostName, this.#widget);
        this.#widgetDisabled = mod.FindUIWidgetWithName(this.#widgetDisabledName, this.#widget);
        this.refresh();
    }
    }

        

    destroy() {
        if (!this.#widget) return;
        mod.DeleteUIWidget(this.#widget);
    }

    refresh() {
        if (!this.#widgetCost || !this.#widgetButton || !this.#widgetDisabled) return;
        // price change ?
        mod.SetUITextLabel(this.#widgetCost, modMessageDebug(store.costFmt, this.itemData.cost));
        // disabled?
        let wasDisabled = this.#isDisabled;
        let disabledMsg = this.itemData.getDisabledMessageCallback?.(this.#jsPlayer, this.itemData);
        let isDisabled = disabledMsg != null;
        // has it changed?
        if (wasDisabled !== isDisabled) {
            this.#isDisabled = isDisabled;
            mod.SetUIButtonEnabled(this.#widgetButton, !isDisabled);
            mod.SetUIWidgetVisible(this.#widgetDisabled, isDisabled);
            if (disabledMsg) {
                if (typeof disabledMsg === 'string') disabledMsg = modMessageDebug(disabledMsg);
                mod.SetUITextLabel(this.#widgetDisabled, disabledMsg as mod.Message);
            }
        }

        // update if you can afford it?
        let canAffordIt = this.itemData.canAffordIt(this.#jsPlayer, this.itemData);
        if (!isDisabled) mod.SetUIButtonEnabled(this.#widgetButton, canAffordIt);
        mod.SetUITextColor(this.#widgetCost, canAffordIt ? mod.CreateVector(1, 1, 1) : mod.CreateVector(1, 0, 0));
    }
}

//-----------------------------------------------------------------------------------------------//

//-----------------------------------------------------------------------------------------------//

class JsPlayer {
    player: mod.Player;
    playerId: number;
    store;
    cash = initialCash;
    maxHealth = 100;
    currentHealth = 100;
    bonusDamage = 0;

    isDeployed = false;
    hasDeployed = false;

    playerwalletWidget: mod.UIWidget | undefined;
    playerNotificationWidget: mod.UIWidget | undefined;
    playerhealthWidget: mod.UIWidget | undefined;

    itemBuysPerRound: any = {}; // a count of each item bought this round, keyed by itemDatas.id

    isPrisoner = false;
    timesIncarcerated = 0;

    // stats:
    kills = 0;
    deaths = 0;
    totalCashEarned = 0;

    lobbyUI;

    baseBonusHealthCost = 500;
    currentBonusHealthCost = 500;
    bonusHealthCostIncrease = 250;

    static playerInstances: mod.Player[] = [];

    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);
        this.store = new Store(this, cStoreData);
        JsPlayer.playerInstances.push(this.player);
        if (debugJSPlayer) {
            console.log('Besieged Adding Player [', mod.GetObjId(player), '] Creating JS Player: ', JsPlayer.playerInstances.length);
        }
        if (EnableEasyMode) {
            this.cash = EasyModeCash;
        }
        this.createWalletUI();
        this.createPlayerNotificationUI();
        this.createHealthUI();
        this.openHealthUI();
        this.lobbyUI = new LobbyUI(this);
    }

    // declare dictionary with int keys
    static #allJsPlayers: { [key: number]: JsPlayer } = {};

    static get(player: mod.Player, instance?: number) {
        if (!gameOver && mod.GetObjId(player) > -1) {
            let index = mod.GetObjId(player);

            if (instance == null) {
                instance = 1000;
            }
            if (debugJSPlayer) {
                console.log('Calling JSPlayer.get Instance [', instance, '] on Player [', index, ']');
            }

            let jsPlayer = this.#allJsPlayers[index];
            if (!jsPlayer) {
                jsPlayer = new JsPlayer(player);
                this.#allJsPlayers[index] = jsPlayer;
            }

            return jsPlayer;
        }
        return undefined;
    }

    static removeInvalidJSPlayers(invalidPlayerId: number) {
        if (!gameOver) {
            if (debugJSPlayer) {
                console.log('Removing Invalid JSPlayers currently: ', JsPlayer.playerInstances.length);
            }
            let allPlayersLength = Object.keys(JsPlayer.#allJsPlayers).length;
            if (debugJSPlayer) {
                console.log('#allJsPlayers Length: ', JsPlayer.playerInstances.length);
            }
            let n = 0;
            let indexToRemove = -1;
            JsPlayer.playerInstances.forEach((indexPlayer) => {
                if (mod.GetObjId(JsPlayer.playerInstances[n]) < 0) {
                    indexToRemove = n;
                }
                n++;
            });

            delete this.#allJsPlayers[invalidPlayerId];

            if (indexToRemove > -1) {
                JsPlayer.playerInstances.splice(indexToRemove, 1);
            }

            if (debugJSPlayer) {
                console.log('Player [', invalidPlayerId, '] removed. JSPlayers Remaining: ', JsPlayer.playerInstances.length);
            }
            allPlayersLength = Object.keys(JsPlayer.#allJsPlayers).length;
            if (debugJSPlayer) {
                console.log('#allJsPlayers New Length: ', JsPlayer.playerInstances.length);
            }
        }
    }

    static getAllAsArray() {
        return Object.values(this.#allJsPlayers);
    }

    static IsPlayer(id: number) {
        if (!this.#allJsPlayers[id]) {
            return false;
        }
        return true;
    }

    static getRandomJsPlayer() {
        let i = getRandomInt(JsPlayer.playerInstances.length);
        return JsPlayer.playerInstances[i];
    }

    static getValidJsPlayer() {
        //console.log("Besieged getValidJsPlayer: ")

        let aliveAndFreeJSPlayers: mod.Player[] = [];

        let n = JsPlayer.playerInstances.length;
        //console.log("Besieged getValidJsPlayer length: ", n)
        for (let i = 0; i < n; i++) {
            //console.log("Besieged candidate player = ", JsPlayer.get(JsPlayer.playerInstances[i]))
            let candidateJsPlayer = JsPlayer.get(JsPlayer.playerInstances[i], 22);
            if (!candidateJsPlayer) continue;
            if (candidateJsPlayer.isPrisoner == false && mod.GetSoldierState(candidateJsPlayer.player, mod.SoldierStateBool.IsAlive) == true) {
                aliveAndFreeJSPlayers.push(candidateJsPlayer.player);
            }
        }

        if (aliveAndFreeJSPlayers.length > 0) {
            let i = getRandomInt(aliveAndFreeJSPlayers.length);
            let validJsPlayer = aliveAndFreeJSPlayers[i];
            //console.log("Besieged Returning Valid JS Player: ", validJsPlayer)
            return validJsPlayer as mod.Player;
        } else {
            //console.log("Besieged There are no Free & Alive JS Players")
            return null;
        }
    }

    static anyJsPlayersAlive() {
        let anyPlayersStillAlive = false;

        JsPlayer.playerInstances.forEach((player) => {
            let jsPlayer = JsPlayer.get(player, 20);
            if (!jsPlayer) return;
            if (jsPlayer.isPrisoner == false) {
                anyPlayersStillAlive = true;
            }
        });

        if (anyPlayersStillAlive) {
            return true;
        } else {
            return false;
        }
    }

    static resetItemBuysPerRound() {
        for (const index in this.#allJsPlayers) {
            let jsPlayer = this.#allJsPlayers[index];
            jsPlayer.itemBuysPerRound = {};
        }
    }

    createWalletUI() {
        this.playerwalletWidget = ParseUI({
            type: 'Text',
            position: [50, 50],
            size: [400, 40],
            anchor: mod.UIAnchor.TopLeft,
            textLabel: modMessageDebug(playerwallet, this.cash),
            playerId: this.player,
            visible: false,
        });
    }

    openWalletUI() {
        if (!this.playerwalletWidget) return;
        mod.SetUIWidgetVisible(this.playerwalletWidget, true);
    }

    updateWalletUI() {
        if (!this.playerwalletWidget) return;
        mod.SetUITextLabel(this.playerwalletWidget, modMessageDebug(playerwallet, this.cash));
    }

    createHealthUI() {
        this.playerhealthWidget = ParseUI({
            type: 'Text',
            position: [600, 60],
            size: [150, 40],
            anchor: mod.UIAnchor.BottomLeft,
            textLabel: modMessageDebug(healthState, this.currentHealth, this.maxHealth),
            playerId: this.player,
            visible: false,
        });
    }

    openHealthUI() {
        if (!this.playerhealthWidget) return;
        mod.SetUIWidgetVisible(this.playerhealthWidget, true);
    }

    updateHealthUI() {
        if (!this.playerhealthWidget) return;

        let tempMax = Precise(mod.GetSoldierState(this.player, mod.SoldierStateNumber.MaxHealth));
        let tempCurrent = Precise(mod.GetSoldierState(this.player, mod.SoldierStateNumber.CurrentHealth));

        //console.log("Precise:", tempMax, " ", tempCurrent);

        mod.SetUITextLabel(this.playerhealthWidget, modMessageDebug(healthState, tempCurrent, tempMax));
    }

    createPlayerNotificationUI() {
        this.playerNotificationWidget = ParseUI({
            type: 'Text',
            textSize: 54,
            position: [0, 220, 0],
            size: [800, 80],
            anchor: mod.UIAnchor.TopCenter,
            bgColor: [1, 0, 0],
            textLabel: modMessageDebug(youAreInJail),
            playerId: this.player,
        });
    }
}

class LobbyUI {
    #jsPlayer;
    #rootWidget: mod.UIWidget | undefined;

    #containerWidth = 700;
    #containerHeight = 250;
    #lineBreakHeight = 3;
    #backgroundSpacing = 4;
    #activeTabBgColor = [1, 1, 1];

    #lobbyStatusText: mod.UIWidget | undefined;

    #isUIVisible = false;

    constructor(jsPlayer: JsPlayer) {
        this.#jsPlayer = jsPlayer;
    }

    open() {
        if (!this.#rootWidget) this.#create();
        if (!this.#rootWidget) return;
        // this.refresh();
        // this.refilterAttachmentsTab();
        mod.SetUIWidgetVisible(this.#rootWidget, true);
        this.#isUIVisible = true;
    }

    close() {
        if (this.#rootWidget) {
            mod.SetUIWidgetVisible(this.#rootWidget, false);
            this.#isUIVisible = false;
        }
    }

    isOpen() {
        return this.#isUIVisible;
    }

    refresh() {
        if (!this.#lobbyStatusText) return;
        // refresh the lobby status text:
        if (combatCountdownStarted) {
            mod.SetUITextLabel(this.#lobbyStatusText, modMessageDebug('THE BATTLE BEGINS IN {}', combatStartDelayRemaining));
        } else {
            mod.SetUITextLabel(this.#lobbyStatusText, modMessageDebug('{}/{} IN LOBBY - 4 REQUIRED', initialPlayerCount, maximumInitialPlayerCount));
        }
    }

    #create() {
        // background:
        this.#rootWidget = ParseUI({
            type: 'Container',
            size: [this.#containerWidth, this.#containerHeight],
            position: [0, 100],
            anchor: mod.UIAnchor.TopCenter,
            bgFill: mod.UIBgFill.None,
            bgColor: this.#activeTabBgColor,
            bgAlpha: 1,
            playerId: this.#jsPlayer.player,
            children: [
                {
                    // Black Background
                    type: 'Container',
                    position: [0, 0],
                    size: [this.#containerWidth - this.#backgroundSpacing, this.#containerHeight - this.#backgroundSpacing],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [0.1, 0.1, 0.1],
                    bgAlpha: 1,
                },
                {
                // Right Side Gradiant Background
                    type: 'Container',
                    position: [((this.#containerWidth - this.#backgroundSpacing) * .75) , 0],
                    size: [this.#containerWidth / 2, this.#containerHeight - this.#backgroundSpacing],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.GradientLeft,
                    bgColor: [0.1, 0.1, 0.1],
                    bgAlpha: 1,
                },
                {
                // Left Side Gradiant Background
                    type: 'Container',
                    position: [((this.#containerWidth  - this.#backgroundSpacing) * .75) * -1, 0],
                    size: [this.#containerWidth / 2, this.#containerHeight - this.#backgroundSpacing],
                    anchor: mod.UIAnchor.Center,
                    bgFill: mod.UIBgFill.GradientRight,
                    bgColor: [0.1, 0.1, 0.1],
                    bgAlpha: 1,
                },
                {
                    // Line Break Line
                    type: 'Container',
                    position: [0, 100],
                    size: [this.#containerWidth - 50, this.#lineBreakHeight],
                    anchor: mod.UIAnchor.BottomCenter,
                    bgFill: mod.UIBgFill.Solid,
                    bgColor: [1, 1, 1],
                    bgAlpha: 1,
                },
                {
                    // Experience Title Text:
                    type: 'Text',
                    textSize: 128,
                    position: [0, 0, 0],
                    size: [this.#containerWidth, 150],
                    anchor: mod.UIAnchor.TopCenter,
                    textAnchor: mod.UIAnchor.TopCenter,
                    bgAlpha: 0,
                    textColor: [0.957, 0.224, 0],
                    textAlpha: 1,
                    //bgColor: [1, 0, 0],
                    textLabel: modMessageDebug('BESIEGED'),
                },
                // {
                //     // Experience Title Text:
                //     type: 'Text',
                //     textSize: 72,
                //     position: [0, 90, 0],
                //     size: [this.#containerWidth, 150],
                //     anchor: mod.UIAnchor.TopCenter,
                //     textAnchor: mod.UIAnchor.TopCenter,
                //     bgAlpha: 0,
                //     //bgColor: [1, 0, 0],
                //     textLabel: modMessageDebug('PVE HOLDOUT'),
                // },
            ],
        });
        // lobby status text:
        this.#lobbyStatusText = ParseUI({
            type: 'Text',
            parent: this.#rootWidget,
            textSize: 36,
            position: [0, 30, 0],
            size: [this.#containerWidth, 50],
            anchor: mod.UIAnchor.BottomCenter,
            textAnchor: mod.UIAnchor.Center,
            bgAlpha: 0,
            //bgColor: [1, 0, 0],
            textLabel: modMessageDebug('{}/{} IN LOBBY - 4 REQUIRED', initialPlayerCount, maximumInitialPlayerCount),
        });
    }
}

//-----------------------------------------------------------------------------------------------//
// Script Version Widget
//-----------------------------------------------------------------------------------------------//
function CreateScriptVersionUI() {
    // mod.AddUIText("modversion", mod.CreateVector(10, 10, 0), mod.CreateVector(260, 40, 0), mod.UIAnchor.BottomRight, modMessageDebug("Script ver: {}-{}-{}", modversionMonth, modversionDay, modversionMinutes),);
    // modversionWidget = mod.FindUIWidgetWithName("modversion");
    // mod.AddUIText("modversion2", mod.CreateVector(10, 10, 0), mod.CreateVector(260, 40, 0), mod.UIAnchor.BottomRight, modversionWidget, true, 0, mod.CreateVector(10, 10, 0), 0.25, mod.UIBgFill.Solid, modMessageDebug("Script ver: {}-{}-{}", modversionMonth, modversionDay, modversionMinutes), 15, mod.CreateVector(1, 1, 1), 1.0, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI);

    // modversionWidget2 = mod.FindUIWidgetWithName("modversion2");
    const width = 260;
    const height = 40;

    let rootWidget = ParseUI({
        type: 'Container',
        size: [width, height],
        position: [0, 0],
        anchor: mod.UIAnchor.BottomRight,
        bgFill: mod.UIBgFill.None,
        bgColor: [0.1, 0.1, 0.4],
        bgAlpha: 1,
    });
    if (!rootWidget) return;

    // victory text:
    ParseUI({
        type: 'Text',
        parent: rootWidget,
        size: [width, height],
        position: [0, 0],
        anchor: mod.UIAnchor.Center,
        bgFill: mod.UIBgFill.None,
        textAnchor: mod.UIAnchor.Center,
        textLabel: modMessageDebug('Script ver: {}-{}-{}', modversionMonth, modversionDay, modversionMinutes),
        textColor: [0.5, 1, 0.5],
        textSize: 26,
    });

    mod.SetUIWidgetDepth(rootWidget, mod.UIDepth.AboveGameUI);
}

//-----------------------------------------------------------------------------------------------//
// End of Round UI Screen
//-----------------------------------------------------------------------------------------------//

function CreateEndOfRoundUI(allJsPlayersArray: JsPlayer[]) {
    const playerCount = allJsPlayersArray.length;

    // create root container:
    const lineHeight = 35;
    const width = 1000;
    const height = Math.max(600, playerCount * lineHeight);
    let rootWidget = ParseUI({
        type: 'Container',
        size: [width, height],
        position: [0, 0],
        anchor: mod.UIAnchor.Center,
        bgFill: mod.UIBgFill.Blur,
        bgColor: [0.1, 0.1, 0.4],
        bgAlpha: 1,
    });

    // victory text:
    ParseUI({
        type: 'Text',
        parent: rootWidget,
        size: [500, 50],
        position: [0, -100],
        anchor: mod.UIAnchor.TopCenter,
        bgFill: mod.UIBgFill.None,
        textAnchor: mod.UIAnchor.Center,
        textLabel: scoreboard.victory,
        textColor: [0.5, 1, 0.5],
        textSize: 150,
    });

    // fill in the table:
    BuildGrid({
        parent: rootWidget,
        cols: 5,
        colWidth: [490, 200, 100, 100, 100],
        rows: playerCount + 1,
        rowHeight: lineHeight,
        cellSpacing: 2,
        cellDataCallback: (row: number, col: number, data: any) => {
            if (row == 0) GetScoreboardLineHeader(col, data);
            else GetScoreboardLinePlayer(allJsPlayersArray[row - 1], col, data);
        },
    });

    return rootWidget;
}

function GetScoreboardLineHeader(col: number, data: any) {
    data.type = 'Text';
    data.textSize = 30;
    data.textAnchor = mod.UIAnchor.Center;
    switch (col) {
        case 0:
            data.textLabel = scoreboard.nameHeader;
            data.textAnchor = mod.UIAnchor.CenterLeft;
            break;
        case 1:
            data.textLabel = scoreboard.cashHeader;
            break;
        case 2:
            data.textLabel = scoreboard.killsHeader;
            break;
        case 3:
            data.textLabel = scoreboard.deathsHeader;
            break;
        case 4:
            data.textLabel = scoreboard.incarcerationsHeader;
            break;
    }
}

function GetScoreboardLinePlayer(jsPlayer: JsPlayer, col: number, data: any) {
    data.type = 'Text';
    data.bgFill = mod.UIBgFill.Solid;
    data.bgColor = [1, 1, 1];
    data.bgAlpha = 0.1;
    data.textSize = 20;
    data.textAnchor = mod.UIAnchor.Center;
    if (col == 0) {
        // player name:
        data.textLabel = modMessageDebug(scoreboard.nameFmt, jsPlayer.player);
        data.textAnchor = mod.UIAnchor.CenterLeft;
    }
    if (col == 1) {
        // player cash:
        data.textLabel = modMessageDebug(scoreboard.cashFmt, jsPlayer.totalCashEarned);
    }
    if (col == 2) {
        // player kills:
        data.textLabel = modMessageDebug(scoreboard.killsFmt, jsPlayer.kills);
    }
    if (col == 3) {
        // player deaths:
        data.textLabel = modMessageDebug(scoreboard.deathsFmt, jsPlayer.deaths);
    }
    if (col == 4) {
        // player incarcerations:
        data.textLabel = modMessageDebug(scoreboard.incarcerationsFmt, jsPlayer.timesIncarcerated);
    }
}

//-----------------------------------------------------------------------------------------------//
// Generic helper function to create a UI grid.
//-----------------------------------------------------------------------------------------------//

// let gridData = {
//     parent: null,
//     cols: 3,
//     colWidth: [100, 200, 300],
//     rows: 5,
//     rowHeight: 50,
//     cellSpacing: 2,
//     cellDataCallback: (row, col, data) => {
//         // data is a template {} def for a container widget, modify it to create text/img as needed.
//     }
// };

// get a dimension that could be:
// - single number
// - array of numbers
// - function(idx) that returns a number
function __getGridDimension(dimension: any, idx: number) {
    if (Array.isArray(dimension)) return dimension[idx % dimension.length];
    if (typeof dimension === 'function') return dimension(idx);
    return dimension;
}

function BuildGrid(params: any) {
    let cols = params.cols ?? 1;
    let rows = params.rows ?? 1;
    let cellSpacing = params.cellSpacing ?? 0;

    let y = 0;
    for (let row = 0; row < rows; row++) {
        let x = 0;
        const rowHeight = __getGridDimension(params.rowHeight ?? 100, row);
        for (let col = 0; col < cols; col++) {
            const colWidth = __getGridDimension(params.colWidth ?? 100, col);
            let cellData = {
                type: 'Container',
                parent: params.parent,
                size: [colWidth, rowHeight],
                position: [x, y],
            };
            // validate the params:
            params.cellDataCallback?.(row, col, cellData);
            // build it:
            ParseUI(cellData);

            x += colWidth + cellSpacing;
        }
        y += rowHeight + cellSpacing;
    }
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//
// Helper functions to create UI from a JSON object tree:
//-----------------------------------------------------------------------------------------------//

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
    weapon: mod.Weapons;
    weaponPackage: mod.WeaponPackage;
    visibility: mod.Player;
    gadget: mod.Gadgets;
}

function __asModVector(param: number[] | mod.Vector) {
    if (Array.isArray(param)) return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
    else return param;
}

function __asModMessage(param: string | mod.Message) {
    if (typeof param === 'string') return mod.Message(param);
    return param;
}

function __fillInDefaultArgs(params: UIParams) {
    if (!params.hasOwnProperty('name')) params.name = '';
    if (!params.hasOwnProperty('position')) params.position = mod.CreateVector(0, 0, 0);
    if (!params.hasOwnProperty('size')) params.size = mod.CreateVector(100, 100, 0);
    if (!params.hasOwnProperty('anchor')) params.anchor = mod.UIAnchor.TopLeft;
    if (!params.hasOwnProperty('parent')) params.parent = mod.GetUIRoot();
    if (!params.hasOwnProperty('visible')) params.visible = true;
    if (!params.hasOwnProperty('padding')) params.padding = params.type == 'Container' ? 0 : 8;
    if (!params.hasOwnProperty('bgColor')) params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('bgAlpha')) params.bgAlpha = 0.5;
    if (!params.hasOwnProperty('bgFill')) params.bgFill = mod.UIBgFill.Solid;
}

function __setNameAndGetWidget(uniqueName: any, params: any) {
    let widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
    mod.SetUIWidgetName(widget, params.name);
    return widget;
}

const __cUniqueName = '----uniquename----';

function __addUIContainer(params: UIParams) {
    __fillInDefaultArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIContainer(
            __cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill,
            restrict
        );
    } else {
        mod.AddUIContainer(
            __cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.parent,
            params.visible,
            params.padding,
            __asModVector(params.bgColor),
            params.bgAlpha,
            params.bgFill
        );
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
    if (!params.hasOwnProperty('textLabel')) params.textLabel = '';
    if (!params.hasOwnProperty('textSize')) params.textSize = 0;
    if (!params.hasOwnProperty('textColor')) params.textColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('textAlpha')) params.textAlpha = 1;
    if (!params.hasOwnProperty('textAnchor')) params.textAnchor = mod.UIAnchor.CenterLeft;
}

function __addUIText(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultTextArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIText(
            __cUniqueName,
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
            restrict
        );
    } else {
        mod.AddUIText(
            __cUniqueName,
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
            params.textAnchor
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultImageArgs(params: any) {
    if (!params.hasOwnProperty('imageType')) params.imageType = mod.UIImageType.None;
    if (!params.hasOwnProperty('imageColor')) params.imageColor = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('imageAlpha')) params.imageAlpha = 1;
}

function __fillInDefaultWeaponImageArgs(params: any) {
    // if (!params.hasOwnProperty('weapon')) params.imageType = mod.UIImageType.None;
    // if (!params.hasOwnProperty('weaponPackage')) params.imageColor = mod.CreateVector(1, 1, 1);
    // if (!params.hasOwnProperty('visibility')) params.visibility = mod.Vector;
}

function __fillInDefaultGadgetImageArgs(params: any) {
    // if (!params.hasOwnProperty('weapon')) params.imageType = mod.UIImageType.None;
    // if (!params.hasOwnProperty('weaponPackage')) params.imageColor = mod.CreateVector(1, 1, 1);
    // if (!params.hasOwnProperty('visibility')) params.visibility = mod.Vector;
}

function __addUIImage(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultImageArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIImage(
            __cUniqueName,
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
            restrict
        );
    } else {
        mod.AddUIImage(
            __cUniqueName,
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
            params.imageAlpha
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __addWeaponUIImage(params: UIParams) {
    console.log("Running Add Weapon UI Image")
    __fillInDefaultArgs(params);
    //__fillInDefaultWeaponImageArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        //console.log("Running Add Weapon UI Image - Restrict")
        mod.AddUIWeaponImage(
            "nameOfThing",
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.weapon,
            params.parent,
            params.weaponPackage,
            //params.visibility,
        );
    } else {
        //console.log("Running Add Weapon UI Image - Not Restrict")
        mod.AddUIWeaponImage(
            __cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.weapon,
            params.parent,
            params.weaponPackage,
            //params.visibility,
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __addGadgetUIImage(params: UIParams) {
    //console.log("Running Add Gadget UI Image")
    __fillInDefaultArgs(params);
    //__fillInDefaultWeaponImageArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        //console.log("Running Add Gadget UI Image - Restrict")
        mod.AddUIGadgetImage(
            "nameOfThing",
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.gadget,
            params.parent,
            //params.weaponPackage,
            //params.visibility,
        );
    } else {
        //console.log("Running Add Gadget UI Image - Not Restrict")
        mod.AddUIGadgetImage(
            __cUniqueName,
            __asModVector(params.position),
            __asModVector(params.size),
            params.anchor,
            params.gadget,
            params.parent,
            //params.weaponPackage,
            //params.visibility,
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __fillInDefaultArg(params: any, argName: any, defaultValue: any) {
    if (!params.hasOwnProperty(argName)) params[argName] = defaultValue;
}

function __fillInDefaultButtonArgs(params: any) {
    if (!params.hasOwnProperty('buttonEnabled')) params.buttonEnabled = true;
    if (!params.hasOwnProperty('buttonColorBase')) params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
    if (!params.hasOwnProperty('buttonAlphaBase')) params.buttonAlphaBase = 1;
    if (!params.hasOwnProperty('buttonColorDisabled')) params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
    if (!params.hasOwnProperty('buttonAlphaDisabled')) params.buttonAlphaDisabled = 0.5;
    if (!params.hasOwnProperty('buttonColorPressed')) params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
    if (!params.hasOwnProperty('buttonAlphaPressed')) params.buttonAlphaPressed = 1;
    if (!params.hasOwnProperty('buttonColorHover')) params.buttonColorHover = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaHover')) params.buttonAlphaHover = 1;
    if (!params.hasOwnProperty('buttonColorFocused')) params.buttonColorFocused = mod.CreateVector(1, 1, 1);
    if (!params.hasOwnProperty('buttonAlphaFocused')) params.buttonAlphaFocused = 1;
}

function __addUIButton(params: UIParams) {
    __fillInDefaultArgs(params);
    __fillInDefaultButtonArgs(params);
    let restrict = params.teamId ?? params.playerId;
    if (restrict) {
        mod.AddUIButton(
            __cUniqueName,
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
            __asModVector(params.buttonColorBase),
            params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled),
            params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed),
            params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover),
            params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused),
            params.buttonAlphaFocused,
            restrict
        );
    } else {
        mod.AddUIButton(
            __cUniqueName,
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
            __asModVector(params.buttonColorBase),
            params.buttonAlphaBase,
            __asModVector(params.buttonColorDisabled),
            params.buttonAlphaDisabled,
            __asModVector(params.buttonColorPressed),
            params.buttonAlphaPressed,
            __asModVector(params.buttonColorHover),
            params.buttonAlphaHover,
            __asModVector(params.buttonColorFocused),
            params.buttonAlphaFocused
        );
    }
    return __setNameAndGetWidget(__cUniqueName, params);
}

function __addUIWidget(params: UIParams) {
    if (params == null) return undefined;
    if (params.type == 'Container') return __addUIContainer(params);
    else if (params.type == 'Text') return __addUIText(params);
    else if (params.type == 'Image') return __addUIImage(params);
    else if (params.type == 'Button') return __addUIButton(params);
    else if (params.type == 'WeaponImage') return __addWeaponUIImage(params);
    else if (params.type == 'GadgetImage') return __addGadgetUIImage(params);
    return undefined;
}

export function ParseUI(...params: any[]) {
    let widget: mod.UIWidget | undefined;
    for (let a = 0; a < params.length; a++) {
        widget = __addUIWidget(params[a] as UIParams);
    }
    return widget;
}

//-----------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------//

// Replace these for debugging purposes

async function OnGameModeStartedDebug() {}

async function PurchasePhaseOpenDebug(player: mod.Player) {}
