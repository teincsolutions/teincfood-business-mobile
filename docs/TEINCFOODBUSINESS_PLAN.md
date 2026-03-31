# TeincFoodBusiness — Implementation Plan

## Overview

**TeincFoodBusiness** is a companion app to TeincFoods, designed for **Sellers** (restaurant/business owners) and **Riders** (delivery agents). It shares the same tech stack and codebase patterns but serves a different user base.

---

## Tech Stack (Same as TeincFoods)

- **Framework**: React Native + Expo (SDK 55)
- **Navigation**: expo-router (file-based) with Drawer Navigation
- **UI**: Tamagui
- **State**: Zustand + MMKV
- **Data**: TanStack Query + Axios
- **Notifications**: @notifee/react-native (Android), expo-notifications (iOS)
- **Live Activities**: expo-live-activity (iOS)
- **Auth**: expo-apple-authentication, expo-auth-session
- **Maps**: react-native-maps
- **Location**: expo-location

---

## App Architecture

```
app/
├── (auth)/                    # Shared auth flow
│   ├── splash.tsx             # Splash screen
│   ├── onboarding.tsx         # Role selection (Seller or Rider)
│   ├── login.tsx              # Login
│   ├── signup.tsx             # Register (with role selection)
│   ├── verification.tsx       # OTP verification
│   └── forgot-password.tsx    # Password reset
│
├── (seller)/                  # Seller-specific screens (Drawer Navigation)
│   ├── _layout.tsx            # Drawer layout with side menu
│   ├── index.tsx              # Redirect to dashboard
│   ├── dashboard/
│   │   ├── index.tsx          # Dashboard overview
│   │   ├── live-orders.tsx    # Real-time order feed
│   │   └── kiosk.tsx          # Kiosk mode for POS-style order handling
│   ├── orders/
│   │   ├── index.tsx          # All orders list
│   │   ├── pending.tsx        # Pending orders (accept/reject)
│   │   ├── active.tsx         # Active orders (preparing → ready)
│   │   ├── history.tsx        # Completed/cancelled orders
│   │   └── [id].tsx           # Order detail
│   ├── menu/
│   │   ├── index.tsx          # Menu items list
│   │   ├── add.tsx            # Add new item
│   │   ├── edit/[id].tsx      # Edit item
│   │   ├── categories.tsx     # Manage categories
│   │   └── availability.tsx   # Toggle item availability
│   ├── analytics/
│   │   ├── index.tsx          # Analytics overview
│   │   ├── revenue.tsx        # Revenue reports
│   │   ├── orders.tsx         # Order analytics
│   │   └── ratings.tsx        # Customer ratings
│   ├── settings/
│   │   ├── index.tsx          # Business settings
│   │   ├── business-profile.tsx  # Business name, logo, description
│   │   ├── operating-hours.tsx   # Set business hours
│   │   ├── delivery-settings.tsx # Delivery radius, fees
│   │   ├── payment-settings.tsx  # Bank account, payout schedule
│   │   └── notifications.tsx     # Notification preferences
│   └── profile/
│       ├── index.tsx          # Seller profile
│       ├── edit.tsx           # Edit profile
│       └── help.tsx           # Help & support
│
├── (rider)/                   # Rider-specific screens (Drawer Navigation)
│   ├── _layout.tsx            # Drawer layout with side menu
│   ├── index.tsx              # Redirect to home
│   ├── home/
│   │   ├── index.tsx          # Rider dashboard (online/offline toggle)
│   │   └── map.tsx            # Live map with delivery requests
│   ├── deliveries/
│   │   ├── index.tsx          # All deliveries
│   │   ├── available.tsx      # Available delivery requests
│   │   ├── active.tsx         # Current delivery
│   │   ├── history.tsx        # Completed deliveries
│   │   └── [id].tsx           # Delivery detail
│   ├── earnings/
│   │   ├── index.tsx          # Earnings overview
│   │   ├── today.tsx          # Today's earnings
│   │   ├── weekly.tsx         # Weekly summary
│   │   └── payout.tsx         # Payout history
│   ├── settings/
│   │   ├── index.tsx          # Rider settings
│   │   ├── vehicle-info.tsx   # Vehicle type, plate number
│   │   ├── delivery-zones.tsx # Preferred delivery zones
│   │   └── notifications.tsx  # Notification preferences
│   └── profile/
│       ├── index.tsx          # Rider profile
│       ├── edit.tsx           # Edit profile
│       ├── documents.tsx      # Upload ID, license, insurance
│       └── help.tsx           # Help & support
│
├── (shared)/                  # Shared screens
│   ├── notifications/
│   │   ├── index.tsx          # Notifications list
│   │   └── live-demo.tsx      # Notification demo
│   ├── chat/
│   │   ├── index.tsx          # Chat list
│   │   └── [id].tsx           # Chat conversation
│   └── call/
│       └── [id].tsx           # Voice/video call
│
├── _layout.tsx                # Root layout
├── index.tsx                  # Entry point (redirect to splash)
└── +not-found.tsx             # 404 screen
```

---

## Feature Specifications

### 1. Authentication & Onboarding

#### 1.1 Role Selection (Onboarding)
- **Screen**: `onboarding.tsx`
- **Features**:
  - Two role cards: "I'm a Seller" and "I'm a Rider"
  - Each card shows benefits and requirements
  - Selected role determines registration form fields
  - Role stored in auth state

#### 1.2 Seller Registration
- **Required Fields**:
  - Business name
  - Business type (Restaurant, Cafe, Bakery, etc.)
  - Business address (with map picker)
  - Business phone number
  - Owner full name
  - Owner email
  - Owner password
  - Business license number (optional)
  - Operating hours (default: 9 AM - 10 PM)
- **Verification**:
  - Email OTP verification
  - Business license verification (manual review)

#### 1.3 Rider Registration
- **Required Fields**:
  - Full name
  - Phone number
  - Email
  - Password
  - Vehicle type (Bicycle, Motorcycle, Car)
  - Vehicle plate number (if applicable)
  - Date of birth
  - National ID number
- **Verification**:
  - Phone OTP verification
  - Document upload (ID, driver's license, vehicle registration)
  - Background check (manual review)

#### 1.4 Login
- **Features**:
  - Email/password login
  - Apple Sign-In (iOS)
  - Google Sign-In
  - "Remember me" option
  - Biometric login (Face ID / Fingerprint)

---

### 2. Seller Features

#### 2.1 Dashboard
- **Screen**: `dashboard/index.tsx`
- **Metrics**:
  - Today's orders (count)
  - Today's revenue (GHS)
  - Pending orders (count)
  - Average rating (stars)
  - Active orders (count)
- **Quick Actions**:
  - View pending orders
  - Toggle store open/closed
  - View live order feed
  - **Enter Kiosk Mode** (new)
- **Live Order Feed**:
  - Real-time list of incoming orders
  - Sound/vibration alert for new orders
  - Quick accept/reject buttons

#### 2.2 Kiosk Mode (POS-Style)
- **Screen**: `dashboard/kiosk.tsx`
- **Purpose**: Fast, touch-friendly interface for handling orders in a busy restaurant environment
- **Features**:
  - **Full-screen mode** with large touch targets
  - **Order Queue Panel**:
    - Large cards showing pending orders
    - One-tap accept/reject buttons
    - Sound alerts for new orders
    - Auto-refresh every 5 seconds
  - **Active Orders Panel**:
    - Orders being prepared
    - One-tap "Mark Ready" button
    - Estimated time display
  - **Quick Order Entry**:
    - Fast menu item selection
    - Custom item entry
    - Quantity adjustments
  - **Payment Status**:
    - Paid/Unpaid indicators
    - Payment method display
  - **Keyboard Shortcuts** (for tablet/desktop):
    - Enter: Accept order
    - Escape: Reject order
    - Space: Mark ready
  - **Dark/Light Mode** for different lighting conditions
  - **Offline Support**: Queue orders when internet is down
- **Access**: Toggle from dashboard or dedicated button in drawer menu

#### 2.3 Order Management
- **Screen**: `orders/index.tsx`
- **Order States**:
  - `pending` → Seller accepts/rejects
  - `confirmed` → Seller starts preparing
  - `preparing` → Seller marks as ready
  - `ready_for_pickup` → Rider picks up
  - `on_the_way` → Rider delivers
  - `delivered` → Completed
  - `cancelled` → Cancelled by seller/buyer/system
- **Actions**:
  - Accept order (with estimated prep time)
  - Reject order (with reason)
  - Mark as "Preparing"
  - Mark as "Ready for Pickup"
  - Cancel order (with reason and refund)
  - View order details (items, buyer info, delivery address)
  - Contact buyer (chat/call)
  - Contact rider (chat/call)
- **Filters**:
  - All, Pending, Active, Completed, Cancelled
  - Date range picker
  - Search by order number

#### 2.4 Menu Management
- **Screen**: `menu/index.tsx`
- **Features**:
  - List all menu items with images, prices, availability
  - Add new item (name, description, price, image, category, options)
  - Edit existing item
  - Delete item (with confirmation)
  - Toggle item availability (in stock / out of stock)
  - Bulk actions (enable/disable multiple items)
  - Drag-and-drop reorder
- **Item Options**:
  - Size options (Small, Medium, Large) with price modifiers
  - Add-ons (Extra cheese, Extra sauce, etc.) with prices
  - Dietary tags (Vegetarian, Vegan, Gluten-free, Halal)
- **Categories**:
  - Create/edit/delete categories
  - Reorder categories
  - Assign items to categories

#### 2.5 Analytics
- **Screen**: `analytics/index.tsx`
- **Metrics**:
  - Revenue (daily, weekly, monthly, yearly)
  - Order count (daily, weekly, monthly)
  - Average order value
  - Top-selling items
  - Peak hours
  - Customer ratings breakdown
- **Charts**:
  - Revenue line chart
  - Orders bar chart
  - Ratings pie chart
- **Export**:
  - Export to PDF
  - Export to CSV

#### 2.6 Business Settings
- **Screen**: `settings/index.tsx`
- **Settings**:
  - Business profile (name, logo, description, cover image)
  - Operating hours (per-day schedule)
  - Delivery settings (radius, minimum order, delivery fee)
  - Payment settings (bank account, payout schedule)
  - Tax settings (tax rate, tax ID)
  - Notification preferences

---

### 3. Rider Features

#### 3.1 Home / Dashboard
- **Screen**: `home/index.tsx`
- **Features**:
  - Online/Offline toggle switch
  - Current location on map
  - Today's earnings summary
  - Today's delivery count
  - Active delivery status (if any)
  - Available delivery requests (nearby)
- **Map View**:
  - Shows rider's current location
  - Shows pickup/dropoff points for active delivery
  - Shows available delivery requests as pins
  - Navigation integration (Google Maps / Apple Maps)

#### 3.2 Delivery Management
- **Screen**: `deliveries/index.tsx`
- **Delivery States**:
  - `available` → Rider accepts/declines
  - `assigned` → Rider heading to pickup
  - `picked_up` → Rider has the order
  - `delivering` → Rider heading to dropoff
  - `delivered` → Completed
  - `cancelled` → Cancelled
- **Actions**:
  - Accept delivery request
  - Decline delivery request
  - Mark as "Arrived at Pickup"
  - Mark as "Picked Up" (with photo confirmation)
  - Mark as "Arrived at Dropoff"
  - Mark as "Delivered" (with photo/signature confirmation)
  - Navigate to pickup/dropoff (external maps app)
  - Contact buyer (chat/call)
  - Contact seller (chat/call)
  - Report issue (wrong address, buyer not available, etc.)
- **Filters**:
  - Available, Active, Completed, Cancelled
  - Date range picker

#### 3.3 Earnings
- **Screen**: `earnings/index.tsx`
- **Metrics**:
  - Today's earnings
  - This week's earnings
  - This month's earnings
  - Total earnings
  - Pending payouts
- **Breakdown**:
  - Base delivery fee per order
  - Tips received
  - Bonuses (surge, peak hours, streak)
  - Deductions (cancellations, penalties)
- **Payout**:
  - Payout history
  - Payout schedule (weekly, bi-weekly)
  - Bank account details
  - Request early payout

#### 3.4 Rider Settings
- **Screen**: `settings/index.tsx`
- **Settings**:
  - Vehicle information (type, plate, color, model)
  - Preferred delivery zones
  - Maximum delivery distance
  - Notification preferences
  - Sound/vibration alerts
  - Auto-accept deliveries (toggle)

#### 3.5 Documents
- **Screen**: `profile/documents.tsx`
- **Documents**:
  - National ID (photo upload)
  - Driver's license (photo upload)
  - Vehicle registration (photo upload)
  - Insurance certificate (photo upload)
  - Profile photo
- **Status**:
  - Pending review
  - Approved
  - Rejected (with reason)

---

### 4. Shared Features

#### 4.1 Notifications
- **Android**: Rich notifications with @notifee/react-native
  - New order notification (seller)
  - New delivery request (rider)
  - Order status updates
  - Earnings updates
  - Chat messages
- **iOS**: Live Activities with expo-live-activity
  - Active delivery tracking
  - Order preparation status
  - Earnings countdown

#### 4.2 Chat
- **Screen**: `chat/[id].tsx`
- **Features**:
  - Real-time messaging (WebSocket)
  - Text messages
  - Image messages
  - Location sharing
  - Order reference cards
  - Read receipts
  - Typing indicators

#### 4.3 Calls
- **Screen**: `call/[id].tsx`
- **Features**:
  - Voice calls (VoIP)
  - Call history
  - Call recording (with consent)
  - Mute/speaker controls

#### 4.4 Profile
- **Features**:
  - View/edit profile
  - Change password
  - Two-factor authentication
  - Language preference
  - Theme (Light/Dark/System)
  - Help & support
  - Terms of service
  - Privacy policy
  - Logout
  - Delete account

---

## Navigation Architecture

### Drawer Navigation (Side Menu)

Both seller and rider apps use **Drawer Navigation** instead of bottom tabs for better scalability and easier access to all features.

#### Seller Drawer Menu Items:
1. **Dashboard** (Home icon)
   - Overview metrics
   - Quick actions
   - **Kiosk Mode** toggle
2. **Orders** (Shopping bag icon)
   - Pending orders
   - Active orders
   - Order history
3. **Menu** (Utensils icon)
   - Menu items
   - Categories
   - Availability
4. **Analytics** (Chart icon)
   - Revenue reports
   - Order analytics
   - Ratings
5. **Settings** (Gear icon)
   - Business profile
   - Operating hours
   - Delivery settings
   - Payment settings
6. **Profile** (User icon)
   - View profile
   - Edit profile
   - Help & support
7. **Notifications** (Bell icon) - Badge with count
8. **Logout** (Log out icon)

#### Rider Drawer Menu Items:
1. **Home** (Home icon)
   - Dashboard
   - Online/offline toggle
   - Map view
2. **Deliveries** (Truck icon)
   - Available deliveries
   - Active delivery
   - Delivery history
3. **Earnings** (Dollar icon)
   - Today's earnings
   - Weekly summary
   - Payout history
4. **Settings** (Gear icon)
   - Vehicle info
   - Delivery zones
   - Notification preferences
5. **Profile** (User icon)
   - View profile
   - Documents
   - Help & support
6. **Notifications** (Bell icon) - Badge with count
7. **Logout** (Log out icon)

---

## State Management

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `auth.store.ts` | Authentication state, user data, tokens |
| `seller.store.ts` | Seller-specific state (business info, menu, settings) |
| `rider.store.ts` | Rider-specific state (vehicle, zones, online status) |
| `orders.store.ts` | Orders list, filters, selected order |
| `deliveries.store.ts` | Deliveries list, active delivery, earnings |
| `menu.store.ts` | Menu items, categories, editing state |
| `kiosk.store.ts` | Kiosk mode state, queue, active orders |
| `notifications.store.ts` | Notifications list, badge count |
| `chat.store.ts` | Chat conversations, messages |
| `location.store.ts` | Current location, delivery zones |
| `ui.store.ts` | UI state (modals, sheets, loading) |

---

## Services

### API Services

| Service | Purpose |
|---------|---------|
| `auth.service.ts` | Login, register, OTP, password reset |
| `seller.service.ts` | Business CRUD, settings |
| `rider.service.ts` | Rider CRUD, documents, availability |
| `orders.service.ts` | Order CRUD, status updates |
| `deliveries.service.ts` | Delivery CRUD, status updates |
| `menu.service.ts` | Menu item CRUD, categories |
| `kiosk.service.ts` | Kiosk-specific order operations |
| `analytics.service.ts` | Revenue, orders, ratings data |
| `notifications.service.ts` | Notification CRUD, push tokens |
| `chat.service.ts` | Messages, conversations |
| `payments.service.ts` | Payouts, bank accounts |
| `tracking.service.ts` | Location updates, route tracking |

---

## Navigation Guards

```typescript
// app/_layout.tsx

<Stack.Screen name="(auth)" />

<Stack.Protected guard={isAuthenticated && userRole === 'seller'}>
  <Stack.Screen name="(seller)" />
</Stack.Protected>

<Stack.Protected guard={isAuthenticated && userRole === 'rider'}>
  <Stack.Screen name="(rider)" />
</Stack.Protected>

<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(shared)" />
</Stack.Protected>
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure with drawer navigation
- [ ] Configure auth flow with role selection
- [ ] Create shared components (Button, Input, Card, etc.)
- [ ] Set up state management stores
- [ ] Configure API client
- [ ] Set up navigation with role guards

### Phase 2: Seller Core (Week 3-4)
- [ ] Seller registration flow
- [ ] Seller dashboard with metrics
- [ ] **Kiosk Mode** for POS-style order handling
- [ ] Order management (accept/reject/prepare)
- [ ] Menu management (CRUD)
- [ ] Business settings

### Phase 3: Rider Core (Week 5-6)
- [ ] Rider registration flow with document upload
- [ ] Rider dashboard with online/offline toggle
- [ ] Delivery management (accept/navigate/deliver)
- [ ] Earnings tracking
- [ ] Map integration

### Phase 4: Shared Features (Week 7-8)
- [ ] Real-time notifications (Android + iOS)
- [ ] Chat system
- [ ] Voice calls
- [ ] Analytics dashboards
- [ ] Profile management

### Phase 5: Polish & Testing (Week 9-10)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] App store preparation
- [ ] Beta testing

---

## API Endpoints (Backend Contracts)

### Auth
- `POST /auth/seller/register` — Seller registration
- `POST /auth/rider/register` — Rider registration
- `POST /auth/login` — Login (role-agnostic)
- `POST /auth/verify-otp` — OTP verification
- `POST /auth/forgot-password` — Password reset
- `POST /auth/refresh-token` — Token refresh

### Seller
- `GET /seller/profile` — Get seller profile
- `PUT /seller/profile` — Update seller profile
- `GET /seller/dashboard` — Dashboard metrics
- `PUT /seller/settings` — Update settings
- `PUT /seller/status` — Toggle open/closed

### Kiosk
- `GET /kiosk/orders/queue` — Get order queue for kiosk
- `PUT /kiosk/orders/:id/accept` — Accept order (kiosk)
- `PUT /kiosk/orders/:id/reject` — Reject order (kiosk)
- `PUT /kiosk/orders/:id/ready` — Mark order ready (kiosk)
- `POST /kiosk/orders` — Create manual order (kiosk)

### Rider
- `GET /rider/profile` — Get rider profile
- `PUT /rider/profile` — Update rider profile
- `POST /rider/documents` — Upload documents
- `PUT /rider/availability` — Toggle online/offline
- `GET /rider/earnings` — Earnings summary

### Orders (Seller)
- `GET /seller/orders` — List orders
- `GET /seller/orders/:id` — Order detail
- `PUT /seller/orders/:id/accept` — Accept order
- `PUT /seller/orders/:id/reject` — Reject order
- `PUT /seller/orders/:id/status` — Update status
- `PUT /seller/orders/:id/cancel` — Cancel order

### Deliveries (Rider)
- `GET /rider/deliveries/available` — Available deliveries
- `GET /rider/deliveries/active` — Active delivery
- `GET /rider/deliveries/history` — Delivery history
- `POST /rider/deliveries/:id/accept` — Accept delivery
- `PUT /rider/deliveries/:id/status` — Update status
- `POST /rider/deliveries/:id/proof` — Upload delivery proof

### Menu
- `GET /seller/menu` — List menu items
- `POST /seller/menu` — Create item
- `PUT /seller/menu/:id` — Update item
- `DELETE /seller/menu/:id` — Delete item
- `PUT /seller/menu/:id/availability` — Toggle availability
- `GET /seller/menu/categories` — List categories
- `POST /seller/menu/categories` — Create category

### Analytics
- `GET /seller/analytics/revenue` — Revenue data
- `GET /seller/analytics/orders` — Order analytics
- `GET /seller/analytics/ratings` — Ratings data
- `GET /rider/analytics/earnings` — Earnings analytics

---

## Key Differences from TeincFoods (Buyer App)

| Aspect | TeincFoods (Buyer) | TeincFoodBusiness (Seller/Rider) |
|--------|-------------------|----------------------------------|
| Primary User | Customer | Business owner / Delivery agent |
| Navigation | Bottom tabs | Side menu (drawer) |
| Main Action | Browse & Order | Manage & Deliver |
| Notifications | Order updates | New orders / Delivery requests |
| Maps | Track delivery | Navigate to pickup/dropoff |
| Payments | Pay for orders | Receive payouts |
| Analytics | Order history | Revenue & performance metrics |
| Special Features | Cart, Favorites | **Kiosk Mode (POS)** |

---

## Kiosk Mode Technical Details

### UI Components
- **Large Touch Buttons**: Minimum 48x48dp touch targets
- **High Contrast Colors**: Easy to read in busy environments
- **Sound Alerts**: Different sounds for new orders, accepted, ready
- **Vibration Feedback**: Haptic response on button presses
- **Auto-Scroll**: New orders automatically scroll into view

### Performance
- **Optimized Polling**: 5-second refresh for order queue
- **Offline Queue**: Store orders locally when internet is down
- **Background Sync**: Sync queued orders when connection restored
- **Memory Management**: Efficient handling of large order lists

### Hardware Support
- **Tablet Optimized**: Landscape mode support
- **External Display**: Support for kitchen display systems
- **Receipt Printer**: Integration with thermal printers (future)
- **Barcode Scanner**: Quick order lookup (future)

---

## Notes

- Reuse shared components from TeincFoods where possible
- Use same design system (Tamagui tokens, fonts, colors)
- Separate app bundle ID: `com.teincfoods.business`
- Separate EAS project for builds
- Shared backend API with role-based access control
- Push notification channels: `seller-orders`, `rider-deliveries`, `chat`, `system`
- **Kiosk Mode** is a premium feature for high-volume sellers