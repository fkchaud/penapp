import React from 'react';
import {FlatList, ScrollView, TouchableOpacity, View} from "react-native";
import {
  Button,
  DataTable,
  Icon,
  IconButton,
  Modal,
  PaperProvider,
  Portal,
} from 'react-native-paper';
import {useContext, useEffect, useState} from "react";
import { RadioButton, Text } from 'react-native-paper';

import {Item, OrderToPlace, Table} from "@/types";
import {Theme} from "@/constants/Colors";
import {AlertContext, AlertContextType, WaiterContext, WaiterContextType} from "@/app/_layout";
import {useIsFocused} from "@react-navigation/core";
import {router} from "expo-router";
import {useApi} from "@/hooks/useApi";


const BuyableItem = ({item, addItemToOrder}: {
  item: Item,
  addItemToOrder: (item: Item, quantity: number) => void,
}) => {
  const [qty, setQty] = useState(0);

  return (
    <>
      <DataTable.Cell>
        {/* <Icon size={20} source={item.icon || "blank"}/>*/}
        {item.name}
        {"\n"}
        Quedan {item.remaining}
      </DataTable.Cell>
      <DataTable.Cell numeric style={{maxWidth: 50}}>${item.price}</DataTable.Cell>
      <DataTable.Cell style={{maxWidth: 90}}>
        <View style={{flexDirection: "row", alignItems: "center"}}>
          <IconButton size={10} icon={"minus"} mode={"contained-tonal"} onPress={() => {
            setQty(qty - 1);
            addItemToOrder(item, qty - 1);
          }}/>
          <Text>{qty}</Text>
          <IconButton size={10} icon={"plus"} mode={"contained-tonal"} onPress={() => {
            setQty(qty + 1);
            addItemToOrder(item, qty + 1);
          }}/>
        </View>
      </DataTable.Cell>
    </>
  );
}


const TakeOrder = () => {
  const def_food: Item[] = [
    {id: 1, name: "Carne a la Olla", price: 1100, icon: "pot-mix", remaining: 10},
    {id: 2, name: "Pollo al disco", price: 1000, icon: "bowl-mix", remaining: 10},
    {id: 3, name: "Hamburguesa", price: 900, icon: "hamburger", remaining: 10},
    {id: 4, name: "Choripán", price: 700, icon: "sausage", remaining: 10},
    {id: 5, name: "Sándwich de Pernil (x2 u)", price: 600, icon: "baguette", remaining: 10},
    {id: 6, name: "Sándwich de Bondiola", price: 900, icon: "baguette", remaining: 10},
    {id: 7, name: "Papas Fritas", price: 400, icon: "french-fries", remaining: 10},
    {id: 8, name: "Empanadas (docena)", price: 900, icon: "food-croissant", remaining: 10},
    {id: 9, name: "Empanadas (media docena)", price: 500, icon: "food-croissant", remaining: 10},
    {id: 10, name: "Pastelitos (docena)", price: 900, icon: "food-croissant", remaining: 10},
    {id: 11, name: "Pastelitos (media docena)", price: 500, icon: "food-croissant", remaining: 10},
  ];

  const def_drinks: Item[] = [
    {id: 1, name: "Agua (500ml)", price: 200, icon: "bottle-soda", remaining: 10},
    {id: 2, name: "Saborizada (1l)", price: 300, icon: "bottle-soda", remaining: 10},
    {id: 3, name: "Cerbeza rubia (1l)", price: 500, icon: "glass-mug-variant", remaining: 10},
    {id: 4, name: "Cerbeza roja (1l)", price: 500, icon: "glass-mug-variant", remaining: 10},
    {id: 5, name: "Cerbeza negra (1l)", price: 500, icon: "glass-mug-variant", remaining: 10},
    {id: 6, name: "Cerbeza rubia (lata)", price: 300, icon: "glass-mug-variant", remaining: 10},
    {id: 7, name: "Cerbeza roja (lata)", price: 300, icon: "glass-mug-variant", remaining: 10},
    {id: 8, name: "Cerbeza negra (lata)", price: 300, icon: "glass-mug-variant", remaining: 10},
    {id: 9, name: "Vino (1l)", price: 400, icon: "bottle-wine", remaining: 10},
    {id: 10, name: "Soda", price: 200, icon: "bottle-soda", remaining: 10},
    {id: 11, name: "Coca (1l)", price: 400, icon: "bottle-soda-classic", remaining: 10},
    {id: 12, name: "Sprite (1l)", price: 400, icon: "bottle-soda-classic", remaining: 10},
    {id: 13, name: "Fanta (1l)", price: 400, icon: "bottle-soda-classic", remaining: 10},
    {id: 14, name: "Paso (1l)", price: 400, icon: "bottle-soda-classic", remaining: 10},
  ];

  const {waiter} = useContext(WaiterContext) as WaiterContextType;
  const {setAlertMessage, setOnDismiss} = useContext(AlertContext) as AlertContextType;
  const isFocused = useIsFocused();
  const {getDrinks, getFoods, getTables, placeOrder} = useApi();

  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  const [tables, setTables] = useState<Table[]>([]);
  const [foods, setFoods] = useState<{[id: number]: Item}>({});
  const [drinks, setDrinks] = useState<{[id: number]: Item}>({});

  const buildOrder: () => OrderToPlace = () => {
    return {
      waiter: waiter,
      table: currentTable?.number,
      food: Object.entries(foodToOrder).map(([id, quantity]) => ({id: Number(id), quantity})),
      drinks: Object.entries(drinksToOrder).map(([id, quantity]) => ({id: Number(id), quantity})),
    }
  }

  useEffect(() => {
    const retrieveTables = async () => {
      let newTables = await getTables();
      newTables = newTables.map((table: Table) => ({number: table.number}));
      setTables(newTables);
      if (newTables && newTables.length > 0)
        setCurrentTable(newTables[0]);
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

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  return (
    <PaperProvider theme={Theme}>
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            width: '90%',
            height: 300,
            alignSelf: 'center',
            padding: 16,
          }}
        >
          <Text>Seleccione medio de pago:</Text>
          <RadioButton.Group
            onValueChange={(newValue) => setPaymentMethod(newValue)}
            value={paymentMethod}
          >
            <RadioButton.Item value={'CASH'} label={'Efectivo'}/>
            <RadioButton.Item value={'TRANSFER'} label={'Transferencia'}/>
            <RadioButton.Item value={'MERCADOPAGO'} label={'Mercado Pago'}/>
          </RadioButton.Group>
          <Button mode={"contained"} onPress={() => {
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
          <Button mode={"outlined"} onPress={() => setModalVisible(false)}>
            Cancelar
          </Button>
        </Modal>
      </Portal>
      <View style={{flex: 1}}>
        <View style={{
          padding: 8,
          height: 76,
          backgroundColor: 'white',
          borderBottomColor: 'black',
          borderBottomWidth: 1,
          // alignItems: 'center',  // alineación horizontal
        }}>
          <Text>Mesa</Text>
          <FlatList
            horizontal={true}
            data={tables}
            renderItem={({item}) => (
              <TouchableOpacity
                style={{
                  backgroundColor: (currentTable?.number == item.number) ? "red" : "grey",
                  margin: 1,
                  width: 40,
                  height: 40,
                  alignItems: "center",
                }}
                key={item.number}
                onPress={() => {
                  setCurrentTable(item);
                }}
              >
                <Icon source={"table-picnic"} size={20}/>
                <Text>{item.number}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          style={{
            flex: 1,
            padding: 8,
          }}
        >
          <Text>Comida</Text>
          <DataTable>
            {Object.values(foods).map((item) => (<DataTable.Row key={item.name}><BuyableItem item={item} addItemToOrder={addFoodToOrder} /></DataTable.Row>))}
          </DataTable>
          <Text>Bebida</Text>
          <DataTable>
            {Object.values(drinks).map((item) => (<DataTable.Row key={item.name}><BuyableItem item={item} addItemToOrder={addDrinkToOrder} /></DataTable.Row>))}
          </DataTable>
        </ScrollView>

        <View style={{
          height: 76,
          padding: 8,
          borderTopWidth: 1,
        }}>
          <Text>Total: ${totalPrice}</Text>
          <Button mode={"contained"} onPress={() => {
            setModalVisible(true)
          }}>
            Continuar
          </Button>
        </View>
      </View>
    </PaperProvider>
  );
}

export default TakeOrder;
