/**
 * @file catalogo.test.ts — testes da lógica pura do Catálogo das 100 Páginas.
 *
 * COBERTURA (AGENTS §9 — teste protege o que o diff tocou):
 *
 *  1. Um caso representativo POR REGRA da tabela de ícones, com a garantia de
 *     que a lista de casos cobre todas as linhas de `REGRAS_ICONE` (regra
 *     nova sem caso derruba o teste);
 *  2. Precedência: quem vem primeiro na tabela vence (mariana é água, não
 *     cidade; risco de barragem é alerta, não picareta);
 *  3. EQUIVALÊNCIA com a cadeia antiga de `if`: `iconeLegado` abaixo é uma
 *     cópia CONGELADA da função que existia no componente até 08/10/2026, e
 *     as duas saídas são comparadas nas 100 páginas reais do JSON e em
 *     casos sintéticos. Se a tabela mudar de escolha, o teste acusa;
 *  4. Estilo do cartão por eixo (cores Tailwind) e sua ordem;
 *  5. Casos-limite do filtro: termo vazio, só espaço, "Central" por
 *     contém, acento (com e sem), caixa alta, destaque e eixo inexistente.
 *
 * Não há teste de renderização: o repo não tem infra de componente React
 * (o vitest roda em `environment: "node"`), então o que se garante aqui é a
 * DECISÃO — ícone, estilo e lista filtrada —, não o pixel.
 */

import { describe, it, expect } from "vitest";
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
import {
  REGRAS_ICONE,
  filtrarPaginas,
  obterEstiloEixo,
  obterIconeTema,
  obterRegraIcone,
  type PaginaCatalogo,
} from "./catalogo";
import paginasTop100 from "../../data/top-100-paginas.json";

/** As 100 páginas versionadas — o dado real que a tela publica. */
const reais = paginasTop100 as unknown as PaginaCatalogo[];

/** Monta uma página de teste a partir dos campos que interessam; o resto vem
 * neutro para não casar regra nenhuma por acidente. */
function pg(parcial: Partial<PaginaCatalogo>): PaginaCatalogo {
  return {
    numero: 1,
    id: "sem-id",
    titulo: "Pagina Neutra",
    href: "/pagina-neutra",
    eixo: "Eixo 3: Estado e Economia",
    badge: "Geral",
    resumo: "Resumo neutro do teste.",
    ...parcial,
  };
}

/**
 * ═══ ESPELHO DA CADEIA ANTIGA — NÃO EDITAR, NÃO REFAZER ═══
 *
 * Cópia literal de `obterIconeTema` tal como vivia em
 * `app/indice/Catalogo100PaginasClient.tsx` (linhas 93–287) até a
 * refatoração de 08/10/2026. Existe só para provar equivalência: a tabela
 * nova precisa escolher o MESMO ícone que esta cadeia. Se um dia a tabela
 * mudar de propósito, este espelho é o que revela a mudança na tela.
 */
function iconeLegado(p: PaginaCatalogo) {
  const id = p.id.toLowerCase();
  const href = p.href.toLowerCase();
  const titulo = p.titulo.toLowerCase();
  const badge = p.badge.toLowerCase();

  // Saúde
  if (id.includes("saude") || titulo.includes("saúde") || badge.includes("saúde")) {
    return HeartPulse;
  }
  // Educação
  if (id.includes("educacao") || titulo.includes("educação") || badge.includes("educação") || titulo.includes("ideb")) {
    return GraduationCap;
  }
  // Trabalho
  if (id.includes("trabalho") || titulo.includes("trabalho") || badge.includes("trabalho") || titulo.includes("caged")) {
    return Briefcase;
  }
  // Mineração, Barragens, Descaracterização, SIGMA
  if (
    id.includes("barragens") ||
    id.includes("sigma") ||
    titulo.includes("barragens") ||
    titulo.includes("mineração") ||
    titulo.includes("lítio") ||
    badge.includes("barragens") ||
    badge.includes("mineração")
  ) {
    if (id.includes("descaracterizacao") || titulo.includes("descaracterização") || titulo.includes("risco")) {
      return AlertTriangle;
    }
    return Pickaxe;
  }
  // Água, Rios, Bacias, Paraopeba, Mariana, Saneamento
  if (
    id.includes("paraopeba") ||
    id.includes("mariana") ||
    titulo.includes("paraopeba") ||
    titulo.includes("mariana") ||
    titulo.includes("rio doce") ||
    titulo.includes("água") ||
    badge.includes("paraopeba") ||
    badge.includes("mariana")
  ) {
    return Droplets;
  }
  // Rural, CAR, Meio Ambiente, Clima, Floresta, Unidades de Conservação
  if (
    id.includes("car") ||
    id.includes("rural") ||
    id.includes("ambiental") ||
    id.includes("clima") ||
    titulo.includes("car") ||
    titulo.includes("meio ambiente") ||
    titulo.includes("rural") ||
    titulo.includes("climática") ||
    badge.includes("meio ambiente") ||
    badge.includes("car")
  ) {
    return Leaf;
  }
  // Terras, Territórios, Globo 3D, Conflitos, Mapas
  if (
    id.includes("funcaosocialterra") ||
    id.includes("territorio") ||
    id.includes("mapa") ||
    titulo.includes("terra") ||
    titulo.includes("quilomb") ||
    titulo.includes("indígen") ||
    badge.includes("território")
  ) {
    return MapPin;
  }
  // Judiciário, Leis, Tribunais, TAC, Licitações, Legislação, Ministério Público
  if (
    id.includes("judiciario") ||
    id.includes("tac") ||
    id.includes("direito") ||
    id.includes("legislacao") ||
    titulo.includes("judiciário") ||
    titulo.includes("tribunal") ||
    titulo.includes("mpmg") ||
    titulo.includes("tac") ||
    titulo.includes("justiça") ||
    titulo.includes("sirenejud") ||
    badge.includes("judiciário") ||
    badge.includes("lai")
  ) {
    return Scale;
  }
  // Congresso, Câmara, Governo, Secretarias, Eleições, Instituições
  if (
    id.includes("congresso") ||
    id.includes("camara") ||
    id.includes("governo") ||
    id.includes("prefeitura") ||
    titulo.includes("congresso") ||
    titulo.includes("câmara") ||
    titulo.includes("governo") ||
    titulo.includes("secretaria") ||
    titulo.includes("parlamentar") ||
    badge.includes("congresso") ||
    badge.includes("governo")
  ) {
    return Landmark;
  }
  // Economia, Orçamento, Contratos, Compras, Finanças, Repasses, ICMS
  if (
    id.includes("economia") ||
    id.includes("orcamento") ||
    id.includes("comunicabr") ||
    titulo.includes("economia") ||
    titulo.includes("orçamento") ||
    titulo.includes("icms") ||
    titulo.includes("repasses") ||
    titulo.includes("contratos") ||
    badge.includes("economia")
  ) {
    return TrendingUp;
  }
  // Empresas, Corporativo, Vale, Concessionárias, Ecossistema
  if (
    id.includes("empresas") ||
    id.includes("vale") ||
    id.includes("ecossistema") ||
    titulo.includes("empresas") ||
    titulo.includes("vale") ||
    titulo.includes("ecossistema") ||
    badge.includes("empresas") ||
    badge.includes("regulação")
  ) {
    return Building2;
  }
  // Tecnologia, GitHub, Infraestrutura, Luz, Energia
  if (
    id.includes("tecnologia") ||
    id.includes("github") ||
    titulo.includes("tecnologia") ||
    titulo.includes("github") ||
    badge.includes("github")
  ) {
    return Zap;
  }
  // Alertas, Denúncia, Proteção, Defesa Civil, Segurança
  if (
    id.includes("alerta") ||
    id.includes("denuncia") ||
    id.includes("seguranca") ||
    id.includes("defesa-civil") ||
    id.includes("protecao") ||
    titulo.includes("alerta") ||
    titulo.includes("denúncia") ||
    titulo.includes("proteção")
  ) {
    return Shield;
  }
  // Cidades em geral (Betim, BH, Diamantina, etc.)
  if (
    id.includes("cidades") ||
    id.includes("betim") ||
    id.includes("bh") ||
    id.includes("diamantina") ||
    id.includes("aracuai") ||
    id.includes("itinga") ||
    id.includes("brumadinho") ||
    id.includes("mariana") ||
    id.includes("serro") ||
    id.includes("valadares") ||
    id.includes("ipatinga") ||
    id.includes("juiz-de-fora") ||
    id.includes("uberlandia") ||
    badge.includes("cidades")
  ) {
    return Building2;
  }
  // Busca
  if (id.includes("busca") || href.includes("busca")) {
    return Search;
  }
  // Acervo, Biblioteca, Documentos, Notícias, Dados
  if (
    id.includes("biblioteca") ||
    id.includes("documento") ||
    id.includes("noticia") ||
    id.includes("dados") ||
    id.includes("indice")
  ) {
    return Layers;
  }
  // Padrão
  if (p.eixo.includes("Direitos")) return Users;
  if (p.eixo.includes("Terra")) return Leaf;
  if (p.eixo.includes("Estado")) return Landmark;
  return Sparkles;
}

/** Um caso representativo por linha de `REGRAS_ICONE`. */
const CASOS_POR_REGRA: ReadonlyArray<{
  nome: string;
  descricao: string;
  pagina: PaginaCatalogo;
  icone: unknown;
}> = [
  { nome: "saude", descricao: "id de saúde", pagina: pg({ id: "saude-publica" }), icone: HeartPulse },
  { nome: "educacao", descricao: "título com IDEB", pagina: pg({ titulo: "IDEB das escolas" }), icone: GraduationCap },
  { nome: "trabalho", descricao: "id de trabalho", pagina: pg({ id: "trabalho-caged" }), icone: Briefcase },
  {
    nome: "barragens-risco",
    descricao: "barragem com risco no título",
    pagina: pg({ id: "barragens", titulo: "Análise de risco das barragens" }),
    icone: AlertTriangle,
  },
  { nome: "barragens", descricao: "id de barragens sem risco", pagina: pg({ id: "barragens" }), icone: Pickaxe },
  { nome: "agua", descricao: "id da bacia da Paraopeba", pagina: pg({ id: "paraopeba" }), icone: Droplets },
  { nome: "ambiental", descricao: "id do CAR", pagina: pg({ id: "car" }), icone: Leaf },
  { nome: "territorio", descricao: "id da função social da terra", pagina: pg({ id: "funcaosocialterra" }), icone: MapPin },
  { nome: "justica", descricao: "id de TAC", pagina: pg({ id: "tac-ibama" }), icone: Scale },
  { nome: "governo", descricao: "id do Congresso", pagina: pg({ id: "congresso" }), icone: Landmark },
  { nome: "economia", descricao: "id do orçamento", pagina: pg({ id: "orcamento-mg" }), icone: TrendingUp },
  { nome: "empresas", descricao: "id de empresas", pagina: pg({ id: "empresas" }), icone: Building2 },
  { nome: "tecnologia", descricao: "id de tecnologia", pagina: pg({ id: "tecnologia" }), icone: Zap },
  { nome: "seguranca", descricao: "id de denúncia", pagina: pg({ id: "denuncia" }), icone: Shield },
  { nome: "cidades", descricao: "id de Betim", pagina: pg({ id: "betim" }), icone: Building2 },
  { nome: "busca", descricao: "id de busca", pagina: pg({ id: "busca" }), icone: Search },
  { nome: "busca", descricao: "só o href tem busca", pagina: pg({ href: "/busca-tudo" }), icone: Search },
  { nome: "acervo", descricao: "id de biblioteca", pagina: pg({ id: "biblioteca" }), icone: Layers },
  {
    nome: "fallback-eixo-direitos",
    descricao: "eixo de Direitos sem tema específico",
    pagina: pg({ eixo: "Eixo 2: Direitos em Movimento" }),
    icone: Users,
  },
  {
    nome: "fallback-eixo-terra",
    descricao: "eixo de Terra sem tema específico",
    pagina: pg({ eixo: "Eixo 1: Terra e Território" }),
    icone: Leaf,
  },
  {
    nome: "fallback-eixo-estado",
    descricao: "eixo de Estado sem tema específico",
    pagina: pg({ eixo: "Eixo 3: Estado e Economia" }),
    icone: Landmark,
  },
  {
    nome: "fallback-padrao",
    descricao: "Central ONSA, sem eixo nomeado",
    pagina: pg({ eixo: "Central ONSA & Ferramentas" }),
    icone: Sparkles,
  },
];

/** Páginas sintéticas usadas na comparação contra a cadeia antiga. */
const SINTETICAS: PaginaCatalogo[] = [
  ...CASOS_POR_REGRA.map((c) => c.pagina),
  pg({ id: "licitacoes" }),
  pg({ id: "mariana" }),
  pg({ id: "saude", eixo: "Eixo 1: Terra e Território" }),
  pg({ titulo: "Agua potavel sem acento" }),
  pg({ id: "sigma-mineracao", titulo: "SIGMA" }),
  pg({ titulo: "Salario minimo e CAGED", eixo: "Eixo 2: Direitos em Movimento" }),
  pg({ badge: "Judiciário" }),
  pg({ badge: "Cidades" }),
  pg({ id: "comunicabr-repasses", titulo: "Repasses da União" }),
  pg({ id: "github-aberto", badge: "GitHub" }),
  pg({ titulo: "Defesa Civil em alerta", eixo: "Central ONSA & Ferramentas" }),
  pg({ id: "juiz-de-fora" }),
  pg({ href: "https://example.org/busca/externa", id: "rota-externa" }),
];

describe("tabela de ícones: um caso por regra", () => {
  it("cobre TODAS as linhas de REGRAS_ICONE", () => {
    const cobertos = new Set(CASOS_POR_REGRA.map((c) => c.nome));
    const faltando = REGRAS_ICONE.map((r) => r.nome).filter((nome) => !cobertos.has(nome));
    expect(faltando).toEqual([]);
  });

  for (const caso of CASOS_POR_REGRA) {
    it(`${caso.nome}: ${caso.descricao}`, () => {
      expect(obterRegraIcone(caso.pagina).nome).toBe(caso.nome);
      expect(obterIconeTema(caso.pagina)).toBe(caso.icone);
    });
  }
});

describe("precedência da tabela (a ordem do array é a ordem do if antigo)", () => {
  it("Mariana é ÁGUA, não cidade (regra de água vem antes de cidades)", () => {
    expect(obterRegraIcone(pg({ id: "mariana" })).nome).toBe("agua");
    expect(obterIconeTema(pg({ id: "mariana" }))).toBe(Droplets);
  });

  it("barragem COM risco é alerta; sem risco, picareta", () => {
    expect(obterIconeTema(pg({ id: "barragens", titulo: "Risco de rompimento" }))).toBe(AlertTriangle);
    expect(obterIconeTema(pg({ id: "barragens", titulo: "Barragens de MG" }))).toBe(Pickaxe);
  });

  it("'licitacoes' cai na Justiça porque contém o termo 'tac' (comportamento herdado)", () => {
    expect(obterRegraIcone(pg({ id: "licitacoes" })).nome).toBe("justica");
    expect(obterIconeTema(pg({ id: "licitacoes" }))).toBe(Scale);
  });

  it("tema específico vence o fallback por eixo", () => {
    expect(obterIconeTema(pg({ id: "saude", eixo: "Eixo 1: Terra e Território" }))).toBe(HeartPulse);
  });

  it("acento conta: 'agua' sem til NÃO casa a regra de água", () => {
    expect(obterRegraIcone(pg({ titulo: "Agua potavel" })).nome).not.toBe("agua");
    expect(obterRegraIcone(pg({ titulo: "Água potavel" })).nome).toBe("agua");
  });
});

describe("equivalência com a cadeia antiga", () => {
  it("escolhe o MESMO ícone nas 100 páginas reais do catálogo", () => {
    expect(reais).toHaveLength(100);
    const divergencias = reais
      .filter((p) => obterIconeTema(p) !== iconeLegado(p))
      .map((p) => `#${p.numero} ${p.id}`);
    expect(divergencias).toEqual([]);
  });

  it("as 100 páginas reais exercitam boa parte da tabela (a prova não é trivial)", () => {
    const exercitadas = new Set(reais.map((p) => obterRegraIcone(p).nome));
    expect(exercitadas.size).toBeGreaterThanOrEqual(10);
  });

  it("escolhe o MESMO ícone nos casos sintéticos de todos os ramos", () => {
    const divergencias = SINTETICAS.filter((p) => obterIconeTema(p) !== iconeLegado(p)).map(
      (p) => `${p.id} / ${p.titulo}`
    );
    expect(divergencias).toEqual([]);
  });
});

describe("estilo do cartão por eixo", () => {
  it("Direitos usa alert, Terra usa esmeralda, Estado usa sky", () => {
    expect(obterEstiloEixo("Eixo 2: Direitos em Movimento").card).toContain("border-alert/30");
    expect(obterEstiloEixo("Eixo 1: Terra e Território").card).toContain("border-emerald-500/30");
    expect(obterEstiloEixo("Eixo 3: Estado e Economia").card).toContain("border-sky-500/30");
  });

  it("quem não casa eixo nenhum cai no estilo padrão (primary)", () => {
    const padrao = obterEstiloEixo("Central ONSA & Ferramentas");
    expect(padrao.card).toContain("border-primary/30");
    expect(padrao.badge).toContain("bg-primary/10");
    expect(padrao.iconBg).toContain("bg-primary/15");
    expect(padrao.textAcc).toBe("text-primary");
  });

  it("a ordem antiga se mantém: Direitos vence Terra quando os dois aparecem", () => {
    expect(obterEstiloEixo("Terra dos Direitos").card).toContain("border-alert/30");
  });

  it("devolve as quatro chaves em todo caso", () => {
    for (const eixo of ["Direitos", "Terra", "Estado", "Outro"]) {
      const estilo = obterEstiloEixo(eixo);
      expect(Object.keys(estilo).sort()).toEqual(["badge", "card", "iconBg", "textAcc"]);
    }
  });
});

describe("filtragem do catálogo", () => {
  const semFiltro = { termo: "", eixoAtivo: "Todos", apenasDestaques: false };

  it("termo vazio devolve o catálogo inteiro, na ordem original", () => {
    expect(filtrarPaginas(reais, semFiltro)).toHaveLength(100);
    expect(filtrarPaginas(reais, { ...semFiltro, termo: "   " })).toHaveLength(100);
    expect(filtrarPaginas(reais, semFiltro).map((p) => p.numero)).toEqual(reais.map((p) => p.numero));
  });

  it("'Central' casa por CONTÉM, mesmo quando o eixo da página tem sufixo", () => {
    const variada = [pg({ eixo: "Central ONSA & Ferramentas — Rádios" }), pg({ eixo: "Eixo 1: Terra e Território" })];
    const resultado = filtrarPaginas(variada, { ...semFiltro, eixoAtivo: "Central ONSA & Ferramentas" });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].eixo).toContain("Central");
    expect(filtrarPaginas(reais, { ...semFiltro, eixoAtivo: "Central ONSA & Ferramentas" }).length).toBeGreaterThan(0);
  });

  it("eixo exato filtra só aquele eixo; eixo inexistente devolve vazio", () => {
    const terra = filtrarPaginas(reais, { ...semFiltro, eixoAtivo: "Eixo 1: Terra e Território" });
    expect(terra.length).toBeGreaterThan(0);
    expect(terra.every((p) => p.eixo === "Eixo 1: Terra e Território")).toBe(true);
    expect(filtrarPaginas(reais, { ...semFiltro, eixoAtivo: "Eixo 9: Nao Existe" })).toEqual([]);
  });

  it("acento e caixa: 'MARIANA' acha 'Mariana'; 'saude' sem til NÃO acha 'Saúde'", () => {
    const comCaixaAlta = filtrarPaginas(reais, { ...semFiltro, termo: "MARIANA" });
    expect(comCaixaAlta.length).toBeGreaterThan(0);
    expect(comCaixaAlta.every((p) => `${p.titulo}${p.resumo}${p.href}${p.badge}`.toLowerCase().includes("mariana"))).toBe(true);

    const semAcento = [pg({ titulo: "Saúde e SUS" })];
    expect(filtrarPaginas(semAcento, { ...semFiltro, termo: "saúde" })).toHaveLength(1);
    expect(filtrarPaginas(semAcento, { ...semFiltro, termo: "saude" })).toHaveLength(0);
  });

  it("o termo casa em título, resumo, href, badge e subfrente", () => {
    const alvos: PaginaCatalogo[] = [
      pg({ numero: 1, titulo: "Titulo alvo" }),
      pg({ numero: 2, resumo: "Resumo com alvo embutido." }),
      pg({ numero: 3, href: "/rota/alvo" }),
      pg({ numero: 4, badge: "Alvo" }),
      pg({ numero: 5, subfrente: "Subfrente do alvo" }),
      pg({ numero: 6, titulo: "Assunto diverso" }),
    ];
    expect(filtrarPaginas(alvos, { ...semFiltro, termo: "alvo" }).map((p) => p.numero)).toEqual([1, 2, 3, 4, 5]);
  });

  it("só destaques corta o que não é destaque, mesmo sem termo", () => {
    const lista = [pg({ numero: 1, destaque: true }), pg({ numero: 2, destaque: false }), pg({ numero: 3 })];
    const resultado = filtrarPaginas(lista, { ...semFiltro, apenasDestaques: true });
    expect(resultado.map((p) => p.numero)).toEqual([1]);
  });

  it("destaque + eixo + termo são cortes encadeados (nenhum sobrescreve o outro)", () => {
    const lista = [
      pg({ numero: 1, eixo: "Eixo 1: Terra e Território", titulo: "Água da bacia", destaque: true }),
      pg({ numero: 2, eixo: "Eixo 1: Terra e Território", titulo: "Água da bacia", destaque: false }),
      pg({ numero: 3, eixo: "Eixo 1: Terra e Território", titulo: "Outro assunto", destaque: true }),
      pg({ numero: 4, eixo: "Eixo 2: Direitos em Movimento", titulo: "Água da bacia", destaque: true }),
    ];
    const resultado = filtrarPaginas(lista, {
      termo: "água",
      eixoAtivo: "Eixo 1: Terra e Território",
      apenasDestaques: true,
    });
    expect(resultado.map((p) => p.numero)).toEqual([1]);
  });

  it("busca sem resultado devolve lista vazia (a tela mostra o estado vazio)", () => {
    expect(filtrarPaginas(reais, { ...semFiltro, termo: "zzzzz-termo-impossivel" })).toEqual([]);
  });
});
