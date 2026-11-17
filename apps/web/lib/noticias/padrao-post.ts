/**
 * @file Vigia do padrão de post de serviço (regra 5.19).
 *
 * O QUE PROTEGE: que a camada editorial do post não desapareça numa refatoração
 * silenciosa. O defeito que este vigia pega é o que não quebra build:
 * - alguém troca `<MetricaValor>` por `{m.valor}` e o número deixa de contar;
 * - o gráfico perde `BarraAnimada` e vira barra estática;
 * - a tabela volta a ser `<table>` de servidor e perde busca e ordenação;
 * - o post de serviço novo nasce sem “O essencial”, sem olho ou com slug
 *   técnico.
 *
 * COMO FUNCIONA: duas camadas, ambas determinísticas e sem navegador.
 * 1. **Componentes:** lê o texto dos arquivos do post e exige os imports e os
 *    marcadores que provam a animação e a interação.
 * 2. **Dados:** para posts de serviço publicados a partir de `DESDE`, exige
 *    `essencial` (3 a 5), `olho`, fonte em tabela/gráfico e slug legível.
 *
 * POR QUE NÃO UM TESTE DE NAVEGADOR: animação real exige Playwright e servidor
 * no CI. A prova estática pega a regressão que importa (o componente deixou de
 * ser usado) e roda no hook e na suíte em menos de um segundo.
 *
 * O vigia roda em `scripts/vigia-post-servico.mts` (pre-commit) e no teste
 * `lib/noticias/padrao-post.test.ts` (suíte e CI).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** A regra vale para posts publicados desta data em diante. */
export const DESDE = "2026-11-17";

/** Slug de certame técnico: "uemg-pss-2027-...", "edital-2026-...". */
const SLUG_TECNICO = /(^|-)(pss|edital)-\d{4}(-|$)/i;

/** O que faz um post ser de serviço, para a exigência de camada editorial. */
const TEMA_SERVICO = /(edital|concurso|processo seletivo|vaga|inscri[cç][aã]o)/i;

const SLUG_MAX = 60;

export interface FalhaVigia {
  regra: string;
  detalhe: string;
}

export interface ResultadoVigia {
  componentesOk: boolean;
  postsConferidos: number;
  falhas: FalhaVigia[];
}

interface PostBruto {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  publicadoEm: string;
  palavrasChave?: string[];
  essencial?: string[];
  olho?: { texto?: string };
  tabela?: { fonte?: { url?: string } };
  tabelas?: { fonte?: { url?: string } }[];
  grafico?: { fonte?: { url?: string } };
  fontesOficiais?: { url?: string }[];
}

function lerArquivo(raiz: string, ...partes: string[]): string | null {
  const caminho = join(raiz, ...partes);
  if (!existsSync(caminho)) return null;
  return readFileSync(caminho, "utf-8");
}

/** Uma exigência de marcador em arquivo, com nome acionável na mensagem. */
interface Checagem {
  arquivo: string;
  conteudo: string | null;
  trecho: string;
  regra: string;
}

/** Exige uma string no arquivo; registra a falha com arquivo e marcador. */
function exigir(falhas: FalhaVigia[], checagem: Checagem): boolean {
  if (checagem.conteudo?.includes(checagem.trecho)) return true;
  falhas.push({
    regra: checagem.regra,
    detalhe: `${checagem.arquivo} não contém "${checagem.trecho}"`,
  });
  return false;
}

/** Confere a fiação dos componentes do post. */
function conferirComponentes(raiz: string, falhas: FalhaVigia[]): boolean {
  const antes = falhas.length;
  const dir = "apps/web/app/noticias/[slug]";
  const metricas = lerArquivo(raiz, dir, "SecaoMetricas.tsx");
  const metricaValor = lerArquivo(raiz, dir, "MetricaValor.tsx");
  const grafico = lerArquivo(raiz, dir, "GraficoBarrasArtigo.tsx");
  const tabelas = lerArquivo(raiz, dir, "SecaoTabelas.tsx");
  const tabelaInterativa = lerArquivo(raiz, dir, "TabelaInterativa.tsx");
  const pagina = lerArquivo(raiz, dir, "page.tsx");

  exigir(falhas, { arquivo: "SecaoMetricas.tsx", conteudo: metricas, trecho: "<MetricaValor", regra: "countup nos cartões" });
  if (metricas && />\s*\{m\.valor\}\s*</.test(metricas)) {
    falhas.push({
      regra: "countup nos cartões",
      detalhe: "SecaoMetricas.tsx renderiza {m.valor} direto, sem MetricaValor",
    });
  }
  exigir(falhas, { arquivo: "MetricaValor.tsx", conteudo: metricaValor, trecho: "ContadorAnimado", regra: "countup nos cartões" });

  exigir(falhas, { arquivo: "GraficoBarrasArtigo.tsx", conteudo: grafico, trecho: "BarraAnimada", regra: "gráfico animado com legenda dentro" });
  exigir(falhas, { arquivo: "GraficoBarrasArtigo.tsx", conteudo: grafico, trecho: "ContadorAnimado", regra: "gráfico animado com legenda dentro" });
  exigir(falhas, { arquivo: "GraficoBarrasArtigo.tsx", conteudo: grafico, trecho: "fracao >=", regra: "gráfico animado com legenda dentro" });

  exigir(falhas, { arquivo: "SecaoTabelas.tsx", conteudo: tabelas, trecho: "TabelaInterativa", regra: "tabela filtrável e ordenável" });
  for (const trecho of ["filtrarLinhas", "ordenarLinhas", "aria-sort", "aria-live"]) {
    exigir(falhas, { arquivo: "TabelaInterativa.tsx", conteudo: tabelaInterativa, trecho, regra: "tabela filtrável e ordenável" });
  }

  exigir(falhas, { arquivo: "page.tsx", conteudo: pagina, trecho: "ResumoEssencial", regra: "camada de jornal" });
  exigir(falhas, { arquivo: "page.tsx", conteudo: pagina, trecho: "OlhoArtigo", regra: "camada de jornal" });
  exigir(falhas, { arquivo: "page.tsx", conteudo: pagina, trecho: "TextoComLinks", regra: "camada de jornal" });

  return falhas.length === antes;
}

/** Essencial de 3 a 5 linhas e olho com texto. */
function conferirCamadaEditorial(post: PostBruto, falhas: FalhaVigia[]): void {
  const essencial = post.essencial ?? [];
  if (essencial.length < 3 || essencial.length > 5) {
    falhas.push({
      regra: "essencial de 3 a 5 linhas",
      detalhe: `${post.slug}: ${essencial.length} linha(s)`,
    });
  }
  if (!post.olho?.texto?.trim()) {
    falhas.push({ regra: "olho com texto", detalhe: `${post.slug}: sem olho` });
  }
}

/** Fonte HTTP presente no registro (tabela ou gráfico). */
function temFonteHttp(registro?: { fonte?: { url?: string } }): boolean {
  return Boolean(registro?.fonte?.url?.startsWith("http"));
}

/** Toda tabela precisa de fonte oficial. */
function conferirFontesTabelas(post: PostBruto, falhas: FalhaVigia[]): void {
  const tabelas = [...(post.tabelas ?? []), ...(post.tabela ? [post.tabela] : [])];
  for (const tabela of tabelas) {
    if (!temFonteHttp(tabela)) {
      falhas.push({ regra: "fonte em toda tabela", detalhe: `${post.slug}: tabela sem fonte` });
    }
  }
}

/** O gráfico, quando existe, precisa de fonte oficial. */
function conferirFonteGrafico(post: PostBruto, falhas: FalhaVigia[]): void {
  if (!post.grafico) return;
  if (temFonteHttp(post.grafico)) return;
  falhas.push({ regra: "fonte no gráfico", detalhe: `${post.slug}: gráfico sem fonte` });
}

/** Pelo menos uma fonte oficial no bloco de fontes. */
function conferirFonteOficial(post: PostBruto, falhas: FalhaVigia[]): void {
  const tem = (post.fontesOficiais ?? []).some((f) => f.url?.startsWith("http"));
  if (!tem) falhas.push({ regra: "fonte oficial", detalhe: `${post.slug}: sem fonte oficial` });
}

/** Toda tabela e todo gráfico precisam de fonte oficial. */
function conferirFontes(post: PostBruto, falhas: FalhaVigia[]): void {
  conferirFontesTabelas(post, falhas);
  conferirFonteGrafico(post, falhas);
  conferirFonteOficial(post, falhas);
}

/** Slug curto, minúsculo, sem código de certame e sem hífen duplo. */
function conferirSlug(post: PostBruto, falhas: FalhaVigia[]): void {
  if (post.slug.length > SLUG_MAX) {
    falhas.push({
      regra: "slug legível",
      detalhe: `${post.slug}: ${post.slug.length} caracteres (máximo ${SLUG_MAX})`,
    });
  }
  if (SLUG_TECNICO.test(post.slug)) {
    falhas.push({ regra: "slug legível", detalhe: `${post.slug}: código de certame e ano no slug` });
  }
  if (post.slug.includes("--") || post.slug !== post.slug.toLowerCase()) {
    falhas.push({ regra: "slug legível", detalhe: `${post.slug}: caixa ou hífen duplo` });
  }
}

function conferirPost(post: PostBruto, falhas: FalhaVigia[]): void {
  conferirCamadaEditorial(post, falhas);
  conferirFontes(post, falhas);
  conferirSlug(post, falhas);
}

/** Post analítico de serviço publicado a partir de DESDE. */
function ehServicoNovo(post: PostBruto): boolean {
  if (post.slug.startsWith("radar-editais") || post.categoria === "Edital") return false;
  if ((post.publicadoEm ?? "").slice(0, 10) < DESDE) return false;
  const texto = [post.titulo, post.resumo, ...(post.palavrasChave ?? [])].join(" ");
  return TEMA_SERVICO.test(texto);
}

/** Lê o JSON do blog e confere os posts de serviço publicados desde DESDE. */
function conferirPosts(raiz: string, falhas: FalhaVigia[]): number {
  const bruto = lerArquivo(raiz, "apps/web/data/noticias-portal.json");
  if (!bruto) {
    falhas.push({ regra: "dados do blog", detalhe: "noticias-portal.json não encontrado" });
    return 0;
  }

  const posts = (JSON.parse(bruto) as PostBruto[]).filter(ehServicoNovo);
  posts.forEach((post) => conferirPost(post, falhas));
  return posts.length;
}

/** Executa as duas camadas e devolve o que passou e o que falhou. */
export function verificarPostServico(raiz: string): ResultadoVigia {
  const falhas: FalhaVigia[] = [];
  const componentesOk = conferirComponentes(raiz, falhas);
  const postsConferidos = conferirPosts(raiz, falhas);

  return { componentesOk, postsConferidos, falhas };
}
