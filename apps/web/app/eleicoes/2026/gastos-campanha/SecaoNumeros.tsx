import type { ReactElement } from "react";
import Moeda from "@/app/components/Moeda";
import { Cartao, totaisPorGrupo } from "./comum";
import { bigtech, dataColeta, meta } from "./dados";
import { formatCurrencyCompactaBR } from "@/lib/betim/format";
import { formatarNumeroBR } from "@/lib/utilitarios/calculos";

/**
 * Seção "Os números da eleição, de relance": os oito cartões de topo da página
 * de gastos de campanha.
 *
 * Extraída do `page.tsx` (pedido do dono de arquivo curto, 10/10/2026): eram
 * ~45 linhas de JSX repetitivo de `Cartao`, que empurravam o método principal
 * para além do limiar de saúde do CodeScene sem acrescentar lógica.
 */
export default function SecaoNumeros(): ReactElement {
  const gruposBigTech = totaisPorGrupo(bigtech.empresas);

  return (
    <section aria-labelledby="cartoes" className="space-y-3">
      <h2 id="cartoes" className="font-display text-2xl font-bold">
        Os números da eleição, de relance
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          titulo="Receita declarada"
          valor={<Moeda value={meta.totais.receita} />}
          detalhe={`${formatarNumeroBR(meta.totais.candidaturas, 0)} candidaturas · fundo especial, fundo partidário e doações`}
        />
        <Cartao
          titulo="Despesa contratada"
          valor={<Moeda value={meta.totais.contratado} />}
          detalhe="prometido em contrato — não se soma ao pago"
        />
        <Cartao
          titulo="Despesa paga"
          valor={<Moeda value={meta.totais.pago} />}
          detalhe={`parcela liquidada até ${dataColeta}`}
        />
        <Cartao
          titulo="Eleitos no 1º turno"
          valor={formatarNumeroBR(meta.totais.eleitos1Turno, 0)}
          detalhe={`${meta.totais.pendentes2Turno} cargos pendentes no 2º turno de 25/10`}
        />
        <Cartao
          titulo="Publicidade digital contratada"
          valor={<Moeda value={meta.grupos.digital.contratado} />}
          detalhe={`já pago: ${formatCurrencyCompactaBR(meta.grupos.digital.pago)} — impulsionamento, anúncio e página`}
        />
        <Cartao
          titulo="Materiais impressos"
          valor={<Moeda value={meta.grupos.materiais.contratado} />}
          detalhe={`já pago: ${formatCurrencyCompactaBR(meta.grupos.materiais.pago)} — santinho, adesivo, panfleto`}
        />
        <Cartao
          titulo="Mobilização de rua"
          valor={<Moeda value={meta.grupos.rua.contratado} />}
          detalhe={`já pago: ${formatCurrencyCompactaBR(meta.grupos.rua.pago)} — comitê, carro de som, militância`}
        />
        <Cartao
          titulo="Big tech"
          valor={<Moeda value={bigtech.total} />}
          detalhe={gruposBigTech.map((g) => `${g.rotulo.split(" ")[0]} ${formatCurrencyCompactaBR(g.total)}`).join(" · ")}
        />
      </div>
    </section>
  );
}
