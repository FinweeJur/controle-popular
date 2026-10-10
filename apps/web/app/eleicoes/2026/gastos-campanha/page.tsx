import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { IndiceWiki, MiniSumarioLateral } from "@/app/components/wiki";
import TabelaOrdenavel from "./TabelaOrdenavel";
import { GraficoGrupos } from "./GraficosGastos";
import { totaisPorGrupo } from "./comum";
import SecaoNumeros from "./SecaoNumeros";
import SecaoBigTech from "./SecaoBigTech";
import SecaoMetaAds from "./SecaoMetaAds";
import SecaoLacunas from "./SecaoLacunas";
import ListaGastos from "./ListaGastos";
import AnaliseUf from "./AnaliseUf";
import {
  COLUNAS_CARGO,
  COLUNAS_FORNECEDOR,
  COLUNAS_NATUREZA,
  COLUNAS_PARTIDO,
  COLUNAS_PARTIDO_ANALISE,
  COLUNAS_RECEITA,
  COLUNAS_UF,
} from "./tabelas";
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
 * Arquitetura da página (pedido do dono: arquivo curto):
 * `dados.ts` traz os JSONs tipados, `tabelas.ts` os descritores de coluna,
 * `TabelaOrdenavel.tsx` a tabela de agregado ordenável/filtrável, as `Secao*`
 * as seções e aqui só a composição. A tabela grande (1.823 linhas) não vem por
 * import: é fatiada em `dados/[arquivo]/route.ts` e carregada no navegador.
 *
 * Sumário (pedido do dono, 10/10/2026): `IndiceWiki` no topo (na tela toda) e
 * `MiniSumarioLateral` fixo à direita (topo-direita) para a página longa.
 */

/** Seções do sumário — os `id` casam com os `h2` de cada seção. */
const SECOES_GASTOS = [
  { id: "cartoes", titulo: "1. Os números da eleição, de relance" },
  { id: "entrou-saiu", titulo: "2. Como o dinheiro entrou e saiu" },
  { id: "cargos", titulo: "3. Quanto cada cargo gastou" },
  { id: "por-partido", titulo: "4. Análise por partido" },
  { id: "bigtech", titulo: "5. Big tech: Meta, Google, TikTok, X e Kwai" },
  { id: "meta-ads", titulo: "6. Biblioteca de Anúncios da Meta" },
  { id: "por-estado", titulo: "7. Análise por estado" },
  { id: "partidos", titulo: "8. Órgãos partidários" },
  { id: "fornecedores", titulo: "9. Maiores fornecedores" },
  { id: "candidaturas", titulo: "10. Candidatura por candidatura" },
  { id: "lacunas", titulo: "11. Lacunas e metodologia" },
];

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
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <MiniSumarioLateral itens={SECOES_GASTOS} />
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

      <IndiceWiki itens={SECOES_GASTOS} />

      <SecaoNumeros />

      <section aria-labelledby="entrou-saiu" className="space-y-4">
        <h2 id="entrou-saiu" className="font-display text-2xl font-bold">
          Como o dinheiro entrou e em que saiu
        </h2>
        <TabelaOrdenavel
          colunas={COLUNAS_RECEITA}
          linhas={meta.receitaPorFonte}
          campoChave="fonte"
          legenda={`Receita por origem, somando as ${formatarNumeroBR(meta.totais.candidaturas, 0)} candidaturas — a soma bate com o total de ${formatarMoedaBR(meta.totais.receita)}`}
        />
        <GraficoGrupos grupos={meta.grupos} />
        <TabelaOrdenavel
          colunas={COLUNAS_NATUREZA}
          linhas={topNaturezas}
          campoChave="cd"
          legenda={`As ${topNaturezas.length} maiores naturezas de despesa de ${naturezasComValor.length} com valor registrado — ordene por qualquer coluna`}
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
        <TabelaOrdenavel
          colunas={COLUNAS_CARGO}
          linhas={meta.porCargo}
          campoChave="cargo"
          legenda="Por cargo, no país inteiro — o custo por voto é a mediana entre os eleitos: metade gastou menos, metade mais"
        />
        <p className="text-xs opacity-70">
          Presidente não tem custo mediano: nenhum foi eleito no 1º turno, e o par a 25/10 ainda
          não tem despesa definitiva. Custo por voto da linha = despesa paga ÷ votos nominais.
        </p>
        <TabelaOrdenavel
          colunas={COLUNAS_UF}
          linhas={meta.porUf}
          campoChave="uf"
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
        <TabelaOrdenavel
          colunas={COLUNAS_PARTIDO_ANALISE}
          linhas={porPartido}
          campoChave="partido"
          legenda="Por partido, no país inteiro — ordene por qualquer coluna (gastos, votos, big tech)"
        />
      </section>

      <SecaoBigTech />

      <SecaoMetaAds />

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
        <TabelaOrdenavel
          colunas={COLUNAS_PARTIDO}
          linhas={partidos}
          campoChave="partido"
          legenda={`Os ${partidos.length} partidos com movimentação declarada — a prestação própria dos órgãos partidários, NÃO é a soma dos candidatos da análise por partido (universos diferentes, não somáveis entre si)`}
        />
      </section>

      <section aria-labelledby="fornecedores" className="space-y-4">
        <h2 id="fornecedores" className="font-display text-2xl font-bold">
          Quem recebeu: os maiores fornecedores de campanha
        </h2>
        <TabelaOrdenavel
          colunas={COLUNAS_FORNECEDOR}
          linhas={fornecedores}
          campoChave="nome"
          legenda="Top 40 por valor contratado, com o CNPJ que a campanha declarou — ordene e baixe o CSV do que está na tela"
          nomeArquivo="gastos-2026-fornecedores"
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

      <SecaoLacunas />
    </main>
  );
}
