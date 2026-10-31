interface WorkspaceStateProps {
  title: string;
  description: string;
  error?: boolean;
  onRetry?: () => void;
}

/** Shared loading, empty and error presentation for workspace collections. */
export function WorkspaceState({ title, description, error, onRetry }: WorkspaceStateProps) {
  return (
    <section role={error ? 'alert' : 'status'} className="rounded-xl border border-zinc-800 bg-[#121215] p-6 space-y-3">
      <h2 className="font-semibold text-zinc-100">{title}</h2>
      <p className="text-sm text-zinc-400">{description}</p>
      {onRetry && <button type="button" onClick={onRetry} className="rounded border border-cyan-700 bg-cyan-950 px-4 py-2 text-sm text-cyan-200">Retry loading</button>}
    </section>
  );
}
