import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelperText, SegmentedButtons, TextInput } from "react-native-paper";
import { useContext, useEffect, useState } from "react";
import { Table, UserType, UserTypeByKey, Waiter } from "@/types";
import {
  ServiceUrlContext,
  ServiceUrlContextType,
  UserTypeContext,
  UserTypeContextType,
  WaiterContext,
  WaiterContextType,
} from "@/app/_layout";
import { SelectList } from "react-native-dropdown-select-list";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";
import { RangeSlider } from "@react-native-assets/slider";

const UserTypeSelector = () => {
  const { userType, setUserType } = useContext(
    UserTypeContext,
  ) as UserTypeContextType;

  return (
    <SegmentedButtons
      value={userType}
      onValueChange={(value) => setUserType(UserTypeByKey[value])}
      buttons={[
        {
          value: UserType.Waiter,
          label: "Mozo",
        },
        {
          value: UserType.Cashier,
          label: "Caja",
        },
        {
          value: UserType.Chef,
          label: "Cocina",
        },
      ]}
    />
  );
};

const Index = () => {
  const { userType } = useContext(UserTypeContext) as UserTypeContextType;
  const { waiter, setWaiter, tableRange, setTableRange } = useContext(
    WaiterContext,
  ) as WaiterContextType;
  const { serviceUrl, setServiceUrl } = useContext(
    ServiceUrlContext,
  ) as ServiceUrlContextType;
  const isFocused = useIsFocused();
  const { getTables, getWaiters } = useApi();

  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    if (!isFocused) return;

    const call = async () => {
      const newWaiters = await getWaiters();
      setWaiters(newWaiters);
    };
    call().catch(console.error);
  }, [userType, isFocused]);

  useEffect(() => {
    if (!isFocused) return;

    const call = async () => {
      const newTables: Table[] = await getTables();
      setTables(newTables);
    };
    call().catch(console.error);
  }, [userType, isFocused]);

  useEffect(() => {
    if (!tables || tables.length === 0) return;

    if (!tableRange.min)
      setTableRange({
        ...tableRange,
        min: Math.min(...tables.map((t) => t.number)),
      });
    if (!tableRange.max)
      setTableRange({
        ...tableRange,
        max: Math.max(...tables.map((t) => t.number)),
      });
  }, [tables]);

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <TextInput
            label="Url del servidor:"
            value={serviceUrl}
            mode="outlined"
            onChangeText={(text) => setServiceUrl(text)}
          />
          <Text />
          <UserTypeSelector />
          {userType == UserType.Waiter && (
            <>
              <HelperText type={"error"} visible={!waiter}>
                Seleccione el mozo antes de continuar
              </HelperText>
              <SelectList
                setSelected={(val: string) =>
                  setWaiter(waiters.find((w) => w.name == val)?.name || "")
                }
                data={
                  waiters?.map((w) => ({ key: w.name, value: w.name })) || []
                }
                defaultOption={
                  waiter ? { key: waiter, value: waiter } : undefined
                }
                save="value"
                search={waiters ? waiters.length > 5 : false}
                boxStyles={waiter ? {} : { borderColor: "red" }}
              />
              <Text />
              {tables?.length > 0 && (
                <View>
                  <Text>
                    Mesas que atiende: {tableRange.min} - {tableRange.max}
                  </Text>
                  <RangeSlider
                    style={{
                      margin: 30,
                    }}
                    range={[tableRange.min, tableRange.max]}
                    minimumValue={Math.min(...tables.map((t) => t.number))}
                    maximumValue={Math.max(...tables.map((t) => t.number))}
                    step={1}
                    slideOnTap={false}
                    onValueChange={(range) =>
                      setTableRange({ min: range[0], max: range[1] })
                    }
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;
