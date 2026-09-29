/**
 * @file escada-determinista.ts
 * @description Módulo de Degraus Determinísticos (Regra de Escada) para o assistente Seu Nonô e Chatbot IA.
 * 
 * Papel no portal:
 * Intercepta comandos diretos e termos de alta frequência antes de acionar o modelo de IA,
 * garantindo respostas instantâneas, determinísticas e auditáveis para:
 * 1. Laboratório de Dados / PowerBI / Cruzamento de indicadores e gráficos;
 * 2. Cidades estratégicas (Betim, BH, Diamantina, Araçuaí, Itinga, SP, 199 Cidades);
 * 3. Grandes empresas e mineradoras (Vale, Sigma Lithium, CSN, CEMIG, COPASA, Gerdau, Samarco);
 * 4. Central & Ferramentas (Busca, Editais, Biblioteca, Imprensa, Índice Geral, Documentação, Fontes 27 Estados, Sobre, Governo, ComunicaBR);
 * 5. Perguntas com respostas pré-curadas da base oficial do portal;
 * 6. Blog e Reportagens Investigativas do ONSA (/noticias);
 * 7. Páginas estruturais e eixos temáticos do portal (~100 páginas do índice).
 * 
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular, rotas do App Router, painel do ONSA,
 * catálogo de páginas (`PAGINAS_PORTAL`), acervo de notícias e base de respostas curadas.
 * 
 * Decisões técnicas:
 * - Reduz latência a zero para termos frequentes e economiza chamadas de IA.
 * - Fornece botões de navegação direta com deep links auditáveis.
 * - Respeita a Regra de Escada cívica: navegação determinística antes da geração probabilística.
 */

import { buscarRespostaCurada } from "../busca/resposta-curada";
import { semAcento } from "../busca/normalizar";
import { buscarPaginasPortal } from "../busca/paginas-portal";
import { listarNoticiasPortal } from "../noticias/portal";
import { obterLinksRelacionadosGalho, type GalhoRelacionado } from "./arvore-galhos";
import { corrigirDigitacaoFrase } from "./corretor-digitacao";

export interface AtalhoAcao {
  rotulo: string;
  href: string;
  icone?: string;
  principal?: boolean;
}

export interface ResultadoEscada {
  tipo: "laboratorio" | "cidade" | "empresa" | "ferramenta" | "noticia" | "pagina" | "curada";
  titulo: string;
  subtitulo?: string;
  texto: string;
  atalhos: AtalhoAcao[];
  categoria?: string;
  galhoRelacionado?: GalhoRelacionado;
}

/**
 * Avalia se a entrada do usuário corresponde a um degrau determinístico antes de invocar a IA.
 * Executa a lógica bruta de casamento por regras, com correção tolerante a erros de digitação.
 */
function avaliarEscadaBruta(
  prompt: string,
  slugCidadeOuZona?: string
): ResultadoEscada | null {
  const bruta = semAcento(prompt.trim().toLowerCase());
  if (!bruta) return null;

  // Aplica correção tolerante a erros ortográficos e de digitação
  const normalizada = corrigirDigitacaoFrase(bruta);

  // ─── 1. DEGRAU: LABORATÓRIO / POWERBI / ARVORE OBSIDIAN / CRUZAMENTOS ─
  const regexArvore = /\b(arvore|grafo|obsidian|rede de conexoes|arvore de links|mapa mental)\b/i;
  if (regexArvore.test(normalizada)) {
    return {
      tipo: "laboratorio",
      titulo: "Árvore de Conexões Cívicas (Obsidian Graph)",
      subtitulo: "Grafo Interativo dos 4 Eixos Temáticos",
      texto:
        "A visualização em árvore do Controle Popular mapeia nós e arestas de relacionamento entre 199 cidades, mineradoras, bacias e órgãos públicos com zoom, arrasto e inspeção de vínculos.",
      categoria: "Visualização em Grafo",
      atalhos: [
        { rotulo: "Abrir Árvore de Conexões", href: "/laboratorio/arvore", principal: true },
        { rotulo: "Laboratório de Dados", href: "/laboratorio" },
        { rotulo: "Índice Geral do Portal", href: "/indice" },
      ],
    };
  }

  const regexLab = /\b(laboratorio|laborat[oó]rio|powerbi|power bi|cruzar|cruzamento|cruzar dados|comparador|gr[aá]ficos?|analytics|dashboard|painel bi|lab|camadas)\b/i;
  if (regexLab.test(normalizada)) {
    return {
      tipo: "laboratorio",
      titulo: "Laboratório de Cruzamento & PowerBI",
      subtitulo: "23 Camadas Analíticas de Inteligência Cívica",
      texto:
        "O Laboratório de Dados do Controle Popular permite cruzar indicadores orçamentários, contratos, leitos hospitalares, licenças ambientais e royalties em gráficos e comparadores interativos.",
      categoria: "Análise de Dados",
      atalhos: [
        { rotulo: "Abrir Laboratório de Dados", href: "/laboratorio", principal: true },
        { rotulo: "Árvore de Conexões (Obsidian)", href: "/laboratorio/arvore" },
        { rotulo: "Comparador de Cidades", href: "/laboratorio/comparador" },
        { rotulo: "Séries Históricas & Gráficos", href: "/laboratorio/graficos" },
        { rotulo: "Orçamento de Minas Gerais", href: "/estado-e-economia/orcamento" },
      ],
    };
  }

  // ─── 1.5. DEGRAU: COMANDOS DIRETOS DE TABELAS & BASES (LICENÇAS, CONVÊNIOS, LEIS, TAC) ─
  if (
    normalizada.startsWith("licenciamento") ||
    normalizada.startsWith("licenca") ||
    normalizada.startsWith("licencas") ||
    normalizada.includes("painel de licenciamento") ||
    normalizada.includes("licenciamento ambiental")
  ) {
    const termoBusca = normalizada
      .replace(/^licenciamento\s*(de\s*)?/i, "")
      .replace(/^licencas?\s*(de\s*)?/i, "")
      .replace(/ambiental/i, "")
      .trim();

    const linkHref = termoBusca ? `/ambiental/licenciamento?q=${encodeURIComponent(termoBusca)}` : "/ambiental/licenciamento";

    return {
      tipo: "pagina",
      titulo: termoBusca ? `Licenciamento Ambiental: ${termoBusca}` : "Licenciamento Ambiental de Minas Gerais",
      subtitulo: "19.713 Empreendimentos Catalogados · SEMAD / COPAM",
      texto:
        "Consulte processos de licença prévia (LP), instalação (LI) e operação (LO) deferidas pela SEMAD e pelo COPAM com filtros por município, setor e classe de impacto.",
      categoria: "Licenciamento",
      atalhos: [
        { rotulo: "Abrir Tabela de Licenciamento", href: linkHref, principal: true },
        { rotulo: "Pautas do COPAM", href: "/ambiental/copam" },
        { rotulo: "Condicionantes de Barragens", href: "/ambiental/condicionantes" },
        { rotulo: "Termos de Ajustamento (TACs)", href: "/ambiental/tac" },
      ],
    };
  }

  if (
    normalizada.startsWith("convenio") ||
    normalizada.startsWith("convenios") ||
    normalizada.includes("painel de convenios")
  ) {
    return {
      tipo: "pagina",
      titulo: "Convênios & Estudos Ambientais",
      subtitulo: "3.000+ Parcerias Oficiais de Órgãos Estaduais",
      texto:
        "Tabela de convênios firmados pela SEMAD, IEF, IGAM e FEAM com prefeituras, universidades e entidades civis com valores, vigência e prestação de contas.",
      categoria: "Convênios",
      atalhos: [
        { rotulo: "Tabela de Convênios", href: "/ambiental/convenios", principal: true },
        { rotulo: "Compras no PNCP", href: "/estado-e-economia/compras" },
        { rotulo: "Repasses ComunicaBR", href: "/dados/comunicabr" },
      ],
    };
  }

  if (
    normalizada.startsWith("lei ") ||
    normalizada.startsWith("leis ") ||
    normalizada.startsWith("decreto ") ||
    normalizada === "legislacao" ||
    normalizada.includes("legislacao ambiental")
  ) {
    return {
      tipo: "pagina",
      titulo: "Legislação Ambiental Unificada",
      subtitulo: "20.000+ Normas com URN Canônica LexML",
      texto:
        "Acervo completo de leis, decretos e resoluções ambientais federais e estaduais com identificadores persistentes e texto integral.",
      categoria: "Legislação",
      atalhos: [
        { rotulo: "Acervo de Legislação Ambiental", href: "/ambiental/legislacao", principal: true },
        { rotulo: "Pautas do COPAM", href: "/ambiental/copam" },
        { rotulo: "Termos de Ajustamento (TACs)", href: "/ambiental/tac" },
      ],
    };
  }

  if (
    normalizada === "condicionantes" ||
    normalizada.includes("condicionantes ambientais") ||
    normalizada.includes("condicionantes de barragens")
  ) {
    return {
      tipo: "pagina",
      titulo: "Condicionantes Ambientais de Barragens",
      subtitulo: "Piloto Irapé e Setúbal · Evidências e Cumprimento",
      texto:
        "Auditoria pública de condicionantes de licenças e TACs: reassentamentos, monitoramento sísmico e proteção biológica com links auditáveis à fonte oficial.",
      categoria: "Meio Ambiente",
      atalhos: [
        { rotulo: "Painel de Condicionantes", href: "/ambiental/condicionantes", principal: true },
        { rotulo: "Painel de Barragens", href: "/ambiental/barragens" },
        { rotulo: "Descaracterização", href: "/ambiental/barragens/descaracterizacao" },
      ],
    };
  }


  // ─── 2. DEGRAU: CIDADES ESPECÍFICAS ────────────────────────────────────
  if (
    normalizada === "betim" ||
    normalizada.startsWith("betim ") ||
    normalizada.endsWith(" betim") ||
    normalizada.includes("cidade de betim") ||
    normalizada.includes("prefeitura de betim")
  ) {
    return {
      tipo: "cidade",
      titulo: "Município de Betim / MG",
      subtitulo: "Painel de Transparência Municipal",
      texto:
        "Consulte os contratos públicos, despesas orçamentárias, diário oficial, servidores e vereadores de Betim com filtros em tempo real e exportação de dados.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Betim", href: "/betim", principal: true },
        { rotulo: "Contratos Públicos", href: "/betim/prefeitura/contratos" },
        { rotulo: "Despesas Orçamentárias", href: "/betim/prefeitura/despesas" },
        { rotulo: "Diário Oficial", href: "/betim/prefeitura/diario" },
        { rotulo: "Câmara Municipal", href: "/betim/camara" },
      ],
    };
  }

  if (
    normalizada === "bh" ||
    normalizada === "belo horizonte" ||
    normalizada.includes("belo horizonte") ||
    normalizada.startsWith("bh ") ||
    normalizada.endsWith(" bh")
  ) {
    return {
      tipo: "cidade",
      titulo: "Belo Horizonte / MG",
      subtitulo: "Capital de Minas Gerais",
      texto:
        "Acompanhe o Diário Oficial do Município (DOM), contratos, licitações, despesas e repasses federais de Belo Horizonte.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de BH", href: "/bh", principal: true },
        { rotulo: "Índice de Atos Oficiais", href: "/bh/indice" },
        { rotulo: "ComunicaBR — Repasses Federais", href: "/dados/comunicabr" },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
      ],
    };
  }

  if (normalizada === "diamantina" || normalizada.includes("diamantina")) {
    return {
      tipo: "cidade",
      titulo: "Diamantina / MG",
      subtitulo: "Vale do Jequitinhonha",
      texto:
        "Consulte o acervo histórico do Diário Oficial de Diamantina (16.600+ atos oficiais catalogados), licitações, compras públicas e estudos acadêmicos da UFVJM.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Diamantina", href: "/diamantina/indice", principal: true },
        { rotulo: "Diário Oficial na Íntegra", href: "/diamantina/prefeitura/diario" },
        { rotulo: "Estudos Rurais do Jequitinhonha", href: "/estudos-rurais" },
        { rotulo: "Biblioteca & Pesquisas", href: "/biblioteca" },
      ],
    };
  }

  if (normalizada === "aracuai" || normalizada.includes("aracuai")) {
    return {
      tipo: "cidade",
      titulo: "Araçuaí / Médio Jequitinhonha",
      subtitulo: "Polo Regional do Lítio",
      texto:
        "Fiscalize a arrecadação de royalties da mineração de lítio (CFEM), contratos públicos municipais e pesquisas sobre agricultura familiar no Médio Jequitinhonha.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Araçuaí", href: "/aracuai", principal: true },
        { rotulo: "Royalties do Lítio no Vale", href: "/noticias/itinga-transparencia-repasses-litio" },
        { rotulo: "Estudos Rurais & PPGER", href: "/estudos-rurais" },
        { rotulo: "Barragens e Mineração", href: "/ambiental/barragens" },
      ],
    };
  }

  if (normalizada === "itinga" || normalizada.includes("itinga")) {
    return {
      tipo: "cidade",
      titulo: "Itinga / Médio Jequitinhonha",
      subtitulo: "Mineração de Lítio e Transparência",
      texto:
        "Monitore os repasses da compensação financeira mineral (CFEM da Sigma Lithium) e a prestação de contas dos investimentos sociais em Itinga.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Itinga", href: "/itinga", principal: true },
        { rotulo: "Investigação dos Repasses do Lítio", href: "/noticias/itinga-transparencia-repasses-litio" },
        { rotulo: "Grandes Empresas & Mineradoras", href: "/empresas" },
        { rotulo: "ComunicaBR — Repasses Federais", href: "/dados/comunicabr" },
      ],
    };
  }

  if (
    normalizada === "sp" ||
    normalizada === "sao paulo" ||
    normalizada.includes("sao paulo") ||
    normalizada.startsWith("sp ") ||
    normalizada.endsWith(" sp")
  ) {
    return {
      tipo: "cidade",
      titulo: "São Paulo / SP",
      subtitulo: "199 Cidades Estratégicas",
      texto:
        "Acesse os indicadores de saúde, educação, metas de governo e acompanhamento de políticas públicas de São Paulo.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "199 Cidades Estratégicas", href: "/cidades", principal: true },
        { rotulo: "Governo: Prometeu? Cumpriu?", href: "/governo" },
        { rotulo: "Tarifa Social de Energia e Água", href: "/noticias/tarifa-social-energia-agua-como-acessar" },
        { rotulo: "Painel de Saúde Pública", href: "/direitos-em-movimento/saude-publica" },
      ],
    };
  }

  if (
    normalizada === "cidades" ||
    normalizada === "municipios" ||
    normalizada === "199 cidades" ||
    normalizada.includes("cidades estrategicas") ||
    normalizada.includes("todas as cidades")
  ) {
    return {
      tipo: "cidade",
      titulo: "199 Cidades Estratégicas de Minas Gerais",
      subtitulo: "Catálogo Municipal de Transparência Cívica",
      texto:
        "Consulte orçamentos, contratos do PNCP, indicadores de saúde e educação e dados da mineração nos 199 municípios monitorados em Minas Gerais.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Abrir Catálogo de 199 Cidades", href: "/cidades", principal: true },
        { rotulo: "Comparador Municipal", href: "/laboratorio/comparador" },
        { rotulo: "ComunicaBR — 853 Municípios", href: "/dados/comunicabr" },
        { rotulo: "Betim / MG", href: "/betim" },
        { rotulo: "Belo Horizonte / MG", href: "/bh" },
      ],
    };
  }

  // ─── 3. DEGRAU: EMPRESAS E MINERADORAS ────────────────────────────────
  if (
    normalizada === "vale" ||
    normalizada === "vale3" ||
    normalizada.includes("mineradora vale") ||
    normalizada.includes("acoes da vale") ||
    normalizada.includes("cotacao vale")
  ) {
    return {
      tipo: "empresa",
      titulo: "Vale S.A. & Observatório Vale",
      subtitulo: "Mineração, Mercado e Responsabilidade Socioambiental",
      texto:
        "Monitore cotações (VALE3) na B3, documentos enviados à CVM, composição acionária global (BlackRock, Previ) e auditoria da reparação do desastre de Brumadinho.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Observatório Vale (CVM & Ações)", href: "/paraopeba/vale", principal: true },
        { rotulo: "Execução do Acordo de Brumadinho", href: "/paraopeba/execucao" },
        { rotulo: "Ficha Corporativa da Vale", href: "/empresas/vale" },
        { rotulo: "Biblioteca Socioambiental", href: "/ambiental/crimes-socioambientais" },
      ],
    };
  }

  if (
    normalizada.includes("sigma lithium") ||
    normalizada.includes("sigma litio") ||
    normalizada === "sigma"
  ) {
    return {
      tipo: "empresa",
      titulo: "Sigma Lithium Corporation",
      subtitulo: "Mineração de Lítio no Vale do Jequitinhonha",
      texto:
        "Consulte dados de governança corporativa, impactos socioambientais, teses científicas e arrecadação de royalties minerais (CFEM) nos municípios do Vale.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Ficha da Sigma Lithium", href: "/empresas/sigma-lithium", principal: true },
        { rotulo: "Investigação dos Repasses do Lítio", href: "/noticias/itinga-transparencia-repasses-litio" },
        { rotulo: "Biblioteca & Teses Científicas", href: "/biblioteca" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
      ],
    };
  }

  if (normalizada === "csn" || normalizada.includes("companhia siderurgica nacional")) {
    return {
      tipo: "empresa",
      titulo: "CSN (Companhia Siderúrgica Nacional)",
      subtitulo: "Siderurgia, Mineração e Barragens",
      texto:
        "Acompanhe a classificação de risco das barragens de rejeitos (Casa de Pedra em Congonhas), processos no SIRENEJud e quadro de acionistas.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Painel de Grandes Empresas", href: "/empresas", principal: true },
        { rotulo: "Painel de Barragens SIGBM", href: "/ambiental/barragens" },
        { rotulo: "SIRENEJud — Processos Ambientais", href: "/judiciario/sirenejud" },
      ],
    };
  }

  if (normalizada === "cemig" || normalizada.includes("companhia energetica de minas")) {
    return {
      tipo: "empresa",
      titulo: "CEMIG (Companhia Energética de Minas Gerais)",
      subtitulo: "Energia Elétrica e Direitos do Consumidor",
      texto:
        "Acesse o guia da Tarifa Social de Energia Elétrica (desconto de até 65% na conta de luz para inscritos no CadÚnico) e canais oficiais da concessionária.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Tutorial da Tarifa Social", href: "/noticias/tarifa-social-energia-agua-como-acessar", principal: true },
        { rotulo: "Canais Oficiais LAI", href: "/direitos-em-movimento/informacao" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
      ],
    };
  }

  if (normalizada === "copasa" || normalizada.includes("companhia de saneamento")) {
    return {
      tipo: "empresa",
      titulo: "COPASA (Companhia de Saneamento de MG)",
      subtitulo: "Recursos Hídricos e Saneamento Básico",
      texto:
        "Consulte informações sobre a Tarifa Social de Água e Esgoto, outorgas de captação de água, qualidade dos rios de Minas Gerais e canais de atendimento.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Tarifa Social de Água e Esgoto", href: "/noticias/tarifa-social-energia-agua-como-acessar", principal: true },
        { rotulo: "Nossos Rios & Bacias Hidrográficas", href: "/ambiental/nossos-rios" },
        { rotulo: "Canais Oficiais LAI", href: "/direitos-em-movimento/informacao" },
      ],
    };
  }

  if (
    normalizada === "empresas" ||
    normalizada === "mineradoras" ||
    normalizada.includes("painel de empresas") ||
    normalizada.includes("grandes empresas")
  ) {
    return {
      tipo: "empresa",
      titulo: "Grandes Empresas e Concessionárias",
      subtitulo: "Painel de Governança, Contratos e Impacto Socioambiental",
      texto:
        "Acompanhe o perfil acionário, contratos públicos, processos judiciais ambientais e licenças de grandes corporações em Minas Gerais.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Painel Geral de Empresas", href: "/empresas", principal: true },
        { rotulo: "Mineradoras do Canadá (TSX)", href: "/canada/mineracao" },
        { rotulo: "Corporações & Fundos EUA (SEC)", href: "/eua/empresas" },
        { rotulo: "Vale S.A.", href: "/paraopeba/vale" },
        { rotulo: "Sigma Lithium", href: "/empresas/sigma-lithium" },
      ],
    };
  }

  if (
    normalizada === "canada" ||
    normalizada.includes("mineradoras canadenses") ||
    normalizada.includes("bolsa de toronto") ||
    normalizada.includes("tsx") ||
    normalizada.includes("ouvidoria core") ||
    normalizada.includes("core canada")
  ) {
    return {
      tipo: "empresa",
      titulo: "Canadá — Mineradoras no Brasil (TSX & TSXV)",
      subtitulo: "Acervo da Bolsa de Toronto e Ouvidoria Federal CORE",
      texto:
        "Consulte 12 mineradoras canadenses com operações no Brasil (lítio no Jequitinhonha e ouro), barragens de rejeitos e canal de denúncias de direitos humanos.",
      categoria: "Internacional",
      atalhos: [
        { rotulo: "Mineradoras do Canadá (/canada/mineracao)", href: "/canada/mineracao", principal: true },
        { rotulo: "Hub Oficial do Canadá", href: "/canada" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
        { rotulo: "Ouvidoria CORE Canadá", href: "https://core-ombuds.canada.ca" },
      ],
    };
  }

  if (
    normalizada === "eua" ||
    normalizada === "estados unidos" ||
    normalizada.includes("empresas eua") ||
    normalizada === "sec" ||
    normalizada.includes("sec edgar") ||
    normalizada.includes("fundos eua")
  ) {
    return {
      tipo: "empresa",
      titulo: "Estados Unidos — Corporações & Fundos na SEC",
      subtitulo: "Mercado de Capitais e Formulários Form 20-F",
      texto:
        "Consulte relatórios anuais Form 20-F e 10-K na SEC americana, fundos globais como BlackRock e contratos federais no USAspending.gov.",
      categoria: "Internacional",
      atalhos: [
        { rotulo: "Corporações & Fundos SEC (/eua/empresas)", href: "/eua/empresas", principal: true },
        { rotulo: "Hub Oficial dos EUA", href: "/eua" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
        { rotulo: "SEC EDGAR Oficial", href: "https://www.sec.gov/edgar" },
      ],
    };
  }

  // ─── 3.5. DEGRAU: INSTITUIÇÕES DE JUSTIÇA & ÓRGÃOS DE CONTROLE ────────
  if (
    normalizada === "tjmg" ||
    normalizada.includes("tribunal de justica de minas") ||
    normalizada.includes("desembargadores tjmg")
  ) {
    return {
      tipo: "pagina",
      titulo: "TJMG — Tribunal de Justiça de Minas Gerais",
      subtitulo: "Orçamento de R$ 14,96 Bi · Despesas e Folha de Pagamento",
      texto:
        "Ficha analítica do TJMG: orçamento anual, auxílio-alimentação (R$ 380 mi), diárias (R$ 48 mi), estrutura de comarcas e produtividade judiciária.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ficha do TJMG", href: "/judiciario/instituicoes/tjmg", principal: true },
        { rotulo: "Quem Fiscaliza a Justiça", href: "/judiciario/instituicoes" },
        { rotulo: "Balcão Virtual e Varas", href: "/judiciario/contatos" },
        { rotulo: "Recomendações CNJ", href: "/noticias/recomendacoes-cnj-cnmp-e-inspecoes-da-justica" },
      ],
    };
  }

  if (
    normalizada === "mpmg" ||
    normalizada.includes("ministerio publico de minas") ||
    normalizada.includes("promotores mpmg")
  ) {
    return {
      tipo: "pagina",
      titulo: "MPMG — Ministério Público de Minas Gerais",
      subtitulo: "Orçamento de R$ 4,09 Bi · CAOMA e Verbas Indenizatórias",
      texto:
        "Ficha institucional do MPMG: promotorias especializadas, verbas indenizatórias (R$ 684 mi), ouvidoria pública e atuação ambiental.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ficha do MPMG", href: "/judiciario/instituicoes/mpmg", principal: true },
        { rotulo: "Quem Fiscaliza a Justiça", href: "/judiciario/instituicoes" },
        { rotulo: "Canal de Denúncias", href: "/direitos-em-movimento/denuncia" },
      ],
    };
  }

  if (
    normalizada === "dpmg" ||
    normalizada.includes("defensoria publica de minas") ||
    normalizada.includes("defensores publicos")
  ) {
    return {
      tipo: "pagina",
      titulo: "DPMG — Defensoria Pública de Minas Gerais",
      subtitulo: "Orçamento de R$ 1,10 Bi · Assistência Jurídica Gratuita",
      texto:
        "Ficha da DPMG: mapa de comarcas atendidas, déficit de defensores públicos perante a demanda e canais para atendimento gratuito ao cidadão.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ficha da DPMG", href: "/judiciario/instituicoes/dpmg", principal: true },
        { rotulo: "Onde Buscar Ajuda Jurídica", href: "/direitos-em-movimento/ajuda" },
        { rotulo: "Quem Fiscaliza a Justiça", href: "/judiciario/instituicoes" },
      ],
    };
  }

  if (
    normalizada === "tcemg" ||
    normalizada === "tce" ||
    normalizada.includes("tribunal de contas do estado")
  ) {
    return {
      tipo: "pagina",
      titulo: "TCEMG — Tribunal de Contas do Estado de MG",
      subtitulo: "Orçamento de R$ 1,15 Bi · Controle Externo das Contas",
      texto:
        "Ficha do TCEMG: fiscalização de contas dos 853 municípios mineiros, rejeição de contas de prefeitos e auditorias do estado.",
      categoria: "Órgãos de Controle",
      atalhos: [
        { rotulo: "Ficha do TCEMG", href: "/judiciario/instituicoes/tcemg", principal: true },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
        { rotulo: "199 Cidades Monitoradas", href: "/cidades" },
      ],
    };
  }

  if (
    normalizada === "judiciario" ||
    normalizada.includes("poder judiciario") ||
    normalizada.includes("instituicoes de justica") ||
    normalizada.includes("quem fiscaliza a justica")
  ) {
    return {
      tipo: "pagina",
      titulo: "Quem Fiscaliza a Justiça — Mapa das Instituições",
      subtitulo: "TJMG, MPMG, DPMG, TRT-3, TRF-6, TCEMG, DPU e Conselhos",
      texto:
        "Painel comparativo das instituições de justiça em Minas Gerais: orçamentos, penduricalhos, folhas de pagamento e limites do controle externo no CNJ e CNMP.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Painel das Instituições de Justiça", href: "/judiciario/instituicoes", principal: true },
        { rotulo: "Ficha do TJMG", href: "/judiciario/instituicoes/tjmg" },
        { rotulo: "Ficha do MPMG", href: "/judiciario/instituicoes/mpmg" },
        { rotulo: "Ficha da DPMG", href: "/judiciario/instituicoes/dpmg" },
        { rotulo: "Balcão Virtual e Varas", href: "/judiciario/contatos" },
      ],
    };
  }

  // ─── 4. DEGRAU: CENTRAL E FERRAMENTAS DO PORTAL ───────────────────────
  if (
    normalizada === "busca" ||
    normalizada === "pesquisa" ||
    normalizada === "procurar" ||
    normalizada.includes("buscar atos") ||
    normalizada.includes("pesquisar no site")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Busca Geral & Atos Oficiais",
      subtitulo: "Mecanismo Unificado de Busca do Controle Popular",
      texto:
        "Pesquise termos em atos oficiais, contratos, diários municipais, páginas estruturais, notícias e decisões com filtros em tempo real.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Busca Geral", href: "/busca", principal: true },
        { rotulo: "Radar de Editais", href: "/editais" },
        { rotulo: "Índice Geral do Site", href: "/indice" },
      ],
    };
  }

  if (
    normalizada === "editais" ||
    normalizada === "edital" ||
    normalizada === "licitacoes" ||
    normalizada === "pregao" ||
    normalizada.includes("radar de editais") ||
    normalizada.includes("diario oficial mg")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Radar de Editais & Licitações DO-MG",
      subtitulo: "Monitoramento Diário do Diário Oficial de MG",
      texto:
        "Acompanhe editais de chamamento público, licitações, credenciamentos em saúde/educação e certames publicados no Diário Oficial de Minas Gerais.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Radar de Editais", href: "/editais", principal: true },
        { rotulo: "Contratos Públicos PNCP", href: "/estado-e-economia/compras-publicas" },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
      ],
    };
  }

  if (
    normalizada === "biblioteca" ||
    normalizada === "estudos" ||
    normalizada === "pesquisas" ||
    normalizada === "teses" ||
    normalizada.includes("biblioteca socioambiental") ||
    normalizada.includes("artigos cientificos")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Biblioteca Socioambiental & Estudos Rurais",
      subtitulo: "Repositório Acadêmico e Cívico",
      texto:
        "Consulte artigos científicos, teses da UFVJM, relatórios de perícia independente da UFMG e pareceres técnicos sobre conflitos territoriais e mineração.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Biblioteca", href: "/biblioteca", principal: true },
        { rotulo: "Estudos Rurais do Jequitinhonha", href: "/estudos-rurais" },
        { rotulo: "Biblioteca Brumadinho (ATIs/UFMG)", href: "/paraopeba/biblioteca" },
      ],
    };
  }

  if (
    normalizada === "imprensa" ||
    normalizada === "jornalistas" ||
    normalizada === "sala de imprensa" ||
    normalizada.includes("dados para imprensa") ||
    normalizada.includes("contato imprensa")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Sala de Imprensa & Dados Consolidados",
      subtitulo: "Recursos para Redações, Repórteres e Pesquisadores",
      texto:
        "Consulte os dados consolidados do portal (R$ 251 bilhões em recursos públicos auditados, 199 cidades e 963 documentos) e orientações de pauta cívica.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Acessar Sala de Imprensa", href: "/imprensa", principal: true },
        { rotulo: "Central de Notícias ONSA", href: "/noticias" },
        { rotulo: "Documentação Técnica", href: "/documentacao" },
      ],
    };
  }

  if (
    normalizada === "indice" ||
    normalizada === "mapa do site" ||
    normalizada === "todas as paginas" ||
    normalizada === "sumario" ||
    normalizada.includes("indice geral")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Índice Geral do Portal Controle Popular",
      subtitulo: "Mapa Completo de Navegação e Acervos",
      texto:
        "Acesse o mapa completo com todos os eixos temáticos, 18 subfrentes, 199 cidades, tribunais, órgãos de justiça e acervos catalogados.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Índice Geral", href: "/indice", principal: true },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
        { rotulo: "Fontes dos 27 Estados", href: "/fontes-estados" },
      ],
    };
  }

  if (
    normalizada === "documentacao" ||
    normalizada === "api" ||
    normalizada === "arquitetura" ||
    normalizada === "metodologia" ||
    normalizada.includes("documentacao tecnica") ||
    normalizada.includes("como funciona o portal") ||
    normalizada.includes("como funciona o site") ||
    normalizada.includes("como funciona a api")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Documentação Técnica & API Pública",
      subtitulo: "Transparência Metodológica e Código Aberto",
      texto:
        "Conheça a arquitetura técnica do portal, catálogo de APIs públicas, fontes governamentais integradas, pipelines de ETL e princípios de auditoria de dados.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Documentação Técnica", href: "/documentacao", principal: true },
        { rotulo: "Tecnologia & IA Livre", href: "/tecnologia" },
        { rotulo: "Sobre o Portal & ONSA", href: "/sobre" },
      ],
    };
  }

  if (
    normalizada === "fontes" ||
    normalizada === "27 estados" ||
    normalizada === "fontes estados" ||
    normalizada.includes("fontes de dados") ||
    normalizada.includes("portais de transparencia")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Fontes de Dados dos 27 Estados",
      subtitulo: "Catálogo Nacional de Portais de Transparência e Controle",
      texto:
        "Guia completo de portais oficiais de transparência, Tribunais de Contas (TCEs), Ministérios Públicos (MPEs) e Diários Oficiais dos 27 estados do Brasil.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Abrir Fontes dos 27 Estados", href: "/fontes-estados", principal: true },
        { rotulo: "ComunicaBR — Repasses Federais", href: "/dados/comunicabr" },
        { rotulo: "Documentação de Fontes", href: "/documentacao" },
      ],
    };
  }

  if (
    normalizada === "sobre" ||
    normalizada === "onsa" ||
    normalizada === "quem somos" ||
    normalizada.includes("sobre o portal") ||
    normalizada.includes("observatorio nacional socioambiental")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Sobre o Controle Popular e o ONSA",
      subtitulo: "Observatório Nacional Socioambiental",
      texto:
        "O Controle Popular é uma plataforma cívica pública, independente e auditável, mantida para empoderar comunidades, movimentos sociais e pesquisadores com dados abertos.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Conhecer o Projeto e Equipe", href: "/sobre", principal: true },
        { rotulo: "Sala de Imprensa", href: "/imprensa", principal: false },
        { rotulo: "Termos e Política Cívica", href: "/termos" },
      ],
    };
  }

  if (
    normalizada === "governo" ||
    normalizada === "prometeu cumpriu" ||
    normalizada.includes("metas de governo") ||
    normalizada.includes("plano de governo")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "Governo: Prometeu? Cumpriu?",
      subtitulo: "Monitoramento de Promessas e Metas Públicas",
      texto:
        "Acompanhe o status de execução das metas oficiais de governos e prefeituras com base em relatórios fiscais e prestação de contas.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Painel Prometeu? Cumpriu?", href: "/governo", principal: true },
        { rotulo: "Orçamento de MG", href: "/estado-e-economia/orcamento" },
        { rotulo: "Compras e Obras Paralisadas", href: "/estado-e-economia/obras-paralisadas" },
      ],
    };
  }

  if (
    normalizada === "comunicabr" ||
    normalizada.includes("repasses federais") ||
    normalizada.includes("governo federal em mg") ||
    normalizada.includes("bolsa familia mg")
  ) {
    return {
      tipo: "ferramenta",
      titulo: "ComunicaBR — Repasses Federais em Minas Gerais",
      subtitulo: "R$ 139 Bilhões nos 853 Municípios Mineiros",
      texto:
        "Consulte repasses do Governo Federal em saúde, educação (Fundeb), Bolsa Família, BPC e programas sociais para cada município de Minas Gerais.",
      categoria: "Central & Ferramentas",
      atalhos: [
        { rotulo: "Painel ComunicaBR", href: "/dados/comunicabr", principal: true },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
        { rotulo: "Saúde Pública e SUS", href: "/direitos-em-movimento/saude-publica" },
      ],
    };
  }

  // ─── 5. DEGRAU: RESPOSTAS CURADAS DA BASE OFICIAL ──────────────────────
  const curada = buscarRespostaCurada(prompt, slugCidadeOuZona);
  if (curada && curada.resposta) {
    const atalhos: AtalhoAcao[] = [];
    if (curada.linkPrincipal) {
      atalhos.push({
        rotulo: curada.linkPrincipal.texto,
        href: curada.linkPrincipal.href,
        principal: true,
      });
    }
    if (curada.linksAdicionais) {
      for (const l of curada.linksAdicionais) {
        atalhos.push({
          rotulo: l.texto,
          href: l.href,
        });
      }
    }

    return {
      tipo: "curada",
      titulo: "Resposta Oficial Curada",
      subtitulo: "Base de Conhecimento do Controle Popular",
      texto: curada.resposta,
      categoria: "Acervo Oficial",
      atalhos,
    };
  }

  // ─── 6. DEGRAU: BLOG E REPORTAGENS INVESTIGATIVAS ────────────────────
  if (
    normalizada === "blog" ||
    normalizada === "noticias" ||
    normalizada === "reportagens" ||
    normalizada === "investigacoes" ||
    normalizada.includes("central de noticias") ||
    normalizada.includes("ultimas noticias")
  ) {
    const noticias = listarNoticiasPortal();
    const topNoticias = noticias.slice(0, 4);
    return {
      tipo: "noticia",
      titulo: "Central de Notícias & Investigações Cívicas",
      subtitulo: "Jornalismo de Dados e Relatórios Técnicos do ONSA",
      texto:
        "Acompanhe reportagens exclusivas sobre royalties do lítio, tarifa social, desastres da mineração, orçamentos da justiça e direitos fundamentais.",
      categoria: "Blog & Notícias",
      atalhos: [
        { rotulo: "Ver Todas as Notícias", href: "/noticias", principal: true },
        ...topNoticias.map((n) => ({
          rotulo: n.titulo.length > 38 ? n.titulo.slice(0, 35) + "..." : n.titulo,
          href: `/noticias/${n.slug}`,
        })),
      ],
    };
  }

  // Busca específica por reportagem conhecida do blog
  const noticiasAcervo = listarNoticiasPortal();
  const noticiaCorrespondente = noticiasAcervo.find((n) => {
    const titNorm = semAcento(n.titulo.toLowerCase());
    const slugNorm = semAcento(n.slug.toLowerCase());
    const chavesNorm = n.palavrasChave.map((k) => semAcento(k.toLowerCase()));

    return (
      titNorm.includes(normalizada) ||
      normalizada.includes(slugNorm) ||
      chavesNorm.some((k) => k === normalizada || (k.length > 4 && normalizada.includes(k)))
    );
  });

  if (noticiaCorrespondente) {
    return {
      tipo: "noticia",
      titulo: noticiaCorrespondente.titulo,
      subtitulo: `${noticiaCorrespondente.categoria} · ${new Date(noticiaCorrespondente.publicadoEm).toLocaleDateString("pt-BR")}`,
      texto: noticiaCorrespondente.resumo,
      categoria: "Reportagem Investigativa",
      atalhos: [
        { rotulo: "Ler Reportagem Completa", href: `/noticias/${noticiaCorrespondente.slug}`, principal: true },
        { rotulo: "Central de Notícias", href: "/noticias" },
        ...noticiaCorrespondente.fontesOficiais.slice(0, 2).map((f) => ({
          rotulo: `Fonte: ${f.nome}`,
          href: f.url,
        })),
      ],
    };
  }

  // ─── 6.5. DEGRAU: EXPANSÃO INTERNACIONAL (EUA & CANADÁ) E TRILÍNGUE ────
  if (
    /\b(explain in plain english|explica en espanol|explique em portugues simples)\b/i.test(normalizada) ||
    /\b(eua|estados unidos|united states|sec edgar|usaspending|superfund|epa echo|nid dams|foia)\b/i.test(normalizada)
  ) {
    const isEn = normalizada.includes("english") || normalizada.includes("united states");
    const isEs = normalizada.includes("espanol") || normalizada.includes("estados unidos de america");
    const isCanada = normalizada.includes("canada") || normalizada.includes("tsx") || normalizada.includes("mount polley");

    if (!isCanada) {
      return {
        tipo: "pagina",
        titulo: isEn
          ? "United States Civic Observatory (/eua)"
          : isEs
          ? "Observatorio Cívico de EE. UU. (/eua)"
          : "Observatório Cívico dos Estados Unidos (/eua)",
        subtitulo: isEn
          ? "SEC EDGAR · USAspending · EPA ECHO · NID · OpenAlex · GBIF"
          : isEs
          ? "SEC EDGAR · USAspending · EPA ECHO · NID · OpenAlex · GBIF"
          : "SEC EDGAR · USAspending · EPA ECHO · NID · OpenAlex · GBIF",
        texto: isEn
          ? "We audit US public contracts, SEC corporate filings, EPA penalties, 91,000 dams, and scientific data."
          : isEs
          ? "Auditamos contratos públicos de EE. UU., balances en la SEC, multas de la EPA y represas."
          : "Monitoramos contratos federais nos EUA, balanços na SEC, multas da EPA, barragens no NID e biodiversidade.",
        categoria: "Internacional · EUA",
        atalhos: [
          { rotulo: isEn ? "Open US Hub (/eua)" : isEs ? "Abrir Hub EE. UU. (/eua)" : "Painel Geral dos EUA (/eua)", href: "/eua", principal: true },
          { rotulo: "SEC EDGAR & Fundos (/eua/empresas)", href: "/eua/empresas" },
          { rotulo: "EPA, Barragens & Natureza (/eua/ambiental)", href: "/eua/ambiental" },
          { rotulo: "USAspending & Comércio (/eua/contratos)", href: "/eua/contratos" },
          { rotulo: "Congresso, SCOTUS & Terras (/eua/institucional)", href: "/eua/institucional" },
        ],
      };
    }
  }

  if (
    /\b(canada|canadian|tsx|sedar|mount polley|npri|eccc|first nations|primeiras nacoes|openparliament|core ombuds|sudbury)\b/i.test(
      normalizada
    )
  ) {
    const isEn = normalizada.includes("english") || normalizada.includes("canadian");
    const isEs = normalizada.includes("espanol");

    return {
      tipo: "pagina",
      titulo: isEn
        ? "Canada Civic & Mining Observatory (/canada)"
        : isEs
        ? "Observatorio Cívico y Minero de Canadá (/canada)"
        : "Observatório Cívico e Minerário do Canadá (/canada)",
      subtitulo: "TSX/SEDAR+ · Open Canada · ECCC NPRI · Mount Polley · First Nations",
      texto: isEn
        ? "We track Canadian miners operating in Brazil, NPRI tailings emissions, Mount Polley, and First Nations treaties."
        : isEs
        ? "Rastreamos mineras canadienses en Brasil, emisiones NPRI, Mount Polley y tierras de las Primeras Naciones."
        : "Cruzamos mineradoras canadenses na TSX que atuam no Brasil, emissões NPRI, Mount Polley e Primeiras Nações.",
      categoria: "Internacional · Canadá",
      atalhos: [
        { rotulo: isEn ? "Open Canada Hub (/canada)" : isEs ? "Abrir Hub Canadá (/canada)" : "Painel Geral do Canadá (/canada)", href: "/canada", principal: true },
        { rotulo: "Mineradoras TSX no Brasil (/canada/mineracao)", href: "/canada/mineracao" },
        { rotulo: "NPRI, Água & Mount Polley (/canada/ambiental)", href: "/canada/ambiental" },
        { rotulo: "Compras & Subsídios (/canada/contratos)", href: "/canada/contratos" },
        { rotulo: "Parlamento, Corte & Indígenas (/canada/institucional)", href: "/canada/institucional" },
      ],
    };
  }

  // ─── 7. DEGRAU: BUSCA EM PÁGINAS ESTRUTURAIS DO PORTAL (~100 PÁGINAS) ──
  const paginasEncontradas = buscarPaginasPortal(prompt, 3);
  if (paginasEncontradas.length > 0) {
    const principal = paginasEncontradas[0];
    const titNorm = semAcento(principal.titulo.toLowerCase());
    const rotaNorm = semAcento(principal.href.toLowerCase());
    const chavesNorm = principal.palavrasChave.map((k) => semAcento(k.toLowerCase()));

    // Confere se a correspondência é forte o suficiente para interceptação direta
    const ehMatchForte =
      titNorm.includes(normalizada) ||
      normalizada.includes(titNorm.split("—")[0].trim()) ||
      normalizada.includes(rotaNorm.replace(/^\//, "")) ||
      chavesNorm.some((k) => k === normalizada || (k.length > 3 && normalizada === k));

    if (ehMatchForte) {
      return {
        tipo: "pagina",
        titulo: principal.titulo,
        subtitulo: principal.rotulo,
        texto: principal.descricao,
        categoria: "Navegação do Portal",
        atalhos: [
          { rotulo: `Abrir ${principal.rotulo}`, href: principal.href, principal: true },
          ...paginasEncontradas.slice(1).map((p) => ({
            rotulo: p.rotulo,
            href: p.href,
          })),
        ],
      };
    }
  }

  return null;
}

/**
 * Avalia se a entrada do usuário corresponde a um degrau determinístico antes de invocar a IA.
 * Retorna o cartão de ação formatado ou `null` caso deva prosseguir para o RAG / IA.
 * 
 * Regra de Galho da Árvore:
 * Enriquece automaticamente o resultado com links de páginas irmãs temáticas
 * pertencentes ao mesmo ramo/eixo do mapa do site.
 */
export function avaliarEscadaDeterminista(
  prompt: string,
  slugCidadeOuZona?: string
): ResultadoEscada | null {
  const resultado = avaliarEscadaBruta(prompt, slugCidadeOuZona);
  if (!resultado) return null;

  // Encontra a rota de referência para identificar o galho temático
  const rotaReferencia =
    resultado.atalhos.find((a) => a.principal)?.href ||
    resultado.atalhos[0]?.href ||
    "";

  if (rotaReferencia && !resultado.galhoRelacionado) {
    const galho = obterLinksRelacionadosGalho(rotaReferencia, 3);
    if (galho) {
      resultado.galhoRelacionado = galho;
    }
  }

  return resultado;
}

