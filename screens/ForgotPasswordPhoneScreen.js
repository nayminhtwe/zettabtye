import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import CountrySelector, { getPhoneFieldUpTarget } from "../components/CountrySelector";
import FloatingPhoneInput from "../components/FloatingPhoneInput";
import ScreenHeader from "../components/ScreenHeader";
import { DEFAULT_COUNTRY_ID } from "../constants/countries";
import { gillSans } from "../constants/fonts";
import { authPrimaryButtonFocused } from "../constants/focusStyles";
import { authClearError, authForgotPasswordRequest } from "../store/auth/actions";
import {
  selectAuthError,
  selectAuthForgotPasswordTransactionId,
  selectAuthLoading,
} from "../store/auth/selectors";
import { getPhoneValidationError } from "../utils/phoneAuth";

export default function ForgotPasswordPhoneScreen({
  initialCountryId = DEFAULT_COUNTRY_ID,
  onBack,
  onOtpSent,
}) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const transactionId = useSelector(selectAuthForgotPasswordTransactionId);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState(initialCountryId);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [continueFocused, setContinueFocused] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const submittedRef = useRef(false);
  const lastTransactionIdRef = useRef(null);

  const backRef = useRef(null);
  const countrySelectorRef = useRef(null);
  const countryOptionRefs = useRef({});
  const phoneInputRef = useRef(null);
  const continueRef = useRef(null);

  const phoneFieldUpTarget = getPhoneFieldUpTarget(
    isCountryDropdownOpen,
    countryOptionRefs,
    countrySelectorRef,
  );

  useEffect(() => {
    dispatch(authClearError());
    return () => {
      dispatch(authClearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (
      submittedRef.current &&
      transactionId &&
      transactionId !== lastTransactionIdRef.current
    ) {
      submittedRef.current = false;
      lastTransactionIdRef.current = transactionId;
      onOtpSent?.();
    }
  }, [transactionId, onOtpSent]);

  useEffect(() => {
    if (submittedRef.current && !isLoading && !authError && !transactionId) {
      submittedRef.current = false;
      setInfoMessage(
        "If an account exists for this phone number, an OTP has been sent via SMS.",
      );
    }
  }, [isLoading, authError, transactionId]);

  const handleContinue = () => {
    const validationError = getPhoneValidationError(phoneNumber, selectedCountryId);

    setPhoneError(validationError ?? "");
    setInfoMessage("");

    if (validationError || isLoading) {
      return;
    }

    submittedRef.current = true;
    dispatch(authForgotPasswordRequest({ phone: phoneNumber, countryId: selectedCountryId }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarSpacer} />

      <ScreenHeader
        title="Forgot Password"
        backRef={backRef}
        onBack={onBack}
        isBackFocused={backFocused}
        backFocusProps={{
          onFocus: () => setBackFocused(true),
          onBlur: () => setBackFocused(false),
          nextFocusDown: findNodeHandle(countrySelectorRef.current) ?? undefined,
        }}
      />

      <View style={styles.content}>
        <Text style={styles.message}>
          Enter your phone number to receive an OTP code and reset your password. You can request
          one code per day.
        </Text>

        <View style={styles.phoneSection}>
          <CountrySelector
            selectedCountryId={selectedCountryId}
            onCountryChange={(countryId) => {
              setSelectedCountryId(countryId);
              if (phoneError) {
                setPhoneError("");
              }
            }}
            disabled={isLoading}
            isOpen={isCountryDropdownOpen}
            onOpenChange={setIsCountryDropdownOpen}
            selectorRef={countrySelectorRef}
            optionRefs={countryOptionRefs}
            nextFocusUp={findNodeHandle(backRef.current) ?? undefined}
            nextFocusDownWhenClosed={findNodeHandle(phoneInputRef.current) ?? undefined}
          />

          <FloatingPhoneInput
            inputRef={phoneInputRef}
            value={phoneNumber}
            onChangeText={(value) => {
              setPhoneNumber(value);
              if (phoneError) {
                setPhoneError("");
              }
              if (infoMessage) {
                setInfoMessage("");
              }
            }}
            editable={!isLoading}
            focusableProps={{
              nextFocusUp: phoneFieldUpTarget,
              nextFocusDown: findNodeHandle(continueRef.current) ?? undefined,
            }}
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[styles.continueText, continueFocused ? styles.continueTextFocused : null]}
            >
              Continue
            </Text>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  message: {
    color: "#D2D2D2",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    ...gillSans("400"),
    textAlign: "center",
  },
  phoneSection: {
    marginTop: 32,
  },
  errorText: {
    marginTop: 8,
    color: "#E71809",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  infoText: {
    marginTop: 8,
    color: "#A7A7A7",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  continueButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C80D00",
    backgroundColor: "#C80D00",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonFocused: authPrimaryButtonFocused,
  continueText: {
    color: "#D2D2D2",
    fontSize: 20,
    lineHeight: 24,
    ...gillSans("600"),
  },
  continueTextFocused: {
    color: "#C80D00",
  },
});
