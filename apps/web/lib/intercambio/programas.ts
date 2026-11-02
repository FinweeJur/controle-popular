/**
 * @file apps/web/lib/intercambio/programas.ts
 * @description Catálogo oficial de editais e programas de intercâmbio e mobilidade acadêmica.
 *
 * Programas cobertos:
 *   - Erasmus+ (União Europeia)
 *   - PILA (Programa de Intercâmbio Acadêmico Latino-Americano)
 *   - AUGM / Escala Estudantil e Escala Docente (Associação Grupo Montevidéu)
 *   - Brafitec (Engenharias Brasil-França / CAPES)
 *   - Brafagri (Ciências Agrárias Brasil-França / CAPES)
 *   - Bolsas Santander Universidades (Ibero-Americanas, Top España, Santander Open Academy)
 *   - Programa MARCA (Mercosul Educacional / ARCUSUL)
 *   - DAAD (Serviço Alemão de Intercâmbio Acadêmico)
 *   - Fulbright Brasil (Comissão para o Intercâmbio Educacional EUA-Brasil)
 *   - Fundación Carolina (Bolsas de Mestrado e Doutorado na Espanha)
 *   - CAPES PrInt (Programa Institucional de Internacionalização)
 */

import type { EditalProgramaIntercambio } from "./tipos";

export const PROGRAMAS_INTERCAMBIO: EditalProgramaIntercambio[] = [
  {
    id: "erasmus-plus",
    sigla: "Erasmus+",
    nome: "Programa Erasmus+ de Mobilidade Internacional",
    orgaoFinanciador: "Comissão Europeia / União Europeia",
    regiaoDestino: "Europa",
    paisesParticipantes: [
      "Alemanha", "França", "Espanha", "Portugal", "Itália",
      "Holanda", "Bélgica", "Suécia", "Polônia", "Irlanda"
    ],
    publicoAlvo: "Estudantes de Graduação, Mestrado, Doutorado e Docentes/Pesquisadores",
    beneficios: "Bolsa de manutenção mensal integral, auxílio-deslocamento (passagens aéreas), seguro-saúde e isenção total de taxas acadêmicas na universidade europeia de destino.",
    valorBolsaAprox: "850€ a 1.200€ por mês + passagens aéreas",
    requisitos: [
      "Estar regularmente matriculado na universidade de origem",
      "Ter integralizado no mínimo 20% a 40% da carga horária curricular",
      "Coeficiente de Rendimento Acadêmico (CRA) igual ou superior a 7,0",
      "Comprovação de proficiência na língua do país ou em inglês (nível B1/B2)"
    ],
    formaInscricao: "Edital institucional periódico publicado pela Diretoria de Relações Internacionais (DRI) da universidade de origem.",
    cicloChamadas: "Semestral e Anual (Geralmente chamadas abertas em Setembro/Outubro e Fevereiro/Março)",
    urlOficial: "https://erasmus-plus.ec.europa.eu/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "pila-latam",
    sigla: "PILA",
    nome: "Programa de Intercâmbio Acadêmico Latino-Americano",
    orgaoFinanciador: "ASCUN (Colômbia), ANUIES (México), CIN (Argentina) e ANDIFES (Brasil)",
    regiaoDestino: "América Latina e Caribe",
    paisesParticipantes: [
      "Argentina", "Colômbia", "México", "Chile", "Uruguai",
      "Paraguai", "Cuba", "Nicarágua", "Brasil"
    ],
    publicoAlvo: "Estudantes de Graduação, Pós-Graduação Stricto Sensu, Docentes e Gestores Universitários",
    beneficios: "Hospedagem e alimentação gratuitas providas e custeadas pela universidade anfitriã durante todo o semestre letivo, além de isenção de mensalidades.",
    valorBolsaAprox: "Alojamento e alimentação integrais garantidos na universidade receptora",
    requisitos: [
      "Ter concluído no mínimo 40% e no máximo 85% dos créditos do curso",
      "Bom rendimento acadêmico comprovado por histórico oficial",
      "Plano de estudos aprovado pelo colegiado de curso para aproveitamento integral de créditos",
      "Maioridade civil (18 anos completos)"
    ],
    formaInscricao: "Candidatura via edital interno da assessoria internacional da universidade e homologação na plataforma PILA.",
    cicloChamadas: "Semestral (Chamadas para o 1º semestre entre Agosto e Outubro; para o 2º semestre entre Março e Maio)",
    urlOficial: "https://www.programapila.lat/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "augm-escala",
    sigla: "AUGM / Escala",
    nome: "Programa Escala Estudantil e Escala Docente da AUGM",
    orgaoFinanciador: "Associação de Universidades Grupo Montevidéu (AUGM)",
    regiaoDestino: "América do Sul (Cone Sul)",
    paisesParticipantes: [
      "Argentina", "Brasil", "Bolívia", "Chile", "Paraguai", "Uruguai"
    ],
    publicoAlvo: "Estudantes de Graduação, Pós-Graduação e Professores de Universidades Públicas Associadas",
    beneficios: "A universidade de acolhimento financia alojamento e alimentação durante o período acadêmico. A universidade de origem financia as passagens e seguro internacional.",
    valorBolsaAprox: "Custeio integral de alimentação, moradia e passagens entre universidades membros",
    requisitos: [
      "Ser estudante regular de universidade pública membro da AUGM (ex.: UFMG, UFRGS, USP, UFRJ, UFSC, UNESP, UNICAMP...)",
      "Ter cursado ao menos 50% dos créditos da graduação",
      "Idade inferior a 30 anos no momento da viagem (para modalidade graduação)",
      "Apresentar plano de equivalência de disciplinas"
    ],
    formaInscricao: "Seleção direta pelo DRI da universidade membro através de edital semestral unificado da AUGM.",
    cicloChamadas: "Semestral (Dois processos seletivos por ano para embarque no semestre letivo seguinte)",
    urlOficial: "https://grupomontevideo.org/escala-estudantil/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "brafitec-capes",
    sigla: "Brafitec",
    nome: "Programa Brasil-França Engenharia e Tecnologia (CAPES / CDEFI)",
    orgaoFinanciador: "CAPES (Brasil) e Conferência dos Diretores das Escolas Francesas de Engenheiros (CDEFI)",
    regiaoDestino: "França",
    paisesParticipantes: ["França", "Brasil"],
    publicoAlvo: "Estudantes de Cursos de Engenharia participantes de projetos de parceria institucional",
    beneficios: "Bolsa mensal em euros concedida pela CAPES, auxílio-deslocamento, auxílio-instalação, seguro-saúde internacional e isenção total de matrícula nas Grandes Écoles de engenharia francesas com opção de Duplo Diploma.",
    valorBolsaAprox: "870€/mês + auxílio instalação de 1.300€ + passagem aérea ida e volta",
    requisitos: [
      "Estar cursando entre o 5º e o 8º período de curso de Engenharia cadastrado no projeto",
      "Excelente desempenho acadêmico com aprovação em todas as disciplinas do ciclo básico",
      "Proficiência mínima comprovada em língua francesa (nível B1 ou B2 em teste oficial DELF/TCF)",
      "Compromisso de retorno ao Brasil para conclusão do curso"
    ],
    formaInscricao: "Edital específico da coordenação do projeto Brafitec na universidade brasileira vinculada.",
    cicloChamadas: "Anual (Seleção no segundo semestre para início do ano acadêmico francês em Setembro)",
    urlOficial: "https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/bolsas/bolsas-e-auxilios-internacionais/encontros-e-programas-de-cooperacao-estudantil/programa-capes-brafitec",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "brafagri-capes",
    sigla: "Brafagri",
    nome: "Programa Brasil-França Agricultura e Alimentos (CAPES / DGER)",
    orgaoFinanciador: "CAPES e Direção Geral de Ensino e Pesquisa do Ministério da Agricultura da França (DGER)",
    regiaoDestino: "França",
    paisesParticipantes: ["França", "Brasil"],
    publicoAlvo: "Estudantes de Agronomia, Veterinária, Zootecnia, Engenharia Florestal e Engenharia de Alimentos",
    beneficios: "Bolsa mensal em euros pela CAPES, seguro-saúde, passagens aéreas e formação prática e teórica em institutos agronômicos franceses de excelência (AgroParisTech, Montpellier SupAgro, etc.).",
    valorBolsaAprox: "870€/mês + auxílio instalação + passagens aéreas",
    requisitos: [
      "Estar matriculado em curso de ciências agrárias ou alimentos participante de projeto ativo",
      "Ter completado no mínimo 40% da grade curricular",
      "Comprovar proficiência em francês (B1/B2)",
      "Coeficiente de rendimento acadêmico destacado"
    ],
    formaInscricao: "Inscrição pelo colegiado de curso e secretaria de relações internacionais da universidade.",
    cicloChamadas: "Anual (Chamadas abertas geralmente entre Março e Maio para embarque em Setembro)",
    urlOficial: "https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/bolsas/bolsas-e-auxilios-internacionais/encontros-e-programas-de-cooperacao-estudantil/programa-capes-brafagri",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "santander-universidades",
    sigla: "Santander",
    nome: "Programa de Bolsas Santander Open Academy / Ibero-Americanas e Top España",
    orgaoFinanciador: "Banco Santander / Santander Universidades",
    regiaoDestino: "Ibero-América e Espanha",
    paisesParticipantes: [
      "Espanha", "Portugal", "México", "Chile", "Argentina", "Colômbia", "Peru"
    ],
    publicoAlvo: "Estudantes de Graduação e Pós-Graduação de universidades conveniadas",
    beneficios: "Aporte financeiro direto para custeio de transporte, alojamento e alimentação durante o semestre no exterior, ou bolsas para cursos de imersão de 3 semanas na Universidade de Salamanca (Top España).",
    valorBolsaAprox: "3.000€ a 4.000€ (bolsa única de mobilidade) ou curso completo com hospedagem (Top España)",
    requisitos: [
      "Estar regularmente matriculado em universidade brasileira conveniada ao Santander Universidades",
      "Inscrição obrigatória prévia na plataforma Santander Open Academy",
      "Atender aos critérios socioeconômicos e acadêmicos do edital interno do DRI de sua instituição"
    ],
    formaInscricao: "Cadastro simultâneo na plataforma Santander Open Academy e submissão de documentos no edital da universidade.",
    cicloChamadas: "Anual (Geralmente no primeiro semestre de cada ano letivo)",
    urlOficial: "https://app.santanderopenacademy.com/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "marca-mercosul",
    sigla: "MARCA",
    nome: "Programa de Mobilidade Acadêmica Regional para Cursos Acreditados (MARCA)",
    orgaoFinanciador: "Setor Educacional do Mercosul (SEM)",
    regiaoDestino: "América do Sul (Mercosul)",
    paisesParticipantes: ["Argentina", "Brasil", "Paraguai", "Uruguai", "Bolívia", "Chile"],
    publicoAlvo: "Estudantes de graduação em cursos acreditados pelo Sistema ARCUSUL (Medicina, Engenharias, Agronomia, etc.)",
    beneficios: "Bolsa de apoio financeiro para despesas pessoais, alojamento e alimentação na instituição receptora, além de garantia de pleno reconhecimento e equivalência de créditos.",
    valorBolsaAprox: "Manutenção e alojamento gratuitos durante 1 semestre acadêmico",
    requisitos: [
      "Ser aluno de curso de graduação com selo de acreditação ARCUSUL",
      "Ter integralizado no mínimo 50% da carga horária",
      "Excelente histórico acadêmico sem reprovações pendentes"
    ],
    formaInscricao: "Edital regular lançado pelo setor de relações internacionais de cada universidade credenciada.",
    cicloChamadas: "Semestral",
    urlOficial: "http://programamarca.siu.edu.ar/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "fundacion-carolina",
    sigla: "Fundación Carolina",
    nome: "Programa de Bolsas de Pós-Graduação e Pesquisa da Fundación Carolina",
    orgaoFinanciador: "Governo da Espanha / Fundación Carolina",
    regiaoDestino: "Espanha",
    paisesParticipantes: ["Espanha", "Todos os países da Comunidade Ibero-Americana"],
    publicoAlvo: "Graduados, Mestrandos, Doutorandos e Docentes Universitários",
    beneficios: "Passagens aéreas de ida e volta, cobertura de 50% a 100% da matrícula do mestrado/doutorado, subsídio mensal de alojamento e seguro-médico internacional.",
    valorBolsaAprox: "Isenção integral de propina/matrícula + 750€ a 1.200€/mês + passagens aéreas",
    requisitos: [
      "Diploma de graduação reconhecido",
      "Candidatura direta na plataforma oficial da fundação",
      "Currículo acadêmico e profissional compatível com o curso pleiteado",
      "Não possuir residência legal na Espanha"
    ],
    formaInscricao: "Inscrição online e individual pelo portal da Fundación Carolina.",
    cicloChamadas: "Anual (Inscrições abertas entre Janeiro e Março de cada ano)",
    urlOficial: "https://www.fundacioncarolina.es/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "daad-alemanha",
    sigla: "DAAD",
    nome: "Programas de Bolsas de Estudo e Pesquisa do DAAD (Alemanha)",
    orgaoFinanciador: "Serviço Alemão de Intercâmbio Acadêmico (DAAD)",
    regiaoDestino: "Alemanha",
    paisesParticipantes: ["Alemanha", "Brasil"],
    publicoAlvo: "Estudantes de Graduação (Winterkurs e estágios), Mestrado, Doutorado Sanduíche e Pós-Doutorado",
    beneficios: "Bolsa de estudos mensal (934€ para mestrado, 1.300€ para doutorado), seguro-saúde internacional, auxílio-deslocamento e curso preparatório de língua alemã.",
    valorBolsaAprox: "934€ a 1.300€ por mês + passagens aéreas e seguro",
    requisitos: [
      "Estar matriculado em universidade reconhecida",
      "Proficiência em inglês ou alemão conforme o curso escolhido",
      "Carta de aceite ou contato com professor anfitrião na Alemanha (para pós-graduação/pesquisa)"
    ],
    formaInscricao: "Portal DAAD Portal com apoio da assessoria internacional da instituição de origem.",
    cicloChamadas: "Anual e Semestral (prazos específicos por modalidade)",
    urlOficial: "https://www.daad.org.br/",
    dataVerificacao: "2026-11-02"
  },
  {
    id: "fulbright-brasil",
    sigla: "Fulbright",
    nome: "Comissão Fulbright de Cooperação Educacional e Cultural Brasil-EUA",
    orgaoFinanciador: "Governo dos Estados Unidos (Departamento de Estado) e Governo do Brasil",
    regiaoDestino: "Estados Unidos",
    paisesParticipantes: ["Estados Unidos", "Brasil"],
    publicoAlvo: "Doutorandos (Doutorado Sanduíche), Professores, Pesquisadores e Recém-Graduados (FLTA)",
    beneficios: "Bolsa mensal em dólares, taxas acadêmicas pagas, passagem aérea internacional, plano de saúde e concessão de visto oficial J-1.",
    valorBolsaAprox: "US$ 1.500 a US$ 3.000 por mês + passagens aéreas e taxas",
    requisitos: [
      "Nacionalidade brasileira sem cidadania americana",
      "Proficiência em inglês comprovada por exame oficial (TOEFL ou IELTS)",
      "Para doutorado sanduíche: estar com projeto aprovado e ter anuência do orientador no Brasil e nos EUA"
    ],
    formaInscricao: "Inscrição direta pelo portal da Comissão Fulbright Brasil.",
    cicloChamadas: "Anual (Editais publicados entre Maio e Agosto para embarque no ano seguinte)",
    urlOficial: "https://fulbright.org.br/",
    dataVerificacao: "2026-11-02"
  }
];
