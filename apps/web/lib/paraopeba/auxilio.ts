// GERADO a partir de `painel-paraopeba.html` (`docs/PLANO-INGESTAO-PARAOPEBA.md`
// mede a estrutura da fonte). Dado histórico/institucional — não recalculado
// pelo portal, atualiza por commit quando a fonte mudar.
//
// `PAYMENTS` e `DATA_PANEL` do painel — o acompanhamento do Novo Auxílio
// Emergencial (NAE/PNAB, Lei 14.755/2023), pago mensalmente pela FGV desde
// dez/2025.
//
// ═══ POR QUE OS NÚMEROS-RESUMO NÃO TÊM FONTE PRIMÁRIA PRÓPRIA AQUI ═══
//
// `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 1.6) mediu: o `RESUMO_AUXILIO`
// é uma AGREGAÇÃO que o painel-fonte já monta a partir de decisões
// judiciais, FGV e TJMG — não uma leitura direta de uma única fonte
// oficial. `nota` abaixo é o próprio texto de proveniência do painel-fonte,
// reproduzido sem edição — é o que garante que nenhum número aqui foi
// inventado: o que se lê é exatamente o que a fonte disse, com a mesma
// ressalva que ela mesma publicou ao lado.

export interface PagamentoParaopeba {
  mes: string;
  valor: string;
  status: string;
  observacao: string;
}

export const PAGAMENTOS_PARAOPEBA: PagamentoParaopeba[] = [
  {
    "mes": "Dezembro 2025",
    "valor": "R$ 123,9 mi",
    "status": "Pago",
    "observacao": "Primeiro pagamento do Novo Auxílio (17/12/2025)"
  },
  {
    "mes": "Janeiro 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Reajuste pelo salário mínimo; pagamentos até 5º dia útil"
  },
  {
    "mes": "Fevereiro 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Depósito judicial realizado em jan/2026"
  },
  {
    "mes": "Março 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Depósito realizado em 12/02/2026"
  },
  {
    "mes": "Abril 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Depósito confirmado em 30/03/2026 (NACAB)"
  },
  {
    "mes": "Maio 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Depósito de R$ 133 mi realizado em 23/04/2026"
  },
  {
    "mes": "Junho 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Vale depositou em maio/2026; FGV paga até 5º dia útil. ADPF 1314 no STF aguarda deliberação de Gilmar Mendes"
  },
  {
    "mes": "Julho 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "FGV mantém operação; auxílio pago normalmente"
  },
  {
    "mes": "Agosto 2026",
    "valor": "R$ 133,1 mi",
    "status": "Pago",
    "observacao": "Confirmado (30/07); parcelas de R$ 202,62 a R$ 1.621. Futuro depende do STF"
  }
];

export interface ResumoAuxilioParaopeba {
  totalPago: string;
  totalPagoDetalhe: string;
  pessoasAtendidas: string;
  pessoasAtendidasDetalhe: string;
  valorMensal: string;
  valorMensalDetalhe: string;
  municipiosAlcancados: string;
  municipiosAlcancadosDetalhe: string;
  statusJudicial: string;
  statusJudicialDetalhe: string;
  proximoDeposito: string;
  proximoDepositoDetalhe: string;
  novoAETotal: string;
  novoAETotalDetalhe: string;
  novoAEMeses: string;
  novoAEMesesDetalhe: string;
  /** Texto de proveniência do painel-fonte, reproduzido sem edição. */
  nota: string;
}

export const RESUMO_AUXILIO_PARAOPEBA: ResumoAuxilioParaopeba = {
  "totalPago": "R$ 21 bilhões+",
  "totalPagoDetalhe": "total pago pela Vale desde 2019 (indenizações + PTR + NAE + obras)",
  "pessoasAtendidas": "≈ 162 mil",
  "pessoasAtendidasDetalhe": "beneficiários ativos do NAE (relatório FGV: 162.061 em maio/2026)",
  "valorMensal": "R$ 133,1 mi",
  "valorMensalDetalhe": "custo mensal do Novo Auxílio Emergencial (jan/2026 em diante)",
  "municipiosAlcancados": "36",
  "municipiosAlcancadosDetalhe": "municípios da Bacia do Paraopeba com pessoas cadastradas",
  "statusJudicial": "Crítico — PGR contra",
  "statusJudicialDetalhe": "PGR (Gonet) opinou pela cassação em 11/07; Gilmar Mendes pode decidir a qualquer momento",
  "proximoDeposito": "Agosto garantido",
  "proximoDepositoDetalhe": "NAE de agosto/2026 confirmado; futuro do programa depende do STF",
  "novoAETotal": "R$ 1,05 bi+",
  "novoAETotalDetalhe": "depósitos acumulados do Novo AE segundo o Ibram (até maio/2026)",
  "novoAEMeses": "7 meses",
  "novoAEMesesDetalhe": "dezembro 2025 até junho 2026 (inclusive)",
  "nota": "Valores baseados em decisões judiciais, manifestações da FGV e comunicados do TJMG até junho de 2026. O total histórico inclui R$ 2,4 bi em auxílio emergencial pago pela Vale (2019–2021), R$ 4,4 bi do programa de repasses (2021–2025) e os depósitos do Novo Auxílio Emergencial (dez/2025 em diante). O valor acumulado do Novo AE (R$ 789,3 mi) refere-se a: R$ 123,9 mi (dez/2025) + 5 × R$ 133,1 mi (jan–mai/2026)."
};
