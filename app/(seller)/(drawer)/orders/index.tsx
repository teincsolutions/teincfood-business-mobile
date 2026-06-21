// @ts-nocheck
import { useState } from "react";
import {
  YStack,
  Text,
  Card,
  Button,
  XStack,
  Separator,
  CardHeader,
  Spinner,
} from "tamagui";
import { Filter, X, Check } from "@tamagui/lucide-icons";
import { ScrollView, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSellerOrdersQuery } from "@/hooks/seller.hooks";
import { useResponsive } from "@/utils/responsive";
import { formatPrice, DEFAULT_CURRENCY } from "@/utils/currency";
/**
 * Seller Orders Screen
 */
export default function SellerOrders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLargeTablet, isTablet } = useResponsive();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { data, isLoading } = useSellerOrdersQuery();
  const orders = data?.orders || [];

  const filterOptions = ["pending", "preparing", "ready", "delivered"];

  const filteredOrders =
    selectedFilters.length === 0
      ? orders
      : orders.filter((order) => selectedFilters.includes(order.status));

  // Group orders by status for responsive columns
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
  const preparingOrders = filteredOrders.filter(
    (o) => o.status === "preparing",
  );
  const doneOrders = filteredOrders.filter((o) =>
    ["ready", "delivered"].includes(o.status),
  );

  const toggleFilter = (status: string) => {
    setSelectedFilters((prev) =>
      prev.includes(status)
        ? prev.filter((f) => f !== status)
        : [...prev, status],
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "$yellow9";
      case "preparing":
        return "$blue9";
      case "ready":
        return "$green9";
      case "delivered":
        return "$gray9";
      default:
        return "$gray9";
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack padding="$4" justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="bold">
          Orders
        </Text>
        <Button
          height={40}
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor={selectedFilters.length > 0 ? "$blue9" : "$borderColor"}
          borderRadius="$3"
          backgroundColor={
            selectedFilters.length > 0 ? "$blue2" : "$background"
          }
          onPress={() => setFilterModalVisible(true)}
          icon={
            <Filter
              size={16}
              color={selectedFilters.length > 0 ? "$blue9" : "$color"}
            />
          }
        >
          <Text
            fontFamily="$body"
            fontWeight="600"
            fontSize="$3"
            color={selectedFilters.length > 0 ? "$blue9" : "$color"}
          >
            Filter
            {selectedFilters.length > 0 ? ` (${selectedFilters.length})` : ""}
          </Text>
        </Button>
      </XStack>

      {isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      ) : (
        <ScrollView>
          {isTablet ? (
            <XStack padding="$4" gap="$4" alignItems="flex-start">
              {/* Column 1: Pending — always isolated on tablet */}
              <YStack flex={1} gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$5" fontWeight="bold" color="$yellow9">
                    Pending
                  </Text>
                  <Text fontSize="$3" color="$colorMuted">
                    {pendingOrders.length}
                  </Text>
                </XStack>
                {pendingOrders.length === 0 ? (
                  <Card
                    padding="$5"
                    alignItems="center"
                    backgroundColor="$backgroundSoft"
                  >
                    <Text color="$colorMuted">No pending orders</Text>
                  </Card>
                ) : (
                  pendingOrders.map((order) => (
                    <Card key={order.id} padding="$4" bordered>
                      <YStack gap="$3">
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text fontWeight="bold">{order.orderNumber}</Text>
                          <YStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                            backgroundColor={getStatusColor(order.status)}
                          >
                            <Text
                              color="$background"
                              fontSize="$2"
                              textTransform="capitalize"
                            >
                              {order.status}
                            </Text>
                          </YStack>
                        </XStack>
                        <XStack justifyContent="space-between">
                          <Text color="$colorMuted">{order.customer}</Text>
                          <Text color="$colorMuted">{order.items} items</Text>
                        </XStack>
                        <Separator />
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text fontWeight="bold">
                            {formatPrice(
                              order.total,
                              order.currency || DEFAULT_CURRENCY,
                            )}
                          </Text>
                          <Button
                            variant="outline"
                            width="auto"
                            height={40}
                            paddingHorizontal="$3"
                            onPress={() =>
                              router.push(`/(seller)/orders/${order.id}`)
                            }
                          >
                            View Details
                          </Button>
                        </XStack>
                      </YStack>
                    </Card>
                  ))
                )}
              </YStack>

              {isLargeTablet ? (
                // 3-column: Preparing and Done each get their own flex column
                <>
                  <YStack flex={1} gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold" color="$blue9">
                        Preparing
                      </Text>
                      <Text fontSize="$3" color="$colorMuted">
                        {preparingOrders.length}
                      </Text>
                    </XStack>
                    {preparingOrders.length === 0 ? (
                      <Card
                        padding="$5"
                        alignItems="center"
                        backgroundColor="$backgroundSoft"
                      >
                        <Text color="$colorMuted">
                          No orders being prepared
                        </Text>
                      </Card>
                    ) : (
                      preparingOrders.map((order) => (
                        <Card key={order.id} padding="$4" bordered>
                          <YStack gap="$3">
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">{order.orderNumber}</Text>
                              <YStack
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                borderRadius="$2"
                                backgroundColor={getStatusColor(order.status)}
                              >
                                <Text
                                  color="$background"
                                  fontSize="$2"
                                  textTransform="capitalize"
                                >
                                  {order.status}
                                </Text>
                              </YStack>
                            </XStack>
                            <XStack justifyContent="space-between">
                              <Text color="$colorMuted">{order.customer}</Text>
                              <Text color="$colorMuted">
                                {order.items} items
                              </Text>
                            </XStack>
                            <Separator />
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">
                                {formatPrice(
                                  order.total,
                                  order.currency || DEFAULT_CURRENCY,
                                )}
                              </Text>
                              <Button
                                variant="outline"
                                width="auto"
                                height={40}
                                paddingHorizontal="$3"
                                onPress={() =>
                                  router.push(`/(seller)/orders/${order.id}`)
                                }
                              >
                                View Details
                              </Button>
                            </XStack>
                          </YStack>
                        </Card>
                      ))
                    )}
                  </YStack>

                  <YStack flex={1} gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold" color="$green9">
                        Ready / Delivered
                      </Text>
                      <Text fontSize="$3" color="$colorMuted">
                        {doneOrders.length}
                      </Text>
                    </XStack>
                    {doneOrders.length === 0 ? (
                      <Card
                        padding="$5"
                        alignItems="center"
                        backgroundColor="$backgroundSoft"
                      >
                        <Text color="$colorMuted">
                          No ready or delivered orders
                        </Text>
                      </Card>
                    ) : (
                      doneOrders.map((order) => (
                        <Card key={order.id} padding="$4" bordered>
                          <YStack gap="$3">
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">{order.orderNumber}</Text>
                              <YStack
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                borderRadius="$2"
                                backgroundColor={getStatusColor(order.status)}
                              >
                                <Text
                                  color="$background"
                                  fontSize="$2"
                                  textTransform="capitalize"
                                >
                                  {order.status}
                                </Text>
                              </YStack>
                            </XStack>
                            <XStack justifyContent="space-between">
                              <Text color="$colorMuted">{order.customer}</Text>
                              <Text color="$colorMuted">
                                {order.items} items
                              </Text>
                            </XStack>
                            <Separator />
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">
                                {formatPrice(
                                  order.total,
                                  order.currency || DEFAULT_CURRENCY,
                                )}
                              </Text>
                              <Button
                                variant="outline"
                                width="auto"
                                height={40}
                                paddingHorizontal="$3"
                                onPress={() =>
                                  router.push(`/(seller)/orders/${order.id}`)
                                }
                              >
                                View Details
                              </Button>
                            </XStack>
                          </YStack>
                        </Card>
                      ))
                    )}
                  </YStack>
                </>
              ) : (
                // 2-column: Preparing + Done stacked in column 2
                <YStack flex={1} gap="$4">
                  <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold" color="$blue9">
                        Preparing
                      </Text>
                      <Text fontSize="$3" color="$colorMuted">
                        {preparingOrders.length}
                      </Text>
                    </XStack>
                    {preparingOrders.length === 0 ? (
                      <Card
                        padding="$5"
                        alignItems="center"
                        backgroundColor="$backgroundSoft"
                      >
                        <Text color="$colorMuted">
                          No orders being prepared
                        </Text>
                      </Card>
                    ) : (
                      preparingOrders.map((order) => (
                        <Card key={order.id} padding="$4" bordered>
                          <YStack gap="$3">
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">{order.orderNumber}</Text>
                              <YStack
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                borderRadius="$2"
                                backgroundColor={getStatusColor(order.status)}
                              >
                                <Text
                                  color="$background"
                                  fontSize="$2"
                                  textTransform="capitalize"
                                >
                                  {order.status}
                                </Text>
                              </YStack>
                            </XStack>
                            <XStack justifyContent="space-between">
                              <Text color="$colorMuted">{order.customer}</Text>
                              <Text color="$colorMuted">
                                {order.items} items
                              </Text>
                            </XStack>
                            <Separator />
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">
                                {formatPrice(
                                  order.total,
                                  order.currency || DEFAULT_CURRENCY,
                                )}
                              </Text>
                              <Button
                                variant="outline"
                                width="auto"
                                height={40}
                                paddingHorizontal="$3"
                                onPress={() =>
                                  router.push(`/(seller)/orders/${order.id}`)
                                }
                              >
                                View Details
                              </Button>
                            </XStack>
                          </YStack>
                        </Card>
                      ))
                    )}
                  </YStack>

                  <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold" color="$green9">
                        Ready / Delivered
                      </Text>
                      <Text fontSize="$3" color="$colorMuted">
                        {doneOrders.length}
                      </Text>
                    </XStack>
                    {doneOrders.length === 0 ? (
                      <Card
                        padding="$5"
                        alignItems="center"
                        backgroundColor="$backgroundSoft"
                      >
                        <Text color="$colorMuted">
                          No ready or delivered orders
                        </Text>
                      </Card>
                    ) : (
                      doneOrders.map((order) => (
                        <Card key={order.id} padding="$4" bordered>
                          <YStack gap="$3">
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">{order.orderNumber}</Text>
                              <YStack
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                borderRadius="$2"
                                backgroundColor={getStatusColor(order.status)}
                              >
                                <Text
                                  color="$background"
                                  fontSize="$2"
                                  textTransform="capitalize"
                                >
                                  {order.status}
                                </Text>
                              </YStack>
                            </XStack>
                            <XStack justifyContent="space-between">
                              <Text color="$colorMuted">{order.customer}</Text>
                              <Text color="$colorMuted">
                                {order.items} items
                              </Text>
                            </XStack>
                            <Separator />
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontWeight="bold">
                                {formatPrice(
                                  order.total,
                                  order.currency || DEFAULT_CURRENCY,
                                )}
                              </Text>
                              <Button
                                variant="outline"
                                width="auto"
                                height={40}
                                paddingHorizontal="$3"
                                onPress={() =>
                                  router.push(`/(seller)/orders/${order.id}`)
                                }
                              >
                                View Details
                              </Button>
                            </XStack>
                          </YStack>
                        </Card>
                      ))
                    )}
                  </YStack>
                </YStack>
              )}
            </XStack>
          ) : (
            // Phone: 1-column (all stacked, original behavior)
            <YStack padding="$4" gap="$3">
              {filteredOrders.length === 0 ? (
                <YStack
                  padding="$6"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="$colorMuted" fontSize="$4">
                    No orders found with selected filters
                  </Text>
                  <Button
                    variant="outline"
                    marginTop="$3"
                    onPress={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </YStack>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} padding="$4" bordered>
                    <YStack gap="$3">
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontWeight="bold">{order.orderNumber}</Text>
                        <YStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          backgroundColor={getStatusColor(order.status)}
                        >
                          <Text
                            color="$background"
                            fontSize="$2"
                            textTransform="capitalize"
                          >
                            {order.status}
                          </Text>
                        </YStack>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <Text color="$colorMuted">{order.customer}</Text>
                        <Text color="$colorMuted">{order.items} items</Text>
                      </XStack>
                      <Separator />
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontWeight="bold">
                          {formatPrice(
                            order.total,
                            order.currency || DEFAULT_CURRENCY,
                          )}
                        </Text>
                        <Button
                          variant="outline"
                          width="auto"
                          height={40}
                          paddingHorizontal="$3"
                          onPress={() =>
                            router.push(`/(seller)/orders/${order.id}`)
                          }
                        >
                          View Details
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                ))
              )}
            </YStack>
          )}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <YStack flex={1} justifyContent="flex-end">
          <Pressable
            flex={1}
            backgroundColor="rgba(0,0,0,0.5)"
            onPress={() => setFilterModalVisible(false)}
          />
          <YStack
            backgroundColor="$background"
            borderTopLeftRadius="$6"
            borderTopRightRadius="$6"
            padding="$4"
            paddingBottom={insets.bottom + 16}
          >
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$4"
            >
              <Text fontSize="$5" fontWeight="bold">
                Filter Orders
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="$color" />
              </Pressable>
            </XStack>

            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$colorMuted">
                Order Status
              </Text>
              {filterOptions.map((status) => (
                <Pressable key={status} onPress={() => toggleFilter(status)}>
                  <XStack
                    padding="$3"
                    borderWidth={1}
                    borderColor={
                      selectedFilters.includes(status)
                        ? "$blue9"
                        : "$borderColor"
                    }
                    borderRadius="$3"
                    alignItems="center"
                    justifyContent="space-between"
                    backgroundColor={
                      selectedFilters.includes(status)
                        ? "$blue2"
                        : "transparent"
                    }
                  >
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={20}
                        height={20}
                        borderRadius="$2"
                        backgroundColor={getStatusColor(status)}
                        alignItems="center"
                        justifyContent="center"
                      />
                      <Text
                        textTransform="capitalize"
                        fontWeight="500"
                        color={
                          selectedFilters.includes(status) ? "$blue9" : "$color"
                        }
                      >
                        {status}
                      </Text>
                    </XStack>
                    {selectedFilters.includes(status) && (
                      <Check size={20} color="$blue9" />
                    )}
                  </XStack>
                </Pressable>
              ))}
            </YStack>

            <XStack gap="$3" marginTop="$4">
              <Button flex={1} variant="outline" onPress={clearFilters}>
                Clear All
              </Button>
              <Button flex={1} onPress={() => setFilterModalVisible(false)}>
                Apply Filters
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
