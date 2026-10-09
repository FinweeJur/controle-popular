import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import Moeda from "@/app/components/Moeda";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import TabelaResumo from "./TabelaResumo";
import { GraficoGrupos } from "./GraficosGastos";
import { Cartao, totaisPorGrupo } from "./comum";
import SecaoBigTech from "./SecaoBigTech";
import ListaGastos from "./ListaGastos";
import AnaliseUf from "./AnaliseUf";
import {
  COLUNAS_CARGO,
  COLUNAS_FONECEDOR,
  COLUNAS_NATUREZA,
  COLUNAS_PARTIDO,
  COLUNAS_PARTIDO_ANALISE,
  COLUNAS_RECEITA,
  COLUNAS_UF,
} from "./colunas";
import { bigtech, dataColeta, fornecedores, meta, partidos, porPartido, porUfAnalise } from "./dados";
import { formatCurrencyCompactaBR } from "@/lib/betim/format";
import { formatarMoedaBR, formatarNumeroBR } from "@/lib/utilitarios/calculos";

/**
 * `/eleicoes/2026/gastos-campanha` — quanto as campanhas de 2026 gastaram
 * em publicidade, de onde veio o dinheiro e quanto cada voto custou.
 *
 * Fonte única: TSE — Dados Abertos (prestação de contas 2026 + resultados
 * 2026), coletados pelo ETL `scripts/etl/eleicoes/gastos-campanha-2026.py`
 * em 09/10/2026. DADO PARCIAL de propósito e com selo na tela: as contas
 * definitivas valem até 03/11/2026 e o 2º turno é em 25/10/2026 — número
 * parcial publicado sem selo é número errado (AGENTS.md § 7).
 *
 * Arquitetura da página (pedido do dono, 09/10/2026: arquivo curto):
 * `dados.ts` traz os JSONs tipados, `colunas.tsx` as colunas das tabelas,
 * `comum.tsx` cartões e agregadores, `SecaoBigTech.tsx` a seção maior, e
 * aqui só a composição. A tabela grande (1.823 linhas) não vem por import:
 * é fatiada em `dados/[arquivo]/route.ts` e carregada no navegador.
 */

export const metadata: Metadata = metadataEditavel("/eleicoes/2026/gastos-campanha", {
  title: "Gastos de campanha 2026 — publicidade, big tech e custo por voto | Controle Popular",
  description:
    "Receita, despesa contratada e paga, gasto digital e custo por voto nas Eleições de 2026, com link para a fonte oficial do TSE. Dado parcial medido em 09/10/2026.",
});

// Sem searchParams, mas com force-static: sem ele o output:'export' trata a
// rota como dinâmica e aborta com "missing generateStaticParams()" (mesma
// nota de congresso/votacoes/page.tsx).
export const dynamic = "force-static";

export default function GastosCampanha2026(): ReactElement {
  const naturezasComValor = meta.naturezas.filter((n) => n.cd !== "-1");
  const topNaturezas = naturezasComValor.slice(0, 12);
  const ufs = meta.porUf.map((u) => u.uf).sort((a, b) => a.localeCompare(b));
  const gruposBigTech = totaisPorGrupo(bigtech.empresas);
  const siglasPartido = porPartido.map((p) => p.partido).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs opacity-70">
          <Link href="/" className="underline-offset-2 hover:underline">
            Início
          </Link>{" "}
          · Eleições 2026 · prestação de contas ao TSE · coleta de {dataColeta}
        </p>
        <h1 className="font-display text-3xl font-bold">
          Gastos de campanha 2026: onde o dinheiro da publicidade foi parar
        </h1>
        <ResumoExpandivel
          className="max-w-3xl opacity-80"
          texto={`Receita declarada de ${formatCurrencyCompactaBR(meta.totais.receita)}, despesa contratada de ${formatCurrencyCompactaBR(meta.totais.contratado)} e ${formatCurrencyCompactaBR(meta.totais.pago)} já pagos até ${dataColeta} — este é o dinheiro das Eleições de 2026 visto pela prestação de contas ao TSE. A publicidade digital contratada soma ${formatCurrencyCompactaBR(meta.grupos.digital.contratado)} e a Meta recebeu ${formatCurrencyCompactaBR(gruposBigTech[0]?.total ?? 0)} disso. Cada linha traz votos, custo por voto e o caminho de volta para a fonte oficial. O dado é parcial: as contas definitivas valem até 03/11/2026 e o 2º turno é em 25/10/2026.`}
        />
        <div
          className="rounded-lg border-2 p-4"
          style={{ borderColor: "var(--cp-alert)" }}
          role="note"
          aria-label="Aviso de dado parcial"
        >
          <p className="text-sm font-semibold" style={{ color: "var(--cp-alert)" }}>
            ⚠️ Dado parcial — coleta de {dataColeta}
          </p>
          <p className="mt-1 text-sm opacity-80">{meta.coleta.motivo_parcial}</p>
          <p className="mt-1 text-sm opacity-80">Próxima leitura: {meta.coleta.recoleta}</p>
        </div>
      </header>

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

      <section aria-labelledby="entrou-saiu" className="space-y-4">
        <h2 id="entrou-saiu" className="font-display text-2xl font-bold">
          Como o dinheiro entrou e em que saiu
        </h2>
        <TabelaResumo
          colunas={COLUNAS_RECEITA}
          linhas={meta.receitaPorFonte}
          chave={(r) => r.fonte}
          legenda={`Receita por origem, somando as ${formatarNumeroBR(meta.totais.candidaturas, 0)} candidaturas — a soma bate com o total de ${formatarMoedaBR(meta.totais.receita)}`}
        />
        <GraficoGrupos grupos={meta.grupos} />
        <TabelaResumo
          colunas={COLUNAS_NATUREZA}
          linhas={topNaturezas}
          chave={(n) => n.cd}
          legenda={`As ${topNaturezas.length} maiores naturezas de despesa de ${naturezasComValor.length} com valor registrado — ordenadas por valor contratado`}
        />
        <p className="text-xs opacity-70">
          As duas medidas não se somam: “contratado” vem do arquivo de despesas contratadas e
          “pago” do arquivo de despesas pagas. “Pago” é parcela do que foi contratado.
        </p>
      </section>

      <section aria-labelledby="cargos" className="space-y-4">
        <h2 id="cargos" className="font-display text-2xl font-bold">
          Quanto cada cargo gastou e quanto custou cada voto
        </h2>
        <TabelaResumo
          colunas={COLUNAS_CARGO}
          linhas={meta.porCargo}
          chave={(c) => c.cargo}
          legenda="Por cargo, no país inteiro — o custo por voto é a mediana entre os eleitos: metade gastou menos, metade mais"
        />
        <p className="text-xs opacity-70">
          Presidente não tem custo mediano: nenhum foi eleito no 1º turno, e o par a 25/10 ainda
          não tem despesa definitiva. Custo por voto da linha = despesa paga ÷ votos nominais.
        </p>
        <TabelaResumo
          colunas={COLUNAS_UF}
          linhas={meta.porUf}
          chave={(u) => u.uf}
          legenda={'Por unidade da federação — "BR" é a eleição presidencial, com os votos de todo o país'}
        />
      </section>

      <section aria-labelledby="por-partido" className="space-y-4">
        <h2 id="por-partido" className="font-display text-2xl font-bold">
          Análise por partido: quanto cada legenda arrecadou e gastou
        </h2>
        <p className="max-w-3xl text-sm opacity-80">
          As {porPartido.length} legendas com candidatura em 2026, somando o universo completo das{" "}
          {formatarNumeroBR(meta.totais.candidaturas, 0)} candidaturas — não só a tabela de 1.823. O
          big tech por partido daqui bate com a seção Big tech, e o custo por voto é a mediana entre
          os eleitos de cada legenda.
        </p>
        <TabelaResumo
          colunas={COLUNAS_PARTIDO_ANALISE}
          linhas={porPartido}
          chave={(p) => p.partido}
          legenda="Por partido, no país inteiro — candidaturas, eleitos, valores e custo por voto mediano entre os eleitos da legenda"
        />
      </section>

      <SecaoBigTech />

      <section aria-labelledby="por-estado" className="space-y-4">
        <h2 id="por-estado" className="font-display text-2xl font-bold">
          Análise por estado: escolha o estado e veja os partidos por dentro
        </h2>
        <p className="max-w-3xl text-sm opacity-80">
          Os 27 estados e o Distrito Federal, com totais do estado e o detalhe por legenda — abre
          em MG por padrão. A presidência fica fora desta visão: o voto é nacional e já aparece na
          tabela por cargo. Clique no título da coluna para ordenar e baixe o CSV do estado na
          tela.
        </p>
        <AnaliseUf ufs={porUfAnalise} />
      </section>

      <section aria-labelledby="partidos" className="space-y-4">
        <h2 id="partidos" className="font-display text-2xl font-bold">
          Órgãos partidários: o partido como instituição
        </h2>
        <TabelaResumo
          colunas={COLUNAS_PARTIDO}
          linhas={partidos}
          chave={(p) => p.partido}
          legenda={`Os ${partidos.length} partidos com movimentação declarada — a prestação própria dos órgãos partidários, NÃO é a soma dos candidatos da análise por partido (universos diferentes, não somáveis entre si)`}
        />
      </section>

      <section aria-labelledby="fornecedores" className="space-y-4">
        <h2 id="fornecedores" className="font-display text-2xl font-bold">
          Quem recebeu: os maiores fornecedores de campanha
        </h2>
        <TabelaResumo
          colunas={COLUNAS_FONECEDOR}
          linhas={fornecedores}
          chave={(f) => `${f.cnpj}-${f.nome}`}
          legenda="Top 40 por valor contratado, com o CNPJ que a campanha declarou"
        />
        <p className="text-xs opacity-70">
          Aparecer aqui é fato declarado ao TSE, não julgamento: gráfica, agência e plataforma
          convivem na mesma lista porque a campanha pagou as duas coisas.
        </p>
      </section>

      <section aria-labelledby="candidaturas" className="space-y-4">
        <h2 id="candidaturas" className="font-display text-2xl font-bold">
          Candidatura por candidatura
        </h2>
        <p className="max-w-3xl text-sm opacity-80">
          {formatarNumeroBR(meta.totais.linhasTabela, 0)} linhas: todos os{" "}
          {formatarNumeroBR(meta.totais.eleitos1Turno, 0)} eleitos no 1º turno, os{" "}
          {meta.totais.pendentes2Turno} pendentes de 2º turno e os 50 que mais contrataram e
          arrecadaram em cada cargo, de um total de{" "}
          {formatarNumeroBR(meta.totais.candidaturas, 0)} candidaturas. Busque pelo nome, filtre por
          cargo, UF (MG inclusive), partido e resultado, ordene por qualquer coluna e baixe em CSV o
          que estiver na tela, já com separador ponto e vírgula e pronto para o Excel brasileiro.
        </p>
        <ListaGastos
          base={`${process.env.PAGES_BASE_PATH ?? ""}/eleicoes/2026/gastos-campanha/dados`}
          ufs={ufs}
          partidos={siglasPartido}
        />
        <p className="text-xs opacity-70">
          O TSE não publica endereço por candidato sem o sequencial de prestação de contas, que
          bloqueia acesso automatizado — a fonte de cada linha é o arquivo oficial do cargo, na
          seção Fonte, abaixo.
        </p>
      </section>

      <section aria-labelledby="lacunas" className="space-y-4">
        <h2 id="lacunas" className="font-display text-2xl font-bold">
          Lacunas desta coleta
        </h2>
        <ul className="list-disc space-y-1 pl-6 text-sm opacity-80">
          {meta.lacunas.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <h3 className="font-display text-xl font-bold">Metodologia</h3>
        <p className="max-w-3xl text-sm opacity-80">{meta.metodologia}</p>
        <h3 className="font-display text-xl font-bold">Fonte</h3>
        <p className="max-w-3xl text-sm opacity-80">
          {meta.fonte.nome}:{" "}
          <a
            href={meta.fonte.url_prestacao}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            prestação de contas eleitorais 2026 ↗
          </a>{" "}
          e{" "}
          <a
            href={meta.fonte.url_resultados}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            resultados 2026 ↗
          </a>
          . Conferir linha a linha é baixar o ZIP de cada arquivo oficial. Ver também:{" "}
          <Link href="/congresso/financiamento-eleitoral" className="underline">
            fornecedores de campanha de 2022
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
