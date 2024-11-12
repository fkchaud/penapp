import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, PaperProvider} from "react-native-paper";
import {Theme} from "@/constants/Colors";
import {useEffect, useState} from "react";
import {Order} from "@/types";
import {SimpleGrid} from "react-native-super-grid";
import {OrderCard} from "@/components/OrderCard";
import {Link} from "expo-router";
import {useIsFocused} from "@react-navigation/core";
import {GetOrdersParams, useApi} from "@/hooks/useApi";
import Checkbox from "expo-checkbox";


const Orders = () => {
  const isFocused = useIsFocused();
  const {getOrders} = useApi();

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
        params.status = 'PLACED';
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
            <Checkbox value={showAllOrders} onValueChange={(value) => setShowAllOrders(value)}/>
            <Text>Mostrar todas las ordenes</Text>
          </View>
          <View>
            <SimpleGrid
              listKey={'orders'}
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
