import { Marca } from "@/components/ui";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Marca /></div>
        <div className="rounded-lg border border-linha bg-superficie p-6 shadow-sm">{children}</div>
        <p className="mt-6 text-center text-xs text-suave">Gestão escolar feita para a Guiné-Bissau.</p>
      </div>
    </main>
  );
}
