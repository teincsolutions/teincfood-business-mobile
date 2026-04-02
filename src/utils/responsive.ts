import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const isLargeTablet = width >= 1024;

  const columns = (minItemWidth: number) =>
    Math.max(1, Math.floor(width / minItemWidth));

  return { width, height, isTablet, isLargeTablet, isLandscape, columns };
}