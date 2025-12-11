import { LegacyRef } from "react";
import { Text, TextInput, View } from "react-native";
import { BottomBar } from "@/components/BottomBar";
import { Button, Divider } from "react-native-paper";

type ConfirmBottomBarProps = {
  commentInputRef?: LegacyRef<TextInput>;
  comment: string;
  setComment: (comment: string) => void;
  totalPrice: number;
  cancelText: string;
  onCancel: () => void;
  onContinue: () => void;
  isEnabled: boolean;
};
export const ConfirmBottomBar = ({
  commentInputRef,
  comment,
  setComment,
  totalPrice,
  cancelText,
  onCancel,
  onContinue,
  isEnabled,
}: ConfirmBottomBarProps) => {
  return (
    <BottomBar>
      <TextInput
        ref={commentInputRef}
        placeholder={"Agregar comentario"}
        value={comment}
        onChangeText={setComment}
        maxLength={150}
        blurOnSubmit={true}
        returnKeyType={"done"}
        multiline={true}
      />
      <Divider />
      <Text className={"text-lg"}>Total: ${totalPrice}</Text>
      <View className={"flex-row"}>
        <Button mode={"outlined"} onPress={onCancel} style={{ flex: 1 }}>
          {cancelText}
        </Button>
        <Button
          mode={"contained"}
          onPress={onContinue}
          style={{ flex: 2 }}
          disabled={!isEnabled}
        >
          Continuar
        </Button>
      </View>
    </BottomBar>
  );
};
