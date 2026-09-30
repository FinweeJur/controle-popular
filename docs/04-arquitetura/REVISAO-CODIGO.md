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

1. **Dois reads com `getDb()` direto, fora da cadeia de reserva.**
   [estatisticas-portal.ts](../../apps/web/lib/betim/estatisticas-portal.ts)
   (`/sobre`) é candidato claro a `comBancoReserva`: sem reserva, um Guara
   vazio deixa a página de números do próprio portal em branco.
   [diario.ts](../../apps/web/lib/betim/diario.ts) tem fallback PRÓPRIO (por
   fixture estática), então a ausência de reserva ali é decisão, não
   esquecimento — registrado no cabeçalho do arquivo.

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

4. **Higiene de comentário.** O cabeçalho de `getDoacoesSummary`
   ([vereadores.ts](../../apps/web/lib/betim/vereadores.ts)) diz que o
   CPF/CNPJ do doador "não é mascarado" e, na frase seguinte, que "só se
   expõe nome/tipo/valor/data, não o documento" — o comportamento está certo
   (documento não é exposto; nome é público pela Lei 9.504/97), mas o texto é
   contraditório. Reescrever.

5. **`adminAuth` compara com `===`, não em tempo constante.** Com token de
   alta entropia e porta verificada (401), é risco baixo; fica registrado como
   higiene, não como falha.

6. **O que está certo:** a fronteira cliente/servidor dos módulos puros; o
   `ok:false` explícito na degradação; a legislação municipal só com
   `.gov.br` como "encontrado".

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
| 3 | `app/` — rotas que leem banco | Payload, teto do Worker, `.din.ts`. |
| 4 | `scripts/` — coletores e ETL | Rate limit, User-Agent honesto, `robots.txt`. |
| 5 | `lib/ambiental/`, `lib/paraopeba/`, `lib/terras/`, `lib/judiciario/`, `lib/congresso/` | Frentes com cálculo próprio. |
| 6 | `app/components/` | Acessibilidade (leitor sob estresse). |
| 7 | Compactação dupla | `lib/comunicabr/arquivo.ts` e `lib/estatico/compactar.ts`: duas implementações deliberadas — não unificar sem remedir. |

## Decisões registradas

- **Reserva por consulta, não por conexão** — o caso real é banco conectado e
  vazio, não conexão caída (ver [reserva.ts](../../apps/web/lib/db/reserva.ts)).
- **Leitura pública entra na cadeia; escrita e dado por usuário nunca** —
  senão lê de um banco e escreve em outro, e o estado do usuário se divide.
- **Revisão por micro-partes, uma camada por rodada** — lê-se o módulo, não o
  repositório.
- **Achado sem confirmação no código não entra aqui** — a ordem se decide por
  consequência, não por categoria.
