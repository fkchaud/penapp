import React, { useContext } from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { WaiterContext, WaiterContextType } from "@/app/_layout";
import { OrderListing } from "@/components/OrderListing";
import { useApi } from "@/hooks/useApi";
import { Order } from "@/types";
import "@/css/global.css";

const Orders = () => {
  const router = useRouter();

  const { waiter } = useContext(WaiterContext) as WaiterContextType;
  const { updateOrderStatus } = useApi();

  const getActions = (
    order: Order | null,
    onActionClose: () => void,
    onActionRefresh: (order: Order) => void,
  ) => {
    if (!order) return [];

    const actions: React.ReactNode[] = [];

    actions.push(
      <Button
        key="edit"
        onPress={() => {
          router.navigate({
            pathname: "/waiter/orders/[id]/edit",
            params: { id: order.id },
          });
          onActionClose();
        }}
      >
        Editar
      </Button>,
    );
    if (order.last_status.status == "PLACED") {
      actions.push(
        <Button
          key="cancel"
          mode="contained"
          onPress={() =>
            updateOrderStatus({
              orderId: order.id,
              orderStatus: "CANCELED",
            }).then(onActionClose)
          }
        >
          Cancelar
        </Button>,
      );
    }
    if (["PICKED_UP", "PREPARED"].includes(order.last_status.status)) {
      actions.push(
        <Button
          key="delivered"
          mode="contained"
          onPress={() =>
            updateOrderStatus({
              orderId: order.id,
              orderStatus: "DELIVERED",
            }).then(onActionClose)
          }
        >
          Entregado
        </Button>,
      );
    }

    return actions;
  };

  return (
    <OrderListing
      beforeComponent={
        <Button
          mode={"contained"}
          onPress={() => router.navigate("/waiter/take_order")}
        >
          Tomar pedido
        </Button>
      }
      orderActionsBuilder={getActions}
      activeOrderStatuses={[
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "PREPARED",
        "PICKED_UP",
      ]}
      inactiveOrderStatuses={["REJECTED", "DELIVERED", "CANCELED"]}
      getOrderParams={waiter ? { waiter: waiter.name } : undefined}
    />
  );
};

export default Orders;
