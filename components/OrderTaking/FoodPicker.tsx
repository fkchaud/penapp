import { SectionList, Text, View } from "react-native";
import { Divider, IconButton } from "react-native-paper";
import { Item, QuantityByItem } from "@/types";

type BuyableItemProps = {
  item: Item;
  addItemToOrder: (item: Item, quantity: number) => void;
  quantity: number;
  className?: string;
};
const BuyableItem = ({
  item,
  addItemToOrder,
  quantity,
  className,
  ...props
}: BuyableItemProps) => {
  return (
    <View
      className={
        (className ? className + " " : "") + "flex-row items-center px-3 py-1"
      }
      {...props}
    >
      <View className={"flex-1"}>
        <Text>{item.name}</Text>
        <Text className={"text-neutral-500 text-sm"}>
          ${item.price} | Quedan {item.remaining}
        </Text>
      </View>
      <View>
        <View className={"flex-row items-center"}>
          <IconButton
            size={10}
            icon={"minus"}
            mode={"contained-tonal"}
            onPress={() => {
              addItemToOrder(item, quantity - 1);
            }}
          />
          <Text>{quantity}</Text>
          <IconButton
            size={10}
            icon={"plus"}
            mode={"contained-tonal"}
            onPress={() => {
              addItemToOrder(item, quantity + 1);
            }}
          />
        </View>
      </View>
    </View>
  );
};
type FoodPickerProps = {
  foods: Item[];
  drinks: Item[];
  foodToOrder: QuantityByItem;
  drinksToOrder: QuantityByItem;
  addItemToOrder: (item: Item, quantity: number) => void;
};
export const FoodPicker = ({
  foods,
  drinks,
  addItemToOrder,
  foodToOrder,
  drinksToOrder,
}: FoodPickerProps) => {
  const isItemFood = (item: Item) => {
    return foods.includes(item);
  };

  return (
    <SectionList
      sections={[
        { title: "Comida", data: foods },
        { title: "Bebida", data: drinks },
      ]}
      keyExtractor={(item) => `${isItemFood(item) ? "F" : "D"}${item.id}`}
      renderItem={({ item }) => (
        <BuyableItem
          key={item.id.toString()}
          item={item}
          quantity={
            isItemFood(item)
              ? foodToOrder.get(item) || 0
              : drinksToOrder.get(item) || 0
          }
          addItemToOrder={addItemToOrder}
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text className={"text-xl font-bold bg-[#f3f3f3DD] py-2 text-center"}>
          {title}
        </Text>
      )}
      ItemSeparatorComponent={Divider}
    />
  );
};
