/**
 * Guardas editoriais do acervo de memória — as funções puras que decidem
 * se um verbete pode publicar e qual verbete a página recebe.
 *
 * Papel no portal: impedir que marco sem fonte fechada entre na tela. A
 * regra do AGENTS.md §7 é dura — "número errado é dano" e "insinuação é
 * dano mesmo quando cada dado isolado está certo". Aqui isso vira código:
 * `verbeteValido` recusa o que não tem fonte; `fontesPrimarias` tira a
 * fonte terciária da decisão; `resolverMemoria` desce a escada
 * município → UF → região → país e devolve o primeiro degrau com fonte.
 *
 * Nada aqui toca a rede ou o banco: são funções puras, cobertas por
 * `memoria.test.ts`, no mesmo padrão dos testes de `lib/` do repo.
 */

import type {
  CamadasMemoria,
  Fonte,
  ResultadoMemoria,
  VerbeteMemoria,
} from "./tipos";

/** Aceita só `http` ou `https`; descarta `javascript:`, `ftp:` e vazio. */
function urlHttp(url: string | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

/** Um campo textual conta como preenchido quando tem conteúdo além de espaços. */
function preenchido(valor: string | undefined): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

/**
 * Um verbete publica apenas se tiver fonte completa, resumo, chave e ao
 * menos um tipo de luta. Fonte incompleta derruba o verbete inteiro — a
 * primeira fonte é a mais local e mais oficial, e não pode vir pela metade.
 */
export function verbeteValido(v: VerbeteMemoria | null | undefined): boolean {
  if (!v) return false;
  if (!preenchido(v.chave)) return false;
  if (!preenchido(v.titulo)) return false;
  if (!preenchido(v.resumo)) return false;
  if (!Array.isArray(v.tipo) || v.tipo.length === 0) return false;
  if (!Array.isArray(v.fonte) || v.fonte.length === 0) return false;

  // Fonte terciária (Wikipédia/Wikidata) é ponte, nunca decisão: o verbete
  // precisa de ao menos UMA fonte PRIMÁRIA — senão um marco só de enciclopédia
  // entraria na tela, o oposto da regra "insinuação é dano".
  if (!v.fonte.some((f) => !fonteTerciaria(f))) return false;

  return v.fonte.every(
    (f) =>
      preenchido(f.titulo) &&
      preenchido(f.ano) &&
      preenchido(f.orgao) &&
      urlHttp(f.url)
  );
}

/** Reconhece a fonte terciária (ponte de mapa), que nunca decide verbete. */
function fonteTerciaria(f: Fonte): boolean {
  const alvo = `${f.url} ${f.orgao} ${f.autor}`.toLowerCase();
  return /wikipedia\.org|wikidata\.org|\bwikipedia\b|\bwikidata\b/.test(alvo);
}

/**
 * As fontes que podem decidir o verbete: descarta Wikipédia/Wikidata, que
 * o plano admite só como camada terciária (ponte de lugar e período).
 * Não muta o verbete original.
 */
export function fontesPrimarias(v: VerbeteMemoria): Fonte[] {
  return v.fonte.filter((f) => !fonteTerciaria(f));
}

/** Devolve o primeiro verbete de uma lista, se a lista existir. */
function primeiro(
  mapa: Record<string, VerbeteMemoria[]>,
  chave: string
): VerbeteMemoria | null {
  const lista = mapa[chave];
  return lista && lista.length > 0 ? lista[0] : null;
}

/**
 * Desce a escada da memória e devolve o verbete do degrau mais específico
 * que tem fonte: município → UF → região → país. `chave` aceita código
 * IBGE de 7 dígitos, slug de cidade, UF ("mg"), região ("sudeste") ou
 * "br". Devolve `null` só quando nem a camada país tem verbete.
 *
 * O degrau vem de `ufPorMunicipio`/`regiaoPorUf` quando disponíveis; sem
 * esse mapa, um código IBGE desconhecido ainda alcança a camada país.
 */
export function resolverMemoria(
  chave: string,
  camadas: CamadasMemoria
): ResultadoMemoria | null {
  const alvo = (chave ?? "").trim().toLowerCase();
  if (!alvo) return null;

  // 1) Município — o degrau mais específico.
  const doMunicipio = primeiro(camadas.municipio, alvo);
  if (doMunicipio) return { verbete: doMunicipio, nivel: "municipio" };

  // Descobre a UF: pode ser o próprio alvo (UF) ou vir do código IBGE.
  const uf = camadas.uf[alvo]
    ? alvo
    : camadas.ufPorMunicipio?.[alvo] ?? null;

  // 2) UF.
  if (uf) {
    const daUf = primeiro(camadas.uf, uf);
    if (daUf) return { verbete: daUf, nivel: "uf" };
  }

  // 3) Região — pelo próprio alvo ou pela UF.
  const regiao = camadas.regiao[alvo]
    ? alvo
    : uf
      ? camadas.regiaoPorUf?.[uf] ?? null
      : null;
  if (regiao) {
    const daRegiao = primeiro(camadas.regiao, regiao);
    if (daRegiao) return { verbete: daRegiao, nivel: "regiao" };
  }

  // 4) País — o último degrau, nunca vazio em uso normal.
  const doPais = primeiro(camadas.pais, alvo) ?? primeiro(camadas.pais, "br");
  if (doPais) return { verbete: doPais, nivel: "pais" };

  return null;
}
