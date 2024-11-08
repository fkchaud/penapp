import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, PaperProvider} from "react-native-paper";
import {Theme} from "@/constants/Colors";
import {useEffect, useState} from "react";
import {Order} from "@/types";
import {getOrders} from "@/apis";
import {FlatGrid} from "react-native-super-grid";
import {OrderCard} from "@/components/order_card";


const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const retrieve = async () => {
      const newOrders = await getOrders();  // TODO: pass waiter
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
