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

      {/*
        A correção existe e ainda não está no dado da tela. Dizer isso é o
        ponto: o bloco inteiro existe porque este portal cobra dos outros que
        publiquem número com margem, e publicar um defeito JÁ diagnosticado,
        JÁ medido e JÁ corrigido no código sem avisar que ele continua no mapa
        seria cobrar o que não se faz em casa.

        Renderiza pelo booleano, não por data: quando a rodada acontecer e o
        dado novo entrar, `correcaoNoDadoPublicado` vira true e este parágrafo
        some sozinho. Uma data escrita à mão aqui desatualizaria calada — é o
        mesmo erro que o selo "dados de 28/07" cometeu no globo.
      */}
      {!t.correcaoNoDadoPublicado && (
        <p className="mt-3 max-w-[62ch] rounded-lg border border-border bg-surface p-3 text-sm text-text-soft">
          <strong className="text-text">
            Esta correção ainda não está no mapa.
          </strong>{" "}
          Desde {new Date(t.dirigido.medidoEm + "T00:00:00").toLocaleDateString("pt-BR")} o
          pipeline já subtrai a faixa das estradas, e a medição de controle
          mostrou o efeito esperado: menos área e mais polígonos, porque a
          estrada parte o contorno em dois. Mas aplicar isso à bacia inteira
          exige reprocessar o cadastro dos 56 municípios, o que ainda não
          rodou. As áreas que você vê aqui são as de antes da correção — e
          algumas delas ainda têm estrada dentro do contorno.
        </p>
      )}

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
