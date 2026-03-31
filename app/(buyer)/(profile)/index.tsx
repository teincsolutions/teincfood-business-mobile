// @ts-nocheck
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Image, Separator } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  MoonStar,
  CircleHelp,
  LogOut,
  Pencil,
  Heart,
} from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: Heart, label: 'Favorites', route: '/saved' },
      { icon: MapPin, label: 'My Addresses', route: '/profile/addresses' },
      { icon: CreditCard, label: 'Payment Methods', route: '/profile/payments' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', route: '/profile/notifications' },
      { icon: MoonStar, label: 'Theme', route: '/profile/theme' },
      { icon: Shield, label: 'Privacy & Security', route: '/profile/security' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: CircleHelp, label: 'Help Center', route: '/profile/help' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: 'transparent' }}
      >
        <YStack paddingTop={Math.max(insets.top, 50)} paddingBottom="$10" gap="$6">

          {/* Profile Header */}
          <YStack alignItems="center" padding="$5" gap="$3">
            <YStack position="relative">
              <Image
                source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                width={100}
                height={100}
                borderRadius="$full"
                objectFit="cover"
              />
              <YStack
                position="absolute"
                bottom={0}
                right={0}
                width={32}
                height={32}
                borderRadius="$full"
                backgroundColor="$primary"
                justifyContent="center"
                alignItems="center"
                borderWidth={3}
                borderColor="$background"
                pressStyle={{ scale: 0.9 }}
                onPress={() => router.push('/profile/edit')}
              >
                <Pencil size={14} color="white" />
              </YStack>
            </YStack>

            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="800" fontFamily="$heading" color="$color">
                {user?.fullName || 'Guest User'}
              </Text>
              {user?.username ? (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  @{user.username}
                </Text>
              ) : null}
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                {user?.email || 'No email'}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {user?.phone || ''}
              </Text>
            </YStack>
          </YStack>

          {/* Menu Sections */}
          {MENU_SECTIONS.map((section) => (
            <YStack key={section.title} gap="$2">
              <Text
                fontSize="$3"
                fontWeight="700"
                color="$colorSecondary"
                fontFamily="$body"
                textTransform="uppercase"
                paddingHorizontal="$5"
              >
                {section.title}
              </Text>

              <YStack backgroundColor="$backgroundStrong" marginHorizontal="$5" borderRadius="$5" overflow="hidden">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <YStack key={item.label}>
                      <XStack
                        alignItems="center"
                        padding="$4"
                        gap="$3"
                        pressStyle={{ backgroundColor: '$backgroundSoft' }}
                        onPress={() => item.route && router.push(item.route)}
                        opacity={item.route ? 1 : 0.5} // dim unimplemented items
                      >
                        <YStack
                          width={40}
                          height={40}
                          borderRadius="$3"
                          backgroundColor="$backgroundSoft"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Icon size={20} color="$primary" />
                        </YStack>
                        <Text flex={1} fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">
                          {item.label}
                        </Text>
                        <ChevronRight size={18} color="$colorSecondary" />
                      </XStack>
                      {idx < section.items.length - 1 && (
                        <Separator borderColor="$borderColor" marginLeft={64} />
                      )}
                    </YStack>
                  );
                })}
              </YStack>
            </YStack>
          ))}

          {/* Logout */}
          <YStack paddingHorizontal="$5" marginTop="$4">
            <Button
              variant="ghost"
              height={56}
              backgroundColor="$backgroundSoft"
              icon={<LogOut size={20} color="$red" />}
              onPress={handleLogout}
            >
              <Text color="$red" fontWeight="700" fontFamily="$body" fontSize="$4">
                Log Out
              </Text>
            </Button>
          </YStack>

          {/* App Version */}
          <Text textAlign="center" fontSize="$2" color="$colorSecondary" fontFamily="$body">
            TeincFoods v1.0.0
          </Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
