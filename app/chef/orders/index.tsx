import { OrderListing } from "@/components/OrderListing";

const ChefOrders = () => {
  return (
    <OrderListing
      individualOrderPath={"/chef/orders/[id]"}
      activeOrderStatuses={["ACCEPTED", "PREPARING", "PREPARED"]}
      inactiveOrderStatuses={[
        "PLACED",
        "REJECTED",
        "PICKED_UP",
        "DELIVERED",
        "CANCELED",
      ]}
    />
  );
};

export default ChefOrders;
