import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { SERIE_JN_TJMG, JN_META, type AnoJusticaEmNumeros } from "@/lib/judiciario/justica-em-numeros";
import TabelaSerieJN from "./TabelaSerieJN";

/**
 * `/judiciario/numeros` — quanto tempo demora um processo no TJMG, segundo
 * o Justiça em Números do CNJ (2009–2025).
 *
 * ═══ A CORREÇÃO QUE ESTA PÁGINA REGISTRA ═══
 *
 * Este projeto afirmou antes que tempo médio de tramitação por tribunal
 * estadual NÃO EXISTIA em dado aberto. Estava errado: a variável existe
 * (`tpbaixm`, populada de 2015 a 2025 para o TJMG) — a busca anterior
 * falhou porque o dicionário do CNJ rotula a coluna só como
 * "TpBaix - Média", sem as palavras "tempo" nem "tramitação". Ver o
 * cabeçalho de `lib/judiciario/justica-em-numeros.ts` para o detalhe.
 * Registrar o próprio erro na tela é regra da casa, não humildade
 * decorativa — por isso a seção de declaração abaixo abre com ele, não o
 * esconde numa nota de rodapé.
 *
 * ═══ A UNIDADE DO TEMPO NÃO ESTÁ DECLARADA ═══
 *
 * O dicionário do CNJ não diz se `tpbaixm` é dia, mês ou outra unidade.
 * 675,5 (2025) é compatível com dias corridos, mas isso é INFERÊNCIA deste
 * projeto — nunca escrito como "675 dias" isolado do aviso, sempre na
 * mesma frase.
 *
 * ═══ POR QUE NÃO HÁ GRÁFICO CONTÍNUO 2009–2025 PARA O TEMPO ═══
 *
 * `tempoAteBaixa` vem `null` de 2009 a 2014. Uma linha contínua sobre esse
 * buraco mentiria; por isso as barras da série de tempo só desenham
 * 2015–2025, e os seis anos sem dado aparecem como texto, não como barra
 * de altura zero (zero também mentiria — pareceria "TJMG resolvia na
 * hora").
 */

export const metadata: Metadata = metadataEditavel("/judiciario/numeros", {
  title: "Quanto tempo demora um processo no TJMG — Controle Popular · Judiciário",
  description:
    "Série 2009–2025 do TJMG no Justiça em Números do CNJ: congestionamento, acervo pendente, casos novos por magistrado e tempo até a baixa (unidade não confirmada pelo CNJ). Inclui correção pública: este projeto já afirmou, errado, que esse dado não existia.",
});

const ULTIMO = SERIE_JN_TJMG[SERIE_JN_TJMG.length - 1];
const PRIMEIRO = SERIE_JN_TJMG[0];

function fmtData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function fmt1(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtPct(v: number): string {
  return `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** Quantos "em cada 10" — a tradução que a regra editorial pede em vez da fração crua. */
const CONGEST_EM_10 = Math.round(ULTIMO.congestionamento! * 10);

/** true só se 2025 for de fato o extremo da série — nunca afirmado sem checar. */
function ehMaximo(campo: keyof AnoJusticaEmNumeros): boolean {
  const valores = SERIE_JN_TJMG.map((a) => a[campo] as number | null).filter(
    (v): v is number => v !== null,
  );
  return (ULTIMO[campo] as number | null) === Math.max(...valores);
}
function ehMinimo(campo: keyof AnoJusticaEmNumeros): boolean {
  const valores = SERIE_JN_TJMG.map((a) => a[campo] as number | null).filter(
    (v): v is number => v !== null,
  );
  return (ULTIMO[campo] as number | null) === Math.min(...valores);
}

const PENDENTES_E_PICO = ehMaximo("pendentes");
const TEMPO_E_MINIMO_DESDE_2015 = ehMinimo("tempoAteBaixa");

const ANOS_SEM_TEMPO = SERIE_JN_TJMG.filter((a) => a.tempoAteBaixa === null).map((a) => a.ano);
const ANOS_COM_TEMPO = SERIE_JN_TJMG.filter((a) => a.tempoAteBaixa !== null);
const MAX_TEMPO = Math.max(...ANOS_COM_TEMPO.map((a) => a.tempoAteBaixa!));
const MAX_CONGEST = Math.max(...SERIE_JN_TJMG.map((a) => a.congestionamento!));

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="font-display text-[1.9em] leading-none font-bold text-text tabular-nums">
        {valor}
      </p>
      <p className="mt-2 text-[.92em] font-semibold text-text">{rotulo}</p>
      {nota && <p className="mt-1 text-[.82em] leading-relaxed text-text-soft">{nota}</p>}
    </div>
  );
}

export default function NumerosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/judiciario" className="hover:text-primary">
          Judiciário
        </a>{" "}
        · <span className="text-text">Justiça em Números</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Judiciário · Desempenho
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Quanto tempo demora um processo no TJMG
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          O CNJ mede, todo ano, quanto do que cada tribunal tinha para resolver ficou parado. Em
          2025, de cada <strong className="text-text">10 processos</strong> que o TJMG tinha para
          resolver, <strong className="text-text">{CONGEST_EM_10} continuaram parados</strong> no
          fim do ano — a taxa de congestionamento oficial é{" "}
          <span className="tabular-nums">{fmtPct(ULTIMO.congestionamento!)}</span>. Esta página
          traz a série de {PRIMEIRO.ano} a {ULTIMO.ano} inteira, com o que o CNJ mede e com o que
          ele não diz.
        </p>
      </header>

      {/* ═══ CARTÕES: o ano mais recente ═══ */}
      <section aria-label={`Números de ${ULTIMO.ano}`} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={`${CONGEST_EM_10} em 10`}
          rotulo={`processos que continuaram parados até o fim de ${ULTIMO.ano}`}
          nota={`taxa de congestionamento oficial: ${fmtPct(ULTIMO.congestionamento!)}`}
        />
        <Cartao
          valor={formatNumberBR(ULTIMO.pendentes!)}
          rotulo={`processos pendentes no TJMG em ${ULTIMO.ano}`}
          nota={
            PENDENTES_E_PICO
              ? `o maior acervo pendente de toda a série ${PRIMEIRO.ano}–${ULTIMO.ano}`
              : `acervo que aguardava solução no fim do ano`
          }
        />
        <Cartao
          valor={formatNumberBR(Math.round(ULTIMO.casosNovosPorMagistrado!))}
          rotulo={`casos novos por magistrado em ${ULTIMO.ano}`}
          nota="quantos processos novos, em média, cada juiz do TJMG recebeu no ano, além do que já tinha"
        />
        <Cartao
          valor={fmt1(ULTIMO.tempoAteBaixa!)}
          rotulo={`tempo médio até a baixa em ${ULTIMO.ano} — unidade não confirmada`}
          nota={
            TEMPO_E_MINIMO_DESDE_2015
              ? "o menor valor desde que o CNJ passou a publicar essa variável (2015); compatível com dias, mas isso é inferência deste projeto"
              : "compatível com dias corridos entre distribuição e baixa, mas isso é inferência deste projeto, não dado explícito do CNJ"
          }
        />
      </section>

      {/* ═══ DECLARAÇÃO ═══ */}
      <section
        aria-labelledby="declaracao-numeros"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-numeros" className="font-display text-base font-semibold text-text">
          De quem é este dado, o erro que corrigimos e o que falta
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">Este projeto errou, em público, sobre este mesmo dado.</strong>{" "}
            Uma versão anterior afirmou que tempo médio de tramitação por tribunal estadual não
            existia em dado aberto. Não é verdade: a variável existe no Justiça em Números
            (rotulada <code className="rounded bg-surface px-1 py-0.5 text-[.9em]">tpbaixm</code>,
            &ldquo;TpBaix - Média&rdquo;), populada de 2015 a {ULTIMO.ano} para o TJMG. A busca
            anterior falhou porque o dicionário do CNJ não usa as palavras &ldquo;tempo&rdquo; nem
            &ldquo;tramitação&rdquo; no rótulo da coluna — só o achou quem soubesse procurar pelo
            padrão <code className="rounded bg-surface px-1 py-0.5 text-[.9em]">Tp*</code>. O
            registro fica aqui porque quem leu a afirmação errada tem direito de saber que ela
            mudou.
          </li>
          <li>
            <strong className="text-text">A unidade do tempo não está declarada pelo CNJ.</strong>{" "}
            O dicionário rotula a coluna só como &ldquo;TpBaix - Média&rdquo; e não diz se é dia,
            mês ou outra unidade. O valor de {ULTIMO.ano} ({fmt1(ULTIMO.tempoAteBaixa!)}) é
            compatível com dias corridos entre a distribuição e a baixa do processo — mas essa
            leitura é inferência deste projeto, não algo que o CNJ escreveu. Por isso nenhum número
            desta página aparece como &ldquo;675 dias&rdquo;: sempre com o valor cru e o aviso na
            mesma frase.
          </li>
          <li>
            <strong className="text-text">
              O tempo até a baixa só existe de 2015 em diante.
            </strong>{" "}
            De {PRIMEIRO.ano} a 2014 a coluna vem vazia — o CNJ não publicou essa variável para
            esses anos. Os gráficos abaixo desenham barra só onde há dado; os seis anos sem dado (
            {ANOS_SEM_TEMPO.join(", ")}) aparecem como texto, nunca como barra de altura zero, que
            sugeriria tramitação instantânea.
          </li>
          <li>
            <strong className="text-text">
              O link abaixo aponta para a página de índice, não para o arquivo.
            </strong>{" "}
            A URL do ZIP de dados muda a cada publicação do CNJ (o nome do arquivo carrega a data).
            Um link fixo para o ZIP quebra na próxima atualização, e quebra em silêncio — por isso
            todo link desta página vai para a página de índice do Justiça em Números, de onde o
            arquivo vigente sempre se baixa.{" "}
            <a
              href={JN_META.urlIndice}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              Página de índice do Justiça em Números (CNJ) ↗
            </a>
            . Extração feita em {fmtData(JN_META.extraidoEm)}.
          </li>
        </ul>
      </section>

      {/* ═══ GRÁFICO 1: congestionamento, série completa ═══ */}
      <section aria-labelledby="grafico-congestionamento" className="mt-12">
        <h2 id="grafico-congestionamento" className="font-display text-xl font-bold text-text">
          O congestionamento, ano a ano
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Fração do acervo que o TJMG tinha para resolver e não resolveu naquele ano. Série
          completa: esta variável existe para os {SERIE_JN_TJMG.length} anos, sem buraco.
        </p>

        <ul className="mt-5 space-y-2">
          {SERIE_JN_TJMG.map((a) => (
            <li key={a.ano} className="flex items-center gap-3 text-[.9em]">
              <span className="w-12 shrink-0 tabular-nums font-semibold text-text">{a.ano}</span>
              <span
                className="h-4 rounded-sm bg-primary"
                style={{
                  width: `${Math.max(2, (a.congestionamento! / MAX_CONGEST) * 100)}%`,
                  maxWidth: "60%",
                }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{fmtPct(a.congestionamento!)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ GRÁFICO 2: tempo até a baixa, só onde há dado ═══ */}
      <section aria-labelledby="grafico-tempo" className="mt-12">
        <h2 id="grafico-tempo" className="font-display text-xl font-bold text-text">
          O tempo até a baixa, ano a ano — só onde o CNJ publicou
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Valor cru de <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">tpbaixm</code>
          , unidade <strong className="text-text">não confirmada</strong> (ver declaração acima).
          Sem barra para {PRIMEIRO.ano}–2014: o dado não existe para esses anos, e desenhar altura
          zero mentiria.
        </p>

        <ul className="mt-5 space-y-2">
          {ANOS_COM_TEMPO.map((a) => (
            <li key={a.ano} className="flex items-center gap-3 text-[.9em]">
              <span className="w-12 shrink-0 tabular-nums font-semibold text-text">{a.ano}</span>
              <span
                className="h-4 rounded-sm bg-accent"
                style={{
                  width: `${Math.max(2, (a.tempoAteBaixa! / MAX_TEMPO) * 100)}%`,
                  maxWidth: "60%",
                }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{fmt1(a.tempoAteBaixa!)}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 max-w-3xl text-[.85em] leading-relaxed text-text-soft">
          <strong className="text-text">Sem dado publicado para {ANOS_SEM_TEMPO.join(", ")}.</strong>{" "}
          Não é zero — é ausência.
        </p>
      </section>

      {/* ═══ A TABELA COMPLETA (cliente) ═══ */}
      <TabelaSerieJN />
    </div>
  );
}
