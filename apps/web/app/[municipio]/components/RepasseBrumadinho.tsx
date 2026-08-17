import DataCard from "@/app/[municipio]/components/DataCard";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { URL_REPASSE, repasseDoMunicipio } from "@/lib/brumadinho/repasse";

/**
 * Quanto ESTA cidade recebeu do Acordo Judicial de Brumadinho.
 *
 * ═══ COMPONENTE DE SERVIDOR, E ISSO NÃO É DETALHE ═══
 *
 * O acervo tem 853 municípios (`data/repasse-brumadinho-mg.json`, 291 KB).
 * Nada disso atravessa a fronteira do cliente: a leitura acontece no BUILD e o
 * que sai daqui são os quatro números de uma cidade só, já formatados.
 *
 * Passar a coleção como prop de componente de cliente é o incidente que levou
 * uma rota a 35,5 MiB contra o teto de 25 MiB deste projeto. `DataCard` é
 * `"use client"`, mas recebe estes números como **children já renderizados no
 * servidor** — não como dado. É a mesma fronteira que as nove rotas de
 * `TabelaEstatica` respeitam.
 *
 * ═══ O QUE A TELA NÃO PODE DIZER ═══
 *
 * **"Brumadinho mandou dinheiro para a sua cidade porque ela foi atingida."**
 * Seria falso em 827 dos 853 casos. O rateio da Lei 23.830/2021 alcançou
 * TODOS os municípios de Minas, inclusive os que ficam a 600 km da bacia — e
 * confundir "recebeu repasse" com "foi atingido" é justamente o erro que o
 * portal existe para não cometer. Por isso o texto abaixo diz "todos os 853",
 * e não "as cidades atingidas".
 *
 * **"É proporcional à população."** Também não, sozinho: o rateio tem piso e
 * teto. Belo Horizonte tem 3.216× a população de Serra da Saudade e recebeu
 * 67× mais. A tela mostra a população ao lado do valor justamente para não
 * precisar afirmar uma regra de três que a lei não seguiu.
 *
 * **Um valor único.** São até três repasses, de três normas diferentes, e é a
 * norma que define no que o dinheiro pode ser gasto. Cada linha aparece com a
 * sua base legal.
 */
export default async function RepasseBrumadinho({ idMunicipio }: { idMunicipio: string }) {
  // Cidade fora de Minas (São Paulo é uma das do build) simplesmente não tem
  // linha aqui: o arquivo é estadual, e ausência não é lacuna a ser avisada.
  if (!/^31\d{5}$/.test(String(idMunicipio))) return null;

  const repasse = await repasseDoMunicipio(String(idMunicipio));
  if (!repasse?.rateio) return null;

  const { rateio, complementares } = repasse;

  return (
    <div className="mb-6">
      <DataCard
        title="Repasse do Acordo de Brumadinho"
        source={{ label: "Pró-Brumadinho / Governo de MG", url: URL_REPASSE }}
      >
        <p className="font-tabular text-2xl font-bold text-text">
          {formatCurrencyBRL(repasse.centavos / 100)}
        </p>

        <p className="mt-1 text-xs text-text-soft">
          Rateio de {formatCurrencyBRL(rateio.centavos / 100)} em 3 parcelas (40% em
          agosto/2021, 30% até janeiro/2022, 30% até julho/2022) — Lei nº 23.830/2021,
          art. 5º e Anexo V.
        </p>

        {complementares.map((c) => (
          <p key={c.fonte} className="mt-1 text-xs text-text-soft">
            Repasse complementar de {formatCurrencyBRL(c.centavos / 100)} em parcela
            única — {c.baseLegal}.
          </p>
        ))}

        <p className="mt-2 text-xs text-text-soft">
          O Acordo de Brumadinho dividiu R$ 1,65 bilhão entre{" "}
          <strong className="text-text">todos os 853 municípios de Minas</strong>, e não
          só entre os atingidos pelo rejeito. Receber este valor não significa que a
          cidade foi atingida. O rateio partiu da população estimada de 2019 (
          {repasse.populacao2019 === null
            ? "não informada"
            : `${formatNumberBR(repasse.populacao2019)} habitantes`}
          ), mas com piso e teto — por isso não é proporcional.
        </p>
      </DataCard>
    </div>
  );
}
