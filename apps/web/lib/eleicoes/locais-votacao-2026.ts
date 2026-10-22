/**
 * Tipos e helpers puros das seções em locais de votação alterados
 * (Eleições 2026, TSE — dado coletado por
 * `scripts/etl/eleicoes/coletar-locais-votacao-2026.py`).
 *
 * Por que existe: a página `/eleicoes/2026/locais-votacao-alterados` e
 * seu route handler (`dados/[arquivo]/route.ts`) precisam das MESMAS
 * interfaces e da MESMA fórmula de resumo (deduplicada por UF, zona e seção, valendo o registro do 2º turno); centralizar aqui evita que o
 * ETL mude a forma sem o `tsc` reclamar, e os testes ao lado
 * (`locais-votacao-2026.test.ts`) travam a fórmula.
 *
 * Fonte: TSE — Eleitorado por local de votação — 2026, dadas abertos.
 */
import dadosJson from "@/data/eleicoes/2026/locais-votacao-alterados.json";

/** Uma seção que o TSE registra com local/endereço/nome diferente do original. */
export interface SecaoAlterada {
  /** Sigla da unidade da federação (ex.: "MG"). */
  u: string;
  /** Nome do município (sem acento, como o TSE publica). */
  m: string;
  /** Número da zona eleitoral. */
  z: number;
  /** Número da seção. */
  s: number;
  /** Eleitores aptos na seção. */
  e: number;
  /** Local de votação atual. */
  l: string;
  /** Endereço atual do local. */
  d: string;
  /** Local original registrado pelo TSE (antes da alteração). */
  lo: string;
  /** Endereço original registrado pelo TSE. `do` é chave do JSON por ser fiel ao ETL; palavra reservada exige aspas no tipo. */
  "do": string;
  /** Tipo: "predio" (outro local), "endereco" (mesmo local, endereço novo) ou "nome". */
  t: string;
}

export interface ColecaoLocaisAlterados {
  fonte: {
    orgao: string;
    titulo: string;
    url: string;
    dataset: string;
  };
  /** Carimbo de geração do arquivo oficial TSE (`DT_GERACAO HH_GERACAO`). */
  geradoEm: string;
  /** Total de seções lidas (excluído o CSV "BRASIL", duplicata das UFs). */
  totalSecoes: number;
  /** Quantas estão em local alterado. */
  secoesAlteradas: number;
  linhas: SecaoAlterada[];
}

export const colecao = dadosJson as unknown as ColecaoLocaisAlterados;
export const linhasAlteradas: SecaoAlterada[] = colecao.linhas;

export interface ResumoUf {
  uf: string;
  municipios: number;
  secoes: number;
  eleitores: number;
}

/** Agregado por UF: municípios distintos, seções alteradas e eleitores nelas. */
export function resumirPorUf(linhas: SecaoAlterada[]): ResumoUf[] {
  const mapa = new Map<string, { municipios: Set<string>; secoes: number; eleitores: number }>();
  for (const linha of linhas) {
    const atual = mapa.get(linha.u) ?? { municipios: new Set(), secoes: 0, eleitores: 0 };
    atual.municipios.add(linha.m);
    atual.secoes += 1;
    atual.eleitores += linha.e;
    mapa.set(linha.u, atual);
  }
  return [...mapa.entries()]
    .map(([uf, contagem]) => ({
      uf,
      municipios: contagem.municipios.size,
      secoes: contagem.secoes,
      eleitores: contagem.eleitores,
    }))
    .sort((a, b) => a.uf.localeCompare(b.uf));
}

/** Top municípios por seções alteradas, para os cartões de topo. */
export function resumoMunicipio(linha: SecaoAlterada): string {
  return `${linha.m}/${linha.u}`;
}

