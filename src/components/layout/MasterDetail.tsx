// @ts-nocheck
import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";
import { useResponsive } from "@/utils/responsive";

interface MasterDetailProps {
  master: ReactNode;
  detail?: ReactNode;
  /** Shown in the detail pane until a row is selected. */
  empty?: ReactNode;
  /** Override the automatic tablet-landscape decision (useful for tests). */
  enabled?: boolean;
  masterWidth?: number;
  maxWidth?: number;
}

/**
 * Tablet-landscape master/detail split.
 *
 * On phones and portrait tablets it renders only the master list, so the
 * existing push-navigation keeps working. In landscape it pins the list to the
 * left and gives the selected record the remaining space, capped at the wide
 * content width.
 */
export function MasterDetail({
  master,
  detail,
  empty,
  enabled,
  masterWidth,
  maxWidth = 1060,
}: MasterDetailProps) {
  const { isTablet, isLandscape, isLargeTablet } = useResponsive();
  const isTwoPane = enabled ?? (isTablet && isLandscape && isLargeTablet);

  if (!isTwoPane) {
    return <>{master}</>;
  }

  const width = masterWidth ?? (isLargeTablet ? 340 : 280);

  return (
    <XStack
      flex={1}
      width="100%"
      maxWidth={maxWidth}
      alignSelf="center"
      overflow="hidden"
    >
      <YStack
        width={width}
        flexShrink={0}
        borderRightWidth={1}
        borderRightColor="$borderColor"
      >
        {master}
      </YStack>

      <YStack flex={1} minWidth={0}>
        {detail ?? empty}
      </YStack>
    </XStack>
  );
}
