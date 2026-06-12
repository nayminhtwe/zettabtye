import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { findNodeHandle, StyleSheet, Text, View } from "react-native";
import FocusablePressable from "./FocusablePressable";
import { COUNTRIES, getCountryById } from "../constants/countries";
import { gillSans } from "../constants/fonts";
import {
  authCountryOptionFocused,
  authCountrySelectorBase,
  authCountrySelectorFocused,
} from "../constants/focusStyles";

export default function CountrySelector({
  selectedCountryId,
  onCountryChange,
  disabled = false,
  isOpen,
  onOpenChange,
  selectorRef,
  optionRefs,
  nextFocusUp,
  nextFocusDownWhenClosed,
}) {
  const internalOptionRefs = useRef({});
  const optionsRef = optionRefs ?? internalOptionRefs;
  const [selectorFocused, setSelectorFocused] = useState(false);
  const [focusedOptionId, setFocusedOptionId] = useState(null);

  const selectedCountry = getCountryById(selectedCountryId);

  const toggleDropdown = () => {
    onOpenChange?.(!isOpen);
  };

  const selectCountry = (countryId) => {
    onCountryChange?.(countryId);
    onOpenChange?.(false);
  };

  const getOptionUpTarget = (countryId) => {
    const index = COUNTRIES.findIndex((country) => country.id === countryId);
    if (index > 0) {
      const prevCountry = COUNTRIES[index - 1];
      return findNodeHandle(optionsRef.current[prevCountry.id]) ?? undefined;
    }
    return findNodeHandle(selectorRef?.current) ?? nextFocusUp ?? undefined;
  };

  const getOptionDownTarget = (countryId) => {
    const index = COUNTRIES.findIndex((country) => country.id === countryId);
    const nextCountry = COUNTRIES[index + 1];
    if (nextCountry) {
      return findNodeHandle(optionsRef.current[nextCountry.id]) ?? undefined;
    }
    return nextFocusDownWhenClosed;
  };

  return (
    <View style={styles.countrySection}>
      <FocusablePressable
        ref={selectorRef}
        style={[
          styles.countrySelector,
          authCountrySelectorBase,
          selectorFocused ? authCountrySelectorFocused : null,
        ]}
        onPress={toggleDropdown}
        disabled={disabled}
        onFocus={() => setSelectorFocused(true)}
        onBlur={() => setSelectorFocused(false)}
        nextFocusUp={nextFocusUp}
        nextFocusDown={
          isOpen
            ? findNodeHandle(optionsRef.current[COUNTRIES[0].id]) ?? undefined
            : nextFocusDownWhenClosed
        }
      >
        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
        <Text style={styles.countryName}>{selectedCountry.name}</Text>
        <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color="#D2D2D2"
        />
      </FocusablePressable>

      {isOpen ? (
        <View style={styles.countryDropdown}>
          {COUNTRIES.map((country) => {
            const isSelected = country.id === selectedCountryId;
            return (
              <FocusablePressable
                key={country.id}
                ref={(node) => {
                  optionsRef.current[country.id] = node;
                }}
                style={[
                  styles.countryOption,
                  authCountrySelectorBase,
                  isSelected ? styles.countryOptionSelected : null,
                  focusedOptionId === country.id ? authCountryOptionFocused : null,
                ]}
                onPress={() => selectCountry(country.id)}
                onFocus={() => setFocusedOptionId(country.id)}
                onBlur={() => setFocusedOptionId(null)}
                nextFocusUp={getOptionUpTarget(country.id)}
                nextFocusDown={getOptionDownTarget(country.id)}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryName}>{country.name}</Text>
                <Text style={styles.countryDialCode}>{country.dialCode}</Text>
              </FocusablePressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function getPhoneFieldUpTarget(isCountryDropdownOpen, optionRefs, selectorRef) {
  if (isCountryDropdownOpen) {
    const lastCountry = COUNTRIES[COUNTRIES.length - 1];
    return findNodeHandle(optionRefs.current[lastCountry.id]) ?? undefined;
  }
  return findNodeHandle(selectorRef?.current) ?? undefined;
}

const styles = StyleSheet.create({
  countrySection: {
    marginBottom: 12,
  },
  countrySelector: {
    minHeight: 64,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 8,
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
});
