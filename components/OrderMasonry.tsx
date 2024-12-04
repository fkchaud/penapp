import { Dimensions, TouchableOpacity, ViewStyle } from "react-native";

import { useRouter } from "expo-router";

import { OrderCard } from "@/components/OrderCard";
import { MasonryFlashList } from "@shopify/flash-list";
import { Order } from "@/types";

type ValidPaths =
  | "/cashier/orders/[id]"
  | "/waiter/orders/[id]"
  | "/chef/orders/[id]";
type Props = {
  orders: Order[];
  targetPath: ValidPaths;
  maxWidth?: number;
  inactive?: boolean;
  masonryFlashListClassName?: string;
  touchableOpacityClassName?: string;
  orderCardClassName?: string;
  masonryFlashStyle?: ViewStyle;
  touchableOpacityStyle?: ViewStyle;
  orderCardStyle?: ViewStyle;
};

const OrderMasonry = ({
  orders,
  targetPath,
  maxWidth = 148,
  inactive = false,
  masonryFlashListClassName,
  touchableOpacityClassName,
  orderCardClassName,
  masonryFlashStyle,
  touchableOpacityStyle,
  orderCardStyle,
}: Props) => {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  return (
    <MasonryFlashList
      numColumns={Math.floor(width / maxWidth)}
      estimatedItemSize={180}
      data={orders}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: targetPath, params: { id: item.id } })
          }
          className={"w-full " + (touchableOpacityClassName || "")}
          key={item.id}
          style={{ ...touchableOpacityStyle }}
        >
          <OrderCard
            order={item}
            key={item.id}
            className={
              (inactive ? "opacity-60" : "") + " " + (orderCardClassName || "")
            }
            style={{ ...orderCardStyle }}
          />
        </TouchableOpacity>
      )}
      className={masonryFlashListClassName || ""}
      style={{ ...masonryFlashStyle }}
    />
  );
};

export default OrderMasonry;
