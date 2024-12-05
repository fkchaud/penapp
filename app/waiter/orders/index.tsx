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
import OrderMasonry from "@/components/OrderMasonry";
import "@/css/global.css";

const Orders = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const isFocused = useIsFocused();
  const { getOrders } = useApi();
  const router = useRouter();

  const { waiter } = useContext(WaiterContext) as WaiterContextType;

  const retrieveOrders = async () => {
    const newOrders: Order[] = await getOrders({ waiter });
    setOrders(newOrders.sort((a, b) => b.id - a.id) || []);
  };
  useEffect(() => {
    retrieveOrders().catch(console.error);
  }, [waiter, isFocused]);

  if (!orders) {
    return <ActivityIndicator size="large" />;
  }

  const activeOrders = () =>
    orders.filter((o) =>
      ["PLACED", "ACCEPTED", "PREPARING", "PREPARED", "PICKED_UP"].includes(
        o.last_status.status,
      ),
    );
  const inactiveOrders = () =>
    orders.filter((o) =>
      ["REJECTED", "DELIVERED", "CANCELED"].includes(o.last_status.status),
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
