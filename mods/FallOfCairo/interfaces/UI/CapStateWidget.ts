export const CapStateWidgetDefinition = {
  name: "Container_CapState",
  type: "Container",
  position: [0, 0],
  size: [3840, 150],
  anchor: mod.UIAnchor.TopCenter,
  visible: false,
  padding: 0,
  bgColor: [0.2, 0.2, 0.2],
  bgAlpha: 0,
  bgFill: mod.UIBgFill.None,
  children: [
    {
      name: "Text_CapState_Header",
      type: "Text",
      position: [0, 46],
      size: [400, 24],
      anchor: mod.UIAnchor.TopCenter,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_CapState_Header,
      textColor: [0.6549, 0.7216, 0.7529],
      textAlpha: 1,
      textSize: 18,
      textAnchor: mod.UIAnchor.Center
    },
    {
      name: "Box_CapState_Background",
      type: "Container",
      position: [0, 75],
      size: [300, 25],
      anchor: mod.UIAnchor.TopCenter,
      visible: true,
      padding: 0,
      bgColor: [0.0314, 0.0431, 0.0431],
      bgAlpha: 0.3,
      bgFill: mod.UIBgFill.Blur,
      children: [
        {
          name: "Box_CapState_ForeGround",
          type: "Container",
          position: [0, 0],
          size: [0, 25],
          anchor: mod.UIAnchor.CenterLeft,
          visible: true,
          padding: 0,
          bgColor: [1, 0.5137, 0.3804],
          bgAlpha: 0,
          bgFill: mod.UIBgFill.Blur
        }
      ]
    },
    {
      name: "Text_CapState_Status",
      type: "Text",
      position: [0, 104],
      size: [400, 26],
      anchor: mod.UIAnchor.TopCenter,
      visible: true,
      padding: 0,
      bgColor: [0.2, 0.2, 0.2],
      bgAlpha: 1,
      bgFill: mod.UIBgFill.None,
      textLabel: mod.stringkeys.Text_CapState_Status,
      textColor: [0.4392, 0.9216, 1],
      textAlpha: 1,
      textSize: 22,
      textAnchor: mod.UIAnchor.Center
    }
  ]
}
