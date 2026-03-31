// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Separator } from 'tamagui';
import { MapPin, Plus, Trash2, Star, AlertCircle } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, BackButton } from '@/components/ui';
import { AppAlertDialog } from '@/components/ui/AlertDialog';
import {
  useAddressesQuery,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
} from '@/services/address.service';

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: addressesData = [] } = useAddressesQuery();
  const { mutate: removeAddress } = useRemoveAddressMutation();
  const { mutate: setDefaultAddress } = useSetDefaultAddressMutation();
  const addresses = addressesData;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetAddress, setTargetAddress] = useState<{ id: string; label: string } | null>(null);
  const [dialogType, setDialogType] = useState<'delete' | 'setDefault'>('setDefault');

  const handleDeletePress = (id: string, label: string) => {
    setTargetAddress({ id, label });
    setDialogType('delete');
    setDialogOpen(true);
  };

  const handleSetDefaultPress = (id: string, label: string) => {
    setTargetAddress({ id, label });
    setDialogType('setDefault');
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!targetAddress) return;
    
    if (dialogType === 'delete') {
      removeAddress(targetAddress.id);
    } else {
      setDefaultAddress(targetAddress.id);
    }
    setDialogOpen(false);
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      
      {/* Header */}
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          My Addresses
        </Text>
      </XStack>

      {/* Content */}
      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" paddingBottom="$10" gap="$4">
          
          <Button 
            variant="outline" 
            height={56} 
            icon={<Plus size={20} color="$primary" />}
            onPress={() => router.push('/profile/add-address')}
            borderStyle="dashed"
            borderWidth={2}
          >
            <Text fontSize="$4" fontWeight="700" color="$primary" fontFamily="$body">
              Add New Address
            </Text>
          </Button>

          <YStack gap="$4" marginTop="$4">
            {addresses.length === 0 ? (
              <YStack alignItems="center" marginTop="$10" gap="$2">
                <MapPin size={48} color="$gray200" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">No addresses saved yet</Text>
              </YStack>
            ) : (
              addresses.map(address => (
                <TouchableOpacity 
                  key={address.id} 
                  activeOpacity={0.7}
                  onPress={() => !address.isDefault && handleSetDefaultPress(address.id, address.label)}
                >
                  <XStack 
                    backgroundColor="$backgroundStrong" 
                    padding="$4" 
                    borderRadius="$4" 
                    borderWidth={address.isDefault ? 2 : 1}
                    borderColor={address.isDefault ? '$primary' : '$borderColor'}
                    alignItems="flex-start"
                    gap="$4"
                  >
                    <YStack 
                      width={40} 
                      height={40} 
                      borderRadius="$full" 
                      backgroundColor={address.isDefault ? 'rgba(255,118,34,0.1)' : '$backgroundSoft'} 
                      justifyContent="center" 
                      alignItems="center"
                    >
                      <MapPin size={20} color={address.isDefault ? '$primary' : '$colorSecondary'} />
                    </YStack>
                    
                    <YStack flex={1} gap="$1">
                      <XStack alignItems="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color" textTransform="capitalize">
                          {address.label}
                        </Text>
                        {address.isDefault && (
                          <YStack backgroundColor="$primary" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$full">
                            <Text fontSize="$1" fontWeight="800" color="white" fontFamily="$body" textTransform="uppercase">
                              Default
                            </Text>
                          </YStack>
                        )}
                      </XStack>
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                        {address.fullAddress}
                      </Text>

                      <XStack marginTop="$3" justifyContent="flex-end">
                        <Button 
                          size="$2" 
                          variant="ghost" 
                          paddingVertical={0}
                          paddingHorizontal="$2"
                          icon={<Trash2 size={14} color="$red" />}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeletePress(address.id, address.label);
                          }}
                        >
                          <Text fontSize="$2" color="$red" fontWeight="700" fontFamily="$body">Delete</Text>
                        </Button>
                      </XStack>
                    </YStack>
                  </XStack>
                </TouchableOpacity>
              ))
            )}
          </YStack>

        </YStack>
      </ScrollView>

      {/* Dialog */}
      <AppAlertDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogType === 'delete' ? 'Delete Address' : 'Set Default Address'}
        description={dialogType === 'delete' 
          ? `Are you sure you want to delete "${targetAddress?.label}"?` 
          : `Do you want to set "${targetAddress?.label}" as your primary delivery address?`
        }
        confirmText={dialogType === 'delete' ? 'DELETE' : 'SET DEFAULT'}
        isDestructive={dialogType === 'delete'}
        icon={dialogType === 'delete' ? Trash2 : Star}
        onConfirm={handleConfirm}
      />
    </YStack>
  );
}
