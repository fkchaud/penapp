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
import { useMutation, useQuery } from "@tanstack/react-query";

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

  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | "">("");

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

  // Use React Query for fetching order
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: isFocused && !!id,
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

  // Use React Query mutation for updating orders
  const updateOrderMutation = useMutation({
    mutationFn: (orderData: OrderToPlace) => updateOrder(id, orderData),
    onSuccess: () => {
      setOnDismiss(() => router.navigate(`/waiter/orders`));
      setAlertMessage("Comanda enviada");
    },
    onError: (error: unknown) => {
      console.error(error);
      setOnDismiss(null);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setAlertMessage("Error: " + errorMessage);
    },
  });

  // Use React Query mutation for canceling orders
  const cancelOrderMutation = useMutation({
    mutationFn: () =>
      updateOrderStatus({
        orderId: id,
        orderStatus: "CANCELED",
      }),
    onSuccess: () => {
      setOnDismiss(() => router.navigate("/waiter/orders"));
      setAlertMessage("Comanda anulada");
    },
    onError: (error: unknown) => {
      console.error(error);
      setOnDismiss(null);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setAlertMessage("Error: " + errorMessage);
    },
  });

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

  // Process order data when order, foods, and drinks are all loaded
  useEffect(() => {
    if (!order || !foodsData || !drinksData) return;

    const newFoodToOrder = new Map(
      order.foods.map((ordFood) => {
        if (foods[ordFood.food.id])
          return [foods[ordFood.food.id], ordFood.quantity];
        else return [ordFood.food, ordFood.quantity];
      }),
    );
    setFoodToOrder(newFoodToOrder);

    const newDrinksToOrder = new Map(
      order.drinks.map((ordDrink) => {
        if (drinks[ordDrink.drink.id])
          return [drinks[ordDrink.drink.id], ordDrink.quantity];
        else return [ordDrink.drink, ordDrink.quantity];
      }),
    );
    setDrinksToOrder(newDrinksToOrder);

    setComment(order.comment);
    setCurrentTable(order.table);
    setPaymentMethod(order.payment_type);
  }, [order, foodsData, drinksData]);

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

  if (isLoadingOrder || !order) {
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
        onConfirm={() => updateOrderMutation.mutate(buildOrder())}
        isLoading={updateOrderMutation.isPending}
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
                onPress={() => cancelOrderMutation.mutate()}
                loading={cancelOrderMutation.isPending}
                disabled={cancelOrderMutation.isPending}
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
