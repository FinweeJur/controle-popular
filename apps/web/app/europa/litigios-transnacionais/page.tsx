/**
 * @file apps/web/app/europa/litigios-transnacionais/page.tsx
 * @description Subfrente "Litígios transnacionais de Mariana e Brumadinho
 * na Europa" (/europa/litigios-transnacionais).
 *
 * Papel no portal: dar destaque ao que hoje só aparecia no hub /europa —
 * a ação contra a BHP no High Court de Londres e as conexões holandesas —
 * com número de processo, fase, linha do tempo, clipping e posicionamentos.
 * Conecta, sem duplicar, as páginas /riodoce, /paraopeba,
 * /paraopeba/linha-do-tempo e /paraopeba/clipping.
 *
 * Fonte oficial principal: [2025] EWHC 3001 (TCC), conferida em
 * caselaw.nationalarchives.gov.uk. O que não foi conferido em fonte oficial
 * aparece com selo de pendência. A ADPF é a 1178, conferida em notícia
 * oficial do STF de 18/08/2025.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import {
  ADPF,
  CLIPPING,
  CONEXOES,
  DATA_ACESSO,
  LINHA_DO_TEMPO,
  LITIGIOS,
  listarFontes,
  POSICIONAMENTOS,
} from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import BlocoAdpf from "./components/BlocoAdpf";
import CartaoConexao from "./components/CartaoConexao";
import CartaoLitigio from "./components/CartaoLitigio";
import Clipping from "./components/Clipping";
import LinhaDoTempo from "./components/LinhaDoTempo";
import ListaFontes from "./components/ListaFontes";
import Posicionamentos from "./components/Posicionamentos";
import ResumoGeral from "./components/ResumoGeral";
import SituacaoAtual from "./components/SituacaoAtual";

export const metadata: Metadata = {
  title: "Litígios transnacionais de Mariana e Brumadinho na Europa | Controle Popular",
  description:
    "Ação contra a BHP no High Court de Londres ([2025] EWHC 3001), ação contra a TÜV SÜD em Munique, conexões holandesas, linha do tempo, clipping e ADPF 1178 — com fonte oficial e data de coleta.",
};

const SECOES = [
  { id: "visao-geral", titulo: "1. Visão geral" },
  { id: "mariana-londres", titulo: "2. Mariana / Londres" },
  { id: "mariana-holanda", titulo: "3. Mariana / Holanda" },
  { id: "brumadinho", titulo: "4. Brumadinho / Alemanha" },
  { id: "braskem-maceio", titulo: "5. Conexão Braskem/Maceió" },
  { id: "linha-do-tempo", titulo: "6. Linha do tempo" },
  { id: "clipping", titulo: "7. Clipping" },
  { id: "posicionamentos", titulo: "8. Posicionamentos" },
  { id: "adpf", titulo: "9. ADPF no STF" },
  { id: "situacao-atual", titulo: "10. Situação atual" },
  { id: "fontes", titulo: "11. Fontes" },
];

const LINKS = [
  {
    href: "/riodoce",
    titulo: "Plataforma Rio Doce",
    descricao: "O caso de Mariana no Brasil: Acordo, execução e processos.",
  },
  {
    href: "/paraopeba",
    titulo: "Plataforma Paraopeba",
    descricao: "O caso de Brumadinho: reparação, auxílio e documentos.",
  },
  {
    href: "/paraopeba/linha-do-tempo",
    titulo: "Linha do tempo do Paraopeba",
    descricao: "Os marcos da reparação de Brumadinho, um por um.",
  },
  {
    href: "/paraopeba/clipping",
    titulo: "Clipping do Paraopeba",
    descricao: "A cobertura de imprensa sobre Brumadinho, com links.",
  },
  {
    href: "/europa",
    titulo: "Hub Europa",
    descricao: "Litígios, devida diligência e concessões europeias no Brasil.",
  },
];

export default function PaginaLitigiosTransnacionais() {
  const fontes = listarFontes();

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6"
    >
      <nav aria-label="Navegação estrutural" className="mb-4 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary hover:underline">Início</Link>
        <span className="mx-2">/</span>
        <Link href="/europa" className="hover:text-primary hover:underline">Europa</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-text">Litígios transnacionais</span>
      </nav>

      <nav aria-label="Outras páginas deste eixo" className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/europa" className="font-medium text-primary hover:underline">Hub Europa</Link>
        <Link href="/europa/legislacao-transnacionais" className="font-medium text-primary hover:underline">Legislação transnacional</Link>
        <Link href="/riodoce" className="font-medium text-primary hover:underline">Rio Doce</Link>
        <Link href="/paraopeba" className="font-medium text-primary hover:underline">Paraopeba</Link>
      </nav>

      <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Litígios transnacionais de Mariana e Brumadinho na Europa
      </h1>
      <div className="mt-3 max-w-3xl">
        <ResumoExpandivel
          className="text-text-soft"
          texto="A ação contra a BHP no High Court de Londres, as conexões holandesas e o que já foi decidido — com número de processo, fase, fonte oficial e data de coleta. Onde a fonte oficial não abriu ou o número não foi conferido, o item aparece marcado como pendente. A ADPF é a 1178, conferida em notícia oficial do STF."
        />
        <p className="mt-2 text-sm text-text-soft">
          Data da coleta e conferência:{" "}
          <time dateTime={DATA_ACESSO}>{formatarDataBR(DATA_ACESSO)}</time>.
        </p>
      </div>

      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="visao-geral" titulo="1. Visão geral">
        <ResumoGeral litigios={LITIGIOS} conexoes={CONEXOES} />
      </SecaoWiki>

      <SecaoWiki id="mariana-londres" titulo="2. Mariana / Londres">
        <CartaoLitigio litigio={LITIGIOS[0]} />
      </SecaoWiki>

      <SecaoWiki id="mariana-holanda" titulo="3. Mariana / Holanda">
        <CartaoLitigio litigio={LITIGIOS[1]} />
      </SecaoWiki>

      <SecaoWiki id="brumadinho" titulo="4. Brumadinho / Alemanha">
        <p className="mb-3 text-sm text-text-soft">
          O caso europeu de Brumadinho é contra a certificadora TÜV SÜD, no
          Tribunal Regional de Munique, e não na Inglaterra ou na Holanda. A
          lei material aplicada é a brasileira; o rito é alemão.
        </p>
        <CartaoLitigio litigio={LITIGIOS[2]} />
        <p className="mt-3 text-sm text-text-soft">
          O acompanhamento da reparação no Brasil fica na frente do Paraopeba.
        </p>
        <Link
          href="/paraopeba"
          className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Ver a frente do Paraopeba →
        </Link>
      </SecaoWiki>

      <SecaoWiki id="braskem-maceio" titulo="5. Conexão Braskem/Maceió">
        <CartaoConexao conexao={CONEXOES[0]} />
      </SecaoWiki>

      <SecaoWiki id="linha-do-tempo" titulo="6. Linha do tempo">
        <LinhaDoTempo itens={LINHA_DO_TEMPO} />
      </SecaoWiki>

      <SecaoWiki id="clipping" titulo="7. Clipping">
        <Clipping itens={CLIPPING} />
      </SecaoWiki>

      <SecaoWiki id="posicionamentos" titulo="8. Posicionamentos">
        <Posicionamentos itens={POSICIONAMENTOS} />
      </SecaoWiki>

      <SecaoWiki id="adpf" titulo="9. ADPF no STF">
        <BlocoAdpf adpf={ADPF} />
      </SecaoWiki>

      <SecaoWiki id="situacao-atual" titulo="10. Situação atual">
        <SituacaoAtual />
      </SecaoWiki>

      <SecaoWiki id="fontes" titulo="11. Fontes">
        <ListaFontes fontes={fontes} />
      </SecaoWiki>

      <LinksRelacionados links={LINKS} />
    </main>
  );
}
