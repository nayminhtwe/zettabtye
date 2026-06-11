import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useAppFonts } from "./hooks/useAppFonts";
import HomeScreen from "./screens/HomeScreen";
import MovieDetailScreen from "./screens/MovieDetailScreen";
import MoviePlayScreen from "./screens/MoviePlayScreen";
import FootballDetailScreen from "./screens/FootballDetailScreen";
import FootballScreen from "./screens/FootballScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SetProfilePasswordScreen from "./screens/SetProfilePasswordScreen";
import EditPhoneNumberScreen from "./screens/EditPhoneNumberScreen";
import EditPhoneOtpScreen from "./screens/EditPhoneOtpScreen";
import GetHelpScreen from "./screens/GetHelpScreen";
import SearchScreen from "./screens/SearchScreen";
import SeriesScreen from "./screens/SeriesScreen";
import SeriesDetailScreen from "./screens/SeriesDetailScreen";
import MoviesScreen from "./screens/MoviesScreen";
import CategoriesScreen from "./screens/CategoriesScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import { buildMovieDetail } from "./utils/movieDetail";
import { buildFootballDetail } from "./utils/football";
import { buildSeriesDetail, buildSeriesPlayItem } from "./utils/seriesDetail";
import { DEFAULT_RECENT_SEARCHES } from "./utils/search";
import OnboardingScreen from "./screens/OnboardingScreen";
import ForgotPasswordPhoneScreen from "./screens/ForgotPasswordPhoneScreen";
import OTPScreen from "./screens/OTPScreen";
import PasswordScreen from "./screens/PasswordScreen";
import CreatePasswordScreen from "./screens/CreatePasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import SplashScreen from "./screens/SplashScreen";
import { authInitiateRequest, authLogoutRequest, bootstrapRequest } from "./store/auth/actions";
import {
  selectAuthAuthenticated,
  selectAuthBootstrapped,
  selectAuthNeedsPasswordSetup,
  selectAuthOtpRequired,
  selectAuthPasswordRequired,
  selectAuthPhone,
  selectAuthUser,
} from "./store/auth/selectors";

const SCREEN = {
  SPLASH: "splash",
  ONBOARDING: "onboarding",
  OTP: "otp",
  PASSWORD: "password",
  CREATE_PASSWORD: "create_password",
  FORGOT_PASSWORD_PHONE: "forgot_password_phone",
  RESET_PASSWORD: "reset_password",
  HOME: "home",
  MOVIE_DETAIL: "movie_detail",
  MOVIE_PLAY: "movie_play",
  FOOTBALL_DETAIL: "football_detail",
  FOOTBALL_LIST: "football_list",
  PROFILE: "profile",
  SET_PROFILE_PASSWORD: "set_profile_password",
  EDIT_PHONE_NUMBER: "edit_phone_number",
  EDIT_PHONE_OTP: "edit_phone_otp",
  GET_HELP: "get_help",
  SEARCH: "search",
  SERIES: "series",
  SERIES_DETAIL: "series_detail",
  MOVIES: "movies",
  CATEGORIES: "categories",
  HISTORY: "history",
  NOTIFICATIONS: "notifications",
};

export default function App() {
  const { fontsLoaded } = useAppFonts();
  const dispatch = useDispatch();
  const bootstrapped = useSelector(selectAuthBootstrapped);
  const isAuthenticated = useSelector(selectAuthAuthenticated);
  const otpRequired = useSelector(selectAuthOtpRequired);
  const passwordRequired = useSelector(selectAuthPasswordRequired);
  const needsPasswordSetup = useSelector(selectAuthNeedsPasswordSetup);
  const authUser = useSelector(selectAuthUser);
  const authPhone = useSelector(selectAuthPhone);

  const [currentPage, setCurrentPage] = useState(SCREEN.SPLASH);
  const [splashFinished, setSplashFinished] = useState(false);
  const [resumeOnboardingAtPhone, setResumeOnboardingAtPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("MM");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seriesDetailReturnScreen, setSeriesDetailReturnScreen] = useState(SCREEN.SERIES);
  const [seriesReturnScreen, setSeriesReturnScreen] = useState(SCREEN.HOME);
  const [moviesReturnScreen, setMoviesReturnScreen] = useState(SCREEN.HOME);
  const [moviesInitialCategory, setMoviesInitialCategory] = useState("All");
  const [movieDetailReturnScreen, setMovieDetailReturnScreen] = useState(SCREEN.HOME);
  const [moviePlayReturnScreen, setMoviePlayReturnScreen] = useState(SCREEN.MOVIE_DETAIL);
  const [selectedFootballMatch, setSelectedFootballMatch] = useState(null);
  const [footballReturnScreen, setFootballReturnScreen] = useState(SCREEN.HOME);
  const [footballDetailReturnScreen, setFootballDetailReturnScreen] = useState(SCREEN.HOME);
  const [accountPassword, setAccountPassword] = useState("");
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);
  const [accountUsername, setAccountUsername] = useState("");
  const [searchReturnScreen, setSearchReturnScreen] = useState(SCREEN.HOME);
  const [recentSearches, setRecentSearches] = useState(DEFAULT_RECENT_SEARCHES);

  const displayPhone = authUser?.phone ?? authPhone ?? "";

  useEffect(() => {
    dispatch(bootstrapRequest());
  }, [dispatch]);

  useEffect(() => {
    if (!bootstrapped) return;

    // New user just verified OTP — needs to create a password
    if (needsPasswordSetup) {
      setCurrentPage(SCREEN.CREATE_PASSWORD);
      return;
    }

    // Fully authenticated and no pending setup
    if (isAuthenticated) {
      if (splashFinished || currentPage !== SCREEN.SPLASH) {
        setCurrentPage(SCREEN.HOME);
      }
      return;
    }

    // Route to appropriate auth screen after splash
    if (splashFinished || currentPage !== SCREEN.SPLASH) {
      if (otpRequired) {
        setCurrentPage(SCREEN.OTP);
        return;
      }
      if (passwordRequired) {
        setCurrentPage(SCREEN.PASSWORD);
        return;
      }
    }

    if (splashFinished && currentPage === SCREEN.SPLASH) {
      setCurrentPage(SCREEN.ONBOARDING);
    }
  }, [
    bootstrapped,
    splashFinished,
    isAuthenticated,
    otpRequired,
    passwordRequired,
    needsPasswordSetup,
    currentPage,
  ]);

  const openSearch = (returnScreen) => {
    setSearchReturnScreen(returnScreen);
    setCurrentPage(SCREEN.SEARCH);
  };

  const openFootballList = (returnScreen) => {
    setFootballReturnScreen(returnScreen);
    setCurrentPage(SCREEN.FOOTBALL_LIST);
  };

  const openFootballDetail = (fixture, returnScreen) => {
    setFootballDetailReturnScreen(returnScreen);
    setSelectedFootballMatch(buildFootballDetail(fixture));
    setCurrentPage(SCREEN.FOOTBALL_DETAIL);
  };

  const openSeriesDetail = (item, returnScreen = SCREEN.SERIES) => {
    setSeriesDetailReturnScreen(returnScreen);
    setSelectedSeries(buildSeriesDetail(item));
    setCurrentPage(SCREEN.SERIES_DETAIL);
  };

  const openPlayFromSeries = (item, returnScreen) => {
    const series = buildSeriesDetail(item);
    setSelectedMovie(buildSeriesPlayItem(series));
    setMoviePlayReturnScreen(returnScreen);
    setCurrentPage(SCREEN.MOVIE_PLAY);
  };

  const openMovieDetail = (item, returnScreen = SCREEN.HOME) => {
    setMovieDetailReturnScreen(returnScreen);
    setSelectedMovie(buildMovieDetail(item));
    setCurrentPage(SCREEN.MOVIE_DETAIL);
  };

  const openPlayFromMovie = (item, returnScreen) => {
    setSelectedMovie(buildMovieDetail(item));
    setMoviePlayReturnScreen(returnScreen);
    setCurrentPage(SCREEN.MOVIE_PLAY);
  };

  const openMovies = (returnScreen = SCREEN.HOME, initialCategory = "All") => {
    setMoviesReturnScreen(returnScreen);
    setMoviesInitialCategory(initialCategory);
    setCurrentPage(SCREEN.MOVIES);
  };

  const openSeries = (returnScreen = SCREEN.HOME) => {
    setSeriesReturnScreen(returnScreen);
    setCurrentPage(SCREEN.SERIES);
  };

  const navigateFromCategory = (category, returnScreen) => {
    if (category.destination === "football_list") {
      openFootballList(returnScreen);
      return;
    }

    if (category.destination === "series") {
      openSeries(returnScreen);
      return;
    }

    if (category.destination === "movies") {
      openMovies(returnScreen, category.moviesCategory || "All");
    }
  };

  const goToOnboardingPhoneStep = () => {
    setResumeOnboardingAtPhone(true);
    setCurrentPage(SCREEN.ONBOARDING);
  };

  const handleLogout = () => {
    dispatch(authLogoutRequest());
    setPhoneNumber("");
    setSelectedCountryId("MM");
    setResumeOnboardingAtPhone(false);
    setSelectedMovie(null);
    setSelectedSeries(null);
    setSelectedFootballMatch(null);
    setAccountPassword("");
    setPasswordUpdateSuccess(false);
    setPendingPhoneNumber("");
    setPhoneUpdateSuccess(false);
    setAccountUsername("");
    setRecentSearches(DEFAULT_RECENT_SEARCHES);
    setMoviesInitialCategory("All");
    setSeriesDetailReturnScreen(SCREEN.SERIES);
    setSeriesReturnScreen(SCREEN.HOME);
    setMoviesReturnScreen(SCREEN.HOME);
    setMovieDetailReturnScreen(SCREEN.HOME);
    setMoviePlayReturnScreen(SCREEN.MOVIE_DETAIL);
    setFootballReturnScreen(SCREEN.HOME);
    setFootballDetailReturnScreen(SCREEN.HOME);
    setSearchReturnScreen(SCREEN.HOME);
    setSplashFinished(true);
    setCurrentPage(SCREEN.ONBOARDING);
  };

  const screenComponent = useMemo(() => {
    const screens = {
      [SCREEN.HOME]: (
        <HomeScreen
          onMoviePress={(movie) => openMovieDetail(movie, SCREEN.HOME)}
          onMoviesPress={(category) => openMovies(SCREEN.HOME, category ?? "All")}
          onFootballPress={(fixture) => openFootballDetail(fixture, SCREEN.HOME)}
          onSeeAllFootball={() => openFootballList(SCREEN.HOME)}
          onProfilePress={() => setCurrentPage(SCREEN.PROFILE)}
          onGetHelpPress={() => setCurrentPage(SCREEN.GET_HELP)}
          onSeriesPress={() => openSeries(SCREEN.HOME)}
          onCategoriesPress={() => setCurrentPage(SCREEN.CATEGORIES)}
          onHistoryPress={() => setCurrentPage(SCREEN.HISTORY)}
          onNotificationsPress={() => setCurrentPage(SCREEN.NOTIFICATIONS)}
          onSearchPress={() => openSearch(SCREEN.HOME)}
          onLogoutPress={handleLogout}
          onDeleteAccountPress={handleLogout}
        />
      ),
      [SCREEN.NOTIFICATIONS]: (
        <NotificationsScreen
          onBack={() => setCurrentPage(SCREEN.HOME)}
          onSearchPress={() => openSearch(SCREEN.NOTIFICATIONS)}
          onStartWatching={(item) => {
            if (item.type === "series") {
              openPlayFromSeries(item, SCREEN.NOTIFICATIONS);
            } else {
              openPlayFromMovie(item, SCREEN.NOTIFICATIONS);
            }
          }}
          onItemPress={(item) => {
            if (item.type === "series") {
              openSeriesDetail(item, SCREEN.NOTIFICATIONS);
            } else {
              openMovieDetail(item, SCREEN.NOTIFICATIONS);
            }
          }}
        />
      ),
      [SCREEN.HISTORY]: (
        <HistoryScreen
          onBack={() => setCurrentPage(SCREEN.HOME)}
          onSearchPress={() => openSearch(SCREEN.HISTORY)}
          onContinuePress={(item) => {
            if (item.type === "series") {
              openPlayFromSeries(item, SCREEN.HISTORY);
            } else {
              openPlayFromMovie(item, SCREEN.HISTORY);
            }
          }}
          onItemPress={(item) => {
            if (item.type === "series") {
              openSeriesDetail(item, SCREEN.HISTORY);
            } else {
              openMovieDetail(item, SCREEN.HISTORY);
            }
          }}
        />
      ),
      [SCREEN.CATEGORIES]: (
        <CategoriesScreen
          onBack={() => setCurrentPage(SCREEN.HOME)}
          onSearchPress={() => openSearch(SCREEN.CATEGORIES)}
          onCategoryPress={(category) => navigateFromCategory(category, SCREEN.CATEGORIES)}
        />
      ),
      [SCREEN.MOVIES]: (
        <MoviesScreen
          onBack={() => setCurrentPage(moviesReturnScreen)}
          onSearchPress={() => openSearch(SCREEN.MOVIES)}
          onMoviePress={(item) => openMovieDetail(item, SCREEN.MOVIES)}
          onWatchNow={(item) => openPlayFromMovie(item, SCREEN.MOVIES)}
          initialCategory={moviesInitialCategory}
        />
      ),
      [SCREEN.SERIES]: (
        <SeriesScreen
          onBack={() => setCurrentPage(seriesReturnScreen)}
          onSearchPress={() => openSearch(SCREEN.SERIES)}
          onSeriesPress={(item) => openSeriesDetail(item, SCREEN.SERIES)}
          onWatchNow={(item) => openPlayFromSeries(item, SCREEN.SERIES)}
        />
      ),
      [SCREEN.SERIES_DETAIL]: (
        <SeriesDetailScreen
          series={selectedSeries}
          onBack={() => {
            setCurrentPage(seriesDetailReturnScreen);
            if (
              seriesDetailReturnScreen === SCREEN.SERIES ||
              seriesDetailReturnScreen === SCREEN.HISTORY ||
              seriesDetailReturnScreen === SCREEN.NOTIFICATIONS
            ) {
              setSelectedSeries(null);
            }
          }}
          onPlay={() => openPlayFromSeries(selectedSeries, SCREEN.SERIES_DETAIL)}
          onSearchPress={() => openSearch(SCREEN.SERIES_DETAIL)}
        />
      ),
      [SCREEN.SEARCH]: (
        <SearchScreen
          recentSearches={recentSearches}
          onRecentSearchesChange={setRecentSearches}
          onBack={() => setCurrentPage(searchReturnScreen)}
          onCategoryPress={(category) => navigateFromCategory(category, SCREEN.SEARCH)}
          onMoviePress={(item) => openMovieDetail(item, SCREEN.SEARCH)}
        />
      ),
      [SCREEN.GET_HELP]: (
        <GetHelpScreen
          phoneNumber={displayPhone}
          onBack={() => setCurrentPage(SCREEN.HOME)}
          onSearchPress={() => openSearch(SCREEN.GET_HELP)}
        />
      ),
      [SCREEN.PROFILE]: (
        <ProfileScreen
          phoneNumber={displayPhone}
          username={authUser?.name ?? accountUsername}
          accountPassword={accountPassword}
          passwordUpdateSuccess={passwordUpdateSuccess}
          phoneUpdateSuccess={phoneUpdateSuccess}
          onUsernameChange={setAccountUsername}
          onBack={() => {
            setPasswordUpdateSuccess(false);
            setPhoneUpdateSuccess(false);
            setCurrentPage(SCREEN.HOME);
          }}
          onCreatePasswordPress={() => {
            setPasswordUpdateSuccess(false);
            setPhoneUpdateSuccess(false);
            setCurrentPage(SCREEN.SET_PROFILE_PASSWORD);
          }}
          onEditPhonePress={() => {
            setPhoneUpdateSuccess(false);
            setCurrentPage(SCREEN.EDIT_PHONE_NUMBER);
          }}
          onSearchPress={() => openSearch(SCREEN.PROFILE)}
        />
      ),
      [SCREEN.EDIT_PHONE_NUMBER]: (
        <EditPhoneNumberScreen
          phoneNumber={displayPhone}
          onBack={() => setCurrentPage(SCREEN.PROFILE)}
          onSearchPress={() => openSearch(SCREEN.EDIT_PHONE_NUMBER)}
          onSendOtp={(newPhone) => {
            setPendingPhoneNumber(newPhone);
            setCurrentPage(SCREEN.EDIT_PHONE_OTP);
          }}
        />
      ),
      [SCREEN.EDIT_PHONE_OTP]: (
        <EditPhoneOtpScreen
          phoneNumber={pendingPhoneNumber}
          onBack={() => setCurrentPage(SCREEN.EDIT_PHONE_NUMBER)}
          onSearchPress={() => openSearch(SCREEN.EDIT_PHONE_OTP)}
          onVerified={() => {
            setPhoneUpdateSuccess(true);
            setPendingPhoneNumber("");
            setCurrentPage(SCREEN.PROFILE);
          }}
        />
      ),
      [SCREEN.SET_PROFILE_PASSWORD]: (
        <SetProfilePasswordScreen
          onBack={() => setCurrentPage(SCREEN.PROFILE)}
          onSearchPress={() => openSearch(SCREEN.SET_PROFILE_PASSWORD)}
          onComplete={(password) => {
            setAccountPassword(password);
            setPasswordUpdateSuccess(true);
            setCurrentPage(SCREEN.PROFILE);
          }}
        />
      ),
      [SCREEN.FOOTBALL_LIST]: (
        <FootballScreen
          onBack={() => setCurrentPage(footballReturnScreen)}
          onMatchPress={(fixture) => openFootballDetail(fixture, SCREEN.FOOTBALL_LIST)}
          onSearchPress={() => openSearch(SCREEN.FOOTBALL_LIST)}
        />
      ),
      [SCREEN.FOOTBALL_DETAIL]: (
        <FootballDetailScreen
          match={selectedFootballMatch}
          onBack={() => {
            setCurrentPage(footballDetailReturnScreen);
            if (footballDetailReturnScreen === SCREEN.HOME) {
              setSelectedFootballMatch(null);
            }
          }}
          onMatchPress={(fixture) => openFootballDetail(fixture, footballDetailReturnScreen)}
          onSeeAllFootball={() => openFootballList(SCREEN.FOOTBALL_DETAIL)}
          onSearchPress={() => openSearch(SCREEN.FOOTBALL_DETAIL)}
        />
      ),
      [SCREEN.MOVIE_DETAIL]: (
        <MovieDetailScreen
          movie={selectedMovie}
          onBack={() => {
            setCurrentPage(movieDetailReturnScreen);
            if (movieDetailReturnScreen === SCREEN.HOME) {
              setSelectedMovie(null);
            }
          }}
          onPlay={() => openPlayFromMovie(selectedMovie, SCREEN.MOVIE_DETAIL)}
          onSearchPress={() => openSearch(SCREEN.MOVIE_DETAIL)}
        />
      ),
      [SCREEN.MOVIE_PLAY]: (
        <MoviePlayScreen
          movie={selectedMovie}
          onBack={() => setCurrentPage(moviePlayReturnScreen)}
        />
      ),
      [SCREEN.OTP]: (
        <OTPScreen onBack={goToOnboardingPhoneStep} />
      ),
      [SCREEN.PASSWORD]: (
        <PasswordScreen
          phoneNumber={phoneNumber}
          countryId={selectedCountryId}
          onBack={goToOnboardingPhoneStep}
          onForgotPassword={() => setCurrentPage(SCREEN.FORGOT_PASSWORD_PHONE)}
        />
      ),
      [SCREEN.FORGOT_PASSWORD_PHONE]: (
        <ForgotPasswordPhoneScreen
          onBack={() => setCurrentPage(SCREEN.PASSWORD)}
          onContinue={() => setCurrentPage(SCREEN.RESET_PASSWORD)}
        />
      ),
      [SCREEN.RESET_PASSWORD]: (
        <ResetPasswordScreen
          phoneNumber={displayPhone}
          onBack={() => setCurrentPage(SCREEN.FORGOT_PASSWORD_PHONE)}
          onContinue={() => setCurrentPage(SCREEN.HOME)}
        />
      ),
      [SCREEN.ONBOARDING]: (
        <OnboardingScreen
          key={resumeOnboardingAtPhone ? `phone-${phoneNumber}` : "start"}
          initialSlideIndex={resumeOnboardingAtPhone ? 2 : 0}
          initialPhoneNumber={resumeOnboardingAtPhone ? phoneNumber : ""}
          onContinue={(phone, countryId) => {
            setResumeOnboardingAtPhone(false);
            setPhoneNumber(phone);
            setSelectedCountryId(countryId);
            dispatch(authInitiateRequest({ phone, countryId }));
          }}
        />
      ),
      [SCREEN.CREATE_PASSWORD]: <CreatePasswordScreen />,
      [SCREEN.SPLASH]: (
        <SplashScreen
          onFinish={() => {
            setResumeOnboardingAtPhone(false);
            setSplashFinished(true);
          }}
        />
      ),
    };

    return screens[currentPage] ?? screens[SCREEN.SPLASH];
  }, [currentPage, phoneNumber, selectedCountryId, displayPhone, authUser, resumeOnboardingAtPhone, selectedMovie, selectedSeries, selectedFootballMatch, footballReturnScreen, footballDetailReturnScreen, seriesDetailReturnScreen, seriesReturnScreen, moviesReturnScreen, moviesInitialCategory, movieDetailReturnScreen, moviePlayReturnScreen, accountPassword, passwordUpdateSuccess, pendingPhoneNumber, phoneUpdateSuccess, accountUsername, searchReturnScreen, recentSearches]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141218" }}>
        <ActivityIndicator color="#E71809" />
      </View>
    );
  }

  return <SafeAreaProvider>{screenComponent}</SafeAreaProvider>;
}
