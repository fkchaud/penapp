import React, {createContext, useContext, useState} from "react";
import {Drawer} from "expo-router/drawer";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {PaperProvider,} from 'react-native-paper';
import {Theme} from "@/constants/Colors";
import {UserType} from "@/types";


export type WaiterContextType = {
  waiter: string,
  setWaiter: React.Dispatch<React.SetStateAction<string>>,
}
export const WaiterContext = createContext({});
const WaiterProvider = ({ children }: {children: React.ReactNode})=> {
  const [waiter, setWaiter] = useState<string>('');

  return (
    <WaiterContext.Provider value={{waiter, setWaiter}}>
      {children}
    </WaiterContext.Provider>
  );
};

export type UserTypeContextType = {
  userType: UserType,
  setUserType: React.Dispatch<React.SetStateAction<UserType>>,
}
export const UserTypeContext = createContext<UserTypeContextType | null>(null);
const UserTypeProvider = ({ children }: {children: React.ReactNode})=> {
  const [userType, setUserType] = useState<UserType>(UserType.Undefined);

  return (
    <UserTypeContext.Provider value={{userType, setUserType}}>
      {children}
    </UserTypeContext.Provider>
  )
};


const MyDrawer = () => {
  const {userType} = useContext(UserTypeContext) as UserTypeContextType;

  return (
    <Drawer>
      <Drawer.Screen
        name={'index'}
        options={{
          drawerLabel: "dice label index",
          title: "dice title index",
        }}
      />
      <Drawer.Screen
        name={'cashier/orders/index'}
        options={{
          drawerLabel: "dice label cashier orders",
          title: "dice title cashier orders",
          drawerItemStyle: {display: userType == UserType.Cashier ? 'flex' : 'none'}
        }}
      />
      <Drawer.Screen
        name={'chef/orders/index'}
        options={{
          drawerLabel: "dice label chef",
          title: "dice title chef",
          drawerItemStyle: {display: userType == UserType.Chef ? 'flex' : 'none'}
        }}
      />
      <Drawer.Screen
        name={'waiter/orders/index'}
        options={{
          drawerLabel: "dice label waiter",
          title: "dice title waiter",
          drawerItemStyle: {display: userType == UserType.Waiter ? 'flex' : 'none'}
        }}
      />
      <Drawer.Screen
          name={'waiter/take_order'}
          options={{
            drawerLabel: "dice label tomar pedido",
            title: "dice title tomar pedido",
            drawerItemStyle: {display: userType == UserType.Waiter ? 'flex' : 'none'}
          }}
      />
      <Drawer.Screen name={'waiter/orders/[id]'} options={{drawerItemStyle: {display: 'none'}}} />
      <Drawer.Screen name={'cashier/orders/[id]'} options={{drawerItemStyle: {display: 'none'}}} />
      <Drawer.Screen name={'chef/orders/[id]'} options={{drawerItemStyle: {display: 'none'}}} />
    </Drawer>

  )
}


export default function RootLayout() {
  return (
    <WaiterProvider>
      <UserTypeProvider>
        <PaperProvider theme={Theme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <MyDrawer />
          </GestureHandlerRootView>
        </PaperProvider>
      </UserTypeProvider>
    </WaiterProvider>
  );
};

/*
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="index" // This is the name of the page and must match the url from root
          options={{
            drawerLabel: 'Home',
            title: 'overview',
          }}
        />
        <Drawer.Screen
          name="user/[id]" // This is the name of the page and must match the url from root
          options={{
            drawerLabel: 'User',
            title: 'overview',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
 */
