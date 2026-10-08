/**
 * SecaoCusto — card "Quanto custa este mandato" da página de vereador.
 *
 * Extraído do `VereadorPage` em 08/10/2026 (hotspots CodeScene, saúde 7,31,
 * cc=64). Duas naturezas, dois blocos: o subsídio é remuneração pessoal
 * fixada em lei e IGUAL para todos; o custeio é despesa do gabinete e varia.
 */
import DataCard from "@/app/[municipio]/components/DataCard";
import Moeda from "@/app/components/Moeda";
import Link from "@/lib/betim/link";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { Cidade } from "@/lib/db/queries/municipios";

interface CustoVereador {
  mensalBruto: number | null;
  mensalExtras: number | null;
  competencia: string | null;
  fonteSubsidio: string | null;
  gastoPorAno: { ano: number; total: number; qtd: number }[];
  ok?: boolean;
}

interface Props {
  cidade: Cidade;
  custo: CustoVereador;
  fonteCamara: { label: string; url?: string };
  vereadoresDaCasa: number | null;
  anoParcial: number | null;
}

export function SecaoCusto({ cidade, custo, fonteCamara, vereadoresDaCasa, anoParcial }: Props) {
  if (custo.mensalBruto == null && custo.gastoPorAno.length === 0) return null;

  return (
    <DataCard
      title="Quanto custa este mandato"
      className="sm:col-span-2"
      source={
        custo.fonteSubsidio
          ? { label: `Câmara de ${cidade.nome}`, url: custo.fonteSubsidio }
          : fonteCamara
      }
    >
      {/* Duas naturezas, dois blocos. O subsídio é remuneração
          pessoal fixada em lei e IGUAL para todos os vereadores da
          casa — comparar parlamentares por ele não diz nada. O
          custeio é despesa do gabinete e varia muito entre eles: é
          ali que a comparação tem sentido. */}
      <div className="grid gap-5 sm:grid-cols-2">
        {custo.mensalBruto != null && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Recebe por mês
            </p>
            <p className="font-tabular text-2xl font-bold text-text">
              <Moeda value={custo.mensalBruto} />
            </p>
            <p className="text-xs text-text-soft">
              subsídio bruto, antes dos descontos
            </p>
            {custo.mensalExtras != null && custo.mensalExtras > 0 && (
              <p className="mt-1.5 text-xs text-text-soft">
                + <Moeda value={custo.mensalExtras} /> de verbas
                fixas (auxílio-alimentação)
              </p>
            )}
            {custo.competencia && (
              <p className="mt-1.5 text-[11px] text-text-soft">
                Valor vigente em {formatDateBR(custo.competencia).slice(3)}. É
                o mesmo para todos os {vereadoresDaCasa} vereadores — fixado
                por lei, não por desempenho.
              </p>
            )}
          </div>
        )}

        {custo.gastoPorAno.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Gabinete gastou
            </p>
            <ul className="mt-1 flex flex-col gap-2">
              {custo.gastoPorAno.map((a) => (
                <li key={a.ano} className="flex items-baseline justify-between gap-3">
                  <span className="font-tabular text-sm text-text-soft">{a.ano}</span>
                  <span className="flex-1 border-b border-dotted border-border" />
                  <span className="font-tabular text-base font-semibold text-text">
                    <Moeda value={a.total} />
                  </span>
                  <span className="text-[11px] text-text-soft">
                    {formatNumberBR(a.qtd)} desp.
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-text-soft">
              Custeio do gabinete: material de escritório, serviços
              postais, gráfica e afins.{" "}
              {anoParcial != null && (
                <>O ano de {anoParcial} ainda está em curso.</>
              )}
            </p>
            <Link
              href="/camara#gastos-gabinete"
              className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
            >
              Comparar com os outros vereadores →
            </Link>
          </div>
        )}
      </div>
    </DataCard>
  );
}
