import type { Metadata } from "next";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import { listarTodasEntidades } from "@/lib/empresas/entidades-dados";
import { contarPorSetor, hrefSetor, setorDe } from "@/lib/empresas/facetas-setor";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import CabecalhoObservatorio from "./CabecalhoObservatorio";
import EmpresasClient from "./EmpresasClient";
import SecaoPaginasRelacionadas from "@/app/components/SecaoPaginasRelacionadas";

/**
 * @file `/empresas` — Observatório de Grandes Empresas & Fundos.
 *
 * O QUE É: a listagem principal do acervo (130 entidades), com a ficha de cada
 * uma em `/empresas/[slug]`.
 *
 * O QUE MUDOU (02/11/2026): ganhou a faixa de facetas por setor estratégico,
 * com estado na URL (`?setor=mineracao|energia|...`). O painel é renderizado
 * no servidor e cada botão é LINK — nada de `useState` segurando coleção
 * (AGENTS §5.1) e a casca não desmonta entre um clique e outro (§5.13).
 *
 * O QUE NÃO MUDOU, DE PROPÓSITO: o `EmpresasClient` continua inteiro — busca
 * textual, filtros de país/tipo/risco ESG, ordenação por coluna e exportação
 * CSV. A faceta só define o recorte de chegada; dentro da página o filtro
 * instantâneo segue funcionando sobre as 130 entidades. Trocar a faceta não
 * apaga a busca nem a ordenação: o recorte chega como prop e o cliente ajusta
 * o próprio estado sem remontar.
 *
 * POR QUE ESTAS ROTAS NÃO VIRARAM FACETA: `/empresas/fortunas` (1.000
 * fortunas), `/empresas/conglomerados` (grafo de holdings), `/empresas/
 * executivos` (painel de executivos e porta giratória) e `/empresas/documentos`
 * (biblioteca de 520 documentos) têm acervo, cliente e números próprios — são
 * conteúdo, não recorte. Fundir por prefixo destruiria dado, que é exatamente
 * o erro que este trabalho não repete. Elas ficam linkadas acima e abaixo.
 *
 * NÚMEROS: o N de cada faceta é medido em `contarPorSetor`, sobre o mesmo
 * array que alimenta a lista; o denominador (`entidades.length`) aparece por
 * extenso na nota da faixa. Nenhum número fixo nesta página.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Observatório de Grandes Empresas & Fundos de Investimento — Controle Popular",
  description:
    "Monitoramento cívico das 130 maiores empresas e fundos atuantes no Brasil: ações na B3 e NYSE, transparência, ESG, direitos humanos, licenciamentos ambientais, contratos no PNCP e TACs.",
};

export default async function EmpresasIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const entidades = listarTodasEntidades();
  const facetas = contarPorSetor(entidades);
  // Slug inválido cai em "Todos": link antigo ou digitado não derruba a página.
  const setorAtivo = setorDe(params.setor, facetas);
  const facetaAtiva = facetas.find((faceta) => faceta.slug === setorAtivo);
  const total = entidades.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-8">
      <CaminhoSistema rota="/empresas" />

      {/* Título e as quatro portas para os acervos irmãos. */}
      <CabecalhoObservatorio />

      {/* Faixa de facetas por setor: LINK com estado na URL, render no servidor.
          O N vem do acervo inteiro; o recorte escolhido é o estado inicial da
          lista abaixo, sem apagar busca, ordenação nem exportação. */}
      <section aria-label="Recorte do observatório por setor" className="space-y-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <PainelFacetas
          facetas={facetas}
          atual={setorAtivo}
          total={total}
          hrefDe={(slug) => hrefSetor(slug)}
          titulo="Recorte por setor estratégico"
          ariaLabel="Recorte do observatório por setor"
          rotuloTodos="Todos os setores"
          nota={`N = entidades mapeadas no setor. Ao todo, ${total} entidades em ${facetas.length} setores.`}
        />
        <p className="text-sm text-muted">
          {facetaAtiva
            ? `Mostrando ${facetaAtiva.n} das ${total} entidades — recorte: ${facetaAtiva.rotulo}.`
            : `Mostrando as ${total} entidades do acervo.`}{" "}
          Busca, ordenação e exportação CSV atuam sobre o que a lista exibe.
        </p>
      </section>

      {/* Painel Interativo com Gráficos, Filtros e Tabela */}
      <EmpresasClient entidades={entidades} setorInicial={setorAtivo} />

      {/* Seção de Páginas Relacionadas e Cruzamentos Cívicos */}
      <SecaoPaginasRelacionadas
        titulo="Investigações & Conexões Corporativas"
        subtitulo="Cruze o poder econômico das empresas com as fortunas globais, governança e impactos no território."
        paginas={[
          {
            href: "/empresas/fortunas",
            titulo: "1.000 Maiores Fortunas Mundiais",
            descricao: "Mapeamento das dinastias e bilionários que controlam as corporações e fundos globais.",
            badge: "Fortunas",
            icone: "dinheiro",
          },
          {
            href: "/empresas/conglomerados",
            titulo: "Monopólios e Redes de Controle",
            descricao: "Grafo interativo das holdings, fundos Big Three e cartéis de grãos e mineração.",
            badge: "Holdings",
            icone: "rede",
          },
          {
            href: "/empresas/executivos",
            titulo: "CEOs e Conselhos Corporativos",
            descricao: "Os principais diretores e conselheiros estatutários e diretorias entrelaçadas.",
            badge: "Governança",
            icone: "empresa",
          },
          {
            href: "/canada/mineracao",
            titulo: "Mineradoras Canadenses no Brasil",
            descricao: "Corporações listadas na TSX com concessões de lavra e barragens de rejeitos na ANM.",
            badge: "Mineração",
            icone: "mineracao",
          },
          {
            href: "/ambiental/barragens-globais",
            titulo: "Grandes Barragens Mundiais",
            descricao: "Monitoramento das barragens de rejeitos operadas pelas grandes mineradoras privadas.",
            badge: "Barragens",
            icone: "barragem",
          },
          {
            href: "/ambiental/crise-climatica",
            titulo: "Observatório da Crise Climática",
            descricao: "As maiores fontes de emissão de gases de efeito estufa das petrolíferas e indústrias.",
            badge: "Clima",
            icone: "clima",
          },
        ]}
      />

      {/* Rodapé Metodológico */}
      <footer className="border-t border-border pt-6 text-xs text-muted space-y-2">
        <p>
          <strong>Fontes Oficiais:</strong> Comissão de Valores Mobiliários (CVM), Portal Nacional de Contratações Públicas (PNCP), 
          Sistema de Gestão de Segurança de Barragens (SIGBM/ANM), FEAM-MG, IBAMA, SEC (EUA) e Ministérios Públicos (MPMG e MPF).
        </p>
        <p>
          O Controle Popular não emite recomendações de investimento. O foco é a fiscalização do cumprimento da legislação brasileira,
          dos direitos humanos, da sustentabilidade ambiental e da destinação de recursos públicos.
        </p>
      </footer>
    </div>
  );
}
