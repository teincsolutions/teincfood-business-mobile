// @ts-nocheck
import { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Button, Separator, Progress } from 'tamagui';
import { FileText, Upload, Check, Clock, AlertCircle, Camera, Image } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Documents Management Screen
 */
export default function Documents() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Mock document data
  const [documents, setDocuments] = useState([
    {
      id: '1',
      name: 'National ID / Passport',
      description: 'Government-issued identification',
      status: 'verified',
      uploadedAt: '2026-03-15',
      required: true,
    },
    {
      id: '2',
      name: "Driver's License",
      description: 'Valid driving license',
      status: 'verified',
      uploadedAt: '2026-03-15',
      required: true,
    },
    {
      id: '3',
      name: 'Vehicle Insurance',
      description: 'Current vehicle insurance certificate',
      status: 'pending',
      uploadedAt: '2026-03-28',
      required: true,
    },
    {
      id: '4',
      name: 'Vehicle Registration',
      description: 'Vehicle registration certificate',
      status: 'rejected',
      uploadedAt: '2026-03-20',
      required: true,
      rejectionReason: 'Document is not clear. Please upload a clearer image.',
    },
    {
      id: '5',
      name: 'Profile Photo',
      description: 'Clear photo of your face',
      status: 'verified',
      uploadedAt: '2026-03-15',
      required: true,
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <Check size={16} color="#27ae60" />;
      case 'pending': return <Clock size={16} color="#f39c12" />;
      case 'rejected': return <AlertCircle size={16} color="#e74c3c" />;
      default: return null;
    }
  };

  const handleUpload = (docId) => {
    setUploadingDoc(docId);
    // Simulate upload
    setTimeout(() => {
      setDocuments(docs =>
        docs.map(doc =>
          doc.id === docId
            ? { ...doc, status: 'pending', uploadedAt: new Date().toISOString().split('T')[0] }
            : doc
        )
      );
      setUploadingDoc(null);
    }, 2000);
  };

  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const totalCount = documents.length;
  const progress = (verifiedCount / totalCount) * 100;

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text fontSize="$4" color="$primary">← Back</Text>
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Documents
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Progress Card */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">Verification Progress</Text>
                <Text fontSize="$5" fontWeight="800" color="$primary">
                  {verifiedCount}/{totalCount}
                </Text>
              </XStack>
              <Progress value={progress} backgroundColor="$gray5">
                <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
              </Progress>
              <Text fontSize="$3" color="$colorMuted">
                {verifiedCount === totalCount
                  ? 'All documents verified! ✓'
                  : `${totalCount - verifiedCount} document(s) pending verification`}
              </Text>
            </YStack>
          </Card>

          {/* Documents List */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Your Documents</Text>
              <Separator />
              {documents.map((doc, index) => (
                <YStack key={doc.id}>
                  <YStack gap="$2" paddingVertical="$2">
                    <XStack justifyContent="space-between" alignItems="center">
                      <XStack gap="$3" alignItems="center" flex={1}>
                        <YStack
                          width={40}
                          height={40}
                          borderRadius="$4"
                          backgroundColor="$gray3"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <FileText size={20} color="$colorMuted" />
                        </YStack>
                        <YStack flex={1}>
                          <XStack gap="$2" alignItems="center">
                            <Text fontWeight="bold">{doc.name}</Text>
                            {doc.required && (
                              <Text fontSize="$2" color="$red10">*</Text>
                            )}
                          </XStack>
                          <Text fontSize="$2" color="$colorMuted">{doc.description}</Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$2" alignItems="center">
                        {getStatusIcon(doc.status)}
                        <YStack
                          backgroundColor={getStatusColor(doc.status)}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Text color="white" fontSize="$1" textTransform="capitalize">
                            {doc.status}
                          </Text>
                        </YStack>
                      </XStack>
                    </XStack>

                    {doc.uploadedAt && (
                      <Text fontSize="$2" color="$colorMuted" paddingLeft="$12">
                        Uploaded: {doc.uploadedAt}
                      </Text>
                    )}

                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <YStack
                        backgroundColor="$red2"
                        padding="$2"
                        borderRadius="$2"
                        marginLeft="$12"
                      >
                        <Text fontSize="$2" color="$red10">
                          Reason: {doc.rejectionReason}
                        </Text>
                      </YStack>
                    )}

                    {(doc.status === 'rejected' || !doc.uploadedAt) && (
                      <XStack gap="$2" paddingLeft="$12" marginTop="$1">
                        <Button
                          size="$2"
                          variant="outline"
                          icon={<Camera size={14} />}
                          onPress={() => handleUpload(doc.id)}
                          disabled={uploadingDoc === doc.id}
                        >
                          {uploadingDoc === doc.id ? 'Uploading...' : 'Camera'}
                        </Button>
                        <Button
                          size="$2"
                          variant="outline"
                          icon={<Image size={14} />}
                          onPress={() => handleUpload(doc.id)}
                          disabled={uploadingDoc === doc.id}
                        >
                          Gallery
                        </Button>
                      </XStack>
                    )}
                  </YStack>
                  {index < documents.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Tips */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">📋 Document Tips</Text>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$3">
                  • Ensure all documents are clear and readable
                </Text>
                <Text fontSize="$3">
                  • Documents should not be expired
                </Text>
                <Text fontSize="$3">
                  • Photos should show all four corners of the document
                </Text>
                <Text fontSize="$3">
                  • Verification typically takes 24-48 hours
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Help */}
          <Button variant="outline" onPress={() => router.push('/(shared)/profile/help')}>
            Need Help with Documents?
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}