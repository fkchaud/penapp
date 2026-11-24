import React, { useContext, useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { AuthContext } from "@/app/_layout";
import { useRouter } from "expo-router";

export default function Logout() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await auth?.logout();
      router.replace("/");
    })();
  }, []);
  return (
    <SafeAreaView>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Cerrando sesión...</Text>
      </View>
    </SafeAreaView>
  );
}
