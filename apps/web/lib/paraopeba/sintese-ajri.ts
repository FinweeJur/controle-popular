/**
 * Síntese temática da auditoria AECOM — os 16 eixos do rompimento da barragem
 * B-I em Brumadinho (2019-2026), com o resumo executivo, a tabela de prazos
 * (prometido × atual), as pendências que atravessam o acervo inteiro e os
 * pontos onde a base de evidência é mais rasa. ARQUIVO GERADO — não editar à
 * mão.
 *
 * ═══ ORIGEM ═══
 *
 * Gerado por `scripts/gerar-sintese-ajri.mts` a partir de
 * `X:\DevCoder\_ajri\SINTESE-TEMATICA.md` (fora do repo, de propósito).
 * O conteúdo foi auditado na fase de conteúdo contra os 337 resumos, contra o
 * texto original e contra `powerbi/indicadores-portal.md` (achados do painel
 * de indicadores do portal) — 64+ códigos de documento citados, todos reais;
 * toda citação ao painel conferida contra a fonte da captura visual. A
 * integração não reaudita: só transpila e confere estrutura. Para regenerar:
 * `npx tsx scripts/gerar-sintese-ajri.mts`.
 *
 * ═══ DUAS FONTES DENTRO DA MESMA SÍNTESE ═══
 *
 * A maioria dos achados cita um código de documento AECOM (`\d{5}-ACM-...`).
 * Alguns citam em vez disso o painel de indicadores do próprio portal
 * (`/indicadores`), que publica percentual de avanço por obra fora do ciclo
 * de relatórios em PDF, às vezes com data mais recente que qualquer PDF do
 * acervo. Esses achados trazem "Painel de indicadores (DD/MM/AAAA)" no texto
 * — a UI não precisa tratar diferente, mas quem lê sabe de onde veio cada
 * número.
 *
 * ═══ AUTORIA ═══
 *
 * A síntese é obra deste portal, como os resumos — o material de origem é da
 * AECOM, publicada sob os termos de uso do portal da auditoria. Cada achado
 * carrega o código do documento ou a data do painel que o sustenta (mesma
 * ponte da ficha).
 */

export interface GraficoDaSintese {
  /** Caminho público, ex. "/paraopeba/auditoria/graficos/01-manejo-rejeitos.png". */
  src: string;
  /** Legenda/alt-text — inclui a fonte e a data de atualização do painel. */
  legenda: string;
}

export interface EixoDaSintese {
  /** Nome do eixo, ex. "Fornecimento e captação de água". */
  titulo: string;
  /** Balanço geral do eixo no conjunto dos 337 relatórios. */
  estadoGeral: string;
  /** Como o tema evoluiu entre 2019 e 2026. */
  evolucao: string;
  /** Achados com o código do documento (ou a data do painel) que os sustenta. */
  achados: string[];
  /** Números-chave do eixo, com unidade, em texto corrido. */
  numerosChave: string;
  /** Gráficos do painel de indicadores relacionados a este eixo, se houver. */
  graficos: GraficoDaSintese[];
}

export interface ItemDaSintese {
  titulo: string;
  texto: string;
}

/** Uma linha da tabela de prazos: o que foi prometido × o que está valendo hoje. */
export interface LinhaDePrazoAjri {
  obra: string;
  prazoInicial: string;
  prazoAtual: string;
  atraso: string;
  resumo: string;
}

export const SINTESE_AJRI = {
  /** O veredito do conjunto em um parágrafo. */
  executivo: "Este acervo reúne 337 relatórios da AECOM, a auditoria independente que fiscaliza a resposta da Vale ao rompimento da barragem B-I, em Brumadinho, ocorrido em 25 de janeiro de 2019. Os documentos cobrem sete anos e meio, de fevereiro de 2019 a julho de 2026, e tratam de tudo: captação de água, remoção de rejeito, segurança das barragens que sobraram, saúde da população, fauna, flora, buscas por vítimas e participação das comunidades atingidas. O veredito geral que emerge do conjunto não é de fracasso total nem de sucesso: é de um processo que avançou de forma real e mensurável em alguns pontos — sobretudo na qualidade da água efetivamente distribuída à população e na segurança das estruturas remanescentes — mas que carrega um núcleo pequeno de problemas estruturais que atravessam a década inteira sem solução, com destaque para uma obra específica, a Nova Captação de água do rio Paraopeba, que nasceu atrasada no primeiro relatório de 2019 e seguia sem funcionar na vazão contratada no último relatório do corpus, em julho de 2026 — mesmo mês em que a Prefeitura de Brumadinho chegou a suspender o alvará de construção dessa obra.",
  eixos: [
    {
      titulo: "Fornecimento e captação de água",
      estadoGeral: "este é o problema mais grave e mais longevo do acervo. A captação de água bruta da COPASA (companhia estadual de saneamento) no rio Paraopeba, que tinha capacidade de 5 m³/s e sustentava parte do abastecimento de cerca de 5 milhões de pessoas na Região Metropolitana de Belo Horizonte, foi destruída no rompimento e nunca foi plenamente restabelecida até o fim do acervo.",
      evolucao: "em julho de 2019 foi assinado um acordo (TAC Água) prevendo uma \"Nova Captação\" pronta em meados de 2020. O atraso cresceu mês a mês: cerca de 30% em agosto de 2019, chegando a 39,37% em agosto de 2020 (60612553-ACM-DM-CO-RP-PM-0013-2020). O prazo formal de dezembro de 2023 venceu e não foi cumprido. Em 2025 a obra operava apenas em \"modo manual\", a 2 m³/s — 40% da vazão contratada (60612553-ACM-DM-CO-RP-PM-0068-2025). Em 2026 a previsão de conclusão foi empurrada para o primeiro trimestre de 2027, e no último documento do acervo (julho de 2026) a própria Prefeitura de Brumadinho suspendeu o alvará de construção da obra.",
      achados: ["A captação nunca voltou a operar na vazão plena mesmo com quase sete anos de auditoria mensal dedicada (60612553-ACM-DM-CO-RP-PM-0001-2019, 60612553-ACM-DM-CO-RP-PM-0084-2026).", "Simulações da COPASA indicaram risco dos reservatórios entrarem em \"volume morto\" (nível crítico) em meados de 2025 e depois a partir de setembro de 2026, caso a obra não entrasse em operação (60612553-ACM-DM-CO-RP-PM-0062-2024, 60612553-ACM-DM-CO-RP-PM-0076-2025).", "A partir de 2025-2026 a AECOM passou a apontar a causa dos atrasos como institucional — falta de acordo entre Vale e COPASA sobre responsabilidades — e não mais técnica (60612553-ACM-DM-CO-RP-PM-0084-2026).", "Comunidades diretamente atingidas (Tejuco e Parque da Cachoeira, em Brumadinho) dependeram de caminhão-pipa como única fonte de água por anos, sem solução definitiva até o fim do acervo (60612553-ACM-DM-CO-RP-PM-0076-2025).", "Apesar da crise de infraestrutura, a qualidade da água efetivamente entregue à população se manteve em alta conformidade: 99,9% em 851 requisitos avaliados no penúltimo relatório de monitoramento do acervo (60622935-ACM-DM-ZZ-RP-PM-0077-2026).", "Um programa de poços emergenciais para abastecer Paraopeba e Caetanópolis foi concluído, mas levou 34 meses — quatro vezes mais que os 8 meses planejados (60612553-ACM-DM-CO-RP-PM-0044-2023).", "**Painel de indicadores (atualizado 31/07/2026):** o avanço agregado de toda a frente de Reparação Socioambiental — que inclui a captação, mas também rejeito, vegetação e o próprio plano de reparação — está em **42%**. É a métrica mais ampla que o próprio portal publica, e serve de referência para todas as frentes específicas citadas nos outros eixos desta síntese."],
      numerosChave: "5 m³/s (capacidade original da captação) vs. 2 m³/s (o que efetivamente operava em 2025-2026); 5 milhões de pessoas dependentes; 39,37% de atraso físico na obra em agosto de 2020; 1.290 recomendações da AECOM sobre este tema desde o início, com 50% das pendências ainda abertas concentradas nesta única obra.",
      graficos: [],
    },
    {
      titulo: "Fauna",
      estadoGeral: "tema secundário, mas presente de forma constante — nunca ganhou um relatório inteiro dedicado só a ele, aparecendo sempre dentro de auditorias maiores (estudos de risco, plano de reparação, ações emergenciais).",
      evolucao: "em 2021, a obtenção de licença para capturar e amostrar animais silvestres virou o principal gargalo do Estudo de Risco Ecológico, atrasando-o em 5 a 6 meses. O \"Plano de Fauna\" só foi protocolado no órgão ambiental estadual em janeiro de 2022. Em 2022, o Plano de Recuperação de Áreas Degradadas foi reprovado com ressalvas por não tratar fauna terrestre e aquática como parte explícita da recuperação. De 2023 a 2025, fauna virou item de monitoramento de rotina, com um problema específico não resolvido: uma colônia de morcegos numa caverna perto da barragem Lagoa Azul impede a adequação completa dessa estrutura, ainda em estudo em maio de 2025.",
      achados: ["Atraso de 5 meses no Estudo de Risco Ecológico por falta de licença de captura de fauna (60612553-ACM-DM-SH-RP-PM-0022-2021).", "Estudos de bioacumulação de metais em peixes tiveram fragilidades metodológicas recorrentes — falta de cadeia de custódia, baixa representatividade amostral (60612553-ACM-DM-SH-RP-PM-0026-2021).", "Projeto de canalização do \"Marco Zero\" (ribeirão Ferro-Carvão) foi criticado por restringir o acesso da fauna silvestre à água (60612553-ACM-DM-ZZ-RP-PM-0036-2022).", "Colônia de morcegos trava a adequação da barragem Lagoa Azul desde 2023, sem solução até 2025 (60612553-ACM-DM-ZZ-RP-PM-0076-2025)."],
      numerosChave: "5 meses de atraso no estudo de risco por licença de fauna; 40% a 61% de conclusão do \"Plano de Fauna\" em outubro-novembro de 2021; 23 pontos de amostragem de peixes na bacia do rio Paraopeba.",
      graficos: [],
    },
    {
      titulo: "Flora e vegetação",
      estadoGeral: "assim como fauna, quase sempre subordinado a outros temas (obras de engenharia, segurança de barragens). O padrão dominante é descompasso crônico entre metas de revegetação e execução real.",
      evolucao: "o diagnóstico inicial (2020) já registrava perda de fragmentos florestais. Em 2021 veio a crítica ao projeto do \"Marco Zero\", que usa geometria artificial e restringe habitat. Em 2022 o Plano de Recuperação de Áreas Degradadas foi reprovado por não tratar fauna como parte da recuperação biológica. A revegetação das obras de captação de água apareceu como pendência \"impeditiva\" entre 2021 e 2024. Em 2025, mais de 75% da área do novo Reservatório de Água Bruta ainda estava sem revegetação — o pior número do acervo inteiro nesse quesito. O cronograma oficial da Vale só prevê a revegetação completa das áreas impactadas para 2031. Em 2026 surgiu um problema novo e inverso: vegetação em excesso passou a obstruir 60% dos instrumentos de monitoramento (prismas) da barragem remanescente B-I, sem solução em três relatórios seguidos.",
      achados: ["Redução de 84% na extensão da planície fluvial do ribeirão Ferro-Carvão (60612553-ACM-DM-ZZ-TN-PM-0033-2022).", "Revegetação das obras de captação classificada como pendência \"impeditiva\" por três anos seguidos (60612553-ACM-DM-CO-RP-PM-0044-2023 a 60612553-ACM-DM-CO-RP-PM-0058-2024).", "Reservatório de Água Bruta com mais de 75% da área sem revegetação em 2025 (60612553-ACM-DM-CO-RP-PM-0068-2025).", "60% dos prismas de monitoramento da barragem B-I obstruídos por vegetação em 2026 (60612553-ACM-DM-ZZ-RP-PM-0089-2026).", "**Painel de indicadores (atualizado 31/07/2026):** a frente \"Reparação Ambiental\" do Ribeirão Ferro-Carvão — que inclui o primeiro plantio de restauração florestal — está em só **9% de avanço geral** (18 hectares restaurados), com as obras de acesso rodoviário zeradas (0%); no rio Paraopeba, a frente \"Margens e Planícies\" está em **10%**, com recuperação de margens e vegetação ciliar também em 0%. Os dois números confirmam, com a mesma magnitude, o padrão de atraso que os relatórios já mostravam."],
      numerosChave: "20,50 hectares de floresta afetada pelo rejeito no diagnóstico inicial; 55%/35%/10% (concluído/pendente/em manutenção) na revegetação das obras de captação em 2023; conclusão total prevista só para 2031. **Do painel de indicadores (31/07/2026):** Reparação Ambiental do Ferro-Carvão em 9% (18 ha restaurados, 5% do primeiro plantio); Margens e Planícies do Paraopeba em 10% (0% de recuperação de vegetação ciliar).",
      graficos: [],
    },
    {
      titulo: "Saúde humana e risco ecológico",
      estadoGeral: "eixo farto em processo, mas pobre em resultado concreto. Um único estudo guarda-chuva — batizado GAISMA (Vale) e depois renomeado ERSHRE (Estudos de Avaliação de Risco à Saúde Humana e Ecológico) — nunca produziu resultado conclusivo dentro do período coberto, apesar de ter uma série de auditoria dedicada de 51 relatórios entre dezembro de 2019 e janeiro de 2024. **Atualização importante, do painel de indicadores do portal (atualizado 12/08/2026 — depois do último PDF do acervo): o estudo NÃO parou.** Ele só deixou de ter relatório dedicado no formato antigo. O painel mostra avanço de **23%**, com mais de 400 comunidades participando, incluindo **87 Povos e Comunidades Tradicionais** nas oitivas.",
      evolucao: "em 2019 o risco à saúde aparece de forma genérica, ligado à possibilidade de o rejeito ser remobilizado por enchentes. O estudo formal nasce no fim de 2019. Em 2021 a pandemia paralisa o trabalho de campo por meses. Ao longo de 2021-2022 aparecem lacunas de dados e falhas nos estudos de bioacumulação em peixes. Em 2023 o cronograma se deteriora de forma grave: a duração total declarada do estudo passa a \"6 anos\", descobre-se que ensaios laboratoriais importantes não têm acreditação técnica formal, e os relatórios da primeira fase mostram falhas crônicas de qualidade — só 1 de 10 aprovado até maio daquele ano. A última ficha do eixo, de dezembro de 2023, projeta que os estudos \"não serão concluídos antes de 2027\". Depois de janeiro de 2024, nenhum documento com a série dedicada a este eixo aparece mais no acervo, apesar de o compilado seguir até 2026 para outros temas. Enquanto isso, o programa de distribuição de água potável por caminhão-pipa — a única frente deste eixo medida continuamente — melhora de forma sustentada, de desempenho ruim em 2020 para 99-100% de conformidade na maior parte dos ciclos entre 2022 e 2025.",
      achados: ["A principal preocupação das comunidades, relatada em dezenas de reuniões, é o medo de contaminação de peixe, alimento e água — e seguia sem resposta científica final no fechamento do acervo (60670454-ACM-DM-SH-RP-PM-0050-2023).", "Relatórios da primeira fase do estudo, a base de tudo, apontados pela auditoria como o gargalo central do processo — só 1 de 10 aprovado até maio de 2023 (60670454-ACM-DM-SH-RP-PM-0043-2023).", "Ensaios laboratoriais-chave (metais, ecotoxicologia) sem acreditação segundo a norma técnica vigente, descoberto só em 2023 (60670454-ACM-DM-SH-RP-PM-0047-2023).", "Projeção final: estudos não concluídos antes de 2027 (60670454-ACM-DM-SH-RP-PM-0050-2023).", "**Painel de indicadores (atualizado 12/08/2026):** dentro da Fase I (Levantamento de Informações, 77% concluída), o trabalho técnico está praticamente pronto — 100% dos 257 estudos secundários validados, 100% das 415 comunidades consultadas — mas a etapa burocrática final está muito atrás: só **10,9% dos relatórios de Fase I aprovados** (6 relatórios) e só **16% das devolutivas às comunidades realizadas** (6 devolutivas). As Fases II (Amostragem), III (Cálculo de Risco) e IV (Planos de Recuperação) ainda **não foram iniciadas**."],
      numerosChave: "29 municípios cobertos pelo estudo; 172 de 348 estudos validados até 2021; 6.737 pessoas ouvidas em um único período de reuniões (set-out/2023); 1.610 recomendações emitidas neste eixo, das quais 1.249 concluídas; 99-100% de conformidade da água potável por caminhão-pipa na maior parte dos ciclos de 2022-2025. **Do painel de indicadores (12/08/2026):** 23% de avanço total; 87 Povos e Comunidades Tradicionais nas oitivas; Fase I em 77% (257 estudos e 415 comunidades, ambos 100%, mas só 10,9% dos relatórios aprovados); Fases II a IV em 0%.",
      graficos: [{ src: "/paraopeba/auditoria/graficos/02-estudos-risco-fase1.png", legenda: "Fase I dos Estudos de Risco à Saúde, por atividade — painel do portal (12/08/2026): coleta e escuta 100%, aprovação e devolutivas muito atrás" }],
    },
    {
      titulo: "Manejo e remoção de rejeitos",
      estadoGeral: "um dos eixos mais documentados do acervo — aparece em mais de 90 dos 337 relatórios. Mostra progresso real, mas lento e crônico.",
      evolucao: "em 2019 o rejeito estava fisicamente disperso e não contido — 9,1 milhões de m³ só num primeiro trecho, com pluma detectada a 317 km rio abaixo. O Plano de Manejo de Rejeitos, documento central do eixo, já nasceu atrasado. Em 2020 a dragagem do chamado \"Marco Zero\" se arrastou por quase todo o ano, com metas revisadas para baixo. Em 2021 a Cava de Feijão, destino de grande parte do rejeito, foi interditada por órgãos federais e do trabalho, retomando só em setembro daquele ano. Em 2022 a dragagem seguia com produtividade baixíssima — em setembro, apenas 758 m³ dragados no mês inteiro — e depósitos temporários de rejeito sofreram rupturas de talude. A dragagem do rio, na prática, cobriu só os primeiros 550 metros, concluídos por volta do início de 2024 — uma fração mínima frente aos cerca de 340 km afetados. A partir de 2022 nasceu o maior desafio do eixo: a remoção do rejeito ainda no \"anfiteatro\" da barragem B-I, com prazo inicial de 47 meses, considerado \"arrojado\" pela própria auditoria. A metodologia de remoção seguia parcialmente indefinida em 2024, e sucessivos adiamentos empurraram o início das obras para 2026 e depois 2027, por falta de licença ambiental. O Plano de Manejo de Rejeito (versão de junho de 2025) fixa a conclusão da remoção para 2029 e a reparação completa da área para 2031.",
      achados: ["9,1 milhões de m³ de rejeito estimados só no primeiro trecho avaliado, em 2019 (60612553-ACM-DM-ZZ-RP-PM-0003-2019).", "Cava de Feijão interditada duas vezes por órgãos federais e do trabalho (60612553-ACM-DM-ZZ-RP-PM-0025-2021, 60612553-ACM-DM-ZZ-RP-PM-0047-2022).", "Dragagem do rio cobriu apenas os primeiros 550 metros, concluídos só em 2024 (60612553-ACM-DM-ZZ-RP-PM-0059-2023).", "Um teste de rota alternativa de dragagem, em 2022, aumentou mensuravelmente a poluição da água no ribeirão Ferro-Carvão (60612553-ACM-DM-ZZ-TN-PM-0035-2023).", "Remoção do rejeito remanescente no \"anfiteatro\" da B-I — a maior massa ainda em pé — sem obra iniciada até o fim do acervo, reprogramada de 2026 para 2027 por falta de licença ambiental (60612553-ACM-DM-ZZ-RP-PM-0090-2026).", "**Painel de indicadores (atualizado 31/07/2026):** a remoção do rejeito da \"zona quente\" do Ferro-Carvão está **100% concluída — 12.213.492 m³ retirados** — mas essa frente é a exceção do eixo: no mesmo painel, a Cava de Feijão (destino de parte desse material) está só 43% avançada (7.749.838 m³ dispostos), a dragagem do próprio rio Paraopeba está em 26% (300.762 m³ dragados) e o **Anfiteatro da B-I — a maior massa ainda em pé, com cerca de 3 milhões de m³ — está com a remoção do rejeito em 0%**, confirmando com número exato o achado do parágrafo acima."],
      numerosChave: "317 km de extensão da pluma de contaminação em 2019; 2,05 milhões de m³ de rejeito ainda dentro da barragem B-I logo após o rompimento; 2,9 milhões de m³ de rejeito remanescentes no \"anfiteatro\" da B-I em 2024; conclusão da remoção prevista para 2029; reparação integral da área prevista para 2031. **Do painel de indicadores (31/07/2026):** 12.213.492 m³ já retirados da zona quente (100%); 7.749.838 m³ dispostos na Cava de Feijão (43% de avanço); 300.762 m³ dragados do rio (26%); 0 m³ removidos do Anfiteatro da B-I (0%).",
      graficos: [{ src: "/paraopeba/auditoria/graficos/01-manejo-rejeitos.png", legenda: "Manejo de rejeitos por frente, painel do portal (31/07/2026) — a Zona Quente está 100% concluída, o Anfiteatro da B-I em 0%" }],
    },
    {
      titulo: "Buscas por vítimas",
      estadoGeral: "este é o eixo com menos profundidade documental no acervo, porque a auditoria da AECOM tem escopo ambiental e de engenharia — o Corpo de Bombeiros e as associações de vítimas aparecem quase só na lista de reuniões, sem detalhamento de conteúdo, resultado ou número de vítimas localizadas.",
      evolucao: "reuniões entre Vale, Corpo de Bombeiros e a Associação de Vítimas de Brumadinho (AVABRUM) ocorrem quase mensalmente desde fevereiro de 2019. O ponto de contato mais concreto com o trabalho de engenharia é a remoção da \"mancha\" de rejeito do leito do rio, que era explicitamente pautada pela estratégia de buscas do Corpo de Bombeiros: a meta de remoção subiu de 1,5 milhão de m³ (2021) para 2,0 milhões de m³ (2022). A pandemia suspendeu as buscas por decreto municipal em 2020. A partir de abril de 2023 passou a constar também uma \"Comissão dos Familiares\" nas reuniões, ao lado da AVABRUM. A última reunião registrada no acervo é de 2 de abril de 2024 — depois disso, nas cerca de 140 fichas seguintes (até 2026), o tema simplesmente desaparece do relato, sem qualquer declaração de encerramento.",
      achados: ["Remoção de rejeito da \"mancha\" do rio explicitamente vinculada à estratégia de buscas do Corpo de Bombeiros (60612553-ACM-DM-ZZ-RP-PM-0038-2022).", "Suspensão de buscas por decretos municipais durante a pandemia (60612553-ACM-DM-ZZ-RP-PM-0020-2020).", "Atraso da Vale no atendimento a um pedido do Corpo de Bombeiros para esvaziar totalmente o reservatório da barragem B-VI, em 2019 (60612553-ACM-DM-ZZ-RP-PM-0008-2019).", "Nenhuma menção a buscas, vítimas ou Corpo de Bombeiros em nenhum dos relatórios posteriores a abril de 2024 no acervo."],
      numerosChave: "1,5 milhão de m³ (meta de remoção de rejeito ligada à estratégia de busca em 2021) subindo para 2,0 milhões de m³ em 2022; 8ª revisão da estratégia de buscas do Corpo de Bombeiros já registrada em março de 2021.",
      graficos: [],
    },
    {
      titulo: "Inspeções de campo e monitoramento técnico",
      estadoGeral: "um dos pilares mais bem documentados do acervo. A AECOM manteve, desde janeiro de 2019, um regime fixo de inspeções presenciais mensais e sessões técnicas de campo, chegando a 452 inspeções e 923 reuniões acumuladas até o relatório mais recente.",
      evolucao: "a estrutura de monitoramento (água, sedimento, barragens) amadureceu de forma quase contínua — a conformidade aos procedimentos técnicos subiu de faixas próximas a 95% em 2020-2021 para 98-100% em 2022-2025. Mas 2026 trouxe duas quedas inéditas desde 2021: falha crônica na leitura de cerca de 60% dos instrumentos de monitoramento (prismas) da barragem remanescente B-I, por obstrução de vegetação, sem solução por vários meses seguidos; e uma queda na qualidade das coletas depois da troca do laboratório subcontratado, em maio de 2026. Ao mesmo tempo, um marco positivo amadureceu: o sistema de transferência dos dados de monitoramento da Vale para o órgão ambiental estadual (chamado Sigma) entrou em fase final de testes em abril de 2026, com conclusão prevista para outubro daquele ano.",
      achados: ["60% dos prismas de monitoramento da barragem B-I sem leitura por vegetação, persistindo por vários ciclos (60612553-ACM-DM-ZZ-RP-PM-0089-2026).", "Barragem Capim Branco ficou sem dados de monitoramento por período prolongado (60612553-ACM-DM-ZZ-RP-PM-0089-2026).", "Troca de laboratório em 2026 provocou a pior aderência de coleta e análise desde 2021 (60622935-ACM-DM-ZZ-RP-PM-0079-2026).", "Estabilidade estrutural geral avaliada como adequada em praticamente todos os ciclos recentes, sem evidência de instabilidade iminente (60612553-ACM-DM-ZZ-RP-PM-0090-2026)."],
      numerosChave: "452 inspeções de campo acumuladas desde 2019; 14.385 auditorias de campo do programa de monitoramento de água entre 2020 e 2026; 308.450 requisitos avaliados; 60% dos prismas sem leitura em 2026; fator de segurança do Aterro de Nível exatamente no mínimo de projeto (1,30).",
      graficos: [],
    },
    {
      titulo: "Qualidade da água do rio Paraopeba e sedimentos",
      estadoGeral: "um dos eixos mais densamente documentados — cerca de 80 dos 337 relatórios pertencem à série específica de monitoramento de água e sedimento, rodando quase sem interrupção de 2020 a 2026.",
      evolucao: "em 2019, a pluma de metais e turbidez avançou por até 341,6 km do rio. Já em maio de 2019 houve sinal de recuo das concentrações. A partir de 2020 a AECOM formaliza o monitoramento e passa a rejeitar, por precaução, tentativas da Vale de reduzir a frequência de amostragem. O sedimento (lama do fundo do rio) é, do início ao fim da série, a matriz mais difícil de validar — sempre com menor grau de concordância entre os laboratórios do que a água. Em 2022, um teste de dragagem confirmou violações a limites legais de metais em todas as camadas do material do leito, e a AECOM rejeitou o argumento da Vale de que a diluição pela vazão do rio tornaria o impacto irrelevante. De 2024 a 2025 surge uma disputa técnica de fundo, sem solução no acervo: como calcular a qualidade da água antes do rompimento — a Vale usa um método estatístico que a AECOM considera inadequado para esse fim. O eixo termina o acervo (junho de 2026) em retrocesso: o pior desempenho de coleta e análise desde 2021, coincidindo com a troca do laboratório histórico.",
      achados: ["Pluma de contaminação atingiu 317-341,6 km do rio em 2019-2020 (60612553-ACM-DM-ZZ-RP-PM-0003-2019, 60612553-ACM-DM-ZZ-TN-PM-0001-2020).", "Teste de dragagem de 2022 confirmou violações legais de metais em todas as camadas do leito do rio (60612553-ACM-DM-ZZ-TN-PM-0035-2023).", "Disputa não resolvida sobre como calcular a qualidade da água antes do rompimento (60622935-ACM-DM-ZZ-RP-PM-0061-2025).", "Transferência do monitoramento para o órgão ambiental estadual sofreu atrasos crescentes por anos: de 12 meses previstos para 33 meses, e depois para 2025 (60622935-ACM-DM-ZZ-RP-PM-0012-2020, 60622935-ACM-DM-ZZ-RP-PM-0061-2025).", "Pior desempenho de coleta e análise desde 2021, registrado no último relatório do acervo (60622935-ACM-DM-ZZ-RP-PM-0079-2026)."],
      numerosChave: "341,6 km de extensão da pluma; convergência entre laboratórios sempre menor no sedimento que na água (por exemplo, 61% vs. 79% em outubro de 2020); 14.385 auditorias acumuladas até 2026; 95,1% de aderência na amostragem e 90,2% no laboratório no último ciclo — o pior nível desde 2021.",
      graficos: [],
    },
    {
      titulo: "Pendências em aberto e recorrentes",
      estadoGeral: "pendências em aberto não são exceção — são a espinha dorsal do acervo: 336 dos 337 relatórios trazem uma lista explícita do que ainda falta resolver.",
      evolucao: "o volume de pendências cresce até 2021-2022, torna-se mais seletivo e concentrado em 2023-2024, e termina em 2025-2026 sem resolver seu item mais antigo — a Nova Captação do Paraopeba, aberta no primeiro relatório de 2019 e ainda aberta no último, de julho de 2026. A AECOM passou a rastrear formalmente, desde 2020, quantas vezes uma mesma recomendação é adiada — chegando a nove reprogramações de um único item. O único veredito \"Insatisfatório\" de todo o acervo (janeiro de 2025) está ligado exatamente a essa mesma pendência crônica: a vazão de água entregue não atingia nem a metade do combinado.",
      achados: ["A Nova Captação do rio Paraopeba é a pendência mais longeva: aberta em 2019, ainda aberta em 2026 (60612553-ACM-DM-CO-RP-PM-0001-2019, 60612553-ACM-DM-CO-RP-PM-0084-2026).", "Recomendações reprogramadas até nove vezes, um padrão que se repete de 2020 a 2026 (60612553-ACM-DM-ZZ-RP-PM-0035-2021, 60612553-ACM-DM-ZZ-RP-PM-0082-2025).", "Descaracterização das barragens remanescentes (B-VI, Menezes I e II, Capim Branco) é pendência contínua do primeiro ao último ano do acervo (60612553-ACM-DM-ZZ-RP-PM-0006-2019, 60612553-ACM-DM-ZZ-RP-PM-0088-2026).", "Único veredito \"Insatisfatório\" de todo o acervo ligado à Nova Captação (60612553-ACM-DM-CO-RP-PM-0067-2025)."],
      numerosChave: "336 de 337 relatórios com pendências listadas; 50% das recomendações em aberto no relatório final concentradas num único tema (Nova Captação); 13 recomendações abertas há mais de 6 meses no último relatório; 81% de avanço do sistema de transferência de dados ao órgão ambiental em setembro de 2025, contra prazo original de 12 meses.",
      graficos: [],
    },
    {
      titulo: "Análises numéricas e estatísticas agregadas",
      estadoGeral: "duas camadas coexistem neste eixo — a AECOM constrói seus próprios indicadores estatísticos de acompanhamento (índices de conformidade, de concordância entre laboratórios), enquanto repetidamente aponta erros estatísticos nos estudos da Vale.",
      evolucao: "já em 2020 a AECOM identifica testes estatísticos aplicados sem verificar pressupostos básicos. Ao longo de seis anos, a Vale propõe métricas erradas para calcular a qualidade da água antes do rompimento, e a AECOM rejeita cada uma — a mais recente, em dezembro de 2024, usando uma fórmula criada para detectar valores fora do padrão, não para definir uma referência histórica. Em 2022, um estudo de saúde teve crise aguda de suficiência de dados: a produtividade real de coleta de questionários (1,9 por dia) ficou muito abaixo da meta (25 por dia), tornando os dados insuficientes para sustentar análise estatística em todas as áreas avaliadas, segundo a avaliação da auditoria. Estudos hidrogeológicos (sobre água subterrânea) foram reprovados repetidamente, ao longo de três anos, pela mesma falha: falta de análise estatística robusta. Um caso específico, em 2023, mostrou resultados de 12 poços monitorados durante todo um ciclo simplesmente omitidos do relatório final — um indício de seleção de dados favoráveis.",
      achados: ["Testes estatísticos aplicados sem verificar normalidade dos dados, logo em 2020 (60622935-ACM-DM-ZZ-TN-PM-0001-2020).", "Vale usa repetidamente métricas erradas para calcular a referência histórica de qualidade da água; rejeitado pela AECOM ano após ano até 2024 (60622935-ACM-DM-ZZ-RP-PM-0061-2025).", "Estudo de saúde com produtividade de 1,9 questionário/dia contra meta de 25/dia, tornando os dados insuficientes, na avaliação da auditoria, para sustentar análise estatística (60670454-ACM-DM-SH-RP-PM-0032-2022).", "Resultados de 12 poços monitorados durante todo o ciclo hidrológico omitidos de um relatório (60622935-ACM-DM-ZZ-TN-PM-0004-2023)."],
      numerosChave: "1,9 questionários/dia real vs. meta de 25/dia; 12 de 86 poços com resultados não apresentados; índice de aderência caindo de 99,9% para 95,1%/90,2% após a troca de laboratório em 2026; 298.309 requisitos avaliados de forma acumulada até 2026.",
      graficos: [],
    },
    {
      titulo: "Recomendações da AECOM",
      estadoGeral: "a auditoria mantém, desde março de 2019, um placar cumulativo formal — recomendações apresentadas, atendidas, em processo, não atendidas, canceladas — presente em quase todos os relatórios.",
      evolucao: "o total cresce de 58 recomendações em março de 2019 para picos de milhares (3.810 num dos rastreamentos, em 2024), depois se reorganiza em duas séries paralelas por volta de 2024. O grau de atendimento varia muito por tema: recomendações ligadas a ações emergenciais e monitoramento de água têm índices altos e crescentes (de cerca de 65% em 2019-2020 para mais de 90% em 2023-2025); já as recomendações ligadas aos capítulos do Plano de Reparação Socioambiental mostram taxas de não atendimento muito mais altas — até 67% em aberto em uma nota técnica de 2021. Houve episódios de atrito: recusa da Vale em executar um estudo recomendado, reclassificação unilateral de recomendações sem envolver a auditoria. Na fase mais recente (2025-2026), cerca de metade das pendências abertas se concentra num único tema — a Nova Captação — a ponto de o órgão ambiental estadual ter imposto um prazo próprio de 30 dias para forçar o cumprimento de uma recomendação específica.",
      achados: ["AECOM recusou-se a reconhecer a certificação de estabilidade da barragem Menezes II enquanto obras recomendadas não fossem concluídas (60612553-ACM-DM-M2-RP-PM-0001-2019).", "Vale recusou executar estudo recomendado para ampliar tratamento de efluentes, sem apresentar alternativa (60612553-ACM-DM-ZZ-RP-PM-0007-2019).", "Recomendações do Plano de Reparação (Capítulo 1) com 66,9% em aberto em 2021 (60612553-ACM-DM-ZZ-TN-PM-0010-2021).", "Pior proporção de atendimento do acervo: bloco de serviços ecossistêmicos, com 46 recomendações não atendidas contra só 10 atendidas (60612553-ACM-DM-ZZ-TN-PM-0036-2023).", "Órgão ambiental estadual (Igam) precisou impor prazo próprio de 30 dias porque a Vale não cumpria recomendação da AECOM (60622935-ACM-DM-ZZ-RP-PM-0076-2026)."],
      numerosChave: "58 recomendações em março de 2019, crescendo a mais de 3.800 em 2024; 88,8% de conclusão acumulada na frente de restabelecimento de água no relatório final (1.146 de 1.290); 50% das pendências recentes concentradas na Nova Captação.",
      graficos: [],
    },
    {
      titulo: "Desafios estruturais",
      estadoGeral: "este eixo muda de natureza ao longo do tempo — começa como fragilidade técnica interna da Vale e de suas consultorias, e termina como conflito institucional aberto entre duas grandes organizações (Vale e COPASA).",
      evolucao: "em 2020, o volume de recomendações só sobre um capítulo do Plano de Reparação (mais de 800) já levou a AECOM a pedir revisão estrutural do próprio plano. Também em 2020-2021, foi identificada fragilidade na governança e no controle de qualidade de uma consultoria subcontratada pela Vale. A partir de 2021, as reprogramações crônicas de prazo se tornam queixa quase ritual em quase todo relatório periódico. Em 2023, um plano de serviços ecossistêmicos foi chamado explicitamente de \"estruturalmente\" frágil — o único caso do acervo em que essa palavra qualifica diretamente um documento técnico, e não uma obra física. Em 2024-2025, um novo problema estrutural ganha peso: dissensos técnicos recorrentes entre Vale e COPASA no acordo de água. Em 2026 esse impasse é descrito repetidamente pela auditoria como um problema de governança, não mais técnico, em pelo menos cinco relatórios seguidos — e piora até a suspensão do alvará de construção da Nova Captação, em julho de 2026, com um episódio em que a Vale respondeu a uma questão técnica sem dar ciência à própria auditoria.",
      achados: ["Mais de 800 recomendações só sobre um capítulo do plano de reparação levam a pedido de revisão estrutural (60612553-ACM-DM-ZZ-RP-PM-0017-2020).", "Fragilidade de governança e controle de qualidade em consultoria subcontratada pela Vale (60622935-ACM-DM-ZZ-RP-PM-0013-2021).", "Transferência de monitoramento ao órgão ambiental, planejada para 12 meses, levou cerca de 6 anos (60622935-ACM-DM-ZZ-RP-PM-0012-2020, 60622935-ACM-DM-ZZ-RP-PM-0079-2026).", "Impasse Vale-COPASA descrito como problema de governança em cinco relatórios seguidos de 2026, culminando na suspensão do alvará da Nova Captação (60612553-ACM-DM-CO-RP-PM-0084-2026)."],
      numerosChave: "mais de 800 recomendações num único capítulo do plano de reparação; atraso de 33 meses (contra 12 previstos) na transferência do monitoramento; vazão pactuada de 5 m³/s contra até 2 m³/s realmente operados em 2026 (média de 1,56 m³/s entre abril e junho de 2026).",
      graficos: [],
    },
    {
      titulo: "Atrasos e descumprimentos de prazo",
      estadoGeral: "o eixo mais pervasivo de todo o acervo — aparece, de alguma forma, em cerca de 85% dos documentos (288 de 337), atravessando literalmente todos os subtemas.",
      evolucao: "em 2019, a própria meta emergencial da AECOM (30 de setembro de 2019) já é descumprida. Em 2020 o atraso da Nova Captação sobe quase todo mês. Em 2021 um replanejamento reduz o desvio, mas ele volta a subir. Em 2022 aparece um \"atraso oculto\" de 8 meses no estudo de risco à saúde, não declarado pela própria equipe responsável — um agravante de confiabilidade, não só de prazo. 2023 é o ano de maior densidade de descumprimentos simultâneos: Nova Captação, Reservatório de Água Bruta, poços de Sabará, sistema de transferência de dados e estudos de risco atrasam ao mesmo tempo. Em 2024 o prazo formal da Nova Captação (dezembro de 2023) vence e passa a ser citado como \"vencido\" relatório após relatório. Em 2025-2026 a explicação muda de fatores técnicos e climáticos para um impasse institucional entre Vale e COPASA, com a mesma frase de alerta repetida quase literalmente em cinco relatórios seguidos.",
      achados: ["Meta emergencial de 30 de setembro de 2019 descumprida já no primeiro ano (60612553-ACM-DM-CO-RP-PM-0001-2019).", "Atraso \"oculto\" de 8 meses no cronograma dos estudos de risco, não declarado pela equipe de execução (60670454-ACM-DM-SH-RP-PM-0035-2022).", "Sistema de transferência de dados ao órgão ambiental (12 meses previstos, cerca de 6 anos de execução real) (60622935-ACM-DM-ZZ-RP-PM-0012-2020).", "Sistema de Abastecimento Integrado de Tejuco e Parque da Cachoeira com apenas 53% de avanço contra 93% previsto (60612553-ACM-DM-CO-RP-PM-0076-2025).", "Nova data de conclusão da Nova Captação: primeiro trimestre de 2027 (60612553-ACM-DM-CO-RP-PM-0081-2026)."],
      numerosChave: "atraso acumulado de até 39,37% na Nova Captação em 2020; desvio de 67% de prazo na adutora de água bruta no mesmo período; 25,86 pontos percentuais de desvio em 2023; 40 pontos percentuais de atraso no sistema de água de Tejuco/Parque da Cachoeira em 2025.",
      graficos: [],
    },
    {
      titulo: "Avanços e conclusões positivas",
      estadoGeral: "existem avanços reais no acervo, mas quase sempre expressos em linguagem técnica — percentuais de conformidade, marcos de obra concluídos — e raramente como aprovação plena: apenas 6 dos 337 documentos recebem veredito \"Satisfatório\", e nenhum recebe \"Sem ressalvas\".",
      evolucao: "o primeiro sinal de melhora reconhecida pela AECOM aparece em 2020, com \"amadurecimento técnico e gerencial\" nos planos de monitoramento. Em abril de 2021 vem o primeiro veredito \"Satisfatório\" da série. Ao longo de 2022-2023 os índices de conformidade se consolidam acima de 97%, com marcos pontuais concluídos: o Sistema Cambimbe (obra de abastecimento) chega à operação plena, a dragagem dos dois primeiros quilômetros do rio é concluída, capítulos do plano de reparação são entregues. O pico do eixo é fevereiro a abril de 2024: três meses seguidos com veredito \"Satisfatório\" e índices de 100% em várias etapas. Em 2025, o projeto básico de descaracterização da barragem Menezes I é aprovado. Já em 2026 há reversão parcial: o monitoramento de água cai para índices que não se via desde 2021, mas o atendimento acumulado de recomendações atinge o maior patamar da série histórica (88,8%).",
      achados: ["Primeiro veredito \"Satisfatório\" da série, em abril de 2021 (60622935-ACM-DM-ZZ-RP-PM-0017-2021).", "Sistema Cambimbe concluído com operação plena, um contraste raro com o padrão geral de atraso (60612553-ACM-DM-CO-RP-PM-0032-2022).", "Três vereditos \"Satisfatório\" seguidos entre fevereiro e abril de 2024 (60622935-ACM-DM-ZZ-RP-PM-0051-2024 a 60622935-ACM-DM-ZZ-RP-PM-0053-2024).", "Único exemplo social do acervo com veredito \"Satisfatório\": o projeto de manejo ético de cães e gatos (60612553-ACM-DM-ZZ-TN-PM-0050-2023).", "**Painel de indicadores (atualizado 27/07/2026):** esse mesmo projeto de cães e gatos é hoje um dos poucos do acervo inteiro perto do prazo — **83% realizado contra 84% previsto**. Duas das quatro frentes já estão 100% concluídas (kits de adoção entregues, ações educativas realizadas em todos os municípios); só a frente de castração e microchipagem está um pouco atrás (70% × 78% previsto, 24.528 animais atendidos), atribuída pelo próprio painel a vagas não preenchidas pelos municípios — não a falha da Vale."],
      numerosChave: "6 de 337 relatórios com veredito \"Satisfatório\"; 99,8% foi o melhor índice histórico de amostragem já registrado; 88,8% de atendimento acumulado de recomendações no relatório mais recente; 452 inspeções e 923 reuniões acumuladas desde 2019. **Do painel de indicadores (27/07/2026):** manejo de cães e gatos em 83% (24.528 castrações/microchipagens, 200 kits de adoção e 52 ações educativas 100% concluídos).",
      graficos: [],
    },
    {
      titulo: "Regularização fundiária, desapropriação e liberação de áreas",
      estadoGeral: "eixo disperso ao longo de sete anos, sempre subordinado a obras específicas — nunca um programa autônomo e estruturado. O mesmo tipo de gargalo se repete quase sem mudança do início ao fim: um proprietário específico recusa acordo, e a obra trava até decisão judicial.",
      evolucao: "em novembro de 2019, as obras da Nova Captação já são paralisadas por decisão judicial ligada a desapropriação. Ao longo de 2020 a negociação fundiária aparece como pendência quase mensal, incluindo um trecho de 4,3 km da adutora sob restrição judicial. Em 2021-2022 o tema fica mais pontual: poços de monitoramento sem coleta por falta de acordo com proprietários rurais. Em 2022-2023 aparecem dois problemas de escopo maior: a caracterização fundiária das propriedades atingidas pela mancha de rejeito, e lacunas na própria metodologia de liberar áreas contaminadas para uso. Do lado positivo, a entrega de poços a proprietários rurais avança de forma constante: 40 entregues em 2023, 57 de 66 em 2025. Mas o problema mais grave e recente aparece em 2025-2026: o Sistema de Abastecimento de Água Integrado de Tejuco e Parque da Cachoeira ficou com a liberação fundiária pendente por mais de 15 meses, e no último relatório do acervo sobre o tema (janeiro de 2026) o mesmo tipo de bloqueio — recusa de um proprietário, com ordem judicial em tramitação — ainda travava a obra, repetindo quase palavra por palavra o episódio de novembro de 2019.",
      achados: ["Obras da Nova Captação paralisadas por decisão judicial já em novembro de 2019 (60612553-ACM-DM-CO-RP-PM-0004-2019).", "Trecho de 4,3 km da adutora sob restrição judicial por pendência fundiária (60612553-ACM-DM-CO-RP-PM-0012-2020).", "Reservatório do sistema de água de Tejuco bloqueado por recusa de proprietário, com ordem judicial em tramitação, ainda em janeiro de 2026 (60612553-ACM-DM-CO-RP-PM-0078-2026).", "Mesmo com 99% de atendimento a recomendações em outubro de 2025, a regularização fundiária seguia sem resolução efetiva (60612553-ACM-DM-CO-RP-PM-0075-2025).", "**Painel de indicadores (atualizado 27/07/2026):** existe um projeto de compensação dedicado à regularização fundiária — \"Regularização Fundiária do Parque Estadual da Serra do Rola-Moça\" (Anexo II.2), fora do escopo dos relatórios em PDF. Avanço de **21% contra 25% previsto**, com 10 imóveis priorizados. A etapa de negociação com proprietários está adiantada (65% × 76% previsto) — mas as etapas seguintes (formalização e transferência de titularidade) estão **em 0%, e zero regularizações foram concluídas** até a data do painel. O próprio painel atribui o atraso à \"baixa efetividade das negociações fundiárias\"."],
      numerosChave: "4,3 km de adutora sob restrição judicial; 57 de 66 poços entregues a proprietários rurais até 2025; 15 meses de pendência fundiária no sistema de água de Tejuco; avanço físico de apenas 53% (contra 93% previsto) atribuído em parte a esse bloqueio. **Do painel de indicadores (27/07/2026):** Regularização Fundiária da Serra do Rola-Moça em 21% (25% previsto); 0 regularizações concluídas de 10 imóveis priorizados.",
      graficos: [],
    },
    {
      titulo: "Participação social: atingidos, lideranças e povos e comunidades tradicionais",
      estadoGeral: "eixo substancial, mas quase sempre inserido dentro de outro processo — principalmente o estudo de risco à saúde — e não como um capítulo próprio do plano de reparação.",
      evolucao: "em 2019 a escuta é pontual e reativa, sem estrutura. A partir do fim de 2019 nasce um processo sistemático dentro do estudo de risco, com reuniões em cascata (poder público, depois lideranças, depois comunidades) em 29 municípios. Materiais de comunicação para as comunidades precisaram de pelo menos cinco revisões por serem tecnicamente inacessíveis. A pandemia paralisou o trabalho de campo por cerca de um ano. Em setembro de 2021 — quase três anos após o rompimento — povos indígenas e comunidades tradicionais (quilombolas, Pataxó, depois Xukuru Kariri) foram formalmente incluídos no estudo, mas o critério de quem contava como \"comunidade tradicional\" mudou de forma inconsistente entre relatórios, e a Vale chegou a propor um critério que a própria auditoria considerou contrário à lei. Em 2022, ao entrar na região central de Brumadinho, a auditoria registrou queda de adesão das comunidades e equipe mal treinada para lidar com reuniões tensas. Também em 2022-2023, a AECOM fez uma crítica estrutural recorrente: a Vale tratava os atingidos como \"atores sociais indiretos\" e reduzia participação social a mera coleta de dados — chegando a eliminar um mecanismo que dava às comunidades participação ativa nas decisões. Paralelamente, as associações de familiares de vítimas fatais mantiveram reuniões estáveis e quase mensais até pelo menos abril de 2024. Depois disso, o eixo inteiro desaparece do acervo compilado: os relatórios de 2024 a 2026 disponíveis tratam quase só de barragens e água, sem equivalente sobre comunidades, lideranças ou povos tradicionais.",
      achados: ["Cartilha de comunicação do estudo de risco precisou de pelo menos cinco revisões por linguagem excessivamente técnica (60612553-ACM-DM-SH-RP-PM-0009-2020 a 60612553-ACM-DM-SH-RP-PM-0012-2020).", "Inclusão formal de povos indígenas e comunidades tradicionais só em setembro de 2021, quase três anos após o rompimento (60612553-ACM-DM-SH-RP-PM-0023-2021).", "AECOM classificou o tratamento dado pela Vale aos atingidos como \"atores sociais indiretos\", violando o acordo judicial que exige participação efetiva (60612553-ACM-DM-ZZ-TN-PM-0064-2023).", "Mecanismo que permitia participação ativa das comunidades nas decisões foi eliminado de um plano (60612553-ACM-DM-ZZ-TN-PM-0036-2023).", "Três municípios atingidos chegaram a ficar sem nenhuma assessoria técnica independente para representar os moradores (60612553-ACM-DM-SH-RP-PM-0006-2020).", "Eixo inteiro some do acervo depois de abril de 2024, sem explicação documentada (60670454-ACM-DM-SH-RP-PM-0051-2024)."],
      numerosChave: "29 municípios cobertos pelo estudo de risco; 6 comunidades quilombolas certificadas na bacia; até 102 comunidades tradicionais identificadas, com subconjuntos de 41 a 81 \"a incluir\" variando entre relatórios; apenas 3 reuniões realizadas em 43 dias, contra meta de cerca de 2 por dia útil, no último relatório sobre o tema.",
      graficos: [],
    },
  ],
  /** Tabela de prazos — só entram obras com prazo inicial E atual explícitos. */
  prazos: [
    {
      obra: "Nova Captação do rio Paraopeba",
      prazoInicial: "\"Meados de 2020\" (TAC Água, jul/2019); depois prazo formal de dezembro de 2023",
      prazoAtual: "1º trimestre de 2027",
      atraso: "Cerca de 6 a 7 anos frente à primeira previsão; alvará de construção suspenso pela Prefeitura em jul/2026",
      resumo: "A obra que devolveria a captação de água destruída pelo rompimento — a pendência mais antiga e mais grave do acervo inteiro.",
    },
    {
      obra: "Remoção do rejeito no Anfiteatro da B-I",
      prazoInicial: "47 meses, prazo que a própria AECOM já chamou de \"arrojado\"",
      prazoAtual: "Conclusão da remoção prevista para 2029; reparação completa da área, 2031",
      atraso: "Início das obras já adiado de 2026 para 2027 por falta de licença ambiental; remoção em 0% no painel de indicadores (31/07/2026)",
      resumo: "A maior massa de rejeito ainda em pé (~3 milhões de m³), sem obra iniciada até o fim do acervo.",
    },
    {
      obra: "Poços emergenciais de Paraopeba e Caetanópolis",
      prazoInicial: "8 meses",
      prazoAtual: "34 meses (já concluído)",
      atraso: "26 meses (quase 4× o previsto)",
      resumo: "Único item desta tabela já finalizado — mas com atraso grande mesmo assim.",
    },
    {
      obra: "Transferência de dados ao órgão ambiental (sistema Sigma)",
      prazoInicial: "12 meses",
      prazoAtual: "33 meses (medição de 2025); \"cerca de 6 anos\" numa medição posterior (2026)",
      atraso: "21 meses de atraso na primeira medição; o acervo não deixa claro por que a segunda medição salta para ~6 anos",
      resumo: "O próprio jeito de medir esse atraso mudou entre relatórios — sinal de instabilidade no acompanhamento, não só do prazo em si.",
    },
    {
      obra: "Regularização Fundiária da Serra do Rola-Moça (compensação, Anexo II.2)",
      prazoInicial: "Execução formal: 21/02/2025 a 25/07/2028 (prazo ainda não vencido)",
      prazoAtual: "21% realizado contra 25% previsto (painel, 27/07/2026)",
      atraso: "Leve atraso dentro do prazo ainda vigente; etapa de negociação fundiária (65% × 76% previsto) puxa o atraso, formalização e titulação em 0%",
      resumo: "Projeto ainda dentro do prazo formal, mas a etapa mais lenta é justamente a negociação com proprietários — o mesmo gargalo que trava a Nova Captação.",
    },
    {
      obra: "Manejo Populacional Ético de Cães e Gatos (compensação, Anexo II.2)",
      prazoInicial: "Execução formal: 20/03/2025 a 23/12/2026",
      prazoAtual: "83% realizado contra 84% previsto (painel, 27/07/2026)",
      atraso: "Praticamente sem atraso — 1 ponto percentual",
      resumo: "O único projeto do acervo inteiro quase exatamente no prazo.",
    },
    {
      obra: "Sistema de Abastecimento de Tejuco e Parque da Cachoeira",
      prazoInicial: "Não declarado no acervo como data — só como percentual previsto",
      prazoAtual: "53% de avanço físico (2025)",
      atraso: "40 pontos percentuais abaixo do previsto (93%)",
      resumo: "Comunidades diretamente atingidas seguem dependendo de caminhão-pipa enquanto essa obra não termina.",
    },
    {
      obra: "Estudos de Avaliação de Risco à Saúde Humana e Ecológico",
      prazoInicial: "Não declarado como data única — o acervo em PDF só registra a duração total subindo para \"6 anos\" em 2023",
      prazoAtual: "Painel de indicadores: 23% de avanço geral (12/08/2026); a própria AECOM projetava, em 2023, que não terminaria antes de 2027",
      atraso: "Sem data de início/fim comparável às demais linhas — mas a Fase I (de 4) está em 77%, e as Fases II a IV ainda não começaram",
      resumo: "O estudo mais citado do acervo em termos de gente ouvida (mais de 400 comunidades), e o mais frágil em termos de prazo declarado.",
    },
  ],
  /** Gráficos gerais do painel, não ligados a um eixo só (ex.: visão agregada). */
  graficosGerais: [{ src: "/paraopeba/auditoria/graficos/04-previsto-realizado.png", legenda: "Previsto x Realizado nos três projetos com meta explícita no painel do portal — cães e gatos quase no prazo, regularização fundiária e Tejuco/Parque da Cachoeira abaixo do previsto" }, { src: "/paraopeba/auditoria/graficos/03-reparacao-por-frente.png", legenda: "Avanço por frente da Reparação Socioambiental, painel do portal (31/07/2026) — total agregado 42%" }],
  /** Pendências que reaparecem em vários eixos — o sinal estrutural mais forte. */
  transversais: [
    { titulo: "A Nova Captação de água do Paraopeba é o ponto de convergência de quase tudo que deu errado.", texto: "Ela aparece como pendência mais antiga do acervo, como o único veredito \"Insatisfatório\" de toda a série, como metade das recomendações abertas no relatório final, como exemplo central de \"atraso oculto\" e reprogramação crônica, e como o item que finalmente rebaixou o tom da auditoria para \"entrave de governança\" em 2025-2026." },
    { titulo: "Reprogramação crônica de prazos", texto: "aparece em pelo menos seis eixos diferentes (captação de água, manejo de rejeitos, saúde humana, pendências, recomendações, desafios estruturais, atrasos) — algumas recomendações foram adiadas nove vezes ou mais, um padrão que se repete de 2020 a 2026 sem mudança estrutural." },
    { titulo: "Impasse de governança entre Vale e COPASA", texto: "deixou de ser um problema técnico isolado e passou a ser citado, com o mesmo texto quase idêntico, em relatórios de captação de água, pendências, desafios estruturais e atrasos — todos em 2025-2026, mostrando que a causa dos atrasos migrou de \"obra difícil de construir\" para \"duas organizações que não se entendem sobre responsabilidades\"." },
    { titulo: "Descompasso entre metas e execução real da revegetação", texto: "aparece em pelo menos três eixos (flora, captação de água, fauna) — toda obra nova de infraestrutura hídrica (Nova Captação, adutora, Reservatório de Água Bruta) tem revegetação pendente, às vezes classificada como \"impeditiva\", que se arrasta por anos." },
    { titulo: "Transferência de dados de monitoramento ao órgão ambiental estadual (sistema Sigma)", texto: "aparece como atraso crônico em pelo menos três eixos (qualidade da água, desafios estruturais, pendências) — planejada para 12 meses, levou cerca de 6 anos." },
    { titulo: "Falhas de qualidade em laboratório subcontratado", texto: "aparecem em pelo menos quatro eixos (qualidade da água, inspeções, saúde humana, análises estatísticas) — o mesmo laboratório (SGS Geosol) é citado repetidamente por anos, e sua substituição em 2026 piorou o desempenho em vez de melhorar." },
    { titulo: "A qualidade da água efetivamente entregue à população é o contraponto positivo mais consistente do acervo", texto: "aparecendo em pelo menos três eixos (captação, saúde humana, qualidade da água) com conformidade historicamente alta — mostrando que a crise, apesar de grave, é de capacidade e prazo de infraestrutura, não (na maior parte do tempo) de contaminação do que chega à torneira." },
    { titulo: "O trabalho técnico anda mais rápido que a formalização burocrática — um padrão que só aparece comparando painéis diferentes.", texto: "No estudo de saúde, a coleta de dados e a escuta das comunidades estão 100% prontas, mas a aprovação formal dos relatórios está em 10,9% e as devolutivas em 16%. Na regularização fundiária da Serra do Rola-Moça, a negociação com proprietários está em 65%, mas a formalização e transferência de titularidade estão em 0%. Os dois casos, em frentes completamente diferentes (saúde e terra), mostram o mesmo formato de gargalo: o trabalho de campo avança, o processo administrativo que o transforma em resultado oficial trava." },
  ],
  /** Eixos em que a base de evidência é mais rasa — antes de conclusões fortes. */
  fragilidades: [
    { titulo: "Buscas por vítimas", texto: "é, disparadamente, o eixo com menos conteúdo verificável. A auditoria tem escopo ambiental e de engenharia — o Corpo de Bombeiros e as associações de vítimas aparecem quase só como nomes numa lista de reuniões, sem pauta, resultado ou número de vítimas localizadas detalhado em nenhum relatório. Não há, em nenhuma ficha, um número de vítimas encontradas ou identificadas." },
    { titulo: "Participação social e povos e comunidades tradicionais", texto: "tem bom volume de relatórios em PDF, mas some completamente do acervo depois de abril de 2024 — cerca de dois anos e meio antes do fim do compilado. **Atualização:** o painel de indicadores confirma que o estudo de risco ao qual esse acompanhamento estava ligado continua ativo (23% de avanço, atualizado 12/08/2026, com 87 Povos e Comunidades Tradicionais participando das oitivas) — então o mais provável é que o acompanhamento social não tenha parado, só tenha migrado de formato de relatório. Mas o painel não detalha participação social por si só, então essa é uma inferência, não uma confirmação direta." },
    { titulo: "Saúde humana e risco ecológico", texto: "tinha uma série de auditoria dedicada robusta (51 relatórios) que desaparece do acervo em PDF em janeiro de 2024. **Isso deixou de ser uma lacuna:** o painel de indicadores do portal mostra que o estudo continua ativo e mede 23% de avanço geral (atualizado 12/08/2026) — a Fase I está adiantada na coleta (100%) mas travada na aprovação formal (10,9%), e as Fases II a IV nem começaram. O resultado final do estudo (que a própria auditoria projetava só para depois de 2027) segue sem aparecer em documento nenhum, PDF ou painel — isso continua sendo uma lacuna real, só que agora sabemos que o processo não foi abandonado." },
    { titulo: "Fauna", texto: "nunca teve um relatório dedicado só a ela — os 40 achados sobre o tema estão sempre embutidos em fichas de escopo mais amplo (estudos de risco, plano de reparação, ações emergenciais). Isso significa que qualquer conclusão isolada sobre fauna é, na verdade, um recorte de outro veredito mais genérico." },
    { titulo: "Regularização fundiária", texto: "também nunca ganhou um programa próprio e nomeado nos relatórios — o termo \"regularização fundiária\" aparece de forma explícita em só um documento do acervo inteiro. O que existe são dezenas de menções pontuais, uma por obra específica, sem visão consolidada." },
    { titulo: "Vereditos \"Não declarado\"", texto: "aparecem em pelo menos um documento citado neste acervo (60612553-ACM-DM-ZZ-RP-PM-0028-2021) — sinal de que a própria AECOM, em certos relatórios de menor complexidade, não atribuiu uma nota de avaliação formal, o que limita comparações diretas entre todos os 337 documentos." },
  ],
} as const;
