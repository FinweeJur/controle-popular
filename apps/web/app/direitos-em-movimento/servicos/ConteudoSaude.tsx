import CruzamentosEducativos from "@/app/components/eixos/CruzamentosEducativos";
import ExplicaSigla from "@/app/components/ExplicaSigla";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import { BarraAnimadaSvg } from "@/app/components/dados/BarraAnimada";
import { calcularCruzamentosMunicipais } from "@/lib/cruzamentos/correlacionador";

/**
 * @file Recorte de saúde do painel `/direitos-em-movimento/servicos`.
 *
 * O QUE É: os quatro cartões de referência e a divisão de leitos SUS/privados.
 * Veio de `direitos-em-movimento/saude-publica`, que virou faceta.
 *
 * DE ONDE VÊM OS NÚMEROS: CNES/DataSUS. São valores de referência nacional
 * fixados no código, não medição do portal — o aviso do painel
 * (`AvisoReferencia`) diz isso antes do primeiro cartão. Ao atualizar, troque
 * o valor E a data de referência; número velho sem data envelhece calado.
 */

const REFERENCIA = "Referência nacional · competência divulgada pelo CNES";

const INDICADORES = [
  {
    rotulo: "Estabelecimentos CNES",
    valorNumerico: 348210,
    formatar: (n: number) => Math.round(n).toLocaleString("pt-BR"),
    obs: "Brasil (públicos e conveniados)",
  },
  {
    rotulo: "Leitos SUS ativos",
    valorNumerico: 315420,
    formatar: (n: number) => Math.round(n).toLocaleString("pt-BR"),
    obs: "72,4% da rede total",
  },
  {
    rotulo: "Razão média de leitos",
    valorNumerico: 1.95,
    formatar: (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    obs: "Leitos/mil hab. (referência OMS: 2,5 a 3,0)",
  },
  {
    rotulo: "Internações SUS / ano",
    valorNumerico: 11.4,
    formatar: (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`,
    obs: "AIHs aprovadas e pagas (SIH-SUS)",
  },
];

export default function ConteudoSaude() {
  const cruzamento = calcularCruzamentosMunicipais({
    codIbge7: "3106200",
    nome: "Belo Horizonte",
    uf: "MG",
    populacao: 2315000,
    totalLeitosSus: 5200,
    totalHomicidiosAno: 280,
    idebAnosIniciais: 6.1,
  });

  return (
    <>
      <section aria-label="Indicadores gerais de saúde" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {INDICADORES.map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              {item.rotulo}
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              <ContadorAnimado valor={item.valorNumerico} formatar={item.formatar} />
            </span>
            <span className="text-xs text-muted block mt-1">{item.obs}</span>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted">{REFERENCIA}</p>
      <ExplicaSigla
        sigla="SUS"
        extenso="Sistema Único de Saúde"
        explicacao="é o sistema público de saúde — o posto, a UPA e o hospital que atendem sem cobrar."
        dica="SUS é o Sistema Único de Saúde: o atendimento público e gratuito, do posto de saúde ao hospital."
      />
      <section
        aria-labelledby="titulo-grafico-leitos"
        className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-leitos" className="font-display text-lg font-bold text-foreground">
              Distribuição de leitos de internação no Brasil
            </h2>
            <p className="text-xs text-muted">
              Proporção entre leitos vinculados ao SUS e leitos exclusivamente privados (CNES/DataSUS)
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            Fonte: CNES / Ministério da Saúde
          </span>
        </div>

        <div className="my-6">
          <svg
            className="w-full h-8 rounded-lg overflow-hidden"
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            role="img"
            aria-label="Gráfico de barras: 72,4% leitos SUS, 27,6% leitos privados"
          >
            <BarraAnimadaSvg x={0} y={0} width={72.4} height={8} fill="var(--cp-eixo-direitos, #c0392b)" />
            <BarraAnimadaSvg x={72.4} y={0} width={27.6} height={8} fill="var(--cp-secondary, #6d28d9)" />
          </svg>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-xs"
                style={{ backgroundColor: "var(--cp-eixo-direitos, #c0392b)" }}
              />
              <span className="font-semibold text-foreground">Leitos SUS: 72,4%</span>
              <span className="text-muted">(315.420 leitos)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-xs"
                style={{ backgroundColor: "var(--cp-secondary, #6d28d9)" }}
              />
              <span className="font-semibold text-foreground">Exclusivamente privados: 27,6%</span>
              <span className="text-muted">(120.180 leitos)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left border-t border-border/60">
            <caption className="sr-only">
              Leitos SUS e privados no Brasil, com participação e acesso
            </caption>
            <thead>
              <tr className="text-muted font-semibold">
                <th className="py-2">Segmento</th>
                <th className="py-2">Leitos ativos</th>
                <th className="py-2">Participação</th>
                <th className="py-2">Acesso cidadão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-2 font-medium">Público / conveniado SUS</td>
                <td className="py-2">315.420</td>
                <td className="py-2">72,4%</td>
                <td className="py-2 text-emerald-600 dark:text-emerald-400">100% universal e gratuito</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Rede privada / saúde suplementar</td>
                <td className="py-2">120.180</td>
                <td className="py-2">27,6%</td>
                <td className="py-2 text-muted">Planos de saúde ou desembolso direto</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <CruzamentosEducativos
        cruzamentos={cruzamento}
        nomeMunicipio="Exemplo de referência: Belo Horizonte (MG)"
      />
    </>
  );
}
