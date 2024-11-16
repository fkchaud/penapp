import { PropsWithChildren } from "react";
import { View } from "react-native";

type TopBarProps = {
  className?: string;
};
export const TopBar = ({
  children,
  className,
  ...props
}: PropsWithChildren<TopBarProps>) => {
  return (
    <View
      className={
        "p-2 bg-white border-b border-b-neutral-500 " + (className || "")
      }
      {...props}
    >
      {children}
    </View>
  );
};
