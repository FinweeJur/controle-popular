import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, BarChart3, Bell, BookOpen, Briefcase, Building2, Compass, Cpu, FileQuestion, FileSpreadsheet, FileText, Globe, GraduationCap, HeartHandshake, HelpCircle, Info, Landmark, Layers, List, MapPin, Mountain, Newspaper, PhoneCall, Radio, Scale, Search, Send, Shield, ShieldCheck, ShoppingBag, Sparkles, Users, Waves } from "lucide-react";

/**
 * @file Menu do indice expansivel (navbar).
 *
 * Separado do TopNav porque o CodeScene mede o componente e porque a dica de
 * duas linhas (`dica`) e conteudo editorial, revisavel fora do JSX.
 */

export interface ItemMenuLink {
  label: string;
  href: string;
  icone: LucideIcon;
  destaque?: boolean;
  // Dica curta (até ~140 caracteres) exibida pelo DicaHover global em
  // `data-dica`: o que é a página e o que o leitor encontra nela. Duas
  // linhas de ideia — texto de interface nunca abaixo de 12 px.
  dica?: string;
}

export interface SecaoMenu {
  id: string;
  badge: string;
  titulo: string;
  href: string;
  icone: LucideIcon;
  cor: string;
  corClasse: string;
  badgeClasse: string;
  links: ItemMenuLink[];
}

export const SECOES_MENU: SecaoMenu[] = [
  {
    id: 'terra',
    badge: 'EIXO 1',
    titulo: 'Terra e Território',
    href: '/terra-e-territorios',
    icone: Globe,
    cor: 'var(--cp-eixo-terra)',
    corClasse: 'text-emerald-500 hover:text-emerald-400',
    badgeClasse: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/terra-e-territorios', icone: Globe, dica: 'Porta do Eixo 1: reúne terra, territórios, barragens, clima e mineração. Explica como cada frente se conecta.' },
      { label: 'Função Social & Globo 3D', href: '/funcaosocialterra/mapa', icone: Globe, destaque: true, dica: 'Mapa em globo 3D com camadas de função social da terra, CAR, unidades de conservação e mineração.' },
      // O Rio Doce tem UMA porta no menu: o hub /riodoce. A execução
      // financeira do Acordo em MG continua em /ambiental/mariana, mas é
      // alcançada de dentro do hub, não como entrada paralela aqui.
      { label: 'Rio Doce — caso e repactuação', href: '/riodoce', icone: Waves, destaque: true, dica: 'Hub do caso do Rio Doce: Acordo de Mariana, reparação do Fundão, processos, jurisprudência e dados da bacia.' },
      { label: 'Reparação Paraopeba (Brumadinho)', href: '/paraopeba', icone: ShieldCheck, destaque: true, dica: 'Hub do rompimento da barragem de Brumadinho: reparação, auxílio emergencial, Acordo e dados da bacia do Paraopeba.' },
      // Jurisprudência fica aqui, junto dos dois desastres: o acervo nasce
      // das decisões de Mariana e Brumadinho e cobre também direitos humanos.
      { label: 'Licenciamento Ambiental (11 UFs)', href: '/ambiental/licenciamento', icone: FileSpreadsheet, destaque: true, dica: 'Licenciamentos ambientais em 11 UFs, com prazos, tipos de licença e situação de cada empreendimento.' },
      { label: 'Descaracterização Barragens', href: '/ambiental/barragens/descaracterizacao', icone: AlertTriangle, destaque: true, dica: 'Situação da descaracterização de barragens a montante em MG: prazos, empresas e risco por estrutura.' },
      { label: '203 Cidades Estratégicas', href: '/cidades', icone: MapPin, dica: 'Painel das 203 cidades estratégicas do país com SUS, PIB, contratos e indicadores sociais.' },
      { label: 'Cidades de Minas (853)', href: '/cidades/mg', icone: MapPin, dica: 'Os 853 municípios de MG do IBGE, com microrregiões, mesorregiões e dados de cada cidade.' },
      { label: 'Nossos Rios & Bacias', href: '/terra-e-territorios/nossos-rios', icone: Waves, dica: 'Bacias hidrográficas do Brasil: mapa, qualidade da água e dados dos rios que atravessam o território.' },
      { label: 'Nossas Serras & Topos de Morro', href: '/terra-e-territorios/nossas-serras', icone: Mountain, dica: 'Serras, topos de morro e áreas de proteção: localização, cobertura e pressão da mineração.' },
      { label: 'Cavas de Mineração (satélite)', href: '/mineracao/cavas', icone: Mountain, dica: 'Série anual de cavas de mineração detectadas por satélite, vista no globo 3D.' },
      { label: 'Clima & Risco AdaptaBrasil', href: '/ambiental/clima-risco', icone: Activity, dica: 'Risco climático por município segundo o AdaptaBrasil: seca, enchente, deslizamento e calor.' },
      { label: 'Termos de Ajustamento (TAC)', href: '/ambiental/tac', icone: Shield, dica: 'Termos de Ajustamento de Conduta ambientais: partes, obrigações, prazos e situação de cumprimento.' },
      { label: 'Decisões do COPAM', href: '/ambiental/copam', icone: Scale, dica: 'Decisões do Conselho de Política Ambiental de MG: pautas, deliberações e licenças aprovadas.' },
      { label: 'Canadá & Mineração TSX', href: '/canada', icone: Globe, dica: 'Mineração canadense na TSX: empresas, projetos no Brasil e ligações com desastres ambientais.' },
      { label: 'América Latina & Mineração', href: '/america-latina', icone: Globe, dica: 'Mineração na América Latina: projetos, empresas e conflitos socioambientais por país.' },
    ],
  },
  {
    id: 'direitos',
    badge: 'EIXO 2',
    titulo: 'Direitos em Movimento',
    href: '/direitos-em-movimento',
    icone: HeartHandshake,
    cor: 'var(--cp-eixo-direitos)',
    corClasse: 'text-alert hover:text-alert',
    badgeClasse: 'bg-alert/10 text-alert border-alert/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/direitos-em-movimento', icone: HeartHandshake, dica: 'Porta do Eixo 2: saúde, educação, trabalho, conselhos, LAI, denúncia e assistência jurídica.' },
      { label: 'Linha do Tempo das Lutas', href: '/memoria', icone: BookOpen, destaque: true, dica: 'Seis décadas de lutas populares no campo e na cidade, com marcos, datas e fontes.' },
      { label: 'Que Lei Protege Isso', href: '/ambiental/legislacao', icone: ShieldCheck, destaque: true, dica: 'Biblioteca de leis ambientais e de direitos: o que cada norma garante e como acioná-la.' },
      { label: 'Direitos Globais', href: '/direitos-globais', icone: Globe, destaque: true, dica: 'Compare direitos entre países: América Latina, África, Ásia, Europa, América do Norte e Oceania.' },
      { label: 'Direitos Comparados', href: '/direitos-comparados', icone: Scale, destaque: true, dica: 'Indicadores de direitos entre estados brasileiros: IDH, saúde, educação, justiça e finanças.' },
      { label: 'Saúde Pública & SUS', href: '/direitos-em-movimento/saude-publica', icone: Activity, destaque: true, dica: 'Indicadores do SUS por município: cobertura, equipes, internações e gastos em saúde.' },
      // Tarifa Social e Ajuda são coisas distintas: a primeira é uma notícia
      // com o passo a passo do desconto; a segunda é a rede de proteção.
      { label: 'Tarifa Social (Água & Luz)', href: '/noticias/tarifa-social-energia-agua-como-acessar', icone: Newspaper, destaque: true, dica: 'Passo a passo para pedir o desconto da Tarifa Social de água e luz por estado e distribuidora.' },
      { label: 'Onde Buscar Ajuda', href: '/direitos-em-movimento/ajuda', icone: HelpCircle, destaque: true, dica: 'Rede de proteção: assistência jurídica gratuita, CRAS, CREAS e canais de apoio.' },
      { label: 'Educação & Escolas (IDEB)', href: '/direitos-em-movimento/educacao', icone: GraduationCap, dica: 'Escolas e IDEB por município: infraestrutura, aprendizado e evolução das notas.' },
      { label: 'Trabalho & Emprego (CAGED)', href: '/direitos-em-movimento/trabalho-e-renda', icone: Briefcase, dica: 'Emprego formal pelo CAGED: admissões, demissões, salários e setores por cidade.' },
      { label: 'Conselhos de Direitos (710)', href: '/direitos-em-movimento/conselhos', icone: Users, dica: '710 conselhos de direitos: saúde, meio ambiente, tutelares e mulheres, com contatos.' },
      { label: 'Pedir Informação (LAI)', href: '/direitos-em-movimento/informacao', icone: FileQuestion, dica: 'Como pedir informação pública pela LAI: canais, prazos e o que fazer se negarem.' },
      { label: 'Canal de Denúncia Local', href: '/direitos-em-movimento/denuncia', icone: Send, dica: 'Canais locais para denunciar violações ambientais, de direitos e de serviços públicos.' },
      { label: 'Decisões de Acesso (LAI)', href: '/ambiental/decisoes-lai', icone: FileText, dica: 'Decisões sobre pedidos de acesso à informação: recursos, respostas e precedentes.' },
      { label: 'Direitos Humanos & Relatórios', href: '/ambiental/direitos-humanos', icone: Shield, dica: 'Relatórios de direitos humanos e violações ligadas a desastres e conflitos no campo.' },
      { label: 'Jurisprudência — desastres e direitos humanos', href: '/jurisprudencia', icone: Scale, destaque: true, dica: 'Acórdãos do TJMG, TJES e súmulas do STF, STJ e TST sobre desastres e direitos humanos, com filtros.' },
    ],
  },
  {
    id: 'estado',
    badge: 'EIXO 3',
    titulo: 'Estado e Economia',
    href: '/estado-e-economia',
    icone: Landmark,
    cor: 'var(--cp-eixo-estado)',
    corClasse: 'text-sky-500 hover:text-sky-400',
    badgeClasse: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/estado-e-economia', icone: Landmark, dica: 'Porta do Eixo 3: orçamento, justiça, assembleias, contratos, campanhas e empresas.' },
      { label: 'Orçamento & Receitas de MG', href: '/estado-e-economia/orcamento', icone: BarChart3, destaque: true, dica: 'Receitas e despesas do orçamento de MG: por função, órgão e ano, direto da fonte oficial.' },
      { label: 'Quem fiscaliza a Justiça', href: '/judiciario/instituicoes', icone: Scale, destaque: true, dica: 'Instituições que fiscalizam o Judiciário: CNJ, corregedorias, ouvidorias e Conselhos.' },
      { label: 'Varas, Gabinetes e Balcão', href: '/judiciario/contatos', icone: PhoneCall, destaque: true, dica: 'Varas, gabinetes e balcão virtual: telefone, e-mail e titular de cada unidade.' },
      { label: 'Assembleias Legislativas (27 UFs)', href: '/assembleias', icone: Landmark, destaque: true, dica: 'As 27 Assembleias Legislativas: deputados, gastos, projetos e comissões por estado.' },
      { label: 'Radar de Compras & Contratos', href: '/ambiental/contratos', icone: ShoppingBag, destaque: true, dica: 'Radar de compras e contratos públicos: valores, fornecedores e objetos por órgão.' },
      { label: 'Congresso Nacional & Gastos', href: '/congresso', icone: Landmark, dica: 'Congresso Nacional: deputados, senadores, gastos e votações, com fonte oficial.' },
      { label: 'Gastos de Campanha 2026', href: '/eleicoes/2026/gastos-campanha', icone: BarChart3, destaque: true, dica: 'Gastos declarados na campanha de 2026: candidatos, doadores e despesas por estado.' },
      { label: 'Bancada Federal de MG', href: '/congresso/mg', icone: Users, dica: 'Deputados e senadores de Minas: atuação, gastos, votações e emendas.' },
      { label: 'Governos: Prometeu? Cumpriu?', href: '/governo', icone: Landmark, dica: 'Promessas de campanha dos governos comparadas às entregas reais, com fonte.' },
      { label: 'Grandes Empresas & Fundos ESG', href: '/empresas', icone: Building2, dica: 'Mineradoras e fundos ESG: sócios, relatórios, fornecedores públicos e condenações.' },
      { label: '1.000 Maiores Fortunas Mundiais', href: '/empresas/fortunas', icone: Building2, dica: 'As 1.000 maiores fortunas do mundo e os grupos que controlam a mineração.' },
      { label: 'EUA: SEC, Fundos & Comércio', href: '/eua', icone: Building2, dica: 'SEC, fundos e comércio dos EUA: empresas, investidores e ligações com o Brasil.' },
      { label: 'Europa: Litígios Transnacionais', href: '/europa', icone: Globe, destaque: true, dica: 'Litígios transnacionais na Europa: BHP em Londres, Braskem em Roterdã e devida diligência.' },
      { label: 'Europa: Mariana e Brumadinho', href: '/europa/litigios-transnacionais', icone: Scale, destaque: true, dica: 'Linha do tempo dos casos na Inglaterra, Alemanha e Holanda, com ADPF 1178 e clipping.' },
      { label: 'Legislação Transnacional', href: '/europa/legislacao-transnacionais', icone: FileText, destaque: true, dica: 'Leis que alcançam a matriz: CSDDD, LkSG, EUDR, Roma II e precedentes por país.' },
      { label: 'Central de Inteligência (12 Eyes)', href: '/internacional/inteligencia', icone: ShieldCheck, destaque: true, dica: 'Dossiês desclassificados das agências de inteligência e a rede 12 Eyes.' },
      { label: 'Mapa Global de Inteligência', href: '/internacional/inteligencia/mapa', icone: MapPin, dica: 'Mapa interativo de agências, dossiês e operações de inteligência pelo mundo.' },
      { label: 'Repasses Federais ComunicaBR', href: '/dados/comunicabr', icone: MapPin, dica: 'Repasses e ações do governo federal nos municípios de MG, pelo ComunicaBR.' },
      { label: 'Concessões & PPP de MG', href: '/ambiental/ppp', icone: Building2, dica: 'Concessões e parcerias público-privadas de MG: contratos, prazos e valores.' },
    ],
  },
  {
    id: 'transversal',
    badge: 'EIXO 4',
    titulo: 'Central & Ferramentas',
    href: '/central',
    icone: Compass,
    cor: 'var(--cp-primary)',
    corClasse: 'text-primary hover:text-primary',
    badgeClasse: 'bg-primary/10 text-primary border-primary/30',
    links: [
      { label: 'Página do Eixo Central', href: '/central', icone: Compass, dica: 'Porta do Eixo 4: ferramentas, assistente, busca, acervo e laboratório do portal.' },
      { label: 'Radar Diário de Editais', href: '/editais', icone: ShoppingBag, destaque: true, dica: 'Editais e chamamentos do Diário Oficial de MG, atualizados com radar diário.' },
      { label: 'Biblioteca Geral & Pesquisa', href: '/biblioteca', icone: BookOpen, destaque: true, dica: 'Acervo com milhares de documentos, relatórios periciais, estudos e decisões.' },
      { label: 'Universidades: Estudo, Pesquisa e Extensão', href: '/universidades', icone: GraduationCap, destaque: true, dica: 'Lista de grupos de estudo e pesquisa e de projetos de extensão, com contatos, líderes e cruzamento por tema, local e data.' },
      { label: 'Árvore de Conexões (Grafo 3D)', href: '/laboratorio/arvore', icone: Layers, destaque: true, dica: 'Grafo 3D que liga os eixos, temas e páginas do portal numa teia navegável.' },
      { label: 'Assistente Cívico Seu Nonô', href: '/assistente', icone: Sparkles, destaque: true, dica: 'Seu Nonô responde sobre os dados do portal e indica onde conferir na fonte.' },
      { label: 'Índice Geral do Portal', href: '/indice', icone: List, dica: 'Índice completo do portal, com busca por tema, situação e eixo.' },
      { label: 'Busca Global no Acervo', href: '/busca', icone: Search, dica: 'Busca por palavra em todo o acervo do portal: páginas, dados e documentos.' },
      { label: 'Laboratório de Dados', href: '/laboratorio', icone: BarChart3, dica: 'Compare dois conjuntos de dados em gráficos e veja o que muda lado a lado.' },
      { label: 'Blog & Notícias Analíticas', href: '/noticias', icone: Newspaper, dica: 'Estudos, análises e investigações cívicas com a fonte ao lado de cada afirmação.' },
      { label: 'Rádios do Brasil e do Mundo', href: '/radio', icone: Radio, dica: 'Rádios comunitárias e do Brasil e do mundo: transmissões e boletins de áudio.' },
      { label: 'Alertas & Notificações', href: '/alertas', icone: Bell, dica: 'Central de alertas e notificações: acompanhe novidades e receba por e-mail.' },
      { label: 'Tecnologia & IA Livre', href: '/tecnologia', icone: Cpu, dica: 'Oficinas de IA livre, catálogo open source e ferramentas para uso cidadão.' },
      { label: 'Documentação do Sistema', href: '/documentacao', icone: FileText, dica: 'Arquitetura, fontes, API pública e princípios editoriais para pesquisadores.' },
      { label: 'Sobre o ONSA & Método', href: '/sobre', icone: Info, dica: 'O que é o portal, o método ONSA, a taxa de erro e a origem dos dados.' },
    ],
  },
];

// Destaques primeiro em cada seção; a ordem relativa dos demais é preservada.
for (const secao of SECOES_MENU) {
  secao.links.sort(
    (a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)),
  );
}