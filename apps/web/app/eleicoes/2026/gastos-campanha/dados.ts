/**
 * Os JSONs da coleta de gastos de campanha 2026, importados UMA vez e
 * tipados contra as interfaces de `@/lib/eleicoes/gastos-2026`.
 *
 * Por que existe este arquivo: `page.tsx`, `SecaoBigTech.tsx`, `AnaliseUf.tsx`
 * e os testes precisam dos mesmos dados; centralizar o import evita repetir o
 * cast tipado em cada arquivo e mantém a validação `tsc` num só lugar (se o
 * ETL mudar a forma, o erro aparece aqui primeiro). A única exceção é
 * `linhas.json` (1.823 linhas): ele fica na rota de fatias, para não
 * serializar a tabela inteira no payload da página (AGENTS.md § 5.1).
 *
 * Fonte: TSE — Dados Abertos, coleta de 09/10/2026 (dado parcial; ver
 * `meta.coleta` para o selo e a data da re-coleta).
 */
import metaJson from "@/data/eleicoes/gastos-2026/meta.json";
import bigtechJson from "@/data/eleicoes/gastos-2026/bigtech.json";
import fornecedoresJson from "@/data/eleicoes/gastos-2026/fornecedores.json";
import partidosJson from "@/data/eleicoes/gastos-2026/partidos.json";
import porPartidoJson from "@/data/eleicoes/gastos-2026/por-partido.json";
import porUfJson from "@/data/eleicoes/gastos-2026/por-uf.json";
import metaAmostraJson from "@/data/eleicoes/gastos-2026/meta-ads-amostra.json";
import { formatDateBR } from "@/lib/betim/format";
import type {
  BigTechDados,
  FornecedorGasto,
  MetaAmostraDados,
  MetaGastos,
  PartidoAnalise,
  PartidoGasto,
  UfAnalise,
} from "@/lib/eleicoes/gastos-2026";

export const meta: MetaGastos = metaJson;
export const bigtech: BigTechDados = bigtechJson;
export const fornecedores: FornecedorGasto[] = fornecedoresJson;
export const partidos: PartidoGasto[] = partidosJson;
export const porPartido = porPartidoJson as unknown as PartidoAnalise[];
export const porUfAnalise = porUfJson as unknown as UfAnalise[];
export const metaAmostra = metaAmostraJson as unknown as MetaAmostraDados;

/** Data da coleta já em dd/mm/aaaa, para texto do leitor. */
export const dataColeta = formatDateBR(meta.coleta.em);
