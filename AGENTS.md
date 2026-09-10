# AGENTS.md — Teinc Food Business Integration Checklist

This file is for AI coding agents. Always re-read this file before starting work and check off completed items.

---

## Ground Rules

- **yarn only** — never use npm. Run `yarn add <pkg>` for new packages.
- **No manual styling** — use only Tamagui components (Button, Input, YStack, XStack, Text, Card, Image, Avatar, Separator, etc.). Never write raw `style={}` props unless the Tamagui component doesn't support the prop.
- **No service code in UI** — screens call hooks, hooks call services. Never import a service file (`@/services/*`) directly from a screen file.
- **Role isolation** — screens inside `app/(seller)/`, `app/(rider)/`, `app/(fleet)/` must not import from each other. Only shared code in `src/` crosses role boundaries.
- **`{var && <Component>}` is dangerous** — If `var` can be `""` or `0` (falsy non-boolean), React renders it as bare text outside `<Text>`, causing "Text strings must be rendered within a <Text> component". The `??` operator only catches `null`/`undefined`, not other falsy values. Use `var ? <Component /> : null` (ternary) instead of `var && <Component />`.
- **No bare punctuation in JSX text** — wrapping a value in literal parentheses/brackets like `Label ({value})` splits text into bare string fragments, causing "Text strings must be rendered within a <Text> component". Use template literals to keep it a single string: ``Label {`${value}`}``.
- **`apiResponse ?? defaults` is a trap** — API responses are always defined objects (e.g. `{ data: [...], pagination: {...} }`), so `??` will never fire even when expected fields like `response.todayEarnings` are missing. Use per-field `response?.field ?? default` instead of full-object `response ?? defaults`.
- **No manual data mapping** — every backend API resource gets a dedicated service file in `src/services/` with a corresponding model file in `src/models/`. Model types use **snake_case** to match the backend exactly. Never manually remap fields (e.g. `apiUser.full_name || apiUser.fullName`). The service passes raw API shapes; any camelCase conversion happens only at the hook boundary via a mapper function.
- **Type per purpose, no field renaming** — never define a type that renames fields from the backend response/request shape. If you need types for different purposes (e.g. one for API responses, one for form state, one for API requests), create separate explicit interfaces in the appropriate file (`@/types/api/*` for API shapes, `@/types/*.types` for UI/form shapes). Each interface must use field names true to its purpose — form types can have `price: string` (input string), API types have `price_minor: number` (minor units). Never use one type to represent two different shapes with renamed fields.
- **Backend first** — before writing a service/hook, check if the endpoint exists in `docs/openapi.json` or look in `../TeincFoodBackend/lib/teinc_food_backend_web/router.ex`. Do not invent endpoints.
- **Port from buyer app** — for shared hooks/services/screens, check `../Teinc Food/src/` first. The buyer app has real implementations of auth, chat, WebSocket, profile, addresses, push tokens, places, etc.
- **Account upgrade flow** — all users register as `buyer` role by default. Role selection at registration is intent only. On login, user picks a role from a role selector screen. To become `seller`/`fleet_manager`, user must **create a business**. To become `rider`, user must **create a rider profile**. Until they complete one of these, the user is `buyer` and has no access to role-grouped screens. After role selection, detect which prerequisite is incomplete and show the completion screen. Once completed, role upgrades and they enter the correct role group.
- **KYC is optional** — show/prompt KYC but let user complete it later.
- **Paginated endpoints use useInfiniteQuery** — when a backend endpoint returns `{ data: [...], pagination: {...} }`, the hook must use `useInfiniteQuery` with `select` to flatten pages. Never use `useQuery` for paginated responses.
- **List screens use FlatList** — every screen listing dynamic data must use `FlatList` (not `ScrollView + .map()`). Include: `keyExtractor`, `ListEmptyComponent` with icon, `RefreshControl` for pull-to-refresh (unless real-time via WebSocket), `initialNumToRender={10}`, `windowSize={5}`, `maxToRenderPerBatch={10}`, `removeClippedSubviews`.
- **No UUIDs in UI** — never display UUIDs (order_id, user_id, delivery_id, etc.) directly to the user. Always use human-readable identifiers like `order_number`, `rider_number`, `business_number`. UUIDs are for backend APIs, databases, and system internals only.
- **Log API errors for debugging** — every `onError` callback in mutations/queries must log the full error object with `console.debug` before showing a user-facing toast.

---

## Phase 0: Foundation ✅ COMPLETE

- [x] Install missing packages (bottom-sheet, polyline, firebase, google-signin, crypto, web-browser, geolib, confirmation-code-field, sonner-native)
- [x] Convert `app.json` to dynamic `app.config.js` — env support, maps, firebase, custom plugins, Paystack extra config
- [x] Create `.env` file with API_URL, WS_URL, Paystack keys, Google OAuth IDs
- [x] Update `src/utils/constants.ts` — add `WS_BASE_URL`, `CHAT_STORAGE_KEYS`, `CHAT_CONFIG`
- [x] Port Phoenix WebSocket: `phoenix-socket.service.ts`, `events.service.ts`, `chat.service.ts`, `order-events.service.ts`, `auth-cleanup.service.ts`
- [x] Rewrite `auth.service.ts` — real `POST /api/v1/auth/*` calls
- [x] Rewrite `notifications.service.ts` — real API + WebSocket events
- [x] Rewrite `payment.service.ts` — real Paystack integration
- [x] Rewrite `promo.service.ts` — real `POST /api/v1/promo/validate`
- [x] Rewrite `bootstrap.service.ts` — real API
- [x] Rewrite `devices.service.ts` — real push token registration
- [x] Rewrite `location.service.ts` — real API
- [x] Rewrite `live-activities.service.ts` — real API
- [x] Rewrite `messages.service.ts` — real HTTP + WS
- [x] Create `profile.service.ts` — ported from buyer app
- [x] Create `address.service.ts` — ported from buyer app
- [x] Create `places.service.ts` — ported from buyer app
- [x] Create `directions.service.ts` — ported from buyer app
- [x] Create `notification-preferences.service.ts` — ported from buyer app
- [x] Port shared hooks: `useAuth`, `useAuthVerification`, `useProfile`, `useAddresses`, `usePushTokenRegistration`, `useEventsConnection`, `usePayment`, `usePasswordRecovery`, `usePlacesSearch`, `useCurrentLocation`, `useChat`, `useMessages`, `useNotifications`, `useNotificationPreferences`
- [x] Create `src/models/kiosk.model.ts` — `KioskOrder` type
- [x] Create `src/models/seller.model.ts` — `SellerOrder` + `OrderItem` types
- [x] Remove direct mock imports (all screens/components/hooks now import from models)
- [x] Remove mock file references from kiosk/seller/dashboard hooks/services
- [x] Connect auth screens: `login.tsx`, `signup.tsx`, `verification.tsx`, `forgot-password.tsx`, `role.tsx` all use real auth service
- [x] Build role-completion gateway: `usePrerequisiteCheck` hook + `(seller)/_layout.tsx` and `(fleet)/_layout.tsx` redirect to business creation if no business exists
- [x] Delete mock infrastructure: `src/mocks/`, `mock-backend.service.ts`, `mock-data.service.ts`, `realtime-mock.service.ts` all deleted
- [x] Remove `@mocks/*` path from `tsconfig.json`
- [x] Run `npx tsc --noEmit` — **0 errors**

---

## Phase 2: Service & Hook Alignment ✅ COMPLETE

- [x] **`menu.service.ts`** — Fixed all paths (removed `/v1/` prefix), uses `/catalog/items`, `/menu/items/{id}`, removed invalid DELETE, added business-scoped menu endpoints
- [x] **`kiosk.service.ts`** — Fixed paths, uses `/orders/*` instead of `/v1/seller/kiosk/orders/*`
- [x] **`fleet.service.ts`** — Fixed `Promise<any>` return types (removed model type imports), added `acceptFleetInvitation` endpoint
- [x] **`business.service.ts`** — Created with business CRUD, KYC, toggle-open, members (CRUD + invite/accept), operating hours, promo CRUD, tax rules
- [x] **`rider.hooks.ts`** — Fixed `updateDeliveryStatus` → per-action dispatch, `fetchRecentTransactions` → `fetchWalletHistory`, `requestPayout` → stub, `updateVehicleInfo` → `createVehicle`
- [x] **`seller.hooks.ts`** — Removed stale type imports (`OrderStatus`, `UpdateOrderStatusResponse`, `SellerOrderDetailResponse`)
- [x] **`kiosk.hooks.ts`** — Removed stale type imports (`KioskOrdersResponse`, `KioskOrderActionResponse`, `AvailableRider`), fixed implicit `any` callbacks
- [x] **`useFleet.ts`** — Added `useAcceptFleetInvitationMutation`
- [x] **TypeScript clean** — `npx tsc --noEmit` passes with 0 errors

---

## Phase 3: Types, Stores & Mapping ✅ COMPLETE

- [x] **`src/models/api/` created** — 9 files with typed snake_case API shapes matching backend exactly: `pagination.ts`, `auth.api.ts`, `rider.api.ts`, `seller.api.ts`, `fleet.api.ts`, `kiosk.api.ts`, `menu.api.ts`, `business.api.ts`, `wallet.api.ts`, `index.ts`
- [x] **`rider.service.ts`** — all functions typed with proper return types (`RiderProfileResponse`, `RiderDeliveriesResponse`, `RiderEarningsResponse`, `RiderVehicleResponse`, etc.)
- [x] **`seller.service.ts`** — typed with `SellerOrdersResponse`, `SellerOrderDetailResponse`
- [x] **`fleet.service.ts`** — typed with `FleetRidersResponse`, `FleetVehiclesResponse`
- [x] **`kiosk.service.ts`** — typed with `KioskOrdersResponse`
- [x] **`menu.service.ts`** — typed with `MenuItemResponse`, `MenuCategoryListResponse`, `CatalogItemRequest`; keeps form types and utilities
- [x] **`business.service.ts`** — typed with `BusinessResponse`, `PromoResponse`, `TaxRuleResponse`, etc.
- [x] **Logout clears role** — `auth.store.ts` `clearAuth()` now calls `useRoleStore.clearRole()`; all logout paths (API token expiry, manual logout) clear both stores
- [x] **`verification.tsx`** — already uses `useRoleStore` as primary source (`storedRole || role`)
- [x] **TypeScript clean** — `npx tsc --noEmit` passes with 0 errors

---

## Phase 4: Communication Screens ✅ COMPLETE

- [x] **`src/models/api/conversation.api.ts`** — typed conversation/message shapes matching backend snake_case
- [x] **`messages.service.ts`** — all hook returns typed with `ConversationListResponse`, `ConversationResponse`, `ConversationMessagesResponse`
- [x] **`useChat.ts`** — fixed `isReady` (was always false), fixed `loadOlderMessages` (was stub), typed returns, always calls hooks unconditionally
- [x] **Inbox screen** — uses `useInboxConversations` hook instead of raw service; displays real backend fields (`type`, `status`, `updated_at`)
- [x] **Chat screen** — uses `useChatStore` for message persistence; removes local mock data; supports both support and conversation-based chats; real WebSocket send
- [x] **Deleted `useMessages.ts`** — dead code, never imported by any screen
- [x] **TypeScript clean** — `npx tsc --noEmit` passes with 0 errors

---

## Phase 5: Business Context & API Alignment ✅ COMPLETE

See [detailed plan](.opencode/plans/business-context-plan.md) for full breakdown.

**Top-level checklist:**

- [x] **Step 1:** Backend — FleetController: support `business_id` for members
- [x] **Step 2:** Frontend — `useActiveBusiness` hook
- [x] **Step 3:** Frontend — Business selector flow at login
- [x] **Step 4:** Frontend — Remove Businesses from drawer → settings
- [x] **Step 5:** Frontend — Wire business context into seller APIs
- [x] **Step 6:** Frontend — Wire business context into fleet APIs
- [x] **Step 7:** Frontend — Wallet service for business finance
- [x] **Step 8:** Frontend — Wire settings store toggle to backend
- [x] **Step 9:** Frontend — Active business header indicator
- [x] **Step 10:** Test & verify — `npx tsc --noEmit` 0 errors

---

## Phase 6: Delivery Engine, Dashboards & Monitoring ✅ COMPLETE

See [detailed plan](.opencode/plans/rider-delivery-engine-plan.md) for full breakdown.

**Top-level checklist:**

- [x] **Step 1:** Fix frontend delivery bugs — action mapping, earnings display
- [x] **Step 2:** Backend — Dashboard stat endpoints for rider, seller, fleet (replace mock defaults with real data from dedicated endpoints)
- [x] **Step 3:** Backend — Pickup timeout worker (15 min auto-release stalled riders)
- [x] **Step 4:** Backend — Order availability expiry (15 min notify → 30 min auto-cancel + refund)
- [x] **Step 5:** Backend — Monitoring & analytics engine (rider_metrics, business_metrics, eta_models tables, Metrics context, aggregation workers, leaderboard APIs, ETA model endpoint)
- [x] **Step 6a-e:** Wire fleet screens (dashboard, riders, vehicles) to real API hooks
- [x] **Step 6f-i:** Wire seller settings (payment, delivery, notification toggle) to real APIs
- [x] **OpenAPI docs updated** — leaderboard, eta-models, fleet dashboard, rider dashboard, seller dashboard schemas + operations
- [x] **TypeScript clean** — `npx tsc --noEmit` 0 errors

---

## Phase 7: Search, Filters & Earnings Period Summary ✅ COMPLETE

- [x] **Backend search/filter params** — `list_rider_deliveries` now supports `q`, `order_number`, `business_number`, `status`, `date_from`, `date_to`; `list_business_riders` now supports `q`, `status`; `parse_pagination_params` passes through filter keys automatically
- [x] **Earnings period endpoint** — `GET /riders/earnings/summary?period=today|this_week|this_month` with `get_rider_earnings_summary/2` in Dispatch, returns aggregated `total_earnings_minor`, `total_deliveries`, `currency`
- [x] **Frontend search/filters wired** — Rider deliveries screen has search bar + status filter; Fleet riders screen has search bar + status filter (all/available/busy/offline); both pass params to backend via hooks
- [x] **Rider earnings screen rewired** — Period selector (today/this week/this month) uses `useRiderEarningsSummaryQuery`; summary card shows dynamic label, earnings, delivery count, avg/delivery; uses `formatPriceFromMinor`
- [x] **Fleet riders screen** — Search and status filter send real API params instead of client-side filtering
- [x] **TypeScript clean** — `npx tsc --noEmit` 0 errors
- [x] **Backend tests** — 581 tests, 0 failures

---

## Phase 8: Offline Sync & LAN Reliability ✅ COMPLETE

> NOTE (2026-09-10, mesh landing `core@0.7.31`): the elected-node passages below
> (`connectToElectedNode`, node-vs-client relay, `LocalNodeServer` roles) are
> SUPERSEDED — see Phase 10. Kept for history. Mesh spec: `../teincfood-core/docs/MESH.md`.

Fixes the cloud-routing bug (orders stuck offline while cloud is "unknown"), pending-order invisibility (queued orders never visible on any terminal), and the Local Node reconnect hot-loop.

**Cloud routing:**
- [x] `engine.ts` `resolveStrategy` — cloud is used when reachable **OR unknown** (only confirmed "unreachable" falls back to Local Node/outbox)
- [x] `service.ts` `handleNodeCommand` — treats "unknown" cloud as reachable so the node forwards to cloud instead of always queueing locally
- [x] `engine.ts` — successful cloud command sets `isCloudReachable = "reachable"` and triggers `replayQueuedCommands()` so queued orders flush once the cloud is back
- [x] `connectivity.store.ts` — the 15s cloud-retry cooldown arms **once per unreachable period**; a stream of failing commands no longer re-arms it forever

**Reconnect manager (`local-node/service.ts`):**
- [x] Single-flight `connectToElectedNode` (no stacked connect attempts)
- [x] Exponential backoff (`scheduleReconnect`: 1s → 30s cap) instead of immediate hot retry
- [x] Generation counter guards stale socket callbacks (`onConnected`/`onDisconnected`/`onError` ignored after a new attempt)
- [x] Reconnect delay resets on successful connect; `shutdown()` clears timers/generation

**Pending-order visibility (offline orders visible on every terminal):**
- [x] `command-queue.service.ts` — optimistic `order.create_queued` events persisted to the events journal (`insertEvent`, origin `local`)
- [x] `src/stores/pending-orders.store.ts` — zustand store of pending `SellerOrder`s keyed by order_number
- [x] `src/sync/pending-orders.service.ts` — `hydratePendingOrders` (rehydrate on restart), `applyPendingOrderEvent` (create_queued → add/persist; order.created → remove pending + mark synced + invalidate), `registerPendingOrdersInvalidator`
- [x] `src/hooks/pending-orders.hooks.ts` — `usePendingOrders(businessId)` subscribes + hydrates once
- [x] `LocalNodeServer` + `handleNodeCommand` — node broadcasts command-result events to all LAN clients (covers both client-sent and self-executed commands)
- [x] `useSyncReconciliation` — node relays engine events (esp. replayed `order.created`) to LAN clients; routes engine events into pending-orders store; registers query invalidator
- [x] `pos.hooks.ts` / `seller.hooks.ts` — `usePOSOrdersQuery` and `useSellerOrdersQuery` merge pending orders into the result (deduped by order_number, newest-first), so POS In-Progress/Today tabs, kitchen, display, and the seller orders list all show queued orders

Reconciliation key: the optimistic order's `order_number` (`TFL-…`) matches the cloud's echoed `local_order_number`; on `order.created` the pending order is removed and its persisted events (both `local` and `lan` origin) are marked synced so it never rehydrates as pending.

---

## Phase 9: Offline Data Layer (Durable Local Read-Model) ✅ COMPLETE

Operating fully offline requires menus, orders, roles/permissions, members, taxes, printers, business profile and operating-hours to be **durably available on-device, never cleared, and refreshed once a connection returns**. Backend-proper versioned reference-data approach is chosen (not yet promoted to prod — TODO).

**Backend (TeincFoodBackend):**
- [x] `reference_data.ex` — `@supported_keys` extended to `roles | members | tax-rules | business:profile | operating-hours` (plus existing `menu:items`, `menu:categories`); `fetch_key/2` added for each new key (serializing members/tax/operating-hours to match controller shapes); `bump_roles_version/1`, `bump_members_version/1`, `bump_tax_rules_version/1`, `bump_business_profile_version/1`, `bump_operating_hours_version/1`; private `serialize_membership/1`, `serialize_tax_rule/1`, `format_time/1`
- [x] `reference_data_controller.ex` — `@supported_keys` mirrored
- [x] Bump sites wired: `business_controller.ex` (`add/update/remove/invite/accept` member → `bump_members_version`; `update`+`toggle_open` → `bump_business_profile_version`; `upsert_operating_hours` → `bump_operating_hours_version`); `business_tax_rule_controller.ex` (`create/update/delete` → `bump_tax_rules_version`)
- [x] `boot:` `role_capabilities()` static map returned under `%{data: ...}`; members list = `Businesses.list_business_memberships/1` (active only, preloads `:user`); tax rules = `Businesses.list_tax_rules/1`; operating hours = `Businesses.list_operating_hours/1` (controller serializes `open_time`/`close_time` via `format_time/1` → HH:MM:SS); business profile = `MenuSerializer.serialize_business/1`
- [x] Tests — reference-data controller suite: versions asserts all 7 keys; fetch asserts members/profile/operating-hours/roles shapes. Full suite: `613 tests, 0 failures`. `mix compile --warnings-as-errors` clean
- [x] `docker-compose.test.yml` — added `735432` and `63796379` host ports (postgres + redis) so the local test suite reaches the test DB/Redis

**Frontend (business app):**
- [x] Migration v2 (`src/db/migrations.ts`) — rebuild `reference_data` with composite PK `(business_id, key)` (legacy rows → business_id `''`), `ALTER entity_snapshots ADD COLUMN business_id` + index on `(business_id, entity_type)`
- [x] `src/db/operations.ts` — reference ops business-scoped (`getReferenceData`, `getReferenceVersion`, `setReferenceData`, `deleteReferenceData`, `deleteReferenceDataForBusiness`, `getAllReferenceDataKeys` take `businessId`); new entity-snapshot ops `upsertEntitySnapshot` (time-ordered via `last_event_timestamp`), `getEntitySnapshot`, `getEntitySnapshotsByType`, `deleteEntitySnapshot`, `pruneEntitySnapshots`
- [x] `src/reference/service.ts` — `DEFAULT_SYNC_KEYS` = all 5 new keys; `syncKey` falls back to full fetch + local `hashPayload` when key not in backend versions; fallback fetchers for `roles`/`members`/`tax-rules`/`business:profile`/`operating-hours`; all ops business-scoped; `cacheReferenceImages(db, businessId, keys)`
- [x] `src/reference/hooks.ts` — `useReferenceData(key)` reads SQLite for the active business (`staleTime: Infinity`); `useBusinessReferenceDataSync()` syncs all keys when business+online
- [x] `src/stores/printer.store.ts` — wrapped in zustand `persist` (MMKV, `STORAGE_KEYS.PRINTER_SETTINGS`)
- [x] Query hooks local-first: `useBusinessRolesQuery`, `useBusinessMembersQuery`, `useBusinessTaxRulesQuery` use `useReferenceData(...).data?.payload` as `placeholderData`
- [x] Cross-device emits: `emitReferenceChanged(businessId, ["members"])`, `["tax-rules"]` after mutations
- [x] `app/(seller)/_layout.tsx` + `app/(fleet)/_layout.tsx` call `useBusinessReferenceDataSync()`
- **Order read-model (Part D):** `src/sync/order-snapshots.service.ts` `persistOrderEvent` (journal + patch read-model status), `persistSellerOrders` write-through on page-1 fetch, `getSellerList`, `pruneOld()` (30-day retention); snapshot payload `{ data: SellerOrder[], savedAt }`, entity_type `seller_orders`; `src/hooks/offline-orders.hooks.ts` `useOfflineOrderHydration` seeds query cache from SQLite (`SELLER_KEYS.orders` + `POS_KEYS.orders` shapes); `pending-orders.service.ts` `applyOrderStateChangeEvent` + cloud ack persist via `persistOrderEvent`; `useOrderRealtimeUpdates` builds `DomainEvent` from WS payload and persists via `persistOrderEvent`, so seller + POS order lists reflect the latest state offline
- [x] Offline-orders locks persisted, cache survives logout (clearAuth clears queryClient but not SQLite reference/order tables)
- **Offline images:** `src/reference/image-cache.ts` stores downloaded images in durable `documentDirectory` (`teincfood_images/`) with hash-keyed filenames; `pruneImageCache(knownUrls, 30d)` removes orphaned files during sync; `cacheReferenceImages` downloads menu item `image_url` + business `logo_url`/`cover_image_url` after each sync pass (online/reconnect); `src/hooks/useCachedImage.ts` `useCachedImageUrl(url)` resolves local-file-first with on-demand background warm when online + `CachedAvatarImage` wrapper for avatar/business-logo rendering (safe in `.map()`); wired into `MenuItemCard`, `pos/FoodCard`, `pos/ItemCustomizerSheet`, `cart/CartItemCard`, `orders/OrderHistoryCard`, `orders/OrderDetailModal`, `ui/DrawerHeader`, `chat/ContactChatScreen`, `select-business`, and seller/fleet/rider `businesses/index` screens
- [x] Frontend verified: `npx tsc --noEmit` 0 errors

**Invariants for future work:**
- Every new cached reference key must get a backend version (bump on each mutation), a `fetch_key/2` fallback, a place in `DEFAULT_SYNC_KEYS`, and business-scoped SQLite ops.
- Cloud WS `order.created`/`order.status_changed` payloads are summary-only (no full body) — durable read-model writes happen through fetched lists (`persistSellerOrders`), event persistence updates the status read-model only.
- SQLite cache must never be cleared on logout — devices must work offline for hours and re-sync on reconnect.
- Printers are local device config only (no backend endpoint) — `printer.store` persists to MMKV.
- Image rendering must go through `useCachedImageUrl`/`CachedAvatarImage` (never raw remote `source={{ uri }}`) so images display offline; the cache lives in durable `documentDirectory`, and orphaned files are pruned after 30 days during sync.

**Next (unfinished):** connectivity hardening already investigated but **not implemented** — strict `isCloudReachable === "reachable"` cloud gate in `SyncEngine`/`handleNodeCommand`, `/api/v1/health` probe, decouple LAN connect/disconnect from `setCloudReachable`, bounded cold-start pre-flight. Pending user sign-off.

---

## Phase 10: LAN Mesh (no election) ✅ COMPLETE (`core@0.7.31`)

Mesh spec: `../teincfood-core/docs/MESH.md` (single source of truth — it wins on conflict).

- [x] **Lib-owned crypto** — `src/local-node/security.ts` re-exports core (`deriveLanSecret` business-only, FIPS SHA-256 fallback for Hermes); duplicate formula deleted
- [x] **Pinned TLS, no client certs** — `client.ts`/`server.ts` `ca: SERVER_CERT`, passwordless `server-keystore.p12` (passworded p12 broke TLS context), `servername teinc-local-node`; `rejectUnauthorized` bypass removed
- [x] **Discovery** — bare `deviceId` mDNS instance, self/`fe80` filtered, routable IPv4 only, bootstrap retry (2s×30) after KV hydrate
- [x] **Single Terminals card** — `Listening on :port • Connected • discovered` via `lan-*` events
- [x] **Verified stable** — phone ↔ desktop ↔ harness-B triangle `Connected`, redials ≈ 0 steady-state; `npx tsc --noEmit` 0 errors
- **Do not reintroduce:** elected-node logic, owner-derived secrets, `rejectUnauthorized: false`-style TLS bypasses, dual cards
