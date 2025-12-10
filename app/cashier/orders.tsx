import React from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { OrderListing } from "@/components/OrderListing";
import { useApi } from "@/hooks/useApi";
import { Order, OrderStatus } from "@/types";
import { useMutation } from "@tanstack/react-query";

const ActionButton = ({
  key,
  text,
  order,
  targetStatus,
  onFinishAction,
}: {
  key: string;
  text: string;
  order: Order;
  targetStatus: OrderStatus;
  onFinishAction: () => void;
}) => {
  const { updateOrderStatus } = useApi();

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({
      order,
      orderStatus,
    }: {
      order: Order;
      orderStatus: OrderStatus;
    }) => updateOrderStatus({ orderId: order.id, orderStatus: orderStatus }),
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
      onPress={() =>
        updateOrderStatusMutation.mutate({
          order: order,
          orderStatus: targetStatus,
        })
      }
      loading={updateOrderStatusMutation.isPending}
      disabled={updateOrderStatusMutation.isPending}
    >
      {text}
    </Button>
  );
};

const CashierOrders = () => {
  const router = useRouter();

  const getActions = (
    order: Order | null,
    onActionClose: () => void,
    onActionRefresh: (order: Order) => void,
  ) => {
    if (!order || order.last_status?.status != "PLACED") return [];

    return [
      <ActionButton
        key={"approve"}
        text={"Aprobar"}
        order={order}
        targetStatus={"ACCEPTED"}
        onFinishAction={onActionClose}
      />,
      <ActionButton
        key={"reject"}
        text={"Rechazar"}
        order={order}
        targetStatus={"REJECTED"}
        onFinishAction={onActionClose}
      />,
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
