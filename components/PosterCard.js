import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { getPosterSource } from "../api/mappers";
import { focusBorderActive, focusBorderBase } from "../constants/focusStyles";

function resolvePosterIndex(item) {
  const parsed = Number(item?.id);
  return Number.isFinite(parsed) ? parsed : 0;
}

const PosterCard = forwardRef(function PosterCard(
  {
    item,
    onPress,
    onPosterFocus,
    style,
    imageStyle,
    nextFocusUp,
    nextFocusDown,
    nextFocusLeft,
    nextFocusRight,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const posterIndex = resolvePosterIndex(item);
  const fallbackSource = useMemo(() => getPosterSource(null, posterIndex), [posterIndex]);

  const remoteUri =
    typeof item?.image?.uri === "string" && item.image.uri.trim().length > 0
      ? item.image.uri.trim()
      : typeof item?.posterImage === "string" && item.posterImage.trim().length > 0
        ? item.posterImage.trim()
        : null;

  useEffect(() => {
    setRemoteLoaded(false);
    setRemoteFailed(false);
  }, [item?.id, remoteUri]);

  if (!item?.id) {
    return null;
  }

  const showRemote = Boolean(remoteUri) && !remoteFailed;

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        styles.posterCard,
        style,
        pressed || focused ? styles.posterCardFocused : null,
      ]}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onPosterFocus?.();
      }}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
    >
      <View style={styles.posterImageWrap}>
        <Image
          source={fallbackSource}
          resizeMode="cover"
          style={[styles.posterImage, imageStyle]}
        />
        {showRemote ? (
          <Image
            source={{ uri: remoteUri }}
            resizeMode="cover"
            style={[
              styles.posterImage,
              styles.posterImageRemote,
              remoteLoaded ? styles.posterImageVisible : null,
              imageStyle,
            ]}
            onLoad={() => setRemoteLoaded(true)}
            onError={() => setRemoteFailed(true)}
          />
        ) : null}
      </View>
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
  posterImageWrap: {
    width: "100%",
    aspectRatio: 0.67,
    backgroundColor: "#111827",
  },
  posterImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  posterImageRemote: {
    opacity: 0,
  },
  posterImageVisible: {
    opacity: 1,
  },
});
