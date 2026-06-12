import React, { forwardRef, useCallback, useState } from "react";
import { Pressable, useTVEventHandler as rnUseTVEventHandler } from "react-native";
import { createActivationKeyHandler } from "../utils/remoteKeys";

const useTVEventHandler =
  typeof rnUseTVEventHandler === "function" ? rnUseTVEventHandler : () => {};

const FocusablePressable = forwardRef(function FocusablePressable(
  {
    onPress,
    onKeyPress,
    onKeyDown,
    onFocus,
    onBlur,
    disabled = false,
    suppressTVSelect = false,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const activate = useCallback(createActivationKeyHandler(disabled ? undefined : onPress), [
    disabled,
    onPress,
  ]);

  const handleFocus = useCallback(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  useTVEventHandler(
    useCallback(
      (event) => {
        if (suppressTVSelect || disabled || !focused || !onPress) {
          return;
        }

        const type = event?.eventType;
        if (type !== "select") {
          return;
        }

        const isKeyUp = event.eventKeyAction === undefined || event.eventKeyAction === 1;
        if (!isKeyUp) {
          return;
        }

        onPress(event);
      },
      [suppressTVSelect, disabled, focused, onPress],
    ),
  );

  const handleKeyPress = useCallback(
    (event) => {
      onKeyPress?.(event);
      activate(event);
    },
    [activate, onKeyPress],
  );

  const handleKeyDown = useCallback(
    (event) => {
      onKeyDown?.(event);
      activate(event);
    },
    [activate, onKeyDown],
  );

  return (
    <Pressable
      ref={ref}
      {...props}
      disabled={disabled}
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
      onKeyDown={handleKeyDown}
    />
  );
});

export default FocusablePressable;
