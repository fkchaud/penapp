import { Table } from "@/types";
import { useContext, useEffect, useState } from "react";
import { WaiterContext, WaiterContextType } from "@/app/_layout";
import { useIsFocused } from "@react-navigation/core";
import { useApi } from "@/hooks/useApi";
import {
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Checkbox from "expo-checkbox";
import { TopBar } from "@/components/TopBar";

type TableTopBarProps = {
  currentTable: Table | null;
  setCurrentTable: (table: Table) => void;
  autoCurrentTable?: boolean;
  forceAllTables?: boolean;
};
export const TableTopBar = ({
  currentTable,
  setCurrentTable,
  autoCurrentTable = true,
  forceAllTables = false,
}: TableTopBarProps) => {
  const { waiter } = useContext(WaiterContext) as WaiterContextType;
  const isFocused = useIsFocused();
  const { serviceUrl, getTables } = useApi();

  const [enableAllTables, setEnableAllTables] =
    useState<boolean>(forceAllTables);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const retrieveTables = async () => {
      let newTables: Table[] = await getTables();
      newTables = newTables.map((table) => ({ number: table.number }));
      setTables(newTables);
      if (newTables && newTables.length > 0 && autoCurrentTable) {
        if (waiter.from_table.number)
          setCurrentTable(
            newTables.find((t) => t.number === waiter.from_table.number) ||
              newTables[0],
          );
        else setCurrentTable(newTables[0]);
      }
    };
    retrieveTables().catch(console.error);
  }, [isFocused, serviceUrl]);

  if (
    currentTable &&
    !enableAllTables &&
    (currentTable.number < waiter.from_table.number ||
      currentTable.number > waiter.to_table.number)
  ) {
    setEnableAllTables(true);
  }

  return (
    <TopBar>
      <View className={"flex-row items-center"}>
        <Text className={"flex-1 text-xl font-bold"}>Mesa</Text>
        {!forceAllTables && (
          <Pressable
            className={"flex-row items-center"}
            onPress={() => setEnableAllTables(!enableAllTables)}
          >
            <Checkbox
              value={enableAllTables}
              onValueChange={(value) => setEnableAllTables(value)}
              style={{ width: 16, height: 16, borderWidth: 1 }}
            />
            <Text className={"ml-1 text-sm text-neutral-700"}>
              Mostrar todas las mesas
            </Text>
          </Pressable>
        )}
      </View>
      <FlatList
        horizontal={true}
        data={
          waiter?.from_table.number &&
          waiter?.to_table.number &&
          !enableAllTables
            ? tables.filter(
                (t) =>
                  t.number >= waiter.from_table.number &&
                  t.number <= waiter.to_table.number,
              )
            : tables
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className={
              "m-0.5 w-10 h-10 items-center justify-center rounded " +
              (currentTable?.number == item.number
                ? "bg-yellow-800/80"
                : "bg-yellow-800/40")
            }
            key={item.number}
            onPress={() => {
              setCurrentTable(item);
            }}
          >
            <Text
              className={
                currentTable?.number == item.number
                  ? "font-bold text-white"
                  : ""
              }
            >
              {item.number}
            </Text>
          </TouchableOpacity>
        )}
      />
    </TopBar>
  );
};
