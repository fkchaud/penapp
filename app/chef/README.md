# Kitchen Role (`chef`)

Kitchen order board: marks drink and food readiness independently, then hands the prepared order to the waiter.

## Overview

| File | Role |
| --- | --- |
| `orders.tsx` | Route component for the kitchen order list. |

List rendering, polling and filtering are delegated to `penapp/components/OrderListing.tsx`; HTTP goes through `penapp/hooks/useApi`.

Parent: [app](../README.md)

## Interface

### Route

- `/chef/orders` — `orders.tsx`.
- Drawer entry `chef/orders`, label "Ver pedidos", title "Pedidos (Cocina)", `display: userType == UserType.Chef ? "flex" : "none"` (see [app](../README.md)).

### Module exports (`orders.tsx`)

- `default ChefOrders` — route component; reads `useRouter`, builds availability-dependent actions, passes them to `OrderListing`.
- `ActionButton` — not exported. Props: `key: string`, `text: string`, `apiParams: UpdateOrderStatusParams` (imported from `penapp/hooks/useApi`), `onFinishAction: () => void`.

### `OrderListing` contract used here

- Query key: `["orders", getOrderParams]`; `getOrderParams` is omitted, so all orders are fetched.
- `GET /api/orders/`; `ActivityIndicator` until data resolves; `refetchInterval: 10000` while focused (gated by `useIsFocused()`; no polling on blur); `refetchOnMount`/`refetchOnWindowFocus: "always"`; invalidates `["orders"]` on focus.

### API calls

- `POST /api/orders/<id>/update_status` via `useApi().updateOrderStatus(apiParams)` with bodies:
  - `{ orderId, orderStatus, areDrinksReady: true }`
  - `{ orderId, orderStatus, areFoodReady: true }`
  - `{ orderId, orderStatus: "PICKED_UP" }`
- No `Idempotency-Key` header is passed.

## Invariants

- Status buckets are exact: active `["PLACED", "ACCEPTED", "PREPARING", "PREPARED"]`, inactive `["PICKED_UP", "DELIVERED"]`. `REJECTED` and `CANCELED` belong to neither bucket and are filtered out entirely.
- `PLACED` is in the active bucket but produces no actions: readiness actions require `last_status.status` of `"ACCEPTED"` or `"PREPARING"`.
- "Bebidas listas" is offered only while `!order.are_drinks_ready`; its target status is `"PREPARED"` when `are_food_ready` is already true, otherwise `"PREPARING"`.
- "Comida lista" is offered only while `!order.are_food_ready`; its target status is `"PREPARED"` when `are_drinks_ready` is already true, otherwise `"PREPARING"`.
- "Retirado por el mozo" is offered when `last_status.status == "PREPARED"` and targets `"PICKED_UP"`.
- Readiness actions call `onActionRefresh(order)`, which invalidates `["orders"]` but keeps the modal open so the other readiness button can be pressed. The pickup action calls `onActionClose`, which clears the selection and invalidates.
- Failures still call `onFinishAction`; `ActionButton` disables and shows loading while pending.
- The screen adds an "Agregar pedido" button (`beforeComponent`) that navigates to `/add_manual_order`.
- Orders are not scoped to a waiter; the whole order table is fetched.

## Side Effects

- HTTP: `GET /api/orders/` (10 s polling while focused; none on blur); `POST /api/orders/<id>/update_status` on each readiness/pickup action.
- Cache: `["orders"]` invalidation via `OrderListing` (focus and actions).
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
