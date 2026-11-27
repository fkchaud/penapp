import React, { createContext, useContext, useEffect, useRef, useState } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Drawer } from "expo-router/drawer";
import {AsyncStorage} from "expo-sqlite/kv-store";

import axios from "axios";
import { PaperProvider, Portal, Snackbar } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Theme } from "@/constants/Colors";
import { UserType, WaiterTables } from "@/types";
import { useApi } from "@/hooks/useApi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// ---------- Auth ----------
export type AuthUser = { name: string; role: string };
export type AuthContextType = {
  user: AuthUser | null;
  actingRole: string;
  setActingRole: (role: string) => void;
  login: (name: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};
export const AuthContext = createContext<AuthContextType | null>(null);

// module-level token holder used by the axios interceptor
let authToken: string | null = null;
export const getAuthToken = () => authToken;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};

const ROLE_TO_USER_TYPE: Record<string, UserType> = {
  waiter: UserType.Waiter,
  cashier: UserType.Cashier,
  chef: UserType.Chef,
  manager: UserType.Cashier,
};

export type WaiterContextType = {
  waiter: WaiterTables;
  setWaiter: React.Dispatch<React.SetStateAction<WaiterTables>>;
};
export const WaiterContext = createContext({});
const WaiterProvider = ({ children }: { children: React.ReactNode }) => {
  const [waiter, setWaiter] = useState<WaiterTables>();

  const isWaiter = (obj: any): obj is WaiterTables =>
    "name" in obj && "from_table" in obj && "to_table" in obj;

  useEffect(() => {
    const retrieve = async () => {
      AsyncStorage.getItem("waiter_obj").then((wt) => {
        if (!wt) return;
        const wtp = JSON.parse(wt);
        if (!isWaiter(wtp)) {
          console.error("Not WaiterTable", wtp);
        } else {
          setWaiter(wtp);
        }
      });
    };
    retrieve();
  }, []);

  useEffect(() => {
    if (waiter) AsyncStorage.setItem("waiter_obj", JSON.stringify(waiter));
  }, [waiter]);

  return (
    <WaiterContext.Provider value={{ waiter, setWaiter }}>
      {children}
    </WaiterContext.Provider>
  );
};

export type UserTypeContextType = {
  userType: UserType;
  setUserType: React.Dispatch<React.SetStateAction<UserType>>;
};
export const UserTypeContext = createContext<UserTypeContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const api = useApi();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [actingRole, setActingRoleState] = useState<string>("undef");
  const [userType, setUserType] = useState<UserType>(UserType.Undefined);
  const [loading, setLoading] = useState(true);
  const { setWaiter } = useContext(WaiterContext) as WaiterContextType;

  const setActingRole = (role: string) => {
    setActingRoleState(role);
    setUserType(ROLE_TO_USER_TYPE[role] ?? UserType.Undefined);
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        const raw = await AsyncStorage.getItem("auth_user");
        if (token && raw) {
          const u: AuthUser = JSON.parse(raw);
          setAuthToken(token);
          setUser(u);
          setActingRole(u.role);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (name: string, pin: string) => {
    const res = await api.login(name, pin);
    if (!res) throw new Error("Login fallido");
    const u: AuthUser = { name: res.name, role: res.role };
    await AsyncStorage.setItem("auth_token", res.token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(u));
    setAuthToken(res.token);
    setUser(u);
    setActingRole(res.role);
    // waiter context
    if (res.role === "waiter" || res.role === "manager") {
      try {
        const waiters = await api.getWaiters();
        const w = waiters?.find((x: any) => x.name === res.name);
        if (w) setWaiter(w);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    await AsyncStorage.removeItem("waiter_obj");
    setAuthToken(null);
    setUser(null);
    setActingRoleState("undef");
    setUserType(UserType.Undefined);
  };

  return (
    <AuthContext.Provider
      value={{ user, actingRole, setActingRole, login, logout, loading }}
    >
      <UserTypeContext.Provider value={{ userType, setUserType }}>
        {children}
      </UserTypeContext.Provider>
    </AuthContext.Provider>
  );
};

// ---------- Alert ----------
export type AlertContextType = {
  alertMessage: string;
  setAlertMessage: React.Dispatch<React.SetStateAction<string>>;
  onDismiss: (() => any) | null;
  setOnDismiss: React.Dispatch<React.SetStateAction<(() => any) | null>>;
};
export const AlertContext = createContext({});
const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [onDismiss, setOnDismiss] = useState<(() => any) | null>(null);
  return (
    <AlertContext.Provider
      value={{ alertMessage, setAlertMessage, onDismiss, setOnDismiss }}
    >
      {children}
    </AlertContext.Provider>
  );
};

const MyDrawer = () => {
  const auth = useContext(AuthContext);
  const { userType } = useContext(UserTypeContext) as UserTypeContextType;
  const { waiter } = useContext(WaiterContext) as WaiterContextType;
  const role = auth?.actingRole ?? "undef";
  const isManager = auth?.user?.role === "manager";

  const show = (r: string) => isManager || role === r;

  return (
    <Drawer backBehavior={"history"}>
      <Drawer.Screen
        name={"index"}
        options={{
          drawerLabel: "Inicio",
          title: "PeñApp",
        }}
      />
      <Drawer.Screen
        name={"cashier/orders"}
        options={{
          drawerLabel: "Ver pedidos (Caja)",
          title: "Pedidos (Caja)",
          drawerItemStyle: { display: show("cashier") ? "flex" : "none" },
        }}
      />
      <Drawer.Screen
        name={"add_manual_order"}
        options={{
          drawerLabel: "Agregar pedido",
          title: "Pedido manual",
          drawerItemStyle: {
            display: show("cashier") || show("chef") ? "flex" : "none",
          },
        }}
      />
      <Drawer.Screen
        name={"chef/orders"}
        options={{
          drawerLabel: "Ver pedidos (Cocina)",
          title: "Pedidos (Cocina)",
          drawerItemStyle: { display: show("chef") ? "flex" : "none" },
        }}
      />
      <Drawer.Screen
        name={"waiter/orders/index"}
        options={{
          drawerLabel: "Ver pedidos",
          title: `Pedidos (${waiter ? waiter.name : "Mozos"})`,
          drawerItemStyle: {
            display: show("waiter") && !!waiter ? "flex" : "none",
          },
        }}
      />
      <Drawer.Screen
        name={"waiter/take_order"}
        options={{
          drawerLabel: "Tomar pedido",
          title: "Tomar pedido",
          drawerItemStyle: {
            display: show("waiter") && !!waiter ? "flex" : "none",
          },
        }}
      />
      <Drawer.Screen
        name={"waiter/orders/[id]/edit"}
        options={{ drawerItemStyle: { display: "none" }, title: `Editar Pedido` }}
      />
      <Drawer.Screen
        name={"admin/index"}
        options={{
          drawerLabel: "Admin",
          title: "Administración",
          drawerItemStyle: { display: isManager ? "flex" : "none" },
        }}
      />
      <Drawer.Screen
        name={"admin/staff"}
        options={{ drawerItemStyle: { display: "none" }, title: "Carga de usuarios" }}
      />
      <Drawer.Screen
        name={"admin/foods"}
        options={{ drawerItemStyle: { display: "none" }, title: "Carga de comidas" }}
      />
      <Drawer.Screen
        name={"admin/drinks"}
        options={{ drawerItemStyle: { display: "none" }, title: "Carga de bebidas" }}
      />
      <Drawer.Screen
        name={"logout"}
        options={{ drawerLabel: "Cerrar sesión", title: "Salir" }}
      />
    </Drawer>
  );
};

const MyPortal = () => {
  const { alertMessage, setAlertMessage, onDismiss, setOnDismiss } = useContext(
    AlertContext,
  ) as AlertContextType;
  return (
    <Portal>
      <Snackbar
        visible={!!alertMessage}
        onDismiss={() => {
          setAlertMessage("");
          setOnDismiss(null);
          onDismiss && onDismiss();
        }}
      >
        {alertMessage}
      </Snackbar>
    </Portal>
  );
};

// ---------- axios interceptors ----------
let interceptorsRegistered = false;
function registerInterceptors(logout: () => Promise<void>) {
  if (interceptorsRegistered) return;
  interceptorsRegistered = true;
  axios.interceptors.request.use(async (config) => {
    const t = getAuthToken() ?? (await AsyncStorage.getItem("auth_token"));
    if (t) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${t}`;
    }
    return config;
  });
  axios.interceptors.response.use(
    (r) => r,
    async (err) => {
      if (err?.response?.status === 401) {
        await logout();
      }
      return Promise.reject(err);
    },
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <WaiterProvider>
        <AuthProviderWithInterceptors />
      </WaiterProvider>
    </QueryClientProvider>
  );
}

// wrapper to access AuthProvider's logout for interceptors
function AuthProviderWithInterceptors() {
  const authRef = useRef<AuthContextType | null>(null);
  // We need AuthProvider rendered to get logout; restructure below instead.
  return <AuthProviderInner />;
}

function AuthProviderInner() {
  // Render AuthProvider and register interceptors using its context via a child.
  return (
    <AuthProvider>
      <InterceptorRegistrar />
      <AlertProvider>
        <PaperProvider theme={Theme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <MyDrawer />
            <MyPortal />
          </GestureHandlerRootView>
        </PaperProvider>
      </AlertProvider>
    </AuthProvider>
  );
}

function InterceptorRegistrar() {
  const auth = useContext(AuthContext);
  useEffect(() => {
    if (auth) registerInterceptors(auth.logout);
  }, [auth]);
  return null;
}
