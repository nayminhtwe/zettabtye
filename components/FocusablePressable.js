import React, { forwardRef, useCallback } from "react";
import { Pressable } from "react-native";
import { createActivationKeyHandler } from "../utils/remoteKeys";

const FocusablePressable = forwardRef(function FocusablePressable(
  { onPress, onKeyPress, onKeyDown, ...props },
  ref,
) {
  const activate = useCallback(createActivationKeyHandler(onPress), [onPress]);

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
      onPress={onPress}
      onKeyPress={handleKeyPress}
      onKeyDown={handleKeyDown}
    />
  );
});

export default FocusablePressable;
