# `hooks/` — Shared React Hooks

## Overview

Platform-independent React hooks consumed by `app/` screens and `components/`. This directory
contains the application's only HTTP adapter (`useApi`), the client-side idempotency key holder
(`useIdemKey`), and the light/dark color-scheme helpers (`useThemeColor`, `useColorScheme`,
`useColorScheme.web`). No persistence, caching, or retry logic lives here; request caching and
refetching are the responsibility of callers (TanStack Query `useQuery` at the call sites).

| File | Responsibility |
| --- | --- |
| `useApi.tsx` | Axios-based HTTP client bound to the relative base `"/api/"`. Single source of all server endpoints. |
| `useIdemKey.tsx` | Holds one `crypto.randomUUID()` per component instance and exposes a regenerator. |
| `useThemeColor.ts` | Resolves a color token for the active scheme, honoring per-call overrides. |
| `useColorScheme.ts` | Re-export of React Native's `useColorScheme`. |
| `useColorScheme.web.ts` | Web/SSR-stable override that always reports `'light'`. |

## Interface

### `useApi.tsx`

```ts
// Roles — coherentes con papi.subpapi.models.StaffRole
export type StaffRole = "waiter" | "cashier" | "chef" | "manager";
export const STAFF_ROLES: StaffRole[];
export const isStaffRole: (r: string) => r is StaffRole;

export interface GetOrdersParams {
  waiter?: string;
  status?: OrderStatus | OrderStatus[];
}

export interface UpdateOrderStatusParams {
  orderId: number | string;
  orderStatus: OrderStatus;
  areFoodReady?: boolean;
  areDrinksReady?: boolean;
}

export interface UpdateOrderStatusApiParams {
  status: OrderStatus;
  are_food_ready?: boolean;
  are_drinks_ready?: boolean;
}

// Request/response types (coherent with penapi serializers/views)
export interface LoginResponse { token: string; name: string; role: StaffRole }
export interface StaffMember { url: string; name: string; role: StaffRole; active: boolean }
export interface CreateStaffRequest { name: string; role: StaffRole; active?: boolean }
export interface StaffBulkItem { name: string; role: StaffRole }
export interface StockItem { id: number; url: string; name: string; initial_quantity: number }
export interface CreateStockRequest { name: string; initial_quantity: number }
export interface UpdateStockRequest { initial_quantity: number }
export interface CreateFoodRequest {
  name: string;
  price: number;
  icon?: string;
  units_per_pack?: number;
  stock?: number | null;
}
export type UpdateFoodRequest = CreateFoodRequest;
export interface FoodBulkItem {
  name: string;
  price: number;
  icon?: string;
  stock?: string;          // nombre del stock, no id
  stock_name?: string;
  units_per_pack?: number;
  initial_quantity?: number;
}
export interface BulkError { index: number; error: string; item?: unknown }
export interface BulkResponse { created: number; updated: number; errors: BulkError[] }
export interface PlaceOrderResponse { orderId: number }

export const useApi: () => {
  // lectura
  getStaff: () => Promise<StaffMember[]>;
  getStocks: () => Promise<StockItem[]>;
  getTables: () => Promise<Table[]>;
  getWaiters: () => Promise<WaiterTables[]>;
  getFoods: () => Promise<Item[]>;
  getDrinks: () => Promise<Item[]>;
  getOrders: (params?: GetOrdersParams) => Promise<Order[]>;
  getOrder: (id: string | number) => Promise<Order>;
  // auth
  login: (name: string, pin: string) => Promise<LoginResponse>;
  // staff (manager)
  createStaff: (data: CreateStaffRequest) => Promise<StaffMember>;
  bulkStaff: (items: StaffBulkItem[]) => Promise<BulkResponse>;
  // stock (manager)
  createStock: (data: CreateStockRequest) => Promise<StockItem>;
  updateStock: (id: number, data: UpdateStockRequest) => Promise<StockItem>;
  // foods (manager)
  createFood: (data: CreateFoodRequest) => Promise<Item>;
  updateFood: (id: number, data: UpdateFoodRequest) => Promise<Item>;
  deleteFood: (id: number) => Promise<void>;
  bulkFoods: (items: FoodBulkItem[]) => Promise<BulkResponse>;
  // orders
  placeOrder: (
    order: OrderToPlace,
    headers?: Record<string, string>,
  ) => Promise<PlaceOrderResponse>;
  updateOrder: (
    orderId: number | string,
    order: OrderToPlace,
    headers?: Record<string, string>,
  ) => Promise<Order>;
  updateOrderStatus: (
    params: UpdateOrderStatusParams,
    headers?: Record<string, string>,
  ) => Promise<Order | undefined>;
  updateWaiter: (waiterTables: WaiterTables) => Promise<WaiterTables | undefined>;
};
```

Endpoint mapping (all relative, no origin, no axios instance):

| Hook method | Verb | Path | Body / query | Return |
| --- | --- | --- | --- | --- |
| `getStaff` | GET | `/api/staff/` | — | `response.data.results` |
| `getStocks` | GET | `/api/stocks/` | — | `response.data.results` |
| `getTables` | GET | `/api/tables/` | — | `response.data.results` |
| `getWaiters` | GET | `/api/waiters/` | — | `response.data.results` |
| `getFoods` | GET | `/api/foods/` | — | `response.data.results` |
| `getDrinks` | GET | `/api/drinks/` | — | `response.data.results` |
| `getOrders` | GET | `/api/orders/` | `?waiter=…` and/or `?status=…` (URL-encoded, `&`-joined) | `response.data.results` |
| `getOrder` | GET | `/api/orders/{id}/` | — | raw `response.data` (`followResults: false`) |
| `login` | POST | `/api/auth/login/` | `{ name, pin }` | raw `response.data` (`{ token, name, role }`) |
| `createStaff` | POST | `/api/staff/` | `CreateStaffRequest` | raw `response.data` |
| `bulkStaff` | POST | `/api/staff/bulk/` | `{ items: StaffBulkItem[] }` | raw `response.data` (`BulkResponse`) |
| `createStock` | POST | `/api/stocks/` | `CreateStockRequest` | raw `response.data` |
| `updateStock` | PATCH | `/api/stocks/{id}/` | `UpdateStockRequest` | raw `response.data` |
| `createFood` | POST | `/api/foods/` | `CreateFoodRequest` | raw `response.data` |
| `updateFood` | PUT | `/api/foods/{id}/` | `UpdateFoodRequest` | raw `response.data` |
| `deleteFood` | DELETE | `/api/foods/{id}/` | — | `undefined` (204) |
| `bulkFoods` | POST | `/api/foods/bulk/` | `{ items: FoodBulkItem[] }` | raw `response.data` (`BulkResponse`) |
| `placeOrder` | POST | `/api/place_order/` | `OrderToPlace` | raw `response.data` (`{ orderId }`) |
| `updateOrder` | PUT | `/api/orders/{orderId}/` | `OrderToPlace` | raw `response.data` (serialized `Order`, not paginated) |
| `updateOrderStatus` | POST | `/api/orders/{orderId}/update_status` | `{ status, are_food_ready?, are_drinks_ready? }` | raw `response.data` |
| `updateWaiter` | PATCH | `/api/waiters/{name}/` | `{ name, from_table, to_table }` | raw `response.data`; `undefined` on 208 empty body |

`updateOrderStatus` uses the internal, non-exported interface
`UpdateOrderStatusApiParams { status: OrderStatus; are_food_ready?: boolean; are_drinks_ready?: boolean }`
to translate camelCase params into the server's snake_case fields.

### `useIdemKey.tsx`

```ts
export const useIdemKey: () => {
  idemKey: MutableRefObject<string | null>;
  regenerateKey: () => void;
};
```

Consumers read the value as `idemKey.current` (e.g.
`{"Idempotency-Key": idemKey.current || ""}`).

### `useThemeColor.ts`

```ts
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
): string;
```

### `useColorScheme.ts` / `useColorScheme.web.ts`

```ts
export { useColorScheme } from 'react-native';        // native
export function useColorScheme(): 'light';            // web (always)
```

## Invariants

1. **Relative base URL only.** `serviceUrl` is the literal `"/api/"`. No axios instance,
   `baseURL`, timeout, interceptor, or default header is configured, so the host origin is
   whatever serves the bundle (Expo dev server proxy / web origin).
2. **`getAny` defaults to unwrapping `results`.** The flag is computed as
   `!options || !("followResults" in options) || options.followResults`, which is `true` when
   `options` is omitted (the inline comment matches this: by default it follows `.results`).
   `getOrder` is the only call site that passes `followResults: false`.
3. **Failed GETs resolve to `undefined`.** `getAny` catches every axios error, calls
   `console.error(error)`, and returns `undefined as unknown as T` without rethrowing. The
   declared return type is `Promise<T>` (no `undefined`), so every `get*` caller must treat a
   missing/`undefined` result as a failure (typically `?? []` at the call site).
4. **Write errors are split by method.** Every write method (`login`, `createStaff`,
   `bulkStaff`, `createStock`, `updateStock`, `createFood`, `updateFood`, `deleteFood`,
   `bulkFoods`, `placeOrder`, `updateOrder`) logs, then throws
   `Error(error.response.data.error)` when the server sent a JSON `error` field, else rethrows
   the original error. `updateOrderStatus` and `updateWaiter` swallow all errors (resolve to
   `undefined`); callers cannot observe failure except through `console.error`.
5. **`getOrders` filter serialization.** A status array is joined with commas into a single
   `status=` value (server-side CSV parsing). Each parameter is `encodeURIComponent`-ed and
   parameters are joined with `&`, so both filters can be supplied together and waiter names
   with special characters are safe.
6. **Falsy readiness flags are dropped.** `updateOrderStatus` attaches `are_food_ready` /
   `are_drinks_ready` only when the incoming value is truthy (`if (areFoodReady) …`), so
   `false` is never transmitted. A readiness flag cannot be reset through this adapter.
7. **Header passthrough is call-site supplied.** `placeOrder`, `updateOrder`, and
   `updateOrderStatus` emit `{ ...(headers ?? {}) }` — an empty object when omitted. No
   `Idempotency-Key` or content-type is injected here; call sites pass it explicitly.
   `updateWaiter` accepts no headers.
8. **`updateOrder` returns the serialized order.** It returns `response.data` directly
   (`OrderViewSet.update` responds with the order, not a paginated envelope), matching
   `placeOrder` and `updateOrderStatus`, which also return `response.data`.
9. **One idempotency key per mount.** `useIdemKey` lazily initializes a `useRef` during render
   and never regenerates on re-render; `regenerateKey` mutates `current` in place and does not
   trigger a render. The returned object is the ref, not the string. Depends on a global
   `crypto.randomUUID` implementation.
10. **Color scheme fallback.** `useThemeColor` treats a `null` scheme as `'light'`; a truthy
    `props[theme]` wins over the token table; an empty-string override is ignored. Because
    `colorName` is constrained to the intersection of light/dark keys, both palettes must
    remain key-identical.
11. **Web always reports light.** Metro resolves `useColorScheme.web.ts` on web, returning a
    constant `'light'` so SSR and hydration markup match; dark mode is unreachable on web
    through this hook.

## Side Effects

- Performs HTTP requests via `axios` on relative `/api/` paths when hook methods are invoked.
- Emits `console.error` on every caught request failure (all methods).
- Throws on failure for every write method (`login`, `createStaff`, `bulkStaff`, `createStock`,
  `updateStock`, `createFood`, `updateFood`, `deleteFood`, `bulkFoods`, `placeOrder`,
  `updateOrder`), preferring the server's JSON `error` field when present.
  `updateOrderStatus` and `updateWaiter` swallow all errors (resolve to `undefined`);
  GETs (`getAny`) also swallow errors (resolve to `undefined`).
- No state, storage, cookie, or cache writes; the only mutable state is the `useIdemKey` ref.
- Declares no timers, subscriptions, or `useEffect` hooks.

## Verification

Run from the repository root:

```bash
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```

`tsc --noEmit` exercises these signatures under `strict: true` with the `@/*` path alias from
`tsconfig.json`. Note it cannot catch invariant 3 (missing `undefined`) because of `any`
propagation. There are no unit tests for this directory; `npm test` runs `jest --watchAll`
against `jest-expo` for the whole app.
