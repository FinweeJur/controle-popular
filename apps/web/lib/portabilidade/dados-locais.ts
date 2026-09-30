/**
 * Portabilidade dos dados locais — exportar e importar a "vida" do leitor.
 *
 * ═══ O QUE É ═══
 *
 * Reúne os três acervos que o portal guarda no navegador (cidades seguidas,
 * pasta de dossiê e temas acompanhados) num arquivo JSON só, e sabe lê-lo de
 * volta. É a promessa "sem catraca" levada a sério: o dado é do leitor, e ele
 * pode LEVAR o dado consigo.
 *
 * ═══ POR QUE IMPORTA ═══
 *
 * Guardar no aparelho tem um preço: trocar de máquina perde a lista. Exportar
 * e importar em JSON fecha esse buraco sem criar conta — e ainda serve de
 * "baixar tudo" e "apagar tudo" (LGPD), o que uma conta nem sempre dá.
 *
 * ═══ ROBUSTEZ ═══
 *
 * Importar arquivo é receber dado de fora: pode vir corrompido, editado à mão
 * ou de uma versão futura. `validarImportacao` nunca confia — passa cada parte
 * pelo validador da sua origem, que descarta item inválido e trunca no limite.
 */

import { type CidadeFavorita, desserializar as desserializarCidades } from "@/lib/favoritos/cidades";
import { type ItemPasta, desserializar as desserializarPasta } from "@/lib/pasta/itens";
import { desserializarTemas } from "@/lib/temas/temas";

/** Chaves do `localStorage` que formam a vida local do leitor. */
export const CHAVES_LOCAIS = {
  cidades: "cp:cidades-favoritas",
  pasta: "cp:pasta-dossie",
  temas: "cp:temas-seguidos",
} as const;

export interface ExportacaoLocal {
  versao: 1;
  geradoEm: string;
  cidades: CidadeFavorita[];
  pasta: ItemPasta[];
  temas: string[];
}

/** Monta a exportação a partir dos valores crus do `localStorage`. */
export function montarExportacao(entrada: {
  cidadesJson: string | null;
  pastaJson: string | null;
  temasJson: string | null;
}): ExportacaoLocal {
  return {
    versao: 1,
    geradoEm: new Date().toISOString(),
    cidades: desserializarCidades(entrada.cidadesJson),
    pasta: desserializarPasta(entrada.pastaJson),
    temas: desserializarTemas(entrada.temasJson),
  };
}

/** Serializa a exportação em JSON legível (para o arquivo baixado). */
export function serializarExportacao(exportacao: ExportacaoLocal): string {
  return JSON.stringify(exportacao, null, 2);
}

/** Converte uma lista (já em memória) para a forma que cada validador espera. */
function comoJson(valor: unknown): string {
  try {
    return JSON.stringify(valor ?? null) ?? "null";
  } catch {
    return "null";
  }
}

/**
 * Lê e valida um arquivo de importação.
 * Devolve a exportação saneada, ou `null` quando o texto não é JSON de objeto.
 */
export function validarImportacao(texto: string): ExportacaoLocal | null {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!dados || typeof dados !== "object") return null;

  const obj = dados as Record<string, unknown>;
  return {
    versao: 1,
    geradoEm: typeof obj.geradoEm === "string" ? obj.geradoEm : "",
    cidades: desserializarCidades(comoJson(obj.cidades)),
    pasta: desserializarPasta(comoJson(obj.pasta)),
    temas: desserializarTemas(comoJson(obj.temas)),
  };
}
