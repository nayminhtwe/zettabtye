import React, { forwardRef, useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { focusBorderActive, focusBorderBase } from "../constants/focusStyles";

const PosterCard = forwardRef(function PosterCard(
  { item, onPress, style, imageStyle, nextFocusUp, nextFocusDown, nextFocusLeft, nextFocusRight },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        styles.posterCard,
        style,
        pressed || focused ? styles.posterCardFocused : null,
      ]}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
    >
      <Image source={item.image} resizeMode="cover" style={[styles.posterImage, imageStyle]} />
    </Pressable>
  );
});

export default PosterCard;

const styles = StyleSheet.create({
  posterCard: {
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#111827",
    ...focusBorderBase,
  },
  posterCardFocused: focusBorderActive,
  posterImage: {
    width: "100%",
    aspectRatio: 0.67,
  },
});
