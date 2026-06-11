import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  findNodeHandle,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FloatingPhoneInput from "../components/FloatingPhoneInput";
import OnboardingHeroImage from "../components/OnboardingHeroImage";
import StepProgressBar from "../components/StepProgressBar";
import { gillSans } from "../constants/fonts";
import { useSelector } from "react-redux";
import { selectAuthError, selectAuthLoading } from "../store/auth/selectors";
import { getPhoneValidationError } from "../utils/phoneAuth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    id: "slide-1",
    title: "Welcome to Zettabyte",
    subtitle: "All Your Entertainment in One Place",
    description:
      "SaveMovies, matches, and moments you can’t miss — curated just for you.",
  },
  {
    id: "slide-2",
    title: "Free Pass to all access",
    subtitle: "Your Free Membership Awaits",
    description:
      "Save favorites, build watchlists, and get early updates - all free, all yours.",
  },
  {
    id: "slide-3",
    title: "Enter with Phone Number",
    subtitle: "Easy Application Access",
    description:
      "Enter your phone number to claim your free membership and unlock your entertainment pass.",
  },
];

const LAST_SLIDE_INDEX = ONBOARDING_SLIDES.length - 1;

const COUNTRIES = [
  { id: "MM", name: "Myanmar", dialCode: "+95", flag: "🇲🇲" },
  { id: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { id: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
];

const DEFAULT_COUNTRY_ID = "MM";
const STATUS_BAR_SPACER_HEIGHT = 52;
const KEYBOARD_VERTICAL_OFFSET = Platform.OS === "ios" ? STATUS_BAR_SPACER_HEIGHT : 0;
const SLIDE_KEYBOARD_MAX_HEIGHT = Math.round(Dimensions.get("window").height * 0.22);

export default function OnboardingScreen({
  onContinue,
  initialSlideIndex = 0,
  initialPhoneNumber = "",
}) {
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const listRef = useRef(null);
  const skipRef = useRef(null);
  const nextRef = useRef(null);
  const countrySelectorRef = useRef(null);
  const countryOptionRefs = useRef({});
  const phoneInputRef = useRef(null);
  const continueRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(initialSlideIndex);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [selectedCountryId, setSelectedCountryId] = useState(DEFAULT_COUNTRY_ID);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [skipFocused, setSkipFocused] = useState(false);
  const [nextFocused, setNextFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const selectedCountry =
    COUNTRIES.find((country) => country.id === selectedCountryId) ?? COUNTRIES[0];

  const isLastSlide = activeIndex === LAST_SLIDE_INDEX;

  useEffect(() => {
    if (initialSlideIndex <= 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: initialSlideIndex,
        animated: false,
      });
      setActiveIndex(initialSlideIndex);
    });

    return () => cancelAnimationFrame(frame);
  }, [initialSlideIndex]);

  useEffect(() => {
    if (!isLastSlide) {
      setIsCountryDropdownOpen(false);
    }
  }, [isLastSlide]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const goToSlide = (index) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex >= LAST_SLIDE_INDEX) {
      return;
    }

    goToSlide(activeIndex + 1);
  };

  const handleSkipPress = () => {
    goToSlide(LAST_SLIDE_INDEX);
  };

  const handleContinue = () => {
    if (isLoading) {
      return;
    }

    const error = getPhoneValidationError(phoneNumber, selectedCountryId);
    setPhoneError(error);

    if (error) {
      return;
    }

    onContinue?.(phoneNumber, selectedCountryId);
  };

  const selectCountry = (countryId) => {
    setSelectedCountryId(countryId);
    setIsCountryDropdownOpen(false);
    if (phoneError) {
      setPhoneError("");
    }
  };

  const toggleCountryDropdown = () => {
    setIsCountryDropdownOpen((open) => {
      if (!open) {
        Keyboard.dismiss();
      }
      return !open;
    });
  };

  const getCountryOptionDownTarget = (countryId) => {
    const index = COUNTRIES.findIndex((country) => country.id === countryId);
    const nextCountry = COUNTRIES[index + 1];

    if (nextCountry) {
      return findNodeHandle(countryOptionRefs.current[nextCountry.id]) ?? undefined;
    }

    return findNodeHandle(phoneInputRef.current) ?? undefined;
  };

  const getCountryOptionUpTarget = (countryId) => {
    const index = COUNTRIES.findIndex((country) => country.id === countryId);

    if (index > 0) {
      const prevCountry = COUNTRIES[index - 1];
      return findNodeHandle(countryOptionRefs.current[prevCountry.id]) ?? undefined;
    }

    return findNodeHandle(countrySelectorRef.current) ?? undefined;
  };

  const phoneFieldUpTarget = isCountryDropdownOpen
    ? findNodeHandle(countryOptionRefs.current[COUNTRIES[COUNTRIES.length - 1].id]) ??
      undefined
    : findNodeHandle(countrySelectorRef.current) ?? undefined;

  const compactLastSlide = keyboardVisible && isLastSlide;
  const displayError = phoneError || authError;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
        keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
      >
        <FlatList
          ref={listRef}
          style={[styles.slideList, compactLastSlide ? styles.slideListWithKeyboard : null]}
          data={ONBOARDING_SLIDES}
          horizontal
          pagingEnabled
          scrollEnabled={!compactLastSlide}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveIndex(index);
          }}
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({
              offset: index * SCREEN_WIDTH,
              animated: false,
            });
            setActiveIndex(index);
          }}
          renderItem={({ item, index }) => {
            const isPhoneSlide = index === LAST_SLIDE_INDEX;
            const hideForKeyboard = keyboardVisible && isPhoneSlide;

            return (
              <View style={styles.page}>
                {hideForKeyboard ? null : (
                  <View style={styles.heroSection}>
                    <OnboardingHeroImage slideId={item.id} />
                  </View>
                )}

                <View style={[styles.content, hideForKeyboard ? styles.contentCompact : null]}>
                  <Text style={[styles.title, hideForKeyboard ? styles.titleCompact : null]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.subtitle, hideForKeyboard ? styles.subtitleCompact : null]}>
                    {item.subtitle}
                  </Text>
                  {hideForKeyboard ? null : (
                    <Text style={styles.description}>{item.description}</Text>
                  )}

                  <View style={[styles.progressWrapper, hideForKeyboard ? styles.progressCompact : null]}>
                    <StepProgressBar
                      totalSteps={ONBOARDING_SLIDES.length}
                      currentStep={activeIndex + 1}
                    />
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.footer, compactLastSlide ? styles.footerWithKeyboard : null]}>
        {isLastSlide ? (
          <>
            <View style={styles.countrySection}>
              <Pressable
                ref={countrySelectorRef}
                style={styles.countrySelector}
                onPress={toggleCountryDropdown}
                disabled={isLoading}
                nextFocusDown={
                  isCountryDropdownOpen
                    ? findNodeHandle(countryOptionRefs.current[COUNTRIES[0].id]) ?? undefined
                    : findNodeHandle(phoneInputRef.current) ?? undefined
                }
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryName}>{selectedCountry.name}</Text>
                <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
                <Ionicons
                  name={isCountryDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#D2D2D2"
                />
              </Pressable>

              {isCountryDropdownOpen ? (
                <View style={styles.countryDropdown}>
                  {COUNTRIES.map((country) => {
                    const isSelected = country.id === selectedCountryId;
                    return (
                      <Pressable
                        key={country.id}
                        ref={(node) => {
                          countryOptionRefs.current[country.id] = node;
                        }}
                        style={[
                          styles.countryOption,
                          isSelected ? styles.countryOptionSelected : null,
                        ]}
                        onPress={() => selectCountry(country.id)}
                        nextFocusUp={getCountryOptionUpTarget(country.id)}
                        nextFocusDown={getCountryOptionDownTarget(country.id)}
                      >
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <View>
              <FloatingPhoneInput
                inputRef={phoneInputRef}
                autoFocus={isLastSlide}
                value={phoneNumber}
                onChangeText={(value) => {
                  setPhoneNumber(value);
                  if (phoneError) {
                    setPhoneError("");
                  }
                }}
                editable={!isLoading}
                focusableProps={{
                  nextFocusUp: phoneFieldUpTarget,
                  nextFocusDown: findNodeHandle(continueRef.current) ?? undefined,
                }}
              />
              {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}
            </View>

            <Pressable
              ref={continueRef}
              style={[
                styles.continueButton,
                continueFocused ? styles.continueButtonFocused : null,
                isLoading ? styles.continueButtonDisabled : null,
              ]}
              disabled={isLoading}
              nextFocusUp={phoneFieldUpTarget}
              onFocus={() => setContinueFocused(true)}
              onBlur={() => setContinueFocused(false)}
              onPress={handleContinue}
            >
              {isLoading ? (
                <ActivityIndicator color="#D2D2D2" />
              ) : (
                <Text
                  style={[
                    styles.continueText,
                    continueFocused ? styles.continueTextFocused : null,
                  ]}
                >
                  Continue
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.footerRow}>
            <Pressable
              ref={skipRef}
              style={[styles.skipButton, skipFocused ? styles.skipButtonFocused : null]}
              nextFocusRight={findNodeHandle(nextRef.current) ?? undefined}
              onFocus={() => setSkipFocused(true)}
              onBlur={() => setSkipFocused(false)}
              onPress={handleSkipPress}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            <Pressable
              ref={nextRef}
              android_ripple={null}
              style={[styles.nextButton, nextFocused ? styles.nextButtonFocused : null]}
              nextFocusLeft={findNodeHandle(skipRef.current) ?? undefined}
              onFocus={() => setNextFocused(true)}
              onBlur={() => setNextFocused(false)}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>Next</Text>
            </Pressable>
          </View>
        )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141218",
  },
  keyboardAvoid: {
    flex: 1,
  },
  statusBarSpacer: {
    height: STATUS_BAR_SPACER_HEIGHT,
    backgroundColor: "#1D1B20",
  },
  slideList: {
    flex: 1,
    flexShrink: 1,
  },
  slideListWithKeyboard: {
    flexGrow: 0,
    maxHeight: SLIDE_KEYBOARD_MAX_HEIGHT,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 64,
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },
  contentCompact: {
    paddingTop: 0,
  },
  title: {
    width: "100%",
    color: "#FFFFFF",
    fontSize: 29,
    ...gillSans("600"),
    lineHeight: 54,
    letterSpacing: 1,
    textAlign: "center",
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 30,
  },
  subtitle: {
    width: "100%",
    marginTop: 24,
    color: "#D2D2D2",
    fontSize: 20,
    ...gillSans("400"),
    lineHeight: 28,
    letterSpacing: 1,
    textAlign: "center",
  },
  subtitleCompact: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    width: "100%",
    marginTop: 16,
    color: "#D2D2D2",
    ...gillSans("400"),
    fontSize: 13,
    lineHeight: 24,
    letterSpacing: 1,
    textAlign: "center",
  },
  progressWrapper: {
    marginTop: 24,
    alignItems: "center",
  },
  progressCompact: {
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginTop: 8,
    flexShrink: 0,
  },
  footerWithKeyboard: {
    marginTop: 0,
    paddingBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 8,
  },
  skipText: {
    color: "#8E8E8E",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("400"),
    textDecorationLine: "underline",
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E71809",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  nextButtonFocused: {
    borderColor: "#FF5C4D",
    backgroundColor: "rgba(231, 24, 9, 0.1)",
  },
  nextText: {
    color: "#C80D00",
    fontSize: 16,
    lineHeight: 24,
    ...gillSans("600"),
    textDecorationLine: "underline",
    textAlign: "center",
  },
  countrySection: {
    marginBottom: 12,
  },
  countrySelector: {
    minHeight: 64,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A4A",
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
  },
  countryDropdown: {
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A4A",
  },
  countryOption: {
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  countryOptionSelected: {
    backgroundColor: "rgba(255, 59, 48, 0.08)",
  },
  countryFlag: {
    fontSize: 24,
    lineHeight: 28,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    ...gillSans("400"),
  },
  countryDialCode: {
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    ...gillSans("400"),
    marginRight: 8,
  },
  errorText: {
    marginTop: 8,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  continueButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonFocused: {
    borderColor: "#FF5C4D",
    shadowColor: "#E71809",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueText: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    ...gillSans("600"),
  },
  continueTextFocused: {
    color: "#FFFFFF",
  },
});
