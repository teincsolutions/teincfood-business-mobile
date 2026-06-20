# TeincFoodBusiness — Backend Integration & Buyer App Porting Plan

## Overview

Port real implementations from the buyer app (`../TeincFood`) into the business app, replacing all mock data with real backend integration. The backend (`../TeincFoodBackend`) is an Elixir/Phoenix API with WebSocket support via Phoenix Channels v2.

**Key principles:**
1. No UI changes unless alignment required by data shape differences
2. No service-level code in UI — only hooks call services
3. All mock data/code removed entirely
4. Role-specific screens are isolated per route group; shared code lives in `src/`
5. No manual styling — use Tamagui components only (Button, Input, YStack, XStack, etc.)
6. Use `yarn` for all installations (never npm)

**Account upgrade flow (critical):**
- All users register as `buyer` role by default. Role selection at registration is intent only.
- On **login**, user picks a role from a **role selector screen** (seller, rider, fleet_manager).
- The system then detects if the prerequisite for that role is incomplete:
  - **Seller/Fleet Manager**: no business exists → show "create business" screen
  - **Rider**: no rider profile exists → show "create rider profile" screen
- Once the user completes the prerequisite, their role upgrades and they enter the correct role group.
- If the prerequisite is already met, they go directly to the role's screens.
- **KYC is optional** — show/prompt during profile creation but let the user skip and complete later.

**Implementation order:** Foundation → Rider → Seller → Fleet Manager → Communication → Shared Screens → Cleanup

---

## Dependencies & Configuration

### Packages to install (from buyer app's package.json)

These packages exist in `../TeincFood/package.json` but not in this project. Install with `yarn add`:

| Package | Purpose | Source |
|---|---|---|
| `@gorhom/bottom-sheet` | Bottom sheet modals (cart, filters, etc.) | UI component |
| `@mapbox/polyline` | Decode Google Maps polyline coordinates | Route tracking |
| `@react-native-firebase/app` | Firebase core for push notifications | Push notifications |
| `@react-native-firebase/messaging` | FCM for push notifications | Push notifications |
| `@react-native-google-signin/google-signin` | Google OAuth native sign-in | Auth |
| `expo-crypto` | Crypto operations (UUID, random bytes) | Various utilities |
| `expo-web-browser` | Web browser for OAuth flows | Auth/OIDC |
| `geolib` | Geo distance/speed calculations | Rider tracking |
| `react-native-confirmation-code-field` | OTP code input UI | Auth verification |
| `sonner-native` | Toast notification component | UI feedback |

### app.json plugins to add

From `../TeincFood/app.config.js`, the business app's `app.json` needs these plugins added:

```js
plugins: [
  // ... existing plugins ...
  "@react-native-firebase/app",
  "@react-native-firebase/messaging",
  [
    "react-native-maps",
    {
      iosGoogleMapsApiKey: "AIzaSyAynV0Kj00Mp3JkTH9ro5qk7jBW-dkDxeI",
      androidGoogleMapsApiKey: "AIzaSyBxq-rNf_MsiWif5znkJ3jSmNpe_AYM_Jw",
    },
  ],
  "expo-web-browser",
  "@react-native-community/datetimepicker", // already present
]
```

### app.json extra config to add

```js
extra: {
  // ... existing extra ...
  paystackCurrency: "GHS",
  paystackPublicKey: "pk_live_898f9b046dea9d60c7cfea7d3768b1ae0a175737",
}
```

### .env file to create

Copy from `../TeincFood/.env` and adapt:
- `EXPO_PUBLIC_API_URL` — backend API base URL
- `EXPO_PUBLIC_WS_URL` — WebSocket URL
- `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` — Paystack key
- `EXPO_PUBLIC_PAYSTACK_CURRENCY` — GHS
- Google OAuth client IDs
- Firebase config file paths

### constants.ts to update

Add `WS_BASE_URL` and `CHAT_CONFIG` from buyer app's `../TeincFood/src/utils/constants.ts`.

---

## Phase 0: Foundation — Shared Infrastructure

### 0.1 Install missing dependencies

Run `yarn add` for all packages listed above.

### 0.2 Update app.json

Add missing plugins and extra config (maps, firebase, web-browser, paystack keys).

### 0.3 Create .env file

With API URL, WS URL, Paystack keys, Google OAuth IDs.

### 0.4 Update constants.ts

Add `WS_BASE_URL`, `CHAT_STORAGE_KEYS`, `CHAT_CONFIG`.

### 0.5 Port Phoenix WebSocket infrastructure

Copy & adapt these files from `../TeincFood/src/services/`:

| File | Business App Target | Notes |
|---|---|---|
| `phoenix-socket.service.ts` | `src/services/phoenix-socket.service.ts` | Core Phoenix v2 socket |
| `events.service.ts` | `src/services/events.service.ts` | Reference-counted events channel |
| `chat.service.ts` | `src/services/chat.service.ts` | Chat channel management |
| `order-events.service.ts` | `src/services/order-events.service.ts` | Order event subscriptions |
| `auth-cleanup.service.ts` | `src/services/auth-cleanup.service.ts` | Cleanup WS on logout |

### 0.6 Rewrite shared services (replace mock with real API)

Each service uses the `api` object from `src/services/api.ts` (already exists, properly configured with JWT interceptor):

| Service File | Rewrite Action | Backend Endpoints |
|---|---|---|
| `auth.service.ts` | Replace `mockBackend` calls with real HTTP | `POST /api/v1/auth/{register,login,otp/send,otp/verify,refresh,oidc,forgot-password,reset-password}` |
| `notifications.service.ts` | Replace `subscribeNotificationStream` + `mockBackend` | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, etc. |
| `payment.service.ts` | Replace mock calls | `GET /api/v1/payments/methods`, `POST /api/v1/payments/initiate`, etc. |
| `promo.service.ts` | Replace mock call | `POST /api/v1/promo/validate` |
| `bootstrap.service.ts` | Replace mock call | `GET /api/v1/bootstrap` (check backend) |
| `devices.service.ts` | Replace mock calls | `POST /api/v1/devices/push-token`, `DELETE /api/v1/devices/push-token/:id` |
| `location.service.ts` | Replace mock call | `POST /api/v1/location` |
| `live-activities.service.ts` | Replace mock calls | `POST /api/v1/orders/:order_id/live-activity/ios` |
| `messages.service.ts` | Replace `mockChatSocket` + `mockBackend` | `GET /api/v1/conversations`, `GET /api/v1/conversations/:id/messages` |

### 0.7 Create new shared services (port from buyer app)

| Service File | Buyer App Source | Purpose |
|---|---|---|
| `src/services/profile.service.ts` | `profile.service.ts` | User profile CRUD |
| `src/services/address.service.ts` | `address.service.ts` | Address CRUD |
| `src/services/places.service.ts` | `places.service.ts` | Google Places autocomplete |
| `src/services/directions.service.ts` | `directions.service.ts` | Google Maps directions |
| `src/services/notification-preferences.service.ts` | `notification-preferences.service.ts` | Notification preferences |

### 0.8 Port shared hooks from buyer app

| Hook File | Buyer App Source | Purpose |
|---|---|---|
| `src/hooks/useAuth.ts` | `useAuth.ts` | Login/signup/logout/OTP |
| `src/hooks/useAuthVerification.ts` | `useAuthVerification.ts` | OTP verify/resend mutations |
| `src/hooks/useProfile.ts` | `useProfile.ts` | Profile CRUD + password change |
| `src/hooks/useAddresses.ts` | `useAddresses.ts` | Address CRUD |
| `src/hooks/usePushTokenRegistration.ts` | `usePushTokenRegistration.ts` | Push token lifecycle |
| `src/hooks/useEventsConnection.ts` | `useEventsConnection.ts` | WS lifecycle tied to auth |
| `src/hooks/usePayment.ts` | `usePayment.ts` | Payment methods CRUD |
| `src/hooks/usePasswordRecovery.ts` | `usePasswordRecovery.ts` | Forgot/reset password |
| `src/hooks/usePlacesSearch.ts` | `usePlacesSearch.ts` | Google Places search |
| `src/hooks/useCurrentLocation.ts` | `useCurrentLocation.ts` | GPS location |
| `src/hooks/useChat.ts` | `useChat.ts` | Chat via WebSocket |
| `src/hooks/useMessages.ts` | `useMessages.ts` | Messages queries |
| `src/hooks/useNotifications.ts` | `useNotifications.ts` | Notifications query + stream |

### 0.9 Delete mock infrastructure

After confirming real services work:

```
rm -rf src/mocks/
rm src/services/mock-backend.service.ts
rm src/services/mock-data.service.ts
rm src/services/realtime-mock.service.ts
```

### 0.10 Remove direct mock imports from screens

| File | Replace |
|---|---|
| `app/(seller)/(drawer)/orders/index.tsx` | Remove `MOCK_SELLER_ORDERS` import; already use `useSellerOrdersQuery()` |
| `app/(seller)/orders/[id].tsx` | Remove `SellerOrder` type import from mock |
| `app/(seller)/(drawer)/dashboard/kiosk.tsx` | Remove `KioskOrder` type import from mock |
| `app/(rider)/map/index.tsx` | Remove inline `mockDeliveries`; use `useActiveDeliveryQuery()` |
| `src/components/kiosk/*.tsx` | Replace `KioskOrder` imports from mock-data.service → `@/models/kiosk.model` |
| `src/hooks/kiosk.hooks.ts` | Replace `mock-data.service` type imports |
| `src/hooks/seller.hooks.ts` | Replace `mock-data.service` type imports |
| `src/hooks/seller-dashboard.hooks.ts` | Replace `mock-data.service` type imports |

### 0.11 Migrate types from mock-data.service to models

| Type to Create | Source | Used By |
|---|---|---|
| `src/models/kiosk.model.ts` — `KioskOrder` | Extract from `mock-data.service.ts` | kiosk components, hooks |
| `src/models/seller.model.ts` — `SellerOrder` | Extract from `mock-data.service.ts` | seller components, hooks |

### 0.12 Connect auth flow to real endpoints

- `app/(auth)/signup.tsx` — Registration creates buyer account.
- `app/(auth)/role.tsx` — **Role selector screen** (shown after login). User picks which role session they want to use for this session.
- `app/(auth)/login.tsx` — Connect OTP/email login to `authService`. After login, redirect to role selector.
- `app/(auth)/verification.tsx` — Connect OTP verify to `authService.verifyOtp()`
- `app/(auth)/forgot-password.tsx` — Connect to `authService.forgotPassword()`

### 0.13 Build role-completion gateway (on login, after role selection)

On login, user picks a role → detect incomplete prerequisite → show completion screen → upgrade role:

| Role Selected | Prerequisite Check | Completion Screen |
|---|---|---|
| `seller` | Does user have a business? (`GET /api/v1/businesses/me`) | "Create a business" form |
| `fleet_manager` | Does user have a delivery business? (`GET /api/v1/businesses/me`) | "Create a business" form |
| `rider` | Does user have a rider profile? (`GET /api/v1/riders/profile`) | "Create rider profile" form |

**Implementation:**
1. `app/(auth)/role.tsx` — User taps a role → check if prerequisite is met:
   - If met → route directly to that role's splash/home
   - If not met → route to prerequisite completion screen
2. Create shared completion screens:
   - "Create Business" screen (for seller/fleet_manager — fields: name, type, address, etc.)
   - "Create Rider Profile" screen (for rider — fields: vehicle info, phone, license, etc.)
   - Both screens should show KYC prompt (skippable)
3. After successful creation, the backend upgrades the user's role from `buyer` to the target role
4. The auth store picks up the new role → `Stack.Protected` guards in `app/_layout.tsx` route to correct role group
5. If user logs out and logs back in, the role selector and prerequisite check happen again

---

## Phase 1: Rider Role Implementation

### 1.1 Rewrite rider.service.ts

Replace all mock functions with real API calls:

| Current Mock Export | Backend Endpoint |
|---|---|
| `getRiderMetrics()` | `GET /api/v1/riders/profile` (includes stats) |
| `getActiveDelivery()` | `GET /api/v1/riders/deliveries?status=active` |
| `getDeliveries()` | `GET /api/v1/riders/deliveries` |
| `getDeliveryDetail()` | `GET /api/v1/deliveries/:id` |
| `updateDeliveryStatus()` | `POST /api/v1/deliveries/:id/{in-transit,arrived,delivered,failed}` |
| `acceptDelivery()` | `POST /api/v1/deliveries/claim` |
| `getEarnings()` | `GET /api/v1/riders/earnings` |
| `getTransactions()` | `GET /api/v1/wallet/history` |
| `requestPayout()` | `POST /api/v1/payments/payout` |
| `getVehicleInfo()` | `GET /api/v1/riders/vehicle` |
| `updateVehicleInfo()` | `POST /api/v1/riders/vehicles` |
| `getDeliveryZones()` | `GET /api/v1/businesses/:id/delivery-zones` |
| `updateOnlineStatus()` | `PATCH /api/v1/riders/profile` (patch `is_online`) |

### 1.2 Rider hooks — No changes needed

`src/hooks/rider.hooks.ts` already has all the right query/mutation hooks — they call `riderService`. Only the service implementation changes.

### 1.3 Verify rider screens

- `app/(rider)/(drawer)/home/index.tsx` — Verify uses `useActiveDeliveryQuery()`
- `app/(rider)/(drawer)/deliveries/index.tsx` — Verify uses `useRiderDeliveriesQuery()`
- `app/(rider)/(drawer)/earnings/index.tsx` — Verify uses `useRiderEarningsQuery()`
- `app/(rider)/deliveries/[id].tsx` — Verify status transitions use mutations
- `app/(rider)/map/index.tsx` — Remove inline `mockDeliveries`, use `useActiveDeliveryQuery()`
- `app/(rider)/settings/vehicle-info.tsx` — Connect to `useVehicleInfoQuery()`
- `app/(rider)/settings/delivery-zones.tsx` — Connect to `useDeliveryZonesQuery()`
- `app/(rider)/settings/navigation.tsx` — Connect to `useNavigationSettingsQuery()`
- `app/(rider)/navigate/[location].tsx` — Verify Google Maps directions work

### 1.4 Add real-time delivery updates

Connect events channel in rider drawer layout:
- Subscribe to `events:deliveries` for delivery status changes
- Rider location update via `POST /api/v1/riders/location` (geolocation polling)

---

## Phase 2: Seller Role Implementation

### 2.1 Rewrite seller.service.ts

| Current Mock Export | Backend Endpoint |
|---|---|
| `getOrders()` | `GET /api/v1/businesses/:business_id/orders` |
| `getOrder()` | `GET /api/v1/orders/:id` |
| `updateOrderStatus()` | N/A — use specific mutations |
| `acceptOrder()` | `POST /api/v1/orders/:id/accept` |
| `rejectOrder()` | `POST /api/v1/orders/:id/reject` |
| `startPreparing()` | `POST /api/v1/orders/:id/start-preparing` |
| `markReady()` | `POST /api/v1/orders/:id/ready-for-delivery` |
| `markDelivered()` | `POST /api/v1/deliveries/:id/delivered` |

### 2.2 Rewrite seller-dashboard.service.ts

| Current Mock Export | Backend Endpoint |
|---|---|
| `getMetrics()` | `GET /api/v1/businesses/:business_id/dashboard` (check backend) |
| `getRecentOrders()` | `GET /api/v1/businesses/:business_id/orders?limit=5` |

### 2.3 Rewrite seller-analytics.service.ts

| Current Mock Export | Backend Endpoint |
|---|---|
| `getAnalyticsMetrics()` | `GET /api/v1/businesses/:business_id/analytics` (check backend) |
| `getPerformance()` | Check backend or derive from orders |
| `getTopSellingItems()` | Check backend or derive from orders |

### 2.4 Rewrite menu.service.ts

| Current Mock Export | Backend Endpoint |
|---|---|
| `getMenuItems()` | `GET /api/v1/businesses/:business_id/menu/items` |
| `createMenuItem()` | `POST /api/v1/businesses/:business_id/menu/items` |
| `updateMenuItem()` | `PUT /api/v1/menu/items/:id` |
| `deleteMenuItem()` | Check backend (DELETE endpoint) |
| `toggleAvailability()` | `PUT /api/v1/menu/items/:id` (with `is_available`) |
| `createCategory()` | `POST /api/v1/businesses/:business_id/menu/categories` |
| `getCategories()` | `GET /api/v1/businesses/:business_id/menu/categories` |
| `createVariant()` | `POST /api/v1/menu/items/:item_id/variants` |
| `deleteVariant()` | `DELETE /api/v1/menu/items/:item_id/variants/:variant_id` |
| `createAddon()` | `POST /api/v1/menu/items/:item_id/addons` |
| `deleteAddon()` | `DELETE /api/v1/menu/items/:item_id/addons/:addon_id` |

### 2.5 Rewrite kiosk.service.ts

| Current Mock Export | Backend Endpoint |
|---|---|
| `getOrders()` | `GET /api/v1/businesses/:business_id/orders?status=pending` |
| `acceptOrder()` | `POST /api/v1/orders/:id/accept` |
| `rejectOrder()` | `POST /api/v1/orders/:id/reject` |
| `markReady()` | `POST /api/v1/orders/:id/ready-for-delivery` |
| `getAvailableRiders()` | `GET /api/v1/business/riders?status=available` |
| `assignRider()` | `POST /api/v1/deliveries/assign` |

### 2.6 Kiosk real-time enhancement

Replace 5-second polling with WebSocket events:
- Subscribe to `events:orders` for new incoming orders
- Subscribe to `order:{order_id}` for per-order state changes
- Keep polling as fallback

### 2.7 Verify seller screens

- `app/(seller)/(drawer)/dashboard/index.tsx` — Connect to `useSellerDashboardQuery()`
- `app/(seller)/(drawer)/orders/index.tsx` — Uses `useSellerOrdersQuery()`
- `app/(seller)/orders/[id].tsx` — Uses `useSellerOrderQuery()`
- `app/(seller)/(drawer)/menu/index.tsx` — Uses `useMenuItemsQuery()`
- `app/(seller)/(drawer)/analytics/index.tsx` — Uses `useSellerAnalyticsQuery()`
- `app/(seller)/(drawer)/dashboard/kiosk.tsx` — Uses `useKioskOrdersQuery()`
- `app/(seller)/businesses/index.tsx` — Connect to `GET /api/v1/businesses/me`
- `app/(seller)/select-business.tsx` — Connect business selection to store + navigation
- `app/(seller)/settings/payment-settings.tsx` — Connect to backend
- `app/(seller)/settings/delivery-settings.tsx` — Connect to backend

---

## Phase 3: Fleet Manager Role Implementation

### 3.1 Create fleet.service.ts (new file)

| Feature | Backend Endpoint |
|---|---|
| List riders | `GET /api/v1/business/riders` |
| Invite rider | `POST /api/v1/business/riders/invite` |
| Approve rider | `POST /api/v1/business/riders/:rider_id/approve` |
| Suspend rider | `POST /api/v1/business/riders/:rider_id/suspend` |
| Activate rider | `POST /api/v1/business/riders/:rider_id/activate` |
| Rider KYC status | `GET /api/v1/business/riders/:rider_id/kyc` |
| List vehicles | `GET /api/v1/business/vehicles` |
| Add vehicle | `POST /api/v1/business/vehicles` |
| Remove vehicle | `POST /api/v1/business/vehicles/:id/remove` |
| Join requests | `GET /api/v1/business/riders/join-requests` |
| Approve join | `POST /api/v1/business/riders/join-requests/:id/approve` |
| Reject join | `POST /api/v1/business/riders/join-requests/:id/reject` |
| Invitations | `GET /api/v1/business/riders/invitations` |
| Revoke invitation | `POST /api/v1/business/riders/invitations/:id/revoke` |

### 3.2 Create fleet.hooks.ts (new file)

Mirror the pattern from `rider.hooks.ts`:

```
useFleetDashboardQuery, useFleetRidersQuery, useFleetRiderDetailQuery,
useInviteRiderMutation, useApproveRiderMutation, useSuspendRiderMutation,
useActivateRiderMutation, useFleetVehiclesQuery, useAddVehicleMutation,
useRemoveVehicleMutation, useFleetEarningsQuery, useJoinRequestsQuery,
useApproveJoinRequestMutation, useRejectJoinRequestMutation,
useFleetInvitationsQuery, useRevokeInvitationMutation
```

### 3.3 Clean fleet.store.ts

Remove mock default data from `src/stores/fleet.store.ts` — initialize as empty.

### 3.4 Verify fleet screens

- `app/(fleet)/(drawer)/dashboard/index.tsx` — Connect to real metrics
- `app/(fleet)/(drawer)/riders/index.tsx` — Connect to `useFleetRidersQuery()`
- `app/(fleet)/riders/[id].tsx` — Connect to rider detail
- `app/(fleet)/riders/add.tsx` — Connect to `useInviteRiderMutation()`
- `app/(fleet)/(drawer)/vehicles/index.tsx` — Connect to `useFleetVehiclesQuery()`
- `app/(fleet)/vehicles/[id].tsx` — Connect to vehicle detail
- `app/(fleet)/vehicles/add.tsx` — Connect to `useAddVehicleMutation()`
- `app/(fleet)/(drawer)/earnings/index.tsx` — Connect to earnings data
- `app/(fleet)/settings/profile.tsx` — Connect to profile update

---

## Phase 4: Communication & Real-Time

### 4.1 Wire up chat service with WebSocket

- `src/services/chat.service.ts` — Uses `phoenixSocket` to join `chat:*` channels
- Connect to backend: `chat:pair:order_{order_id}_{user1}_{user2}` for order chat
- Connect to backend: `chat:support:{user_id}` for support chat

### 4.2 Verify communication screens

- `app/(communication)/index.tsx` — Uses `useInboxConversationsQuery` from messages service
- `app/(communication)/chat/[userId].tsx` — Verify real-time messaging works
- `app/(communication)/chat/support.tsx` — **(new)** Port from buyer app
- `app/(communication)/chat/order.tsx` — **(new)** Port from buyer app
- `app/(communication)/call/[userId].tsx` — Verify or port from buyer app

### 4.3 Connect events in root layout

Add to `app/_layout.tsx`:
- `usePushTokenRegistration(isAuthenticated)`
- `useEventsConnection()`
- `useLiveActivity()` (if needed)

---

## Phase 5: Shared Screens

### 5.1 Profile screens

| Screen | Action |
|---|---|
| `app/(shared)/profile/index.tsx` | Already exists — connect to `useProfileQuery()` |
| `app/(shared)/profile/edit.tsx` | **(new)** Port from `../TeincFood/app/profile/edit.tsx` |
| `app/(shared)/profile/security.tsx` | Already exists — verify biometric + 2FA |
| `app/(shared)/profile/theme.tsx` | Already exists — uses local store |
| `app/(shared)/profile/terms.tsx` | Already exists — static |
| `app/(shared)/profile/privacy-policy.tsx` | Already exists — static |
| `app/(shared)/profile/help.tsx` | **(new)** Port from buyer app |
| `app/(shared)/settings/operating-hours.tsx` | Already exists — connect to `PUT /api/v1/businesses/:id/operating-hours` |

### 5.2 Auth screens

| Screen | Action |
|---|---|
| `app/(auth)/splash.tsx` | Already exists — verify auth store check |
| `app/(auth)/onboarding.tsx` | Already exists |
| `app/(auth)/role.tsx` | Already exists — connect role to `PATCH /api/v1/users/me` or registration |
| `app/(auth)/login.tsx` | Already exists — connect to `authService.login()` |
| `app/(auth)/signup.tsx` | Already exists — connect to `authService.register()` with role |
| `app/(auth)/verification.tsx` | Already exists — connect to `authService.verifyOTP()` |
| `app/(auth)/forgot-password.tsx` | Already exists — connect to `authService.forgotPassword()` |
| `app/(auth)/location.tsx` | Already exists |
| `app/(auth)/complete-profile.tsx` | **(new)** Port from buyer app's `complete-profile.tsx` |

### 5.3 Notification screen

- `app/(shared)/notifications/index.tsx` — Connect to `useNotificationsQuery()` with real-time updates via events channel

---

## Phase 6: Cleanup & Verification

### 6.1 Final mock cleanup

Delete remaining mock references:
- Remove `@mocks/*` path alias from `tsconfig.json` (after confirming no imports reference it)
- Verify no file imports from `@/services/mock-backend.service`, `@/services/mock-data.service`, `@/services/realtime-mock.service`

### 6.2 Verify data flow per role

| Role | Auth Flow | Primary Screens | Mutations | Real-Time |
|---|---|---|---|---|
| Rider | Login → role redirect → rider drawer | Dashboard, Deliveries, Earnings | Accept claim, update status, update location | Delivery events |
| Seller | Login → role redirect → business select → seller drawer | Dashboard, Orders, Menu, Analytics, Kiosk | Accept/reject order, menu CRUD, kiosk | Order events |
| Fleet | Login → role redirect → fleet drawer | Dashboard, Riders, Vehicles, Earnings | Invite/approve/suspend rider, add/remove vehicle | Rider events |

### 6.3 Run TypeScript check

```bash
yarn lint
# or
npx tsc --noEmit
```

Fix all type errors.

### 6.4 Verify removed mock dirs don't break builds

Confirm `yarn start` / `npx expo start` works without mock files.
