import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import StepProgressBar from "../components/StepProgressBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    id: "slide-1",
    title: "Free Pass to all access",
    subtitle: "Your Free Membership Awaits",
    description:
      "Save favorites, build watchlists, and get early updates - all free, all yours.",
  },
  {
    id: "slide-2",
    title: "Watch Anytime Anywhere",
    subtitle: "Your Library, Your Control",
    description:
      "Track what you love and continue your shows from where you left off in one tap.",
  },
  {
    id: "slide-3",
    title: "Stay Ahead Instantly",
    subtitle: "Never Miss A New Release",
    description:
      "Get alerts on fresh content and enjoy curated picks made for your taste.",
  },
];

export default function OnboardingScreen({ onFinish }) {
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nextFocused, setNextFocused] = useState(false);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
      return;
    }

    onFinish();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.heroSection}>
              <Image
                source={require("../assets/images/logo.png")}
                resizeMode="contain"
                style={styles.heroImage}
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.progressWrapper}>
                <StepProgressBar
                  totalSteps={ONBOARDING_SLIDES.length}
                  currentStep={activeIndex + 1}
                />
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            (pressed || nextFocused) ? styles.nextButtonFocused : null,
          ]}
          onPress={handleNext}
          onFocus={() => setNextFocused(true)}
          onBlur={() => setNextFocused(false)}
        >
          <Text style={styles.nextText}>
            {activeIndex === ONBOARDING_SLIDES.length - 1 ? "Continue" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141218",
  },
  statusBarSpacer: {
    height: 52,
    backgroundColor: "#1D1B20",
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 18,
  },
  heroImage: {
    width: 240,
    height: 150,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 44,
    lineHeight: 54,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 24,
    color: "#D2D2D2",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "600",
  },
  description: {
    marginTop: 16,
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  progressWrapper: {
    marginTop: 24,
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginTop: 16,
  },
  nextButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonFocused: {
    borderColor: "#FF5C4D",
    shadowColor: "#E71809",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  nextText: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
  },
});
