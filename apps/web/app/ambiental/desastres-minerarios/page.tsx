import type { Metadata } from "next";

import FooterGlobal from "@/app/components/FooterGlobal";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { COBERTURA_BIBLIOTECA_DESASTRES } from "@/lib/ambiental/desastres-cobertura";
import { DESASTRE_LABEL, type Desastre } from "@/lib/ambiental/desastres";
import { metadataEditavel } from "@/lib/edicoes";
import BibliotecaDesastresClient from "./BibliotecaDesastresClient";

/**
 * `/ambiental/desastres-minerarios` — biblioteca unificada de documentos dos
 * dois desastres de barragens de rejeitos: Mariana (2015) e Brumadinho (2019).
 *
 * ═══ MARIANA NÃO É BRUMADINHO ═══
 *
 * Dois desastres diferentes — responsáveis (Samarco/Vale/BHP no primeiro; Vale
 * no segundo), acordos, bacias (Doce × Paraopeba) e processos judiciais
 * distintos. A página não mistura os dois: cada item tem `desastre`, os chips
 * separam por caso, e nenhum número agregado funde os dois sem rótulo. É a
 * regra da insinuação do AGENTS.md aplicada ao desenho.
 *
 * ═══ LACUNA É INFORMAÇÃO ═══
 *
 * O acervo hoje vem das ATIs do Paraopeba (645 itens). Mariana ainda está sem
 * documento coletado (fontes pendentes: CIF, MPF, ATIs de Mariana, órgãos do
 * ES). A página diz isso com todas as letras — mostrar só o que tem valor faria
 * a cobertura parecer completa.
 *
 * ═══ SERVIDOR IMPORTA SÓ A COBERTURA ═══
 *
 * Aqui entram `COBERTURA_BIBLIOTECA_DESASTRES` (constantes medidas) para os
 * cartões e o gráfico. O array mora em `public/data/biblioteca-desastres.json`
 * e é buscado pelo cliente — nunca como props (regra de payload do AGENTS.md).
 */

const C = COBERTURA_BIBLIOTECA_DESASTRES;

const POR_DESASTRE: Desastre[] = ["mariana", "brumadinho"];

const MAX_ANO = Math.max(...C.porAno.map((a) => a.total), 1);

export const metadata: Metadata = metadataEditavel("/ambiental/desastres-minerarios", {
  title: "Biblioteca dos desastres de Mariana e Brumadinho — Controle Popular · Ambiental",
  description: `Biblioteca de ${formatNumberBR(C.total)} documentos públicos sobre os dois desastres de barragens — Mariana (2015) e Brumadinho (2019) — de órgãos federais, estaduais, instituições de justiça e assessorias técnicas, com busca, filtros e ordenação.`,
});

export default function DesastresMinerariosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/ambiental" className="hover:text-primary">
          Ambiental
        </a>{" "}
        · <span className="text-text">Desastres minerários</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Desastres minerários
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Os documentos dos dois desastres, numa biblioteca só
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          A reparação se decide em documentos — decisão, laudo, resolução,
          termo, relatório — publicados por quem é parte ou autoridade no caso.
          Esta página reúne o que esses órgãos publicaram sobre o rompimento das
          barragens de <strong className="text-text">Mariana (2015)</strong> e{" "}
          <strong className="text-text">Brumadinho (2019)</strong>:{" "}
          <strong className="text-text">{formatNumberBR(C.total)} documentos</strong>,
          com busca, filtros e ordenação. De cada item guardamos título, data,
          órgão e o link — o material abre na fonte, que é quem responde por ele.
        </p>
      </header>

      {/* ═══ OS DOIS CASOS — com aviso editorial ═══ */}
      <section
        aria-labelledby="casos-desastres"
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        {POR_DESASTRE.map((d) => {
          const total = C.porDesastre[d];
          const temAcervo = total > 0;
          return (
            <div
              key={d}
              className="rounded-2xl border border-border bg-surface-2 p-5 text-[.92em] text-text-soft"
            >
              <p className="font-display text-base font-semibold text-text">
                {DESASTRE_LABEL[d]}{" "}
                <span className="font-normal">
                  — {formatNumberBR(total)} documento{Number(total) === 1 ? "" : "s"}
                </span>
              </p>
              <p className="mt-2">
                {d === "mariana" ? (
                  <>
                    Rompimento da barragem do Fundão, da Samarco (Vale/BHP), em
                    05/11/2015. Atingiu a bacia do <strong className="text-text">Rio Doce</strong>,
                    em MG e ES. Tratado pelo Comitê Interfederativo (CIF) e pelo
                    Acordo de Reparação do Rio Doce.
                  </>
                ) : (
                  <>
                    Rompimento da barragem B1 da Vale, em 25/01/2019. Atingiu a bacia do{" "}
                    <strong className="text-text">Paraopeba</strong>, em MG. Tratado no
                    processo judicial e no Acordo de Reparação do Rio Paraopeba.
                  </>
                )}
              </p>
              {!temAcervo && (
                <p className="mt-3 rounded-xl border border-border bg-surface p-3 text-xs">
                  <strong className="text-text">Acervo em coleta.</strong> Os documentos
                  deste caso ainda não foram coletados (fontes pendentes: CIF, MPF,
                  assessorias técnicas de Mariana e órgãos do ES). Assim que entram, aparecem
                  aqui com o selo do caso.
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* ═══ NÚMEROS DE TOPO ═══ */}
      <section aria-labelledby="numeros-biblioteca" className="mt-10">
        <h2 id="numeros-biblioteca" className="font-display text-xl font-bold tracking-tight text-text">
          O acervo em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Documentos
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">{formatNumberBR(C.total)}</p>
            <p className="mt-1 text-[.86em] text-text-soft">medido em {formatDateBR(C.medidoEm)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Mariana (2015)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.porDesastre.mariana)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Brumadinho (2019)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.porDesastre.brumadinho)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Barrados pela triagem
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.barradosPelaTriagem)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              régua de dado pessoal rodou sobre o acervo
            </p>
          </div>
        </div>
      </section>

      {/* ═══ GRÁFICO — por ano ═══ */}
      <section aria-labelledby="grafico-biblioteca" className="mt-10">
        <h2 id="grafico-biblioteca" className="font-display text-xl font-bold tracking-tight text-text">
          Publicações por ano
        </h2>
        <figure className="mt-5">
          <div className="sr-only">
            Gráfico de barras horizontais, uma por ano, com o total de documentos do acervo.{" "}
            {C.porAno.map((a) => `${a.ano}: ${a.total}.`).join(" ")}
          </div>
          <div aria-hidden className="space-y-2.5">
            {C.porAno.map((a) => (
              <div key={a.ano} className="flex items-center gap-3">
                <span className="w-11 shrink-0 text-right font-tabular text-[.85em] font-semibold text-text">
                  {a.ano}
                </span>
                <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                  <div
                    className="cp-ord-seg cp-ord-seg-1 h-full rounded-[3px]"
                    style={{ width: `${(a.total / MAX_ANO) * 100}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 font-tabular text-[.85em] text-text-soft">
                  {formatNumberBR(a.total)}
                </span>
              </div>
            ))}
          </div>
        </figure>
        <p className="mt-4 text-xs text-text-soft">
          Itens sem data na fonte não entram na série anual. O acervo não se atualiza sozinho:
          muda quando um coletor roda e o site é reconstruído.
        </p>
      </section>

      {/* ═══ A BIBLIOTECA (CLIENTE) ═══ */}
      <BibliotecaDesastresClient />

      {/* ═══ DE ONDE VEIO / O QUE FICOU DE FORA ═══ */}
      <section aria-labelledby="origem-biblioteca" className="mt-14 border-t border-border pt-8">
        <h2 id="origem-biblioteca" className="font-display text-lg font-bold tracking-tight text-text">
          De onde veio, e o que ficou de fora
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {C.fontes.map((f) => (
            <li key={f.id} className="rounded-2xl border border-border bg-surface p-5 text-sm">
              <p className="font-display font-semibold text-text">
                {f.nome}{" "}
                <span className="font-normal text-text-soft">— {formatNumberBR(f.itens)} itens</span>
              </p>
              <p className="mt-1 text-xs text-text-soft">
                <strong className="text-text">Licença:</strong> {f.licenca}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
          <strong className="text-text">Fora do acervo:</strong> {C.ficouDeFora}
        </p>
        <p className="mt-3 text-xs text-text-soft">
          Este portal não hospeda os arquivos — de cada item guardamos metadado e o link para a
          fonte original (Lei 9.610/98: sem licença declarada, a obra é de direitos reservados).
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </div>
  );
}
