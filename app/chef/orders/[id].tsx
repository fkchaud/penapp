import { router, useLocalSearchParams } from "expo-router";
import { Theme } from "@/constants/Colors";
import { ActivityIndicator, Button, PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text } from "react-native";
import { PaymentMethodLabel, StatusLabel } from "@/components/OrderCard";
import { ReactNode, useEffect, useState } from "react";
import { Order } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";

const ChefOrderView = () => {
  const { id }: { id: string } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const { getOrder, updateOrderStatus } = useApi();

  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const retrieveOrder = async () => {
      const newOrder = await getOrder(id);
      setOrder(newOrder);
    };
    retrieveOrder().catch(console.error);
  }, [isFocused]);

  if (!order) {
    return <ActivityIndicator size="large" />;
  }

  const actions: ReactNode[] = [];

  if (
    order.last_status.status == "ACCEPTED" ||
    order.last_status.status == "PREPARING"
  ) {
    if (!order.are_drinks_ready) {
      actions.push(
        <Button
          key="drinks-ready"
          mode="contained"
          onPress={() =>
            updateOrderStatus({
              orderId: order.id,
              orderStatus: order.are_food_ready ? "PREPARED" : "PREPARING",
              areDrinksReady: true,
            }).then(() => router.navigate("/chef/orders"))
          }
        >
          Bebidas listas
        </Button>,
      );
    }
    if (!order.are_food_ready) {
      actions.push(
        <Button
          key="food-ready"
          mode="contained"
          onPress={() =>
            updateOrderStatus({
              orderId: order.id,
              orderStatus: order.are_drinks_ready ? "PREPARED" : "PREPARING",
              areFoodReady: true,
            }).then(() => router.navigate("/chef/orders"))
          }
        >
          Comida lista
        </Button>,
      );
    }
  }
  if (order.last_status.status == "PREPARED") {
    actions.push(
      <Button
        key="drinks-ready"
        mode="contained"
        onPress={() =>
          updateOrderStatus({
            orderId: order.id,
            orderStatus: "PICKED_UP",
          }).then(() => router.navigate("/chef/orders"))
        }
      >
        Retirado por el mozo
      </Button>,
    );
  }

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Text>Comanda #{order.id}</Text>
          <Text>Mozo {order.waiter.name}</Text>
          <Text>Mesa {order.table.number}</Text>
          {order.foods.map((food) => (
            <Text key={food.food.id}>
              - {food.quantity}x {food.food.name}
            </Text>
          ))}
          {order.drinks.map((drinks) => (
            <Text key={drinks.drink.id}>
              - {drinks.quantity}x {drinks.drink.name}
            </Text>
          ))}
          {(order.comment || null) && (
            <Text className={"italic"}>{order.comment}</Text>
          )}
          <Text>
            ${order.total_price} - {PaymentMethodLabel[order.payment_type]}
          </Text>
          {order.last_status && (
            <StatusLabel status={order.last_status.status} />
          )}
          {actions}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default ChefOrderView;
