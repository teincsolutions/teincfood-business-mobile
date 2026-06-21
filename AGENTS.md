# AGENTS.md — TeincFoodBusiness Integration Checklist

This file is for AI coding agents. Always re-read this file before starting work and check off completed items.

---

## Ground Rules

- **yarn only** — never use npm. Run `yarn add <pkg>` for new packages.
- **No manual styling** — use only Tamagui components (Button, Input, YStack, XStack, Text, Card, Image, Avatar, Separator, etc.). Never write raw `style={}` props unless the Tamagui component doesn't support the prop.
- **No service code in UI** — screens call hooks, hooks call services. Never import a service file (`@/services/*`) directly from a screen file.
- **Role isolation** — screens inside `app/(seller)/`, `app/(rider)/`, `app/(fleet)/` must not import from each other. Only shared code in `src/` crosses role boundaries.
- **`{var && <Component>}` is dangerous** — If `var` can be `""` or `0` (falsy non-boolean), React renders it as bare text outside `<Text>`, causing "Text strings must be rendered within a <Text> component". The `??` operator only catches `null`/`undefined`, not other falsy values. Use `var ? <Component /> : null` (ternary) instead of `var && <Component />`.
- **No bare punctuation in JSX text** — wrapping a value in literal parentheses/brackets like `Label ({value})` splits text into bare string fragments, causing "Text strings must be rendered within a <Text> component". Use template literals to keep it a single string: `` Label {`${value}`} ``.
- **`apiResponse ?? defaults` is a trap** — API responses are always defined objects (e.g. `{ data: [...], pagination: {...} }`), so `??` will never fire even when expected fields like `response.todayEarnings` are missing. Use per-field `response?.field ?? default` instead of full-object `response ?? defaults`.
- **No manual data mapping** — every backend API resource gets a dedicated service file in `src/services/` with a corresponding model file in `src/models/`. Model types use **snake_case** to match the backend exactly. Never manually remap fields (e.g. `apiUser.full_name || apiUser.fullName`). The service passes raw API shapes; any camelCase conversion happens only at the hook boundary via a mapper function.
- **Backend first** — before writing a service/hook, check if the endpoint exists in `docs/openapi.json` or look in `../TeincFoodBackend/lib/teinc_food_backend_web/router.ex`. Do not invent endpoints.
- **Port from buyer app** — for shared hooks/services/screens, check `../TeincFood/src/` first. The buyer app has real implementations of auth, chat, WebSocket, profile, addresses, push tokens, places, etc.
- **Account upgrade flow** — all users register as `buyer` role by default. Role selection at registration is intent only. On login, user picks a role from a role selector screen. To become `seller`/`fleet_manager`, user must **create a business**. To become `rider`, user must **create a rider profile**. Until they complete one of these, the user is `buyer` and has no access to role-grouped screens. After role selection, detect which prerequisite is incomplete and show the completion screen. Once completed, role upgrades and they enter the correct role group.
- **KYC is optional** — show/prompt KYC but let user complete it later.
- **Paginated endpoints use useInfiniteQuery** — when a backend endpoint returns `{ data: [...], pagination: {...} }`, the hook must use `useInfiniteQuery` with `select` to flatten pages. Never use `useQuery` for paginated responses.

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
