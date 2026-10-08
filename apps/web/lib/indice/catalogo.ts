/**
 * @file catalogo.ts — lógica pura do Catálogo das 100 Páginas (`/indice`).
 *
 * O QUE É: regras de escolha de ícone, de estilo de cartão por eixo e de
 * filtragem do catálogo que antes viviam DENTRO do componente de cliente
 * `app/indice/Catalogo100PaginasClient.tsx`. Extraídas para `lib/` porque o
 * vitest daqui só roda os `.test.ts` de `lib/` — lógica dentro de `.tsx` não
 * tem teste, e era justamente isso que o CodeScene apontou (arquivo com saúde
 * 2,17, o 2º pior do repositório em 07/10/2026, ver
 * `docs/planos/PENDENCIAS-07-10.md`).
 *
 * REGRAS DE NEGÓCIO: o catálogo é a lista versionada em
 * `apps/web/data/top-100-paginas.json` (100 rotas com potencial de interesse
 * social, cada uma com eixo, badge e microresumo). O leitor do portal filtra
 * por eixo e por palavra; o cartão ganha ícone temático conforme o assunto da
 * página (saúde, barragem, licitação...). Nenhum número aqui é digitado à
 * mão: tudo deriva do JSON versionado.
 *
 * POR QUE TABELA DE DADOS E NÃO `if`: a cadeia antiga tinha ~16 ramos com
 * ~90 comparações `includes()` — cada ramo é um par (condição, escolha), ou
 * seja, um REGISTRO de tabela. Tabela se lê de cima para baixo, se cobre com
 * um caso por linha e se audita sem percorrer 195 linhas de função. A ordem
 * da lista É a ordem de precedência do `if` original (um mesmo cartão casa
 * vários termos — "mariana", por exemplo, é água E cidade — e quem vem
 * primeiro decide), então a precedência antiga fica gravada na ordem do
 * array, não na memória de quem edita.
 *
 * EQUIVALÊNCIA: `catalogo.test.ts` guarda o espelho da cadeia antiga e
 * compara as duas saídas nas 100 páginas reais + casos sintéticos. Se um dia
 * alguém mudar uma regra e quebrar a tela, o teste falha.
 */

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Droplets,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Leaf,
  MapPin,
  Pickaxe,
  Scale,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

/**
 * Uma página do catálogo das 100 — forma do registro versionado em
 * `apps/web/data/top-100-paginas.json`.
 *
 * Movida para cá (era `export interface` no componente) para que lógica e
 * tipo morrem juntos; o componente continua re-exportando, então quem importa
 * `PaginaCatalogo` de `app/indice/Catalogo100PaginasClient` não muda nada.
 */
export interface PaginaCatalogo {
  numero: number;
  id: string;
  titulo: string;
  href: string;
  eixo: string;
  subfrenteId?: string;
  subfrente?: string;
  destaque?: boolean;
  badge: string;
  resumo: string;
}

/** Cores Tailwind do cartão: borda, fundo, hover, badge, ícone e texto de
 * destaque — um pacote por eixo temático. */
export interface EstiloEixo {
  card: string;
  badge: string;
  iconBg: string;
  textAcc: string;
}

/** Lista ORDENADA de estilos por eixo. A ordem é a precedência: no `if`
 * original "Direitos" era testado antes de "Terra" e "Estado" antes do
 * padrão — aqui a primeira entrada que casar vence, e o padrão vive fora da
 * lista (é o retorno final). */
const ESTILOS_EIXO: ReadonlyArray<{ contem: string; estilo: EstiloEixo }> = [
  {
    contem: "Direitos",
    estilo: {
      card: "border-alert/30 bg-alert/[0.025] hover:border-alert/70 hover:bg-alert/[0.06] hover:shadow-xs",
      badge: "bg-alert/10 text-alert border-alert/30",
      iconBg: "bg-alert/15 text-alert",
      textAcc: "text-alert",
    },
  },
  {
    contem: "Terra",
    estilo: {
      card: "border-emerald-500/30 bg-emerald-500/[0.025] hover:border-emerald-500/70 hover:bg-emerald-500/[0.06] hover:shadow-xs",
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      iconBg: "bg-emerald-500/15 text-emerald-500",
      textAcc: "text-emerald-500",
    },
  },
  {
    contem: "Estado",
    estilo: {
      card: "border-sky-500/30 bg-sky-500/[0.025] hover:border-sky-500/70 hover:bg-sky-500/[0.06] hover:shadow-xs",
      badge: "bg-sky-500/10 text-sky-500 border-sky-500/30",
      iconBg: "bg-sky-500/15 text-sky-500",
      textAcc: "text-sky-500",
    },
  },
];

/** Estilo de quem não casa nenhum eixo nomeado — a Central ONSA & Ferramentas
 * cai aqui (mesmo comportamento do `return` final do `if` antigo). */
const ESTILO_PADRAO_EIXO: EstiloEixo = {
  card: "border-primary/30 bg-primary/[0.025] hover:border-primary/70 hover:bg-primary/[0.06] hover:shadow-xs",
  badge: "bg-primary/10 text-primary border-primary/30",
  iconBg: "bg-primary/15 text-primary",
  textAcc: "text-primary",
};

/**
 * Escolhe o pacote de cores do cartão conforme o eixo da página.
 *
 * @param eixo nome completo do eixo (ex.: "Eixo 1: Terra e Território").
 * @returns as quatro classes Tailwind daquele eixo; se nenhum termo casa, o
 * estilo padrão (primary).
 */
export function obterEstiloEixo(eixo: string): EstiloEixo {
  const achado = ESTILOS_EIXO.find((e) => eixo.includes(e.contem));
  return achado ? achado.estilo : ESTILO_PADRAO_EIXO;
}

/** Campos da página usados na casa do ícone. `eixo` fica DE FORA da
 * normalização em minúsculas de propósito: o fallback antigo comparava o
 * eixo com a caixa original (`p.eixo.includes("Direitos")`), e trocar a
 * caixa mudaria a tela de quem escrever o eixo com outra grafia. */
type CampoIcone = "id" | "titulo" | "badge" | "href" | "eixo";

/** Uma comparação da cadeia antiga: `p[campo].includes(termo)` para ALGUM
 * dos termos listados. `c("titulo", "água", "rio doce")` lê como
 * `titulo.includes("água") || titulo.includes("rio doce")`. */
export interface Condicao {
  campo: CampoIcone;
  termos: readonly string[];
}

/**
 * Uma regra da tabela de ícones.
 *
 * `clausulas` é uma CONJUNÇÃO (E): todas precisam casar. Cada cláusula é uma
 * DISJUNÇÃO (OU): basta UMA condição casar. A cadeia antiga era um bloco só —
 * `if (A || B || C)` —, ou seja, uma cláusula; o ramo de barragens era o
 * único aninhado (`if (barragens) { if (risco) alerta; else picareta; }`) e
 * vira DUAS cláusulas: [(barragens...)] E [(risco...)].
 *
 * Regra SEM cláusula nenhuma casa sempre: é a linha de fallback do fim da
 * lista (o `else` da cadeia antiga).
 */
export interface RegraIcone {
  /** Nome curto do ramo, para o teste apontar QUAL regra falhou. */
  nome: string;
  clausulas: readonly (readonly Condicao[])[];
  icone: LucideIcon;
}

/** Atalho de escrita da tabela: `c("id", "saude")`. */
const c = (campo: CampoIcone, ...termos: string[]): Condicao => ({ campo, termos });

/** A condição EXTERNA das duas regras de barragem (barragens, mineração,
 * lítio, SIGMA). É o `||` de fora do `if` antigo; o risco é a segunda
 * cláusula, só da linha do alerta. */
const BARRAGENS: readonly Condicao[] = [
  c("id", "barragens", "sigma"),
  c("titulo", "barragens", "mineração", "lítio"),
  c("badge", "barragens", "mineração"),
];

/**
 * Tabela de escolha do ícone temático, na EXATA ordem de precedência da
 * cadeia de `if` que existia no componente até 08/10/2026.
 *
 * Cada linha é um par (condição, escolha). Adicionar assunto novo = acrescentar
 * termo na cláusula certa OU inserir linha na posição que deve vencer — nunca
 * reabrir uma função de 195 linhas.
 */
export const REGRAS_ICONE: readonly RegraIcone[] = [
  // Saúde
  { nome: "saude", clausulas: [[c("id", "saude"), c("titulo", "saúde"), c("badge", "saúde")]], icone: HeartPulse },
  // Educação (IDEB entra no mesmo campo do título)
  {
    nome: "educacao",
    clausulas: [[c("id", "educacao"), c("titulo", "educação", "ideb"), c("badge", "educação")]],
    icone: GraduationCap,
  },
  // Trabalho (CAGED entra no mesmo campo do título)
  {
    nome: "trabalho",
    clausulas: [[c("id", "trabalho"), c("titulo", "trabalho", "caged"), c("badge", "trabalho")]],
    icone: Briefcase,
  },
  // Barragens/mineração COM sinal de risco (descaracterização, risco): o
  // alerta vem ANTES da picareta porque a cadeia antiga testava o risco
  // DENTRO do ramo das barragens — aqui é a segunda cláusula (E).
  {
    nome: "barragens-risco",
    clausulas: [BARRAGENS, [c("id", "descaracterizacao"), c("titulo", "descaracterização", "risco")]],
    icone: AlertTriangle,
  },
  // Barragens, mineração, lítio, SIGMA: picareta
  { nome: "barragens", clausulas: [BARRAGENS], icone: Pickaxe },
  // Água: Paraopeba, Mariana, Rio Doce, saneamento
  {
    nome: "agua",
    clausulas: [
      [
        c("id", "paraopeba", "mariana"),
        c("titulo", "paraopeba", "mariana", "rio doce", "água"),
        c("badge", "paraopeba", "mariana"),
      ],
    ],
    icone: Droplets,
  },
  // Rural, CAR, meio ambiente, clima, floresta
  {
    nome: "ambiental",
    clausulas: [
      [
        c("id", "car", "rural", "ambiental", "clima"),
        c("titulo", "car", "meio ambiente", "rural", "climática"),
        c("badge", "meio ambiente", "car"),
      ],
    ],
    icone: Leaf,
  },
  // Território, conflitos, mapas, quilombolas, indígenas
  {
    nome: "territorio",
    clausulas: [
      [
        c("id", "funcaosocialterra", "territorio", "mapa"),
        c("titulo", "terra", "quilomb", "indígen"),
        c("badge", "território"),
      ],
    ],
    icone: MapPin,
  },
  // Judiciário, leis, TAC, licitações, legislação, Ministério Público, LAI
  {
    nome: "justica",
    clausulas: [
      [
        c("id", "judiciario", "tac", "direito", "legislacao"),
        c("titulo", "judiciário", "tribunal", "mpmg", "tac", "justiça", "sirenejud"),
        c("badge", "judiciário", "lai"),
      ],
    ],
    icone: Scale,
  },
  // Congresso, câmara, governo, secretarias, parlamentares
  {
    nome: "governo",
    clausulas: [
      [
        c("id", "congresso", "camara", "governo", "prefeitura"),
        c("titulo", "congresso", "câmara", "governo", "secretaria", "parlamentar"),
        c("badge", "congresso", "governo"),
      ],
    ],
    icone: Landmark,
  },
  // Economia, orçamento, ComunicaBR, contratos, ICMS, repasses
  {
    nome: "economia",
    clausulas: [
      [
        c("id", "economia", "orcamento", "comunicabr"),
        c("titulo", "economia", "orçamento", "icms", "repasses", "contratos"),
        c("badge", "economia"),
      ],
    ],
    icone: TrendingUp,
  },
  // Empresas, Vale, ecossistema, regulação
  {
    nome: "empresas",
    clausulas: [
      [
        c("id", "empresas", "vale", "ecossistema"),
        c("titulo", "empresas", "vale", "ecossistema"),
        c("badge", "empresas", "regulação"),
      ],
    ],
    icone: Building2,
  },
  // Tecnologia e GitHub
  {
    nome: "tecnologia",
    clausulas: [
      [c("id", "tecnologia", "github"), c("titulo", "tecnologia", "github"), c("badge", "github")],
    ],
    icone: Zap,
  },
  // Alertas, denúncia, proteção, defesa civil, segurança
  {
    nome: "seguranca",
    clausulas: [
      [
        c("id", "alerta", "denuncia", "seguranca", "defesa-civil", "protecao"),
        c("titulo", "alerta", "denúncia", "proteção"),
      ],
    ],
    icone: Shield,
  },
  // Cidades em geral (Betim, BH, Diamantina...) — DEPOIS da água, porque a
  // cadeia antiga testava Mariana como água antes de testá-la como cidade.
  {
    nome: "cidades",
    clausulas: [
      [
        c(
          "id",
          "cidades",
          "betim",
          "bh",
          "diamantina",
          "aracuai",
          "itinga",
          "brumadinho",
          "mariana",
          "serro",
          "valadares",
          "ipatinga",
          "juiz-de-fora",
          "uberlandia"
        ),
        c("badge", "cidades"),
      ],
    ],
    icone: Building2,
  },
  // Busca (o href também conta: /busca pode não estar no id)
  { nome: "busca", clausulas: [[c("id", "busca"), c("href", "busca")]], icone: Search },
  // Acervo, biblioteca, documentos, notícias, dados, índice
  { nome: "acervo", clausulas: [[c("id", "biblioteca", "documento", "noticia", "dados", "indice")]], icone: Layers },
  // Fallbacks por eixo — texto com a caixa ORIGINAL, como no if antigo
  { nome: "fallback-eixo-direitos", clausulas: [[c("eixo", "Direitos")]], icone: Users },
  { nome: "fallback-eixo-terra", clausulas: [[c("eixo", "Terra")]], icone: Leaf },
  { nome: "fallback-eixo-estado", clausulas: [[c("eixo", "Estado")]], icone: Landmark },
  // Última linha: sem cláusula, casa sempre (o "senão" da cadeia antiga)
  { nome: "fallback-padrao", clausulas: [], icone: Sparkles },
];

/** Textos da página já nas caixas em que são comparados. `eixo` preserva a
 * caixa original — ver comentário em `CampoIcone`. */
function normalizar(p: PaginaCatalogo): Record<CampoIcone, string> {
  return {
    id: p.id.toLowerCase(),
    titulo: p.titulo.toLowerCase(),
    badge: p.badge.toLowerCase(),
    href: p.href.toLowerCase(),
    eixo: p.eixo,
  };
}

/** Uma condição casa quando o campo contém UM dos termos. */
function condicaoCasa(campos: Record<CampoIcone, string>, condicao: Condicao): boolean {
  return condicao.termos.some((termo) => campos[condicao.campo].includes(termo));
}

/** A regra casa quando TODAS as cláusulas casam; cada cláusula, quando ALGUMA
 * condição casa. Regra sem cláusula casa sempre (fallback). */
function regraCasa(campos: Record<CampoIcone, string>, regra: RegraIcone): boolean {
  if (regra.clausulas.length === 0) return true;
  return regra.clausulas.every((clausula) =>
    clausula.some((condicao) => condicaoCasa(campos, condicao))
  );
}

/**
 * Varre a tabela de regras de cima para baixo e devolve a PRIMEIRA que casa —
 * a última linha (sem cláusulas) sempre casa, então há sempre regra. É o
 * coração do ícone; fica exportada para o teste poder afirmar QUAL ramo da
 * tabela casou, não só qual ícone saiu.
 *
 * @param p página do catálogo (id, titulo, badge, href e eixo).
 * @returns a regra vencedora, com nome e ícone.
 */
export function obterRegraIcone(p: PaginaCatalogo): RegraIcone {
  const campos = normalizar(p);
  const regra = REGRAS_ICONE.find((r) => regraCasa(campos, r));
  // Inalcançável na prática: a última regra não tem cláusulas e casa sempre.
  return regra ?? REGRAS_ICONE[REGRAS_ICONE.length - 1];
}

/**
 * Escolhe o ícone temático da página (o componente lucide-react a desenhar
 * no cartão) — a mesma regra de `obterRegraIcone`, reduzida ao ícone.
 *
 * @param p página do catálogo.
 * @returns o componente de ícone do lucide-react.
 */
export function obterIconeTema(p: PaginaCatalogo): LucideIcon {
  return obterRegraIcone(p).icone;
}

/** Critérios do filtro da tela: o que o leitor digitou e os botões ativos. */
export interface FiltroCatalogo {
  /** Texto digitado na busca; pode vir com espaço nas pontas. */
  termo: string;
  /** Eixo selecionado nas abas, ou "Todos". */
  eixoAtivo: string;
  /** Modo "Apenas Destaques": esconde o que não é destaque. */
  apenasDestaques: boolean;
}

/**
 * Filtra o catálogo exatamente como a tela filtra (mesma ordem de cortes:
 * destaque → eixo → termo), para o componente só desenhar.
 *
 * Atenção à regra de eixo: "Central ONSA & Ferramentas" casa por CONTÉM
 * (`eixoAtivo.includes("Central")`) e não por igualdade, porque os nomes de
 * eixo da Central variam entre páginas.
 *
 * @param paginas lista completa do JSON.
 * @param filtro estado atual dos controles.
 * @returns as páginas que devem aparecer na grade, na ordem original.
 */
export function filtrarPaginas(
  paginas: readonly PaginaCatalogo[],
  filtro: FiltroCatalogo
): PaginaCatalogo[] {
  const termo = filtro.termo.toLowerCase().trim();
  return paginas.filter((p) => {
    if (filtro.apenasDestaques && !p.destaque) return false;
    const casaEixo =
      filtro.eixoAtivo === "Todos" ||
      p.eixo === filtro.eixoAtivo ||
      (filtro.eixoAtivo.includes("Central") && p.eixo.includes("Central"));
    if (!casaEixo) return false;
    if (!termo) return true;
    return (
      p.titulo.toLowerCase().includes(termo) ||
      p.resumo.toLowerCase().includes(termo) ||
      p.href.toLowerCase().includes(termo) ||
      p.badge.toLowerCase().includes(termo) ||
      Boolean(p.subfrente && p.subfrente.toLowerCase().includes(termo))
    );
  });
}
