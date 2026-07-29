import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface ProdutoAgro {
  categoria: string;
  produto: string;
  ano: number;
  quantidade: number | null;
  unidade: string | null;
  areaColhida: number | null;
  valorProducaoReais: number | null; // já convertido de mil reais -> reais
}

export interface RebanhoAno {
  tipo: string;
  quantidade: number;
}

export interface AgroData {
  configured: boolean;
  ok: boolean;
  anoLavouras: number | null;
  anoProducaoAnimal: number | null;
  anoRebanho: number | null;
  topLavouras: ProdutoAgro[];
  producaoAnimal: ProdutoAgro[];
  rebanhos: RebanhoAno[];
  valorTotalLavouras: number;
}

const VAZIO: AgroData = {
  configured: false,
  ok: false,
  anoLavouras: null,
  anoProducaoAnimal: null,
  anoRebanho: null,
  topLavouras: [],
  producaoAnimal: [],
  rebanhos: [],
  valorTotalLavouras: 0,
};

interface Row {
  categoria: string;
  produto: string;
  ano: number;
  quantidade: number | string | null;
  unidade: string | null;
  area_colhida: number | string | null;
  valor_producao_mil_reais: number | string | null;
}

/**
 * Produção agropecuária (IBGE PAM/PPM via Base dos Dados,
 * `etl/bd/agropecuaria.py`, migration 0016). Betim é majoritariamente
 * urbana/industrial, mas tem produção real (leite, ovos, mel,
 * hortaliças, alguns rebanhos) — pequena em volume nacional, real mesmo
 * assim.
 *
 * `valor_producao_mil_reais` vem do IBGE em MILHARES — convertido pra
 * reais cheios aqui (× 1000), uma vez só, pra `formatCurrencyBRL` não
 * precisar saber dessa particularidade.
 */
export async function getAgroData(idMunicipio: IdMunicipio): Promise<AgroData> {
  try {
    const data = await q.producaoAgropecuaria(idMunicipio);
    if (!data) return VAZIO;

    const rows = (data as Row[]).map((r) => ({
      categoria: r.categoria,
      produto: r.produto,
      ano: r.ano,
      quantidade: r.quantidade != null ? Number(r.quantidade) : null,
      unidade: r.unidade,
      areaColhida: r.area_colhida != null ? Number(r.area_colhida) : null,
      valorProducaoReais:
        r.valor_producao_mil_reais != null ? Number(r.valor_producao_mil_reais) * 1000 : null,
    }));

    const lavouras = rows.filter(
      (r) => r.categoria === "lavoura_temporaria" || r.categoria === "lavoura_permanente"
    );
    const producaoAnimalTodas = rows.filter((r) => r.categoria === "producao_animal");
    const rebanhosTodas = rows.filter((r) => r.categoria === "rebanho");

    const anoLavouras = lavouras.length ? Math.max(...lavouras.map((r) => r.ano)) : null;
    const anoProducaoAnimal = producaoAnimalTodas.length
      ? Math.max(...producaoAnimalTodas.map((r) => r.ano))
      : null;
    const anoRebanho = rebanhosTodas.length ? Math.max(...rebanhosTodas.map((r) => r.ano)) : null;

    const topLavouras = lavouras
      .filter((r) => r.ano === anoLavouras && r.valorProducaoReais)
      .sort((a, b) => (b.valorProducaoReais ?? 0) - (a.valorProducaoReais ?? 0))
      .slice(0, 8);

    const producaoAnimal = producaoAnimalTodas
      .filter((r) => r.ano === anoProducaoAnimal)
      .sort((a, b) => (b.valorProducaoReais ?? 0) - (a.valorProducaoReais ?? 0));

    const rebanhos = rebanhosTodas
      .filter((r) => r.ano === anoRebanho && r.quantidade)
      .sort((a, b) => (b.quantidade ?? 0) - (a.quantidade ?? 0))
      .map((r) => ({ tipo: r.produto, quantidade: r.quantidade as number }));

    const valorTotalLavouras = lavouras
      .filter((r) => r.ano === anoLavouras)
      .reduce((acc, r) => acc + (r.valorProducaoReais ?? 0), 0);

    return {
      configured: true,
      ok: true,
      anoLavouras,
      anoProducaoAnimal,
      anoRebanho,
      topLavouras,
      producaoAnimal,
      rebanhos,
      valorTotalLavouras,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
