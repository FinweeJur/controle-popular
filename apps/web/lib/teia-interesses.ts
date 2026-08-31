/**
 * Estruturas da Teia de Interesses e gerador do Relatório do Cidadão.
 *
 * A Teia mapeia nós (político, empresa, imóvel rural, barragem, contrato,
 * processo judicial, terra indígena) e arestas (contratou, sobrepoe,
 * doou_para, e_socio_de, foi_autuado_por, votou_em, responde_a). As
 * estruturas existem para o grafo que será montado a partir de dados
 * coletados: nenhum vínculo é exibido antes de existir comprovação em
 * fonte oficial — ver AGENTS.md (regra editorial).
 */

export type TipoNo =
  | "politico"
  | "empresa"
  | "imovel_rural"
  | "barragem"
  | "contrato_publico"
  | "processo_judicial"
  | "terra_indigena";

export interface NoGrafo {
  id: string;
  tipo: TipoNo;
  rotulo: string;
  subtitulo?: string;
  detalhes: Record<string, string | number>;
  urlOficial?: string;
  alerta?: boolean;
}

export interface ArestaGrafo {
  id: string;
  origemId: string;
  destinoId: string;
  relacao:
    | "e_socio_de"
    | "doou_para"
    | "contratou"
    | "sobrepoe"
    | "foi_autuado_por"
    | "votou_em"
    | "responde_a";
  rotulo: string;
  valorReais?: number;
  documentoRef?: string;
  urlComprovante?: string;
}

export interface TeiaInteressesMunicipio {
  idMunicipio: string;
  nomeMunicipio: string;
  uf: string;
  nos: NoGrafo[];
  arestas: ArestaGrafo[];
  estatisticas: {
    totalNos: number;
    totalArestas: number;
    totalContratosDoadoresReais: number;
    totalSobreposicaoHa: number;
    totalProcessosAmbientais: number;
  };
}

export interface LinkOficial {
  rotulo: string;
  url: string;
}

export interface SecaoComDado {
  nome: string;
  href: string;
  desc: string;
}

export interface FichaMunicipioRelatorio {
  idMunicipio: string;
  nome: string;
  uf: string;
  cnpjPrefeitura?: string | null;
  dominio?: string | null;
  linksOficiais: LinkOficial[];
}

export interface RelatorioCidadao {
  tipo: "relatorio-controle-popular";
  geradoEm: string;
  municipio: {
    id_municipio: string;
    nome: string;
    uf: string;
    cnpj_prefeitura?: string | null;
  };
  linksOficiais: LinkOficial[];
  secoesComDado: SecaoComDado[];
  metodologia: string[];
}

/**
 * Gera o relatório que o cidadão pode salvar. Só contém dados reais:
 * ficha do município, links oficiais e ponteiros para as páginas que já
 * têm dado coletado. Não inventa vínculo nenhum — a lacuna é declarada.
 */
export function gerarRelatorioCidadao(
  ficha: FichaMunicipioRelatorio,
  secoesComDado: SecaoComDado[]
): RelatorioCidadao {
  return {
    tipo: "relatorio-controle-popular",
    geradoEm: new Date().toISOString(),
    municipio: {
      id_municipio: ficha.idMunicipio,
      nome: ficha.nome,
      uf: ficha.uf,
      cnpj_prefeitura: ficha.cnpjPrefeitura ?? null,
    },
    linksOficiais: ficha.linksOficiais.filter(
      (l) => typeof l.url === "string" && l.url.trim().length > 0
    ),
    secoesComDado,
    metodologia: [
      "O portal cruza apenas atos oficiais e dados públicos (PNCP, TSE, SICAR, SIGBM/ANM, SIRENEJud, DATASUS).",
      "Nenhum vínculo entre pessoas, empresas e território é exibido antes de existir comprovação em fonte oficial.",
      "Número não coletado não é estimado: a lacuna é declarada na página.",
    ],
  };
}
