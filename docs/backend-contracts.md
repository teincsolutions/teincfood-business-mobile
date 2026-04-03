# TeincFoods Backend Contracts & Realtime Architecture

## 1. Purpose
This document defines the backend contracts and platform capabilities required to support:
- Region-aware catalog/pricing
- Account auth and session management
- Food variant/extras pricing
- Chat messaging
- Order tracking and live rider updates
- In-app notifications
- Android live notifications
- iOS Live Activities (Dynamic Island / Lock Screen)
- Seller dashboard and analytics
- Rider deliveries, earnings, and vehicle management
- Fleet management

This is the source-of-truth contract for frontend + backend integration.

---

## 2. Required Backend Capabilities

### 2.1 Core
- JWT-based auth (access + refresh tokens)
- Region-aware data routing (country/currency aware responses)
- Price in minor units only (e.g., cents/pesewas)
- Idempotent mutation support
- Event sequencing for realtime streams
- Device token registration for push

### 2.2 Realtime
- WebSocket service for chat (bi-directional)
- SSE service for in-app notification stream (server -> client)
- Push provider integration:
  - FCM for Android + standard iOS notifications
  - APNs direct channel for iOS Live Activities updates

### 2.3 Observability / Reliability
- Event IDs + sequence numbers
- Replay/resume support
- At-least-once delivery on realtime channels
- De-duplication by eventId on client
- Monitoring for push delivery and socket/SSE disconnect rates

---

## 3. Global Contract Rules

### 3.1 Authentication
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Refresh flow:
  - `POST /v1/auth/refresh` with refresh token
  - returns new access/refresh pair.

### 3.2 Region / Currency
- Server determines effective region from:
  1. Auth session profile country (preferred), else
  2. Explicit region header from client, else
  3. Geo fallback logic.
- Every catalog/price response must include:
  - `countryCode`
  - `currencyCode`
- Money fields:
  - `amountMinor` (integer)
  - `currencyCode` (ISO 4217)

### 3.3 Idempotency
- Mutating REST endpoints support:
  - `Idempotency-Key` header
- Duplicate keys return the original committed result.

### 3.4 Event Envelope (WS/SSE/Push Data)
All realtime payloads must follow:

```json
{
  "eventId": "evt_01J...",
  "type": "order.status.updated",
  "occurredAt": "2026-03-29T14:10:00Z",
  "sequence": 4821,
  "region": "GH",
  "orderId": "ord_123",
  "chatId": null,
  "version": 1,
  "payload": {}
}
```

---

## 4. REST API Contracts

### 4.1 Bootstrap / Session Context

#### `GET /v1/bootstrap`
Returns app/session context used by frontend at launch.

Response:
```json
{
  "user": { "id": "usr_1", "username": "ericm", "email": "..." },
  "region": {
    "countryCode": "GH",
    "currencyCode": "GHS",
    "timezone": "Africa/Accra"
  },
  "features": {
    "liveActivitiesIOS": true,
    "androidLiveNotifications": true,
    "sseNotifications": true
  }
}
```

---

### 4.2 Auth / Account

#### `POST /v1/auth/signup`
Request:
```json
{
  "username": "ericm",
  "email": "user@example.com",
  "password": "strong_password",
  "fullName": "Eric Mensah",
  "phone": "+233...",
  "role": "seller"
}
```
Response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "usr_1", "username": "ericm", "email": "...", "phone": "..." }
}
```

#### `POST /v1/auth/login`
Request:
```json
{
  "email": "user@example.com",
  "password": "strong_password"
}
```
Response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "usr_1", "username": "ericm", "email": "...", "phone": "..." }
}
```

#### `POST /v1/auth/refresh`
Request:
```json
{
  "refreshToken": "..."
}
```
Response:
```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### `POST /v1/auth/logout`
Invalidates refresh session/device session.

---

### 4.3 Location / Address

#### `POST /v1/users/me/location`
Request:
```json
{
  "latitude": 5.6037,
  "longitude": -0.1870,
  "city": "Accra",
  "area": "East Legon",
  "countryCode": "GH"
}
```
Response:
```json
{
  "success": true,
  "countryCode": "GH"
}
```

#### `GET /v1/users/me/addresses`
Response:
```json
{
  "addresses": [
    {
      "id": "addr_1",
      "label": "Home",
      "street": "123 Main Street",
      "city": "Accra",
      "area": "East Legon",
      "latitude": 5.6037,
      "longitude": -0.1870,
      "isDefault": true
    }
  ]
}
```

#### `POST /v1/users/me/addresses`
Request:
```json
{
  "label": "Office",
  "street": "45 Liberation Road",
  "city": "Accra",
  "area": "Osu",
  "latitude": 5.5600,
  "longitude": -0.2050,
  "isDefault": false
}
```

#### `PATCH /v1/users/me/addresses/{addressId}`
Request:
```json
{
  "label": "Updated Label",
  "isDefault": true
}
```

#### `DELETE /v1/users/me/addresses/{addressId}`

---

### 4.4 Catalog / Food Details (Variants + Extras)

#### `GET /v1/catalog/foods/{foodId}`
Response shape:
```json
{
  "id": "food_1",
  "name": "Chicken Tikka Pizza",
  "basePrice": { "amountMinor": 1599, "currencyCode": "GHS" },
  "variants": [
    { "id": "var_s", "label": "Small", "price": { "amountMinor": 1399, "currencyCode": "GHS" } },
    { "id": "var_m", "label": "Medium", "price": { "amountMinor": 1599, "currencyCode": "GHS" } },
    { "id": "var_l", "label": "Large", "price": { "amountMinor": 1899, "currencyCode": "GHS" } }
  ],
  "extras": [
    { "id": "ex_cheese", "label": "Extra Cheese", "pricingType": "fixed", "amountMinor": 250, "currencyCode": "GHS" }
  ],
  "region": { "countryCode": "GH", "currencyCode": "GHS" }
}
```

Pricing rules:
- Variant labels seller-defined (e.g. Small/Medium/Large/XL/custom).
- Final line-item total must be returned by backend in cart/checkout endpoints.

---

### 4.5 Promo Codes

#### `POST /v1/promo/validate`
Validates a promo code and returns discount information.

Request:
```json
{
  "code": "TEINC20",
  "subtotal": { "amountMinor": 1599, "currencyCode": "GHS" }
}
```

Response (valid):
```json
{
  "valid": true,
  "discount": { "amountMinor": 320, "currencyCode": "GHS" },
  "discountType": "percentage",
  "discountValue": 20,
  "message": "20% off your order!"
}
```

Response (invalid):
```json
{
  "valid": false,
  "discount": { "amountMinor": 0, "currencyCode": "GHS" },
  "discountType": "percentage",
  "discountValue": 0,
  "message": "Invalid or expired promo code"
}
```

Supported discount types:
- `percentage`: Percentage off subtotal
- `fixed`: Fixed amount off

---

### 4.6 Orders / Tracking

#### `POST /v1/orders`
Creates order with selected variant/extras and returns server-calculated totals.

Request:
```json
{
  "items": [
    {
      "foodId": "food_1",
      "variantId": "var_m",
      "quantity": 2,
      "extras": ["ex_cheese"]
    }
  ],
  "deliveryAddressId": "addr_1",
  "paymentMethodId": "pm_1",
  "promoCode": "TEINC20",
  "notes": "Less spicy please"
}
```

#### `GET /v1/orders/{orderId}`
Returns full order details with status, ETA, rider snapshot, timeline events.

Response:
```json
{
  "id": "ord_123",
  "orderNumber": "#ORD-4521",
  "status": "on_the_way",
  "items": [...],
  "subtotal": { "amountMinor": 5597, "currencyCode": "GHS" },
  "deliveryFee": { "amountMinor": 500, "currencyCode": "GHS" },
  "tax": { "amountMinor": 280, "currencyCode": "GHS" },
  "tip": { "amountMinor": 200, "currencyCode": "GHS" },
  "discount": { "amountMinor": 0, "currencyCode": "GHS" },
  "total": { "amountMinor": 6577, "currencyCode": "GHS" },
  "deliveryAddress": {...},
  "paymentMethod": {...},
  "estimatedDeliveryTime": "15 min",
  "placedAt": "2026-03-29T14:00:00Z",
  "deliveryPerson": {
    "id": "dp_1",
    "name": "Robert Fox",
    "phone": "+233201234567",
    "avatarUrl": "...",
    "rating": 4.9,
    "currentLatitude": 5.6037,
    "currentLongitude": -0.1870,
    "vehicleType": "motorcycle"
  },
  "timeline": [
    { "status": "confirmed", "timestamp": "2026-03-29T14:00:00Z", "note": "Order confirmed" },
    { "status": "preparing", "timestamp": "2026-03-29T14:02:00Z", "note": "Restaurant is preparing" },
    { "status": "on_the_way", "timestamp": "2026-03-29T14:15:00Z", "note": "Rider picked up order" }
  ]
}
```

#### `GET /v1/orders/{orderId}/tracking`
Returns current route/driver state snapshot for map bootstrap.

Response:
```json
{
  "orderId": "ord_123",
  "status": "on_the_way",
  "progressPercent": 75,
  "estimatedArrival": "2026-03-29T14:30:00Z",
  "driverLocation": {
    "latitude": 5.6037,
    "longitude": -0.1870,
    "heading": 45,
    "speed": 25
  },
  "destination": {
    "latitude": 5.6128,
    "longitude": -0.1860
  },
  "route": {
    "polyline": "encoded_polyline_string",
    "distance": 2500,
    "duration": 600
  }
}
```

#### `PATCH /v1/orders/{orderId}/status`
Updates order status (used by restaurant/driver).

Request:
```json
{
  "status": "on_the_way",
  "note": "Order picked up by rider",
  "location": {
    "latitude": 5.6037,
    "longitude": -0.1870
  }
}
```

---

### 4.7 Device Push Registration

#### `POST /v1/devices/push-token`
Request:
```json
{
  "platform": "ios",
  "provider": "fcm",
  "token": "...",
  "locale": "en-GH",
  "timezone": "Africa/Accra",
  "appVersion": "1.0.0"
}
```

Response:
```json
{
  "tokenId": "pt_...",
  "success": true
}
```

#### `DELETE /v1/devices/push-token/{tokenId}`
Unregister token on logout/uninstall.

---

### 4.8 iOS Live Activity Registration

#### `POST /v1/orders/{orderId}/live-activity/ios`
Request:
```json
{
  "activityId": "activity_abc",
  "pushToken": "apns_live_activity_push_token",
  "attributesVersion": 1
}
```
Response:
```json
{
  "success": true
}
```

#### `DELETE /v1/orders/{orderId}/live-activity/ios/{activityId}`
Ends linkage when activity ends/order completes.

---

## 5. Seller API Contracts

### 5.1 Seller Dashboard

#### `GET /v1/seller/dashboard/metrics`
Returns seller dashboard metrics.

Response:
```json
{
  "todayOrders": 24,
  "todayRevenue": { "amountMinor": 125000, "currencyCode": "GHS" },
  "pendingOrders": 5,
  "averageRating": 4.8,
  "activeOrders": 3
}
```

#### `GET /v1/seller/dashboard/recent-orders`
Returns recent orders for dashboard.

Response:
```json
{
  "orders": [
    {
      "id": "ord_1",
      "orderNumber": "#ORD-001",
      "status": "pending",
      "items": 3,
      "total": { "amountMinor": 4500, "currencyCode": "GHS" },
      "customer": "John Doe",
      "orderDate": "2026-04-01T09:30:00Z",
      "paymentMethod": "mobile_money",
      "paymentStatus": "paid"
    }
  ]
}
```

#### `GET /v1/seller/dashboard`
Returns full dashboard data (metrics + recent orders).

Response:
```json
{
  "metrics": {
    "todayOrders": 24,
    "todayRevenue": { "amountMinor": 125000, "currencyCode": "GHS" },
    "pendingOrders": 5,
    "averageRating": 4.8,
    "activeOrders": 3
  },
  "recentOrders": [...]
}
```

---

### 5.2 Seller Analytics

#### `GET /v1/seller/analytics/metrics`
Returns seller analytics metrics.

Response:
```json
{
  "totalRevenue": { "amountMinor": 1250000, "currencyCode": "GHS" },
  "totalOrders": 156,
  "averageOrderValue": { "amountMinor": 8013, "currencyCode": "GHS" },
  "averageRating": 4.8,
  "peakHour": "12:00 PM - 2:00 PM"
}
```

#### `GET /v1/seller/analytics/performance`
Returns performance by period.

Response:
```json
{
  "periods": [
    { "period": "today", "revenue": { "amountMinor": 85000, "currencyCode": "GHS" }, "orders": 12 },
    { "period": "week", "revenue": { "amountMinor": 420000, "currencyCode": "GHS" }, "orders": 58 },
    { "period": "month", "revenue": { "amountMinor": 1250000, "currencyCode": "GHS" }, "orders": 156 }
  ]
}
```

#### `GET /v1/seller/analytics/top-items`
Returns top selling items.

Response:
```json
{
  "items": [
    { "name": "Jollof Rice", "sold": 45 },
    { "name": "Banku & Tilapia", "sold": 32 },
    { "name": "Grilled Chicken", "sold": 28 }
  ]
}
```

#### `GET /v1/seller/analytics`
Returns full analytics data.

Response:
```json
{
  "metrics": {...},
  "recentPerformance": [...],
  "topSellingItems": [...]
}
```

---

### 5.3 Seller Orders

#### `GET /v1/seller/orders`
Returns all seller orders.

Response:
```json
{
  "orders": [
    {
      "id": "ord_1",
      "orderNumber": "#ORD-001",
      "status": "pending",
      "items": 3,
      "total": { "amountMinor": 8500, "currencyCode": "GHS" },
      "customer": "John Doe",
      "customerPhone": "+233 24 567 8901",
      "deliveryAddress": "123 Liberation Road, Accra",
      "orderDate": "2026-04-01T09:30:00Z",
      "estimatedDelivery": "2026-04-01T10:15:00Z",
      "paymentMethod": "mobile_money",
      "paymentStatus": "paid",
      "subtotal": { "amountMinor": 7500, "currencyCode": "GHS" },
      "deliveryFee": { "amountMinor": 1000, "currencyCode": "GHS" },
      "orderItems": [
        {
          "name": "Jollof Rice",
          "quantity": 2,
          "price": { "amountMinor": 2500, "currencyCode": "GHS" },
          "addons": [
            { "name": "Extra Pepper", "price": { "amountMinor": 50, "currencyCode": "GHS" } }
          ]
        }
      ],
      "notes": "Please make it less spicy"
    }
  ]
}
```

#### `GET /v1/seller/orders/{orderId}`
Returns single seller order details.

Response:
```json
{
  "order": {
    "id": "ord_1",
    "orderNumber": "#ORD-001",
    "status": "pending",
    "items": 3,
    "total": { "amountMinor": 8500, "currencyCode": "GHS" },
    "customer": "John Doe",
    "customerPhone": "+233 24 567 8901",
    "deliveryAddress": "123 Liberation Road, Accra",
    "orderDate": "2026-04-01T09:30:00Z",
    "estimatedDelivery": "2026-04-01T10:15:00Z",
    "paymentMethod": "mobile_money",
    "paymentStatus": "paid",
    "subtotal": { "amountMinor": 7500, "currencyCode": "GHS" },
    "deliveryFee": { "amountMinor": 1000, "currencyCode": "GHS" },
    "orderItems": [...],
    "notes": "Please make it less spicy"
  }
}
```

#### `PATCH /v1/seller/orders/{orderId}/status`
Updates order status.

Request:
```json
{
  "status": "preparing"
}
```
Response:
```json
{
  "success": true,
  "order": {...},
  "message": "Order status updated to preparing"
}
```

Valid status transitions:
- `pending` -> `preparing`
- `preparing` -> `ready`
- `ready` -> `delivered`

#### `POST /v1/seller/orders/{orderId}/accept`
Accept a pending order (sets status to preparing).

Response:
```json
{
  "success": true,
  "order": {...},
  "message": "Order accepted"
}
```

#### `POST /v1/seller/orders/{orderId}/reject`
Reject an order.

Response:
```json
{
  "success": true,
  "order": {...},
  "message": "Order rejected successfully"
}
```

#### `POST /v1/seller/orders/{orderId}/start-preparing`
Start preparing an order (sets status to preparing).

#### `POST /v1/seller/orders/{orderId}/mark-ready`
Mark order as ready (sets status to ready).

#### `POST /v1/seller/orders/{orderId}/mark-delivered`
Mark order as delivered (sets status to delivered).

---

### 5.4 Seller Menu

#### `GET /v1/seller/menu`
Returns all menu items.

Response:
```json
{
  "items": [
    {
      "id": "item_1",
      "name": "Jollof Rice",
      "description": "Classic West African jollof rice served with stew",
      "priceMinor": 2500,
      "currencyCode": "GHS",
      "category": "Main",
      "available": true,
      "dietaryTags": ["Halal"],
      "variants": [
        { "id": "v1a", "label": "Small", "priceMinor": 2000 },
        { "id": "v1b", "label": "Large", "priceMinor": 3500 }
      ],
      "extras": [
        { "id": "e1a", "label": "Extra Stew", "priceMinor": 500 }
      ],
      "images": ["https://..."]
    }
  ]
}
```

#### `POST /v1/seller/menu`
Creates a new menu item.

Request:
```json
{
  "name": "Banku & Tilapia",
  "description": "Fermented corn dough with grilled whole tilapia",
  "priceMinor": 4500,
  "category": "Main",
  "available": true,
  "dietaryTags": ["Halal", "Gluten-free"],
  "variants": [],
  "extras": [{ "id": "e2a", "label": "Extra Pepper", "priceMinor": 200 }],
  "images": ["https://..."]
}
```

#### `PATCH /v1/seller/menu/{itemId}`
Updates a menu item.

Request:
```json
{
  "name": "Updated Name",
  "priceMinor": 5000,
  "available": false
}
```

#### `DELETE /v1/seller/menu/{itemId}`
Deletes a menu item.

#### `PATCH /v1/seller/menu/{itemId}/availability`
Toggles item availability.

Request:
```json
{
  "available": true
}
```

---

## 6. Rider API Contracts

### 6.1 Rider Metrics

#### `GET /v1/rider/metrics`
Returns rider dashboard metrics.

Response:
```json
{
  "todayEarnings": { "amountMinor": 8550, "currencyCode": "GHS" },
  "todayDeliveries": 12,
  "activeDelivery": null,
  "availableDeliveries": 3,
  "totalDeliveries": 156,
  "averageRating": 4.8
}
```

### 6.2 Rider Active Delivery

#### `GET /v1/rider/active-delivery`
Returns current active delivery.

Response:
```json
{
  "id": "del_1",
  "orderId": "#ORD-001",
  "pickup": "TeincFoods Restaurant",
  "dropoff": "123 Main Street",
  "status": "picked_up",
  "earnings": { "amountMinor": 1250, "currencyCode": "GHS" },
  "currency": "GHS",
  "estimatedTime": "15 min"
}
```

### 6.3 Rider Deliveries

#### `GET /v1/rider/deliveries`
Returns all rider deliveries.

Response:
```json
{
  "deliveries": [
    {
      "id": "del_1",
      "orderId": "#ORD-001",
      "pickup": "TeincFoods Restaurant",
      "dropoff": "123 Main Street",
      "status": "picked_up",
      "earnings": { "amountMinor": 1250, "currencyCode": "GHS" },
      "currency": "GHS"
    }
  ]
}
```

#### `GET /v1/rider/deliveries/{deliveryId}`
Returns delivery detail.

Response:
```json
{
  "id": "del_1",
  "orderId": "#ORD-001",
  "status": "picked_up",
  "customer": {
    "name": "John Doe",
    "phone": "+233201234567",
    "avatar": null
  },
  "pickup": {
    "name": "TeincFoods Restaurant",
    "address": "45 Liberation Road, Accra",
    "phone": "+233201112222",
    "lat": 5.5600,
    "lng": -0.2050
  },
  "dropoff": {
    "name": "John Doe",
    "address": "123 Main Street, Accra, Ghana",
    "phone": "+233201234567",
    "lat": 5.5650,
    "lng": -0.2100,
    "notes": "Blue gate, call when you arrive"
  },
  "items": [
    { "name": "Jollof Rice", "quantity": 2, "price": { "amountMinor": 4500, "currencyCode": "GHS" } }
  ],
  "orderTotal": { "amountMinor": 13600, "currencyCode": "GHS" },
  "deliveryFee": { "amountMinor": 1250, "currencyCode": "GHS" },
  "earnings": { "amountMinor": 1250, "currencyCode": "GHS" },
  "distance": "3.2 km",
  "estimatedTime": "15 min",
  "actualTime": null,
  "acceptedAt": "2026-03-31T14:30:00",
  "pickedUpAt": "2026-03-31T14:45:00",
  "deliveredAt": null
}
```

#### `PATCH /v1/rider/deliveries/{deliveryId}/status`
Updates delivery status.

Request:
```json
{
  "status": "delivered"
}
```

Valid statuses:
- `assigned`
- `picked_up`
- `delivering`
- `delivered`

#### `POST /v1/rider/deliveries/{deliveryId}/accept`
Accept a delivery.

Response:
```json
{
  "delivery": {
    "id": "del_1",
    "orderId": "#ORD-001",
    "status": "assigned",
    ...
  }
}
```

### 6.4 Rider Earnings

#### `GET /v1/rider/earnings`
Returns rider earnings summary.

Response:
```json
{
  "today": { "amountMinor": 8550, "currencyCode": "GHS" },
  "thisWeek": { "amountMinor": 42000, "currencyCode": "GHS" },
  "thisMonth": { "amountMinor": 125000, "currencyCode": "GHS" },
  "total": { "amountMinor": 568000, "currencyCode": "GHS" },
  "pendingPayout": { "amountMinor": 32000, "currencyCode": "GHS" },
  "currency": "GHS"
}
```

#### `GET /v1/rider/earnings/breakdown`
Returns earnings breakdown.

Response:
```json
{
  "baseDeliveryFees": { "amountMinor": 38000, "currencyCode": "GHS" },
  "tipsReceived": { "amountMinor": 2500, "currencyCode": "GHS" },
  "bonuses": { "amountMinor": 1500, "currencyCode": "GHS" },
  "totalThisWeek": { "amountMinor": 42000, "currencyCode": "GHS" },
  "currency": "GHS"
}
```

#### `GET /v1/rider/transactions`
Returns recent transactions.

Response:
```json
{
  "transactions": [
    {
      "id": "txn_1",
      "orderId": "#ORD-001",
      "amount": { "amountMinor": 1250, "currencyCode": "GHS" },
      "date": "Today, 2:30 PM",
      "type": "delivery"
    },
    {
      "id": "txn_2",
      "orderId": "Bonus",
      "amount": { "amountMinor": 2500, "currencyCode": "GHS" },
      "date": "Yesterday, 5:00 PM",
      "type": "bonus"
    }
  ]
}
```

#### `POST /v1/rider/payout`
Request a payout.

Request:
```json
{
  "amount": { "amountMinor": 32000, "currencyCode": "GHS" }
}
```

Response:
```json
{
  "success": true,
  "message": "Payout of GHS 320.00 requested successfully"
}
```

### 6.5 Rider Statistics

#### `GET /v1/rider/statistics`
Returns rider statistics.

Response:
```json
{
  "totalDeliveries": 156,
  "acceptanceRate": 94,
  "averageRating": 4.8,
  "totalEarnings": { "amountMinor": 568000, "currencyCode": "GHS" }
}
```

### 6.6 Rider Vehicle

#### `GET /v1/rider/vehicle`
Returns vehicle information.

Response:
```json
{
  "type": "motorcycle",
  "plateNumber": "GR-1234-20",
  "color": "Black",
  "brand": "Honda",
  "model": "CBR 150",
  "verificationStatus": "pending"
}
```

#### `PATCH /v1/rider/vehicle`
Updates vehicle information.

Request:
```json
{
  "type": "motorcycle",
  "plateNumber": "GR-1234-20",
  "color": "Black",
  "brand": "Honda",
  "model": "CBR 150"
}
```

Response:
```json
{
  "type": "motorcycle",
  "plateNumber": "GR-1234-20",
  "color": "Black",
  "brand": "Honda",
  "model": "CBR 150",
  "verificationStatus": "pending"
}
```

#### `GET /v1/rider/vehicle-types`
Returns available vehicle types.

Response:
```json
{
  "types": [
    { "value": "motorcycle", "label": "Motorcycle" },
    { "value": "bicycle", "label": "Bicycle" },
    { "value": "scooter", "label": "Scooter" },
    { "value": "car", "label": "Car" }
  ]
}
```

### 6.7 Rider Delivery Zones

#### `GET /v1/rider/zones`
Returns delivery zones.

Response:
```json
{
  "zones": [
    {
      "id": "zone_1",
      "name": "Greater Accra",
      "enabled": true,
      "radius": "15 km",
      "deliveries": 45,
      "latitude": 5.5600,
      "longitude": -0.2050
    }
  ]
}
```

#### `PUT /v1/rider/zones`
Updates delivery zones.

Request:
```json
{
  "zones": [
    {
      "id": "zone_1",
      "name": "Greater Accra",
      "enabled": true,
      "radius": "15 km"
    }
  ]
}
```

#### `PATCH /v1/rider/zones/{zoneId}`
Toggles zone enabled status.

Request:
```json
{
  "enabled": true
}
```

Response:
```json
{
  "id": "zone_1",
  "name": "Greater Accra",
  "enabled": true,
  "radius": "15 km",
  "deliveries": 45,
  "latitude": 5.5600,
  "longitude": -0.2050
}
```

### 6.8 Rider Navigation Settings

#### `GET /v1/rider/navigation-settings`
Returns navigation settings.

Response:
```json
{
  "selectedApp": "google_maps",
  "autoStart": true,
  "avoidTolls": false,
  "avoidHighways": false
}
```

#### `PATCH /v1/rider/navigation-settings`
Updates navigation settings.

Request:
```json
{
  "selectedApp": "google_maps",
  "autoStart": true,
  "avoidTolls": true,
  "avoidHighways": false
}
```

#### `GET /v1/rider/navigation-apps`
Returns available navigation apps.

Response:
```json
{
  "apps": [
    {
      "id": "google_maps",
      "name": "Google Maps",
      "description": "Most popular navigation app",
      "icon": "🗺️",
      "installed": true
    },
    {
      "id": "apple_maps",
      "name": "Apple Maps",
      "description": "Built-in iOS navigation",
      "icon": "🍎",
      "installed": true
    },
    {
      "id": "waze",
      "name": "Waze",
      "description": "Community-based traffic alerts",
      "icon": "🚗",
      "installed": false
    }
  ]
}
```

### 6.9 Rider Online Status

#### `POST /v1/rider/online-status`
Updates rider online status.

Request:
```json
{
  "isOnline": true
}
```

Response:
```json
{
  "success": true
}
```

---

## 7. Fleet API Contracts

### 7.1 Fleet Profile

#### `GET /v1/fleet`
Returns fleet manager profile.

Response:
```json
{
  "id": "fleet_1",
  "code": "FLEET-SD-001",
  "userId": "usr_1",
  "companyName": "Speedy Deliveries Ltd",
  "contactPersonName": "Kwame Asante",
  "contactEmail": "kwame@speedydeliveries.com",
  "contactPhone": "+233 20 987 6543",
  "licenseNumber": "LIC-2025-001",
  "description": "Fast and reliable delivery services across Accra",
  "totalVehicles": 5,
  "activeRiders": 3,
  "status": "active",
  "commissionRate": 15,
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2026-03-15T14:30:00Z"
}
```

#### `PATCH /v1/fleet`
Updates fleet profile.

Request:
```json
{
  "companyName": "Updated Name",
  "contactPhone": "+233 20 000 0000"
}
```

### 7.2 Fleet Dashboard

#### `GET /v1/fleet/dashboard`
Returns fleet dashboard metrics.

Response:
```json
{
  "fleetId": "fleet_1",
  "companyName": "Speedy Deliveries Ltd",
  "code": "FLEET-SD-001",
  "totalRiders": 3,
  "onlineRiders": 2,
  "offlineRiders": 1,
  "totalVehicles": 4,
  "assignedVehicles": 2,
  "availableVehicles": 1,
  "todayDeliveries": 18,
  "todayEarnings": { "amountMinor": 27000, "currencyCode": "GHS" },
  "weekDeliveries": 124,
  "weekEarnings": { "amountMinor": 186000, "currencyCode": "GHS" },
  "monthDeliveries": 456,
  "monthEarnings": { "amountMinor": 684000, "currencyCode": "GHS" },
  "activeDeliveries": 3
}
```

### 7.3 Fleet Earnings

#### `GET /v1/fleet/earnings?period=week`
Returns fleet earnings.

Response:
```json
{
  "fleetId": "fleet_1",
  "period": "week",
  "startDate": "2026-03-27",
  "endDate": "2026-04-02",
  "totalEarnings": { "amountMinor": 186000, "currencyCode": "GHS" },
  "totalDeliveries": 124,
  "fleetCommission": { "amountMinor": 27900, "currencyCode": "GHS" },
  "riderPayouts": { "amountMinor": 158100, "currencyCode": "GHS" },
  "averagePerDelivery": { "amountMinor": 1500, "currencyCode": "GHS" },
  "topRiders": [
    { "riderId": "rider_1", "riderName": "John Mensah", "deliveries": 68, "earnings": { "amountMinor": 102000, "currencyCode": "GHS" } }
  ]
}
```

### 7.4 Fleet Vehicles

#### `GET /v1/fleet/vehicles`
Returns all fleet vehicles.

Response:
```json
{
  "vehicles": [
    {
      "id": "vehicle_1",
      "fleetId": "fleet_1",
      "vehicleType": "motorcycle",
      "plateNumber": "GR-1234-20",
      "model": "Honda CB125F",
      "brand": "Honda",
      "color": "Red",
      "year": 2023,
      "isActive": true,
      "assignedRiderId": "rider_1",
      "assignedRiderName": "John Mensah",
      "insuranceExpiryDate": "2026-12-31",
      "createdAt": "2025-06-01T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### `GET /v1/fleet/vehicles/{vehicleId}`
Returns single vehicle.

#### `POST /v1/fleet/vehicles`
Adds a new vehicle.

Request:
```json
{
  "vehicleType": "motorcycle",
  "plateNumber": "GR-5678-21",
  "model": "Yamaha YBR125",
  "brand": "Yamaha",
  "color": "Blue",
  "year": 2024,
  "insuranceExpiryDate": "2026-06-30"
}
```

#### `PATCH /v1/fleet/vehicles/{vehicleId}`
Updates a vehicle.

#### `POST /v1/fleet/vehicles/{vehicleId}/assign-rider`
Assigns a rider to a vehicle.

Request:
```json
{
  "riderId": "rider_1"
}
```

### 7.5 Fleet Riders

#### `GET /v1/fleet/riders`
Returns all fleet riders.

Response:
```json
{
  "riders": [
    {
      "id": "fleet_rider_1",
      "fleetId": "fleet_1",
      "riderId": "rider_1",
      "riderName": "John Mensah",
      "riderEmail": "john@fleet.com",
      "riderPhone": "+233 20 111 2222",
      "riderAvatarUrl": "https://...",
      "vehicleId": "vehicle_1",
      "vehiclePlateNumber": "GR-1234-20",
      "vehicleType": "motorcycle",
      "status": "active",
      "totalDeliveries": 245,
      "totalEarnings": { "amountMinor": 367500, "currencyCode": "GHS" },
      "rating": 4.8,
      "joinedAt": "2025-06-15T10:00:00Z",
      "lastActiveAt": "2026-04-02T14:30:00Z"
    }
  ]
}
```

#### `GET /v1/fleet/riders/{riderId}`
Returns single rider.

#### `POST /v1/fleet/riders/invite`
Invites a rider to the fleet.

Request:
```json
{
  "fullName": "New Rider",
  "email": "newrider@fleet.com",
  "phone": "+233 20 000 0000",
  "vehicleId": "vehicle_1"
}
```

#### `PATCH /v1/fleet/riders/{riderId}/status`
Updates rider status.

Request:
```json
{
  "status": "active"
}
```

Valid statuses:
- `active`
- `inactive`
- `suspended`

---

## 8. WebSocket Contract (Chats)

Endpoint:
- `wss://api.teincfoods.com/v1/ws?token=<accessToken>`

Connection lifecycle:
- Client sends `hello` with last seen sequence (optional).
- Server responds `hello_ack`.
- Ping/pong heartbeat every 20–30s.
- Resume from `lastSequence` on reconnect.

Client -> Server events:
- `chat.send`
- `chat.typing`
- `chat.read`
- `order.subscribe` (subscribe to order updates)
- `order.unsubscribe` (unsubscribe from order updates)

Server -> Client events:
- `chat.message`
- `chat.ack`
- `chat.delivered`
- `chat.read`
- `chat.presence`
- `order.status.updated` (order status change)
- `order.eta.updated` (ETA change)
- `order.driver.location` (driver location update)

Message envelope:
```json
{
  "eventId": "evt_...",
  "type": "chat.message",
  "sequence": 901,
  "occurredAt": "2026-03-29T14:12:10Z",
  "chatId": "chat_1",
  "payload": {
    "messageId": "msg_1",
    "senderId": "usr_1",
    "text": "Hi"
  }
}
```

Order status update envelope:
```json
{
  "eventId": "evt_...",
  "type": "order.status.updated",
  "sequence": 1205,
  "occurredAt": "2026-03-29T14:15:00Z",
  "orderId": "ord_123",
  "payload": {
    "status": "on_the_way",
    "previousStatus": "preparing",
    "progressPercent": 75,
    "estimatedArrival": "2026-03-29T14:30:00Z",
    "driverLocation": {
      "latitude": 5.6037,
      "longitude": -0.1870,
      "heading": 45,
      "speed": 25
    },
    "note": "Order picked up by rider"
  }
}
```

Driver location update envelope:
```json
{
  "eventId": "evt_...",
  "type": "order.driver.location",
  "sequence": 1206,
  "occurredAt": "2026-03-29T14:16:00Z",
  "orderId": "ord_123",
  "payload": {
    "driverId": "dp_1",
    "latitude": 5.6040,
    "longitude": -0.1865,
    "heading": 50,
    "speed": 30,
    "timestamp": "2026-03-29T14:16:00Z"
  }
}
```

---

## 9. SSE Contract (In-App Notifications Stream)

Endpoint:
- `GET /v1/notifications/stream`
- Headers:
  - `Authorization: Bearer <accessToken>`
  - `Accept: text/event-stream`
  - optional `Last-Event-ID`

Server behavior:
- Emits `id`, `event`, `data` frames
- Keepalive comment every 20–30s
- Supports resume by `Last-Event-ID`

Supported event types:
- `notification.created`
- `order.status.updated`
- `order.eta.updated`
- `promo.created`
- `system.announcement`

Example SSE frame:
```text
id: evt_01J...
event: order.status.updated
data: {"eventId":"evt_01J...","sequence":4821,"orderId":"ord_123","payload":{"status":"on_the_way","etaEpoch":1711700000}}
```

---

## 10. Push Contract

### 10.1 Android (FCM + local rendering)
Backend sends FCM data message:
```json
{
  "type": "order.live_update",
  "orderId": "ord_123",
  "status": "on_the_way",
  "progressPercent": 70,
  "etaEpoch": 1711700000,
  "actions": [
    { "id": "call_rider", "label": "Call Rider", "deeplink": "teincfoods://track/ord_123?action=call" }
  ]
}
```
Client updates ongoing notification (progress/chronometer/actions) via Notifee.

### 10.2 iOS standard notifications
FCM path allowed for normal alert notifications.

### 10.3 iOS Live Activities
Backend uses APNs ActivityKit push to registered Live Activity tokens for order updates.
Payload includes:
- status text
- progress/ETA
- stale date
- relevance score
- timestamp

---

## 11. Error Model
Standard REST error body:
```json
{
  "code": "AUTH_REQUIRED",
  "message": "Authentication required",
  "requestId": "req_..."
}
```

Common codes:
- `AUTH_REQUIRED` (401)
- `FORBIDDEN` (403)
- `REGION_UNAVAILABLE` (409)
- `VALIDATION_ERROR` (422)
- `RATE_LIMITED` (429)
- `IDEMPOTENCY_CONFLICT` (409)
- `NOT_FOUND` (404)
- `ORDER_STATUS_INVALID` (422)
- `VEHICLE_NOT_VERIFIED` (422)

---

## 12. Acceptance Criteria
- Frontend can operate all flows without undocumented fields.
- Region/currency remain consistent across session and responses.
- Chat supports reconnect/resume without message loss.
- SSE resumes with `Last-Event-ID` and de-dups by `eventId`.
- Android live notifications update from FCM data pushes.
- iOS Live Activities update from APNs and end correctly on completion.
- All money fields use `amountMinor` (integer) with `currencyCode`.

---

## 13. Test Plan
- Contract validation tests for all REST response/request schemas.
- WS integration tests for connect/resume/ack/read.
- SSE integration tests for resume (`Last-Event-ID`) and keepalive.
- Push payload schema validation for Android FCM and iOS APNs Live Activity payloads.
- End-to-end order tracking test across REST bootstrap + SSE + push + WS chat.
- Seller dashboard and analytics endpoint tests.
- Rider deliveries, earnings, and vehicle management tests.
- Fleet management endpoint tests.

---

## 14. Assumptions
- iOS Live Activity updates will use direct APNs channel (recommended).
- FCM remains the primary provider for Android and standard iOS push.
- SSE is intentionally scoped to foreground in-app events.
- All prices are stored and transmitted in minor units (cents/pesewas).
- Region/currency is determined server-side and included in all price responses.