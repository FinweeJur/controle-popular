/**
 * @file escada-determinista.ts
 * @description Módulo de Degraus Determinísticos (Regra de Escada) para o assistente Seu Nonô e Chatbot IA.
 * 
 * Papel no portal:
 * Intercepta comandos diretos e termos de alta frequência antes de acionar o modelo de IA,
 * garantindo respostas instantâneas, determinísticas e confiáveis para:
 * 1. Laboratório de Dados / PowerBI / Cruzamento de indicadores;
 * 2. Cidades estratégicas (Betim, BH, Diamantina, Araçuaí, Itinga, SP);
 * 3. Grandes empresas e mineradoras (Vale, Sigma Lithium, CSN, CEMIG, COPASA);
 * 4. Perguntas com respostas pré-curadas da base oficial do portal.
 * 
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular, rotas do App Router, painel do ONSA,
 * catálogo de cidades do IBGE e acervo de respostas curadas.
 * 
 * Decisões técnicas:
 * - Reduz latência a zero para termos frequentes e economiza chamadas de IA.
 * - Fornece botões de navegação direta com deep links auditáveis.
 * - Respeita a Regra de Escada cívica: navegação determinística antes da geração probabilística.
 */

import { buscarRespostaCurada } from "@/lib/busca/resposta-curada";
import { semAcento } from "@/lib/busca/normalizar";

export interface AtalhoAcao {
  rotulo: string;
  href: string;
  icone?: string;
  principal?: boolean;
}

export interface ResultadoEscada {
  tipo: "laboratorio" | "cidade" | "empresa" | "curada";
  titulo: string;
  subtitulo?: string;
  texto: string;
  atalhos: AtalhoAcao[];
  categoria?: string;
}

/**
 * Avalia se a entrada do usuário corresponde a um degrau determinístico antes de invocar a IA.
 * Retorna o cartão de ação formatado ou `null` caso deva prosseguir para o RAG / IA.
 */
export function avaliarEscadaDeterminista(
  prompt: string,
  slugCidadeOuZona?: string
): ResultadoEscada | null {
  const normalizada = semAcento(prompt.trim().toLowerCase());
  if (!normalizada) return null;

  // ─── 1. DEGRAU: LABORATÓRIO / POWERBI / CRUZAMENTOS / COMPARADOR ───────
  const regexLab = /\b(laboratorio|laborat[oó]rio|powerbi|power bi|cruzar|cruzamento|cruzar dados|comparador|gr[aá]ficos?|analytics|dashboard|painel bi|lab)\b/i;
  if (regexLab.test(normalizada)) {
    return {
      tipo: "laboratorio",
      titulo: "Laboratório de Cruzamento & PowerBI",
      subtitulo: "Painel Analítico de Inteligência Cívica",
      texto:
        "O Laboratório de Dados do Controle Popular permite cruzar indicadores orçamentários, contratos, leitos hospitalares, licenças ambientais e royalties em gráficos e comparadores interativos.",
      categoria: "Análise de Dados",
      atalhos: [
        { rotulo: "Abrir Laboratório de Dados", href: "/laboratorio", principal: true },
        { rotulo: "Comparador de Cidades", href: "/laboratorio/comparador" },
        { rotulo: "Séries Históricas & Gráficos", href: "/laboratorio/graficos" },
        { rotulo: "Orçamento de Minas Gerais", href: "/estado-e-economia/orcamento" },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
      ],
    };
  }

  // ─── 2. DEGRAU: CIDADES ESPECÍFICAS ────────────────────────────────────
  if (normalizada === "betim" || normalizada.startsWith("betim ") || normalizada.endsWith(" betim") || normalizada.includes("cidade de betim") || normalizada.includes("prefeitura de betim")) {
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

  if (normalizada === "aracuai" || normalizada === "aracuai" || normalizada.includes("aracuai")) {
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
    normalizada === "gerdau" ||
    normalizada === "samarco" ||
    normalizada === "bhp" ||
    normalizada === "anglo american"
  ) {
    return {
      tipo: "empresa",
      titulo: "Grandes Mineradoras & Siderúrgicas",
      subtitulo: "Governança Corporativa e Monitoramento Socioambiental",
      texto:
        "Consulte o monitoramento de grandes empresas atuantes em Minas Gerais: acionistas controladores, processos judiciais ambientais e cumprimento de acordos.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Painel de Grandes Empresas", href: "/empresas", principal: true },
        { rotulo: "Painel de Barragens SIGBM", href: "/ambiental/barragens" },
        { rotulo: "Acordo do Rio Doce (Mariana)", href: "/ambiental/mariana" },
      ],
    };
  }

  // ─── 4. DEGRAU: RESPOSTAS CURADAS DA BASE OFICIAL ──────────────────────
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
