import type { Metadata } from "next";
import NextLink from "next/link";
import { COBERTURA_ACORDO_RIO_DOCE } from "@/lib/ambiental/ckan-mg-mariana";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import OutrasFrentes from "@/app/components/OutrasFrentes";

/**
 * Hub da Plataforma Rio Doce (`/riodoce`).
 *
 * ═══ O QUE ESTA PÁGINA É ═══
 *
 * Porta de entrada do caso do Rio Doce — o mesmo papel que
 * `app/paraopeba/page.tsx` tem para Brumadinho. O Acordo de Mariana ganhou
 * uma zona própria porque é um dos dois maiores desastres ambientais do
 * país e porque a Fase 1 do plano (`docs/planos/PLANO-PLATAFORMA-RIO-DOCE.md`,
 * decisão do dono em 12/10/2026) entrega busca + processos primeiro; as
 * demais frentes (dados espaciais, biblioteca, linha do tempo) entram nas
 * fases seguintes e ganham cartão próprio quando tiverem página.
 *
 * ═══ NÚMEROS NA TELA VÊM DA CONSTANTE, NUNCA DIGITADOS ═══
 *
 * O cartão da execução lê `COBERTURA_ACORDO_RIO_DOCE`
 * (`lib/ambiental/ckan-mg-mariana.ts`, agregado do CKAN MG / dataset
 * `portal_mariana`) — mesma disciplina do cartão de terras com
 * `TAXA_ERRO_G0`: quem mexer no arquivo gerado muda a tela sozinho, sem
 * alguém esquecer de atualizar um total escrito à mão aqui (§8).
 *
 * A execução financeira em si continua em `/ambiental/mariana` — este hub
 * só linka ("um número, uma fonte"): duplicar o acervo aqui criaria duas
 * cópias do mesmo total para divergirem na próxima coleta.
 */
export const metadata: Metadata = metadataEditavel("/riodoce", {
  title: "Plataforma Rio Doce — Mariana, Fundão e a repactuação | Controle Popular",
  description:
    "Hub do caso do Rio Doce: o que é o Acordo de Mariana, onde consultar a execução em MG, os processos da reparação e os dados espaciais da bacia.",
});

const C = COBERTURA_ACORDO_RIO_DOCE;

// Cartões de primeira camada. Os dois primeiros são links de verdade
// (rota existe HOJE); os dois últimos são honestos sobre o que ainda não
// foi publicado — card que promete página inexistente é 404 na tela do
// leitor, e aqui o leitor muitas vezes está sob estresse (§1).
const CARTÕES = [
  {
    titulo: "Execução do Acordo em MG",
    linha: `${formatNumberBR(C.empenhos)} empenhos, R$ ${formatCurrencyCompactaBR(C.valorEmpenhadoTotal)} empenhados`,
    texto:
      "A parte do Acordo de Reparação executada pelos órgãos do Governo de Minas Gerais, lida do CKAN oficial (dataset portal_mariana): iniciativa por iniciativa, órgão por órgão, ano a ano.",
    href: "/ambiental/mariana",
    linkTexto: "Ver a execução do Acordo →",
  },
  {
    titulo: "Processos da reparação",
    linha: "Consulta ao vivo ao DataJud (CNJ)",
    texto:
      "Os processos-chave do caso — TTAC, Acordo de 2024, ACPs — com a movimentação consultada na hora na API pública do CNJ. O portal não arquiva nem republica autos.",
    href: "/riodoce/processos",
    linkTexto: "Ver os processos →",
  },
] as const;

// Fases ainda sem página própria (F2 dados espaciais, F4 linha do tempo
// no plano de 12/10). O número da mancha do Fundão é medição real do
// WFS da SEMAD feita em 12/10/2026 (GetFeature resultType=hits) — dito
// como medição, com data, não como acervo publicado.
const EM_CONSTRUCAO = [
  {
    titulo: "Dados espaciais da bacia",
    texto:
      "Camadas da bacia no WFS da SEMAD — a mancha de inundação do Fundão foi medida com 1.243 feições em 12/10/2026 (medição, ainda sem página própria).",
  },
  {
    titulo: "Linha do tempo do caso",
    texto:
      "Do rompimento de 05/11/2015 ao Novo Acordo homologado pelo STF em 06/11/2024 — cada marco com link à fonte oficial. Em construção.",
  },
] as const;

export default function RioDoceHub() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft" aria-label="Trilha">
        <NextLink href="/" className="hover:text-primary">
          Início
        </NextLink>{" "}
        · <span className="text-text">Plataforma Rio Doce</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Plataforma Rio Doce
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        O caso do Rio Doce em um só lugar: o rompimento da barragem de Fundão
        (Samarco, Vale e BHP, 05/11/2015), o Acordo de Reparação e a
        Repactuação homologada pelo STF em 06/11/2024 — com a execução em MG,
        os processos da Justiça e os dados da bacia, cada número apontando a
        fonte oficial de onde veio.
      </p>

      <section aria-labelledby="frentes" className="mt-10">
        <h2 id="frentes" className="font-display text-xl font-semibold">
          O que já está no ar
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {CARTÕES.map((c) => (
            <NextLink
              key={c.href}
              href={c.href}
              className="cp-card-hover flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-current"
            >
              <h3 className="font-display text-lg font-semibold">{c.titulo}</h3>
              <p className="mt-1 font-medium text-primary">{c.linha}</p>
              <p className="mt-2 flex-1 text-[.92em] text-text-soft">{c.texto}</p>
              <p className="mt-3 text-[.85em] font-semibold text-primary">
                {c.linkTexto}
              </p>
            </NextLink>
          ))}
        </div>

        {/* Fases que o plano promete mas que ainda não têm rota. Sem link:
            renderizamos o texto com o estado real, para o leitor saber o
            que existe perto sem cair num 404 (regra editorial: lacuna é
            informação). */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {EM_CONSTRUCAO.map((c) => (
            <div
              key={c.titulo}
              className="flex flex-col rounded-lg border border-dashed border-border bg-surface/50 p-5"
            >
              <h3 className="font-display text-lg font-semibold">
                {c.titulo}{" "}
                <span className="ml-1 align-middle text-[.7em] font-semibold uppercase tracking-wide text-text-soft">
                  em construção
                </span>
              </h3>
              <p className="mt-2 text-[.92em] text-text-soft">{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="fontes" className="mt-12 border-t border-border pt-8">
        <h2 id="fontes" className="font-display text-xl font-semibold">
          De onde vem o dado
        </h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          A execução em MG vem do{" "}
          <strong>CKAN do Governo de Minas Gerais</strong> (dataset
          <code className="mx-1">portal_mariana</code>, nome herdado da cidade
          de origem do desastre). Os processos são consultados ao vivo na{" "}
          <strong>API Pública do DataJud do CNJ</strong> — leia o{" "}
          <a
            href="https://datajud-wiki.cnj.jus.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Termo de Uso da API ↗
          </a>
          . As camadas da bacia vêm do{" "}
          <strong>WFS da SEMAD</strong> (
          <a
            href="https://geoserver.meioambiente.mg.gov.br/IDE/ows"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            geoserver.meioambiente.mg.gov.br ↗
          </a>
          ). O portal da transparência da Fundação Renova também é fonte viva
          do caso, em{" "}
          <a
            href="https://transparencia.fundacaorenova.org/inicio"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            transparencia.fundacaorenova.org ↗
          </a>
          .
        </p>
      </section>

      <OutrasFrentes atual="riodoce" />
    </div>
  );
}
