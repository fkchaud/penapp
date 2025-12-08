import { router, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Item,
  ItemById,
  Order,
  OrderToPlace,
  PaymentType,
  QuantityByItem,
  Table,
} from "@/types";
import { ActivityIndicator, Button, PaperProvider } from "react-native-paper";
import { Theme } from "@/constants/Colors";
import { Modal, Text, TextInput, View } from "react-native";
import { FoodPicker } from "@/components/OrderTaking/FoodPicker";
import { TableTopBar } from "@/components/OrderTaking/TableTopBar";
import {
  AlertContext,
  AlertContextType,
  WaiterContext,
  WaiterContextType,
} from "@/app/_layout";
import { ConfirmBottomBar } from "@/components/OrderTaking/ConfirmBottomBar";
import { ConfirmOrderModal } from "@/components/OrderTaking/ConfirmOrderModal";

const InternalEditOrder = () => {
  const { waiter } = useContext(WaiterContext) as WaiterContextType;
  const { setAlertMessage, setOnDismiss } = useContext(
    AlertContext,
  ) as AlertContextType;
  const { id }: { id: string } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const { getDrinks, getFoods, getOrder, updateOrder, updateOrderStatus } =
    useApi();

  const commentInputRef = useRef<TextInput>(null);
  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | "">("");

  const [foods, setFoods] = useState<ItemById>({});
  const [drinks, setDrinks] = useState<ItemById>({});

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

  // Get foods and drinks every time the screen is focused
  useEffect(() => {
    const processStuff = async () => {
      const retrieveFoods = async () => {
        const newFoods = await getFoods();
        const foodsToSet = newFoods.reduce((acc: ItemById, f: Item) => {
          acc[f.id] = f;
          return acc;
        }, {});
        setFoods(foodsToSet);
        return foodsToSet;
      };
      const retrieveDrinks = async () => {
        const newDrinks = await getDrinks();
        const drinksToSet = newDrinks.reduce((acc: ItemById, d: Item) => {
          acc[d.id] = d;
          return acc;
        }, {});
        setDrinks(drinksToSet);
        return drinksToSet;
      };
      const retrieveOrder = async () => {
        return await getOrder(id);
      };

      const promiseFood = retrieveFoods().catch(console.error);
      const promiseDrinks = retrieveDrinks().catch(console.error);
      const promiseOrder = retrieveOrder().catch(console.error);

      await Promise.all([promiseFood, promiseDrinks]).then(
        ([newFoods, newDrinks]) => {
          promiseOrder.then((ord) => {
            if (!ord) return;
            setOrder(ord);
            const newFoodToOrder = new Map(
              ord.foods.map((ordFood) => {
                if (newFoods)
                  return [newFoods[ordFood.food.id], ordFood.quantity];
                else return [ordFood.food, ordFood.quantity];
              }),
            );
            setFoodToOrder(newFoodToOrder);
            const newDrinksToOrder = new Map(
              ord.drinks.map((ordDrink) => {
                if (newDrinks)
                  return [newDrinks[ordDrink.drink.id], ordDrink.quantity];
                else return [ordDrink.drink, ordDrink.quantity];
              }),
            );
            setDrinksToOrder(newDrinksToOrder);
            console.log(newFoodToOrder, newDrinksToOrder);
            setComment(ord.comment);
            setCurrentTable(ord.table);
            setPaymentMethod(ord.payment_type);
          });
        },
      );
    };
    processStuff();
  }, [isFocused]);

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

  if (!order) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <PaperProvider theme={Theme}>
      <ConfirmOrderModal
        modalVisible={confirmModalVisible}
        setModalVisible={setConfirmModalVisible}
        foodToOrder={foodToOrder}
        drinksToOrder={drinksToOrder}
        totalPrice={totalPrice}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onConfirm={() => {
          updateOrder(order.id, buildOrder())
            .then(() => {
              setOnDismiss(() => router.navigate(`/waiter/orders`));
              setAlertMessage("Comanda enviada");
            })
            .catch((e) => {
              console.error(e);
              setOnDismiss(null);
              setAlertMessage("Error: " + e);
            });
        }}
        isLoading={false}
      />
      <Modal
        visible={cancelModalVisible}
        onDismiss={() => setCancelModalVisible(false)}
        onRequestClose={() => setCancelModalVisible(false)}
        transparent={true}
        animationType={"fade"}
      >
        <View className={"flex-1 justify-center items-center bg-black/25"}>
          <View className={"align-middle bg-white p-6 shadow w-5/6"}>
            <View className={"align-middle"}>
              <Text>
                ¿Desea anular el pedido? Esta acción no se puede deshacer.
              </Text>
              <Text> </Text>
            </View>
            <View>
              <Button
                compact={true}
                mode={"contained"}
                onPress={() =>
                  updateOrderStatus({
                    orderId: order.id,
                    orderStatus: "CANCELED",
                  })
                    .then(() => {
                      setOnDismiss(() => router.navigate("/waiter/orders"));
                      setAlertMessage("Comanda anulada");
                    })
                    .catch((e) => {
                      console.error(e);
                      setOnDismiss(null);
                      setAlertMessage("Error: " + e);
                    })
                }
              >
                Anular pedido
              </Button>
              <Button
                compact={true}
                mode={"outlined"}
                onPress={() => setCancelModalVisible(false)}
              >
                No anular
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
          cancelText={"Anular"}
          onCancel={() => setCancelModalVisible(true)}
          onContinue={() => setConfirmModalVisible(true)}
        />
      </View>
    </PaperProvider>
  );
};

const EditOrder = () => {
  const [key, setKey] = useState<string>();

  const reset = () => setKey(Math.random().toString());
  const isFocused = useIsFocused();
  useEffect(() => {
    reset();
  }, [isFocused]);

  return <InternalEditOrder key={key} />;
};

export default EditOrder;
