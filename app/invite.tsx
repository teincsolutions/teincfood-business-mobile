// @ts-nocheck — Tamagui stack props (alignItems/padding/etc.) don't typecheck
// under this repo's tsconfig; every other Tamagui screen uses the same escape.
// Universal-link entry: https://food.teincsolutions.com/invite?code=XXXXXX
// opens here when the app is installed; forward the code to Invitations.
import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { YStack, Spinner } from "tamagui";

export default function InviteDeepLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    router.replace({
      pathname: "/(shared)/invitations",
      params: typeof code === "string" && code.trim() ? { code: code.trim() } : {},
    });
  }, [code]);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center">
      <Spinner size="large" />
    </YStack>
  );
}
