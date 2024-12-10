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
  const serviceUrl = "https://localhost/api/";

  const getAny = async (url: string, options?: { followResults: boolean }) => {
    const followResults =
      !options || !("followResults" in options) || options.followResults; // by default, doesn't follow results
    try {
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      const json = await response.json();
      return followResults ? json.results : json;
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
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(order),
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const json = await response.json();
        return json.results;
      } else {
        console.log(response);
        const json = await response.json();
        console.log(json);
        if (json?.error) throw Error(json?.error);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateOrder = async (orderId: number | string, order: OrderToPlace) => {
    const url = serviceUrl + `orders/${orderId}/`;
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: JSON.stringify(order),
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const json = await response.json();
        return json.results;
      } else {
        console.log(response);
        const json = await response.json();
        console.log(json);
        if (json?.error) throw Error(json?.error);
      }
    } catch (error) {
      console.error(error);
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
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  const updateWaiter = async ({ name, from_table, to_table }: WaiterTables) => {
    const url = serviceUrl + `waiters/${name}/`;

    try {
      const response = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify({ name, from_table, to_table }),
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
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
