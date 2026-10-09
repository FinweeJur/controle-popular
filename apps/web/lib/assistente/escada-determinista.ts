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
 * - Cada degrau mora na SUA função privada (`degrau1Laboratorio` ... `degrau7Paginas`),
 *   encadeada em `??` pelo `avaliarEscadaBruta`: mesma condição, mesma ordem,
 *   só sem a função gigante de 1.115 linhas que valia saúde 1,45 no CodeScene
 *   (hotspot medido em 07/10/2026, PENDENCIAS-07-10.md). A quebra é mecânica:
 *   nenhum texto, atalho ou condição mudou — quem prova é
 *   `escada-determinista.test.ts`.
 * - Os dois piores degraus saíram do arquivo em 09/10/2026: o de empresas
 *   (complexidade 31) virou `escada-empresas.ts` e o de ferramentas
 *   (complexidade 54, o pior método do projeto) virou `escada-ferramentas.ts`.
 *   Ambos deixaram a sequência de `if`s e viraram TABELA de dados, casada
 *   por `primeiroCartao()` de `escada-base.ts`. O arquivo caiu de 1.373 para
 *   963 linhas — abaixo do aviso de "Lines of Code" do CodeScene.
 */

import { buscarRespostaCurada } from "../busca/resposta-curada";
import { semAcento } from "../busca/normalizar";
import { buscarPaginasPortal } from "../busca/paginas-portal";
import { listarNoticiasPortal } from "../noticias/portal";
import { obterLinksRelacionadosGalho } from "./arvore-galhos";
import { corrigirDigitacaoFrase } from "./corretor-digitacao";
import { degrau45Bases } from "./escada-bases";
import { degrau2Cidades } from "./escada-cidades";
import { degrau3Empresas } from "./escada-empresas";
import { degrau4Ferramentas } from "./escada-ferramentas";

// Os tipos da escada vivem em `escada-base.ts` para que os degraus novos os
// importem sem depender deste arquivo (isso fecharia um ciclo de import).
// Reexportar aqui mantém os 7 importadores existentes funcionando sem mudança.
export type { AtalhoAcao, ResultadoEscada } from "./escada-base";
import type { AtalhoAcao, ResultadoEscada } from "./escada-base";

/**
 * Avalia se a entrada do usuário corresponde a um degrau determinístico antes de invocar a IA.
 * Executa a lógica bruta de casamento por regras, com correção tolerante a erros de digitação.
 *
 * ORQUESTRAÇÃO: cada degrau é uma função privada própria encadeada em `??`,
 * na MESMA ordem em que os `if`s eram testados no bloco único anterior a
 * 08/10/2026. `null` de um degrau passa a palavra ao seguinte — resultado
 * idêntico ao anterior, função só deixa de ser um arquivo dentro de arquivo.
 */
function avaliarEscadaBruta(
  prompt: string,
  slugCidadeOuZona?: string
): ResultadoEscada | null {
  const bruta = semAcento(prompt.trim().toLowerCase());
  if (!bruta) return null;

  // Aplica correção tolerante a erros ortográficos e de digitação
  const normalizada = corrigirDigitacaoFrase(bruta);

  return (
    degrau1Laboratorio(normalizada) ??
    degrau15Tabelas(normalizada) ??
    degrau2Cidades(normalizada) ??
    degrau3Empresas(normalizada) ??
    degrau35Justica(normalizada) ??
    degrau4Ferramentas(normalizada) ??
    degrau45Bases(normalizada) ??
    degrau5Curada(prompt, slugCidadeOuZona) ??
    degrau6Noticias(normalizada) ??
    degrau65Internacional(normalizada) ??
    degrau7Paginas(prompt, normalizada)
  );
}

/**
 * Degrau 1 — Laboratório, PowerBI, cruzamentos e a Árvore Obsidian.
 *
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão do laboratório, ou `null` para o degrau seguinte.
 */
function degrau1Laboratorio(normalizada: string): ResultadoEscada | null {
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

  return null;
}

/**
 * Degrau 1.5 — Comandos diretos de tabelas e bases: licenciamento, convênios,
 * legislação ambiental e condicionantes de barragens.
 *
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da base, ou `null` para o degrau seguinte.
 */
function degrau15Tabelas(normalizada: string): ResultadoEscada | null {
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


  return null;
}

/**
 * Degrau 3.5 — Instituições de Justiça e órgãos de controle (TJMG, MPMG,
 * DPMG, TCEMG). O comparativo de DUAS siglas juntas vem primeiro: o cartão
 * da home pergunta pelo orçamento das três de uma vez.
 *
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da instituição, ou `null` para o degrau seguinte.
 */
function degrau35Justica(normalizada: string): ResultadoEscada | null {
  // ─── 3.5. DEGRAU: INSTITUIÇÕES DE JUSTIÇA & ÓRGÃOS DE CONTROLE ────────
  // Comparativo ANTES das fichas: o cartão da home pergunta pelo orçamento do
  // TJMG, MPMG e DPMG JUNTOS ("…e a disparidade entre eles"). Sem esta regra,
  // a pergunta atravessava a escada e caía no degrau de notícias, devolvendo
  // uma reportagem sobre IPCA/Selic (medido em 06/10/2026). Duas ou mais
  // siglas juntas = pergunta comparativa.
  const siglasJustica = ["tjmg", "mpmg", "dpmg"].filter((s) => normalizada.includes(s));
  if (siglasJustica.length >= 2) {
    return {
      tipo: "ferramenta",
      titulo: "Instituições de Justiça de Minas Gerais",
      subtitulo: "TJMG · MPMG · DPMG — orçamento, folha e penduricalhos",
      texto:
        "Painel comparativo das instituições de justiça de Minas Gerais: orçamento anual de cada uma, folha de pagamento, auxílios e verbas indenizatórias, com limite constitucional e fonte oficial em cada ficha.",
      categoria: "Poder Judiciário",
      atalhos: [
        { rotulo: "Ver as Instituições de Justiça", href: "/judiciario/instituicoes", principal: true },
        { rotulo: "Ficha do TJMG", href: "/judiciario/instituicoes/tjmg" },
        { rotulo: "Ficha do MPMG", href: "/judiciario/instituicoes/mpmg" },
        { rotulo: "Ficha da DPMG", href: "/judiciario/instituicoes/dpmg" },
      ],
    };
  }

  if (
    normalizada.includes("tjmg") ||
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
    normalizada.includes("mpmg") ||
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
    normalizada.includes("dpmg") ||
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

  return null;
}

/**
 * Degrau 5 — Respostas pré-curadas da base oficial do portal.
 *
 * Recebe o prompt ORIGINAL (não o normalizado): o `buscarRespostaCurada`
 * faz a sua própria normalização interna e casa por assunto, não por literal.
 *
 * @param prompt Texto digitado pelo visitante, como veio.
 * @param slugCidadeOuZona Município/zona da conversa, quando houver.
 * @returns Cartão da resposta curada, ou `null` para o degrau seguinte.
 */
function degrau5Curada(prompt: string, slugCidadeOuZona?: string): ResultadoEscada | null {
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

  return null;
}

/**
 * Degrau 6 — Blog e reportagens investigativas do ONSA: o cartão da central
 * de notícias e a busca por reportagem conhecida (título, slug ou DUAS
 * palavras-chave — de uma só, qualquer pergunta sobre orçamento caía na
 * reportagem do IPCA/Selic, medido em 06/10/2026).
 *
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da notícia, ou `null` para o degrau seguinte.
 */
function degrau6Noticias(normalizada: string): ResultadoEscada | null {
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
      // DUAS palavras-chave, não uma: com um só acerto, qualquer pergunta que
      // mencione "orçamento" caía na reportagem do IPCA/Selic em vez da
      // resposta do assunto (medido 06/10/2026).
      chavesNorm.filter((k) => k.length > 4 && normalizada.includes(k)).length >= 2
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

  return null;
}

/**
 * Degrau 6.5 — Expansão internacional (EUA e Canadá) e pedido trilíngue.
 * O nó dos EUA só responde se NÃO for assunto do Canadá (o Canadá tem
 * regex própria logo abaixo, que fica sempre à espera).
 *
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão do hub internacional, ou `null` para o degrau seguinte.
 */
function degrau65Internacional(normalizada: string): ResultadoEscada | null {
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

  return null;
}

/**
 * Degrau 7 — Busca nas ~100 páginas estruturais do portal, com corte de
 * correspondência FORTE: título, rota ou palavra-chave inteira têm que casar,
 * senão a escada devolve `null` e a pergunta segue para o RAG / IA.
 *
 * Recebe o prompt ORIGINAL para o `buscarPaginasPortal` (que tem a sua
 * própria tolerância) e a versão normalizada para os testes de corte.
 *
 * @param prompt Texto digitado pelo visitante, como veio.
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da página, ou `null` — fim da escada, segue para a IA.
 */
function degrau7Paginas(prompt: string, normalizada: string): ResultadoEscada | null {
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

