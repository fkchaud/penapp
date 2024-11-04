import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, Chip, PaperProvider} from "react-native-paper";
import {Theme} from "@/constants/Colors";
import {useEffect, useState} from "react";
import {Order, OrderStatus} from "@/types";
import {getOrders} from "@/apis";
import {FlatGrid} from "react-native-super-grid";


const StatusLabel = ({status}: {status: OrderStatus}) => {
  const conversion = {
    'PLACED': {text: 'Tomado', color: 'gray'},
    'ACCEPTED': {text: 'Aprobado', color: 'yellow'},
    'REJECTED': {text: 'Rechazado', color: 'red'},
    'PREPARED': {text: 'Preparado', color: 'green'},
    'DELIVERED': {text: 'Entregado', color: 'white'},
  }

  return (
    <Chip compact style={{
      backgroundColor: conversion[status].color,
    }}>
      {conversion[status].text}
    </Chip>
  )
};

const OrderCard = ({order}: {order: Order}) => {
  return (
    <View style={{
      flexGrow: 1,
      backgroundColor: Theme.colors.background,
      borderStyle: 'dashed',
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
    }}>
      <Text>Comanda #{order.id}</Text>
      <Text>Mesa {order.table.number}</Text>
      {order.foods.map(food => (
        <Text>- {food.quantity}x {food.food.name}</Text>
      ))}
      {/* TODO: add drinks */}
      {order.last_status && <StatusLabel status={order.last_status.status} />}
    </View>
  )
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const retrieve = async () => {
      const newOrders = await getOrders();  // TODO: pass waiter
      setOrders(newOrders);
    };
    retrieve()
      .catch(console.error);
  }, [])


  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Text>Pedidos</Text>
          {
            orders.length === 0
              ? <ActivityIndicator size='large' />
              : <View>
                  <FlatGrid
                    itemDimension={140}
                    data={orders}
                    renderItem={({item}) => (
                      <OrderCard order={item}/>
                    )}
                  />
                </View>
          }
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default Orders;
