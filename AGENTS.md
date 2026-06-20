# AGENTS.md — TeincFoodBusiness Integration Checklist

This file is for AI coding agents. Always re-read this file before starting work and check off completed items.

---

## Ground Rules

- **yarn only** — never use npm. Run `yarn add <pkg>` for new packages.
- **No manual styling** — use only Tamagui components (Button, Input, YStack, XStack, Text, Card, Image, Avatar, Separator, etc.). Never write raw `style={}` props unless the Tamagui component doesn't support the prop.
- **No service code in UI** — screens call hooks, hooks call services. Never import a service file (`@/services/*`) directly from a screen file.
- **Role isolation** — screens inside `app/(seller)/`, `app/(rider)/`, `app/(fleet)/` must not import from each other. Only shared code in `src/` crosses role boundaries.
- **Backend first** — before writing a service/hook, check if the endpoint exists in `docs/openapi.json` or look in `../TeincFoodBackend/lib/teinc_food_backend_web/router.ex`. Do not invent endpoints.
- **Port from buyer app** — for shared hooks/services/screens, check `../TeincFood/src/` first. The buyer app has real implementations of auth, chat, WebSocket, profile, addresses, push tokens, places, etc.
- **Account upgrade flow** — all users register as `buyer` role by default. Role selection at registration is intent only. On login, user picks a role from a role selector screen. To become `seller`/`fleet_manager`, user must **create a business**. To become `rider`, user must **create a rider profile**. Until they complete one of these, the user is `buyer` and has no access to role-grouped screens. After role selection, detect which prerequisite is incomplete and show the completion screen. Once completed, role upgrades and they enter the correct role group.
- **KYC is optional** — show/prompt KYC but let user complete it later.

---

## Phase 0: Foundation (do first)

- [ ] Install missing packages from `../TeincFood/package.json` (bottom-sheet, polyline, firebase, google-signin, crypto, web-browser, geolib, confirmation-code-field, sonner-native)
- [ ] Update `app.json` — add map, firebase, web-browser plugins; add Paystack extra config
- [ ] Create `.env` file with API_URL, WS_URL, Paystack keys, Google OAuth IDs (from `../TeincFood/.env`)
- [ ] Update `src/utils/constants.ts` — add `WS_BASE_URL`, `CHAT_STORAGE_KEYS`, `CHAT_CONFIG`
- [ ] Port Phoenix WebSocket: `phoenix-socket.service.ts`, `events.service.ts`, `chat.service.ts`, `order-events.service.ts`, `auth-cleanup.service.ts`
- [ ] Rewrite `auth.service.ts` — replace mockBackend with real `POST /api/v1/auth/*` calls
- [ ] Rewrite `notifications.service.ts` — replace mock stream with real API + WebSocket events
- [ ] Rewrite `payment.service.ts` — replace mock with real Paystack integration
- [ ] Rewrite `promo.service.ts` — replace mock with `POST /api/v1/promo/validate`
- [ ] Rewrite `bootstrap.service.ts` — replace mock with real API
- [ ] Rewrite `devices.service.ts` — replace mock push token registration
- [ ] Rewrite `location.service.ts` — replace mock with real API
- [ ] Rewrite `live-activities.service.ts` — replace mock with real API
- [ ] Rewrite `messages.service.ts` — replace mockChatSocket + mockBackend with real HTTP + WS
- [ ] Create `profile.service.ts` — port from buyer app
- [ ] Create `address.service.ts` — port from buyer app
- [ ] Create `places.service.ts` — port from buyer app
- [ ] Create `directions.service.ts` — port from buyer app
- [ ] Create `notification-preferences.service.ts` — port from buyer app
- [ ] Port shared hooks: `useAuth`, `useAuthVerification`, `useProfile`, `useAddresses`, `usePushTokenRegistration`, `useEventsConnection`, `usePayment`, `usePasswordRecovery`, `usePlacesSearch`, `useCurrentLocation`, `useChat`, `useMessages`, `useNotifications`
- [ ] Create `src/models/kiosk.model.ts` — extract `KioskOrder` type from `mock-data.service.ts`
- [ ] Create `src/models/seller.model.ts` — extract `SellerOrder` type from `mock-data.service.ts`
- [ ] Remove direct mock imports: `app/(seller)/(drawer)/orders/index.tsx`, `app/(seller)/orders/[id].tsx`, `app/(seller)/(drawer)/dashboard/kiosk.tsx`, `app/(rider)/map/index.tsx`
- [ ] Remove mock file references from kiosk/seller/dashboard hooks (replace type imports)
- [ ] Connect auth screens: `login.tsx`, `signup.tsx`, `verification.tsx`, `forgot-password.tsx`, `role.tsx`
- [ ] Build role-completion gateway: on login, user picks role from role selector → detect if prerequisite (business for seller/fleet, rider profile for rider) is incomplete → show completion screen → once complete, upgrade role and route to correct role group.

---

## Phase 1: Rider

- [ ] Rewrite `rider.service.ts` — all functions call real API endpoints
- [ ] Add real-time delivery updates to rider drawer layout
- [ ] Verify rider screens: home, deliveries, earnings, settings (vehicle, zones, navigation)
- [ ] Fix `app/(rider)/map/index.tsx` — remove inline mock, use `useActiveDeliveryQuery()`

---

## Phase 2: Seller

- [ ] Rewrite `seller.service.ts` — all functions call real API
- [ ] Rewrite `seller-dashboard.service.ts` — real API
- [ ] Rewrite `seller-analytics.service.ts` — real API
- [ ] Rewrite `menu.service.ts` — real API (CRUD items, categories, variants, addons)
- [ ] Rewrite `kiosk.service.ts` — real API + WS events
- [ ] Verify seller screens: dashboard, orders, menu, analytics, kiosk, businesses, settings

---

## Phase 3: Fleet Manager

- [ ] Create `fleet.service.ts` — all endpoints: riders, vehicles, join requests, invitations
- [ ] Create `fleet.hooks.ts` — query/mutation hooks matching service
- [ ] Clean `fleet.store.ts` — remove mock default data
- [ ] Verify fleet screens: dashboard, riders, vehicles, earnings, settings

---

## Phase 4: Communication

- [ ] Wire up chat service with Phoenix WebSocket channels
- [ ] Verify inbox, chat/[userId], support chat, order chat screens
- [ ] Port `chat/support.tsx` and `chat/order.tsx` if missing

---

## Phase 5: Shared Screens

- [ ] Port profile screens: edit, help, complete-profile
- [ ] Verify security, theme, terms, privacy-policy screens work
- [ ] Connect notifications screen to live stream
- [ ] Connect operating-hours screen to API

---

## Phase 6: Cleanup

- [ ] Delete `src/mocks/` directory entirely
- [ ] Delete `src/services/mock-backend.service.ts`
- [ ] Delete `src/services/mock-data.service.ts`
- [ ] Delete `src/services/realtime-mock.service.ts`
- [ ] Remove `@mocks/*` path from `tsconfig.json` (if still there)
- [ ] Run `npx tsc --noEmit` — fix all type errors
- [ ] Run `npx expo start` — verify app boots without mock files
- [ ] Verify all 3 role flows end-to-end with real backend
