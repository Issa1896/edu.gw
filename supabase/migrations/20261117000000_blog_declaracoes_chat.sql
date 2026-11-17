-- =====================================================================
-- edu.gw — Blog da plataforma, declarações digitais verificáveis e
-- controlo de uso do assistente IA.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Administradores da plataforma (equipa GW Digital, não das escolas)
-- ---------------------------------------------------------------------
create table plataforma_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table plataforma_admins enable row level security;
create policy plat_proprio on plataforma_admins for select to authenticated using (user_id = auth.uid());

create or replace function e_plataforma_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from plataforma_admins where user_id = auth.uid())
$$;
revoke execute on function e_plataforma_admin() from public, anon;
grant execute on function e_plataforma_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------
create table artigos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo text not null,
  resumo text,
  corpo text not null default '',
  categoria text not null default 'Novidades',
  capa_url text,
  autor_nome text,
  publicado boolean not null default false,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on artigos (publicado, publicado_em desc);
alter table artigos enable row level security;

create policy artigos_publicos on artigos for select to anon, authenticated using (publicado);
create policy artigos_admin on artigos for all to authenticated
  using (e_plataforma_admin()) with check (e_plataforma_admin());

create or replace function carimbar_artigo() returns trigger
language plpgsql set search_path = public as $$
begin
  new.atualizado_em := now();
  if new.publicado and new.publicado_em is null then new.publicado_em := now(); end if;
  return new;
end $$;
create trigger artigos_carimbo before insert or update on artigos
  for each row execute function carimbar_artigo();
revoke execute on function carimbar_artigo() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Declarações digitais
-- ---------------------------------------------------------------------
create table declaracoes (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  matricula_id uuid not null references matriculas(id) on delete cascade,
  codigo text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  tipo text not null check (tipo in ('matricula', 'aproveitamento', 'conclusao', 'quitacao')),
  finalidade text,
  conteudo jsonb not null,
  emitida_por uuid references auth.users(id) on delete set null,
  emitida_por_nome text,
  emitida_em timestamptz not null default now(),
  anulada_em timestamptz,
  motivo_anulacao text
);
create index on declaracoes (escola_id, emitida_em desc);
create index on declaracoes (matricula_id);

create trigger declaracoes_escola before insert or update on declaracoes
  for each row execute function verificar_escola_matricula();

alter table declaracoes enable row level security;

create policy decl_equipa on declaracoes for select to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria', 'financeiro'));
create policy decl_encarregado on declaracoes for select to authenticated
  using (matricula_id in (select id from matriculas where aluno_id in (select meus_educandos())));
create policy decl_emitir on declaracoes for insert to authenticated
  with check (escola_id = minha_escola() and emitida_por = auth.uid() and (
    tem_papel('admin', 'secretaria') or (tem_papel('financeiro') and tipo = 'quitacao')));
create policy decl_anular on declaracoes for update to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

-- Verificação pública (QR code): só pelo código, devolve o essencial
create or replace function verificar_declaracao(p_codigo text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'codigo', d.codigo,
    'tipo', d.tipo,
    'escola', e.nome,
    'regiao', e.regiao,
    'emitida_em', d.emitida_em,
    'anulada_em', d.anulada_em,
    'motivo_anulacao', d.motivo_anulacao,
    'conteudo', d.conteudo
  )
  from declaracoes d join escolas e on e.id = d.escola_id
  where d.codigo = upper(trim(p_codigo))
$$;
revoke execute on function verificar_declaracao(text) from public;
grant execute on function verificar_declaracao(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Uso do assistente IA (limite diário por chave: utilizador ou IP)
-- ---------------------------------------------------------------------
create table chat_uso (
  chave text not null,
  dia date not null default current_date,
  contagem integer not null default 0,
  primary key (chave, dia)
);
alter table chat_uso enable row level security; -- sem políticas: só via função

create or replace function registar_uso_chat(p_chave text, p_limite integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  if p_chave is null or length(p_chave) > 100 or p_limite < 1 or p_limite > 1000 then return false; end if;
  insert into chat_uso (chave, dia, contagem) values (p_chave, current_date, 1)
  on conflict (chave, dia) do update set contagem = chat_uso.contagem + 1
  returning contagem into v;
  return v <= p_limite;
end $$;
revoke execute on function registar_uso_chat(text, integer) from public;
grant execute on function registar_uso_chat(text, integer) to anon, authenticated;
