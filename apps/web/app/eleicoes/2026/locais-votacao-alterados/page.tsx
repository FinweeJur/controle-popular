import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import BotaoBrilho from "@/app/components/react-bits/BotaoBrilho";
import { IndiceWiki, SecaoWiki } from "@/app/components/wiki";

/**
 * `/eleicoes/2026/locais-votacao-alterados` -indice de FONTES OFICIAIS sobre
 * locais de votacao alterados nas Eleicoes 2026.
 *
 * Versao de 19/10/2026: sem nenhum calculo proprio. Depois das materias do
 * G1 e O Globo (17-18/10) apontarem que a contagem depende da janela e da
 * regra (mudanca entre turnos vs. mudanca desde a publicacao original), a
 * pagina passa a apenas APONTAR para o TSE e cada TRE, replicando os links
 * oficiais na integra. O numero vem do orgao; o portal nao embrulha.
 */

const SECOES = [
  { id: "tse", titulo: "1. Fontes nacionais (TSE)" },
  { id: "tres", titulo: "2. Fontes por estado (TREs)" },
];

export const metadata: Metadata = metadataEditavel(
  "/eleicoes/2026/locais-votacao-alterados",
  {
    title: "Locais de votação alterados 2026 - fontes oficiais | Controle Popular",
    description:
      "Onde consultar oficialmente as seções eleitorais das Eleições 2026 com local alterado: portal SIG-Eleição, dados abertos do TSE e a página de cada TRE do Brasil.",
  },
);

export const dynamic = "force-static";

const FONTES_TSE = [
  {
    rotulo: "SIG-Eleição (consulta interativa do TSE)",
    url: "https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao/home",
    nota:
      "Consulta oficial seção a seção. O portal bloqueia consulta automática (403, inclusive no robots.txt), por isso aqui só apontamos: use no navegador.",
  },
  {
    rotulo: "Dados abertos: Eleitorado por local de votação 2026",
    url: "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026",
    nota:
      "Arquivos CSV oficiais, abertos para download, com as colunas do local original e do local atual de cada seção.",
  },
  {
    rotulo: "Página de Eleições 2026 do TSE",
    url: "https://www.tse.jus.br/eleicoes/eleicoes-2026",
    nota:
      "Notas e comunicados oficiais do tribunal sobre locais de votação, horários e mudanças divulgadas.",
  },
];

type Uf = { uf: string; nome: string };

const UFS: Uf[] = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

function urlTre(uf: Uf): string {
  const sigla = uf.uf.toLowerCase();
  return `https://www.tre-${sigla}.jus.br/eleicoes`;
}

export default function LocaisVotacaoAlterados(): ReactElement {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10"
    >
      <header className="space-y-3">
        <nav aria-label="Navegação estrutural" className="text-xs opacity-70">
          <Link href="/" className="underline-offset-2 hover:underline">
            Início
          </Link>{" "}
          •{" "}
          <Link href="/eleicoes" className="underline-offset-2 hover:underline">
            Eleições
          </Link>{" "}
          • 2026
        </nav>
        <h1 className="font-display text-3xl font-bold">
          Locais de votação alterados nas Eleições 2026: fontes oficiais
        </h1>
        <p className="max-w-3xl text-sm opacity-80">
          Esta página não calcula nada. Imprensa e tribunal usaram janelas e
          regras diferentes para contar as mudanças de local de votação, então
          aqui você vai direto à fonte: o TSE e o TRE do seu estado. Todo link
          abaixo é oficial.
        </p>
      </header>

      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="tse" titulo="1. Fontes nacionais (TSE)">
        <ul className="space-y-4">
          {FONTES_TSE.map((fonte) => (
            <li key={fonte.url} className="rounded-lg border border-[var(--cp-border)] p-4">
              <BotaoBrilho raio={12} forca={0.18} afastamento={40}>
                <a
                  href={fonte.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg border-2 px-4 py-2 font-semibold underline-offset-2 hover:underline"
                  style={{ borderColor: "var(--cp-accent)" }}
                >
                  Abrir no site do TSE →
                </a>
              </BotaoBrilho>
              <p className="mt-3 font-semibold">{fonte.rotulo}</p>
              <p className="mt-1 text-xs opacity-70">{fonte.nota}</p>
              <p className="mt-1 break-all text-xs opacity-50">{fonte.url}</p>
            </li>
          ))}
        </ul>
      </SecaoWiki>

      <SecaoWiki id="tres" titulo="2. Fontes por estado (TREs)">
        <p className="text-sm opacity-80">
          Cada TRE publica a lista de locais de votação do próprio estado. Escolha
          o seu: o botão é puxado pelo cursor, aponte e clique.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UFS.map((uf) => (
            <div
              key={uf.uf}
              className="rounded-lg border border-[var(--cp-border)] p-3"
            >
              <BotaoBrilho raio={10} forca={0.2} afastamento={36}>
                <a
                  href={urlTre(uf)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border-2 px-3 py-1.5 text-sm font-semibold"
                  style={{ borderColor: "var(--cp-accent)" }}
                >
                  {uf.uf} · {uf.nome}
                </a>
              </BotaoBrilho>
              <p className="mt-2 break-all text-xs opacity-50">
                tre-{uf.uf.toLowerCase()}.jus.br
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs opacity-70">
          Última conferência dos links: 19/10/2026. Nenhum número nesta página é
          cálculo próprio: a contagem oficial é a de cada tribunal citado.
        </p>
      </SecaoWiki>
    </main>
  );
}
