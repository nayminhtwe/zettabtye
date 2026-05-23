export const GILL_SANS_FAMILY = "GillSans";

/**
 * Maps design font-weight to the loaded Gill Sans face.
 * With a single .ttc, all weights use the same family; add separate
 * .ttf files (Regular, SemiBold, Bold) and register them in useAppFonts
 * for correct weights on Android TV.
 */
export function gillSans(weight = "400") {
  const w = String(weight);

  if (w === "600" || w === "semibold") {
    return { fontFamily: "GillSans-SemiBold" };
  }

  if (w === "700" || w === "bold") {
    return { fontFamily: "GillSans-Bold" };
  }

  // 400, 500, and default
  return { fontFamily: GILL_SANS_FAMILY };
}
