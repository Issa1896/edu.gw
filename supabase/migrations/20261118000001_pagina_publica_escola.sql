-- =====================================================================
-- edu.gw — Página pública de cada escola (notícias para alunos e público)
-- (o valor 'publico' do tipo publico_comunicado é criado na migração
--  20261118000000_pagina_publica_escola_tipo.sql)
-- =====================================================================

alter table escolas add column if not exists slug text unique
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table escolas add column if not exists pagina_publica boolean not null default false;
alter table escolas add column if not exists descricao text;

alter table comunicados add column if not exists resumo text;
alter table comunicados add column if not exists imagem_url text;

-- Lista de escolas com página pública (só campos públicos)
create or replace function escolas_publicas() returns table (slug text, nome text, regiao text, tipo text, descricao text, noticias bigint, ultima timestamptz)
language sql stable security definer set search_path = public as $$
  select e.slug, e.nome, e.regiao, e.tipo, e.descricao,
         count(c.id), max(c.publicado_em)
  from escolas e
  left join comunicados c on c.escola_id = e.id and c.publico = 'publico'
  where e.pagina_publica and e.slug is not null
  group by e.id
  order by max(c.publicado_em) desc nulls last, e.nome
$$;

-- Página de uma escola: dados públicos + notícias públicas
create or replace function escola_publica(p_slug text, p_limite int default 30) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nome', e.nome, 'sigla', e.sigla, 'tipo', e.tipo, 'regiao', e.regiao, 'setor', e.setor,
    'morada', e.morada, 'telefone', e.telefone, 'email', e.email, 'diretor', e.diretor,
    'descricao', e.descricao, 'slug', e.slug,
    'noticias', coalesce((
      select jsonb_agg(n order by n.publicado_em desc) from (
        select c.id, c.titulo, c.resumo, left(c.corpo, 400) as inicio, c.imagem_url, c.publicado_em
        from comunicados c
        where c.escola_id = e.id and c.publico = 'publico'
        order by c.publicado_em desc
        limit least(greatest(p_limite, 1), 100)
      ) n), '[]'::jsonb)
  )
  from escolas e
  where e.slug = lower(p_slug) and e.pagina_publica
$$;

-- Uma notícia pública
create or replace function noticia_publica(p_slug text, p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'escola', e.nome, 'slug', e.slug,
    'id', c.id, 'titulo', c.titulo, 'resumo', c.resumo, 'corpo', c.corpo,
    'imagem_url', c.imagem_url, 'publicado_em', c.publicado_em
  )
  from comunicados c join escolas e on e.id = c.escola_id
  where e.slug = lower(p_slug) and e.pagina_publica and c.id = p_id and c.publico = 'publico'
$$;

revoke execute on function escolas_publicas() from public;
revoke execute on function escola_publica(text, int) from public;
revoke execute on function noticia_publica(text, uuid) from public;
grant execute on function escolas_publicas() to anon, authenticated;
grant execute on function escola_publica(text, int) to anon, authenticated;
grant execute on function noticia_publica(text, uuid) to anon, authenticated;

-- A equipa e os encarregados também veem, no sistema, as notícias públicas da sua escola
create policy com_ler_publico on comunicados for select to authenticated
  using (escola_id = minha_escola() and publico = 'publico');
