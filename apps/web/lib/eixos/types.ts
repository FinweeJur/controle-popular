/**
 * apps/web/lib/eixos/types.ts
 *
 * Tipos canônicos da arquitetura de 3 Eixos Temáticos do Controle Popular:
 * - Eixo 1: Direitos em Movimento
 * - Eixo 2: Terra e Territórios
 * - Eixo 3: Estado e Economia
 *
 * Modelo estrito com suporte a cruzamentos analíticos e sugestões interdisciplinares.
 */

export type EixoId = 'direitos' | 'terra' | 'estado' | 'central';

export type SubfrenteId =
  // Eixo 1: Direitos em Movimento
  | 'trabalho-e-renda'
  | 'saude-publica'
  | 'educacao'
  | 'seguranca-alimentar'
  | 'moradia'
  | 'acesso-a-justica'
  // Eixo 2: Terra e Territórios
  | 'meio-ambiente'
  | 'terras-indigenas-quilombolas'
  | 'cidades'
  | 'nossas-serras'
  | 'nossos-rios'
  | 'biomas'
  // Eixo 3: Estado e Economia
  | 'judiciario'
  | 'congresso'
  | 'executivo'
  | 'empresas'
  | 'orcamento'
  | 'transparencia'
  // Eixo Central: ONSA e Ferramentas
  | 'busca'
  | 'laboratorio'
  | 'editais'
  | 'biblioteca'
  | 'noticias'
  | 'tecnologia'
  | 'documentacao'
  | 'alertas'
  | 'estudos-rurais'
  | 'imprensa'
  | 'sobre'
  | 'termos';

export interface Eixo {
  id: EixoId;
  titulo: string;
  subtitulo: string;
  descricao: string;
  corVar: string;     // Ex: '--cp-eixo-direitos'
  corInkVar: string;  // Ex: '--cp-eixo-direitos-ink'
  subfrentes: Subfrente[];
}

export interface Subfrente {
  id: SubfrenteId;
  eixoId: EixoId;
  titulo: string;
  descricao: string;
  slug: string;
  icone: string;
  tagsRelacionadas: string[];
  rotaLegada?: string; // Ex: '/ambiental' ou '/judiciario' para camada guarda-chuva
}

export interface Indicador {
  chave: string;
  nome: string;
  valor: number | string | null;
  unidade?: string;
  fonte: string;
  anoReferencia?: number;
  explicacaoLeiga?: string;
}

export interface Ficha {
  id: string;
  slug: string;
  eixo: EixoId;
  subfrente: SubfrenteId;
  titulo: string;
  resumo: string;
  conteudo?: string;
  dataPublicacao: string; // ISO 8601
  dataAtualizacao?: string;
  fontes: {
    nome: string;
    url?: string;
    orgao?: string;
  }[];
  indicadores?: Indicador[];
  cidadesRelacionadas?: string[]; // Códigos IBGE de 7 dígitos
  tags: string[];
  nivel?: 'municipal' | 'estadual' | 'federal' | 'internacional';
}

export interface SugestaoRelacao {
  ficha: Ficha;
  tipoConexao: 'mesmo-municipio' | 'tema-correlato' | 'interdisciplinar';
  motivo: string;
  score: number;
}

export interface CruzamentoMunicipalItem {
  titulo: string;
  formula: string; // Ex: 'Renda × IDEB'
  explicacao: string;
  /**
   * `sem-dado` NÃO é "está tudo bem": é a lacuna declarada, e o renderizador
   * dá selo próprio para ela. Sem este status, um município sem dado nenhum
   * saía na tela com selo "Regular" — o leitor lia ausência de informação
   * como avaliação de resultado (AGENTS.md, regra editorial).
   */
  status: 'atencao' | 'positivo' | 'neutro' | 'sem-dado';
  indicadoresEnvolvidos: string[];
  /**
   * Critério numérico que produziu o selo, quando ele não vem de fonte
   * oficial. Exibido na tela para o leitor saber o que está medindo —
   * limiar sem origem impresso como se fosse dado de DataSUS/INEP é dano.
   */
  criterio?: string;
}
