import type { MetadataRoute } from "next";
import { listarCidades, temFonte, type Cidade } from "@/lib/db/queries/municipios";
import { getVereadores } from "@/lib/betim/vereadores";
import { getNoticias } from "@/lib/betim/noticias";
import { listarBancadas } from "@/lib/congresso/bancadas";
import { listarOrgaos } from "@/lib/congresso/orgaos";
import { listarIdsDeParlamentares } from "@/lib/congresso/parlamentares";
import { listarProposicoes } from "@/lib/congresso/proposicoes";
import { listarTribunais } from "@/lib/judiciario/tribunais";
import { TRIBUNAIS } from "@/lib/judiciario/regras";

/**
 * Domínio de produção: `apps/web/wrangler.jsonc` liga `controlepopular.com.br`
 * (e o `www`) ao Worker via `custom_domain`. Não é o `.br` que aparece como
 * marca no rodapé — esse é só o rótulo visual, o domínio registrado é o
 * `.com.br`.
 */
const BASE_URL = "https://controlepopular.com.br";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/**
 * Instante do build, usado como `lastModified` de páginas sem data própria
 * (vereador, parlamentar, bancada, comissão, tribunal — nenhuma tem coluna
 * de "última atualização"). Não é a data real de mudança do conteúdo, mas é
 * a única disponível sem inventar um valor, e é o fallback que o pedido
 * original autoriza.
 */
const BUILD_TIME = new Date();

function paraData(v: string | null | undefined): Date {
  return v ? new Date(v) : BUILD_TIME;
}

function item(
  path: string,
  opts: { lastModified?: Date; changeFrequency?: ChangeFreq; priority?: number } = {}
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: opts.lastModified ?? BUILD_TIME,
    changeFrequency: opts.changeFrequency ?? "monthly",
    priority: opts.priority ?? 0.5,
  };
}

/**
 * As 50 páginas fixas da zona Cidades (uma por sufixo × cidade), na MESMA
 * enumeração que `app/[municipio]/**\/page.tsx` usa via `paramsDasCidades()`
 * — ver `lib/betim/staticParams.ts`. Não é uma lista paralela inventada: é o
 * inventário de `find app/[municipio] -name page.tsx`, menos as quatro que
 * NÃO viram URL pública real (abaixo).
 *
 * FORA DAQUI, DE PROPÓSITO:
 *  - `/admin`: painel de moderação protegido por token
 *    (`PainelAdmin.tsx`) — ferramenta interna, não conteúdo.
 *  - `/zap-betim`, `/nota-betim`, `/prefeitura/legislacao`: páginas-ponte
 *    (`components/PaginaPonte.tsx`), servidas com
 *    `<meta name="robots" content="noindex, follow">` e `canonical`
 *    apontando pro destino novo. Indexar a ponte duplicaria o conteúdo que o
 *    canonical já resolve.
 *  - `noticias/[slug]` e `vereadores/[slug]`: entram abaixo, por cidade, a
 *    partir do banco — não são um sufixo fixo.
 *
 * `fonte`, quando presente, replica o `temFonte(cidade, fonte)` que a
 * própria página chama antes de `notFound()` — sem isso o sitemap listaria
 * uma URL que o build nem gera pra aquela cidade (`citrolandia`,
 * `camara/proposicoes`, `links-uteis-mg`, `meio-ambiente/paraopeba`; ver os
 * respectivos `page.tsx`). Rotas com estado vazio em vez de 404 (ex.
 * `/terras`) NÃO entram aqui — a página existe e responde 200 pra toda
 * cidade, só o conteúdo muda.
 */
const ROTAS_CIDADE: {
  sufixo: string;
  fonte?: string;
  changeFrequency?: ChangeFreq;
  priority?: number;
}[] = [
  { sufixo: "", changeFrequency: "daily", priority: 0.9 },
  { sufixo: "/agro" },
  { sufixo: "/anuncie", changeFrequency: "yearly", priority: 0.3 },
  { sufixo: "/assistente", priority: 0.4 },
  { sufixo: "/camara", changeFrequency: "weekly", priority: 0.7 },
  { sufixo: "/camara/comissoes", changeFrequency: "weekly" },
  { sufixo: "/camara/legislacao", changeFrequency: "weekly" },
  { sufixo: "/camara/proposicoes", fonte: "camara_proposicoes", changeFrequency: "weekly" },
  // `camara/votacoes/page.tsx` NÃO chama `temFonte`/`notFound` — renderiza
  // pra toda cidade, com estado vazio quando não há votação (mesmo padrão de
  // `/terras`). Sem gate aqui.
  { sufixo: "/camara/votacoes", changeFrequency: "weekly" },
  { sufixo: "/citrolandia", fonte: "citrolandia" },
  { sufixo: "/clima", changeFrequency: "daily" },
  { sufixo: "/coleta-lixo" },
  { sufixo: "/compra-e-venda", changeFrequency: "daily" },
  { sufixo: "/contatos", changeFrequency: "yearly", priority: 0.3 },
  { sufixo: "/dados", changeFrequency: "weekly", priority: 0.7 },
  { sufixo: "/defesa-civil" },
  { sufixo: "/economia" },
  { sufixo: "/educacao" },
  { sufixo: "/emendas", changeFrequency: "weekly" },
  { sufixo: "/grupos-economicos" },
  { sufixo: "/infraestrutura" },
  { sufixo: "/legislacao/alertas", changeFrequency: "weekly" },
  { sufixo: "/legislacao/bons-exemplos" },
  { sufixo: "/links-uteis-mg", fonte: "links_uteis_mg", changeFrequency: "yearly", priority: 0.3 },
  { sufixo: "/meio-ambiente", changeFrequency: "weekly", priority: 0.7 },
  { sufixo: "/meio-ambiente/autuacoes", changeFrequency: "weekly" },
  { sufixo: "/meio-ambiente/barragens", changeFrequency: "weekly" },
  { sufixo: "/meio-ambiente/paraopeba", fonte: "paraopeba", changeFrequency: "weekly" },
  { sufixo: "/metodologia", changeFrequency: "yearly", priority: 0.3 },
  { sufixo: "/mineracao" },
  { sufixo: "/nota-transparencia", changeFrequency: "weekly" },
  { sufixo: "/noticias", changeFrequency: "daily", priority: 0.8 },
  { sufixo: "/plantao-farmacias", changeFrequency: "daily" },
  { sufixo: "/postos-combustivel", changeFrequency: "daily" },
  { sufixo: "/prefeitura", changeFrequency: "weekly", priority: 0.7 },
  { sufixo: "/prefeitura/contratos", changeFrequency: "weekly" },
  { sufixo: "/prefeitura/despesas", changeFrequency: "weekly" },
  { sufixo: "/prefeitura/diarias", changeFrequency: "weekly" },
  { sufixo: "/prefeitura/licitacoes", changeFrequency: "weekly" },
  { sufixo: "/prefeitura/obras", changeFrequency: "weekly" },
  { sufixo: "/prefeitura/servidores", changeFrequency: "weekly" },
  { sufixo: "/privacidade", changeFrequency: "yearly", priority: 0.2 },
  { sufixo: "/rede-de-protecao", changeFrequency: "monthly", priority: 0.5 },
  { sufixo: "/saude" },
  { sufixo: "/seguranca" },
  { sufixo: "/servicos", changeFrequency: "weekly", priority: 0.6 },
  { sufixo: "/sobre", changeFrequency: "yearly", priority: 0.3 },
  { sufixo: "/social" },
  { sufixo: "/supermercados-farmacias", changeFrequency: "daily" },
  { sufixo: "/terras" },
  { sufixo: "/zap", changeFrequency: "daily" },
];

async function rotasDeCidade(cidade: Cidade): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Notícia mais recente da cidade: usada como `lastModified` da home e da
  // lista de notícias, que mostram justamente essas manchetes.
  const { rows: noticias } = await getNoticias(cidade.id_municipio);
  const noticiaMaisRecente = noticias
    .map((n) => paraData(n.publicadoEm))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  for (const rota of ROTAS_CIDADE) {
    if (rota.fonte && !temFonte(cidade, rota.fonte)) continue;
    const lastModified =
      (rota.sufixo === "" || rota.sufixo === "/noticias") && noticiaMaisRecente
        ? noticiaMaisRecente
        : undefined;
    urls.push(
      item(`/${cidade.slug}${rota.sufixo}`, {
        lastModified,
        changeFrequency: rota.changeFrequency,
        priority: rota.priority,
      })
    );
  }

  for (const n of noticias) {
    if (!n.slug) continue;
    urls.push(
      item(`/${cidade.slug}/noticias/${n.slug}`, {
        lastModified: paraData(n.publicadoEm),
        changeFrequency: "monthly",
        priority: 0.5,
      })
    );
  }

  const { rows: vereadores } = await getVereadores(cidade.id_municipio);
  for (const v of vereadores) {
    if (!v.slug) continue;
    urls.push(item(`/${cidade.slug}/vereadores/${v.slug}`, { changeFrequency: "weekly", priority: 0.6 }));
  }

  return urls;
}

async function rotasDoCongresso(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    item("/congresso", { changeFrequency: "daily", priority: 0.8 }),
    item("/congresso/agenda", { changeFrequency: "daily", priority: 0.6 }),
    item("/congresso/alertas", { changeFrequency: "weekly", priority: 0.5 }),
    item("/congresso/bancadas", { changeFrequency: "weekly", priority: 0.6 }),
    item("/congresso/bons-exemplos", { changeFrequency: "weekly" }),
    item("/congresso/comissoes", { changeFrequency: "weekly", priority: 0.6 }),
    item("/congresso/metodologia", { changeFrequency: "yearly", priority: 0.3 }),
    item("/congresso/parlamentares", { changeFrequency: "weekly", priority: 0.6 }),
    item("/congresso/proposicoes", { changeFrequency: "daily", priority: 0.7 }),
    item("/congresso/votacoes", { changeFrequency: "daily", priority: 0.6 }),
  ];

  // 354 bancadas e 53 comissões (medido ao vivo em 2026-08-11, `select
  // count(*)`) — pequeno o bastante pra pré-render total no build (ver
  // `bancadas/[id]/page.tsx` e `comissoes/[sigla]/page.tsx`), então
  // reaproveitar a mesma consulta é barato e não diverge do que o build gera.
  const bancadas = (await listarBancadas()) ?? [];
  for (const b of bancadas) {
    urls.push(item(`/congresso/bancadas/${b.id}`, { changeFrequency: "weekly", priority: 0.5 }));
  }

  const orgaos = (await listarOrgaos()) ?? [];
  for (const o of orgaos) {
    if (!o.sigla) continue;
    urls.push(item(`/congresso/comissoes/${o.sigla}`, { changeFrequency: "weekly", priority: 0.5 }));
  }

  // 593 parlamentares ativos (medido ao vivo em 2026-08-11) — mesma fonte de
  // `parlamentares/[id]/page.tsx`.
  const idsParlamentares = await listarIdsDeParlamentares();
  for (const id of idsParlamentares) {
    urls.push(item(`/congresso/parlamentares/${id}`, { changeFrequency: "weekly", priority: 0.5 }));
  }

  // 5.500+ proposições. `proposicoes/[id]/page.tsx` só pré-renderiza isto no
  // build de export estático (`TETO_PAGINAS_ESTATICAS` = 1.500); no alvo de
  // produção (Cloudflare) a lista vem vazia e cada id renderiza sob demanda
  // com cache — ver `lib/alvo-de-build.ts`. Pra o sitemap isso não vale: a
  // URL existe e é pública de qualquer forma, e é dado relevante (não são
  // "centenas de milhares" que justifiquem cortar pra só a página-lista).
  // `porPagina` bem acima do total atual pega tudo numa consulta só.
  const proposicoes = await listarProposicoes({ porPagina: 10_000 });
  for (const p of proposicoes?.itens ?? []) {
    urls.push(
      item(`/congresso/proposicoes/${p.id}`, {
        lastModified: paraData(p.data_ultima_tramitacao ?? p.data_apresentacao),
        changeFrequency: "weekly",
        priority: 0.5,
      })
    );
  }
  if (proposicoes && proposicoes.total > proposicoes.itens.length) {
    console.warn(
      `[sitemap] proposições do Congresso truncadas: ${proposicoes.itens.length} de ${proposicoes.total}.`
    );
  }

  // `proposicoes/[id]/oficio` (o formulário "manifestar-se sobre") FICA DE
  // FORA de propósito: é uma ferramenta de ação (redigir e enviar um
  // ofício), não uma página de conteúdo sobre a proposição — o
  // `/proposicoes/[id]` já é o card de indexação. Incluir dobraria o
  // sitemap (mais 5.500+ URLs) por uma variação de UI, não por dado novo.

  return urls;
}

async function rotasDoJudiciario(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    item("/judiciario", { changeFrequency: "weekly", priority: 0.8 }),
    item("/judiciario/indicacoes", { changeFrequency: "weekly", priority: 0.6 }),
    item("/judiciario/metodologia", { changeFrequency: "yearly", priority: 0.3 }),
    item("/judiciario/privacidade", { changeFrequency: "yearly", priority: 0.2 }),
    item("/judiciario/sobre", { changeFrequency: "yearly", priority: 0.3 }),
    item("/judiciario/tribunais", { changeFrequency: "weekly", priority: 0.6 }),
    item("/judiciario/vagas", { changeFrequency: "weekly", priority: 0.6 }),
  ];

  // Mesma união da régua (`TRIBUNAIS`) com o banco que
  // `tribunais/[sigla]/page.tsx` usa — os 5 superiores sempre existem via
  // régua, TJMG/TRF6/etc. entram quando semeados.
  const daRegua = Object.keys(TRIBUNAIS);
  let doBanco: string[] = [];
  try {
    doBanco = (await listarTribunais()).map((t) => t.id);
  } catch {
    /* build sem banco: fica só a régua */
  }
  const siglas = [...new Set([...daRegua, ...doBanco])];
  for (const sigla of siglas) {
    urls.push(item(`/judiciario/tribunais/${sigla}`, { changeFrequency: "monthly", priority: 0.5 }));
  }

  return urls;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    item("/", { changeFrequency: "daily", priority: 1.0 }),
    item("/busca", { changeFrequency: "weekly", priority: 0.6 }),
    // Só o índice, não as 853 fichas de cidade: elas mudam juntas, na mesma
    // coleta, e listá-las aqui inflaria o sitemap em 853 linhas para repetir a
    // mesma `lastModified` do build. O índice linka todas.
    item("/dados/comunicabr", { changeFrequency: "monthly", priority: 0.6 }),
    item("/ambiental", { changeFrequency: "weekly", priority: 0.7 }),
    item("/ambiental/tac", { changeFrequency: "monthly", priority: 0.6 }),
    item("/funcaosocialterra", { changeFrequency: "monthly", priority: 0.6 }),
    item("/funcaosocialterra/mapa", { changeFrequency: "monthly", priority: 0.6 }),
  ];

  const cidades = await listarCidades();
  const porCidade = await Promise.all(cidades.map(rotasDeCidade));
  for (const lote of porCidade) urls.push(...lote);

  urls.push(...(await rotasDoCongresso()));
  urls.push(...(await rotasDoJudiciario()));

  return urls;
}
