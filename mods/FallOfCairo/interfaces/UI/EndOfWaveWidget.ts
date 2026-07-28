export const EndOfWaveWidgetDefinition = {
  name: "Container_EndOfWave",
  type: "Container",
  position: [0, -260],
  size: [900, 150],
  anchor: mod.UIAnchor.Center,
  visible: false,
  padding: 0,
  bgColor: [0.0745, 0.1843, 0.2471],
  bgAlpha: 0.75,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_EndOfWave_Title",
      type: "Text",
      position: [0, -28],
      size: [860, 70],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_EndOfWave_Title,
      textColor: [0.4392, 0.9216, 1],
      textAlpha: 1,
      textSize: 60,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_EndOfWave_Subtitle",
      type: "Text",
      position: [0, 34],
      size: [860, 45],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_EndOfWave_Subtitle,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 26,
      textAnchor: mod.UIAnchor.Center
    }
  ]
}
