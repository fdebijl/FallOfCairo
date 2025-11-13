export const DefeatWidgetDefinition = {
  name: "Container_Defeat",
  type: "Container",
  position: [0, 0],
  size: [3840, 500],
  anchor: mod.UIAnchor.Center,
  visible: true,
  padding: 0,
  bgColor: [0.251, 0.0941, 0.0667],
  bgAlpha: 0.8,
  bgFill: mod.UIBgFill.Blur,
  children: [
    {
      name: "Text_DefeatTitle",
      type: "Text",
      position: [0, -26.3],
      size: [1000, 110.61],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_DefeatTitle,
      textColor: [1, 0.5137, 0.3804],
      textAlpha: 1,
      textSize: 100,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Text_DefeatDescription",
      type: "Text",
      position: [0, 62.9],
      size: [819.26, 70],
      anchor: mod.UIAnchor.Center,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_DefeatDescription,
      textColor: [1, 1, 1],
      textAlpha: 1,
      textSize: 35,
      textAnchor: mod.UIAnchor.Center
    }
  ]
}
