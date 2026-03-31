// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { YStack, XStack, Text, Image, Separator } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Check, Trash2, ChevronRight, Mail, Phone } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, BackButton, Input } from '@/components/ui';
import { AppAlertDialog } from '@/components/ui/AlertDialog';
import { useAuthStore } from '@/stores/auth.store';
import { profileService } from '@/services/profile.service';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload a profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take a profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setIsUploadingAvatar(true);
    try {
      const response = await profileService.uploadAvatar(imageUri);
      setUser({
        ...user!,
        avatarUrl: response.avatarUrl,
      });
      
      setDialogConfig({
        title: 'Success',
        description: 'Profile picture updated successfully!',
        onConfirm: () => setDialogOpen(false)
      });
      setDialogOpen(true);
    } catch (error) {
      setDialogConfig({
        title: 'Error',
        description: 'Failed to upload profile picture. Please try again.',
        onConfirm: () => setDialogOpen(false)
      });
      setDialogOpen(true);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setDialogConfig({
      title: 'Remove Photo',
      description: 'Are you sure you want to remove your profile picture?',
      onConfirm: async () => {
        setDialogOpen(false);
        setIsUploadingAvatar(true);
        try {
          await profileService.deleteAvatar();
          setUser({
            ...user!,
            avatarUrl: undefined,
          });
        } catch (error) {
          Alert.alert('Error', 'Failed to remove profile picture.');
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    });
    setDialogOpen(true);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        ...(user?.avatarUrl ? [{ text: 'Remove Photo', onPress: handleDeleteAvatar, style: 'destructive' }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    if (!formData.fullName) {
      setDialogConfig({
        title: 'Error',
        description: 'Full Name is required.',
        onConfirm: () => setDialogOpen(false)
      });
      setDialogOpen(true);
      return;
    }

    setIsSaving(true);
    
    // Simulate network delay
    setTimeout(() => {
      setUser({
        ...user!,
        ...formData,
      });
      setIsSaving(false);
      
      setDialogConfig({
        title: 'Success',
        description: 'Profile updated successfully!',
        onConfirm: () => {
          setDialogOpen(false);
          router.back();
        }
      });
      setDialogOpen(true);
    }, 1000);
  };
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
        
        {/* Header */}
        <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3" justifyContent="space-between">
          <XStack alignItems="center" gap="$3">
            <BackButton />
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
              Edit Profile
            </Text>
          </XStack>
          <Button 
            variant="ghost" 
            size="$3" 
            icon={<Check size={20} color="$primary" />} 
            onPress={handleSave}
            loading={isSaving}
          >
            <Text color="$primary" fontWeight="700">Save</Text>
          </Button>
        </XStack>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <YStack alignItems="center" marginTop="$5">
            <YStack position="relative">
              <YStack 
                width={110} 
                height={110} 
                borderRadius="$full" 
                backgroundColor="$gray100" 
                justifyContent="center" 
                alignItems="center" 
                overflow="hidden"
                onPress={showImageOptions}
                pressStyle={{ opacity: 0.8 }}
              >
                 {user?.avatarUrl ? (
                   <Image source={{ uri: user.avatarUrl }} width="100%" height="100%" />
                 ) : (
                   <Camera size={40} color="$colorSecondary" />
                 )}
                 {isUploadingAvatar && (
                   <YStack 
                     position="absolute" 
                     top={0} 
                     left={0} 
                     right={0} 
                     bottom={0} 
                     backgroundColor="rgba(0,0,0,0.5)"
                     justifyContent="center"
                     alignItems="center"
                   >
                     <Text color="white" fontSize="$3">Uploading...</Text>
                   </YStack>
                 )}
              </YStack>
              <YStack 
                position="absolute" 
                bottom={0} 
                right={0} 
                backgroundColor="$primary" 
                width={36} 
                height={36} 
                borderRadius="$full" 
                justifyContent="center" 
                alignItems="center"
                borderWidth={3}
                borderColor="white"
                onPress={showImageOptions}
                pressStyle={{ scale: 0.9 }}
              >
                <Camera size={16} color="white" />
              </YStack>
            </YStack>
            <Text 
              fontSize="$3" 
              color="$colorSecondary" 
              marginTop="$3"
              onPress={showImageOptions}
            >
              Tap to change photo
            </Text>
          </YStack>

          <YStack padding="$5" gap="$5" marginTop="$4">
            
            <YStack gap="$3">
              <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
                Personal Information
              </Text>
              
              <YStack gap="$1">
                <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">Full Name</Text>
                <Input 
                  placeholder="E.g. John Doe" 
                  value={formData.fullName} 
                  onChangeText={(text) => setFormData(p => ({ ...p, fullName: text }))}
                />
              </YStack>

              <YStack gap="$1">
                <Text fontSize="$3" color="$colorSecondary" marginLeft="$2" marginBottom="$1">Bio</Text>
                <Input 
                  placeholder="Tell us about yourself..." 
                  value={formData.bio} 
                  onChangeText={(text) => setFormData(p => ({ ...p, bio: text }))}
                  multiline 
                  height={100} 
                  paddingTop="$2"
                />
              </YStack>
            </YStack>

            <YStack gap="$3" marginTop="$2">
              <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
                Account Security
              </Text>
              <Text fontSize="$2" color="$colorSecondary" marginBottom="$2">
                These fields can only be changed from the Privacy & Security settings for your protection.
              </Text>

              <XStack 
                alignItems="center" 
                justifyContent="space-between"
                padding="$4"
                backgroundColor="$gray50"
                borderRadius="$4"
                onPress={() => router.push('/profile/security')}
                pressStyle={{ opacity: 0.7 }}
              >
                <XStack gap="$3" alignItems="center" flex={1}>
                  <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                    <Mail size={20} color="$primary" />
                  </YStack>
                  <YStack gap="$1" flex={1}>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Email Address</Text>
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">
                      {user?.email || 'Not set'}
                    </Text>
                  </YStack>
                </XStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator borderColor="$gray100" />

              <XStack 
                alignItems="center" 
                justifyContent="space-between"
                padding="$4"
                backgroundColor="$gray50"
                borderRadius="$4"
                onPress={() => router.push('/profile/security')}
                pressStyle={{ opacity: 0.7 }}
              >
                <XStack gap="$3" alignItems="center" flex={1}>
                  <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                    <Phone size={20} color="$primary" />
                  </YStack>
                  <YStack gap="$1" flex={1}>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Phone Number</Text>
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">
                      {user?.phone || 'Not set'}
                    </Text>
                  </YStack>
                </XStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>
            </YStack>

            <YStack marginTop="$4">
               <Button 
                 variant="primary" 
                 height={56} 
                 onPress={handleSave}
                 loading={isSaving}
                 disabled={isSaving}
               >
                 SAVE CHANGES
               </Button>
            </YStack>

          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
