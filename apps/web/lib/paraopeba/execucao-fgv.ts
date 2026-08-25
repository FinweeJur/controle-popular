// GERADO por `scripts/coletar-execucao-fgv.mts` a partir dos dois JSON
// públicos da auditoria da FGV (`www18.fgv.br/projetorioparaopeba`).
// Não editar à mão: rode o script de novo.
//
// A FGV é a auditora independente do Acordo Judicial de Reparação de
// Brumadinho (R$ 37,6 bi, 04/02/2021), nomeada pelo Juízo da 2ª Vara da
// Fazenda Pública. Estes números são a execução dos Anexos I.3 e I.4 —
// a parte do Acordo que vira projeto dentro de cada município da bacia.
//
// ⚠️ ISTO NÃO É O ACORDO INTEIRO. São R$ 5,48 bi de acordo atualizado
// nos 26 municípios, contra os R$ 37,6 bi do Acordo todo: mobilidade,
// segurança hídrica, fortalecimento do serviço público e reparação
// socioambiental correm por fora, sob gestão do Estado, e a FGV não os
// audita aqui. Somar este total com o do Acordo inventa dinheiro.
//
// ⚠️ "Executado" é desembolso do projeto, não obra pronta. O avanço
// FÍSICO mora em outro arquivo da FGV, que esta coleta não traz —
// `docs/FONTES-PRO-BRUMADINHO-E-FGV.md` explica por quê.

/** Um dos 26 municípios da Bacia do Paraopeba cobertos pelo Anexo I.3/I.4. */
export interface MunicipioExecucaoFgv {
  municipio: string;
  /** Valor destinado ao município no texto original do Acordo (R$). */
  acordoInicial: number;
  /** O mesmo valor corrigido pelo IPCA desde 04/02/2021 (R$). */
  acordoAtual: number;
  /** Já reservado para projetos com ordem de início autorizada (R$). */
  empenhosAutorizados: number;
  /** Sobra disponível, já descontada a reserva de 25% da FGV (R$). */
  saldoTeto: number;
}

/** Uma linha (município × projeto) da síntese financeira da FGV. */
export interface ProjetoExecucaoFgv {
  municipio: string;
  projeto: string;
  empenhoNominal: number;
  empenhoAtualizado: number;
  /** Valor efetivamente despendido — desembolso, não obra entregue. */
  executado: number;
  saldo: number;
  /** Percentual de execução sobre o empenho atualizado (0 a 100). */
  nivelExecucao: number;
}

/** Projeto especial: fora do rateio por município, sob gestão estadual. */
export interface ProjetoEspecialFgv {
  projeto: string;
  empenhoNominal: number;
  empenhoAtualizado: number;
  executado: number;
  saldo: number;
  nivelExecucao: number;
}

/** Situação declarada de cada projeto, por município alcançado. */
export interface StatusProjetoFgv {
  /** Identificador do projeto na FGV — repete entre municípios. */
  idFdi: string;
  projeto: string;
  /** Só municípios de verdade — o rótulo estadual sai daqui. */
  municipios: string[];
  /** `true` quando o projeto alcança todo o estado, não só a bacia. */
  estadual: boolean;
  anexo: string;
  fluxo: string;
  status: string;
}

/**
 * Datas que a própria FGV declara nos arquivos. Rotular a tela por elas,
 * nunca por "hoje": o relatório é mensal e a coleta é manual.
 */
export const REFERENCIA_EXECUCAO_FGV = {
  /** `dataAtualizacaoRelatorio` do arquivo de status (dd/mm/aaaa). */
  relatorio: "20/07/2026",
  /** Data que o arquivo financeiro declara no próprio menu. */
  financeiro: "15/07/2026",
  /** Quando este portal baixou (aaaa-mm-dd). */
  coletadoEm: "2026-08-15",
  fonte: "FGV — Projeto Rio Paraopeba",
  url: "https://www18.fgv.br/projetorioparaopeba/acompanhamento-saldo-municipios.html",
} as const;

/**
 * A linha "Total Geral" da própria FGV — guardada como ela vem, para a
 * tela poder conferir a soma em vez de somar por conta própria (e para
 * a diferença aparecer, se um dia houver).
 */
export const TOTAL_EXECUCAO_FGV = {
  acordoInicial: 3999999999.1,
  acordoAtual: 5484273356.84,
  empenhosAutorizados: 4780952787.38,
  saldoTeto: 521325903.44,
} as const;

/**
 * Contagens do acervo, para páginas SERVIDOR que só mostram números.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `MUNICIPIOS_EXECUCAO_FGV` (26 cidades) e `STATUS_PROJETOS_FGV` (455
 * linhas) somam 226 KB — se a home importar os arrays só para exibir
 * `.length` e `new Set(...).size`, o webpack embute o arquivo inteiro no
 * bundle do Worker (ver `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`). Esta
 * cobertura é literal e pequena. A paridade entre a cobertura e os arrays é
 * travada por teste em `dados.test.ts` — se alguém regenerar o acervo e a
 * contagem mudar, o teste falha. A página `/paraopeba/execucao` continua
 * importando os arrays DE PROPÓSITO (monta a tabela no servidor, zero JS);
 * a home usa só as contagens daqui.
 */
export const COBERTURA_EXECUCAO_FGV = {
  municipios: 26,
  projetosDistintos: 234,
} as const;




