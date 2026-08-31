/**
 * Tags de assunto para barragens de Minas Gerais.
 *
 * Aplica-se tanto ao inventário da FEAM (mineração/indústria) quanto ao
 * cadastro nacional SNISB (todos os usos). As tags são inferidas de campos
 * de texto já publicados pela fonte: `atividade`, `finalidade`,
 * `uso_principal`, `uso_complementar`, `metodo_construtivo`,
 * `condicao_estabilidade`, `categoria_risco`, `dano_potencial` e `nome`.
 *
 * Não substituem os vocabulários oficiais (nível de emergência, condição de
 * estabilidade, categoria de risco). Servem como filtro transversal.
 */
import type { RegraTag } from "@/lib/tags";

export const REGRAS_TAGS_BARRAGENS: RegraTag[] = [
  {
    tag: "rejeitos",
    termos: [
      "rejeito",
      "rejeitos",
      "estéril",
      "esteril",
      "disposição de rejeitos",
      "descarte de rejeitos",
    ],
  },
  {
    tag: "mineração",
    termos: ["mineracao", "minerio", "minério", "mina", "lavra", "beneficiamento"],
  },
  {
    tag: "indústria",
    termos: ["industria", "industrial", "fabrica", "processamento"],
  },
  {
    tag: "hidrelétrica",
    termos: [
      "hidreletrica",
      "hidroeletrica",
      "hidro eletrica",
      "geração de energia",
      "usina",
      "central geradora",
    ],
  },
  {
    tag: "abastecimento",
    termos: [
      "abastecimento",
      "abastecimento publico",
      "agua para consumo",
      "sistema de abastecimento",
      "captação",
    ],
  },
  {
    tag: "irrigação",
    termos: ["irrigacao", "irrigar", "irrigado", "cultura irrigada"],
  },
  {
    tag: "piscicultura",
    termos: ["piscicultura", "criação de peixes", "tanque rede", "aquicultura"],
  },
  {
    tag: "água",
    termos: ["agua", "reservatorio", "rio", "curso d agua", "manancial", "represa"],
  },
  {
    tag: "alteamento a montante",
    termos: ["montante", "alteamento a montante", "metodo construtivo montante"],
  },
  {
    tag: "estabilidade",
    termos: [
      "estabilidade",
      "condicao de estabilidade",
      "não atestada",
      "nao atestada",
      "nao apresentou",
    ],
  },
  {
    tag: "alto risco",
    termos: ["alto", "categoria de risco alta", "risco alto"],
  },
  {
    tag: "alto dano potencial",
    termos: ["alto dano potencial", "dano potencial associado alto"],
  },
  {
    tag: "emergência",
    termos: ["emergencia", "nivel de emergencia", "emergência nivel"],
  },
  {
    tag: "descaracterização",
    termos: ["descaracterizacao", "descaracterização", "desativacao", "desativada"],
  },
];
