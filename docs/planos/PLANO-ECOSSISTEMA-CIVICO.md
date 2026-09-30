# PLANO — Ecossistema Cívico: achar, entender, usar e participar sem catraca

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ESTADO.md](../02-estado/ESTADO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md), [PLANO-NAVEGACAO-E-NOTIFICACOES.md](PLANO-NAVEGACAO-E-NOTIFICACOES.md), [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md), [PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md), [PLANO-AUTOMACAO-LOCAL.md](../05-operacao/PLANO-AUTOMACAO-LOCAL.md), [PLANO-DIVULGACAO-ZERO-CUSTO.md](PLANO-DIVULGACAO-ZERO-CUSTO.md), [PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md)
> **Palavras-chave:** ecossistema, busca universal, command palette, ferramentas, utilitarios, calculadora, horario mundial, guia telefonico, applivre, oficina civica, sem cadastro, local-first, PWA, gamificacao, grafo, API publica, arquitetura hibrida, home-pc, cutiazinha, picoclaw, colibri, ollama, acessibilidade, privacidade

## Sumário

- [Propósito](#propósito)
- [Diagnóstico — a cola que falta](#diagnóstico--a-cola-que-falta)
- [A metáfora da esquina](#a-metáfora-da-esquina)
- [Matéria-prima medida — o que já existe](#matéria-prima-medida--o-que-já-existe)
- [Padrões que valem copiar — padrão, nunca dependência](#padrões-que-valem-copiar--padrão-nunca-dependência)
- [O ecossistema em cinco camadas](#o-ecossistema-em-cinco-camadas)
- [Camada 1 — Achar](#camada-1--achar)
- [Camada 2 — Entender](#camada-2--entender)
- [Camada 3 — Usar: a oficina](#camada-3--usar-a-oficina)
- [Ferramentas utilitárias — a caixa de ferramentas](#ferramentas-utilitárias--a-caixa-de-ferramentas)
- [Camada 4 — Guardar e lembrar sem conta](#camada-4--guardar-e-lembrar-sem-conta)
- [Camada 5 — Participar e se divertir](#camada-5--participar-e-se-divertir)
- [Sem catraca — como o estado vive sem cadastro](#sem-catraca--como-o-estado-vive-sem-cadastro)
- [De graça — como se sustenta](#de-graça--como-se-sustenta)
- [Oficina de bastidores — Guara magro, home-pc forte](#oficina-de-bastidores--guara-magro-home-pc-forte)
- [Divertir sem infantilizar o dado](#divertir-sem-infantilizar-o-dado)
- [Os três movimentos de maior alavanca](#os-três-movimentos-de-maior-alavanca)
- [Fases](#fases)
- [Riscos e mitigações](#riscos-e-mitigações)
- [Critérios de aceite](#critérios-de-aceite)
- [Verificação](#verificação)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Responder à pergunta do dono: **como o Controle Popular vira um ecossistema
completo, onde a pessoa acha tudo — de informação a ferramenta — sem
cadastro, de graça, fácil e com algum prazer no caminho?**

O plano parte do que já existe e mede o que falta. Ele não inventa número:
cada afirmação sobre o portal vem de documento com data; cada promessa de
interface vira critério de aceite verificável.

A régua editorial do [PRODUTO.md](../01-produto/PRODUTO.md) continua acima
de tudo: **o número vem do dado; o modelo, se houver, só embrulha**, e
**insinuação é dano**. Este plano não cria exceção a isso.

## Diagnóstico — a cola que falta

O portal já tem quase todas as peças soltas:

- busca universal na navbar (`BuscaGlobal`, 01/09);
- assistente cívico Seu Nonô com RAG em memória (30/09);
- as seis qualidades dos acervos (AGENTS §8);
- `/laboratorio` e caderno de citações (29/09);
- API pública v1 com Swagger (`/api`, `/api/v1/`);
- globo 3D com *deep-link* de camada (`?camada=`);
- grafo de conhecimento do Seu Nonô;
- TTS que lê o microresumo antes do conteúdo;
- Telegram público (`/comecar`, `/divulgar`);
- espelho do código no GitLab e Hugging Face (29/09).

**O que falta não é mais conteúdo. É a cola entre as peças:**

1. **Gestos de descoberta** — uma entrada só que mistura pergunta, lugar e ação.
2. **Ferramentas** — hoje o portal deixa *ler*; quase não deixa *fazer*
   (comparar, calcular, montar, reportar).
3. **Memória sem conta** — o portal não lembra que a pessoa esteve ali, e
   por isso não cria vínculo nem retorno.
4. **Loop de participação** — não há caminho fácil para corrigir a base,
   acompanhar um tema ou contribuir com o próximo.

A leitura do [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md) alerta
que a home tem seis cards de peso igual, sem "comece por aqui". É o mesmo
diagnóstico visto de outro ângulo: **a orientação e a cola são o produto a
construir agora**, não mais uma frente de dados.

## A metáfora da esquina

Pense numa **esquina** com três portas na mesma calçada:

- 📚 **biblioteca** — a informação (as seis frentes, os acervos);
- 🔧 **oficina** — as ferramentas (comparar, calcular, montar, exportar);
- 🎪 **praça** — a participação (corrigir, acompanhar, denunciar, aprender).

Hoje a **biblioteca é boa**. Faltam a **oficina** e a **praça** — e, antes
das duas, a **calçada** que liga as três sem tropeço.

"Sem cadastro" eu chamo de **sem catraca**: entra, usa, sai.
O acervo já respeita isso. O desenho técnico abaixo protege a promessa.

## Matéria-prima medida — o que já existe

Medição por documento, não por memória. **Remeça antes de construir em cima.**

| Peça | Onde | Documento medido |
|---|---|---|
| Busca universal | `BuscaGlobal` na navbar | [PLANO-NAVEGACAO-E-NOTIFICACOES.md](PLANO-NAVEGACAO-E-NOTIFICACOES.md) (01/09) |
| Assistente + RAG | Seu Nonô, 397 pedaços em memória | [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md) (30/09) |
| Seis qualidades | tabelas, filtros, CSV, cartões | [AGENTS.md § 8](/AGENTS.md) |
| Laboratório e caderno | `/laboratorio` | [RESUMO-PLANOS.md](RESUMO-PLANOS.md) (29/09) |
| API pública v1 | `/api`, Swagger UI | [PRODUTO.md](../01-produto/PRODUTO.md) |
| Globo 3D com camadas | `/funcaosocialterra/mapa` | [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md) |
| Grafo de conhecimento | árvore do Seu Nonô | [RESUMO-PLANOS.md](RESUMO-PLANOS.md) (29/09) |
| TTS com microresumo | top-100 | [PRODUTO.md](../01-produto/PRODUTO.md) |
| Telegram público | `/comecar`, `/divulgar` | [PLANO-NAVEGACAO-E-NOTIFICACOES.md](PLANO-NAVEGACAO-E-NOTIFICACOES.md) |

**Consequência de desenho:** a maior parte do ecossistema **já existe em
pedaços**. O custo maior não é criar dado novo — é **costurar, unificar a
entrada e abrir a oficina**.

## Padrões que valem copiar — padrão, nunca dependência

Filosofia herdada do [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md):
**copiar o padrão, nunca a biblioteca.** Isto vale para open source, software
livre e big tech igualmente.

| Projeto / gigante | O acerto | O que copiar no CP |
|---|---|---|
| **Wikipedia** | ler sem login; um artigo puxa o outro | verbete linkável; **nunca** pedir conta para ler |
| **Internet Archive / Gutenberg** | "pegue o arquivo", sem fricção | download sempre a um clique |
| **Google Search** | uma caixa só, zero atrito | a caixa já existe; falta o Enter levar ao **melhor destino** |
| **Perplexity / Wolfram Alpha** | resposta antes da página | Seu Nonô responde **número + fonte**, não lista de links |
| **Google Maps / Google Earth** | explorar por lugar, camadas ligáveis | globo 3D: ligar/desligar e **salvar** camadas |
| **Duolingo** | hábito em micro-lições | "aprenda sua cidade" em lições curtas |
| **Spotify Wrapped** | recapitulação pessoal compartilhável | **"Meu município em 2026"** em imagem, sem conta |
| **npm / PyPI / GitHub** | registry, *fork*, *issue* | dataset como pacote; correção por *issue*/PR |
| **Stripe docs / Swagger** | doc + *playground* + copiar-colar | API v1 já tem Swagger; falta o **"experimente aqui"** |
| **Raycast / Linear / VS Code** | *command palette* (⌘K) | uma paleta que faz tudo digitando: ir, ouvir, exportar |
| **Notion / templates** | ponto de partida pronto | modelo de pedido LAI, de dossiê, de pauta |
| **MySociety** (TheyWorkForYou, FixMyStreet, Alaveteli) | dado vira ação cívica | LAI já existe; somar "reporte erro na base" |
| **OpenCorporates / OpenSpending / GovTrack** | toda entidade tem URL | empresa, parlamentar, obra, barragem: cada uma com página |
| **Wikidata** | o grafo que liga tudo | grafo do Seu Nonô vira **navegação "quem se liga a quem"** |
| **Proton / Mozilla** | privacidade por padrão | nada de rastreio; preferências **locais** |
| **PWA** (Twitter Lite) | app sem loja | instalável e **offline** |
| **AppLivre** | diretório PT-BR de ferramentas livres | **caixa de ferramentas leve** como porta de entrada; o utilitário atrai, o cívico fica |

⚠️ **O que NÃO copiar:** dependência de UI que pese o *bundle* (o teto de
3 MiB gzip do Worker é real, ver [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md)),
*tooltip* só em *hover* (não existe no celular — doutrina já adotada no globo),
e qualquer padrão que esconda a fonte atrás de interação.

## O ecossistema em cinco camadas

O ecossistema se organiza em cinco camadas, da entrada à saída. Cada camada
aponta o que já existe e o que falta.

```text
1. ACHAR      →  busca universal + Seu Nonô + paleta de comandos + grafo
2. ENTENDER   →  microresumo + TTS + glossário visível + narrativas
3. USAR       →  comparar + calcular + montar dossiê + API playground + mapa
4. GUARDAR    →  URL como estado + localStorage + PWA + Telegram
5. PARTICIPAR →  corrigir base + acompanhar tema + aprender + compartilhar
```

## Camada 1 — Achar

**Objetivo:** uma entrada só resolve "pergunta", "lugar" e "ação".

| Movimento | O que é | Estado |
|---|---|---|
| Caixa única | a busca universal já existe; falta elevar o Enter ao melhor destino | 🚧 |
| Pergunta natural | ponte "Perguntar ao Seu Nonô" já iniciada (30/09) | 🚧 |
| **Paleta de comandos (⌘K)** | um atalho que abre busca, assistente e ações ("ir para", "ouvir", "exportar", "comparar") | ⛔ a criar |
| Grafo navegável | o grafo do Seu Nonô vira hiperlink entre entidades | 🚧 |

**Por que a paleta antes de tudo:** reusa o índice que já é carregado no
cliente, custa pouco *bundle* e unifica as três entradas. É o maior ganho por
linha de código do plano.

## Camada 2 — Entender

**Objetivo:** qualquer número exibido vem com o "o que é isto" ao lado.

O portal já é forte aqui (microresumo, TTS, glossário expandido, contraste
medido). O acerto a preservar é a doutrina do globo 3D: **explicação sempre
visível, nunca só em hover**.

| Movimento | Nota |
|---|---|
| Glossário inline padrão | sigla sempre expandida no texto que a usa |
| Microtexto "o que é isto" por bloco | responde antes da pergunta |
| Narrativa em camadas | já existe no Paraopeba e no globo |

## Camada 3 — Usar: a oficina

**Objetivo:** transformar leitura em ação. Hoje esta é a camada mais vazia.

| Ferramenta | O que faz | Base reusada |
|---|---|---|
| **Comparador** | duas cidades, dois parlamentares, dois contratos lado a lado | índice + tabelas |
| **Calculadora cívica** | "quanto minha cidade recebeu"; gastômetro; conversor de unidade | agregados medidos |
| **Gerador de dossiê** | empacota o que está na tela em PDF/CSV com fonte | `BotoesExportar`, impressão |
| **Playground da API** | "experimente aqui" no Swagger | `/api/v1` |
| **Mapa com "minha camada"** | desenhar área e cruzar camadas | globo 3D |
| **Modelos prontos** | pedido LAI, pauta de jornalista, roteiro de vereador | `PedidoLAI` |

⚠️ Toda ferramenta nasce com a ressalva colada ao número e com a fonte
linkada (AGENTS §7, §8). Ferramenta que calcula sem mostrar a origem não
entra.

## Ferramentas utilitárias — a caixa de ferramentas

Inspiração: o **AppLivre** (`applivre.pages.dev`), diretório em português de
ferramentas gratuitas e de código aberto. A lição dele não é o catálogo em si
— é que **utilidade ampla atrai visita, e a visita encontra o cívico**.

A regra desta caixa: **ferramenta leve roda no navegador (client-side)**.
Sem backend, sem chave, sem cadastro, sem enviar dado a servidor. Isso é o
que mantém "grátis" e "privado" ao mesmo tempo — e cabe no teto do Guara.

| Ferramenta | O que faz | Fonte / mecânica | Onde |
|---|---|---|---|
| **Calculadora cívica** | repasse per capita, % do orçamento, correção pela inflação (IPCA/INPC) | agregados medidos, origem à vista | por cidade e hub |
| **Horário mundial** | hora oficial de todos os países e fusos | `Intl.DateTimeFormat` com fuso IANA — dado zero | hub internacional |
| **Guia de contatos públicos** | telefone, e-mail, endereço e canal de ouvidoria de órgãos | unifica catálogo existente | `/guia` unificado |
| **Verificador de dígito** | confere CPF, CNPJ e código IBGE por mod-11 | cálculo local; **nada trafega** | utilitários |
| **Datas e prazos** | dias entre datas, prazo de LAI, idade | cálculo local | utilitários |
| **Conversor de unidade** | área, volume, moeda (com cotação e fonte) | fator declarado; moeda exige fonte | utilitários |

### O guia telefônico já existe em pedaços — falta unificar

O portal **já tem** a maior parte do que um "guia telefônico cívico completo"
precisa, espalhada em três lugares:

- `/direitos-em-movimento/informacao` — catálogo de transparência (LAI) com
  contatos de **445 entidades** públicas e concessionárias;
- `/judiciario/contatos` e `/instituicoes` — **990 unidades judiciárias** com
  telefone, e-mail, endereço e titular;
- `/[municipio]/contatos` — contatos do município.

⚠️ Os números acima vêm da própria página (observado em 30/09) — **remeça
antes de citar**. O movimento é **unificar, não criar**: uma página `/guia`
com busca tolerante a acento, faceta por esfera/UF/tipo, ordenação de coluna
e CSV com BOM (a regra das seis qualidades). Mesmo padrão acima para ampliar
para embaixadas e consulados, ligando ao hub internacional.

## Camada 4 — Guardar e lembrar sem conta

**Objetivo:** criar vínculo sem cadastro. **A conta é o navegador.**

| Movimento | Como, sem login |
|---|---|
| Estado na URL | sessão, filtro e camada já viajam na URL (padrão do `/laboratorio`) |
| Favoritos e histórico | `localStorage` — "minhas cidades", "meus temas" |
| App offline | PWA instalável; dado estático já é servido no *build* |
| Aviso por tema | Telegram/e-mail **opcional**, só para notificação |
| Portabilidade | exportar/importar a própria lista em JSON |

**Guarda-corpo de privacidade:** nada de rastreio, nada de conta obrigatória.
Preferências ficam no aparelho. Isto é decisão de desenho, não promessa de
marketing — e alinha com a postura do [AGENTS.md § 5.8](/AGENTS.md).

## Camada 5 — Participar e se divertir

**Objetivo:** o leitor vira colaborador sem burocracia.

| Movimento | O que é | Cuidado |
|---|---|---|
| Reportar erro na base | botão "achou erro? aponte a fonte" | vira *issue* no espelho OSS |
| Correção comunitária | padrão *issue*/PR do GitHub, já espelhado | moderação pelo dono |
| Acompanhar tema | seguir assunto recebendo aviso | Telegram já existe |
| Aprender brincando | micro-lições e quiz sobre a própria cidade | ver "Divertir sem infantilizar" |
| Recapitulação | "Meu município em 2026" compartilhável | gerado de número medido |

## Sem catraca — como o estado vive sem cadastro

A promessa "sem cadastro" precisa de mecânica, senão vira slogan.

1. **Ler não exige nada.** Nenhuma página pede conta — nem para exportar.
2. **Estado no endereço.** Filtro, aba, sessão e camada cabem na URL.
3. **Gosto no aparelho.** `localStorage` guarda favoritos e histórico.
4. **Notificação é opcional.** Telegram ou e-mail só para avisar; pode sair
   com `/parar` (já previsto no plano de navegação).
5. **Nada de rastreio.** Sem *cookie* de terceiro, sem perfil publicitário.

Isso é o modelo da Wikipedia e do OpenStreetMap: **a conta é um extra, nunca
a entrada**.

## De graça — como se sustenta

O plano não cria custo novo relevante, porque apoia no que já está decidido:

- **páginas pré-renderizadas** — o banco não é consultado por visita;
- **tiers free** — Guara, Cloudflare e Postgres já em uso;
- **espelho aberto** — GitLab e Hugging Face (29/09);
- **API pública** — dado aberto, sem chave;
- **dado versionado** — cresce no repositório, não no cadastro.

**Princípio de sustentação:** o ecossistema cresce por **dado e comunidade**,
não por base de usuários. Nenhuma camada acima depende de login para existir.

## Oficina de bastidores — Guara magro, home-pc forte

A pergunta do dono: **e o que não couber no Guara?** O container do Guara
Starter tem teto de **256 MB de RAM** — já está medido que o Ollama não cabe
lá (23/09), nem só para embeddings. A resposta não é engordar a nuvem; é
separar **onde cada coisa roda**.

**Princípio de ouro: o `home-pc` enriquece, não serve.**
A nuvem nunca depende do `home-pc` para renderizar uma página.
O trabalho pesado vira **dado estático** que entra no repositório. Se o
`home-pc` desligar, o site continua inteiro; ele só fica um pouco mais velho.

### Três pesos, três lugares

| Peso | Onde roda | Exemplo | Custo |
|---|---|---|---|
| **Leve** | navegador do leitor | calculadora, horário mundial, verificador mod-11, guia (dado estático) | zero de servidor; funciona offline |
| **Médio** | build e Guara | pré-render, índice de busca, compactação | já é o modelo atual |
| **Pesado** | `home-pc` (offline) | tradução, resumo, classificação, embeddings, verificação de fonte | cota de build não é gasta |

### A esteira que já existe (não criar orquestrador novo)

O repositório **já tem** a oficina montada. Decisão registrada em
[PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md):
reusar a esteira, não duplicar.

| Ferramenta | Papel | Onde |
|---|---|---|
| **PicoClaw** | monitor de saúde das fontes; sonda se a fonte ainda responde | `scripts/agent-tools/picoclaw-source-watcher.mts` |
| **Colibri Bridge** | orquestrador local (PicoClaw + Hermes via Ollama) | `scripts/colibri-bridge.mts`, `colibri/colibri-config.json` |
| **Ollama** | inferência local: tradução EN/FR→PT, resumo, classificação, embeddings | `localhost:11434` |
| **Cutiazinha** | daemon Go leve (Telegram/WhatsApp nativos, <20 MB RAM) que dispara as rotinas | `C:\DevCoder\cutiazinha` |
| **Fallback** | DeepSeek remoto, só com texto já sanitizado, quando o Ollama falha | `deepseek-chat` |

### Como isso serve as ferramentas deste plano

1. **Guia de contatos** — o Ollama normaliza nomes e endereços das 445+990
   entidades; o PicoClaw confere se a página oficial da entidade ainda
   responde. Resultado **commitado** como JSON; a página é estática.
2. **Horário mundial** — não precisa de backend: o fuso IANA vive no
   navegador. Só a curadoria da lista (país → fuso → hub) sai do `home-pc`.
3. **Calculadora cívica** — o cálculo roda no cliente; o que o `home-pc`
   pré-computa são os agregados (`COBERTURA_*`) e a série de inflação.
4. **Tradução dos hubs internacionais** — feita offline pelo Ollama e
   versionada; a página serve o texto pronto.

### Regras de segurança da oficina (herdadas, não novas)

- **Nada de segredo no repo** — token nunca entra em arquivo versionado
  ([AGENTS.md § 5.8](/AGENTS.md)).
- **Guarda mod-11 antes de commitar** dado coletado — o próprio verificador
  de dígito da caixa de ferramentas é a versão de bolso dessa régua.
- **Ferramenta client-side não envia dado pessoal** — o verificador de CPF
  roda no navegador; nada trafega, nada é guardado.
- **Modelo nunca substitui a fonte** — resumo e classificação entram
  rotulados com data e modelo ([AGENTS.md § 7](/AGENTS.md)).
- **Degradação graciosa** — sem `home-pc`, sem Ollama, a página mostra o
  último dado commitado e a data, nunca erro.

## Divertir sem infantilizar o dado

Aqui mora o risco editorial mais sério do plano. O leitor está sob estresse
(denúncia, remoção, barragem). Transformar isso em jogo pode banalizar a dor.

**Regra do plano:**

- **Gamifique a jornada, nunca o achado.** Selo se ganha por *explorar*, não
  por *encontrar tragédia*.
- **Sem ranking de vítimas, sem placar de denúncia.** Nada que compare dor.
- **Sem prazo artificial nem *streak* ansiosa.** Hábito gentil, não pressão.
- **Dado sério fica sério.** O tom lúdico vale para aprender e descobrir,
  nunca para o número do dano.
- A régua do [PRODUTO.md](../01-produto/PRODUTO.md) e do
  [AGENTS.md § 7](/AGENTS.md) está acima do jogo: insinuação continua dano.

## Os três movimentos de maior alavanca

Se só três coisas saírem, que sejam estas, nesta ordem:

1. **Paleta de comandos (⌘K)** — unifica busca, Seu Nonô e ações. Reusa
   índice existente. Maior ganho por linha.
2. **"Minhas cidades" sem conta** — `localStorage` + recapitulação
   compartilhável. Transforma visita em vínculo.
3. **Três ferramentas mínimas** — comparador, calculadora de repasse e
   gerador de dossiê. Abre a oficina.

Cada movimento tem entrega própria e testável; nenhum depende dos outros.

## Fases

| Fase | Entrega | Depende de |
|---|---|---|
| **E0 — Medir** | medir o *bundle* real e o índice atual antes de tocar em UI | — · 🚧 ferramenta em `apps/web/scripts/medir-bundle.mjs`; medição real pendente de build |
| **E1 — Cola** | paleta de comandos ligando busca + Seu Nonô + ações | E0 |
| **E2 — Vínculo** | "minhas cidades" em `localStorage` + recapitulação | E1 |
| **E3 — Oficina** | comparador, calculadora e gerador de dossiê | E2 |
| **E4 — Volta** | reportar erro na base + acompanhar tema | E3 |
| **E5 — Prazer** | micro-lições e quiz com a régua editorial acima | E4 |
| **E6 — Caixa de ferramentas** | calculadora, horário mundial, verificador de dígito e `/guia` unificado | E3 |
| **E7 — Oficina de bastidores** | enriquecimento offline (PicoClaw/Colibri/Ollama) virando dado estático | E0 |

**Medição de 30/09 (proxy).** Sem build de produção no checkout, mediu-se o
código-fonte dos 13 componentes de cliente criados: **129,6 KiB bruto · 40,5
KiB gzip de fonte** (≈1,3% do teto de 3 MiB). É PROXY, não o bundle real — o
bundle inclui React e o resto. A medição definitiva: `npm run build` e depois
`node apps/web/scripts/medir-bundle.mjs` antes do deploy.

**Não competir com a fila operacional.** O [ESTADO.md](../02-estado/ESTADO.md)
tem o Bloco A (validar banco, redirect da raiz, vulnerabilidades) na frente.
Este plano é trilha de produto, para depois — salvo ordem do dono.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Biblioteca nova estourar o *bundle* | medir gzip antes (E0); preferir CSS e reúso |
| Gamificação banalizar o dano | regra "jornada, não achado"; revisão editorial |
| Paleta virar "mais um" que ninguém acha | atalho visível + botão na navbar; testar com pessoa real |
| `localStorage` sumir com o aparelho | exportar/importar JSON; avisar com transparência |
| Ferramenta responder sem fonte | toda ferramenta nasce com origem linkada |
| Nuvem passar a depender do `home-pc` | princípio "enriquece, não serve"; ausência degrada para dado estático |
| Guia telefônico desatualizar em silêncio | PicoClaw confere a página oficial; campo com data da última verificação |
| Ferramenta client-side estourar o *bundle* | preferir cálculo puro e `Intl`; medir gzip na E0 |
| Escopo explodir em seis frentes | executar por fase, uma frente-piloto (Cidades) primeiro |

## Critérios de aceite

- [ ] Paleta de comandos acessível por teclado (`⌘K`/`Ctrl+K`) e por botão.
- [ ] Busca, Seu Nonô e ações na mesma paleta, com foco visível.
- [ ] "Minhas cidades" persiste no aparelho e exporta em JSON.
- [ ] Recapitulação "Meu município" gerada de número medido com fonte.
- [ ] Comparador funciona em duas cidades com filtro e exportação.
- [ ] Calculadora cívica mostra a origem de cada número.
- [ ] Gerador de dossiê reusa a exportação e imprime com fonte.
- [ ] Nenhuma nova página exige cadastro para ler ou exportar.
- [ ] Nenhum rastreio de terceiro adicionado.
- [ ] Contraste e foco medidos nos três temas, sem regressão.
- [ ] Calculadora cívica roda no cliente e mostra a fonte de cada fator.
- [ ] Horário mundial cobre os países dos hubs internacionais por fuso IANA.
- [ ] Verificador de dígito (CPF/CNPJ/IBGE) não envia nada a servidor.
- [ ] `/guia` unifica os catálogos existentes com busca, faceta e CSV.
- [ ] Nenhuma página pública deixa de renderizar sem o `home-pc`.

## Verificação

```bash
npm test                    # raiz: vitest + node:test do globo
npx tsc --noEmit
python scripts/validar-documentacao.py
```

Antes de qualquer biblioteca nova: medir o gzip do *bundle* (pré-requisito
E0, herança do [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md)).
Antes de commitar dado coletado: `python scripts/checar-dado-pessoal-em-dado.py`.

## Decisões registradas

- **A cola antes do conteúdo.** O gargalo é orientação e ação, não falta de
  acervo — o diagnóstico cruza o [REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md).
- **Copiar o padrão, nunca a dependência.** Vale para open source e big tech.
- **Sem catraca é desenho técnico**, não promessa: URL + `localStorage` + PWA.
- **Oficina cívica é a camada mais vazia** e a de maior retorno de utilidade.
- **Gamificar a jornada, nunca o dado** — guarda-corpo editorial do plano.
- **Uma frente-piloto (Cidades)** reduz risco antes de espalhar em seis.
- **Ferramenta leve roda no navegador** — client-side, sem backend, sem
  cadastro e sem enviar dado pessoal; é o que garante grátis e privado.
- **O `home-pc` enriquece, não serve** — o pesado vira dado estático
  commitado; a nuvem nunca depende dele para uma página abrir.
- **Reusar a esteira existente** (PicoClaw, Colibri, Ollama, Cutiazinha),
  nunca criar orquestrador novo — mesma decisão do
  [PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md).
- **O guia telefônico se unifica, não se recria** — os contatos já existem
  em três catálogos do portal.
- **Trilha de produto, subordinada à fila operacional** do
  [ESTADO.md](../02-estado/ESTADO.md) — não compete com o Bloco A.

## Origem / Histórico

Escrito em 30/09/2026, a pedido do dono: inspirar-se em projetos digitais
abertos, software livre e nos acertos das big techs para desenhar um
ecossistema completo no portal. Ampliado no mesmo dia com a inspiração do
**AppLivre** (`applivre.pages.dev`), a caixa de ferramentas utilitárias
(calculadora, horário mundial, guia de contatos) e a arquitetura híbrida
**Guara magro + `home-pc` forte**, reusando a esteira PicoClaw, Colibri,
Ollama e Cutiazinha.

Dialoga com [PRODUTO.md](../01-produto/PRODUTO.md),
[REVISAO-UX-E-ONBOARDING.md](REVISAO-UX-E-ONBOARDING.md),
[PLANO-NAVEGACAO-E-NOTIFICACOES.md](PLANO-NAVEGACAO-E-NOTIFICACOES.md),
[PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md),
[PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md),
[PLANO-AUTOMACAO-LOCAL.md](../05-operacao/PLANO-AUTOMACAO-LOCAL.md) e
[PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md).
Nenhum código foi alterado por este documento.
