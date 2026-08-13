import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import {
  contarCoberturaTemasLegislacaoAmbiental,
  contarLegislacaoAmbiental,
  listarLegislacaoAmbiental,
} from "@/lib/db/queries/legislacao-ambiental";
import BuscaLegislacaoAmbiental from "./BuscaLegislacaoAmbiental";

export const metadata: Metadata = {
  title: "Legislação ambiental — Controle Popular · Ambiental",
  description:
    "Leis, decretos, deliberações e portarias ambientais de Minas Gerais, das três fontes que hoje não conversam entre si (ALMG, Semad e Siam), numa busca só.",
};

/**
 * `/ambiental/legislacao` — a F6 do plano de execução.
 *
 * Três coletores independentes escrevem na mesma tabela
 * (`etl.apis.legislacao_almg`/`legislacao_semad`/`legislacao_siam` ->
 * `ambiental_legislacao`, migration `0063`). Método de coleta, armadilhas
 * medidas e a decisão de NÃO fundir normas entre fontes (só sinalizar
 * sobreposição) estão documentados lá e em
 * `docs/ambiental/F0-discovery.md` §6 — esta página só lê o resultado.
 *
 * Terceira fonte nacional (MMA CKAN, Conama) ficou de fora desta rodada por
 * decisão, não por falta de tempo: são catálogos de ORDEM DE GRANDEZA maior
 * e formato de acesso próprio (CSV `;` desde 1937, endpoint por id
 * enumerável) que mereceriam o mesmo nível de mapeamento ao vivo que as três
 * fontes de MG já tiveram — ver F0 §6 "Nacional". Registrado como próximo
 * passo, não forçado aqui.
 */
export default async function LegislacaoAmbientalIndex() {
  const [linhas, contagem, cobertura] = await Promise.all([
    listarLegislacaoAmbiental(),
    contarLegislacaoAmbiental(),
    contarCoberturaTemasLegislacaoAmbiental(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual e nacional · Legislação
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          A legislação ambiental de Minas, numa busca só
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Hoje a norma que interessa está partida entre sistemas que não conversam entre si —
          cada um com sua paginação, seu vocabulário e sua forma de publicar. Aqui as leis,
          decretos, deliberações e portarias ambientais de Minas Gerais entram numa busca só, com
          a fonte de cada uma sempre visível.
        </p>

        {contagem.total === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
            Nenhuma norma coletada ainda. Os coletores (
            <code className="font-mono text-[.85em]">etl.apis.legislacao_almg</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_semad</code>,{" "}
            <code className="font-mono text-[.85em]">legislacao_siam</code>) ainda não rodaram
            contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(contagem.total)}</strong> normas
            ambientais coletadas: <strong className="font-tabular">{formatNumberBR(contagem.porFonte.almg)}</strong>{" "}
            da ALMG, <strong className="font-tabular">{formatNumberBR(contagem.porFonte.semad)}</strong>{" "}
            do Banco da Semad e <strong className="font-tabular">{formatNumberBR(contagem.porFonte.siam)}</strong>{" "}
            do Siam (arquivo histórico). As três se sobrepõem em parte — a mesma lei pode estar em
            mais de uma fonte, e o card avisa quando isso acontece.
          </p>
        )}

        {cobertura.total > 0 && (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.88em] text-text-soft">
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.comTema)}</strong> de{" "}
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.total)}</strong> normas
            (
            {((100 * cobertura.comTema) / cobertura.total).toFixed(1).replace(".", ",")}%) receberam
            pelo menos um tema — as demais não bateram em nenhuma palavra-chave e ficam &quot;sem
            tema atribuído&quot;, não empurradas para um tema qualquer. A classificação também tem
            cobertura desigual entre fontes:{" "}
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.porFonte.almg.comTema)}</strong>/
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.porFonte.almg.total)}</strong>{" "}
            da ALMG (que atribui a cada norma um tema OFICIAL, cruzado aqui com a busca por
            palavra-chave),{" "}
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.porFonte.semad.comTema)}</strong>/
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.porFonte.semad.total)}</strong>{" "}
            da Semad e{" "}
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.porFonte.siam.comTema)}</strong>/
            <strong className="font-tabular text-text">{formatNumberBR(cobertura.porFonte.siam.total)}</strong>{" "}
            do Siam — as duas últimas SÓ por palavra-chave na ementa, porque nenhuma das duas
            publica uma taxonomia própria (indício, não afirmação oficial).
          </p>
        )}
      </header>

      <section className="mt-10">
        <BuscaLegislacaoAmbiental linhas={linhas} />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem cada norma</h2>
        <dl className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <div>
            <dt className="font-semibold text-text">ALMG — Assembleia Legislativa de MG</dt>
            <dd>
              Leis, decretos e leis complementares do Legislativo e do Executivo estaduais. A
              fonte não tem busca por palavra — as normas aqui vêm das ~2.500 &quot;normas
              básicas&quot; publicadas pela própria ALMG, filtradas localmente pelo tema oficial
              &quot;Meio Ambiente&quot; que a ALMG já atribui a cada uma (nunca por palavra-chave
              solta na ementa).
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Semad — Banco de Legislação Ambiental</dt>
            <dd>
              Cobre o que a ALMG não tem: Deliberação Copam, Portaria IEF, Portaria Igam,
              Resolução Conjunta dos órgãos do Sisema — atos administrativos, não leis da
              Assembleia. Atualizado pela própria Semad.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Siam — arquivo histórico</dt>
            <dd>
              Sistema de legislação ambiental mais antigo da Semad, cobrindo até 2024. Soma um
              volume maior e um identificador (idNorma) que as outras duas fontes não têm — por
              isso continua útil mesmo onde se sobrepõe às outras duas.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[.9em] text-text-soft">
          Fontes nacionais (Ministério do Meio Ambiente, Conama) ainda não entraram nesta busca —
          são catálogos de outra ordem de grandeza, com formato próprio, que ficam para uma
          próxima rodada.
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Como o tema de cada norma é decidido</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          A ALMG é a única das três fontes que atribui, a cada norma, uma taxonomia oficial própria
          (o campo &quot;indexação&quot; da sua API de dados abertos — o mesmo que já filtra o que
          entra aqui como &quot;ambiental&quot;). Os 8 temas do filtro acima nasceram de ramos REAIS
          dessa taxonomia (ex.: <code className="font-mono text-[.85em]">/Tema/Mineração</code>,{" "}
          <code className="font-mono text-[.85em]">
            /Tema/Meio Ambiente/Gestão Ambiental/Proteção Ambiental/Unidade de Conservação
          </code>
          ) — não foram inventados aqui. Para as normas da ALMG, o tema cruza essa taxonomia
          oficial com uma busca por palavra-chave na ementa.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Semad e Siam não publicam nenhuma taxonomia equivalente — medido diretamente no formato
          que as duas fontes expõem (uma tabela HTML de 6 colunas, sem coluna de tema/assunto).
          Para essas ~6.300 normas o tema vem só de palavra-chave auditável na ementa (regras em{" "}
          <code className="font-mono text-[.85em]">etl/temas_ambientais.py</code>), o que é
          indício de conteúdo, não uma classificação oficial — e por isso boa parte fica sem
          nenhum tema, em vez de forçada para um tema que a ementa não sustenta.
        </p>
      </section>
    </div>
  );
}
