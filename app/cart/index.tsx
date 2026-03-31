// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Sheet, YStack, XStack, Text, Separator, RadioGroup, Label, Adapt, Input as TInput } from 'tamagui';
import { BackButton, Button, Input } from '@/components/ui';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { useCartStore } from '@/stores/cart.store';
import { useCreateOrderMutation } from '@/services/orders.service';
import { useAddressesQuery } from '@/services/address.service';
import { usePaymentMethodsQuery } from '@/services/payment.service';
import { useValidatePromoMutation } from '@/services/promo.service';
import { formatCurrency } from '@/utils/formatCurrency';
import { ShoppingBag, MapPin, CreditCard, ChevronRight, Smartphone } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    items, getSubtotal, getTax, deliveryFee, getTotal, clearCart,
    tipAmount, promoDiscount, setTip, setPromoDiscount 
  } = useCartStore();
  
  const { mutateAsync: createOrder } = useCreateOrderMutation();
  const { mutateAsync: validatePromo, isPending: isValidatingPromo } = useValidatePromoMutation();
  const { data: addressesData = [] } = useAddressesQuery();
  const { data: paymentMethodsData = [] } = usePaymentMethodsQuery();
  const addresses = addressesData;
  const paymentMethods = paymentMethodsData;

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoMessage, setAppliedPromoMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | undefined>(undefined);
  
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const activeAddress = useMemo(() => addresses.find(a => a.id === selectedAddressId), [addresses, selectedAddressId]);
  const activePayment = useMemo(() => paymentMethods.find(pm => pm.id === selectedPaymentId), [paymentMethods, selectedPaymentId]);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?.id || addresses[0]?.id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!selectedPaymentId && paymentMethods.length > 0) {
      setSelectedPaymentId(paymentMethods.find((pm) => pm.isDefault)?.id || paymentMethods[0]?.id);
    }
  }, [paymentMethods, selectedPaymentId]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    try {
      const result = await validatePromo({
        code: promoCode,
        subtotal: getSubtotal(),
      });

      if (result.valid) {
        setPromoDiscount(result.discount);
        setAppliedPromoMessage(result.message);
        Alert.alert('Success', result.message);
      } else {
        setPromoDiscount(0);
        setAppliedPromoMessage('');
        Alert.alert('Invalid Code', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate promo code. Please try again.');
    }
  };

  const handleCheckout = async () => {
    if (!activeAddress || !activePayment) {
      alert('Please select an address and payment method');
      return;
    }

    const newOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      items: items.map((item) => ({
        id: item.cartItemId,
        food: item.food,
        quantity: item.quantity,
        selectedAddons: item.selectedAddons || [],
        specialInstructions: instructions,
        totalPrice: item.price * item.quantity,
      })),
      status: 'preparing' as const,
      deliveryAddress: activeAddress,
      paymentMethod: activePayment,
      subtotal: getSubtotal(),
      deliveryFee,
      discount: promoDiscount,
      tip: tipAmount,
      total: getTotal(),
      estimatedDeliveryTime: '20 min',
      deliveryPerson: {
        id: 'dp-1',
        name: 'Robert Fox',
        phone: '+1 234 567 8901',
        avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=200&h=200&fit=crop',
        rating: 4.9,
        currentLatitude: 40.7138,
        currentLongitude: -74.0050,
      },
      placedAt: new Date().toISOString(),
    };

    await createOrder(newOrder);
    clearCart();
    router.replace(`/track/${newOrder.id}`);
  };

  if (items.length === 0) {
    return (
      <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
        <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
          <BackButton />
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">Cart</Text>
        </XStack>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$10">
          <ShoppingBag size={80} color="$gray200" />
          <Text fontSize="$6" fontWeight="700" fontFamily="$heading" marginTop="$4" color="$color">Your cart is empty</Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" marginTop="$2" textAlign="center">
            Looks like you haven't added anything to your cart yet.
          </Text>
          <Button variant="primary" marginTop="$6" width="100%" height={56} onPress={() => router.back()}>
            START BROWSING
          </Button>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack alignItems="center" padding="$5" paddingTop={Math.max(insets.top, 50)} gap="$4" backgroundColor="$background">
        <BackButton />
        <Text fontSize="$6" fontWeight="700" fontFamily="$heading" color="$color">
          Cart
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        <YStack padding="$5" gap="$2">
          {items.map(item => (
            <CartItemCard key={item.cartItemId} item={item} />
          ))}
        </YStack>

        {/* Delivery & Payment Selection */}
        <YStack paddingHorizontal="$5" gap="$4" marginBottom="$6">
          <YStack backgroundColor="$backgroundStrong" borderRadius="$4" padding="$4" gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center" flex={1} paddingRight="$3">
                <YStack backgroundColor="$backgroundSoft" padding="$2" borderRadius="$3">
                  <MapPin size={20} color="$primary" />
                </YStack>
                <YStack gap="$1" flex={1}>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Deliver to</Text>
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" numberOfLines={2}>
                    {activeAddress ? `${activeAddress.label} (${activeAddress.street})` : 'Select Address'}
                  </Text>
                </YStack>
              </XStack>
              <Button
                size="$2"
                variant="ghost"
                width="auto"
                flexShrink={0}
                paddingHorizontal="$0"
                onPress={() => setShowAddressSheet(true)}
              >
                <Text fontSize="$3" color="$primary" fontWeight="700">Change</Text>
              </Button>
            </XStack>

            <Separator borderColor="$borderColor" />

            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center" flex={1} paddingRight="$3">
                <YStack backgroundColor="$backgroundSoft" padding="$2" borderRadius="$3">
                  {activePayment?.type === 'mobile_money' ? <Smartphone size={20} color="$primary" /> : <CreditCard size={20} color="$primary" />}
                </YStack>
                <YStack gap="$1" flex={1}>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Payment Method</Text>
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" numberOfLines={2}>
                    {activePayment ? (activePayment.type === 'mobile_money' ? `MTN MoMo (•••• ${activePayment.last4})` : `Card •••• ${activePayment.last4}`) : 'Select Payment'}
                  </Text>
                </YStack>
              </XStack>
              <Button
                size="$2"
                variant="ghost"
                width="auto"
                flexShrink={0}
                paddingHorizontal="$0"
                onPress={() => setShowPaymentSheet(true)}
              >
                <Text fontSize="$3" color="$primary" fontWeight="700">Change</Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>

        {/* Extensions: Instructions, Promo, Tip */}
        <YStack paddingHorizontal="$5" gap="$5" marginBottom="$5">
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">Delivery Instructions</Text>
            <Input 
              placeholder="E.g. Ring the bell, leave at the door..." 
              value={instructions}
              onChangeText={setInstructions}
              backgroundColor="$backgroundStrong"
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">Promo Code</Text>
            <XStack gap="$3" alignItems="center">
              <TInput
                flex={1}
                minWidth={0}
                placeholder="Enter promo (e.g. TEINC20)" 
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text);
                  if (!text.trim()) {
                    setPromoDiscount(0);
                    setAppliedPromoMessage('');
                  }
                }}
                backgroundColor="$backgroundStrong"
                color="$color"
                borderWidth={0}
                borderRadius="$3"
                height={60}
                fontFamily="$body"
                fontSize="$4"
                paddingHorizontal="$4"
                placeholderTextColor="$colorPlaceholder"
                focusStyle={{ borderWidth: 1, borderColor: '$primary', backgroundColor: '$background' }}
                autoCapitalize="characters"
                editable={!isValidatingPromo}
              />
              <Button
                variant={promoDiscount > 0 ? 'primary' : 'outline'}
                width={112}
                minWidth={112}
                flexShrink={0}
                onPress={handleApplyPromo}
                disabled={isValidatingPromo}
              >
                {isValidatingPromo ? 'Checking...' : promoDiscount > 0 ? 'Applied' : 'Apply'}
              </Button>
            </XStack>
            {appliedPromoMessage && (
              <Text fontSize="$3" color="$green" fontFamily="$body">
                ✓ {appliedPromoMessage}
              </Text>
            )}
          </YStack>

          <YStack gap="$3">
             <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">Driver Tip</Text>
             <XStack justifyContent="space-between" gap="$2">
                {[0, 2, 5, 10].map(amt => (
                  <Button 
                    key={`tip-${amt}`}
                    flex={1}
                    height={44}
                    minWidth={0}
                    variant={tipAmount === amt ? 'primary' : 'outline'}
                    onPress={() => setTip(amt)}
                  >
                    {amt === 0 ? 'None' : `$${amt}`}
                  </Button>
                ))}
             </XStack>
          </YStack>
        </YStack>

        {/* Bill Details */}
        <YStack padding="$5" backgroundColor="$backgroundStrong" marginHorizontal="$5" borderRadius="$5" gap="$3">
          <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color" marginBottom="$2">Bill Details</Text>
          
          <XStack justifyContent="space-between">
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">Subtotal</Text>
            <Text fontSize="$4" fontWeight="600" fontFamily="$body">{formatCurrency(getSubtotal())}</Text>
          </XStack>
          
          <XStack justifyContent="space-between">
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">Delivery Fee</Text>
            <Text fontSize="$4" fontWeight="600" fontFamily="$body">{formatCurrency(deliveryFee)}</Text>
          </XStack>
          
          <XStack justifyContent="space-between">
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">Taxes (5%)</Text>
            <Text fontSize="$4" fontWeight="600" fontFamily="$body">{formatCurrency(getTax())}</Text>
          </XStack>
          
          {tipAmount > 0 && (
            <XStack justifyContent="space-between">
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">Driver Tip</Text>
              <Text fontSize="$4" fontWeight="600" fontFamily="$body">{formatCurrency(tipAmount)}</Text>
            </XStack>
          )}

          {promoDiscount > 0 && (
            <XStack justifyContent="space-between">
              <Text fontSize="$4" color="$green" fontFamily="$body">Promo Discount</Text>
              <Text fontSize="$4" fontWeight="800" color="$green" fontFamily="$body">-{formatCurrency(promoDiscount)}</Text>
            </XStack>
          )}
          
          <Separator marginVertical="$2" borderColor="$borderColor" />
          
          <XStack justifyContent="space-between">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">Total</Text>
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$primary">{formatCurrency(getTotal())}</Text>
          </XStack>
        </YStack>
      </ScrollView>

      {/* Address Sheet */}
      <Sheet 
        modal 
        open={showAddressSheet} 
        onOpenChange={setShowAddressSheet} 
        snapPoints={[50]} 
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4" gap="$4" backgroundColor="$background">
          <Sheet.Handle />
          <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">Select Address</Text>
          <ScrollView>
            <RadioGroup value={selectedAddressId} onValueChange={(val) => { setSelectedAddressId(val); setShowAddressSheet(false); }}>
              <YStack gap="$3">
                {addresses.map(addr => (
                  <XStack key={addr.id} alignItems="center" gap="$3" padding="$3" backgroundColor="$backgroundStrong" borderRadius="$3">
                    <RadioGroup.Item value={addr.id} id={addr.id} size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor={addr.id} flex={1}>
                      <YStack>
                        <Text fontWeight="700" color="$color" textTransform="capitalize">{addr.label}</Text>
                        <Text fontSize="$3" color="$colorSecondary">{addr.fullAddress}</Text>
                      </YStack>
                    </Label>
                  </XStack>
                ))}
              </YStack>
            </RadioGroup>
          </ScrollView>
          <Button variant="outline" onPress={() => { setShowAddressSheet(false); router.push('/profile/add-address'); }}>
            Add New Address
          </Button>
        </Sheet.Frame>
      </Sheet>

      {/* Payment Sheet */}
      <Sheet 
        modal 
        open={showPaymentSheet} 
        onOpenChange={setShowPaymentSheet} 
        snapPoints={[50]} 
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4" gap="$4" backgroundColor="$background">
          <Sheet.Handle />
          <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">Select Payment</Text>
          <ScrollView>
            <RadioGroup value={selectedPaymentId} onValueChange={(val) => { setSelectedPaymentId(val); setShowPaymentSheet(false); }}>
              <YStack gap="$3">
                {paymentMethods.map(pm => (
                  <XStack key={pm.id} alignItems="center" gap="$3" padding="$3" backgroundColor="$backgroundStrong" borderRadius="$3">
                    <RadioGroup.Item value={pm.id} id={pm.id} size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor={pm.id} flex={1}>
                      <XStack gap="$3" alignItems="center">
                        <YStack backgroundColor="$backgroundSoft" padding="$1" borderRadius="$2">
                          {pm.type === 'mobile_money' ? <Smartphone size={16} color="$primary" /> : <CreditCard size={16} color="$primary" />}
                        </YStack>
                        <YStack>
                          <Text fontWeight="700" color="$color">{pm.type === 'mobile_money' ? 'Mobile Money' : `Card •••• ${pm.last4}`}</Text>
                          <Text fontSize="$3" color="$colorSecondary">{pm.type === 'mobile_money' ? 'MTN MoMo' : pm.cardHolderName}</Text>
                        </YStack>
                      </XStack>
                    </Label>
                  </XStack>
                ))}
              </YStack>
            </RadioGroup>
          </ScrollView>
          <Button variant="outline" onPress={() => { setShowPaymentSheet(false); router.push('/profile/add-payment'); }}>
            Add New Payment Method
          </Button>
        </Sheet.Frame>
      </Sheet>

      {/* Checkout Footer */}
      <YStack 
        position="absolute" 
        bottom={0} 
        left={0} 
        right={0} 
        backgroundColor="$background" 
        borderTopWidth={1}
        borderTopColor="$borderColor"
        paddingHorizontal="$5"
        paddingBottom={Math.max(insets.bottom, 20)}
        paddingTop="$4"
      >
        <Button variant="primary" onPress={handleCheckout} height={56}>
          PLACE ORDER
        </Button>
      </YStack>
    </YStack>
  );
}
