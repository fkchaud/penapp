import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, HelperText, TextInput } from "react-native-paper";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "@/app/_layout";
import { useApi } from "@/hooks/useApi";
import { StaffMember } from "@/hooks/useApi";

const Index = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const { getStaff } = useApi();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth?.user) {
      // already logged in: go to a sensible home
      const role = auth.actingRole;
      if (role === "chef") router.replace("/chef/orders");
      else if (role === "cashier" || role === "manager")
        router.replace("/cashier/orders");
      else router.replace("/waiter/take_order");
      return;
    }
    (async () => {
      try {
        const s = await getStaff();
        setStaff(s ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [auth?.user]);

  const handleLogin = async () => {
    setError("");
    if (!selected) {
      setError("Seleccioná tu nombre");
      return;
    }
    if (!pin) {
      setError("Ingresá el PIN");
      return;
    }
    setLoading(true);
    try {
      await auth?.login(selected, pin);
      const role = auth?.actingRole ?? "waiter";
      if (role === "chef") router.replace("/chef/orders");
      else if (role === "cashier" || role === "manager")
        router.replace("/cashier/orders");
      else router.replace("/waiter/take_order");
    } catch (e: any) {
      setError(e?.message ?? "Error de login");
    } finally {
      setLoading(false);
    }
  };

  if (auth?.loading) {
    return (
      <SafeAreaView>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (auth?.user) return null;

  return (
    <SafeAreaView>
      <ScrollView>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
            PeñApp — Iniciar sesión
          </Text>
          <Text style={{ marginBottom: 8 }}>Seleccioná tu nombre:</Text>
          <View style={{ marginBottom: 12 }}>
            {staff.map((s) => (
              <Button
                key={s.name}
                mode={selected === s.name ? "contained" : "outlined"}
                onPress={() => setSelected(s.name)}
                style={{ marginBottom: 4 }}
              >
                {s.name} ({s.role})
              </Button>
            ))}
          </View>
          <TextInput
            mode="outlined"
            label="PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={8}
            style={{ marginBottom: 12 }}
          />
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          >
            Entrar
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;