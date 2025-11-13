export const VictoryWidgetDefinition = {
  name: "Container_Victory",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: true,
  padding: 0,
  bgColor: [0.0745, 0.1843, 0.2471],
  bgAlpha: 0.8,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_VictoryTitle",
      type: "Text",
      position: [0, -26.3],
      size: [1000, 110.61],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_VictoryTitle,
      textColor: [0.4392, 0.9216, 1],
      textAlpha: 1,
      textSize: 100,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_VictoryDescription",
      type: "Text",
      position: [0, 62.9],
      size: [819.26, 70],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_VictoryDescription,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 35,
      textAnchor: mod.UIAnchor.Center
    }
  ]
};
