import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
import { buildMovieDetail, resolveMoviePlayItem } from "./utils/movieDetail";
import { resolveMatchPlay } from "./utils/matchPlay";
import {
  noStreamBlock,
  showPlaybackBlockedAlert,
  subscriptionRequiredBlock,
} from "./utils/playback";
import { store } from "./store";
import { buildFootballDetail } from "./utils/football";
import { buildSeriesDetail, resolveSeriesPlayItem } from "./utils/seriesDetail";
import { selectMatches } from "./store/catalog/selectors";
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
  selectAuthForgotPasswordPhone,
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

const AUTH_FLOW_SCREENS = new Set([
  SCREEN.SPLASH,
  SCREEN.ONBOARDING,
  SCREEN.OTP,
  SCREEN.PASSWORD,
  SCREEN.CREATE_PASSWORD,
  SCREEN.FORGOT_PASSWORD_PHONE,
  SCREEN.RESET_PASSWORD,
]);

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
  const forgotPasswordPhone = useSelector(selectAuthForgotPasswordPhone);

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
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");
  const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);
  const [accountUsername, setAccountUsername] = useState("");
  const [playResolving, setPlayResolving] = useState(false);
  const [searchReturnScreen, setSearchReturnScreen] = useState(SCREEN.HOME);
  const [recentSearches, setRecentSearches] = useState([]);
  const catalogMatches = useSelector(selectMatches);

  const displayPhone = authUser?.phone ?? authPhone ?? "";

  const authSnapshotRef = useRef(null);

  useEffect(() => {
    dispatch(bootstrapRequest());
  }, [dispatch]);

  // Only redirect on auth *transitions* — never re-run routing for normal in-app navigation.
  useEffect(() => {
    if (!bootstrapped) return;

    const snapshot = {
      isAuthenticated,
      needsPasswordSetup,
      otpRequired,
      passwordRequired,
    };
    const previous = authSnapshotRef.current;
    authSnapshotRef.current = snapshot;

    if (splashFinished) {
      setCurrentPage((page) => {
        if (page !== SCREEN.SPLASH) {
          return page;
        }
        if (snapshot.needsPasswordSetup) {
          return SCREEN.CREATE_PASSWORD;
        }
        if (snapshot.isAuthenticated) {
          return SCREEN.HOME;
        }
        return SCREEN.ONBOARDING;
      });
    }

    if (!previous) {
      if (snapshot.needsPasswordSetup) {
        setCurrentPage(SCREEN.CREATE_PASSWORD);
      } else if (snapshot.passwordRequired) {
        setCurrentPage(SCREEN.PASSWORD);
      } else if (snapshot.otpRequired) {
        setCurrentPage(SCREEN.OTP);
      } else if (snapshot.isAuthenticated && splashFinished) {
        setCurrentPage(SCREEN.HOME);
      }
      return;
    }

    if (
      snapshot.needsPasswordSetup &&
      (!previous.needsPasswordSetup || previous.isAuthenticated !== snapshot.isAuthenticated)
    ) {
      setCurrentPage(SCREEN.CREATE_PASSWORD);
      return;
    }

    if (previous.needsPasswordSetup && !snapshot.needsPasswordSetup && snapshot.isAuthenticated) {
      setCurrentPage(SCREEN.HOME);
      return;
    }

    if (snapshot.isAuthenticated && !previous.isAuthenticated) {
      if (snapshot.needsPasswordSetup) {
        setCurrentPage(SCREEN.CREATE_PASSWORD);
      } else {
        setCurrentPage((page) => (AUTH_FLOW_SCREENS.has(page) ? SCREEN.HOME : page));
      }
      return;
    }

    if (snapshot.otpRequired && !previous.otpRequired) {
      setCurrentPage(SCREEN.OTP);
      return;
    }

    if (snapshot.passwordRequired && !previous.passwordRequired) {
      setCurrentPage(SCREEN.PASSWORD);
      return;
    }
  }, [
    bootstrapped,
    splashFinished,
    isAuthenticated,
    otpRequired,
    passwordRequired,
    needsPasswordSetup,
  ]);

  // Keep password setup ahead of Home when OTP verification completes.
  useEffect(() => {
    if (!needsPasswordSetup) {
      return;
    }

    setCurrentPage((page) => {
      if (page === SCREEN.CREATE_PASSWORD) {
        return page;
      }

      if (AUTH_FLOW_SCREENS.has(page)) {
        return SCREEN.CREATE_PASSWORD;
      }

      return page;
    });
  }, [needsPasswordSetup]);

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
    setSelectedFootballMatch(buildFootballDetail(fixture, catalogMatches));
    setCurrentPage(SCREEN.FOOTBALL_DETAIL);
  };

  const openSeriesDetail = (item, returnScreen = SCREEN.SERIES) => {
    setSeriesDetailReturnScreen(returnScreen);
    setSelectedSeries(buildSeriesDetail(item));
    setCurrentPage(SCREEN.SERIES_DETAIL);
  };

  const handlePlaybackBlocked = useCallback((blocked) => {
    showPlaybackBlockedAlert(blocked, {
      onViewProfile: () => setCurrentPage(SCREEN.PROFILE),
    });
  }, []);

  const openPlayFromSeries = async (item, returnScreen) => {
    const seriesId = item?.id != null ? String(item.id) : null;
    const cachedDetail = seriesId ? store.getState().catalog.seriesDetails[seriesId] : null;

    setPlayResolving(true);
    try {
      const { playItem, blocked } = await resolveSeriesPlayItem(item, cachedDetail);
      if (blocked || !playItem.movieUrl) {
        handlePlaybackBlocked(blocked ?? subscriptionRequiredBlock());
        return;
      }

      console.log("[Player] open series", {
        id: playItem.id,
        title: playItem.title,
        movieUrl: playItem.movieUrl,
      });
      setSelectedMovie(playItem);
      setMoviePlayReturnScreen(returnScreen);
      setCurrentPage(SCREEN.MOVIE_PLAY);
    } finally {
      setPlayResolving(false);
    }
  };

  const openMovieDetail = (item, returnScreen = SCREEN.HOME) => {
    setMovieDetailReturnScreen(returnScreen);
    setSelectedMovie(buildMovieDetail(item));
    setCurrentPage(SCREEN.MOVIE_DETAIL);
  };

  const openPlayFromMovie = async (item, returnScreen) => {
    const movieId = item?.id != null ? String(item.id) : null;
    const cachedDetail = movieId ? store.getState().catalog.movieDetails[movieId] : null;

    setPlayResolving(true);
    try {
      const { playItem, blocked } = await resolveMoviePlayItem(item, cachedDetail);
      if (blocked || !playItem.movieUrl) {
        handlePlaybackBlocked(blocked ?? subscriptionRequiredBlock());
        return;
      }

      console.log("[Player] open movie", {
        id: playItem.id,
        title: playItem.title,
        movieUrl: playItem.movieUrl,
      });
      setSelectedMovie(playItem);
      setMoviePlayReturnScreen(returnScreen);
      setCurrentPage(SCREEN.MOVIE_PLAY);
    } finally {
      setPlayResolving(false);
    }
  };

  const openPlayFromMatch = async (match, server, returnScreen) => {
    const matchId = match?.id ?? match?.apiId;
    const cachedDetail = matchId != null ? store.getState().catalog.matchDetails[String(matchId)] : null;

    setPlayResolving(true);
    try {
      const { match: resolvedMatch, server: playServer, blocked } = await resolveMatchPlay(
        match,
        server,
        cachedDetail,
      );

      if (blocked || !playServer?.url) {
        handlePlaybackBlocked(blocked ?? noStreamBlock());
        return;
      }

      console.log("[Player] open match", {
        matchId: resolvedMatch?.id ?? matchId,
        serverId: playServer.id,
        serverLabel: playServer.label,
        streamUrl: playServer.url,
      });

      setSelectedMovie({
        id: `match-${resolvedMatch?.id ?? matchId ?? "live"}`,
        title:
          resolvedMatch?.home && resolvedMatch?.away
            ? `${resolvedMatch.home} vs ${resolvedMatch.away}`
            : resolvedMatch?.title ?? match?.title ?? "Live match",
        image: resolvedMatch?.previewImage ?? match?.previewImage ?? null,
        categories: resolvedMatch?.league ?? match?.league ?? "",
        streamUrl: playServer.url,
        isLive: true,
        type: "match",
      });
      setMoviePlayReturnScreen(returnScreen);
      setCurrentPage(SCREEN.MOVIE_PLAY);
    } finally {
      setPlayResolving(false);
    }
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
    setPasswordUpdateSuccess(false);
    setPendingPhoneNumber("");
    setPhoneUpdateSuccess(false);
    setAccountUsername("");
    setRecentSearches([]);
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

  const renderScreen = () => {
    switch (currentPage) {
      case SCREEN.HOME:
        return (
        <HomeScreen
          onMoviePress={(movie) => openMovieDetail(movie, SCREEN.HOME)}
          onMoviesPress={(category) => openMovies(SCREEN.HOME, category ?? "All")}
          onFootballPress={(fixture) => openFootballDetail(fixture, SCREEN.HOME)}
          onSeeAllFootball={() => openFootballList(SCREEN.HOME)}
          onProfilePress={() => setCurrentPage(SCREEN.PROFILE)}
          onGetHelpPress={() => setCurrentPage(SCREEN.GET_HELP)}
          onSeriesPress={() => openSeries(SCREEN.HOME)}
          onSeriesItemPress={(item) => openSeriesDetail(item, SCREEN.HOME)}
          onCategoriesPress={() => setCurrentPage(SCREEN.CATEGORIES)}
          onHistoryPress={() => setCurrentPage(SCREEN.HISTORY)}
          onNotificationsPress={() => setCurrentPage(SCREEN.NOTIFICATIONS)}
          onSearchPress={() => openSearch(SCREEN.HOME)}
          onLogoutPress={handleLogout}
          onDeleteAccountPress={handleLogout}
        />
        );
      case SCREEN.NOTIFICATIONS:
        return (
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
        );
      case SCREEN.HISTORY:
        return (
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
        );
      case SCREEN.CATEGORIES:
        return (
        <CategoriesScreen
          onBack={() => setCurrentPage(SCREEN.HOME)}
          onSearchPress={() => openSearch(SCREEN.CATEGORIES)}
          onCategoryPress={(category) => navigateFromCategory(category, SCREEN.CATEGORIES)}
        />
        );
      case SCREEN.MOVIES:
        return (
        <MoviesScreen
          onBack={() => setCurrentPage(moviesReturnScreen)}
          onSearchPress={() => openSearch(SCREEN.MOVIES)}
          onMoviePress={(item) => openMovieDetail(item, SCREEN.MOVIES)}
          onWatchNow={(item) => openPlayFromMovie(item, SCREEN.MOVIES)}
          initialCategory={moviesInitialCategory}
        />
        );
      case SCREEN.SERIES:
        return (
        <SeriesScreen
          onBack={() => setCurrentPage(seriesReturnScreen)}
          onSearchPress={() => openSearch(SCREEN.SERIES)}
          onSeriesPress={(item) => openSeriesDetail(item, SCREEN.SERIES)}
          onWatchNow={(item) => openPlayFromSeries(item, SCREEN.SERIES)}
        />
        );
      case SCREEN.SERIES_DETAIL:
        return (
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
          onPlay={(series) => openPlayFromSeries(series ?? selectedSeries, SCREEN.SERIES_DETAIL)}
          onSearchPress={() => openSearch(SCREEN.SERIES_DETAIL)}
        />
        );
      case SCREEN.SEARCH:
        return (
        <SearchScreen
          recentSearches={recentSearches}
          onRecentSearchesChange={setRecentSearches}
          onBack={() => setCurrentPage(searchReturnScreen)}
          onCategoryPress={(category) => navigateFromCategory(category, SCREEN.SEARCH)}
          onMoviePress={(item) => openMovieDetail(item, SCREEN.SEARCH)}
          onSeriesPress={(item) => openSeriesDetail(item, SCREEN.SEARCH)}
        />
        );
      case SCREEN.GET_HELP:
        return (
        <GetHelpScreen
          phoneNumber={displayPhone}
          onBack={() => setCurrentPage(SCREEN.HOME)}
          onSearchPress={() => openSearch(SCREEN.GET_HELP)}
        />
        );
      case SCREEN.PROFILE:
        return (
        <ProfileScreen
          phoneNumber={displayPhone}
          username={authUser?.name ?? accountUsername}
          hasAccountPassword={isAuthenticated}
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
        );
      case SCREEN.EDIT_PHONE_NUMBER:
        return (
        <EditPhoneNumberScreen
          phoneNumber={displayPhone}
          onBack={() => setCurrentPage(SCREEN.PROFILE)}
          onSearchPress={() => openSearch(SCREEN.EDIT_PHONE_NUMBER)}
          onSendOtp={(newPhone) => {
            setPendingPhoneNumber(newPhone);
            setCurrentPage(SCREEN.EDIT_PHONE_OTP);
          }}
        />
        );
      case SCREEN.EDIT_PHONE_OTP:
        return (
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
        );
      case SCREEN.SET_PROFILE_PASSWORD:
        return (
        <SetProfilePasswordScreen
          onBack={() => setCurrentPage(SCREEN.PROFILE)}
          onSearchPress={() => openSearch(SCREEN.SET_PROFILE_PASSWORD)}
          onComplete={() => {
            setPasswordUpdateSuccess(true);
            setCurrentPage(SCREEN.PROFILE);
          }}
        />
        );
      case SCREEN.FOOTBALL_LIST:
        return (
        <FootballScreen
          onBack={() => setCurrentPage(footballReturnScreen)}
          onMatchPress={(fixture) => openFootballDetail(fixture, SCREEN.FOOTBALL_LIST)}
          onSearchPress={() => openSearch(SCREEN.FOOTBALL_LIST)}
        />
        );
      case SCREEN.FOOTBALL_DETAIL:
        return (
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
          onPlayMatch={(match, server) => openPlayFromMatch(match, server, SCREEN.FOOTBALL_DETAIL)}
          onPlaybackBlocked={() => handlePlaybackBlocked(subscriptionRequiredBlock())}
        />
        );
      case SCREEN.MOVIE_DETAIL:
        return (
        <MovieDetailScreen
          movie={selectedMovie}
          onBack={() => {
            setCurrentPage(movieDetailReturnScreen);
            if (movieDetailReturnScreen === SCREEN.HOME) {
              setSelectedMovie(null);
            }
          }}
          onPlay={(movie) => openPlayFromMovie(movie ?? selectedMovie, SCREEN.MOVIE_DETAIL)}
          onSearchPress={() => openSearch(SCREEN.MOVIE_DETAIL)}
        />
        );
      case SCREEN.MOVIE_PLAY:
        return (
        <MoviePlayScreen
          movie={selectedMovie}
          onBack={() => setCurrentPage(moviePlayReturnScreen)}
        />
        );
      case SCREEN.OTP:
        return <OTPScreen onBack={goToOnboardingPhoneStep} />;
      case SCREEN.PASSWORD:
        return (
        <PasswordScreen
          phoneNumber={phoneNumber}
          countryId={selectedCountryId}
          onBack={goToOnboardingPhoneStep}
          onForgotPassword={() => setCurrentPage(SCREEN.FORGOT_PASSWORD_PHONE)}
        />
        );
      case SCREEN.FORGOT_PASSWORD_PHONE:
        return (
        <ForgotPasswordPhoneScreen
          initialCountryId={selectedCountryId}
          onBack={() => setCurrentPage(SCREEN.PASSWORD)}
          onOtpSent={() => setCurrentPage(SCREEN.RESET_PASSWORD)}
        />
        );
      case SCREEN.RESET_PASSWORD:
        return (
        <ResetPasswordScreen
          phoneNumber={forgotPasswordPhone ?? phoneNumber}
          onBack={() => setCurrentPage(SCREEN.FORGOT_PASSWORD_PHONE)}
          onSuccess={() => setCurrentPage(SCREEN.PASSWORD)}
        />
        );
      case SCREEN.ONBOARDING:
        return (
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
        );
      case SCREEN.CREATE_PASSWORD:
        return <CreatePasswordScreen />;
      case SCREEN.SPLASH:
      default:
        return (
        <SplashScreen
          onFinish={() => {
            setResumeOnboardingAtPhone(false);
            setSplashFinished(true);
          }}
        />
        );
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141218" }}>
        <ActivityIndicator color="#E71809" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {renderScreen()}
      {playResolving ? (
        <View style={styles.playResolvingOverlay} pointerEvents="auto">
          <ActivityIndicator color="#E71809" size="large" />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  playResolvingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 18, 24, 0.72)",
  },
});
