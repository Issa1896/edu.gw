-- =====================================================================
-- edu.gw — dados de demonstração (para apresentar o sistema a escolas)
-- Uso, no SQL Editor do Supabase, DEPOIS de criar a sua escola na app:
--   1) cole este ficheiro inteiro e execute (cria a função);
--   2) select carregar_demo((select id from escolas where nome = 'Nome da sua escola'));
-- Cria 3 turmas, 60 alunos com encarregados, notas do 1.º trimestre,
-- faltas e propinas pagas, no ano letivo atual da escola.
-- =====================================================================

create or replace function carregar_demo(p_escola uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ano anos_letivos;
  v_turma uuid;
  v_aluno uuid;
  v_enc uuid;
  v_mat uuid;
  v_t record;
  v_d record;
  i int;
  n int := 0;
  nomes text[] := array['Aua','Braima','Cadi','Djibril','Fatumata','Iaia','Mariama','Sene','Tchuda','Nhima',
                        'Quintino','Adja','Bubacar','Domingas','Edmilson','Filomena','Gabriel','Helena','Ianick','Joana'];
  apelidos text[] := array['Djaló','Sané','Baldé','Na Ntchala','Mendes','Có','Sambú','Embaló','Gomes','Indjai',
                           'Cassamá','Mané','Té','Sá','Vieira','Camará','Nhaga','Biai','Cabral','Seidi'];
  linguas text[] := array['Kriol','Kriol, Balanta','Kriol, Fula','Kriol, Mandinga','Kriol, Manjaco','Kriol, Papel','Kriol, Bijagó'];
begin
  select * into v_ano from anos_letivos where escola_id = p_escola and atual;
  if not found then raise exception 'A escola não tem ano letivo atual'; end if;

  update classes set propina_mensal = case when ordem <= 6 then 5000 when ordem <= 9 then 7500 else 10000 end,
                     taxa_matricula = case when ordem <= 6 then 10000 else 15000 end
   where escola_id = p_escola and propina_mensal = 0;

  for v_t in select * from (values (5, '5.ª A', 'manha'), (7, '7.ª A', 'manha'), (10, '10.ª A', 'tarde')) as t(ordem, nome, turno) loop
    insert into turmas (escola_id, ano_letivo_id, classe_id, nome, turno, sala)
    values (p_escola, v_ano.id, (select id from classes where escola_id = p_escola and ordem = v_t.ordem), v_t.nome, v_t.turno::turno, 'Sala ' || v_t.ordem)
    on conflict (ano_letivo_id, nome) do nothing
    returning id into v_turma;
    if v_turma is null then continue; end if;

    insert into turma_disciplinas (escola_id, turma_id, disciplina_id)
    select p_escola, v_turma, id from disciplinas
     where escola_id = p_escola and sigla in ('LP','MAT','CI','CS','FR','EF')
        or (escola_id = p_escola and v_t.ordem >= 10 and sigla in ('BIO','FIS','QUI','HIS','GEO','ING'));

    for i in 1..20 loop
      n := n + 1;
      insert into alunos (escola_id, numero, nome, genero, data_nascimento, naturalidade, linguas, morada)
      values (p_escola, 'D' || lpad(n::text, 4, '0'),
              nomes[1 + (n * 7) % 20] || ' ' || apelidos[1 + (n * 3) % 20] || ' ' || apelidos[1 + (n * 3 + 1 + n % 17) % 20],
              case when 1 + (n * 7) % 20 in (1,3,5,7,10,12,14,16,18,20) then 'F'::genero else 'M'::genero end,
              make_date(extract(year from v_ano.inicio)::int - (v_t.ordem + 6), 1 + n % 12, 1 + n % 28),
              (array['Bissau','Bafatá','Gabú','Canchungo','Bolama','Catió','Mansoa'])[1 + n % 7],
              linguas[1 + n % 7],
              (array['Bairro de Belém','Bairro Militar','Pluba','Cuntum','Antula','Bandim','Missirá'])[1 + n % 7])
      on conflict (escola_id, numero) do nothing
      returning id into v_aluno;
      if v_aluno is null then continue; end if;

      insert into encarregados (escola_id, nome, parentesco, telefone)
      values (p_escola, nomes[1 + (n * 13) % 20] || ' ' || split_part((select nome from alunos where id = v_aluno), ' ', 2),
              (array['Pai','Mãe','Tio','Tia','Avó'])[1 + n % 5], '+245 9' || lpad(((n * 7919) % 100000000)::text, 8, '0'))
      returning id into v_enc;
      insert into aluno_encarregados (aluno_id, encarregado_id, escola_id) values (v_aluno, v_enc, p_escola);

      insert into matriculas (escola_id, aluno_id, turma_id, ano_letivo_id, numero_turma, bolsa_percentagem)
      values (p_escola, v_aluno, v_turma, v_ano.id, i, case when i % 9 = 0 then 50 else 0 end)
      returning id into v_mat;

      for v_d in select disciplina_id from turma_disciplinas where turma_id = v_turma loop
        insert into notas (escola_id, matricula_id, disciplina_id, trimestre, nota)
        values (p_escola, v_mat, v_d.disciplina_id, 1, least(20, greatest(4, 8 + ((n * 37 + length(v_d.disciplina_id::text) * i) % 11))));
      end loop;

      if i % 4 = 0 then
        insert into faltas (escola_id, matricula_id, data, justificada, motivo)
        values (p_escola, v_mat, v_ano.inicio + (i % 20), i % 8 = 0, case when i % 8 = 0 then 'Doença' end);
      end if;

      if i % 5 <> 0 then
        insert into pagamentos (escola_id, matricula_id, tipo, mes_referencia, valor, metodo, referencia, data_pagamento)
        select p_escola, v_mat, 'propina', m::date,
               (select propina_mensal from classes c join turmas t on t.classe_id = c.id where t.id = v_turma) * (case when i % 9 = 0 then 50 else 100 end) / 100,
               (array['numerario','orange_money','mtn_momo'])[1 + i % 3]::metodo_pagamento,
               case when i % 3 = 0 then null else 'TX' || n || to_char(m, 'MM') end,
               least(current_date, m::date + 5)
          from generate_series(v_ano.inicio, least(current_date, v_ano.fim), interval '1 month') m
         where (select propina_mensal from classes c join turmas t on t.classe_id = c.id where t.id = v_turma) > 0
           and m::date <= date_trunc('month', current_date)::date - case when i % 7 = 0 then interval '1 month' else interval '0' end;
      end if;
    end loop;
  end loop;

  insert into comunicados (escola_id, titulo, corpo, publico) values
    (p_escola, 'Reunião de encarregados de educação',
     'Convidamos todos os encarregados para a reunião do 1.º trimestre, no sábado às 9h00, no pátio da escola. Ordem de trabalhos: aproveitamento, assiduidade e calendário de provas.', 'encarregados'),
    (p_escola, 'Lançamento das notas do 1.º trimestre',
     'Os professores devem lançar as notas do 1.º trimestre no edu.gw até ao fim do mês, para a impressão dos boletins.', 'professores');

  return n || ' alunos de demonstração criados.';
end $$;

revoke execute on function carregar_demo(uuid) from public, authenticated, anon;
