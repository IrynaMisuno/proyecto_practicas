import { ArrowLeft } from "lucide-react";
import { linkStyles } from "./ui";

export function BackToLogin({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={`inline-flex items-center gap-1.5 ${linkStyles}`} onClick={onClick}>
      <ArrowLeft size={14} /> Volver a iniciar sesión
    </button>
  );
}
