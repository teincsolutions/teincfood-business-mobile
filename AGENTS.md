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
