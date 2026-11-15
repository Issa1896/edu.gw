# edu.gw — Gestão Escolar para a Guiné-Bissau

Sistema web de gestão escolar pensado para escolas guineenses (públicas, privadas, comunitárias, confessionais e de autogestão): matrículas, turmas, notas trimestrais de 0 a 20, faltas, boletins e pautas imprimíveis, propinas em FCFA com Orange Money e MTN MoMo, comunicados e portal do encarregado de educação.

Funciona no telemóvel e no computador, é leve (≈106 kB de JavaScript por página) e quase todos os formulários funcionam mesmo sem JavaScript, o que ajuda em redes lentas.

## Módulos

| Módulo | O que faz | Quem usa |
| --- | --- | --- |
| **Painel** | Alunos matriculados (por género), turmas, faltas do dia, receita do mês, alunos sem propina, atalhos | Equipa |
| **Alunos** | Ficha completa (n.º de processo automático, BI, naturalidade, línguas faladas em casa, observações), encarregados, matrícula por ano letivo, bolsas, estado (ativa, transferida, desistente, concluída), histórico | Secretaria, direção |
| **Turmas** | Turmas por classe (1.ª–12.ª), turno, sala, capacidade, diretor de turma, disciplinas e professor de cada disciplina, numeração alfabética | Secretaria, direção |
| **Notas** | Lançamento por turma, disciplina e trimestre; o professor só lança nas disciplinas que leciona | Professores |
| **Faltas** | Chamada por disciplina ou chamada diária (diretor de turma), justificação e motivo, total anual com alerta | Professores |
| **Boletins e pautas** | Pauta por trimestre ou final, boletim A4 individual ou da turma inteira, situação (aprovado / não aprovado) | Secretaria, professores, encarregados |
| **Propinas** | Tabela de preços por classe, pagamento de vários meses de uma vez, recibo numerado imprimível, Orange Money / MTN MoMo / numerário / transferência, lista de atrasos, taxa de cobrança | Tesouraria, secretaria |
| **Comunicados** | Avisos para todos, para a equipa, para os encarregados ou para uma turma | Direção, secretaria |
| **Equipa** | Convites por email com papel (direção, secretaria, professor, tesouraria), ativar/desativar contas | Direção |
| **Portal do encarregado** | Notas, média, faltas, propinas em falta, recibos e boletim dos seus educandos | Encarregados |
| **Configurações** | Dados da escola (aparecem nos boletins e recibos), anos letivos, disciplinas, nota mínima | Direção |

### Regras adotadas (ajustáveis)

- Ano letivo de **outubro a julho**; propinas mensais nesses meses.
- Escala de **0 a 20**; nota mínima de aprovação **10** (editável em Configurações).
- Transição: aprovado com **até 2 disciplinas negativas** (constante `MAX_NEGATIVAS` em `src/lib/avaliacao.ts`).
- Classes: 1.º ciclo (1.ª–4.ª), 2.º ciclo (5.ª–6.ª), 3.º ciclo (7.ª–9.ª), secundário (10.ª–12.ª).
- Valores em **FCFA (XOF)**, sem casas decimais.

Confirme estas regras com cada escola cliente: variam entre o ensino público e o privado.

## Segurança e várias escolas

Uma única instalação serve **várias escolas** (modelo SaaS). Cada escola só vê os seus dados, garantido na própria base de dados por *Row Level Security* (`supabase/migrations/`):

- a secretaria gere alunos, turmas e matrículas;
- o professor só lança notas e faltas nas turmas e disciplinas que lhe foram atribuídas;
- a tesouraria vê pagamentos, os professores não;
- o encarregado só vê os seus educandos;
- só a direção cria contas de direção ou tesouraria.

Estas regras foram testadas numa base PostgreSQL 16 com duas escolas e quatro papéis diferentes.

## Instalação

### 1. Supabase (base de dados e contas)

1. Crie um projeto em [supabase.com](https://supabase.com) (região recomendada: `eu-west` — Europa, mais próxima de Bissau).
2. Em **SQL Editor**, cole e execute `supabase/migrations/20261115000000_esquema_inicial.sql`.
3. Em **Authentication → URL Configuration**, defina o *Site URL* (ex.: `https://edu.gw` ou o endereço da Vercel) e acrescente `https://<o-seu-dominio>/auth/confirmar` aos *Redirect URLs*.
4. Em **Authentication → Email Templates**, traduza os emails para português (opcional, recomendado).

### 2. Aplicação

```bash
npm install
cp .env.example .env.local   # preencha com Project Settings → API do Supabase
npm run dev                  # http://localhost:3000
```

### 3. Publicar

O mais simples é a [Vercel](https://vercel.com): importe o repositório do GitHub, adicione as três variáveis de `.env.example` e publique. Também corre em qualquer servidor com Node.js 20+ (`npm run build && npm start`).

### 4. Primeira escola

1. Abra o site → **Registar escola** → crie a conta → preencha os dados da escola.
2. O sistema cria o ano letivo, as 12 classes e 14 disciplinas comuns.
3. Em **Propinas**, defina a propina mensal e a taxa de matrícula por classe.
4. Em **Equipa**, convide os professores (cada um cria conta com o email convidado).
5. Em **Turmas**, crie as turmas e atribua professores às disciplinas.
6. Em **Alunos → Nova matrícula**, registe os alunos.

### Demonstração para vender

`supabase/demo.sql` enche uma escola com 3 turmas, 60 alunos com nomes guineenses, encarregados, notas do 1.º trimestre, faltas e propinas pagas. Execute-o no SQL Editor e depois:

```sql
select carregar_demo((select id from escolas where nome = 'Nome da escola'));
```

Use uma escola de demonstração separada; não execute numa escola real.

## Estrutura

```
supabase/migrations/   esquema, funções e políticas de segurança
supabase/demo.sql      dados de demonstração
src/app/(auth)/        entrar, criar conta, recuperar acesso
src/app/configurar/    registo de nova escola
src/app/(app)/         módulos (painel, alunos, turmas, notas, faltas, boletins, financas, …)
src/components/        componentes de interface (Botao, Cartao, Etiqueta, Boletim, …)
src/lib/               sessão, formatação (FCFA, datas), regras de avaliação e finanças
src/fonts/             IBM Plex Sans e Fraunces (licença OFL), alojadas localmente
```

Tecnologia: Next.js 15 (App Router, Server Actions), React 19, Tailwind CSS 3, Supabase (PostgreSQL + Auth).

## Próximos passos sugeridos

- SMS para encarregados (lembrete de propina, faltas) via um fornecedor local ou Twilio.
- Integração direta com APIs de Orange Money / MTN MoMo (hoje regista-se a referência da transação).
- Modo offline (PWA com sincronização) para escolas fora de Bissau.
- Horários, gestão de exames nacionais, e a plataforma de ensino em Kriol.
- Fatura/assinatura por escola para o modelo de venda (plano por número de alunos).
