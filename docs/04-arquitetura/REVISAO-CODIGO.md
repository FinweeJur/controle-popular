# Revisão de código e onboarding

> **Tipo:** ARQUITETURA
> **Domínio:** global
> **Última medição:** 2026-10-01
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [ARQUITETURA.md](ARQUITETURA.md), [ESTADO.md](../02-estado/ESTADO.md), [PLANO-FALLBACK-BANCO.md](../planos/PLANO-FALLBACK-BANCO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** revisao, onboarding, codigo, camadas, banco, drizzle, comBancoReserva, sanitizacao, seguranca, divida, indice

## Sumário

- [Propósito](#propósito)
- [Método](#método)
- [Mapa de camadas](#mapa-de-camadas)
- [Parte 1 — camada de dados (lib/db)](#parte-1--camada-de-dados-libdb)
- [Parte 2 — assistente (lib/assistente)](#parte-2--assistente-libassistente)
- [Parte 3 — cidades (lib/betim)](#parte-3--cidades-libbetim)
- [Parte 4 — rotas que leem banco (app/)](#parte-4--rotas-que-leem-banco-app)
- [Parte 5 — coleta (scripts/ e etl/)](#parte-5--coleta-scripts-e-etl)
- [Parte 6 — frentes (ambiental, paraopeba, terras, judiciário, congresso)](#parte-6--frentes-ambiental-paraopeba-terras-judiciário-congresso)
- [Parte 7 — componentes e compactação](#parte-7--componentes-e-compactação)
- [Parte 8 — segurança e escrita](#parte-8--segurança-e-escrita)
- [Parte 9 — testes que não testavam (navegação)](#parte-9--testes-que-não-testavam-navegação)
- [Parte 10 — escrita pública e resiliência](#parte-10--escrita-pública-e-resiliência)
- [Parte 11 — LinkMender e denúncia](#parte-11--linkmender-e-denúncia)
- [Parte 12 — conselhos e correlação](#parte-12--conselhos-e-correlação)
- [Parte 13 — a compactação dupla](#parte-13--a-compactação-dupla)
- [Parte 14 — arquivos da raiz de lib/](#parte-14--arquivos-da-raiz-de-lib)
- [Parte 15 — laboratório dither e afins](#parte-15--laboratório-dither-e-afins)
- [Parte 16 — memória das resistências](#parte-16--memória-das-resistências)
- [Parte 17 — acervos estaduais e multinacionais](#parte-17--acervos-estaduais-e-multinacionais)
- [Parte 18 — dados de fonte (fontes, coleta, texto)](#parte-18--dados-de-fonte-fontes-coleta-texto)
- [Parte 19 — segurança, server-only e utilitários](#parte-19--segurança-server-only-e-utilitários)
- [Parte 20 — junções editoriais (cruzamentos e teia)](#parte-20--junções-editoriais-cruzamentos-e-teia)
- [Parte 21 — busca estática (lib/busca)](#parte-21--busca-estática-libbusca)
- [Parte 22 — respostas curadas e índice de páginas](#parte-22--respostas-curadas-e-índice-de-páginas)
- [Parte 23 — a guarda de dado pessoal (a cadeia do §5.2)](#parte-23--a-guarda-de-dado-pessoal-a-cadeia-do-52)
- [Achados e dívidas](#achados-e-dívidas)
- [Fila de revisão](#fila-de-revisão)
- [Decisões registradas](#decisões-registradas)

## Propósito

O código cresceu para mais de 50 módulos de `lib/` e 45 áreas de rota. Este
documento é o **índice da revisão e do onboarding por micro-partes**: para
cada módulo, o que ele é, de onde vem o dado, como se liga ao resto e o que
ainda pede revisão. Não é cópia do código — é ponteiro com link direto para a
fonte.

Serve a duas perguntas: “por onde um módulo novo se encaixa?” e “o que está
frágil aqui?”. As regras duras (commit, dado pessoal, deploy) continuam no
[`AGENTS.md`](/AGENTS.md); a arquitetura de alto nível, no
[ARQUITETURA.md](ARQUITETURA.md).

## Método

Economia é regra, não preguiça ([ESTRATEGIA-ECONOMIA-TOKENS](../planos/ESTRATEGIA-ECONOMIA-TOKENS.md)):

- **Uma camada por rodada.** Lê-se o módulo, não o repositório.
- **Foco na consequência**, não na categoria: o que pode publicar número
  errado, vazar dado pessoal ou quebrar a edição por outra pessoa
  (skill `revisar-seguranca-cp`).
- **Cada achado é confirmado no código** antes de virar linha aqui.
- **Módulo já bem documentado não se reescreve** — ganha link e entra na
  tabela. A regra de comentário de arquivo é a do AGENTS § 5.9.

## Mapa de camadas

| Camada | Caminho | Papel | Estado da revisão |
|---|---|---|---|
| Rotas | [`app/`](../../apps/web/app) | App Router: páginas, API, payload | ⏳ na fila |
| Lógica | [`lib/`](../../apps/web/lib) | Regras puras por frente, testadas ao lado | ⏳ na fila |
| Dados | [`lib/db/`](../../apps/web/lib/db) | Drizzle, conexão, reserva, queries | ✅ **Parte 1 (este doc)** |
| Coleta | [`scripts/`](../../scripts) | Coletores, ETL, rotinas | ⏳ na fila |
| Dado versionado | [`data/`](../../apps/web/data) | JSON lido no build (compactado) | ⏳ na fila |

## Parte 1 — camada de dados (lib/db)

Esta camada é a única que fala com o Postgres. Ela tem três níveis: conexão,
schema e consultas.

### Conexão e reserva

| Módulo | Papel |
|---|---|
| [client.ts](../../apps/web/lib/db/client.ts) | Abre a conexão e escolhe o driver pelo host: Neon (HTTP), Guara ou Postgres local. `getDb()` e `criarConexao(url)`. |
| [reserva.ts](../../apps/web/lib/db/reserva.ts) | `comBancoReserva`: roda a consulta no plano A (Guara) e, se vier **vazia ou com erro**, na MESMA consulta no Neon (B) e no home-pc (D). |
| [clientD1.ts](../../apps/web/lib/db/clientD1.ts) | Acesso ao D1 (SQLite), banco separado das escritas ao vivo. |
| [d1-http.ts](../../apps/web/lib/db/d1-http.ts) | Binding que imita a superfície `drizzle-orm/d1` sobre HTTP. |

**Por que a reserva é por consulta, e não por conexão:** medido em 30/09 — o
Postgres do Guara **conecta, mas está vazio** quando o ETL não rodou contra
ele. `getDb()` só troca de banco quando a *conexão* falha, então o sintoma era
“ainda não rodou contra este banco” com o dado existindo no Neon. A troca por
consulta resolve o caso real. Ver [PLANO-FALLBACK-BANCO.md](../planos/PLANO-FALLBACK-BANCO.md).

### Schema e ORM

| Módulo | Papel |
|---|---|
| [schema.ts](../../apps/web/lib/db/schema.ts) | ~90 tabelas Postgres, geradas por `drizzle-kit introspect`. **Gerado — não editar à mão.** |
| [relations.ts](../../apps/web/lib/db/relations.ts) | Relações do Drizzle. **Gerado — não editar à mão.** |
| [schema.d1.ts](../../apps/web/lib/db/schema.d1.ts) | Schema do D1 (SQLite), separado do Postgres. |
| [schema-autorizacoes.ts](../../apps/web/lib/db/schema-autorizacoes.ts) | Imóveis da União em MG (SPU). |
| [schema-cidades-mg.ts](../../apps/web/lib/db/schema-cidades-mg.ts) | Cidades e polos regionais de MG. |
| [schema-conselhos.ts](../../apps/web/lib/db/schema-conselhos.ts) | Conselhos sociais e colegiados. |
| [schema-outorgas.ts](../../apps/web/lib/db/schema-outorgas.ts) | Outorgas de água (licenciamento hídrico de MG). |
| [schema-ppp.ts](../../apps/web/lib/db/schema-ppp.ts) | Concessões e PPPs de MG. |
| [auth-schema.ts](../../apps/web/lib/db/auth-schema.ts) | Tabelas do Better Auth. |
| [num.ts](../../apps/web/lib/db/num.ts) | Lê coluna `numeric` como número JS (o driver devolveria string). |
| [ordem.ts](../../apps/web/lib/db/ordem.ts) | Ordena texto em português (`COLLATE`/`locale`). |

### Consultas — `queries/`

Toda função de leitura recebe o contexto primeiro (cidade, eixo) e a maioria
já passa pela **cadeia de reserva** (`comBancoReserva`). A coluna “Reserva”
abaixo diz se o módulo cai para o Neon/home-pc quando o Guara vem vazio.

| Módulo | Papel | Fonte oficial | Reserva |
|---|---|---|---|
| [ambiental-licenciamento.ts](../../apps/web/lib/db/queries/ambiental-licenciamento.ts) | Licenças ambientais de MG | SEMAD/MG | ✅ |
| [barragens.ts](../../apps/web/lib/db/queries/barragens.ts) | Barragens de MG (estaduais) | FEAM + SNISB (ANA) | ✅ |
| [betim.ts](../../apps/web/lib/db/queries/betim.ts) | Eixo Cidades: contratos, vereadores, saúde, educação | Prefeituras e câmaras | ✅ |
| [condicionantes.ts](../../apps/web/lib/db/queries/condicionantes.ts) | Condicionantes de licenças | SEMAD/MG | ✅ |
| [congresso.ts](../../apps/web/lib/db/queries/congresso.ts) | Proposições, votações, bancadas, agenda | Câmara e Senado (dados abertos) | ✅ |
| [copam.ts](../../apps/web/lib/db/queries/copam.ts) | Reuniões e pauta do COPAM | COPAM/SEMAD-MG | ✅ |
| [direito-critico.ts](../../apps/web/lib/db/queries/direito-critico.ts) | Legislação e precedentes críticos | ver cabeçalho do módulo | ✅ |
| [judiciario.ts](../../apps/web/lib/db/queries/judiciario.ts) | Tribunais, cadeiras, vagas, nomeações | Tribunais, CNJ, Senado | ✅ |
| [legislacao-ambiental.ts](../../apps/web/lib/db/queries/legislacao-ambiental.ts) | Normas ambientais (3 fontes) | ver cabeçalho do módulo | ✅ |
| [patrimonio-tombado.ts](../../apps/web/lib/db/queries/patrimonio-tombado.ts) | Patrimônio cultural tombado | ver cabeçalho do módulo | ✅ |
| [risco-direitos.ts](../../apps/web/lib/db/queries/risco-direitos.ts) | Agregador do índice de Risco a Direitos | cálculo sobre o banco | ✅ |
| [terras.ts](../../apps/web/lib/db/queries/terras.ts) | Rollup do pipeline terras-devolutas | projeto terras-devolutas | ✅ |

Fora da reserva, de propósito:

| Módulo | Papel | Por que não tem reserva |
|---|---|---|
| [municipios.ts](../../apps/web/lib/db/queries/municipios.ts) | Registro das cidades atendidas | Tem fallback próprio: a lista congelada no build (`cidades-do-build`) cobre o caso de banco fora do ar. |
| [betim-escritas.ts](../../apps/web/lib/db/queries/betim-escritas.ts) | Escritas Postgres (legado) | Escrita. Reserva é só para leitura pública. Usada só por paridade. |
| [betimD1.ts](../../apps/web/lib/db/queries/betimD1.ts) | Escritas ao vivo no D1 | Escrita em outro banco. Ler num e escrever noutro dividiria o estado. |
| [cidades-do-build.ts](../../apps/web/lib/db/cidades-do-build.ts) | Lista de cidades congelada | Gerado por script; é justamente o fallback de `municipios.ts`. |

## Parte 2 — assistente (lib/assistente)

O Seu Nonô responde em **degraus**, do mais barato ao mais caro: primeiro o
que é determinístico (sem modelo, sem rede), e só então o RAG com LLM. A
arquitetura está em `lib/assistente/`; o prompt e as defesas, em
`lib/seguranca/`.

| Módulo | Papel | Modelo? |
|---|---|---|
| [navegacao.ts](../../apps/web/lib/assistente/navegacao.ts) | Texto → destinos do portal (catálogo já no chunk; ~0,35 ms medidos) | não |
| [documentos.ts](../../apps/web/lib/assistente/documentos.ts) | Passo 2, opcional: busca DOCUMENTO no índice estático da `/busca` | não |
| [compor.ts](../../apps/web/lib/assistente/compor.ts) | Passo 3: compara cidades e aponta ausência por regra escrita | não |
| [escada-determinista.ts](../../apps/web/lib/assistente/escada-determinista.ts) | Intercepta comandos e termos de alta frequência antes do modelo | não |
| [corretor-digitacao.ts](../../apps/web/lib/assistente/corretor-digitacao.ts) | Tolerância a erro de digitação e fonética | não |
| [catalogo.ts](../../apps/web/lib/assistente/catalogo.ts) | Catálogo de destinos — CONSTANTE de módulo, nunca prop (teto de payload) | não |
| [acervo.ts](../../apps/web/lib/assistente/acervo.ts) | Monta o acervo REAL do RAG, com a fonte colada em cada pedaço | não |
| [embeddings/rag.ts](../../apps/web/lib/assistente/embeddings/rag.ts) | Pipeline: pergunta → similaridade → geração → verificação de citação | sim |
| [embeddings/geracao.ts](../../apps/web/lib/assistente/embeddings/geracao.ts) | Prompt do sistema + cascata de provedores (DeepSeek → Maritaca → Ling → Ollama) | sim |
| [embeddings/pedacos.ts](../../apps/web/lib/assistente/embeddings/pedacos.ts), [ollama.ts](../../apps/web/lib/assistente/embeddings/ollama.ts), [remoto.ts](../../apps/web/lib/assistente/embeddings/remoto.ts), [similaridade.ts](../../apps/web/lib/assistente/embeddings/similaridade.ts) | Fatiar, vetorizar (local ou remoto) e rankear | embeddings |
| [verificador-citacao.ts](../../apps/web/lib/assistente/verificador-citacao.ts) | Confere os marcadores `[n]` contra as fontes — não depende do modelo | não |
| [golden-set.ts](../../apps/web/lib/assistente/golden-set.ts) | "Gabarito" versionado: o que DEVE recuperar e quando DEVE abster | não |
| [fact-checking-civico.ts](../../apps/web/lib/assistente/fact-checking-civico.ts) | Motor de checagem (IFCN/Lupa) | não |
| [arvore-galhos.ts](../../apps/web/lib/assistente/arvore-galhos.ts), [contexto-vales.ts](../../apps/web/lib/assistente/contexto-vales.ts) | Grafo de navegação e contexto territorial dos Vales | não |
| [seu-nono-dados.ts](../../apps/web/lib/assistente/seu-nono-dados.ts) | Base pré-curada de respostas e links oficiais | não |

Entrada pública: [`app/api/chatbot/route.ts`](../../apps/web/app/api/chatbot/route.ts)
— valida, blinda contra injeção direta, limita taxa e chama o RAG.

### Achados da Parte 2

1. ✅ **Blindagem INDIRETA ligada** (corrigido em 30/09/2026).
   `sanitizarTextoParaContexto` (`lib/seguranca/blindagem-prompt.ts`) era
   escrito e testado para injeção **indireta**, mas não era chamado: o
   contexto do RAG entrava cru em `montarPromptUsuario`
   ([geracao.ts](../../apps/web/lib/assistente/embeddings/geracao.ts)). Agora o
   texto de cada fonte é higienizado ANTES do prompt — só na cópia que o
   modelo lê; o `FonteRag.texto` citado ao leitor fica intacto. Coberto por
   `geracao.test.ts`.

2. **Limitador de taxa por IP confia no cabeçalho errado como reserva.** A
   rota usa `cf-connecting-ip` primeiro (certo), mas cai para
   `x-forwarded-for.split(",")[0]` — que é o valor que o cliente inventa
   (skill `revisar-seguranca-cp`). Além disso, o contador é em memória, por
   instância. É defesa de higiene, não muralha.

3. **Erro genérico devolve `e.message` ao cliente** (status 500), podendo
   expor detalhe interno de provedor; o caso `OllamaIndisponivel` já é
   tratado com mensagem pública. Padronizar a mensagem genérica.

4. **O que está CERTO e não se reabre sem motivo:** prompt do sistema forte
   (não inventar, citar `[n]`, abster-se, não insinuar); verificação
   determinística de citação; golden set com casos de abstenção; sem
   `dangerouslySetInnerHTML` nas rotas do assistente; chaves de IA só no
   servidor (`.env.local`), nada em `NEXT_PUBLIC_`.

## Parte 3 — cidades (lib/betim)

A maior frente: ~72 módulos com as regras de negócio do eixo Cidades. A
regra estrutural que se repete é a **fronteira de payload** — os módulos
"puros" que rodam no cliente **proíbem importar `lib/db/queries/*`** de
propósito, para não arrastar a cadeia do banco para o bundle.

| Grupo | Exemplos | Papel |
|---|---|---|
| Apresentação pura (cliente) | [contratos-indicios.ts](../../apps/web/lib/betim/contratos-indicios.ts), [fornecedores-puro.ts](../../apps/web/lib/betim/fornecedores-puro.ts), [legislacao-filtro.ts](../../apps/web/lib/betim/legislacao-filtro.ts), [legislacao/logica.ts](../../apps/web/lib/betim/legislacao/logica.ts), [format.ts](../../apps/web/lib/betim/format.ts), [temas.ts](../../apps/web/lib/betim/temas.ts) | Cálculo e filtro sem React/rede/banco |
| Segurança | [adminAuth.ts](../../apps/web/lib/betim/adminAuth.ts) | Porta dos `/api/admin/*` (falha fechando) |
| Orquestração de dados | [contratos.ts](../../apps/web/lib/betim/contratos.ts), [vereadores.ts](../../apps/web/lib/betim/vereadores.ts), [saude.ts](../../apps/web/lib/betim/saude.ts), [redeProtecao.ts](../../apps/web/lib/betim/redeProtecao.ts) | Chamam `lib/db/queries` e degradam (`ok:false`) |
| Diário e conteúdo | [diario.ts](../../apps/web/lib/betim/diario.ts), [noticias.ts](../../apps/web/lib/betim/noticias.ts), [legislacao/dados.ts](../../apps/web/lib/betim/legislacao/dados.ts) | Atos, blog e legislação municipal verificada |
| Registro/estática | [staticParams.ts](../../apps/web/lib/betim/staticParams.ts), [dadosNav.ts](../../apps/web/lib/betim/dadosNav.ts), [basePath.ts](../../apps/web/lib/betim/basePath.ts) | Rotas, navegação e prefixo |

### Achados da Parte 3

1. ✅ **Read fora da reserva — corrigido** (30/09/2026).
   [estatisticas-portal.ts](../../apps/web/lib/betim/estatisticas-portal.ts)
   (`/sobre`) usava `getDb()` direto; agora passa por `comBancoReserva` e cai
   no Neon/home-pc quando o Guara vem vazio. [diario.ts](../../apps/web/lib/betim/diario.ts)
   segue com `getDb()` direto, mas **de propósito**: tem fallback PRÓPRIO por
   fixture estática, registrado no cabeçalho do arquivo.

2. **HTML cru em `noticias`.** [noticias.ts](../../apps/web/lib/betim/noticias.ts)
   expõe `conteudoHtml`, renderizado com `dangerouslySetInnerHTML` em
   `app/[municipio]/noticias/[slug]`. Hoje o conteúdo é autoral do portal
   (`noticias_seed.py`), então o risco é baixo — mas se o campo passar a
   receber HTML de fonte externa, precisa de lista branca, como já é feito
   com `relevancia_html` (`sanitizar_html_curado`).

3. ✅ **Três arquivos sem cabeçalho** (`diario.ts`, `indicadores.ts`,
   `noticias.ts`) ganharam o bloco de onboarding (regra 5.9). Em
   `indicadores.ts` saiu também código morto (`const error = null`, resto da
   migração do Supabase).

4. ✅ **Comentário contraditório — corrigido** (30/09/2026). O cabeçalho de
   `getDoacoesSummary` ([vereadores.ts](../../apps/web/lib/betim/vereadores.ts))
   agora diz o que acontece: o DOCUMENTO (CPF/CNPJ) não é exposto; o NOME é
   público pela Lei 9.504/97.

5. ✅ **`adminAuth` em tempo constante — corrigido** (30/09/2026). A
   [adminAuth.ts](../../apps/web/lib/betim/adminAuth.ts) trocou o `===` por
   `timingSafeEqual` (o `===` vaza o token por timing). Continua fechando sem
   `ADMIN_TOKEN`.

6. **O que está certo:** a fronteira cliente/servidor dos módulos puros; o
   `ok:false` explícito na degradação; a legislação municipal só com
   `.gov.br` como "encontrado".

## Parte 4 — rotas que leem banco (app/)

A superfície é grande: **102 arquivos de `app/` importam `lib/db`**. A maior
parte é Server Component pré-renderizado (o dado vem do build). O que importa
na revisão de rota é: **payload**, **teto do Worker** e **o que é público de
verdade**.

| Peça | Papel |
|---|---|
| `*.din.ts` (22 rotas) | Só existem no alvo Cloudflare (rota dinâmica no request); no Guara, `next start`/`next dev`. |
| `app/api/chatbot` | RAG do Seu Nonô (ver Parte 2). |
| `app/api/telegram` | Webhook do bot (menus, callbacks). |
| `app/api/v1/bases` | Catálogo público de bases, CORS `*` (dado público, ok). |
| `app/api/dados-resumidos` | Agregados para o assistente. |
| `app/api/pageview`, `contador`, `pedido-dados` | Escritas públicas no D1, com `ipDoCliente` + `lib/rate-limit`. |

### Achados da Parte 4

1. ✅ **IP do cliente no chatbot — corrigido.** `app/api/chatbot/route.ts`
   extraía o IP inline (`cf-connecting-ip ?? x-forwarded-for[0] ?? 127.0.0.1`),
   sem o `x-real-ip` e sem a documentação do motivo. Agora usa `ipDoCliente`
   (`lib/rate-limit-ip.ts`), o mesmo das rotas `.din.ts` — o XFF cru é
   falsificável. (Consolida na camada de rota o achado 2 da Parte 2.)

2. ✅ **Webhook do Telegram — endurecido, sem parar o bot** (30/09/2026). A
   rota compara o `x-telegram-bot-api-secret-token` em **tempo constante** e
   **fecha com 403** quando `TELEGRAM_WEBHOOK_SECRET` existe. Sem o segredo,
   segue **aberta** (o bot continua funcionando) mas avisa no log — o buraco
   não passa despercebido. A env agora está documentada em
   [`apps/web/.env.example`](../../apps/web/.env.example). Falta o dono
   definir o valor no deploy e reenviar o `setWebhook({ secret_token })`.

3. ✅ **`dados-resumidos` na cadeia de reserva** (30/09/2026). As quatro
   consultas passaram a usar `comBancoReserva`, e o 500 devolve mensagem
   genérica (o detalhe vai para o log do servidor). Segue sem rate limit —
   agregado barato, baixo risco.

4. 🔸 **`dangerouslySetInnerHTML` contabilizado** em toda a `app/`: JSON-LD
   (constantes/`JSON.stringify` de dado controlado), notícias (HTML autoral) e
   `relevanciaHtml` (sanitizado no ingestor). Nenhum caminho não confiável
   hoje — mas é o ponto a vigiar quando entrar fonte externa.

5. ✅ **Superfície mínima:** sem `middleware.ts`; `v1/bases` só dado público.

## Parte 5 — coleta (scripts/ e etl/)

A camada que traz o dado bruto. São **~80 coletores `coletar-*`** em
`scripts/`, mais o ETL por frente em `etl/<frente>/etl/`. Revisar um a um é
trabalho por-fonte; aqui vão as regras transversais do
[AGENTS § 11](/AGENTS.md) — User-Agent honesto, pausa por host, `robots.txt`
— e o que foi medido.

| Regra | Situação |
|---|---|
| Segredo fora do git | ✅ só `.env.example`/`.env.exemplo` rastreados, sem valores. |
| Pausa entre requisições | ✅ 38 coletores com pausa explícita. |
| `robots.txt` | ✅ lido e registrado em vários (o caso FGV, com escopo reduzido, está no repo). |
| User-Agent honesto | ✅ coletores corrigidos (ver achado 1); reteste ao vivo pendente. |
| Retomada por checkpoint | ✅ presente nos coletores longos (PNCP, cavas). |

### Achados da Parte 5

1. ✅ **User-Agent honesto — corrigido nos coletores de coleta** (30/09/2026).
   Os que coletam e usavam UA de navegador puro agora identificam o projeto,
   mantendo o prefixo que passa no WAF:
   `etl/judiciario/etl/tj/tjmg.py`, `etl/congresso/etl/camara/presenca.py`,
   `etl/betim/etl/camaras/sp.py`, `etl/betim/etl/bd/tse.py` e
   `etl/betim/etl/prefeitura/obras.py`.
   `etl/betim/scripts/medir_links_fonte.py` **não entra**: o UA de navegador
   dele é um reteste de falha, não coleta — estava documentado assim.
   Falta o reteste ao vivo por fonte, que não se faz na CI.

2. 🔸 **Superfície de ~80 coletores.** A revisão fina (checkpoint, tratamento
   de 403/429, dedup) é por frente — encaixa nas próximas rodadas, não numa
   passada só.

3. ✅ **Higiene de segredo:** `scripts/.env.exemplo` documenta cada variável
   (`GATILHO_TOKEN`, `TELEGRAM_*`) e o raio de vazamento de cada uma; o `.env`
   real não é rastreado.

## Parte 6 — frentes (ambiental, paraopeba, terras, judiciário, congresso)

Cada frente é uma pasta em `lib/` com o mesmo desenho: **lógica pura** em
`*.ts` testado ao lado, **dado grande** em `*-dados.ts` marcado
`SERVER-ONLY`, e os coletores fora do app.

| Frente | Núcleo | Observação |
|---|---|---|
| Ambiental | [lib/ambiental](../../apps/web/lib/ambiental) | ~45 módulos: legislação unificada, TAC, barragens, convênios e payload. |
| Paraopeba | [lib/paraopeba](../../apps/web/lib/paraopeba) | Acordos, ATIs, auditoria AJRI e a régua de triagem de dado pessoal. |
| Terras | [lib/terras](../../apps/web/lib/terras) | Leitura das camadas do globo 3D e cruzamentos por município. |
| Judiciário | [lib/judiciario](../../apps/web/lib/judiciario) | Agregado, ofício determinístico, DataJud ao vivo, remunerações. |
| Congresso | [lib/congresso](../../apps/web/lib/congresso) | Rubricas, ofício, rank, bancadas e o cliente LLM server-only. |

### Achados da Parte 6

1. ✅ **Dois arquivos sem cabeçalho** nessas frentes — `ambiental/nossos-rios-dados.ts`
   (que ainda tinha **BOM** no início) e `congresso/bancadas.ts` — ganharam o
   bloco de onboarding (regra 5.9); o BOM saiu.

2. ✅ **Dado grande só no servidor.** Os `*-dados.ts` marcados `SERVER-ONLY`
   (`estudos-dados`, `decisoes-cge-dados`, `auditoria-ajri-dados`,
   `inspecoes-cnj-dados`, …) existem para o JSON bruto **não** cruzar a
   fronteira servidor→cliente — a disciplina do teto de payload, respeitada.

3. ✅ **Triagem de dado pessoal** mora em
   [lib/paraopeba/triagem.ts](../../apps/web/lib/paraopeba/triagem.ts) — a
   régua que pega "L.H.M.G." e listas de desaparecidos, que o mod-11 não
   pega. É o complemento semântico do scanner de CPF.

4. ✅ **Arquivos gerados** trazem o aviso no cabeçalho (`ARQUIVO GERADO — não
   editar à mão`, ex. `ckan-mg-*`, `convenios-mg`, `tac-gtac`).

5. 🔸 **Vigiar número curado.** `ambiental/nossos-rios-dados.ts` tem cada
   indicador com `fonte`/`dataReferencia`, mas alguns campos de texto (ex.
   `populacaoBacia: "2,3 milhões"`) não trazem a fonte colada — mesmo risco da
   regra editorial: número sem data vira dívida.

6. ✅ **Chave de LLM é server-only** em `congresso/llm/cliente.ts`, com aviso
   explícito de nunca importar de client component.

## Parte 7 — componentes e compactação

Fecha a revisão por duas caudas: a acessibilidade dos componentes globais
(`app/components/`, 78 arquivos) e a **compactação dupla**, que é dívida
registrada e não se toca sem remedir.

### Achados da Parte 7

1. ✅ **Imagens acessíveis.** As 18 tags `<img>` da `app/` têm `alt` (os dois
   "candidatos sem alt" eram linhas de comentário, não tag). Ícone sem texto
   não carrega informação sozinho.

2. ✅ **Dois componentes de gráfico sem cabeçalho — corrigidos.**
   [GraficoBarrasSvg.tsx](../../apps/web/app/components/GraficoBarrasSvg.tsx)
   e [GraficoLinhaSvg.tsx](../../apps/web/app/components/GraficoLinhaSvg.tsx)
   ganharam o bloco de onboarding. Os dois desenham com `aria-hidden` e
   expõem `descricaoAcessivel` — a cor não é o único canal.

3. ✅ **Acessibilidade transversal:** `CvdToggle` (daltonismo), temas com
   contraste medido (testes do globo), `BotoesExportar` (CSV com BOM +
   impressão). São as seis qualidades do [AGENTS § 8](/AGENTS.md) no
   componente.

4. 🔸 **Compactação dupla (não unificar).**
   [lib/comunicabr/arquivo.ts](../../apps/web/lib/comunicabr/arquivo.ts) e
   [lib/estatico/compactar.ts](../../apps/web/lib/estatico/compactar.ts) são
   **duas implementações deliberadas** (decisão de 16/08, registrada no
   ESTADO). Aplainar o codec perde o ganho de ordem de grandeza. Fica
   documentado como decisão, não como dívida a pagar.

## Parte 8 — segurança e escrita

Segunda passada, agora fina: os caminhos de escrita e de autorização —
`lib/painel`, `lib/gestao`, `lib/rate-limit.ts`, `lib/rate-limit-ip.ts`,
`lib/chat-comum.ts`, `lib/server-only/json-etl.ts` e as rotas `/api/admin`.

### Achados da Parte 8

1. ✅ **Admin fechado.** Os 6 handlers de `/api/admin/*` chamam
   `isAdminAuthorized` (agora em tempo constante); sem `ADMIN_TOKEN`, 401.

2. ✅ **Painel de edição é local por construção.** As rotas do painel só
   existem como `*.local.ts`, que `next.config.ts` mantém fora de qualquer
   build (`painelLocalLigado`). Ele usa `PAINEL_TOKEN` próprio (nunca o
   `ADMIN_TOKEN`), **fail-closed**, e escreve caminho fixo
   (`data/edicoes.json`) — sem travessia. O `git` roda por `execFileSync`
   (sem shell, sem argumento do usuário).

3. ✅ **JSON grande fora do bundle.** `json-etl.ts` (`SERVER-ONLY`) lê por
   `readFileSync`, o padrão que evita estourar o teto de 3 MiB gzip do Worker
   — o erro 10027 de 24/08 está documentado no cabeçalho.

4. ✅ **IP unificado numa fonte só** (30/09/2026). `chat-comum.ts`
   (`ipDoVisitante`) agora delega a `ipDoCliente` (`lib/rate-limit-ip.ts`),
   que é a ordem canônica `cf-connecting-ip → x-forwarded-for → x-real-ip`.
   Antes havia duas implementações da mesma regra; a de `rate-limit-ip.ts`
   já trazia o TODO da unificação.

5. 🔸 **`checarUpstash` renova a janela a cada `INCR`.** `EXPIRE` é chamado em
   toda requisição, então sob carga sustentada a janela reinicia e o bloqueio
   só solta após 60 s de silêncio. É mais rígido que o desejado, não mais
   frouxo — e é caminho **dormente** (Upstash não está configurado; o padrão é
   o binding do Worker). Fica anotado para quem ligar o Upstash.

## Parte 9 — testes que não testavam (navegação)

Terceira passada, sobre `lib/navegacao`, `lib/busca` e `lib/tabela`.

### Achados da Parte 9

1. ⚠️ → ✅ **Dois testes sem código sob teste — corrigidos** (30/09/2026).
   `lib/navegacao/alerta-contextual.test.ts` montava a mensagem DENTRO do
   próprio teste, e `lib/navegacao/indice-pagina.test.ts` redefinia a função
   de slug no arquivo: os dois passavam sem exercitar produção nenhuma — o
   caso que a skill `revisar-seguranca-cp` descreve ("verde não prova nada").
   **Correção:** as funções puras viraram módulos reais —
   [indice-pagina.ts](../../apps/web/lib/navegacao/indice-pagina.ts)
   (`slugDeTitulo`) e
   [alerta-contextual.ts](../../apps/web/lib/navegacao/alerta-contextual.ts)
   (`montarMensagemAlerta`, `CABECALHOS_ALERTA`) —, os componentes
   (`IndicePagina`, `CentralAlertasClient`, `BotaoAlertaContextual`) passaram
   a importá-las, e os testes agora exercitam o código de verdade.

2. ✅ **Cabeçalho de alerta duplicado.** A mesma lista de 8 cabeçalhos estava
   copiada em `CentralAlertasClient` e em `BotaoAlertaContextual`. Unificada
   em `CABECALHOS_ALERTA`; o corpo da mensagem continua próprio de cada tela
   (de propósito — são telas diferentes).

3. ✅ **`lib/busca` e `lib/tabela`** conferidos por amostragem: cabeçalho e
   teste ao lado, sem lógica reimplementada no teste.

## Parte 10 — escrita pública e resiliência

Quarta passada, em módulos frios (longe das sessões paralelas).

### Achados da Parte 10

1. ✅ **`lib/pageviews/validar.ts`** — validação da escrita pública
   (`POST /api/pageview`): recusa URL externa (`://`), URL protocol-relative
   (`//`), espaço em branco e string acima de 300 caracteres. É honesta ao
   dizer que é contador aproximado, não métrica de faturamento. Sem furo.

2. ✅ **`lib/robusto/rede.ts`** — retry com as três regras do Google SRE
   cap. 22, documentadas: jitter sempre (full jitter), retentável separado de
   permanente (5xx/429/rede retentam; 4xx e validação nunca) e orçamento de
   retry por processo. Sem furo.

3. ✅ **`lib/empresas`** — 4 arquivos sem cabeçalho (`dados.ts`,
   `noticias.ts`, `entidades-dados.ts`, `sigmine.ts`) ganharam o bloco de
   onboarding; os dois últimos são **SERVER-ONLY** (`node:fs`) e agora avisam.

## Parte 11 — LinkMender e denúncia

Quinta passada, em módulos frios.

### Achados da Parte 11

1. ✅ **`lib/linkmender`** — verificação de link com HTTP real **e** validação
   de CONTEÚDO, pela regra "200 e mente": HEAD com fallback GET-range,
   `%PDF` exigido para PDF, soft-404 detectado, `finalUrl` comparada para
   separar `REDIRECT` de `OK`. A correção é uma **camada**
   (`data/link-correcoes.json`) aplicada no prebuild, que **nunca reescreve**
   o dado versionado — a trilha é reversível.

2. ✅ **`lib/denuncia`** — o facilitador de denúncia de direitos humanos é
   **100% client-side**: nenhuma peça manda o texto para a rede (sem
   `fetch`/`node:fs`). O rascunho é **opt-in** (`localStorage`), expira em
   24h e tem "apagar tudo" sempre visível; o contrato (`tipos.ts`) declara
   que o texto "nunca é serializado para uma requisição de rede". **Não
   coleta CPF**; `nomeDenunciante` é opcional.

3. 🔸 **Escopo do LinkMender.** `verificar.ts` busca URL arbitrária (SSRF
   potencial em tese), mas o pipeline roda como **script no home-pc**, sobre
   URL curada — não é rota pública. **Se um dia virar API, precisa de
   allowlist de host.**

## Parte 12 — conselhos e correlação

Sexta passada, em módulos frios.

### Achados da Parte 12

1. ✅ **4 arquivos sem cabeçalho** ganharam o bloco de onboarding:
   `lib/correlacao/detectar.ts`, `sigma.ts`, `sigma-dados.ts` e
   `lib/conselhos/catalogo.ts`.

2. ✅ **Conferidos por amostragem** (cabeçalho e teste ao lado): `lib/acordos`,
   `lib/instituicoes`, `lib/clima`, `lib/assembleias`, `lib/legislativo`,
   `lib/direitos`, `lib/direitos-humanos`, `lib/cavas`, `lib/estudos-rurais`.

3. ✅ **`lib/brumadinho/repasse.ts`** — dupla via de leitura: `node:fs` no
   build e `env.ASSETS.fetch` quando publicado. SERVER-ONLY; sem furo.

## Parte 13 — a compactação dupla

Sétima passada. Revisei de fato os dois codecs que o ESTADO cita como "dívida
que não se unifica".

### Achados da Parte 13

1. ✅ **`lib/estatico/compactar.ts`** — esqueleto + rótulos internados. A
   decisão de internar é **medida em bytes, coluna a coluna** (nunca por
   palpite); aborta em arquivo truncado, em registro heterogêneo e em índice
   fora do dicionário; serializa **uma linha por registro** para o diff seguir
   legível.

2. ⚠️ → ✅ **`nuncaInternar` era opt-in — endurecido** (30/09/2026). Só 2 dos
   ~13 chamadores de `compactar` passavam a lista. Agora o módulo bloqueia
   **por padrão** coluna que cheira a documento pessoal (nome contendo `cpf`,
   ou `titulo_eleitor`, `cnh`, `rg`, `pis`, `nit`, `passaporte`), somado ao
   `nuncaInternar` do chamador. **CNPJ não é bloqueado** — é dado público de
   empresa. Testes cobrem os dois casos. O piso real continua sendo o scanner
   de CPF sobre `apps/web/data`.

3. ✅ **`lib/comunicabr/arquivo.ts`** — codec **posicional**, deliberadamente
   diferente: o texto é NACIONAL e o número é municipal, então guarda um
   dicionário de rótulos e uma **lista de esqueletos** (assinatura de estrutura
   nova vira esqueleto novo, em vez de encaixe à força — o que evita saúde
   virar educação). **Não unificar com `compactar`**: são ganhos de ordens
   diferentes, e a duplicação é decisão, não descuido.

4. ✅ **`lib/estatico/fatiar.ts` + `emitir.ts`** — fatiamento para o teto de
   25 MiB do Cloudflare; o par "índice fatiado + `TabelaEstatica`" é o padrão
   da casa para acervo grande.

## Parte 14 — arquivos da raiz de lib/

Oitava passada, nos módulos soltos da raiz de `lib/`.

### Achados da Parte 14

1. ✅ **Conferidos** (cabeçalho e, quando aplicável, teste ao lado):
   `alvo-de-build`, `atuacao-parlamentar`, `citacoes`, `dialogos`, `edicoes`,
   `hero-narrativo`, `link-zona`, `lugares`, `memoria-cidades`,
   `risco-direitos`, `rota-ausente`, `series-economicas`, `tags`,
   `teia-interesses`, `use-loading`, `zonas`.

2. ✅ **As duas `risco-direitos.ts` NÃO são duplicata:** a de `lib/` é o
   **cálculo puro** do índice (0–100); a de `lib/db/queries/` é o **agregador**
   que lê o banco. Complementares.

3. 🔸 **`resumos-top100.ts` é GERADO** (`// Gerado automaticamente de
   top-100-paginas.json`). Não ganha cabeçalho `/**` à mão — seria sobrescrito
   na próxima geração; o marcador `//` já cumpre o aviso, como em `schema.ts`.

## Parte 15 — laboratório dither e afins

Nona passada.

### Achados da Parte 15

1. ✅ **8 arquivos de `lib/laboratorio/dither-charts/` sem cabeçalho** ganharam
   o bloco de onboarding: `dither-engine.ts`, `use-canvas-setup.ts`, os cinco
   gráficos (`DitherBarChart`, `DitherDonutChart`, `DitherGrowthChart`,
   `DitherHeatmapGrid`, `DitherStackedChart`) e `ServerGauge.tsx`. Todos apontam
   a origem (**amicro, MIT**) e que a cor não é o único canal.

2. ✅ **Conferidos** (cabeçalho e teste quando aplicável): `lib/documentos/espelho`,
   `lib/editais/dados`, `lib/noticias/{ortografia,portal}`,
   `lib/cultura/{salic,juncao-banco,juncao-fornecedor,incentivadores-mg}`,
   `lib/eixos/*`, `lib/cidades/*`, `lib/presenca/vocabulario`,
   `lib/telefonia/cobertura`, `lib/hiperlinks/referencias-cruzadas`,
   `lib/seo/contexto-pagina`.

3. 🔸 **`lib/laboratorio/dados-catalogo.ts`** foi o único ponto que toca o
   índice de risco fora do eixo Cidades — sem furo, mas é onde uma mudança de
   contrato de `IndiceRiscoDireitos` ecoaria primeiro.

## Parte 16 — memória das resistências

Décima passada, em `lib/memoria`.

### Achados da Parte 16

1. ✅ **`lib/memoria/guardas.ts`** — `verbeteValido` recusa verbete sem fonte
   completa; `fontesPrimarias` tira Wikipédia/Wikidata; `resolverMemoria` desce
   município → UF → região → país e devolve o degrau mais específico com fonte.

2. ⚠️ → ✅ **`verbeteValido` passou a exigir ao menos UMA fonte primária.**
   Antes aceitava um verbete cuja única fonte fosse terciária (Wikipédia),
   o oposto da regra "fonte terciária nunca decide". A base de hoje não tem
   esse caso — há teste que garante que nenhuma fonte das camadas é
   Wikipédia/Wikidata —, mas o guarda agora fecha a porta. Teste novo cobre.

3. ✅ **Conferidos**: `lib/memoria/{calendario,camadas,datas-referencia,index,locais,mistica,municipios,rotulos,tipos}`,
   `lib/deploy/tamanho-assets`, `lib/globo/voo`, `lib/recursos/dados-consumidores`,
   `lib/automacao/rotinas.test`, `lib/legislativo/ranking-estadual`.

## Parte 17 — acervos estaduais e multinacionais

Décima primeira passada, nos acervos que alimentam as páginas de governo e de
economia (`lib/legislativo` e `lib/fornecedores`). A varredura de cabeçalhos,
feita fora das partes 1–16, achou **só dois arquivos sem bloco de abertura** —
os dois tratados aqui.

### Achados da Parte 17

1. ✅ **`lib/legislativo/ranking-estadual.ts`** — acervo das 27 assembleias
   (ALEs e CLDF): deputados, remuneração, gabinete e ranking pela régua
   garantista. Ganhou cabeçalho com a fonte oficial (TSE, CNJ, TCEs) e a nota
   de que a pontuação é índice do projeto, não veredito sobre a pessoa.

2. ⚠️ → ✅ **Fallback silencioso para MG removido.** `obterAssembleiaEstadual`
   devolvia o acervo de MG para qualquer UF ausente. O JSON cobre as 27 UFs,
   então o ramo era código morto — mas, se faltasse uma UF, a página
   `[uf]/legislativo` publicaria deputado de MG sob a URL de outro estado.
   Agora devolve `null` (a página já responde 404). Teste novo cobre.

3. ⚠️ → ✅ **Texto fixo "parlamento mineiro"** em
   `app/governo/[uf]/legislativo/page.tsx` — a descrição dizia "mineiro" nas
   27 páginas, inclusive na ALESP (SP). Passou a citar a UF da assembleia.

4. ⚠️ → ✅ **`mediaAnualGeralBrl` somava médias.** Em
   `lib/fornecedores/calculos-multinacionais.ts`, o agregado chamado "média
   anual geral" devolvia a SOMA das médias anuais (número inflado). Corrigido
   para a média das médias. Sem consumidor hoje — corrigido antes do 1º uso.

5. ✅ **Conferidos**: `lib/legislativo/*` (resto), `lib/fornecedores/*`,
   `lib/laboratorio/dados-catalogo` (liga os dois acervos ao gráfico dither).

## Parte 18 — dados de fonte (fontes, coleta, texto)

Décima segunda passada, nos utilitários de fonte e coleta.

### Achados da Parte 18

1. ✅ **`lib/coleta/fetch-resiliente.ts`** — cliente HTTP dos coletores:
   User-Agent honesto, backoff exponencial com jitter, `Retry-After` (429/503),
   4xx permanente × 5xx transitório e checkpoint atômico. Já bem documentado;
   entra na tabela sem reescrita.

2. ✅ **`lib/texto/normalizar-numeros.ts`** — converte fração de grandeza
   ("0,4 bilhões" → "400 milhões") com concordância e prefixo "R$". Conferido;
   sem defeito.

3. ⚠️ → ✅ **`lib/fontes/registry.ts` — o catálogo de fontes apodreceu.** Dos
   42 registros, **13 `caminhoArquivo` apontavam para arquivo inexistente**.
   Causas medidas:
   - dado migrado para bundle ETL em `etl/betim/dados/*`, lido no build por
     `carregarJsonEtl` (sirenejud, tac-gtac, execucao-fgv, sintese-ajri,
     inspecoes-cnj) — o catálogo dizia `data-json` e `apps/web/data/...`;
   - dado embutido em módulo TS gerado (convenios-federais-mg);
   - dado consolidado em `biblioteca-desastres-unificada.json` (dpmg-notas,
     quadrilatero-ferrifero, casos-nacionais-crimes, acoes-coletivas-justica);
   - geojson renomeado (terras-indigenas, territorios-quilombolas);
   - arquivo renomeado (salic-rouanet → rouanet-mg-projetos).

4. ⚠️ → ✅ **`CamadaDado` não tinha a camada ETL.** O catálogo existe para
   declarar a camada de alocação de cada base (para não estourar o bundle);
   sem `"etl"`, o dado servido por `carregarJsonEtl` era rotulado `data-json`
   com caminho falso. Camada adicionada, com inicializador e teste atualizados.

5. ✅ **Guarda contra drift.** `registry.test.ts` ganhou teste que exige, para
   todo `caminhoArquivo` declarado, arquivo existente no repositório. O
   apodrecimento silencioso não volta.

6. 📌 **Registrado — o catálogo não é consumido.** `registry.ts` só é importado
   pelo próprio teste. A promessa do cabeçalho ("rastreabilidade em todas as
   telas e APIs" e "exposição na API pública") **não está ligada** ao `/api`
   nem às telas. Dívida: ligar o registro ou assumir que é só documentação.

7. ✅ **Conferidos**: `lib/fontes/*`, `lib/coleta/*`, `lib/texto/*`.

## Parte 19 — segurança, server-only e utilitários

Décima terceira passada, nos utilitários transversais e no envio de e-mail.

### Achados da Parte 19

1. ⚠️ → ✅ **`lib/email/enviar-smtp.ts` — o dot-stuffing corrompia o
   terminador.** O corpo do `DATA` passava por `replace(/\r\n\./g, "\r\n..")`
   **depois** de o terminador `\r\n.\r\n` já ter sido anexado: o `\r\n.` final
   virava `\r\n..` e o servidor SMTP ficava esperando o fim do DATA — o envio
   travava. O terminador agora entra depois do stuffing, na função pura
   `prepararDadosSmtp`, com teste de regressão.

2. ⚠️ → ✅ **Leitura de resposta SMTP multi-linha.** `lerResposta` fechava na
   primeira quebra de linha; como as respostas (`EHLO`, `STARTTLS`, `AUTH`)
   têm várias linhas (`250-` de continuação e `250 ` na última — RFC 5321
   §4.2.1), um pacote TCP partido desalinhava o comando seguinte. Agora só a
   última linha (`^\d{3} `) fecha a resposta.

3. ⚠️ → ✅ **`timeout` sem handler.** `socket.setTimeout(30s)` só emitia o
   evento; a promise podia pendurar para sempre. Agora destrói o soquete com
   erro, que rejeita quem espera.

4. 📌 **Injeção de cabeçalho — defesa em profundidade.** `de`/`para` entram
   crus em `MAIL FROM`/`RCPT TO`/`From:`/`To:`. O único consumidor
   (`/api/pedido-dados`) valida o e-mail com regex que barra `\s` (logo, CRLF),
   então não há furo hoje. Fica registrado: novo chamador que passe `para` sem
   validar reabre a injeção.

5. 📌 **Terceira cópia de CSV.** `jsonParaCsv` reimplementa o padrão do portal
   (BOM + `;`) já centralizado em `lib/tabela/csv.ts`. Dívida: unificar.

6. 📌 **CSV sem neutralização de fórmula.** `escaparCelulaCsv`
   (`lib/tabela/csv.ts`) protege aspas e separador, mas não neutraliza célula
   que começa com `=`, `+`, `-` ou `@` (CSV injection ao abrir no Excel). O
   dado é oficial e o risco é baixo; fica registrado.

7. ✅ **Conferidos**: `lib/tabela/csv.ts` e `ordenar.ts` (ordenação estável;
   ausente vai para o fim nas duas direções), `lib/utilitarios/{calculos,
   documentos,fusos}` — o DV do código IBGE (módulo 10, pesos 1 e 2) foi
   recalculado em Betim `3106705` e Belo Horizonte `3106200`, e confere —,
   `lib/seo/contexto-pagina.ts`.

## Parte 20 — junções editoriais (cruzamentos e teia)

Décima quarta passada, no ponto mais sensível do portal: o módulo que junta
dois dados verdadeiros e devolve uma frase para o leitor. É onde a
[regra editorial](/AGENTS.md) aperta de verdade — dois números certos lado a
lado podem sugerir um terceiro, falso. Nada aqui publica vínculo entre
pessoas; o risco desta rodada é outro e mais comum: **concluir a partir de
lacuna**, tratando "não sei" como "está tudo bem".

Cobre [`lib/cruzamentos/correlacionador.ts`](../../apps/web/lib/cruzamentos/correlacionador.ts)
(lido por 5 páginas), [`lib/teia-interesses.ts`](../../apps/web/lib/teia-interesses.ts)
e o renderizador
[`CruzamentosEducativos.tsx`](../../apps/web/app/components/eixos/CruzamentosEducativos.tsx).

### Achados da Parte 20

1. ⚠️ → ✅ **A lacuna vira selo "Regular" — corrigido (01/10/2026).** Quando um dos lados do cruzamento
   não existe, `calcularCruzamentosMunicipais` devolve um card mesmo assim:
   com `formula` (ex.: *Leitos Hospitalares × Demanda Populacional*) que
   **não foi calculada**, um texto preenchido e `status: 'neutro'` — que o
   componente renderiza como selo discreto "Regular". A página
   `terra-e-territorios/cidades/[slug]` cai sempre nisso: passa **só** a
   população, então os três cards saem sem número nenhum. O leitor lê
   fórmula, selo e prosa e conclui que o portal analisou a cidade dele.
   AGENTS §7: *lacuna é informação* — o selo de lacuna é "sem dado", não
   "Regular".

2. ⚠️ → ✅ **População fabricada em dois caminhos — corrigido (01/10/2026).** `const pop = dados.populacao
   ?? 50000` (correlacionador, linha 30) e
   `dadosCompletos?.populacao ?? (cidade.tipo === 'capital' ? 1200000 : 150000)`
   (`[slug]`, linha 88). Hoje é **latente**: as cinco chamadas passam
   população e o `[slug]` não tem leitos/homicídios/repasses, então nada
   multiplica. Mas qualquer campo que chegue depois passa a calcular
   homicídios por 100 mil hab. e leitos por mil hab. sobre um número
   digitado à mão — que é justamente o que o §8 proíbe
   (*número na tela vem de constante medida com data*).

3. ⚠️ → ✅ **Um mesmo portal publica três referências de IDEB — corrigido (01/10/2026).** O motor usa
   `idebMeta ?? 5.5`; a chamada de `/direitos-em-movimento/educacao` passa
   `idebMeta: 5.8`; o cartão de topo **da mesma página** diz
   `Meta nacional estipulada: 6,0`. Os valores divergem também: o cartão
   publica `IDEB 5,8` e o cruzamento calcula com `idebAnosIniciais: 6,1`.
   Sobra o rótulo `IDEB Médio Anos Iniciais`, que não existe no INEP —
   o IDEB tem anos iniciais e anos finais. Número errado é dano.

4. ⚠️ → ✅ **Limiares sem fonte e sem data — corrigido (01/10/2026).** `taxaHomicidios > 25` e
   `razaoLeitosPorHab < 1.5` (linha 66), `repassePerCapita > 1500`
   (linha 96), `diferenca >= -0.5` (linha 36). São esses números que
   decidem o selo "Alerta" ou "Positivo" — mas o rodapé do componente
   promete *"Todo cruzamento tem base documental oficial (DataSUS, INEP,
   SINESP, Tesouro)"*. Os limiares não vêm de nenhum dos quatro.

5. ⚠️ → ✅ **Repasso federal vira "Positivo" — corrigido (01/10/2026).** `repassePerCapita > 1500 ?
   'positivo' : 'neutro'` classifica receber mais transferência como
   resultado bom, com selo verde. É julgamento de valor impresso como
   cálculo — o mesmo desvio do *Repasse do Acordo* registrado no §7:
   receber não é ser beneficiado.

6. ⚠️ → ✅ **Prosa que conclui sem medir — corrigida (01/10/2026).** *"Isso demonstra bom rendimento
   escolar em relação à estrutura disponível"* — a estrutura não foi medida.
   Também *"recursos vitais"* e *"duplo funil de vulnerabilidade"*. O módulo
   embrulha a frase no formato de dado; a regra é o contrário: o número vem
   do dado, o texto só o apresenta.

7. ⚠️ → ✅ **Ponto decimal em português publicado — corrigido (01/10/2026).** O mesmo módulo formata de
   dois jeitos: o repasse usa `toLocaleString('pt-BR')` (`R$ 3.500`), mas
   leitos e homicídios usam `.toFixed()` puro. Medido em execução, sem
   população informada, a frase sai como *"A rede pública dispõe de 2.00
   leitos SUS por mil habitantes frente a uma taxa anual de 100.0
   homicídios por 100 mil hab."* — denominador fabricado (achado 2) e
   separador decimal do inglês na mesma frase em português. Leitor
   brasileiro lê vírgula; o portal manda ponto.

8. 📌 **Sem hiperlink para a fonte.** `CruzamentoMunicipalItem` tem
   `indicadoresEnvolvidos: string[]` (nomes em texto, ex.
   `CNES/DataSUS`) e nenhum campo de URL. Regra das seis qualidades, item 1:
   todo registro publicado leva link direto e específico para a fonte
   oficial.

9. 📌 **Totais de topo digitados à mão.** `/educacao` publica `178.416`,
   `47,3 mi`, `88,2%`; `/saude-publica` publica `315.420`, `1,95`,
   `11,4 mi`. Constantes literais sem data de medição e sem constante
   medida por trás — iguais aos cartões que o §8 manda puxar de
   constante datada.

10. ⚠️ → ✅ **O teste consolidava o defeito — consertado na Fase 1
    (01/10/2026).** O caso *"trata lacunas sem falhar"*
   só espera `status === 'neutro'` nos três cards: cobre o sintoma e não o
   defeito (mesmo padrão da Parte 9). Nenhum teste entra por
   `populacao` ausente, que é o caminho da taxa fabricada do achado 2.

11. ✅ **Conferida a Teia de Interesses.** O cabeçalho declara que nenhum
    vínculo é exibido antes de comprovação em fonte oficial;
    `gerarRelatorioCidadao` filtra link em branco, declara a lacuna na
    metodologia e não inventa vínculo — com 4 testes cobrindo exatamente
    isso. É o padrão editorial que o `correlacionador` ainda não segue.

12. 📌 **Fontes da Teia citadas na mão.** A metodologia do relatório lista
    `PNCP, TSE, SICAR, SIGBM/ANM, SIRENEJud, DATASUS` hardcoded,
    duplicando `lib/fontes/registry.ts` — catálogo que ninguém consome
    (achado 6 da Parte 18). Duas listas de fonte para o mesmo dado.

## Parte 21 — busca estática (lib/busca)

Décima quinta passada, na qualidade nº 2 da regra das seis — *buscável e
filtrável* —, e no maior módulo ainda intocado: **91 KB em 6 arquivos**, com
6 testes (paridade 1:1). A busca do portal tem dois lados que precisam dar a
mesma resposta: o Postgres (`to_tsvector('portuguese',
unaccent_immutable(texto))`) e o navegador (índice fatiado). Esta parte
revisa o lado do navegador — [`normalizar.ts`](../../apps/web/lib/busca/normalizar.ts),
[`indice.ts`](../../apps/web/lib/busca/indice.ts) e
[`carregarIndice.ts`](../../apps/web/lib/busca/carregarIndice.ts). Os dois
arquivos de dado (`paginas-portal.ts`, 914 linhas; `resposta-curada.ts`,
546 linhas) vão para a Parte 22.

### Achados da Parte 21

1. ⚠️ → ✅ **Frase exata com número de lei não acha nada — corrigido
   (01/10/2026).**
   `interpretarConsulta` normaliza a frase com `separarPalavras`
   (`"Lei 1.234/2020"` → `lei 1234 2020`), mas a conferência da linha 372
   compara com `semAcento(doc.t + " " + doc.e)`, que devolve
   `lei 1.234/2020`. **Nunca casa.** Medido com índice real: o mesmo texto
   digitado **sem aspas devolve 1 resultado; entre aspas, 0**. E a tela não
   deixa passar — `BuscaClient.tsx:300` manda o leitor usar
   *"aspas" para frase exata*, e o placeholder sugere
   `PL 3611 — "frase exata" entre aspas`. Funciona com espaço simples
   (`"PL 3611"`), quebra com ponto, barra, vírgula e hífen — justamente o
   formato oficial como a norma é citada em documento, que o comentário de
   `separarPalavras` promete resolver.

2. ⚠️ → ✅ **Exclusão casa por subcadeia; inclusão casa por radical —
   corrigido nos dois lados (01/10/2026).** Os
   termos positivos passam por `candidatos()` (radical, prefixo e tolerância
   de digitação); os negativos (linha 380) e o bônus de título (linha 385)
   fazem `textoNormalizado.includes(palavra)` sobre o texto acento-sem, sem
   radicalizar e sem separar palavras. Resultado: `-lei` também remove o
   documento que fala em *leitura* ou *leilão*, e `-brasilia` remove
   *brasiliense*. Incluir é fino, excluir é grosso — e o leitor não vê o que
   sumiu.

3. ⚠️ → ✅ **O índice carrega com `fetch` nu, e a rede resiliente não é
   importada por ninguém — corrigido (01/10/2026).** `carregarIndice.ts:30` faz `await fetch(url)`
   sem timeout, sem retentativa e sem passar por
   [`lib/robusto/rede.ts`](../../apps/web/lib/robusto/rede.ts)
   (`comRetry`, `erroRetentavel`) — que **só existe no repo para o próprio
   teste**: a varredura no repositório inteiro achou apenas `rede.ts` e
   `rede.test.ts`. Mesmo destino do catálogo de fontes (achado 6 da Parte
   18). Um fragmento de rede que falha derruba a busca inteira, e o portal
   já tem o módulo pronto que resolvia.

4. 📌 → ✅ **`1,5` indexa como `15` — corrigido (01/10/2026).** `separarPalavras` usa
   `(\d)[.,](?=\d)` para capturar o milhar (`1.234` → `1234`), mas a mesma
   regra come a vírgula decimal: `1,5 leitos` vira `15 leitos`. Como
   consulta e documento passam pela mesma regra, os dois números casam
   entre si — para a busca, *1,5* e *15* deixam de ser valores distintos.

5. 📌 → ✅ **`hoje` podia ser recalculado por documento — corrigido
   (01/10/2026).** `docPassaPeriodo`
   aceita `hoje` opcional; `buscar()` só repassa se `OpcoesBusca.hoje` veio
   preenchido. Sem isso, `dataDeHoje()` roda uma vez **por documento** —
   milhares de `new Date()` por tecla — e um laço que cruza a meia-noite
   filtra com dias diferentes no mesmo resultado.

6. ✅ **O que está certo e não deve ser "melhorado".** O cabeçalho de
   `normalizar.ts` mede o radicalizador do Postgres (18.4, 2026-08-09) e
   explica por que a ordem importa; o bloqueio de número puro no vizinho
   morfológico veio de medição real (`4793` × `47`, 20 resultados
   errados); a tolerância de digitação cresce com o tamanho da palavra e
   não a curta; `carregarGrupoFatiado` trata `fatias === 0`; e a teia de
   erros de digitação só roda depois de esgotado exato e prefixo.

## Parte 22 — respostas curadas e índice de páginas

Décima sexta passada, nos 1.460 linhas de dado que a Parte 21 deixou de fora:
[`resposta-curada.ts`](../../apps/web/lib/busca/resposta-curada.ts) (33
entradas de resposta pronta) e
[`paginas-portal.ts`](../../apps/web/lib/busca/paginas-portal.ts) (849
linhas de páginas catalogadas). Diferente dos outros arquivos do módulo,
estes dois **escrevem texto que o portal publica como resposta** — o risco
aqui não é performance, é o portal responder algo que ninguém perguntou.

### Achados da Parte 22

1. ⚠️ → ✅ **O campo `zona` é declarado em 13 entradas e nunca é lido.**
   `PerguntaEspecial.zona` aparece como `congresso`, `judiciario`,
   `ambiental`, `paraopeba` nas entradas, mas `buscarRespostaCurada` só
   lê `padroes`, `linkPrincipal` e `linksAdicionais` — o parâmetro
   `slugCidadeOuZona` vai só para `ajustarLinkParaCidade`, que reescreve
   rota e **nunca filtra**. Medido em execução: a pergunta *"O que a CCJC
   tem na pauta?"* chamada com slug `betim` devolve
   `/congresso/comissoes` sem pestanejar. O filtro existe no dado e não
   existe na regra. *(A primeira redação dizia 14 entradas; contado linha a
   linha em 01/10/2026, são 13: 4 de cada fronteira mais 1 de Paraopeba.)*

   **Corrigido (01/10/2026).** `zona` passa a ser lida: `ZONAS_DECLARADAS`
   é derivada da própria tabela (sem lista chumbada, para que fronteira
   nova entre sozinha) e o contexto só restringe quando é **uma zona
   declarada e diferente da entrada**. Reapuração do caso medido: com
   contexto `judiciario`, *"O que a CCJC tem na pauta?"* já **não** devolve
   `/congresso/comissoes`; com `congresso` devolve; com `betim` continua
   devolvendo — **decisão registrada**: município não desambigua fronteira,
   porque quem pergunta sobre a CCJC numa página de cidade quer a resposta
   da CCJC. Teste: `resposta-curada.test.ts` → *"zona do contexto descarta
   resposta de outra fronteira"*.

2. ⚠️ → ✅ **Casamento por subcadeia nos dois sentidos — e o cidadão não vê
   por que caiu lá.** A linha 487 testa
   `normalizada.includes(pNorm) || pNorm.includes(normalizada)`: a
   resposta dispara se a pergunta **contiver** o padrão ou se o padrão
   **contiver** a pergunta. Como há padrões de uma palavra, qualquer
   consulta curta que seja pedaço deles recebe a resposta pronta como se
   fosse a resposta da pergunta. Medido em execução com slug `betim`:

   | digitado | resposta devolvida |
   |---|---|
   | `rio` | *"A fiscalização externa do Judiciário brasileiro termina no 2º grau…"* → `/judiciario/instituicoes` |
   | `vale` | *"O Observatório Vale reúne a série histórica de cotações B3…"* → `/paraopeba/vale` |
   | `agenda` | Agenda do plenário e comissões → `/congresso/agenda` |
   | `processos` | Litígios ambientais do SIRENEJud → `/judiciario/sirenejud` |

   Quem digita *rio* quase sempre quer Rio de Janeiro ou o Rio doce; quem
   digita *vale* pode querer o valor de uma coisa. Os dois recebem uma
   resposta estreita rotulada como resposta do portal.

   **Corrigido (01/10/2026), nos dois lados.** (a) A direção inversa foi
   removida: casa só quem **contém** o padrão. (b) A etapa passou a exigir
   pergunta de 2+ tokens — termo solto não é pergunta e cai na busca, que
   tem índice medido. Reapuração: os quatro casos da tabela agora devolvem
   `null`; fragmentos de duas palavras (`"restricao de"` diante de
   `restricao de direitos`, `"aposentam ate"` diante de
   `aposentam ate 2030`) também deixam de receber a resposta alheia, e a
   direção correta segue casando (`"restricao de direitos"` →
   `/congresso/alertas`). Três testes novos em `resposta-curada.test.ts`.

3. ⚠️ → ✅ **Cifras digitadas à mão, sem data — nove, não duas.** A primeira
   redação apontou duas: `"…os R$ 677,4 milhões da repactuação em Minas
   Gerais…"` e `"O portal monitora 909 barragens…"`. Varredura linha a linha
   de `resposta-curada.ts` em 01/10/2026 achou **nove** ocorrências de
   cifra de acervo em prosa ou texto de link:

   | cifra | resposta afetada |
   |---|---|
   | `R$ 677,4 milhões` | Acordo do Rio Doce |
   | `909 barragens` | barragens SIGBM/ANM |
   | `8.940` normas federais e `6.378` estaduais | legislação ambiental |
   | `R$ 5,48 bilhões` + `26 municípios` | execução do Acordo (2 respostas) |
   | `710 conselhos` (prosa **e** texto do link) | conselhos de direitos |
   | `343 relatórios` | inspeções do CNJ |
   | `12 mineradoras` | Canadá & mineração |
   | `199 Cidades` (texto do link) | cidades |

   O número **existe** medido em módulo de dado (`lib/ambiental/barragens-sigbm.ts`
   documenta a contagem; `COBERTURA_CANADA` é literal, medida e datada em
   2026-09-30), mas aqui virou prosa colada — e a regra do §8 é que o número
   na tela vem de constante medida com data. A contagem de barragens do
   SIGBM muda; o texto não.

   **Corrigido (01/10/2026) por remoção, não por importação.** A constante
   medida fica na página de destino, que a publica datada; a prosa deixa de
   repeti-la. Repetir exigiria importar o módulo de dado aqui — e
   `SeuNono.tsx` e `ChatbotIa.tsx` são `"use client"`, então cairia no
   bundle do cliente: `barragens-sigbm.json` tem 92 KB e
   `lib/internacional/dados-canada.ts` puxa 48 KB de JSON (AGENTS.md §5.1).
   Permanecem só números de fato normativo, que não são total de acervo:
   `75 anos (LC 152/2015)`, `20%` do quinto constitucional, `2º grau`,
   `TRT-3`, `Form 20-F`, `VALE3`. Um teste percorre as 13 entradas da
   tabela e falha se cifra de acervo voltar para prosa ou para texto de
   link.

4. 📌 → ✅ **O teste de "integridade" não testava se a rota existe.**
   `paginas-portal.test.ts:39` percorre as 849 linhas checando `id`,
   `titulo`, `descricao`, `href.startsWith("/")` e `palavrasChave` — nada
   verificava que `href` corresponde a uma rota real do App Router. Lista
   hardcoded de rotas envelhece em silêncio; foi exatamente assim que
   `/noticias/direitos-em-movimento-guia` chegou publicado apontando para
   404 (achado desta semana, corrigido no commit `3d91f8dc`).

   **Quitado em 01/10/2026.** Medição antes de escrever o teste: 304 rotas
   na árvore `app/` contra 69 páginas catalogadas → **2 hrefs órfãos**, os
   dois em Paraopeba: `/paraopeba/repasses` e `/paraopeba/ptr`, que não
   existem em lugar nenhum do `app/`. O primeiro passou a apontar para
   `/paraopeba/execucao` (a página que consulta município a município — a
   descrição do card já dizia isso); o segundo, para o hub `/paraopeba`,
   porque o PTR era outro programa (hoje o pagamento é o NAE) e o hub é
   quem explica as duas siglas — mesmo destino que
   `top-100-paginas.json` já usava. O teste agora varre `app/` a cada
   execução e falha listando `id -> href` do que faltar.

5. 📌 → ✅ **`buscarPaginasPortal` não usava `separarPalavras`.** A linha
   881 dividia por `split(/\s+/)` mantendo pontuação: `"licitações;"` virava
   o termo `licitacoes;` e não casava com `licitacoes`. O resto do módulo
   (`indice.ts`, `resposta-curada.ts`) passa tudo por `separarPalavras`.
   Duas normalizações para a mesma busca.

   **Quitado em 01/10/2026.** A consulta inteira agora sai de
   `separarPalavras` e os termos vêm do mesmo passo — uma normalização só,
   igual à do índice. Teste: `"licitações;"` devolve exatamente o que
   `"licitacoes"` devolve, e `"licitações púbicas:"` o que
   `"licitacoes publicas"` devolve.

6. 📌 **O limiar 0,45 mede só o padrão.** `intersecao /
   palavrasP.length` conta quanto do **padrão** está na pergunta, sem
   penalizar pergunta muito maior que ele — uma pergunta de 30 palavras
   que contenha metade de um padrão de 6 pontua alto e entra no mesmo
   lugar de quem perguntou aquilo exatamente.

7. ✅ **O que está certo.** Os 8 testes cobrim os caminhos reais,
   inclusive o de prefixo de município (`"Quanto a Prefeitura de Betim
   gasta em saúde?"` → `/betim/prefeitura/despesas`), e os casos negativos
   (`"oi"` e uma string sem sentido devolvem `null`).

   **Retificado em 01/10/2026.** A frase que acompanhava este item — *"fora
   os dois números do achado 3, as respostas curadas não trazem total de
   acervo solto"* — estava errada: a varredura da mesma rodada achou
   **nove**, não dois (achado 3). O item foi marcado ✅ sem ter medido a
   afirmação. É o motivo de a varredura ter virado teste: comentário
   errado convence, teste não (AGENTS.md §9).

8. 📌 **Mesma tela publica 14 e 12 para o mesmo acervo.** Achado novo,
   medido em 01/10/2026 ao fechar o achado 3:
   `data/canada/mineradoras-tsx-brasil.compact.json` tem 14 linhas
   (`ca-min-01` … `ca-min-14`) e `COBERTURA_CANADA.mineradorasTsxBrasil`
   é `14`, medido em 2026-09-30 — é o número que o cartão de `/canada`
   renderiza. A mesma página e mais nove lugares dizem **12**: os metadados
   de `/canada` e `/canada/mineracao`, `PainelMineracaoCanada.tsx`,
   `SeuNonoData.ts`, `EmpresasClient.tsx`, `internacional/page.tsx`,
   `europa/page.tsx`, `escada-determinista.ts` e dois JSON de dado
   versionado (`assistente-acervo.json`, `noticias-portal.json`).
   As duas contagens podem até ser defensáveis — 14 registros contra algum
   recorte de 12, já que há projetos em fase de pesquisa — mas nada explica
   a diferença ao leitor, e é exatamente a armadilha da §7: dois números
   verdadeiros lado a lado. **Não corrigido aqui:** decide-se qual é o
   número canônico antes de reescrever dez arquivos, dois deles JSON de
   dado gerado. Registrado em **Fora do escopo desta sessão**.

## Parte 23 — a guarda de dado pessoal (a cadeia do §5.2)

Vigésima terceira passada, na defesa mais dura do projeto — a que o
[AGENTS §5.2](/AGENTS.md) chama de regra que não se negocia. O que se mediu
não foi o regex: ele é o mesmo em três cópias. O que se mediu foi **quantas
das camadas prometidas estavam de pé**, porque duas delas dependiam de
configuração que ninguém conferia.

### Achados da Parte 23

1. ⚠️ → ✅ **O pre-push não roda nesta máquina — corrigido (01/10/2026).**
   Medido: `git config --get core.hooksPath` devolve **vazio**, e
   `.git/hooks` não tem um arquivo sequer. O hook `.githooks/pre-push`
   (3 KB) existe, é completo e roda as duas checagens — mas sem
   `core.hooksPath .githooks` ele nunca executa. A instrução de ligá-lo
   estava em [DESENVOLVIMENTO.md](../03-desenvolvimento/DESENVOLVIMENTO.md)
   e no cabeçalho do próprio hook; **não estava no AGENTS §5.2**, que é o
   texto que todo agente lê — e o §5.2 dizia que o script "roda no
   pre-push, na CI e na suíte", no imperativo. O cabeçalho do
   `dado-pessoal.yml:3-6` já chamava isto de "modo de falha silencioso".
   Consequência real: a única camada que barra **antes** da publicação
   estava desligada no PC que publica, e a CI só alcança o commit depois
   que ele já está no `origin/main` de um repositório público.
   **Correção:** `git config core.hooksPath .githooks` + linha de ligar o
   hook no [AGENTS §5.2](/AGENTS.md).

2. ⚠️ → ✅ **A segunda régua de CPF não roda em lugar nenhum — corrigido
   (01/10/2026).** `checar-dado-pessoal-em-dado.py` tem duas etapas:
   mod-11 (roda sempre) e `validate-docbr` (confirma o CPF de verdade e
   derruba falso positivo). Medido: **local sem a biblioteca** — o script
   imprimia "⚠️ validate-docbr não instalado" em toda execução — e o
   workflow fazia só `actions/setup-python` e já rodava o script, sem
   `pip install`. Ou seja, a régua validada em 31/08/2026 (M4) só aparecia
   quando alguém instalava à mão. **Correção:** biblioteca instalada
   localmente e passo `pip install validate-docbr` no
   [dado-pessoal.yml](../../.github/workflows/dado-pessoal.yml).
   Depois da correção: dado limpo (**444 arquivos**) e `--self-test`
   verde ("a régua vê CPF válido, ignora sintético/IBGE/CNPJ e informa o
   caminho").

3. ⚠️ → ✅ **`DIRETORIOS_DADO` com 8 diretórios de 110 — e isso não era
   buraco (corrigido de qualquer jeito).** `git ls-files '*.json'` dá 110
   diretórios com JSON rastreado; a lista tinha 8. Ficavam de fora
   `apps/web/public/municipios/*` (54 JSON do semeador do IBGE, **publicados
   no site**) e `etl/congresso/etl/benchmark/saidas_sonnet` (97 JSON de
   pontuação). Antes de publicar isso como falha, conferiu-se o outro guarda:
   `checar-dado-pessoal.py` declara `*.json` em `EXTENSOES` (linha 52) e
   varre **todo arquivo rastreado** por `git grep` — nenhum desses
   diretórios ficou sem rede. O que falta neles é só a varredura
   **estrutural** (só valores, não chaves nem geometria). A diferença importa:
   um achado da Parte 23 sem essa conferência teria virado alerta falso.
   Mesmo assim os dois entraram na lista, porque a regra do próprio script
   manda; medido depois: **444 arquivos, 15,6 s** por rodada.

4. ✅ **Três camadas confirmadas de pé.** (a) **Suíte:**
   `lib/sem-dado-pessoal-no-repo.test.ts` — 2 testes verdes em 9,5 s.
   (b) **CI:** `dado-pessoal.yml` roda código, roda dado e ainda roda o
   `--self-test`. (c) **Prova de que a régua não é cega:** o self-test
   confirma que acha CPF formatado e corrido, respeita `SINTETICOS` e não
   dispara em sintético, IBGE ou CNPJ. Fora da cadeia: o `.cache` do
   coletor de cavas (`scripts/.cache/`) não é rastreado — **0 arquivos** —
   então não é exposição.

5. 📌 **O guarda de código não tem `--self-test`.** Só o de dado tem. Se um
   bug fizesse o de código passar sempre, a CI não acusaria: quem o prova
   hoje é `lib/sem-cpf-no-repo.test.ts`, que é outro arquivo com outra
   régua. O próprio script já avisa que a regra vive em "três cópias"
   (ele, `checar-dado-pessoal.py` e o teste) — e das três, só uma se
   auto-prova. Registrado, não corrigido nesta sessão.

## Achados e dívidas

Confirmados no código nesta rodada:

1. **Fallback incompleto fechado (30/09).** `congresso.ts` (40 leituras) e
   `betim.ts` (98 leituras) eram os módulos grandes ainda fora da cadeia.
   Agora entram. Com isso, **12 dos 15 módulos de `queries/` usam
   `comBancoReserva`**; os 3 restantes são escritas, D1 ou fallback próprio.
   Commits `74899fbf` (congresso) e `b7b250be` (betim).

2. **`schema.ts` e `relations.ts` sem marcador de gerado.** São saída de
   `drizzle-kit introspect` (`out: ./lib/db` em
   [drizzle.config.ts](../../apps/web/drizzle.config.ts)). Um leitor pode
   editá-los à mão e perder a edição no próximo introspect. **Higiene:**
   emitir um cabeçalho “GERADO POR — NÃO EDITE” no gerador, como já faz
   `cidades-do-build.ts`.

3. **Duas trilhas de escrita.** `betim-escritas.ts` (Postgres, legado, só
   paridade) e `betimD1.ts` (D1, escritas ao vivo). Enquanto as duas
   existirem, cada mudança de escrita pode divergir. Registrar qual é a
   canônica por operação antes de mexer.

4. **Segurança — piso confirmado.** Sem `sql.raw` nem `.raw(` em `lib/db`:
   os templates `sql\`\`` são parametrizados, então injeção é impossível por
   construção. Admin falha fechando; escrita pública nasce `aprovado:
   false`. O risco real do projeto é **dado pessoal**, e as defesas vivem no
   caminho do dado (`apps/web/lib/sem-cpf-no-repo.test.ts`,
   `scripts/checar-dado-pessoal-em-dado.py`), não no código-fonte.

5. **`getDb` direto (sem reserva).** Sobra em `betim-escritas.ts`,
   `betimD1.ts`, `municipios.ts` e nas funções por USUÁRIO de `judiciario.ts`
   (`monitoramentosDoUsuario`, `alertasDoUsuario`, `criarMonitoramento`) —
   todas corretas por natureza, não são leitura pública.

6. **O catálogo de fontes não é consumido (Parte 18).** `lib/fontes/registry.ts`
   só é importado pelo próprio teste; a "exposição na API pública" do cabeçalho
   não existe no código. Ou o portal passa a ler o registro, ou ele é documento
   — não fonte de verdade. O caminho continua guardado por teste.

## Fila de revisão

Próximas micro-partes, por risco e retorno:

| # | Micro-parte | Por quê |
|---|---|---|
| 1 | ✅ `lib/assistente/` (RAG do Seu Nonô) | Feita — Parte 2 deste doc: prompt, abstenção e blindagem. |
| 2 | ✅ `lib/betim/` | Feita — Parte 3 deste doc: fronteira de payload, três cabeçalhos e dois reads fora da reserva. |
| 3 | ✅ `app/` — rotas que leem banco | Feita — Parte 4: IP do chatbot, webhook do Telegram, payload. |
| 4 | ✅ `scripts/` — coletores e ETL | Feita — Parte 5: UA honesto (pendência por-fonte), segredos e `robots.txt`. |
| 5 | ✅ `lib/ambiental/`, `lib/paraopeba/`, `lib/terras/`, `lib/judiciario/`, `lib/congresso/` | Feita — Parte 6: cabeçalhos, payload server-only, triagem. |
| 6 | ✅ `app/components/` | Feita — Parte 7: imagens com `alt`, gráficos com `descricaoAcessivel`. |
| 7 | ✅ Compactação dupla | Feita — Parte 7: registrada como decisão, não dívida. |
| 8 | ✅ Cadeia de dado pessoal (`sem-dado-pessoal-no-repo.test.ts`, `.githooks/`, `dado-pessoal.yml`) | Feita — Parte 23: era o único módulo do repo sem menção em nenhuma parte, e é a regra §5.2. Achou o pre-push desligado e a segunda régua de CPF fora do ar. |

**Primeira passada concluída (30/09/2026).** A fila acima foi percorrida de
ponta a ponta; o que sobra é revisão fina por fonte/módulo, não mais por
camada. A fina já cobre as Partes 17 a 22 — acervos estaduais, catálogo de
fontes, utilitários transversais, junções editoriais, a busca estática e as
respostas curadas.

## Plano de correção — sessão de 01/10/2026

Ordem por **dano** (número publicado errado primeiro), uma fase por commit,
cada correção com teste de regressão e conversão do marcador
`⚠️` → `⚠️ → ✅` nesta mesma sessão.

**Fase 1 — número publicado errado** ✅ **concluída (01/10/2026)**
(`lib/cruzamentos/`, `lib/eixos/types.ts`, `CruzamentosEducativos.tsx`,
`app/terra-e-territorios/cidades/[slug]/page.tsx`)

1. População fabricada → sem população válida, não se calcula taxa (achado 2).
2. `.toFixed()` → `toLocaleString('pt-BR')` (achado 7).
3. `idebMeta ?? 5.5` → sem meta, não se compara (achado 3).
4. Repasse deixa de ser `positivo` — receber transferência não é juízo de
   valor (achado 5).
5. Limiares viram constante nomeada e o critério é declarado na tela, sem
   prometer que ele vem de DataSUS/INEP/SINESP/Tesouro (achado 4).
6. Lacuna vira status `sem-dado` com selo próprio (achado 1).
7. Prosa deixa de concluir (achado 6).

**Fase 2 — busca** ✅ **concluída (01/10/2026)** (`lib/busca/`)

8. Frase exata passa a conferir o texto **normalizado igual** ao da consulta
   (achado 21.1).
9. Termos negativos passam a casar por radical, como os positivos — e o
   **bônus de título** também, que era o mesmo defeito do outro lado
   (achado 21.2, os dois lados dele).
10. `1,5` deixa de virar `15` (dívida 21.4).
11. `hoje` calculado uma vez por busca, não por documento (dívida 21.5).
12. Índice passa a usar `comRetry` (achado 21.3) — resolve de uma vez o
    módulo `lib/robusto/rede.ts` órfão.

**Fase 3 — respostas curadas** ✅ **concluída (01/10/2026)**
(`lib/busca/resposta-curada.ts`, `lib/busca/resposta-curada.test.ts`)

13. `zona` passa a filtrar quando o contexto é zona declarada e diferente;
    contexto de município não filtra (achado 22.1).
14. O casamento deixa de aceitar subcadeia reversa, e a etapa passa a exigir
    pergunta de 2+ tokens (achado 22.2).
15. As **nove** cifras de acervo saem da prosa e dos textos de link; o
    número medido continua na página de destino (achado 22.3). Um teste
    percorre as 13 entradas e falha se cifra voltar.

**Fase 4 — higiene** ✅ **concluída (01/10/2026)**
(`lib/busca/paginas-portal.ts`, `lib/busca/paginas-portal.test.ts`, este doc)

16. Teste que confere se a rota de `PAGINAS_PORTAL` existe (achado 22.4) —
    mediu 304 rotas contra 69 páginas e achou **2 hrefs órfãos**, ambos
    corrigidos.
17. `buscarPaginasPortal` passa a usar `separarPalavras` (dívida 22.5).
18. Marcador da Parte 9 corrigido para `⚠️ → ✅`.

**Fase 5 — guarda de dado pessoal** ✅ **concluída (01/10/2026)**
([AGENTS.md](/AGENTS.md) §5.2, [dado-pessoal.yml](../../.github/workflows/dado-pessoal.yml),
`scripts/checar-dado-pessoal-em-dado.py`, este doc — Parte 23)

19. Pre-push **ligado** nesta máquina (`git config core.hooksPath .githooks`)
    e a linha de ligá-lo publicada no AGENTS §5.2, que antes prometia a
    camada sem dizer que ela precisa ser acionada por clone (achado 23.1).
20. `pip install validate-docbr` virou passo do workflow e a biblioteca
    entrou no clone — a segunda régua de CPF, que derruba falso positivo,
    roda de novo na CI e na máquina (achado 23.2).
21. `DIRETORIOS_DADO` ganhou `apps/web/public/municipios` e
    `etl/congresso/etl/benchmark`; o cabeçalho do script passou a registrar
    **por que** a contagem de 8 em 110 não era buraco, para a próxima
    leitura não publicar alerta falso (achado 23.3).
22. Parte 23 publicada e referenciada na fila (linha 8).

**Fora do escopo desta sessão** — registrado, não é esquecimento:

- catálogo de fontes consumido (dívida 18): muda o contrato da API pública;
- injeção de cabeçalho SMTP (dívida 19.4): defesa em profundidade, hoje não
  há chamador inseguro;
- terceira cópia de CSV (dívida 19.5): mexe em exportação de e-mail;
- limiar 0,45 do Seu Nonô (dívida 22.6): precisa de medida antes de mudar;
- hyperlink da fonte nos cruzamentos (dívida 20.8): pede uma URL por
  indicador, que é formato do item publicado — a Fase 1 mexeu no cálculo,
  não no formato;
- totais de topo digitados à mão em `/educacao` e `/saude-publica` (dívida
  20.9): antes de publicar constante datada é preciso saber **de onde** cada
  número é medido, e isso não está escrito em lugar nenhum;
- fontes da Teia hardcoded (dívida 20.12): depende do catálogo da Parte 18,
  que é a primeira da lista;
- 14 e 12 mineradoras na mesma tela (achado 22.8): decide-se qual número é
  canônico antes de reescrever dez arquivos, dois deles JSON de dado gerado.
- `--self-test` do guarda de **código** (dívida 23.5): hoje só o de dado se
  prova; o de código é coberto por `sem-cpf-no-repo.test.ts`, que é outra
  régua — três cópias da regra e uma só se auto-verifica.

**Verificação em cada fase:** `tsc --noEmit`, `eslint` nos arquivos do diff,
`vitest` do escopo, guarda de CPF e `python scripts/validar-documentacao.py`.

## Decisões registradas

- **Reserva por consulta, não por conexão** — o caso real é banco conectado e
  vazio, não conexão caída (ver [reserva.ts](../../apps/web/lib/db/reserva.ts)).
- **Leitura pública entra na cadeia; escrita e dado por usuário nunca** —
  senão lê de um banco e escreve em outro, e o estado do usuário se divide.
- **Revisão por micro-partes, uma camada por rodada** — lê-se o módulo, não o
  repositório.
- **Achado sem confirmação no código não entra aqui** — a ordem se decide por
  consequência, não por categoria.
- **Contagem que parece buraco se mede contra o outro guarda antes de virar
  alerta** — a Parte 23 achou 8 diretórios de 110 e só não publicou isso
  como falha porque conferiu o `EXTENSOES` do script irmão. Achado dito sem
  essa conferência é achado errado com cara de achado certo.
