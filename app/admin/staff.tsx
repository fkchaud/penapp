import React, { useContext, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "@/app/_layout";
import { useApi } from "@/hooks/useApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ParsedRow = { name: string; role: string; error?: string };

const VALID_ROLES = ["waiter", "cashier", "chef", "manager"];

function parseCsv(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[;,]/).map((p) => p.trim());
    const name = parts[0] ?? "";
    const role = (parts[1] ?? "").toLowerCase();
    const error =
      !name
        ? "falta nombre"
        : !VALID_ROLES.includes(role)
          ? `rol inválido: ${role || "(vacío)"}`
          : undefined;
    rows.push({ name, role, error });
  }
  return rows;
}

export default function AdminStaff() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const api = useApi();

  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("waiter");
  const [bulkText, setBulkText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setStaff((await api.getStaff()) ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    refresh();
  }, []);

  if (auth?.user?.role !== "manager") {
    return (
      <SafeAreaView>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Acceso restringido a encargados.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddOne = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Falta el nombre");
      return;
    }
    if (!VALID_ROLES.includes(role)) {
      setMessage("Rol inválido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/staff/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await AsyncStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ name: name.trim(), role, active: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Usuario creado/actualizado");
      setName("");
      refresh();
    } catch (e: any) {
      setMessage("Error: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const handleParse = () => {
    setParsed(parseCsv(bulkText));
    setMessage("");
  };

  const handleBulk = async () => {
    const rows = parsed.length ? parsed : parseCsv(bulkText);
    const valid = rows.filter((r) => !r.error);
    if (valid.length === 0) {
      setMessage("No hay filas válidas");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const res = await fetch("/api/staff/bulk/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: valid.map((r) => ({ name: r.name, role: r.role })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setMessage(
        `Creados: ${data.created}, actualizados: ${data.updated}, errores: ${data.errors?.length ?? 0}`,
      );
      setBulkText("");
      setParsed([]);
      refresh();
    } catch (e: any) {
      setMessage("Error: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = parsed.some((r) => r.error);

  return (
    <SafeAreaView>
      <ScrollView>
        <View style={{ padding: 16 }}>
          <Button mode="outlined" onPress={() => router.back()} style={{ marginBottom: 12 }}>
            ← Volver
          </Button>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            Carga de usuarios (staff)
          </Text>

          {/* Individual */}
          <Text style={{ fontWeight: "bold", marginTop: 8 }}>Alta individual</Text>
          <TextInput
            mode="outlined"
            label="Nombre"
            value={name}
            onChangeText={setName}
            style={{ marginBottom: 8 }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
            {VALID_ROLES.map((r) => (
              <Button
                key={r}
                mode={role === r ? "contained" : "outlined"}
                onPress={() => setRole(r)}
                style={{ marginRight: 4, marginBottom: 4 }}
                compact
              >
                {r}
              </Button>
            ))}
          </View>
          <Button mode="contained" onPress={handleAddOne} loading={loading} disabled={loading}>
            Agregar / actualizar
          </Button>

          {/* Bulk */}
          <Text style={{ fontWeight: "bold", marginTop: 24 }}>Carga masiva (CSV)</Text>
          <Text style={{ color: "#555", marginBottom: 8 }}>
            Una fila por persona: `Nombre,rol`. Separador coma o punto y coma.
            Roles válidos: waiter, cashier, chef, manager.
          </Text>
          <TextInput
            mode="outlined"
            label="Pegá aquí el CSV"
            value={bulkText}
            onChangeText={(t) => {
              setBulkText(t);
              setParsed([]);
            }}
            multiline
            numberOfLines={8}
            style={{ marginBottom: 8, minHeight: 120 }}
          />
          <Button mode="outlined" onPress={handleParse} style={{ marginBottom: 8 }}>
            Vista previa
          </Button>
          {parsed.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              {parsed.map((r, i) => (
                <Text
                  key={i}
                  style={{ color: r.error ? "red" : "black", fontSize: 13 }}
                >
                  {r.name || "(vacío)"} — {r.role || "(vacío)"}
                  {r.error ? `  ⚠ ${r.error}` : "  ✓"}
                </Text>
              ))}
            </View>
          )}
          <Button
            mode="contained"
            onPress={handleBulk}
            loading={loading}
            disabled={loading || (parsed.length > 0 && hasErrors)}
          >
            Cargar {parsed.length > 0 ? parsed.filter((r) => !r.error).length : ""} usuarios
          </Button>

          {/* Existing */}
          <Text style={{ fontWeight: "bold", marginTop: 24 }}>Usuarios actuales</Text>
          {staff.map((s: any) => (
            <Text key={s.name} style={{ fontSize: 13 }}>
              {s.name} — {s.role} {s.active ? "" : "(inactivo)"}
            </Text>
          ))}

          {message ? (
            <HelperText type={message.startsWith("Error") ? "error" : "info"} visible>
              {message}
            </HelperText>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}