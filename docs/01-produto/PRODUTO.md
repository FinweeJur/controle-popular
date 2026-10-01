# PRODUTO — o que é o portal, frentes e regras editoriais

> **Tipo:** PRODUTO
> **Domínio:** global
> **Última medição:** 2026-10-01
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)
> **Palavras-chave:** portal, eixos, subfrentes, regras editoriais, acessibilidade, terra, direitos, economia, onsa, cidades, ferramentas, tts

## Sumário

- [Propósito](#propósito)
- [Quem lê, e o que isso exige](#quem-lê-e-o-que-isso-exige)
- [Os Quatro Grandes Eixos e Subfrentes](#os-quatro-grandes-eixos-e-subfrentes)
- [Features principais](#features-principais)
- [Regras editoriais](#regras-editoriais)
- [Números que importam](#números-que-importam)
- [Origem](#origem)

## Propósito

Portal independente de transparência pública, no ar em controlepopular.com.br.
Reúne o dado oficial que já é público, mas vive espalhado em dezenas de
sistemas. Publica tudo em uma tela só, por cidade e por tema, em português comum.

## Quem lê, e o que isso exige

O leitor está sob estresse — denúncia, remoção, barragem.
Três consequências de qualidade, nesta ordem:

1. **Acessibilidade não é opcional.** Leitura em voz alta (TTS), teclado,
   três temas, contraste medido por regra WCAG (a norma de acessibilidade
   da web). Quando "ouvir esta página" fala a página, o **microresumo**
   (frase que descreve o que a página contém) vem primeiro.
2. **Número errado é dano.** Todo número exibido tem fonte identificável.
   Estimativa exibe a taxa de erro ao lado.
3. **Insinuação é dano.** Dois dados verdadeiros lado a lado não levam a
   conclusão que a fonte não autoriza.
4. **Descrição legível.** A descrição que fica abaixo do título da página
   nunca é menor que `text-sm` (14px). Resumo longo abre no controle
   "Ver + Texto" em vez de espremer o leitor. Regra do dev, 29/09/2026 —
   detalhe em [AGENTS.md § 5.10](/AGENTS.md#510-fonte-mínima-da-descrição-da-página).

## Os Quatro Grandes Eixos e Subfrentes

O portal organiza sua fiscalização e acervo em **quatro grandes eixos temáticos**, cobrindo **mais de 36 subfrentes ativas**:

| Eixo | Hub Principal | Âmbito e Missão |
|---|---|---|
| **1. Terra e Território** | `/terra-e-territorios` ou `/funcaosocialterra` | Soberania territorial, 203 cidades estratégicas, bacias hidrográficas (Paraopeba e Rio Doce), barragens, clima, mineração e Globo 3D |
| **2. Direitos em Movimento** | `/direitos-em-movimento` | Saúde (SUS), educação básica (IDEB), trabalho (CAGED), conselhos de direitos, LAI, canal de denúncias e assistência jurídica comunitária |
| **3. Estado e Economia** | `/estado-e-economia` | Orçamento público, compras governamentais (PNCP), 27 Assembleias Legislativas, Congresso Nacional, Judiciário e conexões internacionais |
| **4. Central ONSA e Ferramentas** | `/central` ou `/laboratorio` | Radar diário de editais (DO-MG), biblioteca digital com 24k+ docs, laboratório de gráficos, rádios cívicas, IA livre e assistente Seu Nonô |

### Subfrentes detalhadas por eixo

1. **Eixo 1 — Terra e Território (`/terra-e-territorios`)**
   - **203 Cidades Estratégicas:** Painéis municipais com SUS, PIB e contratos (`/cidades`);
   - **853 Municípios de MG:** Cobertura estadual completa e transferências (`/cidades/mg`);
   - **Bacia do Rio Paraopeba:** Reparação do crime de Brumadinho, ATIs e linha do tempo (`/paraopeba`, `/brumadinho`);
   - **Bacia do Rio Doce:** Repactuação de R$ 171 bi do desastre de Mariana (`/ambiental/mariana`);
   - **Barragens e Descaracterização:** Monitoramento de estabilidade ANM/FEAM (`/ambiental/barragens`, `/ambiental/barragens/descaracterizacao`);
   - **Cavas de Mineração:** Mapeamento histórico por satélite e visão computacional (`/mineracao/cavas`);
   - **Nossas Serras:** Preservação de topos de morro e contenção minerária (`/terra-e-territorios/nossas-serras`);
   - **Clima e Risco Climático:** Vulnerabilidade e indicadores AdaptaBrasil (`/ambiental/clima-risco`);
   - **Licenciamento Ambiental:** Processos e audiências em 11 UFs (`/ambiental/licenciamento`);
   - **Termos de Ajustamento (TAC):** TACs do IBAMA e órgãos estaduais (`/ambiental/tac`);
   - **Decisões do COPAM:** Pautas e votações ambientais em Minas (`/ambiental/copam`);
   - **Função Social & Globo 3D:** Terras indígenas, quilombolas e vazios do CAR (`/funcaosocialterra/mapa`);
   - **Mineração Transnacional:** Hubs do Canadá (TSX) e América Latina (`/canada`, `/america-latina`).

2. **Eixo 2 — Direitos em Movimento (`/direitos-em-movimento`)**
   - **Saúde Pública & SUS:** Capacidade instalada, leitos e estabelecimentos CNES (`/direitos-em-movimento/saude-publica`);
   - **Educação Básica:** Qualidade do ensino, IDEB e infraestrutura escolar (`/direitos-em-movimento/educacao`);
   - **Trabalho e Renda:** Admissões e desligamentos formais do CAGED (`/direitos-em-movimento/trabalho-e-renda`);
   - **Linha do Tempo das Lutas:** Acervo histórico de memória popular (`/memoria`);
   - **Conselhos de Direitos:** Mapeamento de 710 conselhos municipais e estaduais (`/direitos-em-movimento/conselhos`);
   - **Acesso à Justiça & Ajuda:** Defensoria Pública e assistência comunitária (`/direitos-em-movimento/ajuda`);
   - **Canais de Informação (LAI):** Diretório de 445 portais oficiais de transparência (`/direitos-em-movimento/informacao`);
   - **Decisões de Acesso (LAI):** Precedentes e recursos de informação pública (`/ambiental/decisoes-lai`);
   - **Que Lei Protege Isso:** Legislação anotada por direito social violado (`/ambiental/legislacao`);
   - **Canal de Denúncia Local:** Encaminhamento seguro para órgãos fiscalizadores (`/direitos-em-movimento/denuncia`).

3. **Eixo 3 — Estado e Economia (`/estado-e-economia`)**
   - **Orçamento Público de MG:** Dotação, arrecadação e execução financeira (`/estado-e-economia/orcamento`);
   - **Compras Públicas & Licitações:** Contratos e certames via PNCP e TCE (`/editais`, `/ambiental/contratos`);
   - **Concessões e PPPs:** Parcerias público-privadas de MG (`/ambiental/ppp`);
   - **Convênios Federais:** Transferências voluntárias e emendas (`/ambiental/convenios`);
   - **Repasses Federais ComunicaBR:** Dados dos 853 municípios (`/dados/comunicabr`);
   - **Governos: Prometeu? Cumpriu?:** Checagem de programas e promessas de campanha (`/governo`);
   - **Congresso Nacional:** Votações, bancadas e despesas de deputados e senadores (`/congresso`, `/congresso/mg`);
   - **Assembleias Legislativas:** Monitoramento legislativo das 27 UFs (`/assembleias`);
   - **Quem Fiscaliza a Justiça:** Órgãos de controle CNJ e CNMP (`/judiciario/instituicoes`);
   - **Recomendações e Inspeções:** Atos disciplinares do CNJ e corregedorias (`/judiciario/recomendacoes`);
   - **Varas, Gabinetes e Balcão Virtual:** Contatos e comarcas de 990 varas (`/judiciario/contatos`);
   - **Grandes Empresas e ESG:** Acionistas, mineradoras e fornecedores (`/empresas`);
   - **Transparência Internacional EUA:** SEC EDGAR, fundos e barragens americanas (`/eua`).

4. **Eixo 4 — Central ONSA e Ferramentas (`/central`)**
   - **Radar Diário de Editais:** Licitações e chamamentos do DO-MG (`/editais`);
   - **Biblioteca Digital:** Mais de 24 mil documentos, perícias e decisões (`/biblioteca`);
   - **Busca Universal Global:** Pesquisa instantânea em todo o acervo (`/busca`);
   - **Laboratório de Dados:** Comparador de indicadores com gráficos dither acessíveis (`/laboratorio`);
   - **Árvore de Conexões:** Grafo interativo 3D estilo Obsidian das relações cívicas (`/laboratorio/arvore`);
   - **Blog e Notícias Analíticas:** Investigações com dupla checagem (`/noticias`);
   - **Diretório de Rádios Cívicas:** 44 emissoras públicas e universitárias do mundo (`/radio`);
   - **Alertas e Notificações:** Avisos de emergência climática e barragens (`/alertas`);
   - **Tecnologia & IA Livre:** Ferramentas abertas e modelos locais sem big techs (`/tecnologia`);
   - **Assistente Cívico Seu Nonô:** IA acolhedora e escada determinística com voz (`/assistente`);
   - **Documentação e API Aberta:** Catálogo técnico e endpoints públicos (`/documentacao`, `/api`);
   - **Sobre o ONSA & Método:** Princípios cívicos e Regra das Seis Qualidades (`/sobre`);
   - **Sala de Imprensa:** Dados abertos para comunicadores e jornalistas (`/imprensa`);
   - **Termos de Uso e LGPD:** Blindagem contra vazamento de CPFs e privacidade (`/termos`).

## Features principais

| Feature | Onde | Nota |
|---|---|---|
| Painéis por município | 203 cidades estratégicas e 853 de MG | Dados com fonte e lacunas declaradas |
| Tabelas Estáticas | listas grandes | > 2 mil linhas: índice fatiado ou paginação no servidor — regra completa em [AGENTS.md § 5.1](/AGENTS.md#5.1-coleção-nunca-como-props-de-componente-de-cliente) |
| Alertas de contrato | contratos de Cidades | Duas categorias: violação legal (dispositivo citado) e heurística (com ressalva) |
| Busca e assistente | `/busca`, `/assistente` | Índice de texto sobre todo o acervo; navegação determinística, sem modelo |
| Seu Nonô (IA) | widget flutuante | RAG (busca sobre acervo + geração) com citação clicável, ressalva sempre visível — plano: [`planos/PLANO-SEU-NONO-NOTEBOOKLM.md`](../planos/PLANO-SEU-NONO-NOTEBOOKLM.md) |
| "Ouvir esta página" (TTS) | botão na navbar, leitura flutuante | Lê **primeiro o microresumo** do top-100 (`apps/web/lib/resumos-top100.ts`), depois o conteúdo — a pessoa sabe onde está já na primeira frase |
| Globo 3D | `/funcaosocialterra/mapa` | Camadas geográficas; 8 camadas do rompimento de Brumadinho |
| API pública v1 | `/api`(, `/api/v1/`) | Agregados em JSON aberto, sem chave, Swagger UI |
| Painel de edição | `/[municipio]/admin` (local, porta 3028) | Editar conteúdo sem tocar em código |

**Lacunas declaradas são conteúdo, não defeito escondido.** Principais hoje:
votações nominais zeradas no banco; diário oficial sem coleta municipal;
69 de 252 magistrados com data de nascimento; camada de terras devolutas
publicada vazia (o INCRA não publica a base — a ausência é o achado).

## Regras editoriais

A régua do projeto inteiro:

- **O número vem do dado; o modelo, se houver, só embrulha.** Resumo gerado
  por modelo é o portal afirmando algo. Rotulado com data e modelo, nunca
  como conclusão do autor do documento.
- **Lacuna é informação.** A tela diz quantos itens vieram vazios.
- **A ressalva viaja colada ao número, ou o número não vai.** Origem da
  regra: `total_doado` da Rouanet é do Brasil inteiro.
- **Dois dados verdadeiros nunca devem levar a uma terceira conclusão fala.**
  Exemplo: 827 de 853 cidades não têm relação com a bacia do Paraopeba.
- **Estimativa publica taxa de erro ao lado.** Vazio cadastral: 30,0% de erro
  (amostra conferida no satélite); teto 33% é decisão declarada.
- **Unidade inteira sempre que houver.** "0,4 bilhões" é erro editorial;
  "400 milhões" é a forma certa. Igual: "0,2 milhões" → "200 mil".
- **Editais não poluem o feed.** Certames, licitações e pregões moram na rota
  `/editais`; o Blog (`/noticias`) e `/novidades` não os recebem.

## Números que importam

Medidos em 16/08 — **remeça antes de decidir com eles**:

| Número | O que é |
|---|---|
| 853 | municípios de MG na camada de divisas do globo |
| 8.570 | normas federais do MMA no acervo |
| 2,26 MB | dado dos 853 municípios compactado (`comunicabr-31.json`) |
| 1.471+ | páginas no último build; se 21, o banco não foi lido |

Como remedir cada um: script por script citados nos arquivos de origem
(disponíveis no `historico/`) e no [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md).

## Origem

Absorve (e substitui) os arquivos: `README.md` antigo, `APRESENTACAO.md` e
`PLANO-INTEGRACAO-BRUMADINHO.md` (em [`historico/`](../historico/)).
`docs/LEIA-PRIMEIRO.md` lido como contexto.
Revisão continua **ATIVA** em [`planos/REVISAO-UX-E-ONBOARDING.md`](../planos/REVISAO-UX-E-ONBOARDING.md).
