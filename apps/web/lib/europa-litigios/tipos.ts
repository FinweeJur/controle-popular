/**
 * @file apps/web/lib/europa-litigios/tipos.ts
 * @description Contrato de dados da subfrente "Litígios transnacionais de
 * Mariana e Brumadinho na Europa" (/europa/litigios-transnacionais).
 *
 * Fonte oficial: decisões do High Court of Justice (Inglaterra e País de
 * Gales), da Suprema Corte do Reino Unido, do Rechtbank Rotterdam e do STF,
 * além das páginas institucionais das empresas e órgãos públicos citados.
 *
 * Decisão de modelagem: `caso` só aceita "mariana" ou "brumadinho" porque a
 * frente nasceu dos dois rompimentos. Casos europeus que NÃO são Brumadinho
 * (por exemplo, Braskem/Maceió) ficam em `ConexaoTransnacional`, para nunca
 * rotular um desastre como outro. Todo campo incerto carrega `pendente` e o
 * motivo em `observacaoPendencia`/`observacao` — número, data ou fase não
 * conferidos na fonte oficial não são publicados como se fossem fato.
 */

/** Rompimento de origem. Brumadinho não ganhou caso europeu confirmado na coleta. */
export type CasoLitigio = "mariana" | "brumadinho";

/** Tipo da fonte, usado para agrupar e para descrever a procedência na tela. */
export type TipoFonte =
  | "tribunal"
  | "orgao-publico"
  | "empresa"
  | "imprensa"
  | "documento";

/** Fonte com URL canônica e data em que foi acessada. */
export interface FonteLitigio {
  titulo: string;
  url: string;
  tipo: TipoFonte;
  dataAcesso: string;
}

/** Afirmação factual sempre acompanhada da fonte e da data de acesso. */
export interface FatoLitigio {
  descricao: string;
  data?: string;
  fonteUrl: string;
  dataAcesso: string;
  pendente?: boolean;
  observacaoPendencia?: string;
}

/** Ato processual datado (petição, audiência, decisão, recurso). */
export interface AtoProcessual {
  data: string;
  titulo: string;
  descricao: string;
  fonteUrl: string;
  dataAcesso: string;
  pendente?: boolean;
  observacaoPendencia?: string;
}

/** Próximo passo conhecido. Sem fonte oficial, fica marcado como pendente. */
export interface ProximoPasso {
  descricao: string;
  fonteUrl?: string;
  pendente?: boolean;
  observacaoPendencia?: string;
}

/** Litígio de Mariana ou Brumadinho em jurisdição europeia. */
export interface Litigio {
  id: string;
  caso: CasoLitigio;
  titulo: string;
  jurisdicao: string;
  tribunal: string;
  numeroProcesso: string;
  citacaoNeutra?: string;
  partes: {
    autores: string[];
    reus: string[];
  };
  objeto: string;
  faseProcessual: string;
  status: "em-andamento" | "julgado" | "pendente";
  fatos: FatoLitigio[];
  atos: AtoProcessual[];
  proximosPassos: ProximoPasso[];
  fontes: FonteLitigio[];
  dataAcesso: string;
  pendente: boolean;
  observacaoPendencia?: string;
}

/**
 * Conexão europeia que não pertence a Mariana nem a Brumadinho.
 * Existe para dar contexto sem falsear o campo `caso` de `Litigio`.
 */
export interface ConexaoTransnacional {
  id: string;
  titulo: string;
  jurisdicao: string;
  tribunal: string;
  numeroProcesso: string;
  objeto: string;
  faseProcessual: string;
  resumo: string;
  fontes: FonteLitigio[];
  dataAcesso: string;
  pendente: boolean;
  observacaoPendencia?: string;
}

/** Tipo de marco na linha do tempo. */
export type TipoItemLinhaDoTempo =
  | "desastre"
  | "decisao"
  | "acao"
  | "audiencia"
  | "julgamento"
  | "acordo";

/** Marco datado da linha do tempo. */
export interface ItemLinhaDoTempo {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: TipoItemLinhaDoTempo;
  fonteUrl: string;
  dataAcesso: string;
  pendente?: boolean;
  observacaoPendencia?: string;
}

/** Item de clipping: metadado e link, nunca a matéria inteira. */
export interface ItemClipping {
  id: string;
  veiculo: string;
  data: string;
  titulo: string;
  url: string;
  arquivoUrl?: string;
  idioma: "pt" | "en" | "es";
  paywall: boolean;
  dataAcesso: string;
}

/** Posicionamento oficial ou institucional, sempre com link. */
export interface Posicionamento {
  id: string;
  autor: string;
  data: string | null;
  resumo: string;
  url: string;
  dataAcesso: string;
  pendente?: boolean;
}

/** Bloco da ADPF. O número só entra depois de conferido no STF. */
export interface Adpf {
  numero: string;
  relator: string;
  objeto: string;
  status: string;
  datas: Array<{ rotulo: string; data: string | null }>;
  links: Array<{ titulo: string; url: string }>;
  relacaoComLitigios: string;
  dataAcesso: string;
  pendente: boolean;
  observacao: string;
}
