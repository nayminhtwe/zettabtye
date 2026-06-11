import React, { forwardRef, useEffect, useState } from "react";
import { Dimensions, FlatList, Image, Pressable, StyleSheet, View } from "react-native";

const SALE_BANNER_AUTO_SCROLL_MS = 4500;
const CONTENT_HORIZONTAL_PADDING = 10;
const SALE_BANNER_MAX_WIDTH = 380;
const SALE_BANNER_HEIGHT = 120;
const INDICATOR_TRACK_WIDTH = 66;
const INDICATOR_HEIGHT = 3;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SALE_BANNER_WIDTH = Math.min(
  SALE_BANNER_MAX_WIDTH,
  SCREEN_WIDTH - CONTENT_HORIZONTAL_PADDING * 2,
);

const SaleBannerCarousel = forwardRef(function SaleBannerCarousel(
  { slides, nextFocusUp, nextFocusDown, style },
  ref,
) {
  const bannerSlides = slides ?? [];
  const listRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (bannerSlides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % bannerSlides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, SALE_BANNER_AUTO_SCROLL_MS);

    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  if (!bannerSlides.length) {
    return null;
  }

  return (
    <Pressable
      ref={ref}
      style={({ pressed, focused: nativeFocused }) => [
        styles.saleBanner,
        style,
        (pressed || focused || nativeFocused) ? styles.saleBannerFocused : null,
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
    >
      <FlatList
        ref={listRef}
        style={styles.saleBannerList}
        data={bannerSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        bounces={false}
        keyExtractor={(slide) => slide.id}
        getItemLayout={(_, index) => ({
          length: SALE_BANNER_WIDTH,
          offset: SALE_BANNER_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.saleBannerSlide}>
            <Image source={item.image} resizeMode="cover" style={styles.saleBannerSlideImage} />
          </View>
        )}
      />
      <View style={styles.saleBannerIndicators} pointerEvents="none">
        <View style={styles.saleBannerIndicatorTrack}>
          <View
            style={[
              styles.saleBannerIndicatorActive,
              {
                width: INDICATOR_TRACK_WIDTH / bannerSlides.length,
                transform: [
                  {
                    translateX:
                      activeIndex * (INDICATOR_TRACK_WIDTH / bannerSlides.length),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
});

export default SaleBannerCarousel;

const styles = StyleSheet.create({
  saleBanner: {
    alignSelf: "center",
    width: SALE_BANNER_WIDTH,
    height: SALE_BANNER_HEIGHT,
    borderWidth: 1,
    borderColor: "#2A3958",
    backgroundColor: "#0A0A0A",
    overflow: "hidden",
  },
  saleBannerFocused: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  saleBannerList: {
    width: SALE_BANNER_WIDTH,
    height: SALE_BANNER_HEIGHT,
  },
  saleBannerSlide: {
    width: SALE_BANNER_WIDTH,
    height: SALE_BANNER_HEIGHT,
  },
  saleBannerSlideImage: {
    width: SALE_BANNER_WIDTH,
    height: SALE_BANNER_HEIGHT,
    marginTop: 0.25,
    opacity: 1,
  },
  saleBannerIndicators: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },
  saleBannerIndicatorTrack: {
    width: INDICATOR_TRACK_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden",
  },
  saleBannerIndicatorActive: {
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: "#E71809",
  },
});
