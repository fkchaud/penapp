import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, Checkbox, PaperProvider} from "react-native-paper";
import {Theme} from "@/constants/Colors";
import {useEffect, useState} from "react";
import {Order, OrderStatus} from "@/types";
import {getOrders, GetOrdersParams} from "@/apis";
import {FlatGrid} from "react-native-super-grid";
import {OrderCard} from "@/components/order_card";
import {Link} from "expo-router";
import {useIsFocused} from "@react-navigation/core";


const ChefOrders = () => {
  const isFocused = useIsFocused();

  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 5000);
    return () => {
      clearInterval(interval);
    };
  }, [isFocused]);

  const [showAllOrders, setShowAllOrders] = useState<boolean>(false)

  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const retrieve = async () => {
      const params: GetOrdersParams = {};
      if (!showAllOrders)
        params.status = 'ACCEPTED';
      const newOrders = await getOrders(params);
      setOrders(newOrders || []);
    };
    retrieve()
      .catch(console.error);
  }, [isFocused, time, showAllOrders])


  if (!orders) {
    return <ActivityIndicator size='large'/>;
  }

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Text>Pedidos</Text>
          <View style={{flexDirection: 'row'}}>
            <Checkbox status={showAllOrders ? 'checked' : 'unchecked'} onPress={() => setShowAllOrders(!showAllOrders)}/>
            <Text>Mostrar todas las ordenes</Text>
          </View>
          <View>
            <FlatGrid
              itemDimension={140}
              data={orders}
              renderItem={({item}) => (
                <Link href={{pathname: '/chef/orders/[id]', params: {id: item.id}}} key={item.id} style={{flexGrow: 1}}>
                  <OrderCard order={item}/>
                </Link>
              )}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default ChefOrders;
