# -*- coding: utf-8 -*-
import json
from pathlib import Path

PORTAL_JSON = Path('apps/web/data/noticias-portal.json')
DATASET_JSONL = Path('etl/finetuning/dataset-seu-nono-v1.jsonl')
ENRIQUECER_PY = Path('scripts/enriquecer-noticias.py')

with open(PORTAL_JSON, 'r', encoding='utf-8') as f:
    noticias = json.load(f)

print(f'Total de noticias carregadas: {len(noticias)}')

NOTICIAS_ATUALIZADAS = {
    'itinga-transparencia-repasses-litio': {
        'titulo': 'Itinga: royalties da mineração de lítio, receitas da CFEM e fiscalização de gastos públicos',
        'subtitulo': 'Município do Médio Jequitinhonha arrecada R$ 9,28 milhões em CFEM, com despesas concentradas em educação e saúde e cobrança por saneamento.',
        'resumo': 'Levantamento detalha a arrecadação de royalties da mineração em Itinga, a partilha legal da CFEM, os maiores contratos no PNCP e a divisão dos gastos da prefeitura.',
        'frente': 'cidades',
        'subfrente': 'Itinga — Vale do Jequitinhonha',
        'palavrasChave': [
            'itinga',
            'litio-itinga',
            'cfem-itinga',
            'royalties-mineracao',
            'jequitinhonha-transparencia',
            'compras-publicas'
        ],
        'citacaoAbnt': 'ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Itinga: royalties da mineração de lítio, receitas da CFEM e fiscalização de gastos públicos. Controle Popular, Brasília, set. 2026. Disponível em: <https://controlepopular.com.br/noticias/itinga-transparencia-repasses-litio>.',
        'citacaoBibtex': '@article{onsa2026itinga,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Itinga: royalties da mineração de lítio, receitas da CFEM e fiscalização de gastos públicos},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/itinga-transparencia-repasses-litio}\n}',
        'metricas': [
            {'rotulo': 'CFEM Arrecadada (2024)', 'valor': 'R$ 9,28 mi'},
            {'rotulo': 'Maior Pagador CFEM', 'valor': 'Sigma Mineração (R$ 6,29 mi)'},
            {'rotulo': 'Orçamento Municipal (LOA)', 'valor': 'R$ 67,2 mi'},
            {'rotulo': 'Maior Despesa', 'valor': 'Educação (27,4%) e Saúde (24%)'}
        ],
        'recomendacaoVerificar': 'Entre na página de [Itinga](/itinga) no portal. Confira as despesas e contratos municipais no [Portal de Transparência de Itinga](https://itinga-mg.portaltp.com.br) e compare os repasses da CFEM com as obras públicas em andamento.',
        'paragrafos': [
            'Itinga é um município mineiro situado na porção média do Vale do Jequitinhonha, com cerca de 14.400 moradores e histórico de estiagens severas no semiárido. A partir de 2023, a cidade se consolidou como polo de extração de espodumênio - a rocha mineral rica em lítio utilizada na fabricação de baterias de veículos elétricos e tecnologias de transição energética.',
            'A expansão mineral gerou uma profunda alteração nas finanças municipais. Conforme registros oficiais da ANM - a Agência Nacional de Mineração -, a arrecadação da CFEM - a Compensação Financeira pela Exploração de Recursos Minerais - alcançou R$ 9.286.894,81 no exercício de 2024. A empresa Sigma Mineração S.A. foi a maior arrecadadora, respondendo por R$ 6.290.155,84 pelas operações minerais locais.',
            'A legislação federal (Lei 13.540/2017) estipula que o royalty mineral é repartido entre diversos entes públicos: 60% fica com o município produtor, 15% vai para cidades vizinhas impactadas pelas operações, 15% é repassado ao estado de Minas Gerais e 10% para órgãos federais. Além disso, a mesma guia de recolhimento da mineradora abrange terras limítrofes entre Itinga e Araçuaí, aparecendo integralmente nos dados de ambos os municípios - somar os dois números contaria a mesma operação duas vezes.',
            'No orçamento da Prefeitura de Itinga, fixado em R$ 67,2 milhões na LOA - a Lei Orçamentária Anual -, as despesas públicas se concentram em serviços sociais essenciais: a Educação absorve R$ 18,4 milhões (27,4% dos gastos) e a Saúde Pública consome R$ 16,1 milhões (24,0%). Obras públicas, drenagem e saneamento somam R$ 11,2 milhões (16,7%), enquanto a administração geral demanda R$ 8,5 milhões.',
            'No levantamento de compras públicas cadastradas no PNCP - o Portal Nacional de Contratações Públicas -, destacam-se contratos prioritários: obras de pavimentação asfáltica e drenagem pluvial urbana (R$ 4,75 milhões), transporte escolar rural para alunos de comunidades isoladas (R$ 2,38 milhões), aquisição de combustíveis para a frota e maquinário agrícola (R$ 1,85 milhão) e fornecimento de medicamentos para a rede do SUS (R$ 1,42 milhão).',
            'O desafio central da cidadania é garantir que os recursos extraordinários do lítio se convertam em patrimônio duradouro. Como os depósitos minerais são finitos, a aplicação dos royalties deve priorizar segurança hídrica, saneamento básico e capacitação educacional, impedindo que a exaustão das jazidas deixe a cidade desprovida de estrutura pública sustentável.'
        ]
    },
    'aracuai-contratos-desenvolvimento-vale': {
        'titulo': 'Araçuaí: arrecadação de CFEM, polo do Médio Jequitinhonha e os maiores contratos públicos',
        'subtitulo': 'Com R$ 6,36 milhões de CFEM arrecadada e orçamento de R$ 104 milhões, cidade equilibra demandas históricas de saúde e obras viárias.',
        'resumo': 'Investigação do portal aponta receitas minerais de Araçuaí, despesas em saúde e educação que somam mais de 55% do orçamento e os principais contratos cadastrados no PNCP.',
        'frente': 'cidades',
        'subfrente': 'Araçuaí — Vale do Jequitinhonha',
        'palavrasChave': [
            'aracuai',
            'litio-aracuai',
            'cfem-aracuai',
            'compras-publicas',
            'jequitinhonha',
            'pncp'
        ],
        'citacaoAbnt': 'ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Araçuaí: arrecadação de CFEM, polo do Médio Jequitinhonha e os maiores contratos públicos. Controle Popular, Brasília, set. 2026. Disponível em: <https://controlepopular.com.br/noticias/aracuai-contratos-desenvolvimento-vale>.',
        'citacaoBibtex': '@article{onsa2026aracuai,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Araçuaí: arrecadação de CFEM, polo do Médio Jequitinhonha e os maiores contratos públicos},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/aracuai-contratos-desenvolvimento-vale}\n}',
        'metricas': [
            {'rotulo': 'CFEM Arrecadada (2024)', 'valor': 'R$ 6,36 mi'},
            {'rotulo': 'Orçamento Municipal (LOA)', 'valor': 'R$ 104,5 mi'},
            {'rotulo': 'Gastos em Saúde e Educação', 'valor': '55,6% da LOA'},
            {'rotulo': 'Maior Contrato PNCP', 'valor': 'Rede Hospitalar (R$ 6,8 mi)'}
        ],
        'recomendacaoVerificar': 'Acesse o painel de [Araçuaí](/aracuai) no portal. Consulte a lista de contratos vigentes, ordens de fornecimento e despesas no [Portal da Transparência de Araçuaí](https://aracuai-mg.portaltp.com.br).',
        'paragrafos': [
            'Araçuaí é o polo econômico, comercial e de serviços de referência para o Médio Jequitinhonha, abrigando cerca de 34 mil moradores. A cidade centraliza atendimentos médicos de média e alta complexidade hospitalar e atua como entroncamento logístico regional.',
            'A implantação de complexos industriais de extração mineral de lítio na divisa territorial ampliou a receita tributária do município. Relatórios oficiais da ANM - a Agência Nacional de Mineração - mostram que a arrecadação de CFEM sobre a produção de Araçuaí somou R$ 6.367.403,35 em 2024, com R$ 6,29 milhões recolhidos pela Sigma Mineração S.A.',
            'O orçamento anual consolidado da Prefeitura de Araçuaí soma R$ 104,5 milhões na LOA. Mais da metade de todo o recurso arrecadado é canalizado diretamente para os serviços públicos fundamentais: a Saúde Municipal recebe R$ 29,4 milhões (28,1% do orçamento) e a Educação consome R$ 28,7 milhões (27,5%). Em seguida, Obras e Infraestrutura Urbana absorvem R$ 18,6 milhões (17,8%) para manutenção de ruas e redes de drenagem.',
            'O cruzamento de dados com o PNCP - o Portal Nacional de Contratações Públicas - revela que os maiores contratos vigentes firmados pelo município incluem: reformas estruturais e ampliação de leitos da rede hospitalar municipal (R$ 6,80 milhões), serviços regulares de coleta e destinação ambiental de resíduos sólidos urbanos (R$ 3,95 milhões), transporte escolar rural e interurbano (R$ 3,10 milhões) e locação de máquinas pesadas para abertura e recuperação de estradas vicinais no semiárido (R$ 2,45 milhões).',
            'Na página de [Araçuaí](/aracuai), o Controle Popular permite a qualquer cidadão fiscalizar o detalhamento dessas contratações públicas, assegurando que o aumento da receita de mineração atenda às demandas históricas de saneamento, abastecimento de água e saúde dos bairros e comunidades quilombolas do município.'
        ]
    },
    'sigma-lithium-jequitinhonha-mineracao': {
        'titulo': 'Sigma Lithium no Médio Jequitinhonha: royalties da mineração, outorgas de água e os dados de Itinga e Araçuaí',
        'subtitulo': 'Extração de lítio em rocha dura gera R$ 268 milhões em operações declaradas à ANM, enquanto comunidades cobram proteção hídrica.',
        'resumo': 'Relatório do ONSA analisa os dados oficiais da concessão mineral da Sigma Lithium no Médio Jequitinhonha, a arrecadação da CFEM e as outorgas na Bacia do Rio Jequitinhonha.',
        'frente': 'ambiental',
        'subfrente': 'Mineração & Transição Energética',
        'palavrasChave': [
            'sigma-lithium',
            'medio-jequitinhonha',
            'jequitinhonha',
            'cfem-mineracao',
            'itinga',
            'aracuai'
        ],
        'citacaoAbnt': 'ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Sigma Lithium no Médio Jequitinhonha: royalties da mineração, outorgas de água e os dados de Itinga e Araçuaí. Controle Popular, Brasília, set. 2026. Disponível em: <https://controlepopular.com.br/noticias/sigma-lithium-jequitinhonha-mineracao>.',
        'citacaoBibtex': '@article{onsa2026sigmalithium,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Sigma Lithium no Médio Jequitinhonha: royalties da mineração, outorgas de água e os dados de Itinga e Araçuaí},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/sigma-lithium-jequitinhonha-mineracao}\n}',
        'metricas': [
            {'rotulo': 'Operação Declarada 2024', 'valor': 'R$ 268,6 mi'},
            {'rotulo': 'CFEM Recolhida no Polo', 'valor': 'R$ 6,29 mi'},
            {'rotulo': 'Processos na ANM', 'valor': '112 ativos'},
            {'rotulo': 'Outorgas Hídricas', 'valor': 'Bacia do Jequitinhonha'}
        ],
        'recomendacaoVerificar': 'Confira os dados locais nas páginas de [Itinga](/itinga) e [Araçuaí](/aracuai). No [site da ANM](https://app.anm.gov.br), consulte a arrecadação da CFEM para saber quanto o município recebeu de royalties no mês passado.',
        'paragrafos': [
            'A instalação e expansão das plantas de lavra da mineradora Sigma Lithium no Médio Jequitinhonha projetou a mineração de lítio brasileira no mercado internacional de baterias elétricas. A atividade explora pegmatitos com espodumênio em uma área geológica localizada na fronteira territorial entre os municípios de Itinga e Araçuaí.',
            'Dados oficiais declarados nos sistemas de arrecadação da ANM - a Agência Nacional de Mineração - mostram que a Sigma Mineração S.A. registrou um valor total de operação mineral de R$ 268.606.086,50 no ano de 2024, gerando um recolhimento direto de R$ 6.290.155,84 em CFEM - a Compensação Financeira pela Exploração de Recursos Minerais. Por lei federal (Lei 13.540/2017), 60% desse valor é repassado aos cofres municipais.',
            'O Controle Popular registra uma relevante ressalva metodológica apurada nos dados públicos: a mesma guia de recolhimento da Sigma aparece duplicada de forma integral nos relatórios da ANM tanto em Itinga quanto em Araçuaí, em razão de o processo mineral abranger ambos os municípios sem repartição contábil prévia na fonte federal. Por essa razão, somar a arrecadação de ambas as cidades distorce o valor total.',
            'No campo socioambiental, o ONSA - Observatório Nacional Socioambiental - acompanha com rigor os processos de licenciamento na SEMAD - a Secretaria de Meio Ambiente de Minas Gerais. O monitoramento examina especialmente as outorgas concedidas pelo IGAM para uso de recursos hídricos na Bacia do Rio Jequitinhonha, em um ecossistema semiárido sensível a secas cíclicas, além de fiscalizar o modelo de empilhamento de rejeitos a seco.',
            'Os moradores da região podem fiscalizar o fluxo de compras públicas, arrecadação e destinação de royalties acessando diretamente as páginas de [Itinga](/itinga) e [Araçuaí](/aracuai) no portal.'
        ]
    },
    'betim-contratos-compras-publicas': {
        'titulo': 'Betim: orçamento de R$ 3,4 bilhões, compras públicas de R$ 1,2 bilhão e maiores contratos no PNCP',
        'subtitulo': 'Polo industrial metropolitano investe R$ 980 milhões em saúde e R$ 720 milhões em educação, com alertas para concentração de fornecedores.',
        'resumo': 'Radiografia das finanças de Betim detalha a arrecadação tributária, os gastos nas principais secretarias e os maiores contratos públicos da gestão municipal.',
        'frente': 'cidades',
        'subfrente': 'Betim — Indústria & Compras Públicas',
        'palavrasChave': [
            'betim',
            'orcamento-betim',
            'contratos-betim',
            'compras-publicas-betim',
            'saude-betim',
            'pncp'
        ],
        'citacaoAbnt': 'ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Betim: orçamento de R$ 3,4 bilhões, compras públicas de R$ 1,2 bilhão e maiores contratos no PNCP. Controle Popular, Brasília, set. 2026. Disponível em: <https://controlepopular.com.br/noticias/betim-contratos-compras-publicas>.',
        'citacaoBibtex': '@article{onsa2026betim,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Betim: orçamento de R$ 3,4 bilhões, compras públicas de R$ 1,2 bilhão e maiores contratos no PNCP},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/betim-contratos-compras-publicas}\n}',
        'metricas': [
            {'rotulo': 'Orçamento Total (LOA)', 'valor': 'R$ 3,4 bi'},
            {'rotulo': 'Despesa em Saúde', 'valor': 'R$ 980 mi (28,8%)'},
            {'rotulo': 'Despesa em Educação', 'valor': 'R$ 720 mi (21,2%)'},
            {'rotulo': 'Contratos no PNCP', 'valor': '1.200+ contratos'}
        ],
        'recomendacaoVerificar': 'Acesse a página de [Contratos de Betim](/betim/prefeitura/contratos) no portal. Para conferir pagamentos por fornecedor, utilize a ferramenta de [Fornecedores](/betim/prefeitura/fornecedores) e faça busca textual no [Diário Oficial](/betim/prefeitura/diario).',
        'paragrafos': [
            'O município de Betim, na Região Metropolitana de Belo Horizonte, sedia um dos maiores parques industriais e automotivos do país. O orçamento público da cidade, fixado pela LOA - a Lei Orçamentária Anual -, atinge R$ 3,4 bilhões, alimentado pela quota-parte do ICMS industrial, pelo ISSQN e pela receita corrente do tesouro.',
            'A análise das despesas públicas municipais demonstra que a Saúde Pública é a área que mais absorve recursos: consome R$ 980 milhões (28,8% do orçamento anual). Os investimentos sustentam o Hospital Público Regional de Betim, o Centro Materno-Infantil, unidades de pronto atendimento e uma rede de 36 centros de saúde da família. Em segundo lugar, a pasta da Educação recebe R$ 720 milhões (21,2%), atendendo escolas municipais e creches.',
            'Na área de Obras e Infraestrutura Urbana, a administração destina R$ 450 milhões (13,2%) para manutenção de corredores industriais e canalizações de contenção de inundações. Já a coleta de lixo, varrição e destinação final de resíduos pela limpeza urbana somam R$ 185 milhões anuais.',
            'No [PNCP](https://pncp.gov.br), o Controle Popular mapeou mais de 1.200 contratos vigentes que ultrapassam R$ 1,2 bilhão em empenhos. Entre os maiores contratos constam: gestão complementar de equipes e serviços médicos hospitalares (R$ 84,2 milhões), obras de recapeamento asfáltico e manutenção da malha viária (R$ 52,4 milhões), destinação e transbordo de resíduos domiciliares (R$ 38,7 milhões) e locação de frotas e transporte escolar (R$ 26,5 milhões).',
            'O morador pode auditar todos esses números na rota [Betim](/betim), navegando pelos indicadores de atenção, dispensas de licitação e fornecedores que concentram maior fatia das contratações públicas.'
        ]
    },
    'belo-horizonte-contratos-orcamento-capital': {
        'titulo': 'Belo Horizonte: orçamento de R$ 19,4 bilhões, 6.800 contratos no PNCP e despesas por setor',
        'subtitulo': 'Capital mineira aplica R$ 5,8 bilhões em saúde e R$ 3,1 bilhões em educação, com auditoria aberta de contratos e obras de prevenção de enchentes.',
        'resumo': 'Levantamento orçamentário e fiscal da capital mineira mapeia R$ 19,4 bilhões em receitas, detalha gastos por função e destaca as maiores contratações no PNCP.',
        'frente': 'cidades',
        'subfrente': 'Belo Horizonte — Orçamento da Capital',
        'palavrasChave': [
            'belo-horizonte',
            'orcamento-bh',
            'contratos-bh',
            'pncp-bh',
            'saude-bh',
            'drenagem-bh'
        ],
        'citacaoAbnt': 'ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Belo Horizonte: orçamento de R$ 19,4 bilhões, 6.800 contratos no PNCP e despesas por setor. Controle Popular, Brasília, set. 2026. Disponível em: <https://controlepopular.com.br/noticias/belo-horizonte-contratos-orcamento-capital>.',
        'citacaoBibtex': '@article{onsa2026bh,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Belo Horizonte: orçamento de R$ 19,4 bilhões, 6.800 contratos no PNCP e despesas por setor},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/belo-horizonte-contratos-orcamento-capital}\n}',
        'metricas': [
            {'rotulo': 'Orçamento Total (LOA)', 'valor': 'R$ 19,4 bi'},
            {'rotulo': 'Despesa em Saúde', 'valor': 'R$ 5,8 bi (29,9%)'},
            {'rotulo': 'Despesa em Educação', 'valor': 'R$ 3,1 bi (16,0%)'},
            {'rotulo': 'Contratos no PNCP', 'valor': '6.800+ registros'}
        ],
        'recomendacaoVerificar': 'Abra a seção [Belo Horizonte](/bh) no portal. Explore os contratos vigentes da prefeitura da capital cadastrados no PNCP e fiscalize os empenhos das secretarias de Saúde, Educação e Obras.',
        'paragrafos': [
            'Belo Horizonte opera com um orçamento anual de R$ 19,4 bilhões fixado na LOA - a Lei Orçamentária Anual -, liderando com folga o volume de recursos públicos municipais no estado. A arrecadação municipal é impulsionada pelo setor terciário e de tecnologia, com destaque para a arrecadação de ISSQN e tributos prediais urbanos.',
            'A aplicação das receitas públicas prioriza a Saúde Municipal, que recebe R$ 5,8 bilhões (29,9% de todo o orçamento da capital). A dotação financia a infraestrutura do Hospital Metropolitano Odilon Behrens, as 9 Unidades de Pronto Atendimento (UPAs 24h) e 152 Centros de Saúde espalhados pelas nove regiões da cidade. O segundo maior setor é a Educação, com R$ 3,1 bilhões (16,0%), voltados ao ensino fundamental e às EMEIs infantis.',
            'Na pasta de Obras, Urbanização e Habitação, o município aplica R$ 2,4 bilhões (12,4%), com ênfase na execução de bacias de retenção e alargamento de galerias fluviais contra inundações nas bacias dos córregos Arrudas e Onça. A mobilidade urbana e transportes (BHTRANS e SUMOB) representam R$ 1,2 bilhão.',
            'Na auditoria do PNCP, o portal localizou 6.840 contratações públicas catalogadas. Os principais contratos envolvem: operação e apoio médico hospitalar (R$ 112 milhões), limpeza urbana, coleta de resíduos e operação de aterro sanitário pela SLU (R$ 96 milhões) e obras civis de macrodrenagem e contenção de encostas (R$ 88 milhões).',
            'O acervo completo de contratações de Belo Horizonte pode ser consultado abertamente no portal na rota [Belo Horizonte](/bh).'
        ]
    },
    'diamantina-diario-oficial-atos-contratos': {
        'titulo': 'Diamantina: 16.601 atos oficiais catalogados, orçamento de R$ 168 milhões e contratos públicos',
        'subtitulo': 'Série histórica de 80 meses analisa diários oficiais, receitas minerais de R$ 769 mil e destinação de recursos na cidade histórica.',
        'resumo': 'Estudo detalha 16 mil atos normativos de Diamantina, gastos prioritários em saúde e educação e contratos de conservação do patrimônio histórico.',
        'frente': 'cidades',
        'subfrente': 'Diamantina — Patrimônio & Gestão',
        'palavrasChave': [
            'diamantina',
            'diario-oficial-diamantina',
            'sigpub-amm',
            'contratos-diamantina',
            'patrimonio-jequitinhonha',
            'cfem-diamantina'
        ],
        'citacaoAbnt': 'ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Diamantina: 16.601 atos oficiais catalogados, orçamento de R$ 168 milhões e contratos públicos. Controle Popular, Brasília, set. 2026. Disponível em: <https://controlepopular.com.br/noticias/diamantina-diario-oficial-atos-contratos>.',
        'citacaoBibtex': '@article{onsa2026diamantinadiario,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Diamantina: 16.601 atos oficiais catalogados, orçamento de R$ 168 milhões e contratos públicos},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/diamantina-diario-oficial-atos-contratos}\n}',
        'metricas': [
            {'rotulo': 'Atos Oficiais Catalogados', 'valor': '16.601 atos'},
            {'rotulo': 'Orçamento Total (LOA)', 'valor': 'R$ 168,0 mi'},
            {'rotulo': 'CFEM Arrecadada (2024)', 'valor': 'R$ 769,6 mil'},
            {'rotulo': 'Despesa Saúde e Educação', 'valor': '55,1% da LOA'}
        ],
        'recomendacaoVerificar': 'Consulte o painel de [Diamantina](/diamantina) no portal. Para localizar uma nomeação ou extrato de contrato antigo, use o mecanismo de busca textual no [Diário Oficial de Diamantina](/diamantina/diario-oficial).',
        'paragrafos': [
            'Diamantina, patrimônio histórico mundial situado no Alto Jequitinhonha, conta com uma série temporal inédita de 16.601 atos oficiais organizados pelo Controle Popular ao longo de 80 meses de publicações contínuas (2020 a 2026). A base monitora simultaneamente os atos da Prefeitura e da Câmara Municipal veiculados pelo sistema SIGPub da AMM-MG.',
            'O orçamento do município, aprovado na LOA em cerca de R$ 168 milhões, tem seus maiores desembolsos concentrados em duas áreas essenciais: a Saúde Pública recebe R$ 48,5 milhões (28,8% do orçamento) e a Educação consome R$ 44,2 milhões (26,3%). Obras e infraestrutura viária absorvem R$ 21,3 milhões (12,7%), enquanto a pasta de Cultura, Turismo e Patrimônio Histórico conta com R$ 14,8 milhões (8,8%).',
            'Na mineração, dados oficiais da ANM registram que a CFEM arrecadada no município somou R$ 769.617,10 no exercício de 2024. A empresa Toledo Mineração Ltda foi a maior pagadora de royalties, respondendo por R$ 208.308,18.',
            'No portal PNCP, foram identificadas as principais contratações da cidade: restauração e conservação de calçamento histórico de pedras e casario tombado (R$ 5,2 milhões), coleta e manejo ambiental de resíduos sólidos (R$ 4,1 milhões), transporte escolar rural distrital (R$ 2,8 milhões) e fornecimento de insumos farmacêuticos para a rede SUS (R$ 2,2 milhões).',
            'Toda a documentação pode ser pesquisada por palavras-chave na página do [Diário Oficial de Diamantina](/diamantina/diario-oficial) e no painel [Diamantina](/diamantina).'
        ]
    }
}

atualizadas_count = 0
for n in noticias:
    slug = n.get('slug')
    if slug in NOTICIAS_ATUALIZADAS:
        dados = NOTICIAS_ATUALIZADAS[slug]
        n.update(dados)
        atualizadas_count += 1

print(f'Noticias atualizadas no json: {atualizadas_count}')

with open(PORTAL_JSON, 'w', encoding='utf-8') as f:
    json.dump(noticias, f, ensure_ascii=False, indent=2)

print('apps/web/data/noticias-portal.json salvo com sucesso!')
