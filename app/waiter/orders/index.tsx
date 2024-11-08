import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, PaperProvider} from "react-native-paper";
import {useContext, useEffect, useState} from "react";
import {FlatGrid} from "react-native-super-grid";

import {Theme} from "@/constants/Colors";
import {Order} from "@/types";
import {getOrders} from "@/apis";
import {OrderCard} from "@/components/order_card";
import {WaiterContext, WaiterContextType} from "@/app/_layout";
import {useIsFocused} from "@react-navigation/core";


const Orders = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const isFocused = useIsFocused();

  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 5000);
    return () => {
      clearInterval(interval);
    };
  }, [isFocused]);

  const {waiter} = useContext(WaiterContext) as WaiterContextType;

  useEffect(() => {
    const retrieve = async () => {
      const newOrders = await getOrders({waiter});
      setOrders(newOrders || []);
    };
    retrieve()
      .catch(console.error);
  }, [waiter, isFocused, time])

  if (!orders) {
    return <ActivityIndicator size='large'/>;
  }

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Text>Pedidos</Text>
          <View>
            <FlatGrid
              itemDimension={140}
              data={orders}
              renderItem={({item}) => (
                <OrderCard order={item} key={item.id}/>
              )}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default Orders;
