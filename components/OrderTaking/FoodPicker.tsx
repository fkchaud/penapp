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
  const disabled = item.remaining <= 0;

  return (
    <View
      className={`${className || ""} ${disabled ? "opacity-50" : ""} flex-row items-center px-3 py-1`}
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
            disabled={disabled}
          />
          <Text>{quantity}</Text>
          <IconButton
            size={10}
            icon={"plus"}
            mode={"contained-tonal"}
            onPress={() => {
              addItemToOrder(item, quantity + 1);
            }}
            disabled={disabled || quantity + 1 > item.remaining}
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
  addFoodToOrder: (item: Item, quantity: number) => void;
  addDrinksToOrder: (item: Item, quantity: number) => void;
};
export const FoodPicker = ({
  foods,
  drinks,
  addFoodToOrder,
  addDrinksToOrder,
  foodToOrder,
  drinksToOrder,
}: FoodPickerProps) => {
  const foodToOrderObj: { [id: number]: number } = Object.fromEntries(
    [...foodToOrder.entries()].map(([item, qty]) => [item.id, qty]),
  );
  const drinksToOrderObj: { [id: number]: number } = Object.fromEntries(
    [...drinksToOrder.entries()].map(([item, qty]) => [item.id, qty]),
  );

  return (
    <SectionList
      sections={[
        { title: "Comida", data: foods },
        { title: "Bebida", data: drinks },
      ]}
      renderItem={({ item, section }) => (
        <BuyableItem
          key={`${section.title === "Comida" ? "F" : "D"}${item.id}`}
          item={item}
          quantity={
            section.title === "Comida"
              ? foodToOrder.get(item) || foodToOrderObj[item.id] || 0
              : drinksToOrder.get(item) || drinksToOrderObj[item.id] || 0
          }
          addItemToOrder={
            section.title === "Comida" ? addFoodToOrder : addDrinksToOrder
          }
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
