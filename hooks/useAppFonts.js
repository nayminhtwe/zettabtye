import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => {});

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    GillSans: require("../assets/fonts/GillSans-Regular.ttf"),
    "GillSans-SemiBold": require("../assets/fonts/GillSans-SemiBold.ttf"),
    "GillSans-Bold": require("../assets/fonts/GillSans-Bold.ttf"),
  });

  return { fontsLoaded, fontError };
}
