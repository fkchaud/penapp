# PenApp Components

> Presentational layer for PenApp: order cards, polling order listings, a
> masonry grid, and generic top/bottom bars. Components render server-shaped
> domain objects and delegate all data access to callers and hooks.

## Overview

| File | Export | Role |
| --- | --- | --- |
| `OrderCard.tsx` | `OrderCard`, `StatusLabel`, `PaymentMethodLabel`, `PaymentMethodIcon` | Read-only summary card for one `Order`: id, waiter, table, food/drink lines, comment, total, payment icon, status chip. |
| `OrderListing.tsx` | `OrderListing`, `OrderActionsBuilder` (type) | Owns the orders query, splits active vs. past orders by caller-provided status arrays, and opens a modal with `OrderCard` plus caller-built actions. |
| `OrderMasonry.tsx` | `OrderMasonry` (default) | Responsive staggered grid of tappable `OrderCard`s with pull-to-refresh. |
| `TopBar.tsx` | `TopBar` | Container with the app's top-bar chrome (`p-2`, white, bottom border). |
| `BottomBar.tsx` | `BottomBar` | Container with the app's bottom-bar chrome (`p-3`, top border). |

Domain types are imported from `@/types`; `getTableShowable` from
`@/utils/tables`; `GetOrdersParams` and `useApi` from `@/hooks/useApi`.

Child directory:

- [OrderTaking](./OrderTaking/README.md) - Table selection, item picking, comment bar, and checkout modal for the order-taking screen.

## Interface

### `OrderCard`

Props type is an inline object literal (no exported alias):

| Prop | Type | Required |
| --- | --- | --- |
| `order` | `Order \| null` | yes |
| `className` | `string` | no |
| `style` | `ViewStyle` | no |

Additional props are spread onto the root `View` via an untyped `...props` rest.

Also exported from `OrderCard.tsx`:

- `PaymentMethodLabel: Record<PaymentType, string>` — `CASH`/`TRANSFER`/`MERCADOPAGO`/`VOUCHER` → Spanish labels.
- `PaymentMethodIcon: Record<PaymentType, { name: string; lightColor: string; darkColor: string }>` — icon name per payment type.
- `StatusLabel: ({ status }: { status: OrderStatus }) => JSX.Element` — standalone `react-native-paper` `Chip`.

`OrderCard` itself consumes a module-private `StatusLabels` record (text,
Tailwind class, `isDark`), not the exported `StatusLabel`.

### `OrderListing` — props `OrderListingProps`

| Prop | Type | Required |
| --- | --- | --- |
| `activeOrderStatuses` | `OrderStatus[]` | yes |
| `inactiveOrderStatuses` | `OrderStatus[]` | yes |
| `orderActionsBuilder` | `OrderActionsBuilder` | yes |
| `beforeComponent` | `React.ReactNode` | no |
| `getOrderParams` | `GetOrdersParams` | no |

```ts
type OrderActionsBuilder = (
  order: Order | null,
  onActionClose: () => void,
  onActionRefresh: (order: Order) => void,
) => React.ReactNode;

interface GetOrdersParams { waiter?: string; status?: OrderStatus | OrderStatus[] }
```

`OrderActionsBuilder` is exported; `OrderListingProps` is not.

### `OrderMasonry` — props `Props` (local, default export)

| Prop | Type | Required | Default |
| --- | --- | --- | --- |
| `orders` | `Order[]` | yes | — |
| `onPressCard` | `(order: Order) => void` | yes | — |
| `onRefresh` | `() => Promise<void>` | yes | — |
| `maxWidth` | `number` | no | `180` |
| `inactive` | `boolean` | no | `false` |
| `className` | `string` | no | — |
| `touchableOpacityClassName` | `string` | no | — |
| `orderCardClassName` | `string` | no | — |
| `style` | `ViewStyle` | no | — |
| `touchableOpacityStyle` | `ViewStyle` | no | — |
| `orderCardStyle` | `ViewStyle` | no | — |

Delegates rendering to `@mindinventory/react-native-stagger-view` with
`animationType="SLIDE_LEFT"` and `numColumns = Math.floor(screenWidth / maxWidth)`.
Each item is a `TouchableOpacity` (`w-44`) wrapping `OrderCard`; when `inactive`
the card gets `opacity-50`.

### `TopBar` / `BottomBar` — props `TopBarProps` / `BottomBarProps`

| Prop | Type | Required |
| --- | --- | --- |
| `children` | `ReactNode` (via `PropsWithChildren`) | yes |
| `className` | `string` | no |

Remaining props are spread onto the root `View`.

## Invariants

- **`OrderCard` is null-safe only at the top level.** It returns `null` when
  `order` is falsy; past that guard it dereferences `order.last_status.status`,
  `order.foods`, `order.drinks`, `order.payment_type`, and `order.total_price`
  unconditionally. `order.waiter` and `order.table` are guarded individually.
- **Card status and payment lookups may be undefined.** `StatusLabels` and
  `PaymentMethodIcon` are `Record`-typed, yet the render guards with
  `statusLabel?.className` / `paymentMethodIcon &&`, so an out-of-contract key
  degrades instead of throwing in those spots. The `last_status.status` read in
  `StatusLabels[order.last_status.status]` still assumes `last_status` exists.
- **Two independent status vocabularies exist.** `OrderCard` uses the private
  `StatusLabels` table (`DELIVERED` → green, `CANCELED` → black/white,
  `isDark`), while the exported `StatusLabel` chip uses its own `conversion`
  table (`DELIVERED` → `white`, `CANCELED` → `cyan`). Labels agree; colors and
  dark-mode handling do not.
- **`OrderListing` renders a loading indicator until the query resolves.**
  `if (!orders) return <ActivityIndicator size="large" />` short-circuits before
  `beforeComponent`, the refresh button, and both grids.
- **The active/past partition is entirely caller-defined.** Both grids come from
  `orders.filter((o) => statuses.includes(o.last_status.status))` using
  `activeOrderStatuses` and `inactiveOrderStatuses`; an order whose status
  appears in neither array is rendered nowhere, and one in both appears twice.
- **`OrderListing` owns the polling query.** `useQuery` key
  `["orders", getOrderParams]`, `queryFn: getOrders(getOrderParams)`,
  `refetchInterval: isFocused ? 10000 : false`, `refetchOnMount: "always"`,
  `refetchOnWindowFocus: "always"`. The interval is gated on `useIsFocused()`
  because the drawer keeps visited screens mounted: without the guard the poll
  would keep running after navigating away. There is no pagination or result cap.
- **The past-orders section is conditional and collapsed by default.**
  `hideInactive` starts `true`; the section renders only when
  `inactiveOrders().length > 0`, and while hidden the grid carries `hidden`.
- **The modal is bound to both selection and focus.** It is
  `visible={!!currentOrder && isFocused}`; `currentOrder` is re-synced from each
  poll by id (`orders.find((o) => o.id == currentOrder.id)`), and a vanishing
  order leaves the stale object selected.
- **`onActionRefresh` ignores its argument.** `OrderListing` passes a zero-arg
  `() => invalidateOrders()` where `OrderActionsBuilder` expects
  `(order: Order) => void`; TypeScript accepts the narrower arity, and no
  order-specific refresh occurs.
- **Modal card scaling is width-derived.** `cardScale()` returns `2` above
  `256 / 0.45`px and a linear ratio below, applied as a `transform.scale` around
  a fixed `width: 256` card.
- **`OrderMasonry` has no empty-state and no column floor.**
  `numColumns = Math.floor(screenWidth / 180)` can evaluate to `0` on a viewport
  narrower than `maxWidth`, which is not a valid column count; there is no guard.
- **`OrderMasonry` refresh state is local and promise-bound.** `refreshing`
  becomes `true` immediately and returns to `false` only when `onRefresh()`'s
  promise settles; a rejected promise leaves the spinner state unresolved
  (`then` with no `catch`).
- **`TopBar`/`BottomBar` are pure layout.** They add no behaviour beyond
  `className` concatenation and prop spreading; `TopBar` always applies its base
  classes before any caller `className`.

## Side Effects

- `OrderListing`: HTTP `GET /api/orders/` through `useApi().getOrders`, with
  optional `waiter` and `status` query parameters (arrays joined by `,`),
  executed by React Query on mount, every 10s while the screen is focused
  (`refetchInterval: false` on blur), and on window focus.
- `OrderListing`: `queryClient.invalidateQueries({ queryKey: ["orders"] })` on
  screen focus, on the `Actualizar` button, on pull-to-refresh from either grid,
  on `onActionClose`, and on `onActionRefresh`.
- `OrderListing`: local `currentOrder` / `hideInactive` state controls modal
  open/close and section collapse; it calls the caller's `orderActionsBuilder`
  with `(order, onActionClose, onActionRefresh)`.
- `OrderMasonry`: invokes the `onRefresh` promise on pull-to-refresh and sets its
  local `refreshing` flag.
- `OrderCard`, `StatusLabel`, `TopBar`, `BottomBar`: render-only; no effects,
  timers, I/O, or global writes.
- No global state stores are written; the only outward-facing data flow is
  through props and the React Query cache.

## Verification

```bash
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```
