import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  listarGrupos,
  listarInstituicoes,
  listarProjetos,
  listarUnidades,
  obterInstituicao,
  resumirUniversidades,
} from "@/lib/universidades";
import PainelUniversidades from "../PainelUniversidades";
import { ContatosInstituicao, ListaUnidades } from "../BlocosInstituicao";

/**
 * Página de uma instituição do índice universitário.
 *
 * Papel: dar à instituição uma casa própria, com contato, portais, unidades
 * acadêmicas e os grupos/projetos daquela instituição — sem repetir o dado
 * no código. Tudo vem de `lib/universidades`.
 *
 * Export estático: `generateStaticParams` fixa uma página por sigla; sigla
 * desconhecida vira 404 de verdade (`notFound()`), não soft-404.
 */

interface Props {
  params: Promise<{ sigla: string }>;
}

const TIPO_LABEL: Record<string, string> = {
  federal: "Federal",
  estadual: "Estadual",
  "instituto-federal": "Instituto federal",
  cefet: "CEFET",
  comunitaria: "Comunitária",
  privada: "Privada",
};

export async function generateStaticParams() {
  return listarInstituicoes().map((i) => ({ sigla: i.sigla.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sigla } = await params;
  const instituicao = obterInstituicao(sigla);
  if (!instituicao) {
    return { title: "Instituição não encontrada | Controle Popular" };
  }
  return {
    title: `${instituicao.sigla} — grupos de pesquisa e extensão | Controle Popular`,
    description: `Grupos de pesquisa e projetos de extensão da ${instituicao.nome} (${instituicao.uf}), com área, contato e link para a fonte oficial.`,
  };
}

function dataBr(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export default async function PaginaInstituicao({ params }: Props) {
  const { sigla } = await params;
  const instituicao = obterInstituicao(sigla);
  if (!instituicao) notFound();

  const grupos = listarGrupos({ instituicao: instituicao.sigla });
  const projetos = listarProjetos({ instituicao: instituicao.sigla });
  const unidades = listarUnidades(instituicao.sigla);
  const verificadoEm = resumirUniversidades().verificadoEm;
  const temContato = Boolean(instituicao.contatos || instituicao.links.length);

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
        <Link href="/universidades" className="hover:text-primary hover:underline">
          Universidades
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">{instituicao.sigla}</span>
      </nav>

      <header className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            {TIPO_LABEL[instituicao.tipo] ?? instituicao.tipo}
          </span>
          <span className="rounded-full border border-border bg-surface-2 px-3 py-0.5 text-xs font-semibold text-text-soft">
            {instituicao.uf}
          </span>
          {instituicao.municipios.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-0.5 text-xs font-semibold text-text-soft">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {instituicao.municipios.join(" · ")}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          {instituicao.nome}
        </h1>
        <p className="mt-2 text-sm text-text-soft">
          {instituicao.sigla} · {grupos.length} grupo
          {grupos.length === 1 ? "" : "s"} de pesquisa · {projetos.length} projeto
          {projetos.length === 1 ? "" : "s"} de extensão · acervo de{" "}
          {dataBr(verificadoEm)}
        </p>

        {temContato && <ContatosInstituicao instituicao={instituicao} />}
      </header>

      <ListaUnidades unidades={unidades} />

      <PainelUniversidades
        instituicoes={listarInstituicoes(instituicao.uf)}
        unidades={unidades}
        grupos={grupos}
        projetos={projetos}
        verificadoEm={verificadoEm}
        instituicaoFixa={instituicao.sigla}
      />

      <section className="mt-6 rounded-xl border border-border bg-surface p-4 text-xs text-text-soft">
        <p>
          Fonte do recorte institucional:{" "}
          <a
            href={instituicao.fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            página oficial
          </a>{" "}
          · conferida em {dataBr(instituicao.dataAcesso)}. Onde a fonte não
          publica lista consolidada de grupos, a ficha aponta o portal e não
          inventa registro.
        </p>
      </section>

      <FooterGlobal />
    </main>
  );
}
