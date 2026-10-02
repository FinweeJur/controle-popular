/**
 * @file apps/web/lib/estado/renuncia-fiscal.ts
 * @description Tipos da renúncia fiscal (Gastos Tributários) por função
 * orçamentária e região — Receita Federal. Exibido em
 * `/estado-e-economia/renuncia-fiscal`.
 *
 * ═══ O QUE É (AGENTS §7) ═══
 * Gasto tributário é a desoneração que o governo concede FORA do orçamento:
 * isenção, redução de alíquota, regime especial. Não é irregularidade — é
 * escolha de política pública que reduz a arrecadação. Publicar o número permite
 * a pergunta cívica: quem se beneficia e a que custo?
 *
 * CLIENT-SAFE: não lê arquivo. A leitura mora em
 * `lib/server-only/dados-renuncia-fiscal.ts`.
 */

export interface RenunciaPorFuncao extends Record<string, unknown> {
  funcao: string;
  norte: number;
  nordeste: number;
  centro_oeste: number;
  sudeste: number;
  sul: number;
  total: number;
}

export interface AcervoRenunciaFiscal {
  fonte: string;
  url_fonte: string;
  url_arquivo: string;
  ano_base: number;
  serie: string;
  atualizado_em: string;
  metodologia: string;
  total_renuncia: number;
  total_arrecadacao: number | null;
  renuncia_sobre_arrecadacao: number | null;
  total_por_regiao: Record<string, number>;
  total_funcoes: number;
  registros: RenunciaPorFuncao[];
}
