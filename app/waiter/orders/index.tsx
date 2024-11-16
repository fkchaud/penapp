import {useContext, useEffect, useState} from "react";
import {Dimensions, ScrollView, Text, TouchableOpacity, View} from "react-native";
import {ActivityIndicator, Button, PaperProvider} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import {SimpleGrid} from "react-native-super-grid";

import {Link, useRouter} from "expo-router";

import {useIsFocused} from "@react-navigation/core";
import {MasonryFlashList} from "@shopify/flash-list";

import {Theme} from "@/constants/Colors";
import {Order} from "@/types";
import {OrderCard} from "@/components/OrderCard";
import {WaiterContext, WaiterContextType} from "@/app/_layout";
import {useApi} from "@/hooks/useApi";
import "@/css/global.css";


const Orders = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const isFocused = useIsFocused();
  const {getOrders} = useApi();
  const {width} = Dimensions.get("window");
  const router = useRouter();

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
      const newOrders: Order[] = await getOrders({waiter});
      setOrders(newOrders.sort((a, b) => b.id - a.id) || []);
    };
    retrieve()
      .catch(console.error);
  }, [waiter, isFocused, time])

  if (!orders) {
    return <ActivityIndicator size='large'/>;
  }

  const activeOrders = () =>
    orders.filter(o => ['PLACED', 'ACCEPTED', 'PICKED_UP', 'REJECTED'].includes(o.last_status.status))
  const inactiveOrders = () =>
    orders.filter(o => ['DELIVERED', 'CANCELED'].includes(o.last_status.status))

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <Button mode={'contained'} onPress={() => router.navigate('/waiter/take_order')} >
            Tomar pedido
          </Button>
          <View>
            <MasonryFlashList
              numColumns={Math.floor(width/128)}
              estimatedItemSize={180}
              data={activeOrders()}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/waiter/orders/[id]', params: { id: item.id } })}
                  className={'w-full'}
                  key={item.id}
                >
                  <OrderCard order={item}/>
                </TouchableOpacity>
              )}
            />
          </View>
          {inactiveOrders().length > 0 &&
            <View>
              <Text>Pasadas:</Text>
              <SimpleGrid
                listKey={'inactive-orders'}
                itemDimension={140}
                data={inactiveOrders()}
                renderItem={({item}) => (
                  <Link href={{pathname: '/waiter/orders/[id]', params: {id: item.id}}} key={item.id} style={{flexGrow: 1}}>
                    <OrderCard order={item} key={item.id}/>
                  </Link>
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
