import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import {
  contarLicenciamento,
  contarLicenciamentoPorAno,
  listarMunicipiosComLicenciamento,
} from "@/lib/db/queries/ambiental-licenciamento";
import BuscaMunicipioLicenciamento from "./BuscaMunicipioLicenciamento";
import RankingComOrdenacao from "./RankingComOrdenacao";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/licenciamento", {
  title: "Licenciamento ambiental — Controle Popular · Ambiental",
  description:
    "Todo empreendimento com licença ambiental deferida em Minas Gerais, por município, setor, modalidade e classe — do censo público da Semad (IDE-Sisema).",
});

/**
 * `/ambiental/licenciamento` — a F4 do plano de execução. Método de coleta
 * e as armadilhas medidas (dígito verificador do documento, `link`
 * duplicado na fonte, CPF colado no nome, setor sempre por `cod_atvpri`)
 * estão em `etl/betim/etl/apis/ambiental_licenciamento.py` e na migration
 * `0063_ambiental_licenciamento.sql` — esta página só lê o resultado.
 *
 * Estadual, com `/municipio/[idIbge]`, mesmo padrão estrutural de
 * `/ambiental/copam`: o filtro por setor/modalidade/classe mora DENTRO da
 * página de cada município (o volume por cidade — no máximo ~650 — cabe
 * inteiro no cliente sem o índice fatiado que `congresso/proposicoes`
 * precisa para 5.562 linhas/16 MiB); aqui, o filtro por MUNICÍPIO é a
 * busca abaixo.
 *
 * ═══ AS CINCO COISAS (regra do dono, 2026-08-21, `AGENTS.md`) ═══
 *
 * Cartões de topo (agregados de `contagem` + a lacuna de data), dois
 * gráficos (por setor e por ano, `BarrasValor` — CSS puro, sem lib nova),
 * ordenação por coluna nos dois gráficos (`RankingComOrdenacao`: ordem
 * oficial vs. maior quantidade) e no buscador de município (nome vs.
 * total), filtro real (nome do município, já existia) e CSV do que está
 * filtrado na tela — tudo em `BuscaMunicipioLicenciamento.tsx`.
 */
const SETOR_ORDEM = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default async function LicenciamentoIndex() {
  const [contagem, municipios, porAnoData] = await Promise.all([
    contarLicenciamento(),
    listarMunicipiosComLicenciamento(),
    contarLicenciamentoPorAno(),
  ]);

  const porSetor = [...contagem.porSetor].sort(
    (a, b) => SETOR_ORDEM.indexOf(a.letra) - SETOR_ORDEM.indexOf(b.letra)
  );

  const setorRanking = porSetor.map((s) => ({
    chave: s.letra,
    rotulo: `${s.letra} — ${s.rotulo}`,
    total: s.total,
  }));
  const classeRanking = contagem.porClasse.map((c) => ({
    chave: String(c.classe ?? "sem-classe"),
    rotulo: c.classe !== null ? `Classe ${c.classe}` : "Classe não informada pela fonte",
    total: c.total,
  }));
  const setorTop = [...contagem.porSetor].sort((a, b) => b.total - a.total)[0];
  const modalidadeTop = contagem.porModalidade[0];

  const anoItens = porAnoData.porAno.map((a) => ({
    label: String(a.ano),
    valor: a.total,
    titulo: `${a.ano}: ${formatNumberBR(a.total)} licenças emitidas`,
  }));
  if (porAnoData.semDataEmissao > 0) {
    anoItens.push({
      label: "Sem data de emissão na fonte",
      valor: porAnoData.semDataEmissao,
      titulo: `Sem data de emissão na fonte: ${formatNumberBR(porAnoData.semDataEmissao)} licenças`,
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual · Licenciamento
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Toda licença ambiental deferida em Minas Gerais
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          A Semad decide qual empreendimento pode se instalar e sob que condições — mineração,
          indústria, agropecuária, energia, saneamento. Aqui está o censo completo do que já foi
          deferido, por município, setor oficial, modalidade e classe de risco.
        </p>

        {contagem.total === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.95em] opacity-80">
            Nenhuma licença coletada ainda. O coletor
            (<code className="font-mono text-[.85em]">etl.apis.ambiental_licenciamento</code>)
            ainda não rodou contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(contagem.total)}</strong> licenças
            deferidas coletadas, em{" "}
            <strong className="font-tabular">{formatNumberBR(municipios.length)}</strong>{" "}
            municípios de Minas Gerais. É o registro do que já foi decidido — não a fila em
            análise, que a fonte publica em outro sistema (o método está no rodapé desta página).
          </p>
        )}
      </header>

      {contagem.total > 0 ? (
        <>
          {/* ═══ CARTÕES DE TOPO ═══ */}
          <section aria-labelledby="numeros-licenciamento" className="mt-10">
            <h2 id="numeros-licenciamento" className="sr-only">
              O censo em números
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[var(--cp-border)] px-4 py-4">
                <p className="text-[.78em] font-medium uppercase tracking-wide opacity-70">
                  Licenças deferidas
                </p>
                <p className="mt-1 font-display text-2xl font-bold">
                  {formatNumberBR(contagem.total)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--cp-border)] px-4 py-4">
                <p className="text-[.78em] font-medium uppercase tracking-wide opacity-70">
                  Municípios alcançados
                </p>
                <p className="mt-1 font-display text-2xl font-bold">
                  {formatNumberBR(municipios.length)}
                </p>
                <p className="mt-1 text-[.8em] opacity-70">de 853 em Minas Gerais</p>
              </div>
              {setorTop ? (
                <div className="rounded-xl border border-[var(--cp-border)] px-4 py-4">
                  <p className="text-[.78em] font-medium uppercase tracking-wide opacity-70">
                    Setor com mais licenças
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {formatNumberBR(setorTop.total)}
                  </p>
                  <p className="mt-1 text-[.8em] opacity-70">
                    {setorTop.letra} — {setorTop.rotulo}
                  </p>
                </div>
              ) : null}
              <div className="rounded-xl border border-[var(--cp-border)] px-4 py-4">
                <p className="text-[.78em] font-medium uppercase tracking-wide opacity-70">
                  Sem data de emissão na fonte
                </p>
                <p className="mt-1 font-display text-2xl font-bold">
                  {formatNumberBR(porAnoData.semDataEmissao)}
                </p>
                <p className="mt-1 text-[.8em] opacity-70">
                  {((porAnoData.semDataEmissao / contagem.total) * 100).toFixed(1).replace(".", ",")}%
                  do total — ficam fora do gráfico por ano
                </p>
              </div>
            </div>
          </section>

          {/* ═══ GRÁFICO — por ano de emissão ═══ */}
          <section aria-labelledby="por-ano-licenciamento" className="mt-10">
            <h2 id="por-ano-licenciamento" className="font-display text-xl font-semibold">
              Por ano de emissão
            </h2>
            <p className="mt-1 max-w-2xl text-sm opacity-75">
              Quando cada licença foi emitida — não quando o empreendimento entrou em operação.
              {porAnoData.semDataEmissao > 0
                ? ` A fonte não registra data de emissão para ${formatNumberBR(porAnoData.semDataEmissao)} licenças; elas aparecem como barra própria, não somadas a nenhum ano.`
                : ""}
            </p>
            <div className="mt-4">
              {anoItens.length > 0 ? (
                <BarrasValor itens={anoItens} formatValor={(v) => `${formatNumberBR(v)}`} />
              ) : (
                <p className="text-sm opacity-70">Nenhuma licença com data de emissão registrada.</p>
              )}
            </div>
          </section>

          {/* ═══ GRÁFICO — por setor oficial (com ordenação) ═══ */}
          <section aria-labelledby="por-setor-licenciamento" className="mt-10">
            <h2 id="por-setor-licenciamento" className="font-display text-xl font-semibold">
              Por setor oficial
            </h2>
            <p className="mt-1 max-w-2xl text-sm opacity-75">
              A letra e o rótulo vêm da Deliberação Normativa Copam 217/2017 — o setor de cada
              licença, não uma classificação nossa.
            </p>
            <div className="mt-4">
              <RankingComOrdenacao
                itens={setorRanking}
                rotuloOrdemNatural="Ordem oficial (A–H)"
                rotuloUnidade="licenças"
              />
            </div>
          </section>

          {/* ═══ POR MODALIDADE E POR CLASSE ═══ */}
          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Por modalidade</h2>
              {modalidadeTop ? (
                <p className="mt-1 text-sm opacity-75">
                  A mais comum é {modalidadeTop.modalidade.toLowerCase()}, com{" "}
                  {formatNumberBR(modalidadeTop.total)} licenças.
                </p>
              ) : null}
              <ul className="mt-3 space-y-1.5 text-sm">
                {contagem.porModalidade.map((m) => (
                  <li key={m.modalidade} className="flex items-center justify-between gap-3">
                    <span className="opacity-85">{m.modalidade}</span>
                    <span className="font-tabular text-xs opacity-70">
                      {formatNumberBR(m.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Por classe</h2>
              <p className="mt-1 text-sm opacity-75">
                Classe de risco do empreendimento — quanto maior, mais rigoroso o licenciamento.
              </p>
              <div className="mt-3">
                <RankingComOrdenacao
                  itens={classeRanking}
                  rotuloOrdemNatural="Classe (crescente)"
                  rotuloUnidade="licenças"
                />
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold">Ver licenças por município</h2>
            <p className="mt-1 text-sm opacity-75">
              {formatNumberBR(municipios.length)} municípios de Minas Gerais têm pelo menos uma
              licença ambiental deferida coletada. Dentro de cada município dá para filtrar por
              setor, modalidade e classe.
            </p>
            <div className="mt-4">
              <BuscaMunicipioLicenciamento municipios={municipios} />
            </div>
          </section>
        </>
      ) : null}

      <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado, e o que ele não prova</h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          Fonte: IDE-Sisema (Semad), o serviço de mapas públicos do estado — camada de
          empreendimentos licenciados, sem chave e sem login. É o registro do que já foi{" "}
          <strong>deferido</strong>: a fila ainda em análise vive em outro sistema da própria
          Semad, não coletado aqui.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Privacidade.</strong> Quando o titular é pessoa física, este portal não publica
          nome, documento nem coordenada — só que existe uma licença daquele setor, naquele
          município. Quando é pessoa jurídica, o CNPJ aparece com a raiz (as 8 primeiras posições)
          e o restante mascarado — a fonte já redige a maioria dos CNPJ dessa forma, e este portal
          aplica a mesma regra aos que a fonte publicou inteiros.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Este portal não afirma irregularidade.</strong> É a reprodução da licença como a
          Semad publica.
        </p>
      </section>
    </div>
  );
}
