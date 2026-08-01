import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

import { tokens } from "./src/theme/tokens";
import { headingFont, bodyFont } from "./src/theme/fonts";
import { themes } from "./src/theme/themes";

/**
 * Teinc Food Business Tamagui Configuration
 *
 * Extends the default v5 config with our custom design system:
 * - Brand orange color palette
 * - Sen typography
 * - Light + dark themes
 * - Custom spacing, sizing, and radius scales
 */
const tamaguiConfig = createTamagui({
  ...defaultConfig,
  tokens,
  themes,
  fonts: {
    ...defaultConfig.fonts,
    heading: headingFont,
    body: bodyFont,
  },
  defaultFont: "body",
  media: {
    xs: { maxWidth: 390 }, // iPhone SE / mini portrait
    sm: { maxWidth: 767 }, // iPhone Pro Max landscape / small tablet
    md: { minWidth: 768, maxWidth: 1023 }, // iPad portrait / tablet split-view
    lg: { minWidth: 1024 }, // iPad landscape / iPad Pro or Tablet split-view
  },
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}
