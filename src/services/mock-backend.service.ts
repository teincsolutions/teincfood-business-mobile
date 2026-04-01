import { MOCK_FOODS } from '@/mocks/foods.mock';
import { MOCK_ORDERS, MOCK_TRACKING_UPDATES } from '@/mocks/orders.mock';
import { MOCK_USERS } from '@/mocks/users.mock';
import type { Address, PaymentMethod } from '@/models/user.model';
import type {
  AuthSessionResponse,
  BootstrapResponse,
  LiveActivityRegistrationRequest,
  LoginRequest,
  PushTokenRegistrationRequest,
  SetLocationRequest,
  SignupRequest,
} from './backend-contracts.types';
import type { PromoValidationRequest, PromoValidationResponse } from './promo.service';
import { useAuthStore } from '@/stores/auth.store';
import { useAddressStore } from '@/stores/address.store';
import { useNotificationStore, type AppNotification } from '@/stores/notification.store';
import { useOrdersStore } from '@/stores/orders.store';
import { usePaymentStore } from '@/stores/payment.store';
import { useLocationStore } from '@/stores/location.store';
import type { Order } from '@/models/order.model';

const MIN_DELAY_MS = 180;
const MAX_DELAY_MS = 520;
const registeredPushTokens = new Map<string, PushTokenRegistrationRequest>();
const liveActivityTokens = new Map<string, LiveActivityRegistrationRequest>();

function withDelay<T>(value: T): Promise<T> {
  const jitter = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
  return new Promise((resolve) => setTimeout(() => resolve(value), MIN_DELAY_MS + jitter));
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function sellerUsers() {
  return MOCK_USERS.filter((u) => u.role === 'seller');
}

function sessionSnapshot() {
  const { user, accessToken } = useAuthStore.getState();
  return {
    isAuthenticated: Boolean(user && accessToken),
    userId: user?.id || null,
    accessToken: accessToken || null,
  };
}

function requireSession() {
  const session = sessionSnapshot();
  if (!session.isAuthenticated) {
    const error = new Error('Authentication required');
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}

function requireLocationContext() {
  const hasLocation = useLocationStore.getState().hasLocation();
  if (!hasLocation) {
    const error = new Error('Location is required');
    (error as Error & { status?: number }).status = 428;
    throw error;
  }
}

export const mockBackend = {
  async getBootstrap(): Promise<BootstrapResponse> {
    const location = useLocationStore.getState().currentLocation;
    const { user } = useAuthStore.getState();
    const countryCode = location?.countryCode || 'US';
    const currencyCode = countryCode === 'GH' ? 'GHS' : 'USD';
    const timezone = countryCode === 'GH' ? 'Africa/Accra' : 'UTC';

    return withDelay({
      user: user
        ? {
            id: user.id,
            username: user.username || user.email.split('@')[0],
            email: user.email,
          }
        : null,
      region: {
        countryCode,
        currencyCode,
        timezone,
      },
      features: {
        liveActivitiesIOS: true,
        androidLiveNotifications: true,
        sseNotifications: true,
      },
    });
  },

  async signupWithEmailPassword(payload: SignupRequest): Promise<AuthSessionResponse> {
    const userId = `usr_${Date.now()}`;
    return withDelay({
      accessToken: `mock_access_${userId}`,
      refreshToken: `mock_refresh_${userId}`,
      user: {
        id: userId,
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        fullName: payload.fullName,
      },
    });
  },

  async loginWithEmailPassword(payload: LoginRequest): Promise<AuthSessionResponse> {
    const userId = `usr_${Date.now()}`;
    return withDelay({
      accessToken: `mock_access_${userId}`,
      refreshToken: `mock_refresh_${userId}`,
      user: {
        id: userId,
        username: payload.email.split('@')[0],
        email: payload.email,
        phone: '+233000000000',
        fullName: 'Teinc User',
      },
    });
  },

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      const error = new Error('Refresh token required');
      (error as Error & { status?: number }).status = 401;
      throw error;
    }
    return withDelay({
      accessToken: `mock_access_rotated_${Date.now()}`,
      refreshToken: `mock_refresh_rotated_${Date.now()}`,
    });
  },

  async logoutSession() {
    return withDelay({ success: true });
  },

  async setUserLocation(payload: SetLocationRequest) {
    useLocationStore.getState().setCurrentLocation({
      latitude: payload.latitude,
      longitude: payload.longitude,
      city: payload.city,
      area: payload.area,
      fullAddress: `${payload.area}, ${payload.city}`,
      countryCode: payload.countryCode,
    });
    return withDelay({
      success: true,
      countryCode: payload.countryCode,
    });
  },

  async registerPushToken(payload: PushTokenRegistrationRequest) {
    requireSession();
    const tokenId = `pt_${Date.now()}`;
    registeredPushTokens.set(tokenId, payload);
    return withDelay({ tokenId, success: true });
  },

  async unregisterPushToken(tokenId: string) {
    requireSession();
    registeredPushTokens.delete(tokenId);
    return withDelay({ success: true });
  },

  // We keep APNs/FCM delivery itself out of mock scope; only registration contracts are mocked.
  async registerIOSLiveActivity(orderId: string, payload: LiveActivityRegistrationRequest) {
    requireSession();
    liveActivityTokens.set(`${orderId}:${payload.activityId}`, payload);
    return withDelay({ success: true });
  },

  async unregisterIOSLiveActivity(orderId: string, activityId: string) {
    requireSession();
    liveActivityTokens.delete(`${orderId}:${activityId}`);
    return withDelay({ success: true });
  },

  async getHomeFeed(category: string) {
    requireLocationContext();
    const selectedCategory = normalize(category || 'all');
    const foods = MOCK_FOODS.filter((food) => {
      if (selectedCategory === 'all') return true;
      return normalize(food.category) === selectedCategory || normalize(food.name).includes(selectedCategory);
    });

    const restaurants = sellerUsers();

    return withDelay({
      session: sessionSnapshot(),
      foods,
      restaurants,
    });
  },

  async getFoodById(foodId: string) {
    const food = MOCK_FOODS.find((f) => f.id === foodId) || MOCK_FOODS[0];
    return withDelay(food);
  },

  async getResults(type: string) {
    requireLocationContext();
    const resultType = normalize(type || 'foods');
    if (resultType === 'restaurants') {
      return withDelay({
        foods: [],
        restaurants: sellerUsers(),
      });
    }

    return withDelay({
      foods: MOCK_FOODS,
      restaurants: [],
    });
  },

  async searchCatalog(rawQuery: string) {
    requireLocationContext();
    const q = normalize(rawQuery);
    if (!q) {
      return withDelay({ foods: [], restaurants: [] });
    }

    const foods = MOCK_FOODS.filter((f) => {
      const ingredients = f.ingredients?.join(' ').toLowerCase() || '';
      return (
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        ingredients.includes(q)
      );
    });

    const restaurants = sellerUsers().filter(
      (u) => u.fullName.toLowerCase().includes(q) || (u.bio || '').toLowerCase().includes(q)
    );

    return withDelay({ foods, restaurants });
  },

  async getSavedCatalog(savedFoodIds: string[], savedRestaurantIds: string[]) {
    requireSession();
    requireLocationContext();
    const foods = MOCK_FOODS.filter((f) => savedFoodIds.includes(f.id));
    const restaurants = sellerUsers().filter((u) => savedRestaurantIds.includes(u.id));
    return withDelay({ foods, restaurants });
  },

  async getRestaurantStorefront(restaurantId: string, rawQuery?: string) {
    requireLocationContext();
    const seller = sellerUsers().find((u) => u.id === restaurantId) || sellerUsers()[0] || null;
    if (!seller) {
      return withDelay({ seller: null, menuItems: [] });
    }

    const q = normalize(rawQuery || '');
    const baseMenu = MOCK_FOODS.filter((f) => f.chefId === seller.id);
    const menuItems = !q
      ? baseMenu
      : baseMenu.filter((food) => {
          const ingredients = food.ingredients?.join(' ').toLowerCase() || '';
          return (
            food.name.toLowerCase().includes(q) ||
            food.category.toLowerCase().includes(q) ||
            food.description.toLowerCase().includes(q) ||
            ingredients.includes(q)
          );
        });

    return withDelay({
      seller,
      menuItems,
    });
  },

  async getInboxConversations() {
    requireSession();
    const { user } = useAuthStore.getState();
    const userRole = user?.role || 'seller';

    // Get both sellers and riders for conversations
    const sellers = sellerUsers();
    const riders = MOCK_USERS.filter((u) => u.role === 'rider');
    
    // Combine users based on who the current user might have chatted with
    // Buyers chat with sellers and riders; sellers chat with riders; riders chat with sellers
    let potentialContacts;
    if (userRole === 'seller') {
      // Sellers primarily chat with riders for delivery coordination
      potentialContacts = [...riders.slice(0, 4), ...sellers.filter(u => u.id !== user?.id).slice(0, 2)];
    } else {
      // Riders primarily chat with sellers for pickup coordination
      potentialContacts = [...sellers.slice(0, 4), ...riders.filter(u => u.id !== user?.id).slice(0, 2)];
    }

    const conversations = potentialContacts.slice(0, 6).map((contact, i) => ({
      id: contact.id,
      name: contact.fullName,
      avatar: contact.avatarUrl,
      lastMessage: i === 0 
        ? 'Your order is being prepared!' 
        : i === 1 
          ? 'The rider is on the way to pickup your order.'
          : 'Hello! How can I help you today?',
      time: i === 0 ? '2m' : i === 1 ? '15m' : `${i + 1}h`,
      unreadCount: i < 2 ? i + 1 : 0,
      role: contact.role,
    }));

    return withDelay(conversations);
  },

  async getChatParticipant(userId: string) {
    requireSession();
    // Search for user in all mock users (sellers, riders, etc.)
    const user = MOCK_USERS.find((u) => u.id === userId) || sellerUsers()[0] || null;
    return withDelay(user);
  },

  async getTrackOrder(orderId: string, runtimeOrders?: Order[]) {
    requireSession();
    const activeOrders = runtimeOrders || useOrdersStore.getState().orders;
    const liveOrder = activeOrders.find((o) => o.id === orderId);
    const order = liveOrder || MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];

    return withDelay({
      order,
      trackingUpdates: MOCK_TRACKING_UPDATES,
    });
  },

  async getOrders() {
    requireSession();
    return withDelay(useOrdersStore.getState().orders);
  },

  async createOrder(order: Order) {
    requireSession();
    useOrdersStore.getState().addOrder(order);
    return withDelay(order);
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    requireSession();
    useOrdersStore.getState().updateOrderStatus(orderId, status);
    const updated = useOrdersStore.getState().orders.find((o) => o.id === orderId) || null;
    return withDelay(updated);
  },

  async removeOrder(orderId: string) {
    requireSession();
    useOrdersStore.getState().removeOrder(orderId);
    return withDelay({ success: true });
  },

  async getAddresses() {
    requireSession();
    return withDelay(useAddressStore.getState().addresses);
  },

  async createAddress(address: Address) {
    requireSession();
    useAddressStore.getState().addAddress(address);
    return withDelay(address);
  },

  async updateAddress(id: string, updates: Partial<Address>) {
    requireSession();
    useAddressStore.getState().updateAddress(id, updates);
    const updated = useAddressStore.getState().addresses.find((a) => a.id === id) || null;
    return withDelay(updated);
  },

  async removeAddress(id: string) {
    requireSession();
    useAddressStore.getState().removeAddress(id);
    return withDelay({ success: true });
  },

  async setDefaultAddress(id: string) {
    requireSession();
    useAddressStore.getState().setDefaultAddress(id);
    const updated = useAddressStore.getState().addresses.find((a) => a.id === id) || null;
    return withDelay(updated);
  },

  async getPaymentMethods() {
    requireSession();
    return withDelay(usePaymentStore.getState().paymentMethods);
  },

  async createPaymentMethod(paymentMethod: PaymentMethod) {
    requireSession();
    usePaymentStore.getState().addPaymentMethod(paymentMethod);
    return withDelay(paymentMethod);
  },

  async removePaymentMethod(id: string) {
    requireSession();
    usePaymentStore.getState().removePaymentMethod(id);
    return withDelay({ success: true });
  },

  async setDefaultPaymentMethod(id: string) {
    requireSession();
    usePaymentStore.getState().setDefaultPaymentMethod(id);
    const updated = usePaymentStore.getState().paymentMethods.find((pm) => pm.id === id) || null;
    return withDelay(updated);
  },

  async getNotifications() {
    requireSession();
    return withDelay(useNotificationStore.getState().notifications);
  },

  async addNotification(notification: AppNotification) {
    requireSession();
    useNotificationStore.getState().addNotification(notification);
    return withDelay(notification);
  },

  async markNotificationAsRead(id: string) {
    requireSession();
    useNotificationStore.getState().markAsRead(id);
    return withDelay({ success: true });
  },

  async markAllNotificationsAsRead() {
    requireSession();
    useNotificationStore.getState().markAllAsRead();
    return withDelay({ success: true });
  },

  async removeNotification(id: string) {
    requireSession();
    useNotificationStore.getState().removeNotification(id);
    return withDelay({ success: true });
  },

  async clearNotifications() {
    requireSession();
    useNotificationStore.getState().clearAll();
    return withDelay({ success: true });
  },

  async validatePromoCode(request: PromoValidationRequest): Promise<PromoValidationResponse> {
    const { code, subtotal } = request;
    const normalizedCode = code.trim().toUpperCase();

    // Mock promo codes
    const promoCodes: Record<string, { discountType: 'percentage' | 'fixed'; discountValue: number; message: string }> = {
      'TEINC20': { discountType: 'percentage', discountValue: 20, message: '20% off your order!' },
      'SAVE10': { discountType: 'percentage', discountValue: 10, message: '10% off your order!' },
      'FLAT5': { discountType: 'fixed', discountValue: 5, message: '$5 off your order!' },
      'WELCOME': { discountType: 'percentage', discountValue: 15, message: '15% off for new users!' },
    };

    const promo = promoCodes[normalizedCode];

    if (!promo) {
      return withDelay({
        valid: false,
        discount: 0,
        discountType: 'percentage',
        discountValue: 0,
        message: 'Invalid or expired promo code',
      });
    }

    const discount = promo.discountType === 'percentage' 
      ? subtotal * (promo.discountValue / 100)
      : promo.discountValue;

    return withDelay({
      valid: true,
      discount: Math.min(discount, subtotal),
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      message: promo.message,
    });
  },
};
