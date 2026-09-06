// @ts-nocheck
import { Linking } from "react-native";
import { YStack, XStack, Text, Sheet, Separator, Card, useMedia } from "tamagui";
import {
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
  X,
} from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import type { FleetKycDocument } from "@teincfood/core";

interface RiderKycSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: FleetKycDocument[];
  kycStatus: string;
}

export function RiderKycSheet({
  open,
  onOpenChange,
  documents,
  kycStatus,
}: RiderKycSheetProps) {
  const media = useMedia();
  const statusColor =
    kycStatus === "approved"
      ? "$green10"
      : kycStatus === "rejected"
        ? "$red10"
        : "$yellow10";

  const statusBg =
    kycStatus === "approved"
      ? "$green2"
      : kycStatus === "rejected"
        ? "$red2"
        : "$yellow2";

  const handleView = async (signedUrl?: string | null) => {
    if (!signedUrl) return;
    try {
      await Linking.openURL(signedUrl);
    } catch {
      // silently fail if no browser available
    }
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85]}
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
        {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

        <YStack padding="$6" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="bold">
              KYC Documents
            </Text>
            <Button
              variant="ghost"
              icon={<X size={20} />}
              onPress={() => onOpenChange(false)}
            />
          </XStack>

          <XStack gap="$2" alignItems="center">
            <ShieldCheck size={18} color={statusColor} />
            <Text fontSize="$4" color="$colorMuted">
              Status:{" "}
            </Text>
            <YStack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$3"
              backgroundColor={statusBg}
            >
              <Text
                fontSize="$3"
                fontWeight="600"
                color={statusColor}
                textTransform="capitalize"
              >
                {kycStatus}
              </Text>
            </YStack>
          </XStack>

          <Separator />

          {documents.length === 0 && (
            <YStack alignItems="center" gap="$3" paddingVertical="$6">
              <FileText size={40} color="$colorMuted" />
              <Text fontSize="$4" color="$colorMuted">
                No documents submitted yet
              </Text>
            </YStack>
          )}

          {documents.map((doc, index) => (
            <Card key={doc.type || index} padding="$4" bordered>
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold" fontSize="$4">
                    {doc.name || doc.type}
                  </Text>
                  {doc.expired && (
                    <XStack gap="$1" alignItems="center">
                      <AlertCircle size={14} color="$red10" />
                      <Text fontSize="$2" color="$red10" fontWeight="600">
                        Expired
                      </Text>
                    </XStack>
                  )}
                </XStack>

                {doc.issued_date && (
                  <Text fontSize="$3" color="$colorMuted">
                    Issued: {new Date(doc.issued_date).toLocaleDateString()}
                  </Text>
                )}
                {doc.expiration_date && (
                  <Text fontSize="$3" color="$colorMuted">
                    Expires: {new Date(doc.expiration_date).toLocaleDateString()}
                  </Text>
                )}

                <Button
                  variant="outline"
                  icon={<ExternalLink size={16} />}
                  onPress={() => handleView(doc.signed_url)}
                  disabled={!doc.signed_url}
                >
                  View Document
                </Button>
              </YStack>
            </Card>
          ))}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
