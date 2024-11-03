import {ScrollView, Text} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {PaperProvider} from "react-native-paper";
import {theme} from "@/constants/Colors";
import {useState} from "react";
import {OrderToPlace} from "@/types";

const Orders = () => {
  const [orders, setOrders] = useState<OrderToPlace[]>([]);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView>
        <ScrollView>
          <Text>Pedidos</Text>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default Orders;
