import {TouchableOpacity, useWindowDimensions, ViewStyle} from "react-native";

import { FlashList } from "@shopify/flash-list";

import { OrderCard } from "@/components/OrderCard";
import { Order } from "@/types";
import { useState } from "react";

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
  onRefresh: () => Promise<void>;
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
  onRefresh,
}: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <FlashList
      style={{ ...style }}
      masonry
      numColumns={Math.floor(screenWidth / maxWidth)}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onPressCard(item)}
          className={`w-44 my-1.5 ${touchableOpacityClassName || ""}`}
          style={{ ...touchableOpacityStyle }}
        >
          <OrderCard
            order={item}
            className={`h-full ${inactive ? "opacity-50" : ""} ${orderCardClassName || ""}`}
            style={{ ...orderCardStyle }}
          />
        </TouchableOpacity>
      )}
    />
  );
};

export default OrderMasonry;
