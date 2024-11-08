import {router, useLocalSearchParams} from "expo-router";
import {Theme} from "@/constants/Colors";
import {ActivityIndicator, Button, PaperProvider} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, Text} from "react-native";
import {StatusLabel} from "@/components/order_card";
import {useEffect, useState} from "react";
import {Order} from "@/types";
import {getOrder, updateOrderStatus} from "@/apis";
import {useIsFocused} from "@react-navigation/core";


const ChefOrderView = () => {
  const { id }: {id: string} = useLocalSearchParams();
  const isFocused = useIsFocused();

  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const retrieveOrder = async () => {
      const newOrder = await getOrder(id);
      setOrder(newOrder);
    };
    retrieveOrder().catch(console.error);

  }, [isFocused]);

  if (!order){
    return <ActivityIndicator size='large' />;
  }

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
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
          {order.last_status.status == 'ACCEPTED'
            ? <>
              <Button
                mode='contained'
                onPress={() => updateOrderStatus({orderId: order.id, orderStatus: 'PREPARED'}).then(() => router.navigate('/cashier/orders'))}
              >
                Pedido listo
              </Button>
            </>
            : null}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  )
}

export default ChefOrderView;
