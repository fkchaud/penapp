import axios from "axios";
import {
  Item,
  Order,
  OrderStatus,
  OrderToPlace,
  WaiterTables,
  Table,
} from "@/types";

export interface GetOrdersParams {
  waiter?: string;
  status?: OrderStatus | OrderStatus[];
}

export const useApi = () => {
  const serviceUrl = "/api/";

  const getAny = async (url: string, options?: { followResults: boolean }) => {
    const followResults =
      !options || !("followResults" in options) || options.followResults; // by default, doesn't follow results
    try {
      const response = await axios.get(url);
      return followResults ? response.data.results : response.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getTables: () => Promise<Table[]> = async () => {
    const url = serviceUrl + "tables/";
    return await getAny(url);
  };

  const getWaiters: () => Promise<WaiterTables[]> = async () => {
    const url = serviceUrl + "waiters/";
    return await getAny(url);
  };

  const getFoods = async (): Promise<Item[]> => {
    const url = serviceUrl + "foods/";
    return await getAny(url);
  };

  const getDrinks = async (): Promise<Item[]> => {
    const url = serviceUrl + "drinks/";
    return await getAny(url);
  };

  const getOrders = async ({ waiter, status }: GetOrdersParams = {}) => {
    let url = serviceUrl + "orders/";
    if (waiter || status) {
      url += "?";
      if (waiter) url += `waiter=${waiter}`;
      if (status) {
        if (Array.isArray(status)) url += `status=${status.join(",")}`;
        else url += `status=${status}`;
      }
    }
    return await getAny(url);
  };

  const getOrder = async (id: string | number): Promise<Order> => {
    const url = serviceUrl + `orders/${id}/`;
    return await getAny(url, { followResults: false });
  };

  const placeOrder = async (order: OrderToPlace) => {
    const url = serviceUrl + "place_order/";
    try {
      const response = await axios.post(url, order);
      return response.data.results;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) {
        throw Error(error.response.data.error);
      }
      throw error;
    }
  };

  const updateOrder = async (orderId: number | string, order: OrderToPlace) => {
    const url = serviceUrl + `orders/${orderId}/`;
    try {
      const response = await axios.put(url, order);
      return response.data.results;
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error) {
        throw Error(error.response.data.error);
      }
      throw error;
    }
  };

  interface UpdateOrderStatusParams {
    orderId: number | string;
    orderStatus: OrderStatus;
    areFoodReady?: boolean;
    areDrinksReady?: boolean;
  }
  interface UpdateOrderStatusApiParams {
    status: OrderStatus;
    are_food_ready?: boolean;
    are_drinks_ready?: boolean;
  }
  const updateOrderStatus = async ({
    orderId,
    orderStatus,
    areFoodReady,
    areDrinksReady,
  }: UpdateOrderStatusParams) => {
    const url = serviceUrl + `orders/${orderId}/update_status`;

    const body: UpdateOrderStatusApiParams = { status: orderStatus };
    if (areFoodReady) body.are_food_ready = areFoodReady;
    if (areDrinksReady) body.are_drinks_ready = areDrinksReady;

    try {
      const response = await axios.post(url, body);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };

  const updateWaiter = async ({ name, from_table, to_table }: WaiterTables) => {
    const url = serviceUrl + `waiters/${name}/`;

    try {
      const response = await axios.patch(url, { name, from_table, to_table });
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };

  return {
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
