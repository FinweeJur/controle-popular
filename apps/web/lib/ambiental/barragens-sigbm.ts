/**
 * Barragens de mineração do SIGBM/ANM em Minas Gerais — DADO GERADO por
 * coletor (`etl/betim/etl/apis/sigbm_anm.py`), gravado em
 * `apps/web/data/barragens-sigbm.json` e lido aqui por import (mesmo padrão
 * dos módulos `ckan-mg-*.ts`). Não editar o JSON à mão: mudar o dado é rodar
 * o coletor de novo. `apps/web/data` está em `DIRETORIOS_DADO` do
 * `scripts/checar-dado-pessoal-em-dado.py`, então a varredura de CPF mod-11
 * cobre este arquivo no pre-push e na CI.
 *
 * ═══ O QUE ESTA FONTE É (E NÃO É) ═══
 *
 * O SIGBM é o cadastro NACIONAL de barragens de MINERAÇÃO da ANM — o órgão
 * fiscalizador federal — atualizado diariamente. Em 30/08/2026: 320 barragens
 * em MG, 909 no Brasil. As armadilhas medidas na coleta e o vocabulário exato
 * estão na docstring do coletor; as três que mandam na tela são:
 *
 * 1. **`Nível de Alerta` NÃO é `Emergência Nivel 1`.** São instrumentos
 *    diferentes do mesmo semáforo, e a tela os mostra separados — o número
 *    "com nível de emergência" nunca soma os dois sem dizer qual pedaço é
 *    qual.
 * 2. **`Situação Operacional` tem quatro estados** (Ativa, Inativa, Em
 *    Construção, Em Descaracterização) — "Em Descaracterização" aqui é o
 *    cadastro da ANM, fonte diferente das 45 barragens do MPMG em
 *    `/ambiental/barragens/descaracterizacao`.
 * 3. **O total não reconcilia com a FEAM** (249 × WFS IDE 259 × SIGBM 320 —
 *    ver a nota da migration `0049_snisb_barragens.sql`). Nenhuma tela soma
 *    as fontes.
 */

import bruto from "../../data/barragens-sigbm.json";
import { extrairTagsDeCampos } from "@/lib/tags";
import { REGRAS_TAGS_BARRAGENS } from "./tags-barragens";

export interface BarragemSigbm {
  id: string;
  nome: string;
  empreendedor: string;
  uf: string;
  municipio: string;
  situacao: string;
  nivel_emergencia: string;
  categoria_risco: string;
  dano_potencial: string;
  /** `null` quando a fonte não publicou fase (246 de 320 em 30/08/2026). */
  fase_descaracterizacao: string | null;
  /** ISO (aaaa-mm-dd) ou `null` — "Não se aplica"/"Não foi entregue" não viram data. */
  data_finalizacao_dce: string | null;
  /** Tags de assunto inferidas dos campos de texto da fonte. */
  tags: string[];
}

interface ArquivoSigbm {
  fonte: string;
  url_fonte: string;
  ultima_atualizacao: string | null;
  coletado_em: string;
  total: number;
  total_brasil: number;
  municipios: number;
  barragens: BarragemSigbm[];
}

const ARQUIVO = bruto as unknown as ArquivoSigbm;

/** O array inteiro, para componentes de CLIENTE (busca/filtro/CSV). 320
 *  registros (~92 KiB) cabem no chunk de cliente — o teto que vale é o do
 *  Worker (3 MiB gzip), e é por isso que a página de servidor importa só
 *  `COBERTURA_SIGBM` abaixo, nunca este array. */
export const BARRAGENS_SIGBM: BarragemSigbm[] = ARQUIVO.barragens.map((b) => ({
  ...b,
  tags: extrairTagsDeCampos(
    [b.nome, b.empreendedor, b.situacao, b.categoria_risco, b.dano_potencial],
    REGRAS_TAGS_BARRAGENS
  ),
}));

/** Vocabulário ORDINAL da fonte, na ordem em que a tela deve exibir —
 *  não é ordem alfabética, e comparar por texto erraria (ex.: "Alta" <
 *  "Baixa" em ordem alfabética). */
export const ORDEM_NIVEL_EMERGENCIA = [
  "Sem emergência",
  "Nível de Alerta",
  "Emergência Nivel 1",
  "Emergência Nivel 2",
  "Emergência Nivel 3",
] as const;

export const ORDEM_CATEGORIA_RISCO = ["Baixa", "Média", "Alta"] as const;

export const ORDEM_SITUACAO = [
  "Ativa",
  "Inativa",
  "Em Construção",
  "Em Descaracterização",
] as const;

export type NivelEmergenciaSigbm = (typeof ORDEM_NIVEL_EMERGENCIA)[number];
export type CategoriaRiscoSigbm = (typeof ORDEM_CATEGORIA_RISCO)[number];
export type SituacaoSigbm = (typeof ORDEM_SITUACAO)[number];

export function indiceOrdem<T extends string>(
  ordem: readonly T[],
  valor: string | null | undefined
): number {
  const i = ordem.indexOf(valor as T);
  return i >= 0 ? i : ordem.length; // valor desconhecido vai para o fim
}

function contar(ordem: readonly string[], chave: (b: BarragemSigbm) => string) {
  return ordem.map((valor) => ({
    valor,
    total: BARRAGENS_SIGBM.filter((b) => chave(b) === valor).length,
  }));
}

/** Importe ISTO em página de servidor — números medidos do dado real, com a
 *  data da coleta, nunca digitados à mão (regra do repositório: "Número na
 *  tela vem de constante medida com data"). */
export const COBERTURA_SIGBM = {
  fonte: ARQUIVO.fonte,
  urlFonte: ARQUIVO.url_fonte,
  /** Last-Modified do CSV na coleta — a fonte atualiza diariamente. */
  ultimaAtualizacao: ARQUIVO.ultima_atualizacao,
  coletadoEm: ARQUIVO.coletado_em,
  total: ARQUIVO.total,
  totalBrasil: ARQUIVO.total_brasil,
  municipios: ARQUIVO.municipios,
  empreendedores: new Set(BARRAGENS_SIGBM.map((b) => b.empreendedor)).size,
  /** Nível 1, 2 ou 3 — NÃO inclui "Nível de Alerta" (instrumento distinto). */
  emEmergencia: BARRAGENS_SIGBM.filter(
    (b) =>
      b.nivel_emergencia === "Emergência Nivel 1" ||
      b.nivel_emergencia === "Emergência Nivel 2" ||
      b.nivel_emergencia === "Emergência Nivel 3"
  ).length,
  emAlerta: BARRAGENS_SIGBM.filter((b) => b.nivel_emergencia === "Nível de Alerta").length,
  emDescaracterizacao: BARRAGENS_SIGBM.filter(
    (b) => b.situacao === "Em Descaracterização"
  ).length,
  emConstrucao: BARRAGENS_SIGBM.filter((b) => b.situacao === "Em Construção").length,
  ativas: BARRAGENS_SIGBM.filter((b) => b.situacao === "Ativa").length,
  inativas: BARRAGENS_SIGBM.filter((b) => b.situacao === "Inativa").length,
  categoriaRiscoAlta: BARRAGENS_SIGBM.filter(
    (b) => b.categoria_risco === "Alta"
  ).length,
  porSituacao: contar(ORDEM_SITUACAO, (b) => b.situacao),
  porNivelEmergencia: contar(ORDEM_NIVEL_EMERGENCIA, (b) => b.nivel_emergencia),
  porCategoriaRisco: contar(ORDEM_CATEGORIA_RISCO, (b) => b.categoria_risco),
} as const;
