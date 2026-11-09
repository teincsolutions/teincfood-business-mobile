// @ts-nocheck
import { FlatList } from "react-native";
import { YStack, XStack, Text, Spinner, Separator, useMedia } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight, ArrowDownLeft, Clock } from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { useWalletHistoryQuery } from "@teincfood/core";

function formatMinor(amount: number, currency = "GHS") {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const media = useMedia();
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useWalletHistoryQuery();

  const entries = (data ?? []) as { type: string; amount_minor: number }[];

  const renderItem = ({ item }) => {
    const isCredit = item.type === "credit";
    const amountMinor = Math.abs(item.amount_minor);

    return (
      <XStack gap="$3" padding="$3" alignItems="center">
        <YStack
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={isCredit ? "$green2" : "$red2"}
          alignItems="center"
          justifyContent="center"
        >
          {isCredit ? (
            <ArrowDownLeft size={16} color="$green10" />
          ) : (
            <ArrowUpRight size={16} color="$red10" />
          )}
        </YStack>
        <YStack flex={1} gap="$1">
          <Text
            fontSize="$4"
            fontWeight="500"
            fontFamily="$body"
            color="$color"
          >
            {item.description || (isCredit ? "Credit" : "Debit")}
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {formatDate(item.inserted_at)}
          </Text>
          {Number(item.metadata?.fee_minor) > 0 ? (
            <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
              Charges: {formatMinor(Number(item.metadata.fee_minor), item.currency)}
            </Text>
          ) : null}
        </YStack>
        <YStack maxWidth={"30%"} alignItems="flex-end">
          <Text
            fontSize="$4"
            fontWeight="600"
            fontFamily="$heading"
            color={isCredit ? "$green10" : "$color"}
          >
            {isCredit ? "+" : "-"}
            {formatMinor(amountMinor, item.currency)}
          </Text>
          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
            Bal: {formatMinor(item.balance_after, item.currency)}
          </Text>
        </YStack>
      </XStack>
    );
  };

  const ListEmpty = () => {
    if (isLoading) {
      return (
        <YStack alignItems="center" paddingTop="$10">
          <Spinner size="large" color="$primary" />
        </YStack>
      );
    }
    return (
      <YStack alignItems="center" paddingTop="$10" gap="$3">
        <Clock size={48} color="$colorMuted" />
        <Text
          fontSize="$5"
          fontWeight="600"
          fontFamily="$heading"
          color="$colorSecondary"
        >
          No transactions yet
        </Text>
        <Text
          fontSize="$3"
          color="$colorMuted"
          fontFamily="$body"
          textAlign="center"
        >
          Your wallet transactions will appear here
        </Text>
      </YStack>
    );
  };

  const ListFooter = () => {
    if (isFetchingNextPage) {
      return (
        <YStack padding="$4" alignItems="center">
          <Spinner size="small" color="$primary" />
        </YStack>
      );
    }
    if (hasNextPage) {
      return (
        <YStack padding="$4" alignItems="center">
          <Button variant="outline" onPress={() => fetchNextPage()}>
            Load More
          </Button>
        </YStack>
      );
    }
    return null;
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Fixed header */}
      <YStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 16)}
        backgroundColor="$background"
      >
        <XStack gap="$2" alignItems="center">
          <BackButton />
          <YStack gap="$1" flex={1}>
            <Text
              fontSize="$8"
              fontWeight="bold"
              fontFamily="$heading"
              color="$color"
            >
              Transactions
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Your wallet transaction history
            </Text>
          </YStack>
        </XStack>
      </YStack>

      {/* Transaction list */}
      <YStack
        flex={1}
        paddingHorizontal="$4"
        alignSelf="center"
        width="100%"
        {...(media.md || media.lg ? { maxWidth: 600 } : {})}
      >
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          ItemSeparatorComponent={() => <Separator />}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 20,
          }}
          initialNumToRender={20}
        />
      </YStack>
    </YStack>
  );
}
