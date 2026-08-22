import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import {
  COBERTURA_CNIEP,
  ESTABELECIMENTOS_MG,
  PRESIDIOS_POR_RAMO,
  TEMAS_INSPECAO,
} from "@/lib/judiciario/presidios-cniep";
import TabelaPresidios from "./TabelaPresidios";

/**
 * `/judiciario/presidios` — quem inspeciona os estabelecimentos penais de
 * Minas Gerais, unidade por unidade.
 *
 * ═══ O ACHADO É A SEPARAÇÃO, E ELA INVERTE A MANCHETE ÓBVIA ═══
 *
 * No bolo, 56 de 285 estabelecimentos (20%) não receberam nenhuma inspeção
 * no período — número que sugere descaso generalizado. Separado por quem
 * responde, a Justiça comum (TJMG) cobre 213 de 217, e o buraco inteiro está
 * nos dois ramos militares — o Superior Tribunal Militar não inspecionou
 * NENHUMA das 18 unidades sob sua responsabilidade. Publicar os 20% sem essa
 * separação seria acusar exatamente quem está inspecionando. Por isso a
 * separação por ramo vem ANTES de qualquer número agregado nesta página, e o
 * agregado só aparece já contextualizado na mesma frase.
 *
 * ═══ O QUE ESTA PÁGINA NÃO TEM ═══
 *
 * O CNIEP/Geopresídios publica QUE houve inspeção e SOBRE QUAL TEMA — não o
 * relato do que o juiz encontrou lá dentro. As rotas de conteúdo do CNJ
 * respondem 404. Ausência de achado aqui não significa que não houve achado,
 * e a tela diz isso perto de onde o número aparece.
 */

const C = COBERTURA_CNIEP;

export const metadata: Metadata = metadataEditavel("/judiciario/presidios", {
  title: "Quem fiscaliza a prisão em Minas Gerais — Controle Popular · Judiciário",
  description:
    `${C.estabelecimentos} estabelecimentos penais em Minas Gerais e ${formatNumberBR(C.inspecoes)} inspeções judiciais registradas no CNIEP/Geopresídios do CNJ — separadas por ramo, porque a cobertura entre eles é muito desigual.`,
});

const ROTULO_RAMO: Record<string, string> = {
  comum: "Justiça comum (TJMG)",
  "militar-estadual": "Justiça Militar de MG",
  "militar-federal": "Superior Tribunal Militar",
};

const fmtData = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");

const RAMO_COMUM = PRESIDIOS_POR_RAMO.find((r) => r.ramo === "comum")!;
const RAMO_MILITAR_MG = PRESIDIOS_POR_RAMO.find((r) => r.ramo === "militar-estadual")!;
const RAMO_STM = PRESIDIOS_POR_RAMO.find((r) => r.ramo === "militar-federal")!;

/** As únicas 4 unidades da Justiça comum sem nenhuma inspeção — calculado do
 *  dado, nunca digitado à mão, para nunca divergir se o dado for atualizado. */
const COMUM_SEM_INSPECAO = ESTABELECIMENTOS_MG.filter(
  (e) => e.ramo === "comum" && e.inspecoes === 0,
);

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

export default function PresidiosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/judiciario" className="hover:text-primary">
          Judiciário
        </a>{" "}
        · <span className="text-text">Fiscalização dos presídios</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Judiciário · Fiscalização
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Quem fiscaliza a prisão em Minas Gerais
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Todo estabelecimento penal do país tem de receber inspeção de um juiz. O CNJ mantém o
          registro de quando isso acontece — o Geopresídios — para{" "}
          <strong className="text-text">{formatNumberBR(C.estabelecimentos)} estabelecimentos</strong>{" "}
          em Minas Gerais. O que o sistema mostra é <strong className="text-text">que</strong> a
          inspeção aconteceu e <strong className="text-text">sobre que assunto</strong>; o relato do
          que o juiz encontrou lá dentro não está nesta base, e por isso também não está nesta
          página.
        </p>
      </header>

      {/* ═══ CARTÕES ═══ */}
      <section aria-label="Números do acervo" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={formatNumberBR(C.estabelecimentos)}
          rotulo="estabelecimentos penais avaliados"
          nota="em Minas Gerais, no CNIEP/Geopresídios do CNJ"
        />
        <Cartao
          valor={formatNumberBR(C.inspecoes)}
          rotulo="inspeções judiciais registradas"
          nota={`de ${fmtData(C.periodoDe)} a ${fmtData(C.periodoAte)}, somando os três ramos`}
        />
        <Cartao
          valor={`${RAMO_COMUM.semInspecao} de ${RAMO_COMUM.total}`}
          rotulo="sem inspeção na Justiça comum"
          nota={`${RAMO_COMUM.percentualSemInspecao}% — o ramo que responde pela maior parte dos presos de MG`}
        />
        <Cartao
          valor={`${RAMO_STM.semInspecao} de ${RAMO_STM.total}`}
          rotulo="sem inspeção no Superior Tribunal Militar"
          nota={`${RAMO_STM.percentualSemInspecao}% — nenhuma das unidades sob o STM foi inspecionada no período`}
        />
      </section>

      {/* ═══ A SEPARAÇÃO POR RAMO (o achado) ═══ */}
      <section aria-labelledby="separacao" className="mt-12">
        <h2 id="separacao" className="font-display text-xl font-bold text-text">
          Um número, dois donos diferentes
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          No total, <strong className="text-text">{C.semInspecao} dos {C.estabelecimentos} estabelecimentos
          ({Math.round((C.semInspecao / C.estabelecimentos) * 100)}%) não receberam nenhuma
          inspeção</strong> no período — um número que, sozinho, sugeriria descaso generalizado. Só
          que a fiscalização de presídio em Minas Gerais não tem um único responsável: cada
          estabelecimento cai sob um ramo diferente da Justiça, e a cobertura entre eles é muito
          desigual, como mostram as barras abaixo.
        </p>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[36em] border-collapse text-left text-[.92em]">
            <thead className="bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold text-text">
                  Ramo responsável
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-text">
                  Unidades
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-text">
                  Sem inspeção
                </th>
                <th scope="col" className="px-3 py-2 font-semibold text-text">
                  Cobertura
                </th>
              </tr>
            </thead>
            <tbody>
              {PRESIDIOS_POR_RAMO.map((r) => (
                <tr key={r.ramo} className="border-t border-border">
                  <td className="px-3 py-3 text-text">{ROTULO_RAMO[r.ramo] ?? r.tribunal}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-soft">{r.total}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-soft">
                    {r.semInspecao} ({r.percentualSemInspecao}%)
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 rounded-sm bg-primary"
                        style={{ width: `${Math.max(2, 100 - r.percentualSemInspecao)}%`, maxWidth: "80%" }}
                        aria-hidden="true"
                      />
                      <span className="tabular-nums text-[.85em] text-text-soft">
                        {100 - r.percentualSemInspecao}% inspecionado
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          A <strong className="text-text">Justiça comum</strong> — o TJMG, que responde por{" "}
          {RAMO_COMUM.total} das {C.estabelecimentos} unidades — inspecionou quase tudo:{" "}
          {RAMO_COMUM.semInspecao} de fora. O buraco está nos dois ramos militares: a{" "}
          <strong className="text-text">Justiça Militar de MG</strong> deixou{" "}
          {RAMO_MILITAR_MG.semInspecao} das {RAMO_MILITAR_MG.total} unidades sob sua
          responsabilidade sem nenhuma inspeção ({RAMO_MILITAR_MG.percentualSemInspecao}%), e o{" "}
          <strong className="text-text">Superior Tribunal Militar</strong> não inspecionou{" "}
          <strong className="text-text">nenhuma</strong> das {RAMO_STM.total} que lhe cabem — 100%.
          Publicar os {C.semInspecao} do total sem separar por ramo seria acusar exatamente quem
          está inspecionando.
        </p>

        <p className="mt-3 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          <strong className="text-text">E há um limite ao que este número mostra:</strong> unidade
          militar prisional costuma ser cela dentro de batalhão, muitas vezes vazia — não é
          penitenciária, e comparar o número de inspeções dela com o de uma unidade de 1.500
          pessoas é comparar coisas diferentes.
        </p>
      </section>

      {/* ═══ AS 4 SEM NENHUMA INSPEÇÃO NA JUSTIÇA COMUM ═══ */}
      <section aria-labelledby="sem-inspecao-comum" className="mt-12">
        <h2 id="sem-inspecao-comum" className="font-display text-xl font-bold text-text">
          As {COMUM_SEM_INSPECAO.length} unidades da Justiça comum sem nenhuma inspeção
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          São estabelecimento público, não pessoa — nomear é informação, não acusação a alguém.
          Isto não diz que algo esteja errado ali dentro: diz que, no período coberto por este
          dado, nenhum juiz registrou ter entrado.
        </p>
        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {COMUM_SEM_INSPECAO.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
              <span className="flex-1 text-[.95em] font-medium text-text">{e.nome}</span>
              <span className="text-[.85em] text-text-soft">{e.natureza}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ GRÁFICO: TEMAS ═══ */}
      <section aria-labelledby="temas-inspecao" className="mt-12">
        <h2 id="temas-inspecao" className="font-display text-xl font-bold text-text">
          Sobre que temas os juízes escreveram
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O Geopresídios classifica cada inspeção por assunto. Isto mostra{" "}
          <strong className="text-text">sobre que temas</strong> a inspeção tratou — não{" "}
          <strong className="text-text">o que</strong> o juiz encontrou em cada um: esse relato
          está no PDF do próprio processo de inspeção, que não é público por esta via.
        </p>

        <ul className="mt-5 space-y-2">
          {TEMAS_INSPECAO.map(([tema, n]) => (
            <li key={tema} className="flex items-center gap-3 text-[.92em]">
              <span className="w-72 shrink-0 text-text-soft">{tema}</span>
              <span
                className="h-4 rounded-sm bg-primary"
                style={{ width: `${Math.max(2, (n / TEMAS_INSPECAO[0][1]) * 100)}%`, maxWidth: "50%" }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ A TABELA COMPLETA (cliente) ═══ */}
      <TabelaPresidios />

      {/* ═══ DECLARAÇÃO ═══ */}
      <section
        aria-labelledby="declaracao-presidios"
        className="mt-14 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-presidios" className="font-display text-base font-semibold text-text">
          De quem é este dado, e o que esta página não tem
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">O dado é do CNJ, não deste portal.</strong> Vem do
            CNIEP/Geopresídios, extraído em {fmtData(C.extraidoEm)}.{" "}
            <a
              href={C.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              Abrir o Geopresídios ↗
            </a>
          </li>
          <li>
            <strong className="text-text">{C.avisoConteudo}</strong>
          </li>
          <li>
            <strong className="text-text">A rota que fornece este dado não é documentada
            pelo CNJ.</strong> Foi descoberta lendo o código do próprio site do Geopresídios, e pode
            mudar sem aviso — {C.avisoApi}
          </li>
          <li>
            <strong className="text-text">Isto não é o relatório de inspeção do TJMG.</strong> A
            página{" "}
            <a href="/judiciario/inspecoes" className="text-primary underline underline-offset-2 hover:text-accent">
              /judiciario/inspecoes
            </a>{" "}
            traz trecho do que a Corregedoria Nacional escreveu depois de entrar numa vara; esta
            página traz só a contagem de visitas do sistema Geopresídios a estabelecimentos
            penais — são fontes diferentes, com cobertura diferente.
          </li>
        </ul>
      </section>
    </div>
  );
}
