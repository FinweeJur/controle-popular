/**
 * Tipos e leitura do acervo de transporte das Eleições 2026.
 *
 * Fonte: dados oficiais do TSE/TREs, governos estaduais e prefeituras,
 * conferidos em 21/10/2026 antes do 2º turno.
 *
 * O JSON é versionado no repositório e lido no build. A página separa
 * gratuidade universal (políticas) de transporte especial da Justiça
 * Eleitoral (TREs) para não misturar conceitos diferentes.
 */

import acervoJson from "@/data/eleicoes/2026/transporte-gratuito-2026.json";

export type TipoPolitica =
  | "estadual"
  | "distrital"
  | "metropolitana"
  | "municipal";

export type StatusTre = "pagina" | "noticia" | "programa" | "sem-pagina";

export type FonteDenuncia = "oficial" | "imprensa";

export interface TurnoEleicao {
  nome: string;
  data: string;
}

export interface PoliticaTransporte {
  id: string;
  uf: string;
  ente: string;
  tipo: TipoPolitica;
  cobertura: string;
  modalidades: string;
  periodo: string;
  fonteNome: string;
  fonteUrl: string;
  fonteData: string;
  observacao: string;
}

export interface TreTransporte {
  uf: string;
  nome: string;
  status: StatusTre;
  resumo: string;
  fonteNome: string;
  fonteUrl: string;
  fonteData: string;
  observacao: string;
}

export interface DenunciaTransporte {
  id: string;
  uf: string;
  ente: string;
  titulo: string;
  resumo: string;
  fonteNome: string;
  fonteUrl: string;
  fonteData: string;
  tipoFonte: FonteDenuncia;
  observacao: string;
}

export interface AcervoTransporte {
  geradoEm: string;
  eleicao: string;
  turnos: TurnoEleicao[];
  aviso: string;
  politicas: PoliticaTransporte[];
  denuncias: DenunciaTransporte[];
  tres: TreTransporte[];
}

export const acervoTransporte = acervoJson as AcervoTransporte;

export const ROTULOS_TIPO: Record<TipoPolitica, string> = {
  estadual: "Estadual",
  distrital: "Distrital",
  metropolitana: "Metropolitana",
  municipal: "Municipal",
};

export const ROTULOS_STATUS: Record<StatusTre, string> = {
  pagina: "Página dedicada",
  noticia: "Notícia oficial",
  programa: "Seu Voto Importa",
  "sem-pagina": "Sem página específica",
};

export const ROTULOS_FONTE_DENUNCIA: Record<FonteDenuncia, string> = {
  oficial: "Fonte oficial",
  imprensa: "Imprensa",
};

export function formatarDataFonte(valor: string): string {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`;

  const mes = /^(\d{4})-(\d{2})$/.exec(valor);
  if (mes) {
    const nomes = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    return `${nomes[Number(mes[2]) - 1]}/${mes[1]}`;
  }

  return valor;
}
