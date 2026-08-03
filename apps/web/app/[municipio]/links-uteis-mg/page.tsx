import { notFound } from "next/navigation";
import { temFonte } from "@/lib/db/queries/municipios";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Links Úteis do Estado — ${nomePortal(c)}`,
  (c) => `Fontes oficiais de dados públicos de Minas Gerais, organizadas por tema — meio ambiente, contas públicas, segurança e dados abertos.`
);

interface LinkItem {
  nome: string;
  desc: string;
  href: string;
  status?: string;
}

interface Tema {
  titulo: string;
  links: LinkItem[];
}

// Fontes pesquisadas ao vivo (WebFetch/curl) durante a construção do
// portal — ver docs/ambiental-pecma-research.md e docs/F0-discovery.md
// pro detalhe de cada pesquisa. "status" só aparece quando já verificamos
// se tem API/dataset aberto ou não; sem "status" = página institucional,
// não pesquisamos disponibilidade de dados estruturados ainda.
const TEMAS: Tema[] = [
  {
    titulo: "Meio Ambiente e Proteção Civil",
    links: [
      {
        nome: "Desativando Bombas-Relógio (MPMG)",
        desc: "Situação das barragens de mineração em MG. Nenhuma em Betim, mas Igarapé, Itatiaiuçu e Sarzedo (limítrofes) aparecem na lista.",
        href: "https://barragens.mpmg.mp.br/",
        status: "Página institucional, sem API — dados em HTML",
      },
      {
        nome: "PECMA — Conversão de Multas Ambientais (SEMAD)",
        desc: "Programa estadual que converte multas ambientais em ações de recuperação.",
        href: "https://meioambiente.mg.gov.br/pecma",
        status: "Sem dataset aberto — consulta só via Portal Ecosistemas com login",
      },
      {
        nome: "Consulta de TACs Ambientais (Ecosistemas/GTAC)",
        desc: "Termos de Ajustamento de Conduta ambientais firmados com o MPMG.",
        href: "https://ecosistemas.meioambiente.mg.gov.br/gtac/acessoExterno",
        status: "Ainda não confirmamos se dá pra buscar por município sem login",
      },
      {
        nome: "Defesa Civil de Minas Gerais",
        desc: "Alertas estaduais de risco geológico e climático.",
        href: "https://www.defesacivil.mg.gov.br/",
      },
    ],
  },
  {
    titulo: "Contas Públicas e Transparência",
    links: [
      {
        nome: "Tribunal de Contas de Minas Gerais (TCE-MG)",
        desc: "Fiscalização de contas de municípios e prestação de contas.",
        href: "https://www.tce.mg.gov.br/",
      },
      {
        nome: "Portal de Dados Abertos de Minas Gerais",
        desc: "Portal CKAN geral do Estado — datasets de várias secretarias.",
        href: "https://dados.mg.gov.br/",
        status: "API exige autenticação (confirmado 2026-07-21, ver research doc)",
      },
      {
        nome: "Assembleia Legislativa de MG (ALMG)",
        desc: "Emendas parlamentares estaduais e legislação mineira.",
        href: "https://www.almg.gov.br/",
      },
    ],
  },
  {
    titulo: "Segurança Pública",
    links: [
      {
        nome: "Secretaria de Justiça e Segurança Pública de MG (Sejusp)",
        desc: "Estatísticas de criminalidade por município.",
        href: "https://www.seguranca.mg.gov.br/",
      },
    ],
  },
  {
    titulo: "Ministério Público de Minas Gerais",
    links: [
      {
        nome: "Portal MPMG",
        desc: "Notícias, atuação institucional e transparência do MPMG.",
        href: "https://www.mpmg.mp.br/",
      },
      {
        nome: "Consulta de documento de TAC (por ID)",
        desc: "Visualizador de um Termo de Ajustamento de Conduta específico, quando já se sabe o número.",
        href: "https://transparencia.mpmg.mp.br/",
      },
    ],
  },
];

export default async function LinksUteisMGPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  // Os links são de órgãos de Minas Gerais. Em São Paulo a página existiria
  // apontando para a Sejusp e o MPMG errados — pior que não existir.
  if (!temFonte(cidade, "links_uteis_mg")) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Links Úteis do Estado
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Fontes oficiais de Minas Gerais que usamos (ou avaliamos usar) na
        pesquisa deste portal, organizadas por tema. Quando ainda não
        confirmamos se a fonte tem dados abertos pra integrar de verdade,
        isso aparece marcado abaixo do link.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {TEMAS.map((tema) => (
          <section key={tema.titulo}>
            <h2 className="mb-4 font-display text-lg font-semibold text-text">
              {tema.titulo}
            </h2>
            <div className="flex flex-col gap-3">
              {tema.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cp-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
                >
                  <p className="font-display font-semibold text-text">{link.nome}</p>
                  <p className="mt-1 text-sm text-text-soft">{link.desc}</p>
                  {link.status ? (
                    <p className="mt-2 text-xs font-medium text-accent">{link.status}</p>
                  ) : null}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
