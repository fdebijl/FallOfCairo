import * as modmap from './modsim';
export {
    AddPlayer,
    DeployPlayer,
    AllLevelObjects,
    GetInteractPoints,
    KillPlayer,
    LoadLevel,
    Loop,
    StartGameMode,
    RemovePlayer,
    Reset,
    WaitTimeout,
    SendPlayerUIButtonEvent,
    SetStrings,
    UIImageTypeToString,
    UIWidget,
    ModObject,
    PrefabObject,
    DumpUITree,
    aiSpawns,
    uiRoot,
    ArmMCOM,
    SIM_TICK_TIME
} from './modsim';
export { modmap };

globalThis.mod = modmap as any;
