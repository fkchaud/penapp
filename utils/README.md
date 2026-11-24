# `utils/` — Table Label Mapping

## Overview

Pure helpers that translate the server's numeric table identifiers into the labels shown in the
UI, and that classify voucher ("non-table") identifiers. Used by table selectors, the waiter
assignment screen, and order headers.

| File | Responsibility |
| --- | --- |
| `tables.ts` | `getTableShowable` label mapping and `isVoucherTable` predicate. |

## Interface

```ts
export const getTableShowable: (tableNo: number) => string;

export const isVoucherTable: (tableNo: number) => boolean;
```

## Invariants

1. **Label ranges.** `1–92` → `M<n>`; `93–100` → `P<n>`; `101` → `"Mozo"`; `102` → `"Art."`;
   `103` → `"Semi."`. The digits are the raw table number, so the `P` group reads `P93`…`P100`
   (the prefix changes, the numbering does not restart).
2. **Total fallback.** Any other numeric input (`0`, negatives, `104+`, non-integers) is
   returned as `tableNo.toString()`. The function is total and never returns `undefined`.
3. **No validation or normalization.** Non-integers such as `92.5` fall through to the numeric
   string; `NaN` returns `"NaN"`; the function cannot distinguish a valid table from an
   invalid one.
4. **Voucher set is exactly `[101, 102, 103]`.** `isVoucherTable` is an independent literal
   list; it does not reuse `getTableShowable`'s branches, so the two must be kept in sync
   manually. The labels themselves (`"Mozo"`, `"Art."`, `"Semi."`) are not derivable from the
   predicate.
5. **Exact equality.** `isVoucherTable` uses `Array.prototype.includes` (strict equality), so no
   coercion or range logic applies.
6. **Purity.** Both functions are deterministic, allocation-free (aside from the template
   string), and free of module state.

## Side Effects

None. No I/O, no logging, no environment access.

## Verification

```bash
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```

No dedicated tests exist. Boundary spot-checks: `1→"M1"`, `92→"M92"`, `93→"P93"`,
`100→"P100"`, `101→"Mozo"`, `103→"Semi."`, `104→"104"`; `isVoucherTable` true only for
`101–103`.
