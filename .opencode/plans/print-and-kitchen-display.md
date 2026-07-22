# Plan: Post-Payment Print + Kitchen Display

## Feature 1: Print After Order Completion

### Problem
Currently in `CheckoutPanel` (pos/index.tsx:773-775), `printService.printOrderReceipt(orderId)` fires immediately after order creation — *before* the MoMo payment flow starts. This means MoMo orders get a receipt printed even if payment fails/cancels.

### Fix
**File: `app/(seller)/pos/index.tsx` — `CheckoutPanel`**

1. **Add state** `lastCompletedOrderId: string | null` to track the order that just succeeded payment
2. **`executePlaceOrder`**: Only call `printService.printOrderReceipt(orderId)` when `pos_payment_method === 'cash'`. For MoMo, store the `orderId` instead.
3. **Payment success effect** (line 796-800): When `paymentFlow.state === 'success'` and `lastCompletedOrderId` is set, call `printService.printOrderReceipt(lastCompletedOrderId)` — then clear the stored ID.
4. **Payment failure**: Clear `lastCompletedOrderId` on failure (no print on failed payment).

```
// Pseudocode
const [lastCompletedOrderId, setLastCompletedOrderId] = useState<string | null>(null);

executePlaceOrder:
  onSuccess →
    if (cash) → printService.printOrderReceipt(orderId)  // immediate
    if (momo) → setLastCompletedOrderId(orderId)  // deferred

useEffect(paymentFlow.state === 'success'):
  if (lastCompletedOrderId) → printService.printOrderReceipt(lastCompletedOrderId)
  setLastCompletedOrderId(null)

useEffect(paymentFlow.state === 'failed'):
  setLastCompletedOrderId(null)
```

---

## Feature 2: Kitchen Display for Chief

### Concept
A full-screen display (like the existing callout display) but purpose-built for kitchen staff. Shows order items, quantities, and special instructions so the chef can prepare orders. Includes action buttons to advance orders through the pipeline.

### Architecture

**New file: `app/(seller)/kitchen.tsx`** — Kitchen display screen

**Modified files:**
| File | Change |
|------|--------|
| `src/stores/display.store.ts` | Add `kitchenDisplayEnabled` state |
| `app/(seller)/_layout.tsx` | Add kitchen display auto-redirect |
| `app/(seller)/(drawer)/_layout.tsx` | Add "Kitchen Display" drawer menu item |

### Kitchen Display Screen (`kitchen.tsx`)

**Layout:** Same as `display.tsx` — full-screen, 3-column pipeline, keep-awake, biometric exit.

**Columns:**
1. **Pending/Accepted** (orange) — Orders awaiting preparation. Shows `PendingOrderCard` with order items, customer name, notes. "Start Preparing" button.
2. **Preparing** (blue) — Orders in progress. Shows `PreparingOrderCard` with order items, customer name, notes. "Mark Ready" button.
3. **Ready** (green) — Completed orders awaiting pickup/delivery. Shows callout number prominently + order items summary. Auto-dismisses after a timeout or when picked up.

**Key differences from callout display:**
- Uses `PendingOrderCard`/`PreparingOrderCard` components (show items, notes, quantities)
- Action buttons are interactive (Start Preparing, Mark Ready)
- Shows order notes/special instructions for the chef
- Less emphasis on callout number, more on item details

**Hooks used:**
- `usePOSOrdersQuery()` — fetches all orders (reuses POS query)
- `useAcceptKioskOrderMutation()` — accept pending orders
- `useStartPreparingKioskOrderMutation()` — advance to preparing
- `useMarkKioskOrderReadyMutation()` — advance to ready
- `useOrderRealtimeUpdates(POS_KEYS.all)` — WebSocket updates
- `useActiveBusiness()` — business name header
- `useDisplayStore()` — kitchen display flag
- `useSecurityStore()` — biometric exit

**Behavior:**
- Full-screen with keep-awake
- Live clock in header
- Business name in header
- Exit button with biometric auth (same pattern as `display.tsx`)
- Responsive: tablet landscape gets side-by-side columns; phone gets stacked

### Display Store Changes

**File: `src/stores/display.store.ts`**

Add `kitchenDisplayEnabled` boolean + `toggleKitchenDisplay`/`enableKitchenDisplay`/`disableKitchenDisplay` actions. Persisted alongside existing `calloutDisplayEnabled`.

### Layout Redirect

**File: `app/(seller)/_layout.tsx`**

Extend the existing redirect logic:
- If `calloutDisplayEnabled` → redirect to `/(seller)/display`
- If `kitchenDisplayEnabled` → redirect to `/(seller)/kitchen`

### Drawer Menu

**File: `app/(seller)/(drawer)/_layout.tsx`**

Add `DrawerMenuItem` for "Kitchen Display" with `ChefHat` icon, navigating to `/(seller)/kitchen`. Place it right after "Callout Display" in the drawer.

---

## Execution Order

1. Fix print-after-payment in `CheckoutPanel`
2. Add `kitchenDisplayEnabled` to `display.store.ts`
3. Create `kitchen.tsx` screen
4. Update `_layout.tsx` for auto-redirect
5. Add drawer menu item
6. Run `npx tsc --noEmit` to verify
