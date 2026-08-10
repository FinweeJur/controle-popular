import { TAXA_ERRO_G0 } from "@/lib/betim/terras";

/**
 * A taxa de erro do vazio cadastral, colada ao número que ela qualifica.
 *
 * Não é rodapé nem tooltip: é bloco visível, no mesmo fluxo de leitura do
 * valor em hectares. A regra que rege a publicação desta frente é que o
 * número e a sua margem de erro apareçam JUNTOS — um portal que critica
 * número sem procedência não pode publicar estimativa sem taxa de erro.
 *
 * O texto separa de propósito duas coisas que se confundem com facilidade:
 * o que foi MEDIDO (30,0% de falso-positivo, com intervalo) e o que foi
 * DECIDIDO (aceitar até 33%). A segunda é escolha de quem toca o projeto, e
 * o leitor tem direito de discordar dela sabendo que é escolha.
 */
export default function TaxaDeErroTerras() {
  const t = TAXA_ERRO_G0;
  const passa = t.taxaPct <= t.criterioPct;
  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-2 p-5">
      <h2 className="font-display text-base font-semibold text-text">
        Quanto este número erra
      </h2>

      <p className="mt-2 max-w-[62ch] text-sm text-text-soft">
        Quarenta polígonos foram sorteados ao acaso e conferidos um a um, a
        olho, sobre imagem de satélite em {t.medidoEm}.{" "}
        <strong className="text-text">
          {t.falsoPositivos} dos {t.julgados} não eram vazio cadastral
        </strong>{" "}
        — uma taxa de erro de{" "}
        <strong className="text-text">
          {t.taxaPct.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%
        </strong>
        , que com o tamanho da amostra pode estar entre {t.ic95[0]}% e{" "}
        {t.ic95[1]}%.
      </p>

      <p className="mt-3 max-w-[62ch] text-sm text-text-soft">
        O erro tem uma causa só: {t.causaDominante}. Não é ruído espalhado, é
        um defeito conhecido do recorte — e por isso mensurável e corrigível.
      </p>

      <p className="mt-3 max-w-[62ch] text-sm text-text-soft">
        O projeto aceita publicar até {t.criterioPct}% de erro.{" "}
        {passa ? (
          <>
            Como {t.taxaPct.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}% está
            abaixo disso, o número foi publicado.
          </>
        ) : (
          <>
            Como {t.taxaPct.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}% está
            acima disso, o número não deveria estar publicado.
          </>
        )}{" "}
        <strong className="text-text">Esse limite é uma escolha, não uma medição</strong> —
        e a medição acima vale independentemente dele.
      </p>

      <p className="mt-3 max-w-[62ch] text-xs text-text-soft">
        Vazio cadastral não é terra devoluta. É área que ninguém declarou no
        CAR: candidata a verificação, nunca afirmação de que a terra é pública.
      </p>
    </section>
  );
}
