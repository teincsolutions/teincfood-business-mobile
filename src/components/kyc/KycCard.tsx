// @ts-nocheck
import { useState } from "react";
import { TouchableOpacity, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  YStack,
  XStack,
  Text,
  Sheet,
  Separator,
  Progress,
  Avatar,
  useTheme,
} from "tamagui";
import {
  FileText,
  Check,
  Clock,
  AlertCircle,
  Camera,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  File as FileIcon,
} from "@tamagui/lucide-icons";
import { Button, FormInput, TamaguiDateInput } from "@/components/ui";

export type DocStatus =
  | "not_uploaded"
  | "uploading"
  | "pending"
  | "verified"
  | "rejected";
export type FileType = "image" | "pdf" | "unknown";

export interface KycDocConfig {
  id: string;
  name: string;
  description: string;
  required: boolean;
  hasIdNumber?: boolean;
  hasIdType?: boolean;
  hasDates?: boolean;
  isProfilePhoto?: boolean;
}

interface KycCardProps {
  config: KycDocConfig;
  status: DocStatus;
  uploadedAt?: string;
  previewUri?: string;
  rejectionReason?: string;
  uploading: boolean;
  uploadProgress?: number;
  idType?: string;
  idNumber?: string;
  issuedDate?: Date;
  expirationDate?: Date;
  onIdTypeChange?: (type: string) => void;
  onIdNumberChange?: (val: string) => void;
  onIssuedDateChange?: (val: Date) => void;
  onExpirationDateChange?: (val: Date) => void;
  onUpload: (docId: string, source: "camera" | "gallery" | "document") => void;
  onSubmitDoc: (docId: string) => void;
  onRemove: (docId: string) => void;
}

const ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
];

const STATUS_COLOR: Record<DocStatus, string> = {
  not_uploaded: "#95a5a6",
  uploading: "#f39c12",
  pending: "#f39c12",
  verified: "$success",
  rejected: "#e74c3c",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  not_uploaded: "Not uploaded",
  uploading: "Uploading...",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

export function KycCard({
  config,
  status,
  uploadedAt,
  previewUri,
  rejectionReason,
  uploading,
  uploadProgress,
  idType,
  idNumber,
  issuedDate,
  expirationDate,
  onIdTypeChange,
  onIdNumberChange,
  onIssuedDateChange,
  onExpirationDateChange,
  onUpload,
  onSubmitDoc,
  onRemove,
}: KycCardProps) {
  const theme = useTheme();
  const [idTypeSheetOpen, setIdTypeSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isImage = previewUri
    ? /\.(jpe?g|png|gif|webp|bmp)$/i.test(previewUri) ||
      previewUri.startsWith("http")
    : false;

  const selectedLabel =
    ID_TYPES.find((t) => t.value === idType)?.label || "Select ID Type";
  const canUpload = status === "not_uploaded" || status === "rejected";
  const canSubmit =
    status !== "not_uploaded" &&
    status !== "pending" &&
    status !== "verified" &&
    status !== "rejected" &&
    !uploading;

  return (
    <YStack gap="$2" paddingVertical="$2">
      {/* Header row */}
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap="$3" alignItems="center" flex={1}>
          <YStack
            width={36}
            height={36}
            borderRadius="$4"
            backgroundColor="$gray3"
            alignItems="center"
            justifyContent="center"
          >
            <FileText size={18} color="$colorMuted" />
          </YStack>
          <YStack flex={1}>
            <XStack gap="$1" alignItems="center">
              <Text fontWeight="bold" fontSize="$3" fontFamily="$body">
                {config.name}
              </Text>
              {config.required && (
                <Text fontSize="$2" color="$red10">
                  *
                </Text>
              )}
            </XStack>
            <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
              {config.description}
            </Text>
          </YStack>
        </XStack>
        <XStack gap="$1" alignItems="center">
          {status === "verified" ? (
            <Check size={16} color="$success" />
          ) : status === "rejected" ? (
            <AlertCircle size={16} color="#e74c3c" />
          ) : (
            <Clock size={16} color="#f39c12" />
          )}
          <YStack
            backgroundColor={STATUS_COLOR[status]}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
          >
            <Text
              color="white"
              fontSize="$1"
              textTransform="capitalize"
              fontFamily="$body"
            >
              {STATUS_LABEL[status]}
            </Text>
          </YStack>
        </XStack>
      </XStack>

      {/* ID Type picker */}
      {config.hasIdType && canUpload && (
        <YStack paddingLeft="$11" marginTop="$1">
          <TouchableOpacity
            onPress={() => setIdTypeSheetOpen(true)}
            style={{
              height: 48,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: theme.backgroundSoft?.val || "#f3f4f6",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              fontFamily="$body"
              fontSize="$3"
              color={idType ? "$color" : "$colorMuted"}
            >
              {selectedLabel}
            </Text>
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
            value={idNumber || ""}
            onChangeText={onIdNumberChange || (() => {})}
          />
        </YStack>
      )}

      {/* Issued date + Expiration date */}
      {config.hasDates && canUpload && (
        <XStack gap="$2" paddingLeft="$11" marginTop="$1">
          <YStack flex={1}>
            <TamaguiDateInput
              value={issuedDate}
              onChange={onIssuedDateChange || (() => {})}
              placeholder="Issued date"
            />
          </YStack>
          <YStack flex={1}>
            <TamaguiDateInput
              value={expirationDate}
              onChange={onExpirationDateChange || (() => {})}
              placeholder="Expiry date"
            />
          </YStack>
        </XStack>
      )}

      {/* Upload progress bar */}
      {status === "uploading" && (
        <YStack paddingLeft="$11" marginTop="$1" gap="$1">
          <Progress
            value={uploadProgress || 0}
            backgroundColor="$gray5"
            height={6}
          >
            <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
          </Progress>
          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
            Uploading... {uploadProgress || 0}%
          </Text>
        </YStack>
      )}

      {/* Preview — avatar is always visible for profile photo and acts as upload button */}
      {config.isProfilePhoto ? (
        <YStack marginTop="$1" alignItems="center">
          <TouchableOpacity
            onPress={() => canUpload && setPickerOpen(true)}
            disabled={uploading}
          >
            <Avatar radiused size="$18" opacity={uploading ? 0.5 : 1}>
              <Avatar.Image src={previewUri || undefined} />
              <Avatar.Fallback
                backgroundColor="$primary"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontSize="$6" fontFamily="$body">
                  {config.name.charAt(0)}
                </Text>
              </Avatar.Fallback>
            </Avatar>
          </TouchableOpacity>
          <Text
            fontSize="$2"
            color="$colorMuted"
            fontFamily="$body"
            marginTop="$1"
          >
            {previewUri ? "Tap to change" : "Tap to add photo"}
          </Text>
        </YStack>
      ) : previewUri && status !== "not_uploaded" && status !== "rejected" ? (
        <YStack paddingLeft="$11" marginTop="$1">
          {isImage ? (
            <YStack
              width={120}
              height={80}
              borderRadius="$3"
              overflow="hidden"
              backgroundColor="$backgroundSoft"
            >
              <Image
                source={{ uri: previewUri }}
                style={{ width: 120, height: 80 }}
                resizeMode="cover"
              />
            </YStack>
          ) : (
            <XStack
              gap="$2"
              alignItems="center"
              padding="$2"
              backgroundColor="$backgroundSoft"
              borderRadius="$3"
            >
              <FileText size={20} color="$colorMuted" />
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Document uploaded
              </Text>
            </XStack>
          )}
        </YStack>
      ) : null}

      {/* Uploaded date */}
      {uploadedAt && (
        <Text
          fontSize="$2"
          color="$colorMuted"
          paddingLeft="$11"
          fontFamily="$body"
        >
          Uploaded: {uploadedAt}
        </Text>
      )}

      {/* Rejection reason */}
      {status === "rejected" && rejectionReason && (
        <YStack
          backgroundColor="$red2"
          padding="$2"
          borderRadius="$2"
          marginLeft="$11"
        >
          <Text fontSize="$2" color="$red10" fontFamily="$body">
            Reason: {rejectionReason}
          </Text>
        </YStack>
      )}

      {/* Upload button — hidden for profile_photo since the avatar acts as the button */}
      {canUpload && !config.isProfilePhoto && (
        <XStack gap="$2" paddingLeft="$11" marginTop="$1">
          <Button
            size="$2"
            variant="outline"
            icon={<Camera size={14} />}
            onPress={() => setPickerOpen(true)}
            disabled={uploading}
          >
            Upload
          </Button>
        </XStack>
      )}

      {/* Source picker sheet — Camera, Gallery, Document */}
      <Sheet
        modal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        snapPoints={config.isProfilePhoto ? [35] : [45]}
        dismissOnSnapToBottom
        zIndex={200_000}
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
          <YStack px="$5" pt="$3" pb="$4" gap="$2">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading">
              Upload {config.name}
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Choose a source
            </Text>
          </YStack>
          <YStack px="$5" pb="$6" gap="$1">
            <XStack
              py="$4"
              gap="$3"
              alignItems="center"
              onPress={() => {
                setPickerOpen(false);
                onUpload(config.id, "camera");
              }}
            >
              <YStack
                p="$2"
                backgroundColor="rgba(255,145,0,0.1)"
                borderRadius="$3"
              >
                <Camera size={20} color="$primary" />
              </YStack>
              <Text
                fontSize="$4"
                fontWeight="600"
                fontFamily="$body"
                color="$color"
              >
                Camera
              </Text>
            </XStack>
            <Separator />
            <XStack
              py="$4"
              gap="$3"
              alignItems="center"
              onPress={() => {
                setPickerOpen(false);
                onUpload(config.id, "gallery");
              }}
            >
              <YStack
                p="$2"
                backgroundColor="rgba(255,145,0,0.1)"
                borderRadius="$3"
              >
                <ImageIcon size={20} color="$primary" />
              </YStack>
              <Text
                fontSize="$4"
                fontWeight="600"
                fontFamily="$body"
                color="$color"
              >
                Photo Gallery
              </Text>
            </XStack>
            {!config.isProfilePhoto && (
              <>
                <Separator />
                <XStack
                  py="$4"
                  gap="$3"
                  alignItems="center"
                  onPress={() => {
                    setPickerOpen(false);
                    onUpload(config.id, "document");
                  }}
                >
                  <YStack
                    p="$2"
                    backgroundColor="rgba(255,145,0,0.1)"
                    borderRadius="$3"
                  >
                    <FileIcon size={20} color="$primary" />
                  </YStack>
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Document (PDF)
                  </Text>
                </XStack>
              </>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {status === "uploading" && !uploading && (
        <XStack gap="$2" paddingLeft="$11" marginTop="$1">
          <Button
            size="$2"
            variant="primary"
            icon={<Upload size={14} />}
            onPress={() => onSubmitDoc(config.id)}
          >
            Submit
          </Button>
          <Button
            size="$2"
            variant="outline"
            onPress={() => onRemove(config.id)}
          >
            Cancel
          </Button>
        </XStack>
      )}

      {/* ID Type bottom sheet */}
      <Sheet
        modal
        open={idTypeSheetOpen}
        onOpenChange={setIdTypeSheetOpen}
        snapPoints={[40]}
        dismissOnSnapToBottom
        zIndex={200_000}
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
          <YStack px="$5" pt="$3" pb="$2">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading">
              Select ID Type
            </Text>
          </YStack>
          <YStack px="$5" pb="$6" gap="$1">
            {ID_TYPES.map((t, i) => (
              <YStack key={t.value}>
                <XStack
                  py="$4"
                  justifyContent="space-between"
                  alignItems="center"
                  onPress={() => {
                    onIdTypeChange?.(t.value);
                    setIdTypeSheetOpen(false);
                  }}
                >
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    fontWeight="600"
                    color="$color"
                  >
                    {t.label}
                  </Text>
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
