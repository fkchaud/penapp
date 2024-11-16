import { PropsWithChildren } from "react";
import { View } from "react-native";

type BottomBarProps = {
  className?: string;
};
export const BottomBar = ({
  children,
  className,
  ...props
}: PropsWithChildren<BottomBarProps>) => {
  return (
    <View
      className={"p-3 border-t border-t-neutral-500 " + (className || "")}
      {...props}
    >
      {children}
    </View>
  );
};
