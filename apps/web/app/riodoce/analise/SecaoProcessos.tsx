import { Botao, BotaoExterno, CabecalhoSecao, Marca } from "./Componentes";

/**
 * "Processos" e "Dados espaciais": as duas frentes que ainda não têm
 * página própria na análise. A primeira já tem rota e consulta ao vivo; a
 * segunda tem medição, mas ainda não tem página — o cartão diz isso.
 */
export function SecaoProcessos() {
  return (
    <section
      id="processos"
      aria-labelledby="titulo-processos"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-processos"
        numero="08"
        titulo="Processos e dados espaciais"
        descricao="O caso também se lê pelos autos e pelas camadas da bacia. O portal consulta o CNJ ao vivo e declara a lacuna onde ainda não há medição publicada."
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
            Justiça · rota publicada
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            Processos da reparação
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-text-soft">
            TTAC de 2016, Novo Acordo homologado pelo STF em 06/11/2024 e
            Ações Civis Públicas, com a movimentação consultada{" "}
            <strong className="text-text">ao vivo</strong> na API pública do
            DataJud (CNJ). O portal não arquiva nem republica autos: cada
            consulta vai ao CNJ na hora.
          </p>
          <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-text-soft">
            O número de processos do caso <strong>não está medido</strong>{" "}
            nesta página: a lista de processos-chave segue em levantamento na
            fonte oficial. Lacuna declarada, não zero.{" "}
            <Marca tipo="nao" />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao href="/riodoce/processos">Ver os processos</Botao>
            <BotaoExterno href="https://datajud-wiki.cnj.jus.br/">
              Termo de Uso do DataJud
            </BotaoExterno>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-xl border border-dashed border-border bg-surface/60 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
            Bacia · em construção
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            Dados espaciais da bacia
          </h3>
          <p className="mt-2 font-tabular text-3xl font-bold text-primary">
            1.243
          </p>
          <p className="text-sm text-text">feições da mancha do Fundão</p>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-text-soft">
            Medição feita em 12/10/2026 no WFS da SEMAD (GetFeature com
            contagem de feições). É o tamanho da camada vetorial da mancha de
            inundação, não a área em hectares nem o número de imóveis
            atingidos. A camada ainda não tem página própria no portal.
          </p>
          <p className="mt-3 text-xs text-text-soft">
            O número de 1.243 é medido na fonte oficial. A área em hectares e
            os imóveis atingidos não estão medidos aqui.{" "}
            <Marca tipo="medido" />
            <Marca tipo="nao" />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <BotaoExterno href="https://geoserver.meioambiente.mg.gov.br/IDE/ows">
              Abrir o WFS da SEMAD
            </BotaoExterno>
            <Botao href="/ambiental/barragens" variante="contorno">
              Segurança de barragens
            </Botao>
          </div>
        </article>
      </div>
    </section>
  );
}
