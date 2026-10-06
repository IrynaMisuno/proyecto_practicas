import { useState } from "react";
import * as api from "../data";
import { errorMessage } from "../errors";

/** Solicitud del enlace de recuperación. La respuesta no revela si el email existe. */
export function useForgotPassword() {
  const [sentMessage, setSentMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function send(email: string) {
    setError("");
    setSubmitting(true);
    try {
      setSentMessage((await api.requestPasswordReset(email)).message);
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo enviar la solicitud."));
    } finally {
      setSubmitting(false);
    }
  }

  return { sentMessage, error, submitting, send };
}
