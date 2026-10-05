const logoSizes = {
  sm: "h-8 w-8 rounded-lg text-sm",
  lg: "h-11 w-11 rounded-xl text-lg shadow-sm",
};

/** Marca de Nodo. Es decorativa: el nombre de la app aparece en el texto de al lado o en el título. */
export function Logo({ size = "sm", className = "" }: { size?: keyof typeof logoSizes; className?: string }) {
  return <span className={`grid place-items-center bg-mint-300 font-bold text-mint-950 ${logoSizes[size]} ${className}`} aria-hidden>N</span>;
}
