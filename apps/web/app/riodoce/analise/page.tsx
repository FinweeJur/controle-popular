import type { Metadata } from "next";
import NextLink from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { ANALISE, BIBLIOTECA, C, JURIS, MAB, NOTICIAS } from "./dados";
import { Botao, Marca } from "./Componentes";
import { SecaoNumeros } from "./SecaoNumeros";
import { SecaoOQueAconteceu } from "./SecaoOQueAconteceu";
import { SecaoDinheiro } from "./SecaoDinheiro";
import { SecaoIndenizacao } from "./SecaoIndenizacao";
import { SecaoAmbiental } from "./SecaoAmbiental";
import { SecaoJurisprudencia } from "./SecaoJurisprudencia";
import { SecaoAcervos } from "./SecaoAcervos";
import { SecaoProcessos } from "./SecaoProcessos";
import MapaSubfrentes from "./MapaSubfrentes";

/**
 * `/riodoce/analise` — análise integrada do caso Rio Doce.
 *
 * ═══ O QUE ESTA PÁGINA É ═══
 *
 * A leitura de conjunto que o hub (`/riodoce`) não comporta: todos os eixos
 * do caso numa página longa — o que aconteceu, a execução do Acordo em MG,
 * a indenização individual, o litoral, a jurisprudência, os acervos, os
 * processos e os dados espaciais. O leitor acha tudo descendo o feed, sem
 * voltar ao índice a cada bloco.
 *
 * ═══ DE ONDE VEM CADA NÚMERO ═══
 *
 * - Execução: `lib/ambiental/ckan-mg-mariana.ts` (gerado do CKAN MG).
 * - Litoral, teses e vias: `data/analises/rio-doce.json`.
 * - Acervos: `data/mab-publicacoes.json`, `data/noticias-desastres.json`,
 *   `public/data/biblioteca-desastres.json` e o resumo do buscador.
 *
 * As coleções grandes são reduzidas a contagens em `dados.ts`, no servidor;
 * nenhuma vira prop de componente de cliente (regra 5.1).
 *
 * ═══ POR QUE NÃO HÁ OUTRO <main> NEM RODAPÉ ═══
 *
 * `riodoce/layout.tsx` já monta `<main id="conteudo-principal">` e o rodapé
 * da zona. Duplicar aqui repetiria o id do skip-link e o rodapé.
 */

export const metadata: Metadata = metadataEditavel("/riodoce/analise", {
  title: "Análise integrada do Rio Doce — Mariana, litoral e reparação | Controle Popular",
  description: `O caso do Rio Doce em uma página: ${formatNumberBR(C.empenhos)} empenhos e ${formatCurrencyCompactaBR(C.valorEmpenhadoTotal)} empenhados em MG, o PID de 321 mil indenizações, a evidência sobre o litoral e as teses da jurisprudência.`,
});

const ANO = ANALISE.geradoEm.split("-").reverse().join("/");

const SUMARIO = [
  { href: "#numeros", rotulo: "O caso em números" },
  { href: "#o-que-aconteceu", rotulo: "O que aconteceu" },
  { href: "#reparacao", rotulo: "Reparação e dinheiro" },
  { href: "#indenizacao", rotulo: "Indenização individual" },
  { href: "#meio-ambiente", rotulo: "Meio ambiente, saúde e pesca" },
  { href: "#jurisprudencia", rotulo: "Jurisprudência" },
  { href: "#acervos", rotulo: "Documentos, notícias e MAB" },
  { href: "#processos", rotulo: "Processos e dados espaciais" },
  { href: "#mapa-subfrentes", rotulo: "Mapa das subfrentes" },
] as const;

function Hero() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-9">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-text-soft">
          Plataforma Rio Doce · leitura de conjunto
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.8em,5vw,2.8em)] font-bold leading-tight tracking-tight">
          Análise integrada do Rio Doce
        </h1>
        <p className="mt-3 max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          O rompimento da barragem de Fundão, em Mariana, e o que veio depois:
          a execução do Acordo em Minas, as portas da indenização individual,
          o que a literatura documenta sobre o litoral capixaba, o que a
          jurisprudência decide e onde estão os documentos e as notícias. Cada
          número aponta a fonte; cada conclusão diz o quanto o dado sustenta.
        </p>
        <p className="mt-3 text-sm text-text-soft">
          Síntese atualizada em <strong className="text-text">{ANO}</strong>.
          Execução do Acordo: CKAN MG, {C.anoInicial}–{C.anoFinal}. PID:
          balanço da Samarco de 22/10/2026. Dados espaciais: medição de
          12/10/2026.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Botao href="/riodoce/linha-do-tempo">Linha do tempo</Botao>
          <Botao href="/riodoce/clipping" variante="contorno">
            Clipping
          </Botao>
          <Botao href="/ambiental/mariana" variante="contorno">
            Execução do Acordo em MG
          </Botao>
          <Botao href="/riodoce/processos" variante="contorno">
            Processos
          </Botao>
        </div>
      </div>
    </header>
  );
}

function IndiceDaPagina() {
  return (
    <nav
      aria-labelledby="indice-pagina"
      className="mt-6 rounded-xl border border-border bg-surface-2 p-4"
    >
      <h2
        id="indice-pagina"
        className="text-xs font-semibold uppercase tracking-[.18em] text-text-soft"
      >
        Nesta página
      </h2>
      <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {SUMARIO.map((item, indice) => (
          <li key={item.href}>
            <NextLink
              href={item.href}
              className="flex min-h-9 items-baseline gap-2 rounded px-1 py-1 text-sm text-text hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span className="font-tabular text-xs text-text-soft">
                {String(indice + 1).padStart(2, "0")}
              </span>
              {item.rotulo}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function LegendaDeMarcas() {
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-text-soft">
      <p className="font-semibold text-text">Como ler as marcas</p>
      <p className="mt-1">
        <Marca tipo="medido" /> número ou fato conferido na fonte citada ao
        lado. <Marca tipo="inferido" /> leitura nossa a partir do dado, não
        afirmação da fonte. <Marca tipo="nao" /> limite explícito do que o
        dado não permite concluir.
      </p>
    </div>
  );
}

function Fontes() {
  return (
    <section
      id="fontes"
      aria-labelledby="titulo-fontes"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <h2
        id="titulo-fontes"
        className="font-display text-[clamp(1.3em,3vw,1.7em)] font-bold tracking-tight"
      >
        De onde vem o dado
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Execução do Acordo.</strong> CKAN do
          Governo de Minas Gerais, dataset <code>portal_mariana</code>, lido
          pelo agregado versionado de <code>lib/ambiental/ckan-mg-mariana.ts</code>.{" "}
          <NextLink href="/ambiental/mariana" className="font-semibold text-primary hover:underline">
            Ver a página da execução →
          </NextLink>
        </p>
        <p className="rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Litoral, teses e vias.</strong> Síntese
          própria a partir dos artigos citados em{" "}
          <code>data/analises/rio-doce.json</code>.{" "}
          <NextLink href="/ambiental/rio-doce/analise" className="font-semibold text-primary hover:underline">
            Ver a análise do litoral →
          </NextLink>
        </p>
        <p className="rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Acervos.</strong> Biblioteca dos
          desastres: {formatNumberBR(BIBLIOTECA.total)} itens; radar de
          notícias: {formatNumberBR(NOTICIAS.total)}; MAB:{" "}
          {formatNumberBR(MAB.total)}; buscador de jurisprudência:{" "}
          {formatNumberBR(JURIS.tjes + JURIS.tjmg)} decisões nos dois tribunais.
          As datas de coleta estão em cada cartão.
        </p>
        <p className="rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-text-soft">
          <strong className="text-text">Processos e bacia.</strong> Consulta ao
          vivo na API Pública do DataJud (CNJ), sem arquivar autos; camadas da
          bacia no WFS da SEMAD. O portal não republica derivado do acervo do
          CNJ.
        </p>
      </div>
    </section>
  );
}

export default function AnaliseIntegradaRioDoce() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <CaminhoSistema rota="/riodoce/analise" />

      <Hero />
      <IndiceDaPagina />
      <LegendaDeMarcas />

      <SecaoNumeros />
      <SecaoOQueAconteceu />
      <SecaoDinheiro />
      <SecaoIndenizacao />
      <SecaoAmbiental />
      <SecaoJurisprudencia />
      <SecaoAcervos />
      <SecaoProcessos />
      <Fontes />
      <MapaSubfrentes atual="/riodoce/analise" />

      <OutrasFrentes atual="riodoce" />
    </div>
  );
}
