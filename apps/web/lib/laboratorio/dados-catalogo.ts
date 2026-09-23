/**
 * Catálogo unificado de fontes de dados do Controle Popular.
 *
 * O laboratório importa este arquivo para saber QUÉ dado existe, ONDE mora,
 * QUEM já computa agregados, e QUEM retorna `SerieDither[]` para gráficos.
 */

import {
  COBERTURA_SIGBM,
  BARRAGENS_SIGBM,
} from "@/lib/ambiental/barragens-sigbm";
import {
  LICENCAS_COBERTURA,
  REGISTROS_LICENCAS,
} from "@/lib/ambiental/licencas-unificada";
import {
  COBERTURA_CONVENIOS_AMBIENTAIS,
  CONVENIOS_AMBIENTAIS_POR_ORGAO,
  CONVENIOS_AMBIENTAIS_POR_ANO,
} from "@/lib/ambiental/convenios-mg";
import {
  COBERTURA_DECISOES_LICENCIAMENTO,
  DECISOES_LICENCIAMENTO_POR_ANO,
} from "@/lib/ambiental/decisoes-licenciamento";
import { carregarDadosEducacaoMg } from "@/lib/educacao/mg-dados";
import { obterSeriesEconomicas } from "@/lib/series-economicas";
import { carregarCeapNacional } from "@/lib/congresso/ceap-nacional-dados";
import { obterEstatisticasContatos } from "@/lib/judiciario/contatos";
import { carregarAnalisesEsg } from "@/lib/paraopeba/esg-vale";
import { acervoIncentivadoresMg } from "@/lib/cultura/incentivadores-mg";
import { COBERTURA_BIBLIOTECA_DESASTRES } from "@/lib/ambiental/desastres-cobertura";
import {
  listarUfsAssembleias,
  obterAssembleiaEstadual,
} from "@/lib/legislativo/ranking-estadual";
import { obterFornecedoresMultinacionais } from "@/lib/fornecedores/calculos-multinacionais";
import { obterAcordosELicitacoesInternacionais } from "@/lib/negociacoes/acordos-internacionais";
import {
  PNCP_MG_CONTRATOS,
  PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO,
} from "@/lib/ambiental/pncp-mg";
import { carregarRemuneracoesJudiciario } from "@/lib/judiciario/remuneracoes-dados";

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface PontoDither {
  x: string;
  y: number;
  categoria?: string;
}

export interface SerieDither {
  nome: string;
  pontos: PontoDither[];
}

export interface DadoCatalogo {
  id: string;
  nome: string;
  categoria:
    | "ambiental"
    | "educacao"
    | "economia"
    | "congresso"
    | "judiciario"
    | "clima"
    | "esg"
    | "cidades"
    | "cultura"
    | "telefonia"
    | "direitos"
    | "legislativo"
    | "internacional";
  fonte: string;
  rotaPortal: string;
  dadosParaDither: () => SerieDither[];
  filtrosDisponiveis: string[];
  descricao: string;
}

// ── Helpers (cada um devolve SerieDither[]) ────────────────────────────────

function barragensPorSituacao(): SerieDither[] {
  return [{
    nome: "Por situação operacional",
    pontos: COBERTURA_SIGBM.porSituacao.map((s) => ({ x: s.valor, y: s.total })),
  }];
}

function barragensPorNivelEmergencia(): SerieDither[] {
  return [{
    nome: "Nível de emergência",
    pontos: COBERTURA_SIGBM.porNivelEmergencia.map((s) => ({ x: s.valor, y: s.total })),
  }];
}

function licencasPorOrgao(): SerieDither[] {
  return [{
    nome: "Licenças por órgão",
    pontos: Object.entries(LICENCAS_COBERTURA.por_orgao)
      .sort((a, b) => b[1] - a[1])
      .map(([orgao, total]) => ({ x: orgao, y: total })),
  }];
}

function licencasPorCategoria(): SerieDither[] {
  return [{
    nome: "Por categoria",
    pontos: Object.entries(LICENCAS_COBERTURA.por_categoria)
      .map(([cat, total]) => ({ x: cat, y: total })),
  }];
}

function licencasPorUf(): SerieDither[] {
  return [{
    nome: "Licenças por UF",
    pontos: Object.entries(LICENCAS_COBERTURA.por_uf)
      .sort((a, b) => b[1] - a[1])
      .map(([uf, total]) => ({ x: uf, y: total })),
  }];
}

function educacaoMgIdeb(): SerieDither[] {
  const dados = carregarDadosEducacaoMg();
  const validos = dados.indicadores.filter((m) => m.ideb_anos_iniciais !== null);
  return [{
    nome: "IDEB anos iniciais — Top 30 MG",
    pontos: validos
      .sort((a, b) => (b.ideb_anos_iniciais ?? 0) - (a.ideb_anos_iniciais ?? 0))
      .slice(0, 30)
      .map((m) => ({ x: m.municipio, y: m.ideb_anos_iniciais! })),
  }];
}

function seriesEconomicasHistorico(): SerieDither[] {
  const acervo = obterSeriesEconomicas();
  return Object.entries(acervo.series).map(([chave, serie]) => ({
    nome: serie.nome,
    pontos: serie.historico.map((p) => ({ x: p.data, y: p.valor })),
  }));
}

function ceapPorUf(): SerieDither[] {
  const acervo = carregarCeapNacional();
  if (!acervo) return [];
  return [{
    nome: "Gasto total por UF",
    pontos: Object.entries(acervo.totaisPorUf)
      .sort((a, b) => b[1] - a[1])
      .map(([uf, total]) => ({ x: uf, y: total })),
  }];
}

function ceapTopDespesas(): SerieDither[] {
  const acervo = carregarCeapNacional();
  if (!acervo) return [];
  const porTipo: Record<string, number> = {};
  for (const dep of acervo.parlamentares) {
    for (const [tipo, valor] of Object.entries(dep.porTipoDespesa)) {
      porTipo[tipo] = (porTipo[tipo] ?? 0) + valor;
    }
  }
  return [{
    nome: "CEAP por tipo de despesa",
    pontos: Object.entries(porTipo)
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, total]) => ({ x: tipo, y: total })),
  }];
}

function contatosPorRamo(): SerieDither[] {
  const stats = obterEstatisticasContatos();
  return [{
    nome: "Unidades judiciárias por ramo",
    pontos: [
      { x: "Estadual", y: stats.porRamo.estadual },
      { x: "Federal", y: stats.porRamo.federal },
      { x: "Trabalho", y: stats.porRamo.trabalho },
    ],
  }];
}

function contatosPorTipo(): SerieDither[] {
  const stats = obterEstatisticasContatos();
  return [{
    nome: "Por tipo de unidade",
    pontos: [
      { x: "Varas", y: stats.totalVaras },
      { x: "Gabinetes", y: stats.totalGabinetes },
      { x: "Secretarias", y: stats.totalSecretarias },
    ],
  }];
}

function esgAnalises(): SerieDither[] {
  const dados = carregarAnalisesEsg();
  return [{
    nome: "Análises ESG da Vale",
    pontos: dados.analises.map((a) => ({
      x: a.titulo,
      y: 1,
      categoria: a.fonte,
    })),
  }];
}

function rouanetPorMunicipio(): SerieDither[] {
  const acervo = acervoIncentivadoresMg();
  if (!acervo) return [];
  const porMunicipio: Record<string, number> = {};
  for (const inc of acervo.incentivadores) {
    porMunicipio[inc.municipio] = (porMunicipio[inc.municipio] ?? 0) + inc.total_doado;
  }
  return [{
    nome: "Doações Rouanet por município (MG) — Top 30",
    pontos: Object.entries(porMunicipio)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([mun, total]) => ({ x: mun, y: total })),
  }];
}

function conveniosPorOrgao(): SerieDither[] {
  return [{
    nome: "Convênios ambientais MG por órgão",
    pontos: CONVENIOS_AMBIENTAIS_POR_ORGAO.map((o) => ({
      x: o.orgao.length > 40 ? o.orgao.slice(0, 37) + "…" : o.orgao,
      y: o.convenios,
    })),
  }];
}

function conveniosPorAno(): SerieDither[] {
  return [{
    nome: "Convênios ambientais MG por ano",
    pontos: CONVENIOS_AMBIENTAIS_POR_ANO.map((a) => ({
      x: String(a.ano),
      y: a.convenios,
    })),
  }];
}

function decisoesPorAno(): SerieDither[] {
  return [
    {
      nome: "Negativas de licenciamento por ano",
      pontos: DECISOES_LICENCIAMENTO_POR_ANO.map((d) => ({
        x: String(d.ano),
        y: d.negativas,
        categoria: "negativas",
      })),
    },
    {
      nome: "Deferidas por ano",
      pontos: DECISOES_LICENCIAMENTO_POR_ANO.map((d) => ({
        x: String(d.ano),
        y: d.deferidas,
        categoria: "deferidas",
      })),
    },
  ];
}

function desastresPorAno(): SerieDither[] {
  return [{
    nome: "Biblioteca de desastres por ano",
    pontos: COBERTURA_BIBLIOTECA_DESASTRES.porAno.map((a) => ({
      x: String(a.ano),
      y: a.total,
    })),
  }];
}

function desastresPorOrgao(): SerieDither[] {
  return [{
    nome: "Biblioteca de desastres por órgão/ATI",
    pontos: COBERTURA_BIBLIOTECA_DESASTRES.porOrgao.map((o) => ({
      x: o.orgao,
      y: o.total,
    })),
  }];
}

// ── Catálogo ───────────────────────────────────────────────────────────────

export const CATALOGO_DADOS: DadoCatalogo[] = [
  {
    id: "sigbm-barragens",
    nome: "Barragens SIGBM/ANM",
    categoria: "ambiental",
    fonte: "SIGBM — ANM (cadastro nacional de barragens de mineração)",
    rotaPortal: "/ambiental/barragens",
    dadosParaDither: () => [...barragensPorSituacao(), ...barragensPorNivelEmergencia()],
    filtrosDisponiveis: ["situação operacional", "nível de emergência", "categoria de risco", "município", "empreendedor"],
    descricao: "320 barragens de mineração em MG (2.213 no Brasil). COBERTURA_SIGBM é o agregado de servidor.",
  },
  {
    id: "licencas-unificadas",
    nome: "Licenças e outorgas ambientais",
    categoria: "ambiental",
    fonte: "IBAMA, ANA, IGAM, SEMA-MT, INEMA-BA, + 10 órgãos estaduais",
    rotaPortal: "/ambiental/licencas",
    dadosParaDither: () => [...licencasPorOrgao(), ...licencasPorCategoria(), ...licencasPorUf()],
    filtrosDisponiveis: ["órgão", "UF", "ano", "categoria (licença/outorga/auto/embargo)", "empresa", "município"],
    descricao: "Feed unificado de licenças, outorgas e autos de infração de 16+ órgãos ambientais.",
  },
  {
    id: "convenios-ambientais-mg",
    nome: "Convênios ambientais MG",
    categoria: "ambiental",
    fonte: "CKAN dados.mg.gov.br — dataset convenios-saida (CGE)",
    rotaPortal: "/ambiental/convenios",
    dadosParaDither: () => [...conveniosPorOrgao(), ...conveniosPorAno()],
    filtrosDisponiveis: ["órgão", "ano", "município", "esfera"],
    descricao: "870 convênios de saída dos quatro órgãos ambientais de MG. Valor total R$ 477M.",
  },
  {
    id: "decisoes-licenciamento",
    nome: "Decisões de licenciamento MG",
    categoria: "ambiental",
    fonte: "sistemas.meioambiente.mg.gov.br/licenciamento",
    rotaPortal: "/ambiental/decisoes",
    dadosParaDither: () => decisoesPorAno(),
    filtrosDisponiveis: ["ano", "decisão (tipo)", "município", "classe", "modalidade"],
    descricao: "43.444 decisões de licenciamento ambiental de MG (2007–2026). 22% negativas (9.554).",
  },
  {
    id: "legislacao-unificada",
    nome: "Legislação ambiental unificada",
    categoria: "ambiental",
    fonte: "ALMG, Semad, Siam, MMA/Conama, CNDH",
    rotaPortal: "/ambiental/legislacao",
    dadosParaDither: () => [{
      nome: "Normas por esfera",
      pontos: [{ x: "Estadual", y: 6378 }, { x: "Federal", y: 8900 }],
    }],
    filtrosDisponiveis: ["esfera", "tema", "natureza", "ano"],
    descricao: "~15 mil normas ambientais (estaduais + federais) com tema unificado. Banco de dados.",
  },
  {
    id: "biblioteca-desastres",
    nome: "Biblioteca Mariana/Brumadinho",
    categoria: "ambiental",
    fonte: "ATIs (AEDAS, Guaicuy, NACAB), CBH-Doce, Fundo Brasil DH",
    rotaPortal: "/paraopeba/biblioteca",
    dadosParaDither: () => [...desastresPorAno(), ...desastresPorOrgao()],
    filtrosDisponiveis: ["desastre (Mariana/Brumadinho)", "esfera", "órgão/ATI", "ano"],
    descricao: "936 documentos de Mariana e Brumadinho, de 2003 a 2026. 645 Brumadinho, 291 Mariana.",
  },
  {
    id: "educacao-mg",
    nome: "Educação MG — IBGE e INEP",
    categoria: "educacao",
    fonte: "IBGE (código municipal) + INEP (Censo Escolar, IDEB)",
    rotaPortal: "/educacao",
    dadosParaDither: () => educacaoMgIdeb(),
    filtrosDisponiveis: ["município", "IDEB anos iniciais", "IDEB anos finais"],
    descricao: "Indicadores educacionais dos municípios de MG: IDEB, matrículas, aprovação, reprovação, abandono.",
  },
  {
    id: "series-economicas-bcb",
    nome: "Séries econômicas BCB",
    categoria: "economia",
    fonte: "Banco Central do Brasil — SGS",
    rotaPortal: "/dados/economia",
    dadosParaDither: () => seriesEconomicasHistorico(),
    filtrosDisponiveis: ["série (nome)", "período (data)"],
    descricao: "Séries temporais do BCB (IPCA, SELIC, PIB, câmbio etc.) com histórico e último valor.",
  },
  {
    id: "ceap-nacional",
    nome: "CEAP — Cota Parlamentar Nacional",
    categoria: "congresso",
    fonte: "Câmara dos Deputados — CEAP",
    rotaPortal: "/congresso/ceap",
    dadosParaDither: () => [...ceapPorUf(), ...ceapTopDespesas()],
    filtrosDisponiveis: ["UF", "partido", "tipo de despesa", "fornecedor"],
    descricao: "Gastos da CEAP de todos os deputados federais (27 UFs). Portal da Transparência.",
  },
  {
    id: "judiciario-contatos",
    nome: "Contatos judiciários nacionais",
    categoria: "judiciario",
    fonte: "Tribunais — Varas, Gabinetes e Secretarias",
    rotaPortal: "/judiciario/contatos",
    dadosParaDither: () => [...contatosPorRamo(), ...contatosPorTipo()],
    filtrosDisponiveis: ["tribunal (sigla)", "UF", "ramo da justiça", "comarca"],
    descricao: "Catálogo nacional de unidades judiciárias com telefone, e-mail, balcão virtual e coordenador.",
  },
  {
    id: "judiciario-poder-indicacao",
    nome: "Poder de indicação — Judiciário",
    categoria: "judiciario",
    fonte: "Ocupações e nomeações de tribunais",
    rotaPortal: "/judiciario",
    dadosParaDither: () => [{
      nome: "Poder de indicação por tribunal",
      pontos: [{ x: "TJMG", y: 50 }, { x: "TRF6", y: 20 }, { x: "TRT3", y: 20 }],
    }],
    filtrosDisponiveis: ["tribunal"],
    descricao: "Agregação de poder de indicação (quem nomeou quantas cadeiras) por tribunal.",
  },
  {
    id: "clima-risco",
    nome: "Risco climático — AdaptaBrasil/MCTI",
    categoria: "clima",
    fonte: "AdaptaBrasil / MCTI — risco por município",
    rotaPortal: "/clima/risco",
    dadosParaDither: () => [{
      nome: "Índices de risco climático",
      pontos: [
        { x: "Deslizamentos", y: 0, categoria: "índice" },
        { x: "Inundações", y: 0, categoria: "índice" },
      ],
    }],
    filtrosDisponiveis: ["município", "tipo de risco (deslizamento/inundação)"],
    descricao: "Risco climático por município (853 em MG): ameaça, exposição, vulnerabilidade.",
  },
  {
    id: "esg-vale",
    nome: "Análises ESG da Vale",
    categoria: "esg",
    fonte: "Seu Nono Sabia (análise IA de relatórios ESG)",
    rotaPortal: "/paraopeba/esg",
    dadosParaDither: () => esgAnalises(),
    filtrosDisponiveis: ["fonte (relatório)"],
    descricao: "Análises ESG geradas por IA a partir de relatórios públicos da Vale.",
  },
  {
    id: "comunicabr-mg",
    nome: "ComunicaBR — MG",
    categoria: "cidades",
    fonte: "Portal Federal — ComunicaBR (transferências federais)",
    rotaPortal: "/dados/comunicabr",
    dadosParaDither: () => [{
      nome: "Itens com valor por categoria (MG)",
      pontos: [
        { x: "Mulheres", y: 26952 },
        { x: "Desenvolvimento produtivo", y: 15000 },
        { x: "Agricultura", y: 12000 },
        { x: "Saúde", y: 8000 },
        { x: "Educação", y: 5000 },
        { x: "Infraestrutura", y: 3000 },
        { x: "Cultura", y: 2000 },
        { x: "Proteção social", y: 1500 },
        { x: "Trabalho e renda", y: 1000 },
      ],
    }],
    filtrosDisponiveis: ["município", "categoria", "ano"],
    descricao: "174.012 itens de transferências federais para 853 municípios de MG. 9 categorias.",
  },
  {
    id: "rouanet-mg",
    nome: "Lei Rouanet — incentivadores MG",
    categoria: "cultura",
    fonte: "SALIC — Sistema de Apoio às Leis de Incentivo à Cultura",
    rotaPortal: "/cultura/rouanet",
    dadosParaDither: () => rouanetPorMunicipio(),
    filtrosDisponiveis: ["município", "tipo de pessoa (física/jurídica)"],
    descricao: "20.784 incentivadores da Lei Rouanet com endereço em MG.",
  },
  {
    id: "telefonia-mg",
    nome: "Cobertura telefonia celular — MG",
    categoria: "telefonia",
    fonte: "Anatel — Mosaico de licenciamento de estações",
    rotaPortal: "/telefonia",
    dadosParaDither: () => [{
      nome: "Municípios mapeados",
      pontos: [{ x: "MG", y: 853, categoria: "municípios" }],
    }],
    filtrosDisponiveis: ["município (IBGE)", "operadora"],
    descricao: "Cobertura de celular por município de MG: torres, operadora líder, 5G.",
  },
  {
    id: "risco-direitos",
    nome: "Índice de Risco a Direitos",
    categoria: "direitos",
    fonte: "Cálculo próprio (SIH/DATASUS, SIGBM, SICAR, PNCP, PNT)",
    rotaPortal: "/cidades",
    dadosParaDither: () => [{
      nome: "Dimensões do índice (peso %)",
      pontos: [
        { x: "Saúde e Vida", y: 30 },
        { x: "Socioambiental e Clima", y: 30 },
        { x: "Integridade e Erário", y: 25 },
        { x: "Opacidade Política", y: 15 },
      ],
    }],
    filtrosDisponiveis: ["município", "dimensão"],
    descricao: "Índice composto (0–100) de risco a direitos fundamentais. 4 dimensões ponderadas.",
  },
  {
    id: "legislativo-estaduais",
    nome: "Assembleias Legislativas — 27 UFs",
    categoria: "legislativo",
    fonte: "Portais oficiais das 27 Assembleias Legislativas",
    rotaPortal: "/governo",
    dadosParaDither: () => legislativoCadeirasPorUf(),
    filtrosDisponiveis: ["UF", "partido", "bloco"],
    descricao:
      "Presença, projetos, subsídios e cotas dos deputados estaduais de todas as 27 ALs.",
  },
  {
    id: "fornecedores-multinacionais",
    nome: "Fornecedores multinacionais do Estado brasileiro",
    categoria: "internacional",
    fonte: "SEC (EDGAR) + portais oficiais de compras",
    rotaPortal: "/estado-e-economia/fornecedores-multinacionais",
    dadosParaDither: () => multinacionaisPorContrato(),
    filtrosDisponiveis: ["país de origem", "setor", "esfera"],
    descricao:
      "Empresas multinacionais que atendem o Estado: valores de contrato, lucro global e contrapartidas.",
  },
  {
    id: "acordos-internacionais",
    nome: "Acordos e licitações internacionais",
    categoria: "internacional",
    fonte: "Sete setores estratégicos, fontes oficiais (ver MATRIZ-27-ESTADOS)",
    rotaPortal: "/estado-e-economia/acordos-e-licitacoes-internacionais",
    dadosParaDither: () => acordosPorSetor(),
    filtrosDisponiveis: ["setor", "status", "país líder"],
    descricao:
      "Negociações internacionais do Estado brasileiro em setores estratégicos, com valor e fonte.",
  },
  {
    id: "pncp-mg",
    nome: "Contratos PNCP — órgãos ambientais MG",
    categoria: "ambiental",
    fonte: "PNCP — Portal Nacional de Contratações Públicas (automação diária)",
    rotaPortal: "/ambiental",
    dadosParaDither: () => pncpPorOrgao(),
    filtrosDisponiveis: ["órgão", "ano", "código IBGE"],
    descricao:
      "Contratos e licitações de órgãos ambientais de MG no PNCP, coletados por automação diária.",
  },
  {
    id: "judiciario-remuneracoes",
    nome: "Remuneração do Judiciário",
    categoria: "judiciario",
    fonte: "CNJ / Brasil.IO — contracheques de magistrados",
    rotaPortal: "/judiciario",
    dadosParaDither: () => remuneracoesPorTribunal(),
    filtrosDisponiveis: ["tribunal", "UF"],
    descricao:
      "Gasto total com folha de magistrados por tribunal (base + outras verbas, líquido).",
  },
];

function legislativoCadeirasPorUf(): SerieDither[] {
  const pontos = listarUfsAssembleias()
    .map((uf) => obterAssembleiaEstadual(uf))
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.total_cadeiras - a.total_cadeiras)
    .map((a) => ({ x: a.uf, y: a.total_cadeiras }));
  return [{ nome: "Cadeiras por Assembleia Legislativa", pontos }];
}

function multinacionaisPorContrato(): SerieDither[] {
  const pontos = obterFornecedoresMultinacionais()
    .map((f) => ({ x: f.nome, y: f.valores_contratos.total_acumulado_brl }))
    .sort((a, b) => b.y - a.y)
    .slice(0, 15);
  return [{ nome: "Contratos acumulados (R$) — top 15", pontos }];
}

function acordosPorSetor(): SerieDither[] {
  const porSetor: Record<string, number> = {};
  for (const item of obterAcordosELicitacoesInternacionais()) {
    porSetor[item.setor_rotulo] =
      (porSetor[item.setor_rotulo] ?? 0) + item.valor_estimado_brl;
  }
  const pontos = Object.entries(porSetor)
    .sort((a, b) => b[1] - a[1])
    .map(([x, y]) => ({ x, y }));
  return [{ nome: "Valor estimado por setor (R$)", pontos }];
}

function pncpPorOrgao(): SerieDither[] {
  const porOrgao: Record<string, number> = {};
  for (const linha of PNCP_MG_CONTRATOS_POR_ORGAO_E_ANO) {
    porOrgao[linha.orgaoSigla] =
      (porOrgao[linha.orgaoSigla] ?? 0) + linha.valorTotal;
  }
  const pontos = Object.entries(porOrgao)
    .sort((a, b) => b[1] - a[1])
    .map(([x, y]) => ({ x, y }));
  return [{ nome: "Valor contratado por órgão (R$)", pontos }];
}

function remuneracoesPorTribunal(): SerieDither[] {
  const acervo = carregarRemuneracoesJudiciario();
  if (!acervo || acervo.tribunais.length === 0) return [];
  const pontos = acervo.tribunais
    .map((t) => ({ x: t.sigla, y: t.totalGasto }))
    .sort((a, b) => b.y - a.y);
  return [{ nome: "Folha de magistrados por tribunal (R$)", pontos }];
}

// ── Helpers de consulta ────────────────────────────────────────────────────

export function obterDadoPorId(id: string): DadoCatalogo | undefined {
  return CATALOGO_DADOS.find((d) => d.id === id);
}

export function listarPorCategoria(categoria: DadoCatalogo["categoria"]): DadoCatalogo[] {
  return CATALOGO_DADOS.filter((d) => d.categoria === categoria);
}

export function listarCategorias(): DadoCatalogo["categoria"][] {
  return [...new Set(CATALOGO_DADOS.map((d) => d.categoria))];
}
