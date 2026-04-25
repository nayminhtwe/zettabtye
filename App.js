import React, { useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import OTPScreen from "./screens/OTPScreen";

export default function App() {
  const [currentPage, setCurrentPage] = useState("onboarding");
  const [phoneNumber, setPhoneNumber] = useState("");

  if (currentPage === "otp") {
    return (
      <OTPScreen
        phoneNumber={phoneNumber}
        onBackToLogin={() => setCurrentPage("login")}
      />
    );
  }

  if (currentPage === "login") {
    return (
      <LoginScreen
        onBackToOnboarding={() => setCurrentPage("onboarding")}
        onContinue={(value) => {
          setPhoneNumber(value);
          setCurrentPage("otp");
        }}
      />
    );
  }

  return <OnboardingScreen onFinish={() => setCurrentPage("login")} />;
}
