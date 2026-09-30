import type { Metadata } from "next";
import dados from "@/data/comunidades-tradicionais-mineracao-mg.json";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import TabelaComunidades, { type Comunidade } from "./TabelaComunidades";

/**
 * `/mineracao/ilegal` — Fase C do PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE, E O QUE ELA NÃO DIZ ═══
 *
 * A pergunta cívica é "onde a mineração encontra terra protegida e comunidade
 * tradicional?". Esta página responde com o cruzamento medido: cada terra
 * indígena (FUNAI) e cada território quilombola (INCRA) de Minas, com (a) se cai
 * na bacia do rio Paraopeba (circunscrição hidrográfica SF3, IDE-Sisema) e (b)
 * quantos polígonos de mineração detectada por satélite (Monitor MapBiomas ×
 * ANM/SIGMINE) têm o centroide DENTRO da comunidade.
 *
 * O portal **não julga**: "ilegal" é veredito da autoridade. O que se publica é
 * sinal, com fonte, método e data — e a frase fixa acompanha todo agrupamento.
 * O número é PISO, não total: o teste é por centroide (ray casting), então
 * polígono que encosta na comunidade mas tem centroide fora não conta.
 *
 * ═══ O QUE FALTA (lacuna é informação, AGENTS § 7) ═══
 *
 * - o recorte por comunidade é de MG; a bacia SF3 é a definição HIDROGRÁFICA,
 *   que não coincide com a lista de municípios do Acordo de Brumadinho;
 * - não há link por registro no WFS da FUNAI/INCRA (a linha traz o
 *   identificador — código da TI, processo do INCRA — e o link para a consulta
 *   oficial);
 * - não há imagem com data nesta página: a série Sentinel-2 está bloqueada.
 */

const PUBLICACAO = dados.gerado_em;
const COMUNIDADES = dados.comunidades as Comunidade[];
const RESUMO = dados.resumo as Record<string, number>;

export const metadata: Metadata = {
  title: "Mineração e comunidades tradicionais em Minas Gerais - Controle Popular",
  description:
    `${RESUMO.terras_indigenas} terras indígenas e ${RESUMO.quilombolas} territórios quilombolas de ` +
    `Minas Gerais cruzados com a mineração detectada por satélite e com a bacia do rio Paraopeba — ` +
    `com fonte oficial, método e data em cada número.`,
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-text-soft">{rotulo}</p>
      {nota ? <p className="mt-2 text-xs text-text-soft">{nota}</p> : null}
    </div>
  );
}

export default function PaginaMineracaoIlegal() {
  const hoje = PUBLICACAO.split("-").reverse().join("/");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Mineração · Comunidades tradicionais · Minas Gerais · dados de {hoje}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Mineração e comunidades tradicionais em Minas Gerais</h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `Esta página cruza ${fmt(RESUMO.terras_indigenas + RESUMO.quilombolas)} comunidades tradicionais de ` +
            `Minas Gerais — ${fmt(RESUMO.terras_indigenas)} terras indígenas e ${fmt(RESUMO.quilombolas)} territórios ` +
            `quilombolas — com a mineração que o satélite enxerga e com a bacia do rio Paraopeba. ` +
            `O portal não julga: publica sinal, com fonte oficial, método e data. Receber sinal não é ilícito — ` +
            `é o convite para conferir na fonte, e a apuração é da autoridade.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cartao
          valor={fmt(RESUMO.terras_indigenas)}
          rotulo="terras indígenas (FUNAI)"
          nota="todas as fases, do direito originário (CF art. 231)"
        />
        <Cartao
          valor={fmt(RESUMO.quilombolas)}
          rotulo="territórios quilombolas (INCRA)"
          nota="poligonal do processo de regularização fundiária"
        />
        <Cartao
          valor={fmt(RESUMO.em_bacia)}
          rotulo="na bacia do Paraopeba (SF3)"
          nota="centroide dentro da circunscrição hidrográfica oficial"
        />
        <Cartao
          valor={fmt(RESUMO.com_indicio_mineracao)}
          rotulo="com indício de mineração dentro"
          nota="centroide de mineração detectada por satélite cai na comunidade"
        />
        <Cartao
          valor={fmt(RESUMO.indicios_em_comunidades)}
          rotulo="polígonos de mineração dentro de comunidades"
          nota="piso, não total — método por centroide"
        />
        <Cartao
          valor={fmt(RESUMO.poligonos_mineracao)}
          rotulo="polígonos de mineração cruzados"
          nota="Monitor MapBiomas × poligonal ANM/SIGMINE"
        />
      </section>

      <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
        <strong>Receber sinal não é ilícito.</strong> Um indício de mineração dentro de uma comunidade pode
        ser lavra autorizada, garimpo, atividade vizinha ou um erro de desenho do polígono. É o convite para
        conferir na fonte oficial — a apuração é da autoridade.
      </p>

      <section aria-label="Tabela de comunidades" className="mt-6">
        <TabelaComunidades comunidades={COMUNIDADES} geradoEm={PUBLICACAO} />
      </section>

      <section aria-label="Fonte e método" className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Método</dt>
            <dd>{dados.metodo}.</dd>
          </div>
          <div>
            <dt className="font-semibold">Bacia</dt>
            <dd>
              {dados.bacia.nome} ({fmt(dados.bacia.area_km2)} km²) — {dados.bacia.fonte}.
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold">Fontes</dt>
            <dd>
              <ul className="mt-1 list-disc pl-5">
                {dados.fontes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Ressalva:</strong> {dados.ressalva}
        </p>
        <p className="mt-2 text-text-soft">
          Plano completo, com as medições datadas:{" "}
          <code>docs/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md</code>.
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          A tabela é vetorial e sai nítida na impressão; o botão de planilha baixa exatamente o que está
          filtrado na tela, com separador <code>;</code> e BOM UTF-8 para o Excel brasileiro.
        </p>
      </section>

      <section aria-label="Ver no globo" className="mt-6 rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="text-xl font-semibold">Onde isso está no mapa</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
          As camadas deste cruzamento também estão no globo 3D: terra indígena, território quilombola e a
          mineração detectada. Os links abrem o globo com a camada acesa.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["terras-indigenas", "Terras indígenas (FUNAI)"],
            ["territorios-quilombolas", "Territórios quilombolas (INCRA)"],
            ["mineracao-sem-cadastro", "Mineração sem cadastro na ANM"],
            ["mineracao-em-uc", "Mineração detectada dentro de UC"],
            ["mineracao-em-quilombo", "Mineração detectada dentro de quilombo"],
            ["cavas-monitoradas", "Cavas detectadas na janela ativa"],
          ].map(([camada, rotulo]) => (
            <li key={camada}>
              <a
                href={`/terras/globo/?camada=${camada}`}
                className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span className="block text-sm font-medium">{rotulo}</span>
                <span className="mt-2 block text-xs underline">Abrir no globo</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
