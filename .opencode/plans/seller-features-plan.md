# Seller Features Implementation Plan

## Phase 1: Backend — Analytics Endpoint
- [ ] Create `GET /businesses/:business_id/analytics?period=today|week|month` endpoint in `BusinessController`
- [ ] Implement aggregation queries in dispatch/Businesses context (no manual frontend math)
- [ ] Return: total_revenue_minor, total_orders, avg_order_value_minor, top_items, orders_by_status, revenue_by_day
- [ ] Register route in `router.ex`

## Phase 2: Backend — Fixes & Consolidation
- [ ] Remove `markOrderDelivered` from seller service (sellers don't mark delivered — riders do)
- [ ] Fix operating hours API contract on frontend (day-name keys → day_of_week integers)
- [ ] Fix store toggle on dashboard to call `toggleBusinessOpen` backend
- [ ] Add toast + error handling to ALL seller mutations in `seller.hooks.ts`
- [ ] Create `useConfirmHandoverMutation` hook

## Phase 3: Frontend — Types & Mapper Cleanup
- [ ] Clean up `src/types/api/seller.api.ts` — match backend response exactly
- [ ] Add missing fields: delivery_id, rider_name, rider_phone, notes, delivery_address
- [ ] Create `mapSellerOrder(api): SellerOrderModel` mapper in `seller.model.ts`
- [ ] Remove unused types
- [ ] Ensure seller screens reference mapped types, not raw API types

## Phase 4: Frontend — Order Detail Screen (`orders/[id].tsx`)
- [ ] Status-driven button flow (pending→accept, accepted→prepare, preparing→ready, ready→handover)
- [ ] All dialogs use `@/components/ui/AppAlertDialog`
- [ ] Add `Confirm Handover` button when rider assigned to ready order
- [ ] Toast feedback for all actions
- [ ] Remove "Mark Delivered" button

## Phase 5: Frontend — Order List Screen (`(drawer)/orders/index.tsx`)
- [ ] Fix types to use mapped `SellerOrderModel`
- [ ] Add inline Accept/Prepare/Ready buttons on order cards
- [ ] Add pull-to-refresh
- [ ] Add search bar
- [ ] Status filter tabs (All / Pending / Preparing / Ready / Delivered)

## Phase 6: Frontend — Member Invite Screen
- [ ] Create `app/(seller)/(drawer)/members/index.tsx`
- [ ] FlatList of members with role badges (Owner/Admin/Staff)
- [ ] Invite form (bottom sheet): email OR phone + role selector
- [ ] Uses `POST /businesses/:id/members/invite` endpoint
- [ ] Remove member (swipe or button, with AppAlertDialog confirmation)
- [ ] Add to drawer navigation
- [ ] Create `useBusinessMembers.ts` hooks with toast feedback

## Phase 7: Frontend — Wallet / Finances Screen
- [ ] Create `app/(seller)/(drawer)/finances/index.tsx`
- [ ] Wallet balance card
- [ ] Transaction history FlatList with pull-to-refresh
- [ ] Add to drawer navigation

## Phase 8: Frontend — Dashboard & Settings Fixes
- [ ] Wire store open/close toggle to `toggleBusinessOpen` API
- [ ] Fix silent `catch { // noop }` in settings screen — add toast errors
- [ ] Add toast feedback to kiosk screen mutations
- [ ] Fix operating hours screen API shape mismatch

## Phase 9: Frontend — Menu Image Upload Fix
- [ ] Investigate image upload persistence (local URIs vs server URLs)
- [ ] Add upload endpoint or multipart handling if needed

## Phase 10: Backend Tests
- [ ] Test analytics endpoint
- [ ] Test all seller order flow endpoints
- [ ] 0 failures

## Phase 11: Frontend TypeScript
- [ ] `npx tsc --noEmit` — 0 errors
