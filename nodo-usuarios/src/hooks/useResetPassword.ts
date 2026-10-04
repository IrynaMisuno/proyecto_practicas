import { useState } from "react";
import * as api from "../data";
import { ApiError, errorMessage } from "../errors";

/** Cambio de contraseña con el token del enlace de recuperación. */
export function useResetPassword(token: string) {
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Devuelve el mensaje de éxito, o null si no se pudo cambiar. */
  async function submit(password: string): Promise<string | null> {
    setError("");
    setSubmitting(true);
    try {
      // Si va bien, la pantalla se cierra, así que `submitting` no vuelve a false.
      return (await api.resetPassword(token, password)).message;
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields.password) setFieldError(caught.fields.password);
      else setError(errorMessage(caught, "No se pudo cambiar la contraseña."));
      setSubmitting(false);
      return null;
    }
  }

  return { fieldError, setFieldError, error, submitting, submit };
}
