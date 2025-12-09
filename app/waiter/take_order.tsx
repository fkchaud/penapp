import { useContext, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { useIsFocused } from "@react-navigation/core";
import { useQuery, useMutation } from "@tanstack/react-query";

import "@/css/global.css";
import {
  Item,
  ItemById,
  OrderToPlace,
  PaymentType,
  QuantityByItem,
  Table,
} from "@/types";
import { Theme } from "@/constants/Colors";
import {
  AlertContext,
  AlertContextType,
  WaiterContext,
  WaiterContextType,
} from "@/app/_layout";
import { useApi } from "@/hooks/useApi";
import { FoodPicker } from "@/components/OrderTaking/FoodPicker";
import { TableTopBar } from "@/components/OrderTaking/TableTopBar";
import { ConfirmBottomBar } from "@/components/OrderTaking/ConfirmBottomBar";
import { ConfirmOrderModal } from "@/components/OrderTaking/ConfirmOrderModal";
import { useIdemKey } from "@/hooks/useIdemKey";

const InternalTakeOrder = ({ reset }: { reset: () => void }) => {
  const { waiter } = useContext(WaiterContext) as WaiterContextType;
  const { setAlertMessage, setOnDismiss } = useContext(
    AlertContext,
  ) as AlertContextType;
  const isFocused = useIsFocused();
  const { getDrinks, getFoods, placeOrder } = useApi();

  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [comment, setComment] = useState("");
  const commentInputRef = useRef<TextInput>(null);

  const { idemKey, regenerateKey } = useIdemKey();

  useEffect(() => {
    regenerateKey();
  }, [isFocused, currentTable, totalPrice, comment]);

  // Use React Query for fetching foods
  const { data: foodsData } = useQuery({
    queryKey: ["foods"],
    queryFn: getFoods,
    enabled: isFocused,
  });

  // Use React Query for fetching drinks
  const { data: drinksData } = useQuery({
    queryKey: ["drinks"],
    queryFn: getDrinks,
    enabled: isFocused,
  });

  // Transform foods and drinks data to ItemById format
  const foods: ItemById = foodsData
    ? foodsData.reduce((acc: ItemById, f: Item) => {
        acc[f.id] = f;
        return acc;
      }, {})
    : {};

  const drinks: ItemById = drinksData
    ? drinksData.reduce((acc: ItemById, d: Item) => {
        acc[d.id] = d;
        return acc;
      }, {})
    : {};

  // Use React Query mutation for placing orders
  const placeOrderMutation = useMutation({
    mutationFn: (order: OrderToPlace) =>
      placeOrder(order, { "Idempotency-Key": idemKey.current || "" }),
    onSuccess: () => {
      setOnDismiss(() => router.navigate("/waiter/orders"));
      setAlertMessage("Comanda enviada");
      regenerateKey();
      reset();
    },
    onError: (error: unknown) => {
      console.error(error);
      setOnDismiss(null);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setAlertMessage("Error: " + errorMessage);
    },
  });

  const buildOrder: () => OrderToPlace = () => {
    if (!paymentMethod) {
      console.error("Empty payment method");
      throw Error("Empty payment method");
    }
    return {
      waiter: waiter.name,
      table: currentTable?.number,
      food: [...foodToOrder.entries()].map(([food, quantity]) => ({
        id: food.id,
        quantity,
      })),
      drinks: [...drinksToOrder.entries()].map(([drink, quantity]) => ({
        id: drink.id,
        quantity,
      })),
      payment_type: paymentMethod,
      comment: comment,
    };
  };

  const recalculatePrice = (
    foodToOrder: QuantityByItem,
    drinksToOrder: QuantityByItem,
  ) => {
    let price = 0;
    foodToOrder.forEach((qty, food) => {
      price += food.price * qty;
    });
    drinksToOrder.forEach((qty, drink) => {
      price += drink.price * qty;
    });
    setTotalPrice(price);
  };

  const [foodToOrder, setFoodToOrder] = useState<QuantityByItem>(new Map());
  const addFoodToOrder = (food: Item, quantity: number) => {
    if (quantity > 0) setFoodToOrder(new Map(foodToOrder).set(food, quantity));
    else
      setFoodToOrder((prevFoodToOrder) => {
        const newFoodToOrder = new Map(prevFoodToOrder);
        newFoodToOrder.delete(food);
        return newFoodToOrder;
      });
  };
  const [drinksToOrder, setDrinksToOrder] = useState<QuantityByItem>(new Map());
  const addDrinkToOrder = (drink: Item, quantity: number) => {
    if (quantity > 0)
      setDrinksToOrder(new Map(drinksToOrder).set(drink, quantity));
    else
      setDrinksToOrder((prevDrinksToOrder) => {
        const newDrinksToOrder = new Map(prevDrinksToOrder);
        newDrinksToOrder.delete(drink);
        return newDrinksToOrder;
      });
  };
  // Recalculate price every time foodToOrder and drinksToOrder are updated
  useEffect(() => {
    recalculatePrice(foodToOrder, drinksToOrder);
  }, [foodToOrder, drinksToOrder]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | "">("");

  return (
    <PaperProvider theme={Theme}>
      <ConfirmOrderModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        foodToOrder={foodToOrder}
        drinksToOrder={drinksToOrder}
        totalPrice={totalPrice}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onConfirm={() => placeOrderMutation.mutate(buildOrder())}
        isLoading={placeOrderMutation.isPending}
      />
      <View
        className={"flex-1"}
        onStartShouldSetResponder={() => {
          commentInputRef.current?.blur();
          return false;
        }}
      >
        <TableTopBar
          currentTable={currentTable}
          setCurrentTable={setCurrentTable}
        />
        <FoodPicker
          foods={Object.values(foods)}
          drinks={Object.values(drinks)}
          foodToOrder={foodToOrder}
          drinksToOrder={drinksToOrder}
          addFoodToOrder={addFoodToOrder}
          addDrinksToOrder={addDrinkToOrder}
        />
        <ConfirmBottomBar
          commentInputRef={commentInputRef}
          comment={comment}
          setComment={setComment}
          totalPrice={totalPrice}
          cancelText={"Limpiar"}
          onCancel={reset}
          onContinue={() => setModalVisible(true)}
        />
      </View>
    </PaperProvider>
  );
};

const TakeOrder = () => {
  const [key, setKey] = useState<string>();

  const reset = () => setKey(Math.random().toString());
  const isFocused = useIsFocused();
  useEffect(() => {
    reset();
  }, [isFocused]);

  return <InternalTakeOrder key={key} reset={reset} />;
};

export default TakeOrder;
