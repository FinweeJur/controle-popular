import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import {
  ANOS,
  C,
  INICIATIVAS_SEM_EMPENHO,
  INICIATIVAS_TOP,
  MAIOR_ORGAO,
  ORGAOS,
  ORGAOS_TOP,
  PERCENTUAL_PAGO,
} from "./dados";
import {
  BarraValor,
  Botao,
  CabecalhoSecao,
  Marca,
  TabelaRolavel,
} from "./Componentes";

function porcento(valor: number): string {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

const SOMA_TOPO = ORGAOS_TOP.reduce(
  (soma, orgao) => soma + orgao.valorEmpenhado,
  0,
);
const OUTROS_ORGAOS = ORGAOS.length - ORGAOS_TOP.length;
const OUTROS_VALOR = C.valorEmpenhadoTotal - SOMA_TOPO;

/**
 * "Reparação e dinheiro": a execução do Acordo em MG por ano, por órgão e
 * por iniciativa. Lê o agregado do CKAN; a página de `/ambiental/mariana`
 * continua sendo o acervo completo, e este bloco só resume.
 */
export function SecaoDinheiro() {
  return (
    <section
      id="reparacao"
      aria-labelledby="titulo-reparacao"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-reparacao"
        numero="03"
        titulo="Reparação e dinheiro"
        descricao={
          <>
            A parte do Acordo de Reparação executada pelo Governo de Minas:
            empenho é o compromisso de gasto; pagamento é o dinheiro que saiu.
            Os dois aparecem lado a lado para o leitor ver a diferença.
          </>
        }
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-soft">
            Empenhado
          </p>
          <p className="mt-1 font-tabular text-2xl font-bold">
            {formatCurrencyCompactaBR(C.valorEmpenhadoTotal)}
          </p>
          <p className="mt-1 text-xs text-text-soft">
            {formatNumberBR(C.empenhos)} empenhos em {formatNumberBR(C.orgaos)}{" "}
            órgãos.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-soft">
            Pago
          </p>
          <p className="mt-1 font-tabular text-2xl font-bold">
            {formatCurrencyCompactaBR(C.valorPagoTotal)}
          </p>
          <p className="mt-1 text-xs text-text-soft">
            {porcento(PERCENTUAL_PAGO)} do valor empenhado.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-soft">
            Iniciativas
          </p>
          <p className="mt-1 font-tabular text-2xl font-bold">
            {formatNumberBR(C.iniciativas)}
          </p>
          <p className="mt-1 text-xs text-text-soft">
            {INICIATIVAS_SEM_EMPENHO} sem empenho registrado na base.
          </p>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-soft">
        A soma dos empenhos bate com o total que a própria fonte declara
        (R$ {formatNumberBR(C.valorEmpenhadoDeclaradoPelaFonte)}), conferência
        feita no arquivo gerado do CKAN MG.{" "}
        <Marca tipo="medido" /> Números atualizados a partir do dado
        versionado, não digitados nesta página.
      </p>

      <h3 className="mt-8 font-display text-lg font-semibold">
        Por ano
      </h3>
      <TabelaRolavel legenda="Empenhos, valor empenhado e valor pago do Acordo do Rio Doce, por ano">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-text-soft">
            <th scope="col" className="px-3 py-2 font-semibold">Ano</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Empenhos</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Empenhado</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Pago</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">% pago</th>
          </tr>
        </thead>
        <tbody>
          {ANOS.map((ano) => (
            <tr key={ano.ano} className="border-b border-border/60">
              <td className="px-3 py-2 font-tabular font-semibold">{ano.ano}</td>
              <td className="px-3 py-2 text-right font-tabular">
                {formatNumberBR(ano.empenhos)}
              </td>
              <td className="px-3 py-2 text-right font-tabular">
                {formatCurrencyCompactaBR(ano.valorEmpenhado)}
              </td>
              <td className="px-3 py-2 text-right font-tabular">
                {formatCurrencyCompactaBR(ano.valorPagoFinanceiro)}
              </td>
              <td className="px-3 py-2 text-right font-tabular">
                {porcento(
                  (ano.valorPagoFinanceiro / ano.valorEmpenhado) * 100,
                )}
              </td>
            </tr>
          ))}
          <tr className="bg-surface-2 font-semibold">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2 text-right font-tabular">
              {formatNumberBR(C.empenhos)}
            </td>
            <td className="px-3 py-2 text-right font-tabular">
              {formatCurrencyCompactaBR(C.valorEmpenhadoTotal)}
            </td>
            <td className="px-3 py-2 text-right font-tabular">
              {formatCurrencyCompactaBR(C.valorPagoTotal)}
            </td>
            <td className="px-3 py-2 text-right font-tabular">
              {porcento(PERCENTUAL_PAGO)}
            </td>
          </tr>
        </tbody>
      </TabelaRolavel>
      <p className="mt-2 text-xs leading-relaxed text-text-soft">
        A base cobre 2025 e 2026. O ano de 2026 é o ano corrente da medição,
        não um exercício encerrado; por isso o valor pago ainda é menor que o
        empenhado. <Marca tipo="medido" />
      </p>

      <h3 className="mt-8 font-display text-lg font-semibold">
        Os oito maiores órgãos executores
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-text-soft">
        Barra proporcional ao maior órgão da lista; o percentual ao lado é a
        fatia do total empenhado. Os {OUTROS_ORGAOS} órgãos restantes somam{" "}
        {formatCurrencyCompactaBR(OUTROS_VALOR)} (
        {porcento((OUTROS_VALOR / C.valorEmpenhadoTotal) * 100)} do total).
        <Marca tipo="medido" />
      </p>
      <div className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        {ORGAOS_TOP.map((orgao) => (
          <BarraValor
            key={orgao.orgao}
            rotulo={orgao.orgao}
            valor={formatCurrencyCompactaBR(orgao.valorEmpenhado)}
            percentual={`${porcento(orgao.fatiaDoTotal)} do total`}
            larguraPercentual={(orgao.valorEmpenhado / MAIOR_ORGAO) * 100}
            detalhe={`Pago: ${formatCurrencyCompactaBR(orgao.valorPagoFinanceiro)} (${porcento(
              (orgao.valorPagoFinanceiro / orgao.valorEmpenhado) * 100,
            )} do empenhado neste órgão)`}
            ariaRotulo={`${orgao.orgao}: ${formatCurrencyCompactaBR(
              orgao.valorEmpenhado,
            )} empenhados, ${porcento(orgao.fatiaDoTotal)} do total`}
          />
        ))}
      </div>

      <h3 className="mt-8 font-display text-lg font-semibold">
        As oito maiores iniciativas por valor empenhado
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-text-soft">
        O valor prometido é o que a cláusula do Acordo pactuou; o empenhado é
        o que já virou compromisso de gasto. São medidas diferentes e não se
        somam. Das {C.iniciativas} iniciativas, {INICIATIVAS_SEM_EMPENHO} ainda
        não tinham empenho na base.{" "}
        <Marca tipo="medido" />
      </p>
      <TabelaRolavel legenda="Oito maiores iniciativas do Acordo do Rio Doce por valor empenhado">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-text-soft">
            <th scope="col" className="px-3 py-2 font-semibold">Iniciativa</th>
            <th scope="col" className="px-3 py-2 font-semibold">Anexo</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Prometido</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Empenhado</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Pago</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Empenhos</th>
          </tr>
        </thead>
        <tbody>
          {INICIATIVAS_TOP.map((item) => (
            <tr key={item.codigo} className="border-b border-border/60 align-top">
              <td className="min-w-[16rem] max-w-[26rem] px-3 py-2">
                <span className="line-clamp-3 text-xs leading-snug" title={item.iniciativa}>
                  {item.iniciativa}
                </span>
              </td>
              <td className="px-3 py-2 text-xs">{item.anexo}</td>
              <td className="px-3 py-2 text-right font-tabular text-xs">
                {formatCurrencyCompactaBR(item.valorPrometido)}
              </td>
              <td className="px-3 py-2 text-right font-tabular text-xs font-semibold">
                {formatCurrencyCompactaBR(item.valorEmpenhado)}
              </td>
              <td className="px-3 py-2 text-right font-tabular text-xs">
                {formatCurrencyCompactaBR(item.valorPagoFinanceiro)}
              </td>
              <td className="px-3 py-2 text-right font-tabular text-xs">
                {formatNumberBR(item.empenhos)}
              </td>
            </tr>
          ))}
        </tbody>
      </TabelaRolavel>

      <div className="mt-5 flex flex-wrap gap-3">
        <Botao href="/ambiental/mariana">Ver a execução completa em MG</Botao>
        <Botao href="/riodoce/processos" variante="contorno">
          Processos da reparação
        </Botao>
      </div>
    </section>
  );
}
