import React, { useMemo, useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import OTPScreen from "./screens/OTPScreen";

const SCREEN = {
  ONBOARDING: "onboarding",
  LOGIN: "login",
  OTP: "otp",
  HOME: "home",
};

export default function App() {
  const [currentPage, setCurrentPage] = useState(SCREEN.ONBOARDING);
  const [phoneNumber, setPhoneNumber] = useState("");

  const screenComponent = useMemo(() => {
    const screens = {
      [SCREEN.HOME]: <HomeScreen />,
      [SCREEN.OTP]: (
        <OTPScreen
          phoneNumber={phoneNumber}
          onBackToLogin={() => setCurrentPage(SCREEN.LOGIN)}
          onContinue={() => setCurrentPage(SCREEN.HOME)}
        />
      ),
      [SCREEN.LOGIN]: (
        <LoginScreen
          onBackToOnboarding={() => setCurrentPage(SCREEN.ONBOARDING)}
          onContinue={(value) => {
            setPhoneNumber(value);
            setCurrentPage(SCREEN.OTP);
          }}
        />
      ),
      [SCREEN.ONBOARDING]: (
        <OnboardingScreen onFinish={() => setCurrentPage(SCREEN.LOGIN)} />
      ),
    };

    return screens[currentPage] ?? screens[SCREEN.ONBOARDING];
  }, [currentPage, phoneNumber]);

  return screenComponent;
}
