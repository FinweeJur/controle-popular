/**
 * @file escada-noticias.ts
 * @description Degrau 6 da Regra de Escada — Blog e Reportagens Investigativas
 * (`/noticias`), extraído de `escada-determinista.ts` em 09/10/2026.
 *
 * Papel no portal:
 * Quando o cidadão pede a central de notícias, ou nomeia uma reportagem já
 * publicada, o assistente responde NA HORA com o cartão certo — sem acionar
 * o modelo de IA, que custa tempo e pode alucinar o título de uma matéria.
 *
 * Fonte dos dados:
 * `lib/noticias/portal.ts` — o acervo oficial do blog do ONSA (título, slug,
 * resumo, palavras-chave, data de publicação e fontes oficiais de cada
 * reportagem). Nada aqui é digitado à mão: o cartão lê a lista publicada.
 *
 * Decisões técnicas:
 * - São DOIS caminhos dentro do mesmo degrau, e a ordem entre eles é regra,
 *   não detalhe: primeiro a CENTRAL (termos genéricos: "blog", "notícias",
 *   "reportagens", "investigações"), depois a BUSCA por reportagem
 *   específica. Inverter faria "reportagens" casar numa matéria qualquer.
 * - A central virou TABELA (`CENTRAL` + `primeiroCartao`), como os degraus
 *   2, 3, 4, 4.5, 1.5, 3.5 e 6.5 já viraram no mesmo dia. A busca NÃO cabe
 *   em tabela: ela compara a pergunta contra CADA item do acervo, com a
 *   regra de "duas palavras-chave" — por isso virou função própria.
 * - A regra das duas palavras-chave foi medida em 06/10/2026: com um só
 *   acerto, qualquer pergunta que mencionasse "orçamento" caía na
 *   reportagem do IPCA/Selic em vez da resposta de orçamento do assunto.
 *   Contar DUAS é o que segura a reportagem no lugar dela.
 * - `montarCentral()` é chamada na montagem da tabela e não por request:
 *   o acervo é constante importada (JSON do blog), então o resultado é o
 *   mesmo — e o objeto do cartão é compartilhado, como em todos os outros
 *   degraus com `cartao` estático.
 */

import { semAcento } from "../busca/normalizar";
import { listarNoticiasPortal, type NoticiaPortal } from "../noticias/portal";
import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/**
 * Monta o cartão da central de notícias: as 4 reportagens mais recentes
 * entram como atalho, depois do link principal "Ver Todas".
 *
 * O corte de título em 38 caracteres (35 + "...") existe porque o rótulo
 * do atalho é pequeno: título longo quebraria o layout do chat.
 *
 * @returns cartão da central, com as 4 últimas publicações do blog.
 */
function montarCentral(): ResultadoEscada {
  const topNoticias = listarNoticiasPortal().slice(0, 4);
  return {
    tipo: "noticia",
    titulo: "Central de Notícias & Investigações Cívicas",
    subtitulo: "Jornalismo de Dados e Relatórios Técnicos do ONSA",
    texto:
      "Acompanhe reportagens exclusivas sobre royalties do lítio, tarifa social, desastres da mineração, orçamentos da justiça e direitos fundamentais.",
    categoria: "Blog & Notícias",
    atalhos: [
      { rotulo: "Ver Todas as Notícias", href: "/noticias", principal: true },
      ...topNoticias.map((n) => ({
        rotulo: n.titulo.length > 38 ? n.titulo.slice(0, 35) + "..." : n.titulo,
        href: `/noticias/${n.slug}`,
      })),
    ],
  };
}

/**
 * Termos que abrem a central — os mesmos seis do `if` original, na mesma
 * ordem. Igualdade (`exatos`) e substring (`contem`) separadas de propósito:
 * é o que permite comparar bloco a bloco contra o código anterior na prova
 * de equivalência.
 *
 * A ordem entre as listas não altera a resposta (dentro do bloco era `||`),
 * mas mantê-la deixa o diff legível.
 */
const CENTRAL: EntradaCartao[] = [
  {
    exatos: ["blog", "noticias", "reportagens", "investigacoes"],
    contem: ["central de noticias", "ultimas noticias"],
    cartao: montarCentral(),
  },
];

/**
 * Procura uma reportagem do acervo que corresponda à pergunta do cidadão.
 *
 * Três formas de casar, em ordem:
 * 1. o título CONTÉM a pergunta ("relatório da cemig" acha matéria sobre a CEMIG);
 * 2. a pergunta CONTÉM o slug (cidadão colou o fim da URL);
 * 3. DUAS ou mais palavras-chave da matéria aparecem na pergunta.
 *
 * A terceira é a regra medida em 06/10/2026 (ver cabeçalho do arquivo): uma
 * só palavra-chave é acerto fraco demais e sequestra a resposta do assunto.
 * Palavras de 4 letras ou menos não contam — "água", "lei", "de" passariam
 * em qualquer pergunta e anulariam a regra.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido.
 * @returns a reportagem encontrada, ou `null`.
 */
function buscarReportagem(normalizada: string): NoticiaPortal | null {
  return (
    listarNoticiasPortal().find((n) => {
      const titNorm = semAcento(n.titulo.toLowerCase());
      const slugNorm = semAcento(n.slug.toLowerCase());
      const chavesNorm = n.palavrasChave.map((k) => semAcento(k.toLowerCase()));

      return (
        titNorm.includes(normalizada) ||
        normalizada.includes(slugNorm) ||
        chavesNorm.filter((k) => k.length > 4 && normalizada.includes(k)).length >= 2
      );
    }) ?? null
  );
}

/**
 * Monta o cartão de UMA reportagem: título, categoria com data, resumo e
 * as duas primeiras fontes oficiais como atalho.
 *
 * O corte em 2 fontes é teto de espaço no chat — a lista completa fica na
 * própria página da matéria.
 *
 * O parâmetro se chama `noticiaCorrespondente`, e não `noticia`, de
 * propósito: é o nome do original e mantém o texto do cartão BYTE a BYTE
 * igual, que é o que a prova de conteúdo compara (`prova-cartoes.mts`).
 * Renomear aqui quebraria a prova sem mudar a resposta — e prova quebrada
 * por detalhe de estilo é prova que ninguém conserta.
 *
 * @param noticiaCorrespondente reportagem encontrada no acervo.
 * @returns cartão da reportagem.
 */
function montarReportagem(noticiaCorrespondente: NoticiaPortal): ResultadoEscada {
  return {
    tipo: "noticia",
    titulo: noticiaCorrespondente.titulo,
    subtitulo: `${noticiaCorrespondente.categoria} · ${new Date(noticiaCorrespondente.publicadoEm).toLocaleDateString("pt-BR")}`,
    texto: noticiaCorrespondente.resumo,
    categoria: "Reportagem Investigativa",
    atalhos: [
      { rotulo: "Ler Reportagem Completa", href: `/noticias/${noticiaCorrespondente.slug}`, principal: true },
      { rotulo: "Central de Notícias", href: "/noticias" },
      ...noticiaCorrespondente.fontesOficiais.slice(0, 2).map((f) => ({
        rotulo: `Fonte: ${f.nome}`,
        href: f.url,
      })),
    ],
  };
}

/**
 * Degrau 6 — Blog e reportagens investigativas.
 *
 * A central vem da TABELA; só se a tabela não casar é que a pergunta vai
 * para a busca por reportagem. Nenhuma das duas casou = `null`, e a
 * pergunta segue para o degrau seguinte da escada.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido.
 * @returns cartão da central ou da reportagem, ou `null`.
 */
export function degrau6Noticias(normalizada: string): ResultadoEscada | null {
  const central = primeiroCartao(normalizada, CENTRAL);
  if (central) return central;

  const reportagem = buscarReportagem(normalizada);
  return reportagem ? montarReportagem(reportagem) : null;
}
