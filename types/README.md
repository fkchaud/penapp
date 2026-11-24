# `types/` — Shared Domain Types

## Overview

Single barrel-free module of the app's domain model: order lifecycle, payment methods, waiters,
menu items, tables, the order-placement payload, and the server order shape. Imported
everywhere via the `@/types` path alias. All declarations are ambient TypeScript except
`UserType` (a real enum) and `UserTypeByKey` (a real object), which are the only runtime values
this module emits.

| File | Responsibility |
| --- | --- |
| `index.ts` | All shared domain types, the `UserType` enum, and the `UserTypeByKey` lookup. |

## Interface

### Unions

```ts
export type OrderStatus =
  | "PLACED" | "ACCEPTED" | "REJECTED" | "PREPARING"
  | "PREPARED" | "PICKED_UP" | "DELIVERED" | "CANCELED";

export type PaymentType = "CASH" | "TRANSFER" | "MERCADOPAGO" | "VOUCHER";
```

### Entities

```ts
export type Waiter = { name: string };

export type WaiterTables = Waiter & { from_table: Table; to_table: Table };

/** Referencia anidada de stock tal como la devuelven FoodSerializer/DrinkSerializer. */
export type StockRef = {
  id: number;
  name: string;
  initial_quantity: number;
};

export type Item = {
  id: number;
  name: string;
  icon: string;
  price: number;
  remaining: number;
  stock?: StockRef | null;
  units_per_pack?: number;
};

export type Table = { number: number };

export type OrderToPlace = {
  waiter?: string;
  table?: number;
  food?: { id: number; quantity: number }[];
  drinks?: { id: number; quantity: number }[];
  payment_type: PaymentType;
  comment?: string;
  user_type: UserType;
};

export type Order = {
  id: number;
  waiter: Waiter;
  foods: OrderedFood[];
  are_food_ready: boolean;
  drinks: OrderedDrinks[];
  are_drinks_ready: boolean;
  table: Table;
  last_status: { status: OrderStatus; created_at: string };
  total_price: number;
  payment_type: PaymentType;
  comment: string;
};
```

`OrderedFood { food: Item; quantity: number }` and `OrderedDrinks { drink: Item; quantity: number }`
are declared but **not exported**; they are only reachable through `Order["foods"]` /
`Order["drinks"]`.

### Enum and lookup

```ts
export enum UserType {
  Undefined = "undef",
  Waiter = "waiter",
  Cashier = "cashier",
  Chef = "chef",
}

export const UserTypeByKey: { [index: string]: UserType } = {
  undef: UserType.Undefined,
  waiter: UserType.Waiter,
  cashier: UserType.Cashier,
  chef: UserType.Chef,
};
```

### Helper aliases

```ts
export type ItemById = { [id: number]: Item };
export type QuantityByItem = Map<Item, number>;
```

## Invariants

1. **Wire literals are upper-snake for statuses and payments.** `OrderStatus` / `PaymentType`
   values are the exact strings `useApi` puts on the wire (query `status=`, body `status`,
   `payment_type`); no serializer or case conversion exists anywhere in the codebase.
2. **`OrderStatus` membership is exactly eight values** and carries no terminal/non-terminal
   distinction; nothing in the type system prevents `PLACED` → `DELIVERED` transitions.
3. **`Order` mirrors the server read shape, not the write shape.** Readiness flags are
   snake_case (`are_food_ready`, `are_drinks_ready`) because they come straight from JSON;
   `useApi.updateOrderStatus` maps them from camelCase params. `Order` also has no `status`
   field — the current status is only `last_status.status`.
4. **`last_status.created_at` is an unvalidated `string`.** No `Date`, no ISO narrowing; any
   string from the server is accepted.
5. **`OrderToPlace` has asymmetric optionality.** `waiter`, `table`, `food`, `drinks`, `comment`
   are optional; `payment_type` and `user_type` are required. `table` is a bare `number`
   (while `Order.table` and `WaiterTables.from_table` are `Table` objects), so read and write
   shapes must not be conflated.
6. **`UserType.Undefined = "undef"` is a member of the required `user_type` field.** TypeScript
   therefore permits `{ user_type: UserType.Undefined }` in `OrderToPlace`; nothing in this
   module (or in `useApi`) excludes it, so the sentinel can reach the server unless call sites
   filter it. Treat it as a client-side marker, never a valid role.
7. **`UserTypeByKey` is intentionally loose.** Its index signature claims every string maps to
   `UserType`, but unknown keys yield `undefined` at runtime and `Object.prototype` keys
   (`"toString"`) resolve to non-enum values. Callers must validate membership before use.
8. **`WaiterTables` passes `Table` objects to the API.** `useApi.updateWaiter` forwards
   `from_table` / `to_table` unchanged, so the server receives `{ number }` objects rather than
   numbers.
9. **Runtime footprint is limited to the enum and lookup.** All other exports are erased at
   compile time; `UserType` object keys (`Undefined`, `Waiter`, `Cashier`, `Chef`) are the
   reverse-mapping-visible handles.
10. **`QuantityByItem` keys on object identity.** Because `Item` is an object type, two
    structurally equal items are distinct `Map` keys — maps built from separate fetches do not
    merge.

## Side Effects

None. Importing the module only constructs the `UserType` enum object and the
`UserTypeByKey` literal. No I/O, logging, or global mutation.

## Verification

```bash
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```

Type-level checks rely on `strict: true` in `tsconfig.json`; there are no runtime assertions
for these declarations.
