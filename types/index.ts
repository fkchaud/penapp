export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELED';
export type PaymentType = 'CASH' | 'TRANSFER' | 'MERCADOPAGO';

export type Waiter = {
  name: string;
}

export type Item = {
  id: number,
  name: string,
  icon: string,
  price: number,
  remaining: number,
};

export type Table = {
  number: number,
};

export type OrderToPlace = {
  waiter?: string,
  table?: number,
  food?: {
    id: number,
    quantity: number,
  }[],
  drinks?: {
    id: number,
    quantity: number,
  }[],
  payment_type: PaymentType,
};

type OrderedFood = {
  food: Item,
  quantity: number,
};

type OrderedDrinks = {
  drink: Item,
  quantity: number,
};

export type Order = {
  id: number,
  waiter: Waiter,
  foods: OrderedFood[];
  drinks: OrderedDrinks[];
  table: Table,
  last_status: {
    status: OrderStatus,
    created_at: string,
  };
  total_price: number,
  payment_type: PaymentType,
}

export enum UserType {
  Undefined = "undef",
  Waiter = "waiter",
  Cashier = "cashier",
  Chef = "chef",
}
export const UserTypeByKey: {[index: string]: UserType} = {
  "undef": UserType.Undefined,
  "waiter": UserType.Waiter,
  "cashier": UserType.Cashier,
  "chef": UserType.Chef,
};
