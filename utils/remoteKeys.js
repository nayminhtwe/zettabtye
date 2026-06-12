// Android TV remotes and emulator keyboards surface "activate" through different keys.
// Space often triggers Pressable.onPress; Enter / OK / DPAD center may not.

const ACTIVATION_KEY_CODES = new Set([
  23, // KEYCODE_DPAD_CENTER (remote OK)
  66, // KEYCODE_ENTER
  160, // KEYCODE_NUMPAD_ENTER
]);

const ACTIVATION_KEYS = new Set(["Enter", "enter", "Select", "\n"]);

export function isActivationKey(event) {
  const nativeEvent = event?.nativeEvent;
  if (!nativeEvent) {
    return false;
  }

  const { key, keyCode } = nativeEvent;

  if (ACTIVATION_KEYS.has(key)) {
    return true;
  }

  return ACTIVATION_KEY_CODES.has(keyCode);
}

export function isKeyRelease(event) {
  const action = event?.nativeEvent?.action ?? event?.nativeEvent?.eventKeyAction;
  // onKeyPress has no action; treat as a release/activate event.
  return action === undefined || action === 1;
}

export function createActivationKeyHandler(onActivate) {
  return (event) => {
    if (!isActivationKey(event) || !isKeyRelease(event)) {
      return;
    }

    event?.preventDefault?.();
    onActivate?.(event);
  };
}
