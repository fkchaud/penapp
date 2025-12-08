import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelperText, SegmentedButtons, TextInput } from "react-native-paper";
import { useContext, useEffect, useState } from "react";
import { Table, UserType, UserTypeByKey, WaiterTables } from "@/types";
import {
  UserTypeContext,
  UserTypeContextType,
  WaiterContext,
  WaiterContextType,
} from "@/app/_layout";
import { SelectList } from "react-native-dropdown-select-list";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";

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
  const { waiter, setWaiter } = useContext(WaiterContext) as WaiterContextType;
  const isFocused = useIsFocused();
  const { getTables, getWaiters, updateWaiter } = useApi();

  const [waiters, setWaiters] = useState<WaiterTables[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [lastUpdatedTables, setLastUpdatedTables] = useState<{
    from: number;
    to: number;
  }>({
    from: waiter?.from_table.number || 0,
    to: waiter?.to_table.number || 0,
  });

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

  const setTableRange = ({ min, max }: { min: number; max: number }) => {
    const updatedWaiter = {
      ...waiter,
      from_table: { number: min },
      to_table: { number: max },
    };
    setWaiter(updatedWaiter);
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <UserTypeSelector />
          {userType == UserType.Waiter && (
            <>
              <HelperText type={"error"} visible={!waiter}>
                Seleccione el mozo antes de continuar
              </HelperText>
              <SelectList
                setSelected={(val: string) => {
                  if (!waiters || waiters.length === 0) return;
                  const wt = waiters.find((w) => w.name == val);
                  if (wt) setWaiter(wt);
                }}
                data={
                  waiters?.map((w) => ({ key: w.name, value: w.name })) || []
                }
                defaultOption={
                  waiter
                    ? { key: waiter.name, value: waiter.name }
                    : undefined
                }
                save="value"
                search={waiters ? waiters.length > 5 : false}
                boxStyles={waiter ? {} : { borderColor: "red" }}
              />
              <Text />
              {tables?.length > 0 && waiter && (
                <View className={"mt-4"}>
                  <Text>Mesas que atiende:</Text>
                  <View className={"flex-row"}>
                    <TextInput
                      mode={"outlined"}
                      label={"Desde"}
                      inputMode={"numeric"}
                      value={waiter.from_table.number.toString()}
                      onChangeText={(text) =>
                        setTableRange({
                          min: Number(text),
                          max: waiter.to_table.number,
                        })
                      }
                      onBlur={() => {
                        if (
                          lastUpdatedTables.from == waiter.from_table.number
                        )
                          return;
                        updateWaiter(waiter);
                        setLastUpdatedTables({
                          ...lastUpdatedTables,
                          from: waiter.from_table.number,
                        });
                      }}
                    />
                    <TextInput
                      mode={"outlined"}
                      label={"Hasta"}
                      inputMode={"numeric"}
                      value={waiter.to_table.number.toString()}
                      onChangeText={(text) =>
                        setTableRange({
                          min: waiter.from_table.number,
                          max: Number(text),
                        })
                      }
                      onBlur={() => {
                        if (lastUpdatedTables.to == waiter.to_table.number)
                          return;
                        updateWaiter(waiter);
                        setLastUpdatedTables({
                          ...lastUpdatedTables,
                          to: waiter.to_table.number,
                        });
                      }}
                    />
                  </View>
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
