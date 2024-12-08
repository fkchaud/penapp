import { Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import OrderMasonry, { ValidPaths } from "@/components/OrderMasonry";
import { Order, OrderStatus } from "@/types";
import React, { useEffect, useState } from "react";
import { GetOrdersParams, useApi } from "@/hooks/useApi";
import { useIsFocused } from "@react-navigation/core";

type OrderListingProps = {
  beforeComponent?: React.ReactNode;
  individualOrderPath: ValidPaths;
  activeOrderStatuses: OrderStatus[];
  inactiveOrderStatuses: OrderStatus[];
  getOrderParams?: GetOrdersParams;
};

export const OrderListing = ({
  beforeComponent,
  individualOrderPath,
  activeOrderStatuses,
  inactiveOrderStatuses,
  getOrderParams,
}: OrderListingProps) => {
  const isFocused = useIsFocused();
  const { getOrders } = useApi();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [hideInactive, setHideInactive] = useState(true);

  const retrieveOrders = async () => {
    const newOrders = await getOrders(getOrderParams);
    setOrders(newOrders || []);
  };
  useEffect(() => {
    if (!isFocused) return;
    retrieveOrders().catch(console.error);
  }, [isFocused]);

  const arrowIcon = hideInactive ? "chevron-up" : "chevron-down";

  if (!orders) {
    return <ActivityIndicator size="large" />;
  }

  const filterOrders = (statuses: OrderStatus[]) =>
    orders.filter((o) => statuses.includes(o.last_status.status));

  const activeOrders = () => filterOrders(activeOrderStatuses);
  const inactiveOrders = () => filterOrders(inactiveOrderStatuses);

  return (
    <View className={"flex-1"}>
      {beforeComponent}
      <View className={"flex-1"}>
        <OrderMasonry
          orders={activeOrders()}
          targetPath={individualOrderPath}
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
            targetPath={individualOrderPath}
            inactive={true}
            className={`${hideInactive ? "hidden" : ""}`}
          />
        </View>
      )}
    </View>
  );
};
