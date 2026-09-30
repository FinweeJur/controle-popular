# Revisão de código e onboarding

> **Tipo:** ARQUITETURA
> **Domínio:** global
> **Última medição:** 2026-09-30
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

1. ⚠️ **Dois testes sem código sob teste — corrigidos** (30/09/2026).
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

**Primeira passada concluída (30/09/2026).** A fila acima foi percorrida de
ponta a ponta; o que sobra é revisão fina por fonte/módulo, não mais por
camada.

## Decisões registradas

- **Reserva por consulta, não por conexão** — o caso real é banco conectado e
  vazio, não conexão caída (ver [reserva.ts](../../apps/web/lib/db/reserva.ts)).
- **Leitura pública entra na cadeia; escrita e dado por usuário nunca** —
  senão lê de um banco e escreve em outro, e o estado do usuário se divide.
- **Revisão por micro-partes, uma camada por rodada** — lê-se o módulo, não o
  repositório.
- **Achado sem confirmação no código não entra aqui** — a ordem se decide por
  consequência, não por categoria.
