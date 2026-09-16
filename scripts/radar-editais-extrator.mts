/**
 * scripts/radar-editais-extrator.mts — extrator determinístico de metadados
 * jornalísticos para editais e atos publicados no Diário Oficial.
 *
 * Transforma trechos administrativos brutos em:
 * 1. Órgão emissor identificado (SEE/MG, SES/MG, IPSM, IPSEMG, FAPEMIG, EPAMIG, DETRAN, etc.)
 * 2. Modalidade/Tipo de certame (Chamamento Público, Credenciamento, Pregão, Inexigibilidade, Leilão)
 * 3. Número do certame/ano
 * 4. Objeto claro e resumido em linguagem leiga
 * 5. Prazos e Condições essenciais de participação
 * 6. Título acessível e jornalístico: "[Modalidade] [Órgão]: [Ação/Objeto]"
 */

export interface MetadadosEdital {
  orgao: string;
  modalidade: string;
  numero: string | null;
  objeto: string;
  condicoesEPrazos: string;
  tituloJornalistico: string;
  subtitulo: string;
  resumo: string;
  paragrafos: string[];
}

function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Identifica o órgão emissor do edital no trecho ou seção.
 */
export function identificarOrgao(texto: string, secao: string | null): string {
  const norm = normalizar(texto + " " + (secao ?? ""));

  if (norm.includes("fapemig") || norm.includes("amparo a pesquisa do estado de minas gerais")) {
    return norm.includes("cnpq") ? "FAPEMIG/CNPq" : "FAPEMIG";
  }
  if (norm.includes("ipsemg") || norm.includes("servidores do estado de minas gerais")) {
    return "IPSEMG";
  }
  if (norm.includes("ipsm") || norm.includes("servidores militares") || norm.includes("pmmg-cbmmg-ipsm") || norm.includes("pmm-cbmmg-ipsm") || norm.includes("clinica mais viver")) {
    return "IPSM";
  }
  if (norm.includes("condel") || norm.includes("ppddh") || norm.includes("defensores dos direitos humanos")) {
    return "CONDEL/PPDDH-MG";
  }
  if (norm.includes("sre aracuai") || norm.includes("sre araçuai") || norm.includes("alphonsus de guimaraens")) {
    return "SRE Araçuaí / SEE-MG";
  }
  if (norm.includes("fhemig") || norm.includes("fundacao hospitalar do estado de minas gerais")) {
    return "FHEMIG";
  }
  if (norm.includes("secretaria de estado de governo") || /\bsegov\b/.test(norm)) {
    return "SEGOV/MG";
  }
  if (norm.includes("epamig") || norm.includes("pesquisa agropecuaria de minas gerais")) {
    return "EPAMIG";
  }
  if (norm.includes("detran") || norm.includes("departamento estadual de transito")) {
    return "DETRAN-MG";
  }
  if (norm.includes("funed") || norm.includes("fundacao ezequiel dias")) {
    return "FUNED";
  }
  if (norm.includes("instituto estadual de florestas") || /\bief\b/.test(norm)) {
    return "IEF";
  }
  if (
    norm.includes("secretaria de estado de educacao") ||
    /\bsee[\/\s\-]?mg\b/.test(norm) ||
    /\bsee\b/.test(norm) ||
    norm.includes("resolucao see") ||
    norm.includes("trilhas de futuro")
  ) {
    return "SEE/MG";
  }
  if (norm.includes("secretaria de estado de saude") || /\bses[\/\s\-]?mg\b/.test(norm)) {
    return "SES/MG";
  }
  if (norm.includes("secretaria de estado de fazenda") || /\bsef[\/\s\-]?mg\b/.test(norm) || norm.includes("data center da sef")) {
    return "SEF/MG";
  }
  if (norm.includes("secretaria de estado de justica e seguranca publica") || /\bsejusp\b/.test(norm)) {
    return "SEJUSP/MG";
  }
  if (norm.includes("secretaria de estado de planejamento e gestao") || /\bseplag\b/.test(norm)) {
    return "SEPLAG";
  }
  if (norm.includes("secretaria de estado de meio ambiente") || /\bsemad\b/.test(norm)) {
    return "SEMAD";
  }
  if (norm.includes("hemominas")) {
    return "HEMOMINAS";
  }
  if (norm.includes("uemg")) {
    return "UEMG";
  }
  if (norm.includes("unimontes")) {
    return "UNIMONTES";
  }
  if (norm.includes("condel") || norm.includes("ppddh")) {
    return "CONDEL/PPDDH-MG";
  }

  // Seção de apoio do caderno
  if (secao && !secao.toLowerCase().includes("radar de editais") && secao !== "Editais e Avisos" && secao.trim().length > 3) {
    const limpo = secao.trim().replace(/^Secretaria de Estado de\s+/i, "Secretaria de ");
    if (limpo.length < 35) return limpo;
  }

  return "Governo de Minas Gerais";
}

/**
 * Identifica a modalidade ou tipo de ato administrativo.
 */
export function identificarModalidade(texto: string): string {
  const norm = normalizar(texto);

  if (norm.includes("chamada publica")) return "Chamada Pública";
  if (norm.includes("chamamento publico") || norm.includes("edital de chamamento")) return "Chamamento Público";
  if (norm.includes("termo de inabilitacao") || norm.includes("inabilitacao de credenciamento") || norm.includes("nao habilitados")) {
    return "Inabilitação de Credenciamento";
  }
  if (norm.includes("habilitacoes no edital") || norm.includes("resultado final referente ao edital de credenciamento") || norm.includes("habilitados para formacao do cadastro reserva")) {
    return "Resultado de Credenciamento";
  }
  if (norm.includes("credenciamento")) return "Credenciamento";
  if (norm.includes("inexigibilidade de licitacao") || norm.includes("ilidade de licitacao")) return "Inexigibilidade de Licitação";
  if (norm.includes("dispensa de licitacao")) return "Dispensa de Licitação";
  if (norm.includes("retificacao") && (norm.includes("pregao") || norm.includes("edital"))) return "Retificação de Pregão Eletrônico";
  if (norm.includes("pregao eletronico") || norm.includes("pregao")) return "Pregão Eletrônico";
  if (norm.includes("leilao")) return "Leilão Público";
  if (norm.includes("concurso publico") || norm.includes("processo seletivo") || norm.includes("candidatos nomeados")) return "Processo Seletivo";
  if (norm.includes("termo de fomento") || norm.includes("termo de parceria") || norm.includes("colaboracao")) return "Parceria com Sociedade Civil";
  if (norm.includes("eliminacao de documentos")) return "Eliminação de Documentos";

  return "Edital Convocatório";
}

/**
 * Extrai o número do edital/processo se houver.
 */
export function extrairNumero(texto: string): string | null {
  // Padrões como: nº 1862/2026, 02/2025, 01/2026, nº 2261032 338/2026, etc.
  const m = texto.match(/(?:edital|pregao|leilao|credenciamento|chamamento|processo|n[ºo°\. ]+)\s*(?:de\s+)?(?:n[ºo°\. ]+)?(\d+(?:[\.\/\- ]\d+)*\/?(?:20\d\d)?)/i);
  if (m && m[1] && m[1].length >= 2 && m[1].length <= 25) {
    const num = m[1].trim().replace(/\s+/g, " ");
    if (/\d/.test(num) && !num.startsWith("48.064")) return num; // 48.064 é decreto estadual
  }
  return null;
}

/**
 * Sintetiza o objeto do edital em linguagem compreensível.
 */
export function sintetizarObjeto(texto: string, modalidade: string, orgao: string): string {
  const t = texto.replace(/\s+/g, " ");
  const norm = normalizar(t);

  if (norm.includes("condel") || norm.includes("ppddh") || norm.includes("defensores dos direitos humanos")) {
    return "Prorrogação de prazos para seleção de entidades civis no Conselho Deliberativo do PPDDH-MG";
  }
  if (norm.includes("sre aracuai") || norm.includes("sre araçuai") || norm.includes("alphonsus de guimaraens")) {
    return "Aquisição de alimentos da agricultura familiar para a merenda de caixas escolares";
  }
  if (norm.includes("fhemig") || norm.includes("urologia")) {
    return "Retificação e termo aditivo para credenciamento de serviços médicos de Urologia";
  }
  if (norm.includes("segov") || norm.includes("laura saia palombo") || norm.includes("secretaria de estado de governo")) {
    return "Notificação formal sobre prestação de contas de convênios com entidades do terceiro setor";
  }
  if (norm.includes("trilhas de futuro")) {
    return "Credenciamento e homologação de cursos técnicos para o Projeto Trilhas de Futuro";
  }
  if (norm.includes("clinica mais viver") || (norm.includes("ipsm") && norm.includes("prazo de 03"))) {
    return "Abertura de prazo de 3 dias úteis para recursos de clínicas e estabelecimentos de saúde";
  }
  if (norm.includes("licitar.digital")) {
    return "Abertura de propostas e disputa de lances para contratações no sistema Licitar Digital";
  }

  if (/leil[aã]o/i.test(modalidade)) {
    if (/sucatas/i.test(t) || /conservados/i.test(t)) {
      return "Alienação de veículos conservados e sucatas aproveitáveis recolhidos em pátios oficiais";
    }
    return "Alienação de bens móveis e veículos públicos pela melhor oferta";
  }

  if (/fapemig/i.test(orgao)) {
    return "Fomento a projetos de pesquisa científica, extensão tecnológica e concessão de bolsas de inovação";
  }

  if (/epamig/i.test(orgao)) {
    return "Serviços de manutenção mecânica preventiva e corretiva, fornecimento de peças e guincho para a frota oficial";
  }

  if (/climatiza[çc][ãa]o/i.test(t) || /data center/i.test(t)) {
    return "Substituição e modernização do sistema de climatização de precisão do Data Center da Secretaria de Fazenda";
  }

  if (/ca[çc]ambas/i.test(t) || /res[íi]duos de constru/i.test(t)) {
    return "Locação de caçambas estacionárias para recolhimento e transporte de resíduos de construção civil";
  }

  if (/transporte aquavi[aá]rio/i.test(t)) {
    return "Prestação de serviços operacionais de transporte aquaviário em unidades de conservação";
  }

  if (/sa[úu]de/i.test(orgao) || /ipsm/i.test(orgao) || /ipsemg/i.test(orgao)) {
    if (/odontol/i.test(t)) {
      return "Credenciamento de clínicas e profissionais especializados em assistência e diagnóstico odontológico";
    }
    if (/hospital/i.test(t) || /sus/i.test(t)) {
      return "Credenciamento de instituições hospitalares privadas para prestação de serviços de saúde ao SUS-MG";
    }
    if (/cadastro reserva/i.test(t)) {
      return "Formação de cadastro de reserva de profissionais e clínicas de saúde para a rede de assistência oficial";
    }
    if (/inabilita[çc]/i.test(modalidade)) {
      return "Divulgação de interessados inabilitados no processo de credenciamento de serviços de saúde";
    }
    if (/recurso/i.test(t) || /prazo de 0?3/i.test(t)) {
      return "Abertura de prazo recursal para clínicas e entidades participantes do edital de credenciamento";
    }
    return "Prestação de serviços de assistência médica, ambulatorial e hospitalar para servidores e dependentes";
  }

  if (/see[\/\s\-]?mg/i.test(orgao) || /educa/i.test(orgao)) {
    if (/inabilita/i.test(modalidade)) {
      return "Termo de inabilitação de credenciamento de prestadores de serviços para a rede estadual de ensino";
    }
    return "Credenciamento de profissionais e prestadores de serviços especializados de apoio à educação básica";
  }

  if (/sejusp/i.test(orgao) || /seguran/i.test(orgao)) {
    return "Seleção de projetos sociais e fortalecimento de iniciativas comunitárias voltadas à segurança cidadã";
  }

  if (/eliminacao de documentos/i.test(modalidade)) {
    return "Ciência de eliminação e descarte regular de documentos de arquivo da administração estadual";
  }

  if (/candidatos nomeados/i.test(t) || /processo seletivo/i.test(modalidade)) {
    return "Convocação de candidatos nomeados para apresentação de documentação e posse em cargo público";
  }

  if (/propostas a partir de/i.test(t) || /pregao/i.test(modalidade)) {
    return "Contratação de bens e serviços comuns por pregão eletrônico no sistema oficial de compras";
  }

  return "Atendimento aos critérios técnicos e exigências fixados no instrumento convocatório publicado no diário";
}

/**
 * Sintetiza prazos, condições e requisitos de participação.
 */
export function sintetizarCondicoes(texto: string, modalidade: string): string {
  const t = texto.replace(/\s+/g, " ");

  const mProposta = t.match(/propostas\s+a\s+partir\s+de\s+([^\.]+?)\s+at[ée]\s+([^\.]+?)(?:\.|$)/i);
  if (mProposta) {
    return `Recebimento de propostas comerciais de ${mProposta[1].trim()} até ${mProposta[2].trim()}, com abertura da sessão pública eletrônica em seguida.`;
  }

  const mSessao = t.match(/(?:sess[ãa]o\s+p[úu]blica|abertura).*?(dia\s+\d{1,2}\/\d{1,2}\/\d{4}.*?\d{1,2}h(?:\d{2})?min?)/i);
  if (mSessao) {
    return `Sessão pública agendada para ${mSessao[1].trim()} em plataforma oficial de compras públicas.`;
  }

  const mRecurso = t.match(/prazo\s+de\s+(\d+\s*(?:\([^\)]+\)\s*)?dias\s+[úu]teis)/i);
  if (mRecurso) {
    return `Fica concedido o prazo de ${mRecurso[1]} úteis para a interposição de recursos administrativos a contar da publicação oficial.`;
  }

  if (/inabilita/i.test(modalidade)) {
    return "Candidatos ou entidades inabilitadas podem interpor recurso administrativo no prazo regulamentar do certame, indicando as razões de discordância conforme instrução do diário.";
  }

  if (/leil[aã]o/i.test(modalidade)) {
    return "Arrematação pela melhor oferta individual por lote no estado de conservação em que se encontram, permitida a vistoria prévia dos bens nos pátios credenciados.";
  }

  if (/credenciamento/i.test(modalidade)) {
    return "Inscrição condicionada ao cumprimento integral das exigências de habilitação jurídica, regularidade fiscal e qualificação técnica exigidas no edital de credenciamento.";
  }

  return "Condições de habilitação jurídica, regularidade fiscal e prazos estipulados na íntegra do edital oficial.";
}

/**
 * Cria um título jornalístico atrativo, direto e acessível ao leitor leigo.
 */
export function gerarTituloJornalistico(
  orgao: string,
  modalidade: string,
  numero: string | null,
  objeto: string
): string {
  const numStr = numero ? ` nº ${numero}` : "";

  // Casos específicos emblemáticos
  if (modalidade === "Leilão Público") {
    return `Leilão ${orgao}${numStr}: Venda de veículos conservados e sucatas`;
  }
  if (modalidade === "Chamada Pública" && orgao.includes("FAPEMIG")) {
    return `Chamada Pública ${orgao}: Fomento à pesquisa científica e bolsas de inovação`;
  }
  if (modalidade === "Inexigibilidade de Licitação" && orgao.includes("EPAMIG")) {
    return `Inexigibilidade ${orgao}: Manutenção mecânica para a frota oficial da pesquisa`;
  }
  if (modalidade === "Pregão Eletrônico" && orgao.includes("SEF")) {
    return `Pregão Eletrônico ${orgao}: Modernização do Data Center da Fazenda Estadual`;
  }
  if (modalidade === "Inabilitação de Credenciamento") {
    return `Credenciamento ${orgao}: Publicada inabilitação de prestadores de serviços`;
  }
  if (modalidade === "Resultado de Credenciamento") {
    return `Credenciamento ${orgao}${numStr}: Divulgado resultado de entidades habilitadas`;
  }
  if (modalidade === "Chamamento Público" && orgao.includes("SEJUSP")) {
    return `Chamamento Público ${orgao}: Abertas inscrições para projetos de segurança cidadã`;
  }
  if (modalidade === "Retificação de Pregão Eletrônico") {
    return `Retificação ${orgao}${numStr}: Alteração no edital de pregão eletrônico`;
  }

  // Padrão geral: [Modalidade] [Órgão]: [Ação/Objeto curto]
  let acao = objeto;
  if (acao.length > 55) {
    acao = acao.slice(0, 52) + "…";
  }
  const base = `${modalidade} ${orgao}${numStr}: ${acao}`;
  return base.length > 105 ? `${base.slice(0, 102)}…` : base;
}

/**
 * Processa o trecho bruto e gera todos os metadados prontos para o portal.
 */
export function processarTrechoEdital(
  trecho: string,
  secao: string | null,
  dataPublicacao: string,
  fonteNome: string,
  fonteUrl: string
): MetadadosEdital {
  const orgao = identificarOrgao(trecho, secao);
  const modalidade = identificarModalidade(trecho);
  const numero = extrairNumero(trecho);
  const objeto = sintetizarObjeto(trecho, modalidade, orgao);
  const condicoesEPrazos = sintetizarCondicoes(trecho, modalidade);
  const tituloJornalistico = gerarTituloJornalistico(orgao, modalidade, numero, objeto);

  const local = [secao, "Diário Oficial"].filter(Boolean).join(" · ");
  const subtitulo = `${modalidade} publicada por ${orgao} em ${dataPublicacao}. Objeto: ${objeto}.`;
  const resumo = `${orgao} publicou ${modalidade}${numero ? ` nº ${numero}` : ""} no ${fonteNome} de ${dataPublicacao}. Foco: ${objeto}.`;

  const paragrafos = [
    `O Diário Oficial Eletrônico de Minas Gerais veiculou publicação referente a **${modalidade}** promovida por **${orgao}**${numero ? ` sob o registro oficial nº ${numero}` : ""}. O ato foi formalizado na edição de ${dataPublicacao}${secao ? ` (${secao})` : ""}.`,
    `**Objeto do certame:** ${objeto}. A publicação visa assegurar publicidade, transparência e oportunidade de participação em contratos, parcerias e credenciamentos de interesse do Estado.`,
    `**Prazos, requisitos e condições:** ${condicoesEPrazos}`,
    `**Como consultar o edital na íntegra:** O texto completo, com todas as regras, anexos, minutas e prazos recursais, pode ser acessado diretamente na [edição digital do Diário Oficial](${fonteUrl}) ou pelo portal eletrônico de contratações públicas de Minas Gerais. Participantes e entidades civis interessadas devem acompanhar diariamente o diário oficial para conferir eventuais retificações ou comunicados complementares.`,
    `*Declaração de Transparência:* Síntese estruturada pelo radar de editais do Controle Popular a partir de dados públicos oficiais do Diário Oficial de Minas Gerais, sob a metodologia de monitoramento cívico do ONSA (Observatório Nacional Socioambiental).*`
  ];

  return {
    orgao,
    modalidade,
    numero,
    objeto,
    condicoesEPrazos,
    tituloJornalistico,
    subtitulo,
    resumo,
    paragrafos,
  };
}
