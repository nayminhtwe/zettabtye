import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SCREEN_BOTTOM_PADDING = 24;

function resolveBottomInset(insets) {
  if (insets.bottom > 0) {
    return insets.bottom;
  }

  // Edge-to-edge Android can report 0 before window insets settle.
  return Platform.OS === "android" ? 20 : 0;
}

export function useScreenInsets(contentPadding = SCREEN_BOTTOM_PADDING) {
  const insets = useSafeAreaInsets();
  const bottomInset = resolveBottomInset(insets);

  return {
    top: insets.top,
    right: insets.right,
    left: insets.left,
    bottom: bottomInset,
    contentBottomPadding: bottomInset + contentPadding,
  };
}
