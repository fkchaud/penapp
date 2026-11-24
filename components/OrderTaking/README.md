# OrderTaking Components

> Presentational controls used by the order-taking screen: table selection, menu
> picking, comment/confirmation bar, and the checkout modal.

All four components are stateless with respect to domain data. They render from
props and report intent through caller-supplied callbacks. None of them perform
network I/O themselves.

## Overview

| File | Exported symbol | Role |
| --- | --- | --- |
| `TableTopBar.tsx` | `TableTopBar` | Horizontal table selector inside a `TopBar`, restricted to the signed-in waiter's assigned table range. |
| `FoodPicker.tsx` | `FoodPicker` | Two-section (`Comida`, `Bebida`) `SectionList` of buyable items with per-item quantity steppers. |
| `ConfirmBottomBar.tsx` | `ConfirmBottomBar` | `BottomBar` with comment input, running total, and cancel/continue actions. |
| `ConfirmOrderModal.tsx` | `ConfirmOrderModal` | Checkout `Modal` showing the cart, payment-method radio group, and confirm action. |

The internal `BuyableItem` component in `FoodPicker.tsx` is not exported.

Props types are local, non-exported `type` aliases. Domain types (`Item`,
`Table`, `PaymentType`, `QuantityByItem`) come from `@/types`; `isVoucherTable`
and `getTableShowable` come from `@/utils/tables`.

## Interface

### `TableTopBar` — props `TableTopBarProps`

| Prop | Type | Required | Default |
| --- | --- | --- | --- |
| `currentTable` | `Table \| null` | yes | — |
| `setCurrentTable` | `(table: Table) => void` | yes | — |
| `autoCurrentTable` | `boolean` | no | `true` |
| `forceAllTables` | `boolean` | no | `false` |

Renders `TopBar` → header (`Mesa` + checkbox `Mostrar todas las mesas`, the
checkbox is omitted when `forceAllTables` is true) → horizontal `FlatList` of
table buttons. Button label is `getTableShowable(item.number)`.

### `FoodPicker` — props `FoodPickerProps`

| Prop | Type | Required |
| --- | --- | --- |
| `foods` | `Item[]` | yes |
| `drinks` | `Item[]` | yes |
| `foodToOrder` | `QuantityByItem` (`Map<Item, number>`) | yes |
| `drinksToOrder` | `QuantityByItem` (`Map<Item, number>`) | yes |
| `addFoodToOrder` | `(item: Item, quantity: number) => void` | yes |
| `addDrinksToOrder` | `(item: Item, quantity: number) => void` | yes |

Sections are fixed: `{ title: "Comida", data: foods }` and
`{ title: "Bebida", data: drinks }`. The active section title selects both the
quantity source and the `add*ToOrder` callback.

### `ConfirmBottomBar` — props `ConfirmBottomBarProps`

| Prop | Type | Required |
| --- | --- | --- |
| `comment` | `string` | yes |
| `setComment` | `(comment: string) => void` | yes |
| `totalPrice` | `number` | yes |
| `cancelText` | `string` | yes |
| `onCancel` | `() => void` | yes |
| `onContinue` | `() => void` | yes |
| `isEnabled` | `boolean` | yes |
| `commentInputRef` | `LegacyRef<TextInput>` | no |

### `ConfirmOrderModal` — props `ConfirmOrderModalProps`

| Prop | Type | Required |
| --- | --- | --- |
| `modalVisible` | `boolean` | yes |
| `setModalVisible` | `(visible: boolean) => void` | yes |
| `foodToOrder` | `QuantityByItem` | yes |
| `drinksToOrder` | `QuantityByItem` | yes |
| `table` | `Table \| null` | yes |
| `totalPrice` | `number` | yes |
| `paymentMethod` | `PaymentType \| ""` | yes |
| `setPaymentMethod` | `(paymentMethod: PaymentType) => void` | yes |
| `onConfirm` | `() => void` | yes |
| `isLoading` | `boolean` | yes |

Payment radio options: `CASH` and `TRANSFER` always; `VOUCHER` only when
`table && isVoucherTable(table.number)`. `selectedId` is bound to
`paymentMethod`. A `TRANSFER` selection additionally renders
`Alias: seminario.mendoza`.

## Invariants

- **`TableTopBar` writes state during render.** When `currentTable` is outside
  `[waiter.from_table.number, waiter.to_table.number]` and `enableAllTables` is
  `false`, the component calls `setEnableAllTables(true)` in the render body
  (lines 54–61). This is a known code smell: it is a render-phase state update,
  it only ever sets `true`, and it never re-runs the reverse transition.
- **`TableTopBar` range filtering depends on both waiter bounds.** The list is
  filtered only when `waiter?.from_table.number`, `waiter?.to_table.number`, and
  `!enableAllTables` are all truthy; otherwise every fetched table is shown.
- **`TableTopBar` initialises, not synchronises, `enableAllTables`.** `useState`
  reads `forceAllTables` only on first mount; later prop changes are ignored.
  `forceAllTables={true}` additionally hides the checkbox, so the list cannot be
  re-filtered from inside the component.
- **`TableTopBar` fetches tables only on focus change.** The `useEffect` that
  calls `getTables()` has dependency list `[isFocused]`; changing `waiter` or
  `autoCurrentTable` does not refetch. Fetched rows are narrowed to
  `{ number: table.number }`, discarding any other server fields.
- **`TableTopBar` auto-selection is first-match.** With `autoCurrentTable`, it
  selects the table equal to `waiter.from_table.number`, falling back to
  `newTables[0]`; with no `from_table` it selects `newTables[0]`.
- **`FoodPicker` quantity is Map-first with an id fallback.** Quantity is
  `quantityMap.get(item) || quantityById[item.id] || 0`, where `quantityById` is
  derived from the `Map<Item, number>` via `Object.fromEntries`. Because `||` is
  used, a stored quantity of `0` falls through to the id-based lookup.
- **`FoodPicker` item disabling is asymmetric.** `disabled` is
  `item.remaining <= 0`; the `plus` button is additionally disabled when
  `quantity + 1 > item.remaining`; the `minus` button is not, so at quantity `0`
  it remains pressable and emits `addItemToOrder(item, -1)`.
- **`ConfirmOrderModal` cannot confirm without a payment method.** The confirm
  button is `disabled={!paymentMethod || isLoading}` and shows
  `loading={isLoading}`.
- **`ConfirmOrderModal` does not clear `paymentMethod` on cancel/close.**
  `Cancelar`, `onDismiss`, and `onRequestClose` only call
  `setModalVisible(false)`; the selection is owned by the caller.
- **`ConfirmBottomBar` gates only `Continuar`.** `Continuar` is
  `disabled={!isEnabled}`; `Cancelar` is never disabled. The comment input is
  `multiline` with `maxLength={150}`.
- **All components are controlled.** No component holds a copy of cart, payment,
  or table state (only `TableTopBar`'s `tables` and `enableAllTables` are local).

## Side Effects

- `TableTopBar`: HTTP `GET /api/tables/` through `useApi().getTables()` (axios,
  base path `/api/`), invoked from the `[isFocused]` effect; the resulting
  promise rejection is routed to `console.error`.
- `TableTopBar`: calls the `setCurrentTable` prop (auto-selection and on press).
- `ConfirmOrderModal`: calls `setPaymentMethod` from the radio group,
  `setModalVisible(false)` on cancel/dismiss, and `onConfirm` on confirm.
- `ConfirmBottomBar`: calls `setComment` on text change, `onCancel`, and
  `onContinue`.
- `FoodPicker`: calls `addFoodToOrder` / `addDrinksToOrder` with signed
  quantities (`quantity - 1`, `quantity + 1`).
- No global store writes, no context mutation, no timers, no local storage.

## Verification

```bash
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```
