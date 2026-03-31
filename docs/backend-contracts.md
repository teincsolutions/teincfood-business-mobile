# TeincFoods Buyer Backend Contracts & Realtime Architecture

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

## 4.1 Bootstrap / Session Context

### `GET /v1/bootstrap`
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

## 4.2 Auth / Account

### `POST /v1/auth/signup`
Request:
```json
{
  "username": "ericm",
  "email": "user@example.com",
  "password": "strong_password",
  "fullName": "Eric Mensah",
  "phone": "+233..."
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

### `POST /v1/auth/login`
Supports email/password (and optional phone OTP flow if enabled).

### `POST /v1/auth/refresh`
Returns rotated token pair.

### `POST /v1/auth/logout`
Invalidates refresh session/device session.

---

## 4.3 Location / Address

### `POST /v1/users/me/location`
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
Behavior:
- Persists active location context
- Updates region derivation for subsequent catalog/pricing

### `GET /v1/users/me/addresses`
### `POST /v1/users/me/addresses`
### `PATCH /v1/users/me/addresses/{addressId}`
### `DELETE /v

---

## 4.4 Catalog / Food Details (Variants + Extras)

### `GET /v1/catalog/foods/{foodId}`
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

## 4.5 Promo Codes

### `POST /v1/promo/validate`
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

## 4.6 Orders / Tracking

### `POST /v1/orders`
Creates order with selected variant/extras and returns server-calculated totals.

### `GET /v1/orders/{orderId}`
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

### `GET /v1/orders/{orderId}/tracking`
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

### `PATCH /v1/orders/{orderId}/status`
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

## 4.7 Device Push Registration

### `POST /v1/devices/push-token`
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

### `DELETE /v1/devices/push-token/{tokenId}`
Unregister token on logout/uninstall.

---

## 4.8 iOS Live Activity Registration

### `POST /v1/orders/{orderId}/live-activity/ios`
Request:
```json
{
  "activityId": "activity_abc",
  "pushToken": "apns_live_activity_push_token",
  "attributesVersion": 1
}
```
Behavior:
- Backend stores activity push token linkage per order.

### `DELETE /v1/orders/{orderId}/live-activity/ios/{activityId}`
Ends linkage when activity ends/order completes.

---

## 5. WebSocket Contract (Chats)

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

## 6. SSE Contract (In-App Notifications Stream)

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

## 7. Push Contract

## 7.1 Android (FCM + local rendering)
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

## 7.2 iOS standard notifications
FCM path allowed for normal alert notifications.

## 7.3 iOS Live Activities
Backend uses APNs ActivityKit push to registered Live Activity tokens for order updates.
Payload includes:
- status text
- progress/ETA
- stale date
- relevance score
- timestamp

---

## 8. Why SSE Is Not Primary for Live Activities / Live Progress
SSE is excellent for foreground in-app streams but not sufficient as primary transport for:
- iOS Live Activities updates (needs APNs ActivityKit channel)
- reliable background/terminated delivery updates on mobile

Therefore:
- SSE = foreground in-app stream
- Push = background/live surfaces
- WS = chat

---

## 9. Error Model
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

---

## 10. Acceptance Criteria
- Frontend can operate all flows without undocumented fields.
- Region/currency remain consistent across session and responses.
- Chat supports reconnect/resume without message loss.
- SSE resumes with `Last-Event-ID` and de-dups by `eventId`.
- Android live notifications update from FCM data pushes.
- iOS Live Activities update from APNs and end correctly on completion.

---

## 11. Test Plan
- Contract validation tests for all REST response/request schemas.
- WS integration tests for connect/resume/ack/read.
- SSE integration tests for resume (`Last-Event-ID`) and keepalive.
- Push payload schema validation for Android FCM and iOS APNs Live Activity payloads.
- End-to-end order tracking test across REST bootstrap + SSE + push + WS chat.

---

## 12. Assumptions
- iOS Live Activity updates will use direct APNs channel (recommended).
- FCM remains the primary provider for Android and standard iOS push.
- SSE is intentionally scoped to foreground in-app events.
