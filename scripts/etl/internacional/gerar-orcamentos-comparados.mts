/**
 * @file scripts/etl/internacional/gerar-orcamentos-comparados.mts
 * @description Gerador do acervo comparativo de orçamentos públicos das potências mundiais:
 * Estados Unidos (EUA), Canadá e Europa (União Europeia, Reino Unido, Alemanha, França e Itália).
 *
 * Papel no portal:
 * Alimenta a nova rota `/internacional/orcamentos` no Padrão das Seis Qualidades do Controle Popular,
 * apresentando auditoria cívica rigorosa e comparável sobre as 7 dimensões orçamentárias estratégicas:
 * 1. Orçamento Militar (Defesa & Forças Armadas)
 * 2. Orçamento de Inteligência (Espionagem, Cibersegurança & Operações Classificadas)
 * 3. Orçamento Econômico (Tesouro, Fomento, Subsídios & Dívida Pública)
 * 4. Orçamento Tecnológico (P&D, Ciência, Semicondutores & IA)
 * 5. Orçamento Hídrico (Recursos Hídricos, Bacias, Diques & Saneamento)
 * 6. Orçamento Energético (Transição, Renovável, Nuclear & Redes Elétricas)
 * 7. Orçamento de Combate à Crise Climática (Descarbonização, Mitigação & Fundo Verde)
 *
 * Fontes Primárias Oficiais e Verificadas:
 * - EUA: Office of the Under Secretary of Defense (Comptroller), DNI (National Intelligence Program),
 *   US Treasury (Fiscal Data), USACE Civil Works, DoE Loan Programs Office, EPA e CHIPS.gov.
 * - Canadá: Treasury Board of Canada, Department of National Defence (DND), CSIS, Finance Canada,
 *   Canada Water Agency, NRCan e 2030 Emissions Reduction Plan.
 * - União Europeia: European Commission (Budget Online, MFF 2021-2027, NextGenerationEU, Horizon Europe,
 *   European Defence Fund, REPowerEU, LIFE e European Green Deal).
 * - Reino Unido, Alemanha, França e Itália: HM Treasury, Bundesfinanzministerium (Bundeshaushalt),
 *   Loi de Programmation Militaire (LPM França) e Ministero dell'Economia e delle Finanze (MEF Itália).
 *
 * Regras Técnicas:
 * - Compactação via `apps/web/lib/estatico/compactar.ts` (esqueleto + rótulos internados).
 * - Totalmente livre de dados pessoais civis (LGPD) e 100% de URLs canônicas HTTPS verificadas.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compactar } from "../../../apps/web/lib/estatico/compactar.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAMINHO_SAIDA = join(__dirname, "../../../apps/web/data/internacional/orcamentos-comparados.compact.json");

export type BlocoGeopolitico = "EUA" | "Canada" | "Europa";

export type EixoOrcamentario =
  | "militar"
  | "inteligencia"
  | "economico"
  | "tecnologico"
  | "hidrico"
  | "energetico"
  | "clima";

export interface RegistroOrcamentoBruto {
  id: string;
  bloco: BlocoGeopolitico;
  pais: string;
  codigoIso3: string;
  eixo: EixoOrcamentario;
  eixoRotulo: string;
  programaAgencia: string;
  descricao: string;
  valorUsdBi: number;
  valorMoedaOriginal: string;
  moeda: "USD" | "CAD" | "EUR" | "GBP";
  pctPib: number;
  anoExercicio: string;
  destaqueProjetos: string[];
  orgaoExecutor: string;
  fonteOficialNome: string;
  urlFonteOficial: string;
  cruzamentoBrasil: string;
}

const REGISTROS_ORCAMENTO: RegistroOrcamentoBruto[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ESTADOS UNIDOS DA AMÉRICA (EUA)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-eua-militar-dod",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "Department of Defense (DoD) / National Defense Authorization Act (NDAA)",
    descricao: "Maior orçamento militar do planeta. Cobre Exército, Marinha, Força Aérea, Space Force, estoques de munição, modernização da tríade nuclear e compras de armamentos estratégicos com empreiteiras do Pentágono (Lockheed, Raytheon, General Dynamics).",
    valorUsdBi: 842.0,
    valorMoedaOriginal: "US$ 842,0 bi",
    moeda: "USD",
    pctPib: 3.1,
    anoExercicio: "FY 2024",
    destaqueProjetos: [
      "Modernização da tríade nuclear (submarinos Columbia, bombardeiro B-21 e mísseis Sentinel)",
      "Caças F-35 Lightning II e defesa antimísseis",
      "Ajuda militar externa e reposição de estoques da OTAN"
    ],
    orgaoExecutor: "Department of Defense (DoD)",
    fonteOficialNome: "Office of the Under Secretary of Defense (Comptroller)",
    urlFonteOficial: "https://comptroller.defense.gov/Budget-Materials/",
    cruzamentoBrasil: "Impacta a demanda por minerais estratégicos brasileiros (nióbio e titânio) e influencia acordos bilaterais de segurança do Comando Sul (SOUTHCOM)."
  },
  {
    id: "orc-eua-inteligencia-nip-mip",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "inteligencia",
    eixoRotulo: "Inteligência & Espionagem",
    programaAgencia: "National Intelligence Program (NIP) & Military Intelligence Program (MIP)",
    descricao: "O 'Black Budget' público dos EUA. Financia as 18 agências da Comunidade de Inteligência, incluindo CIA, NSA (escuta global e criptografia), NRO (satélites espiões), NGA (geointeligência) e divisões de inteligência militar das forças armadas.",
    valorUsdBi: 99.6,
    valorMoedaOriginal: "US$ 99,6 bi",
    moeda: "USD",
    pctPib: 0.36,
    anoExercicio: "FY 2024",
    destaqueProjetos: [
      "Vigilância de sinais cibernéticos e espionagem de cabos submarinos (NSA)",
      "Constelação de satélites de reconhecimento orbital em tempo real (NRO)",
      "Operações clandestinas humanas e contraterrorismo global (CIA)"
    ],
    orgaoExecutor: "Office of the Director of National Intelligence (ODNI)",
    fonteOficialNome: "Director of National Intelligence (ODNI Annual Release)",
    urlFonteOficial: "https://www.dni.gov/index.php/newsroom/reports-publications",
    cruzamentoBrasil: "Histórico de espionagem revelado pelo caso Snowden (monitoramento da Petrobras, Presidência e Ministério de Minas e Energia)."
  },
  {
    id: "orc-eua-economico-tesouro",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "economico",
    eixoRotulo: "Fomento Econômico",
    programaAgencia: "Department of the Treasury / Service of Public Debt & DFC",
    descricao: "Gastos federais em serviço da dívida pública bruta (juros de Treasuries), fomento de pequenas empresas (SBA), agências de financiamento exterior (DFC e EXIM Bank) e programas econômicos federais civis.",
    valorUsdBi: 870.0,
    valorMoedaOriginal: "US$ 870,0 bi",
    moeda: "USD",
    pctPib: 3.2,
    anoExercicio: "FY 2024",
    destaqueProjetos: [
      "Pagamento de juros da dívida federal americana (impacto das taxas do Fed)",
      "US International Development Finance Corporation (DFC para infraestrutura externa)",
      "Export-Import Bank dos EUA (garantias para exportadores americanos)"
    ],
    orgaoExecutor: "Department of the Treasury",
    fonteOficialNome: "US Treasury Fiscal Data",
    urlFonteOficial: "https://fiscaldata.treasury.gov/",
    cruzamentoBrasil: "As taxas de juros dos Treasuries atraem capitais globais, pressionando o câmbio do Real brasileiro e o custo de captação externa de empresas como Vale e Petrobras."
  },
  {
    id: "orc-eua-tecnologico-chips-darpa",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "tecnologico",
    eixoRotulo: "P&D & Tecnologia",
    programaAgencia: "CHIPS and Science Act / DARPA / NSF / NASA Science",
    descricao: "Maior pacote federal de fomento tecnológico da história recente. Foco em produção doméstica de semicondutores avançados, computação quântica, inteligência artificial, robótica avançada e exploração espacial profunda.",
    valorUsdBi: 78.5,
    valorMoedaOriginal: "US$ 78,5 bi",
    moeda: "USD",
    pctPib: 0.29,
    anoExercicio: "FY 2024",
    destaqueProjetos: [
      "Subsídios da CHIPS Act para novas megafábricas de chips (Intel, TSMC, Micron)",
      "DARPA: pesquisas em IA militar, drones autônomos e interfaces cérebro-máquina",
      "National Science Foundation (NSF) e NASA Science Directorate"
    ],
    orgaoExecutor: "Department of Commerce (NIST) / DoD (DARPA) / NSF",
    fonteOficialNome: "National Institute of Standards and Technology (NIST / CHIPS.gov)",
    urlFonteOficial: "https://www.chips.gov/",
    cruzamentoBrasil: "Restrições de exportação de tecnologia afetam o parque universitário brasileiro e aumentam a disputa global pelo lítio do Vale do Jequitinhonha."
  },
  {
    id: "orc-eua-hidrico-usace-reclamation",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "hidrico",
    eixoRotulo: "Recursos Hídricos",
    programaAgencia: "US Army Corps of Engineers (Civil Works) / Bureau of Reclamation / EPA SRF",
    descricao: "Financiamento de engenharia hídrica federal: diques contra furacões no Golfo, dragagem do Rio Mississippi, gestão de escassez no Rio Colorado (Hoover Dam) e fundos rotativos estaduais de água potável e esgoto.",
    valorUsdBi: 15.6,
    valorMoedaOriginal: "US$ 15,6 bi",
    moeda: "USD",
    pctPib: 0.06,
    anoExercicio: "FY 2024",
    destaqueProjetos: [
      "Operação e reforma de 700 barragens federais e eclusas fluviais pelo USACE",
      "Combate à seca histórica na Bacia do Rio Colorado (Bureau of Reclamation)",
      "Substituição de redes de chumbo e combate a PFAS em água tratada (EPA)"
    ],
    orgaoExecutor: "US Army Corps of Engineers / Department of the Interior / EPA",
    fonteOficialNome: "USACE Civil Works Budget & Bureau of Reclamation",
    urlFonteOficial: "https://www.usace.army.mil/Missions/Civil-Works/",
    cruzamentoBrasil: "Cooperação técnica da ANA com o USACE em segurança de barragens e regulação hídrica na Bacia do São Francisco."
  },
  {
    id: "orc-eua-energetico-doe-lpo",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "energetico",
    eixoRotulo: "Matriz & Transição Energética",
    programaAgencia: "Department of Energy (DoE) / Loan Programs Office (LPO) / OCED",
    descricao: "Recursos para transição da rede elétrica, reatores nucleares avançados, centros de hidrogênio limpo (Clean Hydrogen Hubs), captura de carbono e autoridade trilionária de empréstimos garantidos para baterias e minerais críticos.",
    valorUsdBi: 51.8,
    valorMoedaOriginal: "US$ 51,8 bi",
    moeda: "USD",
    pctPib: 0.19,
    anoExercicio: "FY 2024",
    destaqueProjetos: [
      "Financiamento de fábricas de cátodos e baterias para veículos elétricos (LPO)",
      "Office of Clean Energy Demonstrations (OCED - 7 hubs de hidrogênio limpo)",
      "Extensão da vida útil de usinas nucleares e desenvolvimento de SMRs"
    ],
    orgaoExecutor: "Department of Energy (DoE)",
    fonteOficialNome: "Department of Energy (DoE CFO Budget)",
    urlFonteOficial: "https://www.energy.gov/lpo/loan-programs-office",
    cruzamentoBrasil: "O programa de empréstimos do DoE financia mineradoras que importam matérias-primas do Brasil para baterias de lítio e componentes solares."
  },
  {
    id: "orc-eua-clima-ira-epa",
    bloco: "EUA",
    pais: "Estados Unidos",
    codigoIso3: "USA",
    eixo: "clima",
    eixoRotulo: "Combate à Crise Climática",
    programaAgencia: "Inflation Reduction Act (IRA) / EPA Greenhouse Gas Reduction Fund",
    descricao: "Maior investimento climático já aprovado pelo Congresso dos EUA. Créditos tributários de longo prazo, fundo de redução de gases de efeito estufa, subsídios para energia solar comunitária e restauração florestal.",
    valorUsdBi: 46.5,
    valorMoedaOriginal: "US$ 46,5 bi/ano (~US$ 369 bi em 10 anos)",
    moeda: "USD",
    pctPib: 0.17,
    anoExercicio: "FY 2024 (Média Decenal)",
    destaqueProjetos: [
      "Créditos tributários Seção 45X e 30D para transição industrial verde",
      "Greenhouse Gas Reduction Fund (US$ 27 bilhões geridos pela EPA)",
      "Monitoramento por satélite de vazamentos de metano em campos de óleo e gás"
    ],
    orgaoExecutor: "Environmental Protection Agency (EPA) / Internal Revenue Service (IRS)",
    fonteOficialNome: "EPA Inflation Reduction Act Implementation",
    urlFonteOficial: "https://www.epa.gov/inflation-reduction-act",
    cruzamentoBrasil: "Atrai investimentos industriais que concorrem diretamente com projetos de hidrogênio verde no Nordeste do Brasil (Porto do Pecém)."
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CANADÁ
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-can-militar-dnd",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "Department of National Defence (DND) / Canadian Armed Forces (CAF)",
    descricao: "Orçamento militar federal canadense. Concentra-se na defesa da soberania do Ártico, cooperação no comando aeroespacial conjunto NORAD com os EUA, modernização da esquadra de fragatas e compra de caças F-35.",
    valorUsdBi: 21.8,
    valorMoedaOriginal: "CAD 29,9 bi",
    moeda: "CAD",
    pctPib: 1.34,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Modernização do NORAD (sensores de radar sobre o horizonte no Ártico)",
      "Canadian Surface Combatant (construção de novos navios de escolta)",
      "Aquisição de aeronaves de patrulha marítima P-8A Poseidon"
    ],
    orgaoExecutor: "Department of National Defence (DND)",
    fonteOficialNome: "Treasury Board of Canada / DND Reports",
    urlFonteOficial: "https://www.canada.ca/en/department-national-defence/corporate/reports-publications/transition-materials/defence-101/05-defence-budget.html",
    cruzamentoBrasil: "O Canadá pressiona na OTAN por cadeias seguras de minerais críticos de defesa, sourcing fornecedores brasileiros de nióbio e terras raras."
  },
  {
    id: "orc-can-inteligencia-csis-cse",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "inteligencia",
    eixoRotulo: "Inteligência & Espionagem",
    programaAgencia: "Canadian Security Intelligence Service (CSIS) & Communications Security Establishment (CSE)",
    descricao: "Aparelho de inteligência canadense, membro da aliança Five Eyes. O CSE conduz vigilância de telecomunicações e defesa cibernética de infraestruturas críticas; o CSIS investiga espionagem estrangeira e segurança interna.",
    valorUsdBi: 1.45,
    valorMoedaOriginal: "CAD 1,98 bi",
    moeda: "CAD",
    pctPib: 0.09,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Canadian Centre for Cyber Security (proteção de bancos, redes elétricas e mineradoras)",
      "Contramedidas contra interferência eleitoral e econômica estrangeira",
      "Monitoramento de ciberataques contra cadeias de suprimentos e inteligência Five Eyes"
    ],
    orgaoExecutor: "Public Safety Canada / Department of National Defence",
    fonteOficialNome: "Public Safety Canada / CSIS Public Report",
    urlFonteOficial: "https://www.canada.ca/en/security-intelligence-service.html",
    cruzamentoBrasil: "Relatórios históricos da imprensa revelaram espionagem do CSE canadense sobre o Ministério de Minas e Energia do Brasil visando interesses de mineradoras."
  },
  {
    id: "orc-can-economico-finance-edc",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "economico",
    eixoRotulo: "Fomento Econômico",
    programaAgencia: "Department of Finance Canada / Export Development Canada (EDC)",
    descricao: "Agências econômicas federais de desenvolvimento e garantia de exportações. O EDC financia e garante bilhões de dólares para multinacionais canadenses operando no exterior, inclusive mineradoras ativas na América Latina.",
    valorUsdBi: 16.2,
    valorMoedaOriginal: "CAD 22,1 bi",
    moeda: "CAD",
    pctPib: 0.99,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Export Development Canada (linhas de crédito para mineração e óleo)",
      "Agências de desenvolvimento regional (FedDev Ontario, PacifiCan, ACOA)",
      "Incentivos tributários para atração de capitais corporativos"
    ],
    orgaoExecutor: "Department of Finance Canada / EDC",
    fonteOficialNome: "Department of Finance Canada / EDC Annual Report",
    urlFonteOficial: "https://www.canada.ca/en/department-finance.html",
    cruzamentoBrasil: "O EDC garantiu financiamentos diretos para corporações canadenses com projetos minerários polêmicos no Brasil (Vale Base Metals, Sigma Lithium, Belo Sun)."
  },
  {
    id: "orc-can-tecnologico-ised-nrc",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "tecnologico",
    eixoRotulo: "P&D & Tecnologia",
    programaAgencia: "Strategic Innovation Fund (SIF) / Pan-Canadian AI Strategy / NRC",
    descricao: "Incentivo federal à ciência e alta tecnologia. Foco em inteligência artificial nos polos de Toronto e Montreal (Vector Institute, Mila), inovação em mineração limpa e biomanufatura.",
    valorUsdBi: 4.3,
    valorMoedaOriginal: "CAD 5,85 bi",
    moeda: "CAD",
    pctPib: 0.26,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Estratégia Pan-Canadense de Inteligência Artificial",
      "Strategic Innovation Fund (projetos industriais de grande porte)",
      "National Research Council (NRC - centros de pesquisa aplicada)"
    ],
    orgaoExecutor: "Innovation, Science and Economic Development Canada (ISED)",
    fonteOficialNome: "ISED Canada Departmental Plan",
    urlFonteOficial: "https://ised-isde.canada.ca/",
    cruzamentoBrasil: "Acordos de cooperação acadêmica e intercâmbio de pesquisadores brasileiros nas universidades de Toronto, McGill e Waterloo."
  },
  {
    id: "orc-can-hidrico-cwa-eccc",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "hidrico",
    eixoRotulo: "Recursos Hídricos",
    programaAgencia: "Canada Water Agency (CWA) / ECCC Freshwater Action Plan",
    descricao: "Dotação para a recém-criada Agência Canadense da Água e plano de ação para os Grandes Lagos, Bacia do Rio St. Lawrence, Rio Fraser e monitoramento dos recursos de água doce que somam 20% das reservas mundiais.",
    valorUsdBi: 0.95,
    valorMoedaOriginal: "CAD 1,30 bi",
    moeda: "CAD",
    pctPib: 0.06,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Estruturação da Canada Water Agency em Winnipeg",
      "Freshwater Action Plan para contenção de fósforo nos Grandes Lagos",
      "Monitoramento hidrométrico de bacias árticas e florestais"
    ],
    orgaoExecutor: "Environment and Climate Change Canada (ECCC)",
    fonteOficialNome: "Canada Water Agency Official Transition Briefing",
    urlFonteOficial: "https://www.canada.ca/en/environment-climate-change/corporate/transparency/briefing-materials/water-agency.html",
    cruzamentoBrasil: "Estudo comparativo das práticas de gestão de bacias e governança hídrica entre a Agência da Água do Canadá e a ANA no Brasil."
  },
  {
    id: "orc-can-energetico-nrcan",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "energetico",
    eixoRotulo: "Matriz & Transição Energética",
    programaAgencia: "Natural Resources Canada (NRCan) / Clean Energy for Rural Communities",
    descricao: "Orçamento de energia e recursos naturais. Apoia a rede de transmissão limpa, reatores nucleares SMR em Darlington/Ontário, substituição de diesel em comunidades indígenas isoladas e modernização da matriz fóssil de Alberta.",
    valorUsdBi: 3.1,
    valorMoedaOriginal: "CAD 4,22 bi",
    moeda: "CAD",
    pctPib: 0.19,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Clean Energy for Rural and Remote Communities",
      "Desenvolvimento de reatores Small Modular Reactors (SMRs)",
      "Infraestrutura de recarga elétrica para transporte transcanadense"
    ],
    orgaoExecutor: "Natural Resources Canada (NRCan)",
    fonteOficialNome: "NRCan Departmental Plan",
    urlFonteOficial: "https://natural-resources.canada.ca/",
    cruzamentoBrasil: "Participação de fundos de pensão canadenses (CPPIB, Brookfield, CDPQ) como proprietários de hidrelétricas, linhas de transmissão e saneamento no Brasil."
  },
  {
    id: "orc-can-clima-reduction-plan",
    bloco: "Canada",
    pais: "Canadá",
    codigoIso3: "CAN",
    eixo: "clima",
    eixoRotulo: "Combate à Crise Climática",
    programaAgencia: "2030 Emissions Reduction Plan / Low Carbon Economy Fund",
    descricao: "Plano federal de redução de emissões com meta de 40% a 45% abaixo dos níveis de 2005 até 2030. Abrange subsídios para eficiência energética doméstica, captura de carbono (CCUS) e o Fundo de Soluções Baseadas na Natureza.",
    valorUsdBi: 6.7,
    valorMoedaOriginal: "CAD 9,15 bi",
    moeda: "CAD",
    pctPib: 0.41,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Taxação federal de carbono (Federal Carbon Pricing Backstop) e rebates",
      "Low Carbon Economy Fund para projetos comunitários e industriais",
      "Plantio de 2 bilhões de árvores e proteção de turfeiras de carbono"
    ],
    orgaoExecutor: "Environment and Climate Change Canada (ECCC)",
    fonteOficialNome: "ECCC 2030 Emissions Reduction Plan",
    urlFonteOficial: "https://www.canada.ca/en/environment-climate-change/services/environmental-indicators/progress-towards-canada-greenhouse-gas-emissions-reduction-target.html",
    cruzamentoBrasil: "O Canadá contribui formalmente com o Fundo Amazônia no Brasil para projetos de combate ao desmatamento e fiscalização ambiental."
  },

  // ══════════════════════════════════════════════════════════════════════════
  // UNIÃO EUROPEIA (BLOCO UE-27 / ORÇAMENTO COMUNITÁRIO)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-ue-militar-edf",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "European Defence Fund (EDF) / European Peace Facility (EPF)",
    descricao: "Primeiro orçamento militar conjunto da história da União Europeia. O Fundo Europeu de Defesa financia consórcios transnacionais de armas (Eurodrone, novos blindados, caças do futuro), enquanto a EPF financia envio de armamentos a países parceiros.",
    valorUsdBi: 8.6,
    valorMoedaOriginal: "€ 7,95 bi (anualizado)",
    moeda: "EUR",
    pctPib: 0.05,
    anoExercicio: "2021-2027 (MFF)",
    destaqueProjetos: [
      "European Defence Fund (€ 8 bilhões no quadro plurianual)",
      "European Peace Facility (mecanismo extra-orçamentário de apoio bélico)",
      "Programa ASAP (produção emergencial acelerada de 1 milhão de projéteis de artilharia)"
    ],
    orgaoExecutor: "Directorate-General for Defence Industry and Space (DG DEFIS)",
    fonteOficialNome: "European Commission - DG DEFIS Official Portal",
    urlFonteOficial: "https://defence-industry-space.ec.europa.eu/eu-defence-industry/european-defence-fund-edf_en",
    cruzamentoBrasil: "A indústria de defesa europeia disputa vendas de caças (Saab Gripen para o Brasil com montagem na Embraer) e submarinos (PROSUB com tecnologia francesa)."
  },
  {
    id: "orc-ue-inteligencia-intcen-satcen",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "inteligencia",
    eixoRotulo: "Inteligência & Espionagem",
    programaAgencia: "EU INTCEN & European Union Satellite Centre (SatCen)",
    descricao: "Órgãos de inteligência comunitária da UE sob o Serviço Europeu para a Ação Externa (SEAE). O EU INTCEN funde análises civis e militares dos Estados-membros; o SatCen fornece inteligência geoespacial orbital a partir de Torrejón (Espanha).",
    valorUsdBi: 0.38,
    valorMoedaOriginal: "€ 350 mi",
    moeda: "EUR",
    pctPib: 0.002,
    anoExercicio: "2024",
    destaqueProjetos: [
      "SatCen (análise de imagens orbitais para crises geopolíticas e fronteiras)",
      "EU INTCEN (célula de fusão de ameaças terroristas e cibernéticas)",
      "EU Hybrid Fusion Cell (combate à desinformação e ataques híbridos)"
    ],
    orgaoExecutor: "European External Action Service (EEAS)",
    fonteOficialNome: "European External Action Service Official Budget",
    urlFonteOficial: "https://www.eeas.europa.eu/",
    cruzamentoBrasil: "Monitoramento de rotas transatlânticas de tráfico internacional e cooperação com a Polícia Federal brasileira via Europol."
  },
  {
    id: "orc-ue-economico-nextgen-mff",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "economico",
    eixoRotulo: "Fomento Econômico",
    programaAgencia: "NextGenerationEU / Multiannual Financial Framework (MFF)",
    descricao: "Maior pacote de fomento econômico da Europa pós-Segunda Guerra. Emite dívida conjunta comunitária para financiar a recuperação pós-pandemia, reformas estruturais e coesão regional dos 27 países membros.",
    valorUsdBi: 238.0,
    valorMoedaOriginal: "€ 220 bi/ano (Fatia Anual)",
    moeda: "EUR",
    pctPib: 1.3,
    anoExercicio: "2021-2027",
    destaqueProjetos: [
      "Recovery and Resilience Facility (RRF - repasses e empréstimos)",
      "Fundos Estruturais e de Coesão Regional da UE",
      "Banco Europeu de Investimento (EIB / BEI - empréstimos globais)"
    ],
    orgaoExecutor: "European Commission - DG ECFIN / DG REGIO",
    fonteOficialNome: "European Commission - EU Budget Online",
    urlFonteOficial: "https://commission.europa.eu/strategy-and-policy/eu-budget/long-term-eu-budget/2021-2027_en",
    cruzamentoBrasil: "O BEI europeu financia projetos de infraestrutura limpa, saneamento e hidrogênio verde no Brasil, com exigências de salvaguardas sociais."
  },
  {
    id: "orc-ue-tecnologico-horizon",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "tecnologico",
    eixoRotulo: "P&D & Tecnologia",
    programaAgencia: "Horizon Europe / European Chips Act / Digital Europe",
    descricao: "Maior programa multilateral de pesquisa e inovação do mundo (€ 95,5 bilhões em 7 anos). Financia bolsas ERC de excelência científica, supercomputadores (EuroHPC) e o European Chips Act para reduzir a dependência asiática de semicondutores.",
    valorUsdBi: 15.2,
    valorMoedaOriginal: "€ 14,0 bi/ano",
    moeda: "EUR",
    pctPib: 0.08,
    anoExercicio: "2024",
    destaqueProjetos: [
      "European Research Council (ERC - bolsas de pesquisa pioneira)",
      "Chips for Europe Initiative (construção de linhas-piloto avançadas)",
      "Missões de Pesquisa: Cidades Neutras em Carbono e Saúde dos Solos"
    ],
    orgaoExecutor: "Directorate-General for Research and Innovation (DG RTD)",
    fonteOficialNome: "Horizon Europe Funding Programmes",
    urlFonteOficial: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en",
    cruzamentoBrasil: "Pesquisadores e universidades brasileiras (USP, Unicamp, UFMG) participam de consórcios do Horizon Europe em biodiversidade e mudanças climáticas."
  },
  {
    id: "orc-ue-hidrico-life-water",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "hidrico",
    eixoRotulo: "Recursos Hídricos",
    programaAgencia: "Water Framework Directive Funding / LIFE Environment / Cohesion Fund",
    descricao: "Recursos europeus para cumprimento da Diretiva-Quadro da Água, restauração da conectividade ecológica de rios (demolição de barreiras e açudes obsoletos) e tratamento avançado de efluentes urbanos e industriais.",
    valorUsdBi: 4.8,
    valorMoedaOriginal: "€ 4,45 bi",
    moeda: "EUR",
    pctPib: 0.03,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Restauração ecológica de 25.000 km de rios de fluxo livre na Europa",
      "LIFE Programme: adaptação hídrica a secas severas no Mediterrâneo",
      "Infraestrutura de saneamento financiada pelo Fundo de Coesão no Leste Europeu"
    ],
    orgaoExecutor: "Directorate-General for Environment (DG ENV)",
    fonteOficialNome: "European Commission - DG Environment Water Policy",
    urlFonteOficial: "https://environment.ec.europa.eu/topics/water_en",
    cruzamentoBrasil: "Metodologias de monitoramento da Diretiva da Água são referência na construção das metas de qualidade de bacias pelo IGAM e comitês de bacia em Minas Gerais."
  },
  {
    id: "orc-ue-energetico-repower",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "energetico",
    eixoRotulo: "Matriz & Transição Energética",
    programaAgencia: "REPowerEU / Euratom Research / Connecting Europe Facility (Energy)",
    descricao: "Plano emergencial e estrutural de € 300 bilhões para encerrar a dependência energética da Rússia e acelerar fontes limpas. Foco em parques eólicos offshore no Mar do Norte, energia solar massiva em telhados e pesquisa nuclear no projeto de fusão ITER.",
    valorUsdBi: 48.0,
    valorMoedaOriginal: "€ 44,5 bi/ano",
    moeda: "EUR",
    pctPib: 0.26,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Expansão massiva de redes elétricas transfronteiriças (CEF-Energy)",
      "Corredores europeus de transporte e importação de hidrogênio verde",
      "Pesquisa em fusão nuclear no reator internacional ITER em Cadarache (França)"
    ],
    orgaoExecutor: "Directorate-General for Energy (DG ENER)",
    fonteOficialNome: "European Commission - REPowerEU Strategic Plan",
    urlFonteOficial: "https://energy.ec.europa.eu/topics/energy-strategy/repowereu-affordable-secure-and-sustainable-energy-europe_en",
    cruzamentoBrasil: "A UE busca no Brasil contratos de longo prazo para fornecimento de hidrogênio verde e amônia limpa para abastecer suas indústrias pesadas."
  },
  {
    id: "orc-ue-clima-green-deal",
    bloco: "Europa",
    pais: "União Europeia",
    codigoIso3: "EUU",
    eixo: "clima",
    eixoRotulo: "Combate à Crise Climática",
    programaAgencia: "European Green Deal / Just Transition Mechanism / Innovation Fund",
    descricao: "O plano mais abrangente de neutralidade climática do mundo ocidental (meta líquida zero até 2050). Obriga que pelo menos 30% de todo o orçamento da UE seja dedicado a metas climáticas, amparando regiões mineradoras de carvão com o Fundo de Transição Justa.",
    valorUsdBi: 78.0,
    valorMoedaOriginal: "€ 72,0 bi/ano (Fatia Orçamentária)",
    moeda: "EUR",
    pctPib: 0.42,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Just Transition Fund (€ 19,2 bilhões para regiões carvoeiras)",
      "Regulamento Antidesmatamento da UE (EUDR) e rastreabilidade de cadeias",
      "Mecanismo de Ajuste de Carbono na Fronteira (CBAM - taxa sobre importações poluentes)"
    ],
    orgaoExecutor: "European Commission (DG CLIMA)",
    fonteOficialNome: "European Commission - European Green Deal Overview",
    urlFonteOficial: "https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/european-green-deal_en",
    cruzamentoBrasil: "O CBAM e a moratória do EUDR impactam diretamente as exportações brasileiras de carne, soja, minério de ferro e aço para o mercado europeu."
  },

  // ══════════════════════════════════════════════════════════════════════════
  // REINO UNIDO (UK)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-gbr-militar-mod",
    bloco: "Europa",
    pais: "Reino Unido",
    codigoIso3: "GBR",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "Ministry of Defence (MOD) / Defence Equipment Plan",
    descricao: "Maior orçamento militar da Europa Ocidental. Mantém dissuasão nuclear contínua no mar (submarinos Vanguard/Dreadnought armados com Trident), porta-aviões classe Queen Elizabeth e compromisso com 2,5% do PIB em defesa.",
    valorUsdBi: 68.5,
    valorMoedaOriginal: "£ 54,2 bi",
    moeda: "GBP",
    pctPib: 2.3,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Submarinos nucleares lança-mísseis balísticos classe Dreadnought",
      "Global Combat Air Programme (GCAP - caça de 6ª geração com Japão e Itália)",
      "Liderança na assistência militar e treinamento de forças aliadas"
    ],
    orgaoExecutor: "Ministry of Defence (MOD)",
    fonteOficialNome: "UK Defence in Numbers & Equipment Plan",
    urlFonteOficial: "https://www.gov.uk/government/organisations/ministry-of-defence",
    cruzamentoBrasil: "Fornecimento de turbinas navais Rolls-Royce e cooperação histórica com a Marinha do Brasil."
  },
  {
    id: "orc-gbr-inteligencia-sia",
    bloco: "Europa",
    pais: "Reino Unido",
    codigoIso3: "GBR",
    eixo: "inteligencia",
    eixoRotulo: "Inteligência & Espionagem",
    programaAgencia: "Single Intelligence Account (SIA) / MI6 / GCHQ / MI5",
    descricao: "Financiamento consolidado das agências secretas britânicas: MI6 (espionagem humana externa), GCHQ (inteligência de sinais e ciberguerra) e MI5 (segurança interna). Membro fundador da aliança Five Eyes.",
    valorUsdBi: 4.8,
    valorMoedaOriginal: "£ 3,82 bi",
    moeda: "GBP",
    pctPib: 0.16,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "National Cyber Force (capacidades ofensivas no ciberespaço)",
      "GCHQ Cheltenham (escuta global de telecomunicações e inteligência quântica)",
      "Rede de postos de inteligência externa do MI6 em embaixadas"
    ],
    orgaoExecutor: "Cabinet Office (Intelligence and Security Committee)",
    fonteOficialNome: "Cabinet Office - Single Intelligence Account Spending",
    urlFonteOficial: "https://www.gov.uk/government/publications/single-intelligence-account-spending",
    cruzamentoBrasil: "Cooperação com órgãos de inteligência brasileiros no combate à lavagem internacional de capitais e crimes cibernéticos financeiros."
  },
  {
    id: "orc-gbr-clima-netzero",
    bloco: "Europa",
    pais: "Reino Unido",
    codigoIso3: "GBR",
    eixo: "clima",
    eixoRotulo: "Combate à Crise Climática",
    programaAgencia: "Department for Energy Security and Net Zero (DESNZ) / Net Zero Strategy",
    descricao: "Gastos britânicos em descarbonização: fechamento da última termelétrica a carvão do país (Ratcliffe-on-Soar em 2024), leilões para eólica offshore e financiamento climático internacional (ICF).",
    valorUsdBi: 14.2,
    valorMoedaOriginal: "£ 11,2 bi",
    moeda: "GBP",
    pctPib: 0.48,
    anoExercicio: "2024-2025",
    destaqueProjetos: [
      "Contratos por Diferença (CfD) para novos parques eólicos no Mar do Norte",
      "International Climate Finance (ICF - repasses para países em desenvolvimento)",
      "Descarbonização de aquecimento residencial (bombas de calor)"
    ],
    orgaoExecutor: "Department for Energy Security and Net Zero (DESNZ)",
    fonteOficialNome: "DESNZ Annual Report & Accounts",
    urlFonteOficial: "https://www.gov.uk/government/organisations/department-for-energy-security-and-net-zero",
    cruzamentoBrasil: "O governo britânico é um dos grandes doadores do Fundo Amazônia e financia pesquisas conjuntas de restauração florestal com o Inpe e a Embrapa."
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ALEMANHA (DEU)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-deu-militar-bundeswehr",
    bloco: "Europa",
    pais: "Alemanha",
    codigoIso3: "DEU",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "Bundesministerium der Verteidigung (BMVg) / Sondervermögen Bundeswehr",
    descricao: "O ponto de inflexão ('Zeitenwende') militar alemão. Combina o orçamento anual regular com o fundo especial de € 100 bilhões para reequipar as forças armadas alemãs após décadas de desinvestimento.",
    valorUsdBi: 76.5,
    valorMoedaOriginal: "€ 71,0 bi (Orçamento + Fundo Especial)",
    moeda: "EUR",
    pctPib: 2.01,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Aquisição de caças F-35A para compartilhamento nuclear na OTAN",
      "Sistema de defesa aérea Arrow 3 adquirido de Israel",
      "Novos blindados Puma e fragatas F126 (Rheinmetall e Thyssenkrupp)"
    ],
    orgaoExecutor: "Bundesministerium der Verteidigung (BMVg)",
    fonteOficialNome: "BMVg Verteidigungshaushalt & Sondervermögen",
    urlFonteOficial: "https://www.bmvg.de/",
    cruzamentoBrasil: "A empresa alemã Rheinmetall é fornecedora de canhões e blindados, e a Thyssenkrupp lidera a construção das quatro fragatas classe Tamandaré em Santa Catarina."
  },
  {
    id: "orc-deu-clima-ktf",
    bloco: "Europa",
    pais: "Alemanha",
    codigoIso3: "DEU",
    eixo: "clima",
    eixoRotulo: "Combate à Crise Climática",
    programaAgencia: "Klima- und Transformationsfonds (KTF) / BMWK",
    descricao: "Fundo federal alemão de clima e transformação industrial. Cobre subsídios para descarbonização de siderúrgicas e químicas, isolamento térmico de prédios e apoio a fábricas de baterias e semicondutores.",
    valorUsdBi: 42.0,
    valorMoedaOriginal: "€ 39,0 bi",
    moeda: "EUR",
    pctPib: 1.1,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Contratos de proteção climática (CCfDs) para siderurgia verde (Thyssenkrupp, Salzgitter)",
      "Subsídios para reforma energética de habitações populares",
      "Infraestrutura de recarga elétrica e expansão de hidrogênio"
    ],
    orgaoExecutor: "Bundesministerium für Wirtschaft und Klimaschutz (BMWK)",
    fonteOficialNome: "Bundesfinanzministerium - KTF Wirtschaftsplan",
    urlFonteOficial: "https://www.bundesfinanzministerium.de/",
    cruzamentoBrasil: "A Alemanha é a maior doadora histórica do Fundo Amazônia (através do banco KfW) e tem parceria estratégica com o Brasil para importação de hidrogênio verde."
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FRANÇA (FRA)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-fra-militar-lpm",
    bloco: "Europa",
    pais: "França",
    codigoIso3: "FRA",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "Ministère des Armées / Loi de Programmation Militaire (LPM 2024-2030)",
    descricao: "Orçamento militar plurianual da única potência nuclear autônoma da UE. Preve € 413 bilhões em 7 anos para renovação dos submarinos nucleares SNLE 3G, desenvolvimento do futuro porta-aviões PANG e caças Rafale.",
    valorUsdBi: 51.0,
    valorMoedaOriginal: "€ 47,2 bi",
    moeda: "EUR",
    pctPib: 2.05,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Dissuasão nuclear submarina (Force Océanique Stratégique) e aerotransportada (ASMP-A)",
      "Futuro Porta-Aviões de Propulsão Nuclear (PANG de 75.000 toneladas)",
      "Novos caças Dassault Rafale F4 e F5"
    ],
    orgaoExecutor: "Ministère des Armées (DGA)",
    fonteOficialNome: "Ministère des Armées - Loi de Programmation Militaire",
    urlFonteOficial: "https://www.defense.gouv.fr/",
    cruzamentoBrasil: "Parceria estratégica com a França no programa de desenvolvimento de submarinos da Marinha do Brasil (PROSUB / Naval Group em Itaguaí/RJ)."
  },
  {
    id: "orc-fra-energetico-nucleaire",
    bloco: "Europa",
    pais: "França",
    codigoIso3: "FRA",
    eixo: "energetico",
    eixoRotulo: "Matriz & Transição Energética",
    programaAgencia: "Relance Nucléaire (EPR2) / EDF / France 2030",
    descricao: "Plano estatal francês de renascimento da energia nuclear. Financiamento para a construção de 6 novos reatores EPR2 de grande porte e estudos para mais 8 reatores, garantindo 70% de eletricidade descarbonizada.",
    valorUsdBi: 18.5,
    valorMoedaOriginal: "€ 17,2 bi",
    moeda: "EUR",
    pctPib: 0.75,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Construção de 6 reatores EPR2 (primeiro par em Penly)",
      "Extensão da vida operacional do parque nuclear atual para além de 50 anos",
      "Desenvolvimento de pequenos reatores modulares Nuward"
    ],
    orgaoExecutor: "Ministère de la Transition Énergétique / EDF",
    fonteOficialNome: "Ministère de l'Écologie et de l'Énergie",
    urlFonteOficial: "https://www.ecologie.gouv.fr/",
    cruzamentoBrasil: "A estatal francesa EDF opera usinas hidrelétricas e térmicas no Brasil e fornece assistência técnica para Angra 1, 2 e 3 na Eletronuclear."
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ITÁLIA (ITA)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "orc-ita-militar-difesa",
    bloco: "Europa",
    pais: "Itália",
    codigoIso3: "ITA",
    eixo: "militar",
    eixoRotulo: "Orçamento Militar",
    programaAgencia: "Ministero della Difesa / Documento Programmatico Pluriennale (DPP)",
    descricao: "Orçamento militar italiano com forte ênfase naval no Mediterrâneo Central, participação no caça de sexta geração GCAP com britânicos e japoneses, e indústria bélica de ponta (Leonardo e Fincantieri).",
    valorUsdBi: 31.8,
    valorMoedaOriginal: "€ 29,5 bi",
    moeda: "EUR",
    pctPib: 1.58,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Navio de assalto anfíbio Trieste e novos submarinos U212NFS",
      "Aquisição de caças F-35 com montagem na fábrica de Cameri (Itália)",
      "Sistemas de mísseis antiaéreos SAMP/T (consórcio Eurosam)"
    ],
    orgaoExecutor: "Ministero della Difesa",
    fonteOficialNome: "Ministero della Difesa - Documento Programmatico Pluriennale",
    urlFonteOficial: "https://www.difesa.it/",
    cruzamentoBrasil: "O caça militar AMX da Força Aérea Brasileira foi desenvolvido em consórcio ítalo-brasileiro (Embraer, Alenia e Aermacchi, atual Leonardo)."
  },
  {
    id: "orc-ita-hidrico-po-pnrr",
    bloco: "Europa",
    pais: "Itália",
    codigoIso3: "ITA",
    eixo: "hidrico",
    eixoRotulo: "Recursos Hídricos",
    programaAgencia: "Autorità di Bacino Distrettuale del Fiume Po / PNRR Acqua",
    descricao: "Dotações emergenciais e do Plano de Recuperação (PNRR) para combater a cunha salina e secas extremas na Bacia do Rio Po (coração agrícola e industrial da Itália), modernizando canais de irrigação e reservatórios.",
    valorUsdBi: 4.2,
    valorMoedaOriginal: "€ 3,90 bi",
    moeda: "EUR",
    pctPib: 0.21,
    anoExercicio: "2024",
    destaqueProjetos: [
      "Combate ao avanço da água salgada do Adriático no Delta do Po",
      "Digitalização e redução de vazamento em 21.000 km de adutoras urbanas",
      "Reuso de águas residuárias tratadas na agricultura da planície padana"
    ],
    orgaoExecutor: "Ministero dell'Ambiente e della Sicurezza Energetica (MASE)",
    fonteOficialNome: "Autorità di Bacino Distrettuale del Fiume Po",
    urlFonteOficial: "https://www.adbpo.it/",
    cruzamentoBrasil: "Intercâmbio com comitês de bacia brasileiros para enfrentamento de secas severas (Bacia do Rio Paraíba do Sul e Cantareira)."
  }
];

function executarGeracao() {
  console.log(`Iniciando compilação do acervo de orçamentos mundiais...`);
  console.log(`Registros a processar: ${REGISTROS_ORCAMENTO.length}`);

  mkdirSync(dirname(CAMINHO_SAIDA), { recursive: true });

  const tabelaCompacta = compactar(REGISTROS_ORCAMENTO);
  const jsonSerializado = JSON.stringify(tabelaCompacta, null, 2);

  writeFileSync(CAMINHO_SAIDA, jsonSerializado, "utf-8");

  const tamanhoKb = (Buffer.byteLength(jsonSerializado, "utf-8") / 1024).toFixed(1);
  console.log(`✓ Arquivo compactado gerado com sucesso em: ${CAMINHO_SAIDA}`);
  console.log(`Tamanho final: ${tamanhoKb} KB`);
}

executarGeracao();
