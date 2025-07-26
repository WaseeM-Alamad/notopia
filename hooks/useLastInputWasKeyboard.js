import { useEffect, useRef } from "react";

export function useLastInputWasKeyboard() {
  const ref = useRef(false);

  useEffect(() => {
    const handleKey = () => (ref.current = true);
    const handleMouse = () => (ref.current = false);

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleMouse);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleMouse);
    };
  }, []);

  return ref;
}