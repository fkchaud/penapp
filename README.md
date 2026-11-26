# PenApp Blueprint

## System Overview

App Expo/React Native (build web) para la gestión de comandas de una peña. Tres
roles: mozo, caja, cocina. Consume la API de `../penapi` vía rutas relativas
`/api/`.

- **Framework:** Expo SDK 52, React Native 0.76, Expo Router 4, TypeScript strict.
- **UI:** react-native-paper (MD3), NativeWind/Tailwind, @tanstack/react-query.
- **Estado:** React Context (Waiter, User/Auth, Alert) + AsyncStorage.
- **Auth:** login por nombre + PIN compartido; token Bearer en AsyncStorage;
  interceptor de axios adjunta el header.

## Subdirectories & System Boundaries

- [app](./app/README.md) - Pantallas (Expo Router): login, toma de pedido,
  listados por rol, edición, admin (carga de datos).
- [components](./components/README.md) - Componentes presentacionales (cards,
  listados, masonry, OrderTaking).
- [hooks](./hooks/README.md) - `useApi` (único adapter HTTP), `useIdemKey`,
  color scheme.
- [constants](./constants/README.md) - Tokens de color y tema Paper.
- [utils](./utils/README.md) - Mapeo de números de mesa a etiquetas.
- [types](./types/README.md) - Modelo de dominio compartido (TS).
- [scripts](./scripts/README.md) - `reset-project.js` (plantilla Expo, no usado).

## Global Invariants

- `serviceUrl = "/api/"` relativo: solo funciona servida por el mismo origen que
  la API (nginx). Sin `EXPO_PUBLIC_API_URL`.
- `PAGE_SIZE = 2000` (backend) es el techo efectivo: la app lee solo la primera
  página (`getAny` sigue `response.data.results`).
- `useApi.getOrders` arma el query string sin `&` entre `waiter` y `status`
  (bug latente).
- Stock se refresca por polling cada 10 s en `OrderListing`, sólo mientras la pantalla está enfocada (el drawer mantiene las pantallas montadas); no hay push.
- El rol del usuario viene del token (backend), no del body; la UI usa
  `UserType` solo para mostrar/ocultar pantallas.

## Local Interface & Invariants

- `app/_layout.tsx` — Drawer, QueryClient (staleTime 5 min, retry 1), providers
  (Waiter, Auth, UserType, Alert), interceptors de axios.
- `babel.config.js`, `metro.config.js`, `tailwind.config.js` — bundler/styling.
- `tsconfig.json` — strict, alias `@/*`.
- `app.json` — identificadores `com.semi.penapp`, scheme `penapp`.

## System Verification

```bash
cd /Users/facundochaud/projects/penapp
npx tsc --noEmit
npm run lint
npm test   # jest --watchAll (sin tests hoy)
```

## Build & deploy (según README original)

```bash
npx expo export -p web
```

Servido por nginx:

```nginx
location / {
    alias /Users/facundochaud/projects/penapp/dist/;
    try_files $uri /index.html;
}
```

> Nota: la directiva `try_files $uri /index.html` con `alias` resuelve
> `/index.html` fuera del alias; preferir `root` + `try_files $uri $uri/ /index.html`.