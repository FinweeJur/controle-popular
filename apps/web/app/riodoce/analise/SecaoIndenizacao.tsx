import { MarkdownResumo } from "@/app/components/ResumoRealidade";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import { PID, VIAS_INDENIZACAO } from "./dados";
import { Botao, CabecalhoSecao, Marca } from "./Componentes";

/**
 * "Indenização individual": as portas separadas do dano individual
 * homogêneo. A tabela e os parágrafos vêm do markdown da análise, para os
 * números não viverem em duas versões.
 */
export function SecaoIndenizacao() {
  return (
    <section
      id="indenizacao"
      aria-labelledby="titulo-indenizacao"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-indenizacao"
        numero="04"
        titulo="Indenização individual"
        descricao="O dano coletivo corre em ação civil pública; o dano individual se repara por portas separadas, com critérios e valores diferentes. As linhas não formam uma série e não se somam."
      />

      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          A medida final do Novo Acordo
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold">
          PID — {formatNumberBR(PID.indenizacoes / 1000)} mil indenizações
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed">
          O Programa de Indenização e Desligamento paga{" "}
          <strong>
            {formatCurrencyCompactaBR(PID.valorPorPessoa)} por pessoa elegível
          </strong>
          , em parcela única, e exige quitação e desistência de ação judicial
          no Brasil e no exterior. O balanço da Samarco de{" "}
          <strong>{PID.data}</strong> registra mais de{" "}
          {formatNumberBR(PID.indenizacoes / 1000)} mil indenizações e soma{" "}
          {formatNumberBR(PID.pessoas / 1000)} mil pessoas indenizadas ou
          auxiliadas desde 2015 e {formatCurrencyCompactaBR(PID.pago)} pagos.{" "}
          <Marca tipo="medido" />
        </p>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-text-soft">
          O total de {formatNumberBR(PID.indenizacoes / 1000)} mil aparece só
          no balanço da Samarco; as demais instituições confirmam o desenho do
          programa, não o contador. O Governo Federal descreve o Acordo de
          R$ 170 bilhões e os R$ 32 bilhões para indenizações individuais.{" "}
          <Marca tipo="medido" />
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <MarkdownResumo markdown={VIAS_INDENIZACAO} />
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-soft">
        A média por acordo não é comparável entre as linhas: cada via cobre um
        conjunto diferente de danos. Uma indenização por dano água é, em geral,
        mais baixa que uma por danos gerais, que inclui dano material e moral.{" "}
        <Marca tipo="inferido" />
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Botao href="/ambiental/rio-doce/analise">
          Ler a análise do litoral e da reparação
        </Botao>
        <Botao href="/riodoce/processos" variante="contorno">
          Processos da reparação
        </Botao>
      </div>
    </section>
  );
}
