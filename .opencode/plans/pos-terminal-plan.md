# POS Terminal, Revenue, RBAC & Printing Plan

## Overview

| # | Feature | Backend | Frontend |
|---|---------|---------|----------|
| 1 | **POS Terminal** (replace Kiosk) | New `order_type`/`callout_number` columns, daily callout counter, POS create-order endpoint | Menu browser + cart + checkout + pipeline in one screen, customer callout display |
| 2 | **Revenue / Accounting** | New `GET /businesses/:id/revenue-summary` endpoint grouped by payment method | Enhanced analytics screen with POS cash/card/momo breakdown |
| 3 | **RBAC Gating** | New `/businesses/:id/my-membership` endpoint | Filter drawer + guard routes + conditional action buttons |
| 4 | **ESC/POS Printing** | Upgrade receipt to emit real binary ESC/POS | Wire auto-print into POS checkout flow |
| 5 | **Customer Display** | Real-time WebSocket order events already exist | New read-only screen showing callout # + status (for wall-mounted monitor) |

---

## Phase 1: Backend — POS Order Infrastructure

- [x] **1.1 Migration `add_pos_fields_to_orders`**
  - [x] Add `order_type` enum (`walk_in`/`takeout`/`dine_in`/`delivery`, default `delivery`)
  - [x] Add `callout_number` (integer, nullable)
  - [x] Add `customer_name` (string, nullable)
  - [x] Add `customer_phone` (string, nullable)
  - [x] Add `pos_payment_method` (string, nullable — `cash`/`card`/`mobile_money`)
  - [x] Add `paid_at` (utc_datetime, nullable)
  - [x] Update Order schema with new fields
  - [x] Update Order changeset validations

- [x] **1.2 New table `daily_counters`**
  - [x] Migration: `business_id` (FK), `date` (date), `callout_counter` (integer default 0)
  - [x] Unique constraint on `[business_id, date]`
  - [x] `next_callout_number(business_id)` — get-and-increment with advisory lock

- [x] **1.3 New endpoint `POST /api/v1/businesses/:id/pos/orders`**
  - [x] Route registration
  - [x] Controller action: POS order creation
    - [x] Uses cashier's `user_id`
    - [x] Generates callout number
    - [x] For `cash`: auto-set `payment_mode: prepaid`, `paid_at: now()`, emit `payment.completed`
    - [x] For `card`/`mobile_money`: create in `awaiting_payment`
    - [x] Skip delivery validation for walk-in/takeout/dine-in
  - [x] OpenAPI operation + schema
  - [x] End-to-end tested via HTTP with cashier token

- [ ] **1.4 New endpoint `POST /api/v1/businesses/:id/pos/orders/:order_number/initiate-payment`**
  - Note: frontend can call the existing `POST /payments/initiate` endpoint directly with the POS order_id — this endpoint is a convenience wrapper for RBAC gating that can be added later

- [x] **1.5 New endpoint `GET /api/v1/businesses/:id/revenue-summary`**
  - [x] SQL aggregation (not in-memory): `SUM(total_minor)`, `COUNT(*)`, grouped by `pos_payment_method` and `payment_mode`
  - [x] Period support: `?period=today|this_week|this_month`
  - [x] Returns: `{ total_revenue_minor, total_orders, avg_order_value_minor, by_payment_method, by_order_type, by_day }`
  - [x] OpenAPI operation + schema

- [x] **1.6 Fix date filtering on `list_business_orders`**
  - [x] Add `maybe_filter_date_range` helper + `maybe_filter_business_order_type` + `maybe_filter_business_order_pos_method`
  - [x] Wire `date_from`/`date_to`/`order_type`/`pos_payment_method` params from controller through to query
  - [x] Add filter keys to `pagination.ex` `@filter_keys`

- [x] **1.7 Enhanced ESC/POS receipt**
  - [x] Add binary ESC/POS commands: `ESC @` (reset), `ESC a` (alignment), `ESC E` (bold), `GS !` (char size), `GS V m` (cut)
  - [x] Add CODE128 barcode printing (order number)
  - [x] Callout number in double-height text
  - [x] Content-type `application/octet-stream` for `format=escpos`

---

## Phase 2: Frontend — POS Terminal

- [x] **2.1 Replace Kiosk Mode screen**
  - [x] Rename drawer item: "Kiosk Mode" → "POS Terminal"
  - [x] New screen `app/(seller)/(drawer)/pos/index.tsx`
  - [x] Three-tab layout: New Order / In Progress / Today

- [x] **2.2 "New Order" tab — Menu Browser**
  - [x] `POSMenuGrid` component: category tabs + grid of MenuItem cards
  - [x] `POSItemCustomizer` sheet: variant selection, addon toggle
  - [x] `POSCartPanel`: right sidebar (tablet) / bottom bar (phone) with cart items
  - [x] Customer name/phone inputs

- [ ] **2.3 "New Order" tab — Checkout**
  - [x] `POSCheckoutBar`: fixed bottom with total + payment method buttons
  - [x] Basic checkout form: customer name/phone, order type, payment method selection
  - [ ] **Cash flow**: numeric keypad → tendered amount → change calc → print
  - [ ] **Card flow**: create order (awaiting) → show Paystack QR → wait for webhook → confirm
  - [ ] **MoMo flow**: same as card with mobile_money channel

- [x] **2.4 "In Progress" tab**
  - [x] 3-column pipeline (Pending/Preparing/Ready) with action buttons
  - [x] Cards show order number, items count, time since, customer name, total
  - [x] Accept / Start Preparing / Mark Ready actions
  - [x] Replaced with kiosk-style responsive grid (1/2/3 columns) using PendingOrderCard, PreparingOrderCard, POSReadyCard

- [x] **2.5 "Today" tab**
  - [x] Completed POS orders for the day (FlatList with pull-to-refresh)
  - [ ] Quick reprint button

- [x] **2.6 New services/hooks**
  - [x] `pos.service.ts` — `createPosOrder`, `fetchBusinessOrders`
  - [x] `pos.hooks.ts` — `useCreatePOSOrderMutation`, `usePOSOrdersQuery`
  - [x] `pos.store.ts` — persisted Zustand cart store with add/remove/quantity/variant/addon management

---

## Phase 3: Frontend — Customer Callout Display

- [x] **3.1 New screen** `app/(seller)/display.tsx`
  - [x] Full-screen read-only, landscape-optimized
  - [x] Header: business name + live clock
  - [x] 3-column grid (Pending/Preparing/Ready) with large callout numbers, customer name, status, time elapsed
  - [x] Real-time via existing `useOrderRealtimeUpdates`
  - [x] Filter: today's walk_in/takeout/dine_in orders only

- [x] **3.2 Drawer item** — Add "Callout Display" in drawer below POS Terminal

- [x] **3.3 Auto-launch mode** — Persistent toggle via `display.store.ts`; `(seller)/_layout.tsx` redirects to display on mount when enabled

- [ ] **3.4 Enable/disable toggle** — Settings screen or POS exit flow to toggle callout display mode

---

## Phase 4: Frontend — Revenue / Accounting

- [ ] **4.1 Enhance analytics screen**
  - [ ] Three period tabs: Today / This Week / This Month
  - [ ] Revenue summary card: total, order count, avg value
  - [ ] Payment method breakdown: horizontal bar chart — Cash / Card / MoMo
  - [ ] Revenue trend: line chart by day

- [ ] **4.2 Update `seller-analytics.service.ts`** — add `fetchRevenueSummary`

- [ ] **4.3 Update `seller-analytics.hooks.ts`** — add `useRevenueSummaryQuery`

---

## Phase 5: Frontend — RBAC Gating

- [ ] **5.1 New endpoint `GET /api/v1/businesses/:id/my-membership`**
  - [ ] Returns `{ role, capabilities[] }` for current user + active business
  - [ ] Owner gets all capabilities

- [ ] **5.2 Hook `useMyBusinessCapabilities()`**
  - [ ] Returns `{ role, capabilities[] }`
  - [ ] staleTime Infinity (role doesn't change mid-session)

- [ ] **5.3 Capability-to-nav mapping**

  | Drawer Item | Required Capability |
  |---|---|
  | Dashboard | _always_ |
  | POS Terminal | `orders_read` + `orders_accept` |
  | Customer Display | `orders_read` |
  | Orders | `orders_read` |
  | Deliveries | `deliveries_assign` |
  | Menu | `menu_manage` |
  | Analytics | `finance_read` |
  | Members | `business_members_manage` |
  | Riders | `riders_manage` |
  | Wallet & Billing | `finance_read` |
  | Settings → Delivery | `deliveries_assign` |
  | Settings → Payment | `finance_billing_manage` |
  | Settings → Tax | `tax_rules_manage` |
  | Settings → Printer | _always_ |
  | Profile | _always_ |

- [ ] **5.4 Filter `CustomDrawerContent`**
  - [ ] Build capabilityMap from hook
  - [ ] Conditionally render each `DrawerMenuItem`

- [ ] **5.5 Route guards in `(seller)/_layout.tsx`**
  - [ ] Redirect + toast on capability mismatch

- [ ] **5.6 Action-level gating**
  - [ ] Orders screen: hide action buttons by role
  - [ ] Members screen: hide invite/remove for non-manager

---

## Phase 6: POS Printing Integration

- [ ] **6.1 Auto-print on cash payment**
  - [ ] After `createPosOrder` with `method=cash`, call `printOrderReceipt(orderId)`

- [ ] **6.2 Reprint button on In Progress cards**

- [ ] **6.3 Printer status indicator in POS header**
  - [ ] Connected printer name + green/red dot

- [ ] **6.4 Printer settings** — already exists at `app/(seller)/settings/printer.tsx`
