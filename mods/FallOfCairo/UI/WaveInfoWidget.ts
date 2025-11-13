export const WaveInfoWidgetDefinition = modlib.ParseUI({
  name: "Container_WaveInfo",
  type: "Container",
  position: [25, 25],
  size: [400, 104],
  anchor: mod.UIAnchor.TopLeft,
  visible: true,
  padding: 5,
  bgColor: [0.2118, 0.2235, 0.2353],
  bgAlpha: 0.2,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_WaveInfo_waveNumber",
      type: "Text",
      position: [15, 10],
      size: [150, 50],
      anchor: mod.UIAnchor.TopLeft,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.waveNumberInit,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 24,
      textAnchor: mod.UIAnchor.CenterLeft
    },
    {
      name: "Text_WaveInfo_WaveDetails",
      type: "Text",
      position: [15, 50],
      size: [390, 35],
      anchor: mod.UIAnchor.TopLeft,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.waveDetailsInit,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 20,
      textAnchor: mod.UIAnchor.CenterLeft
    }
  ]
});
