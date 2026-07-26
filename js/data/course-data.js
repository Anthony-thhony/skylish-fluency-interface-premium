/**
 * Conteúdo dos níveis, aulas e depoimentos.
 * Edite este arquivo para adicionar ou alterar aulas.
 */
const LEVELS = [
  { code:'A1', name:'Beginner', ptName:'Iniciante', accent:'#E08A3E', desc:'Dê os primeiros passos no inglês.',
    lessons:[
      {id:'a1-1', title:'Apresentações e cumprimentos', desc:'Como se apresentar e cumprimentar em inglês.', duration:'8 min'},
      {id:'a1-2', title:'O verbo To Be', desc:'Formas afirmativa, negativa e interrogativa.', duration:'11 min'},
      {id:'a1-3', title:'Rotina diária', desc:'Vocabulário e verbos para descrever o seu dia.', duration:'9 min'},
      {id:'a1-4', title:'Números, horas e datas', desc:'Contar, dizer as horas e marcar compromissos.', duration:'10 min'},
      {id:'a1-5', title:'Vocabulário: família', desc:'Falando sobre parentes e relações familiares.', duration:'7 min'},
    ]},
  { code:'A2', name:'Elementary', ptName:'Básico', accent:'#E0A23E', desc:'Construa sua base e amplie vocabulário.',
    lessons:[
      {id:'a2-1', title:'Passado simples', desc:'Verbos regulares e irregulares no passado.', duration:'12 min'},
      {id:'a2-2', title:'Comparativos e superlativos', desc:'Comparando pessoas, lugares e coisas.', duration:'9 min'},
      {id:'a2-3', title:'Viagens e turismo', desc:'Vocabulário para aeroportos, hotéis e passeios.', duration:'10 min'},
      {id:'a2-4', title:'Fazendo pedidos em inglês', desc:'Expressões para restaurantes e compras.', duration:'8 min'},
      {id:'a2-5', title:'Descrevendo pessoas', desc:'Adjetivos de aparência e personalidade.', duration:'9 min'},
    ]},
  { code:'B1', name:'Intermediate', ptName:'Intermediário', accent:'#2FAE7A', desc:'Ganhe confiança e comunique-se melhor.',
    lessons:[
      {id:'b1-1', title:'Passado contínuo', desc:'Descrevendo ações em progresso no passado.', duration:'10 min'},
      {id:'b1-2', title:'Phrasal verbs essenciais', desc:'Os phrasal verbs mais usados no dia a dia.', duration:'13 min'},
      {id:'b1-3', title:'Inglês para entrevistas', desc:'Perguntas e respostas comuns em entrevistas de emprego.', duration:'14 min'},
      {id:'b1-4', title:'Discutindo notícias', desc:'Vocabulário para comentar atualidades.', duration:'11 min'},
      {id:'b1-5', title:'Condicionais tipo 1', desc:'Falando sobre situações reais e possíveis.', duration:'10 min'},
    ]},
  { code:'B2', name:'Upper Int.', ptName:'Pré-avançado', accent:'#3B7DE0', desc:'Fale com mais fluência e naturalidade.',
    lessons:[
      {id:'b2-1', title:'Voz passiva', desc:'Quando e como usar a voz passiva com naturalidade.', duration:'11 min'},
      {id:'b2-2', title:'Inglês para negócios', desc:'Vocabulário de reuniões, e-mails e apresentações.', duration:'15 min'},
      {id:'b2-3', title:'Debates e opiniões', desc:'Estruturas para argumentar e discordar educadamente.', duration:'12 min'},
      {id:'b2-4', title:'Redação formal', desc:'Escrevendo e-mails e cartas formais.', duration:'13 min'},
      {id:'b2-5', title:'Idioms do dia a dia', desc:'Expressões idiomáticas usadas por falantes nativos.', duration:'9 min'},
    ]},
  { code:'C1', name:'Advanced', ptName:'Avançado', accent:'#8B5CF6', desc:'Domine o inglês em contextos diversos.',
    lessons:[
      {id:'c1-1', title:'Inglês acadêmico', desc:'Estrutura de textos e argumentação acadêmica.', duration:'14 min'},
      {id:'c1-2', title:'Nuances de vocabulário', desc:'Sinônimos e o contexto certo para cada palavra.', duration:'12 min'},
      {id:'c1-3', title:'Apresentações profissionais', desc:'Estruturando e entregando apresentações em inglês.', duration:'13 min'},
      {id:'c1-4', title:'Negociação em inglês', desc:'Linguagem para negociar termos e propostas.', duration:'14 min'},
      {id:'c1-5', title:'Compreensão de sotaques', desc:'Treinando o ouvido para diferentes sotaques do inglês.', duration:'16 min'},
    ]},
  { code:'C2', name:'Proficiency', ptName:'Fluente', accent:'#D6479B', desc:'Alcance o nível máximo de excelência.',
    lessons:[
      {id:'c2-1', title:'Fluência avançada', desc:'Refinando ritmo, entonação e naturalidade.', duration:'15 min'},
      {id:'c2-2', title:'Inglês jurídico e técnico', desc:'Vocabulário especializado por área de atuação.', duration:'16 min'},
      {id:'c2-3', title:'Retórica e persuasão', desc:'Técnicas de discurso persuasivo em inglês.', duration:'13 min'},
      {id:'c2-4', title:'Humor e sarcasmo em inglês', desc:'Entendendo nuances culturais do humor.', duration:'11 min'},
      {id:'c2-5', title:'Certificações internacionais', desc:'Preparação para Cambridge, IELTS e TOEFL.', duration:'18 min'},
    ]},
];

const TESTIMONIALS = [
  {name:'Juliana Santos', level:'Nível B2', quote:'O método Skylish mudou minha forma de aprender inglês. Hoje me sinto confiante para falar!', color:'#8B5CF6'},
  {name:'Carlos Eduardo', level:'Nível C1', quote:'As aulas são práticas e dinâmicas. Em poucos meses evolui muito minha conversação.', color:'#3B7DE0'},
  {name:'Mariana Lima', level:'Nível A2', quote:'Estou começando agora e já consigo entender muitas coisas. A plataforma é incrível!', color:'#D6479B'},
];
