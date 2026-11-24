import React, { useContext, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "@/app/_layout";
import { useApi } from "@/hooks/useApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ParsedRow = {
  name: string;
  price: number;
  icon: string;
  stock: string;
  units_per_pack: number;
  initial_quantity: number;
  error?: string;
};

function parseCsv(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[;,]/).map((p) => p.trim());
    const name = parts[0] ?? "";
    const price = parseInt(parts[1] ?? "0", 10);
    const icon = parts[2] ?? "";
    const stock = parts[3] ?? "";
    const units = parseInt(parts[4] ?? "1", 10);
    const initial = parseInt(parts[5] ?? "0", 10);
    const errors: string[] = [];
    if (!name) errors.push("falta nombre");
    if (Number.isNaN(price)) errors.push("precio inválido");
    if (parts[4] && Number.isNaN(units)) errors.push("units inválido");
    if (parts[5] && Number.isNaN(initial)) errors.push("initial inválido");
    rows.push({
      name,
      price: Number.isNaN(price) ? 0 : price,
      icon,
      stock,
      units_per_pack: Number.isNaN(units) || units < 1 ? 1 : units,
      initial_quantity: Number.isNaN(initial) ? 0 : initial,
      error: errors.length ? errors.join(", ") : undefined,
    });
  }
  return rows;
}

export default function AdminFoods() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const api = useApi();

  const [foods, setFoods] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [icon, setIcon] = useState("");
  const [stock, setStock] = useState("");
  const [stockSelected, setStockSelected] = useState(false);
  const [units, setUnits] = useState("1");
  const [initial, setInitial] = useState("0");
  const [bulkText, setBulkText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setFoods((await api.getFoods()) ?? []);
      // stocks endpoint not in useApi; fetch directly
      const token = await AsyncStorage.getItem("auth_token");
      const res = await fetch("/api/stocks/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resStocks = await res.json();
      if (res.ok) setStocks(resStocks ? resStocks.results : []);
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

  const authHeader = async () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${await AsyncStorage.getItem("auth_token")}`,
  });

  const handleAddOne = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Falta el nombre");
      return;
    }
    setLoading(true);
    try {
      const body: any = {
        name: name.trim(),
        price: parseInt(price || "0", 10),
        icon: icon.trim(),
        units_per_pack: parseInt(units || "1", 10) || 1,
      };
      if (stock.trim()) {
        body.stock = stock.trim();
        body.initial_quantity = parseInt(initial || "0", 10) || 0;
      }
      const res = await fetch("/api/foods/bulk/", {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ items: [body] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      setMessage(`Creados: ${data.created}, actualizados: ${data.updated}`);
      setName("");
      setPrice("");
      setIcon("");
      setStock("");
      setStockSelected(false);
      setUnits("1");
      setInitial("0");
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
      const res = await fetch("/api/foods/bulk/", {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({
          items: valid.map((r) => ({
            name: r.name,
            price: r.price,
            icon: r.icon,
            stock: r.stock,
            units_per_pack: r.units_per_pack,
            initial_quantity: r.initial_quantity,
          })),
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Button mode="outlined" onPress={() => router.back()} style={{ marginBottom: 12 }}>
            ← Volver
          </Button>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            Carga de comidas
          </Text>

          <Text style={{ fontWeight: "bold", marginTop: 8 }}>Alta individual</Text>
          <TextInput mode="outlined" label="Nombre" value={name} onChangeText={setName} style={{ marginBottom: 8 }} />
          <TextInput mode="outlined" label="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" style={{ marginBottom: 8 }} />
          <TextInput mode="outlined" label="Icono (opcional)" value={icon} onChangeText={setIcon} style={{ marginBottom: 8 }} />
          <TextInput mode="outlined" label="Unidades por pack" value={units} onChangeText={setUnits} keyboardType="numeric" style={{ marginBottom: 8 }} />
          <View
            style={stockSelected ? {
              backgroundColor: "#eef6ff",
              padding: 8,
              borderRadius: 6,
              marginBottom: 8,
            } : {}}
          >
            {stockSelected
              ? <Text style={{ fontWeight: "bold", color: "#1a5fb4" }}>Stock preexistente seleccionado: {stock}</Text>
              : <Text style={{ fontWeight: "bold", marginTop: 4 }}>Stock: </Text>
            }
            <TextInput
              mode="outlined"
              label="Nombre del stock (escribí para buscar o crear)"
              value={stock}
              onChangeText={(t) => {
                setStock(t);
                setStockSelected(false);
              }}
              style={{ marginBottom: 4 }}
            />
            {stock && stocks
              .filter((s: any) =>
                (s.name ?? "").toLowerCase().includes(stock.toLowerCase()),
              )
              .slice(0, 6)
              .map((s: any) => (
                <Button
                  key={s.name}
                  mode="text"
                  compact
                  onPress={() => {
                    setStock(s.name);
                    setStockSelected(true);
                    setInitial(String(s.initial_quantity ?? 0));
                  }}
                  style={{ alignSelf: "flex-start" }}
                >
                  {s.name} (actual: {s.initial_quantity})
                </Button>
              ))}
            {stocks.filter((s: any) =>
              (s.name ?? "").toLowerCase().includes(stock.toLowerCase()),
            ).length === 0 && (
              <Text style={{ color: "#888", fontSize: 12, marginLeft: 4 }}>
                No existe: se creará un stock nuevo con ese nombre.
              </Text>
            )}
            {stockSelected && <Text style={{color: "#555", fontSize: 12, marginBottom: 4}}>
                Se actualizará su cantidad inicial al guardar.
            </Text>}
            <TextInput
              mode="outlined"
              label={stockSelected ? "Nueva cantidad inicial" : "Cantidad inicial (stock)"}
              value={initial}
              onChangeText={setInitial}
              keyboardType="numeric"
              style={{ marginBottom: 4 }}
            />
            {stockSelected && <Button
                mode="text"
                compact
                onPress={() => {
                  setStockSelected(false);
                  setInitial("0");
                }}
            >
                Desvincular (crear stock nuevo)
            </Button>}
          </View>
          <Button mode="contained" onPress={handleAddOne} loading={loading} disabled={loading}>
            Agregar / actualizar
          </Button>

          <Text style={{ fontWeight: "bold", marginTop: 24 }}>Carga masiva (CSV)</Text>
          <Text style={{ color: "#555", marginBottom: 8 }}>
            Columnas: nombre,precio,icono,stock,units_por_pack,cantidad_inicial
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
                <Text key={i} style={{ color: r.error ? "red" : "black", fontSize: 13 }}>
                  {r.name || "(vacío)"} — ${r.price} {r.stock ? `(${r.stock}${stocks.some((s: any) => s.name === r.stock) ? " · existente" : " · nuevo"})` : ""}
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
            Cargar {parsed.length > 0 ? parsed.filter((r) => !r.error).length : ""} comidas
          </Button>

          <Text style={{ fontWeight: "bold", marginTop: 24 }}>Comidas actuales</Text>
          {foods.map((f: any) => (
            <Text key={f.id ?? f.name} style={{ fontSize: 13 }}>
              {f.name} — ${f.price} (quedan {f.remaining})
            </Text>
          ))}

          {message ? (
            <HelperText type={message.startsWith("Error") ? "error" : "info"} visible>
              {message}
            </HelperText>
          ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
