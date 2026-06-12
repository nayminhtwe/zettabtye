import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useSelector } from "react-redux";
import {
  selectBannerUnitIdForPlacement,
  selectShouldShowAdsForPlacement,
} from "../store/ads/selectors";

export default function AdMobBanner({ placement, style }) {
  const selectVisible = useMemo(
    () => selectShouldShowAdsForPlacement(placement),
    [placement],
  );
  const selectUnitId = useMemo(
    () => selectBannerUnitIdForPlacement(placement),
    [placement],
  );

  const visible = useSelector(selectVisible);
  const unitId = useSelector(selectUnitId);

  if (!visible || !unitId || Platform.isTV) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginVertical: 8,
  },
});
