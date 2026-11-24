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

export const useApi: () => {
  getTables: () => Promise<Table[]>;
  getWaiters: () => Promise<WaiterTables[]>;
  getFoods: () => Promise<Item[]>;
  getDrinks: () => Promise<Item[]>;
  getOrders: (params?: GetOrdersParams) => Promise<Order[]>;
  getOrder: (id: string | number) => Promise<Order>;
  placeOrder: (
    order: OrderToPlace,
    headers?: Record<string, string>,
  ) => Promise<{ orderId: number }>;
  updateOrder: (
    orderId: number | string,
    order: OrderToPlace,
    headers?: Record<string, string>,
  ) => Promise<any>;
  updateOrderStatus: (
    params: UpdateOrderStatusParams,
    headers?: Record<string, string>,
  ) => Promise<any>;
  updateWaiter: (waiterTables: WaiterTables) => Promise<any>;
};
```

Endpoint mapping (all relative, no origin, no axios instance):

| Hook method | Verb | Path | Body / query | Return |
| --- | --- | --- | --- | --- |
| `getTables` | GET | `/api/tables/` | — | `response.data.results` |
| `getWaiters` | GET | `/api/waiters/` | — | `response.data.results` |
| `getFoods` | GET | `/api/foods/` | — | `response.data.results` |
| `getDrinks` | GET | `/api/drinks/` | — | `response.data.results` |
| `getOrders` | GET | `/api/orders/` | `?waiter=…` and/or `?status=…` | `response.data.results` |
| `getOrder` | GET | `/api/orders/{id}/` | — | raw `response.data` (`followResults: false`) |
| `placeOrder` | POST | `/api/place_order/` | `OrderToPlace` | raw `response.data` (`{ orderId }`) |
| `updateOrder` | PUT | `/api/orders/{orderId}/` | `OrderToPlace` | `response.data.results` |
| `updateOrderStatus` | POST | `/api/orders/{orderId}/update_status` | `{ status, are_food_ready?, are_drinks_ready? }` | raw `response.data` |
| `updateWaiter` | PATCH | `/api/waiters/{name}/` | `{ name, from_table, to_table }` | raw `response.data` |

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
   `options` is omitted. The adjacent inline comment ("by default, doesn't follow results")
   contradicts the code; the code is authoritative. `getOrder` is the only call site that
   passes `followResults: false`.
3. **Failed GETs resolve to `undefined`.** `getAny` catches every axios error, calls
   `console.error(error)`, and returns `undefined` without rethrowing. The declared method
   return types omit `undefined` (TS accepts this only because `axios` data is `any`), so every
   `get*` caller must treat a missing/`undefined` result as a failure.
4. **Write errors are split by method.** `placeOrder` and `updateOrder` log, then throw
   `Error(error.response.data.error)` when the server sent a JSON `error` field, else rethrow
   the original error. `updateOrderStatus` and `updateWaiter` swallow all errors (resolve to
   `undefined`); callers cannot observe failure except through `console.error`.
5. **`getOrders` filter serialization.** A status array is joined with commas into a single
   `status=` value (server-side CSV parsing). Query concatenation has no `&` separator and no
   URL-encoding: supplying both `waiter` and `status` produces one malformed parameter
   (`?waiter=Xstatus=Y`), and waiter names containing `&`, `#`, or spaces are not encoded.
6. **Falsy readiness flags are dropped.** `updateOrderStatus` attaches `are_food_ready` /
   `are_drinks_ready` only when the incoming value is truthy (`if (areFoodReady) …`), so
   `false` is never transmitted. A readiness flag cannot be reset through this adapter.
7. **Header passthrough is call-site supplied.** `placeOrder`, `updateOrder`, and
   `updateOrderStatus` emit `{ ...(headers ?? {}) }` — an empty object when omitted. No
   `Idempotency-Key` or content-type is injected here; call sites pass it explicitly.
   `updateWaiter` accepts no headers.
8. **`updateOrder` returns a nested field.** It returns `response.data.results`, whereas
   `placeOrder` and `updateOrderStatus` return `response.data`; callers must not assume a
   uniform envelope.
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
- Emits `console.error` on every caught request failure (all ten methods).
- Throws on failure only for `placeOrder` and `updateOrder`.
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
