import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import {
  BIBLIOTECA,
  C,
  INICIATIVAS_SEM_EMPENHO,
  JURIS,
  MAB,
  NOTICIAS,
  PERCENTUAL_PAGO,
  PID,
} from "./dados";
import { CabecalhoSecao, CartaoNumero } from "./Componentes";

const CARTOES = [
  {
    rotulo: "Empenhos em MG",
    valor: formatNumberBR(C.empenhos),
    detalhe: `Execução do Acordo de Reparação pelo Governo de Minas, ${C.anoInicial}–${C.anoFinal}.`,
    fonte: "CKAN MG · dados da página",
    href: "/ambiental/mariana",
  },
  {
    rotulo: "Valor empenhado",
    valor: formatCurrencyCompactaBR(C.valorEmpenhadoTotal),
    detalhe: "Soma dos empenhos do Acordo na parte executada por órgãos estaduais.",
    fonte: "CKAN MG · dados da página",
    href: "/ambiental/mariana",
  },
  {
    rotulo: "Valor pago",
    valor: formatCurrencyCompactaBR(C.valorPagoTotal),
    detalhe: `${PERCENTUAL_PAGO.toFixed(1).replace(".", ",")}% do total empenhado já passou pelo pagamento financeiro.`,
    fonte: "CKAN MG · dados da página",
    href: "/ambiental/mariana",
  },
  {
    rotulo: "Iniciativas",
    valor: formatNumberBR(C.iniciativas),
    detalhe: `${INICIATIVAS_SEM_EMPENHO} delas ainda sem empenho registrado na base.`,
    fonte: "CKAN MG · dados da página",
    href: "/ambiental/mariana",
  },
  {
    rotulo: "Documentos de Mariana",
    valor: formatNumberBR(BIBLIOTECA.mariana),
    detalhe: `De ${formatNumberBR(BIBLIOTECA.total)} itens na biblioteca unificada dos dois desastres.`,
    fonte: "Biblioteca dos desastres",
    href: "/ambiental/crimes-socioambientais",
  },
  {
    rotulo: "Notícias de Mariana",
    valor: formatNumberBR(NOTICIAS.mariana),
    detalhe: `De ${formatNumberBR(NOTICIAS.total)} itens no radar de notícias dos desastres.`,
    fonte: "Radar de notícias",
    href: "/riodoce/clipping",
  },
  {
    rotulo: "Publicações do MAB",
    valor: formatNumberBR(MAB.mariana),
    detalhe: `De ${formatNumberBR(MAB.total)} publicações coletadas do Movimento dos Atingidos por Barragens.`,
    fonte: "MAB · fonte interessada",
    href: "/paraopeba/mab",
  },
  {
    rotulo: "Acórdãos do TJES",
    valor: formatNumberBR(JURIS.tjes),
    detalhe: `O TJMG soma ${formatNumberBR(JURIS.tjmg)} no mesmo buscador de jurisprudência.`,
    fonte: "Buscador de jurisprudência",
    href: "/jurisprudencia?tribunal=TJES&estado=ES#lista",
  },
] as const;

/**
 * "O caso em números": oito cartões de primeira camada. Cada um leva à
 * página que aprofunda aquele recorte; a contagem nunca é digitada aqui.
 */
export function SecaoNumeros() {
  return (
    <section
      id="numeros"
      aria-labelledby="titulo-numeros"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-numeros"
        numero="01"
        titulo="O caso em números"
        descricao="Oito medidas para situar o tamanho do caso. Cada cartão diz de onde vem o número e abre a página que o detalha; valor e contagem não substituem a leitura da fonte."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARTOES.map((cartao) => (
          <CartaoNumero key={cartao.rotulo} {...cartao} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Execução:</strong> {formatNumberBR(C.empenhos)} empenhos em{" "}
          {formatNumberBR(C.orgaos)} órgãos, somando{" "}
          {formatCurrencyCompactaBR(C.valorEmpenhadoTotal)}.
        </p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Indenização:</strong> o PID registra{" "}
          {formatNumberBR(PID.indenizacoes / 1000)} mil indenizações de{" "}
          {formatCurrencyCompactaBR(PID.valorPorPessoa)} por pessoa elegível,
          segundo a Samarco em {PID.data}.
        </p>
        <p className="rounded-lg border border-border bg-surface-2 p-3 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Lacuna:</strong> o número de processos
          do caso não está medido nesta página; a lista de processos-chave
          segue em levantamento no DataJud.
        </p>
      </div>
    </section>
  );
}
