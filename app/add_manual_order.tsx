import { useContext, useEffect, useRef, useState } from "react";
import {
  AlertContext,
  AlertContextType,
  UserTypeContext,
  UserTypeContextType,
} from "@/app/_layout";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";
import {
  Item,
  ItemById,
  OrderToPlace,
  PaymentType,
  QuantityByItem,
  Table,
  UserType,
} from "@/types";
import { TextInput, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Theme } from "@/constants/Colors";
import { ConfirmOrderModal } from "@/components/OrderTaking/ConfirmOrderModal";
import { Href, router } from "expo-router";
import { TableTopBar } from "@/components/OrderTaking/TableTopBar";
import { FoodPicker } from "@/components/OrderTaking/FoodPicker";
import { ConfirmBottomBar } from "@/components/OrderTaking/ConfirmBottomBar";

const InternalAddManualOrder = ({ reset }: { reset: () => void }) => {
  const { setAlertMessage, setOnDismiss } = useContext(
    AlertContext,
  ) as AlertContextType;
  const { userType } = useContext(UserTypeContext) as UserTypeContextType;
  const isFocused = useIsFocused();
  const { serviceUrl, getDrinks, getFoods, placeOrder } = useApi();

  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [comment, setComment] = useState("");
  const commentInputRef = useRef<TextInput>(null);

  const [foods, setFoods] = useState<ItemById>({});
  const [drinks, setDrinks] = useState<ItemById>({});

  const buildOrder: () => OrderToPlace = () => {
    if (!paymentMethod) {
      console.error("Empty payment method");
      throw Error("Selecciona un método de pago");
    }

    const otp: OrderToPlace = {
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
    if (currentTable) otp.table = currentTable.number;
    return otp;
  };

  // Get foods and drinks every time the screen is focused
  useEffect(() => {
    if (!isFocused) return;

    const retrieveFoods = async () => {
      const newFoods = await getFoods();
      setFoods(
        newFoods.reduce((acc: ItemById, f: Item) => {
          acc[f.id] = f;
          return acc;
        }, {}),
      );
    };
    const retrieveDrinks = async () => {
      const newDrinks = await getDrinks();
      setDrinks(
        newDrinks.reduce((acc: ItemById, d: Item) => {
          acc[d.id] = d;
          return acc;
        }, {}),
      );
    };
    retrieveFoods().catch(console.error);
    retrieveDrinks().catch(console.error);
  }, [isFocused, serviceUrl]);

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
        onConfirm={() => {
          let target: Href<string>;
          if (userType == UserType.Chef) target = "/chef/orders";
          else if (userType == UserType.Cashier) target = "/cashier/orders";
          else target = "/";

          placeOrder(buildOrder())
            .then(() => {
              setOnDismiss(() => router.navigate(target));
              setAlertMessage("Comanda agregada");
            })
            .catch((e) => {
              console.error(e);
              setOnDismiss(null);
              setAlertMessage("Error: " + e);
            });
        }}
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
          autoCurrentTable={false}
          forceAllTables={true}
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

const AddManualOrder = () => {
  const [key, setKey] = useState<string>();

  const reset = () => setKey(Math.random().toString());
  const isFocused = useIsFocused();
  useEffect(() => {
    reset();
  }, [isFocused]);

  return <InternalAddManualOrder key={key} reset={reset} />;
};

export default AddManualOrder;
