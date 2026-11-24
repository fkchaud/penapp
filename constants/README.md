# `constants/` — Theme Tokens

## Overview

Static design tokens for the app. `Colors.ts` defines the light and dark palettes used by
`hooks/useThemeColor.ts` and by `react-native-paper`'s provider in the root layout. No palette
values are computed at runtime; both objects are plain literals.

| File | Responsibility |
| --- | --- |
| `Colors.ts` | Exports the two-scheme `Colors` map and the Paper `Theme` object. |

## Interface

```ts
export const Colors: {
  light: {
    text: string;             // '#11181C'
    background: string;       // '#fff'
    tint: string;             // '#0a7ea4'
    icon: string;             // '#687076'
    tabIconDefault: string;   // '#687076'
    tabIconSelected: string;  // '#0a7ea4'
  };
  dark: {
    text: string;             // '#ECEDEE'
    background: string;       // '#151718'
    tint: string;             // '#fff'
    icon: string;             // '#9BA1A6'
    tabIconDefault: string;   // '#9BA1A6'
    tabIconSelected: string;  // '#fff'
  };
};

export const Theme: typeof DefaultTheme & { dark: true };
```

`Theme` is `MD3LightTheme` (`MD3LightTheme as DefaultTheme` from `react-native-paper`) with a
single override: `dark: true`.

## Invariants

1. **Key parity.** `light` and `dark` expose exactly the same six keys (`text`, `background`,
   `tint`, `icon`, `tabIconDefault`, `tabIconSelected`). `useThemeColor`'s parameter type
   (`keyof typeof Colors.light & keyof typeof Colors.dark`) breaks if the sets diverge.
2. **All values are strings** and are consumed directly as React Native color values — no
   alpha channel, no platform-conditional (`Platform.select`) branching.
3. **`Theme` mixes a light palette with `dark: true`.** The Paper theme keeps `MD3LightTheme`'s
   colors and typography but advertises dark mode, so Paper's dark-mode conditional styling
   applies against light MD3 surfaces. Changing `Colors` does not affect Paper's `colors`.
4. **`Theme` is static.** It is not recomputed per color scheme and is not derived from
   `Colors`; both exports are independent and unsynchronized.
5. **`tint` is reused** as `tabIconSelected` in both schemes by literal value, not by
   reference; editing one does not update the other.

## Side Effects

None. Module evaluation only builds two object literals and imports `react-native-paper`'s
`MD3LightTheme`. No I/O, no global mutation.

## Verification

```bash
cd /Users/facundochaud/projects/penapp && npx tsc --noEmit
cd /Users/facundochaud/projects/penapp && npm run lint
```

Static read-through check: both palettes must list the same six keys; `Theme.dark === true`.
