/**
 * Os valores de `contratos.status` que contam como "em vigor agora".
 *
 * Arquivo à parte, sem NENHUM import, de propósito: precisa ser importável
 * tanto do lado do servidor (`lib/db/queries/betim.ts`, para o filtro da
 * home) quanto de um componente cliente (`ListaContratos.tsx`, para a cor do
 * selo). Um `import type` de `lib/betim/contratos.ts` já bastava para os
 * TIPOS, mas aquele arquivo importa `lib/db/queries/betim` em tempo de
 * execução — colocar esta constante lá dentro traria o driver do Postgres
 * pro bundle do navegador.
 *
 * ═══ POR QUE HÁ MAIS DE UM VALOR ═══
 *
 * `etl/pncp/contratos.py` (Betim, Araçuaí, Diamantina, SP) computa o status a
 * partir da vigência e grava só `'ativo' | 'encerrado'`, minúsculo.
 * `etl/pbh/contratos.py` (Belo Horizonte) grava literalmente o que o GRP da
 * Ábaco devolve — `'EM EXECUÇÃO'`, `'PRÉ-EXECUÇÃO'`, `'ENCERRADO'`,
 * `'RESCINDIDO'`, `'CANCELADO'` — porque é a fonte falando, não um cálculo
 * nosso, e vale manter o texto rico na tela (é mais informativo que reduzir
 * tudo a "ativo").
 *
 * Achado pela auditoria de 2026-08-11: com a comparação de igualdade contra
 * só `"ativo"`, a home de BH mostrava "0 contratos ativos / R$0" enquanto a
 * lista de contratos mostrava milhares, muitos "EM EXECUÇÃO" — e o selo de
 * cada linha saía cinza (inativo) mesmo em contrato correndo agora.
 */
export const STATUS_CONTRATO_ATIVO = ["ativo", "EM EXECUÇÃO", "PRÉ-EXECUÇÃO"] as const;

export function contratoEstaAtivo(status: string | null | undefined): boolean {
  return status != null && (STATUS_CONTRATO_ATIVO as readonly string[]).includes(status);
}
