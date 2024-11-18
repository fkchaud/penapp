import { PaymentType, QuantityByItem } from "@/types";
import { Modal, Text, View } from "react-native";
import RadioGroup from "react-native-radio-buttons-group";
import { Button } from "react-native-paper";

type ConfirmOrderModalProps = {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  foodToOrder: QuantityByItem;
  drinksToOrder: QuantityByItem;
  totalPrice: number;
  paymentMethod: PaymentType | "";
  setPaymentMethod: (paymentMethod: PaymentType) => void;
  onConfirm: () => void;
};
export const ConfirmOrderModal = ({
  modalVisible,
  setModalVisible,
  foodToOrder,
  drinksToOrder,
  totalPrice,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
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
            <RadioGroup
              radioButtons={[
                {
                  id: "CASH",
                  label: "Efectivo",
                  value: "CASH",
                  borderSize: 1.5,
                  borderColor: "#909090",
                  size: 16,
                },
                {
                  id: "TRANSFER",
                  label: "Transferencia",
                  value: "TRANSFER",
                  borderSize: 1.5,
                  borderColor: "#909090",
                  size: 16,
                },
              ]}
              onPress={(selectedId) =>
                setPaymentMethod(selectedId as PaymentType)
              }
              selectedId={paymentMethod}
              containerStyle={{ alignItems: "flex-start" }}
            />
            {paymentMethod === "TRANSFER" && (
              <Text>Alias: seminario.mendoza</Text>
            )}
            <Text> </Text>
          </View>
          <View>
            <Button
              compact={true}
              mode={"contained"}
              disabled={!paymentMethod}
              onPress={onConfirm}
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
