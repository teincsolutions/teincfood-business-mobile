# TeincFoodBusiness — Implementation Plan

## Overview

**TeincFoodBusiness** is a companion app to TeincFoods, designed for **Sellers** (restaurant/business owners), **Riders** (delivery agents), and **Fleet Managers** (companies managing multiple riders). It shares the same tech stack and codebase patterns but serves a different user base.

**Important**: This app does NOT support buyer accounts. It is solely for business operations.

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

## Data Model Architecture

### User (Account)
```typescript
export interface User {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'seller' | 'rider' | 'fleet_manager';
  // Rider-specific fields
  vehicleType?: 'bicycle' | 'motorcycle' | 'car';
  vehiclePlateNumber?: string;
  isOnline?: boolean;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Business (for Sellers)
```typescript
export interface Business {
  id: string;
  code: string;                  // Human-readable: "TEINC-ACC-001"
  ownerId: string;               // Links to User.id
  name: string;                  // "Teinc Foods - Accra Mall"
  type: 'restaurant' | 'cafe' | 'bakery' | 'food_truck' | 'cloud_kitchen';
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  address: BusinessAddress;
  phone: string;
  email?: string;
  operatingHours: OperatingHours[];
  deliverySettings: DeliverySettings;
  paymentSettings: PaymentSettings;
  status: 'active' | 'inactive' | 'pending_verification' | 'suspended';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Fleet Manager
```typescript
export interface FleetManager {
  id: string;
  code: string;                  // "FLEET-SD-001"
  userId: string;                // Links to User.id
  companyName: string;           // "Speedy Deliveries Ltd"
  licenseNumber?: string;
  totalVehicles: number;
  activeRiders: number;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface FleetVehicle {
  id: string;
  fleetId: string;
  vehicleType: 'motorcycle' | 'car' | 'bicycle' | 'van';
  plateNumber: string;
  model?: string;
  color?: string;
  isActive: boolean;
  assignedRiderId?: string;
  createdAt: string;
}
```

---

## Code Generation Strategy

### Business Code
```
Format: {PREFIX}-{CITY}-{SEQ}
Examples:
  - TEINC-ACC-001  (Teinc Foods, Accra, Branch 1)
  - ROS-AMA-002    (Rose Garden, Kumasi, Branch 2)
  - SPICE-ACC-001  (Spice Haven, Accra, Branch 1)
```

### Fleet Code
```
Format: FLEET-{INITIALS}-{SEQ}
Examples:
  - FLEET-SD-001   (Speedy Deliveries)
  - FLEET-KD-002   (Kwame Deliveries)
```

---

## App Architecture

```
app/
├── (auth)/                    # Shared auth flow
│   ├── splash.tsx             # Splash screen
│   ├── onboarding.tsx         # Role selection (Seller, Rider, Fleet Manager)
│   ├── login.tsx              # Login
│   ├── signup.tsx             # Register (with role selection)
│   ├── verification.tsx       # OTP verification
│   └── forgot-password.tsx    # Password reset
│
├── (seller)/                  # Seller-specific screens (Drawer Navigation)
│   ├── _layout.tsx            # Drawer layout with side menu
│   ├── index.tsx              # Redirect to dashboard or select-business
│   ├── select-business.tsx    # Business selection screen (NEW)
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
│   ├── businesses/
│   │   ├── index.tsx          # Manage businesses list (NEW)
│   │   ├── add.tsx            # Add new business (NEW)
│   │   └── [id].tsx           # Edit business (NEW)
│   ├── analytics/
│   │   ├── index.tsx          # Analytics overview
│   │   ├── revenue.tsx        # Revenue reports
│   │   ├── orders.tsx         # Order analytics
│   │   └── ratings.tsx        # Customer ratings
│   ├── settings/
│   │   ├── index.tsx          # Business settings
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
├── (fleet)/                   # Fleet Manager screens (Drawer Navigation) (NEW)
│   ├── _layout.tsx            # Drawer layout with side menu
│   ├── index.tsx              # Redirect to dashboard
│   ├── dashboard/
│   │   └── index.tsx          # Fleet overview (riders, vehicles, earnings)
│   ├── riders/
│   │   ├── index.tsx          # List all riders
│   │   ├── add.tsx            # Add/invite rider
│   │   └── [id].tsx           # Rider details & performance
│   ├── vehicles/
│   │   ├── index.tsx          # List all vehicles
│   │   ├── add.tsx            # Add new vehicle
│   │   └── [id].tsx           # Edit vehicle & assign rider
│   ├── earnings/
│   │   ├── index.tsx          # Fleet earnings overview
│   │   └── breakdown.tsx      # Per-rider breakdown
│   └── settings/
│       ├── index.tsx          # Fleet settings
│       ├── commission.tsx     # Commission rates
│       └── profile.tsx        # Fleet profile
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
  - Three role cards: "I'm a Seller", "I'm a Rider", "I'm a Fleet Manager"
  - Each card shows benefits and requirements
  - Selected role determines registration form fields
  - Role stored in auth state

#### 1.2 Seller Registration
- **Required Fields**:
  - Owner full name
  - Owner email
  - Owner password
  - Owner phone number
  - Business name (first business)
  - Business type (Restaurant, Cafe, Bakery, etc.)
  - Business address (with map picker)
  - Business phone number
  - Operating hours (default: 9 AM - 10 PM)
- **Post-Registration**:
  - Business code auto-generated (e.g., "TEINC-ACC-001")
  - Business set as default
  - Redirect to dashboard

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

#### 1.4 Fleet Manager Registration
- **Required Fields**:
  - Company name
  - Contact person full name
  - Contact email
  - Contact phone
  - Password
  - Business license number (optional)
- **Post-Registration**:
  - Fleet code auto-generated (e.g., "FLEET-SD-001")
  - Redirect to fleet dashboard
  - Can start adding vehicles and riders

#### 1.5 Login
- **Features**:
  - Email/password login
  - Apple Sign-In (iOS)
  - Google Sign-In
  - "Remember me" option
  - Biometric login (Face ID / Fingerprint)
- **Post-Login**:
  - Detect user role
  - If seller: Fetch businesses, show selection if multiple
  - If rider: Go to rider dashboard
  - If fleet manager: Go to fleet dashboard

---

### 2. Seller Features

#### 2.1 Business Selection
- **Screen**: `select-business.tsx`
- **Features**:
  - List all businesses owned by seller
  - Each card shows: name, code, address, status, pending orders
  - "Add New Business" button
  - Tap to select and enter dashboard
  - Remember last selected business

#### 2.2 Dashboard
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
  - Enter Kiosk Mode
- **Live Order Feed**:
  - Real-time list of incoming orders
  - Sound/vibration alert for new orders
  - Quick accept/reject buttons

#### 2.3 Kiosk Mode (POS-Style)
- **Screen**: `dashboard/kiosk.tsx`
- **Purpose**: Fast, touch-friendly interface for handling orders in a busy restaurant environment
- **Features**:
  - Full-screen mode with large touch targets
  - Order Queue Panel with accept/reject buttons
  - Active Orders Panel with "Mark Ready" button
  - Quick Order Entry for manual orders
  - Payment status indicators
  - Keyboard shortcuts for tablet/desktop
  - Dark/Light Mode
  - Offline Support

#### 2.4 Order Management
- **Screen**: `orders/index.tsx`
- **Order States**:
  - `pending` → Seller accepts/rejects
  - `confirmed` → Seller starts preparing
  - `preparing` → Seller marks as ready
  - `ready_for_pickup` → Rider picks up
  - `on_the_way` → Rider delivers
  - `delivered` → Completed
  - `cancelled` → Cancelled
- **Actions**:
  - Accept order (with estimated prep time)
  - Reject order (with reason)
  - Mark as "Preparing"
  - Mark as "Ready for Pickup"
  - Cancel order (with reason and refund)
  - Contact buyer (chat/call)
  - Contact rider (chat/call)

#### 2.5 Menu Management
- **Screen**: `menu/index.tsx`
- **Features**:
  - List all menu items with images, prices, availability
  - Add/edit/delete items
  - Toggle item availability
  - Bulk actions
  - Drag-and-drop reorder
  - Categories management

#### 2.6 Business Management
- **Screen**: `businesses/index.tsx`
- **Features**:
  - List all owned businesses
  - Add new business
  - Edit business details
  - View business code
  - Set default business
  - Deactivate business

#### 2.7 Analytics
- **Screen**: `analytics/index.tsx`
- **Metrics**:
  - Revenue (daily, weekly, monthly, yearly)
  - Order count
  - Average order value
  - Top-selling items
  - Peak hours
  - Customer ratings breakdown

#### 2.8 Business Settings
- **Screen**: `settings/index.tsx`
- **Settings**:
  - Operating hours (per-day schedule)
  - Delivery settings (radius, minimum order, delivery fee)
  - Payment settings (bank account, payout schedule)
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
  - Active delivery status
  - Available delivery requests

#### 3.2 Delivery Management
- **Screen**: `deliveries/index.tsx`
- **Delivery States**:
  - `available` → Rider accepts/declines
  - `assigned` → Rider heading to pickup
  - `picked_up` → Rider has the order
  - `delivering` → Rider heading to dropoff
  - `delivered` → Completed
  - `cancelled` → Cancelled

#### 3.3 Earnings
- **Screen**: `earnings/index.tsx`
- **Metrics**:
  - Today's earnings
  - This week's earnings
  - This month's earnings
  - Total earnings
  - Pending payouts

#### 3.4 Rider Settings
- **Screen**: `settings/index.tsx`
- **Settings**:
  - Vehicle information
  - Preferred delivery zones
  - Maximum delivery distance
  - Notification preferences

#### 3.5 Documents
- **Screen**: `profile/documents.tsx`
- **Documents**:
  - National ID
  - Driver's license
  - Vehicle registration
  - Insurance certificate
  - Profile photo

---

### 4. Fleet Manager Features

#### 4.1 Fleet Dashboard
- **Screen**: `dashboard/index.tsx`
- **Metrics**:
  - Total riders (online/offline)
  - Today's fleet deliveries
  - Fleet earnings summary
  - Vehicle utilization rate

#### 4.2 Rider Management
- **Screen**: `riders/index.tsx`
- **Features**:
  - List all riders in fleet
  - Invite new rider (email/phone)
  - View rider performance
  - Activate/deactivate rider

#### 4.3 Vehicle Management
- **Screen**: `vehicles/index.tsx`
- **Features**:
  - List all vehicles
  - Add new vehicle (type, plate, model, color)
  - Assign vehicle to rider
  - Track vehicle status

#### 4.4 Fleet Earnings
- **Screen**: `earnings/index.tsx`
- **Features**:
  - Fleet total earnings
  - Per-rider breakdown
  - Commission calculations
  - Payout management

#### 4.5 Fleet Settings
- **Screen**: `settings/index.tsx`
- **Settings**:
  - Commission rates
  - Fleet profile
  - Notification preferences

---

### 5. Shared Features

#### 5.1 Notifications
- New order notification (seller)
- New delivery request (rider)
- Order status updates
- Earnings updates
- Chat messages

#### 5.2 Chat
- Real-time messaging
- Text messages
- Image messages
- Location sharing
- Order reference cards

#### 5.3 Calls
- Voice calls (VoIP)
- Call history
- Mute/speaker controls

#### 5.4 Profile
- View/edit profile
- Change password
- Two-factor authentication
- Language preference
- Theme (Light/Dark/System)
- Help & support
- Terms of service
- Privacy policy
- Logout

---

## Navigation Architecture

### Seller Drawer Menu Items:
1. **Dashboard** (Home icon)
   - Overview metrics
   - Quick actions
   - Kiosk Mode toggle
2. **Orders** (Shopping bag icon)
   - Pending orders
   - Active orders
   - Order history
3. **Menu** (Utensils icon)
   - Menu items
   - Categories
   - Availability
4. **Businesses** (Building icon) - NEW
   - Manage businesses
   - Add new business
5. **Analytics** (Chart icon)
   - Revenue reports
   - Order analytics
   - Ratings
6. **Settings** (Gear icon)
   - Operating hours
   - Delivery settings
   - Payment settings
7. **Profile** (User icon)
   - View profile
   - Edit profile
   - Help & support
8. **Switch Business** (Swap icon) - NEW
   - Quick switch between businesses
9. **Notifications** (Bell icon) - Badge with count
10. **Logout** (Log out icon)

### Rider Drawer Menu Items:
1. **Home** (Home icon)
2. **Deliveries** (Truck icon)
3. **Earnings** (Dollar icon)
4. **Settings** (Gear icon)
5. **Profile** (User icon)
6. **Notifications** (Bell icon)
7. **Logout** (Log out icon)

### Fleet Manager Drawer Menu Items:
1. **Dashboard** (Home icon)
   - Fleet overview
   - Key metrics
2. **Riders** (Users icon)
   - Manage riders
   - Invite rider
3. **Vehicles** (Car icon)
   - Manage vehicles
   - Add vehicle
4. **Earnings** (Dollar icon)
   - Fleet earnings
   - Rider breakdown
5. **Settings** (Gear icon)
   - Commission rates
   - Fleet profile
6. **Profile** (User icon)
7. **Notifications** (Bell icon)
8. **Logout** (Log out icon)

---

## State Management

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `auth.store.ts` | Authentication state, user data, tokens |
| `business.store.ts` | Business list, active business (NEW) |
| `fleet.store.ts` | Fleet data, vehicles, riders (NEW) |
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
| `business.service.ts` | Business CRUD, code generation (NEW) |
| `fleet.service.ts` | Fleet CRUD, vehicles, riders (NEW) |
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

<Stack.Protected guard={isAuthenticated && userRole === 'fleet_manager'}>
  <Stack.Screen name="(fleet)" />
</Stack.Protected>

<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(shared)" />
</Stack.Protected>
```

---

## API Endpoints (Backend Contracts)

### Auth
- `POST /auth/seller/register` — Seller registration
- `POST /auth/rider/register` — Rider registration
- `POST /auth/fleet/register` — Fleet manager registration
- `POST /auth/login` — Login (role-agnostic)
- `POST /auth/verify-otp` — OTP verification
- `POST /auth/forgot-password` — Password reset
- `POST /auth/refresh-token` — Token refresh

### Business (NEW)
- `GET /businesses` — List user's businesses
- `POST /businesses` — Create new business
- `GET /businesses/:id` — Get business details
- `PUT /businesses/:id` — Update business
- `DELETE /businesses/:id` — Deactivate business
- `PUT /businesses/:id/default` — Set as default business

### Fleet (NEW)
- `GET /fleet/profile` — Get fleet profile
- `PUT /fleet/profile` — Update fleet profile
- `GET /fleet/riders` — List fleet riders
- `POST /fleet/riders/invite` — Invite rider
- `PUT /fleet/riders/:id/status` — Update rider status
- `GET /fleet/vehicles` — List vehicles
- `POST /fleet/vehicles` — Add vehicle
- `PUT /fleet/vehicles/:id` — Update vehicle
- `PUT /fleet/vehicles/:id/assign` — Assign rider to vehicle
- `GET /fleet/earnings` — Fleet earnings

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
- `GET /fleet/analytics/earnings` — Fleet earnings analytics

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create Business and Fleet models
- [ ] Update User model (remove business fields, remove buyer role)
- [ ] Create business and fleet stores
- [ ] Create business and fleet services
- [ ] Update auth flow for new roles

### Phase 2: Seller Multi-Business (Week 3-4)
- [ ] Business selection screen
- [ ] Business management screens (