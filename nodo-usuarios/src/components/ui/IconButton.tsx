import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonStyles } from "./styles";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> {
  /** Nombre accesible obligatorio: el botón solo muestra un icono (WCAG 4.1.2). */
  label: string;
  icon: ReactNode;
  tone?: "default" | "danger";
}

export function IconButton({ label, icon, tone = "default", title = label, className = "", ...props }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={title} className={`${tone === "danger" ? buttonStyles.iconDanger : buttonStyles.icon} ${className}`} {...props}>
      {icon}
    </button>
  );
}
