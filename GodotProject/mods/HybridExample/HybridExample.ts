import * as modlib from "modlib";

console.log("Loading Hybrid script ...");

export function Log(msg1: string, msg2: string) {
    console.log(`${msg1} ${msg2}`);
}

export function LogArray(a: any, unused: unknown) {
    const arrayLen = mod.CountOf(a);
    for (let i = 0; i < arrayLen; i++) {
        const value = mod.ValueInArray(a, i);
        console.log(`[${i}]: ${value}`);
    }
}

export function InitUI(ignore1: unknown, ignore2: unknown) {
    console.log("Initializing UI...");
    modlib.ParseUI(
        {
            name: "Greeting",
            type: "Text",
            position: [650, 500],
            size: [100, 50],
            anchor: mod.UIAnchor.TopLeft,
            visible: true,
            padding: 0,
            bgColor: [0.2, 0.2, 0.2],
            bgAlpha: 1,
            bgFill: mod.UIBgFill.None,
            textLabel: mod.stringkeys.Greeting,
            textColor: [1, 1, 1],
            textAlpha: 1,
            textSize: 24,
            textAnchor: mod.UIAnchor.Center
        }
    );
}

let appendVar: any = mod.EmptyArray();

function Append(Item: string) {
    appendVar = mod.AppendToArray(appendVar, Item);
}

export function UniqueID1() {
    appendVar = mod.EmptyArray();
    for (let i = 1; i <= 128; i++) {
        Append(String(i));
    }
    return appendVar;
}

export function UniqueID2() {
    appendVar = mod.EmptyArray();
    for (let i = 129; i <= 256; i++) {
        Append(String(i));
    }
    return appendVar;
}

export function SectorUI() {
    appendVar = mod.EmptyArray();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < alphabet.length; i++) {
        Append(alphabet[i]);
    }
    return appendVar;
}

export function Atan2(y: number, x: number) {
    return Math.atan2(y, x);
}

export function GetString(key: string) {
    return mod.strings[key] || 'undefined';
}

export function SplitString(str: string, delimiter: string) {
    appendVar = mod.EmptyArray();
    const parts = str.split(delimiter);
    for (const part of parts) {
        Append(part);
    }
    return appendVar;
}
