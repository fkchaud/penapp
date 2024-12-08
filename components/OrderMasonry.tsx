import { TouchableOpacity, useWindowDimensions, ViewStyle } from "react-native";

import StaggeredList from "@mindinventory/react-native-stagger-view";

import { OrderCard } from "@/components/OrderCard";
import { Order } from "@/types";

type Props = {
  orders: Order[];
  maxWidth?: number;
  inactive?: boolean;
  className?: string;
  touchableOpacityClassName?: string;
  orderCardClassName?: string;
  style?: ViewStyle;
  touchableOpacityStyle?: ViewStyle;
  orderCardStyle?: ViewStyle;
  onPressCard: (order: Order) => void;
};

const OrderMasonry = ({
  orders,
  maxWidth = 180,
  inactive = false,
  className,
  touchableOpacityClassName,
  orderCardClassName,
  style,
  touchableOpacityStyle,
  orderCardStyle,
  onPressCard,
}: Props) => {
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
          onPress={() => onPressCard(item)}
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
