// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button as TamaguiButton,
  Input,
  Switch,
  Separator,
} from 'tamagui';
import { ArrowLeft, Save, CreditCard, Building, Clock, DollarSign } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Payment Settings Screen
 */
export default function PaymentSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptMobileMoney, setAcceptMobileMoney] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [payoutSchedule, setPayoutSchedule] = useState('daily');

  const payoutOptions = [
    { value: 'daily', label: 'Daily', description: 'Receive payouts every day' },
    { value: 'weekly', label: 'Weekly', description: 'Receive payouts every Monday' },
    { value: 'biweekly', label: 'Bi-weekly', description: 'Receive payouts every 2 weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Receive payouts on the 1st of each month' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Payment settings updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <TamaguiButton
            width={40}
            height={40}
            circular
            backgroundColor="$backgroundSoft"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Payment Settings</Text>
        </XStack>
        <TamaguiButton
          height={44}
          paddingHorizontal="$4"
          backgroundColor="$primary"
          borderRadius="$3"
          onPress={handleSave}
          disabled={isSaving}
          icon={<Save size={18} color="white" />}
        >
          <Text color="white" fontWeight="bold">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TamaguiButton>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Payment Methods */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Accepted Payment Methods
              </Text>
              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Cash</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    Accept cash payments
                  </Text>
                </YStack>
                <Switch
                  checked={acceptCash}
                  onCheckedChange={setAcceptCash}
                  backgroundColor={acceptCash ? '$green10' : '$gray8'}
                >
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>

              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Mobile Money</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    MTN, Vodafone, AirtelTigo
                  </Text>
                </YStack>
                <Switch
                  checked={acceptMobileMoney}
                  onCheckedChange={setAcceptMobileMoney}
                  backgroundColor={acceptMobileMoney ? '$green10' : '$gray8'}
                >
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>

              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Card Payment</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    Visa, Mastercard
                  </Text>
                </YStack>
                <Switch
                  checked={acceptCard}
                  onCheckedChange={setAcceptCard}
                  backgroundColor={acceptCard ? '$green10' : '$gray8'}
                >
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>
            </YStack>
          </Card>

          {/* Bank Account */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <XStack gap="$3" alignItems="center">
                <Building size={20} color="$primary" />
                <Text fontWeight="bold" fontSize="$5">
                  Bank Account
                </Text>
              </XStack>
              <Separator />

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Bank Name
                </Text>
                <Input
                  placeholder="Select your bank"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Account Number
                </Text>
                <Input
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Account Name
                </Text>
                <Input
                  placeholder="Enter account holder name"
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </YStack>
            </YStack>
          </Card>

          {/* Mobile Money */}
          {acceptMobileMoney && (
            <Card padding="$4" bordered>
              <YStack gap="$4">
                <XStack gap="$3" alignItems="center">
                  <CreditCard size={20} color="$primary" />
                  <Text fontWeight="bold" fontSize="$5">
                    Mobile Money Account
                  </Text>
                </XStack>
                <Separator />

                <YStack gap="$2">
                  <Text fontSize="$3" color="$colorMuted">
                    Mobile Money Number
                  </Text>
                  <Input
                    placeholder="+233 XX XXX XXXX"
                    value={mobileMoneyNumber}
                    onChangeText={setMobileMoneyNumber}
                    keyboardType="phone-pad"
                  />
                </YStack>
              </YStack>
            </Card>
          )}

          {/* Payout Schedule */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <XStack gap="$3" alignItems="center">
                <Clock size={20} color="$primary" />
                <Text fontWeight="bold" fontSize="$5">
                  Payout Schedule
                </Text>
              </XStack>
              <Separator />

              {payoutOptions.map((option) => (
                <TamaguiButton
                  key={option.value}
                  unstyled
                  padding="$3"
                  backgroundColor={
                    payoutSchedule === option.value ? '$primaryLight' : 'transparent'
                  }
                  borderWidth={1}
                  borderColor={
                    payoutSchedule === option.value ? '$primary' : '$borderColor'
                  }
                  borderRadius="$3"
                  onPress={() => setPayoutSchedule(option.value)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text fontWeight="bold">{option.label}</Text>
                      <Text fontSize="$2" color="$colorMuted">
                        {option.description}
                      </Text>
                    </YStack>
                    {payoutSchedule === option.value && (
                      <YStack
                        width={20}
                        height={20}
                        borderRadius="$10"
                        backgroundColor="$primary"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="$background" fontSize="$1">✓</Text>
                      </YStack>
                    )}
                  </XStack>
                </TamaguiButton>
              ))}
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text color="white" fontWeight="bold">
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}