export const FOCUS_BORDER_WIDTH = 2;
export const FOCUS_BORDER_COLOR = "#FFFFFF";

export const focusBorderBase = {
  borderWidth: FOCUS_BORDER_WIDTH,
  borderColor: "transparent",
};

export const focusBorderActive = {
  borderColor: FOCUS_BORDER_COLOR,
  transform: [{ scale: 1.03 }],
};
