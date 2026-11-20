// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  Card,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
} from "tamagui";
import {
  ArrowRight,
  Building,
  Check,
  MapPin,
  Phone,
  Plus,
} from "@tamagui/lucide-icons";
import { useBusinessStore } from "@/stores/business.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleStore } from "@/stores/role.store";
import { Button } from "@/components/ui";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import { PendingInvitesBanner } from "@/components/invitations/PendingInvitesBanner";
import { useResponsive } from "@/utils/responsive";

export default function SelectBusinessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape } = useResponsive();
  const isTabletLandscape = isTablet && isLandscape;

  const user = useAuthStore((state) => state.user);
  const role = useRoleStore((state) => state.role);
  const isFleet = role === "fleet_manager";
  const dashboardRoute = isFleet
    ? "/(fleet)/(drawer)/dashboard"
    : "/(seller)/(drawer)/dashboard";

  const {
    businesses,
    activeBusiness,
    setActiveBusiness,
    getDefaultBusiness,
  } = useBusinessStore();

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null,
  );

  // A user can own both merchant and fleet businesses. The selector should
  // only offer the type that matches the role they signed in with.
  const visibleBusinesses = useMemo(() => {
    const expectedType = isFleet ? "delivery_provider" : "merchant";
    const matching = businesses.filter(
      (business) => business.type === expectedType,
    );
    return matching.length > 0 ? matching : businesses;
  }, [businesses, isFleet]);

  useEffect(() => {
    if (!visibleBusinesses.length) {
      setSelectedBusinessId(null);
      return;
    }

    if (
      activeBusiness &&
      visibleBusinesses.some((business) => business.id === activeBusiness.id)
    ) {
      setSelectedBusinessId(activeBusiness.id);
      return;
    }

    const defaultBusiness = getDefaultBusiness();
    if (
      defaultBusiness &&
      visibleBusinesses.some((business) => business.id === defaultBusiness.id)
    ) {
      setSelectedBusinessId(defaultBusiness.id);
      return;
    }

    if (visibleBusinesses.length === 1) {
      setSelectedBusinessId(visibleBusinesses[0].id);
      return;
    }

    // Keep a selection the user already made; otherwise wait for an explicit
    // choice. This is the first-login path for accounts with multiple
    // businesses.
    setSelectedBusinessId((current) =>
      current && visibleBusinesses.some((business) => business.id === current)
        ? current
        : null,
    );
  }, [activeBusiness, getDefaultBusiness, visibleBusinesses]);

  const handleContinue = () => {
    const selected = visibleBusinesses.find(
      (business) => business.id === selectedBusinessId,
    );
    if (!selected) return;
    setActiveBusiness(selected as any);
    router.replace(dashboardRoute);
  };

  const handleAddNewBusiness = () => {
    router.push("/(shared)/businesses/add");
  };

  const handleManage = () => {
    router.push("/(shared)/businesses");
  };

  const businessLabel = isFleet ? "fleet business" : "business";
  const hasBusinesses = visibleBusinesses.length > 0;
  const firstName = user?.full_name?.trim().split(/\s+/)[0];

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        flex={1}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack
          width="100%"
          maxWidth={isTabletLandscape ? 1100 : 640}
          alignSelf="center"
          px={isTabletLandscape ? "$6" : "$5"}
          pt={Math.max(insets.top + 24, 40)}
          pb="$6"
          gap="$5"
        >
          <XStack gap="$3" items="center">
            <YStack
              width={52}
              height={52}
              br="$5"
              bg="$primaryLight"
              items="center"
              justify="center"
              flexShrink={0}
            >
              <Building size={26} color="$primary" />
            </YStack>
            <YStack flex={1} gap="$1">
              <Text
                fontSize="$2"
                fontWeight="700"
                color="$primary"
                fontFamily="$body"
                textTransform="uppercase"
                letterSpacing={0.8}
              >
                {isFleet ? "Fleet workspace" : "Business workspace"}
              </Text>
              <Text
                fontSize={isTabletLandscape ? "$9" : "$8"}
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
                lineHeight={isTabletLandscape ? 42 : 36}
              >
                {hasBusinesses ? "Choose a business" : "Create your business"}
              </Text>
            </YStack>
          </XStack>

          <Text
            fontSize="$4"
            color="$colorSecondary"
            fontFamily="$body"
            lineHeight={22}
          >
            {hasBusinesses
              ? visibleBusinesses.length > 1
                ? `Hi${firstName ? ` ${firstName}` : ""}, you have access to ${visibleBusinesses.length} businesses. Pick the one you want to manage.`
                : `Hi${firstName ? ` ${firstName}` : ""}, continue with your ${businessLabel}.`
              : `You need a ${businessLabel} before you can start managing orders and your team.`}
          </Text>

          <PendingInvitesBanner />

          {hasBusinesses ? (
            <XStack width="100%" flexWrap="wrap" gap="$3">
              {visibleBusinesses.map((business) => {
                const selected = selectedBusinessId === business.id;
                const isActive = business.status === "active";
                const city =
                  business.address?.city || business.address?.street || "";

                return (
                  <Card
                    key={business.id}
                    width={isTabletLandscape ? "48.5%" : "100%"}
                    flexGrow={1}
                    minWidth={isTabletLandscape ? 320 : undefined}
                    bordered
                    padding="$4"
                    gap="$3"
                    backgroundColor={
                      selected ? "$primaryLight" : "$background"
                    }
                    borderColor={selected ? "$primary" : "$borderColor"}
                    borderWidth={selected ? 2 : 1}
                    pressStyle={{ scale: 0.99, opacity: 0.92 }}
                    onPress={() => setSelectedBusinessId(business.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <XStack gap="$3" items="flex-start">
                      <Avatar circular size="$6" flexShrink={0}>
                        <CachedAvatarImage src={business.logo_url} />
                        <Avatar.Fallback backgroundColor="$gray800">
                          <Text
                            color="white"
                            fontWeight="800"
                            fontSize="$5"
                            fontFamily="$heading"
                          >
                            {business.name?.charAt(0)?.toUpperCase() || "B"}
                          </Text>
                        </Avatar.Fallback>
                      </Avatar>

                      <YStack flex={1} gap="$1.5">
                        <Text
                          fontSize="$5"
                          fontWeight="800"
                          fontFamily="$heading"
                          color="$color"
                          numberOfLines={2}
                        >
                          {business.name}
                        </Text>

                        <XStack gap="$2" items="center" flexWrap="wrap">
                          {business.business_number ? (
                            <Text
                              fontSize="$2"
                              color="$colorSecondary"
                              fontFamily="$body"
                            >
                              {business.business_number}
                            </Text>
                          ) : null}

                          <XStack
                            px="$2"
                            py="$1"
                            br="$10"
                            bg={
                              isActive ? "$successMuted" : "$backgroundSoft"
                            }
                            borderWidth={1}
                            borderColor={
                              isActive ? "$success" : "$borderColor"
                            }
                          >
                            <Text
                              fontSize="$1"
                              fontWeight="700"
                              color={
                                isActive ? "$success" : "$colorSecondary"
                              }
                              fontFamily="$body"
                              textTransform="uppercase"
                              letterSpacing={0.4}
                            >
                              {isActive ? "Active" : business.status || "Inactive"}
                            </Text>
                          </XStack>

                          {business.isDefault ? (
                            <XStack
                              px="$2"
                              py="$1"
                              br="$10"
                              bg="$orangeMuted"
                              borderWidth={1}
                              borderColor="$orange"
                            >
                              <Text
                                fontSize="$1"
                                fontWeight="700"
                                color="$orange"
                                fontFamily="$body"
                                textTransform="uppercase"
                                letterSpacing={0.4}
                              >
                                Default
                              </Text>
                            </XStack>
                          ) : null}
                        </XStack>
                      </YStack>

                      <YStack
                        width={28}
                        height={28}
                        br="$10"
                        flexShrink={0}
                        items="center"
                        justify="center"
                        bg={selected ? "$primary" : "transparent"}
                        borderWidth={selected ? 0 : 1}
                        borderColor="$borderColor"
                      >
                        {selected ? <Check size={16} color="white" /> : null}
                      </YStack>
                    </XStack>

                    <Separator borderColor="$borderColor" />

                    <YStack gap="$2">
                      <XStack gap="$2" items="center">
                        <MapPin size={15} color="$colorMuted" flexShrink={0} />
                        <Text
                          fontSize="$3"
                          color="$colorSecondary"
                          fontFamily="$body"
                          flex={1}
                          numberOfLines={1}
                        >
                          {city || "No address added"}
                        </Text>
                      </XStack>
                      {business.phone ? (
                        <XStack gap="$2" items="center">
                          <Phone size={15} color="$colorMuted" flexShrink={0} />
                          <Text
                            fontSize="$3"
                            color="$colorSecondary"
                            fontFamily="$body"
                          >
                            {business.phone}
                          </Text>
                        </XStack>
                      ) : null}
                    </YStack>
                  </Card>
                );
              })}
            </XStack>
          ) : (
            <Card bordered padding="$6" gap="$4">
              <YStack items="center" gap="$3">
                <YStack
                  width={72}
                  height={72}
                  br="$6"
                  bg="$backgroundSoft"
                  items="center"
                  justify="center"
                >
                  <Building size={34} color="$primary" />
                </YStack>
                <YStack gap="$1" items="center">
                  <Text
                    fontSize="$6"
                    fontWeight="800"
                    fontFamily="$heading"
                    color="$color"
                    textAlign="center"
                  >
                    {isFleet ? "No fleet business yet" : "No business yet"}
                  </Text>
                  <Text
                    fontSize="$4"
                    color="$colorSecondary"
                    fontFamily="$body"
                    textAlign="center"
                    lineHeight={22}
                  >
                    {isFleet
                      ? "Create your first delivery business to start managing riders and deliveries."
                      : "Create your first business to start taking orders, managing your menu and team."}
                  </Text>
                </YStack>
                <Button
                  icon={<Plus size={18} color="white" />}
                  onPress={handleAddNewBusiness}
                >
                  Create your first business
                </Button>
              </YStack>
            </Card>
          )}

          {hasBusinesses ? (
            <Card
              bordered
              borderStyle="dashed"
              borderColor="$borderColor"
              padding="$4"
              pressStyle={{ scale: 0.99, opacity: 0.9 }}
              onPress={handleAddNewBusiness}
              accessibilityRole="button"
            >
              <XStack gap="$3" items="center">
                <YStack
                  width={44}
                  height={44}
                  br="$4"
                  bg="$backgroundSoft"
                  items="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Plus size={21} color="$primary" />
                </YStack>
                <YStack flex={1} gap="$0.5">
                  <Text
                    fontSize="$4"
                    fontWeight="700"
                    fontFamily="$body"
                    color="$color"
                  >
                    Add another business
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {isFleet
                      ? "Create a new fleet workspace"
                      : "Create a new store or restaurant"}
                  </Text>
                </YStack>
              </XStack>
            </Card>
          ) : null}
        </YStack>
      </ScrollView>

      {hasBusinesses ? (
        <YStack
          borderTopWidth={1}
          borderColor="$borderColor"
          bg="$background"
          px="$5"
          pt="$3"
          pb={Math.max(insets.bottom, 16)}
        >
          <YStack
            width="100%"
            maxWidth={isTabletLandscape ? 1100 : 640}
            alignSelf="center"
            gap="$2"
          >
            <Button
              size="$5"
              disabled={!selectedBusinessId}
              onPress={handleContinue}
              icon={
                selectedBusinessId ? (
                  <ArrowRight size={18} color="white" />
                ) : undefined
              }
            >
              Continue to dashboard
            </Button>
            <Button variant="ghost" size="$4" onPress={handleManage}>
              Manage all businesses
            </Button>
          </YStack>
        </YStack>
      ) : null}
    </YStack>
  );
}
