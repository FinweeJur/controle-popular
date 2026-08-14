// GERADO a partir de `painel-paraopeba.html` (`docs/PLANO-INGESTAO-PARAOPEBA.md`
// mede a estrutura da fonte). Dado histórico/institucional — não recalculado
// pelo portal, atualiza por commit quando a fonte mudar.
//
// `MILESTONES` do painel — os marcos do processo de reparação, do corte do
// auxílio (mar/2025) à confirmação do pagamento de agosto/2026.

export interface MarcoParaopeba {
  data: string;
  titulo: string;
  descricao: string;
  /** Cor do painel-fonte — verde (favorável aos atingidos), vermelho
   *  (desfavorável) ou azul (neutro/procedimental). Mantida como veio: é
   *  leitura editorial de quem montou o painel, não recalculada aqui. */
  cor: string;
}

export const MARCOS_PARAOPEBA: MarcoParaopeba[] = [
  {
    "data": "2025-03-14",
    "titulo": "ACP protocolada",
    "descricao": "Ação Civil Pública proposta pelas associações parceiras do MAB após o corte de 50% do auxílio",
    "cor": "#7C4DBC"
  },
  {
    "data": "2025-03-28",
    "titulo": "1ª liminar (juiz Murilo)",
    "descricao": "Juiz Murilo Abreu concede tutela de urgência determinando à Vale manter o auxílio nos moldes anteriores ao corte",
    "cor": "#1A5FA8"
  },
  {
    "data": "2025-05-21",
    "titulo": "Liminar suspensa",
    "descricao": "Desembargadora convocada Maria Dolores suspende a decisão de 1ª instância. Auxílio voltou ao valor cortado",
    "cor": "#9B1C1C"
  },
  {
    "data": "2025-10-01",
    "titulo": "Encerramento PTR",
    "descricao": "Programa de Transferência de Renda é encerrado. Mais de 160 mil pessoas ficam sem auxílio",
    "cor": "#9B1C1C"
  },
  {
    "data": "2025-11-13",
    "titulo": "TJMG restaura auxílio",
    "descricao": "Desembargador André Leite Praça retoma a decisão de 1ª instância: Vale obrigada a pagar o Novo Auxílio Emergencial",
    "cor": "#3A6B10"
  },
  {
    "data": "2025-12-17",
    "titulo": "1º pagamento Novo AE",
    "descricao": "FGV realiza o primeiro pagamento do Novo Auxílio Emergencial: R$ 123,9 milhões para cerca de 160 mil pessoas",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-03-05",
    "titulo": "TJMG confirma (2ª inst.)",
    "descricao": "19ª Câmara Cível rejeita recurso da Vale por unanimidade e mantém o Novo Auxílio Emergencial na segunda instância",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-04-08",
    "titulo": "ADPF 1314 no STF",
    "descricao": "Ibram protocola no STF ação questionando a constitucionalidade da PNAB. Relatoria do min. Gilmar Mendes",
    "cor": "#9B1C1C"
  },
  {
    "data": "2026-04-24",
    "titulo": "Presidente TJMG nega Vale",
    "descricao": "Presidente Corrêa Júnior rejeita dois recursos da Vale, mantendo todas as decisões sobre o Novo Auxílio",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-05-07",
    "titulo": "AGU defende NAE no STF",
    "descricao": "AGU (Contencioso) pede ao STF que rejeite a ação do Ibram e defenda a aplicabilidade da PNAB ao caso Brumadinho",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-05-13",
    "titulo": "TJMG explica ao STF",
    "descricao": "Desembargador Leite Praça presta esclarecimentos ao STF sobre as decisões do TJMG, rebatendo argumento da retroatividade",
    "cor": "#1A5FA8"
  },
  {
    "data": "2026-05-14",
    "titulo": "Divergência na AGU",
    "descricao": "Consultoria-Geral da União, a pedido da Presidência, envia ao STF posição contrária ao NAE, gerando contradição interna no governo",
    "cor": "#9B1C1C"
  },
  {
    "data": "2026-06-11",
    "titulo": "IAC 18 no STJ — voto dividido",
    "descricao": "STJ julga se o Termo DPMG-Vale é título executivo para ações individuais. Relator vota contra as vítimas; ministra Nancy Andrighi diverge. Julgamento suspenso",
    "cor": "#1A5FA8"
  },
  {
    "data": "2026-06-22",
    "titulo": "MPF encerra 1º semestre de oitivas",
    "descricao": "MPF conclui a primeira etapa da fase de instrução criminal no TRF6. Procuradores reafirmam busca pela punição dos responsáveis pelas 270 mortes",
    "cor": "#1A5FA8"
  },
  {
    "data": "2026-07-11",
    "titulo": "PGR pede cassação do NAE",
    "descricao": "Procurador-geral Paulo Gonet opina pela procedência total da ação do Ibram, defendendo a cassação das decisões do TJMG — parecer contrário aos atingidos",
    "cor": "#9B1C1C"
  },
  {
    "data": "2026-07-21",
    "titulo": "MAB protesta em BH",
    "descricao": "Centenas de atingidos protestam contra o parecer da PGR e cobram julgamento da ADPF 1314 pelo plenário do STF, não por decisão monocrática",
    "cor": "#3A6B10"
  },
  {
    "data": "2026-07-30",
    "titulo": "Auxílio de agosto confirmado",
    "descricao": "NAE de agosto/2026 é garantido (parcelas de R$ 202,62 a R$ 1.621). Futuro do programa continua dependente da decisão do STF",
    "cor": "#3A6B10"
  }
];
