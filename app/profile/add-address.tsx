// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation } from '@tamagui/lucide-icons';
import { Button, BackButton, Input } from '@/components/ui';
import { useAddAddressMutation } from '@/services/address.service';

export default function AddAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mutate: addAddress } = useAddAddressMutation();

  const [form, setForm] = useState({
    label: '',
    street: '',
    apartment: '',
    cityZip: '',
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = () => {
    if (!form.label || !form.street) return;

    const newAddress = {
      id: `addr-${Date.now()}`,
      label: form.label.toLowerCase() as any,
      street: form.street,
      apartment: form.apartment,
      postCode: form.cityZip.split(' ').pop() || '',
      fullAddress: `${form.street}${form.apartment ? ', ' + form.apartment : ''}. ${form.cityZip}`,
      isDefault: false,
    };

    addAddress(newAddress);
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
            Add New Address
          </Text>
        </XStack>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* Mock Map Area */}
          <YStack height={240} backgroundColor="$backgroundSoft" position="relative" justifyContent="center" alignItems="center">
            <YStack width={60} height={60} borderRadius="$full" backgroundColor="rgba(255,145,0,0.2)" justifyContent="center" alignItems="center">
              <MapPin size={32} color="$primary" fill="$primary" />
            </YStack>
            <Button 
              position="absolute" 
              bottom="$4" 
              right="$4" 
              circular 
              variant="primary" 
              size="$3" 
              icon={<Navigation size={20} color="white" />} 
            />
          </YStack>

          <YStack padding="$5" gap="$6" marginTop="$4">
            
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                Delivery Details
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Pinpoint your exact location for faster delivery.
              </Text>
            </YStack>

            <YStack gap="$4">
              <Input 
                placeholder="Label (e.g., Home, Work)" 
                value={form.label}
                onChangeText={(text) => setForm(f => ({ ...f, label: text }))}
              />
              <Input 
                placeholder="Street Address" 
                value={form.street}
                onChangeText={(text) => setForm(f => ({ ...f, street: text }))}
              />
              <Input 
                placeholder="Apartment, Suite (Optional)" 
                value={form.apartment}
                onChangeText={(text) => setForm(f => ({ ...f, apartment: text }))}
              />
              <Input 
                placeholder="City / Postal Code" 
                value={form.cityZip}
                onChangeText={(text) => setForm(f => ({ ...f, cityZip: text }))}
              />
            </YStack>

            <YStack gap="$3" marginTop="$4">
               <Button 
                 variant="primary" 
                 height={56} 
                 onPress={handleSave}
                 disabled={!form.label || !form.street}
                 opacity={(!form.label || !form.street) ? 0.5 : 1}
               >
                 SAVE ADDRESS
               </Button>
            </YStack>

          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
