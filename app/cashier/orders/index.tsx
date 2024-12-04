import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import { Theme } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Order } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { GetOrdersParams, useApi } from "@/hooks/useApi";
import OrderMasonry from "@/components/OrderMasonry";

const Orders = () => {
  const isFocused = useIsFocused();
  const { getOrders } = useApi();

  const [time, setTime] = useState(Date.now());
  let interval: NodeJS.Timeout;

  useEffect(() => {
    clearInterval(interval);
    if (isFocused) interval = setInterval(() => setTime(Date.now()), 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isFocused]);

  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const retrieve = async () => {
      const params: GetOrdersParams = {};
      const newOrders = await getOrders(params);
      setOrders(newOrders || []);
    };
    retrieve().catch(console.error);
  }, [isFocused, time]);

  if (!orders) {
    return <ActivityIndicator size="large" />;
  }

  const activeOrders = () =>
    orders.filter((o) => ["PLACED"].includes(o.last_status.status));
  const inactiveOrders = () =>
    orders.filter((o) =>
      [
        "ACCEPTED",
        "PREPARING",
        "PREPARED",
        "PICKED_UP",
        "REJECTED",
        "DELIVERED",
        "CANCELED",
      ].includes(o.last_status.status),
    );

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <View>
            <OrderMasonry
              orders={activeOrders()}
              targetPath={"/cashier/orders/[id]"}
            />
          </View>
          {inactiveOrders().length > 0 && (
            <View>
              <Text className={"font-bold text-xl mt-4"}>Pasadas:</Text>
              <OrderMasonry
                orders={inactiveOrders()}
                targetPath={"/cashier/orders/[id]"}
                inactive={true}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default Orders;
