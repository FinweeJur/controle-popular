import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { municipios } from "@/lib/db/schema";

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

export interface Cidade {
  id_municipio: IdMunicipio;
  slug: string;
  nome: string;
  uf: string;
  cnpj_prefeitura: string | null;
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
    slug: slugDoNome(l.nome),
    nome: l.nome,
    uf: l.uf,
    cnpj_prefeitura: l.cnpj_prefeitura,
    lat: l.lat === null ? null : Number(l.lat),
    lng: l.lng === null ? null : Number(l.lng),
    branding: l.branding,
    fontes: (l.fontes as Record<string, unknown> | null) ?? null,
  };
}

/** Cidades ativas, em ordem estável. */
export async function listarCidades(): Promise<Cidade[]> {
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
