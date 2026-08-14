import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/app/[municipio]/components/Header";
import Footer from "@/app/[municipio]/components/Footer";
import { obterCidadePorSlug, slugsDasCidades } from "@/lib/db/queries/municipios";
import { CidadeProvider } from "@/lib/betim/cidade-cliente";

/**
 * Zona do eixo Cidades, uma cidade por slug: `/betim`, `/bh`, `/sp`.
 *
 * O `<html>`, as fontes e o ThemeProvider vêm do layout raiz; aqui fica só
 * o que é da cidade.
 *
 * POR QUE `[municipio]` NA RAIZ, e não `/cidades/[municipio]`: as 54 URLs
 * do Betim já estão em produção e indexadas. Com o segmento dinâmico na
 * raiz elas não mudam — `/betim/contratos` continua `/betim/contratos` — e
 * uma cidade nova entra como `/bh/contratos`. O Next resolve segmentos
 * ESTÁTICOS antes dos dinâmicos, então `/congresso` e `/judiciario`
 * continuam apontando para as pastas deles, não para cá.
 *
 * `dynamicParams = false` é o que fecha a porta: sem isso, qualquer
 * caminho de um segmento (`/qualquercoisa`) entraria nesta zona e tentaria
 * renderizar uma cidade inexistente. Com ele, só os slugs devolvidos por
 * `generateStaticParams` existem; o resto é 404.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  // Uma cidade nova é UMA LINHA em `municipios` — nenhum código de rota.
  return (await slugsDasCidades()).map((municipio) => ({ municipio }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string }>;
}): Promise<Metadata> {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return {};
  return {
    title: `Controle Popular ${cidade.nome} — Portal independente de transparência de ${cidade.nome}-${cidade.uf}`,
    description: `Dados públicos sobre contratos, finanças, câmara e serviços de ${cidade.nome}-${cidade.uf}, reunidos em um só lugar. Portal independente, sem vínculo com a Prefeitura ou a Câmara.`,
  };
}

export default async function CidadeLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ municipio: string }> }>) {
  const { municipio } = await params;
  // Cinto e suspensório junto com `dynamicParams = false`: se a cidade for
  // desativada em `municipios` sem um rebuild, isto degrada para 404 em vez
  // de renderizar uma página sem dado.
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) notFound();

  return (
    // O provider existe para os componentes CLIENT (DataCard, PedidoLAI,
    // AssistenteChat, ZapCard), que não podem consultar o banco nem
    // receber `params`. Header e Footer são de servidor e recebem a cidade
    // direto por prop.
    <CidadeProvider cidade={cidade}>
      <Header cidade={cidade} />
      <main id="conteudo-principal" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer cidade={cidade} />
    </CidadeProvider>
  );
}
