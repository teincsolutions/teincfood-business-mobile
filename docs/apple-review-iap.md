# App Store resubmission — IAP + Widget removal

Context: submission `6457c79a-d9c9-41c8-91d6-51d0a1ba48be`, version `1.0.0 (29)`,
rejected for Guideline 3.1.1 (subscriptions not purchasable with IAP) and
Guideline 2.1 (asks for steps to locate the "Widget" feature).

## What changed in the app

### 2.1 — the Widget is gone
The only WidgetKit artifact was a **Live Activity** extension
(`com.apple.widgetkit-extension`, target `LiveActivity`) that no code ever
started. There is no home-screen widget, Today widget, or widget-gallery item.

- `@teincfood/rn-notifications` no longer adds `expo-live-activity` unless
  `liveActivities: true` (via `patches/@teincfood+rn-notifications+0.2.2.patch`).
- `app.config.js` passes `{ liveActivities: false }`.
- `expo-live-activity` and the dead `ios-live-activities.service.ts` are removed.
- A clean prebuild has **zero** `LiveActivity` references and no
  `NSSupportsLiveActivities` / `ExpoLiveActivity_*` Info.plist keys.

Verify before uploading:

```bash
npx expo prebuild --platform ios --clean
grep -r LiveActivity ios/ || echo "clean"
```

### 3.1.1 — paid plans are now purchasable with IAP
- iOS now buys paid plans through StoreKit (`expo-iap`, StoreKit 2):
  `app/(shared)/wallet/plans.tsx` + `src/hooks/useAppleIap.ts`.
- The app shows the **App Store localized price** (`displayPrice`) for each
  plan, not the backend GHS amount.
- After purchase the signed transaction is sent to
  `POST /api/v1/businesses/:id/subscription/apple/verify`; the backend verifies
  Apple's certificate chain and only then activates the plan.
- `finishTransaction` runs only after the backend grants the plan.
- **Restore purchases** and **Manage subscription** actions are on the Plans
  screen.
- Mobile-money payment for subscriptions is hidden on iOS (BillingCard and
  Invoices); Apple-managed subscriptions show "Manage in the App Store".

## 1. App Store Connect setup (required before review)

Create one subscription group: **TeincFood Business Plans**, then these six
auto-renewable subscriptions:

| Plan | Cycle | Product ID | Suggested price |
| --- | --- | --- | --- |
| Starter | monthly | `com.teincfood.business.sub.starter.monthly` | GHS 90 |
| Starter | yearly | `com.teincfood.business.sub.starter.yearly` | GHS 900 |
| Standard | monthly | `com.teincfood.business.sub.standard.monthly` | GHS 199 |
| Standard | yearly | `com.teincfood.business.sub.standard.yearly` | GHS 1,990 |
| Enterprise | monthly | `com.teincfood.business.sub.enterprise.monthly` | GHS 399 |
| Enterprise | yearly | `com.teincfood.business.sub.enterprise.yearly` | GHS 3,990 |

For each product: reference name, localized display name/description, duration,
price, and "Ready to Submit". Attach all six to the app version under
**In-App Purchases and Subscriptions**.

Also:
- Paid Applications agreement must be active.
- App Store Server Notifications V2 URL:
  `https://api.teincfood.com/webhooks/apple/app-store` (Production + Sandbox).
- Prices in the app come from StoreKit, so they must exist in App Store Connect.

## 2. Map plans to products (after deploying the backend)

```sql
update subscription_plans
   set apple_product_id_monthly = 'com.teincfood.business.sub.starter.monthly',
       apple_product_id_yearly  = 'com.teincfood.business.sub.starter.yearly'
 where slug = 'starter';

update subscription_plans
   set apple_product_id_monthly = 'com.teincfood.business.sub.standard.monthly',
       apple_product_id_yearly  = 'com.teincfood.business.sub.standard.yearly'
 where slug = 'standard';

update subscription_plans
   set apple_product_id_monthly = 'com.teincfood.business.sub.enterprise.monthly',
       apple_product_id_yearly  = 'com.teincfood.business.sub.enterprise.yearly'
 where slug = 'enterprise';
```

The Plans endpoint (`/businesses/:id/billing` and `/public/subscription-plans`)
returns these ids; plans without an id simply never offer an IAP button.

`APPLE_BUNDLE_ID` defaults to `com.teincfood.business`.

## 3. Test with a Sandbox Apple ID

1. Build a new iOS binary (clean prebuild).
2. Sign in to a sandbox tester account on the device (Settings → App Store →
   Sandbox Account).
3. Choose Standard (monthly) → StoreKit sheet shows the localized price.
4. Complete the purchase → the app calls the verify endpoint → plan becomes
   active.
5. Delete the app, reinstall, open Plans → **Restore purchases** → plan returns.
6. Confirm no mobile-money payment sheet appears for an Apple subscription.

## 4. Reply to App Review

> Hello,
>
> Thank you for the details. We have addressed both items.
>
> **Guideline 3.1.1 — In-App Purchase**
> Paid subscription plans in TeincFood Business are now available for purchase
> in the app using In-App Purchase. The Plans screen offers auto-renewable
> subscriptions in the "TeincFood Business Plans" group (monthly and yearly for
> Starter, Standard, and Enterprise). The app displays the App Store's localized
> price, completes the purchase with StoreKit, and restores purchases with the
> "Restore purchases" action. Customers can also manage or cancel from
> "Manage subscription", which opens the App Store subscription management
> screen. Mobile-money payment is no longer offered for subscriptions in the
> iOS app.
>
> **Guideline 2.1 — Widget**
> The Widget feature has been removed. The previous build contained a dormant
> ActivityKit Live Activity extension that was never started by any screen; it
> was not a home-screen or widget-gallery widget. It is no longer part of the
> app, so there are no steps to locate it: there is no Widget feature in this
> build.
>
> Please let us know if anything else is needed.

## 5. Remaining follow-ups

- Android still uses mobile money for plans; Google Play requires Play Billing
  for the same reason. The backend product-id columns are ready for it.
- `EXPO_PUBLIC_ENTITLEMENT_SECRET` still ships in the client (see the secret
  rotation follow-up).
