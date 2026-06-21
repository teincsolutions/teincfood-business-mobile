# Live Location Tracking & Rider Map Plan

## Overview
Implement real-time rider location tracking via WebSocket, update OpenAPI docs, and build a Google Maps rider map screen with route polylines using the existing directions endpoint.

---

## Part A: Backend — WebSocket Location Channel

### A1: Create LocationChannel
- [ ] Create `lib/teinc_food_backend_web/channels/location_channel.ex`
  - Topic: `location:rider:{rider_id}`
  - `join/3`: authorizes rider (can publish) or observers (merchants/fleet with active delivery — can watch)
  - `handle_in("update", %{lat, lng})`: rider pushes location, calls `Dispatch.update_rider_location`, `broadcast!` to all subscribers
  - Subscribers receive `"location"` event with `{rider_id, lat, lng}`

### A2: Register channel in UserSocket
- [ ] Modify `lib/teinc_food_backend_web/channels/user_socket.ex`
  - Add `channel("location:*", TeincFoodBackendWeb.LocationChannel)`

### A3: Update OpenAPI docs
- [ ] Modify `lib/teinc_food_backend_web/openapi.ex`
  - Add `Location Channel` section to WebSocket docs in `info.description`:
    - `phx_join` — client→server, join location:rider:{rider_id}
    - `update` — client→server, `{lat, lng}`, rider pushes GPS
    - `location` — server→client, `{rider_id, lat, lng}`, broadcast to subscribers
  - Add `rider.location_updated` to Events Channel table (already emitted by dispatch.ex)

---

## Part B: Frontend — Live Location Tracking

### B1: Create useRiderLocationTracking hook
- [ ] Create `src/hooks/useRiderLocationTracking.ts`
  - Uses `expo-location` `watchPositionAsync` (Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000)
  - Joins `location:rider:{id}` WebSocket channel via `phoenixSocket.joinChannel()`
  - Pushes `{lat, lng}` via `phoenixSocket.pushWithReply()` on each GPS update
  - Only active when rider status is `available` or `busy`
  - Fallback to REST `POST /riders/location` if WebSocket disconnected
  - Cleans up: removes watcher, leaves channel on unmount

### B2: Wire into rider home screen
- [ ] Modify `app/(rider)/(drawer)/home/index.tsx`
  - Import and call `useRiderLocationTracking(riderProfile?.id, riderStatus !== 'offline')`

### B3: Listen for rider.location_updated events
- [ ] Modify `src/services/order-events.service.ts`
  - Add `'rider.location_updated'` to `ORDER_RELATED_EVENTS` array

---

## Part C: Frontend — Rider Map Screen

### C1: Rewrite map screen with Google Maps
- [ ] Rewrite `app/(rider)/map/index.tsx`
  - Import `MapView`, `Marker`, `PROVIDER_GOOGLE`, `Polyline` from `react-native-maps`
  - Import `polyline` npm package for decoding encoded polyline strings
  - Import `useCurrentLocation` for initial region
  - Import `useRiderProfileQuery` for rider's current lat/lng
  - Import `useRiderDeliveriesQuery` for active deliveries
  - Import `getDirectionsPolyline` from `@/services/directions.service`
  - Import `useRiderLocationTracking` for live location pushes

### C2: Map layout
- [ ] Full-screen `MapView` with `PROVIDER_GOOGLE`, `showsUserLocation`, `showsMyLocationButton`
- [ ] Initial region from rider's `current_lat/lng` or default to Accra
- [ ] Top header overlay with Back button + "Live Map" title
- [ ] Bottom card overlay for selected delivery details

### C3: Markers
- [ ] Pickup markers (restaurants) — green `Marker` with MapPin icon for each active delivery
- [ ] Dropoff markers (customers) — red `Marker` for each active delivery
- [ ] On marker press: set selected delivery, show bottom card

### C4: Route polyline
- [ ] When a delivery is selected, call `getDirectionsPolyline({orderId, origin: pickup, destination: dropoff})`
- [ ] Decode encoded polyline string via `polyline` npm package → coordinate array
- [ ] Render `Polyline` on MapView with stroke color/width
- [ ] The 50m deviation threshold is already built into `directions.service.ts` — re-fetches only if rider moved >50m

### C5: Live marker updates
- [ ] Listen for `"location"` events on current `location:rider:{id}` channel
- [ ] Update rider marker position in real-time
- [ ] Optionally re-call `getDirectionsPolyline` if deviation exceeds threshold

### C6: Bottom delivery card
- [ ] Show pickup/dropoff addresses
- [ ] ETA display
- [ ] Call, Message, Details buttons
- [ ] Close button

---

## Testing & Verification
- [ ] `mix compile --force --no-deps-check` — 0 errors
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] WebSocket server starts without errors
- [ ] Rider can join `location:rider:{id}` channel
- [ ] GPS updates push via WebSocket every 5-10s
- [ ] Map shows markers + polyline
- [ ] 50m deviation threshold prevents excessive route re-requests

---

## File Change Summary

| File | Action |
|------|--------|
| `lib/teinc_food_backend_web/channels/location_channel.ex` | **Create** |
| `lib/teinc_food_backend_web/channels/user_socket.ex` | **Modify** — register `location:*` |
| `lib/teinc_food_backend_web/openapi.ex` | **Modify** — add location channel + event docs |
| `src/hooks/useRiderLocationTracking.ts` | **Create** |
| `src/services/order-events.service.ts` | **Modify** — add `rider.location_updated` |
| `app/(rider)/(drawer)/home/index.tsx` | **Modify** — wire tracking hook |
| `app/(rider)/map/index.tsx` | **Rewrite** — Google Maps, markers, polylines |
