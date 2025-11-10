export function IsObjectIDsEqual(left: any, right: any) {
  if (left == undefined || right == undefined) {
    return false
  }

  return mod.GetObjId(left) == mod.GetObjId(right)
}
