// @ts-nocheck
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyChatRoute() {
  const { userId, orderId, name, phone } = useLocalSearchParams();
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const normalizedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const normalizedName = Array.isArray(name) ? name[0] : name;
  const normalizedPhone = Array.isArray(phone) ? phone[0] : phone;

  if (normalizedUserId === 'support') {
    return <Redirect href="/(communication)/chat/support" />;
  }

  if (normalizedUserId && normalizedOrderId) {
    const query =
      `userId=${encodeURIComponent(normalizedUserId)}` +
      `&orderId=${encodeURIComponent(normalizedOrderId)}` +
      `&name=${encodeURIComponent(normalizedName || '')}` +
      `&phone=${encodeURIComponent(normalizedPhone || '')}`;
    return <Redirect href={`/(communication)/chat/order?${query}`} />;
  }

  return <Redirect href="/(communication)/chat/support" />;
}
