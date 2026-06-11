export const COUNTRIES = [
  { id: "MM", name: "Myanmar", dialCode: "+95", flag: "🇲🇲" },
  { id: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { id: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
];

export const DEFAULT_COUNTRY_ID = "MM";

export function getCountryById(countryId) {
  return COUNTRIES.find((country) => country.id === countryId) ?? COUNTRIES[0];
}
