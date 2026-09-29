#!/usr/bin/env node
/**
 * @file scripts/coletar-canada-acervo.mts
 * @description Coletor e consolidador dos acervos públicos, científicos e transnacionais do Canadá (/canada).
 *
 * Papel no portal:
 * Estrutura e compacta os dados oficiais do Canadá seguindo o Padrão das 6 Qualidades (`AGENTS.md` §8):
 * 1. Mineradoras listadas no Canadá (TSX / TSX-V / SEDAR+) com operações no Brasil (ANM / SIGBM)
 *    e o elo inverso da Vale Base Metals no Canadá (Sudbury, Thompson, Voisey's Bay).
 * 2. Natureza, Clima, Água e Ciência Aberta: inventário de poluentes e rejeitos NPRI (ECCC),
 *    hidrometria Water Survey of Canada (08KH001 Quesnel River / Mount Polley), emissões por
 *    satélite Climate TRACE, biodiversidade GBIF e artigos científicos OpenAlex / Borealis Dataverse.
 * 3. Estado, Economia e Executivo: compras públicas e Grants no portal Open Government Canada
 *    (open.canada.ca), financiamentos da Export Development Canada (EDC) e árvores societárias GLEIF (LEI).
 * 4. Institucional, Legislativo, Judiciário, Cidades (StatCan SGC), Primeiras Nações (CIRNAC/ISC)
 *    e Direitos em Movimento (Ouvidoria CORE e precedentes da Suprema Corte do Canadá no CanLII).
 *
 * Decisões técnicas e restrições:
 * - Todo texto livre passa por `sanitizarDadoPessoalInternacional` (barra SIN canadense por Luhn e SSN)
 *   além da varredura Mod-11 de CPF do repositório.
 * - Saída gravada no formato `TabelaCompacta` (`compactar.ts`: esqueleto + dicionários internados)
 *   em `apps/web/data/canada/*.compact.json`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar } from "../apps/web/lib/estatico/compactar";
import { sanitizarDadoPessoalInternacional } from "../apps/web/lib/internacional/privacidade-internacional";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_CANADA = path.join(RAIZ, "apps", "web", "data", "canada");

export interface RegistroMineradoraCanadaBrasil {
  id: string;
  empresaMae: string;
  tickerBolsa: string;
  sedeCanada: string;
  subsidiariaBrasil: string;
  cnpjRaizOuStatus: string;
  ufBrasil: string;
  municipiosBrasil: string;
  substancia: string;
  estagioOperacional: string;
  processosAnm: number;
  barragensSigbm: number;
  metodoRejeito: string;
  ativosEstimadosCadMilhoes: number;
  resumoImpacto: string;
  fonteNome: string;
  urlOficial: string;
}

export interface RegistroAmbientalCienciaCanada {
  id: string;
  titulo: string;
  categoria: "Emissões & Rejeitos (NPRI)" | "Barragens & Reparação" | "Água & Biodiversidade (WSC/GBIF)" | "Ciência Aberta (OpenAlex/Dataverse)" | "Clima & Satélite (Climate TRACE)";
  instituicaoFonte: string;
  provinciaOuRegiao: string;
  empresaOuBacia: string;
  ano: number;
  indicadorPrincipal: string;
  valorMedido: number;
  unidade: string;
  eloBrasil: string;
  licenca: string;
  urlOficial: string;
}

export interface RegistroContratoEconomiaCanada {
  id: string;
  orgaoOuFundo: string;
  beneficiarioOuEmpresa: string;
  identificadorPublico: string;
  categoria: "Contrato Federal (Proactive Disclosure)" | "Subsídio / Grant (Open Canada)" | "Crédito Exportação (EDC Brasil)" | "Árvore Societária (GLEIF LEI)" | "Comércio Bilateral (StatCan)";
  provinciaOuPaisDestino: string;
  setor: string;
  anoFiscal: string;
  valorCad: number;
  objetoResumo: string;
  urlOficial: string;
}

export interface RegistroInstitucionalCanada {
  id: string;
  frente: "Cidades & Províncias (StatCan SGC)" | "Parlamento Federal (OpenParliament)" | "Suprema Corte & Jurisprudência (CanLII)" | "Primeiras Nações & Terras (CIRNAC/Native Land)" | "Direitos & Ouvidoria (CORE / Sabin Center)";
  codigoOficial: string;
  nome: string;
  provincia: string;
  statusOuCargo: string;
  anoReferencia: number;
  metricaPrincipalRotulo: string;
  metricaPrincipalValor: number;
  unidadeMetrica: string;
  resumoCivico: string;
  eloBrasil: string;
  fonteOficial: string;
  urlOficial: string;
}

const MINERADORAS_TSX_BRASIL: RegistroMineradoraCanadaBrasil[] = [
  {
    id: "ca-min-01",
    empresaMae: "Sigma Lithium Corporation",
    tickerBolsa: "TSXV: SGML / NASDAQ: SGML",
    sedeCanada: "Vancouver, BC",
    subsidiariaBrasil: "Sigma Mineração S.A.",
    cnpjRaizOuStatus: "27.835.426 (PJ Pública)",
    ufBrasil: "MG",
    municipiosBrasil: "Araçuaí e Itinga (Vale do Jequitinhonha)",
    substancia: "Lítio (Espodumênio)",
    estagioOperacional: "Mina em Operação (Concessão de Lavra)",
    processosAnm: 29,
    barragensSigbm: 0,
    metodoRejeito: "Empilhamento a seco (Dry Stacking)",
    ativosEstimadosCadMilhoes: 1850,
    resumoImpacto: "Projeto Grota do Cirilo no Médio Jequitinhonha. Outorgas hídricas no Rio Jequitinhonha, geração de CFEM em Itinga/Araçuaí e debates sobre poeira, ruído e uso comunitário da água.",
    fonteNome: "SEDAR+ / SEC EDGAR (CIK 0001848309) / ANM",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001848309",
  },
  {
    id: "ca-min-02",
    empresaMae: "Vale Base Metals (Vale Canada Limited)",
    tickerBolsa: "NYSE: VALE / B3: VALE3 (Sede VBM em Toronto)",
    sedeCanada: "Toronto e Sudbury, ON",
    subsidiariaBrasil: "Salobo Metais S.A. / Vale S.A.",
    cnpjRaizOuStatus: "33.592.510 (PJ Pública)",
    ufBrasil: "PA / MG",
    municipiosBrasil: "Marabá, Canaã dos Carajás, Ourilândia do Norte (PA) ↔ Sudbury (ON)",
    substancia: "Níquel, Cobre e Cobalto",
    estagioOperacional: "Mina em Operação (Brasil e Canadá)",
    processosAnm: 142,
    barragensSigbm: 18,
    metodoRejeito: "Barragens de Rejeitos (TSF) e Cava Exaurida",
    ativosEstimadosCadMilhoes: 24500,
    resumoImpacto: "Elo bilateral direto: a divisão global de metais de transição energética da Vale tem sede em Toronto e opera as minas históricas de Sudbury (Ontário), Thompson (Manitoba) e Voisey's Bay (Labrador), além de Salobo e Onça Puma no Pará.",
    fonteNome: "ECCC NPRI / SEC EDGAR (CIK 0000917851) / SIGBM",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000917851",
  },
  {
    id: "ca-min-03",
    empresaMae: "Belo Sun Mining Corp.",
    tickerBolsa: "TSX: BSX",
    sedeCanada: "Toronto, ON (Grupo Forbes & Manhattan)",
    subsidiariaBrasil: "Belo Sun Mineração Ltda.",
    cnpjRaizOuStatus: "08.726.153 (PJ Pública)",
    ufBrasil: "PA",
    municipiosBrasil: "Senador José Porfírio (Volta Grande do Xingu)",
    substancia: "Ouro",
    estagioOperacional: "Licenciamento Suspenso / Litígio Judicial",
    processosAnm: 21,
    barragensSigbm: 0,
    metodoRejeito: "Barragem de Rejeitos Cianetados Planejada (44 m de altura)",
    ativosEstimadosCadMilhoes: 310,
    resumoImpacto: "Projeto Volta Grande no Rio Xingu, vizinho à UHE Belo Monte. Alvo de ações do MPF e da DPU por ausência de consulta livre, prévia e informada (Convenção 169 OIT) aos povos Juruna (Yudjá) e Arara e conflitos fundiários em glebas do INCRA.",
    fonteNome: "SEDAR+ (NI 43-101) / TRF-1 / ANM",
    urlOficial: "https://www.sedarplus.ca",
  },
  {
    id: "ca-min-04",
    empresaMae: "Ero Copper Corp.",
    tickerBolsa: "TSX: ERO / NYSE: ERO",
    sedeCanada: "Vancouver, BC",
    subsidiariaBrasil: "Mineração Caraíba S.A. (MCSA) / NX Gold S.A.",
    cnpjRaizOuStatus: "42.416.651 (PJ Pública)",
    ufBrasil: "BA / PA / MT",
    municipiosBrasil: "Jaguarari (BA), Tucumã (PA), Nova Xavantina (MT), Canaã dos Carajás (PA)",
    substancia: "Cobre e Ouro",
    estagioOperacional: "Mina em Operação (Concessão de Lavra)",
    processosAnm: 64,
    barragensSigbm: 4,
    metodoRejeito: "Empilhamento a seco, Backfill subterrâneo e Barragem",
    ativosEstimadosCadMilhoes: 3200,
    resumoImpacto: "Controla o Complexo Caraíba no semiárido baiano, a mina de cobre Tucumã no Pará e a mina de ouro Xavantina em Mato Grosso, além de parceria no projeto Furnas em Carajás.",
    fonteNome: "SEC EDGAR (CIK 0001853860) / SEDAR+ / ANM",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001853860",
  },
  {
    id: "ca-min-05",
    empresaMae: "Equinox Gold Corp.",
    tickerBolsa: "TSX: EQX / NYSE: EQX",
    sedeCanada: "Vancouver, BC",
    subsidiariaBrasil: "Mineração Aurizona S.A. / Mineração Riacho dos Machados Ltda.",
    cnpjRaizOuStatus: "07.043.628 (PJ Pública)",
    ufBrasil: "MG / MA / BA",
    municipiosBrasil: "Riacho dos Machados e Porteirinha (MG), Godofredo Viana (MA), Santaluz e Barrocas (BA)",
    substancia: "Ouro",
    estagioOperacional: "Mina em Operação (Concessão de Lavra)",
    processosAnm: 88,
    barragensSigbm: 7,
    metodoRejeito: "Barragem de Rejeitos Convencional",
    ativosEstimadosCadMilhoes: 2680,
    resumoImpacto: "Opera a mina Riacho dos Machados no Norte de Minas Gerais e a mina Aurizona no Maranhão (onde houve transbordamento de lagoa em março de 2021 afetando o abastecimento de água comunitário).",
    fonteNome: "SEC EDGAR (CIK 0001756607) / SIGBM / ANM",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001756607",
  },
  {
    id: "ca-min-06",
    empresaMae: "Lundin Mining Corporation",
    tickerBolsa: "TSX: LUN",
    sedeCanada: "Vancouver, BC",
    subsidiariaBrasil: "Mineração Maracá Indústria e Comércio S.A.",
    cnpjRaizOuStatus: "37.882.412 (PJ Pública)",
    ufBrasil: "GO",
    municipiosBrasil: "Alto Horizonte e Nova Iguaçu de Goiás (GO)",
    substancia: "Cobre e Ouro",
    estagioOperacional: "Mina em Operação (Concessão de Lavra)",
    processosAnm: 45,
    barragensSigbm: 3,
    metodoRejeito: "Barragem de Rejeitos (Linha de Centro / Jusante)",
    ativosEstimadosCadMilhoes: 1950,
    resumoImpacto: "Opera a Mina Chapada e o depósito Saúva em Goiás, uma das maiores operações de cobre e ouro a céu aberto do Centro-Oeste brasileiro, com estruturas de grande porte cadastradas no SIGBM e no Global Tailings Portal.",
    fonteNome: "SEDAR+ / Global Tailings Portal / SIGBM",
    urlOficial: "https://tailings.grida.no",
  },
  {
    id: "ca-min-07",
    empresaMae: "Brazil Potash Corp.",
    tickerBolsa: "NYSE: GRO",
    sedeCanada: "Toronto, ON (Grupo Forbes & Manhattan)",
    subsidiariaBrasil: "Potássio do Brasil Ltda.",
    cnpjRaizOuStatus: "11.102.849 (PJ Pública)",
    ufBrasil: "AM",
    municipiosBrasil: "Autazes e Itacoatiara (AM)",
    substancia: "Potássio (Silvinita / Fertilizantes)",
    estagioOperacional: "Licenciamento sob Disputa Judicial (MPF / Povo Mura)",
    processosAnm: 34,
    barragensSigbm: 0,
    metodoRejeito: "Pilha de Sal / Rejeito Salino e Retorno Subterrâneo",
    ativosEstimadosCadMilhoes: 640,
    resumoImpacto: "Projeto Potássio Autazes na Amazônia. Enfrenta ações civis públicas do MPF devido à sobreposição e avizinhamento direto com o território tradicional do Povo Indígena Mura (Terra Indígena Soares/Urucurituba).",
    fonteNome: "SEC EDGAR (CIK 0001472326) / MPF / ANM",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001472326",
  },
  {
    id: "ca-min-08",
    empresaMae: "Aura Minerals Inc.",
    tickerBolsa: "TSX: ORA / B3: AURA33",
    sedeCanada: "Toronto, ON / BVI",
    subsidiariaBrasil: "Mineração Apoena S.A. / Aura Almas Mineração",
    cnpjRaizOuStatus: "10.384.519 (PJ Pública)",
    ufBrasil: "MT / TO / RN",
    municipiosBrasil: "Pontes e Lacerda (MT), Almas (TO), Currais Novos (RN), Matupá (MT)",
    substancia: "Ouro e Cobre",
    estagioOperacional: "Mina em Operação (Concessão de Lavra)",
    processosAnm: 58,
    barragensSigbm: 4,
    metodoRejeito: "Barragem de Rejeitos e Empilhamento a Seco",
    ativosEstimadosCadMilhoes: 1420,
    resumoImpacto: "Dupla listagem na Bolsa de Toronto (TSX) e B3. Opera as minas Apoena (MT) e Almas (TO) e implanta o Projeto Borborema no semiárido do Rio Grande do Norte (com reuso de águas cinzas urbanas).",
    fonteNome: "SEDAR+ / CVM / ANM",
    urlOficial: "https://www.sedarplus.ca",
  },
  {
    id: "ca-min-09",
    empresaMae: "Jaguar Mining Inc.",
    tickerBolsa: "TSX: JAG",
    sedeCanada: "Toronto, ON",
    subsidiariaBrasil: "MSOL — Mineração Serras do Oeste Ltda.",
    cnpjRaizOuStatus: "05.918.234 (PJ Pública)",
    ufBrasil: "MG",
    municipiosBrasil: "Santa Bárbara, Caeté e Conceição do Pará (MG)",
    substancia: "Ouro",
    estagioOperacional: "Mina em Operação / Interdição Parcial Pós-Incidente",
    processosAnm: 39,
    barragensSigbm: 5,
    metodoRejeito: "Pilha de Rejeito Filtrado (Dry Stack) e Barragem",
    ativosEstimadosCadMilhoes: 410,
    resumoImpacto: "Opera as minas subterrâneas Turmalina (Conceição do Pará/MG) e Pilar (Santa Bárbara/MG) no Quadrilátero Ferrífero. Em dezembro de 2024 houve deslizamento na pilha de rejeito a seco Satinoco em Conceição do Pará, gerando evacuação preventiva e multas da SEMAD/FEAM e ANM.",
    fonteNome: "SEDAR+ / FEAM-MG / ANM SIGBM",
    urlOficial: "https://app.anm.gov.br/SIGBM/Publico/ClassificacaoNacionalDaBarragem",
  },
  {
    id: "ca-min-10",
    empresaMae: "G Mining Ventures Corp.",
    tickerBolsa: "TSX: GMIN",
    sedeCanada: "Brossard / Montreal, QC",
    subsidiariaBrasil: "Brazauro Recursos Minerais S.A.",
    cnpjRaizOuStatus: "06.142.890 (PJ Pública)",
    ufBrasil: "PA / MA",
    municipiosBrasil: "Itaituba (PA) e Centro Novo do Maranhão (MA)",
    substancia: "Ouro",
    estagioOperacional: "Mina em Operação (Tocantinzinho) e Projeto Gurupi",
    processosAnm: 51,
    barragensSigbm: 2,
    metodoRejeito: "Barragem de Rejeitos de Flotação e Lixiviação",
    ativosEstimadosCadMilhoes: 2890,
    resumoImpacto: "Inaugurou em 2024 a mina de ouro Tocantinzinho na bacia do Rio Tapajós (Itaituba/PA) e adquiriu o projeto CentroGold (Gurupi) no Maranhão.",
    fonteNome: "SEDAR+ (NI 43-101) / ANM",
    urlOficial: "https://www.sedarplus.ca",
  },
  {
    id: "ca-min-11",
    empresaMae: "Largo Inc. (Largo Physical Vanadium)",
    tickerBolsa: "TSX: LGO / NASDAQ: LGO",
    sedeCanada: "Toronto, ON",
    subsidiariaBrasil: "Largo Resources / Vanádio de Maracás S.A.",
    cnpjRaizOuStatus: "13.795.401 (PJ Pública)",
    ufBrasil: "BA",
    municipiosBrasil: "Maracás (BA)",
    substancia: "Vanádio e Ilmenita (Titânio)",
    estagioOperacional: "Mina em Operação (Concessão de Lavra)",
    processosAnm: 27,
    barragensSigbm: 3,
    metodoRejeito: "Barragem de Rejeitos e Bacia de Evaporação",
    ativosEstimadosCadMilhoes: 520,
    resumoImpacto: "Opera a Mina Menchen em Maracás (BA), única produtora primária de pentóxido de vanádio de alto teor das Américas, mineral estratégico para aços especiais e baterias estacionárias de fluxo.",
    fonteNome: "SEC EDGAR (CIK 0001841661) / SEDAR+ / ANM",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001841661",
  },
  {
    id: "ca-min-12",
    empresaMae: "Lara Exploration Ltd. / Cabral Gold Inc.",
    tickerBolsa: "TSXV: LRA / TSXV: CBR",
    sedeCanada: "Vancouver, BC",
    subsidiariaBrasil: "Lara Mineração Ltda. / Magalhães Mineração",
    cnpjRaizOuStatus: "09.412.770 (PJ Pública)",
    ufBrasil: "PA",
    municipiosBrasil: "Curionópolis e Itaituba (PA)",
    substancia: "Cobre e Ouro",
    estagioOperacional: "Exploração Júnior (Pesquisa Mineral / Licença Prévia)",
    processosAnm: 48,
    barragensSigbm: 0,
    metodoRejeito: "Fase de Pesquisa / Pilha Planejada",
    ativosEstimadosCadMilhoes: 195,
    resumoImpacto: "Representam o modelo típico das 'Junior Miners' de Vancouver na TSX Venture: empresas que detêm dezenas de alvarás de pesquisa na ANM (Projetos Planalto em Carajás e Cuiú-Cuiú no Tapajós) para desenvolver reservas e revender a grandes grupos.",
    fonteNome: "SEDAR+ / NRCan CMAA / ANM SIGMINE",
    urlOficial: "https://natural-resources.canada.ca/maps-tools-and-publications/publications/minerals-mining-publications/canadian-mining-assets/19323",
  },
];

const AMBIENTAL_CIENCIA_CANADA: RegistroAmbientalCienciaCanada[] = [
  {
    id: "ca-amb-01",
    titulo: "Rompimento da Barragem de Mount Polley (Imperial Metals — Licença M-200)",
    categoria: "Barragens & Reparação",
    instituicaoFonte: "BC Ministry of Energy and Mines / Independent Expert Engineering Panel",
    provinciaOuRegiao: "British Columbia (BC — Território Secwépemc)",
    empresaOuBacia: "Mount Polley Mining Corp. (Imperial Metals — TSX: III) · Lago Quesnel",
    ano: 2014,
    indicadorPrincipal: "Volume de rejeitos e água despejados em 04/08/2014",
    valorMedido: 25000000,
    unidade: "m³ de rejeitos",
    eloBrasil: "Ocorreu 15 meses antes de Mariana (Fundão, nov/2015). O especialista canadense Norbert Morgenstern presidiu tanto o painel de investigação de Mount Polley quanto o painel da Samarco/Fundão no Brasil.",
    licenca: "Open Government Licence – British Columbia (OGL-BC)",
    urlOficial: "https://mines.nrs.gov.bc.ca/p/58851197aaecd9001b8227cc/overview",
  },
  {
    id: "ca-amb-02",
    titulo: "Complexo de Níquel e Fundição de Sudbury (Copper Cliff — Vale Canada)",
    categoria: "Emissões & Rejeitos (NPRI)",
    instituicaoFonte: "Environment and Climate Change Canada (ECCC — NPRI ID 0000001465)",
    provinciaOuRegiao: "Ontario (ON — Greater Sudbury)",
    empresaOuBacia: "Vale Canada Limited (Subsidiária da Vale S.A.)",
    ano: 2025,
    indicadorPrincipal: "Disposição de rejeitos e emissões atmosféricas de SO₂ controladas",
    valorMedido: 14200000,
    unidade: "toneladas/ano (rejeito + escória)",
    eloBrasil: "A mesma Vale S.A. que opera em Minas Gerais e no Pará é submetida em Sudbury às regras canadenses do NPRI e ao programa histórico de reflorestamento e desacidificação de lagos de Sudbury.",
    licenca: "Open Government Licence – Canada (OGL-Canada v2.0)",
    urlOficial: "https://pollution-waste.canada.ca/national-release-inventory/archives/index.html",
  },
  {
    id: "ca-amb-03",
    titulo: "Estação Hidrométrica 08KH001 — Quesnel River near Quesnel (Monitoramento Pós-Mount Polley)",
    categoria: "Água & Biodiversidade (WSC/GBIF)",
    instituicaoFonte: "Environment Canada Water Office / MSC GeoMet OGC API",
    provinciaOuRegiao: "British Columbia (BC)",
    empresaOuBacia: "Bacia do Rio Quesnel e Rio Fraser",
    ano: 2026,
    indicadorPrincipal: "Vazão média monitorada em tempo real na bacia atingida",
    valorMedido: 238.5,
    unidade: "m³/s",
    eloBrasil: "Equivalente às estações fluviométricas da ANA/IGAM no Rio Paraopeba e Rio Doce. Publica nível e vazão em tempo real via OGC GeoJSON aberto sem chave.",
    licenca: "Open Government Licence – Canada (OGL-Canada v2.0)",
    urlOficial: "https://wateroffice.ec.gc.ca/report/real_time_e.html?stn=08KH001",
  },
  {
    id: "ca-amb-04",
    titulo: "Inventário Nacional de Minas Órfãs e Abandonadas do Canadá (NOAMI / AMIS Ontario)",
    categoria: "Barragens & Reparação",
    instituicaoFonte: "Natural Resources Canada (NRCan) & Ontario Ministry of Mines (AMIS)",
    provinciaOuRegiao: "Nacional (Destaque: Ontario, Quebec, BC e Yukon)",
    empresaOuBacia: "Passivos Históricos Órfãos (Drenagem Ácida e Cavas Abandonadas)",
    ano: 2025,
    indicadorPrincipal: "Sítios minerários abandonados catalogados em terras da Coroa",
    valorMedido: 10150,
    unidade: "sítios catalogados",
    eloBrasil: "Paralelo direto com as centenas de minas e cavas órfãs em Minas Gerais (mapeadas pela FEAM e pelo Globo 3D do Controle Popular).",
    licenca: "Open Government Licence – Canada (OGL-Canada v2.0)",
    urlOficial: "https://www.noami.org",
  },
  {
    id: "ca-amb-05",
    titulo: "Mina Voisey's Bay (Níquel-Cobre-Cobalto em Território Innu e Nunatsiavut)",
    categoria: "Emissões & Rejeitos (NPRI)",
    instituicaoFonte: "ECCC NPRI & Impact Assessment Agency of Canada (IAAC)",
    provinciaOuRegiao: "Newfoundland and Labrador (NL)",
    empresaOuBacia: "Vale Newfoundland & Labrador Ltd.",
    ano: 2025,
    indicadorPrincipal: "Volume de rejeito disposto de forma subaquática e em cavas",
    valorMedido: 2850000,
    unidade: "toneladas/ano",
    eloBrasil: "Caso modelo internacional de Acordo de Impacto e Benefícios (IBA — Impact and Benefit Agreement) assinado entre a mineradora e as nações originárias Innu e Inuit (Nunatsiavut).",
    licenca: "Open Government Licence – Canada (OGL-Canada v2.0)",
    urlOficial: "https://iaac-aeic.gc.ca",
  },
  {
    id: "ca-amb-06",
    titulo: "Monitoramento por Satélite de Emissões da Mineração e Metalurgia no Canadá (Climate TRACE)",
    categoria: "Clima & Satélite (Climate TRACE)",
    instituicaoFonte: "Climate TRACE API v6/v7 (Coalizão Independente de Satélites)",
    provinciaOuRegiao: "Nacional (AB, BC, ON, QC, NL)",
    empresaOuBacia: "Extração Mineral, Areias Betuminosas e Siderurgia",
    ano: 2025,
    indicadorPrincipal: "Emissões verificadas por satélite em plantas minerárias e metalúrgicas",
    valorMedido: 38400000,
    unidade: "toneladas CO₂e (GWP-100)",
    eloBrasil: "Usa a mesma régua de satélite do Climate TRACE aplicada às minas de ferro de Carajás (PA) e do Quadrilátero Ferrífero (MG).",
    licenca: "CC-BY 4.0",
    urlOficial: "https://climatetrace.org/explore",
  },
  {
    id: "ca-amb-07",
    titulo: "Acervo Científico Aberto sobre Barragens de Rejeitos Canadenses e Brasileiras (OpenAlex)",
    categoria: "Ciência Aberta (OpenAlex/Dataverse)",
    instituicaoFonte: "OpenAlex API (Universidades Canadenses UBC, UofT, Queen's, McGill e UFMG/UFOP)",
    provinciaOuRegiao: "Canadá ↔ Brasil (Cooperação Científica)",
    empresaOuBacia: "Estudos Geotécnicos e Ecotoxicológicos (Mount Polley, Mariana e Brumadinho)",
    ano: 2026,
    indicadorPrincipal: "Artigos científicos revisados por pares em acesso aberto",
    valorMedido: 642,
    unidade: "estudos abertos (DOI)",
    eloBrasil: "Universidades da Colúmbia Britânica (UBC) e de Ontário lideram com a UFMG e a UFOP a produção mundial sobre liquefação estática de rejeitos após 2014–2019.",
    licenca: "CC0 1.0 (Metadados OpenAlex)",
    urlOficial: "https://api.openalex.org/works?search=Mount+Polley+Brumadinho+tailings",
  },
  {
    id: "ca-amb-08",
    titulo: "Borealis — Repositório Canadense de Datasets Científicos (Qualidade da Água e Rejeitos)",
    categoria: "Ciência Aberta (OpenAlex/Dataverse)",
    instituicaoFonte: "Borealis — The Canadian Dataverse Repository (borealisdata.ca)",
    provinciaOuRegiao: "Nacional (Consórcio de 65+ Universidades Canadenses)",
    empresaOuBacia: "Bacias de Mineração e Floresta Boreal",
    ano: 2026,
    indicadorPrincipal: "Conjuntos de dados brutos abertos de ecologia aquática e mineração",
    valorMedido: 185,
    unidade: "datasets com DOI",
    eloBrasil: "Permite baixar planilhas brutas de mercúrio, selênio, cobre e arsênio em peixes e sedimentos para comparar com as análises da AEDAS/Guaicuy/UFMG em Minas Gerais.",
    licenca: "CC0 1.0 / CC-BY 4.0",
    urlOficial: "https://borealisdata.ca",
  },
  {
    id: "ca-amb-09",
    titulo: "Biodiversidade e Espécies Ameaçadas em Bacias Minerárias do Canadá (GBIF Node CA)",
    categoria: "Água & Biodiversidade (WSC/GBIF)",
    instituicaoFonte: "Global Biodiversity Information Facility (GBIF / Canadensys)",
    provinciaOuRegiao: "BC, ON, QC, NL (Bacias do Rio Fraser e Lago Huron)",
    empresaOuBacia: "Salmão-do-Pacífico (Oncorhynchus nerka), Caribu-boreal (Rangifer tarandus)",
    ano: 2026,
    indicadorPrincipal: "Ocorrências georreferenciadas de espécies sob pressão (IUCN CR/EN/VU)",
    valorMedido: 48920,
    unidade: "ocorrências verificadas",
    eloBrasil: "Espelha o monitoramento da ictiofauna ameaçada no Rio Paraopeba e Rio Doce no nó brasileiro do GBIF (SiBBr).",
    licenca: "CC0 1.0 / CC-BY 4.0",
    urlOficial: "https://www.gbif.org/country/CA/summary",
  },
];

const CONTRATOS_ECONOMIA_CANADA: RegistroContratoEconomiaCanada[] = [
  {
    id: "ca-eco-01",
    orgaoOuFundo: "Export Development Canada (EDC — Agência Oficial de Crédito à Exportação)",
    beneficiarioOuEmpresa: "Operações de Infraestrutura, Mineração e Energia no Brasil",
    identificadorPublico: "EDC-BR-DISCLOSURE-2024-2025",
    categoria: "Crédito Exportação (EDC Brasil)",
    provinciaOuPaisDestino: "Brasil (MG, PA, SP, RJ)",
    setor: "Mineração, Saneamento, Ferrovia e Energia Limpa",
    anoFiscal: "2024-2025",
    valorCad: 1450000000,
    objetoResumo: "Financiamentos, seguros de crédito e garantias concedidos pela estatal canadense EDC para exportadores canadenses e grandes corporações atuantes no Brasil (divulgação obrigatória de transações individuais).",
    urlOficial: "https://www.edc.ca/en/about-us/corporate-social-responsibility/transparency-disclosure.html",
  },
  {
    id: "ca-eco-02",
    orgaoOuFundo: "Natural Resources Canada (NRCan — Critical Minerals Infrastructure Fund)",
    beneficiarioOuEmpresa: "Projetos de Cadeia de Suprimento de Minerais Críticos (Lítio, Níquel e Grafite)",
    identificadorPublico: "NRCan-CMIF-2025",
    categoria: "Subsídio / Grant (Open Canada)",
    provinciaOuPaisDestino: "Ontario e Quebec (Canadá)",
    setor: "Transição Energética & Minerais de Baterias",
    anoFiscal: "2024-2025",
    valorCad: 1500000000,
    objetoResumo: "Fundo público federal canadense para infraestrutura de energia e transporte ligada a minas de níquel, lítio e cobalto (incluindo o polo de Sudbury e refino em Becancour).",
    urlOficial: "https://search.open.canada.ca/grants/",
  },
  {
    id: "ca-eco-03",
    orgaoOuFundo: "Public Services and Procurement Canada (PSPC) & Crown-Indigenous Relations",
    beneficiarioOuEmpresa: "Consórcios de Remediação Ambiental (Faro Mine & Giant Mine Remediation)",
    identificadorPublico: "PSPC-NCRP-2025",
    categoria: "Contrato Federal (Proactive Disclosure)",
    provinciaOuPaisDestino: "Yukon e Northwest Territories (Canadá)",
    setor: "Remediação de Minas Abandonadas (Passivo Público)",
    anoFiscal: "2024-2025",
    valorCad: 890000000,
    objetoResumo: "Contratos públicos bilionários pagos pelo contribuinte canadense para conter 237 mil toneladas de trióxido de arsênio na antiga mina de ouro Giant Mine e drenagem ácida na mina Faro, abandonadas por empresas privadas falidas.",
    urlOficial: "https://search.open.canada.ca/contracts/",
  },
  {
    id: "ca-eco-04",
    orgaoOuFundo: "Statistics Canada (StatCan) — Canadian International Merchandise Trade",
    beneficiarioOuEmpresa: "Comércio Bilateral Canadá ↔ Brasil (Alumina, Potássio, Ouro e Aeronaves)",
    identificadorPublico: "STATCAN-CIMT-BR-2025",
    categoria: "Comércio Bilateral (StatCan)",
    provinciaOuPaisDestino: "Canadá ↔ Brasil",
    setor: "Fertilizantes (Potássio), Bauxita/Alumina e Manufatura",
    anoFiscal: "2025",
    valorCad: 11800000000,
    objetoResumo: "Fluxo comercial oficial entre Canadá e Brasil: o Brasil é grande fornecedor de alumina/bauxita (Pará) e ouro para refinarias canadenses, enquanto o Canadá é um dos maiores fornecedores de cloreto de potássio (fertilizante agrícola) para o Brasil.",
    urlOficial: "https://www150.statcan.gc.ca/n1/en/type/data",
  },
  {
    id: "ca-eco-05",
    orgaoOuFundo: "Global Legal Entity Identifier Foundation (GLEIF — Base Aberta LEI)",
    beneficiarioOuEmpresa: "Mapeamento Societário: Matrizes Canadenses ↔ Subsidiárias Brasileiras",
    identificadorPublico: "GLEIF-LEI-CA-BR",
    categoria: "Árvore Societária (GLEIF LEI)",
    provinciaOuPaisDestino: "Toronto / Vancouver ↔ Belo Horizonte / Belém / São Paulo",
    setor: "Transparência Societária & Mercado de Capitais",
    anoFiscal: "2026",
    valorCad: 9800000000,
    objetoResumo: "Registros abertos de Legal Entity Identifier (LEI) que conectam sem custo a empresa controladora listada em Toronto (Level 2 Ultimate Parent) às suas controladas diretas no Brasil.",
    urlOficial: "https://search.gleif.org",
  },
  {
    id: "ca-eco-06",
    orgaoOuFundo: "Environment and Climate Change Canada (ECCC) — Environmental Damages Fund",
    beneficiarioOuEmpresa: "Fundo Federal de Danos Ambientais (Multas da Lei de Pesca e Proteção Ambiental)",
    identificadorPublico: "ECCC-EDF-2024-2025",
    categoria: "Subsídio / Grant (Open Canada)",
    provinciaOuPaisDestino: "British Columbia, Ontario, Alberta e Quebec",
    setor: "Reparação Ecológica e Projetos Comunitários",
    anoFiscal: "2024-2025",
    valorCad: 142000000,
    objetoResumo: "Multas judiciais pagas por mineradoras e indústrias que violaram o Fisheries Act (lançamento de substâncias deletérias em rios com peixes) são obrigatoriamente destinadas a projetos de restauração comunitária e indígena.",
    urlOficial: "https://www.canada.ca/en/environment-climate-change/services/environmental-funding/programs/environmental-damages-fund.html",
  },
];

const INSTITUCIONAL_CANADA: RegistroInstitucionalCanada[] = [
  {
    id: "ca-inst-01",
    frente: "Cidades & Províncias (StatCan SGC)",
    codigoOficial: "SGC 3553005",
    nome: "Greater Sudbury (Ontário — Capital Histórica do Níquel)",
    provincia: "Ontario (ON)",
    statusOuCargo: "Município Polo Minerário (Vale Base Metals & Glencore)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Orçamento Municipal Anual (Operating + Capital Budget)",
    metricaPrincipalValor: 785000000,
    unidadeMetrica: "CAD",
    resumoCivico: "Cidade-irmã geológica de Itabira e Brumadinho: abriga o complexo Copper Cliff da Vale no Canadá. É referência mundial em recuperação ambiental urbana (mais de 10 milhões de árvores plantadas após décadas de chuva ácida).",
    eloBrasil: "Sede operacional das minas subterrâneas de níquel e cobre da brasileira Vale S.A. em Ontário.",
    fonteOficial: "City of Greater Sudbury Open Data / StatCan SGC 3553005",
    urlOficial: "https://opendata.greatersudbury.ca",
  },
  {
    id: "ca-inst-02",
    frente: "Cidades & Províncias (StatCan SGC)",
    codigoOficial: "SGC 3520005",
    nome: "Toronto (Ontário — Centro Financeiro e Sede da Bolsa TSX)",
    provincia: "Ontario (ON)",
    statusOuCargo: "Capital Provincial e Sede Global de Financiamento Mineral",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Orçamento Municipal Anual Consolidado",
    metricaPrincipalValor: 17100000000,
    unidadeMetrica: "CAD",
    resumoCivico: "Maior cidade do Canadá (2,79 milhões de habitantes no município). Abriga a Toronto Stock Exchange (TSX), onde são negociadas as ações e decisões de investimento sobre projetos minerários em Minas Gerais e na Amazônia.",
    eloBrasil: "Sede mundial da Vale Base Metals, Belo Sun, Brazil Potash, Jaguar Mining e Aura Minerals.",
    fonteOficial: "City of Toronto Open Data Portal / StatCan SGC 3520005",
    urlOficial: "https://open.toronto.ca",
  },
  {
    id: "ca-inst-03",
    frente: "Cidades & Províncias (StatCan SGC)",
    codigoOficial: "SGC 5915022",
    nome: "Vancouver (Colúmbia Britânica — Polo de Exploração Mineral TSX-V)",
    provincia: "British Columbia (BC)",
    statusOuCargo: "Município Polo de Mineradoras Júnior e Comércio no Pacífico",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Orçamento Municipal Anual",
    metricaPrincipalValor: 2150000000,
    unidadeMetrica: "CAD",
    resumoCivico: "Sede de centenas de empresas de exploração mineral listadas na TSX Venture Exchange (TSX-V) e das gigantes Lundin Mining, Ero Copper, Equinox Gold e Sigma Lithium.",
    eloBrasil: "A partir de Vancouver são geridas as operações da Sigma Lithium (Araçuaí/Itinga-MG), Ero Copper (BA/PA) e Equinox Gold (MG/MA/BA).",
    fonteOficial: "City of Vancouver Open Data / StatCan SGC 5915022",
    urlOficial: "https://opendata.vancouver.ca",
  },
  {
    id: "ca-inst-04",
    frente: "Parlamento Federal (OpenParliament)",
    codigoOficial: "LEGISinfo ESTMA (S.C. 2014, c. 39, s. 376)",
    nome: "Lei de Transparência no Setor Extrativo (ESTMA — Extractive Sector Transparency Measures Act)",
    provincia: "Federal (Ottawa — Câmara dos Comuns e Senado)",
    statusOuCargo: "Lei Federal em Vigor (Fiscalizada pelo NRCan)",
    anoReferencia: 2025,
    metricaPrincipalRotulo: "Piso para declaração obrigatória de pagamentos a governos",
    metricaPrincipalValor: 100000,
    unidadeMetrica: "CAD por entidade pública",
    resumoCivico: "Obriga toda mineradora ou petroleira canadense a publicar anualmente cada pagamento acima de CAD $100.000 feito a governos estrangeiros (impostos, royalties/CFEM, taxas de licenciamento e pagamentos a comunidades indígenas).",
    eloBrasil: "Permite auditar no Canadá quanto cada mineradora declarou ter pago à ANM e a prefeituras brasileiras, cruzando com o dado da CFEM no Brasil.",
    fonteOficial: "Parliament of Canada / NRCan ESTMA Portal",
    urlOficial: "https://natural-resources.canada.ca/our-natural-resources/minerals-mining/mining-policy-taxation-industry/extractive-sector-transparency-measures-act/18188",
  },
  {
    id: "ca-inst-05",
    frente: "Parlamento Federal (OpenParliament)",
    codigoOficial: "LEGISinfo Bill S-211 / C-262 (UNDRIP Act)",
    nome: "Lei de Implementação da Declaração da ONU sobre Direitos dos Povos Indígenas (UNDRIP Act) & Cadeias de Suprimento",
    provincia: "Federal (Ottawa — Parliament of Canada)",
    statusOuCargo: "Leis Federais Sancionadas (S.C. 2021, c. 14 e S.C. 2023, c. 9)",
    anoReferencia: 2025,
    metricaPrincipalRotulo: "Deputados Federais (MPs) na Câmara dos Comuns",
    metricaPrincipalValor: 338,
    unidadeMetrica: "parlamentares eleitos",
    resumoCivico: "A lei UNDRIP harmoniza as leis federais canadenses com o consentimento livre, prévio e informado indígena, enquanto a Bill S-211 exige relatórios anuais contra trabalho forçado e infantil nas cadeias globais de mineração e indústria.",
    eloBrasil: "Empresas canadenses que importam minério, ouro ou insumos do Brasil precisam reportar riscos trabalhistas em sua cadeia de fornecedores.",
    fonteOficial: "OpenParliament.ca / LEGISinfo (OurCommons.ca)",
    urlOficial: "https://openparliament.ca/bills/",
  },
  {
    id: "ca-inst-06",
    frente: "Suprema Corte & Jurisprudência (CanLII)",
    codigoOficial: "2020 SCC 5 (CanLII)",
    nome: "Nevsun Resources Ltd. v. Araya & Choc v. Hudbay Minerals (Responsabilidade Transnacional)",
    provincia: "Federal / Ontario (Suprema Corte do Canadá e Corte Superior de Ontário)",
    statusOuCargo: "Precedente Judicial Vinculante (Direito Internacional Consuetudinário)",
    anoReferencia: 2020,
    metricaPrincipalRotulo: "Juízes na Suprema Corte do Canadá",
    metricaPrincipalValor: 9,
    unidadeMetrica: "magistrados",
    resumoCivico: "Decisão histórica da Suprema Corte do Canadá (Nevsun, 2020) estabeleceu que mineradoras canadenses podem ser processadas diretamente nos tribunais do Canadá por graves violações de direitos humanos cometidas em suas minas no exterior.",
    eloBrasil: "Abre caminho jurídico direto para que comunidades atingidas no Brasil responsabilizem a matriz canadense em Toronto ou Vancouver.",
    fonteOficial: "Supreme Court of Canada / CanLII (2020 SCC 5)",
    urlOficial: "https://www.canlii.org/en/ca/scc/doc/2020/2020scc5/2020scc5.html",
  },
  {
    id: "ca-inst-07",
    frente: "Suprema Corte & Jurisprudência (CanLII)",
    codigoOficial: "2004 SCC 73 (CanLII)",
    nome: "Haida Nation v. British Columbia (Dever Constitucional de Consulta Prévia — Duty to Consult)",
    provincia: "British Columbia / Federal (Seção 35 do Constitution Act, 1982)",
    statusOuCargo: "Jurisprudência Constitucional Consolidada",
    anoReferencia: 2004,
    metricaPrincipalRotulo: "Artigo Constitucional de Proteção Originária",
    metricaPrincipalValor: 35,
    unidadeMetrica: "Seção da Constituição (1982)",
    resumoCivico: "A Suprema Corte do Canadá decidiu que a Coroa tem o dever constitucional de consultar e acomodar povos indígenas antes de autorizar extração mineral ou florestal, mesmo em territórios tradicionais ainda não demarcados por tratado.",
    eloBrasil: "Equivalente direto no direito constitucional canadense ao Artigo 231 da Constituição Brasileira de 1988 e à Convenção 169 da OIT.",
    fonteOficial: "Supreme Court of Canada / CanLII (2004 SCC 73)",
    urlOficial: "https://www.canlii.org/en/ca/scc/doc/2004/2004scc73/2004scc73.html",
  },
  {
    id: "ca-inst-08",
    frente: "Primeiras Nações & Terras (CIRNAC/Native Land)",
    codigoOficial: "CIRNAC UUID 522b07b9 / ATIS",
    nome: "Primeiras Nações (First Nations), Inuit e Métis — Reservas e Territórios Não-Cedidos",
    provincia: "Nacional (Todas as 10 Províncias e 3 Territórios)",
    statusOuCargo: "634 Primeiras Nações Reconhecidas e ~3.100 Reservas",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Primeiras Nações com Perfil Oficial no CIRNAC",
    metricaPrincipalValor: 634,
    unidadeMetrica: "nações originárias",
    resumoCivico: "O sistema federal ATIS e o portal Native Land Digital mostram que as pequenas reservas sob o Indian Act são apenas uma fração dos territórios tradicionais (como a nação Secwépemc atingida por Mount Polley e as nações do Ring of Fire em Ontário).",
    eloBrasil: "Dialoga com a frente Função Social da Terra do Controle Popular (Terras Indígenas FUNAI e Territórios Quilombolas INCRA).",
    fonteOficial: "CIRNAC First Nation Profiles / Native Land Digital",
    urlOficial: "https://fnp-ppn.aadnc-aandc.gc.ca/fnp/Main/Search/SearchFN.aspx?lang=eng",
  },
  {
    id: "ca-inst-09",
    frente: "Direitos & Ouvidoria (CORE / Sabin Center)",
    codigoOficial: "CORE-OMBUDS-CA / ATIP",
    nome: "Ouvidoria Canadense para Empresas Responsáveis (CORE) & Litígios Climáticos",
    provincia: "Federal (Ottawa — Global Affairs Canada)",
    statusOuCargo: "Órgão Federal de Fiscalização de Direitos Humanos no Exterior",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Setores monitorados fora do Canadá (Mineração, Petróleo e Vestuário)",
    metricaPrincipalValor: 3,
    unidadeMetrica: "setores prioritários",
    resumoCivico: "Qualquer comunidade ou organização brasileira afetada por uma mineradora canadense pode apresentar denúncia formal gratuita (em português, inglês, espanhol ou francês) à Ouvidoria CORE do governo do Canadá.",
    eloBrasil: "Canal direto de pressão institucional no Canadá para conflitos no Vale do Jequitinhonha, Xingu, Tapajós e Quadrilátero Ferrífero.",
    fonteOficial: "Office of the Canadian Ombudsperson for Responsible Enterprise (CORE)",
    urlOficial: "https://core-ombuds.canada.ca/core_ombuds-ocre_ombuds/complaint-plainte.aspx?lang=eng",
  },
];

function limparObjeto<T extends Record<string, any>>(item: T): T {
  const copia: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    copia[k] = typeof v === "string" ? sanitizarDadoPessoalInternacional(v) : v;
  }
  return copia as T;
}

function gravarCompacto<T extends Record<string, any>>(nomeArquivo: string, registros: T[]) {
  const limpos = registros.map(limparObjeto);
  const tabela = compactar(limpos);
  const destino = path.join(DIR_CANADA, nomeArquivo);
  fs.writeFileSync(destino, JSON.stringify(tabela, null, 2), "utf-8");
  console.log(`✓ [Canadá] ${nomeArquivo} gravado com ${limpos.length} registros.`);
}

function main() {
  fs.mkdirSync(DIR_CANADA, { recursive: true });
  gravarCompacto("mineradoras-tsx-brasil.compact.json", MINERADORAS_TSX_BRASIL);
  gravarCompacto("ambiental-natureza-ciencia.compact.json", AMBIENTAL_CIENCIA_CANADA);
  gravarCompacto("contratos-open-canada.compact.json", CONTRATOS_ECONOMIA_CANADA);
  gravarCompacto("institucional-canada.compact.json", INSTITUCIONAL_CANADA);
}

main();
