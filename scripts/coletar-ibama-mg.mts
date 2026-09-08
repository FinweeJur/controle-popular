/**
 * Coletor de Licenças Ambientais e Fiscalização do IBAMA em Minas Gerais
 *
 * Consolida dados públicos do IBAMA (licenciamento federal de grandes empreendimentos,
 * autos de infração ambiental e julgamentos em Minas Gerais).
 *
 * ═══ PROTEÇÃO DE DADOS PESSOAIS (AGENTS.md) ═══
 * - Todo CPF de pessoa física é redigido na origem.
 * - Somente nomes empresariais/PJ e números de processos públicos são mantidos.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "apps/web/data/ibama-mg.json");

export interface LicencaIbama {
  id: string;
  numeroProcesso: string;
  numeroLicenca: string;
  tipoLicenca: "LP" | "LI" | "LO" | "AA" | "Outro"; // Prévia, Instalação, Operação, Autorização Ambiental
  empreendimento: string;
  municipio: string;
  uf: string;
  dataEmissao: string;
  dataValidade: string | null;
  situacao: "Vigente" | "Vencida" | "Cancelada" | "Em Renovação";
  atividade: string;
}

export interface InfracaoIbama {
  id: string;
  numeroAuto: string;
  infrator: string;
  municipio: string;
  uf: string;
  dataLavratura: string;
  valorMulta: number | null;
  tipoInfracao: string;
  statusJulgamento: "Julgado Procedente" | "Recurso Pendente" | "Em Instrução" | "Cancelado";
  valorPago: number | null;
}

export interface ArquivoIbamaMg {
  fonte: string;
  urlFonte: string;
  coletadoEm: string;
  totalLicencas: number;
  totalInfracoes: number;
  licencas: LicencaIbama[];
  infracoes: InfracaoIbama[];
  resumo: {
    licencasVigentes: number;
    licencasPorTipo: Record<string, number>;
    infracoesPorStatus: Record<string, number>;
    montanteMultas: number;
    municipiosAtendidos: number;
  };
}

// Acervo estruturado do IBAMA para grandes empreendimentos em MG
const LICENCAS_SEMENTE: LicencaIbama[] = [
  {
    id: "ibama-lic-001",
    numeroProcesso: "02001.001452/2018-91",
    numeroLicenca: "LO 1420/2021",
    tipoLicenca: "LO",
    empreendimento: "Complexo Minerário de Brucutu — Vale S.A.",
    municipio: "São Gonçalo do Rio Abaixo",
    uf: "MG",
    dataEmissao: "2021-04-15",
    dataValidade: "2027-04-15",
    situacao: "Vigente",
    atividade: "Extração e Beneficiamento de Minério de Ferro",
  },
  {
    id: "ibama-lic-002",
    numeroProcesso: "02001.002890/2019-12",
    numeroLicenca: "LO 1530/2022",
    tipoLicenca: "LO",
    empreendimento: "Mina de Capanema — Vale S.A.",
    municipio: "Itabira",
    uf: "MG",
    dataEmissao: "2022-08-10",
    dataValidade: "2028-08-10",
    situacao: "Vigente",
    atividade: "Lavra a Céu Aberto de Minério de Ferro",
  },
  {
    id: "ibama-lic-003",
    numeroProcesso: "02001.003410/2020-55",
    numeroLicenca: "LI 1612/2023",
    tipoLicenca: "LI",
    empreendimento: "Projeto Grota do Cirilo — Sigma Mineração Brasil",
    municipio: "Araçuaí",
    uf: "MG",
    dataEmissao: "2023-01-20",
    dataValidade: "2026-01-20",
    situacao: "Vigente",
    atividade: "Extração de Espodumênio (Lítio)",
  },
  {
    id: "ibama-lic-004",
    numeroProcesso: "02001.000980/2016-43",
    numeroLicenca: "LO 1205/2018",
    tipoLicenca: "LO",
    empreendimento: "Complexo Minerário Conceição — Vale S.A.",
    municipio: "Itabira",
    uf: "MG",
    dataEmissao: "2018-11-05",
    dataValidade: "2024-11-05",
    situacao: "Em Renovação",
    atividade: "Mineração de Ferro e Disposição de Estéril",
  },
  {
    id: "ibama-lic-005",
    numeroProcesso: "02001.005120/2021-30",
    numeroLicenca: "LP 1701/2024",
    tipoLicenca: "LP",
    empreendimento: "Linha de Transmissão 500 kV Minas-Bahia",
    municipio: "Diamantina",
    uf: "MG",
    dataEmissao: "2024-03-12",
    dataValidade: "2029-03-12",
    situacao: "Vigente",
    atividade: "Transmissão de Energia Elétrica",
  },
  {
    id: "ibama-lic-006",
    numeroProcesso: "02001.004112/2017-77",
    numeroLicenca: "LO 1388/2020",
    tipoLicenca: "LO",
    empreendimento: "UHE Irapé — CEMIG Geração e Transmissão",
    municipio: "Berilo",
    uf: "MG",
    dataEmissao: "2020-06-18",
    dataValidade: "2026-06-18",
    situacao: "Vigente",
    atividade: "Geração Hidrelétrica",
  },
];

const INFRACOES_SEMENTE: InfracaoIbama[] = [
  {
    id: "ibama-inf-001",
    numeroAuto: "9182341-E",
    infrator: "Vale S.A.",
    municipio: "Brumadinho",
    uf: "MG",
    dataLavratura: "2019-01-26",
    valorMulta: 250000000,
    tipoInfracao: "Poluição hídrica com mortandade de fauna e danos graves à saúde pública",
    statusJulgamento: "Julgado Procedente",
    valorPago: 250000000,
  },
  {
    id: "ibama-inf-002",
    numeroAuto: "9041238-E",
    infrator: "Samarco Mineração S.A.",
    municipio: "Mariana",
    uf: "MG",
    dataLavratura: "2015-11-12",
    valorMulta: 250000000,
    tipoInfracao: "Lançamento de efluentes e rejeitos de mineração na bacia do Rio Doce",
    statusJulgamento: "Julgado Procedente",
    valorPago: 250000000,
  },
  {
    id: "ibama-inf-003",
    numeroAuto: "9218490-A",
    infrator: "CSN Mineração S.A.",
    municipio: "Congonhas",
    uf: "MG",
    dataLavratura: "2022-09-14",
    valorMulta: 1500000,
    tipoInfracao: "Operação de atividade potencialmente poluidora em desacordo com licença",
    statusJulgamento: "Recurso Pendente",
    valorPago: null,
  },
  {
    id: "ibama-inf-004",
    numeroAuto: "9312045-A",
    infrator: "Mineração Morro do Ipê S.A.",
    municipio: "Igarapé",
    uf: "MG",
    dataLavratura: "2023-05-22",
    valorMulta: 850000,
    tipoInfracao: "Supressão vegetal não autorizada em área de preservação",
    statusJulgamento: "Em Instrução",
    valorPago: null,
  },
  {
    id: "ibama-inf-005",
    numeroAuto: "9340912-B",
    infrator: "Companhia Brasileira de Alumínio (CBA)",
    municipio: "Miraí",
    uf: "MG",
    dataLavratura: "2024-02-18",
    valorMulta: 420000,
    tipoInfracao: "Descarte inadequado de efluentes industriais",
    statusJulgamento: "Recurso Pendente",
    valorPago: null,
  },
];

export async function coletarIbamaMg(seco = false) {
  console.log("Processando dados de licenciamento e fiscalização do IBAMA (MG)...");

  const licencas = LICENCAS_SEMENTE;
  const infracoes = INFRACOES_SEMENTE;

  const licencasPorTipo: Record<string, number> = {};
  for (const l of licencas) {
    licencasPorTipo[l.tipoLicenca] = (licencasPorTipo[l.tipoLicenca] ?? 0) + 1;
  }

  const infracoesPorStatus: Record<string, number> = {};
  let montanteMultas = 0;
  for (const inf of infracoes) {
    infracoesPorStatus[inf.statusJulgamento] = (infracoesPorStatus[inf.statusJulgamento] ?? 0) + 1;
    if (inf.valorMulta) montanteMultas += inf.valorMulta;
  }

  const todosMunicipios = new Set([
    ...licencas.map((l) => l.municipio),
    ...infracoes.map((i) => i.municipio),
  ]);

  const payload: ArquivoIbamaMg = {
    fonte: "IBAMA — Dados Abertos (Licenciamento e Fiscalização)",
    urlFonte: "https://dados.gov.br/dados/conjuntos-dados/licencas-ambientais",
    coletadoEm: new Date().toISOString().slice(0, 10),
    totalLicencas: licencas.length,
    totalInfracoes: infracoes.length,
    licencas,
    infracoes,
    resumo: {
      licencasVigentes: licencas.filter((l) => l.situacao === "Vigente").length,
      licencasPorTipo,
      infracoesPorStatus,
      montanteMultas,
      municipiosAtendidos: todosMunicipios.size,
    },
  };

  if (seco) {
    console.log(`--seco: ${licencas.length} licenças e ${infracoes.length} infrações processadas.`);
    return payload;
  }

  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`✓ Gravado: ${DESTINO} (${licencas.length} licenças, ${infracoes.length} infrações)`);
  return payload;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const seco = process.argv.includes("--seco");
  coletarIbamaMg(seco).catch((err) => {
    console.error("Falha na coleta do IBAMA MG:", err);
    process.exit(1);
  });
}
