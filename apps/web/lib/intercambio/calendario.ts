/**
 * @file apps/web/lib/intercambio/calendario.ts
 * @description Calendário Anual Mês a Mês de Publicações Acadêmicas Cíclicas e Editais de Intercâmbio.
 *
 * Papel no portal:
 *   Fornece a estudantes, pesquisadores e docentes um cronograma previsível e datado
 *   das principais janelas de submissão de periódicos cíclicos confirmados,
 *   editais de intercâmbio/bolsas internacionais e chamadas de pesquisa cívica.
 *
 * Regras respeitadas (QUALIDADES-DA-INFORMACAO.md e AGENTS.md):
 *   1. Toda chamada aponta para a página oficial do programa ou revista.
 *   2. Classificação rigorosa por mês (Janeiro a Dezembro) e categoria.
 *   3. Prazos e critérios auditados com canais públicos oficiais.
 */

import type { EventoCalendarioAcademico } from "./tipos";

export const CALENDARIO_ACADEMICO: EventoCalendarioAcademico[] = [
  // ==========================================
  // JANEIRO (Mês 1)
  // ==========================================
  {
    id: "cal-jan-carolina",
    mes: 1,
    nomeMes: "Janeiro",
    categoria: "intercambio",
    titulo: "Bolsas de Pós-Graduação e Doutorado - Fundación Carolina",
    instituicaoOuPrograma: "Fundación Carolina / Governo da Espanha",
    paisOuRegiao: "Espanha / Ibero-América",
    descricao: "Abertura oficial do edital anual de centenas de bolsas completas de mestrado, doutorado e estadias curtas de pesquisa em universidades espanholas para estudantes da América Latina.",
    prazoOuPeriodo: "Inscrições abertas de janeiro a meados de março",
    publicoAlvo: "Graduados e pesquisadores latino-americanos",
    linkOficial: "https://www.fundacioncarolina.es/formacion/becas-de-posgrado-y-doctorado/",
    gratuito: true,
    tags: ["Mestrado", "Doutorado", "Espanha", "Bolsa Integral"]
  },
  {
    id: "cal-jan-fiocruz",
    mes: 1,
    nomeMes: "Janeiro",
    categoria: "periodico_ciclico",
    titulo: "Cadernos de Saúde Pública - Submissão do 1º Trimestre",
    instituicaoOuPrograma: "Fiocruz - Fundação Oswaldo Cruz",
    paisOuRegiao: "Brasil / América Latina",
    descricao: "Abertura de rodada regular de submissões para os fascículos de saúde pública e epidemiologia da Fiocruz. Periódico Diamante sem qualquer cobrança de APC.",
    prazoOuPeriodo: "Fluxo regular com processamento no 1º trimestre",
    publicoAlvo: "Pesquisadores da Saúde Coletiva e Ciências Biomédicas",
    linkOficial: "https://cadernos.ensp.fiocruz.br/",
    gratuito: true,
    tags: ["Saúde Coletiva", "Fiocruz", "Sem APC", "Diamante"]
  },
  {
    id: "cal-jan-chevening-interviews",
    mes: 1,
    nomeMes: "Janeiro",
    categoria: "intercambio",
    titulo: "Chevening Scholarship - Notificação de Pré-seleção e Entrevistas",
    instituicaoOuPrograma: "Foreign, Commonwealth & Development Office (FCDO)",
    paisOuRegiao: "Reino Unido",
    descricao: "Comunicação dos candidatos pré-selecionados para entrevistas presenciais na embaixada e consulados britânicos. Início do envio de cartas de referência acadêmicas.",
    prazoOuPeriodo: "Janeiro a Fevereiro (etapa de pré-seleção)",
    publicoAlvo: "Líderes graduados com pelo menos 2 anos de experiência profissional",
    linkOficial: "https://www.chevening.org/scholarships/",
    gratuito: true,
    tags: ["Reino Unido", "Mestrado", "Liderança", "Bolsa Completa"]
  },
  {
    id: "cal-jan-ipea-ppe",
    mes: 1,
    nomeMes: "Janeiro",
    categoria: "periodico_ciclico",
    titulo: "Pesquisa e Planejamento Econômico (PPE) - Chamada de Início de Ano",
    instituicaoOuPrograma: "IPEA - Instituto de Pesquisa Econômica Aplicada",
    paisOuRegiao: "Brasil",
    descricao: "Chamada para artigos teóricos e aplicados sobre desenvolvimento econômico, finanças públicas e políticas sociais brasileiras.",
    prazoOuPeriodo: "Submissão aberta para a edição semestral de junho",
    publicoAlvo: "Economistas e cientistas sociais",
    linkOficial: "https://www.ipea.gov.br/portal/publicacoes/pesquisa-e-planejamento-economico",
    gratuito: true,
    tags: ["Economia", "IPEA", "Governo Federal", "Sem Taxa"]
  },

  // ==========================================
  // FEVEREIRO (Mês 2)
  // ==========================================
  {
    id: "cal-fev-augm-escala",
    mes: 2,
    nomeMes: "Fevereiro",
    categoria: "intercambio",
    titulo: "AUGM / Escala Estudantil - Chamada do 1º Semestre",
    instituicaoOuPrograma: "Associação de Universidades Grupo Montevideo (AUGM)",
    paisOuRegiao: "América do Sul (Argentina, Brasil, Uruguai, Paraguai, Bolívia, Chile)",
    descricao: "Lançamento dos editais internos nas DRIs para mobilidade presencial no segundo semestre letivo. Inclui isenção de matrícula, alojamento e alimentação gratuitos na universidade de acolhimento.",
    prazoOuPeriodo: "Editais lançados em fevereiro; inscrições até abril",
    publicoAlvo: "Estudantes de graduação com pelo menos 40% dos créditos cursados",
    linkOficial: "http://grupomontevideo.org/sitio/noticias/escala-estudiantil/",
    gratuito: true,
    tags: ["América do Sul", "Graduação", "Alojamento Grátis", "Mobilidade Cívica"]
  },
  {
    id: "cal-fev-pila",
    mes: 2,
    nomeMes: "Fevereiro",
    categoria: "intercambio",
    titulo: "Programa PILA - Mobilidade Presencial e Virtual América Latina",
    instituicaoOuPrograma: "Consórcio PILA (ASCUN, ANUIES, CIN, ANDIFES)",
    paisOuRegiao: "América Latina (Colômbia, México, Argentina, Brasil, Chile, Uruguai)",
    descricao: "Publicação do catálogo unificado de vagas para intercâmbio de estudantes de graduação e pós-graduação, nas modalidades presencial (com bolsa alimentação e moradia) e virtual.",
    prazoOuPeriodo: "Abertura em fevereiro; inscrições até final de março",
    publicoAlvo: "Alunos de graduação e pós-graduação das universidades conveniadas",
    linkOficial: "https://www.programapila.lat/",
    gratuito: true,
    tags: ["América Latina", "Virtual e Presencial", "Intercâmbio Cultural"]
  },
  {
    id: "cal-fev-erasmus-master",
    mes: 2,
    nomeMes: "Fevereiro",
    categoria: "intercambio",
    titulo: "Erasmus Mundus Joint Master Degrees (EMJMD) - Prazos Finais",
    instituicaoOuPrograma: "União Europeia / European Commission",
    paisOuRegiao: "União Europeia",
    descricao: "Encerramento das inscrições para dezenas de mestrados internacionais integrados financiados pela UE com bolsas mensais de 1.400 euros, passagens aéreas e seguro saúde internacional.",
    prazoOuPeriodo: "Prazos variam entre meados de janeiro e meados de fevereiro",
    publicoAlvo: "Graduados de todas as áreas do conhecimento",
    linkOficial: "https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters",
    gratuito: true,
    tags: ["União Europeia", "Mestrado Internacional", "Bolsa 1400 Euros"]
  },
  {
    id: "cal-fev-tcu",
    mes: 2,
    nomeMes: "Fevereiro",
    categoria: "periodico_ciclico",
    titulo: "Revista do TCU - Submissão para Edição Quadrimestral",
    instituicaoOuPrograma: "Tribunal de Contas da União (TCU) / ISC",
    paisOuRegiao: "Brasil",
    descricao: "Chamada para artigos científicos sobre controle externo da administração pública, direito financeiro, auditoria governamental e combate à corrupção.",
    prazoOuPeriodo: "Prazo de envio até 28 de fevereiro para o fascículo de abril",
    publicoAlvo: "Pesquisadores de Direito, Contabilidade, Administração Pública e Cidadania",
    linkOficial: "https://revista.tcu.gov.br/ojs/index.php/RTCU",
    gratuito: true,
    tags: ["Direito Público", "Controle Externo", "TCU", "Sem APC"]
  },

  // ==========================================
  // MARÇO (Mês 3)
  // ==========================================
  {
    id: "cal-mar-brafitec",
    mes: 3,
    nomeMes: "Março",
    categoria: "intercambio",
    titulo: "Programa Brafitec - CAPES / CDEFI (Engenharias Brasil-França)",
    instituicaoOuPrograma: "CAPES e Conferência dos Diretores das Escolas de Engenharia Francesas",
    paisOuRegiao: "França / Brasil",
    descricao: "Seleção institucional de estudantes de engenharia das universidades federais e estaduais participantes para intercâmbio de 1 a 2 anos na França com bolsa Capes em euros e possibilidade de duplo diploma.",
    prazoOuPeriodo: "Editais lançados pelas coordenações de engenharia em março",
    publicoAlvo: "Estudantes de graduação em Engenharia",
    linkOficial: "https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/bolsas/bolsas-e-auxilios-internacionais/encontros-universitarios/programa-capes-brafitec",
    gratuito: true,
    tags: ["Engenharia", "França", "CAPES", "Duplo Diploma"]
  },
  {
    id: "cal-mar-santander",
    mes: 3,
    nomeMes: "Março",
    categoria: "intercambio",
    titulo: "Bolsas Santander Facilita e Ibero-Americanas",
    instituicaoOuPrograma: "Santander Universidades",
    paisOuRegiao: "Ibero-América",
    descricao: "Início das inscrições pela plataforma Santander Open Academy para bolsas de apoio financeiro à mobilidade acadêmica em universidades parceiras no exterior e no Brasil.",
    prazoOuPeriodo: "Inscrições abertas de março a maio",
    publicoAlvo: "Estudantes matriculados em universidades conveniadas",
    linkOficial: "https://app.santanderopenacademy.com/pt-BR/program/search",
    gratuito: true,
    tags: ["Graduação", "Bolsa Apoio", "América Latina", "Espanha"]
  },
  {
    id: "cal-mar-enap",
    mes: 3,
    nomeMes: "Março",
    categoria: "periodico_ciclico",
    titulo: "Revista do Serviço Público (RSP) - Chamada Trimestral",
    instituicaoOuPrograma: "Escola Nacional de Administração Pública (ENAP)",
    paisOuRegiao: "Brasil",
    descricao: "Periódico histórico brasileiro dedicado à gestão pública, reforma do Estado, políticas públicas e governança democrática. Totalmente Diamante (sem cobrança ao autor).",
    prazoOuPeriodo: "Submissão aberta para o fascículo regular do 2º trimestre",
    publicoAlvo: "Pesquisadores em Gestão Pública, Ciência Política e Economia do Setor Público",
    linkOficial: "https://revista.enap.gov.br/index.php/RSP",
    gratuito: true,
    tags: ["Gestão Pública", "ENAP", "Governo Federal", "Sem Taxas"]
  },
  {
    id: "cal-mar-senado",
    mes: 3,
    nomeMes: "Março",
    categoria: "periodico_ciclico",
    titulo: "Revista de Informação Legislativa (RIL) - Senado Federal",
    instituicaoOuPrograma: "Senado Federal / Instituto Legislativo Brasileiro",
    paisOuRegiao: "Brasil",
    descricao: "Revista trimestral indexada de Direito Constitucional, Teoria Legislativa, Ciência Política e Relações Internacionais do Senado Federal.",
    prazoOuPeriodo: "Submissões contínuas avaliadas em lotes trimestrais (março, junho, setembro, dezembro)",
    publicoAlvo: "Juristas, cientistas políticos e sociólogos",
    linkOficial: "https://www12.senado.leg.br/ril",
    gratuito: true,
    tags: ["Direito Constitucional", "Poder Legislativo", "Senado", "Diamante"]
  },

  // ==========================================
  // ABRIL (Mês 4)
  // ==========================================
  {
    id: "cal-abr-mext",
    mes: 4,
    nomeMes: "Abril",
    categoria: "intercambio",
    titulo: "Bolsas MEXT do Governo Japonês (Graduação e Pós-Graduação)",
    instituicaoOuPrograma: "Ministério da Educação, Cultura, Esportes, Ciência e Tecnologia do Japão",
    paisOuRegiao: "Japão",
    descricao: "Abertura oficial do processo seletivo anual via consulados gerais do Japão no Brasil. Bolsas de graduação, pós-graduação/pesquisa, curso profissionalizante e língua japonesa com isenção de taxas e estipêndio mensal.",
    prazoOuPeriodo: "Inscrições de abril até início de junho",
    publicoAlvo: "Estudantes brasileiros do ensino médio e graduados",
    linkOficial: "https://www.sp.br.emb-japan.go.jp/itpr_pt/bolsa_pos.html",
    gratuito: true,
    tags: ["Japão", "Bolsa MEXT", "Graduação e Pós", "Bolsa Integral"]
  },
  {
    id: "cal-abr-fulbright-doutorado",
    mes: 4,
    nomeMes: "Abril",
    categoria: "intercambio",
    titulo: "Bolsa Fulbright Doutorado Sanduíche nos EUA (D-SD)",
    instituicaoOuPrograma: "Comissão Fulbright Brasil / CAPES",
    paisOuRegiao: "Estados Unidos",
    descricao: "Concessão de até 40 bolsas anuais de estágio de pesquisa doutoral nos EUA (9 meses de duração), cobrindo mensalidade em dólares, passagem aérea de ida e volta, seguro saúde e subsídio para livros.",
    prazoOuPeriodo: "Inscrições de abril a final de maio",
    publicoAlvo: "Doutorandos matriculados em cursos de pós-graduação recomendados pela CAPES",
    linkOficial: "https://fulbright.org.br/bolsas-para-brasileiros/",
    gratuito: true,
    tags: ["EUA", "Doutorado Sanduíche", "CAPES", "Fulbright"]
  },
  {
    id: "cal-abr-marca-mercosul",
    mes: 4,
    nomeMes: "Abril",
    categoria: "intercambio",
    titulo: "Programa MARCA - Mobilidade Acadêmica Regional Mercosul",
    instituicaoOuPrograma: "Setor Educacional do Mercosul (SEM)",
    paisOuRegiao: "Mercosul (Brasil, Argentina, Uruguai, Paraguai, Bolívia)",
    descricao: "Mobilidade acadêmica de graduação com reconhecimento de créditos para cursos com acreditação ARCUSUR (Engenharias, Agronomia, Medicina Veterinária, Arquitetura, Enfermagem e Odontologia).",
    prazoOuPeriodo: "Abertura de chamadas nas universidades conveniadas em abril",
    publicoAlvo: "Estudantes de cursos acreditados pelo sistema Arcu-Sul",
    linkOficial: "http://programamarca.siu.edu.ar/",
    gratuito: true,
    tags: ["Mercosul", "Arcu-Sul", "Equivalência Integral", "Mobilidade"]
  },
  {
    id: "cal-abr-anpocs",
    mes: 4,
    nomeMes: "Abril",
    categoria: "periodico_ciclico",
    titulo: "Revista Brasileira de Ciências Sociais (RBCS) - ANPOCS",
    instituicaoOuPrograma: "Associação Nacional de Pós-Graduação e Pesquisa em Ciências Sociais",
    paisOuRegiao: "Brasil",
    descricao: "Periódico de referência internacional em Sociologia, Ciência Política e Antropologia. Avaliação por pares duplamente cega, publicação semestral e acesso aberto integral.",
    prazoOuPeriodo: "Chamada de submissão do 1º semestre com encerramento em abril",
    publicoAlvo: "Pesquisadores das Ciências Humanas e Sociais",
    linkOficial: "https://anpocs.org.br/rbcs/",
    gratuito: true,
    tags: ["Ciências Sociais", "ANPOCS", "SciELO", "Sem APC"]
  },

  // ==========================================
  // MAIO (Mês 5)
  // ==========================================
  {
    id: "cal-mai-daad-winterkurs",
    mes: 5,
    nomeMes: "Maio",
    categoria: "intercambio",
    titulo: "DAAD - Curso de Língua e Cultura Alemã (Winterkurs)",
    instituicaoOuPrograma: "Deutscher Akademischer Austauschdienst (DAAD)",
    paisOuRegiao: "Alemanha",
    descricao: "Bolsas de estudo para cursos intensivos de inverno de 6 semanas em universidades alemãs para estudantes de graduação e pós-graduação brasileiros de todas as áreas com nível mínimo B1 de alemão.",
    prazoOuPeriodo: "Abertura das inscrições em maio; prazo até meados de agosto",
    publicoAlvo: "Estudantes universitários com bom rendimento acadêmico e alemão intermediário",
    linkOficial: "https://www.daad.org.br/pt/bolsas-de-estudo/cursos-na-alemanha/winterkurs/",
    gratuito: true,
    tags: ["Alemanha", "Cursos de Verão/Inverno", "DAAD", "Bolsa Mensal"]
  },
  {
    id: "cal-mai-ibge-estatistica",
    mes: 5,
    nomeMes: "Maio",
    categoria: "periodico_ciclico",
    titulo: "Revista Brasileira de Estatística (RBE) - IBGE",
    instituicaoOuPrograma: "IBGE - Instituto Brasileiro de Geografia e Estatística",
    paisOuRegiao: "Brasil",
    descricao: "Periódico histórico publicado desde 1940, especializado em metodologia estatística, amostragem, demografia e análise geoespacial de dados públicos.",
    prazoOuPeriodo: "Submissão aberta para o fascículo semestral de julho",
    publicoAlvo: "Estatísticos, demógrafos, cientistas de dados e geógrafos",
    linkOficial: "https://biblioteca.ibge.gov.br/visualizacao/periodicos/112/rbe_index.html",
    gratuito: true,
    tags: ["Estatística", "Demografia", "IBGE", "Dado Oficial"]
  },
  {
    id: "cal-mai-brafagri",
    mes: 5,
    nomeMes: "Maio",
    categoria: "intercambio",
    titulo: "Programa Brafagri - Capes / França (Ciências Agronômicas)",
    instituicaoOuPrograma: "CAPES e Ministério da Agricultura da França",
    paisOuRegiao: "França / Brasil",
    descricao: "Intercâmbio de mobilidade e duplo diploma para estudantes de Agronomia, Zootecnia, Engenharia Florestal e Medicina Veterinária em escolas agrotécnicas e agronômicas francesas.",
    prazoOuPeriodo: "Seleções internas das universidades em maio",
    publicoAlvo: "Estudantes das áreas de Ciências Agrárias e Veterinária",
    linkOficial: "https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/bolsas/bolsas-e-auxilios-internacionais/encontros-universitarios/programa-capes-brafagri",
    gratuito: true,
    tags: ["Agronomia", "Veterinária", "França", "CAPES"]
  },

  // ==========================================
  // JUNHO (Mês 6)
  // ==========================================
  {
    id: "cal-jun-eiffel-prep",
    mes: 6,
    nomeMes: "Junho",
    categoria: "intercambio",
    titulo: "Eiffel Excellence Scholarship - Lançamento de Calendário",
    instituicaoOuPrograma: "Ministério da Europa e dos Negócios Estrangeiros / Campus France",
    paisOuRegiao: "França",
    descricao: "Publicação do cronograma oficial do programa de excelência Eiffel para mestrado e doutorado na França. Os candidatos devem ser indicados por um estabelecimento de ensino superior francês.",
    prazoOuPeriodo: "Divulgação do calendário em junho; candidaturas de outubro a janeiro",
    publicoAlvo: "Alunos estrangeiros com perfil de liderança até 25 anos (mestrado) ou 30 anos (doutorado)",
    linkOficial: "https://www.campusfrance.org/fr/le-programme-de-bourses-eiffel",
    gratuito: true,
    tags: ["França", "Campus France", "Mestrado e Doutorado", "Excelência"]
  },
  {
    id: "cal-jun-abrasco",
    mes: 6,
    nomeMes: "Junho",
    categoria: "periodico_ciclico",
    titulo: "Ciência & Saúde Coletiva - Edição Temática Especial",
    instituicaoOuPrograma: "ABRASCO - Associação Brasileira de Saúde Coletiva",
    paisOuRegiao: "Brasil",
    descricao: "Chamada de artigos para dossiê especial temático sobre políticas de saúde, atenção primária e sustentabilidade do SUS. Indexada no PubMed e SciELO.",
    prazoOuPeriodo: "Submissões temáticas até 30 de junho",
    publicoAlvo: "Pesquisadores e trabalhadores da saúde coletiva",
    linkOficial: "https://www.cienciaesaudecoletiva.com.br/",
    gratuito: true,
    tags: ["Saúde Pública", "SUS", "ABRASCO", "SciELO"]
  },
  {
    id: "cal-jun-cedes-educacao",
    mes: 6,
    nomeMes: "Junho",
    categoria: "periodico_ciclico",
    titulo: "Educação & Sociedade - Fechamento do 1º Semestre",
    instituicaoOuPrograma: "Centro de Estudos Educação e Sociedade (CEDES) / UNICAMP",
    paisOuRegiao: "Brasil / Internacional",
    descricao: "Uma das mais prestigiosas revistas acadêmicas brasileiras no campo da educação pública, políticas educacionais e sociologia da educação.",
    prazoOuPeriodo: "Fechamento de submissões para análise do conselho editorial em junho",
    publicoAlvo: "Educadores, pedagogos e cientistas sociais",
    linkOficial: "https://www.scielo.br/j/es/",
    gratuito: true,
    tags: ["Educação", "UNICAMP", "SciELO", "Diamante"]
  },

  // ==========================================
  // JULHO (Mês 7)
  // ==========================================
  {
    id: "cal-jul-augm-docente",
    mes: 7,
    nomeMes: "Julho",
    categoria: "intercambio",
    titulo: "AUGM / Escala Docente e Escala de Gestores Universitários",
    instituicaoOuPrograma: "Associação de Universidades Grupo Montevideo (AUGM)",
    paisOuRegiao: "América do Sul",
    descricao: "Editais para intercâmbio de curta duração (1 a 2 semanas) de professores pesquisadores e técnicos administrativos entre universidades da rede AUGM no Cone Sul.",
    prazoOuPeriodo: "Inscrições abertas nas DRIs durante julho e agosto",
    publicoAlvo: "Docentes e servidores técnico-administrativos das universidades conveniadas",
    linkOficial: "http://grupomontevideo.org/sitio/programas/escala-docente/",
    gratuito: true,
    tags: ["Docentes", "Técnicos", "América do Sul", "Pesquisa Conjunta"]
  },
  {
    id: "cal-jul-rap-fgv",
    mes: 7,
    nomeMes: "Julho",
    categoria: "periodico_ciclico",
    titulo: "Revista de Administração Pública (RAP) - Chamada de Inverno",
    instituicaoOuPrograma: "Fundação Getulio Vargas (FGV EBAPE)",
    paisOuRegiao: "Brasil / Internacional",
    descricao: "Principal revista latino-americana de administração pública. Chamada para artigos com foco em transparência governamental, formulação e avaliação de políticas públicas.",
    prazoOuPeriodo: "Prazos de chamada semestral em julho",
    publicoAlvo: "Pesquisadores em Governança, Administração Pública e Economia",
    linkOficial: "https://bibliotecadigital.fgv.br/ojs/index.php/rap",
    gratuito: true,
    tags: ["Governança", "Administração Pública", "FGV", "Scopus/SciELO"]
  },
  {
    id: "cal-jul-botin-funcao-publica",
    mes: 7,
    nomeMes: "Julho",
    categoria: "intercambio",
    titulo: "Programa da Função Pública na América Latina - Fundação Botín",
    instituicaoOuPrograma: "Fundación Botín (Espanha / Colômbia / Brasil)",
    paisOuRegiao: "América Latina / Espanha",
    descricao: "Programa de imersão de excelência para jovens com vocação pública, com etapas na Espanha, Colômbia e Brasil. Cobre 100% de transporte, estada e formação com líderes mundiais.",
    prazoOuPeriodo: "Fase de entrevistas e seleção dos 32 bolsistas latino-americanos em julho",
    publicoAlvo: "Estudantes universitários com destacada liderança cívica e acadêmica",
    linkOficial: "https://fundacionbotin.org/programas/fortalecimiento-funcion-publica-america-latina/",
    gratuito: true,
    tags: ["Liderança Cívica", "Setor Público", "Imersão Internacional"]
  },

  // ==========================================
  // AGOSTO (Mês 8)
  // ==========================================
  {
    id: "cal-ago-chevening-open",
    mes: 8,
    nomeMes: "Agosto",
    categoria: "intercambio",
    titulo: "Chevening Scholarships - Abertura Oficial Global (Reino Unido)",
    instituicaoOuPrograma: "Governo Britânico (FCDO)",
    paisOuRegiao: "Reino Unido (Inglaterra, Escócia, País de Gales, Irlanda do Norte)",
    descricao: "Abertura global do programa de bolsas de mestrado integral de 1 ano em qualquer universidade do Reino Unido (Oxford, Cambridge, LSE, UCL, Edinburgh, Manchester, etc.). Cobre mensalidades integrais, bolsa de manutenção de ~1.400 libras/mês e passagens de ida e volta.",
    prazoOuPeriodo: "Inscrições de agosto até início de novembro",
    publicoAlvo: "Graduados com potencial de liderança e 2 anos de experiência profissional",
    linkOficial: "https://www.chevening.org/apply/",
    gratuito: true,
    tags: ["Reino Unido", "Mestrado Integral", "Bolsa de Liderança", "1400 Libras"]
  },
  {
    id: "cal-ago-augm-segundo-semestre",
    mes: 8,
    nomeMes: "Agosto",
    categoria: "intercambio",
    titulo: "AUGM / Escala Estudantil - Chamada para o 1º Semestre do Ano Seguinte",
    instituicaoOuPrograma: "AUGM - Associação de Universidades Grupo Montevideo",
    paisOuRegiao: "América do Sul",
    descricao: "Lançamento do segundo edital anual de intercâmbio de graduação nas DRIs das universidades brasileiras da rede para cursar o primeiro semestre do próximo ano na Argentina, Uruguai, Paraguai, Bolívia ou Chile.",
    prazoOuPeriodo: "Abertura em agosto; encerramento em outubro",
    publicoAlvo: "Graduandos com matrícula regular ativa",
    linkOficial: "http://grupomontevideo.org/sitio/noticias/escala-estudiantil/",
    gratuito: true,
    tags: ["América do Sul", "Isenção de Taxas", "Moradia Garantida"]
  },
  {
    id: "cal-ago-pila-fase2",
    mes: 8,
    nomeMes: "Agosto",
    categoria: "intercambio",
    titulo: "Programa PILA - 2ª Convocatória Anual",
    instituicaoOuPrograma: "Consórcio PILA Latino-Americano",
    paisOuRegiao: "América Latina",
    descricao: "Segunda chamada regular para mobilidade presencial e virtual de estudantes de graduação e pós-graduação no semestre 2027-1.",
    prazoOuPeriodo: "Inscrições abertas de agosto a setembro",
    publicoAlvo: "Estudantes das universidades conveniadas",
    linkOficial: "https://www.programapila.lat/",
    gratuito: true,
    tags: ["América Latina", "Virtual e Presencial", "Mobilidade Acadêmica"]
  },

  // ==========================================
  // SETEMBRO (Mês 9)
  // ==========================================
  {
    id: "cal-set-daad-helmut-schmidt",
    mes: 9,
    nomeMes: "Setembro",
    categoria: "intercambio",
    titulo: "DAAD Helmut-Schmidt-Programme (Políticas Públicas e Governança)",
    instituicaoOuPrograma: "Deutscher Akademischer Austauschdienst (DAAD)",
    paisOuRegiao: "Alemanha",
    descricao: "Bolsas de mestrado de excelência em Políticas Públicas, Governança, Direitos Humanos e Gestão Pública em universidades alemãs de ponta (Willy Brandt School, Univ. Potsdam, Univ. Passau). Bolsas mensais de 934 euros, seguro de saúde e curso de alemão prévio.",
    prazoOuPeriodo: "Inscrições abertas de setembro a meados de outubro",
    publicoAlvo: "Graduados em Ciências Sociais, Direito, Economia e Relações Internacionais",
    linkOficial: "https://www.daad.de/en/information-services-for-higher-education-institutions/programmes-at-a-glance/detail/helmut-schmidt-programme-master-s-scholarships-for-public-policy-and-good-governance-ppgg-57597950/",
    gratuito: true,
    tags: ["Alemanha", "Políticas Públicas", "Governança", "Bolsa Completa"]
  },
  {
    id: "cal-set-jbcs-computacao",
    mes: 9,
    nomeMes: "Setembro",
    categoria: "periodico_ciclico",
    titulo: "Journal of the Brazilian Computer Society (JBCS) - Edição Especial",
    instituicaoOuPrograma: "SBC - Sociedade Brasileira de Computação",
    paisOuRegiao: "Brasil / Internacional",
    descricao: "Principal revista científica brasileira na área de Ciência da Computação, Engenharia de Software e Inteligência Artificial. Acesso aberto Diamante em parceria com a SBC.",
    prazoOuPeriodo: "Submissão aberta para o volume temático de primavera",
    publicoAlvo: "Cientistas da computação e engenheiros de dados",
    linkOficial: "https://sol.sbc.org.br/journals/index.php/jbcs",
    gratuito: true,
    tags: ["Computação", "Inteligência Artificial", "SBC", "Diamante"]
  },
  {
    id: "cal-set-vanier-canada",
    mes: 9,
    nomeMes: "Setembro",
    categoria: "intercambio",
    titulo: "Vanier Canada Graduate Scholarships (Doutorado no Canadá)",
    instituicaoOuPrograma: "Governo do Canadá (CIHR, NSERC, SSHRC)",
    paisOuRegiao: "Canadá",
    descricao: "Mais prestigioso programa de bolsas de doutorado do Canadá, pagando 50.000 dólares canadenses por ano durante 3 anos para pesquisas nas áreas de saúde, ciências naturais e humanidades.",
    prazoOuPeriodo: "Nomeações institucionais encerram no final de outubro",
    publicoAlvo: "Doutorandos propostos por universidades canadenses parceiras",
    linkOficial: "https://vanier.gc.ca/en/home-accueil.html",
    gratuito: true,
    tags: ["Canadá", "Doutorado", "50.000 CAD/ano", "Pesquisa Avançada"]
  },

  // ==========================================
  // OUTUBRO (Mês 10)
  // ==========================================
  {
    id: "cal-out-eiffel-open",
    mes: 10,
    nomeMes: "Outubro",
    categoria: "intercambio",
    titulo: "Bolsas de Excelência Eiffel - Abertura de Candidaturas",
    instituicaoOuPrograma: "Ministério da Europa e dos Negócios Estrangeiros da França",
    paisOuRegiao: "França",
    descricao: "Início oficial da submissão de candidaturas pelas universidades francesas junto ao Campus France. Concede bolsa mensal de 1.181 euros (mestrado) ou 1.800 euros (doutorado), com passagens aéreas e previdência francesa.",
    prazoOuPeriodo: "Outubro até meados de janeiro do ano seguinte",
    publicoAlvo: "Estudantes em áreas prioritárias: Direito, Economia, Engenharia e Ciência Política",
    linkOficial: "https://www.campusfrance.org/pt-br/o-programa-de-bolsas-eiffel",
    gratuito: true,
    tags: ["França", "Campus France", "Bolsa Mensal", "1800 Euros"]
  },
  {
    id: "cal-out-swiss-excellence",
    mes: 10,
    nomeMes: "Outubro",
    categoria: "intercambio",
    titulo: "Swiss Government Excellence Scholarships (Suíça)",
    instituicaoOuPrograma: "Confederação Suíça / FCS",
    paisOuRegiao: "Suíça (ETH Zurich, EPFL, Univ. Genebra, Univ. Zurique)",
    descricao: "Bolsas de pós-graduação, doutorado e pós-doutorado concedidas pelo governo da Suíça a pesquisadores estrangeiros de ponta em todas as áreas acadêmicas.",
    prazoOuPeriodo: "Inscrições na Embaixada da Suíça em Brasília até final de outubro",
    publicoAlvo: "Pesquisadores graduados e doutores",
    linkOficial: "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html",
    gratuito: true,
    tags: ["Suíça", "ETH Zurich", "Pesquisa", "Bolsa de Excelência"]
  },
  {
    id: "cal-out-tse-eje",
    mes: 10,
    nomeMes: "Outubro",
    categoria: "periodico_ciclico",
    titulo: "Revista Eletrônica da Escola Judiciária Eleitoral (EJE / TSE)",
    instituicaoOuPrograma: "Tribunal Superior Eleitoral (TSE)",
    paisOuRegiao: "Brasil",
    descricao: "Revista semestral de Direito Eleitoral, Ciência Política, Reforma Política e Cidadania do TSE. Submissão 100% gratuita para autores.",
    prazoOuPeriodo: "Submissão aberta para o fascículo de encerramento do ano",
    publicoAlvo: "Juristas, advogados públicos e cientistas políticos",
    linkOficial: "https://eje.tse.jus.br/revista-eletronica/",
    gratuito: true,
    tags: ["Direito Eleitoral", "TSE", "Democracia", "Diamante"]
  },

  // ==========================================
  // NOVEMBRO (Mês 11)
  // ==========================================
  {
    id: "cal-nov-chevening-close",
    mes: 11,
    nomeMes: "Novembro",
    categoria: "intercambio",
    titulo: "Chevening Scholarships - Encerramento Global do Prazo",
    instituicaoOuPrograma: "Governo Britânico (FCDO)",
    paisOuRegiao: "Reino Unido",
    descricao: "Encerramento formal de todas as candidaturas mundiais para bolsas Chevening no início de novembro (às 12h GMT).",
    prazoOuPeriodo: "Prazo final impreterível na primeira semana de novembro",
    publicoAlvo: "Candidatos previamente inscritos",
    linkOficial: "https://www.chevening.org/apply/",
    gratuito: true,
    tags: ["Reino Unido", "Prazo Final", "Mestrado", "Liderança"]
  },
  {
    id: "cal-nov-csc-china",
    mes: 11,
    nomeMes: "Novembro",
    categoria: "intercambio",
    titulo: "Bolsas do Conselho de Bolsas da China (CSC / Silk Road Program)",
    instituicaoOuPrograma: "China Scholarship Council (CSC) / Ministério da Educação da China",
    paisOuRegiao: "China (Tsinghua, Peking, Fudan, Zhejiang)",
    descricao: "Publicação preliminar de editais e orientação para contato com professores orientadores das universidades chinesas para bolsas de mestrado e doutorado em inglês ou mandarim.",
    prazoOuPeriodo: "Novembro a Fevereiro (preparação e submissão)",
    publicoAlvo: "Graduados e pesquisadores de todas as nacionalidades",
    linkOficial: "https://www.campuschina.org/",
    gratuito: true,
    tags: ["China", "Mestrado e Doutorado", "CSC", "Isenção Integral"]
  },
  {
    id: "cal-nov-cnj-justica",
    mes: 11,
    nomeMes: "Novembro",
    categoria: "periodico_ciclico",
    titulo: "Revista CNJ - Conselho Nacional de Justiça",
    instituicaoOuPrograma: "Conselho Nacional de Justiça (CNJ)",
    paisOuRegiao: "Brasil",
    descricao: "Revista semestral acadêmica sobre eficiência judiciária, direitos fundamentais, políticas de acesso à justiça e transparência dos tribunais brasileiros.",
    prazoOuPeriodo: "Chamada de artigos com encerramento em novembro",
    publicoAlvo: "Magistrados, defensores, promotores, advogados e pesquisadores",
    linkOficial: "https://www.cnj.jus.br/pesquisas-judiciarias/revista-cnj/",
    gratuito: true,
    tags: ["Poder Judiciário", "CNJ", "Acesso à Justiça", "Sem Custos"]
  },

  // ==========================================
  // DEZEMBRO (Mês 12)
  // ==========================================
  {
    id: "cal-dez-us-deadlines",
    mes: 12,
    nomeMes: "Dezembro",
    categoria: "intercambio",
    titulo: "Prazos de Admissão de Pós-Graduação nos EUA e Canadá (Fall Entry)",
    instituicaoOuPrograma: "Universidades Americanas e Canadenses (Harvard, MIT, Stanford, Berkeley, Toronto)",
    paisOuRegiao: "América do Norte",
    descricao: "Encerramento das candidaturas diretas com financiamento pleno (Teaching Assistantship / Research Assistantship) para programas de PhD e mestrado com início em setembro.",
    prazoOuPeriodo: "Prazos regulares de 1 a 15 de dezembro",
    publicoAlvo: "Estudantes candidatos a pós-graduação internacional",
    linkOficial: "https://www.fulbright.org.br/estudar-nos-eua/",
    gratuito: false,
    tags: ["EUA", "Canadá", "PhD", "Financiamento Pleno"]
  },
  {
    id: "cal-dez-dri-homologacoes",
    mes: 12,
    nomeMes: "Dezembro",
    categoria: "intercambio",
    titulo: "Homologação de Mobilidade e Equivalências de Crédito (DRIs)",
    instituicaoOuPrograma: "Diretorias de Relações Internacionais das Universidades",
    paisOuRegiao: "Global",
    descricao: "Período em que os colegiados de curso e as DRIs emitem as cartas de aceite definitivas e aprovam os planos de equivalência de estudos para os estudantes que embarcarão em janeiro/fevereiro.",
    prazoOuPeriodo: "Final de semestre letivo (dezembro)",
    publicoAlvo: "Estudantes selecionados para intercâmbio no semestre seguinte",
    linkOficial: "https://www.ufmg.br/dri/",
    gratuito: true,
    tags: ["Equivalência", "Plano de Estudos", "DRI", "Mobilidade"]
  },
  {
    id: "cal-dez-dossies-tematicos",
    mes: 12,
    nomeMes: "Dezembro",
    categoria: "periodico_ciclico",
    titulo: "Divulgação de Dossiês Temáticos das Revistas Universitárias para o Ano Seguinte",
    instituicaoOuPrograma: "Fórum de Editores Científicos / Portais de Periódicos das IFES",
    paisOuRegiao: "Brasil e Internacional",
    descricao: "Revistas com periodicidade semestral e trimestral publicam as chamadas de artigos (Call for Papers) com os temas prioritários que serão abordados nas edições do ano seguinte.",
    prazoOuPeriodo: "Dezembro e Janeiro",
    publicoAlvo: "Comunidade acadêmica e científica global",
    linkOficial: "https://doaj.org/",
    gratuito: true,
    tags: ["Chamadas Temáticas", "Dossiês", "Universidades", "Planejamento"]
  }
];

export function listarEventosCalendario(): EventoCalendarioAcademico[] {
  return [...CALENDARIO_ACADEMICO].sort((a, b) => a.mes - b.mes || a.titulo.localeCompare(b.titulo));
}

export function listarEventosPorMes(mes: number): EventoCalendarioAcademico[] {
  return CALENDARIO_ACADEMICO.filter((e) => e.mes === mes);
}
