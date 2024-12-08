import { useContext } from "react";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

import { WaiterContext, WaiterContextType } from "@/app/_layout";
import { OrderListing } from "@/components/OrderListing";
import "@/css/global.css";

const Orders = () => {
  const router = useRouter();

  const { waiter } = useContext(WaiterContext) as WaiterContextType;

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
      individualOrderPath={"/waiter/orders/[id]"}
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
