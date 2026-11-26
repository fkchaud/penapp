# Waiter Orders (`waiter/orders`)

Waiter-facing order board: composes `OrderListing` with waiter-scoped status buckets and per-order actions (edit, cancel, deliver).

## Overview

| File | Role |
| --- | --- |
| `index.tsx` | Route component for the waiter order list. |
| `[id]/` | Nested edit screen; documented in `[id]/README.md`. |

No order fetching, filtering or polling logic lives here; all of it is delegated to `penapp/components/OrderListing.tsx`.

Parent: [waiter](../README.md)

## Interface

### Route

- `/waiter/orders` — `index.tsx`.
- Child route: `/waiter/orders/[id]/edit`.
- Registered in the root drawer as `waiter/orders/index` with label "Ver pedidos" and title `Pedidos (<waiter.name | "Mozos">)`; visible only when `userType == UserType.Waiter && !!waiter` (see [app](../../README.md)).

### Module exports (`index.tsx`)

- `default Orders` — the route component; reads `WaiterContext` and `useRouter`.
- `OrderStatusActionButton` — not exported. Props: `key: string`, `text: string`, `order: Order`, `targetStatus: OrderStatus`, `onFinishAction: () => void`.

### Components consumed

- `OrderListing` with `beforeComponent`, `orderActionsBuilder`, `activeOrderStatuses`, `inactiveOrderStatuses`, `getOrderParams`.

### `OrderListing` contract used here

- Query key: `["orders", getOrderParams]` → `GET /api/orders/` with query params derived from `GetOrdersParams`.
- `orderActionsBuilder(order, onActionClose, onActionRefresh) => React.ReactNode`.
- `ActivityIndicator` while `orders` is undefined; `refetchInterval: 10000` while focused (gated by `useIsFocused()`; no polling on blur); `refetchOnMount: "always"`; `refetchOnWindowFocus: "always"`; invalidates `["orders"]` on focus.

### API calls

- `GET /api/orders/?waiter=<waiter.name>` through `OrderListing` when a waiter is selected.
- `POST /api/orders/<id>/update_status` through `useApi().updateOrderStatus` (`{ orderId, orderStatus }`), without an `Idempotency-Key` header.

## Invariants

- Status buckets are fixed: active `["PLACED", "ACCEPTED", "PREPARING", "PREPARED", "PICKED_UP"]`, inactive `["REJECTED", "DELIVERED", "CANCELED"]`.
- `getOrderParams` is `{ waiter: waiter.name }` only when `waiter` is truthy, otherwise `undefined`; a missing waiter silently widens the list to all orders. There is no redirect or guard on this route.
- "Editar" is always offered and navigates with `pathname: "/waiter/orders/[id]/edit"`, `params: { id: order.id }`, then closes the action modal.
- "Cancelar" is offered only when `order.last_status.status == "PLACED"` and targets `"CANCELED"`.
- "Entregado" is always offered and targets `"DELIVERED"`.
- Every status mutation calls `onFinishAction` on both success and error; for edit and cancel that is `onActionClose`, which clears the selected order and invalidates `["orders"]`.
- `OrderStatusActionButton` disables and shows a loading state while its mutation is pending.
- The screen itself keeps no state; `OrderListing` owns selection, filters and refresh.

## Side Effects

- HTTP: `GET /api/orders/` (polled every 10 s while focused; none on blur); `POST /api/orders/<id>/update_status` on action press.
- Cache: `["orders"]` invalidation happens inside `OrderListing` (on focus and after actions).
- Storage: none.
- Navigation: `router.navigate("/waiter/take_order")` from the "Tomar pedido" header button; `router.navigate("/waiter/orders/[id]/edit", { id })` from "Editar".
- UI feedback: none beyond button loading state; errors are logged with `console.error`.

## Verification

```bash
cd /Users/facundochaud/projects/penapp
npx tsc --noEmit
npm run lint
```

`npm test` runs `jest --watchAll`; no test or spec files exist in the repository, so it exercises nothing.

## Child Contracts

- [Order edit screen (`[id]`)](./%5Bid%5D/README.md) — dynamic edit route that rewrites or cancels one order.
