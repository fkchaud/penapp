# Order Edit (`waiter/orders/[id]`)

Dynamic waiter screen that loads one order, repopulates the order-taking form from it, and submits a full replacement or a cancellation.

## Overview

| File | Role |
| --- | --- |
| `edit.tsx` | Route component for editing a single order by dynamic `id`. |

The screen is a nested sibling of the waiter order list; it composes the shared `OrderTaking` components from `penapp/components` and the API adapter from `penapp/hooks/useApi`.

Parent: [waiter/orders](../README.md)

## Interface

### Route

- `/waiter/orders/[id]/edit` — dynamic segment `id` read through `useLocalSearchParams<{ id: string }>()`.
- Registered in the root drawer as `waiter/orders/[id]/edit` with `drawerItemStyle: { display: "none" }` (see [app](../../../README.md)).

### Module exports (`edit.tsx`)

- `default EditOrder` — wrapper that owns the remount key.
- `InternalEditOrder` — not exported; holds the form, queries and mutations. Props: none. Remounted via `key={Math.random()}` on focus changes.

### React Query keys

- `["order", id]` → `getOrder(id)`; `enabled: isFocused && !!id`.
- `["foods"]` → `getFoods`; `enabled: isFocused`.
- `["drinks"]` → `getDrinks`; `enabled: isFocused`.

### API calls (via `useApi`)

- `GET /api/orders/<id>/` (`getOrder`).
- `GET /api/foods/`, `GET /api/drinks/`.
- `PUT /api/orders/<id>/` (`updateOrder`) with header `Idempotency-Key`.
- `POST /api/orders/<id>/update_status` (`updateOrderStatus`) with body `{ status: "CANCELED" }` and header `Idempotency-Key`.

### Contexts consumed

- `UserTypeContext` (`UserTypeContextType`) — supplies `userType` for the `OrderToPlace` payload.
- `WaiterContext` (`WaiterContextType`) — supplies `waiter`; its `name` is sent as `waiter`.
- `AlertContext` (`AlertContextType`) — `setAlertMessage`, `setOnDismiss` for Snackbar feedback.

### Components composed

- `ConfirmOrderModal` — visibility, maps, table, total, payment method, `onConfirm`, `isLoading`.
- `TableTopBar` — `currentTable`, `setCurrentTable`, `autoCurrentTable={false}`.
- `FoodPicker` — `foods`, `drinks`, maps, add handlers.
- `ConfirmBottomBar` — comment input ref/value, total, `cancelText="Anular"`, `onCancel`, `onContinue`, `isEnabled`.

### Local state

`currentTable: Table | null`, `totalPrice: number`, `comment: string`, `paymentMethod: PaymentType | ""`, `foodToOrder` / `drinksToOrder: QuantityByItem` (`Map<Item, number>`), `confirmModalVisible`, `cancelModalVisible`.

## Invariants

- The component returns `<ActivityIndicator size="large" />` while `isLoadingOrder` is true or `order` is undefined; the form is never rendered without an order.
- Form state is hydrated only when `order`, `foodsData` and `drinksData` are all present: maps are rebuilt from `order.foods` / `order.drinks`, preferring the catalog item for the same `id`, and `comment`, `currentTable`, `paymentMethod` are copied from the order.
- `buildOrder()` throws `Error("Empty payment method")` when `paymentMethod` is `""`.
- `buildOrder()` reads `waiter.name` without a null guard; when no waiter is selected the call throws before any request is issued.
- The confirm action is gated by `isEnabled={totalPrice > 0 && !!currentTable}`; `totalPrice` is recomputed from both maps by an effect after every map change.
- `useIdemKey` seeds `crypto.randomUUID()` once per mounted instance. This file never calls `regenerateKey`; the remount-on-focus pattern is what produces a fresh key, so the update and the cancel mutations share the same key value for the lifetime of an instance.
- The order query is disabled unless the screen is focused and `id` is truthy; foods/drinks queries are disabled unless focused.
- `TableTopBar` receives `autoCurrentTable={false}`, so the table selected from the order is not overwritten by the waiter's default table; the table picker still restricts to the waiter's `from_table`..`to_table` range unless the "Mostrar todas las mesas" checkbox is toggled.
- The two mutations keep the form mounted: only a Snackbar is shown and navigation happens when the Snackbar is dismissed.

## Side Effects

- HTTP: `GET /api/orders/<id>/`, `GET /api/foods/`, `GET /api/drinks/` on focus; `PUT /api/orders/<id>/` on confirm; `POST /api/orders/<id>/update_status` on "Anular pedido".
- Cache: `invalidateQueries(["foods"])` and `invalidateQueries(["drinks"])` on focus change, on unmount, and after each mutation settlement. `["order", id]` and `["orders"]` are not invalidated by this screen.
- Storage: none.
- Navigation: `router.navigate("/waiter/orders")` is installed as `AlertContext.onDismiss` after a successful update or cancellation.
- UI feedback: Snackbar text `"Comanda enviada"`, `"Comanda anulada"`, or `"Error: <message>"`; errors are also logged with `console.error`.
- Mutation state disables the confirm/cancel buttons (`isPending` → `loading` + `disabled`).

## Verification

```bash
cd /Users/facundochaud/projects/penapp
npx tsc --noEmit
npm run lint
```

`npm test` runs `jest --watchAll`; no test or spec files exist in the repository, so it exercises nothing.
