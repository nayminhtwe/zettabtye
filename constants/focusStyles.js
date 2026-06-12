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

export const authBackButtonFocused = {
  ...focusBorderActive,
  borderRadius: 20,
};

export const authInputBase = {
  ...focusBorderBase,
  borderRadius: 4,
};

export const authInputFocused = {
  ...focusBorderActive,
  backgroundColor: "rgba(255, 255, 255, 0.06)",
};

export const authPrimaryButtonFocused = {
  borderWidth: FOCUS_BORDER_WIDTH,
  borderColor: FOCUS_BORDER_COLOR,
  backgroundColor: "#FFFFFF",
};

export const authSecondaryButtonFocused = {
  borderWidth: FOCUS_BORDER_WIDTH,
  ...focusBorderActive,
  borderRadius: 8,
};

export const authLinkFocused = {
  borderWidth: FOCUS_BORDER_WIDTH,
  ...focusBorderActive,
  borderRadius: 6,
  backgroundColor: "rgba(255, 255, 255, 0.12)",
};

export const authOtpBoxBase = {
  ...focusBorderBase,
  borderRadius: 4,
};

export const authOtpBoxActiveRow = {
  backgroundColor: "rgba(255, 255, 255, 0.04)",
};

export const authOtpBoxFocused = {
  ...focusBorderActive,
  backgroundColor: "rgba(255, 255, 255, 0.08)",
};

export const authCountrySelectorBase = {
  ...focusBorderBase,
  borderRadius: 4,
};

export const authCountrySelectorFocused = {
  ...focusBorderActive,
  backgroundColor: "rgba(255, 255, 255, 0.06)",
};

export const authCountryOptionFocused = {
  ...focusBorderActive,
  backgroundColor: "rgba(255, 255, 255, 0.08)",
};

export const authIconButtonFocused = {
  ...focusBorderActive,
  borderRadius: 20,
};
