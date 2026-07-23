const PORTAL_POSITION = [-37.0, 32.629, 0.0];
const HUE_SPEED = 0.15;
const PORTAL_RADIUS = 1.5;
let portalEnabled = false;

const DELTA = 0.3;
let tick = 0;

let nightModeEnabled = false;

let morningSound: mod.SFX;
let nightSound: mod.SFX;

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            return [v, t, p];
        case 1:
            return [q, v, p];
        case 2:
            return [p, v, t];
        case 3:
            return [p, q, v];
        case 4:
            return [t, p, v];
        default:
            return [v, p, q];
    }
}

export function OngoingGlobal() {
    if (portalEnabled) {
        tick += DELTA;

        let newSparksPos = mod.CreateVector(
            PORTAL_POSITION[0],
            PORTAL_POSITION[1] + PORTAL_RADIUS + Math.sin(tick) * PORTAL_RADIUS,
            PORTAL_POSITION[2] + Math.cos(tick) * PORTAL_RADIUS
        );
        mod.MoveVFX(mod.GetVFX(100), newSparksPos, mod.CreateVector(0, 0, 0));

        // rgb disco
        const hue = (tick * HUE_SPEED) % 1;
        const [r, g, b] = hsvToRgb(hue, 1, 1);
        mod.SetVFXColor(mod.GetVFX(100), mod.CreateVector(r, g, b));
    }
}

export async function OnPlayerDeployed(player: mod.Player) {
    if (nightModeEnabled) {
        console.log('LOG> Adding NVG for player: ', mod.GetObjId(player));
        mod.AddEquipment(player, mod.Gadgets.Mask_NVG);
    }
}

export async function OnGameModeStarted() {
    console.log('Running Mod Script');
    console.log('Log> OnGameModeStarted');

    // Set Morning Sound and Night Sound from spatial object IDs
    morningSound = mod.GetSFX(200);
    nightSound = mod.GetSFX(201);

    // Enable and set Sparks FX to right speed and scale
    portalEnabled = true;
    mod.SetVFXSpeed(mod.GetVFX(100), 0.5);
    mod.SetVFXScale(mod.GetVFX(100), 3.0);
    mod.EnableVFX(mod.GetVFX(100), true);

    // Start with playing the morningSound
    mod.PlaySound(morningSound, 0.5);
}

export function OnPlayerEnterAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger) {
    if (mod.GetObjId(areaTrigger) == 101) {
        mod.EnableScreenEffect(player, mod.ScreenEffects.Night, !nightModeEnabled);

        if (nightModeEnabled) {
            console.log('Log> Switching to Day-time for player ', mod.GetObjId(player));
            mod.RemoveEquipment(player, mod.Gadgets.Mask_NVG);
            mod.StopSound(nightSound);
            mod.PlaySound(morningSound, 0.5);
        } else {
            console.log('Log> Switching to Night-time for player ', mod.GetObjId(player));
            mod.AddEquipment(player, mod.Gadgets.Mask_NVG);
            mod.StopSound(morningSound);
            mod.PlaySound(nightSound, 0.1);
        }

        nightModeEnabled = !nightModeEnabled;
    }
}
