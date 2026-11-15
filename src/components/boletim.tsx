import { nota } from "@/lib/formato";
import { situacao, type LinhaBoletim } from "@/lib/avaliacao";
import type { Escola } from "@/lib/tipos";
import { REGIOES } from "@/lib/tipos";

export function Boletim({ escola, ano, turma, classe, aluno, numero, linhas, faltas }: {
  escola: Escola; ano: string; turma: string; classe: string;
  aluno: { nome: string; numero: string }; numero: number | null;
  linhas: LinhaBoletim[]; faltas: { t: number; j: number } | undefined;
}) {
  const minima = Number(escola.nota_minima);
  const sit = situacao(linhas, minima);
  const cor = (v: number | null) => (v !== null && v < minima ? "text-vermelho" : "");
  return (
    <article className="folha mx-auto max-w-[210mm] break-after-page rounded-lg border border-linha bg-white p-8 text-[13px] text-black shadow-sm print:break-after-page">
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-xs uppercase tracking-wide">República da Guiné-Bissau</p>
          <p className="text-xs">Ministério da Educação Nacional</p>
          <h1 className="mt-2 text-lg font-bold">{escola.nome}</h1>
          <p className="text-xs">{[escola.morada, REGIOES[escola.regiao], escola.telefone].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-right">
          <p className="font-titulo text-xl font-bold">Boletim de Avaliação</p>
          <p>Ano letivo {ano}</p>
        </div>
      </header>
      <section className="my-4 grid grid-cols-2 gap-x-6 gap-y-1">
        <p><span className="text-neutral-600">Aluno(a):</span> <strong>{aluno.nome}</strong></p>
        <p><span className="text-neutral-600">Processo n.º:</span> {aluno.numero}</p>
        <p><span className="text-neutral-600">Classe / Turma:</span> {classe} · {turma}</p>
        <p><span className="text-neutral-600">N.º na turma:</span> {numero ?? "—"}</p>
      </section>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-black px-2 py-1 text-left">Disciplina</th>
            <th className="w-16 border border-black px-2 py-1">1.º T</th>
            <th className="w-16 border border-black px-2 py-1">2.º T</th>
            <th className="w-16 border border-black px-2 py-1">3.º T</th>
            <th className="w-20 border border-black px-2 py-1">Média</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.disciplina_id}>
              <td className="border border-black px-2 py-1">{l.disciplina}</td>
              {[l.t1, l.t2, l.t3].map((v, i) => <td key={i} className={`border border-black px-2 py-1 text-center tabular-nums ${cor(v)}`}>{nota(v)}</td>)}
              <td className={`border border-black px-2 py-1 text-center font-bold tabular-nums ${cor(l.media)}`}>{nota(l.media)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100">
            <td className="border border-black px-2 py-1 font-semibold" colSpan={4}>Média geral</td>
            <td className="border border-black px-2 py-1 text-center font-bold tabular-nums">{nota(sit.media)}</td>
          </tr>
        </tfoot>
      </table>
      <section className="mt-4 grid grid-cols-3 gap-4">
        <p><span className="text-neutral-600">Faltas:</span> {faltas?.t ?? 0} ({faltas?.j ?? 0} justificadas)</p>
        <p><span className="text-neutral-600">Negativas:</span> {sit.negativas}</p>
        <p><span className="text-neutral-600">Situação:</span> <strong>{sit.texto}</strong></p>
      </section>
      <footer className="mt-16 grid grid-cols-3 gap-8 text-center text-xs">
        {["O(A) Diretor(a) de Turma", `O(A) Diretor(a)${escola.diretor ? `\n${escola.diretor}` : ""}`, "O(A) Encarregado(a) de Educação"].map((r) => (
          <div key={r}><div className="mb-1 border-t border-black" /><p className="whitespace-pre-line">{r}</p></div>
        ))}
      </footer>
    </article>
  );
}
