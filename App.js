import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAppFonts } from "./hooks/useAppFonts";
import HomeScreen from "./screens/HomeScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import ForgotPasswordPhoneScreen from "./screens/ForgotPasswordPhoneScreen";
import OTPScreen from "./screens/OTPScreen";
import PasswordScreen from "./screens/PasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import SplashScreen from "./screens/SplashScreen";
import { isFirstTimeUser } from "./utils/phoneAuth";

const SCREEN = {
  SPLASH: "splash",
  ONBOARDING: "onboarding",
  OTP: "otp",
  PASSWORD: "password",
  FORGOT_PASSWORD_PHONE: "forgot_password_phone",
  RESET_PASSWORD: "reset_password",
  HOME: "home",
};

export default function App() {
  const { fontsLoaded } = useAppFonts();
  const [currentPage, setCurrentPage] = useState(SCREEN.SPLASH);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resumeOnboardingAtPhone, setResumeOnboardingAtPhone] = useState(false);

  const goToOnboardingPhoneStep = () => {
    setResumeOnboardingAtPhone(true);
    setCurrentPage(SCREEN.ONBOARDING);
  };

  const screenComponent = useMemo(() => {
    const screens = {
      [SCREEN.HOME]: <HomeScreen />,
      [SCREEN.OTP]: (
        <OTPScreen
          phoneNumber={phoneNumber}
          onBack={goToOnboardingPhoneStep}
          onContinue={() => setCurrentPage(SCREEN.HOME)}
        />
      ),
      [SCREEN.PASSWORD]: (
        <PasswordScreen
          phoneNumber={phoneNumber}
          onBack={goToOnboardingPhoneStep}
          onContinue={() => setCurrentPage(SCREEN.HOME)}
          onForgotPassword={() => setCurrentPage(SCREEN.FORGOT_PASSWORD_PHONE)}
        />
      ),
      [SCREEN.FORGOT_PASSWORD_PHONE]: (
        <ForgotPasswordPhoneScreen
          onBack={() => setCurrentPage(SCREEN.PASSWORD)}
          onContinue={(value) => {
            setPhoneNumber(value);
            setCurrentPage(SCREEN.RESET_PASSWORD);
          }}
        />
      ),
      [SCREEN.RESET_PASSWORD]: (
        <ResetPasswordScreen
          phoneNumber={phoneNumber}
          onBack={() => setCurrentPage(SCREEN.FORGOT_PASSWORD_PHONE)}
          onContinue={() => setCurrentPage(SCREEN.HOME)}
        />
      ),
      [SCREEN.ONBOARDING]: (
        <OnboardingScreen
          key={resumeOnboardingAtPhone ? `phone-${phoneNumber}` : "start"}
          initialSlideIndex={resumeOnboardingAtPhone ? 2 : 0}
          initialPhoneNumber={resumeOnboardingAtPhone ? phoneNumber : ""}
          onContinue={(value) => {
            setResumeOnboardingAtPhone(false);
            setPhoneNumber(value);
            setCurrentPage(isFirstTimeUser(value) ? SCREEN.OTP : SCREEN.PASSWORD);
          }}
        />
      ),
      [SCREEN.SPLASH]: (
        <SplashScreen
          onFinish={() => {
            setResumeOnboardingAtPhone(false);
            setCurrentPage(SCREEN.ONBOARDING);
          }}
        />
      ),
    };

    return screens[currentPage] ?? screens[SCREEN.SPLASH];
  }, [currentPage, phoneNumber, resumeOnboardingAtPhone]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141218" }}>
        <ActivityIndicator color="#E71809" />
      </View>
    );
  }

  return screenComponent;
}
