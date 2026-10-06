import { useState } from "react";
import { errorMessage } from "../../errors";
import { FormError } from "./FormError";
import { Modal } from "./Modal";
import { buttonStyles } from "./styles";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Confirmación de una acción destructiva; si falla, muestra el error sin cerrarse. */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function confirm() {
    setWorking(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo completar la operación."));
      setWorking(false);
    }
  }

  return (
    <Modal title={title} description={message} onClose={onClose} size="sm">
      <div className="space-y-5">
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button type="button" className={buttonStyles.secondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={buttonStyles.danger} disabled={working} onClick={() => void confirm()}>{working ? "Eliminando…" : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
