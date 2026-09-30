/**
 * Projeção server-side das cidades para o comparador e a recapitulação.
 *
 * O acervo `cidades-dados-completos.json` traz histórico de PIB de cada
 * cidade — pesado demais para ir ao navegador (AGENTS §5.1). Aqui se projeta
 * só o que a tela usa, e a data do acervo sobe junto para o selo "dados de…".
 *
 * Só roda no servidor (lê arquivo). As funções puras ficam em `./cidades`.
 */

import {
  listarTodasCidadesCompletas,
  obterMetaCidadesCompletas,
} from "@/lib/cidades/estrategicas";
import type { CidadeComparavel } from "./cidades";

/** Formata AAAA-MM-DD… em dd/mm/aaaa. */
function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("pt-BR");
}

/** Lista as cidades comparáveis (campos enxutos) e a data do acervo. */
export function listarCidadesComparaveis(): {
  cidades: CidadeComparavel[];
  dataAcervo: string | null;
} {
  const cidades: CidadeComparavel[] = listarTodasCidadesCompletas()
    .map((c) => ({
      id: c.id_municipio,
      nome: c.nome,
      uf: c.uf,
      regiao: c.regiao,
      tipo: c.tipo,
      populacao: c.populacao,
      pibBi: c.pib_mais_recente_bi,
      pibPerCapita: c.pib_per_capita_reais,
      repassesMi: c.repasses_federais_anuais_mi,
      saude: c.saude_estabelecimentos,
      escolas: c.escolas_total,
      slug: c.slug,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const { geradoEm } = obterMetaCidadesCompletas();
  return { cidades, dataAcervo: formatarData(geradoEm) };
}
