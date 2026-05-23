import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    GillSans: require("../assets/fonts/GillSans-Regular.ttf"),
    "GillSans-SemiBold": require("../assets/fonts/GillSans-SemiBold.ttf"),
    "GillSans-Bold": require("../assets/fonts/GillSans-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError };
}
