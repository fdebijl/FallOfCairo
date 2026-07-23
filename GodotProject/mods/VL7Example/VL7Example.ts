const CLOUD_VFX_ID = 1;
const CLOUD_SCREEN_FX_ID = 2;
const CLOUD_SOLDIER_FX_ID = 3;
const SCREEN_FX_ID = 4;
const SOLIDER_FX_ID = 5;

let vl7cScreenEffect = true;
let vl7cSoldierEffect = true;
let vl7cVisualEffect = true;

let sScreenEffect = false;
let sSoldierEffect = false;

const ICON_COLOR_VECTOR_TRUE = mod.CreateVector(0, 1, 0);
const ICON_COLOR_VECTOR_FALSE = mod.CreateVector(1, 0, 0);

export function OnPlayerDeployed(player: mod.Player): void {
    const players = mod.AllPlayers();
    const n = mod.CountOf(players);
    console.log('LOG> OnPlayerDeployed: player: ', mod.GetObjId(player), ' Count of Players: ', n);

    if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
        console.log('LOG> Found a player: ', mod.GetObjId(player));

        mod.AddEquipment(player, mod.Gadgets.Mask_Gas);

        mod.EnableScreenEffect(player, mod.ScreenEffects.VL7, sScreenEffect);
        mod.SetSoldierEffect(player, mod.SoldierEffects.VL7Effect, sSoldierEffect);
    }
}

export function OnGameModeStarted(): void {
    console.log('Running Mod Script Dated: 2025-02-27 13:28:44.889481');
    console.log('Log> OnGameModeStarted');

    mod.SetVL7CloudEffects(mod.GetVL7Cloud(1), vl7cScreenEffect, vl7cSoldierEffect, vl7cVisualEffect);
    mod.SetVL7CloudEffects(mod.GetVL7Cloud(2), vl7cScreenEffect, vl7cSoldierEffect, vl7cVisualEffect);

    mod.SetWorldIconColor(mod.GetWorldIcon(SOLIDER_FX_ID), sSoldierEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    mod.SetWorldIconColor(mod.GetWorldIcon(SCREEN_FX_ID), sScreenEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    mod.SetWorldIconColor(mod.GetWorldIcon(CLOUD_SCREEN_FX_ID), vl7cScreenEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    mod.SetWorldIconColor(mod.GetWorldIcon(CLOUD_SOLDIER_FX_ID), vl7cSoldierEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    mod.SetWorldIconColor(mod.GetWorldIcon(CLOUD_VFX_ID), vl7cVisualEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);

    mod.SetWorldIconText(mod.GetWorldIcon(SOLIDER_FX_ID), mod.Message('Toggle Soldier Effects'));
    mod.SetWorldIconText(mod.GetWorldIcon(SCREEN_FX_ID), mod.Message('Toggle Screen Effects'));
    mod.SetWorldIconText(mod.GetWorldIcon(CLOUD_SCREEN_FX_ID), mod.Message('Toggle GasCloud Screen Effects'));
    mod.SetWorldIconText(mod.GetWorldIcon(CLOUD_SOLDIER_FX_ID), mod.Message('Toggle GasCloud Soldier Effects'));
    mod.SetWorldIconText(mod.GetWorldIcon(CLOUD_VFX_ID), mod.Message('Toggle GasCloud Visual Effects'));
}

export function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint): void {
    if (mod.GetObjId(interactPoint) === SOLIDER_FX_ID) {
        sSoldierEffect = !sSoldierEffect;
        mod.SetWorldIconColor(mod.GetWorldIcon(SOLIDER_FX_ID), sScreenEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
        mod.SetSoldierEffect(player, mod.SoldierEffects.VL7Effect, sSoldierEffect);
        return;
    }
    if (mod.GetObjId(interactPoint) === SCREEN_FX_ID) {
        sScreenEffect = !sScreenEffect;
        mod.SetWorldIconColor(mod.GetWorldIcon(SCREEN_FX_ID), sScreenEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
        mod.EnableScreenEffect(player, mod.ScreenEffects.VL7, sScreenEffect);
        return;
    }
    if (mod.GetObjId(interactPoint) === CLOUD_SCREEN_FX_ID) {
        vl7cScreenEffect = !vl7cScreenEffect;
        mod.SetWorldIconColor(mod.GetWorldIcon(CLOUD_SCREEN_FX_ID), vl7cScreenEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    }
    if (mod.GetObjId(interactPoint) === CLOUD_SOLDIER_FX_ID) {
        vl7cSoldierEffect = !vl7cSoldierEffect;
        mod.SetWorldIconColor(mod.GetWorldIcon(CLOUD_SOLDIER_FX_ID), vl7cSoldierEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    }
    if (mod.GetObjId(interactPoint) === CLOUD_VFX_ID) {
        vl7cVisualEffect = !vl7cVisualEffect;
        mod.SetWorldIconColor(mod.GetWorldIcon(CLOUD_VFX_ID), vl7cVisualEffect ? ICON_COLOR_VECTOR_TRUE : ICON_COLOR_VECTOR_FALSE);
    }
    mod.SetVL7CloudEffects(mod.GetVL7Cloud(1), vl7cScreenEffect, vl7cSoldierEffect, vl7cVisualEffect);
    mod.SetVL7CloudEffects(mod.GetVL7Cloud(2), vl7cScreenEffect, vl7cSoldierEffect, vl7cVisualEffect);
}

export function OnPlayerEnterVL7Cloud(player: mod.Player, vl7Cloud: mod.VL7Cloud): void {
    console.log('Log> Player (', mod.GetObjId(player), ') Entered VL7Cloud (', mod.GetObjId(vl7Cloud), ')');
}

export function OnPlayerExitVL7Cloud(player: mod.Player, vl7Cloud: mod.VL7Cloud): void {
    console.log('Log> Player (', mod.GetObjId(player), ') Exited VL7Cloud (', mod.GetObjId(vl7Cloud), ')');
}
