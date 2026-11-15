"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { exigirPapel, FINANCAS } from "@/lib/sessao";
import { texto } from "@/lib/formato";

export async function escolherAluno(fd: FormData) {
  redirect(`/financas/pagamento?matricula=${fd.get("matricula")}`);
}

export async function registarPagamento(fd: FormData) {
  const s = await exigirPapel(...FINANCAS);
  const supabase = await supabaseServidor();
  const matricula = texto(fd, "matricula")!;
  const tipo = texto(fd, "tipo") ?? "propina";
  const metodo = texto(fd, "metodo") ?? "numerario";
  const referencia = texto(fd, "referencia");
  const data_pagamento = texto(fd, "data_pagamento") ?? undefined;
  const observacao = texto(fd, "observacao");
  const voltar = `/financas/pagamento?matricula=${matricula}`;
  const base = { escola_id: s.escola.id, matricula_id: matricula, metodo, referencia, data_pagamento, observacao, registado_por: s.userId };

  let linhas: (typeof base & { tipo: string; mes_referencia: string | null; valor: number })[];
  if (tipo === "propina") {
    const meses = fd.getAll("meses").map(String);
    if (!meses.length) redirect(voltar + "&erro=" + encodeURIComponent("Escolha pelo menos um mês."));
    const valor = Number(texto(fd, "valor_mes"));
    if (!(valor > 0)) redirect(voltar + "&erro=" + encodeURIComponent("Indique o valor mensal."));
    linhas = meses.map((m) => ({ ...base, tipo, mes_referencia: m, valor }));
  } else {
    const valor = Number(texto(fd, "valor"));
    if (!(valor > 0)) redirect(voltar + "&erro=" + encodeURIComponent("Indique o valor."));
    linhas = [{ ...base, tipo, mes_referencia: null, valor }];
  }
  if (metodo !== "numerario" && metodo !== "outro" && !referencia) {
    redirect(voltar + "&erro=" + encodeURIComponent("Indique a referência da transação (Orange Money, MTN MoMo ou banco)."));
  }

  const { data, error } = await supabase.from("pagamentos").insert(linhas).select("id").order("numero_recibo");
  if (error) redirect(voltar + "&erro=" + encodeURIComponent(error.code === "23505" ? "Um dos meses escolhidos já está pago." : error.message));
  revalidatePath("/financas");
  redirect(`/financas/recibo/${data![0].id}`);
}

export async function anularPagamento(id: string, matricula: string) {
  await exigirPapel("admin", "financeiro");
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("pagamentos").delete().eq("id", id);
  redirect(`/financas/pagamento?matricula=${matricula}&` + (error ? "erro=" + encodeURIComponent(error.message) : "ok=" + encodeURIComponent("Pagamento anulado.")));
}

export async function guardarPrecos(fd: FormData) {
  await exigirPapel("admin", "financeiro");
  const supabase = await supabaseServidor();
  const ids = fd.getAll("classe").map(String);
  await Promise.all(ids.map((id) => supabase.from("classes").update({
    propina_mensal: Number(texto(fd, `p_${id}`) ?? 0),
    taxa_matricula: Number(texto(fd, `t_${id}`) ?? 0),
  }).eq("id", id)));
  redirect("/financas?ok=" + encodeURIComponent("Tabela de propinas atualizada."));
}
