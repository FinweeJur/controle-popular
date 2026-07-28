import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

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
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], configured: false };

  let query = supabase
    .from("postos_anp")
    .select("cnpj, razao_social, endereco, bairro, bandeira, produtos, nota_anp, interditado, lat, lng")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .order("razao_social", { ascending: true });

  if (bandeira) query = query.eq("bandeira", bandeira);

  const { data, error } = await query;
  if (error || !data) return { rows: [], configured: true };

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
