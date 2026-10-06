import { useCallback, useEffect, useRef, useState } from "react";

/** Aviso temporal para `Toast`: `announce` lo muestra y desaparece solo. */
export function useToast(duration = 3500) {
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  const announce = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(""), duration);
  }, [duration]);

  // Cancela el temporizador si el componente desaparece antes.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, announce };
}
