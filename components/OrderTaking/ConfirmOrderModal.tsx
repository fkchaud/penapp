import { PaymentType, QuantityByItem, Table } from "@/types";
import {Modal, Pressable, Text, View} from "react-native";
import { Button } from "react-native-paper";
import { isVoucherTable } from "@/utils/tables";

type ConfirmOrderModalProps = {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  foodToOrder: QuantityByItem;
  drinksToOrder: QuantityByItem;
  table: Table | null;
  totalPrice: number;
  paymentMethod: PaymentType | "";
  setPaymentMethod: (paymentMethod: PaymentType) => void;
  onConfirm: () => void;
  isLoading: boolean;
};
export const ConfirmOrderModal = ({
  modalVisible,
  setModalVisible,
  foodToOrder,
  drinksToOrder,
  table,
  totalPrice,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
  isLoading,
}: ConfirmOrderModalProps) => {
  return (
    <Modal
      visible={modalVisible}
      onDismiss={() => setModalVisible(false)}
      onRequestClose={() => setModalVisible(false)}
      transparent={true}
      animationType={"fade"}
    >
      <View className={"flex-1 justify-center items-center bg-black/25"}>
        <View className={"align-middle bg-white p-6 shadow w-5/6"}>
          <View className={"align-middle"}>
            <Text className={"font-bold"}>Su pedido:</Text>
            {[...foodToOrder.entries()].map(([food, qty]) => (
              <Text key={food.id.toString()}>
                {qty}x {food.name}
              </Text>
            ))}
            {[...drinksToOrder.entries()].map(([drink, qty]) => (
              <Text key={drink.id.toString()}>
                {qty}x {drink.name}
              </Text>
            ))}
            <Text>
              <Text className={"font-bold"}>A pagar:</Text> ${totalPrice}
            </Text>
            <Text> </Text>
            <Text className={"mb-2"}>Seleccione medio de pago:</Text>

            <View style={{ alignItems: "flex-start" }}>
              {[
                { id: "CASH", label: "Efectivo" },
                { id: "TRANSFER", label: "Transferencia" },
                ...(table && isVoucherTable(table.number)
                  ? [{ id: "VOUCHER", label: "Voucher" }]
                  : []),
              ].map((option) => {
                const selected = paymentMethod === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setPaymentMethod(option.id as PaymentType)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: "#909090",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#909090",
                          }}
                        />
                      )}
                    </View>

                    <Text style={{ marginLeft: 8 }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {paymentMethod === "TRANSFER" && (
              <Text>Alias: seminario.mendoza</Text>
            )}
            <Text> </Text>
          </View>
          <View>
            <Button
              compact={true}
              mode={"contained"}
              disabled={!paymentMethod || isLoading}
              onPress={onConfirm}
              loading={isLoading}
            >
              Confirmar comanda
            </Button>
            <Button
              compact={true}
              mode={"outlined"}
              onPress={() => setModalVisible(false)}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
