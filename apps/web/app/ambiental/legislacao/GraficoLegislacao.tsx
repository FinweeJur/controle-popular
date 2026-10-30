import { formatNumberBR } from "@/lib/betim/format";
import type { LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";

/**
 * Gráficos "por ano" e "por órgão emissor" do painel de legislação.
 *
 * Extraído da página para reduzir `LegislacaoAmbientalIndex` (CodeScene).
 * A janela de 12 anos e o corte em 8 órgãos existem para o desenho caber na
 * tela; nada sai da contagem — o que fica fora vira nota de rodapé.
 */

const JANELA_ANOS = 12;
const TOP_ORGAOS = 8;

interface Serie {
  rotulo: string;
  total: number;
}

interface SeriesCalculadas {
  serieAnos: Array<{ ano: number; total: number }>;
  maxAnos: number;
  anoCorte: number | null;
  anoMaisRecente: number | null;
  normasAntesDoCorte: number;
  normasSemAno: number;
  serieOrgaos: Serie[];
  maxOrgaos: number;
  normasSemOrgao: number;
}

function contarPorAno(estaduais: readonly LegislacaoAmbientalRow[]) {
  const anos = estaduais.map((l) => l.ano).filter((a): a is number => a !== null);
  const anoMaisRecente = anos.length > 0 ? Math.max(...anos) : null;
  const anoCorte = anoMaisRecente !== null ? anoMaisRecente - JANELA_ANOS + 1 : null;
  const porAno = new Map<number, number>();
  let normasAntesDoCorte = 0;
  let normasSemAno = 0;
  for (const l of estaduais) {
    if (l.ano === null) {
      normasSemAno++;
      continue;
    }
    if (anoCorte !== null && l.ano < anoCorte) {
      normasAntesDoCorte++;
      continue;
    }
    porAno.set(l.ano, (porAno.get(l.ano) ?? 0) + 1);
  }
  return { porAno, anoCorte, anoMaisRecente, normasAntesDoCorte, normasSemAno };
}

function contarPorOrgao(estaduais: readonly LegislacaoAmbientalRow[]) {
  const porOrgao = new Map<string, number>();
  let normasSemOrgao = 0;
  for (const l of estaduais) {
    const chave = l.orgao?.trim();
    if (!chave) {
      normasSemOrgao++;
      continue;
    }
    porOrgao.set(chave, (porOrgao.get(chave) ?? 0) + 1);
  }
  const ordenados = [...porOrgao.entries()].sort((a, b) => b[1] - a[1]);
  const serieOrgaos: Serie[] = ordenados
    .slice(0, TOP_ORGAOS)
    .map(([rotulo, total]) => ({ rotulo, total }));
  const resto = ordenados.slice(TOP_ORGAOS);
  const outros = resto.reduce((t, [, n]) => t + n, 0);
  if (outros > 0) serieOrgaos.push({ rotulo: `Outros ${resto.length} órgãos`, total: outros });
  return { serieOrgaos, normasSemOrgao };
}

export function calcularSeries(estaduais: readonly LegislacaoAmbientalRow[]): SeriesCalculadas {
  const { porAno, anoCorte, anoMaisRecente, normasAntesDoCorte, normasSemAno } =
    contarPorAno(estaduais);
  const serieAnos =
    anoCorte !== null
      ? Array.from({ length: JANELA_ANOS }, (_, i) => anoCorte + i).map((ano) => ({
          ano,
          total: porAno.get(ano) ?? 0,
        }))
      : [];
  const { serieOrgaos, normasSemOrgao } = contarPorOrgao(estaduais);

  return {
    serieAnos,
    maxAnos: Math.max(1, ...serieAnos.map((a) => a.total)),
    anoCorte,
    anoMaisRecente,
    normasAntesDoCorte,
    normasSemAno,
    serieOrgaos,
    maxOrgaos: Math.max(1, ...serieOrgaos.map((o) => o.total)),
    normasSemOrgao,
  };
}

function Legenda({ children }: { children: React.ReactNode }) {
  return <span className="font-normal text-text-soft"> {children}</span>;
}

function Barras({
  itens,
  max,
  largura,
}: {
  itens: Serie[];
  max: number;
  largura: string;
}) {
  return (
    <div aria-hidden className="mt-3 space-y-1.5">
      {itens.map((item) => (
        <div key={item.rotulo} className="flex items-center gap-3">
          <span
            className={`${largura} shrink-0 truncate text-right font-tabular text-[.82em] font-semibold text-text`}
            title={item.rotulo}
          >
            {item.rotulo}
          </span>
          <div className="cp-ord-track h-3 flex-1 overflow-hidden">
            <div
              className="cp-ord-seg cp-ord-seg-1 h-full rounded-[3px]"
              style={{
                width: `${(item.total / max) * 100}%`,
                background: "var(--color-ord-1)",
              }}
              title={`${item.rotulo}: ${formatNumberBR(item.total)} normas`}
            />
          </div>
          <span className="w-12 shrink-0 font-tabular text-[.82em] text-text-soft">
            {formatNumberBR(item.total)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TabelaSerie({ titulo, rotuloColuna, itens }: { titulo: string; rotuloColuna: string; itens: Serie[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[.85em]">
        <caption className="mb-2 text-left text-[.82em] text-text-soft">{titulo}</caption>
        <thead>
          <tr className="border-b border-border text-left text-text">
            <th className="py-1.5 pr-3 font-medium">{rotuloColuna}</th>
            <th className="py-1.5 text-right font-medium">Normas</th>
          </tr>
        </thead>
        <tbody className="text-text-soft">
          {itens.map((item) => (
            <tr key={item.rotulo} className="border-b border-border/60">
              <td className="py-1.5 pr-3 font-medium text-text">{item.rotulo}</td>
              <td className="py-1.5 text-right tabular-nums">{formatNumberBR(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GraficoLegislacao({ estaduais }: { estaduais: readonly LegislacaoAmbientalRow[] }) {
  const s = calcularSeries(estaduais);
  const anos: Serie[] = s.serieAnos.map((a) => ({ rotulo: String(a.ano), total: a.total }));
  const mostraAnos = s.anoMaisRecente !== null;
  return (
    <section aria-labelledby="grafico-legislacao" className="mt-10">
      <h2 id="grafico-legislacao" className="font-display text-xl font-semibold">
        Por ano e por órgão emissor
      </h2>
      <p className="mt-2 max-w-2xl text-[.92em] text-text-soft">
        Cobre só as {formatNumberBR(estaduais.length)} normas (ALMG, Semad, Siam, MMA/Conama,
        CNDH) — legislação nacional/internacional curada e precedentes não têm ano nem órgão
        emissor na fonte, então não entram nestes dois gráficos.
      </p>

      {mostraAnos && (
        <figure className="mt-6">
          <figcaption className="text-[.85em] font-semibold text-text">
            Por ano, {s.anoCorte}–{s.anoMaisRecente}
            {s.normasAntesDoCorte > 0 || s.normasSemAno > 0 ? (
              <Legenda>
                ({formatNumberBR(s.normasAntesDoCorte)} anteriores a {s.anoCorte}
                {s.normasSemAno > 0 ? `, ${formatNumberBR(s.normasSemAno)} sem ano registrado` : ""} —
                fora da janela do desenho, dentro da contagem)
              </Legenda>
            ) : null}
          </figcaption>
          <div className="sr-only">
            Gráfico de barras horizontais, uma por ano de {s.anoCorte} a {s.anoMaisRecente},
            comprimento proporcional ao total de normas do ano.{" "}
            {s.serieAnos.map((a) => `${a.ano}: ${a.total} normas.`).join(" ")}
          </div>
          <Barras itens={anos} max={s.maxAnos} largura="w-12" />
        </figure>
      )}

      {s.serieOrgaos.length > 0 && (
        <figure className="mt-8">
          <figcaption className="text-[.85em] font-semibold text-text">
            Por órgão emissor
            {s.normasSemOrgao > 0 ? (
              <Legenda>
                ({formatNumberBR(s.normasSemOrgao)} sem órgão registrado na fonte — fora do
                desenho, dentro da contagem)
              </Legenda>
            ) : null}
          </figcaption>
          <div className="sr-only">
            Gráfico de barras horizontais, uma por órgão emissor, comprimento proporcional ao
            total de normas do órgão. {s.serieOrgaos.map((o) => `${o.rotulo}: ${o.total} normas.`).join(" ")}
          </div>
          <Barras itens={s.serieOrgaos} max={s.maxOrgaos} largura="w-40" />
        </figure>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <TabelaSerie titulo="Tabela — alternativa em texto ao gráfico &quot;por ano&quot;." rotuloColuna="Ano" itens={anos} />
        <TabelaSerie titulo="Tabela — alternativa em texto ao gráfico &quot;por órgão emissor&quot;." rotuloColuna="Órgão" itens={s.serieOrgaos} />
      </div>
    </section>
  );
}
