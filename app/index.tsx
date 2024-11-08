import {ScrollView, Text, View} from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context';
import {SegmentedButtons} from "react-native-paper";
import {useContext, useEffect, useState} from "react";
import {UserType, UserTypeByKey, Waiter} from "@/types";
import {UserTypeContext, UserTypeContextType, WaiterContext, WaiterContextType} from "@/app/_layout";
import {getWaiters} from "@/apis";
import {SelectList} from "react-native-dropdown-select-list";
import {useIsFocused} from "@react-navigation/core";


const UserTypeSelector = () => {
  const {userType, setUserType} = useContext(UserTypeContext) as UserTypeContextType;

  return (
    <SegmentedButtons
      value={userType}
      onValueChange={(value) => setUserType(UserTypeByKey[value])}
      buttons={[
        {
          value: UserType.Waiter,
          label: 'Mozo',
        },
        {
          value: UserType.Cashier,
          label: 'Caja',
        },
        {
          value: UserType.Chef,
          label: 'Cocina',
        },
      ]}
    />
  )
}


const Index = () => {
  const {userType} = useContext(UserTypeContext) as UserTypeContextType;
  const {waiter, setWaiter} = useContext(WaiterContext) as WaiterContextType;
  const isFocused = useIsFocused();

  const [waiters, setWaiters] = useState<Waiter[]>([]);

  useEffect(() => {
    const call = async () => {
      const waiters = await getWaiters();
      setWaiters(waiters);
    };
    call().catch(console.error);
  }, [userType, isFocused])

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <Text>PeñApp</Text>
          <UserTypeSelector />
          {userType == UserType.Waiter && (
            <SelectList
              setSelected={(val: string) => setWaiter(waiters.find(w => w.name == val)?.name || '')}
              data={waiters.map(w => ({key: w.name, value: w.name}))}
              defaultOption={waiter ? {key: waiter, value: waiter} : undefined}
              save='value'
              search={waiters.length > 5}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Index;
