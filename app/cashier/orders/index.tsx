import { OrderListing } from "@/components/OrderListing";

const CashierOrders = () => {
  return (
    <OrderListing
      individualOrderPath={"/chef/orders/[id]"}
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
