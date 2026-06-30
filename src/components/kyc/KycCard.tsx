// @ts-nocheck
import { useState } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { YStack, XStack, Text, Sheet, Separator, useTheme } from 'tamagui';
import { FileText, Check, Clock, AlertCircle, Camera, ChevronDown } from '@tamagui/lucide-icons';
import { toast } from 'sonner-native';
import { Button, FormInput } from '@/components/ui';
import { uploadImage } from '@/services/upload.service';
import { extractApiErrorMessage } from '@/utils/error';

export type DocStatus = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

export interface KycDocConfig {
  id: string;
  name: string;
  description: string;
  required: boolean;
  /** Show ID number input */
  hasIdNumber?: boolean;
  /** Show ID type picker (national_id only) */
  hasIdType?: boolean;
}

interface KycCardProps {
  config: KycDocConfig;
  status: DocStatus;
  uploadedAt?: string;
  rejectionReason?: string;
  uploading: boolean;
  idType?: string;
  idNumber?: string;
  onIdTypeChange?: (type: string) => void;
  onIdNumberChange?: (val: string) => void;
  onUpload: (docId: string, useCamera: boolean) => void;
  onRemove: (docId: string) => void;
}

const ID_TYPES = [
  { value: 'ghana_card', label: 'Ghana Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
];

const STATUS_COLOR: Record<DocStatus, string> = {
  not_uploaded: '#95a5a6',
  pending: '#f39c12',
  verified: '$success',
  rejected: '#e74c3c',
};

export function KycCard({
  config,
  status,
  uploadedAt,
  rejectionReason,
  uploading,
  idType,
  idNumber,
  onIdTypeChange,
  onIdNumberChange,
  onUpload,
  onRemove,
}: KycCardProps) {
  const theme = useTheme();
  const [idTypeSheetOpen, setIdTypeSheetOpen] = useState(false);

  const selectedLabel = ID_TYPES.find((t) => t.value === idType)?.label || 'Select ID Type';

  const getStatusIcon = () => {
    switch (status) {
      case 'verified': return <Check size={16} color="$success" />;
      case 'pending': return <Clock size={16} color="#f39c12" />;
      case 'rejected': return <AlertCircle size={16} color="#e74c3c" />;
      default: return <FileText size={16} color="#95a5a6" />;
    }
  };

  const canUpload = status === 'not_uploaded' || status === 'rejected';

  return (
    <YStack gap="$2" paddingVertical="$2">
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap="$3" alignItems="center" flex={1}>
          <YStack width={36} height={36} borderRadius="$4" backgroundColor="$gray3" alignItems="center" justifyContent="center">
            <FileText size={18} color="$colorMuted" />
          </YStack>
          <YStack flex={1}>
            <XStack gap="$1" alignItems="center">
              <Text fontWeight="bold" fontSize="$3" fontFamily="$body">{config.name}</Text>
              {config.required && <Text fontSize="$2" color="$red10">*</Text>}
            </XStack>
            <Text fontSize="$2" color="$colorMuted" fontFamily="$body">{config.description}</Text>
          </YStack>
        </XStack>
        <XStack gap="$1" alignItems="center">
          {getStatusIcon()}
          <YStack backgroundColor={STATUS_COLOR[status]} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
            <Text color="white" fontSize="$1" textTransform="capitalize" fontFamily="$body">
              {status === 'not_uploaded' ? 'Not uploaded' : status}
            </Text>
          </YStack>
        </XStack>
      </XStack>

      {/* ID Type picker — only for national_id */}
      {config.hasIdType && canUpload && (
        <YStack paddingLeft="$11" marginTop="$1">
          <TouchableOpacity onPress={() => setIdTypeSheetOpen(true)} style={{ height: 48, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.backgroundSoft?.val || '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text fontFamily="$body" fontSize="$3" color={idType ? '$color' : '$colorMuted'}>{selectedLabel}</Text>
            <ChevronDown size={16} color="$colorMuted" />
          </TouchableOpacity>
        </YStack>
      )}

      {/* ID Number input */}
      {config.hasIdNumber && canUpload && (
        <YStack paddingLeft="$11" marginTop="$1">
          <FormInput
            label=""
            placeholder={`${config.name} number`}
            value={idNumber || ''}
            onChangeText={onIdNumberChange || (() => {})}
          />
        </YStack>
      )}

      {/* Uploaded date */}
      {uploadedAt && (
        <Text fontSize="$2" color="$colorMuted" paddingLeft="$11" fontFamily="$body">
          Uploaded: {uploadedAt}
        </Text>
      )}

      {/* Rejection reason */}
      {status === 'rejected' && rejectionReason && (
        <YStack backgroundColor="$red2" padding="$2" borderRadius="$2" marginLeft="$11">
          <Text fontSize="$2" color="$red10" fontFamily="$body">Reason: {rejectionReason}</Text>
        </YStack>
      )}

      {/* Upload buttons */}
      {canUpload && (
        <XStack gap="$2" paddingLeft="$11" marginTop="$1">
          <Button size="$2" variant="outline" icon={<Camera size={14} />} onPress={() => onUpload(config.id, true)} disabled={uploading}>
            Camera
          </Button>
          <Button size="$2" variant="outline" icon={<Camera size={14} />} onPress={() => onUpload(config.id, false)} disabled={uploading}>
            Gallery
          </Button>
        </XStack>
      )}

      {/* ID Type bottom sheet */}
      <Sheet modal open={idTypeSheetOpen} onOpenChange={setIdTypeSheetOpen} snapPoints={[40]} dismissOnSnapToBottom zIndex={200_000}>
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack px="$5" pt="$3" pb="$2">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading">Select ID Type</Text>
          </YStack>
          <YStack px="$5" pb="$6" gap="$1">
            {ID_TYPES.map((t, i) => (
              <YStack key={t.value}>
                <XStack py="$4" justifyContent="space-between" alignItems="center" onPress={() => { onIdTypeChange?.(t.value); setIdTypeSheetOpen(false); }}>
                  <Text fontSize="$4" fontFamily="$body" fontWeight="600" color="$color">{t.label}</Text>
                  {idType === t.value && <Check size={18} color="$primary" />}
                </XStack>
                {i < ID_TYPES.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
