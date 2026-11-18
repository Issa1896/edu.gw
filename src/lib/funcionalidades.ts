export type Funcionalidade = {
  slug: string;
  titulo: string;
  resumo: string;
  intro: string;
  pontos: { titulo: string; texto: string }[];
  quem: string;
  pergunta?: { p: string; r: string };
};

export const FUNCIONALIDADES: Funcionalidade[] = [
  {
    slug: "matriculas",
    titulo: "Matrículas e processos",
    resumo: "Ficha completa do aluno, encarregados, línguas faladas em casa, transferências e histórico por ano letivo.",
    intro: "Cada aluno tem um processo digital com número automático, que acompanha toda a sua vida na escola, ano após ano. Acabaram os livros de matrícula perdidos e as fichas repetidas.",
    pontos: [
      { titulo: "Ficha completa", texto: "Nome, data e local de nascimento, documento de identificação, morada, observações de saúde e as línguas faladas em casa (Kriol, Balanta, Fula, Mandinga…), que ajudam os professores a planear o ensino." },
      { titulo: "Encarregados de educação", texto: "Um ou mais encarregados por aluno, com telefone e email. Com um clique, o encarregado ganha acesso ao portal no telemóvel." },
      { titulo: "Matrícula por ano letivo", texto: "Escolha a turma, defina a bolsa ou desconto (de 0% a 100%) e acompanhe o estado: ativa, transferida, desistente ou concluída." },
      { titulo: "Histórico", texto: "Todas as matrículas anteriores ficam guardadas: em que turma esteve, em que ano e com que resultado." },
    ],
    quem: "Secretaria e direção.",
    pergunta: { p: "Posso importar os alunos que já tenho?", r: "Sim. A equipa edu.gw ajuda a passar as listas existentes (Excel ou papel) para o sistema na implementação." },
  },
  {
    slug: "notas",
    titulo: "Notas por trimestre",
    resumo: "Escala de 0 a 20, lançamento por turma e disciplina, médias automáticas e pautas prontas a afixar.",
    intro: "O professor lança as notas da sua turma no telemóvel ou no computador, e o sistema calcula médias e situação de cada aluno sem erros de conta.",
    pontos: [
      { titulo: "Escala de 0 a 20", texto: "Notas por trimestre, com vírgula decimal. As negativas aparecem a vermelho para chamar a atenção." },
      { titulo: "Cada professor no seu lugar", texto: "O professor só lança notas nas turmas e disciplinas que lhe foram atribuídas. A secretaria e a direção podem corrigir." },
      { titulo: "Médias automáticas", texto: "Média por disciplina, média geral e número de negativas, atualizados no momento." },
      { titulo: "Situação do aluno", texto: "Aprovado ou não aprovado segundo a regra da escola (nota mínima e número máximo de negativas, configuráveis)." },
    ],
    quem: "Professores, secretaria e direção.",
  },
  {
    slug: "faltas",
    titulo: "Faltas e assiduidade",
    resumo: "Chamada diária ou por disciplina, faltas justificadas e alertas de excesso.",
    intro: "A chamada faz-se em segundos: o professor marca quem faltou e o sistema soma tudo ao longo do ano.",
    pontos: [
      { titulo: "Chamada por disciplina ou diária", texto: "Cada professor regista as faltas da sua aula; o diretor de turma pode fazer a chamada diária." },
      { titulo: "Justificações", texto: "Marque a falta como justificada e escreva o motivo (doença, luto, etc.)." },
      { titulo: "Alertas", texto: "O total do ano aparece ao lado de cada aluno, a amarelo ou vermelho quando as faltas injustificadas se acumulam." },
      { titulo: "No boletim e no portal", texto: "As faltas entram automaticamente no boletim e o encarregado acompanha-as no telemóvel." },
    ],
    quem: "Professores, diretores de turma e secretaria.",
  },
  {
    slug: "propinas",
    titulo: "Propinas em FCFA",
    resumo: "Mensalidades por classe, bolsas, recibos numerados, Orange Money e MTN MoMo, lista de atrasos.",
    intro: "A tesouraria sabe a cada momento quem pagou, quem deve e quanto entrou no mês, em francos CFA.",
    pontos: [
      { titulo: "Tabela de preços por classe", texto: "Propina mensal e taxa de matrícula para cada classe, com bolsas e descontos por aluno." },
      { titulo: "Pagamentos móveis", texto: "Registe pagamentos em numerário, Orange Money, MTN MoMo ou transferência, com a referência da transação." },
      { titulo: "Recibos numerados", texto: "Cada pagamento gera um recibo com número sequencial, pronto a imprimir. Vários meses pagos de uma vez ficam num só recibo." },
      { titulo: "Atrasos e cobrança", texto: "Lista de alunos com meses em falta, valor total por cobrar e taxa de cobrança da escola." },
    ],
    quem: "Tesouraria, secretaria e direção. O encarregado vê os seus recibos no portal.",
  },
  {
    slug: "boletins",
    titulo: "Boletins imprimíveis",
    resumo: "Boletim trimestral e anual em A4, com assinatura da direção e do encarregado.",
    intro: "No fim de cada trimestre, os boletins de uma turma inteira imprimem-se de uma vez, sem copiar notas à mão.",
    pontos: [
      { titulo: "Boletim individual", texto: "Cabeçalho da escola, notas dos três trimestres, média, faltas, situação e espaços para assinatura." },
      { titulo: "Turma inteira de uma vez", texto: "Um clique imprime todos os boletins da turma, uma folha A4 por aluno." },
      { titulo: "Pautas", texto: "Pauta por trimestre ou final, com todas as disciplinas, pronta a afixar." },
      { titulo: "Também no telemóvel", texto: "O encarregado consulta o boletim no portal, a qualquer hora." },
    ],
    quem: "Secretaria, professores e encarregados.",
  },
  {
    slug: "portal-encarregado",
    titulo: "Portal do encarregado",
    resumo: "Pais e encarregados acompanham notas, faltas, pagamentos e comunicados pelo telemóvel.",
    intro: "Os pais deixam de depender do boletim em papel: acompanham a vida escolar dos filhos no telemóvel, mesmo com rede fraca.",
    pontos: [
      { titulo: "Notas e média", texto: "Notas por disciplina e trimestre, média geral e situação." },
      { titulo: "Faltas", texto: "Total de faltas e quantas estão justificadas." },
      { titulo: "Propinas e recibos", texto: "Meses em falta e todos os recibos de pagamento." },
      { titulo: "Comunicados e declarações", texto: "Avisos da escola e declarações emitidas para os seus educandos." },
    ],
    quem: "Encarregados de educação, por convite da escola.",
  },
  {
    slug: "declaracoes",
    titulo: "Declarações digitais",
    resumo: "Declarações de matrícula, aproveitamento, conclusão e quitação, com código QR que qualquer pessoa pode verificar.",
    intro: "A secretaria emite declarações em segundos, e quem as recebe confirma a autenticidade com a câmara do telemóvel.",
    pontos: [
      { titulo: "Quatro tipos", texto: "Matrícula e frequência, aproveitamento com notas, conclusão de classe e quitação de propinas." },
      { titulo: "Dados sempre certos", texto: "O texto é preenchido com os dados do sistema. O sistema recusa declarar conclusão a quem não foi aprovado, ou quitação a quem deve propinas." },
      { titulo: "Código QR verificável", texto: "Cada declaração tem um código único. Lido o QR, a página de verificação mostra se é autêntica, o texto original e se foi anulada." },
      { titulo: "Anulação", texto: "Uma declaração emitida por engano pode ser anulada com motivo, e passa a aparecer como inválida." },
    ],
    quem: "Secretaria e direção (a tesouraria emite quitações). Verificação aberta a qualquer pessoa.",
  },
  {
    slug: "assistente-ia",
    titulo: "Assistente com IA",
    resumo: "Pergunte em português ou kriol: quem está em atraso, como lançar notas, como imprimir boletins.",
    intro: "Um assistente dentro do sistema que responde às dúvidas da equipa e consulta os dados da escola por si.",
    pontos: [
      { titulo: "Ajuda a usar o sistema", texto: "Explica, passo a passo, como matricular, lançar notas, registar pagamentos ou emitir declarações." },
      { titulo: "Consulta dados", texto: "Quem tem propinas em atraso na 7.ª A? Qual a média da turma no 1.º trimestre? Quem tem mais faltas? Pergunte em linguagem simples." },
      { titulo: "Respeita permissões", texto: "Cada pessoa só obtém respostas sobre o que já pode ver: um professor não vê propinas, um encarregado só vê os seus filhos." },
      { titulo: "Português e kriol", texto: "Responde na língua em que lhe escrevem." },
    ],
    quem: "Toda a equipa da escola.",
  },
  {
    slug: "blog-e-pagina-publica",
    titulo: "Blog e página pública",
    resumo: "Cada escola com a sua página de notícias aberta a alunos e ao público, e o blog com novidades do edu.gw.",
    intro: "A escola comunica com a comunidade sem precisar de um site próprio: calendário, provas, reuniões e eventos numa página que se partilha no WhatsApp.",
    pontos: [
      { titulo: "Página da escola", texto: "Apresentação, contactos e notícias, num endereço próprio (gwdigitalcompany.com/escola/nome-da-escola)." },
      { titulo: "Notícias com imagem", texto: "Publique a partir dos Comunicados escolhendo o destino Público, com resumo e imagem." },
      { titulo: "Partilha fácil", texto: "Cada notícia tem botões para WhatsApp e Facebook, com título e imagem na pré-visualização." },
      { titulo: "Dados protegidos", texto: "A página pública nunca mostra dados de alunos, notas ou propinas." },
    ],
    quem: "Direção e secretaria publicam; qualquer pessoa lê.",
  },
];

export function funcionalidade(slug: string) {
  return FUNCIONALIDADES.find((f) => f.slug === slug);
}
