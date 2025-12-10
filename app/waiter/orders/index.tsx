import React, { useContext } from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { WaiterContext, WaiterContextType } from "@/app/_layout";
import { OrderListing } from "@/components/OrderListing";
import { useApi } from "@/hooks/useApi";
import { Order, OrderStatus } from "@/types";
import "@/css/global.css";
import { useMutation } from "@tanstack/react-query";

const OrderStatusActionButton = ({
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

const Orders = () => {
  const router = useRouter();

  const { waiter } = useContext(WaiterContext) as WaiterContextType;

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
        <OrderStatusActionButton
          key={"cancel"}
          order={order}
          onFinishAction={onActionClose}
          targetStatus={"CANCELED"}
          text={"Cancelar"}
        />,
      );
    }
    if (["PICKED_UP", "PREPARED"].includes(order.last_status.status)) {
      actions.push(
        <OrderStatusActionButton
          key={"delivered"}
          order={order}
          onFinishAction={onActionClose}
          targetStatus={"DELIVERED"}
          text={"Entregado"}
        />,
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
