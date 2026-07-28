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
      name: "Box_CapState_Background",
      type: "Container",
      position: [0, 75],
      size: [300, 50],
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
          size: [0, 50],
          anchor: mod.UIAnchor.CenterLeft,
          visible: true,
          padding: 0,
          bgColor: [1, 0.5137, 0.3804],
          bgAlpha: 0,
          bgFill: mod.UIBgFill.Blur
        }
      ]
    }
  ]
}
