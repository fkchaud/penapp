import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { ActivityIndicator, Button, Icon } from "react-native-paper";
import OrderMasonry from "@/components/OrderMasonry";
import { Order, OrderStatus } from "@/types";
import React, { useEffect, useState } from "react";
import { GetOrdersParams, useApi } from "@/hooks/useApi";
import { useIsFocused } from "@react-navigation/core";
import { OrderCard } from "@/components/OrderCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type OrderActionsBuilder = (
  order: Order | null,
  onActionClose: () => void,
  onActionRefresh: (order: Order) => void,
) => React.ReactNode;
type OrderListingProps = {
  beforeComponent?: React.ReactNode;
  activeOrderStatuses: OrderStatus[];
  inactiveOrderStatuses: OrderStatus[];
  getOrderParams?: GetOrdersParams;
  orderActionsBuilder: OrderActionsBuilder;
};
export const OrderListing = ({
  beforeComponent,
  activeOrderStatuses,
  inactiveOrderStatuses,
  getOrderParams,
  orderActionsBuilder,
}: OrderListingProps) => {
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const { getOrders } = useApi();
  const { data: orders } = useQuery({
    queryKey: ["orders", getOrderParams],
    queryFn: async () => getOrders(getOrderParams),
    refetchInterval: 10000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const invalidateOrders = () =>
    queryClient.invalidateQueries({ queryKey: ["orders"] });

  const [hideInactive, setHideInactive] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isFocused) return;
    invalidateOrders();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    if (!orders || orders.length === 0) return;
    if (!currentOrder) return;

    const curOrd = orders.find((o) => o.id == currentOrder.id);
    if (curOrd) setCurrentOrder(curOrd);
  }, [orders, isFocused]);

  const arrowIcon = hideInactive ? "chevron-up" : "chevron-down";

  if (!orders) {
    return <ActivityIndicator size="large" />;
  }

  const filterOrders = (statuses: OrderStatus[]) =>
    orders.filter((o) => statuses.includes(o.last_status.status));

  const activeOrders = () => filterOrders(activeOrderStatuses);
  const inactiveOrders = () => filterOrders(inactiveOrderStatuses);

  const onActionClose = () => {
    setCurrentOrder(null);
    invalidateOrders();
  };
  const onActionRefresh = () => {
    invalidateOrders();
  };

  const cardScale = () => {
    const DEF_MAX_WIDTH = 256 / 0.45;
    if (width >= DEF_MAX_WIDTH) return 2;
    else return (2 * width) / DEF_MAX_WIDTH;
  };

  return (
    <View className={"flex-1"}>
      <Modal
        visible={!!currentOrder && isFocused}
        onDismiss={() => setCurrentOrder(null)}
        onRequestClose={() => setCurrentOrder(null)}
        transparent={true}
        animationType={"none"}
      >
        <Pressable
          onPress={() => setCurrentOrder(null)}
          className={
            "w-full h-full justify-center items-center bg-black/25 cursor-default"
          }
        >
          <Pressable className={"cursor-auto"}>
            <View
              className={"align-middle self-center w-5/6"}
              style={{
                transform: [{ scale: cardScale() }],
                width: 256,
              }}
            >
              <Pressable
                className={"self-end items-center bg-white/25 w-4"}
                onPress={() => setCurrentOrder(null)}
              >
                <Text className={"text-center"}>X</Text>
              </Pressable>
              <OrderCard order={currentOrder} />
              {orderActionsBuilder(
                currentOrder,
                onActionClose,
                onActionRefresh,
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {beforeComponent}
      <Button mode="outlined" onPress={invalidateOrders}>
        Actualizar
      </Button>
      <View className={"flex-1"}>
        <OrderMasonry
          orders={activeOrders()}
          onPressCard={setCurrentOrder}
          onRefresh={invalidateOrders}
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
            onPressCard={setCurrentOrder}
            onRefresh={invalidateOrders}
            inactive={true}
            className={`${hideInactive ? "hidden" : ""}`}
          />
        </View>
      )}
    </View>
  );
};
