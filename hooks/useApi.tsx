import axios from "axios";
import {
  Item,
  Order,
  OrderStatus,
  OrderToPlace,
  WaiterTables,
  Table,
} from "@/types";

// ---------------------------------------------------------------------------
// Roles — coherentes con papi.subpapi.models.StaffRole
// ---------------------------------------------------------------------------
export type StaffRole = "waiter" | "cashier" | "chef" | "manager";
export const STAFF_ROLES: StaffRole[] = ["waiter", "cashier", "chef", "manager"];
export const isStaffRole = (r: string): r is StaffRole =>
  (STAFF_ROLES as readonly string[]).includes(r);

// ---------------------------------------------------------------------------
// Params de lectura
// ---------------------------------------------------------------------------
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

/** Body JSON de POST /api/orders/<id>/update_status (snake_case). */
export interface UpdateOrderStatusApiParams {
  status: OrderStatus;
  are_food_ready?: boolean;
  are_drinks_ready?: boolean;
}

// ---------------------------------------------------------------------------
// Auth — POST /api/auth/login/ → LoginView
// ---------------------------------------------------------------------------
export interface LoginResponse {
  token: string;
  name: string;
  role: StaffRole;
}

// ---------------------------------------------------------------------------
// Staff — /api/staff/ (StaffSerializer: url, name, role, active — sin id)
// ---------------------------------------------------------------------------
export interface StaffMember {
  url: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

export interface CreateStaffRequest {
  name: string;
  role: StaffRole;
  active?: boolean;
}

/** Elemento de `items[]` en POST /api/staff/bulk/. */
export interface StaffBulkItem {
  name: string;
  role: StaffRole;
}

// ---------------------------------------------------------------------------
// Stock — /api/stocks/ (StockSerializer: id, url, name, initial_quantity)
// ---------------------------------------------------------------------------
export interface StockItem {
  id: number;
  url: string;
  name: string;
  initial_quantity: number;
}

export interface CreateStockRequest {
  name: string;
  initial_quantity: number;
}

export interface UpdateStockRequest {
  initial_quantity: number;
}

// ---------------------------------------------------------------------------
// Foods — /api/foods/ (FoodSerializer: id, url, name, price, remaining, icon,
// units_per_pack, stock (pk), stock_name)
// ---------------------------------------------------------------------------
export interface CreateFoodRequest {
  name: string;
  price: number;
  icon?: string;
  units_per_pack?: number;
  stock?: number | null;
}

export type UpdateFoodRequest = CreateFoodRequest;

/**
 * Elemento de `items[]` en POST /api/foods/bulk/: `stock` es el *nombre* del
 * stock (se crea si no existe), no su id, y acepta `initial_quantity`.
 */
export interface FoodBulkItem {
  name: string;
  price: number;
  icon?: string;
  stock?: string;
  stock_name?: string;
  units_per_pack?: number;
  initial_quantity?: number;
}

// ---------------------------------------------------------------------------
// Bulk — /api/staff/bulk/, /api/foods/bulk/ y /api/drinks/bulk/ →
// { created, updated, errors }
// ---------------------------------------------------------------------------
export interface BulkError {
  index: number;
  error: string;
  item?: unknown;
}

export interface BulkResponse {
  created: number;
  updated: number;
  errors: BulkError[];
}

// ---------------------------------------------------------------------------
// Drinks — /api/drinks/ (DrinkSerializer: id, url, name, price, remaining,
// icon, units_per_pack, stock (pk), stock_name) — misma forma que Food
// ---------------------------------------------------------------------------
export type CreateDrinkRequest = CreateFoodRequest;
export type UpdateDrinkRequest = CreateFoodRequest;
export type DrinkBulkItem = FoodBulkItem;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
/** Respuesta de POST /api/place_order/. */
export interface PlaceOrderResponse {
  orderId: number;
}

export const useApi = () => {
  const serviceUrl = "/api/";

  const getAny = async <T,>(
    url: string,
    options?: { followResults: boolean },
  ): Promise<T> => {
    // por defecto se sigue `.results` (listas DRF paginadas con PAGE_SIZE)
    const followResults =
      !options || !("followResults" in options) || options.followResults;
    try {
      const response = await axios.get(url);
      return (followResults ? response.data.results : response.data) as T;
    } catch (error) {
      console.error(error);
      // en error se resuelve undefined; los call sites ya hacen `?? []`
      return undefined as unknown as T;
    }
  };

  const getStaff = async (): Promise<StaffMember[]> =>
    getAny<StaffMember[]>(serviceUrl + "staff/");

  const getStocks = async (): Promise<StockItem[]> =>
    getAny<StockItem[]>(serviceUrl + "stocks/");

  const createStaff = async (
    data: CreateStaffRequest,
  ): Promise<StaffMember> => {
    const url = serviceUrl + "staff/";
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const bulkStaff = async (
    items: StaffBulkItem[],
  ): Promise<BulkResponse> => {
    const url = serviceUrl + "staff/bulk/";
    try {
      const response = await axios.post(url, { items });
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const createStock = async (
    data: CreateStockRequest,
  ): Promise<StockItem> => {
    const url = serviceUrl + "stocks/";
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const updateStock = async (
    id: number,
    data: UpdateStockRequest,
  ): Promise<StockItem> => {
    const url = serviceUrl + `stocks/${id}/`;
    try {
      const response = await axios.patch(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const createFood = async (data: CreateFoodRequest): Promise<Item> => {
    const url = serviceUrl + "foods/";
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const updateFood = async (
    id: number,
    data: UpdateFoodRequest,
  ): Promise<Item> => {
    const url = serviceUrl + `foods/${id}/`;
    try {
      const response = await axios.put(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const deleteFood = async (id: number): Promise<void> => {
    const url = serviceUrl + `foods/${id}/`;
    try {
      await axios.delete(url);
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const bulkFoods = async (items: FoodBulkItem[]): Promise<BulkResponse> => {
    const url = serviceUrl + "foods/bulk/";
    try {
      const response = await axios.post(url, { items });
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const createDrink = async (data: CreateDrinkRequest): Promise<Item> => {
    const url = serviceUrl + "drinks/";
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const updateDrink = async (
    id: number,
    data: UpdateDrinkRequest,
  ): Promise<Item> => {
    const url = serviceUrl + `drinks/${id}/`;
    try {
      const response = await axios.put(url, data);
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const deleteDrink = async (id: number): Promise<void> => {
    const url = serviceUrl + `drinks/${id}/`;
    try {
      await axios.delete(url);
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const bulkDrinks = async (items: DrinkBulkItem[]): Promise<BulkResponse> => {
    const url = serviceUrl + "drinks/bulk/";
    try {
      const response = await axios.post(url, { items });
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const login = async (name: string, pin: string): Promise<LoginResponse> => {
    const url = serviceUrl + "auth/login/";
    try {
      const response = await axios.post(url, { name, pin });
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) throw Error(error.response.data.error);
      throw error;
    }
  };

  const getTables = async (): Promise<Table[]> =>
    getAny<Table[]>(serviceUrl + "tables/");

  const getWaiters = async (): Promise<WaiterTables[]> =>
    getAny<WaiterTables[]>(serviceUrl + "waiters/");

  const getFoods = async (): Promise<Item[]> =>
    getAny<Item[]>(serviceUrl + "foods/");

  const getDrinks = async (): Promise<Item[]> =>
    getAny<Item[]>(serviceUrl + "drinks/");

  const getOrders = async ({
    waiter,
    status,
  }: GetOrdersParams = {}): Promise<Order[]> => {
    const params: string[] = [];
    if (waiter) params.push(`waiter=${encodeURIComponent(waiter)}`);
    if (status) {
      const s = Array.isArray(status) ? status.join(",") : status;
      params.push(`status=${encodeURIComponent(s)}`);
    }
    const qs = params.length ? `?${params.join("&")}` : "";
    return await getAny<Order[]>(serviceUrl + "orders/" + qs);
  };

  const getOrder = async (id: string | number): Promise<Order> =>
    getAny<Order>(serviceUrl + `orders/${id}/`, { followResults: false });

  const placeOrder = async (
    order: OrderToPlace,
    headers?: Record<string, string>,
  ): Promise<PlaceOrderResponse> => {
    const url = serviceUrl + "place_order/";
    try {
      const response = await axios.post(url, order, {
        headers: { ...(headers ?? {}) },
      });
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) {
        throw Error(error.response.data.error);
      }
      throw error;
    }
  };

  const updateOrder = async (
    orderId: number | string,
    order: OrderToPlace,
    headers?: Record<string, string>,
  ): Promise<Order> => {
    const url = serviceUrl + `orders/${orderId}/`;
    try {
      const response = await axios.put(url, order, {
        headers: { ...(headers ?? {}) },
      });
      // OrderViewSet.update devuelve el order serializado (no paginado)
      return response.data;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) {
        throw Error(error.response.data.error);
      }
      throw error;
    }
  };

  const updateOrderStatus = async (
    {
      orderId,
      orderStatus,
      areFoodReady,
      areDrinksReady,
    }: UpdateOrderStatusParams,
    headers?: Record<string, string>,
  ): Promise<Order | undefined> => {
    const url = serviceUrl + `orders/${orderId}/update_status`;

    const body: UpdateOrderStatusApiParams = { status: orderStatus };
    if (areFoodReady) body.are_food_ready = areFoodReady;
    if (areDrinksReady) body.are_drinks_ready = areDrinksReady;

    try {
      const response = await axios.post(url, body, {
        headers: { ...(headers ?? {}) },
      });
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };

  const updateWaiter = async ({
    name,
    from_table,
    to_table,
  }: WaiterTables): Promise<WaiterTables | undefined> => {
    const url = serviceUrl + `waiters/${name}/`;

    try {
      const response = await axios.patch(url, { name, from_table, to_table });
      // 208 (sin cambios) responde cuerpo vacío → undefined
      return response.data || undefined;
    } catch (error) {
      console.error(error);
    }
  };

  return {
    getStaff,
    getStocks,
    createStaff,
    bulkStaff,
    createStock,
    updateStock,
    createFood,
    updateFood,
    deleteFood,
    bulkFoods,
    createDrink,
    updateDrink,
    deleteDrink,
    bulkDrinks,
    login,
    getTables,
    getWaiters,
    getFoods,
    getDrinks,
    getOrders,
    getOrder,
    placeOrder,
    updateOrder,
    updateOrderStatus,
    updateWaiter,
  };
};
