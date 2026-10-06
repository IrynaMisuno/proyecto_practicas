import { statusLabels } from "../../format";
import type { UserStatus } from "../../types";

const statusStyles: Record<UserStatus, string> = {
  active: "bg-mint-50 text-mint-800 ring-mint-600/20",
  invited: "bg-amber-50 text-amber-800 ring-amber-600/20",
  suspended: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}
