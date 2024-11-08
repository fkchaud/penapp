import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, PaperProvider} from "react-native-paper";
import {Theme} from "@/constants/Colors";
import {useEffect, useState} from "react";
import {Order} from "@/types";
import {getOrders} from "@/apis";
import {FlatGrid} from "react-native-super-grid";
import {OrderCard} from "@/components/order_card";
import {Link} from "expo-router";
import {useIsFocused} from "@react-navigation/core";


const Orders = () => {
  const isFocused = useIsFocused();

  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 5000);
    return () => {
      clearInterval(interval);
    };
  }, [isFocused]);

  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const retrieve = async () => {
      const newOrders = await getOrders();
      setOrders(newOrders || []);
    };
    retrieve()
      .catch(console.error);
  }, [isFocused, time])

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
                <Link href={{pathname: '/cashier/orders/[id]', params: {id: item.id}}} key={item.id} style={{flexGrow: 1}}>
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

export default Orders;
