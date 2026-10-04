import type { RoleTone } from "../../types";
import { toneStyles } from "./styles";

export function RoleBadge({ name, tone }: { name: string; tone: RoleTone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneStyles[tone].badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneStyles[tone].dot}`} />
      {name}
    </span>
  );
}
