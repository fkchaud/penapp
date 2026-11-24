import React, { useContext, useState } from "react";
import { Modal, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { AuthContext } from "@/app/_layout";
import { StockItem, useApi } from "@/hooks/useApi";

import { Item } from "@/types";

type Mode = "list" | "form";

interface ParsedCsv {name: string, price: number, icon: string, stock: string, units_per_pack: number, initial_quantity: number, error?: string}

export default function AdminDrinks() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const api = useApi();

  const [drinks, setDrinks] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const { width } = useWindowDimensions();
  const columns = width >= 1920 ? 4 : width >= 1200 ? 3 : width >= 768 ? 2 : 1;
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [icon, setIcon] = useState("");
  const [stock, setStock] = useState("");
  const [stockSelected, setStockSelected] = useState(false);
  const [units, setUnits] = useState("1");
  const [initial, setInitial] = useState("0");

  const [bulkText, setBulkText] = useState("");
  const [parsed, setParsed] = useState<ParsedCsv[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setDrinks((await api.getDrinks()) ?? []);
      setStocks((await api.getStocks()) ?? []);
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

  const ensureStock = async (stockName: string, initialQty: number): Promise<number | null> => {
    if (!stockName.trim()) return null;
    const existing = stocks.find((s) => s.name === stockName.trim());
    if (existing) {
      if (String(existing.initial_quantity) !== String(initialQty)) {
        await api.updateStock(existing.id, { initial_quantity: initialQty });
      }
      return existing.id;
    }
    const data = await api.createStock({ name: stockName.trim(), initial_quantity: initialQty });
    return data.id;
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setIcon("");
    setStock("");
    setStockSelected(false);
    setUnits("1");
    setInitial("0");
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setMode("form");
    setMessage("");
  };

  const openEdit = (d: Item) => {
    setEditingId(d.id);
    setName(d.name ?? "");
    setPrice(String(d.price ?? ""));
    setIcon(d.icon ?? "");
    setUnits(String(d.units_per_pack ?? 1));
    const drinkStock = stocks.find((s) => s.id == d.stock);
    setStock(d.stock_name ?? "");
    setStockSelected(!!(d.stock_name));
    setInitial(String(drinkStock?.initial_quantity || 0));
    setMode("form");
    setMessage("");
  };

  const handleSave = async () => {
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
        const sid = await ensureStock(stock.trim(), parseInt(initial || "0", 10) || 0);
        body.stock = sid;
      } else {
        body.stock = null;
      }
      if (editingId) {
        await api.updateDrink(editingId, body);
      } else {
        await api.createDrink(body);
      }
      setMessage(editingId ? "Bebida actualizada" : "Bebida creada");
      resetForm();
      setMode("list");
      refresh();
    } catch (e: any) {
      setMessage("Error: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (d: Item) => {
    setPendingDelete(d);
  };

  const confirmDelete = async () => {
    const d = pendingDelete;
    setPendingDelete(null);
    if (!d) return;
    setLoading(true);
    setMessage("");
    try {
      await api.deleteDrink(d.id);
      setMessage(`Eliminada: ${d.name}`);
      refresh();
    } catch (e: any) {
      setMessage("Error: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const parseCsv = (text: string): ParsedCsv[] => {
    const rows: ParsedCsv[] = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const parts = line.split(/[;,]/).map((p) => p.trim());
      const n = parts[0] ?? "";
      const pr = parseInt(parts[1] ?? "0", 10);
      const ic = parts[2] ?? "";
      const st = parts[3] ?? "";
      const un = parseInt(parts[4] ?? "1", 10);
      const ini = parseInt(parts[5] ?? "0", 10);
      const errors: string[] = [];
      if (!n) errors.push("falta nombre");
      if (Number.isNaN(pr)) errors.push("precio inválido");
      rows.push({
        name: n,
        price: Number.isNaN(pr) ? 0 : pr,
        icon: ic,
        stock: st,
        units_per_pack: Number.isNaN(un) || un < 1 ? 1 : un,
        initial_quantity: Number.isNaN(ini) ? 0 : ini,
        error: errors.length ? errors.join(", ") : undefined,
      });
    }
    return rows;
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
      const data = await api.bulkDrinks(
        valid.map((r) => ({
          name: r.name,
          price: r.price,
          icon: r.icon,
          stock: r.stock,
          units_per_pack: r.units_per_pack,
          initial_quantity: r.initial_quantity,
        })),
      );
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

  if (mode === "form") {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Button mode="outlined" onPress={() => { resetForm(); setMode("list"); }} style={{ marginBottom: 12 }}>
            Cancelar
          </Button>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            {editingId ? "Editar bebida" : "Nueva bebida"}
          </Text>
          <TextInput mode="outlined" label="Nombre" value={name} onChangeText={setName} style={{ marginBottom: 8 }} />
          <TextInput mode="outlined" label="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" style={{ marginBottom: 8 }} />
          <TextInput mode="outlined" label="Icono (opcional)" value={icon} onChangeText={setIcon} style={{ marginBottom: 8 }} />
          <TextInput mode="outlined" label="Unidades por pack" value={units} onChangeText={setUnits} keyboardType="numeric" style={{ marginBottom: 8 }} />

          <Text style={{ fontWeight: "bold", marginTop: 4 }}>Stock</Text>
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
          {stock.trim().length > 0 && !stockSelected && (
            <View style={{ marginBottom: 8 }}>
              {stocks
                .filter((s) => (s.name ?? "").toLowerCase().includes(stock.toLowerCase()))
                .slice(0, 6)
                .map((s) => (
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
              {stocks.filter((s) => (s.name ?? "").toLowerCase().includes(stock.toLowerCase())).length === 0 && (
                <Text style={{ color: "#888", fontSize: 12, marginLeft: 4 }}>
                  No existe: se creará un stock nuevo con ese nombre.
                </Text>
              )}
            </View>
          )}
          {stockSelected && (
            <View style={{ backgroundColor: "#eef6ff", padding: 8, borderRadius: 6, marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", color: "#1a5fb4" }}>
                Stock preexistente: {stock}
              </Text>
              <Text style={{ color: "#555", fontSize: 12, marginBottom: 4 }}>
                Se actualizará su cantidad inicial al guardar.
              </Text>
              <TextInput
                mode="outlined"
                label="Nueva cantidad inicial"
                value={initial}
                onChangeText={setInitial}
                keyboardType="numeric"
                style={{ marginBottom: 4 }}
              />
              <Button
                mode="text"
                compact
                onPress={() => {
                  setStockSelected(false);
                  setInitial("0");
                }}
              >
                Desvincular (crear stock nuevo)
              </Button>
            </View>
          )}
          {!stockSelected && stock.trim().length > 0 && (
            <TextInput
              mode="outlined"
              label="Cantidad inicial (stock nuevo)"
              value={initial}
              onChangeText={setInitial}
              keyboardType="numeric"
              style={{ marginBottom: 8 }}
            />
          )}

          <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading} style={{ marginTop: 8 }}>
            {editingId ? "Guardar cambios" : "Crear bebida"}
          </Button>

          {message ? (
            <HelperText type={message.startsWith("Error") ? "error" : "info"} visible>
              {message}
            </HelperText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Button mode="outlined" onPress={() => router.back()} style={{ marginBottom: 12 }}>
          Volver
        </Button>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
          Bebidas
        </Text>
        <Button mode="contained" onPress={openNew} style={{ marginBottom: 16 }}>
          + Agregar nueva bebida
        </Button>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
          {drinks.map((d: Item) => (
            <View
              key={d.id ?? d.name}
              style={{
                width: `${100 / columns}%`,
                padding: 4,
              }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 6,
                  padding: 10,
                  minHeight: 90,
                }}
              >
                <Text style={{ fontWeight: "bold" }}>{d.name}</Text>
                <Text style={{ fontSize: 13, color: "#555" }}>
                  ${d.price} - quedan {d.remaining} - pack x{d.units_per_pack}
                  {d.stock_name ? ` - stock: ${d.stock_name}` : ""}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 6, flexWrap: "wrap" }}>
                  <Button mode="outlined" compact onPress={() => openEdit(d)} style={{ marginRight: 8 }}>
                    Editar
                  </Button>
                  <Button mode="outlined" compact onPress={() => requestDelete(d)} disabled={loading}>
                    Eliminar
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>

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
          numberOfLines={6}
          style={{ marginBottom: 8, minHeight: 100 }}
        />
        <Button mode="outlined" onPress={handleParse} style={{ marginBottom: 8 }}>
          Vista previa
        </Button>
        {parsed.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            {parsed.map((r, i) => (
              <Text key={i} style={{ color: r.error ? "red" : "black", fontSize: 13 }}>
                {r.name || "(vacío)"} - ${r.price}{" "}
                {r.stock ? `(${r.stock}${stocks.some((s) => s.name === r.stock) ? " existente" : " nuevo"})` : ""}
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
          Cargar {parsed.length > 0 ? parsed.filter((r) => !r.error).length : ""} bebidas
        </Button>

        {message ? (
          <HelperText type={message.startsWith("Error") ? "error" : "info"} visible>
            {message}
          </HelperText>
        ) : null}

        <Modal visible={!!pendingDelete} transparent animationType="fade" onRequestClose={() => setPendingDelete(null)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: 20,
                width: "100%",
                maxWidth: 400,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                Confirmar eliminación
              </Text>
              <Text style={{ marginBottom: 16 }}>
                Se eliminará "{pendingDelete?.name}". Esta acción no se puede deshacer.
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <Button mode="outlined" onPress={() => setPendingDelete(null)} style={{ marginRight: 8 }}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={confirmDelete} loading={loading} disabled={loading}>
                  Eliminar
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
