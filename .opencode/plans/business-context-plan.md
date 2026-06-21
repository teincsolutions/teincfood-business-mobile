# Business Context & API Alignment Plan

## Overview
Seller and Fleet screens currently lack business context. Users are not prompted to select a business at login, and API calls don't consistently pass `business_id`. This plan adds business selection flow, context-aware API calls, and removes businesses from the drawer into settings.

---

## Phase 5: Business Context & API Alignment

### Step 1: Backend — FleetController business_id for members
- [ ] Add `resolve_business(user_id, business_id)` helper to FleetController
- [ ] Support `?business_id=` query param on all fleet endpoints for non-admin users
- [ ] Verify membership via `has_business_capability?` when business_id is provided
- [ ] Fall back to `get_owner_business()` when no business_id is given

### Step 2: Frontend — useActiveBusiness hook
- [ ] Create `src/hooks/useActiveBusiness.ts`
  - Returns `{ activeBusiness, businesses, switchBusiness, hasBusiness, isLoading }`
  - `switchBusiness(id)` updates Zustand store + invalidates queries
  - Auto-fetches via `fetchMyBusinesses()` if store empty
- [ ] Export from hooks barrel

### Step 3: Frontend — Business selector flow
- [ ] Update `app/(seller)/index.tsx`:
  - 0 businesses → redirect to create (with skip to dashboard)
  - 1 business → auto-select silently, go to dashboard
  - 2+ businesses → show business selector
- [ ] Update `app/(fleet)/index.tsx` — same pattern
- [ ] Reuse `select-business.tsx` (already exists, needs small tweaks)

### Step 4: Frontend — Remove Businesses from drawer
- [ ] `app/(seller)/(drawer)/_layout.tsx`:
  - Hide `businesses/index` Drawer.Screen (`display: 'none'`)
  - Remove "Businesses" button from CustomDrawerContent
  - Keep `businesses/add`, `businesses/[id]` hidden for navigation
- [ ] Add "Manage Businesses" to seller settings → `/(seller)/businesses`
- [ ] Add "Manage Business" to fleet settings → `/(seller)/businesses`

### Step 5: Frontend — Wire business context into seller APIs
- [ ] `seller.service.ts`:
  - `fetchSellerOrders(businessId)` → `GET /businesses/:id/orders`
  - `fetchSellerOrder(orderId, businessId)` → add business_id context
- [ ] `seller.hooks.ts`:
  - All hooks accept `businessId` param
  - `useSellerOrdersQuery(businessId, enabled?)`
- [ ] `seller-dashboard.service.ts` → scope by business
- [ ] `seller-analytics.service.ts` → scope by business
- [ ] Menu hooks → already use business-scoped endpoints, verify businessId passed

### Step 6: Frontend — Wire business context into fleet APIs
- [ ] `fleet.service.ts`:
  - `fetchFleetRiders(businessId)` → `GET /business/riders?business_id=:id`
  - `inviteRider(data, businessId)` → pass business_id in payload
  - Same for vehicles, join requests, invitations
- [ ] `useFleet.ts` — all hooks accept `businessId`

### Step 7: Frontend — Wallet service for business finance
- [ ] Create `src/services/wallet.service.ts`:
  - `fetchWalletBalance(params)` → `GET /wallet/balance?business_id=X&type=business`
  - `fetchWalletHistory(params)` → `GET /wallet/history?business_id=X&type=business`
- [ ] Create `src/hooks/useWallet.ts`:
  - `useBusinessWalletBalanceQuery(businessId)`
  - `useBusinessWalletHistoryQuery(businessId)`
- [ ] Wire into seller dashboard for revenue display

### Step 8: Frontend — Wire settings store toggle
- [ ] `app/(seller)/(drawer)/settings/index.tsx`:
  - Wire "Store Status" Switch to `toggleBusinessOpen(activeBusiness.id)`
  - Wire "Close Store" button to same endpoint

### Step 9: Frontend — Active business header indicator
- [ ] Show active business name in seller/fleet drawer header
- [ ] Add "Switch Business" button in settings
- [ ] If only one business, show it as static label

### Step 10: Test & verify
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] Review each endpoint in router.ex vs service implementation
- [ ] Verify business member access flows (invite, accept, manage)

---

## Backend Endpoint Verification Checklist

| Endpoint | Service | Implemented? | Business-scoped? |
|---|---|---|---|
| `GET /businesses/me` | business.service | ✅ | ✅ user-scoped |
| `GET /businesses/me/memberships` | business.service | ✅ | ✅ user-scoped |
| `POST /businesses` | business.service | ✅ | ✅ creates with owner |
| `PUT /businesses/:id` | business.service | ✅ | ✅ path-based |
| `GET /businesses/:id/members` | business.service | ✅ | ✅ path-based |
| `POST /businesses/:id/members` | business.service | ✅ | ✅ path-based |
| `POST /businesses/:id/members/invite` | business.service | ✅ | ✅ path-based |
| `PATCH /businesses/:id/members/:user_id` | business.service | ✅ | ✅ path-based |
| `DELETE /businesses/:id/members/:user_id` | business.service | ✅ | ✅ path-based |
| `POST /businesses/memberships/accept` | business.service | ✅ | ✅ |
| `POST /businesses/:id/toggle-open` | business.service | ✅ | ✅ path-based |
| `POST /businesses/:id/kyc` | business.service | ✅ | ✅ path-based |
| `GET /businesses/:id/operating-hours` | business.service | ✅ | ✅ path-based |
| `PUT /businesses/:id/operating-hours` | business.service | ✅ | ✅ path-based |
| `GET /businesses/:id/promos` | business.service | ✅ | ✅ path-based |
| `POST /businesses/:id/promos` | business.service | ✅ | ✅ path-based |
| `GET /promos/:id` | business.service | ✅ | ✅ |
| `PUT /promos/:id` | business.service | ✅ | ✅ |
| `DELETE /promos/:id` | business.service | ✅ | ✅ |
| `GET /businesses/:id/tax-rules` | business.service | ✅ | ✅ path-based |
| `POST /businesses/:id/tax-rules` | business.service | ✅ | ✅ path-based |
| `PUT /tax-rules/:id` | business.service | ✅ | ✅ |
| `DELETE /tax-rules/:id` | business.service | ✅ | ✅ |
| `GET /orders` → `GET /businesses/:id/orders` | seller.service | ✅ needs switch | ✅ path-based |
| `GET /orders/:id` | seller.service | ✅ | ✅ |
| `POST /orders/:id/accept\|reject\|...` | seller.service | ✅ | ✅ |
| `GET /business/riders?business_id=` | fleet.service | ✅ needs backend fix | ✅ query param |
| `POST /business/riders/invite` | fleet.service | ✅ | ✅ |
| `GET /business/vehicles?business_id=` | fleet.service | ✅ needs backend fix | ✅ query param |
| `GET /wallet/balance` | rider.service / wallet.service | ✅ | ✅ query param |
| `GET /wallet/history` | rider.service / wallet.service | ✅ | ✅ query param |
