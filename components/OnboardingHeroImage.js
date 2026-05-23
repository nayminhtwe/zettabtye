import React from "react";
import { View } from "react-native";

import Onboarding1 from "../assets/images/onboarding-1.svg";
import Onboarding2 from "../assets/images/onboarding-2.svg";
import Onboarding3 from "../assets/images/onboarding-3.svg";

const HERO_BY_SLIDE_ID = {
  "slide-1": Onboarding1,
  "slide-2": Onboarding2,
  "slide-3": Onboarding3,
};

export default function OnboardingHeroImage({ slideId, width = 240, height = 150 }) {
  const Hero = HERO_BY_SLIDE_ID[slideId];

  if (!Hero) {
    return null;
  }

  return (
    <View
      focusable={false}
      accessible={false}
      style={{ width, height, alignItems: "center", justifyContent: "center" }}
    >
      <Hero width={width} height={height} />
    </View>
  );
}
