/**
 * @file escada-cidades.ts
 * @description Degrau 2 da escada determinística — cidades estratégicas.
 * Responde antes de chamar a IA (Seu Nonô / Chatbot).
 *
 * Papel no portal:
 * Reconhece perguntas por Betim, Belo Horizonte, Diamantina, Araçuaí,
 * Itinga, São Paulo e pelo catálogo das 199 Cidades Estratégicas, e
 * devolve o cartão com os atalhos oficiais de cada município.
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular (rotas do App Router).
 * Nenhum texto é gerado por máquina — os cartões são os mesmos que estavam
 * nos `if`s originais.
 *
 * Decisões técnicas:
 * - Antes isto era uma sequência de 7 `if`s com complexidade ciclomática 27
 *   e 141 linhas dentro de `escada-determinista.ts` (o pior que sobrou
 *   depois do remendo de 09/10/2026). Virou tabela de dados: quem decide
 *   passa a ser `primeiroCartao()`.
 * - Este degrau é o primeiro a usar os quatro testos do casador: além de
 *   `exatos` e `contem`, ele usa `comecaCom` ("betim prefeitura") e
 *   `terminaCom` ("contratos de betim"). Os quatro existiam no `if`
 *   original como `===`, `.includes()`, `.startsWith()` e `.endsWith()`.
 * - A ORDEM das 7 entradas reproduz a dos `if`s originais. A primeira que
 *   casa responde — trocar a ordem muda a resposta em perguntas ambíguas
 *   (ex.: "sao paulo" cai em SP antes de chegar ao catálogo de cidades).
 * - Prova de equivalência: `escada-determinista.test.ts` (cartões de
 *   cidade) e a comparação de termos extraídos do diff.
 */

import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/**
 * Tabela do degrau 2 — cidades estratégicas.
 * `exatos` casa com a pergunta inteira; `contem` casa por substring;
 * `comecaCom`/`terminaCom` casam pela ponta do texto.
 */
const CIDADES: EntradaCartao[] = [
  {
    exatos: ["betim"],
    contem: ["cidade de betim", "prefeitura de betim"],
    comecaCom: ["betim "],
    terminaCom: [" betim"],
    cartao: {
      tipo: "cidade",
      titulo: "Município de Betim / MG",
      subtitulo: "Painel de Transparência Municipal",
      texto:
        "Consulte os contratos públicos, despesas orçamentárias, diário oficial, servidores e vereadores de Betim com filtros em tempo real e exportação de dados.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Betim", href: "/betim", principal: true },
        { rotulo: "Contratos Públicos", href: "/betim/prefeitura/contratos" },
        { rotulo: "Despesas Orçamentárias", href: "/betim/prefeitura/despesas" },
        { rotulo: "Diário Oficial", href: "/betim/prefeitura/diario" },
        { rotulo: "Câmara Municipal", href: "/betim/camara" },
      ],
    },
  },
  {
    exatos: ["bh", "belo horizonte"],
    contem: ["belo horizonte"],
    comecaCom: ["bh "],
    terminaCom: [" bh"],
    cartao: {
      tipo: "cidade",
      titulo: "Belo Horizonte / MG",
      subtitulo: "Capital de Minas Gerais",
      texto:
        "Acompanhe o Diário Oficial do Município (DOM), contratos, licitações, despesas e repasses federais de Belo Horizonte.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de BH", href: "/bh", principal: true },
        { rotulo: "Índice de Atos Oficiais", href: "/bh/indice" },
        { rotulo: "ComunicaBR — Repasses Federais", href: "/dados/comunicabr" },
        { rotulo: "199 Cidades Estratégicas", href: "/cidades" },
      ],
    },
  },
  {
    exatos: ["diamantina"],
    contem: ["diamantina"],
    cartao: {
      tipo: "cidade",
      titulo: "Diamantina / MG",
      subtitulo: "Vale do Jequitinhonha",
      texto:
        "Consulte o acervo histórico do Diário Oficial de Diamantina (16.600+ atos oficiais catalogados), licitações, compras públicas e estudos acadêmicos da UFVJM.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Diamantina", href: "/diamantina/indice", principal: true },
        { rotulo: "Diário Oficial na Íntegra", href: "/diamantina/prefeitura/diario" },
        { rotulo: "Estudos Rurais do Jequitinhonha", href: "/estudos-rurais" },
        { rotulo: "Biblioteca & Pesquisas", href: "/biblioteca" },
      ],
    },
  },
  {
    exatos: ["aracuai"],
    contem: ["aracuai"],
    cartao: {
      tipo: "cidade",
      titulo: "Araçuaí / Médio Jequitinhonha",
      subtitulo: "Polo Regional do Lítio",
      texto:
        "Fiscalize a arrecadação de royalties da mineração de lítio (CFEM), contratos públicos municipais e pesquisas sobre agricultura familiar no Médio Jequitinhonha.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Araçuaí", href: "/aracuai", principal: true },
        { rotulo: "Royalties do Lítio no Vale", href: "/noticias/itinga-transparencia-repasses-litio" },
        { rotulo: "Estudos Rurais & PPGER", href: "/estudos-rurais" },
        { rotulo: "Barragens e Mineração", href: "/ambiental/barragens" },
      ],
    },
  },
  {
    exatos: ["itinga"],
    contem: ["itinga"],
    cartao: {
      tipo: "cidade",
      titulo: "Itinga / Médio Jequitinhonha",
      subtitulo: "Mineração de Lítio e Transparência",
      texto:
        "Monitore os repasses da compensação financeira mineral (CFEM da Sigma Lithium) e a prestação de contas dos investimentos sociais em Itinga.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Painel de Itinga", href: "/itinga", principal: true },
        { rotulo: "Investigação dos Repasses do Lítio", href: "/noticias/itinga-transparencia-repasses-litio" },
        { rotulo: "Grandes Empresas & Mineradoras", href: "/empresas" },
        { rotulo: "ComunicaBR — Repasses Federais", href: "/dados/comunicabr" },
      ],
    },
  },
  {
    exatos: ["sp", "sao paulo"],
    contem: ["sao paulo"],
    comecaCom: ["sp "],
    terminaCom: [" sp"],
    cartao: {
      tipo: "cidade",
      titulo: "São Paulo / SP",
      subtitulo: "199 Cidades Estratégicas",
      texto:
        "Acesse os indicadores de saúde, educação, metas de governo e acompanhamento de políticas públicas de São Paulo.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "199 Cidades Estratégicas", href: "/cidades", principal: true },
        { rotulo: "Governo: Prometeu? Cumpriu?", href: "/governo" },
        { rotulo: "Tarifa Social de Energia e Água", href: "/noticias/tarifa-social-energia-agua-como-acessar" },
        { rotulo: "Painel de Saúde Pública", href: "/direitos-em-movimento/saude-publica" },
      ],
    },
  },
  {
    exatos: ["cidades", "municipios", "199 cidades"],
    contem: ["cidades estrategicas", "todas as cidades"],
    cartao: {
      tipo: "cidade",
      titulo: "199 Cidades Estratégicas de Minas Gerais",
      subtitulo: "Catálogo Municipal de Transparência Cívica",
      texto:
        "Consulte orçamentos, contratos do PNCP, indicadores de saúde e educação e dados da mineração nos 199 municípios monitorados em Minas Gerais.",
      categoria: "Cidades",
      atalhos: [
        { rotulo: "Abrir Catálogo de 199 Cidades", href: "/cidades", principal: true },
        { rotulo: "Comparador Municipal", href: "/laboratorio/comparador" },
        { rotulo: "ComunicaBR — 853 Municípios", href: "/dados/comunicabr" },
        { rotulo: "Betim / MG", href: "/betim" },
        { rotulo: "Belo Horizonte / MG", href: "/bh" },
      ],
    },
  },
];

/**
 * Degrau 2 — cidades estratégicas.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da cidade, ou `null` para o degrau seguinte.
 */
export function degrau2Cidades(normalizada: string): ResultadoEscada | null {
  return primeiroCartao(normalizada, CIDADES);
}
