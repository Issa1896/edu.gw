import QRCode from "qrcode";
import { MESES, data, dinheiro, mesAno, nota } from "@/lib/formato";
import type { ConteudoDeclaracao, TipoDeclaracao } from "@/lib/declaracoes";

const LOCAL: Record<string, string> = {
  SAB: "Bissau", BAF: "Bafatá", BIO: "Quinhámel", BOL: "Bolama", CAC: "Cacheu", GAB: "Gabú", OIO: "Farim", QUI: "Buba", TOM: "Catió",
};

export function dataExtenso(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

const TITULOS: Record<TipoDeclaracao, string> = {
  matricula: "Declaração de Matrícula e Frequência",
  aproveitamento: "Declaração de Aproveitamento",
  conclusao: "Declaração de Conclusão de Classe",
  quitacao: "Declaração de Quitação de Propinas",
};

/** O texto da declaração — o mesmo no documento impresso e na página de verificação. */
export function CorpoDeclaracao({ tipo, c, finalidade }: { tipo: TipoDeclaracao; c: ConteudoDeclaracao; finalidade?: string | null }) {
  const a = c.aluno;
  const o = a.genero === "F" ? "a" : "o";
  const identificacao = (
    <>
      <strong>{a.nome}</strong>
      {a.data_nascimento && <>, nascid{o} a {data(a.data_nascimento)}</>}
      {a.naturalidade && <>, natural de {a.naturalidade}</>}
      {a.bi && <>, portador{a.genero === "F" ? "a" : ""} do documento n.º {a.bi}</>}
      , com o processo n.º {a.numero}
    </>
  );
  return (
    <div className="space-y-4 text-justify leading-7">
      <p>
        Para os devidos efeitos, declara-se que {o} alun{o} {identificacao},{" "}
        {tipo === "matricula" && <>se encontra matriculad{o} e a frequentar a <strong>{c.classe}</strong>, turma <strong>{c.turma}</strong>, neste estabelecimento de ensino, no ano letivo <strong>{c.ano_letivo}</strong>.</>}
        {tipo === "aproveitamento" && <>matriculad{o} na <strong>{c.classe}</strong>, turma <strong>{c.turma}</strong>, no ano letivo <strong>{c.ano_letivo}</strong>, obteve as classificações abaixo indicadas, na escala de 0 a 20 valores.</>}
        {tipo === "conclusao" && <>concluiu com aproveitamento a <strong>{c.classe}</strong> (turma {c.turma}) no ano letivo <strong>{c.ano_letivo}</strong>, com a média final de <strong>{nota(c.media_geral)} valores</strong>, encontrando-se apt{o} a matricular-se na classe seguinte.</>}
        {tipo === "quitacao" && <>matriculad{o} na <strong>{c.classe}</strong>, turma <strong>{c.turma}</strong>, no ano letivo <strong>{c.ano_letivo}</strong>, tem as propinas regularizadas até <strong>{mesAno(c.propinas?.ate)}</strong>, não tendo qualquer valor vencido em dívida para com esta escola{c.propinas && c.propinas.total_pago > 0 && <> (total pago no ano: {dinheiro(c.propinas.total_pago)})</>}.</>}
      </p>
      {(tipo === "aproveitamento" || tipo === "conclusao") && c.notas && (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-black px-2 py-1 text-left">Disciplina</th>
              <th className="w-14 border border-black px-1 py-1">1.º T</th>
              <th className="w-14 border border-black px-1 py-1">2.º T</th>
              <th className="w-14 border border-black px-1 py-1">3.º T</th>
              <th className="w-16 border border-black px-1 py-1">Média</th>
            </tr>
          </thead>
          <tbody>
            {c.notas.map((n) => (
              <tr key={n.disciplina}>
                <td className="border border-black px-2 py-0.5">{n.disciplina}</td>
                {[n.t1, n.t2, n.t3].map((v, i) => <td key={i} className="border border-black text-center tabular-nums">{nota(v)}</td>)}
                <td className="border border-black text-center font-bold tabular-nums">{nota(n.media)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={4} className="border border-black px-2 py-1 font-semibold">Média geral · {c.situacao}</td><td className="border border-black text-center font-bold tabular-nums">{nota(c.media_geral)}</td></tr>
          </tfoot>
        </table>
      )}
      <p>{finalidade ? <>A presente declaração destina-se a <strong>{finalidade}</strong> e vai</> : <>Por ser verdade, vai a presente declaração</>} assinada e autenticada com o carimbo em uso nesta escola.</p>
    </div>
  );
}

export async function DocumentoDeclaracao({ tipo, c, finalidade, codigo, emitida_em, emitida_por_nome, urlVerificacao, anulada }: {
  tipo: TipoDeclaracao; c: ConteudoDeclaracao; finalidade: string | null; codigo: string; emitida_em: string;
  emitida_por_nome: string | null; urlVerificacao: string; anulada: boolean;
}) {
  const qr = await QRCode.toString(urlVerificacao, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return (
    <article className="folha relative mx-auto min-h-[297mm] max-w-[210mm] rounded-lg border border-linha bg-white px-[18mm] py-[16mm] text-[14px] text-black shadow-sm">
      {anulada && <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="-rotate-12 border-4 border-red-700 px-6 py-2 text-5xl font-bold text-red-700 opacity-60">ANULADA</span></div>}
      <header className="text-center">
        <p className="text-xs uppercase tracking-widest">República da Guiné-Bissau</p>
        <p className="text-xs">Ministério da Educação Nacional</p>
        <h1 className="mt-3 text-xl font-bold uppercase">{c.escola.nome}</h1>
        {c.escola.morada && <p className="text-xs">{c.escola.morada}</p>}
        <div className="mx-auto mt-4 h-0.5 w-24 bg-black" />
      </header>
      <h2 className="mt-10 text-center font-titulo text-2xl font-bold uppercase tracking-wide">{TITULOS[tipo]}</h2>
      <div className="mt-10"><CorpoDeclaracao tipo={tipo} c={c} finalidade={finalidade} /></div>
      <p className="mt-10 text-right">{LOCAL[c.escola.regiao] ?? "Bissau"}, {dataExtenso(emitida_em)}</p>
      <div className="mt-16 grid grid-cols-2 gap-12 text-center text-xs">
        <div><div className="mb-1 border-t border-black" />O(A) Secretário(a){emitida_por_nome && <><br />{emitida_por_nome}</>}</div>
        <div><div className="mb-1 border-t border-black" />O(A) Diretor(a){c.escola.diretor && <><br />{c.escola.diretor}</>}</div>
      </div>
      <footer className="absolute inset-x-[18mm] bottom-[14mm] flex items-end gap-4 border-t border-neutral-300 pt-3 text-[11px] text-neutral-700">
        <div className="h-20 w-20 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} aria-label="Código QR de verificação" />
        <div>
          <p>Documento emitido digitalmente pelo edu.gw. Código de verificação: <strong className="font-mono text-[13px] text-black">{codigo}</strong></p>
          <p>Confirme a autenticidade lendo o código QR ou em <strong>{urlVerificacao.replace(/^https?:\/\//, "").replace(/\/[^/]+$/, "")}</strong> com o código acima.</p>
        </div>
      </footer>
    </article>
  );
}
