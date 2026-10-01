# Controle Popular

> Read this in English: [`README.en.md`](README.en.md).

Portal independente de transparência pública. Junta dado oficial que já é
público mas está espalhado por dezenas de sistemas e o publica numa tela só,
por cidade e por tema, em português comum.

No ar: **[controlepopular.com.br](https://controlepopular.com.br)**
(fallback: [controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev))

**Todo número tem fonte, e toda estimativa mostra a taxa de erro ao lado.**
Quando a fonte não tem, a tela diz que não tem — lacuna é informação, não
defeito escondido.

## As frentes do portal

| Frente | Rota | O que responde |
|---|---|---|
| Cidades | `/[municipio]` (`/sp`, `/bh`, `/betim`, `/diamantina`, `/aracuai`, `/itinga`) | Contratos, licitações, **diários oficiais municipais** com classificação temática determinística, repasses federais (ComunicaBR) e finanças |
| Assembleias Estaduais | `/assembleias` | Composição, orçamentos, proposições e diários oficiais das **27 assembleias legislativas estaduais** |
| Congresso | `/congresso` | Proposições federais por tema, comissão e bancada de Minas Gerais |
| Judiciário | `/judiciario` | Composição dos tribunais, vacância, inspeções CNJ e processos ambientais (SIRENEJud) |
| Função Social da Terra & Cavas | `/funcaosocialterra` (+ `/mapa`, `/mineracao/cavas`) | Vazio cadastral do CAR no globo 3D, **série histórica de cavas de mineração (VLM)**, terras indígenas e Unidades de Conservação (CNUC/MMA) |
| Paraopeba | `/paraopeba` | A reparação de Brumadinho: auditoria FGV/AECOM, repasse aos 853 municípios (R$ 1,64 bi), clipping e linha do tempo |
| ONSA · Observatório Socioambiental | `/ambiental` (+ `/paraopeba/vale`, `/ambiental/mariana`) | **Acordo de Mariana**, **Observatório Vale S.A.**, barragens (SIGBM), licenças IBAMA, TACs, decisões LAI/CGE e pauta do COPAM |
| Internacional & Multilateral | `/internacional` (+ `/eua`, `/canada`) | Indicadores sociais ONU/PNUD (IDH, Gini, GII), UNESCO, OMS, comércio OMC/Comtrade, corporações SEC EDGAR e mineradoras TSX |
| Laboratório de Dados | `/laboratorio` | Caderno NotebookLM cívico offline (citações `[n]`), widgets de Generative UI e catálogo de 22 bases |

## Destaques de Arquitetura e Dados

- **Padrão das 6 Qualidades da Informação Cívica:** Toda página com acervo público segue 6 garantias auditáveis: (1) Hiperlink direto e verificado à fonte pública oficial; (2) Busca textual e filtros facetados por tags reais; (3) Ordenação crescente/decrescente por coluna (classes, datas e valores); (4) Microresumo e cartões de topo com agregados; (5) Contexto para o chatbot cívico Seu Nonô com respostas curtas de até 13 palavras; (6) Exportação em CSV com BOM UTF-8 (separador `;`) para Excel e impressão nativa via CSS.
- **Modo Trilíngue Dinâmico (PT/EN/ES):** Suporte nativo a Português, Inglês e Espanhol com alternância reativa na interface, leitura em áudio via síntese de voz (TTS) e exportação multilíngue.
- **Assistente Cívico Seu Nonô:** RAG determinístico integrado a caderno de notas offline, mapa mental em árvore no estilo Obsidian e escada de navegação para mais de 100 páginas do portal.
- **Privacidade Rigorosa por Algoritmo:** Sanitização e anonimização automática de dados pessoais (CPF Mod-11, SSN, SIN) antes de qualquer persistência em dados abertos (100% LGPD).
- **Vigia de ETL e Fact-Checking Cívico:** Telemetria contínua de 397 coletores (`vigia-dados-etl.mts`), checagem automatizada de fontes (inspirada em IFCN, Lupa e Aos Fatos) e espelhos de resiliência no GitLab e Hugging Face.
- **Código Autoexplicativo e Comentado:** Todo módulo, componente, query e coletor traz cabeçalhos e comentários em português (JSDoc/docstrings) explicando o que é, qual a sua função pública e o motivo das escolhas técnicas adotadas.
- **Catálogo de fontes com guarda anti-apodrecimento:** O registro único de fontes (`lib/fontes/registry.ts`) declara a camada de alocação e o caminho de cada base, e um teste recusa caminho que não existe no repositório — porque catálogo de dado apodrece em silêncio (a revisão flagrou 13 de 42 caminhos quebrados).

## API pública

Os dados agregados do portal são servidos também como JSON aberto, sem chave:

- Documentação interativa (Swagger UI, com "Try it out"): **[`/api`](https://controlepopular.com.br/api)**
- Spec OpenAPI: `/api/openapi.yaml`
- Datasets: `/api/v1/` (contrato estável; mudança quebrante vira `/api/v2/`)

## Stack

Monorepo npm. Next.js 16 em `apps/web` (App Router), ETL em Python em `etl/`,
Postgres (Neon/local) para leituras no build e Cloudflare D1 para escritas ao
vivo. Deploy em Cloudflare Workers via OpenNext:

```bash
cd apps/web && npm run cf:deploy
```

Para rodar localmente: Node 22, Python 3.12, PostgreSQL 16 — o passo a passo
completo está em [`README.en.md`](README.en.md) (em inglês) e em
[`docs/05-operacao/OPERACAO.md`](docs/05-operacao/OPERACAO.md).

## Documentação

A documentação vive em [`docs/`](docs/). Comece por:

- [`docs/LEIA-PRIMEIRO.md`](docs/LEIA-PRIMEIRO.md) — índice rápido.
- [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) — o que é o portal, frentes e regras editoriais.
- [`docs/02-estado/ESTADO.md`](docs/02-estado/ESTADO.md) — o que está no ar, fila, bloqueios e dívida.
- [`docs/06-fontes/FONTES.md`](docs/06-fontes/FONTES.md) — catálogo operacional das fontes, com as armadilhas medidas em cada uma.
- [`docs/06-fontes/DADOS-GOV-BR.md`](docs/06-fontes/DADOS-GOV-BR.md) — o que já usamos do catálogo federal e o que vale integrar.
- [`AGENTS.md`](AGENTS.md) — regras duras do repositório (commit, worktree, dado pessoal, publicação).

## Licença

[AGPL-3.0-or-later](LICENSE). O dado é público; o código que o organiza
também.
