import React, { ReactNode } from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { OrderListing } from "@/components/OrderListing";
import { UpdateOrderStatusParams, useApi } from "@/hooks/useApi";
import { Order, OrderStatus } from "@/types";
import { useMutation } from "@tanstack/react-query";

const ActionButton = ({
  key,
  text,
  apiParams,
  onFinishAction,
}: {
  key: string;
  text: string;
  apiParams: UpdateOrderStatusParams;
  onFinishAction: () => void;
}) => {
  const { updateOrderStatus } = useApi();

  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: UpdateOrderStatusParams) => updateOrderStatus(data),
    onSuccess: () => {
      onFinishAction();
    },
    onError: (error: unknown) => {
      console.error(error);
      onFinishAction();
    },
  });

  return (
    <Button
      key={key}
      mode="contained"
      onPress={() => updateOrderStatusMutation.mutate(apiParams)}
      loading={updateOrderStatusMutation.isPending}
      disabled={updateOrderStatusMutation.isPending}
    >
      {text}
    </Button>
  );
};

const ChefOrders = () => {
  const { updateOrderStatus } = useApi();
  const router = useRouter();

  const getActions = (
    order: Order | null,
    onActionClose: () => void,
    onActionRefresh: (order: Order) => void,
  ) => {
    if (!order) return [];

    const actions: ReactNode[] = [];

    if (
      order.last_status.status == "ACCEPTED" ||
      order.last_status.status == "PREPARING"
    ) {
      if (!order.are_drinks_ready) {
        actions.push(
          <ActionButton
            key="drinks-ready"
            text="Bebidas listas"
            apiParams={{
              orderId: order.id,
              orderStatus: order.are_food_ready ? "PREPARED" : "PREPARING",
              areDrinksReady: true,
            }}
            onFinishAction={() => onActionRefresh(order)}
          />,
        );
      }
      if (!order.are_food_ready) {
        actions.push(
          <ActionButton
            key="food-ready"
            text="Comida lista"
            apiParams={{
              orderId: order.id,
              orderStatus: order.are_drinks_ready ? "PREPARED" : "PREPARING",
              areFoodReady: true,
            }}
            onFinishAction={() => onActionRefresh(order)}
          />,
        );
      }
    }
    if (order.last_status.status == "PREPARED") {
      actions.push(
        <ActionButton
          key={"picked-up"}
          text={"Retirado por el mozo"}
          apiParams={{
            orderId: order.id,
            orderStatus: "PICKED_UP",
          }}
          onFinishAction={onActionClose}
        />,
      );
    }
    return actions;
  };

  return (
    <OrderListing
      orderActionsBuilder={getActions}
      activeOrderStatuses={["ACCEPTED", "PREPARING", "PREPARED"]}
      inactiveOrderStatuses={["PICKED_UP", "DELIVERED"]}
      beforeComponent={
        <Button
          mode={"contained"}
          onPress={() => router.navigate("/add_manual_order")}
        >
          Agregar pedido
        </Button>
      }
    />
  );
};

export default ChefOrders;
