import { Chip, Icon } from "react-native-paper";
import { Text, View, ViewStyle } from "react-native";

import { Order, OrderStatus, PaymentType } from "@/types";
import "@/css/global.css";
import { getTableShowable } from "@/utils/tables";

export const PaymentMethodLabel: Record<PaymentType, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  MERCADOPAGO: "Mercado Pago",
  VOUCHER: "Voucher",
};
export const PaymentMethodIcon: Record<
  PaymentType,
  { name: string; lightColor: string; darkColor: string }
> = {
  CASH: { name: "cash", lightColor: "black", darkColor: "white" },
  TRANSFER: { name: "bank-transfer", lightColor: "black", darkColor: "white" },
  MERCADOPAGO: {
    name: "handshake-outline",
    lightColor: "black",
    darkColor: "white",
  },
  VOUCHER: { name: "wallet-giftcard", lightColor: "black", darkColor: "white" },
};
const StatusLabels: Record<
  OrderStatus,
  { text: string; className: string; isDark: boolean }
> = {
  PLACED: { text: "Tomado", className: "bg-gray-200/75", isDark: false },
  ACCEPTED: { text: "Aprobado", className: "bg-yellow-200/50", isDark: false },
  REJECTED: { text: "Rechazado", className: "bg-red-200", isDark: false },
  PREPARED: { text: "Preparado", className: "bg-green-500/15", isDark: false },
  PREPARING: {
    text: "Preparando",
    className: "bg-yellow-200/50",
    isDark: false,
  },
  PICKED_UP: { text: "Recogido", className: "bg-green-200/20", isDark: false },
  DELIVERED: { text: "Entregado", className: "bg-green-500/25", isDark: false },
  CANCELED: {
    text: "Cancelado",
    className: "bg-black text-white",
    isDark: true,
  },
};

export const StatusLabel = ({ status }: { status: OrderStatus }) => {
  const conversion: Record<OrderStatus, { text: string; color: string }> = {
    PLACED: { text: "Tomado", color: "gray" },
    ACCEPTED: { text: "Aprobado", color: "yellow" },
    REJECTED: { text: "Rechazado", color: "red" },
    PREPARED: { text: "Preparado", color: "green" },
    PREPARING: { text: "Preparando", color: "yellow" },
    PICKED_UP: { text: "Recogido", color: "green" },
    DELIVERED: { text: "Entregado", color: "white" },
    CANCELED: { text: "Cancelado", color: "cyan" },
  };

  return (
    <Chip
      compact
      style={{
        backgroundColor: conversion[status].color,
      }}
    >
      {conversion[status].text}
    </Chip>
  );
};

export const OrderCard = ({
  order,
  className,
  style,
  ...props
}: {
  order: Order | null;
  className?: string;
  style?: ViewStyle;
}) => {
  if (!order) return null;

  const statusLabel = StatusLabels[order.last_status.status];
  const paymentMethodIcon = PaymentMethodIcon[order.payment_type];

  return (
    <View
      style={{ ...style }}
      className={`bg-green bg-white m-0.5 rounded-lg overflow-hidden border border-black/65 shadow ${className ? className : ""}`}
      {...props}
    >
      <View className={"flex-row border-b border-b-yellow-800/75"}>
        <View
          className={
            "py-0.5 px-1 border-r border-r-yellow-800/5 bg-yellow-800/20"
          }
        >
          <Text className={"font-bold"}>#{order.id}</Text>
        </View>
        <View className={"py-0.5 px-1 flex-1 items-center bg-yellow-800/30"}>
          {order.waiter && <Text>{order.waiter.name}</Text>}
        </View>
        <View
          className={
            "py-0.5 px-1 border-l border-l-yellow-800/5 bg-yellow-800/40"
          }
        >
          {order.table && <Text>{getTableShowable(order.table.number)}</Text>}
        </View>
      </View>
      <View className={"flex-1"}>
        <View
          className={"pt-1 pb-0.5 px-1 bg-cyan-300/20 flex-auto justify-center"}
        >
          {order.foods.map((food) => (
            <Text key={food.food.id}>
              - {food.quantity}x {food.food.name}
            </Text>
          ))}
        </View>
        <View
          className={"pt-0.5 pb-1 px-1 bg-cyan-300/30 flex-auto justify-center"}
        >
          {order.drinks.map((drinks) => (
            <Text key={drinks.drink.id}>
              - {drinks.quantity}x {drinks.drink.name}
            </Text>
          ))}
        </View>
      </View>
      <View
        className={`py-1 px-1 border-t border-t-cyan-800/60 ${statusLabel?.className || ""}`}
      >
        {(order.comment || null) && (
          <Text className={"italic text-inherit"}>{order.comment}</Text>
        )}
        <View className={"flex-row align-middle"}>
          <View>
            <Text className={"text-inherit"}>${order.total_price}</Text>
          </View>
          {paymentMethodIcon && (
            <View>
              <Icon
                size={18}
                source={paymentMethodIcon.name}
                color={
                  statusLabel?.isDark || false
                    ? paymentMethodIcon.darkColor
                    : paymentMethodIcon.lightColor
                }
              />
            </View>
          )}
          <View className={"flex-1"}>
            <Text className={"text-right text-inherit"}>
              {order.last_status && statusLabel?.text}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
