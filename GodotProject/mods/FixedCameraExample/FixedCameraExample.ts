export async function OnGameModeStarted()
{
    CreateUI();
    StartStreetCamera();
    StartFlyThroughCamera();
}

export async function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent)
{
    // To use FixedCameras, place them in Godot and use SetCameraTypeForPlayer or SetCameraTypeForAll in script or Blockly.
    // The index parameter corresponds to the ObjId that's set on the FixedCamera placed in Godot.
    switch (mod.GetUIWidgetName(eventUIWidget)) {
        case "StreetButton":
            mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Fixed, 0);
            break;
        case "HQ1Button":
            mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Fixed, 1);
            break;
        case "HQ2Button":
            mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Fixed, 2);
            break;
        case "FlyThroughButton":
            mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.Fixed, 3);
            break;
        case "ReturnButton":
            mod.SetCameraTypeForPlayer(eventPlayer, mod.Cameras.FirstPerson);
            break;
    }
}

function StartStreetCamera()
{
    // FixedCameras can be moved and rotated like other spatial objects, just grab them using GetFixedCamera and pass in the ObjId set in Godot.
    // The position is networked for all players, so every player using this camera will see the same thing.
    mod.MoveObjectOverTime(mod.GetFixedCamera(0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, -90, 0), 10, true, true);
}

async function StartFlyThroughCamera()
{
    while (true)
    {
        mod.SetObjectTransform(mod.GetFixedCamera(3), mod.CreateTransform(mod.CreateVector(-1000, 145, 154), mod.CreateVector(mod.DegreesToRadians(10), 0, 0)));
        await mod.Wait(0.5);
        mod.SetObjectTransformOverTime(mod.GetFixedCamera(3), mod.CreateTransform(mod.CreateVector(-1050, 140, 216), mod.CreateVector(mod.DegreesToRadians(18), mod.DegreesToRadians(54), 0)), 10, false, false);
        await mod.Wait(10);
        mod.SetObjectTransformOverTime(mod.GetFixedCamera(3), mod.CreateTransform(mod.CreateVector(-944, 140, 291), mod.CreateVector(mod.DegreesToRadians(12), mod.DegreesToRadians(-155), 0)), 10, false, false);
        await mod.Wait(10);
        mod.SetObjectTransformOverTime(mod.GetFixedCamera(3), mod.CreateTransform(mod.CreateVector(-1000, 145, 154), mod.CreateVector(mod.DegreesToRadians(10), 0, 0)), 10, false, false);
        await mod.Wait(10);
    }
}

function CreateUI()
{
    mod.AddUIContainer("HQ1Container", mod.CreateVector(100.0, 100.0, 0.0), mod.CreateVector(100, 50, 50), mod.UIAnchor.TopRight);
    const hq1Container = mod.FindUIWidgetWithName("HQ1Container");
    AddCameraUIButton("HQ1", hq1Container);
    AddCameraUIText("HQ1", hq1Container);

    mod.AddUIContainer("HQ2Container", mod.CreateVector(100.0, 175.0, 0.0), mod.CreateVector(100, 50, 50), mod.UIAnchor.TopRight);
    const hq2Container = mod.FindUIWidgetWithName("HQ2Container");
    AddCameraUIButton("HQ2", hq2Container);
    AddCameraUIText("HQ2", hq2Container);

    mod.AddUIContainer("StreetContainer", mod.CreateVector(100.0, 250.0, 0.0), mod.CreateVector(100, 50, 50), mod.UIAnchor.TopRight);
    const streetContainer = mod.FindUIWidgetWithName("StreetContainer");
    AddCameraUIButton("Street", streetContainer);
    AddCameraUIText("Street", streetContainer);

    mod.AddUIContainer("FlyThroughContainer", mod.CreateVector(100.0, 325.0, 0.0), mod.CreateVector(100, 50, 50), mod.UIAnchor.TopRight);
    const flyThroughContainer = mod.FindUIWidgetWithName("FlyThroughContainer");
    AddCameraUIButton("FlyThrough", flyThroughContainer);
    AddCameraUIText("FlyThrough", flyThroughContainer);

    mod.AddUIContainer("ReturnContainer", mod.CreateVector(100.0, 400.0, 0.0), mod.CreateVector(100, 50, 50), mod.UIAnchor.TopRight);
    const returnContainer = mod.FindUIWidgetWithName("ReturnContainer");
    AddCameraUIButton("Return", returnContainer);
    AddCameraUIText("Return", returnContainer);
}

function AddCameraUIButton(name: string, parent: mod.UIWidget)
{
    mod.AddUIButton(
        name + "Button" /* name */,
        mod.CreateVector(0, 0, 0) /* position */,
        mod.CreateVector(100, 50, 50) /* size */,
        mod.UIAnchor.Center /* anchor */,
        parent /* parent */,
        true /* visible */,
        0 /* padding */,
        mod.CreateVector(0, 0, 0) /* bgColor */,
        1 /* bgAlpha */,
        mod.UIBgFill.Solid /* bgFill */,
        true /* buttonEnabled */,
        mod.CreateVector(0.8, 0.8, 0.8) /* baseColor */,
        0.5 /* baseAlpha */,
        mod.CreateVector(0.3, 0.3, 0.3) /* disabledColor */,
        1 /* disabledAlpha */,
        mod.CreateVector(0.8, 0.8, 0.8) /* pressedColor */,
        1 /* pressedAlpha */,
        mod.CreateVector(0.6, 0.6, 0.6) /* hoverColor */,
        1 /* hoverAlpha */,
        mod.CreateVector(1, 1, 1) /* focusedColor */,
        1 /* focusedAlpha */
    );
}

function AddCameraUIText(name: string, parent: mod.UIWidget)
{
    mod.AddUIText(
        name + "Text" /* name */,
        mod.CreateVector(0, 0, 0) /* position */,
        mod.CreateVector(100, 50, 50) /* size */,
        mod.UIAnchor.Center /* anchor */,
        parent /* parent */,
        true /* visible */,
        0 /* padding */,
        mod.CreateVector(1, 1, 1) /* bgColor */,
        0 /* bgAlpha */,
        mod.UIBgFill.None /* bgFill */,
        mod.Message(name) /* message */,
        12 /* textSize */,
        mod.CreateVector(1, 1, 1) /* textColor */,
        1 /* textAlpha */,
        mod.UIAnchor.Center /* textAnchor */
    );
}
