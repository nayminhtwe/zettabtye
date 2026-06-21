import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { getPosterSource } from "../api/mappers";

export default function CategoryCardImage({ imageUrl, posterIndex = 0, style }) {
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const fallbackSource = useMemo(() => getPosterSource(null, posterIndex), [posterIndex]);

  const remoteUri =
    typeof imageUrl === "string" && imageUrl.trim().length > 0 ? imageUrl.trim() : null;

  useEffect(() => {
    setRemoteLoaded(false);
    setRemoteFailed(false);
  }, [remoteUri]);

  const showRemote = Boolean(remoteUri) && !remoteFailed;

  return (
    <View style={[styles.wrap, style]}>
      <Image source={fallbackSource} resizeMode="cover" style={styles.image} />
      {showRemote ? (
        <Image
          source={{ uri: remoteUri }}
          resizeMode="cover"
          style={[styles.image, styles.remoteImage, remoteLoaded ? styles.remoteVisible : null]}
          onLoad={() => setRemoteLoaded(true)}
          onError={() => setRemoteFailed(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A2741",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  remoteImage: {
    opacity: 0,
  },
  remoteVisible: {
    opacity: 1,
  },
});
