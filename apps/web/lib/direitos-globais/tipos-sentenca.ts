/**
 * @file apps/web/lib/direitos-globais/tipos-sentenca.ts
 * @description Tipo de uma sentença da Corte IDH.
 */

export interface Sentenca {
  pais: string;
  nome: string;
  serie: number;
  tipo: string;
  dataSentenca: string;
  url: string | null;
}
