// @ts-nocheck
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Image, Separator, Progress, ScrollView } from 'tamagui';
import { Alert, Linking, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Phone, MessageCircle, ChevronLeft, Clock, MapPin, CheckCircle, Truck, ChefHat, Package, ChevronUp, ChevronDown } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import type { OrderStatus } from '@/models/order.model';
import { useTrackOrderQuery } from '@/services/tracking.service';
import { formatCurrency } from '@/utils/formatCurrency';

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'on_the_way', label: 'On The Way' },
  { key: 'delivered', label: 'Delivered' },
];

function getStepIndex(status: OrderStatus): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const orderId = Array.isArray(id) ? id[0] : id;
  const { data } = useTrackOrderQuery(orderId || '');
  const order = data?.order;

  if (!order) {
    return null;
  }

  const currentStep = getStepIndex(order.status);
  const driver = order.deliveryPerson;
  const deliveryAddr = order.deliveryAddress;

  const handleCallDriver = async () => {
    const phone = driver?.phone?.trim();
    if (!phone) {
      Alert.alert('Call unavailable', 'No rider phone number is available yet.');
      return;
    }

    const telUrl = `tel:${phone.replace(/\s+/g, '')}`;
    const canOpen = await Linking.canOpenURL(telUrl);
    if (!canOpen) {
      Alert.alert('Call unavailable', 'This device cannot place calls right now.');
      return;
    }

    await Linking.openURL(telUrl);
  };

  const handleMessageDriver = () => {
    const chatUserId = driver?.id || 'support-1';
    router.push(`/(communication)/chat/${chatUserId}`);
  };

  // Map region centered between driver and destination
  const driverLat = driver?.currentLatitude || 40.7138;
  const driverLng = driver?.currentLongitude || -74.0050;
  const destLat = deliveryAddr?.latitude || 40.7128;
  const destLng = deliveryAddr?.longitude || -74.0060;

  // Generate route points (simulated path with slight curve)
  const routePoints = [
    { latitude: driverLat, longitude: driverLng },
    { latitude: (driverLat + destLat) / 2 + 0.001, longitude: (driverLng + destLng) / 2 - 0.001 },
    { latitude: destLat, longitude: destLng },
  ];

  const getStepIcon = (stepKey: OrderStatus, isCompleted: boolean) => {
    const iconColor = isCompleted ? 'white' : '#999';
    const iconSize = 18;
    
    switch (stepKey) {
      case 'confirmed':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'preparing':
        return <ChefHat size={iconSize} color={iconColor} />;
      case 'on_the_way':
        return <Truck size={iconSize} color={iconColor} />;
      case 'delivered':
        return <Package size={iconSize} color={iconColor} />;
      default:
        return <CheckCircle size={iconSize} color={iconColor} />;
    }
  };

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;
  const panelHeight = expanded ? '60%' : '30%';

  return (
    <YStack flex={1}>
      {/* Map - Always visible */}
      <YStack position="absolute" top={0} left={0} right={0} bottom={0}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: (driverLat + destLat) / 2,
            longitude: (driverLng + destLng) / 2,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          {/* Route Line */}
          <Polyline
            coordinates={routePoints}
            strokeColor="#FF7622"
            strokeWidth={4}
            lineDashPattern={[1]}
          />

          {/* Delivery Destination */}
          <Marker
            coordinate={{ latitude: destLat, longitude: destLng }}
            title="Delivery Location"
            description={deliveryAddr?.fullAddress || 'Your Location'}
          >
            <YStack
              backgroundColor="$primary"
              borderRadius="$full"
              padding="$2"
              borderWidth={2}
              borderColor="$white"
            >
              <MapPin size={20} color="$white" />
            </YStack>
          </Marker>

          {/* Driver / Rider */}
          {driver && (
            <Marker
              coordinate={{ latitude: driverLat, longitude: driverLng }}
              title={driver.name}
              description="Your rider"
            >
              <YStack
                backgroundColor="#34C759"
                borderRadius="$full"
                padding="$2"
                borderWidth={2}
                borderColor="$white"
              >
                <Truck size={24} color="$white" />
              </YStack>
            </Marker>
          )}
        </MapView>

        {/* Back Button Floating */}
        <YStack position="absolute" top={Math.max(insets.top, 50)} left="$5" zIndex={10}>
          <Button
            circular
            width={44}
            height={44}
            backgroundColor="$white"
            icon={<ChevronLeft size={24} color="$navy" />}
            onPress={() => router.back()}
            elevation={2}
          />
        </YStack>
      </YStack>

      {/* Bottom Panel - Fixed, non-closable */}
      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height={panelHeight}
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        {/* Handle - Tap to expand/collapse */}
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <YStack alignItems="center" paddingTop="$3" paddingBottom="$2">
            <YStack width={40} height={4} backgroundColor="$gray300" borderRadius="$full" />
            <YStack marginTop="$1">
              {expanded ? <ChevronDown size={16} color="$colorSecondary" /> : <ChevronUp size={16} color="$colorSecondary" />}
            </YStack>
          </YStack>
        </TouchableOpacity>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <YStack gap="$5">
            {/* Order Header */}
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
                  {order.orderNumber}
                </Text>
                <XStack 
                  backgroundColor={order.status === 'delivered' ? '$green' : '$primary'} 
                  paddingHorizontal="$3" 
                  paddingVertical="$1" 
                  borderRadius="$full"
                >
                  <Text fontSize="$2" fontWeight="700" color="$white">
                    {order.status === 'on_the_way' ? 'On The Way' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Text>
                </XStack>
              </XStack>
              
              {/* Progress Bar */}
              <YStack gap="$2">
                <Progress value={progressPercent} backgroundColor="$gray200">
                  <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
                </Progress>
                <XStack justifyContent="space-between">
                  <Text fontSize="$2" color="$colorSecondary">Order Placed</Text>
                  <Text fontSize="$2" color="$colorSecondary">Delivered</Text>
                </XStack>
              </YStack>
            </YStack>

            {/* ETA Card - Always visible */}
            <YStack 
              backgroundColor="$orangeMuted" 
              borderRadius="$4" 
              padding="$4" 
              gap="$2"
            >
              <XStack alignItems="center" gap="$2">
                <Clock size={20} color="$primary" />
                <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                  Estimated Arrival
                </Text>
              </XStack>
              <Text fontSize="$7" fontWeight="800" fontFamily="$heading" color="$primary">
                {order.estimatedDeliveryTime || 'Calculating...'}
              </Text>
            </YStack>

            {/* Expanded Content */}
            {expanded && (
              <>
                <Separator borderColor="$borderColor" />

                {/* Driver Info */}
                {driver && (
                  <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                      Your Rider
                    </Text>
                    <XStack alignItems="center" gap="$3">
                      <Image
                        source={{ uri: driver.avatarUrl }}
                        width={60}
                        height={60}
                        borderRadius="$full"
                        objectFit="cover"
                      />
                      <YStack flex={1} gap="$1">
                        <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                          {driver.name}
                        </Text>
                        <XStack alignItems="center" gap="$1">
                          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                            ⭐ {driver.rating} rating
                          </Text>
                        </XStack>
                        {driver.vehicleType && (
                          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                            {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)}
                          </Text>
                        )}
                      </YStack>
                      <XStack gap="$2">
                        <Button
                          circular
                          width={48}
                          height={48}
                          backgroundColor="$primary"
                          icon={<Phone size={20} color="$white" />}
                          onPress={handleCallDriver}
                        />
                        <Button
                          circular
                          width={48}
                          height={48}
                          backgroundColor="$backgroundSoft"
                          borderWidth={1}
                          borderColor="$borderColor"
                          icon={<MessageCircle size={20} color="$color" />}
                          onPress={handleMessageDriver}
                        />
                      </XStack>
                    </XStack>
                  </YStack>
                )}

                <Separator borderColor="$borderColor" />

                {/* Timeline */}
                <YStack gap="$3">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Order Timeline
                  </Text>
                  <YStack gap="$1">
                    {STEPS.map((step, i) => {
                      const isCompleted = i <= currentStep;
                      const isCurrent = i === currentStep;
                      return (
                        <XStack key={step.key} gap="$2" alignItems="flex-start">
                          <YStack alignItems="center">
                            <YStack
                              width={32}
                              height={32}
                              borderRadius="$full"
                              backgroundColor={isCompleted ? '$primary' : '$gray200'}
                              justifyContent="center"
                              alignItems="center"
                              borderWidth={isCurrent ? 2 : 0}
                              borderColor={isCurrent ? '$primary' : 'transparent'}
                            >
                              {getStepIcon(step.key, isCompleted)}
                            </YStack>
                            {i < STEPS.length - 1 && (
                              <YStack
                                width={2}
                                height={24}
                                backgroundColor={isCompleted ? '$primary' : '$gray200'}
                              />
                            )}
                          </YStack>
                          <YStack flex={1} paddingBottom="$1">
                            <Text 
                              fontSize="$3" 
                              fontWeight={isCurrent ? '700' : '600'} 
                              color={isCompleted ? '$color' : '$colorSecondary'}
                            >
                              {step.label}
                            </Text>
                            {isCurrent && (
                              <Text fontSize="$2" color="$primary" marginTop="$0.5">
                                Current status
                              </Text>
                            )}
                          </YStack>
                        </XStack>
                      );
                    })}
                  </YStack>
                </YStack>

                {/* Delivery Address */}
                {deliveryAddr && (
                  <YStack gap="$2">
                    <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                      Delivery Address
                    </Text>
                    <XStack gap="$2" alignItems="flex-start">
                      <MapPin size={18} color="$colorSecondary" marginTop={2} />
                      <YStack flex={1}>
                        <Text fontSize="$4" fontWeight="600" color="$color">
                          {deliveryAddr.label || 'Delivery Location'}
                        </Text>
                        <Text fontSize="$3" color="$colorSecondary">
                          {deliveryAddr.fullAddress || deliveryAddr.street}
                        </Text>
                      </YStack>
                    </XStack>
                  </YStack>
                )}

                {/* Order Summary */}
                <YStack gap="$3" backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Order Summary
                  </Text>
                  <XStack justifyContent="space-between">
                    <Text fontSize="$3" color="$colorSecondary">Total</Text>
                    <Text fontSize="$4" fontWeight="700" color="$primary">
                      {formatCurrency(order.total)}
                    </Text>
                  </XStack>
                </YStack>
              </>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </YStack>
  );
}