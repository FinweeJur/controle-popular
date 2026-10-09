/**
 * @file escada-empresas.ts
 * @description Degrau 3 da escada determinística — empresas, mineradoras e
 * concessionárias. Responde antes de chamar a IA (Seu Nonô / Chatbot).
 *
 * Papel no portal:
 * Reconhece perguntas por Vale, Sigma Lithium, CSN, CEMIG, COPASA, e pelos
 * painéis de empresas, Canadá e EUA. Devolve o cartão com atalhos oficiais
 * (cada atalho é rota do App Router, exceto os dois externos: SEC EDGAR e
 * Ouvidoria CORE, ambos sinalizados com `https://`).
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular e painel de Grandes
 * Empresas. Nenhum texto é gerado por máquina — os cartões são os mesmos
 * que estavam nos `if`s originais.
 *
 * Decisões técnicas:
 * - Antes isto era uma sequência de 8 `if`s com complexidade ciclomática 31
 *   e 158 linhas dentro de `escada-determinista.ts` (hotspot vermelho do
 *   CodeScene, medido 09/10/2026). Virou tabela de dados: quem decide passa
 *   a ser `primeiroCartao()`, com complexidade 3.
 * - A ORDEM das 8 entradas reproduz a dos `if`s originais. A primeira que
 *   casa responde — trocar a ordem muda a resposta em perguntas ambíguas.
 * - Prova de equivalência: `escada-determinista.test.ts` (cartões de
 *   empresa) e a comparação de termos extraídos do diff.
 */

import type { EntradaCartao, ResultadoEscada } from "./escada-base";
import { primeiroCartao } from "./escada-base";

/**
 * Tabela do degrau 3 — empresas e mineradoras.
 * `exatos` casa com a pergunta inteira; `contem` casa por substring.
 */
const EMPRESAS: EntradaCartao[] = [
  {
    exatos: ["vale", "vale3"],
    contem: ["mineradora vale", "acoes da vale", "cotacao vale"],
    cartao: {
      tipo: "empresa",
      titulo: "Vale S.A. & Observatório Vale",
      subtitulo: "Mineração, Mercado e Responsabilidade Socioambiental",
      texto:
        "Monitore cotações (VALE3) na B3, documentos enviados à CVM, composição acionária global (BlackRock, Previ) e auditoria da reparação do desastre de Brumadinho.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Observatório Vale (CVM & Ações)", href: "/paraopeba/vale", principal: true },
        { rotulo: "Execução do Acordo de Brumadinho", href: "/paraopeba/execucao" },
        { rotulo: "Ficha Corporativa da Vale", href: "/empresas/vale" },
        { rotulo: "Biblioteca Socioambiental", href: "/ambiental/crimes-socioambientais" },
      ],
    },
  },
  {
    exatos: ["sigma"],
    contem: ["sigma lithium", "sigma litio"],
    cartao: {
      tipo: "empresa",
      titulo: "Sigma Lithium Corporation",
      subtitulo: "Mineração de Lítio no Vale do Jequitinhonha",
      texto:
        "Consulte dados de governança corporativa, impactos socioambientais, teses científicas e arrecadação de royalties minerais (CFEM) nos municípios do Vale.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Ficha da Sigma Lithium", href: "/empresas/sigma-lithium", principal: true },
        { rotulo: "Investigação dos Repasses do Lítio", href: "/noticias/itinga-transparencia-repasses-litio" },
        { rotulo: "Biblioteca & Teses Científicas", href: "/biblioteca" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
      ],
    },
  },
  {
    exatos: ["csn"],
    contem: ["companhia siderurgica nacional"],
    cartao: {
      tipo: "empresa",
      titulo: "CSN (Companhia Siderúrgica Nacional)",
      subtitulo: "Siderurgia, Mineração e Barragens",
      texto:
        "Acompanhe a classificação de risco das barragens de rejeitos (Casa de Pedra em Congonhas), processos no SIRENEJud e quadro de acionistas.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Painel de Grandes Empresas", href: "/empresas", principal: true },
        { rotulo: "Painel de Barragens SIGBM", href: "/ambiental/barragens" },
        { rotulo: "SIRENEJud — Processos Ambientais", href: "/judiciario/sirenejud" },
      ],
    },
  },
  {
    exatos: ["cemig"],
    contem: ["companhia energetica de minas"],
    cartao: {
      tipo: "empresa",
      titulo: "CEMIG (Companhia Energética de Minas Gerais)",
      subtitulo: "Energia Elétrica e Direitos do Consumidor",
      texto:
        "Acesse o guia da Tarifa Social de Energia Elétrica (desconto de até 65% na conta de luz para inscritos no CadÚnico) e canais oficiais da concessionária.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Tutorial da Tarifa Social", href: "/noticias/tarifa-social-energia-agua-como-acessar", principal: true },
        { rotulo: "Canais Oficiais LAI", href: "/direitos-em-movimento/informacao" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
      ],
    },
  },
  {
    exatos: ["copasa"],
    contem: ["companhia de saneamento"],
    cartao: {
      tipo: "empresa",
      titulo: "COPASA (Companhia de Saneamento de MG)",
      subtitulo: "Recursos Hídricos e Saneamento Básico",
      texto:
        "Consulte informações sobre a Tarifa Social de Água e Esgoto, outorgas de captação de água, qualidade dos rios de Minas Gerais e canais de atendimento.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Tarifa Social de Água e Esgoto", href: "/noticias/tarifa-social-energia-agua-como-acessar", principal: true },
        { rotulo: "Nossos Rios & Bacias Hidrográficas", href: "/ambiental/nossos-rios" },
        { rotulo: "Canais Oficiais LAI", href: "/direitos-em-movimento/informacao" },
      ],
    },
  },
  {
    exatos: ["empresas", "mineradoras"],
    contem: ["painel de empresas", "grandes empresas"],
    cartao: {
      tipo: "empresa",
      titulo: "Grandes Empresas e Concessionárias",
      subtitulo: "Painel de Governança, Contratos e Impacto Socioambiental",
      texto:
        "Acompanhe o perfil acionário, contratos públicos, processos judiciais ambientais e licenças de grandes corporações em Minas Gerais.",
      categoria: "Empresas",
      atalhos: [
        { rotulo: "Painel Geral de Empresas", href: "/empresas", principal: true },
        { rotulo: "Mineradoras do Canadá (TSX)", href: "/canada/mineracao" },
        { rotulo: "Corporações & Fundos EUA (SEC)", href: "/eua/empresas" },
        { rotulo: "Vale S.A.", href: "/paraopeba/vale" },
        { rotulo: "Sigma Lithium", href: "/empresas/sigma-lithium" },
      ],
    },
  },
  {
    exatos: ["canada"],
    contem: [
      "mineradoras canadenses",
      "bolsa de toronto",
      "tsx",
      "ouvidoria core",
      "core canada",
    ],
    cartao: {
      tipo: "empresa",
      titulo: "Canadá — Mineradoras no Brasil (TSX & TSXV)",
      subtitulo: "Acervo da Bolsa de Toronto e Ouvidoria Federal CORE",
      texto:
        "Consulte 12 mineradoras canadenses com operações no Brasil (lítio no Jequitinhonha e ouro), barragens de rejeitos e canal de denúncias de direitos humanos.",
      categoria: "Internacional",
      atalhos: [
        { rotulo: "Mineradoras do Canadá (/canada/mineracao)", href: "/canada/mineracao", principal: true },
        { rotulo: "Hub Oficial do Canadá", href: "/canada" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
        { rotulo: "Ouvidoria CORE Canadá", href: "https://core-ombuds.canada.ca" },
      ],
    },
  },
  {
    exatos: ["eua", "estados unidos", "sec"],
    contem: ["empresas eua", "sec edgar", "fundos eua"],
    cartao: {
      tipo: "empresa",
      titulo: "Estados Unidos — Corporações & Fundos na SEC",
      subtitulo: "Mercado de Capitais e Formulários Form 20-F",
      texto:
        "Consulte relatórios anuais Form 20-F e 10-K na SEC americana, fundos globais como BlackRock e contratos federais no USAspending.gov.",
      categoria: "Internacional",
      atalhos: [
        { rotulo: "Corporações & Fundos SEC (/eua/empresas)", href: "/eua/empresas", principal: true },
        { rotulo: "Hub Oficial dos EUA", href: "/eua" },
        { rotulo: "Painel de Grandes Empresas", href: "/empresas" },
        { rotulo: "SEC EDGAR Oficial", href: "https://www.sec.gov/edgar" },
      ],
    },
  },
];

/**
 * Degrau 3 — empresas e mineradoras.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão da empresa, ou `null` para o degrau seguinte.
 */
export function degrau3Empresas(normalizada: string): ResultadoEscada | null {
  return primeiroCartao(normalizada, EMPRESAS);
}
