import { router, useLocalSearchParams } from "expo-router";
import { Theme } from "@/constants/Colors";
import { ActivityIndicator, Button, PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text } from "react-native";
import { PaymentMethodLabel, StatusLabel } from "@/components/OrderCard";
import { useEffect, useState } from "react";
import { Order } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";

const WaiterOrderView = () => {
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
          {order.comment && <Text className={"italic"}>{order.comment}</Text>}
          <Text>
            ${order.total_price} - {PaymentMethodLabel[order.payment_type]}
          </Text>
          {order.last_status && (
            <StatusLabel status={order.last_status.status} />
          )}
          <Button
            onPress={() =>
              router.navigate({
                pathname: "/waiter/orders/[id]/edit",
                params: { id: order.id },
              })
            }
          >
            Editar
          </Button>
          {order.last_status.status == "PLACED" ? (
            <>
              <Button
                mode="contained"
                onPress={() =>
                  updateOrderStatus({
                    orderId: order.id,
                    orderStatus: "CANCELED",
                  }).then(() => router.navigate("/waiter/orders"))
                }
              >
                Cancelar
              </Button>
            </>
          ) : null}
          {order.last_status.status == "PICKED_UP" ? (
            <>
              <Button
                mode="contained"
                onPress={() =>
                  updateOrderStatus({
                    orderId: order.id,
                    orderStatus: "DELIVERED",
                  }).then(() => router.navigate("/waiter/orders"))
                }
              >
                Entregado
              </Button>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default WaiterOrderView;
