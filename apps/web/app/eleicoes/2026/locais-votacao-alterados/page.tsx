import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { IndiceWiki, SecaoWiki, LinksRelacionados } from "@/app/components/wiki";
import DataColeta from "@/app/components/DataColeta";
import TabelaOrdenavel from "../gastos-campanha/TabelaOrdenavel";
import {
  colecao,
  linhasAlteradas,
  resumirPorUf,
} from "@/lib/eleicoes/locais-votacao-2026";
import ListaAlterados from "./ListaAlterados";
import { formatarNumeroBR } from "@/lib/utilitarios/calculos";

/**
 * `/eleicoes/2026/locais-votacao-alterados` — seções eleitorais que o
 * TSE registra em local de votação diferente do que estava publicado
 * originalmente (troca de prédio, endereço ou nome do local).
 *
 * Fonte única: TSE — Dados Abertos, "Eleitorado por local de votação —
 * 2026" (https://dadosabertos.tse.jus.br/dataset/eleitorado-2026),
 * coletado pelo ETL `scripts/etl/eleicoes/coletar-locais-votacao-2026.py`.
 * O portal interativo SIG-Eleicao (sig.tse.jus.br) bloqueia acesso
 * automatizado (403 inclusive no robots.txt — medido em 18/10/2026) e
 * não se burla; o MESMO dado oficial está publicado aberto, com as
 * colunas `*_ORIGINAL` que registram o local de origem.
 *
 * Arquitetura (mesma de `gastos-campanha`): a tabela grande
 * (12.625 linhas) NÃO entra como props de cliente (AGENTS.md § 5.1) —
 * é fatiada em `dados/[arquivo]/route.ts` e baixada pelo navegador via
 * `TabelaEstatica`. Aspas curvas em texto JSX: `react/no-unescaped-entities`
 * rejeita a aspa reta em texto corrente.
 */

const SECOES = [
  { id: "resumo", titulo: "1. O país alterado, de relance" },
  { id: "por-uf", titulo: "2. Alterações por estado" },
  { id: "lista", titulo: "3. Seção a seção" },
  { id: "metodo", titulo: "4. Como medimos" },
];

export const metadata: Metadata = metadataEditavel("/eleicoes/2026/locais-votacao-alterados", {
  title: "Locais de votação alterados 2026 — TSE | Controle Popular",
  description:
    "Seções de votação das Eleições 2026 com local, endereço ou nome de prédio alterados desde a publicação original do TSE, seção a seção, com a fonte oficial. Atualizado a cada 12 h.",
});

// Sem searchParams; force-static para o output:'export' não abortar
// com "missing generateStaticParams()" (padrão de congresso/votacoes).
export const dynamic = "force-static";

const URL_FONTE_SIG = "https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao/home";
const URL_FONTE_ABERTO = "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026";

export default function LocaisVotacaoAlterados(): ReactElement {
  const resumo = resumirPorUf(linhasAlteradas);
  const ufs = resumo.map((u) => u.uf);
  const contagemTipo = {
    predio: linhasAlteradas.filter((l) => l.t === "predio").length,
    endereco: linhasAlteradas.filter((l) => l.t === "endereco").length,
    nome: linhasAlteradas.filter((l) => l.t === "nome").length,
  };
  const maiorUf = [...resumo].sort((a, b) => b.secoes - a.secoes)[0];

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
          ·{" "}
          <Link href="/eleicoes" className="underline-offset-2 hover:underline">
            Eleições
          </Link>{" "}
          · 2026
        </nav>
        <h1 className="font-display text-3xl font-bold">
          Locais de votação alterados nas Eleições 2026
        </h1>
        <ResumoExpandivel
          className="max-w-3xl opacity-80"
          texto={`Do total de ${formatarNumeroBR(colecao.totalSecoes, 0)} seções das Eleições 2026 conforme o arquivo oficial do TSE, ${formatarNumeroBR(colecao.secoesAlteradas, 0)} estão registradas em local de votação diferente do publicado originalmente: ${contagemTipo.predio} trocaram de prédio, ${contagemTipo.endereco} mudaram o endereço do mesmo prédio e ${contagemTipo.nome} só tiveram o nome do local alterado. Cada linha traz a seção, o local atual, o local de origem e o caminho de volta para o arquivo oficial do TSE. O dado é re-coletado a cada 12 horas; o carimbo de geração do TSE está visível no topo.`}
        />
        <DataColeta
          coletadoEm={colecao.geradoEm}
          fonte="TSE — Dados Abertos: Eleitorado por local de votação 2026"
        />
        <div
          className="rounded-lg border-2 p-4"
          style={{ borderColor: "var(--cp-accent)" }}
          role="note"
          aria-label="Sobre a fonte"
        >
          <p className="text-sm opacity-80">
            Fonte:{" "}
            <a
              href={URL_FONTE_ABERTO}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              TSE — Eleitorado por local de votação — 2026 (dados abertos) ↗
            </a>
            . O portal interativo{" "}
            <a
              href={URL_FONTE_SIG}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              SIG-Eleicao ↗
            </a>{" "}
            bloqueia consulta automática (403); a coleta usa o MESMO dado,
            publicado aberto pelo próprio TSE.
          </p>
        </div>
      </header>

      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="resumo" titulo="1. O país alterado, de relance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { rotulo: "Seções alteradas", valor: formatarNumeroBR(colecao.secoesAlteradas, 0) },
            { rotulo: "Seções no país", valor: formatarNumeroBR(colecao.totalSecoes, 0) },
            { rotulo: "Troca de prédio", valor: formatarNumeroBR(contagemTipo.predio, 0) },
            {
              rotulo: "Estado mais alterado",
              valor: `${maiorUf?.uf ?? "—"} (${formatarNumeroBR(maiorUf?.secoes ?? 0, 0)})`,
            },
          ].map((cartao) => (
            <div
              key={cartao.rotulo}
              className="rounded-lg border border-[var(--cp-border)] p-4"
            >
              <p className="text-xs opacity-70">{cartao.rotulo}</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums">
                {cartao.valor}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-70">
          Cartões medidos sobre a coleta de {colecao.geradoEm} — nenhum número digitado à mão.
        </p>
      </SecaoWiki>

      <SecaoWiki id="por-uf" titulo="2. Alterações por estado">
        <TabelaOrdenavel
          colunas={[
            { campo: "uf", rotulo: "UF", formato: "texto" },
            { campo: "secoes", rotulo: "Seções alteradas", numerica: true, formato: "numero" },
            { campo: "municipios", rotulo: "Municípios atingidos", numerica: true, formato: "numero" },
            { campo: "eleitores", rotulo: "Eleitores nessas seções", numerica: true, formato: "numero" },
          ]}
          linhas={resumo}
          campoChave="uf"
          legenda={`Cada linha é um estado; ${resumo.length} UFs têm seções alteradas — ordene por qualquer coluna`}
        />
      </SecaoWiki>

      <SecaoWiki id="lista" titulo="3. Seção a seção">
        <ListaAlterados
          base={`${process.env.PAGES_BASE_PATH ?? ""}/eleicoes/2026/locais-votacao-alterados/dados`}
          ufs={ufs}
        />
        <p className="text-xs opacity-70">
          “Mesmo prédio, endereço novo” costuma ser rua renomeada ou oficializada — o
          endereço original está na linha para conferência.
        </p>
      </SecaoWiki>

      <SecaoWiki id="metodo" titulo="4. Como medimos">
        <ul className="list-disc space-y-2 text-sm opacity-80">
          <li>
            Arquivo oficial único: o painel de dados abertos do TSE, uma leitura por
            coleta, com no máximo três tentativas de re-tentativa.
          </li>
          <li>
            O CSV do mesmo conjunto totaliza o país (duplicata da soma das UFs, medido
            em 18/10/2026) e fica fora do agregado.
          </li>
          <li>
            Alterada é a seção cujo local atual difere do original registrado pelo TSE
            (colunas `*_ORIGINAL` do CSV oficial): número do local, nome do local ou
            endereço.
          </li>
          <li>Espaços residuais não contam como mudança — só alteração real entra.</li>
          <li>
            Rastreado no tempo: o carimbo de geração do arquivo TSE é a data exibida
            no topo; a coleta roda a cada 12 horas.
          </li>
        </ul>
      </SecaoWiki>

      <LinksRelacionados
        links={[
          {
            titulo: "Gastos de campanha 2026",
            descricao: "Publicidade, big tech e custo por voto, na prestação de contas ao TSE.",
            href: "/eleicoes/2026/gastos-campanha",
          },
          {
            titulo: "Cidades do portal",
            descricao: "Escolha um município e veja todos os temas por cidade.",
            href: "/cidades",
          },
        ]}
      />
    </main>
  );
}
