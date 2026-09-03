import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { municipios } from "@/lib/db/schema";
import { CIDADES_DO_BUILD } from "@/lib/db/cidades-do-build";

/**
 * A tabela `municipios` é o registro das cidades atendidas pelo eixo
 * Cidades. Ela existe desde a primeira migration — o comentário do
 * `0001_schema.sql` diz "Multi-city backbone: every data table carries
 * id_municipio" — e ~37 tabelas carregam a FK. O que faltava era o
 * frontend: a cidade era uma CONSTANTE DE BUILD
 * (`ID_MUNICIPIO_DEFAULT`), usada em 124 lugares, e nenhuma função
 * aceitava a cidade por parâmetro.
 *
 * Estas funções são a porta de entrada do multi-cidade: `slugs()` alimenta
 * o `generateStaticParams` da rota `/cidades/[municipio]`, de modo que
 * ativar uma cidade nova seja UMA LINHA NO BANCO, sem código de rota.
 */

/**
 * Código IBGE do município. É um tipo NOMINAL, não `string` qualquer, e a
 * razão é uma regressão real: quando `getVerbasAnalytics(vereadorId)`
 * virou `getVerbasAnalytics(idMunicipio, vereadorId)`, a chamada antiga
 * continuou compilando — os dois parâmetros eram `string` — e passou a
 * filtrar `id_municipio = <uuid do vereador>`. A página de todo vereador
 * mostrou R$ 0 em verbas, sem erro nenhum, que é exatamente o modo de
 * falha que este threading existe para eliminar.
 *
 * Com a marca, só quem veio da tabela `municipios` (ou passou por
 * `comoIdMunicipio()`, que é deliberado e visível) entra no primeiro
 * parâmetro. Passar um uuid, um slug ou um nome vira erro de compilação.
 */
export type IdMunicipio = string & { readonly __marca: "id_municipio" };

/**
 * Marca uma string como código de município.
 *
 * Só para as bordas onde o valor não vem de `municipios`: scripts de
 * verificação e testes. Em código de página, use `cidade.id_municipio`.
 */
export function comoIdMunicipio(valor: string): IdMunicipio {
  return valor as IdMunicipio;
}

/** Slug da URL a partir do nome — "Belo Horizonte" → "belo-horizonte". */
export function slugDoNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Slug da cidade: `branding.slug` quando existe, senão derivado do nome.
 *
 * O slug continua NÃO sendo coluna própria — a razão original (uma coluna
 * redundante que pode divergir do nome) segue valendo para o caso comum. O
 * override existe para as duas cidades cuja URL foi fixada antes do código:
 * a rede foi planejada e anunciada em `/bh` e `/sp`, e derivar do nome daria
 * `/belo-horizonte` e `/sao-paulo`. Prender o nome exibido à URL seria pior:
 * o cabeçalho, o `<title>` e o texto das páginas ficariam "BH" em vez de
 * "Belo Horizonte".
 *
 * Quem escreve `branding.slug` assume o mesmo contrato do slug derivado:
 * minúsculas, sem acento, sem barra — é um segmento de caminho.
 */
function slugDaCidade(l: typeof municipios.$inferSelect): string {
  const branding = l.branding as { slug?: unknown } | null;
  const override = branding?.slug;
  return typeof override === "string" && override.trim()
    ? slugDoNome(override)
    : slugDoNome(l.nome);
}

export interface Cidade {
  id_municipio: IdMunicipio;
  slug: string;
  nome: string;
  uf: string;
  cnpj_prefeitura: string | null;
  /**
   * Endereço público da cidade — "controlepopular.br/bh". A coluna existia
   * desde a primeira migration e nunca havia sido lida; enquanto só Betim
   * existia, os textos de compartilhamento traziam `controlepopular.br/betim`
   * literal, o que passou a estar errado nas outras duas cidades.
   */
  dominio: string | null;
  lat: number | null;
  lng: number | null;
  branding: unknown;
  /**
   * Config por fonte de dado. É o que decide se uma rota existe para a
   * cidade: página sem fonte não deve ser gerada com estado vazio, deve
   * simplesmente não existir — ver `temFonte()`.
   */
  fontes: Record<string, unknown> | null;
}

function paraCidade(l: typeof municipios.$inferSelect): Cidade {
  return {
    // Única origem legítima da marca: a linha da tabela `municipios`.
    id_municipio: comoIdMunicipio(l.id_municipio),
    slug: slugDaCidade(l),
    nome: l.nome,
    uf: l.uf,
    cnpj_prefeitura: l.cnpj_prefeitura,
    dominio: l.dominio,
    lat: l.lat === null ? null : Number(l.lat),
    lng: l.lng === null ? null : Number(l.lng),
    branding: l.branding,
    fontes: (l.fontes as Record<string, unknown> | null) ?? null,
  };
}

/**
 * Cidades ativas, em ordem estável.
 *
 * ═══ POR QUE HÁ UM PLANO B, E POR QUE ELE NÃO É GAMBIARRA ═══
 *
 * Esta é a PRIMEIRA consulta de toda rota de cidade: `obterCidadePorSlug()`
 * a chama para traduzir o slug da URL em `id_municipio`. E do Worker em
 * produção o Postgres da máquina de build não é alcançável, então ela
 * lançava e as DEZ rotas `.din.ts` de cidade devolviam 500 antes de tocar em
 * qualquer dado — inclusive as que já tinham sido migradas para o D1, que
 * morriam sem nunca chegar no banco de escrita. Diagnóstico não deduzido:
 * `wrangler tail controlepopular` em 2026-08-13 mostrou o erro sendo
 * exatamente `Failed query: select ... from "municipios"`.
 *
 * `CIDADES_DO_BUILD` é ESTA MESMA CONSULTA, congelada pelo `prebuild`
 * (`scripts/gerar-cidades.mts`) minutos antes do bundle ser montado. Não é
 * dado de segunda classe nem cópia que envelhece sozinha: cidade nova só
 * entra no portal com build novo, porque as rotas `/[municipio]/**` são
 * geradas por `generateStaticParams`. O plano B e o plano A saem da mesma
 * linha da mesma tabela.
 *
 * A ORDEM IMPORTA: o Postgres vem primeiro, e é isso que mantém o
 * comportamento do BUILD idêntico ao de antes — lá o banco responde e o
 * congelado nunca é usado. O `catch` só age onde o banco não existe, que é
 * precisamente o runtime do Worker.
 *
 * O erro é REGISTRADO, não engolido. Fallback silencioso aqui esconderia um
 * Postgres caído durante o build, e aí o site sairia com a lista de ontem
 * sem ninguém saber.
 */
export async function listarCidades(): Promise<Cidade[]> {
  try {
    const linhas = await listarCidadesDoPostgres();
    if (linhas.length > 0) return linhas;
  } catch (e) {
    console.error("[listarCidades] Postgres indisponível; usando a lista do build:", e);
  }
  return CIDADES_DO_BUILD;
}

/**
 * A consulta CRUA, sem plano B — lança se o Postgres não responder.
 *
 * Existe separada por uma razão só, e ela custou uma trava cega:
 * `scripts/gerar-cidades.mts` é quem ESCREVE `CIDADES_DO_BUILD`, e ele
 * chamava `listarCidades()`. Com o fallback no lugar, o gerador passou a ler
 * a saída dele mesmo: com o banco derrubado de propósito para testar, ele
 * recebeu as 6 cidades do arquivo antigo, achou tudo certo e reescreveu o
 * arquivo com o próprio conteúdo. A guarda de "não sobrescrever com lista
 * vazia" nunca poderia disparar — verificado quebrando de propósito, não
 * deduzido. Quem CONGELA a lista tem que falar com o banco de verdade.
 */
export async function listarCidadesDoPostgres(): Promise<Cidade[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db
    .select()
    .from(municipios)
    .where(eq(municipios.ativo, true))
    .orderBy(asc(municipios.id_municipio));
  return linhas.map(paraCidade);
}

/**
 * Cidade pelo slug da URL.
 *
 * O slug é derivado do nome, não guardado numa coluna, então a busca é
 * feita em memória sobre a lista de ativas — são poucas dezenas de linhas
 * e isso evita uma coluna redundante que poderia divergir do nome.
 */
export async function obterCidadePorSlug(slug: string): Promise<Cidade | null> {
  return (await listarCidades()).find((c) => c.slug === slug) ?? null;
}

/** Slugs para o `generateStaticParams`. */
export async function slugsDasCidades(): Promise<string[]> {
  return (await listarCidades()).map((c) => c.slug);
}

/**
 * Cidade pelo código IBGE.
 *
 * Existe para as funções de `lib/betim` que precisam do NOME e só recebem
 * o id — o caso concreto é `getConveniosFederais`, que compara o
 * convenente com "MUNICIPIO DE <cidade>". A alternativa seria passar a
 * `Cidade` inteira como primeiro parâmetro, quebrando a convenção de
 * `idMunicipio` que vale nas outras ~45 funções.
 *
 * Não custa uma consulta por chamada: `listarCidades()` é uma leitura de
 * poucas dezenas de linhas e, dentro de um build, o Next a resolve uma vez
 * só (ver `npm run prebuild`, que é o que impede essa cache de atravessar
 * builds).
 */
/**
 * Mapeamento de código IBGE → slug de URL.
 *
 * Usado pelo middleware para redirecionar `/3106200` → `/bh`, entre outros.
 * Programaticamente consumido por funções que recebem o código IBGE de uma
 * fonte externa (API do IBGE, planilha, etc.) e precisam do slug sem banco.
 */
export const IBGE_PARA_SLUG: Record<string, string> = {
  "3103405": "aracuai",
  "3106200": "bh",
  "3106705": "betim",
  "3121605": "diamantina",
  "3134004": "itinga",
  "3550308": "sp",
};

export async function obterCidadePorId(
  idMunicipio: IdMunicipio
): Promise<Cidade | null> {
  return (await listarCidades()).find((c) => c.id_municipio === idMunicipio) ?? null;
}

/**
 * Nome do portal para a cidade — "Controle Popular Betim".
 *
 * Sai de `municipios.branding.nome_portal` quando existe. A coluna
 * `branding` era escrita e nunca lida; este é o primeiro consumidor. Sem
 * ela, monta a partir do nome, que é o formato que todas as páginas já
 * usavam quando "Betim" era literal.
 */
export function nomePortal(cidade: Cidade): string {
  const branding = cidade.branding as { nome_portal?: unknown } | null;
  const doBanco = branding?.nome_portal;
  return typeof doBanco === "string" && doBanco.trim()
    ? doBanco
    : `Controle Popular ${cidade.nome}`;
}

/**
 * Rótulo da legislatura em curso — "20ª Legislatura (2025-2028)".
 *
 * Estava escrito à mão em seis lugares, sempre com o número de Betim. Como
 * a numeração é POR CÂMARA (Betim está na 20ª, Belo Horizonte e São Paulo
 * na 19ª), a mesma frase ficava factualmente errada em duas das três
 * cidades — e errada de um jeito que nenhum teste pega, porque é texto.
 *
 * Vem de `municipios.fontes.legislatura` (`{ ordinal, inicio, fim }`).
 * Sem a chave, devolve só o período, que é o que se pode afirmar sem
 * inventar número.
 */
export function rotuloLegislatura(cidade: Cidade): string {
  const l = cidade.fontes?.legislatura as
    | { ordinal?: unknown; inicio?: unknown; fim?: unknown }
    | undefined;
  const periodo =
    typeof l?.inicio === "number" && typeof l?.fim === "number"
      ? ` (${l.inicio}-${l.fim})`
      : "";
  return typeof l?.ordinal === "number"
    ? `${l.ordinal}ª Legislatura${periodo}`
    : `Legislatura atual${periodo}`;
}

/**
 * Site oficial da Prefeitura, para o `source` dos cards.
 *
 * Existe porque `https://www.betim.mg.gov.br` estava escrito à mão em quatro
 * telas — inclusive numa em que o RÓTULO já era dinâmico ("Prefeitura de Belo
 * Horizonte") e só a URL era fixa. Rótulo certo sobre link errado é pior que
 * os dois errados: dá credibilidade ao destino.
 *
 * Sai de `fontes.prefeitura_host` quando existe; senão do host do portal de
 * dados abertos ou do Diário Oficial, que toda cidade semeada declara.
 * Devolve `undefined` em vez de um palpite — card sem link é melhor que card
 * com link para a cidade errada.
 */
export function hostDaPrefeitura(cidade: Cidade): string | undefined {
  const f = cidade.fontes ?? {};
  for (const chave of ["prefeitura_host", "diario_oficial", "sic_prefeitura"]) {
    const v = f[chave];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return undefined;
}

/**
 * Site de onde vem o ACERVO NORMATIVO da cidade.
 *
 * Nem sempre é a Prefeitura. Em Betim, BH e São Paulo os atos vêm do
 * Executivo (dados abertos ou Diário Oficial), e `hostDaPrefeitura()` acerta.
 * Em Araçuaí e Diamantina o acervo é da CÂMARA — 651 normas no SAPL e 3.148
 * leis no portal da Casa —, e creditar a Prefeitura mandaria o leitor para o
 * lugar errado numa tela cujo propósito é dizer de onde o número veio.
 *
 * Usa a chave que a migration 0034 criou justamente para isto
 * (`legislacao_municipal_host`, descrita lá como "genérica de propósito"),
 * caindo em `hostDaPrefeitura()` para quem não a declara. Função nova em vez
 * de reordenar `hostDaPrefeitura`, que serve outras quatro telas.
 */
export function hostDoAcervoNormativo(cidade: Cidade): string | undefined {
  const v = (cidade.fontes ?? {})["legislacao_municipal_host"];
  if (typeof v === "string" && v.startsWith("http")) return v;
  return hostDaPrefeitura(cidade);
}

/**
 * Quem PUBLICA o acervo normativo da cidade, e o nome do sistema de origem.
 *
 * A tela de legislação afirmava, em texto fixo, que as normas eram
 * "publicadas pela Prefeitura" e creditava "Diário Oficial / Dados Abertos".
 * Isso vale para Betim, BH e São Paulo. Em Araçuaí e Diamantina o acervo é da
 * CÂMARA — 651 normas no SAPL, 3.148 leis no portal da Casa —, e a frase
 * passou a ser falsa justamente na página cujo propósito é dizer de onde o
 * dado veio. Mesma doutrina de `fonteDaCamara()`: rótulo errado sobre número
 * certo dá credibilidade ao lugar errado.
 *
 * Deriva de `fontes.legislacao_fonte`, a mesma chave que o ETL usa para saber
 * quem é o dono do refresh de `atos_oficiais`.
 */
export function orgaoDoAcervoNormativo(cidade: Cidade): {
  orgao: string;
  sistema: string;
} {
  const fonte = (cidade.fontes ?? {})["legislacao_fonte"];
  if (typeof fonte === "string" && fonte.startsWith("camara_")) {
    return { orgao: `Câmara Municipal de ${cidade.nome}`, sistema: "Acervo de normas da Câmara" };
  }
  return {
    orgao: `Prefeitura de ${cidade.nome}`,
    sistema: `Diário Oficial / Dados Abertos — ${cidade.nome}`,
  };
}

/**
 * De onde veio a lista de vereadores, para o crédito na tela.
 *
 * A frase "dados públicos do site oficial da Câmara" era literal e passou a
 * ser FALSA em Itinga, cuja Câmara não publica dado estruturado: lá os
 * vereadores vêm do resultado das eleições de 2024 no TSE
 * (`etl.bd.tse --semear`). Ausência da chave significa "site oficial da
 * Câmara", que é o caso das cidades que já estavam no ar.
 */
export function creditoDosVereadores(cidade: Cidade): string {
  const v = (cidade.fontes ?? {})["vereadores_fonte"];
  return v === "tse"
    ? "resultado das eleições de 2024 no TSE"
    : "dados públicos do site oficial da Câmara";
}

/**
 * Nome como o Portal da Transparência federal escreve o ente municipal:
 * maiúsculas e sem acento ("MUNICIPIO DE SAO PAULO"). Normaliza os dois
 * lados da comparação, porque a fonte federal raramente acentua e o nome
 * em `municipios` é acentuado.
 */
export function normalizarParaComparacao(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

/**
 * Se a cidade tem a fonte que a página precisa.
 *
 * Serve para NÃO gerar rota sem dado, em vez de gerar uma página vazia.
 * Cobre os casos que não replicam de uma cidade para outra: o acordo do
 * Paraopeba é só de Betim, `citrolandia` é um bairro, e os links de MG não
 * servem para São Paulo. Ausência de config é tratada como "tem" para não
 * quebrar a cidade existente, que hoje não declara nada.
 */
export function temFonte(cidade: Cidade, fonte: string): boolean {
  if (!cidade.fontes) return true;
  const v = cidade.fontes[fonte];
  return v === undefined ? true : Boolean(v);
}
