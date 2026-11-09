/**
 * Índice dos resumos de realidade publicados.
 *
 * GERADO por `scripts/gerar-indice-resumos.py`. Não edite à mão: a próxima
 * execução sobrescreve. Só entra arquivo com `verificado: true`; resumo
 * vencido continua no disco, mas some do mapa.
 */

import type { ResumoRealidade } from "@/lib/resumos-realidade";

import resumoAmbientalAmeacasAmericas from "./ambiental-ameacas-americas.json";
import resumoAmbientalAutuacoes from "./ambiental-autuacoes.json";
import resumoAmbientalBarragensGlobais from "./ambiental-barragens-globais.json";
import resumoAmbientalBarragens from "./ambiental-barragens.json";
import resumoAmbientalConflitosGlobais from "./ambiental-conflitos-globais.json";
import resumoAmbientalConselhos from "./ambiental-conselhos.json";
import resumoAmbientalConvenios from "./ambiental-convenios.json";
import resumoAmbientalEcossistema from "./ambiental-ecossistema.json";
import resumoAmbientalMariana from "./ambiental-mariana.json";
import resumoAmbientalTac from "./ambiental-tac.json";
import resumoAmbiental from "./ambiental.json";
import resumoAmericaLatina from "./america-latina.json";
import resumoAssembleias from "./assembleias.json";
import resumoBiblioteca from "./biblioteca.json";
import resumoCanadaAmbiental from "./canada-ambiental.json";
import resumoCanadaContratos from "./canada-contratos.json";
import resumoCanadaInstitucional from "./canada-institucional.json";
import resumoCanadaMineracao from "./canada-mineracao.json";
import resumoCanada from "./canada.json";
import resumoConcursos from "./concursos.json";
import resumoConsumoCorporativo from "./consumo-corporativo.json";
import resumoDesclassificados from "./desclassificados.json";
import resumoDireitosEmMovimentoConselhos from "./direitos-em-movimento-conselhos.json";
import resumoEditais from "./editais.json";
import resumoEleicoes2026GastosCampanha from "./eleicoes-2026-gastos-campanha.json";
import resumoEmpresasFortunas from "./empresas-fortunas.json";
import resumoEstadoEEconomiaAcordosELicitacoesInternacionais from "./estado-e-economia-acordos-e-licitacoes-internacionais.json";
import resumoEstudosRurais from "./estudos-rurais.json";
import resumoEuaContratos from "./eua-contratos.json";
import resumoEuaEmpresas from "./eua-empresas.json";
import resumoEuaInstitucional from "./eua-institucional.json";
import resumoEuropa from "./europa.json";
import resumoGuia from "./guia.json";
import resumoHistoria from "./historia.json";
import resumoIndice from "./indice.json";
import resumoInstituicoes from "./instituicoes.json";
import resumoInteligencia from "./inteligencia.json";
import resumoInternacionalDesclassificadosMapa from "./internacional-desclassificados-mapa.json";
import resumoInternacionalDesclassificados from "./internacional-desclassificados.json";
import resumoInternacionalInteligenciaMapa from "./internacional-inteligencia-mapa.json";
import resumoInternacionalInteligencia from "./internacional-inteligencia.json";
import resumoInternacionalOperacoesMilitaresMapa from "./internacional-operacoes-militares-mapa.json";
import resumoInternacionalOperacoesMilitares from "./internacional-operacoes-militares.json";
import resumoInternacionalOrcamentos from "./internacional-orcamentos.json";
import resumoJudiciarioContatos from "./judiciario-contatos.json";
import resumoJudiciarioInstituicoes from "./judiciario-instituicoes.json";
import resumoJudiciarioJurisprudencia from "./judiciario-jurisprudencia.json";
import resumoJudiciarioRecomendacoes from "./judiciario-recomendacoes.json";
import resumoJudiciario from "./judiciario.json";
import resumoJurisprudenciaPenal from "./jurisprudencia-penal.json";
import resumoJurisprudencia from "./jurisprudencia.json";
import resumoLaboratorio from "./laboratorio.json";
import resumoMineracaoCavas from "./mineracao-cavas.json";
import resumoNoticias from "./noticias.json";
import resumoNovidades from "./novidades.json";
import resumoParaopebaAnalise from "./paraopeba-analise.json";
import resumoParaopebaAuditoria from "./paraopeba-auditoria.json";
import resumoParaopebaBiblioteca from "./paraopeba-biblioteca.json";
import resumoParaopebaCorrelacao from "./paraopeba-correlacao.json";
import resumoParaopebaDocumentos from "./paraopeba-documentos.json";
import resumoTerraETerritoriosVales from "./terra-e-territorios-vales.json";

export const RESUMOS: Record<string, ResumoRealidade> = {
  "/ambiental/ameacas-americas": resumoAmbientalAmeacasAmericas as ResumoRealidade,
  "/ambiental/autuacoes": resumoAmbientalAutuacoes as ResumoRealidade,
  "/ambiental/barragens-globais": resumoAmbientalBarragensGlobais as ResumoRealidade,
  "/ambiental/barragens": resumoAmbientalBarragens as ResumoRealidade,
  "/ambiental/conflitos-globais": resumoAmbientalConflitosGlobais as ResumoRealidade,
  "/ambiental/conselhos": resumoAmbientalConselhos as ResumoRealidade,
  "/ambiental/convenios": resumoAmbientalConvenios as ResumoRealidade,
  "/ambiental/ecossistema": resumoAmbientalEcossistema as ResumoRealidade,
  "/ambiental/mariana": resumoAmbientalMariana as ResumoRealidade,
  "/ambiental/tac": resumoAmbientalTac as ResumoRealidade,
  "/ambiental": resumoAmbiental as ResumoRealidade,
  "/america-latina": resumoAmericaLatina as ResumoRealidade,
  "/assembleias": resumoAssembleias as ResumoRealidade,
  "/biblioteca": resumoBiblioteca as ResumoRealidade,
  "/canada/ambiental": resumoCanadaAmbiental as ResumoRealidade,
  "/canada/contratos": resumoCanadaContratos as ResumoRealidade,
  "/canada/institucional": resumoCanadaInstitucional as ResumoRealidade,
  "/canada/mineracao": resumoCanadaMineracao as ResumoRealidade,
  "/canada": resumoCanada as ResumoRealidade,
  "/concursos": resumoConcursos as ResumoRealidade,
  "/consumo-corporativo": resumoConsumoCorporativo as ResumoRealidade,
  "/desclassificados": resumoDesclassificados as ResumoRealidade,
  "/direitos-em-movimento/conselhos": resumoDireitosEmMovimentoConselhos as ResumoRealidade,
  "/editais": resumoEditais as ResumoRealidade,
  "/eleicoes/2026/gastos-campanha": resumoEleicoes2026GastosCampanha as ResumoRealidade,
  "/empresas/fortunas": resumoEmpresasFortunas as ResumoRealidade,
  "/estado-e-economia/acordos-e-licitacoes-internacionais": resumoEstadoEEconomiaAcordosELicitacoesInternacionais as ResumoRealidade,
  "/estudos-rurais": resumoEstudosRurais as ResumoRealidade,
  "/eua/contratos": resumoEuaContratos as ResumoRealidade,
  "/eua/empresas": resumoEuaEmpresas as ResumoRealidade,
  "/eua/institucional": resumoEuaInstitucional as ResumoRealidade,
  "/europa": resumoEuropa as ResumoRealidade,
  "/guia": resumoGuia as ResumoRealidade,
  "/historia": resumoHistoria as ResumoRealidade,
  "/indice": resumoIndice as ResumoRealidade,
  "/instituicoes": resumoInstituicoes as ResumoRealidade,
  "/inteligencia": resumoInteligencia as ResumoRealidade,
  "/internacional/desclassificados/mapa": resumoInternacionalDesclassificadosMapa as ResumoRealidade,
  "/internacional/desclassificados": resumoInternacionalDesclassificados as ResumoRealidade,
  "/internacional/inteligencia/mapa": resumoInternacionalInteligenciaMapa as ResumoRealidade,
  "/internacional/inteligencia": resumoInternacionalInteligencia as ResumoRealidade,
  "/internacional/operacoes-militares/mapa": resumoInternacionalOperacoesMilitaresMapa as ResumoRealidade,
  "/internacional/operacoes-militares": resumoInternacionalOperacoesMilitares as ResumoRealidade,
  "/internacional/orcamentos": resumoInternacionalOrcamentos as ResumoRealidade,
  "/judiciario/contatos": resumoJudiciarioContatos as ResumoRealidade,
  "/judiciario/instituicoes": resumoJudiciarioInstituicoes as ResumoRealidade,
  "/judiciario/jurisprudencia": resumoJudiciarioJurisprudencia as ResumoRealidade,
  "/judiciario/recomendacoes": resumoJudiciarioRecomendacoes as ResumoRealidade,
  "/judiciario": resumoJudiciario as ResumoRealidade,
  "/jurisprudencia/penal": resumoJurisprudenciaPenal as ResumoRealidade,
  "/jurisprudencia": resumoJurisprudencia as ResumoRealidade,
  "/laboratorio": resumoLaboratorio as ResumoRealidade,
  "/mineracao/cavas": resumoMineracaoCavas as ResumoRealidade,
  "/noticias": resumoNoticias as ResumoRealidade,
  "/novidades": resumoNovidades as ResumoRealidade,
  "/paraopeba/analise": resumoParaopebaAnalise as ResumoRealidade,
  "/paraopeba/auditoria": resumoParaopebaAuditoria as ResumoRealidade,
  "/paraopeba/biblioteca": resumoParaopebaBiblioteca as ResumoRealidade,
  "/paraopeba/correlacao": resumoParaopebaCorrelacao as ResumoRealidade,
  "/paraopeba/documentos": resumoParaopebaDocumentos as ResumoRealidade,
  "/terra-e-territorios/vales": resumoTerraETerritoriosVales as ResumoRealidade,
};
