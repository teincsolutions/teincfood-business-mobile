import { tokens } from "./tokens";

/**
 * Light and dark themes for TeincFoods.
 * Maps semantic token names to concrete color values or token variables.
 */

export const lightTheme = {
  background: tokens.color.white,
  backgroundOrange: tokens.color.orangeLight,
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
  successMuted: "rgba(52, 199, 89, 0.15)",
  info: tokens.color.blue,
  infoMuted: "rgba(0, 122, 255, 0.12)",
  warning: tokens.color.yellow,
  warningMuted: "rgba(255, 204, 0, 0.15)",
  star: tokens.color.starOrange,

  shadowColor: "rgba(0, 0, 0, 0.06)",
  shadowColorStrong: "rgba(0, 0, 0, 0.12)",
};

export const darkTheme = {
  background: "#121218",
  backgroundStrong: "#0D0D12",
  backgroundOrange: "#2A1A0F",
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
  successDark: tokens.color.greenDark,
  successMuted: "rgba(48, 209, 88, 0.15)",
  info: "#0A84FF",
  infoDark: tokens.color.blueDark,
  infoMuted: "rgba(10, 132, 255, 0.15)",
  warning: "#FFD60A",
  warningDark: tokens.color.yellowDark,
  warningMuted: "rgba(255, 214, 10, 0.15)",
  star: tokens.color.starOrange,

  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowColorStrong: "rgba(0, 0, 0, 0.5)",
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
