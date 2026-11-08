/**
 * Índice dos resumos de realidade publicados.
 *
 * GERADO por `scripts/gerar-indice-resumos.py`. Não edite à mão: a próxima
 * execução sobrescreve. Só entra arquivo com `verificado: true`; resumo
 * vencido continua no disco, mas some do mapa.
 */

import type { ResumoRealidade } from "@/lib/resumos-realidade";

import resumoAmbientalBarragens from "./ambiental-barragens.json";
import resumoAmbientalConselhos from "./ambiental-conselhos.json";
import resumoAmbientalConvenios from "./ambiental-convenios.json";
import resumoAmbientalEcossistema from "./ambiental-ecossistema.json";
import resumoAmbientalMariana from "./ambiental-mariana.json";
import resumoAssembleias from "./assembleias.json";
import resumoBiblioteca from "./biblioteca.json";
import resumoConcursos from "./concursos.json";
import resumoDireitosEmMovimentoConselhos from "./direitos-em-movimento-conselhos.json";
import resumoEditais from "./editais.json";
import resumoEstadoEEconomiaAcordosELicitacoesInternacionais from "./estado-e-economia-acordos-e-licitacoes-internacionais.json";
import resumoEstudosRurais from "./estudos-rurais.json";
import resumoGuia from "./guia.json";
import resumoHistoria from "./historia.json";
import resumoIndice from "./indice.json";
import resumoInstituicoes from "./instituicoes.json";
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
import resumoParaopebaAuditoria from "./paraopeba-auditoria.json";
import resumoParaopebaBiblioteca from "./paraopeba-biblioteca.json";
import resumoParaopebaCorrelacao from "./paraopeba-correlacao.json";
import resumoParaopebaDocumentos from "./paraopeba-documentos.json";
import resumoTerraETerritoriosVales from "./terra-e-territorios-vales.json";

export const RESUMOS: Record<string, ResumoRealidade> = {
  "/ambiental/barragens": resumoAmbientalBarragens as ResumoRealidade,
  "/ambiental/conselhos": resumoAmbientalConselhos as ResumoRealidade,
  "/ambiental/convenios": resumoAmbientalConvenios as ResumoRealidade,
  "/ambiental/ecossistema": resumoAmbientalEcossistema as ResumoRealidade,
  "/ambiental/mariana": resumoAmbientalMariana as ResumoRealidade,
  "/assembleias": resumoAssembleias as ResumoRealidade,
  "/biblioteca": resumoBiblioteca as ResumoRealidade,
  "/concursos": resumoConcursos as ResumoRealidade,
  "/direitos-em-movimento/conselhos": resumoDireitosEmMovimentoConselhos as ResumoRealidade,
  "/editais": resumoEditais as ResumoRealidade,
  "/estado-e-economia/acordos-e-licitacoes-internacionais": resumoEstadoEEconomiaAcordosELicitacoesInternacionais as ResumoRealidade,
  "/estudos-rurais": resumoEstudosRurais as ResumoRealidade,
  "/guia": resumoGuia as ResumoRealidade,
  "/historia": resumoHistoria as ResumoRealidade,
  "/indice": resumoIndice as ResumoRealidade,
  "/instituicoes": resumoInstituicoes as ResumoRealidade,
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
  "/paraopeba/auditoria": resumoParaopebaAuditoria as ResumoRealidade,
  "/paraopeba/biblioteca": resumoParaopebaBiblioteca as ResumoRealidade,
  "/paraopeba/correlacao": resumoParaopebaCorrelacao as ResumoRealidade,
  "/paraopeba/documentos": resumoParaopebaDocumentos as ResumoRealidade,
  "/terra-e-territorios/vales": resumoTerraETerritoriosVales as ResumoRealidade,
};
