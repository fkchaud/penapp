import {useContext, useEffect, useRef, useState} from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Checkbox from 'expo-checkbox';
import {router} from "expo-router";
import {
  Button,
  Divider,
  IconButton,
  PaperProvider,
} from 'react-native-paper';
import RadioGroup from 'react-native-radio-buttons-group';
import {useIsFocused} from "@react-navigation/core";

import {Item, OrderToPlace, PaymentType, Table} from "@/types";
import {Theme} from "@/constants/Colors";
import {AlertContext, AlertContextType, WaiterContext, WaiterContextType} from "@/app/_layout";
import {useApi} from "@/hooks/useApi";
import "@/css/global.css";


const BuyableItem = ({item, addItemToOrder, className, ...props}: {
  item: Item,
  addItemToOrder: (item: Item, quantity: number) => void,
  className?: string,
}) => {
  const [qty, setQty] = useState(0);

  return (
    <View className={(className ? className + ' ' : '') + 'flex-row items-center px-3 py-1'} {...props}>
      <View className={'flex-1'}>
        <Text>
          {item.name}
        </Text>
        <Text className={'text-neutral-500 text-sm'}>
          ${item.price} | Quedan {item.remaining}
        </Text>
      </View>
      <View>
        <View className={'flex-row items-center'}>
          <IconButton size={10} icon={"minus"} mode={"contained-tonal"} onPress={() => {
            setQty(Math.max(qty - 1, 0));
            addItemToOrder(item, qty - 1);
          }}/>
          <Text>{qty}</Text>
          <IconButton size={10} icon={"plus"} mode={"contained-tonal"} onPress={() => {
            setQty(qty + 1);
            addItemToOrder(item, qty + 1);
          }}/>
        </View>
      </View>
    </View>
  );
}


const InternalTakeOrder = ({reset}: {reset: () => void}) => {
  const {waiter, tableRange} = useContext(WaiterContext) as WaiterContextType;
  const {setAlertMessage, setOnDismiss} = useContext(AlertContext) as AlertContextType;
  const isFocused = useIsFocused();
  const {getDrinks, getFoods, getTables, placeOrder} = useApi();

  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [comment, setComment] = useState('');
  const commentInputRef = useRef<TextInput>(null);

  const [tables, setTables] = useState<Table[]>([]);
  const [enableAllTables, setEnableAllTables] = useState<boolean>(false);
  const [foods, setFoods] = useState<{[id: number]: Item}>({});
  const [drinks, setDrinks] = useState<{[id: number]: Item}>({});

  const buildOrder: () => OrderToPlace = () => {
    if (!paymentMethod){
      console.error('Empty payment method');
      throw Error('Empty payment method');
    }
    return {
      waiter: waiter,
      table: currentTable?.number,
      food: Object.entries(foodToOrder).map(([id, quantity]) => ({id: Number(id), quantity})),
      drinks: Object.entries(drinksToOrder).map(([id, quantity]) => ({id: Number(id), quantity})),
      payment_type: paymentMethod,
      comment: comment,
    }
  }

  const isItemFood = (item: Item) => {
    return Object.values(foods).includes(item);
  }

  useEffect(() => {
    const retrieveTables = async () => {
      let newTables: Table[] = await getTables();
      newTables = newTables.map((table) => ({number: table.number}));
      setTables(newTables);
      if (newTables && newTables.length > 0) {
        if (tableRange.min)
          setCurrentTable(newTables.find((t) => t.number === tableRange.min) || newTables[0]);
        else
          setCurrentTable(newTables[0]);
      }
    };
    retrieveTables().catch(console.error);
  }, [isFocused]);

  useEffect(() => {
    const retrieveFoods = async () => {
      const newFoods = await getFoods();
      setFoods(newFoods.reduce((acc: {[id: number]: Item}, f: Item) => {
        acc[f.id] = f;
        return acc;
      }, {}));
    };
    const retrieveDrinks = async () => {
      const newDrinks = await getDrinks();
      setDrinks(newDrinks.reduce((acc: {[id: number]: Item}, d: Item) => {
        acc[d.id] = d;
        return acc;
      }, {}));
    };
    retrieveFoods().catch(console.error);
    retrieveDrinks().catch(console.error);

  }, [isFocused]);

  const recalculatePrice = (
    foodToOrder: {[id: number]: number},
    drinksToOrder: {[id: number]: number}
  ) => {
    let price = 0;
    for (const id in foodToOrder){
      const food = foods[id];
      price += food.price * foodToOrder[id];
    }
    for (const id in drinksToOrder){
      const drink = drinks[id];
      price += drink.price * drinksToOrder[id];
    }
    setTotalPrice(price);
  };

  const [foodToOrder, setFoodToOrder] = useState<{[id: number]: number}>({})
  const addFoodToOrder = (food: Item, quantity: number) => {
    if (quantity > 0)
      setFoodToOrder({...foodToOrder, [food.id]: quantity});
    else
      setFoodToOrder(prevFoodToOrder => {
        const { [food.id]: _, ...newFoodToOrder } = prevFoodToOrder;
        return newFoodToOrder;
      });
  };
  const [drinksToOrder, setDrinksToOrder] = useState<{[id: number]: number}>({})
  const addDrinkToOrder = (drink: Item, quantity: number) => {
    if (quantity > 0)
      setDrinksToOrder({...drinksToOrder, [drink.id]: quantity});
    else
      setDrinksToOrder(prevDrinkToOrder => {
        const { [drink.id]: _, ...newDrinksToOrder } = prevDrinkToOrder;
        return newDrinksToOrder;
      });
  };
  useEffect(() => {
    recalculatePrice(foodToOrder, drinksToOrder);
  }, [foodToOrder, drinksToOrder]);
  const addItemToOrder = (item: Item, quantity: number) => {
    if (isItemFood(item))
      return addFoodToOrder(item, quantity);
    return addDrinkToOrder(item, quantity);
  }

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | ''>('');

  return (
    <PaperProvider theme={Theme}>
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
        animationType={'fade'}
      >
        <View className={'flex-1 justify-center items-center bg-black/25'}>
          <View className={'align-middle bg-white p-6 shadow w-5/6'}>
            <View className={'align-middle'}>
              <Text className={'font-bold'}>Su pedido:</Text>
              {Object.entries(foodToOrder).map(([fid, q]) => <Text key={fid}>{q}x {foods[Number(fid)]?.name}</Text>)}
              {Object.entries(drinksToOrder).map(([did,q]) => <Text key={did}>{q}x {drinks[Number(did)]?.name}</Text>)}
              <Text><Text className={'font-bold'}>A pagar:</Text> ${totalPrice}</Text>
              <Text> </Text>
              <Text className={'mb-2'}>Seleccione medio de pago:</Text>
              <RadioGroup
                radioButtons={[
                  {
                    id: 'CASH',
                    label: 'Efectivo',
                    value: 'CASH',
                    borderSize: 1.5,
                    borderColor: '#909090',
                    size: 16,
                  },
                  {
                    id: 'TRANSFER',
                    label: 'Transferencia',
                    value: 'TRANSFER',
                    borderSize: 1.5,
                    borderColor: '#909090',
                    size: 16,
                  },
                ]}
                onPress={selectedId => setPaymentMethod(selectedId as PaymentType)}
                selectedId={paymentMethod}
                containerStyle={{alignItems: 'flex-start'}}
              />
              {paymentMethod === 'TRANSFER' && <Text>
                  Alias: seminario.mendoza
              </Text>}
              <Text> </Text>
            </View>
            <View>
              <Button compact={true} mode={"contained"} disabled={!paymentMethod} onPress={() => {
                placeOrder(buildOrder())
                  .then(
                    () => {
                      setOnDismiss(() => router.navigate('/waiter/orders'));
                      setAlertMessage('Comanda enviada');
                    }
                  )
                  .catch((e) => {
                    console.error(e);
                    setOnDismiss(null);
                    setAlertMessage('Error: ' + e)
                  });
              }}>
                Confirmar comanda
              </Button>
              <Button compact={true} mode={"outlined"} onPress={() => setModalVisible(false)}>
                Cancelar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      <View className={'flex-1'} onStartShouldSetResponder={() => {
        commentInputRef.current?.blur();
        return false;
      }}>
        <View className={'p-2 bg-white border-b border-b-neutral-500'}>
          <View className={'flex-row items-center'}>
            <Text className={'flex-1 text-xl font-bold'}>Mesa</Text>
            <Pressable className={'flex-row items-center'} onPress={() => setEnableAllTables(!enableAllTables)}>
              <Checkbox
                value={enableAllTables}
                onValueChange={(value) => setEnableAllTables(value)}
                style={{width: 16, height: 16, borderWidth: 1}}
              />
              <Text className={'ml-1 text-sm text-neutral-700'}>Mostrar todas las mesas</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal={true}
            data={
              (tableRange.min && tableRange.max) && !enableAllTables
                ? tables.filter(t => t.number >= tableRange.min && t.number <= tableRange.max)
                : tables
            }
            renderItem={({item}) => (
              <TouchableOpacity
                className={'m-0.5 w-10 h-10 items-center justify-center rounded ' + ((currentTable?.number == item.number) ? 'bg-yellow-800/80' : 'bg-yellow-800/40')}
                key={item.number}
                onPress={() => {
                  setCurrentTable(item);
                }}
              >
                <Text className={currentTable?.number == item.number ? 'font-bold text-white' : ''}>{item.number}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <SectionList
          sections={[
            {
              title: "Comida",
              data: Object.values(foods),
            },
            {
              title: "Bebida",
              data: Object.values(drinks),
            },
          ]}
          keyExtractor={(item) => `${isItemFood(item) ? 'F' : 'D'}${item.id}`}
          renderItem={
            ({item}) =>
              <BuyableItem key={item.id.toString()} item={item} addItemToOrder={addItemToOrder} />
          }
          renderSectionHeader={
            ({section: {title}}) =>
              <Text className={'text-xl font-bold bg-[#f3f3f3DD] py-2 text-center'}>{title}</Text>
          }
          ItemSeparatorComponent={Divider}
        />

        <View className={'p-3 border-t border-t-neutral-500'}>
          <TextInput
            ref={commentInputRef}
            placeholder={'Agregar comentario'}
            value={comment}
            onChangeText={setComment}
            maxLength={150}
            blurOnSubmit={true}
            returnKeyType={'done'}
            multiline={true}
          />
          <Divider />
          <Text className={'text-lg'}>Total: ${totalPrice}</Text>
          <View className={'flex-row'}>
            <Button mode={"outlined"} onPress={reset} style={{flex: 1}}>Limpiar</Button>
            <Button mode={"contained"} onPress={() => setModalVisible(true)} style={{flex: 2}}>
              Continuar
            </Button>
          </View>
        </View>
      </View>
    </PaperProvider>
  );
}


const TakeOrder = () => {
  const [key, setKey] = useState<string>();

  const reset = () => setKey(Math.random().toString());
  const isFocused = useIsFocused();
  useEffect(() => {
    reset();
  }, [isFocused]);

  return <InternalTakeOrder key={key} reset={reset}/>
}


export default TakeOrder;
