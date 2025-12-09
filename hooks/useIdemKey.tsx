import { useRef } from "react";

export const useIdemKey = () => {
  const idemKey = useRef<string | null>(null);

  if (!idemKey.current) {
    idemKey.current = crypto.randomUUID();
  }

  const regenerateKey = () => {
    idemKey.current = crypto.randomUUID();
  };

  return { idemKey, regenerateKey };
};
