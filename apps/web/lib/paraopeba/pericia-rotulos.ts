/**
 * Rótulos e tipos do acervo da perícia UFMG — o pedaço SEGURO para
 * `"use client"` importar.
 *
 * Por que separado de `pericia-ufmg.ts`: aquele módulo virou server-only
 * (lê `pericia-ufmg.json` via `node:fs` para não embutir ~1 MB de dado no
 * bundle do Worker — teto de 3 MiB gzip, erro 10027 em 2026-08-24). O
 * cliente (`AcervoPericia.tsx`) precisa só destes rótulos e tipos.
 */
import type { DocumentoPericiaUfmg, SecaoPericia } from "./temas-acervo";
import type { TemaAjri } from "./auditoria-ajri";

export type { DocumentoPericiaUfmg, SecaoPericia };

/** Documento do acervo com os temas já resolvidos. */
export interface EstudoPericiaComTema extends DocumentoPericiaUfmg {
  temas: TemaAjri[];
}

/** Rótulo humano de cada seção, para filtro e legenda. */
export const SECAO_PERICIA_LABEL: Record<SecaoPericia, string> = {
  apresentacao_de_resultados: "Resultados da perícia",
  processo: "Documentos do processo",
  chamada: "Editais de chamada",
  subprojeto: "Subprojetos e equipes",
  material_didatico: "Material didático",
  reuniao_com_partes: "Reuniões com as partes",
  comunicacao: "Comunicação",
  institucional: "Institucional",
};

/** Ordem de exibição: o que é resultado primeiro, edital por último. */
export const SECAO_PERICIA_ORDEM: SecaoPericia[] = [
  "apresentacao_de_resultados",
  "reuniao_com_partes",
  "material_didatico",
  "subprojeto",
  "processo",
  "chamada",
  "comunicacao",
  "institucional",
];
