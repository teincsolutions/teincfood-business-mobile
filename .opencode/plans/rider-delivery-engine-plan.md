# Delivery Engine, Monitoring & Outstanding Gaps Plan

## Ground Rules

- **OpenAPI docs must stay in sync** — every new/modified backend endpoint must be added to `lib/teinc_food_backend_web/openapi.ex`. Run `mix openapi.spec` after changes to verify.
- **Dashboard stats come from backend** — every number/label on a dashboard must be fetched via a query hook. No hardcoded defaults, no client-side derivation from partial data.

---

## Step 1: Fix Frontend Delivery Bugs

### 1a. Fix action mapping on delivery detail screen

- [ ] `app/(rider)/deliveries/[id].tsx` — `handleStatusUpdate("picked_up")` → `handleStatusUpdate("confirm-pickup")`
- [ ] `app/(rider)/deliveries/[id].tsx` — `handleStatusUpdate("delivering")` → `handleStatusUpdate("in-transit")`

### 1b. Add earnings/currency to delivery serializer

- [ ] Backend `rider_controller.ex` — add `earnings_minor` and `currency` to `serialize_delivery/1`
- [ ] Frontend `RiderDelivery` type — add `earnings_minor: number | null` field

### 1c. Fix deliveries list to use real fields

- [ ] `app/(rider)/(drawer)/deliveries/index.tsx` — replace `delivery.earnings` with `delivery.earnings_minor / 100`
- [ ] Use real `delivery.currency` field from the API instead of defaulting to "GHS"

---

## Step 2: Backend — Dashboard Stats Endpoints

Every dashboard currently shows hardcoded defaults or fetches from the wrong endpoint. Create dedicated dashboard endpoints for each role.

### 2a. Rider dashboard endpoint

- [ ] Backend — Create `GET /riders/dashboard` returning live stats:

  ```json
  {
    "data": {
      "today_earnings_minor": 45000,
      "today_deliveries": 5,
      "available_deliveries": 3,
      "total_deliveries": 128,
      "status": "available"
    }
  }
  ```

  - `today_earnings_minor` — sum of earnings from today's completed deliveries (from financial ledger)
  - `today_deliveries` — count of today's deliveries
  - `available_deliveries` — count of `:ready` orders without active delivery (reuse `Orders.list_available_for_rider` count)
  - `total_deliveries` — lifetime delivery count for this rider

- [ ] Backend — Wire into `rider_controller.ex` with proper auth
- [ ] Backend — Update OpenAPI docs

### 2b. Seller dashboard endpoint

- [ ] Backend — Create `GET /businesses/:id/dashboard` returning:

  ```json
  {
    "data": {
      "metrics": {
        "today_orders": 12,
        "today_revenue_minor": 45000,
        "pending_orders": 3,
        "active_orders": 5,
        "average_rating": 4.5
      },
      "recent_orders": [...]
    }
  }
  ```

  - `today_orders` — count of orders placed today for this business
  - `today_revenue_minor` — sum of completed order totals today
  - `pending_orders` — count of `:pending` status orders
  - `active_orders` — count of `:accepted` / `:preparing` / `:ready` orders
  - `average_rating` — average of ratings (from reviews table or placeholder)
  - `recent_orders` — last 5 orders with basic info

- [ ] Backend — Wire into `business_controller.ex`
- [ ] Backend — Update OpenAPI docs

### 2c. Fleet dashboard endpoint

- [ ] Backend — Create `GET /businesses/:id/fleet/dashboard` returning:

  ```json
  {
    "data": {
      "today_earnings_minor": 85000,
      "week_earnings_minor": 520000,
      "month_earnings_minor": 1850000,
      "active_deliveries": 7,
      "total_riders": 15,
      "online_riders": 8,
      "total_vehicles": 12,
      "assigned_vehicles": 10
    }
  }
  ```

  - Derived from summing rider earnings + aggregating rider/vehicle statuses for this business

- [ ] Backend — Wire into `business_controller.ex` or new `fleet_controller.ex`
- [ ] Backend — Update OpenAPI docs

### 2d. Wire frontend hooks to new endpoints

- [ ] `rider.service.ts` — add `fetchRiderDashboard()` calling `GET /riders/dashboard`
- [ ] `useRider.ts` — update `useRiderMetricsQuery` to use `fetchRiderDashboard` instead of `fetchRiderProfile`
- [ ] `seller-dashboard.service.ts` — replace `GET /orders` with `GET /businesses/:id/dashboard`
- [ ] `seller-dashboard.hooks.ts` — update `useSellerDashboardQuery` to pass `activeBusinessId`
- [ ] `useFleet.ts` — add `useFleetDashboardQuery` that calls `GET /businesses/:id/fleet/dashboard`
- [ ] `fleet.service.ts` — add `fetchFleetDashboard(businessId)`

---

## Step 3: Backend — Pickup Timeout Worker (15 min)

### 3a. Create worker

- [ ] Create `lib/teinc_food_backend/workers/delivery_pickup_timeout_worker.ex`
  - Oban worker in `:dispatch` queue, `max_attempts: 3`
  - Checks if delivery status is still `:assigned` after 15 minutes
  - If timed out:
    - Updates delivery status to `:failed` (reason: `"rider_pickup_timeout"`)
    - Sets rider status back to `:available`
    - Keeps order at `:ready` (reappears in available-orders for other riders)
    - Notifies merchant: "Rider didn't pick up — order available for reassignment"
    - Notifies rider: "Pickup timeout — delivery reassigned"
    - Emits `delivery.rider_timeout` event to `events:deliveries`

### 3b. Schedule on delivery creation

- [ ] `dispatch.ex` — in `create_delivery` / `claim_delivery`, after delivery creation:
  ```elixir
  timeout_at = DateTime.add(DateTime.utc_now(), @pickup_timeout_minutes * 60, :second)
  %{delivery_id: delivery.id}
  |> DeliveryPickupTimeoutWorker.new(scheduled_at: timeout_at)
  |> Oban.insert()
  ```
- [ ] Add `@pickup_timeout_minutes 15` config constant

### 3c. Cancel on pickup confirmation

- [ ] `dispatch.ex` — in `confirm_pickup_by_rider` / `confirm_handover_by_merchant`:
  - Cancel timeout job when both rider + merchant have confirmed OR delivery transitions out of `:assigned`
- [ ] Add `cancel_pickup_timeout_job(delivery_id)` helper

---

## Step 4: Backend — Order Availability Expiry (two-stage)

### 4a. Modify existing rider claim timeout worker

- [ ] `delivery_rider_claim_timeout_worker.ex` — currently only notifies merchant after 5 min with no claim
- [ ] Add audit log entry and keep order at `:ready` for merchant manual assignment
- [ ] Emit `order.claim_window_expired` event for frontend visibility

### 4b. Create auto-cancel expiry worker (30 min)

- [ ] Create `lib/teinc_food_backend/workers/order_auto_expiry_worker.ex`
  - Fires 30 min after order becomes `:ready`
  - If no active delivery exists (`:assigned`, `:picked_up`, `:en_route`, `:arrived`):
    - Cancel the order (status → `:cancelled`)
    - Calculate payment processing fee:
      - Read `payment_mode` — if `:prepaid`, calculate fee
      - Fee = `total_minor * @payment_processing_rate + @payment_processing_fixed`
      - Deduct from refund: refund customer `total_minor - fee`
      - Charge merchant: debit merchant account for the fee (double-entry via Financial context)
    - Notify merchant: "Order auto-cancelled — no rider assigned. Fee: X"
    - Notify customer: "Order cancelled — refund of Y issued (Z fee deducted)"
    - Emit `order.auto_cancelled` event
    - Log audit trail

### 4c. Configure expiry constants

- [ ] Add to `orders.ex`:
  - `@order_availability_notify_minutes 15` — first stage: notify merchant
  - `@order_availability_expiry_minutes 30` — second stage: auto-cancel
- [ ] Add payment fee config:
  - `@payment_processing_rate 0.015` (1.5%)
  - `@payment_processing_fixed 100` (GHS 1.00 in minor units)

### 4d. Schedule and cancel hooks

- [ ] `orders.ex` — in `handle_preparation_sla_transition` for `{:preparing, :ready}`:
  - Schedule notify worker at 15 min
  - Schedule auto-cancel worker at 30 min
- [ ] Cancel both jobs if delivery gets created for the order
- [ ] Update OpenAPI docs if any new events are documented

---

## Step 5: Backend — Monitoring & Analytics Engine

### 5a. Database migrations

- [ ] **Migration 1:** `create_rider_metrics`

  ```sql
  CREATE TABLE rider_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES riders(id),
    period DATE NOT NULL,
    total_deliveries INT DEFAULT 0,
    completed_deliveries INT DEFAULT 0,
    failed_deliveries INT DEFAULT 0,
    timeout_deliveries INT DEFAULT 0,
    avg_pickup_time_seconds FLOAT,
    avg_delivery_time_seconds FLOAT,
    avg_total_time_seconds FLOAT,
    on_time_count INT DEFAULT 0,
    late_count INT DEFAULT 0,
    total_earnings_minor BIGINT DEFAULT 0,
    total_distance_meters FLOAT DEFAULT 0,
    avg_rating FLOAT,
    acceptance_count INT DEFAULT 0,
    inserted_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  CREATE UNIQUE INDEX idx_rider_metrics_period ON rider_metrics(rider_id, period);
  ```

- [ ] **Migration 2:** `create_business_metrics`

  ```sql
  CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    period DATE NOT NULL,
    total_orders INT DEFAULT 0,
    accepted_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,
    avg_preparation_time_seconds FLOAT,
    avg_confirmation_time_seconds FLOAT,
    on_time_preparation_count INT DEFAULT 0,
    late_preparation_count INT DEFAULT 0,
    total_revenue_minor BIGINT DEFAULT 0,
    total_refunds_minor BIGINT DEFAULT 0,
    inserted_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  CREATE UNIQUE INDEX idx_business_metrics_period ON business_metrics(business_id, period);
  ```

- [ ] **Migration 3:** `create_eta_models`
  ```sql
  CREATE TABLE eta_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type VARCHAR(20) NOT NULL,
    avg_speed_kmh FLOAT NOT NULL,
    stddev_speed_kmh FLOAT,
    sample_size INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
  );
  CREATE UNIQUE INDEX idx_eta_models_vehicle ON eta_models(vehicle_type);
  ```

### 5b. New Metrics context

- [ ] Create `lib/teinc_food_backend/metrics/metrics.ex` with:
  - `calculate_rider_metrics(rider_id, date)` — computes from `order_status_history` + deliveries
  - `calculate_all_rider_metrics(date)` — processes all riders
  - `calculate_business_metrics(business_id, date)` — computes from order status transitions
  - `calculate_all_business_metrics(date)` — processes all businesses
  - `update_eta_models()` — recalculates avg_speed_kmh per vehicle type from completed deliveries

### 5c. Metrics Oban workers

- [ ] **Worker 1:** `MetricsAggregationWorker`
  - Oban crontab: every 15 min
  - Tracks `last_processed_event_id` to only process new events
  - Calls `Metrics.calculate_all_rider_metrics(today)` and `Metrics.calculate_all_business_metrics(today)`
- [ ] **Worker 2:** `EtaModelWorker`
  - Oban crontab: hourly
  - Reads last 7 days of completed deliveries with known distance + duration
  - Calls `Metrics.update_eta_models()`
  - Fallback to 20 km/h if no data
- [ ] Update OpenAPI docs if these workers publish new events

### 5d. Metrics API endpoints

- [ ] `rider_controller.ex`:
  - `GET /riders/leaderboard` → top riders ranked by `(completion_rate * 0.5 + speed_score * 0.5)`
- [ ] `business_controller.ex`:
  - `GET /businesses/leaderboard` → top businesses ranked by prep time + reliability
- [ ] `dispatch_controller.ex` or new `metrics_controller.ex`:
  - `GET /metrics/eta` → current `eta_models` for all vehicle types
- [ ] Update OpenAPI docs for all new endpoints

### 5e. ETA integration

- [ ] `dispatch.ex` `update_rider_location/3` — replace hardcoded 20 km/h with `avg_speed_kmh` from `eta_models` for rider's vehicle type
- [ ] Fallback to 20 km/h if no model data

---

## Step 6: Backend — Fleet & Seller Screen Connection

### 6a. Wire fleet riders screen

- [ ] `app/(fleet)/(drawer)/riders/index.tsx` — replace `useFleetStore` with `useFleetRidersQuery`
  - Import `useFleetRidersQuery` (already exists in `src/hooks/useFleet.ts`)
  - Use real data instead of `store.riders`
  - Add `RefreshControl`, `FlatList`, loading/error states
- [ ] `app/(fleet)/riders/[id].tsx` — connect to `useFleetRiderDetailQuery` (create if needed)

### 6b. Wire fleet vehicles screen

- [ ] `app/(fleet)/(drawer)/vehicles/index.tsx` — replace `useFleetStore` with `useFleetVehiclesQuery`
  - Import `useFleetVehiclesQuery` (already exists in `src/hooks/useFleet.ts`)
  - Use real data instead of `store.vehicles`
- [ ] `app/(fleet)/vehicles/[id].tsx` — connect to vehicle detail endpoint

### 6c. Wire fleet earnings screen

- [ ] `app/(fleet)/(drawer)/earnings/index.tsx` — replace `useFleetStore` with:
  - `useFleetEarningsQuery` — `GET /businesses/:id/earnings` (check backend or derive from rider earnings)
  - `useWalletHistoryQuery` — for transaction history

### 6d. Wire fleet dashboard

- [ ] `app/(fleet)/(drawer)/dashboard/index.tsx` — replace `useFleetStore` with:
  - `useFleetDashboardQuery()` (created in Step 2c-d)
  - `useFleetRidersQuery()` and `useFleetVehiclesQuery()` for rider/vehicle lists
  - Remove reads from `useFleetStore().dashboard`

### 6e. Clean fleet store

- [ ] `fleet.store.ts` — remove mock default data, initialize as empty
  - `riders: []`, `vehicles: []`, `dashboard: null`
  - Store becomes cache layer populated by query hooks

### 6f. Wire seller payment settings

- [ ] `app/(seller)/settings/payment-settings.tsx` — connect to:
  - `GET /businesses/:id/payment-settings` (or bank account info — check backend)
  - Save via `PUT /businesses/:id/payment-settings`
  - Use `useMutation` with `onSuccess` toast

### 6g. Wire seller delivery settings

- [ ] `app/(seller)/settings/delivery-settings.tsx` — connect to:
  - `GET /businesses/:id/delivery-zones` or delivery config
  - Save via `PUT /businesses/:id/delivery-zones`
  - Use real hooks

### 6h. Wire notification toggle in seller settings

- [ ] `app/(seller)/(drawer)/settings/index.tsx` — connect "Order Notifications" switch to:
  - `PATCH /notification-preferences` (service already exists)
  - Use `useNotificationPreferences` hook

### 6i. Wire KYC / documents screen

- [ ] `app/(shared)/profile/documents.tsx` — connect to:
  - File upload endpoint (check backend for upload support)
  - Use status polling for document verification status
  - Replace local state with real query + mutation hooks

---

## Delivery Order

| Order | Step      | Files                                | What's delivered                                     |
| ----- | --------- | ------------------------------------ | ---------------------------------------------------- |
| 1     | Step 1    | 3 frontend, 1 backend                | Active delivery visible, actions work                |
| 2     | Step 2    | 3 backend endpoints + frontend hooks | All dashboards show real stats                       |
| 3     | Step 3    | 1 new worker, dispatch.ex changes    | Stalled riders auto-released after 15 min            |
| 4     | Step 4    | 1 new worker, orders.ex changes      | Orders expire → notify → auto-cancel + fee deduction |
| 5     | Step 6a-e | 5 frontend files, fleet.store.ts     | Fleet screens connected to real APIs                 |
| 6     | Step 6f-i | 4-5 frontend + service functions     | Settings/KYC screens connected                       |
| 7     | Step 5a-c | 3 migrations, 1 context, 2 workers   | Data collection layer (invisible)                    |
| 8     | Step 5d-e | 3-4 API endpoints, frontend hooks    | Leaderboards, real ETAs                              |

---

## File Change Summary

### Backend (TeincFoodBackend)

| File                                                                    | Action                                                                                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `lib/teinc_food_backend_web/controllers/rider_controller.ex`            | **Modify** — add earnings_minor/currency to serialize_delivery, add GET /riders/dashboard, add GET /riders/leaderboard |
| `lib/teinc_food_backend_web/controllers/business_controller.ex`         | **Modify** — add GET /businesses/:id/dashboard, GET /businesses/:id/fleet/dashboard, GET /businesses/leaderboard       |
| `lib/teinc_food_backend_web/openapi.ex`                                 | **Modify** — add all new endpoints to OpenAPI spec                                                                     |
| `lib/teinc_food_backend_web/router.ex`                                  | **Modify** — register new routes                                                                                       |
| `lib/teinc_food_backend/dispatch/dispatch.ex`                           | **Modify** — add pickup timeout schedule/cancel, ETA model lookup                                                      |
| `lib/teinc_food_backend/orders/orders.ex`                               | **Modify** — add order expiry schedule/cancel, payment fee config                                                      |
| `lib/teinc_food_backend/workers/delivery_pickup_timeout_worker.ex`      | **Create**                                                                                                             |
| `lib/teinc_food_backend/workers/order_auto_expiry_worker.ex`            | **Create**                                                                                                             |
| `lib/teinc_food_backend/workers/delivery_rider_claim_timeout_worker.ex` | **Modify** — add audit log + event emission                                                                            |
| `lib/teinc_food_backend/workers/metrics_aggregation_worker.ex`          | **Create**                                                                                                             |
| `lib/teinc_food_backend/workers/eta_model_worker.ex`                    | **Create**                                                                                                             |
| `lib/teinc_food_backend/metrics/metrics.ex`                             | **Create** — new context                                                                                               |
| `lib/teinc_food_backend/metrics/rider_metric.ex`                        | **Create** — schema                                                                                                    |
| `lib/teinc_food_backend/metrics/business_metric.ex`                     | **Create** — schema                                                                                                    |
| `lib/teinc_food_backend/metrics/eta_model.ex`                           | **Create** — schema                                                                                                    |
| `priv/repo/migrations/*_create_rider_metrics.exs`                       | **Create**                                                                                                             |
| `priv/repo/migrations/*_create_business_metrics.exs`                    | **Create**                                                                                                             |
| `priv/repo/migrations/*_create_eta_models.exs`                          | **Create**                                                                                                             |
| `config/config.exs`                                                     | **Modify** — add crontab entries for metrics + eta workers                                                             |

### Frontend (Teinc Food Business)

| File                                          | Action                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app/(rider)/deliveries/[id].tsx`             | **Modify** — fix action strings in handleStatusUpdate                                    |
| `app/(rider)/(drawer)/deliveries/index.tsx`   | **Modify** — use real earnings_minor/currency fields                                     |
| `app/(rider)/(drawer)/home/index.tsx`         | **Modify** — use real useRiderMetricsQuery values now that endpoint returns them         |
| `app/(seller)/(drawer)/dashboard/index.tsx`   | **Modify** — use real useSellerDashboardQuery values                                     |
| `app/(fleet)/(drawer)/dashboard/index.tsx`    | **Rewrite** — use useFleetDashboardQuery, useFleetRidersQuery, useFleetVehiclesQuery     |
| `app/(fleet)/(drawer)/riders/index.tsx`       | **Rewrite** — use useFleetRidersQuery                                                    |
| `app/(fleet)/(drawer)/vehicles/index.tsx`     | **Rewrite** — use useFleetVehiclesQuery                                                  |
| `app/(fleet)/(drawer)/earnings/index.tsx`     | **Rewrite** — use real hooks                                                             |
| `src/stores/fleet.store.ts`                   | **Modify** — remove mock defaults                                                        |
| `app/(seller)/settings/payment-settings.tsx`  | **Modify** — connect to real API                                                         |
| `app/(seller)/settings/delivery-settings.tsx` | **Modify** — connect to real API                                                         |
| `app/(seller)/(drawer)/settings/index.tsx`    | **Modify** — wire notification toggle                                                    |
| `app/(shared)/profile/documents.tsx`          | **Modify** — connect to real KYC upload API                                              |
| `src/services/rider.service.ts`               | **Modify** — add fetchRiderDashboard, fetchLeaderboard                                   |
| `src/hooks/useRider.ts`                       | **Modify** — useRiderMetricsQuery uses fetchRiderDashboard, add useRiderLeaderboardQuery |
| `src/services/seller-dashboard.service.ts`    | **Modify** — replace GET /orders with GET /businesses/:id/dashboard                      |
| `src/hooks/seller-dashboard.hooks.ts`         | **Modify** — pass activeBusinessId to dashboard query                                    |
| `src/services/fleet.service.ts`               | **Modify** — add fetchFleetDashboard                                                     |
| `src/hooks/useFleet.ts`                       | **Modify** — add useFleetDashboardQuery                                                  |
| `src/types/api/rider.api.ts`                  | **Modify** — add earnings_minor, RiderDashboardResponse                                  |
| `src/types/api/seller.api.ts`                 | **Modify** — add SellerDashboardResponse                                                 |
| `src/types/api/fleet.api.ts`                  | **Modify** — add FleetDashboardResponse                                                  |
