# Cashier Role (`cashier`)

Cashier order board: approves or rejects newly placed orders and can start a manual order.

## Overview

| File | Role |
| --- | --- |
| `orders.tsx` | Route component for the cashier order list. |

List rendering, polling and filtering are delegated to `penapp/components/OrderListing.tsx`; HTTP goes through `penapp/hooks/useApi`.

Parent: [app](../README.md)

## Interface

### Route

- `/cashier/orders` — `orders.tsx`.
- Drawer entry `cashier/orders`, label "Ver pedidos", title "Pedidos (Caja)", `display: userType == UserType.Cashier ? "flex" : "none"` (see [app](../README.md)).

### Module exports (`orders.tsx`)

- `default CashierOrders` — route component; reads `useRouter`, passes `orderActionsBuilder`, status buckets and `beforeComponent` to `OrderListing`.
- `ActionButton` — not exported. Props: `key: string`, `text: string`, `order: Order`, `targetStatus: OrderStatus`, `onFinishAction: () => void`.

### `OrderListing` contract used here

- Query key: `["orders", getOrderParams]`; `getOrderParams` is omitted, so no `waiter`/`status` query string is applied and all orders are fetched.
- `GET /api/orders/`; `ActivityIndicator` until data resolves; `refetchInterval: 10000` while focused (gated by `useIsFocused()`; no polling on blur); `refetchOnMount`/`refetchOnWindowFocus: "always"`; invalidates `["orders"]` on focus.

### API calls

- `POST /api/orders/<id>/update_status` via `useApi().updateOrderStatus({ orderId: order.id, orderStatus })` — no `Idempotency-Key` header is passed.
- `GET /api/foods/` / `GET /api/drinks/` are not queried here; ordering happens on the manual-order route.

## Invariants

- Status buckets are exact: active `["PLACED"]`, inactive `["ACCEPTED", "PREPARING", "PREPARED", "PICKED_UP", "REJECTED", "DELIVERED"]`.
- `CANCELED` appears in neither bucket, so canceled orders are filtered out of both the active and the "Pasadas" sections.
- Actions are returned only when `order && order.last_status?.status == "PLACED"`: "Aprobar" targets `"ACCEPTED"`, "Rechazar" targets `"REJECTED"`. Every other status yields an empty action array.
- Both actions close the action modal through `onFinishAction` (`onActionClose`) on success **and** on error; `onActionClose` clears the selected order and invalidates `["orders"]`.
- `ActionButton` disables and shows loading while its mutation is pending.
- The screen adds an "Agregar pedido" button (`beforeComponent`) that navigates to `/add_manual_order`.
- Orders are not scoped to a waiter or to the cashier role; the whole order table is fetched.

## Side Effects

- HTTP: `GET /api/orders/` (10 s polling while focused; none on blur); `POST /api/orders/<id>/update_status` on approve/reject.
- Cache: `["orders"]` invalidation via `OrderListing` (focus and modal actions).
- Storage: none.
- Navigation: `router.navigate("/add_manual_order")`.
- UI feedback: button loading state only; errors are logged with `console.error`.

## Verification

```bash
cd /Users/facundochaud/projects/penapp
npx tsc --noEmit
npm run lint
```

`npm test` runs `jest --watchAll`; no test or spec files exist in the repository, so it exercises nothing.
