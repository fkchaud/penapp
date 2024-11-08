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


const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const {waiter} = useContext(WaiterContext) as WaiterContextType;

  useEffect(() => {
    const retrieve = async () => {
      const newOrders = await getOrders(waiter);
      setOrders(newOrders);
    };
    retrieve()
      .catch(console.error);
  }, [])


  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Text>Pedidos</Text>
          {
            orders.length === 0
              ? <ActivityIndicator size='large' />
              : <View>
                  <FlatGrid
                    itemDimension={140}
                    data={orders}
                    renderItem={({item}) => (
                      <OrderCard order={item} key={item.id}/>
                    )}
                  />
                </View>
          }
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default Orders;
