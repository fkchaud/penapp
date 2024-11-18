import { useContext, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ActivityIndicator, Button, PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { useIsFocused } from "@react-navigation/core";

import { Theme } from "@/constants/Colors";
import { Order } from "@/types";
import { WaiterContext, WaiterContextType } from "@/app/_layout";
import { useApi } from "@/hooks/useApi";
import "@/css/global.css";
import OrderMasonry from "@/components/OrderMasonry";

const Orders = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const isFocused = useIsFocused();
  const { getOrders } = useApi();
  const router = useRouter();

  const [time, setTime] = useState(Date.now());
  let interval: NodeJS.Timeout;

  useEffect(() => {
    clearInterval(interval);
    if (isFocused) interval = setInterval(() => setTime(Date.now()), 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isFocused]);

  const { waiter } = useContext(WaiterContext) as WaiterContextType;

  useEffect(() => {
    const retrieve = async () => {
      const newOrders: Order[] = await getOrders({ waiter });
      setOrders(newOrders.sort((a, b) => b.id - a.id) || []);
    };
    retrieve().catch(console.error);
  }, [waiter, isFocused, time]);

  if (!orders) {
    return <ActivityIndicator size="large" />;
  }

  const activeOrders = () =>
    orders.filter((o) =>
      ["PLACED", "ACCEPTED", "PICKED_UP", "REJECTED"].includes(
        o.last_status.status,
      ),
    );
  const inactiveOrders = () =>
    orders.filter((o) =>
      ["DELIVERED", "CANCELED"].includes(o.last_status.status),
    );

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Button
            mode={"contained"}
            onPress={() => router.navigate("/waiter/take_order")}
          >
            Tomar pedido
          </Button>
          <View>
            <OrderMasonry
              orders={activeOrders()}
              targetPath={"/waiter/orders/[id]"}
            />
          </View>
          {inactiveOrders().length > 0 && (
            <View>
              <Text className={"font-bold text-xl mt-4"}>Pasadas:</Text>
              <OrderMasonry
                orders={inactiveOrders()}
                targetPath={"/waiter/orders/[id]"}
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
