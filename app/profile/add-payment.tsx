// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Lock, Smartphone, CheckCircle2 } from '@tamagui/lucide-icons';
import { Button, BackButton, Input, AppAlertDialog } from '@/components/ui';
import { useAddPaymentMethodMutation } from '@/services/payment.service';

const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFCC00', textColor: '#000' },
  { id: 'telecel', name: 'Telecel', color: '#E60000', textColor: '#FFF' },
  { id: 'airteltigo', name: 'AirtelTigo', color: '#1B1C8D', textColor: '#FFF' },
];

export default function AddPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { mutate: addPaymentMethod } = useAddPaymentMethodMutation();

  const [activeTab, setActiveTab] = useState<'momo' | 'card'>('momo');
  const [momoForm, setMomoForm] = useState({ network: 'mtn', phone: '' });
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '' });

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = () => {
    let newPM;
    
    if (activeTab === 'momo') {
      if (!momoForm.phone) return;
      newPM = {
        id: `pm-${Date.now()}`,
        type: 'mobile_money',
        last4: momoForm.phone.slice(-4),
        cardHolderName: `${momoForm.network.toUpperCase()} MoMo`,
        isDefault: false,
      };
    } else {
      if (!cardForm.name || !cardForm.number) return;
      const type = cardForm.number.startsWith('4') ? 'visa' : 'mastercard';
      newPM = {
        id: `pm-${Date.now()}`,
        type: type as any,
        last4: cardForm.number.slice(-4),
        cardHolderName: cardForm.name,
        expiryDate: cardForm.expiry,
        isDefault: false,
      };
    }

    addPaymentMethod(newPM);
    setDialogOpen(true);
  };
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
        
        {/* Header */}
        <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
          <BackButton />
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
            Add Payment
          </Text>
        </XStack>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <YStack padding="$5" gap="$6">
            
            {/* Segmented Toggle */}
            <XStack backgroundColor="$backgroundSoft" borderRadius="$full" padding="$1">
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: activeTab === 'momo' ? theme.background.val : 'transparent',
                  paddingVertical: 12,
                  borderRadius: 25,
                  alignItems: 'center',
                  shadowColor: activeTab === 'momo' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: activeTab === 'momo' ? 2 : 0,
                }}
                onPress={() => setActiveTab('momo')}
              >
                <XStack gap="$2" alignItems="center">
                   <Smartphone size={16} color={activeTab === 'momo' ? '$primary' : '$colorSecondary'} />
                   <Text fontWeight="700" color={activeTab === 'momo' ? '$color' : '$colorSecondary'} fontFamily="$body">Mobile Money</Text>
                </XStack>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: activeTab === 'card' ? theme.background.val : 'transparent',
                  paddingVertical: 12,
                  borderRadius: 25,
                  alignItems: 'center',
                  shadowColor: activeTab === 'card' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: activeTab === 'card' ? 2 : 0,
                }}
                onPress={() => setActiveTab('card')}
              >
                <XStack gap="$2" alignItems="center">
                   <CreditCard size={16} color={activeTab === 'card' ? '$primary' : '$colorSecondary'} />
                   <Text fontWeight="700" color={activeTab === 'card' ? '$color' : '$colorSecondary'} fontFamily="$body">Card Payment</Text>
                </XStack>
              </TouchableOpacity>
            </XStack>

            {activeTab === 'momo' ? (
              /* Mobile Money Form */
              <YStack gap="$6" animation="quick">
                <YStack gap="$3">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">Select Network</Text>
                  <XStack gap="$3">
                    {NETWORKS.map(net => (
                      <TouchableOpacity 
                        key={net.id}
                        onPress={() => setMomoForm(f => ({ ...f, network: net.id }))}
                        style={{ 
                          flex: 1, 
                          backgroundColor: net.color, 
                          height: 70, 
                          borderRadius: 12, 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          borderWidth: momoForm.network === net.id ? 3 : 0,
                          borderColor: theme.color.val,
                          opacity: momoForm.network === net.id ? 1 : 0.6,
                        }}
                      >
                        <YStack ai="center" gap="$1">
                          <Text fontWeight="900" color={net.textColor} fontSize="$4">{net.name}</Text>
                          {momoForm.network === net.id && <CheckCircle2 size={14} color={net.textColor} />}
                        </YStack>
                      </TouchableOpacity>
                    ))}
                  </XStack>
                </YStack>

                <YStack gap="$1">
                  <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">Phone Number</Text>
                  <Input 
                    placeholder="024 000 0000" 
                    keyboardType="phone-pad"
                    value={momoForm.phone}
                    onChangeText={(t) => setMomoForm(f => ({ ...f, phone: t }))}
                  />
                </YStack>

                <YStack backgroundColor="$backgroundSoft" padding="$4" borderRadius="$4" gap="$2">
                   <XStack gap="$2" alignItems="center">
                      <Lock size={14} color="$primary" />
                      <Text fontWeight="700" color="$primary" fontSize="$2" fontFamily="$body">PAYMENT FLOW</Text>
                   </XStack>
                   <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      A prompt will appear on your phone to confirm your transaction after checkout.
                   </Text>
                </YStack>
              </YStack>
            ) : (
              /* Card Form */
              <YStack gap="$5" animation="quick">
                <YStack gap="$4">
                  <YStack gap="$1">
                    <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">Cardholder Name</Text>
                    <Input 
                      placeholder="Name on Card" 
                      value={cardForm.name}
                      onChangeText={(text) => setCardForm(f => ({ ...f, name: text }))}
                    />
                  </YStack>
                  <YStack gap="$1">
                    <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">Card Number</Text>
                    <Input 
                      placeholder="0000 0000 0000 0000" 
                      keyboardType="number-pad" 
                      value={cardForm.number}
                      onChangeText={(text) => setCardForm(f => ({ ...f, number: text }))}
                      maxLength={16}
                    />
                  </YStack>
                  
                  <XStack gap="$4">
                    <YStack flex={1} gap="$1">
                      <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">Expiry Date</Text>
                      <Input 
                        placeholder="MM/YY" 
                        keyboardType="number-pad" 
                        value={cardForm.expiry}
                        onChangeText={(text) => setCardForm(f => ({ ...f, expiry: text }))}
                        maxLength={5}
                      />
                    </YStack>
                    <YStack flex={1} gap="$1">
                      <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">CVV</Text>
                      <Input 
                        placeholder="000" 
                        keyboardType="number-pad" 
                        value={cardForm.cvc}
                        onChangeText={(text) => setCardForm(f => ({ ...f, cvc: text }))}
                        maxLength={4}
                      />
                    </YStack>
                  </XStack>
                </YStack>
              </YStack>
            )}

            <YStack gap="$3" marginTop="$4">
               <Button 
                 variant="primary" 
                 height={56} 
                 onPress={handleSave} 
                 icon={<Lock size={20} color="white" />}
                 disabled={activeTab === 'momo' ? !momoForm.phone : (!cardForm.name || cardForm.number.length < 12)}
                 opacity={(activeTab === 'momo' ? !momoForm.phone : (!cardForm.name || cardForm.number.length < 12)) ? 0.5 : 1}
               >
                 SAVE SECURELY
               </Button>
            </YStack>

            {/* PSP Logos Footer */}
            <YStack ai="center" gap="$3" marginTop="$6" opacity={0.6}>
               <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">Secured by global payment partners</Text>
               <XStack gap="$5" ai="center">
                  <Text fontWeight="800" color="$colorSecondary">paystack</Text>
                  <Text fontWeight="800" color="$colorSecondary">hubtel</Text>
                  <Text fontWeight="800" color="$colorSecondary">stripe</Text>
               </XStack>
            </YStack>

          </YStack>
        </ScrollView>
      </YStack>

      <AppAlertDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Success"
        description={`${activeTab === 'momo' ? 'Mobile Money' : 'Card'} added successfully`}
        confirmText="OK"
        onConfirm={() => {
          setDialogOpen(false);
          router.back();
        }}
        icon={activeTab === 'momo' ? Smartphone : CreditCard}
      />
    </KeyboardAvoidingView>
  );
}
