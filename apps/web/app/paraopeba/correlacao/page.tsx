import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { metadataEditavel } from "@/lib/edicoes";
import {
  detectarMovimentosSignificativos,
  correlacionarComNoticias,
  DEFAULT_CONFIG,
} from "@/lib/correlacao/detectar";
import type { Cotacao, Noticia, MovimentoSignificativo } from "@/lib/correlacao/detectar";
import vale3Data from "@/data/vale3-cotacoes.json";
import noticiasValeData from "@/data/noticias-vale.json";
import sgmlData from "@/data/sgml-cotacoes.json";

export const metadata: Metadata = metadataEditavel("/paraopeba/correlacao", {
  title: "Precos x Noticias \u2014 Paraopeba | Controle Popular",
  description:
    "Correlacao entre movimentos significativos de preco de VALE3 (B3) e SGML (NASDAQ) com noticias publicas sobre a Vale e o setor minerario.",
});

const vale3Cotacoes = vale3Data.cotacoes as Cotacao[];
const noticiasVale = noticiasValeData.noticias as Noticia[];
const sgmlCotacoes = sgmlData.cotacoes as Cotacao[];

const vale3Movimentos = correlacionarComNoticias(
  detectarMovimentosSignificativos(vale3Cotacoes),
  noticiasVale,
  vale3Cotacoes,
);
const sgmlMovimentos = correlacionarComNoticias(
  detectarMovimentosSignificativos(sgmlCotacoes),
  noticiasVale,
  sgmlCotacoes,
);

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}

function precoBR(valor: number): string {
  return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function varBR(valor: number): string {
  const sinal = valor > 0 ? "+" : "";
  return sinal + valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
}

export default function CorrelacaoPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        {"\u00B7"} <span className="text-text">Correlacao</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Precos x Noticias
      </h1>

      <div className="mt-6 rounded-xl border border-alert/40 bg-alert/10 p-4 text-sm text-muted">
        Correlacao nao implica causalidade. Movimentos de mercado sao influenciados por multiplos
        fatores. Dados de mercado: B3 COTAHIST (VALE3), Yahoo Finance (SGML). Noticias: feeds
        publicos.
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">VALE3 {"\u2014"} B3</h2>
        <p className="mt-2 max-w-3xl text-[.92em] text-text-soft">
          Movimentos com variacao absoluta {"\u2265"} {DEFAULT_CONFIG.limiarVariacao}%, com janela de{" "}
          {"\u00B1"}{DEFAULT_CONFIG.janelaDias} dias para correlacao com noticias.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">Movimentos detectados</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">{vale3Movimentos.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">Limiar de variacao</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              {DEFAULT_CONFIG.limiarVariacao}%
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">Janela de correlacao</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              {"\u00B1"}{DEFAULT_CONFIG.janelaDias} dias
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-[.9em]">
            <thead className="text-text-soft">
              <tr className="border-b border-border">
                <th scope="col" className="py-1.5 pr-3 font-medium">
                  Data
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Fechamento
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Variacao
                </th>
                <th scope="col" className="py-1.5 text-left font-medium">
                  Noticias
                </th>
              </tr>
            </thead>
            <tbody>
              {vale3Movimentos.map((mov) => (
                <tr key={mov.data} className="border-b border-border/50">
                  <td className="py-1.5 pr-3 font-tabular">{formatDateBR(mov.data)}</td>
                  <td className="py-1.5 pr-3 text-right font-tabular">{precoBR(mov.fechamento)}</td>
                  <td className="py-1.5 pr-3 text-right font-tabular">{varBR(mov.variacao)}</td>
                  <td className="py-1.5 text-left">
                    {mov.noticias.length > 0 ? (
                      <details>
                        <summary className="cursor-pointer text-[.85em] text-accent hover:underline">
                          {mov.noticias.length} noticia{mov.noticias.length > 1 ? "s" : ""}
                        </summary>
                        <ul className="mt-1 flex flex-col gap-1">
                          {mov.noticias.map((n) => (
                            <li key={n.link} className="text-[.82em] text-text-soft">
                              <a
                                href={n.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-accent"
                              >
                                {n.titulo}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <span className="text-text-soft">{"\u2014"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">SGML {"\u2014"} NASDAQ</h2>
        <p className="mt-2 max-w-3xl text-[.92em] text-text-soft">
          Movimentos com variacao absoluta {"\u2265"} {DEFAULT_CONFIG.limiarVariacao}%, com janela de{" "}
          {"\u00B1"}{DEFAULT_CONFIG.janelaDias} dias para correlacao com noticias.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">Movimentos detectados</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">{sgmlMovimentos.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">Limiar de variacao</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              {DEFAULT_CONFIG.limiarVariacao}%
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">Janela de correlacao</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">
              {"\u00B1"}{DEFAULT_CONFIG.janelaDias} dias
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-[.9em]">
            <thead className="text-text-soft">
              <tr className="border-b border-border">
                <th scope="col" className="py-1.5 pr-3 font-medium">
                  Data
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Fechamento
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Variacao
                </th>
                <th scope="col" className="py-1.5 text-left font-medium">
                  Noticias
                </th>
              </tr>
            </thead>
            <tbody>
              {sgmlMovimentos.map((mov) => (
                <tr key={mov.data} className="border-b border-border/50">
                  <td className="py-1.5 pr-3 font-tabular">{formatDateBR(mov.data)}</td>
                  <td className="py-1.5 pr-3 text-right font-tabular">{precoBR(mov.fechamento)}</td>
                  <td className="py-1.5 pr-3 text-right font-tabular">{varBR(mov.variacao)}</td>
                  <td className="py-1.5 text-left">
                    {mov.noticias.length > 0 ? (
                      <details>
                        <summary className="cursor-pointer text-[.85em] text-accent hover:underline">
                          {mov.noticias.length} noticia{mov.noticias.length > 1 ? "s" : ""}
                        </summary>
                        <ul className="mt-1 flex flex-col gap-1">
                          {mov.noticias.map((n) => (
                            <li key={n.link} className="text-[.82em] text-text-soft">
                              <a
                                href={n.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-accent"
                              >
                                {n.titulo}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <span className="text-text-soft">{"\u2014"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Metodologia</h2>
        <p className="mt-2 max-w-3xl text-[.93em] text-text-soft">
          A variacao diaria de cada ativo e calculada pela formula{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">
            {"((fechamento[i] \u2212 fechamento[i\u22121]) / fechamento[i\u22121]) \u00D7 100"}
          </code>
          . Movimentos com variacao absoluta igual ou superior a {DEFAULT_CONFIG.limiarVariacao}%
          sao classificados como significativos. Para cada movimento significativo, uma janela de{" "}
          {"\u00B1"}{DEFAULT_CONFIG.janelaDias} dias de negociacao e aberta ao redor da data, e noticias
          publicas cuja data de publicacao cai nessa janela sao listadas como correlacionadas.
        </p>
        <p className="mt-3 max-w-3xl text-[.93em] text-text-soft">
          A correlacao e estritamente temporal: uma noticia caindo na janela nao significa que
          causou o movimento. Multiplos fatores {"\u2014"} macroeconomia, commodities, cambio, fluxo
          institucional {"\u2014"} interagem simultaneamente. Esta pagina apresenta co-ocorrencias, nao
          causalidade.
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Procedencia dos dados</h2>
        <p className="mt-2 max-w-3xl text-[.93em] text-text-soft">
          Cotacoes de VALE3:{" "}
          <a
            href="https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            B3 {"\u2014"} Series Historicas (COTAHIST) {"\u2197"}
          </a>
          , coletadas pelo script{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
            scripts/coletar-vale3-cotacoes.mts
          </code>
          . Cotacoes de SGML: Yahoo Finance. Noticias: Google News RSS, Agencia Brasil, Radar
          Mineracao e G1 MG, coletadas por feeds publicos.
        </p>
        <p className="mt-3 max-w-3xl text-[.93em] text-text-soft">
          Todos os dados sao brutos de pregao (sem ajuste por proventos para VALE3) ou precos de
          fechamento em USD (SGML). Nenhum numero desta pagina foi digitado a mao.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}