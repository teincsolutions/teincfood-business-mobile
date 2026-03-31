import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

import { tokens } from './src/theme/tokens';
import { headingFont, bodyFont } from './src/theme/fonts';
import { themes } from './src/theme/themes';

/**
 * TeincFoods Tamagui Configuration
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
  defaultFont: 'body',
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
