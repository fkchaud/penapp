import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import { Theme } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Order } from "@/types";
import { useIsFocused } from "@react-navigation/core";
import { GetOrdersParams, useApi } from "@/hooks/useApi";
import Checkbox from "expo-checkbox";
import OrderMasonry from "@/components/OrderMasonry";

const ChefOrders = () => {
  const isFocused = useIsFocused();
  const { getOrders } = useApi();

  const [time, setTime] = useState(Date.now());
  let interval: NodeJS.Timeout;

  useEffect(() => {
    clearInterval(interval);
    if (isFocused) interval = setInterval(() => setTime(Date.now()), 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isFocused]);

  const [showAllOrders, setShowAllOrders] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const retrieve = async () => {
      const params: GetOrdersParams = {};
      if (!showAllOrders) params.status = ["ACCEPTED", "PREPARING"];
      const newOrders = await getOrders(params);
      setOrders(newOrders || []);
    };
    retrieve().catch(console.error);
  }, [isFocused, time, showAllOrders]);

  if (!orders) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <PaperProvider theme={Theme}>
      <SafeAreaView>
        <ScrollView>
          <View style={{ flexDirection: "row" }}>
            <Checkbox
              value={showAllOrders}
              onValueChange={(value) => setShowAllOrders(value)}
            />
            <Text>Mostrar todas las ordenes</Text>
          </View>
          <View>
            <OrderMasonry orders={orders} targetPath={"/chef/orders/[id]"} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default ChefOrders;
