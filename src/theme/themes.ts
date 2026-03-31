import { tokens } from "./tokens";

/**
 * Light and dark themes for TeincFoods.
 * Maps semantic token names to concrete color values or token variables.
 */

export const lightTheme = {
  background: tokens.color.white,
  backgroundStrong: tokens.color.gray50,
  backgroundSoft: tokens.color.gray100,
  backgroundHover: tokens.color.gray50,
  backgroundPress: tokens.color.gray100,
  backgroundFocus: tokens.color.gray50,
  backgroundTransparent: tokens.color.transparent,

  color: tokens.color.navy,
  colorSecondary: tokens.color.gray600,
  colorMuted: tokens.color.gray400,
  colorDisabled: tokens.color.gray300,
  colorPlaceholder: tokens.color.gray400,

  primary: tokens.color.orange,
  primaryLight: tokens.color.orangeLight,
  primaryDark: tokens.color.orangeDark,
  primaryMuted: tokens.color.orangeMuted,

  borderColor: tokens.color.gray200,
  borderColorHover: tokens.color.gray400,
  borderColorFocus: tokens.color.orange,

  error: tokens.color.red,
  success: tokens.color.green,
  info: tokens.color.blue,
  star: tokens.color.starOrange,

  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowColorStrong: "rgba(0, 0, 0, 0.12)",
};

export const darkTheme = {
  background: "#121218",
  backgroundStrong: "#0D0D12",
  backgroundSoft: "#1C1C24",
  backgroundHover: "#1C1C24",
  backgroundPress: "#24242E",
  backgroundFocus: "#1C1C24",
  backgroundTransparent: tokens.color.transparent,

  color: "#F5F5F7",
  colorSecondary: "#A1A1AA",
  colorMuted: "#71717A",
  colorDisabled: "#3F3F46",
  colorPlaceholder: "#71717A",

  primary: tokens.color.orange,
  primaryLight: "#2A1A0F",
  primaryDark: tokens.color.orangeDark,
  primaryMuted: "rgba(255, 118, 34, 0.2)",

  borderColor: "#27272A",
  borderColorHover: "#3F3F46",
  borderColorFocus: tokens.color.orange,

  error: "#FF453A",
  success: "#30D158",
  info: "#0A84FF",
  star: tokens.color.starOrange,

  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowColorStrong: "rgba(0, 0, 0, 0.5)",
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
