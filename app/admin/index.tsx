import React, { useContext } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "@/app/_layout";

const ADMIN_SECTIONS = [
  { key: "staff", label: "Usuarios (staff) y roles", route: "/admin/staff" },
  { key: "foods", label: "Comidas", route: "/admin/foods" },
  { key: "drinks", label: "Bebidas (próximamente)", route: null },
  { key: "tables", label: "Mesas (próximamente)", route: null },
  { key: "waiters", label: "Mozos y rangos de mesa (próximamente)", route: null },
  { key: "stock", label: "Stock inicial (próximamente)", route: null },
];

export default function AdminIndex() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  if (auth?.user?.role !== "manager") {
    return (
      <SafeAreaView>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Acceso restringido a encargados.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
            Admin - carga de datos
        </Text>
        <Text style={{ marginBottom: 16, color: "#555" }}>
            Seleccioná qué querés cargar o editar.
        </Text>
        {ADMIN_SECTIONS.map((s) => (
          <Button
            key={s.key}
            mode="contained-tonal"
            onPress={() => s.route && router.push(s.route as any)}
            disabled={!s.route}
            style={{ marginBottom: 8 }}
          >
            {s.label}
          </Button>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
