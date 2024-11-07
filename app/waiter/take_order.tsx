import {Alert, FlatList, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {
  Button,
  DataTable,
  Icon,
  IconButton,
  PaperProvider,
  TextInput
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useContext, useEffect, useState} from "react";

import {getFoods, getTables, placeOrder} from '@/apis';
import {Item, OrderToPlace, Table} from "@/types";
import {Theme} from "@/constants/Colors";
import {WaiterContext, WaiterContextType} from "@/app/_layout";


const BuyableItem = ({item, addItemToOrder}: {
  item: Item,
  addItemToOrder: (item: Item, quantity: number) => void,
}) => {
  const [qty, setQty] = useState(0);

  return (
    <>
      <DataTable.Cell style={{overflow: "scroll"}}>
        <Icon size={20} source={item.icon || "blank"}/>
        {item.name}
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
      <DataTable.Cell numeric style={{maxWidth: 50}}>${item.price * qty}</DataTable.Cell>
    </>
  );
}


const TakeOrder = () => {
  const food: Item[] = [
    {id: 1, name: "Carne a la Olla", price: 1100, icon: "pot-mix"},
    {id: 2, name: "Pollo al disco", price: 1000, icon: "bowl-mix"},
    {id: 3, name: "Hamburguesa", price: 900, icon: "hamburger"},
    {id: 4, name: "Choripán", price: 700, icon: "sausage"},
    {id: 5, name: "Sándwich de Pernil (x2 u)", price: 600, icon: "baguette"},
    {id: 6, name: "Sándwich de Bondiola", price: 900, icon: "baguette"},
    {id: 7, name: "Papas Fritas", price: 400, icon: "french-fries"},
    {id: 8, name: "Empanadas (docena)", price: 900, icon: "food-croissant"},
    {id: 9, name: "Empanadas (media docena)", price: 500, icon: "food-croissant"},
    {id: 10, name: "Pastelitos (docena)", price: 900, icon: "food-croissant"},
    {id: 11, name: "Pastelitos (media docena)", price: 500, icon: "food-croissant"},
  ];

  const drinks: Item[] = [
    {id: 1, name: "Agua (500ml)", price: 200, icon: "bottle-soda"},
    {id: 2, name: "Saborizada (1l)", price: 300, icon: "bottle-soda"},
    {id: 3, name: "Cerbeza rubia (1l)", price: 500, icon: "glass-mug-variant"},
    {id: 4, name: "Cerbeza roja (1l)", price: 500, icon: "glass-mug-variant"},
    {id: 5, name: "Cerbeza negra (1l)", price: 500, icon: "glass-mug-variant"},
    {id: 6, name: "Cerbeza rubia (lata)", price: 300, icon: "glass-mug-variant"},
    {id: 7, name: "Cerbeza roja (lata)", price: 300, icon: "glass-mug-variant"},
    {id: 8, name: "Cerbeza negra (lata)", price: 300, icon: "glass-mug-variant"},
    {id: 9, name: "Vino (1l)", price: 400, icon: "bottle-wine"},
    {id: 10, name: "Soda", price: 200, icon: "bottle-soda"},
    {id: 11, name: "Coca (1l)", price: 400, icon: "bottle-soda-classic"},
    {id: 12, name: "Sprite (1l)", price: 400, icon: "bottle-soda-classic"},
    {id: 13, name: "Fanta (1l)", price: 400, icon: "bottle-soda-classic"},
    {id: 14, name: "Paso (1l)", price: 400, icon: "bottle-soda-classic"},
  ];

  const {waiter} = useContext(WaiterContext) as WaiterContextType;

  const [currentTable, setCurrentTable] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const [tables, setTables] = useState<Table[]>([]);
  const [foods, setFoods] = useState<{[id: number]: Item}>({});

  const buildOrder: () => OrderToPlace = () => {
    return {
      waiter: waiter,
      table: currentTable,
      food: Object.entries(foodToOrder).map(([id, quantity]) => ({id: Number(id), quantity})),
      drinks: Object.entries(drinksToOrder).map(([id, quantity]) => ({id: Number(id), quantity})),
    }
  }

  useEffect(() => {
    const retrieveTables = async () => {
      const newTables = await getTables();
      setTables(newTables);
      if (newTables && newTables.length > 0)
        setCurrentTable(newTables[0]);
    };
    retrieveTables().catch(console.error);
  }, []);

  useEffect(() => {
    const retrieveFoods = async () => {
      const newFoods = await getFoods();
      setFoods(newFoods.reduce((acc: {[id: number]: Item}, f: Item) => {
        acc[f.id] = f;
        return acc;
      }, {}));
    };
    retrieveFoods().catch(console.error);
  }, []);

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

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <View>
            <TextInput
              editable={false}
              label="Mozo"
              mode="outlined"
              value={waiter}
            />
          </View>
          <View>
            <Text>Mesa</Text>
            <FlatList
              horizontal={true}
              data={tables}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: (currentTable == item.number) ? "red" : "grey",
                    margin: 1,
                    width: 40,
                    height: 40,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setCurrentTable(item.number);
                  }}
                >
                  <Icon source={"table-picnic"} size={20}/>
                  <Text>{item.number}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <Text>Comida</Text>
          <ScrollView style={{height: 200}}>
            <DataTable>
              {Object.values(foods)?.map((item) => (<DataTable.Row key={item.name}><BuyableItem item={item} addItemToOrder={addFoodToOrder} /></DataTable.Row>))}
            </DataTable>
          </ScrollView>

          <Text>Bebida</Text>
          <ScrollView style={{height: 200}}>
            <DataTable>
              {drinks?.map((item) => (<DataTable.Row key={item.name}><BuyableItem item={item} addItemToOrder={addDrinkToOrder} /></DataTable.Row>))}
            </DataTable>
          </ScrollView>

          <View style={{flexDirection: "row"}}>
            <Text>Total:</Text>
            <Text>${totalPrice}</Text>
          </View>
          <Button mode={"contained"} onPress={() => {
            placeOrder(buildOrder()).then(
              () => Alert.alert("Comanda enviada", "Se envió tu comanda c:")
            ).catch(console.error);
          }}>
            Confirmar comanda
          </Button>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default TakeOrder;
