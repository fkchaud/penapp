import React, {createContext, useState} from "react";
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


export default function RootLayout() {
  return (
    <WaiterProvider>
      <UserTypeProvider>
        <PaperProvider theme={Theme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer />
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
