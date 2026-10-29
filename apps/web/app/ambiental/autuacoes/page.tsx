import type { Metadata } from "next";
import Link from "next/link";
import DataColeta from "@/app/components/DataColeta";
import FooterGlobal from "@/app/components/FooterGlobal";
import CartoesResumo from "@/app/components/CartoesResumo";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { formatNumberBR } from "@/lib/betim/format";
import {
  NOME_ORGAO,
  type ResumoAutosSemad,
  resumoAutosSemad,
} from "@/lib/ambiental/autos-semad";

/**
 * /ambiental/autuacoes — visão ESTADUAL dos autos de infração ambiental de MG.
 *
 * ⚠️ POR QUE ESTA PÁGINA EXISTE
 * O portal já mostrava os autos por município (CAP da SEMAD, rota municipal
 * `/meio-ambiente/autuacoes`). Faltava a leitura do estado inteiro: quanto o
 * Sisema autuou, por órgão, por situação e por ano. Esta tela publica o
 * agregado coletado do Painel de Indicadores do Sisema — sem titular e sem
 * somar recortes que não se somam.
 *
 * ⚠️ REGRAS EDITORIAIS DESTA TELA
 * 1. Número grande é AUTO, não multa: a fonte desta aba não traz valor pago.
 * 2. Toda contagem vem com a situação do processo ao lado — "Remissão" e
 *    "Em processamento" são coisas diferentes.
 * 3. O CAP municipal é outro recorte. As duas telas não se somam.
 *
 * A data de coleta vem do cabeçalho do JSON (`coletado_em`), não é digitada
 * à mão (AGENTS § 8, oitava qualidade).
 */

export const metadata: Metadata = {
  title: "Autos de infração ambiental em Minas Gerais — SEMAD e IEF | Controle Popular",
  description:
    "Quantos autos de infração ambiental foram lavrados em Minas Gerais, por órgão, situação do processo e ano — do painel público do Sisema. Sem nome de autuado e sem somar multa paga.",
};

const fmt = (n: number) => formatNumberBR(n);

function CartoesTopo({ resumo }: { resumo: ResumoAutosSemad }) {
  const porOrgao = (sigla: string) =>
    resumo.orgaos.find((o) => o.rotulo === sigla)?.total ?? 0;

  return (
    <section className="mb-10 mt-6">
      <CartoesResumo
        colunas={4}
        itens={[
          {
            rotulo: "Autos de infração",
            valor: fmt(resumo.total),
            detalhe: "Ato lavrado — não é multa paga",
          },
          {
            rotulo: "SEMAD",
            valor: fmt(porOrgao("SEMAD")),
            detalhe: "Secretaria de Estado de Meio Ambiente",
          },
          {
            rotulo: "IEF",
            valor: fmt(porOrgao("IEF")),
            detalhe: "Instituto Estadual de Florestas",
          },
          {
            rotulo: "Municípios com auto",
            valor: fmt(resumo.municipiosDistintos),
            detalhe: "No recorte do painel do Sisema",
          },
        ]}
      />
    </section>
  );
}

function GraficosResumo({ resumo }: { resumo: ResumoAutosSemad }) {
  const situacoes = resumo.situacoes.map((item) => ({
    rotulo: item.rotulo,
    valor: item.total,
  }));
  const municipios = resumo.topMunicipios.map((item) => ({
    rotulo: item.municipio,
    valor: item.total,
  }));

  return (
    <section className="mb-12 grid gap-8 rounded-2xl border border-border bg-surface p-6 lg:grid-cols-2">
      <GraficoBarrasSvg
        itens={situacoes}
        titulo="Situação do auto"
        subtitulo="Onde o processo parou — remissão, quitação, dívida ativa ou julgamento"
        descricaoAcessivel={`Distribuição dos ${fmt(resumo.total)} autos por situação do processo.`}
        orientacao="horizontal"
      />
      <GraficoBarrasSvg
        itens={municipios}
        titulo="Municípios com mais autos"
        subtitulo="Os 12 primeiros do painel — não é ranking de gravidade"
        descricaoAcessivel="Os doze municípios com mais autos de infração no painel do Sisema."
        orientacao="horizontal"
      />
    </section>
  );
}

function SeriePorAno({ resumo }: { resumo: ResumoAutosSemad }) {
  return (
    <section aria-label="Série por ano" className="mb-12">
      <h2 className="mb-1 font-display text-xl font-semibold text-text">
        Autos por ano de lavratura
      </h2>
      <p className="mb-4 max-w-3xl text-sm text-text-soft">
        Da década de 1990 até a coleta. Os dois grupos fora da série são declarados
        separados: {fmt(resumo.semData)} autos sem data e {fmt(resumo.foraDeFaixa)}{" "}
        com data implausível na origem.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <caption className="sr-only">
            Quantidade de autos de infração por ano de lavratura
          </caption>
          <thead>
            <tr className="bg-surface-2 text-left">
              <th scope="col" className="px-4 py-2 font-semibold text-text">
                Ano
              </th>
              <th scope="col" className="px-4 py-2 text-right font-semibold text-text">
                Autos
              </th>
            </tr>
          </thead>
          <tbody>
            {[...resumo.anos].reverse().map((item) => (
              <tr key={item.ano} className="border-t border-border">
                <td className="px-4 py-2 tabular-nums text-text">{item.ano}</td>
                <td className="px-4 py-2 text-right tabular-nums text-text">
                  {fmt(item.total)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-surface-2">
              <td className="px-4 py-2 text-text-soft">Sem data</td>
              <td className="px-4 py-2 text-right tabular-nums text-text-soft">
                {fmt(resumo.semData)}
              </td>
            </tr>
            <tr className="border-t border-border bg-surface-2">
              <td className="px-4 py-2 text-text-soft">Data fora de faixa</td>
              <td className="px-4 py-2 text-right tabular-nums text-text-soft">
                {fmt(resumo.foraDeFaixa)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        O painel tem 2 autos datados de 2027, ano futuro na data da coleta —
        provável erro de digitação na origem. Eles aparecem na série, sem correção
        inventada aqui.
      </p>
    </section>
  );
}

function Ressalvas({ resumo }: { resumo: ResumoAutosSemad }) {
  const orgaos = resumo.orgaos
    .filter((o) => o.rotulo in NOME_ORGAO)
    .map((o) => `${o.rotulo} (${NOME_ORGAO[o.rotulo]})`)
    .join(" e ");

  return (
    <div className="mb-8 space-y-3 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
      <p>
        <strong className="text-text">Sem titular.</strong> O portal publica o ato,
        nunca a pessoa: a entidade coletada não traz nome, CPF/CNPJ nem RG (AGENTS
        § 5.2).
      </p>
      <p>
        <strong className="text-text">Órgãos.</strong> O painel distingue {orgaos}.
        Um único registro está sem órgão informado.
      </p>
      <p>
        <strong className="text-text">Recorte diferente do CAP.</strong> O detalhe
        por município do portal usa o CAP da SEMAD. Esta página usa o painel do
        Sisema. São sistemas diferentes da mesma fiscalização estadual: os totais
        não devem ser somados.
      </p>
      <p>
        <strong className="text-text">Fonte e coleta.</strong> {resumo.fonte}. O dado
        é do painel público, sem login; o formato DSR do Power BI não é documentado
        e a coleta falha de propósito se ele mudar. Coletor:{" "}
        <code className="text-xs">etl/betim/etl/apis/sisema_autos_infracao.py</code>.
      </p>
    </div>
  );
}

export default function AutosSemadPage() {
  const resumo = resumoAutosSemad(12);

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16"
    >
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ›{" "}
        <Link href="/ambiental" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        › <span className="text-text">Autos de infração</span>
      </nav>

      <header className="mb-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Ambiental › Estadual › Fiscalização
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Autos de infração ambiental em Minas Gerais
        </h1>
        <p className="max-w-3xl text-base text-text-soft">
          Quantos autos a fiscalização estadual lavrou, de qual órgão, em que situação
          e em que ano.{" "}
          <strong className="text-text">
            Auto lavrado não é dano ambiental provado nem multa paga
          </strong>{" "}
          — o processo pode ser anulado no julgamento. Por isso cada número vem com a
          situação ao lado.
        </p>
      </header>

      <DataColeta
        coletadoEm={resumo.coletadoEm}
        fonte="Painel de Indicadores do Sisema (Power BI público) — aba Autos de Infração"
        competencia="atualização mensal declarada pela fonte"
      />

      <CartoesTopo resumo={resumo} />
      <GraficosResumo resumo={resumo} />
      <SeriePorAno resumo={resumo} />
      <Ressalvas resumo={resumo} />

      <footer className="border-t border-border pt-8 text-sm text-text-soft">
        <p>
          Fonte: <strong>Sisema/SEMAD-MG</strong> — Painel de Indicadores do Sisema,
          aba Autos de Infração. Dado público, sem login.
        </p>
        <div className="mt-6">
          <MeioAmbienteRelacionado />
          <FooterGlobal />
        </div>
      </footer>
    </main>
  );
}
