import type { Metadata } from "next";
import Link from "next/link";
import CartoesResumo from "@/app/components/CartoesResumo";
import FooterGlobal from "@/app/components/FooterGlobal";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import {
  INSTITUICOES,
  UNIDADES,
  listarGrupos,
  listarProjetos,
  resumirUniversidades,
} from "@/lib/universidades";
import PainelUniversidades from "./PainelUniversidades";

/**
 * `/universidades` — índice de pesquisa e extensão universitária.
 *
 * Papel no portal: reunir, num só lugar, grupos de pesquisa e projetos de
 * extensão das instituições brasileiras, com área, unidade, contato e link
 * para a fonte oficial. Começa por Minas Gerais e cresce por levas.
 *
 * De onde vem o número do topo: `resumirUniversidades()` calcula do próprio
 * acervo. Nenhum total é digitado à mão (QUALIDADES-DA-INFORMACAO.md, item 4).
 *
 * Por que o filtro roda no cliente: o portal é export estático; ler
 * `searchParams` no servidor quebraria o alvo Cloudflare. O acervo vai como
 * props para o painel, que filtra sem recarregar. Acima de ~2 mil registros o
 * painel deixa de ser suficiente e a lista passa a ser fatiada (AGENTS §5.1).
 */

export const metadata: Metadata = {
  title:
    "Universidades: grupos de pesquisa e extensão por área e instituição | Controle Popular",
  description:
    "Índice de grupos de pesquisa e projetos de extensão das universidades brasileiras, com busca por nome, área temática, área do conhecimento, estado, instituição e faculdade, além de contatos e link para a fonte oficial.",
};

const RESUMO = resumirUniversidades();
const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function PaginaUniversidades() {
  const grupos = listarGrupos();
  const projetos = listarProjetos();
  const verificadoEm = RESUMO.verificadoEm.split("-").reverse().join("/");

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Universidades</span>
      </nav>

      <header className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🎓 Pesquisa e extensão
          </span>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            🗺️ Começa por Minas Gerais
          </span>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            🔗 Fonte oficial em cada registro
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Universidades: pesquisa e extensão
        </h1>

        <ResumoExpandivel
          className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft"
          texto={
            `Índice de ${fmt(RESUMO.grupos)} grupos de pesquisa e ${fmt(RESUMO.projetos)} projetos de extensão ` +
            `de ${fmt(RESUMO.instituicoes)} instituições. Busque por nome, líder, área temática, ` +
            `área do conhecimento, estado, instituição ou faculdade. Cada cartão traz o contato ` +
            `institucional e o link para a fonte oficial. Onde a fonte não publica lista consolidada, ` +
            `a ficha aponta o portal certo — grupo não é inventado.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="mb-6">
        <CartoesResumo
          colunas={4}
          itens={[
            {
              rotulo: "Grupos de pesquisa",
              valor: RESUMO.grupos,
              destaque: true,
              detalhe: `acervo de ${verificadoEm}`,
            },
            { rotulo: "Projetos de extensão", valor: RESUMO.projetos },
            { rotulo: "Instituições", valor: RESUMO.instituicoes },
            { rotulo: "Unidades acadêmicas", valor: RESUMO.unidades },
            { rotulo: "Grandes áreas", valor: RESUMO.areasConhecimento },
            { rotulo: "Temas transversais", valor: RESUMO.temas },
            { rotulo: "Áreas predominantes", valor: RESUMO.areas },
            { rotulo: "Estados cobertos", valor: RESUMO.ufs },
          ]}
        />
      </section>

      <PainelUniversidades
        instituicoes={INSTITUICOES}
        unidades={UNIDADES}
        grupos={grupos}
        projetos={projetos}
        verificadoEm={RESUMO.verificadoEm}
      />

      <FooterGlobal />
    </main>
  );
}
