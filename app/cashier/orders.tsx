import { Button } from "react-native-paper";

import { OrderListing } from "@/components/OrderListing";
import { useApi } from "@/hooks/useApi";
import { Order } from "@/types";

const CashierOrders = () => {
  const { updateOrderStatus } = useApi();

  const getActions = (order: Order | null, onActionCallback: () => void) => {
    if (!order || order.last_status?.status != "PLACED") return [];

    return [
      <Button
        mode="contained"
        onPress={() =>
          updateOrderStatus({
            orderId: order.id,
            orderStatus: "ACCEPTED",
          }).then(onActionCallback)
        }
      >
        Aprobar
      </Button>,
      <Button
        mode="contained"
        onPress={() =>
          updateOrderStatus({
            orderId: order.id,
            orderStatus: "REJECTED",
          }).then(onActionCallback)
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
    />
  );
};

export default CashierOrders;
