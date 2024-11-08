import {Order, OrderStatus, OrderToPlace, Waiter} from "@/types";

const baseUrl = 'http://127.0.0.1:8000/'


const getAny = async (url: string, options?: {followResults: boolean}) => {
  const followResults = !options || !('followResults' in options) || options.followResults;  // by default, doesn't follow results
  try {
    const response = await fetch(url, {method: 'GET', redirect: 'follow'});
    const json = await response.json();
    return followResults ? json.results : json;
  } catch (error) {
    console.error(error);
  }
}


export const getTables = async () => {
  const url = baseUrl + 'tables/'
  return await getAny(url);
};


export const getWaiters: () => Promise<Waiter[]> = async () => {
  const url = baseUrl + 'waiters/'
  return await getAny(url);
};


export const getFoods = async () => {
  const url = baseUrl + 'foods/';
  return await getAny(url);
};


export const getDrinks = async () => {
  const url = baseUrl + 'drinks/';
  return await getAny(url);
};


export interface GetOrdersParams {
  waiter?: string;
  status?: OrderStatus;
}
export const getOrders = async ({waiter, status}: GetOrdersParams = {}) => {
  let url = baseUrl + 'orders/';
  if (waiter || status){
    url += '?'
    if (waiter)
      url += `waiter=${waiter}`;
    if (status)
      url += `status=${status}`;
  }
  return await getAny(url);
};


export const getOrder = async (id: string | number): Promise<Order> => {
  const url = baseUrl + `orders/${id}/`;
  return await getAny(url, {followResults: false});
};


export const placeOrder = async (order: OrderToPlace) => {
  const url = baseUrl + 'place_order/';
  try {
    const response = await fetch(url, {method: 'POST', body: JSON.stringify(order), headers: {'Content-Type': 'application/json'}});
    const json = await response.json();
    return json.results;
  } catch (error) {
    console.error(error);
  }
};


interface UpdateOrderStatusParams {
  orderId: number | string;
  orderStatus: OrderStatus;
}
export const updateOrderStatus = async ({orderId, orderStatus}: UpdateOrderStatusParams) => {
  const url = baseUrl + `orders/${orderId}/update_status`;
  try {
    const response = await fetch(url, {method: 'POST', body: JSON.stringify({status: orderStatus}), headers: {'Content-Type': 'application/json'}});
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}
