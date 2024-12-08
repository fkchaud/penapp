import { TouchableOpacity, useWindowDimensions, ViewStyle } from "react-native";

import { useRouter } from "expo-router";

import { OrderCard } from "@/components/OrderCard";
import { Order } from "@/types";
import StaggeredList from "@mindinventory/react-native-stagger-view";

export type ValidPaths =
  | "/cashier/orders/[id]"
  | "/waiter/orders/[id]"
  | "/chef/orders/[id]";
type Props = {
  orders: Order[];
  targetPath: ValidPaths;
  maxWidth?: number;
  inactive?: boolean;
  className?: string;
  touchableOpacityClassName?: string;
  orderCardClassName?: string;
  style?: ViewStyle;
  touchableOpacityStyle?: ViewStyle;
  orderCardStyle?: ViewStyle;
};

const OrderMasonry = ({
  orders,
  targetPath,
  maxWidth = 180,
  inactive = false,
  className,
  touchableOpacityClassName,
  orderCardClassName,
  style,
  touchableOpacityStyle,
  orderCardStyle,
}: Props) => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  return (
    <StaggeredList
      className={`${className}`}
      style={{ ...style }}
      animationType={"SLIDE_LEFT"}
      numColumns={Math.floor(screenWidth / maxWidth)}
      data={orders}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: targetPath, params: { id: item.id } })
          }
          className={`w-44 my-1.5 ${touchableOpacityClassName || ""}`}
          key={item.id}
          style={{ ...touchableOpacityStyle }}
        >
          <OrderCard
            order={item}
            key={item.id}
            className={`h-full ${inactive ? "opacity-50" : ""} ${orderCardClassName || ""}`}
            style={{ ...orderCardStyle }}
          />
        </TouchableOpacity>
      )}
    />
  );
};

export default OrderMasonry;
