import { Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import { useEffect, useState } from "react";
import { Order } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { GetOrdersParams, useApi } from "@/hooks/useApi";
import OrderMasonry from "@/components/OrderMasonry";

const Orders = () => {
  const isFocused = useIsFocused();
  const { getOrders } = useApi();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [hideInactive, setHideInactive] = useState(true);

  const retrieve = async () => {
    const params: GetOrdersParams = {};
    const newOrders = await getOrders(params);
    setOrders(newOrders || []);
  };
  useEffect(() => {
    retrieve().catch(console.error);
  }, [isFocused]);

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

  const arrowIcon = hideInactive ? "chevron-up" : "chevron-down";

  return (
    <View className={"flex-1"}>
      <View className={"flex-1"}>
        <OrderMasonry
          orders={activeOrders()}
          targetPath={"/cashier/orders/[id]"}
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
            targetPath={"/cashier/orders/[id]"}
            inactive={true}
            className={`${hideInactive ? "hidden" : ""}`}
          />
        </View>
      )}
    </View>
  );
};

export default Orders;
