/**
 * @file escada-determinista.ts
 * @description Módulo de Degraus Determinísticos (Regra de Escada) para o assistente Seu Nonô e Chatbot IA.
 * 
 * Papel no portal:
 * Intercepta comandos diretos e termos de alta frequência antes de acionar o modelo de IA,
 * garantindo respostas instantâneas, determinísticas e auditáveis para:
 * 1. Laboratório de Dados / PowerBI / Cruzamento de indicadores e gráficos;
 * 2. Cidades estratégicas (Betim, BH, Diamantina, Araçuaí, Itinga, SP, 199 Cidades);
 * 3. Grandes empresas e mineradoras (Vale, Sigma Lithium, CSN, CEMIG, COPASA, Gerdau, Samarco);
 * 4. Central & Ferramentas (Busca, Editais, Biblioteca, Imprensa, Índice Geral, Documentação, Fontes 27 Estados, Sobre, Governo, ComunicaBR);
 * 5. Perguntas com respostas pré-curadas da base oficial do portal;
 * 6. Blog e Reportagens Investigativas do ONSA (/noticias);
 * 7. Páginas estruturais e eixos temáticos do portal (~100 páginas do índice).
 * 
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular, rotas do App Router, painel do ONSA,
 * catálogo de páginas (`PAGINAS_PORTAL`), acervo de notícias e base de respostas curadas.
 * 
 * Decisões técnicas:
 * - Reduz latência a zero para termos frequentes e economiza chamadas de IA.
 * - Fornece botões de navegação direta com deep links auditáveis.
 * - Respeita a Regra de Escada cívica: navegação determinística antes da geração probabilística.
 * - Cada degrau mora na SUA função privada (`degrau1Laboratorio` ... `degrau7Paginas`),
 *   encadeada em `??` pelo `avaliarEscadaBruta`: mesma condição, mesma ordem,
 *   só sem a função gigante de 1.115 linhas que valia saúde 1,45 no CodeScene
 *   (hotspot medido em 07/10/2026, PENDENCIAS-07-10.md). A quebra é mecânica:
 *   nenhum texto, atalho ou condição mudou — quem prova é
 *   `escada-determinista.test.ts`.
 * - Os dois piores degraus saíram do arquivo em 09/10/2026: o de empresas
 *   (complexidade 31) virou `escada-empresas.ts` e o de ferramentas
 *   (complexidade 54, o pior método do projeto) virou `escada-ferramentas.ts`.
 *   Ambos deixaram a sequência de `if`s e viraram TABELA de dados, casada
 *   por `primeiroCartao()` de `escada-base.ts`. O arquivo caiu de 1.373 para
 *   963 linhas — abaixo do aviso de "Lines of Code" do CodeScene.
 * - Seguiu a mesma receita em 09/10/2026: `degrau2Cidades` →
 *   `escada-cidades.ts`, `degrau45Bases` → `escada-bases.ts`,
 *   `degrau15Tabelas` → `escada-tabelas.ts`, `degrau35Justica` →
 *   `escada-justica.ts`, `degrau65Internacional` (complexidade 24) →
 *   `escada-internacional.ts` e `degrau6Noticias` (complexidade 12, o
 *   último método complexo) → `escada-noticias.ts`. Sobra aqui o que ainda
 *   depende de lógica própria: as respostas curadas, a busca em páginas e
 *   o `degrau1Laboratorio`.
 */

import { buscarRespostaCurada } from "../busca/resposta-curada";
import { semAcento } from "../busca/normalizar";
import { buscarPaginasPortal } from "../busca/paginas-portal";
import { obterLinksRelacionadosGalho } from "./arvore-galhos";
import { corrigirDigitacaoFrase } from "./corretor-digitacao";
import { degrau45Bases } from "./escada-bases";
import { degrau2Cidades } from "./escada-cidades";
import { degrau3Empresas } from "./escada-empresas";
import { degrau4Ferramentas } from "./escada-ferramentas";
import { degrau65Internacional } from "./escada-internacional";
import { degrau35Justica } from "./escada-justica";
import { degrau6Noticias } from "./escada-noticias";
import { degrau15Tabelas } from "./escada-tabelas";

// Os tipos da escada vivem em `escada-base.ts` para que os degraus novos os
// importem sem depender deste arquivo (isso fecharia um ciclo de import).
// Reexportar aqui mantém os 7 importadores existentes funcionando sem mudança.
export type { AtalhoAcao, ResultadoEscada } from "./escada-base";
import type { AtalhoAcao, ResultadoEscada } from "./escada-base";

/**
 * Avalia se a entrada do usuário corresponde a um degrau determinístico antes de invocar a IA.
 * Executa a lógica bruta de casamento por regras, com correção tolerante a erros de digitação.
 *
 * ORQUESTRAÇÃO: cada degrau é uma função privada própria encadeada em `??`,
 * na MESMA ordem em que os `if`s eram testados no bloco único anterior a
 * 08/10/2026. `null` de um degrau passa a palavra ao seguinte — resultado
 * idêntico ao anterior, função só deixa de ser um arquivo dentro de arquivo.
 */
function avaliarEscadaBruta(
  prompt: string,
  slugCidadeOuZona?: string
): ResultadoEscada | null {
  const bruta = semAcento(prompt.trim().toLowerCase());
  if (!bruta) return null;

  // Aplica correção tolerante a erros ortográficos e de digitação
  const normalizada = corrigirDigitacaoFrase(bruta);

  return (
    degrau1Laboratorio(normalizada) ??
    degrau15Tabelas(normalizada) ??
    degrau2Cidades(normalizada) ??
    degrau3Empresas(normalizada) ??
    degrau35Justica(normalizada) ??
    degrau4Ferramentas(normalizada) ??
    degrau45Bases(normalizada) ??
    degrau5Curada(prompt, slugCidadeOuZona) ??
    degrau6Noticias(normalizada) ??
    degrau65Internacional(normalizada) ??
    degrau7Paginas(prompt, normalizada)
  );
}

/**
 * Degrau 1 — Laboratório, PowerBI, cruzamentos e a Árvore Obsidian.
 *
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão do laboratório, ou `null` para o degrau seguinte.
 */
function degrau1Laboratorio(normalizada: string): ResultadoEscada | null {
  // ─── 1. DEGRAU: LABORATÓRIO / POWERBI / ARVORE OBSIDIAN / CRUZAMENTOS ─
  const regexArvore = /\b(arvore|grafo|obsidian|rede de conexoes|arvore de links|mapa mental)\b/i;
  if (regexArvore.test(normalizada)) {
    return {
      tipo: "laboratorio",
      titulo: "Árvore de Conexões Cívicas (Obsidian Graph)",
      subtitulo: "Grafo Interativo dos 4 Eixos Temáticos",
      texto:
        "A visualização em árvore do Controle Popular mapeia nós e arestas de relacionamento entre 199 cidades, mineradoras, bacias e órgãos públicos com zoom, arrasto e inspeção de vínculos.",
      categoria: "Visualização em Grafo",
      atalhos: [
        { rotulo: "Abrir Árvore de Conexões", href: "/laboratorio/arvore", principal: true },
        { rotulo: "Laboratório de Dados", href: "/laboratorio" },
        { rotulo: "Índice Geral do Portal", href: "/indice" },
      ],
    };
  }

  const regexLab = /\b(laboratorio|laborat[oó]rio|powerbi|power bi|cruzar|cruzamento|cruzar dados|comparador|gr[aá]ficos?|analytics|dashboard|painel bi|lab|camadas)\b/i;
  if (regexLab.test(normalizada)) {
    return {
      tipo: "laboratorio",
      titulo: "Laboratório de Cruzamento & PowerBI",
      subtitulo: "23 Camadas Analíticas de Inteligência Cívica",
      texto:
        "O Laboratório de Dados do Controle Popular permite cruzar indicadores orçamentários, contratos, leitos hospitalares, licenças ambientais e royalties em gráficos e comparadores interativos.",
      categoria: "Análise de Dados",
      atalhos: [
        { rotulo: "Abrir Laboratório de Dados", href: "/laboratorio", principal: true },
        { rotulo: "Árvore de Conexões (Obsidian)", href: "/laboratorio/arvore" },
        { rotulo: "Comparador de Cidades", href: "/laboratorio/comparador" },
        { rotulo: "Séries Históricas & Gráficos", href: "/laboratorio/graficos" },
        { rotulo: "Orçamento de Minas Gerais", href: "/estado-e-economia/orcamento" },
      ],
    };
  }

  return null;
}

/**
 * Degrau 5 — Respostas pré-curadas da base oficial do portal.
 *
 * Recebe o prompt ORIGINAL (não o normalizado): o `buscarRespostaCurada`
 * faz a sua própria normalização interna e casa por assunto, não por literal.
 *
 * @param prompt Texto digitado pelo visitante, como veio.
 * @param slugCidadeOuZona Município/zona da conversa, quando houver.
 * @returns Cartão da resposta curada, ou `null` para o degrau seguinte.
 */
function degrau5Curada(prompt: string, slugCidadeOuZona?: string): ResultadoEscada | null {
  // ─── 5. DEGRAU: RESPOSTAS CURADAS DA BASE OFICIAL ──────────────────────
  const curada = buscarRespostaCurada(prompt, slugCidadeOuZona);
  if (curada && curada.resposta) {
    const atalhos: AtalhoAcao[] = [];
    if (curada.linkPrincipal) {
      atalhos.push({
        rotulo: curada.linkPrincipal.texto,
        href: curada.linkPrincipal.href,
        principal: true,
      });
    }
    if (curada.linksAdicionais) {
      for (const l of curada.linksAdicionais) {
        atalhos.push({
          rotulo: l.texto,
          href: l.href,
        });
      }
    }

    return {
      tipo: "curada",
      titulo: "Resposta Oficial Curada",
      subtitulo: "Base de Conhecimento do Controle Popular",
      texto: curada.resposta,
      categoria: "Acervo Oficial",
      atalhos,
    };
  }

  return null;
}

/**
 * Degrau 7 — Busca nas ~100 páginas estruturais do portal, com corte de
 * correspondência FORTE: título, rota ou palavra-chave inteira têm que casar,
 * senão a escada devolve `null` e a pergunta segue para o RAG / IA.
 *
 * Recebe o prompt ORIGINAL para o `buscarPaginasPortal` (que tem a sua
 * própria tolerância) e a versão normalizada para os testes de corte.
 *
 * @param prompt Texto digitado pelo visitante, como veio.
 * @param normalizada Prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da página, ou `null` — fim da escada, segue para a IA.
 */
function degrau7Paginas(prompt: string, normalizada: string): ResultadoEscada | null {
  // ─── 7. DEGRAU: BUSCA EM PÁGINAS ESTRUTURAIS DO PORTAL (~100 PÁGINAS) ──
  const paginasEncontradas = buscarPaginasPortal(prompt, 3);
  if (paginasEncontradas.length > 0) {
    const principal = paginasEncontradas[0];
    const titNorm = semAcento(principal.titulo.toLowerCase());
    const rotaNorm = semAcento(principal.href.toLowerCase());
    const chavesNorm = principal.palavrasChave.map((k) => semAcento(k.toLowerCase()));

    // Confere se a correspondência é forte o suficiente para interceptação direta
    const ehMatchForte =
      titNorm.includes(normalizada) ||
      normalizada.includes(titNorm.split("—")[0].trim()) ||
      normalizada.includes(rotaNorm.replace(/^\//, "")) ||
      chavesNorm.some((k) => k === normalizada || (k.length > 3 && normalizada === k));

    if (ehMatchForte) {
      return {
        tipo: "pagina",
        titulo: principal.titulo,
        subtitulo: principal.rotulo,
        texto: principal.descricao,
        categoria: "Navegação do Portal",
        atalhos: [
          { rotulo: `Abrir ${principal.rotulo}`, href: principal.href, principal: true },
          ...paginasEncontradas.slice(1).map((p) => ({
            rotulo: p.rotulo,
            href: p.href,
          })),
        ],
      };
    }
  }

  return null;
}

/**
 * Avalia se a entrada do usuário corresponde a um degrau determinístico antes de invocar a IA.
 * Retorna o cartão de ação formatado ou `null` caso deva prosseguir para o RAG / IA.
 * 
 * Regra de Galho da Árvore:
 * Enriquece automaticamente o resultado com links de páginas irmãs temáticas
 * pertencentes ao mesmo ramo/eixo do mapa do site.
 */
export function avaliarEscadaDeterminista(
  prompt: string,
  slugCidadeOuZona?: string
): ResultadoEscada | null {
  const resultado = avaliarEscadaBruta(prompt, slugCidadeOuZona);
  if (!resultado) return null;

  // Encontra a rota de referência para identificar o galho temático
  const rotaReferencia =
    resultado.atalhos.find((a) => a.principal)?.href ||
    resultado.atalhos[0]?.href ||
    "";

  if (rotaReferencia && !resultado.galhoRelacionado) {
    const galho = obterLinksRelacionadosGalho(rotaReferencia, 3);
    if (galho) {
      resultado.galhoRelacionado = galho;
    }
  }

  return resultado;
}

