export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 z-60 max-w-sm rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg" role="status">
      {message}
    </div>
  );
}
