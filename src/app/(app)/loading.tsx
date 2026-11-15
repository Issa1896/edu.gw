export default function Carregando() {
  return (
    <div className="animate-pulse space-y-4" aria-label="A carregar">
      <div className="h-8 w-48 rounded bg-superficie-2" />
      <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-superficie-2" />)}</div>
      <div className="h-64 rounded-lg bg-superficie-2" />
    </div>
  );
}
