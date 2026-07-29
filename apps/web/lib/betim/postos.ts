import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface PostoAnp {
  cnpj: string;
  razao_social: string | null;
  endereco: string | null;
  bairro: string | null;
  bandeira: string | null;
  produtos: string[] | null;
  nota_anp: number | null;
  interditado: boolean;
  lat: number | null;
  lng: number | null;
}

/** Uppercase, sem acento, sem espaço nas pontas -- `postos_anp.bairro` vem
 *  da ANP já em CAIXA ALTA SEM ACENTO (convenção da própria fonte), então
 *  comparar direto com nomes de bairro "bonitos" (com acento/case normal)
 *  nunca bateria. */
function normalizeBairro(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export async function fetchPostosAnp(
  idMunicipio: IdMunicipio,
  bandeira?: string,
  /** Nomes de bairro em qualquer capitalização/acentuação -- comparação
   *  normalizada, com substring pra cobrir nomes compostos da ANP que não
   *  batem 1:1 com a lista "oficial" de bairros (ex. bairro da ANP
   *  "CHACARA" vs. "Chácaras Cinco Ilhas" da Prefeitura). */
  bairros?: string[]
): Promise<{
  rows: PostoAnp[];
  configured: boolean;
}> {
  const data = await q.listarPostos(idMunicipio, bandeira);
  if (!data) return { rows: [], configured: false };

  let rows = data as PostoAnp[];
  if (bairros?.length) {
    const alvos = bairros.map(normalizeBairro);
    rows = rows.filter((p) => {
      if (!p.bairro) return false;
      const bairroPosto = normalizeBairro(p.bairro);
      return alvos.some((a) => bairroPosto.includes(a) || a.includes(bairroPosto));
    });
  }
  return { rows, configured: true };
}
