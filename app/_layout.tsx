import React, {createContext, useContext, useEffect, useState} from "react";
import {Drawer} from "expo-router/drawer";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {PaperProvider, Portal, Snackbar,} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Theme} from "@/constants/Colors";
import {UserType} from "@/types";



export type WaiterContextType = {
  waiter: string,
  setWaiter: React.Dispatch<React.SetStateAction<string>>,
}
export const WaiterContext = createContext({});
const WaiterProvider = ({ children }: {children: React.ReactNode})=> {
  const [waiter, setWaiter] = useState<string>('');

  useEffect(() => {
    const retrieve = async () => {
      const wt = await AsyncStorage.getItem('waiter');
      wt && setWaiter(wt);
    }
    retrieve();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('waiter', waiter);
  }, [waiter]);

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

  useEffect(() => {
    const retrieve = async () => {
      const ut = await AsyncStorage.getItem('userType');
      if (ut && Object.values(UserType).includes(ut as UserType))
        setUserType(ut as UserType);
    }
    retrieve();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('userType', userType);
  }, [userType]);

  return (
    <UserTypeContext.Provider value={{userType, setUserType}}>
      {children}
    </UserTypeContext.Provider>
  )
};

export type ServiceUrlContextType = {
  serviceUrl: string,
  setServiceUrl: React.Dispatch<React.SetStateAction<string>>,
}
export const ServiceUrlContext = createContext<ServiceUrlContextType | null>(null);
const ServiceUrlProvider = ({children }: {children: React.ReactNode})=> {
  const [serviceUrl, setServiceUrl] = useState<string>('http://127.0.0.1:8000/');

  useEffect(() => {
    const retrieve = async () => {
      const su = await AsyncStorage.getItem('serviceUrl');
      su && setServiceUrl(su);
    }
    retrieve();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('serviceUrl', serviceUrl);
  }, [serviceUrl]);

  return (
    <ServiceUrlContext.Provider value={{serviceUrl, setServiceUrl}}>
      {children}
    </ServiceUrlContext.Provider>
  )
}


const MyDrawer = () => {
  const {userType} = useContext(UserTypeContext) as UserTypeContextType;

  return (
    <Drawer>
      <Drawer.Screen
        name={'index'}
        options={{
          drawerLabel: "Inicio",
          title: "PeñApp",
        }}
      />
      <Drawer.Screen
        name={'cashier/orders/index'}
        options={{
          drawerLabel: "Ver pedidos",
          title: "Pedidos",
          drawerItemStyle: {display: userType == UserType.Cashier ? 'flex' : 'none'}
        }}
      />
      <Drawer.Screen
        name={'chef/orders/index'}
        options={{
          drawerLabel: "Ver pedidos",
          title: "Pedidos",
          drawerItemStyle: {display: userType == UserType.Chef ? 'flex' : 'none'},
        }}
      />
      <Drawer.Screen
        name={'waiter/orders/index'}
        options={{
          drawerLabel: "Ver pedidos",
          title: "Pedidos",
          drawerItemStyle: {display: userType == UserType.Waiter ? 'flex' : 'none'},
        }}
      />
      <Drawer.Screen
          name={'waiter/take_order'}
          options={{
            drawerLabel: "Tomar pedido",
            title: "Tomar pedido",
            drawerItemStyle: {display: userType == UserType.Waiter ? 'flex' : 'none'},
          }}
      />
      <Drawer.Screen name={'waiter/orders/[id]'} options={{drawerItemStyle: {display: 'none'}}} />
      <Drawer.Screen name={'cashier/orders/[id]'} options={{drawerItemStyle: {display: 'none'}}} />
      <Drawer.Screen name={'chef/orders/[id]'} options={{drawerItemStyle: {display: 'none'}}} />
    </Drawer>

  )
}


export type AlertContextType = {
  alertMessage: string,
  setAlertMessage: React.Dispatch<React.SetStateAction<string>>,
  onDismiss: (() => any) | null,
  setOnDismiss: React.Dispatch<React.SetStateAction<(() => any) | null>>,
}
export const AlertContext = createContext({});
const AlertProvider = ({ children }: {children: React.ReactNode})=> {
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [onDismiss, setOnDismiss] = useState<(() => any) | null>(null);

  return (
    <AlertContext.Provider value={{alertMessage, setAlertMessage, onDismiss, setOnDismiss}}>
      {children}
    </AlertContext.Provider>
  );
};

const MyPortal = () => {
  const {alertMessage, setAlertMessage, onDismiss, setOnDismiss} = useContext(AlertContext) as AlertContextType;

  return (
    <Portal>
      <Snackbar
        visible={!!alertMessage}
        onDismiss={() => {
          setAlertMessage('');
          setOnDismiss(null);
          onDismiss && onDismiss();
        }}
      >
        {alertMessage}
      </Snackbar>
    </Portal>
  )
}


export default function RootLayout() {
  return (
    <WaiterProvider>
      <UserTypeProvider>
        <ServiceUrlProvider>
          <AlertProvider>
            <PaperProvider theme={Theme}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <MyDrawer />
                <MyPortal />
              </GestureHandlerRootView>
            </PaperProvider>
          </AlertProvider>
        </ServiceUrlProvider>
      </UserTypeProvider>
    </WaiterProvider>
  );
};
