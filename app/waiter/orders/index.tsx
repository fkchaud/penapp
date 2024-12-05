import { useContext, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button, Icon } from "react-native-paper";

import { useRouter } from "expo-router";

import { useIsFocused } from "@react-navigation/core";

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
  const [hideInactive, setHideInactive] = useState(true);

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

  const arrowIcon = hideInactive ? "chevron-up" : "chevron-down";

  return (
    <View className={"flex-1"}>
      <Button
        mode={"contained"}
        onPress={() => router.navigate("/waiter/take_order")}
      >
        Tomar pedido
      </Button>
      <View className={"flex-1"}>
        <OrderMasonry
          orders={activeOrders()}
          targetPath={"/waiter/orders/[id]"}
        />
      </View>
      {inactiveOrders().length > 0 && (
        <View
          className={`border-t border-t-black/50 ${hideInactive ? "" : "flex-1"}`}
        >
          <TouchableOpacity
            onPress={() => setHideInactive(!hideInactive)}
            className={"flex-row justify-center items-center"}
          >
            <Icon size={32} source={arrowIcon} />
            <Text className={"font-bold text-xl my-4"}> Pasadas: </Text>
            <Icon size={32} source={arrowIcon} />
          </TouchableOpacity>
          <OrderMasonry
            orders={inactiveOrders()}
            targetPath={"/waiter/orders/[id]"}
            inactive={true}
            className={`${hideInactive ? "hidden" : ""}`}
          />
        </View>
      )}
    </View>
  );
};

export default Orders;
