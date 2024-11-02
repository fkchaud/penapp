import {Alert, FlatList, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {
  Button,
  DataTable,
  Icon,
  IconButton,
  MD3LightTheme as DefaultTheme,
  PaperProvider,
  TextInput
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEffect, useState} from "react";

import {getFoods, getTables, placeOrder} from '@/apis';
import {Item, Order, Table} from "@/types";


const theme = {
  ...DefaultTheme,
  dark: true,
}

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

/*

    <View style={{flexDirection: "row", height: 40, alignItems: "center"}}>
      <View style={{flexDirection: "row", flexGrow: 1, alignItems: "center"}}>
        <Icon size={20} source={item.icon || "blank"}/>
        <Text style={{backgroundColor: "red"}}>{item.itemName}</Text>
      </View>
      <View style={{flexDirection: "row", flexShrink: 1, alignItems: "center", min}}>
        <Text>{" "}|{" "}</Text>
        <Text>${item.price}</Text>
        <Text>{" "}|{" "}</Text>
        <View style={{flexDirection: "row", alignItems: "center"}}>
          <IconButton size={10} icon={"minus"} mode={"contained-tonal"} onPress={() => setQty(qty-1)}/>
          <Text>{qty}</Text>
          <IconButton size={10} icon={"plus"} mode={"contained-tonal"} onPress={() => setQty(qty+1)}/>
        </View>
        <Text>{" "}|{" "}</Text>
        <Text>${item.price * qty}</Text>
      </View>
    </View>


 */


const Index = () => {
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

  const [currentTable, setCurrentTable] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const [tables, setTables] = useState<Table[]>([]);
  const [foods, setFoods] = useState<Item[]>([]);

  const [order, setOrder] = useState<Order>({});

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
      setFoods(newFoods);
    };
    retrieveFoods().catch(console.error);
  }, []);

  const recalculatePrice = (newOrder: Order) => {
    let price = 0;
    console.log("recalculatePrice", newOrder)
    price += newOrder.food?.reduce(
      (partialSum, f) => partialSum + (f.quantity * (foods.find(fo => fo.id === f.id)?.price || 0)),
      0) || 0;
    price += newOrder.drinks?.reduce(
      (partialSum, d) => partialSum + (d.quantity * (drinks.find(dr => dr.id === d.id)?.price || 0)),
      0) || 0;
    setTotalPrice(price);
  };

  const addFoodToOrder = (food: Item, quantity: number) => {
    console.log("addFoodToOrder", food, quantity, order.food)
    if (order.food == null) {
      console.log("order.food == null", order)
      if (quantity <= 0) return;
      let newOrder = {...order, food: [{id: food.id, quantity: quantity}]};
      console.log(newOrder);
      setOrder(newOrder)
      recalculatePrice(newOrder);
      return;
    }

    const foodIndex = order.food.findIndex(f => f.id === food.id);
    console.log("foodIndex", foodIndex)
    if (foodIndex == -1) {
      if (quantity > 0) {
        const newOrder = {...order, food: [...order.food, {id: food.id, quantity: quantity}]};
        setOrder(newOrder);
        recalculatePrice(newOrder);
      }
    } else {
      if (quantity > 0) {
        const newOrder = {
          ...order, food: order.food.map(
            f =>
              f.id === food.id ? {id: food.id, quantity: quantity} : f
          )
        };
        setOrder(newOrder);
        recalculatePrice(newOrder);
      }
      else {
        const newOrder = {...order, food: order.food.filter(f => f.id !== food.id)};
        console.log("qty <= 0", quantity, "new order", newOrder);
        setOrder(newOrder);
        recalculatePrice(newOrder);
      }
    }
  };
  const addDrinkToOrder = (drink: Item, quantity: number) => {
    if (order.drinks == null) {
      if (quantity <= 0) return;
      const newOrder = {...order, drinks: [{id: drink.id, quantity: quantity}]};
      setOrder(newOrder)
      recalculatePrice(newOrder);
      return;
    }

    const drinkIndex = order.drinks.findIndex(d => d.id === drink.id);
    if (drinkIndex > -1) {
      if (quantity > 0) {
        const newOrder = {...order, drinks: [...order.drinks, {id: drink.id, quantity: quantity}]};
        setOrder(newOrder);
        recalculatePrice(newOrder);
      }
    } else {
      if (quantity > 0) {
        const newOrder = {
          ...order, drinks: order.drinks.map(
            d =>
              d.id === drink.id ? {id: drink.id, quantity: quantity} : d
          )
        };
        setOrder(newOrder);
        recalculatePrice(newOrder);
      } else {
        const newOrder = {...order, drinks: order.drinks.filter(d => d.id === drink.id)};
        setOrder(newOrder);
        recalculatePrice(newOrder);
      }
    }
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView>
        <ScrollView>
          <View>
            <TextInput label="Mozo" mode="outlined" onChangeText={(text) => setOrder({...order, waiter: text})} />
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
                    setOrder({...order, table: item.number})
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
              {foods.map((item) => (<DataTable.Row key={item.name}><BuyableItem item={item} addItemToOrder={addFoodToOrder} /></DataTable.Row>))}
            </DataTable>
          </ScrollView>

          <Text>Bebida</Text>
          <ScrollView style={{height: 200}}>
            <DataTable>
              {drinks.map((item) => (<DataTable.Row key={item.name}><BuyableItem item={item} addItemToOrder={addDrinkToOrder} /></DataTable.Row>))}
            </DataTable>
          </ScrollView>

          <View style={{flexDirection: "row"}}>
            <Text>Total:</Text>
            <Text>${totalPrice}</Text>
          </View>
          <Button mode={"contained"} onPress={() => {
            placeOrder(order).then(
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

export default Index;
