import {Order, OrderStatus} from "@/types";
import {Chip} from "react-native-paper";
import {Text, View} from "react-native";
import {Theme} from "@/constants/Colors";

export const StatusLabel = ({status}: { status: OrderStatus }) => {
  const conversion = {
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

export const OrderCard = ({order}: { order: Order }) => {
  return (
    <View style={{
      height: "100%",
      width: "100%",
      backgroundColor: Theme.colors.background,
      borderStyle: 'dashed',
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
    }}>
      <Text>Comanda #{order.id}</Text>
      <Text>Mozo {order.waiter.name}</Text>
      <Text>Mesa {order.table.number}</Text>
      {order.foods.map(food => (
        <Text key={food.food.id}>- {food.quantity}x {food.food.name}</Text>
      ))}
      {order.drinks.map(drinks => (
        <Text key={drinks.drink.id}>- {drinks.quantity}x {drinks.drink.name}</Text>
      ))}
      {order.last_status && <StatusLabel status={order.last_status.status}/>}
    </View>
  )
};
