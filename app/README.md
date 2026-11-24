# app — Expo Router Application

> Nota: tras el endurecimiento de autenticación, `index.tsx` es ahora una pantalla de
> login (selección de nombre + PIN compartido) en lugar del selector de rol, y el
> rol se deriva del token. `UserTypeContext` se sincroniza desde el token. El
> resto de este documento describe la estructura previa y puede estar parcialmente
> desactualizado.

Route tree, root providers and shared runtime state for the PeñApp client (Expo Router v4, React Native 0.76, react-native-paper, NativeWind, TanStack Query).

## Overview

| File | Role |
| --- | --- |
| `_layout.tsx` | Root drawer + provider stack (QueryClient, waiter, user type, alert Snackbar). |
| `index.tsx` | Home screen: role selector, waiter selector, table range, role navigation. |
| `add_manual_order.tsx` | Manual order form available to cashier and kitchen roles. |
| `waiter/` | Waiter order-taking flow and order list/edit routes. |
| `cashier/` | Cashier order approval route. |
| `chef/` | Kitchen order readiness route. |

The app is a thin client: every route reads/writes through `penapp/hooks/useApi` (axios, base path `/api/`) and reuses `penapp/components` for order rendering and order entry. Screens never talk to the backend directly.

## Interface

### Routes (expo-router file routes)

| Path | File | Default export |
| --- | --- | --- |
| `/` | `index.tsx` | `Index` |
| `/add_manual_order` | `add_manual_order.tsx` | `AddManualOrder` |
| `/cashier/orders` | `cashier/orders.tsx` | `CashierOrders` |
| `/chef/orders` | `chef/orders.tsx` | `ChefOrders` |
| `/waiter/take_order` | `waiter/take_order.tsx` | `TakeOrder` |
| `/waiter/orders` | `waiter/orders/index.tsx` | `Orders` |
| `/waiter/orders/[id]/edit` | `waiter/orders/[id]/edit.tsx` | `EditOrder` |

### Module exports (`_layout.tsx`)

- `default RootLayout` — provider composition.
- `WaiterContextType` = `{ waiter: WaiterTables; setWaiter: React.Dispatch<React.SetStateAction<WaiterTables>> }`.
- `WaiterContext` — `createContext({})`, consumed with an explicit cast to `WaiterContextType`.
- `UserTypeContextType` = `{ userType: UserType; setUserType: React.Dispatch<React.SetStateAction<UserType>> }`.
- `UserTypeContext` — `createContext<UserTypeContextType | null>(null)`.
- `AlertContextType` = `{ alertMessage: string; setAlertMessage; onDismiss: (() => any) | null; setOnDismiss }`.
- `AlertContext` — `createContext({})`.
- Not exported: `queryClient`, `WaiterProvider`, `UserTypeProvider`, `AlertProvider`, `MyDrawer`, `MyPortal`.

### Other module exports

- `index.tsx`: `default Index`; `UserTypeSelector` is not exported.
- `add_manual_order.tsx`: `default AddManualOrder`; `InternalAddManualOrder({ reset })` is not exported.

### Drawer registration (`MyDrawer`)

`<Drawer backBehavior="history">` with screens `index`, `cashier/orders`, `add_manual_order`, `chef/orders`, `waiter/orders/index`, `waiter/take_order`, `waiter/orders/[id]/edit`.

| Screen | Label | Visibility |
| --- | --- | --- |
| `index` | Inicio | always |
| `cashier/orders` | Ver pedidos | `userType == UserType.Cashier` |
| `add_manual_order` | Agregar pedido | `userType` is Cashier or Chef |
| `chef/orders` | Ver pedidos | `userType == UserType.Chef` |
| `waiter/orders/index` | Ver pedidos | `userType == UserType.Waiter && !!waiter` |
| `waiter/take_order` | Tomar pedido | `userType == UserType.Waiter && !!waiter` |
| `waiter/orders/[id]/edit` | — | hidden (`display: "none"`) |

Hidden entries are rendered with `drawerItemStyle.display = "none"`; the route still exists and is reachable programmatically.

### React Query keys used in this tree

- `["foods"]`, `["drinks"]` — item catalogs (take_order, edit, add_manual_order).
- `["order", id]` — single order (edit).
- `["orders", params]` — order lists (`OrderListing`, with `GetOrdersParams` as the key parameter).
- Root `QueryClient` defaults: `staleTime: 1000 * 60 * 5`, `retry: 1`; no global `refetchInterval`.

### Contexts and persistence

- `WaiterContext` ← AsyncStorage `"waiter_obj"`; written back whenever `waiter` is truthy.
- `UserTypeContext` ← AsyncStorage `"userType"`; written on every `userType` change.
- `AlertContext` — message + dismissal callback rendered by `MyPortal` as a `react-native-paper` `Snackbar` inside a `Portal`.

### API endpoints reached from this subtree

`GET /api/tables/`, `GET /api/waiters/`, `GET /api/foods/`, `GET /api/drinks/`, `GET /api/orders/` (+ `?waiter=`, `?status=`), `GET /api/orders/<id>/`, `POST /api/place_order/`, `PUT /api/orders/<id>/`, `POST /api/orders/<id>/update_status`, `PATCH /api/waiters/<name>/`.

`Idempotency-Key` is sent only by `POST /api/place_order/`, `PUT /api/orders/<id>/` and the cancellation `POST /api/orders/<id>/update_status`; the status buttons in `OrderListing`-based screens send no such header.

## Invariants

- Provider order is fixed: `QueryClientProvider` → `WaiterProvider` → `UserTypeProvider` → `AlertProvider` → `PaperProvider(theme=Theme)` → `GestureHandlerRootView` → `MyDrawer` + `MyPortal`.
- `waiter_obj` is only accepted if it satisfies `isWaiter`: an object containing `name`, `from_table`, `to_table`. Non-conforming payloads are logged (`"Not WaiterTable"`) and ignored, so the app starts with `waiter` undefined.
- `userType` is only restored if it is one of `Object.values(UserType)` (`"undef" | "waiter" | "cashier" | "chef"`); otherwise `UserType.Undefined` remains.
- The `userType` persistence effect runs on mount as well, writing the current value (initially `UserType.Undefined`) before the async read resolves; the waiter effect writes only when `waiter` is set.
- `alertMessage` non-empty is the single visibility condition for the Snackbar; dismissal clears `alertMessage` and `onDismiss` first, then invokes the stored callback. Setting `onDismiss` to `null` makes dismissal a no-op.
- Home role selector maps segmented values through `UserTypeByKey`; labels are "Mozo", "Caja", "Cocina".
- Home requires a selected waiter before exposing waiter actions: `HelperText type="error"` is visible while `!waiter`, the dropdown border is red while `!waiter`, and "Tomar pedido"/"Ver pedidos" render only when `waiter` is truthy.
- Table range edits mutate `waiter.from_table` / `waiter.to_table` in context immediately; `PATCH /api/waiters/<name>/` fires on blur only when the value differs from `lastUpdatedTables` (initialized from `waiter` or `0`).
- `waiters` and `tables` are re-fetched on focus and on `userType` change; failures go to `console.error`.
- Role shortcuts: Chef → `/chef/orders` and `/add_manual_order`; Cashier → `/cashier/orders` and `/add_manual_order`; Waiter → `/waiter/take_order` and `/waiter/orders`.
- `add_manual_order` requires a payment method (`buildOrder` throws `"Selecciona un método de pago"`) but no waiter; `table` is attached only when a table is selected. It uses `TableTopBar` with `autoCurrentTable={false}` and `forceAllTables={true}`, so all tables are listed and none is auto-chosen.
- Manual order success routes by role: Chef → `/chef/orders`, Cashier → `/cashier/orders`, otherwise `/`.
- Route-level reset pattern: `TakeOrder`, `AddManualOrder` and `EditOrder` render an internal component with `key={Math.random().toString()}` and regenerate the key on focus, and all three accept `isFocused`-gated queries. This remount is what resets form state and (for `useIdemKey` instances that never call `regenerateKey`, i.e. edit) rotates the idempotency key.
- `["foods"]`/`["drinks"]` are invalidated on focus entry, focus exit and after order mutations in take_order, edit and add_manual_order; list screens invalidate `["orders"]` on focus.
- Loading gates: edit renders `ActivityIndicator` until its order query resolves; `OrderListing` renders `ActivityIndicator` until its orders query resolves; take_order and add_manual_order render the form immediately (their `isLoading*` values, where destructured, are unused).

## Side Effects

- Storage: `AsyncStorage.setItem("userType", userType)` on mount and every role change; `AsyncStorage.setItem("waiter_obj", JSON.stringify(waiter))` whenever a waiter is set.
- HTTP: role-dependent — waiters/tables and `PATCH /api/waiters/<name>/` from home; item catalogs and order mutations from the order-entry routes; order lists polled every 10 s by `OrderListing`; status updates from cashier/chef/waiter boards.
- Cache: `["foods"]`/`["drinks"]` invalidation from order-entry screens; `["orders"]` invalidation from list screens.
- Navigation: `router.navigate` targets listed above; `router.replace("/")` is the waiter guard in `take_order`; edit navigates to `/waiter/orders` from Snackbar dismissal.
- UI feedback: Snackbar messages (`"Comanda enviada: #id"`, `"Comanda agregada: #id"`, `"Comanda enviada"`, `"Comanda anulada"`, `"Error: …"`); errors are also logged to the console.

## Verification

```bash
cd /Users/facundochaud/projects/penapp
npx tsc --noEmit
npm run lint
```

`npm test` runs `jest --watchAll`; no test or spec files exist in the repository, so it exercises nothing. `npm run lint` is `expo lint`. TypeScript path alias `@/*` maps to the project root (e.g. `@/app/_layout`, `@/hooks/useApi`).

## Child Contracts

- [Waiter role](./waiter/README.md) — order taking, waiter order list and order editing.
- [Cashier role](./cashier/README.md) — approve/reject placed orders.
- [Kitchen role](./chef/README.md) — drink/food readiness and pickup.
