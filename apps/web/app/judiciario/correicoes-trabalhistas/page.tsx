import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";
import { ATAS_TRT3, COBERTURA_TRT3 } from "@/lib/judiciario/correicoes-trt3";
import TabelaAtas from "./TabelaAtas";

/**
 * `/judiciario/correicoes-trabalhistas` — quem fiscaliza a Justiça do
 * Trabalho em Minas, e com que frequência.
 *
 * ═══ POR QUE ESTA PÁGINA NÃO É `/judiciario/inspecoes` ═══
 *
 * Quem correiciona um Tribunal Regional do Trabalho **não é o CNJ** — é a
 * Corregedoria-Geral da Justiça do Trabalho, órgão do próprio TST. O
 * documento também não se chama "relatório de inspeção": chama-se **ata de
 * correição**. Um leitor que busca "inspeção CNJ TRT-3" ou vasculha o site do
 * TRT-3 não acha nada, porque procurou no lugar errado — a fonte é o Liferay
 * do TST. Essa explicação abre a página, antes de qualquer número.
 *
 * ═══ O QUE A PÁGINA MOSTRA ═══
 *
 * O dado tem 18 linhas; a matéria não é o conteúdo de cada ata (não temos
 * achado por achado, como em `/judiciario/inspecoes`), é a **frequência**:
 * quanto tempo passa entre uma correição e a seguinte, e que duas gestões
 * inteiras de Ministro Corregedor-Geral passaram sem correicionar o TRT-3.
 *
 * ═══ VÃOS SÃO DERIVADOS, NÃO INVENTADOS ═══
 *
 * `VAOS_TRT3` é calculado aqui a partir do campo `ano` de `ATAS_TRT3` — é o
 * mesmo dado, só que a diferença entre linhas consecutivas. O maior vão que
 * essa conta produz bate com `COBERTURA_TRT3.maiorVaoAnos/maiorVaoDe/
 * maiorVaoAte`, que vêm prontos do módulo: um número não substitui o outro,
 * o card usa o campo pronto e o gráfico usa a série derivada dele.
 */

const C = COBERTURA_TRT3;

export const metadata: Metadata = metadataEditavel("/judiciario/correicoes-trabalhistas", {
  title: "Quem fiscaliza a Justiça do Trabalho em Minas — Controle Popular · Judiciário",
  description:
    `A Corregedoria-Geral da Justiça do Trabalho, órgão do TST, correiciona o TRT da 3ª Região ` +
    `de tempos em tempos e lavra uma ata — não é o CNJ, e não é o mesmo documento das inspeções ` +
    `de 2ª instância. São ${ATAS_TRT3.length} atas de ${C.anoMaisAntigo} a ${C.anoMaisRecente}, ` +
    `com um vão de até ${C.maiorVaoAnos} anos entre correições e duas gestões inteiras sem ` +
    `correicionar o tribunal.`,
});

const ATAS_ASC = [...ATAS_TRT3].sort((a, b) => a.ano - b.ano);
const VAOS_TRT3 = ATAS_ASC.slice(1).map((ata, i) => ({
  de: ATAS_ASC[i].ano,
  ate: ata.ano,
  anos: ata.ano - ATAS_ASC[i].ano,
}));
const MAX_VAO = Math.max(...VAOS_TRT3.map((v) => v.anos), 1);

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

export default function CorreicoesTrabalhistasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/judiciario" className="hover:text-primary">
          Judiciário
        </a>{" "}
        · <span className="text-text">Correições no TRT-3</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Judiciário · Fiscalização
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Quem fiscaliza a Justiça do Trabalho em Minas
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Quem correiciona um Tribunal Regional do Trabalho não é o Conselho Nacional de Justiça —
          é a <strong className="text-text">Corregedoria-Geral da Justiça do Trabalho</strong>,
          órgão do próprio Tribunal Superior do Trabalho. O documento também não se chama
          &ldquo;relatório de inspeção&rdquo;: chama-se{" "}
          <strong className="text-text">ata de correição</strong>. É por isso que buscar no site do
          CNJ, ou no site do próprio TRT-3, não acha nada — a fonte fica no site do TST. Esta
          página reúne as{" "}
          <strong className="text-text">{ATAS_TRT3.length} atas de correição ordinária</strong> no
          TRT da 3ª Região (Minas Gerais) encontradas, de{" "}
          <strong className="text-text">{C.anoMaisAntigo} a {C.anoMaisRecente}</strong>, todas em
          PDF público. A pergunta que ela responde: o tribunal que julga a sua ação trabalhista foi
          fiscalizado nos últimos anos?
        </p>
      </header>

      {/* ═══ CARTÕES ═══ */}
      <section aria-label="Números do acervo" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={String(ATAS_TRT3.length)}
          rotulo="atas de correição ordinária"
          nota={`de ${C.anoMaisAntigo} a ${C.anoMaisRecente}`}
        />
        <Cartao
          valor={`${C.maiorVaoAnos} anos`}
          rotulo="maior vão entre duas correições"
          nota={`entre ${C.maiorVaoDe} e ${C.maiorVaoAte}`}
        />
        <Cartao
          valor={String(C.gestoesSemCorreicao.length)}
          rotulo="gestões de Corregedor-Geral sem correicionar o TRT-3"
          nota="confirmado por ausência real na tabela do TST"
        />
        <Cartao
          valor="05 a 09/10/2026"
          rotulo="próxima correição, já com data marcada"
          nota="edital publicado; a ata ainda não existe"
        />
      </section>

      {/* ═══ DECLARAÇÃO ═══ */}
      <section
        aria-labelledby="declaracao-correicoes"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-correicoes" className="font-display text-base font-semibold text-text">
          De quem é este documento, e o que esta página não faz
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">O documento é da Corregedoria-Geral da Justiça do
            Trabalho</strong>, órgão do TST — não deste portal, e não do CNJ.{" "}
            <a
              href={C.fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              Ver a lista de correições no site do TST ↗
            </a>
          </li>
          <li>
            <strong className="text-text">Não soma com o acervo de inspeções do CNJ</strong>, em{" "}
            <a href="/judiciario/inspecoes" className="text-primary underline underline-offset-2 hover:text-accent">
              /judiciario/inspecoes
            </a>
            . São gêneros distintos — outro órgão, outro documento, outra estrutura — e o CNJ, por
            regulamento, não inspeciona tribunal superior nem os regionais que respondem a ele:
            quem correiciona TRT é a CGJT.
          </li>
          <li>
            <strong className="text-text">É piso, não total.</strong> Não há rota de enumeração no
            site do TST: o acervo saiu de raspagem de 19 páginas — uma por gestão de Ministro
            Corregedor-Geral —, e o próprio TST pode ter reformulado o histórico anterior a{" "}
            {C.anoMaisAntigo} sem deixar sinal disso na página atual.
          </li>
          <li>
            <strong className="text-text">A próxima correição já tem data</strong>, mas ainda não
            tem ata: {C.proximaCorreicao}.
          </li>
        </ul>
      </section>

      {/* ═══ GRÁFICO: vão entre correições ═══ */}
      <section aria-labelledby="vaos-correicoes" className="mt-12">
        <h2 id="vaos-correicoes" className="font-display text-xl font-bold text-text">
          Quanto tempo passa entre uma correição e a seguinte
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Cada barra é o intervalo, em anos, entre duas correições ordinárias consecutivas no
          TRT-3. O maior vão do acervo — <strong className="text-text">{C.maiorVaoAnos} anos</strong>,
          entre {C.maiorVaoDe} e {C.maiorVaoAte} — aparece destacado.
        </p>

        <ul className="mt-5 space-y-2">
          {VAOS_TRT3.map((v) => {
            const destaque = v.anos === C.maiorVaoAnos;
            return (
              <li key={`${v.de}-${v.ate}`} className="flex items-center gap-3 text-[.92em]">
                <span className="w-28 shrink-0 tabular-nums text-text-soft">
                  {v.de} → {v.ate}
                </span>
                <span
                  className={`h-4 rounded-sm ${destaque ? "bg-accent" : "bg-primary"}`}
                  style={{ width: `${Math.max(4, (v.anos / MAX_VAO) * 100)}%`, maxWidth: "60%" }}
                  aria-hidden="true"
                />
                <span className="tabular-nums text-text">
                  {v.anos} {v.anos === 1 ? "ano" : "anos"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ═══ GESTÕES SEM CORREIÇÃO ═══ */}
      <section aria-labelledby="gestoes-sem-correicao" className="mt-12">
        <h2 id="gestoes-sem-correicao" className="font-display text-xl font-bold text-text">
          Duas gestões inteiras sem pisar no TRT-3
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          O cargo de Corregedor-Geral da Justiça do Trabalho tem mandato, e cada Ministro que passa
          por ele decide onde correicionar. Nas duas gestões abaixo, a tabela do próprio TST não
          registra nenhuma correição no TRT-3 — não é falha de coleta: as regiões que cada gestão
          correicionou estão listadas, e a 3ª Região simplesmente não está entre elas.
        </p>

        <ul className="mt-5 space-y-4">
          {C.gestoesSemCorreicao.map((g) => {
            const [lista, nota] = g.regioes_corrigidas.split("--").map((s) => s.trim());
            const truncada = nota?.includes("truncada");
            return (
              <li key={g.ministro} className="rounded-2xl border border-border p-4">
                <p className="text-[.95em] font-semibold text-text">{g.ministro}</p>
                <p className="mt-1 text-[.88em] text-text-soft">
                  Corregedor-Geral de {g.periodo_gestao}
                </p>
                <p className="mt-2 text-[.92em] leading-relaxed text-text-soft">
                  Regiões correicionadas nessa gestão: {lista}. A 3ª Região (TRT de Minas Gerais)
                  não aparece na lista
                  {truncada
                    ? " — e a própria página do TST avisa que essa lista pode estar truncada, então pode haver mais regiões do que as registradas"
                    : ""}
                  .
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ═══ A TABELA COMPLETA (cliente) ═══ */}
      <TabelaAtas />

      {/* ═══ NÃO É O MESMO ACERVO DAS INSPEÇÕES DO CNJ ═══ */}
      <section aria-labelledby="nao-e-inspecao" className="mt-14">
        <h2 id="nao-e-inspecao" className="font-display text-xl font-bold text-text">
          Isto não é o mesmo acervo das inspeções do CNJ
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O portal também publica{" "}
          <a
            href="/judiciario/inspecoes"
            className="text-primary underline underline-offset-2 hover:text-accent"
          >
            o que a Corregedoria Nacional de Justiça encontrou dentro do TJMG ↗
          </a>
          . São coisas diferentes, e os números não se somam: lá é o CNJ inspecionando um tribunal
          estadual, achado por achado; aqui é a CGJT correicionando um tribunal do trabalho,
          gestão por gestão. O regulamento da Corregedoria Nacional não alcança tribunal superior
          nem os regionais que respondem a ele — por isso não há, e não haverá, inspeção do CNJ
          sobre o TRT-3.
        </p>
      </section>
    </div>
  );
}
