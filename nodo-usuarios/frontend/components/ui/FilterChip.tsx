import { X } from "lucide-react";
import { IconButton } from "./IconButton";

interface FilterChipProps {
  /** Texto visible del filtro, p. ej. «Rol: Lector». */
  label: string;
  onRemove: () => void;
}

/** Filtro aplicado, con una cruz para quitarlo. */
export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-mint-50 pl-3 text-sm text-mint-800 ring-1 ring-inset ring-mint-300/60">
      {label}
      <IconButton label={`Quitar filtro ${label}`} icon={<X size={14} />} onClick={onRemove} />
    </span>
  );
}
