# -*- coding: utf-8 -*-
"""
Gera 10 posts do blog do Controle Popular por subfrente, cobrindo os
quatro eixos. O Eixo 2 (Direitos em Movimento) nao tinha post algum.

Regras do dono (04/10/2026):
1. Cada post tem no minimo 3 paragrafos.
2. Cada frase individual tem ate 15 palavras.
3. Hiperlink direto SOBRE O TEXTO para a fonte oficial especifica.
4. Numero sempre vem do dado, com a data da fonte (AGENTS.md secao 7).
5. Titulo em portugues: maiuscula so na primeira palavra e em nome proprio.

Fontes e medicao (04/10/2026):
- CNES/DATASUS        apps/web/data/cnes-mg.json        (coleta 06/09/2026)
- INEP                apps/web/data/educacao-inep-mg.json (IDEB 2021)
- MTE                 apps/web/data/trabalho/cadastro-empregadores-mte.json (28/09/2026)
- Conselhos           apps/web/data/conselhos-direitos.json (710)
- LAI/CGU             apps/web/data/canais-informacao-lai.json (08/09/2026)
- ANM/satelite        apps/web/data/cavas-evidencias-mg.json (30/09/2026)
- Repasse Brumadinho  apps/web/public/data/repasse-brumadinho-mg.json (fonte 11/08/2026)
- Convenios           apps/web/public/data/convenios-ambientais-mg.json
- BCB SGS             apps/web/data/series-economicas-bcb.json (19/09/2026)
- Biblioteca          apps/web/data/biblioteca-unificada.json (01/10/2026)
"""

import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARQUIVO_NOTICIAS = Path("apps/web/data/noticias-portal.json")
DATA_PUBLICACAO = "2026-10-04T12:00:00Z"
AUTOR = "ONSA — Observatório Nacional Socioambiental"

POSTS = [
    # --- 1. SAUDE / SUS (Eixo 2) -------------------------------
    {
        "slug": "rede-sus-estabelecimentos-minas-cnes",
        "titulo": "Minas Gerais tem 78.329 estabelecimentos de saúde no cadastro do SUS",
        "subtitulo": "O CNES registra a rede pública e privada que atende pelo SUS nos 853 municípios.",
        "resumo": "O Cadastro Nacional de Estabelecimentos de Saúde reúne hospitais, clínicas, laboratórios e postos de Minas Gerais. O dado permite comparar a rede de cada município.",
        "categoria": "Relatório Técnico",
        "frente": "direitos",
        "subfrente": "Saúde Pública & SUS",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do CNES e do DATASUS, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 4,
        "palavrasChave": ["saude", "sus", "cnes", "datasus", "leitos", "minas-gerais"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Minas Gerais tem 78.329 estabelecimentos de saúde no cadastro do SUS. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026redeSUS,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Minas Gerais tem 78.329 estabelecimentos de saúde no cadastro do SUS},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/rede-sus-estabelecimentos-minas-cnes}\n}",
        "fontesOficiais": [
            {"nome": "CNES — Cadastro Nacional de Estabelecimentos de Saúde", "url": "https://cnes.datasus.gov.br/"},
            {"nome": "DATASUS — Sistemas de Informação em Saúde", "url": "https://datasus.saude.gov.br/"}
        ],
        "metricas": [
            {"rotulo": "Estabelecimentos em MG", "valor": "78.329"},
            {"rotulo": "Leitos SUS por mil hab. em BH", "valor": "2,45"},
            {"rotulo": "Estabelecimentos em BH", "valor": "1.280"},
            {"rotulo": "Leitos no Hospital Regional de Betim", "valor": "340"}
        ],
        "recomendacaoVerificar": "Compare a rede da sua cidade no [painel de saúde pública](/direitos-em-movimento/saude-publica) e consulte o número vivo no [CNES](https://cnes.datasus.gov.br/).",
        "paragrafos": [
            "O [CNES](https://cnes.datasus.gov.br/) registra 78.329 estabelecimentos de saúde em Minas Gerais. A coleta ocorreu em 06/09/2026 na base oficial do Ministério da Saúde. A lista reúne hospitais, clínicas, laboratórios e postos. Cada unidade traz endereço, gestão e tipo de atendimento no cadastro.",
            "Em Belo Horizonte, o cadastro reúne 1.280 estabelecimentos de saúde. A cidade conta com 2,45 leitos do SUS por mil habitantes. A Organização Mundial da Saúde recomenda entre 2,5 e 3,0 leitos. Em Betim, o Hospital Regional mantém 340 leitos ativos, segundo o [CNES](https://cnes.datasus.gov.br/).",
            "O leitor pode comparar a rede de cada cidade no [painel de saúde](/direitos-em-movimento/saude-publica). Os dados por município também aparecem no [perfil de Betim](/betim). A consulta ajuda a cobrar leitos, exames e atendimento na rede pública."
        ]
    },

    # --- 2. EDUCACAO / IDEB (Eixo 2) ---------------------------
    {
        "slug": "ideb-media-municipios-minas-inep",
        "titulo": "IDEB de treze cidades mineiras tem média 5,53 nos anos iniciais",
        "subtitulo": "Nos anos finais, a média cai para 4,30, segundo os dados do INEP.",
        "resumo": "O portal reuniu indicadores do IDEB, do Censo Escolar e do IBGE para treze municípios de Minas. Os dados mostram a distância entre os anos iniciais e finais.",
        "categoria": "Relatório Técnico",
        "frente": "direitos",
        "subfrente": "Educação Básica",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do IDEB e do Censo Escolar do INEP, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 4,
        "palavrasChave": ["educacao", "ideb", "inep", "escolas", "minas-gerais"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. IDEB de treze cidades mineiras tem média 5,53 nos anos iniciais. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026idebMG,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {IDEB de treze cidades mineiras tem média 5,53 nos anos iniciais},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/ideb-media-municipios-minas-inep}\n}",
        "fontesOficiais": [
            {"nome": "INEP — Índice de Desenvolvimento da Educação Básica (IDEB)", "url": "https://ideb.inep.gov.br/"},
            {"nome": "INEP — Censo Escolar da Educação Básica", "url": "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados"}
        ],
        "metricas": [
            {"rotulo": "IDEB médio — anos iniciais", "valor": "5,53"},
            {"rotulo": "IDEB médio — anos finais", "valor": "4,30"},
            {"rotulo": "Menor IDEB dos anos iniciais", "valor": "5,2"},
            {"rotulo": "Maior IDEB dos anos iniciais", "valor": "5,9"}
        ],
        "recomendacaoVerificar": "Confira a nota da sua escola no [portal do IDEB](https://ideb.inep.gov.br/) e acompanhe a subfrente de [educação](/direitos-em-movimento/educacao).",
        "paragrafos": [
            "O portal reuniu indicadores de educação de treze municípios mineiros. A média do [IDEB](https://ideb.inep.gov.br/) nos anos iniciais ficou em 5,53. As notas variam de 5,2 a 5,9 entre as cidades analisadas. Os dados vêm do INEP, com apoio do [Censo Escolar](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados).",
            "O desempenho cai quando o aluno avança para os anos finais. A média nessa etapa ficou em 4,30 entre os municípios. O intervalo vai de 4,0 a 4,6 nas cidades com dados completos. A queda indica a necessidade de reforço no segundo ciclo do fundamental.",
            "A comparação ajuda famílias e conselhos a cobrar melhorias. O leitor pode seguir os detalhes na subfrente de [educação](/direitos-em-movimento/educacao). Também vale cruzar com a infraestrutura escolar no [perfil de cada cidade](/cidades)."
        ]
    },

    # --- 3. TRABALHO (Eixo 2) ----------------------------------
    {
        "slug": "cadastro-empregadores-trabalho-escravo-mte",
        "titulo": "181 empresas entram em cadastro de trabalho análogo ao escravo",
        "subtitulo": "A lista do MTE reúne 190 registros e 1.867 trabalhadores em 23 estados.",
        "resumo": "O Cadastro de Empregadores do Ministério do Trabalho e Emprego expõe empresas autuadas por trabalho análogo à escravidão. O portal detalha os registros por estado.",
        "categoria": "Investigação Cívica",
        "frente": "direitos",
        "subfrente": "Trabalho e Renda",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do Cadastro de Empregadores do MTE, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 4,
        "palavrasChave": ["trabalho", "trabalho-escravo", "mte", "empregadores", "direitos-humanos"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. 181 empresas entram em cadastro de trabalho análogo ao escravo. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026trabalhoEscravo,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {181 empresas entram em cadastro de trabalho análogo ao escravo},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/cadastro-empregadores-trabalho-escravo-mte}\n}",
        "fontesOficiais": [
            {"nome": "MTE — Cadastro de Empregadores (Portaria Interministerial nº 18/2024)", "url": "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-escravo"}
        ],
        "metricas": [
            {"rotulo": "Registros no cadastro", "valor": "190"},
            {"rotulo": "Empresas autuadas", "valor": "181"},
            {"rotulo": "Trabalhadores envolvidos", "valor": "1.867"},
            {"rotulo": "Estados com registros", "valor": "23"}
        ],
        "recomendacaoVerificar": "Consulte a lista e a metodologia no [Cadastro de Empregadores do MTE](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-escravo).",
        "paragrafos": [
            "O [Cadastro de Empregadores](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-escravo) tem 190 registros em Minas e no país. Os dados foram atualizados em 28/09/2026 pelo Ministério do Trabalho. A lista reúne 181 empresas e 1.867 trabalhadores envolvidos. Os casos aparecem em 23 estados brasileiros.",
            "A inclusão no cadastro é ato administrativo do ministério. Cada ficha traz o estabelecimento, o número de trabalhadores e o CNAE. A empresa pode contestar a decisão na Justiça. O cadastro funciona como alerta para compradores e bancos.",
            "O leitor pode acompanhar o tema na subfrente de [trabalho e renda](/direitos-em-movimento/trabalho-e-renda). Os dados ajudam a cobrar fiscalização e reparação às vítimas. Também orientam quem compra de fornecedores suspeitos."
        ]
    },

    # --- 4. CONSELHOS DE DIREITOS (Eixo 2) ---------------------
    {
        "slug": "conselhos-direitos-politicas-publicas",
        "titulo": "710 conselhos de direitos fiscalizam políticas públicas no país",
        "subtitulo": "Quase seis em cada dez estão na esfera municipal, segundo o acervo do portal.",
        "resumo": "O portal mapeou 710 conselhos de direitos no país, com a categoria e a esfera de cada um. Os conselhos são a porta de entrada da participação popular.",
        "categoria": "Relatório Técnico",
        "frente": "direitos",
        "subfrente": "Conselhos de Direitos",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do acervo de conselhos do portal, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 3,
        "palavrasChave": ["conselhos", "participacao-popular", "controle-social", "direitos", "saude"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. 710 conselhos de direitos fiscalizam políticas públicas no país. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026conselhos,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {710 conselhos de direitos fiscalizam políticas públicas no país},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/conselhos-direitos-politicas-publicas}\n}",
        "fontesOficiais": [
            {"nome": "Ministério dos Direitos Humanos e da Cidadania", "url": "https://www.gov.br/mdh/pt-br"},
            {"nome": "Conselhos de Direitos — acervo do Portal Controle Popular", "url": "https://controlepopular.com.br/direitos-em-movimento/conselhos"}
        ],
        "metricas": [
            {"rotulo": "Conselhos mapeados", "valor": "710"},
            {"rotulo": "Esfera municipal", "valor": "597"},
            {"rotulo": "Esfera estadual", "valor": "108"},
            {"rotulo": "Esfera federal", "valor": "5"}
        ],
        "recomendacaoVerificar": "Encontre o conselho da sua cidade no [painel de conselhos](/direitos-em-movimento/conselhos) e acompanhe a subfrente de [trabalho e participação](/direitos-em-movimento/conselhos).",
        "paragrafos": [
            "O portal mapeou 710 conselhos de direitos em todo o país. Desses, 597 atuam na esfera municipal e 108 na estadual. Apenas 5 conselhos são federais, segundo o acervo. A [subfrente de conselhos](/direitos-em-movimento/conselhos) reúne o contato de cada um.",
            "A saúde e o meio ambiente lideram, com 227 conselhos cada. Na sequência aparecem os conselhos de criança e adolescente. Eles fiscalizam repasses, aprovam planos e acompanham políticas públicas. A participação popular é a porta de entrada do controle social.",
            "O leitor pode localizar o conselho da sua cidade no [painel](/direitos-em-movimento/conselhos). O contato ajuda a cobrar reuniões e decisões públicas. A ausência de conselho ativo também é um alerta para o cidadão."
        ]
    },

    # --- 5. CANAIS LAI (Eixo 2) --------------------------------
    {
        "slug": "canais-pedido-informacao-lai-portal",
        "titulo": "Portal mapeia 445 canais de pedido de informação pública",
        "subtitulo": "São 199 prefeituras, 199 câmaras e 26 concessionárias com atendimento próprio.",
        "resumo": "O portal reuniu 445 canais de acesso à informação no país, com endereço e categoria. A Lei de Acesso à Informação garante resposta em até 20 dias.",
        "categoria": "Relatório Técnico",
        "frente": "direitos",
        "subfrente": "Canais de Informação (LAI)",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do Fala.BR e do acervo do portal, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 3,
        "palavrasChave": ["lai", "acesso-a-informacao", "transparencia", "cgu", "fala-br"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Portal mapeia 445 canais de pedido de informação pública. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026lai,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Portal mapeia 445 canais de pedido de informação pública},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/canais-pedido-informacao-lai-portal}\n}",
        "fontesOficiais": [
            {"nome": "Fala.BR — Plataforma de Acesso à Informação (CGU)", "url": "https://falabr.cgu.gov.br/"},
            {"nome": "Lei nº 12.527/2011 — Lei de Acesso à Informação", "url": "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm"}
        ],
        "metricas": [
            {"rotulo": "Canais mapeados", "valor": "445"},
            {"rotulo": "Prefeituras", "valor": "199"},
            {"rotulo": "Câmaras municipais", "valor": "199"},
            {"rotulo": "Concessionárias", "valor": "26"}
        ],
        "recomendacaoVerificar": "Use a [plataforma Fala.BR](https://falabr.cgu.gov.br/) para registrar um pedido e veja os canais em [informação](/direitos-em-movimento/informacao).",
        "paragrafos": [
            "O portal reuniu 445 canais de acesso à informação no país. A lista inclui 199 prefeituras e 199 câmaras municipais. Outros 14 canais são de órgãos federais, segundo a coleta. Os dados foram organizados em 08/09/2026 a partir do [Fala.BR](https://falabr.cgu.gov.br/).",
            "As concessionárias de água, luz e telefonia somam 26 canais próprios. Em Minas Gerais, o portal lista 43 canais de pedido. A [Lei de Acesso à Informação](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm) garante resposta em até 20 dias. O prazo pode ser prorrogado por mais 10 dias.",
            "O leitor pode encontrar o canal do seu município no [painel de informação](/direitos-em-movimento/informacao). O pedido é gratuito e não exige justificativa. A resposta vira documento público para toda a comunidade."
        ]
    },

    # --- 6. CAVAS (Eixo 1) -------------------------------------
    {
        "slug": "cavas-mineracao-sem-cadastro-satelite-mg",
        "titulo": "Satélite encontra 3.869 áreas de mineração sem cadastro em MG",
        "subtitulo": "O cruzamento testa cada polígono contra unidades de conservação e quilombos.",
        "resumo": "O portal cruza imagens de satélite com a base da ANM para achar cavas e áreas sem cadastro em Minas Gerais. O número é um piso, não o total do estado.",
        "categoria": "Investigação Cívica",
        "frente": "terra",
        "subfrente": "Cavas de Mineração",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir de imagens de satélite e da base da ANM, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 4,
        "palavrasChave": ["mineracao", "cavas", "satelite", "anm", "unidade-conservacao", "quilombola"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Satélite encontra 3.869 áreas de mineração sem cadastro em MG. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026cavas,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Satélite encontra 3.869 áreas de mineração sem cadastro em MG},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/cavas-mineracao-sem-cadastro-satelite-mg}\n}",
        "fontesOficiais": [
            {"nome": "ANM — Agência Nacional de Mineração (SIGMINE)", "url": "https://sigmine.dnpm.gov.br/"},
            {"nome": "MapBiomas — Mapeamento anual da cobertura do solo", "url": "https://mapbiomas.org/"}
        ],
        "metricas": [
            {"rotulo": "Mineração sem cadastro", "valor": "3.869"},
            {"rotulo": "Cavas monitoradas", "valor": "3.799"},
            {"rotulo": "Em unidade de conservação", "valor": "431"},
            {"rotulo": "Em território quilombola", "valor": "18"}
        ],
        "recomendacaoVerificar": "Veja o mapa e a metodologia na página de [cavas de mineração](/mineracao/cavas). O número é um piso, não o total de Minas.",
        "paragrafos": [
            "O cruzamento de satélite achou 3.869 áreas de mineração sem cadastro na [ANM](https://sigmine.dnpm.gov.br/). O estudo também monitora 3.799 cavas já conhecidas em Minas Gerais. A análise foi gerada em 30/09/2026 pelo observatório. O número é um piso, não o total do estado.",
            "Das áreas monitoradas, 431 ficam dentro de unidades de conservação. Outras 18 estão em territórios quilombolas, segundo o teste. O método usa o centro do polígono sobre imagens de satélite. Terreno que só encosta na área protegida não entra na conta.",
            "O leitor pode ver o mapa completo na página de [cavas de mineração](/mineracao/cavas). O dado ajuda comunidades a cobrar fiscalização e licença. A ausência de cadastro não prova atividade irregular por si só."
        ]
    },

    # --- 7. REPASSE DO ACORDO DA VALE (Eixo 1, pedido do dono)
    {
        "slug": "repasse-acordo-vale-853-municipios-minas",
        "titulo": "Acordo da Vale repassa R$ 1,64 bilhão aos 853 municípios de Minas",
        "subtitulo": "Belo Horizonte e Contagem lideram; receber não significa ter sido atingido.",
        "resumo": "O rateio do Acordo de Reparação de Brumadinho distribuiu R$ 1,64 bilhão a todos os municípios mineiros. A lista traz o valor por cidade e mais 361 repasses complementares.",
        "categoria": "Investigação Cívica",
        "frente": "paraopeba",
        "subfrente": "Reparação & Mercado Financeiro",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir da página do Governo de MG e do acervo do portal, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 5,
        "palavrasChave": ["paraopeba", "brumadinho", "repasse", "acordo-judicial", "vale", "reparacao"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Acordo da Vale repassa R$ 1,64 bilhão aos 853 municípios de Minas. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026repasseVale,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Acordo da Vale repassa R$ 1,64 bilhão aos 853 municípios de Minas},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/repasse-acordo-vale-853-municipios-minas}\n}",
        "fontesOficiais": [
            {"nome": "Governo de MG — Repasses aos 853 municípios (Pró-Brumadinho)", "url": "https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-repasses-aos-853-municipios-de-mg"},
            {"nome": "FGV — Projeto Rio Paraopeba (saldo dos municípios)", "url": "https://www18.fgv.br/projetorioparaopeba/acompanhamento-saldo-municipios.html"}
        ],
        "metricas": [
            {"rotulo": "Total repassado aos 853", "valor": "R$ 1,64 bi"},
            {"rotulo": "Maior valor (Belo Horizonte)", "valor": "R$ 50 mi"},
            {"rotulo": "Contagem", "valor": "R$ 31 mi"},
            {"rotulo": "Brumadinho", "valor": "R$ 2,5 mi"}
        ],
        "recomendacaoVerificar": "Consulte o valor da sua cidade no [acervo do Paraopeba](/paraopeba) e a lista oficial no [Governo de MG](https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-repasses-aos-853-municipios-de-mg).",
        "paragrafos": [
            "O Acordo de Reparação de Brumadinho repassou R$ 1,64 bilhão aos municípios de Minas. O rateio principal alcançou as 853 cidades, segundo o [Governo de MG](https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-repasses-aos-853-municipios-de-mg). O dado foi atualizado na fonte em 11/08/2026. A lista do portal traz o valor de cada município.",
            "Belo Horizonte recebeu o maior valor, de R$ 50 milhões. Contagem aparece com R$ 31 milhões e Uberlândia com R$ 30 milhões. Betim e Divinópolis ficaram com R$ 15 milhões cada. Brumadinho, epicentro do crime, consta com R$ 2,5 milhões.",
            "Receber o rateio não significa ter sido atingido pela lama. Dos 853 municípios, 827 não têm relação com a bacia. A tela do portal mostra a população ao lado do valor recebido. O leitor pode acompanhar tudo no [acervo do Paraopeba](/paraopeba).",
            "Nos 26 municípios da bacia, a execução corrigida passa de R$ 5,4 bilhões. O dado do [Projeto Rio Paraopeba](https://www18.fgv.br/projetorioparaopeba/acompanhamento-saldo-municipios.html) é de 16/09/2026. Em março de 2026, cerca de R$ 91 milhões foram a 21 prefeituras. O acumulado às prefeituras passa de R$ 2,7 bilhões."
        ]
    },

    # --- 8. CONVENIOS AMBIENTAIS (Eixo 3) ----------------------
    {
        "slug": "convenios-ambientais-minas-semad",
        "titulo": "870 convênios ambientais somam R$ 477 milhões em Minas",
        "subtitulo": "A SEMAD responde por 688 deles; outros 415 tiveram o prazo prorrogado.",
        "resumo": "O portal reuniu 870 convênios ambientais de Minas, com valor, órgão e prazo. A lista mostra quanto o estado prometeu gastar e quantos acordos foram adiados.",
        "categoria": "Relatório Técnico",
        "frente": "estado",
        "subfrente": "Convênios Federais",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do portal de convênios e transparência de MG, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 4,
        "palavrasChave": ["convenios", "meio-ambiente", "semad", "orcamento", "transparencia"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. 870 convênios ambientais somam R$ 477 milhões em Minas. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026convenios,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {870 convênios ambientais somam R$ 477 milhões em Minas},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/convenios-ambientais-minas-semad}\n}",
        "fontesOficiais": [
            {"nome": "Portal de Convênios e Parcerias de Minas Gerais", "url": "https://www.transparencia.mg.gov.br/"},
            {"nome": "SEMAD — Secretaria de Estado de Meio Ambiente (MG)", "url": "https://semad.mg.gov.br/"}
        ],
        "metricas": [
            {"rotulo": "Convênios mapeados", "valor": "870"},
            {"rotulo": "Valor somado", "valor": "R$ 477,4 mi"},
            {"rotulo": "Municípios envolvidos", "valor": "373"},
            {"rotulo": "Prazos prorrogados", "valor": "415"}
        ],
        "recomendacaoVerificar": "Veja os convênios por órgão e ano no [painel de convênios](/ambiental/convenios) e confira o dado na [transparência de MG](https://www.transparencia.mg.gov.br/).",
        "paragrafos": [
            "O portal reuniu 870 convênios ambientais firmados em Minas Gerais. O valor somado chega a R$ 477,4 milhões, segundo o acervo. Os acordos envolvem 373 municípios do estado. A [SEMAD](https://semad.mg.gov.br/) responde por 688 deles.",
            "O Instituto Estadual de Florestas assina 107 convênios, e o IGAM, 48. Outros 27 ficam com a Fundação Estadual do Meio Ambiente. Ao todo, 415 acordos tiveram o prazo prorrogado. Isso indica projetos que demoraram mais do que o previsto.",
            "O leitor pode filtrar os convênios por órgão e por ano no [painel](/ambiental/convenios). O dado ajuda a cobrar a execução das obras prometidas. A lista completa está na [transparência de MG](https://www.transparencia.mg.gov.br/)."
        ]
    },

    # --- 9. INDICADORES MACROECONOMICOS (Eixo 3) ---------------
    {
        "slug": "ipca-selic-dolar-orcamento-banco-central",
        "titulo": "IPCA, Selic e dólar: os números que mexem no orçamento",
        "subtitulo": "As séries do Banco Central mostram a inflação e os juros que afetam o gasto público.",
        "resumo": "O portal reúne as séries oficiais do Banco Central sobre inflação, juros e câmbio. Os indicadores ajudam a entender o orçamento de famílias e governos.",
        "categoria": "Explicador",
        "frente": "estado",
        "subfrente": "Indicadores Macroeconômicos",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir das séries do Banco Central (SGS), auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 3,
        "palavrasChave": ["ipca", "selic", "dolar", "inflacao", "banco-central", "orcamento"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. IPCA, Selic e dólar: os números que mexem no orçamento. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026macro,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {IPCA, Selic e dólar: os números que mexem no orçamento},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/ipca-selic-dolar-orcamento-banco-central}\n}",
        "fontesOficiais": [
            {"nome": "Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS)", "url": "https://www3.bcb.gov.br/sgspub/"}
        ],
        "metricas": [
            {"rotulo": "IPCA mensal (ago/2026)", "valor": "-0,32%"},
            {"rotulo": "INPC mensal (ago/2026)", "valor": "-0,32%"},
            {"rotulo": "Meta da Selic", "valor": "13,75% a.a."},
            {"rotulo": "Dólar comercial (18/09/2026)", "valor": "R$ 5,1575"}
        ],
        "recomendacaoVerificar": "Acompanhe as séries completas no [SGS do Banco Central](https://www3.bcb.gov.br/sgspub/) e no [painel de orçamento](/estado-e-economia/orcamento).",
        "paragrafos": [
            "As séries do [Banco Central](https://www3.bcb.gov.br/sgspub/) mostram a inflação e os juros oficiais. Em agosto de 2026, o IPCA ficou em -0,32%. O INPC teve a mesma variação no mês, segundo o dado. Os índices medem a variação de preços ao consumidor.",
            "A meta da Selic está definida em 13,75% ao ano. O juro alto encarece o crédito e pressiona a dívida pública. O dólar comercial fechou em R$ 5,1575 em 18/09/2026. O câmbio afeta o preço de combustíveis e de insumos importados.",
            "O leitor pode entender o efeito desses números no [painel de orçamento](/estado-e-economia/orcamento). A inflação baixa no mês ajuda o poder de compra das famílias. Já os juros altos exigem mais cuidado com dívidas."
        ]
    },

    # --- 10. BIBLIOTECA DIGITAL (Eixo 4) -----------------------
    {
        "slug": "biblioteca-documentos-barragens-vale",
        "titulo": "Biblioteca reúne 458 documentos oficiais sobre barragens e a Vale",
        "subtitulo": "São atas, laudos, teses e relatórios corporativos, todos com link para a fonte.",
        "resumo": "O acervo unificado do portal reúne documentos públicos, relatórios corporativos e produção acadêmica sobre barragens, mineração e transparência.",
        "categoria": "Divulgação Científica",
        "frente": "geral",
        "subfrente": "Biblioteca Digital",
        "autor": AUTOR,
        "declaracaoIa": "Texto elaborado com assistência de Inteligência Artificial a partir do acervo unificado do portal, auditado pelo ONSA.",
        "publicadoEm": DATA_PUBLICACAO,
        "atualizadoEm": DATA_PUBLICACAO,
        "tempoLeituraMin": 3,
        "palavrasChave": ["biblioteca", "documentos", "barragens", "vale", "academico", "transparencia"],
        "citacaoAbnt": "ONSA - OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. Biblioteca reúne 458 documentos oficiais sobre barragens e a Vale. Controle Popular, out. 2026.",
        "citacaoBibtex": "@article{onsa2026biblioteca,\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {Biblioteca reúne 458 documentos oficiais sobre barragens e a Vale},\n  journal = {Controle Popular},\n  year = {2026},\n  url = {https://controlepopular.com.br/noticias/biblioteca-documentos-barragens-vale}\n}",
        "fontesOficiais": [
            {"nome": "SciELO — Biblioteca Eletrônica Científica Online", "url": "https://www.scielo.br/"},
            {"nome": "Conselho Nacional de Justiça (CNJ)", "url": "https://www.cnj.jus.br/"}
        ],
        "metricas": [
            {"rotulo": "Documentos no acervo", "valor": "458"},
            {"rotulo": "Empresas citadas", "valor": "20"},
            {"rotulo": "Instituições de justiça", "valor": "91"},
            {"rotulo": "Itens internacionais", "valor": "67"}
        ],
        "recomendacaoVerificar": "Pesquise por tema na [biblioteca](/biblioteca) e abra cada documento pelo link oficial. Há também o acervo do [Paraopeba](/paraopeba).",
        "paragrafos": [
            "A [biblioteca do portal](/biblioteca) reúne 458 documentos sobre barragens e mineração. O acervo foi atualizado em 01/10/2026, segundo o registro interno. Há atas, laudos técnicos, relatórios corporativos e produção acadêmica. Cada item aponta para o endereço original do documento.",
            "São 91 documentos de instituições de justiça e 20 empresas citadas. Outros 18 itens são produção acadêmica, como artigos e teses. O acervo ainda tem 67 documentos internacionais sobre o tema. A busca por texto ajuda a achar cada peça.",
            "O leitor pode pesquisar por tema na [biblioteca](/biblioteca). O material serve para jornalistas, pesquisadores e comunidades. Os documentos do desastre estão também no [acervo do Paraopeba](/paraopeba)."
        ]
    }
]


def limpar_para_contagem(frase: str) -> str:
    """Remove markdown [texto](url) para contar so o que o leitor enxerga."""
    return re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', frase).strip()


def validar_frases_ate_15_palavras(posts):
    total_frases = 0
    erros = []
    for post in posts:
        for p_idx, paragrafo in enumerate(post["paragrafos"]):
            frases = re.split(r'(?<=[.!?])\s+', paragrafo.strip())
            for f_idx, frase in enumerate(frases):
                limpa = frase.strip().rstrip(".!?")
                if not limpa:
                    continue
                legivel = limpar_para_contagem(limpa)
                qtd = len(legivel.split())
                total_frases += 1
                if qtd > 15:
                    erros.append((post["slug"], p_idx + 1, f_idx + 1, qtd, legivel))
    return total_frases, erros


def main():
    total, erros = validar_frases_ate_15_palavras(POSTS)
    print(f"Total de frases analisadas: {total}")
    if erros:
        print(f"ERRO: {len(erros)} frases com mais de 15 palavras:")
        for slug, p, f, q, texto in erros:
            print(f" - [{slug}] P{p} F{f} ({q}): {texto}")
        sys.exit(1)
    print("OK: todas as frases tem ate 15 palavras.")

    if not ARQUIVO_NOTICIAS.exists():
        print(f"Arquivo {ARQUIVO_NOTICIAS} nao encontrado.")
        sys.exit(1)

    with open(ARQUIVO_NOTICIAS, "r", encoding="utf-8") as f:
        noticias = json.load(f)

    existentes = {n["slug"] for n in noticias}
    adicionados = substituidos = 0
    for novo in POSTS:
        if novo["slug"] in existentes:
            for idx, n in enumerate(noticias):
                if n["slug"] == novo["slug"]:
                    noticias[idx] = novo
                    substituidos += 1
                    break
        else:
            noticias.insert(0, novo)
            adicionados += 1

    with open(ARQUIVO_NOTICIAS, "w", encoding="utf-8") as f:
        json.dump(noticias, f, ensure_ascii=False, indent=1)

    print("Operacao concluida:")
    print(f" - {adicionados} posts novos no topo.")
    print(f" - {substituidos} posts atualizados.")
    print(f" - Total atual de noticias: {len(noticias)}")


if __name__ == "__main__":
    main()
