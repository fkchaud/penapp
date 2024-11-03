import {ScrollView, Text, View} from "react-native";
import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Link} from "expo-router";


const theme = {
  ...DefaultTheme,
  dark: true,
}


const Index = () => {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView>
        <ScrollView>
          <View>
            <Text>Mansa App</Text>
            <Link href={"/waiter/take_order"}>Mozo: tomar pedido</Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default Index;
