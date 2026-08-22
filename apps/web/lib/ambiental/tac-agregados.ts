import {
  COBERTURA_TAC_PROJETOS,
  TAC_POR_ANO,
  TAC_POR_PROJETO,
  type ContratoTacAmbiental,
} from "./tac-projetos";

/**
 * Segunda camada de agregados do "Painel TACs Final" (Power BI público da
 * SEMAD/MG) — cruza a entidade `projetos` (já em `tac-projetos.ts`) com a
 * entidade `empresas` do MESMO arquivo bruto (`etl/betim/dados/tacs-mineradoras.json`)
 * para responder três coisas que `tac-projetos.ts` sozinho não responde:
 * quem EXECUTA cada contrato (Mineradora ou Estado), quanto já foi
 * TRANSFERIDO, e qual é o valor TOTAL de cada termo — não só o plano de
 * execução por projeto. ARQUIVO GERADO EM 2026-08-21 — não editar os
 * literais à mão; regenerar cruzando o JSON bruto de novo se
 * `tac-projetos.ts` for recapturado.
 *
 * ═══ "VALOR TOTAL TERMOS" NÃO É "PREVISTO" — SÃO DUAS ENTIDADES DIFERENTES ═══
 *
 * `COBERTURA_TAC_PROJETOS.previstoTotal` (R$ 307.120.704,20) soma a coluna
 * `Valor Previsto` da entidade `projetos` — o PLANO DE EXECUÇÃO ano a ano dos
 * projetos concretos. `COBERTURA_TAC_ACORDOS.valorTotalTermos` (R$
 * 426.602.622,79) soma `Valor Total correto` da entidade `empresas` (69
 * linhas: Empresa × Ano, SEM a dimensão Status) — o valor TOTAL de cada
 * termo, dividido entre Estado e MP. É maior porque é outra pergunta: o
 * tamanho do acordo assinado, não quanto já foi alocado a um projeto
 * específico no plano 2022–2029. O painel da SEMAD publica os dois números
 * lado a lado sem reconciliá-los, e este código também não reconcilia —
 * declara os dois, com a fonte de cada um.
 *
 * Atenção: `tac-empresas.ts` (17 linhas, "captura isolada" de uma consulta
 * de totais) é uma CAPTURA DIFERENTE e MENOR desta mesma entidade — não bate
 * com o painel oficial porque é parcial (ver docstring daquele arquivo). Os
 * totais abaixo somam as 69 linhas do JSON bruto (Empresa × Ano), que é o
 * que fecha, centavo a centavo, com os quatro números que o painel público
 * mostra: R$ 426.602.622,79 / R$ 341.282.098,23 / R$ 85.320.524,56 / 15
 * mineradoras — conferido em 21/08/2026.
 *
 * ═══ A RESSALVA DOS CANCELADOS, NOMEADA ═══
 *
 * O painel oficial da SEMAD exclui os 3 projetos com `status: "Cancelado"`
 * do total publicado; este portal inclui (o dinheiro previsto para um
 * projeto cancelado ainda é dinheiro que a mineradora deveria ter alocado, e
 * esconder a linha some com o fato de que ela foi cancelada). A diferença é
 * **R$ 891.896,45**, idêntica em Previsto e em Transferido — e não é
 * coincidência dividida entre os 3: dos 3 contratos cancelados, 2
 * ("Instalação de ar condicionado no CMRR" e "Relatórios de Qualidade do
 * Ar", ambos Vale S.A.) têm previsto e transferido zerados em todos os
 * anos; a diferença inteira vem de UM único contrato — "Projeto Marilac -
 * Nacip Raydan" (Mosaic Fertilizantes P&K Ltda.), previsto = transferido =
 * R$ 891.896,45 na base bruta.
 *
 * ═══ EXECUÇÃO E TRANSFERIDO — DE ONDE VÊM, E O JOIN QUE OS TRAZ AQUI ═══
 *
 * A entidade `projetos` do JSON bruto tem 11 colunas; `tac-projetos.ts` só
 * extraiu 8 (não captura `Valor Transferido` nem `Execução`, porque a página
 * que o consome hoje não precisava delas). `TAC_EXECUCAO_TRANSFERIDO` é o
 * complemento: as 2 colunas que faltam, uma linha por contrato (chave
 * `projeto|mineradora`), para não duplicar aqui as 8 colunas que
 * `tac-projetos.ts` já carrega (evita quase dobrar o payload do Worker por
 * repetir texto de `relato`).
 *
 * Medido no cruzamento com as 848 linhas ano-a-ano do JSON bruto: `Execução`
 * e `Órgão/Instituição` são CONSTANTES dentro de cada contrato nos 8 anos —
 * 0 das 106 combinações varia. `Status` varia em exatamente 1 dos 106
 * ("Plataforma de Monitoramento Geoespacial para o SISEMA" ×
 * "Minerita - Minérios Itaúna Ltda." — "Em execução" só em 2025, "Não
 * Iniciado" nos outros 7 anos); `tac-projetos.ts` já resolveu essa
 * ambiguidade na extração dele, e este arquivo REUSA o `status` que
 * `TAC_POR_PROJETO` já traz, sem redecidir.
 *
 * As 106 chaves de `TAC_POR_PROJETO` bateram 1:1 com as 106 chaves da
 * entidade bruta — zero órfã dos dois lados. Se uma regeneração futura de
 * `tac-projetos.ts` mudar essa contagem, `TAC_ACORDOS_PROJETOS` (abaixo)
 * cai no valor-padrão (`execucao: "Mineradora"`, `transferido: 0`) para as
 * chaves sem match em vez de quebrar — e o teste deste arquivo trava esse
 * caso em vez de deixar passar em silêncio.
 *
 * ═══ POR QUE `TAC_STATUS_POR_ORGAO` É LITERAL, NÃO COMPUTADO DE `TAC_ACORDOS_PROJETOS` ═══
 *
 * `page.tsx` (servidor) precisa do total por órgão×status para o gráfico
 * empilhado, mas NÃO precisa — e não deve importar — o array de 106
 * contratos inteiro (`TAC_POR_PROJETO`, 88 KiB) só para somar 9 linhas. Se
 * `TAC_STATUS_POR_ORGAO` fosse `TAC_ACORDOS_PROJETOS.reduce(...)`, importar
 * só o agregado ainda arrastaria o array de 106 contratos para dentro do
 * bundle do Worker via dependência transitiva de módulo — a mesma classe de
 * erro que já produziu um arquivo de 14,6 MB neste repo (ver
 * `docs/ARQUITETURA.md`). Por isso o literal abaixo é uma FOTOGRAFIA
 * independente, gerada uma vez (21/08/2026) contando `TAC_ACORDOS_PROJETOS`
 * por fora — o teste deste arquivo confere que as duas contagens continuam
 * batendo, mas em produção `page.tsx` importa só os 9 números.
 *
 * ═══ AS TRÊS RESSALVAS QUE VIAJAM COM O DADO ═══
 *
 * Mesmo painel de `tac-projetos.ts`, `tac-contas.ts` e `tac-empresas.ts`:
 * (1) `refreshEnabled: false`, última carga 2026-05-05 — não é dado ao vivo;
 * (2) publicado de uma "My workspace" pessoal, não de workspace
 * institucional; (3) o painel oficial exclui cancelados do total, este
 * portal inclui (ver acima). As três ficam em `COBERTURA_TAC_ACORDOS`.
 */

export interface AcordoTacContrato extends ContratoTacAmbiental {
  /** Quem executa o projeto, segundo a fonte. Constante por contrato — ver docstring. */
  execucao: "Mineradora" | "Estado";
  /** Em reais. Soma de `Valor Transferido` em todos os anos do contrato. */
  transferido: number;
}

/**
 * Complemento de `TAC_POR_PROJETO`: só as 2 colunas que faltam lá, uma linha
 * por contrato (106 no total). NÃO é a fonte de projeto/mineradora/órgão/
 * status/previsto/executado/relato — essas continuam vindo de
 * `tac-projetos.ts`, uma única vez.
 */
const TAC_EXECUCAO_TRANSFERIDO: readonly {
  projeto: string;
  mineradora: string;
  execucao: "Mineradora" | "Estado";
  transferido: number;
}[] = [{"projeto":"Modernização completa do Parque Computacional do Sisema","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Renovação da frota de veículos do IEF","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Análise dos Cadastros Ambientais Rurais do Estado de Minas Gerais","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Projeto de Gestão da Cobertura Vegetal Nativa e Plantada","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Renovação Frota Sisema Sede e Regionais (Semad, Feam e Igam)","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Serviços de infraestrutura e suporte às regionais do Sisema","mineradora":"Vale S.A.","execucao":"Estado","transferido":400000},{"projeto":"Adequação e Modernização do SLA à modernização da regularização ambiental","mineradora":"CSN Mineração","execucao":"Mineradora","transferido":0},{"projeto":"Sistema de Gestão de Bacias Hidrográficas de Minas Gerais","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Melhoria e ampliação da internet nas unidades regionais do IEF","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Inteligência Artificial no Licenciamento Ambiental – integração SLA e implementação de ferramentas","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Contratação da subscrição de licença de software de gestão de dados de monitoramento ambiental","mineradora":"Samarco Mineração S.A.","execucao":"Estado","transferido":0},{"projeto":"Extinção do Passivo de licenciamento - Fase 2","mineradora":"Alcoa Alumínio S.A","execucao":"Mineradora","transferido":0},{"projeto":"Sistema de Gestão do Conhecimento e Apoio Estratégico do IEF (SGCAE/IEF)","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Auditoria/Consultoria Técnica em Desenvolvimento de sistemas","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Projeto Gestão de bens apreendidos (estruturação e segurança)","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Plano Estadual de Resíduos Sólidos","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Fortalecimento da fiscalização - Implementação da Frota de Veículos da fiscalização da Secretaria de Estado de meio Ambiente","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Projeto Assessoramento em engenharia","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Renovação da Frota do Policiamento de Meio Ambiente da Polícia Militar de Minas Gerais","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Expansão e evolução das plataformas SeloVerde-MG e CAR 2.0","mineradora":"ArcelorMittal Brasil S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Estruturação da Sala de Situação de Gestão de Barragens e Recuperação de Áreas de Mineração e Indústria","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Estudo Hidrogeológico Sinclinal Moeda e Serra do Curral","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Modernização do Sistema de Regularização de Recursos Hídricos de Minas Gerais","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Extinção do Passivo de licenciamento - Fase 1","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":3423650},{"projeto":"Projeto Regional Sisema ZM - Reforma/construção","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Plataforma de Monitoramento Geoespacial para o SISEMA","mineradora":"Minerita - Minérios Itaúna Ltda.","execucao":"Mineradora","transferido":0},{"projeto":"Programa de Padronização estrutural e de Gestão Administrativa nas Unidades Regionais de Regularização Ambiental da Fundação Estadual do Meio Ambiente","mineradora":"Minérios Nacional S/A","execucao":"Mineradora","transferido":0},{"projeto":"Melhorias estruturais para as unidades descentralizadas do IEF - Aquisições de bens para as regionais","mineradora":"Vale S.A.","execucao":"Estado","transferido":935742.2},{"projeto":"Extinção do Passivo de licenciamento - Fase 2","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Mineradora","transferido":0},{"projeto":"Adequação e Modernização do SLA à modernização da regularização ambiental","mineradora":"Minérios Nacional S/A","execucao":"Mineradora","transferido":0},{"projeto":"Modernização do Sistema de Regularização de Recursos Hídricos de Minas Gerais V.3 (Incorporação de melhorias no SOUT)","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Plano de otimização do processamento de autos de infração: contratação da MGS","mineradora":"Vale S.A.","execucao":"Estado","transferido":2000000},{"projeto":"Reforma da unidade Sisema Gameleira","mineradora":"Mineração Morro do Ipê","execucao":"Mineradora","transferido":0},{"projeto":"Melhoria no desenvolvimento dos trabalhos da fiscalização (EPIs e equipamentos)","mineradora":"CSN Mineração","execucao":"Mineradora","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Minérios Nacional S/A","execucao":"Estado","transferido":852000},{"projeto":"Sistema de Gestão de Barragens de Água (SGB)","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Mineradora","transferido":0},{"projeto":"Estudos de Regionalização de Vazões","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Reestruturação das Unidades Policiais e implementação do laboratório de lavagem de capitais no Departamento Estadual de Investigação de Crimes contra o Meio Ambiente/DEMA/PCMG","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Modernização das fiscalizações e vistorias com emprego de drones (aquisição de drones + capacitação)","mineradora":"Mineração Morro do Ipê","execucao":"Mineradora","transferido":0},{"projeto":"Contratação da subscrição de licença de software de gestão de dados de monitoramento ambiental","mineradora":"Herculano Mineração Ltda","execucao":"Estado","transferido":0},{"projeto":"Revisão dos Critérios de Outorga de Minas Gerais","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Melhoria no Desenvolvimento dos Trabalhos de Fiscalização e Vistorias – Aquisição de uniformes e equipamentos","mineradora":"Gerdau Açominas S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Aquisição centralizada cadeiras giratórias","mineradora":"Vale S.A.","execucao":"Estado","transferido":1166400},{"projeto":"Aquisição de cestas básicas para o Rio Grande do Sul","mineradora":"Mineração Morro do Ipê","execucao":"Mineradora","transferido":0},{"projeto":"Projeto Regional Sisema ZM - Reforma/construção","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Estado","transferido":0},{"projeto":"Unidades móveis para resgate de fauna nas URFBIOS","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Mineradora","transferido":0},{"projeto":"Melhorias estruturais para as unidades descentralizadas do IEF - Reforma UFRBio Mata (Ubá)","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Fortalecimento da fiscalização: Aquisição de 4 automóveis híbridos","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Modernização completa do Parque Computacional do Sisema - Fase 3","mineradora":"Safm Mineração Ltda","execucao":"Estado","transferido":0},{"projeto":"Projeto Marilac - Nacip Raydan","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Estado","transferido":891896.45},{"projeto":"Projeto URA NO Centro Bens Apreendidos e Auditório","mineradora":"Vale S.A.","execucao":"Estado","transferido":889714.49},{"projeto":"Projeto Assessoramento em engenharia","mineradora":"Alcoa Alumínio S.A","execucao":"Estado","transferido":0},{"projeto":"Projeto Assessoramento em engenharia","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Estado","transferido":0},{"projeto":"Melhoria e ampliação da internet nas unidades regionais do IEF","mineradora":"Mineração Morro do Ipê","execucao":"Estado","transferido":0},{"projeto":"Estruturação da Sala de Inteligência - Módulo de servidor Appliance Hiperconvergencia","mineradora":"Gerdau Açominas S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Continuidade do desenvolvimento do Sistema GAIA – Gestão de Autos de Infração Ambiental","mineradora":"Minérios Nacional S/A","execucao":"Mineradora","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"ArcelorMittal Brasil S.A.","execucao":"Estado","transferido":0},{"projeto":"Projeto URA LM - Estruturação Física","mineradora":"Vale S.A.","execucao":"Estado","transferido":658368.63},{"projeto":"Projeto URA SM - Estruturação Galpão bens apreendidos SM","mineradora":"Vale S.A.","execucao":"Estado","transferido":633204.87},{"projeto":"Projeto Assessoramento em engenharia","mineradora":"Samarco Mineração S.A.","execucao":"Estado","transferido":0},{"projeto":"Reestruturação dos Sítios Institucionais do Sisema através da Plataforma de Experiencia Digital DXP","mineradora":"Gerdau Açominas S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Modernização completa do Parque Computacional do Sisema - Fase 3","mineradora":"Nacional de Grafite Ltda.","execucao":"Estado","transferido":0},{"projeto":"Projeto URA ZM Reforma infraestrutura - Ampliação.Incorporação URFis Zona da Mata","mineradora":"Vale S.A.","execucao":"Estado","transferido":600000},{"projeto":"Melhoria e ampliação da internet nas unidades regionais do IEF","mineradora":"Minérios Nacional S/A","execucao":"Estado","transferido":0},{"projeto":"Potencialização das ações de Inteligência no Combate aos Crimes Ambientais - Comando de Policiamento de Meio Ambiente da Polícia Militar de Minas Gerais","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Gerdau Açominas S.A.","execucao":"Estado","transferido":566329.71},{"projeto":"Projeto URA TM Reforma infraestrutura - Demandas prioritárias","mineradora":"Vale S.A.","execucao":"Estado","transferido":555136.67},{"projeto":"Melhorias estruturais para as unidades descentralizadas do IEF - Reforma RA e URFBio Alto Paranaíba","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":527891.33},{"projeto":"Projeto URA ZM - Reforma infraestrutura","mineradora":"Vale S.A.","execucao":"Estado","transferido":513000},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Estado","transferido":250000},{"projeto":"Aquisição de Equipamentos - Estruturação da Atividade de Inteligência Ambiental","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Projeto URA TM Reforma infraestrutura - Fase 2","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Modernização da Plataforma de Visualização Geográfica (WebGIS) da IDE-Sisema","mineradora":"Samarco Mineração S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Modernização completa do Parque Computacional do Sisema - Fase 3","mineradora":"Minerita - Minérios Itaúna Ltda.","execucao":"Estado","transferido":0},{"projeto":"Modernização completa do Parque Computacional do Sisema - Fase 3","mineradora":"AMG Mineração","execucao":"Estado","transferido":0},{"projeto":"Projeto Regional Sisema ZM - Reforma/construção","mineradora":"ArcelorMittal Brasil S.A.","execucao":"Estado","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Mineração Morro do Ipê","execucao":"Estado","transferido":308560.69},{"projeto":"Implantação da sala de situação de combate ao desmatamento e carvão ilegais (aquisição de materiais e equipamentos + capacitações)","mineradora":"Minérios Nacional S/A","execucao":"Mineradora","transferido":0},{"projeto":"Projeto URA SM - Estruturação física Sede Regional SM","mineradora":"Vale S.A.","execucao":"Estado","transferido":259191.2},{"projeto":"Projeto URA ZM - Estruturação Física","mineradora":"Vale S.A.","execucao":"Estado","transferido":243480.39},{"projeto":"Infraestrutura SISFAI - Tablets","mineradora":"Itaminas Comércio de Minérios S/A","execucao":"Mineradora","transferido":0},{"projeto":"Potencialização das ações de Inteligência no Combate aos Crimes Ambientais - Estruturação da Atividade de Inteligência na PMMG","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Projeto Assessoramento em engenharia","mineradora":"CSN Mineração","execucao":"Estado","transferido":0},{"projeto":"Modernização completa do Parque Computacional do Sisema - Fase 3","mineradora":"CSN Mineração","execucao":"Estado","transferido":0},{"projeto":"Melhoria e ampliação da internet nas unidades regionais do IEF","mineradora":"Mosaic Fertilizantes P&K Ltda.","execucao":"Estado","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Samarco Mineração S.A.","execucao":"Estado","transferido":0},{"projeto":"Projeto URA ASF - Estruturação Física","mineradora":"Vale S.A.","execucao":"Estado","transferido":173626.64},{"projeto":"Projeto URA NO - Almoxarifado.ampliação energia","mineradora":"Vale S.A.","execucao":"Estado","transferido":167678.74},{"projeto":"Melhoria e ampliação da internet nas unidades regionais do IEF","mineradora":"Samarco Mineração S.A.","execucao":"Estado","transferido":0},{"projeto":"Estruturação da fiscalização da fauna doméstica","mineradora":"Gerdau Açominas S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Projeto de Segurança Parque Estadual Serra Verde: câmeras e alarme","mineradora":"CSN Mineração","execucao":"Mineradora","transferido":0},{"projeto":"Projeto URA JEQ - Estruturação Física","mineradora":"Vale S.A.","execucao":"Estado","transferido":117500},{"projeto":"Projeto Assessoramento em engenharia","mineradora":"Minérios Nacional S/A","execucao":"Estado","transferido":0},{"projeto":"Programa de Saneamento Rural - Implantação de tecnologias e estruturas (Fossas Septicas Biodigestoras)","mineradora":"Itaminas Comércio de Minérios S/A","execucao":"Estado","transferido":82610.1},{"projeto":"Projeto URA ZM - Projeto de Incêndio","mineradora":"Vale S.A.","execucao":"Estado","transferido":72760},{"projeto":"Estruturação física das unidades da Gameleira e CMRR","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Projeto URA TM - Estruturação Física","mineradora":"Vale S.A.","execucao":"Estado","transferido":64598.45},{"projeto":"Projeto URA TM - Estruturação do Galpão de Materiais Apreendidos da Supram Triângulo Mineiro","mineradora":"Vale S.A.","execucao":"Estado","transferido":0},{"projeto":"Projeto URA ZM - Reforma infraestrutura - Jardinagem","mineradora":"Vale S.A.","execucao":"Estado","transferido":48600},{"projeto":"Estruturação da Sala de Inteligência","mineradora":"Itaminas Comércio de Minérios S/A","execucao":"Mineradora","transferido":0},{"projeto":"Projeto URA NO - Estruturação Física","mineradora":"Vale S.A.","execucao":"Estado","transferido":28620.46},{"projeto":"Projeto URA NO - Instalação de sombrite e paisagismo do estacionamento, pergolado e canteiros","mineradora":"Vale S.A.","execucao":"Estado","transferido":26800},{"projeto":"Modernização completa do Parque Computacional do Sisema - Fase 3","mineradora":"Itaminas Comércio de Minérios S/A","execucao":"Estado","transferido":0},{"projeto":"Instalação de ar condicionado no CMRR","mineradora":"Vale S.A.","execucao":"Mineradora","transferido":0},{"projeto":"Relatórios de Qualidade do Ar","mineradora":"Vale S.A.","execucao":"Estado","transferido":0}];

const chave = (projeto: string, mineradora: string) => `${projeto}|${mineradora}`;
const MAPA_EXECUCAO_TRANSFERIDO = new Map(
  TAC_EXECUCAO_TRANSFERIDO.map((r) => [chave(r.projeto, r.mineradora), r]),
);

/**
 * `TAC_POR_PROJETO` (106 contratos, `tac-projetos.ts`) enriquecido com
 * `execucao` e `transferido`. Contrato sem par no complemento (só ocorreria
 * se `tac-projetos.ts` fosse recapturado sem regenerar este arquivo) cai em
 * `execucao: "Mineradora"` / `transferido: 0` — valor-padrão, não erro
 * silencioso: o teste deste arquivo trava se isso acontecer.
 */
export const TAC_ACORDOS_PROJETOS: AcordoTacContrato[] = TAC_POR_PROJETO.map((c) => {
  const extra = MAPA_EXECUCAO_TRANSFERIDO.get(chave(c.projeto, c.mineradora));
  return {
    ...c,
    execucao: extra?.execucao ?? "Mineradora",
    transferido: extra?.transferido ?? 0,
  };
});

/** Ordem narrativa (não alfabética) usada nos dois gráficos empilhados/por status. */
export const STATUS_ORDEM = ["Não Iniciado", "Em execução", "Concluído", "Cancelado"] as const;

export interface StatusPorOrgao {
  orgao: string;
  total: number;
  porStatus: Record<(typeof STATUS_ORDEM)[number], number>;
}

/**
 * Contratos (não projetos — ver `docs/FONTES.md`: `TAC_POR_STATUS` em
 * `tac-projetos.ts` conta 81 "projetos" com deduplicação diferente) por
 * órgão executor × status, ordenado do órgão com mais contratos para o com
 * menos. LITERAL, contado por fora de `TAC_ACORDOS_PROJETOS` em 21/08/2026 —
 * ver docstring do arquivo sobre por que não é `.reduce()` sobre o array de
 * 106 contratos. Soma 106, os 3 "Cancelado" batendo com `TAC_POR_STATUS`.
 */
export const TAC_STATUS_POR_ORGAO: StatusPorOrgao[] = [
  { orgao: "URAS", total: 23, porStatus: { "Não Iniciado": 1, "Em execução": 19, Concluído: 3, Cancelado: 0 } },
  { orgao: "IEF", total: 22, porStatus: { "Não Iniciado": 10, "Em execução": 11, Concluído: 1, Cancelado: 0 } },
  { orgao: "SUFIS", total: 19, porStatus: { "Não Iniciado": 1, "Em execução": 6, Concluído: 12, Cancelado: 0 } },
  { orgao: "SUTAF", total: 14, porStatus: { "Não Iniciado": 6, "Em execução": 6, Concluído: 1, Cancelado: 1 } },
  { orgao: "SUSAN", total: 9, porStatus: { "Não Iniciado": 0, "Em execução": 9, Concluído: 0, Cancelado: 0 } },
  { orgao: "IGAM", total: 8, porStatus: { "Não Iniciado": 2, "Em execução": 6, Concluído: 0, Cancelado: 0 } },
  { orgao: "FEAM", total: 6, porStatus: { "Não Iniciado": 0, "Em execução": 5, Concluído: 1, Cancelado: 0 } },
  { orgao: "SUGA", total: 4, porStatus: { "Não Iniciado": 0, "Em execução": 3, Concluído: 0, Cancelado: 1 } },
  { orgao: "SEINFRA", total: 1, porStatus: { "Não Iniciado": 0, "Em execução": 0, Concluído: 0, Cancelado: 1 } },
];

/**
 * `Valor Transferido` por ano, somando as 848 linhas ano-a-ano da entidade
 * `projetos` — COM os 3 contratos cancelados (mesma convenção de
 * `TAC_POR_ANO`, que também soma tudo). 8 linhas, 2022–2029.
 */
const TAC_TRANSFERIDO_POR_ANO: readonly { ano: number; transferido: number }[] = [
  { ano: 2022, transferido: 0 },
  { ano: 2023, transferido: 1974550 },
  { ano: 2024, transferido: 10709177.49 },
  { ano: 2025, transferido: 3773633.53 },
  { ano: 2026, transferido: 0 },
  { ano: 2027, transferido: 0 },
  { ano: 2028, transferido: 0 },
  { ano: 2029, transferido: 0 },
];

export interface AnoAcordo {
  ano: number;
  previsto: number;
  executado: number;
  transferido: number;
}

/** `TAC_POR_ANO` (previsto/executado) + a coluna Transferido que faltava. */
export const TAC_ANO_ACORDOS: AnoAcordo[] = TAC_POR_ANO.map((a) => ({
  ...a,
  transferido: TAC_TRANSFERIDO_POR_ANO.find((t) => t.ano === a.ano)?.transferido ?? 0,
}));

const DIFERENCA_CANCELADOS = 891896.45;

export const COBERTURA_TAC_ACORDOS = {
  /** Soma de `Valor Total correto` da entidade `empresas` (69 linhas) — bate com o painel oficial. */
  valorTotalTermos: 426602622.79,
  valorTotalEstado: 341282098.23,
  valorTotalMp: 85320524.56,
  mineradoras: 15,
  /** Mesma soma de `COBERTURA_TAC_PROJETOS.executadoTotal` — cancelados não têm executado. */
  executadoTotal: COBERTURA_TAC_PROJETOS.executadoTotal,
  /** Com os 3 contratos "Cancelado" — o que esta página publica. */
  previstoComCancelados: COBERTURA_TAC_PROJETOS.previstoTotal,
  /** Sem os cancelados — o número que o painel oficial da SEMAD mostra. */
  previstoSemCancelados: COBERTURA_TAC_PROJETOS.previstoTotal - DIFERENCA_CANCELADOS,
  transferidoComCancelados: 16457361.02,
  transferidoSemCancelados: 16457361.02 - DIFERENCA_CANCELADOS,
  /** Idêntica em Previsto e Transferido — inteira do "Projeto Marilac - Nacip Raydan". Ver docstring. */
  diferencaCancelados: DIFERENCA_CANCELADOS,
  dadoCongeladoEm: "2026-05-05",
  ressalvaCongelamento:
    "O painel declara refreshEnabled=false; o dado está congelado em 2026-05-05 e NÃO reflete a situação atual dos TACs.",
  workspaceDeOrigem: "My workspace",
  ressalvaWorkspace:
    "O relatório foi publicado de uma 'My workspace' pessoal, não de workspace institucional — depende de uma conta individual, sem governança de área.",
  ressalvaCancelados:
    "O painel oficial da SEMAD exclui os projetos marcados como 'Cancelado' do total publicado; esta página inclui — a diferença é R$ 891.896,45, tanto em Previsto quanto em Transferido, inteira do contrato 'Projeto Marilac - Nacip Raydan' (Mosaic Fertilizantes P&K Ltda.).",
} as const;

const ESCAPAR_CSV = (v: string | number | null): string => {
  const s = v === null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const NUMERO_CSV = (v: number): string => v.toFixed(2).replace(".", ",");

const CABECALHO_CSV = [
  "Projeto",
  "Mineradora",
  "Órgão",
  "Status",
  "Execução",
  "Previsto (R$)",
  "Executado (R$)",
  "Transferido (R$)",
  "Ano inicial",
  "Ano final",
  "Breve relato da situação (fonte)",
];

/**
 * CSV com separador `;` (Excel pt-BR) — sem BOM; quem chama (componente de
 * cliente) prefixa o BOM UTF-8 ao criar o `Blob`, porque BOM é decisão de
 * transporte/arquivo, não de conteúdo. Números usam vírgula decimal, sem
 * separador de milhar — é como o Excel pt-BR lê coluna numérica de CSV com
 * `;`.
 */
export function contratosParaCsv(linhas: readonly AcordoTacContrato[]): string {
  const corpo = linhas.map((l) =>
    [
      l.projeto,
      l.mineradora,
      l.orgao,
      l.status,
      l.execucao,
      NUMERO_CSV(l.previsto),
      NUMERO_CSV(l.executado),
      NUMERO_CSV(l.transferido),
      l.anoInicial ?? "",
      l.anoFinal ?? "",
      l.relato ?? "",
    ]
      .map(ESCAPAR_CSV)
      .join(";"),
  );
  return [CABECALHO_CSV.join(";"), ...corpo].join("\r\n");
}
