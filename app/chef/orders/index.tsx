import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import { Theme } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { GetOrdersParams, useApi } from "@/hooks/useApi";
import OrderMasonry from "@/components/OrderMasonry";

const ChefOrders = () => {
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

  const filterOrders = (statuses: OrderStatus[]) =>
    orders.filter((o) => statuses.includes(o.last_status.status));
  const activeOrders = () =>
    orders.filter((o) =>
      ["ACCEPTED", "PREPARING", "PREPARED"].includes(o.last_status.status),
    );
  const inactiveOrders = () =>
    orders.filter((o) =>
      ["PLACED", "REJECTED", "PICKED_UP", "DELIVERED", "CANCELED"].includes(
        o.last_status.status,
      ),
    );

  return (
    <View className={"flex-1"}>
      <View className={"flex-1"}>
        <OrderMasonry
          orders={activeOrders()}
          targetPath={"/chef/orders/[id]"}
        />
      </View>
      {inactiveOrders().length > 0 && (
        <View className={`${hideInactive ? "" : "flex-1"}`}>
          <TouchableOpacity onPress={() => setHideInactive(!hideInactive)}>
            <Text className={"font-bold text-xl my-4"}>Pasadas:</Text>
          </TouchableOpacity>
          <OrderMasonry
            orders={inactiveOrders()}
            targetPath={"/chef/orders/[id]"}
            inactive={true}
            className={`${hideInactive ? "hidden" : ""}`}
          />
        </View>
      )}
    </View>
  );
};

export default ChefOrders;
