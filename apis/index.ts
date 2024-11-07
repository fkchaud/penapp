import {OrderToPlace, Waiter} from "@/types";

const baseUrl = 'http://127.0.0.1:8000/'


const getAny = async (url: string) => {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json.results;
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


export const getOrders = async (waiter?: string) => {
  const url = baseUrl + `orders/${waiter ? `waiter=${waiter}` : ''}`;
  return await getAny(url);
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
