/**
 * Tags de assunto para licenças ambientais do IDE-Sisema (Semad/MG).
 *
 * Extraídas de campos de texto já publicados pela fonte
 * (`setor_rotulo`, `subsetor`, `atividade_descricao`, `modalidade`,
 * `fase_licenciamento`, `situacao`, `nome_empreendimento`). Não substituem a
 * classificação oficial (setor, modalidade, classe) — são um recorte de
 * assunto para quem navega por tema.
 *
 * Regras mais específicas vêm antes de regras genéricas para que a ordem das
 * tags faça sentido na tela.
 */
import type { RegraTag } from "@/lib/tags";

export const REGRAS_TAGS_LICENCIAMENTO: RegraTag[] = [
  {
    tag: "mineração",
    termos: [
      "mineracao",
      "minera",
      "minerio",
      "minério",
      "mina",
      "lavra",
      "beneficiamento de minerio",
      "extração mineral",
      "granito",
      "calcario",
      "calcareo",
      "areia",
      "argila",
      "bauxita",
      "ferro",
      "manganês",
    ],
  },
  {
    tag: "metalurgia",
    termos: ["metalurgia", "siderurgia", "fundicao", "laminação", "aco", "aço", "aluminio"],
  },
  {
    tag: "petróleo e gás",
    termos: [
      "petroleo",
      "gas natural",
      "oleoduto",
      "gasoduto",
      "combustivel",
      "posto de combustivel",
      "distribuidora de combustivel",
    ],
  },
  {
    tag: "energia",
    termos: [
      "energia",
      "hidreletrica",
      "hidroeletrica",
      "hidro eletrica",
      "termoeletrica",
      "termoeletrica",
      "eolica",
      "solar",
      "geração de energia",
      "subestação",
      "linha de transmissão",
      "usina",
      "transmissão de energia",
    ],
  },
  {
    tag: "agronegócio",
    termos: [
      "agronegocio",
      "agropecuaria",
      "agricola",
      "agricultura",
      "agroindustrial",
      "silvicultura",
      "florestal",
    ],
  },
  {
    tag: "pecuária",
    termos: ["pecuaria", "bovino", "suino", "avicultura", "leite", "criação", "rebanho"],
  },
  {
    tag: "indústria",
    termos: [
      "industria",
      "industrial",
      "fabrica",
      "manufatura",
      "processamento",
      "beneficiamento",
      "galpao industrial",
    ],
  },
  {
    tag: "construção civil",
    termos: [
      "construção civil",
      "construcao civil",
      "empreendimento imobiliario",
      "loteamento",
      "condominio",
      "edificacao",
      "pavimentação",
    ],
  },
  {
    tag: "saneamento",
    termos: [
      "saneamento",
      "esgoto",
      "tratamento de esgoto",
      "agua residuaria",
      "estação de tratamento",
      "coleta de esgoto",
    ],
  },
  {
    tag: "resíduos",
    termos: [
      "residuos",
      "aterro",
      "disposição final",
      "tratamento de residuos",
      "reciclagem",
      "lixo",
      "dejetos",
    ],
  },
  {
    tag: "transporte",
    termos: [
      "transporte",
      "rodovia",
      "ferrovia",
      "terminal",
      "porto",
      "logistica",
      "viação",
      "transportadora",
    ],
  },
  {
    tag: "turismo",
    termos: ["turismo", "hotel", "pousada", "parque turistico", "resort", "lazer"],
  },
  {
    tag: "água",
    termos: [
      "agua",
      "abastecimento de agua",
      "captacao de agua",
      "manancial",
      "rio",
      "represa",
      "reservatorio",
    ],
  },
  {
    tag: "extração",
    termos: ["extração", "extracao", "exploração", "exploracao"],
  },
];
