import React from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { OrderListing } from "@/components/OrderListing";
import { useApi } from "@/hooks/useApi";
import { Order } from "@/types";

const CashierOrders = () => {
  const { updateOrderStatus } = useApi();
  const router = useRouter();

  const getActions = (
    order: Order | null,
    onActionClose: () => void,
    onActionRefresh: (order: Order) => void,
  ) => {
    if (!order || order.last_status?.status != "PLACED") return [];

    return [
      <Button
        mode="contained"
        key="approve"
        onPress={() =>
          updateOrderStatus({
            orderId: order.id,
            orderStatus: "ACCEPTED",
          }).then(onActionClose)
        }
      >
        Aprobar
      </Button>,
      <Button
        mode="contained"
        key="reject"
        onPress={() =>
          updateOrderStatus({
            orderId: order.id,
            orderStatus: "REJECTED",
          }).then(onActionClose)
        }
      >
        Rechazar
      </Button>,
    ];
  };

  return (
    <OrderListing
      orderActionsBuilder={getActions}
      activeOrderStatuses={["PLACED"]}
      inactiveOrderStatuses={[
        "ACCEPTED",
        "PREPARING",
        "PREPARED",
        "PICKED_UP",
        "REJECTED",
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

export default CashierOrders;
