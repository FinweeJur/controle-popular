/**
 * Funções puras da ponte tema-livre → TemaAjri.
 *
 * Vivem em arquivo separado de `temas-ati.ts` porque este NÃO importa
 * `biblioteca.ts` em runtime — só usa seus tipos. Assim pode ser usado tanto
 * no servidor quanto em componentes de cliente sem arrastar `node:fs` para o
 * bundle do navegador.
 */
import type { TemaAjri } from "./auditoria-ajri";
import type { ItemBiblioteca } from "./biblioteca";

/**
 * Tabela de equivalência, tema livre da biblioteca → `TemaAjri`. Replicação
 * deliberada de `temas-ati.ts`: manter as duas cópias iguais é barato e
 * evita que um import runtime de `biblioteca.ts` entre no bundle cliente.
 */
export const MAPA_TEMA_ATI_PARA_AJRI: Record<string, TemaAjri[]> = {
  "Participação Informada": ["comunicacao-e-relacionamento"],
  "Espaços Participativos": ["comunicacao-e-relacionamento"],
  "ANEXO I.2 e Auxílio Emergencial": ["programas-de-compensacao"],
  "Auxílio Emergencial": ["programas-de-compensacao"],
  "Liquidação Coletiva e Indenização": ["programas-de-compensacao"],
  "Indenizações e Transparência": ["programas-de-compensacao"],
  "Demandas Emergenciais": ["frentes-emergenciais"],
  "Saúde e ERSHRE": ["risco-saude-publica"],
  "Saúde": ["risco-saude-publica"],
  "Socioambiental Paraopeba": ["plano-de-reparacao"],
  "Reparação Integral": ["plano-de-reparacao"],
};

/**
 * `TemaAjri`s do item, deduplicados.
 *
 * Ordem de precedência:
 * 1. Temas livres declarados pela fonte e mapeados em `MAPA_TEMA_ATI_PARA_AJRI`.
 * 2. Se nenhum tema livre mapear, `temas_ajri_inferred` gerado por regras de
 *    palavra-chave no título (Guaicuy, NACAB e boletins da AEDAS sem tema livre).
 */
export function temasAjriDoItemBiblioteca(
  item: Pick<ItemBiblioteca, "temas" | "temas_ajri_inferred">
): TemaAjri[] {
  const vistos = new Set<TemaAjri>();
  const resultado: TemaAjri[] = [];
  for (const temaLivre of item.temas) {
    for (const temaAjri of MAPA_TEMA_ATI_PARA_AJRI[temaLivre] ?? []) {
      if (!vistos.has(temaAjri)) {
        vistos.add(temaAjri);
        resultado.push(temaAjri);
      }
    }
  }
  if (resultado.length === 0 && item.temas_ajri_inferred) {
    for (const temaAjri of item.temas_ajri_inferred) {
      if (!vistos.has(temaAjri)) {
        vistos.add(temaAjri);
        resultado.push(temaAjri);
      }
    }
  }
  return resultado;
}

/**
 * `true` quando pelo menos um `TemaAjri` veio de inferência (o campo
 * `temas_ajri_inferred`), não de tema livre mapeado.
 */
export function temasAjriSaoInferidos(
  item: Pick<ItemBiblioteca, "temas" | "temas_ajri_inferred">
): boolean {
  const vistos = new Set<TemaAjri>();
  for (const temaLivre of item.temas) {
    for (const temaAjri of MAPA_TEMA_ATI_PARA_AJRI[temaLivre] ?? []) {
      vistos.add(temaAjri);
    }
  }
  return vistos.size === 0 && (item.temas_ajri_inferred?.length ?? 0) > 0;
}
