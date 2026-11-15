-- =====================================================================
-- edu.gw — Sistema de Gestão Escolar para a Guiné-Bissau
-- Esquema inicial: multi-escola, papéis, matrículas, notas (0–20),
-- faltas, propinas (FCFA), comunicados e portal do encarregado.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type papel_utilizador as enum ('admin', 'secretaria', 'professor', 'financeiro', 'encarregado');
create type turno as enum ('manha', 'tarde', 'noite');
create type estado_matricula as enum ('ativa', 'transferida', 'desistente', 'concluida');
create type metodo_pagamento as enum ('numerario', 'orange_money', 'mtn_momo', 'transferencia', 'outro');
create type genero as enum ('M', 'F');
create type publico_comunicado as enum ('todos', 'professores', 'encarregados', 'turma');

-- ---------------------------------------------------------------------
-- Escolas e utilizadores
-- ---------------------------------------------------------------------
create table escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sigla text,
  tipo text not null default 'privada' check (tipo in ('publica', 'privada', 'comunitaria', 'confessional', 'autogestao')),
  regiao text not null default 'SAB',
  setor text,
  morada text,
  telefone text,
  email text,
  nif text,
  diretor text,
  logo_url text,
  moeda text not null default 'XOF',
  nota_minima numeric(4,2) not null default 10,
  proximo_recibo integer not null default 1,
  criado_em timestamptz not null default now()
);

create table perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  escola_id uuid not null references escolas(id) on delete cascade,
  papel papel_utilizador not null,
  nome text not null,
  telefone text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index on perfis (escola_id);

create table convites (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  email text not null,
  nome text not null,
  papel papel_utilizador not null,
  encarregado_id uuid,
  aceite_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (escola_id, email)
);

-- ---------------------------------------------------------------------
-- Estrutura académica
-- ---------------------------------------------------------------------
create table anos_letivos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  nome text not null,             -- ex.: 2026/2027
  inicio date not null,
  fim date not null,
  atual boolean not null default false,
  unique (escola_id, nome)
);
create unique index um_ano_atual on anos_letivos (escola_id) where atual;

create table classes (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  nome text not null,             -- ex.: 7.ª Classe
  ordem smallint not null,
  ciclo text not null,            -- ex.: Ensino Básico — 3.º Ciclo
  propina_mensal integer not null default 0,
  taxa_matricula integer not null default 0,
  unique (escola_id, ordem)
);

create table disciplinas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  nome text not null,
  sigla text,
  unique (escola_id, nome)
);

create table turmas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  ano_letivo_id uuid not null references anos_letivos(id) on delete cascade,
  classe_id uuid not null references classes(id) on delete restrict,
  nome text not null,             -- ex.: 7.ª A
  turno turno not null default 'manha',
  sala text,
  capacidade smallint not null default 45,
  diretor_turma uuid references perfis(user_id) on delete set null,
  unique (ano_letivo_id, nome)
);

create table turma_disciplinas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  professor_id uuid references perfis(user_id) on delete set null,
  carga_semanal smallint,
  unique (turma_id, disciplina_id)
);

-- ---------------------------------------------------------------------
-- Alunos e encarregados
-- ---------------------------------------------------------------------
create table alunos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  numero text not null,           -- n.º de processo
  nome text not null,
  genero genero,
  data_nascimento date,
  naturalidade text,
  nacionalidade text default 'Guineense',
  linguas text,                   -- línguas faladas em casa (ex.: Kriol, Balanta, Fula)
  morada text,
  bi text,                        -- n.º de BI / cédula, quando houver
  observacoes text,
  foto_url text,
  criado_em timestamptz not null default now(),
  unique (escola_id, numero)
);
create index on alunos (escola_id, nome);

create table encarregados (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  nome text not null,
  parentesco text,
  telefone text,
  telefone2 text,
  email text,
  profissao text,
  morada text,
  user_id uuid references auth.users(id) on delete set null
);

alter table convites add constraint convites_encarregado_fk
  foreign key (encarregado_id) references encarregados(id) on delete cascade;

create table aluno_encarregados (
  aluno_id uuid not null references alunos(id) on delete cascade,
  encarregado_id uuid not null references encarregados(id) on delete cascade,
  escola_id uuid not null references escolas(id) on delete cascade,
  principal boolean not null default true,
  primary key (aluno_id, encarregado_id)
);

create table matriculas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete restrict,
  ano_letivo_id uuid not null references anos_letivos(id) on delete cascade,
  numero_turma smallint,
  estado estado_matricula not null default 'ativa',
  data_matricula date not null default current_date,
  bolsa_percentagem smallint not null default 0 check (bolsa_percentagem between 0 and 100),
  unique (aluno_id, ano_letivo_id)
);
create index on matriculas (turma_id);

-- ---------------------------------------------------------------------
-- Avaliação e assiduidade
-- ---------------------------------------------------------------------
create table notas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  matricula_id uuid not null references matriculas(id) on delete cascade,
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  trimestre smallint not null check (trimestre between 1 and 3),
  nota numeric(4,2) check (nota between 0 and 20),
  observacao text,
  lancado_por uuid references auth.users(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  unique (matricula_id, disciplina_id, trimestre)
);

create table faltas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  matricula_id uuid not null references matriculas(id) on delete cascade,
  disciplina_id uuid references disciplinas(id) on delete cascade,
  data date not null,
  justificada boolean not null default false,
  motivo text,
  registado_por uuid references auth.users(id) on delete set null,
  unique nulls not distinct (matricula_id, disciplina_id, data)
);
create index on faltas (escola_id, data);

-- ---------------------------------------------------------------------
-- Finanças (FCFA)
-- ---------------------------------------------------------------------
create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  matricula_id uuid not null references matriculas(id) on delete cascade,
  tipo text not null default 'propina' check (tipo in ('propina', 'matricula', 'exame', 'uniforme', 'outro')),
  mes_referencia date,            -- 1.º dia do mês pago, para propinas
  valor integer not null check (valor > 0),
  metodo metodo_pagamento not null default 'numerario',
  referencia text,                -- ID da transação Orange Money / MTN MoMo
  numero_recibo integer,
  data_pagamento date not null default current_date,
  observacao text,
  registado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index on pagamentos (escola_id, data_pagamento);
create unique index propina_unica on pagamentos (matricula_id, mes_referencia) where tipo = 'propina';

-- ---------------------------------------------------------------------
-- Comunicação
-- ---------------------------------------------------------------------
create table comunicados (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references escolas(id) on delete cascade,
  titulo text not null,
  corpo text not null,
  publico publico_comunicado not null default 'todos',
  turma_id uuid references turmas(id) on delete cascade,
  autor_id uuid references auth.users(id) on delete set null,
  publicado_em timestamptz not null default now()
);

-- =====================================================================
-- Funções auxiliares (security definer: evitam recursão nas políticas)
-- =====================================================================
create or replace function minha_escola() returns uuid
language sql stable security definer set search_path = public as $$
  select escola_id from perfis where user_id = auth.uid() and ativo
$$;

create or replace function meu_papel() returns papel_utilizador
language sql stable security definer set search_path = public as $$
  select papel from perfis where user_id = auth.uid() and ativo
$$;

create or replace function tem_papel(variadic papeis papel_utilizador[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = any(papeis) from perfis where user_id = auth.uid() and ativo), false)
$$;

-- Matrículas dos educandos do encarregado autenticado
create or replace function meus_educandos() returns setof uuid
language sql stable security definer set search_path = public as $$
  select ae.aluno_id from aluno_encarregados ae
  join encarregados e on e.id = ae.encarregado_id
  where e.user_id = auth.uid()
$$;

-- O professor leciona esta turma/disciplina?
create or replace function leciona(p_turma uuid, p_disciplina uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from turma_disciplinas
    where turma_id = p_turma and disciplina_id = p_disciplina and professor_id = auth.uid()
  ) or exists (select 1 from turmas where id = p_turma and diretor_turma = auth.uid() and p_disciplina is null)
$$;

create or replace function turma_da_matricula(p_matricula uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select turma_id from matriculas where id = p_matricula
$$;

-- =====================================================================
-- Integridade: escola_id dos filhos tem de coincidir com o do pai
-- =====================================================================
create or replace function verificar_escola_matricula() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select escola_id from matriculas where id = new.matricula_id) is distinct from new.escola_id then
    raise exception 'Matrícula de outra escola';
  end if;
  return new;
end $$;

create trigger notas_escola before insert or update on notas
  for each row execute function verificar_escola_matricula();
create trigger faltas_escola before insert or update on faltas
  for each row execute function verificar_escola_matricula();
create trigger pagamentos_escola before insert or update on pagamentos
  for each row execute function verificar_escola_matricula();

-- Número sequencial de recibo por escola
create or replace function atribuir_recibo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update escolas set proximo_recibo = proximo_recibo + 1
   where id = new.escola_id
   returning proximo_recibo - 1 into new.numero_recibo;
  return new;
end $$;
create trigger pagamentos_recibo before insert on pagamentos
  for each row execute function atribuir_recibo();

create or replace function carimbar_nota() returns trigger
language plpgsql set search_path = public as $$
begin
  new.atualizado_em := now();
  new.lancado_por := auth.uid();
  return new;
end $$;
create trigger notas_carimbo before insert or update on notas
  for each row execute function carimbar_nota();

-- =====================================================================
-- RPC: criar escola (onboarding) e aceitar convite
-- =====================================================================
create or replace function criar_escola(
  p_nome text, p_regiao text, p_tipo text, p_nome_admin text, p_telefone text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_escola uuid;
  v_ano int := extract(year from current_date)::int;
  v_inicio int;
begin
  if auth.uid() is null then raise exception 'Sessão inválida'; end if;
  if exists (select 1 from perfis where user_id = auth.uid()) then
    raise exception 'Esta conta já pertence a uma escola';
  end if;

  insert into escolas (nome, regiao, tipo, telefone)
  values (p_nome, p_regiao, p_tipo, p_telefone) returning id into v_escola;

  insert into perfis (user_id, escola_id, papel, nome, telefone)
  values (auth.uid(), v_escola, 'admin', p_nome_admin, p_telefone);

  -- Ano letivo: outubro a julho
  v_inicio := case when extract(month from current_date) >= 9 then v_ano else v_ano - 1 end;
  insert into anos_letivos (escola_id, nome, inicio, fim, atual)
  values (v_escola, v_inicio || '/' || (v_inicio + 1),
          make_date(v_inicio, 10, 1), make_date(v_inicio + 1, 7, 31), true);

  -- Classes do sistema educativo guineense
  insert into classes (escola_id, nome, ordem, ciclo)
  select v_escola, o || '.ª Classe', o,
    case
      when o <= 4 then 'Ensino Básico — 1.º Ciclo'
      when o <= 6 then 'Ensino Básico — 2.º Ciclo'
      when o <= 9 then 'Ensino Básico — 3.º Ciclo'
      else 'Ensino Secundário'
    end
  from generate_series(1, 12) o;

  insert into disciplinas (escola_id, nome, sigla) values
    (v_escola, 'Língua Portuguesa', 'LP'),
    (v_escola, 'Matemática', 'MAT'),
    (v_escola, 'Ciências Integradas', 'CI'),
    (v_escola, 'Ciências Sociais', 'CS'),
    (v_escola, 'História', 'HIS'),
    (v_escola, 'Geografia', 'GEO'),
    (v_escola, 'Biologia', 'BIO'),
    (v_escola, 'Física', 'FIS'),
    (v_escola, 'Química', 'QUI'),
    (v_escola, 'Língua Francesa', 'FR'),
    (v_escola, 'Língua Inglesa', 'ING'),
    (v_escola, 'Educação Física', 'EF'),
    (v_escola, 'Educação Visual e Tecnológica', 'EVT'),
    (v_escola, 'Formação Pessoal e Social', 'FPS');

  return v_escola;
end $$;

create or replace function aceitar_convite() returns boolean
language plpgsql security definer set search_path = public as $$
declare
  c convites;
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if auth.uid() is null or v_email is null then return false; end if;
  if exists (select 1 from perfis where user_id = auth.uid()) then return true; end if;

  select * into c from convites
   where lower(email) = v_email and aceite_em is null
   order by criado_em desc limit 1;
  if not found then return false; end if;

  insert into perfis (user_id, escola_id, papel, nome)
  values (auth.uid(), c.escola_id, c.papel, c.nome);

  if c.encarregado_id is not null then
    update encarregados set user_id = auth.uid() where id = c.encarregado_id;
  end if;

  update convites set aceite_em = now() where id = c.id;
  return true;
end $$;


-- =====================================================================
-- Vistas de apoio
-- =====================================================================
create or replace view medias_disciplina with (security_invoker = true) as
select n.escola_id, n.matricula_id, n.disciplina_id,
       max(n.nota) filter (where trimestre = 1) as t1,
       max(n.nota) filter (where trimestre = 2) as t2,
       max(n.nota) filter (where trimestre = 3) as t3,
       round(avg(n.nota), 1) as media
from notas n
group by n.escola_id, n.matricula_id, n.disciplina_id;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table escolas enable row level security;
alter table perfis enable row level security;
alter table convites enable row level security;
alter table anos_letivos enable row level security;
alter table classes enable row level security;
alter table disciplinas enable row level security;
alter table turmas enable row level security;
alter table turma_disciplinas enable row level security;
alter table alunos enable row level security;
alter table encarregados enable row level security;
alter table aluno_encarregados enable row level security;
alter table matriculas enable row level security;
alter table notas enable row level security;
alter table faltas enable row level security;
alter table pagamentos enable row level security;
alter table comunicados enable row level security;

-- Escola: todos os membros leem; só admin altera
create policy escola_ler on escolas for select to authenticated using (id = minha_escola());
create policy escola_admin on escolas for update to authenticated using (id = minha_escola() and tem_papel('admin'));

-- Perfis: membros veem a equipa; admin gere
create policy perfis_ler on perfis for select to authenticated using (escola_id = minha_escola());
create policy perfis_admin on perfis for update to authenticated using (escola_id = minha_escola() and tem_papel('admin'));
create policy perfis_admin_del on perfis for delete to authenticated using (escola_id = minha_escola() and tem_papel('admin') and user_id <> auth.uid());

create policy convites_admin on convites for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and (
    tem_papel('admin')
    or (tem_papel('secretaria') and papel in ('secretaria', 'professor', 'encarregado'))));

-- Estrutura: todos os membros leem; admin/secretaria escrevem
create policy anos_ler on anos_letivos for select to authenticated using (escola_id = minha_escola());
create policy anos_gerir on anos_letivos for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin'))
  with check (escola_id = minha_escola() and tem_papel('admin'));

create policy classes_ler on classes for select to authenticated using (escola_id = minha_escola());
create policy classes_gerir on classes for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'financeiro'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'financeiro'));

create policy disc_ler on disciplinas for select to authenticated using (escola_id = minha_escola());
create policy disc_gerir on disciplinas for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

create policy turmas_ler on turmas for select to authenticated using (escola_id = minha_escola());
create policy turmas_gerir on turmas for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

create policy td_ler on turma_disciplinas for select to authenticated using (escola_id = minha_escola());
create policy td_gerir on turma_disciplinas for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

-- Alunos: equipa lê; encarregado lê só os seus educandos; secretaria escreve
create policy alunos_equipa on alunos for select to authenticated
  using (escola_id = minha_escola() and not tem_papel('encarregado'));
create policy alunos_encarregado on alunos for select to authenticated
  using (id in (select meus_educandos()));
create policy alunos_gerir on alunos for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

create policy enc_equipa on encarregados for select to authenticated
  using (escola_id = minha_escola() and not tem_papel('encarregado'));
create policy enc_proprio on encarregados for select to authenticated using (user_id = auth.uid());
create policy enc_gerir on encarregados for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

create policy ae_equipa on aluno_encarregados for select to authenticated
  using (escola_id = minha_escola() and not tem_papel('encarregado'));
create policy ae_proprio on aluno_encarregados for select to authenticated using (aluno_id in (select meus_educandos()));
create policy ae_gerir on aluno_encarregados for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

create policy mat_equipa on matriculas for select to authenticated
  using (escola_id = minha_escola() and not tem_papel('encarregado'));
create policy mat_encarregado on matriculas for select to authenticated using (aluno_id in (select meus_educandos()));
create policy mat_gerir on matriculas for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

-- Notas: equipa lê; professor lança nas suas turmas/disciplinas; admin/secretaria corrigem
create policy notas_equipa on notas for select to authenticated
  using (escola_id = minha_escola() and not tem_papel('encarregado'));
create policy notas_encarregado on notas for select to authenticated
  using (matricula_id in (select id from matriculas where aluno_id in (select meus_educandos())));
create policy notas_gerir on notas for all to authenticated
  using (escola_id = minha_escola() and (
    tem_papel('admin', 'secretaria')
    or (tem_papel('professor') and leciona(turma_da_matricula(matricula_id), disciplina_id))))
  with check (escola_id = minha_escola() and (
    tem_papel('admin', 'secretaria')
    or (tem_papel('professor') and leciona(turma_da_matricula(matricula_id), disciplina_id))));

create policy faltas_equipa on faltas for select to authenticated
  using (escola_id = minha_escola() and not tem_papel('encarregado'));
create policy faltas_encarregado on faltas for select to authenticated
  using (matricula_id in (select id from matriculas where aluno_id in (select meus_educandos())));
create policy faltas_gerir on faltas for all to authenticated
  using (escola_id = minha_escola() and (
    tem_papel('admin', 'secretaria')
    or (tem_papel('professor') and leciona(turma_da_matricula(matricula_id), disciplina_id))))
  with check (escola_id = minha_escola() and (
    tem_papel('admin', 'secretaria')
    or (tem_papel('professor') and leciona(turma_da_matricula(matricula_id), disciplina_id))));

-- Pagamentos: admin/financeiro/secretaria; encarregado vê os do seu educando
create policy pag_equipa on pagamentos for select to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'financeiro', 'secretaria'));
create policy pag_encarregado on pagamentos for select to authenticated
  using (matricula_id in (select id from matriculas where aluno_id in (select meus_educandos())));
create policy pag_gerir on pagamentos for insert to authenticated
  with check (escola_id = minha_escola() and tem_papel('admin', 'financeiro', 'secretaria'));
create policy pag_anular on pagamentos for delete to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'financeiro'));

-- Comunicados: todos leem conforme o público; admin/secretaria publicam
create policy com_ler on comunicados for select to authenticated using (
  escola_id = minha_escola() and (
    publico = 'todos'
    or (publico = 'professores' and not tem_papel('encarregado'))
    or (publico = 'encarregados' and (tem_papel('encarregado') or tem_papel('admin', 'secretaria')))
    or (publico = 'turma' and (not tem_papel('encarregado')
        or turma_id in (select turma_id from matriculas where aluno_id in (select meus_educandos()))))
  ));
create policy com_gerir on comunicados for all to authenticated
  using (escola_id = minha_escola() and tem_papel('admin', 'secretaria'))
  with check (escola_id = minha_escola() and tem_papel('admin', 'secretaria'));

-- Cada utilizador pode atualizar o seu nome e telefone (sem mexer no papel)
create or replace function atualizar_meu_perfil(p_nome text, p_telefone text) returns void
language sql security definer set search_path = public as $$
  update perfis set nome = p_nome, telefone = p_telefone where user_id = auth.uid()
$$;

-- Funções só para utilizadores autenticados (nunca anónimos)
revoke execute on function minha_escola(), meu_papel(), tem_papel(papel_utilizador[]), meus_educandos(),
  leciona(uuid, uuid), turma_da_matricula(uuid), criar_escola(text, text, text, text, text),
  aceitar_convite(), atualizar_meu_perfil(text, text) from public, anon;
grant execute on function minha_escola(), meu_papel(), tem_papel(papel_utilizador[]), meus_educandos(),
  leciona(uuid, uuid), turma_da_matricula(uuid), criar_escola(text, text, text, text, text),
  aceitar_convite(), atualizar_meu_perfil(text, text) to authenticated;
revoke execute on function verificar_escola_matricula(), atribuir_recibo(), carimbar_nota() from public, anon, authenticated;
