// @ts-nocheck
import React from 'react';
import { ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  Sheet,
  Separator,
  useTheme,
  Spinner,
} from 'tamagui';
import { X, Smartphone, Monitor, Globe, Trash2, Check, MapPin, Clock } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import { useSessionsQuery, useTerminateSessionMutation, useTerminateAllOtherSessionsMutation } from '@/hooks/sessions.hooks';
import type { Session } from '@/services/sessions.service';

interface SessionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDeviceIcon(deviceType: Session['deviceType']) {
  switch (deviceType) {
    case 'ios':
    case 'android':
      return Smartphone;
    case 'desktop':
      return Monitor;
    case 'web':
      return Globe;
    default:
      return Smartphone;
  }
}

function getDeviceTypeLabel(deviceType: Session['deviceType']): string {
  switch (deviceType) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'desktop':
      return 'Desktop';
    case 'web':
      return 'Web';
    default:
      return 'Unknown';
  }
}

export function SessionsSheet({ open, onOpenChange }: SessionsSheetProps) {
  const theme = useTheme();
  const { data: sessions, isLoading } = useSessionsQuery(open);
  const terminateSession = useTerminateSessionMutation();
  const terminateAllOther = useTerminateAllOtherSessionsMutation();

  const handleTerminateSession = (session: Session) => {
    if (session.isCurrent) {
      Alert.alert('Cannot Terminate', 'You cannot terminate your current session.');
      return;
    }

    Alert.alert(
      'Terminate Session',
      `Are you sure you want to terminate the session on ${session.deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => terminateSession.mutate(session.id),
        },
      ]
    );
  };

  const handleTerminateAllOther = () => {
    const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];
    if (otherSessions.length === 0) {
      Alert.alert('No Sessions', 'There are no other sessions to terminate.');
      return;
    }

    Alert.alert(
      'Terminate All Other Sessions',
      `Are you sure you want to terminate ${otherSessions.length} other session(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate All',
          style: 'destructive',
          onPress: () => terminateAllOther.mutate(),
        },
      ]
    );
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85]}
      dismissOnSnapToBottom
      zIndex={100_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.5)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

        {/* Header */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$5"
          paddingVertical="$4"
        >
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
            Active Sessions
          </Text>
          <TouchableOpacity onPress={() => onOpenChange(false)}>
            <X size={24} color={theme.color?.val} />
          </TouchableOpacity>
        </XStack>

        <Separator />

        {/* Content */}
        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
            <Spinner size="large" color="$primary" />
            <Text marginTop="$4" color="$colorSecondary">
              Loading sessions...
            </Text>
          </YStack>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack padding="$4" gap="$3" paddingBottom="$8">
              {/* Sessions List */}
              {sessions?.map((session, index) => {
                const DeviceIcon = getDeviceIcon(session.deviceType);
                return (
                  <YStack key={session.id}>
                    <XStack
                      padding="$4"
                      backgroundColor={session.isCurrent ? '$green2' : '$backgroundSoft'}
                      borderRadius="$4"
                      borderWidth={1}
                      borderColor={session.isCurrent ? '$success' : '$borderColor'}
                      gap="$3"
                    >
                      {/* Device Icon */}
                      <YStack
                        width={48}
                        height={48}
                        borderRadius="$10"
                        backgroundColor={session.isCurrent ? '$green10' : '$gray3'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <DeviceIcon
                          size={24}
                          color={session.isCurrent ? 'white' : theme.colorSecondary?.val}
                        />
                      </YStack>

                      {/* Session Info */}
                      <YStack flex={1} gap="$1">
                        <XStack alignItems="center" gap="$2">
                          <Text fontWeight="bold" fontFamily="$heading" fontSize="$4">
                            {session.deviceName}
                          </Text>
                          {session.isCurrent && (
                            <YStack
                              backgroundColor="$green10"
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              borderRadius="$2"
                            >
                              <Text color="white" fontSize="$1" fontWeight="600">
                                Current
                              </Text>
                            </YStack>
                          )}
                        </XStack>

                        {session.browser && (
                          <Text fontSize="$2" color="$colorSecondary">
                            {session.browser}
                          </Text>
                        )}

                        <XStack alignItems="center" gap="$1" marginTop="$1">
                          <MapPin size={12} color={theme.colorSecondary?.val} />
                          <Text fontSize="$2" color="$colorSecondary">
                            {session.location}
                          </Text>
                        </XStack>

                        <XStack alignItems="center" gap="$1">
                          <Clock size={12} color={theme.colorSecondary?.val} />
                          <Text fontSize="$2" color="$colorSecondary">
                            Last active: {session.lastActive}
                          </Text>
                        </XStack>

                        <Text fontSize="$1" color="$colorSecondary" marginTop="$0.5">
                          IP: {session.ipAddress} • {getDeviceTypeLabel(session.deviceType)}
                        </Text>
                      </YStack>

                      {/* Terminate Button */}
                      {!session.isCurrent && (
                        <TouchableOpacity
                          onPress={() => handleTerminateSession(session)}
                          disabled={terminateSession.isPending}
                        >
                          <YStack
                            width={40}
                            height={40}
                            borderRadius="$10"
                            backgroundColor="$red2"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Trash2 size={18} color="$red10" />
                          </YStack>
                        </TouchableOpacity>
                      )}
                    </XStack>
                  </YStack>
                );
              })}

              {/* Terminate All Other Sessions Button */}
              {sessions && sessions.filter((s) => !s.isCurrent).length > 0 && (
                <YStack marginTop="$4">
                  <Button
                    variant="dangerOutline"
                    width="100%"
                    onPress={handleTerminateAllOther}
                    loading={terminateAllOther.isPending}
                    disabled={terminateAllOther.isPending}
                    icon={<Trash2 size={18} />}
                  >
                    Terminate All Other Sessions
                  </Button>
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                    textAlign="center"
                    marginTop="$2"
                  >
                    This will sign out all other devices except this one
                  </Text>
                </YStack>
              )}

              {/* Info Text */}
              <YStack
                marginTop="$4"
                padding="$4"
                backgroundColor="$blue2"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$blue8"
              >
                <Text fontSize="$3" color="$blue10" fontWeight="600">
                  Security Tip
                </Text>
                <Text fontSize="$2" color="$colorSecondary" marginTop="$1">
                  If you see any unfamiliar sessions, terminate them immediately and change your password.
                </Text>
              </YStack>
            </YStack>
          </ScrollView>
        )}
      </Sheet.Frame>
    </Sheet>
  );
}