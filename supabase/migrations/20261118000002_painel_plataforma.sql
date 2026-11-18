-- =====================================================================
-- edu.gw — Painel da plataforma (equipa GW Digital): todos os cadastros
-- e todas as escolas. Só para utilizadores em plataforma_admins.
-- =====================================================================
create or replace function plataforma_cadastros()
returns table (user_id uuid, email text, criado_em timestamptz, ultimo_acesso timestamptz, confirmado boolean,
               nome text, papel papel_utilizador, ativo boolean, escola_id uuid, escola text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not e_plataforma_admin() then raise exception 'Sem permissão'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at, (u.email_confirmed_at is not null),
           p.nome, p.papel, p.ativo, e.id, e.nome
    from auth.users u
    left join public.perfis p on p.user_id = u.id
    left join public.escolas e on e.id = p.escola_id
    order by u.created_at desc;
end $$;

create or replace function plataforma_escolas()
returns table (id uuid, nome text, regiao text, tipo text, telefone text, email text, criado_em timestamptz,
               slug text, pagina_publica boolean, equipa bigint, encarregados bigint, alunos bigint,
               matriculas_ativas bigint, pagamentos bigint, declaracoes bigint, ultimo_acesso timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not e_plataforma_admin() then raise exception 'Sem permissão'; end if;
  return query
    select e.id, e.nome, e.regiao, e.tipo, e.telefone, e.email, e.criado_em, e.slug, e.pagina_publica,
      (select count(*) from perfis p where p.escola_id = e.id and p.papel <> 'encarregado'),
      (select count(*) from perfis p where p.escola_id = e.id and p.papel = 'encarregado'),
      (select count(*) from alunos a where a.escola_id = e.id),
      (select count(*) from matriculas m where m.escola_id = e.id and m.estado = 'ativa'),
      (select count(*) from pagamentos g where g.escola_id = e.id),
      (select count(*) from declaracoes d where d.escola_id = e.id),
      (select max(u.last_sign_in_at) from perfis p join auth.users u on u.id = p.user_id where p.escola_id = e.id)
    from escolas e
    order by e.criado_em desc;
end $$;

revoke execute on function plataforma_cadastros() from public, anon;
revoke execute on function plataforma_escolas() from public, anon;
grant execute on function plataforma_cadastros() to authenticated;
grant execute on function plataforma_escolas() to authenticated;
