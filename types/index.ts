export type Item = {
  id: number,
  name: string,
  icon: string,
  price: number,
};

export type Table = {
  number: number,
};

export type Order = {
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
};
