import type { User } from "../types";

/** Totales de usuarios por estado. */
export function UserStats({ users }: { users: User[] }) {
  const stats = [
    { label: "Usuarios", value: users.length },
    { label: "Activos", value: users.filter((user) => user.status === "active").length },
    { label: "Invitados", value: users.filter((user) => user.status === "invited").length },
    { label: "Suspendidos", value: users.filter((user) => user.status === "suspended").length },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-baseline justify-between gap-2 rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-slate-200">
          <dt className="text-sm text-slate-600">{stat.label}</dt>
          <dd className="text-lg font-semibold text-slate-900">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
