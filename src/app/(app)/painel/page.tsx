import Link from "next/link";
import { Aviso, BotaoLink, Cabecalho, Cartao, Estatistica, Vazio } from "@/components/ui";
import { exigirPapel, EQUIPA } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/server";
import { data, dinheiro, hojeISO, mesAno } from "@/lib/formato";

export const metadata = { title: "Painel" };

export default async function Painel({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await exigirPapel(...EQUIPA);
  const supabase = await supabaseServidor();
  const hoje = hojeISO();
  const mes = hoje.slice(0, 7) + "-01";
  const papel = s.perfil.papel;
  const veFinancas = ["admin", "financeiro", "secretaria"].includes(papel);

  if (!s.ano) {
    return (
      <>
        <Cabecalho titulo={`Olá, ${s.perfil.nome.split(" ")[0]}`} />
        <Vazio titulo="Não há ano letivo ativo">
          {papel === "admin" ? <BotaoLink href="/configuracoes">Criar ano letivo</BotaoLink> : "Peça à direção que defina o ano letivo atual."}
        </Vazio>
      </>
    );
  }

  const [mats, turmas, faltasHoje, pagMes, comunicados, minhas] = await Promise.all([
    supabase.from("matriculas").select("id, bolsa_percentagem, alunos(genero), turmas(classes(propina_mensal))").eq("ano_letivo_id", s.ano.id).eq("estado", "ativa"),
    supabase.from("turmas").select("id", { count: "exact", head: true }).eq("ano_letivo_id", s.ano.id),
    supabase.from("faltas").select("id", { count: "exact", head: true }).eq("data", hoje),
    veFinancas
      ? supabase.from("pagamentos").select("valor, matricula_id, tipo, mes_referencia, data_pagamento").gte("data_pagamento", mes)
      : Promise.resolve({ data: [] as { valor: number; matricula_id: string; tipo: string; mes_referencia: string | null }[] }),
    supabase.from("comunicados").select("id, titulo, publicado_em").order("publicado_em", { ascending: false }).limit(4),
    papel === "professor"
      ? supabase.from("turma_disciplinas").select("turma_id, disciplina_id, turmas!inner(nome, ano_letivo_id), disciplinas(nome)").eq("professor_id", s.userId).eq("turmas.ano_letivo_id", s.ano.id)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const ativas = mats.data ?? [];
  const raparigas = ativas.filter((m) => (m.alunos as unknown as { genero: string } | null)?.genero === "F").length;
  const recebido = (pagMes.data ?? []).reduce((t, p) => t + p.valor, 0);

  // Propinas do mês corrente ainda por pagar (ignora bolsas de 100% e classes sem propina)
  const pagaramMes = new Set((pagMes.data ?? []).filter((p) => p.tipo === "propina" && p.mes_referencia === mes).map((p) => p.matricula_id));
  const devedores = ativas.filter((m) => {
    const propina = (m.turmas as unknown as { classes: { propina_mensal: number } } | null)?.classes?.propina_mensal ?? 0;
    return propina > 0 && m.bolsa_percentagem < 100 && !pagaramMes.has(m.id);
  }).length;

  return (
    <>
      <Aviso ok={sp.ok} />
      <Cabecalho titulo={`Olá, ${s.perfil.nome.split(" ")[0]}`} subtitulo={`${s.escola.nome} · Ano letivo ${s.ano.nome} · ${data(hoje)}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estatistica rotulo="Alunos matriculados" valor={ativas.length} detalhe={`${raparigas} raparigas · ${ativas.length - raparigas} rapazes`} tom="sucesso" />
        <Estatistica rotulo="Turmas" valor={turmas.count ?? 0} />
        <Estatistica rotulo="Faltas registadas hoje" valor={faltasHoje.count ?? 0} tom={(faltasHoje.count ?? 0) > 0 ? "aviso" : "neutro"} />
        {veFinancas ? (
          <Estatistica rotulo={`Recebido em ${mesAno(mes)}`} valor={dinheiro(recebido)} detalhe={`${devedores} alunos sem propina do mês`} tom={devedores > 0 ? "perigo" : "sucesso"} />
        ) : (
          <Estatistica rotulo="Comunicados" valor={comunicados.data?.length ?? 0} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {papel === "professor" ? (
          <Cartao titulo="As minhas turmas">
            {(minhas.data ?? []).length === 0 ? (
              <p className="text-sm text-suave">Ainda não tem turmas atribuídas. A secretaria atribui professores em Turmas.</p>
            ) : (
              <ul className="divide-y divide-linha">
                {(minhas.data as unknown as { turma_id: string; disciplina_id: string; turmas: { nome: string }; disciplinas: { nome: string } }[]).map((m) => (
                  <li key={m.turma_id + m.disciplina_id} className="flex items-center justify-between py-2 text-sm">
                    <span><strong>{m.turmas.nome}</strong> · {m.disciplinas.nome}</span>
                    <span className="flex gap-3">
                      <Link className="text-verde hover:underline" href={`/notas?turma=${m.turma_id}&disciplina=${m.disciplina_id}`}>Notas</Link>
                      <Link className="text-verde hover:underline" href={`/faltas?turma=${m.turma_id}&disciplina=${m.disciplina_id}`}>Faltas</Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        ) : (
          <Cartao titulo="Ações rápidas">
            <div className="grid gap-2 sm:grid-cols-2">
              {["admin", "secretaria"].includes(papel) && <BotaoLink href="/alunos/novo">Nova matrícula</BotaoLink>}
              {veFinancas && <BotaoLink href="/financas/pagamento" variante="secundario">Registar pagamento</BotaoLink>}
              {["admin", "secretaria"].includes(papel) && <BotaoLink href="/turmas" variante="secundario">Gerir turmas</BotaoLink>}
              {veFinancas && <BotaoLink href="/financas/atrasos" variante="secundario">Propinas em atraso</BotaoLink>}
              {["admin", "secretaria"].includes(papel) && <BotaoLink href="/comunicados" variante="secundario">Novo comunicado</BotaoLink>}
              {["admin", "secretaria"].includes(papel) && <BotaoLink href="/boletins" variante="secundario">Imprimir boletins</BotaoLink>}
            </div>
          </Cartao>
        )}
        <Cartao titulo="Comunicados recentes" acao={<Link href="/comunicados" className="text-sm text-verde hover:underline">Ver todos</Link>}>
          {(comunicados.data ?? []).length === 0 ? (
            <p className="text-sm text-suave">Sem comunicados.</p>
          ) : (
            <ul className="divide-y divide-linha">
              {comunicados.data!.map((c) => (
                <li key={c.id} className="flex justify-between gap-4 py-2 text-sm">
                  <span className="font-medium">{c.titulo}</span>
                  <span className="shrink-0 text-suave">{data(c.publicado_em)}</span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  );
}
