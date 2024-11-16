import {Chip} from "react-native-paper";
import {StyleProp, Text, View, ViewStyle} from "react-native";

import {Order, OrderStatus} from "@/types";
import "@/css/global.css";


export const PaymentMethodLabel = {
  'CASH': 'Efectivo',
  'TRANSFER': 'Transferencia',
  'MERCADOPAGO': 'Mercado Pago',
}

export const StatusLabel = ({status}: { status: OrderStatus }) => {
  const conversion: Record<OrderStatus, {text: string, color: string}> = {
    'PLACED': {text: 'Tomado', color: 'gray'},
    'ACCEPTED': {text: 'Aprobado', color: 'yellow'},
    'REJECTED': {text: 'Rechazado', color: 'red'},
    'PICKED_UP': {text: 'Recogido', color: 'green'},
    'DELIVERED': {text: 'Entregado', color: 'white'},
    'CANCELED': {text: 'Cancelado', color: 'cyan'},
  }

  return (
    <Chip compact style={{
      backgroundColor: conversion[status].color,
    }}>
      {conversion[status].text}
    </Chip>
  )
};

export const OrderCard = ({order, className, style, ...props}: { order: Order, className?: string, style?: ViewStyle }) => {
  return (
    <View
      style={{
        borderStyle: 'dashed',
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: 8,
        ...style
      }}
      className={`bg-white m-0.5 rounded ${className ? className : ''}`}
      {...props}
    >
      <Text>Comanda #{order.id}</Text>
      <Text>Mozo {order.waiter.name}</Text>
      <Text>Mesa {order.table.number}</Text>
      {order.foods.map(food => (
        <Text key={food.food.id}>- {food.quantity}x {food.food.name}</Text>
      ))}
      {order.drinks.map(drinks => (
        <Text key={drinks.drink.id}>- {drinks.quantity}x {drinks.drink.name}</Text>
      ))}
      {order.comment && <Text style={{fontStyle: 'italic'}}>{order.comment}</Text>}
      <Text>${order.total_price} - {PaymentMethodLabel[order.payment_type]}</Text>
      {order.last_status && <StatusLabel status={order.last_status.status}/>}
    </View>
  )
};
