import React, { ReactNode } from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { OrderListing } from "@/components/OrderListing";
import { useApi } from "@/hooks/useApi";
import { Order } from "@/types";

const ChefOrders = () => {
  const { updateOrderStatus } = useApi();
  const router = useRouter();

  const getActions = (order: Order | null, onActionCallback: () => void) => {
    if (!order) return [];

    const actions: ReactNode[] = [];

    if (
      order.last_status.status == "ACCEPTED" ||
      order.last_status.status == "PREPARING"
    ) {
      if (!order.are_drinks_ready) {
        actions.push(
          <Button
            key="drinks-ready"
            mode="contained"
            onPress={() =>
              updateOrderStatus({
                orderId: order.id,
                orderStatus: order.are_food_ready ? "PREPARED" : "PREPARING",
                areDrinksReady: true,
              }).then(onActionCallback)
            }
          >
            Bebidas listas
          </Button>,
        );
      }
      if (!order.are_food_ready) {
        actions.push(
          <Button
            key="food-ready"
            mode="contained"
            onPress={() =>
              updateOrderStatus({
                orderId: order.id,
                orderStatus: order.are_drinks_ready ? "PREPARED" : "PREPARING",
                areFoodReady: true,
              }).then(onActionCallback)
            }
          >
            Comida lista
          </Button>,
        );
      }
    }
    if (order.last_status.status == "PREPARED") {
      actions.push(
        <Button
          key="drinks-ready"
          mode="contained"
          onPress={() =>
            updateOrderStatus({
              orderId: order.id,
              orderStatus: "PICKED_UP",
            }).then(onActionCallback)
          }
        >
          Retirado por el mozo
        </Button>,
      );
    }
    return actions;
  };

  return (
    <OrderListing
      orderActionsBuilder={getActions}
      activeOrderStatuses={["ACCEPTED", "PREPARING", "PREPARED"]}
      inactiveOrderStatuses={[
        "PLACED",
        "REJECTED",
        "PICKED_UP",
        "DELIVERED",
        "CANCELED",
      ]}
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
