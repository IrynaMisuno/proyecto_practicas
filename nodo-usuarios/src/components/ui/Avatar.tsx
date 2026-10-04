import { getInitials } from "../../format";

const avatarTones = {
  slate: "bg-slate-100 text-slate-700",
  indigo: "bg-indigo-50 text-indigo-700",
};

/** Iniciales en un círculo. Es decorativo: el nombre siempre aparece al lado. */
export function Avatar({ name, tone = "indigo" }: { name: string; tone?: keyof typeof avatarTones }) {
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatarTones[tone]}`} aria-hidden>
      {getInitials(name)}
    </span>
  );
}
