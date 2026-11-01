import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, GraduationCap } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Principal hub do módulo de Direitos Comparados.
 *
 * Papel: centralizar o acesso às duas frentes principais:
 * 1. Comparador de indicadores entre estados.
 * 2. Educação, pesquisa e extensão — página única em `/universidades`.
 *
 * A antiga página `/direitos-comparados/pesquisa` era uma maquete com
 * números fixos e não mostrava a lista real. O acervo oficial de grupos e
 * projetos vive em `/universidades`; a duplicata saiu do ar.
 * Integração: Eixo 1 - Direitos em Movimento.
 */

export const metadata: Metadata = {
  title: "Direitos Comparados | Controle Popular",
  description: "Compare indicadores de direitos fundamentais entre estados e acesse o índice de educação, pesquisa e extensão das universidades.",
};

export default function PaginaDireitosComparados() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Direitos Comparados</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Direitos Comparados
        </h1>
        <p className="mt-3 text-lg text-text-soft">
          Análise comparativa de indicadores sociais, produção científica e impacto das instituições de ensino no desenvolvimento dos direitos fundamentais no Brasil.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Comparador de Indicadores */}
        <Card
          icon={<BarChart3 className="h-8 w-8" />}
          title="Comparador de Indicadores"
          description="Compare dados de desenvolvimento humano, educação, saúde, justiça, trabalho e finanças entre estados e municípios."
          href="/direitos-comparados/indicadores"
          keywords={["IDH", "Educação", "Saúde", "Justiça", "Trabalho", "Finanças"]}
        />

        {/* Educação, pesquisa e extensão */}
        <Card
          icon={<GraduationCap className="h-8 w-8" />}
          title="Educação, pesquisa e extensão"
          description="Índice real de grupos de pesquisa e projetos de extensão das universidades, com filtros por área, instituição e estado."
          href="/universidades"
          keywords={["Educação", "Pesquisa", "Extensão", "Universidades", "CNPq"]}
        />
      </div>

      <section className="mt-12 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-bold text-text">Metodologia e Fontes</h2>
        <div className="space-y-4 text-sm text-text-soft">
          <p>
            <strong>Dados oficiais:</strong> IBGE, INEP, MS, CNJ, TSE, MEC, CAPES, CNPq e Portal da Transparência.
          </p>
          <p>
            <strong>Períodos:</strong> Dados mais recentes disponíveis (2023-2024), com séries históricas quando possível.
          </p>
          <p>
            <strong>Atualização:</strong> Indicadores atualizados conforme disponibilização pelas fontes oficiais.
          </p>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  keywords: string[];
}

function Card({ icon, title, description, href, keywords }: CardProps) {
  return (
    <Link href={href} className="block rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary hover:shadow-md">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-text">{title}</h3>
      <p className="mb-4 text-sm text-text-700">{description}</p>
      <div className="flex flex-wrap gap-1">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
          >
            {keyword}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center text-sm text-primary hover:text-primary/80">
        <span>Acessar</span>
        <ArrowRight className="ml-1 h-4 w-4" />
      </div>
    </Link>
  );
}