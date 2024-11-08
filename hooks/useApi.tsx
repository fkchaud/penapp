import {Order, OrderStatus, OrderToPlace, Waiter} from "@/types";
import {useContext} from "react";
import {ServiceUrlContext, ServiceUrlContextType, UserTypeContext, UserTypeContextType} from "@/app/_layout";


export interface GetOrdersParams {
  waiter?: string;
  status?: OrderStatus;
}

export const useApi = () => {
  const {serviceUrl} = useContext(ServiceUrlContext) as ServiceUrlContextType;


  const getAny = async (url: string, options?: { followResults: boolean }) => {
    const followResults = !options || !('followResults' in options) || options.followResults;  // by default, doesn't follow results
    try {
      const response = await fetch(url, {method: 'GET', redirect: 'follow'});
      const json = await response.json();
      return followResults ? json.results : json;
    } catch (error) {
      console.error(error);
    }
  }


  const getTables = async () => {
    const url = serviceUrl + 'tables/'
    return await getAny(url);
  };


  const getWaiters: () => Promise<Waiter[]> = async () => {
    const url = serviceUrl + 'waiters/'
    return await getAny(url);
  };


  const getFoods = async () => {
    const url = serviceUrl + 'foods/';
    return await getAny(url);
  };


  const getDrinks = async () => {
    const url = serviceUrl + 'drinks/';
    return await getAny(url);
  };


  const getOrders = async ({waiter, status}: GetOrdersParams = {}) => {
    let url = serviceUrl + 'orders/';
    if (waiter || status) {
      url += '?'
      if (waiter)
        url += `waiter=${waiter}`;
      if (status)
        url += `status=${status}`;
    }
    return await getAny(url);
  };


  const getOrder = async (id: string | number): Promise<Order> => {
    const url = serviceUrl + `orders/${id}/`;
    return await getAny(url, {followResults: false});
  };


  const placeOrder = async (order: OrderToPlace) => {
    const url = serviceUrl + 'place_order/';
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(order),
        headers: {'Content-Type': 'application/json'}
      });
      const json = await response.json();
      return json.results;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };


  interface UpdateOrderStatusParams {
    orderId: number | string;
    orderStatus: OrderStatus;
  }
  const updateOrderStatus = async ({orderId, orderStatus}: UpdateOrderStatusParams) => {
    const url = serviceUrl + `orders/${orderId}/update_status`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({status: orderStatus}),
        headers: {'Content-Type': 'application/json'}
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }
  return {getTables, getWaiters, getFoods, getDrinks, getOrders, getOrder, placeOrder, updateOrderStatus};
}
