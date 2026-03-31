// @ts-nocheck
import { YStack, XStack, Separator } from 'tamagui';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <AnimatedYStack
      style={[{ width, height, borderRadius }, animatedStyle]}
      backgroundColor="$gray200"
    />
  );
}

/** A full card skeleton matching FoodCard dimensions */
export function FoodCardSkeleton() {
  return (
    <YStack width={160} marginRight="$4" gap="$2">
      <Skeleton height={120} borderRadius={16} />
      <Skeleton width="80%" height={14} />
      <Skeleton width="50%" height={12} />
      <XStack justifyContent="space-between" alignItems="center" marginTop="$1">
        <Skeleton width={50} height={16} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </XStack>
    </YStack>
  );
}

/** A full card skeleton matching RestaurantCard dimensions */
export function RestaurantCardSkeleton() {
  return (
    <YStack width="100%" marginBottom="$4" gap="$2">
      <Skeleton height={140} borderRadius={16} />
      <Skeleton width="60%" height={18} />
      <Skeleton width="40%" height={14} />
      <XStack gap="$4" marginTop="$1">
        <Skeleton width={80} height={14} />
        <Skeleton width={100} height={14} />
      </XStack>
    </YStack>
  );
}

/** A full card skeleton matching OrderHistoryCard dimensions */
export function OrderCardSkeleton() {
  return (
    <YStack backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4" gap="$4" marginBottom="$3" borderWidth={1} borderColor="$borderColor">
      <XStack justifyContent="space-between" alignItems="center">
        <Skeleton width={100} height={16} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </XStack>
      <XStack gap="$3" alignItems="center">
        <Skeleton width={48} height={48} borderRadius={8} />
        <YStack gap="$2" flex={1}>
          <Skeleton width="80%" height={16} />
          <Skeleton width="40%" height={14} />
        </YStack>
      </XStack>
      <Separator borderColor="$borderColor" />
      <XStack justifyContent="space-between" alignItems="center">
        <Skeleton width={80} height={14} />
        <Skeleton width={60} height={16} />
      </XStack>
    </YStack>
  );
}
