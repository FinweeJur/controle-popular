import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/app/[municipio]/components/Header";
import Footer from "@/app/[municipio]/components/Footer";
import { obterCidadePorSlug, slugsDasCidades } from "@/lib/db/queries/municipios";
import { CidadeProvider } from "@/lib/betim/cidade-cliente";
import { exportandoEstatico } from "@/lib/alvo-de-build";

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
 *
 * ═══ MAS NO GUARA (STANDALONE) É ON-DEMAND ═══
 *
 * Medido em 01-02/10: a zona Cidades é 68 rotas × 12 cidades = ~816 páginas
 * pré-renderizadas, cada uma lendo o banco. Depois que a carga de 01/10
 * populou o Postgres do Guara, cada leitura ficou lenta e o build passou de
 * ~1074s para o teto de 2100s — em quatro deploys seguidos. O volume de
 * páginas não mudou (o build saudável de 01/10 00:30 fez 5.427 páginas em
 * 1074s); o que mudou foi o custo por página.
 *
 * A saída é a MESMA já adotada em `3c529cc2` para as rotas de detalhe:
 * devolver `[]` no `generateStaticParams` e renderizar sob demanda (com
 * cache) no runtime. Só o alvo `output: 'export'` (GitHub Pages) continua
 * precisando da lista inteira — lá não existe sob demanda.
 *
 * O 404 de cidade inexistente continua garantido sem `dynamicParams=false`:
 * o próprio layout chama `obterCidadePorSlug()` e dispara `notFound()`.
 *
 * ═══ POR QUE LITERAL, E NÃO `!exportandoEstatico` ═══
 * O Next lê as configs de segmento ESTATICAMENTE, antes de executar o módulo:
 * só aceita literal (`true`/`false`). `!exportandoEstatico` vira
 * `Unsupported node type "UnaryExpression"` e derruba o build inteiro
 * ("Invalid segment configuration export detected", medido 02/10/2026 no
 * commit `d698994f`). Runtime (Guara/Cloudflare) quer `true`; só o
 * `output: 'export'` do GitHub Pages quer `false` — alvo fora da fila desde
 * 22/08. Por isso o literal `true`. Se o Pages voltar, esta rota precisa de
 * um layout de export próprio (a extensão `*.din.ts` não cobre layout).
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  // No Guara/Cloudflare a lista fica vazia: a página vira on-demand.
  if (!exportandoEstatico) return [];
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
      <main id="conteudo-principal" tabIndex={-1} className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
        {children}
      </main>
      <Footer cidade={cidade} />
    </CidadeProvider>
  );
}
