# Plano — navegação padrão, pedidos por e-mail, notificações e contador público

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-01
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PRODUTO.md](../01-produto/PRODUTO.md), [PLANO-DIVULGACAO-ZERO-CUSTO.md](PLANO-DIVULGACAO-ZERO-CUSTO.md), [PLANO-ESPELHO-GITEE.md](PLANO-ESPELHO-GITEE.md), [OPERACAO.md](../05-operacao/OPERACAO.md)
> **Palavras-chave:** plano, navegacao, header, indice, rodape, notificacoes, telegram, email, contador, downloads, lgpd

## Sumário

- [Objetivo](#objetivo)
- [O padrão de página — toda página tem](#o-padrão-de-página--toda-página-tem)
- [Guarda-corpos (LGPD e anti-spam)](#guarda-corpos-lgpd-e-anti-spam)
- [Pedidos de dados por e-mail — 3 camadas](#pedidos-de-dados-por-e-mail--3-camadas)
- [Contador público de envios/downloads](#contador-público-de-enviosdownloads)
- [Busca global na navbar](#busca-global-na-navbar--✅-implementado-em-0109)
- [Botões de notificação (Telegram e e-mail)](#botões-de-notificação-telegram-e-e-mail)
- [Fluxo de atendimento (manual)](#fluxo-de-atendimento-manual)
- [Inventário do que pode ser pedido](#inventário-do-que-pode-ser-pedido)
- [Riscos e mitigações](#riscos-e-mitigações)
- [Critérios de aceite](#critérios-de-aceite)
- [Modelo de resposta pronto](#modelo-de-resposta-pronto)

## Objetivo

Dar a **toda página** do portal o mesmo esqueleto — cabeçalho, índice, links
relacionados, acesso aos dados, botões de notificação e rodapé — e permitir que
qualquer visitante **peça dados por e-mail** (resumo, CSV ou PDF) e **receba
notificações** (Telegram ou e-mail), com um **contador público** de envios e
downloads. Custo adicional zero (Umbler já pago, bot Telegram já existe).

## O padrão de página — toda página tem

| Bloco | O que é | Estado |
|---|---|---|
| **Header** | cabeçalho da zona + navegação (já existe por zona: `Header.tsx` em Cidades, barras inline em Congresso/Judiciário, cabeçalho enxuto em Terras/Paraopeba) | ✅ existente; unificar visual quando a UX for revisada |
| **Índice** | sumário da página (TOC) gerado dos `h2`/`h3` — componente client genérico `IndicePagina` (a criar), que monta âncoras sozinho, sem tocar em cada página | 🚧 componente a criar |
| **Links relacionados** | blocos "relacionados" por página — o portal já tem pontes (`lib/paraopeba/relacionados.ts`, links-uteis, `OutrasFrentes.tsx`); padronizar como bloco do rodapé de conteúdo | 🚧 padronizar |
| **Dados** | link para a seção de dados da página (tabela, CSV, dataset da API v1) — a exportação CSV já existe em quase toda tela (regra das cinco coisas) | ✅ dado presente; falta o botão de contagem (ver Contador) |
| **Notificações** | botões "Receber no Telegram" (t.me/ControlePopularBOT) e "Receber novidades por e-mail" | ✅ no rodapé (01/09) |
| **Footer** | rodapé padrão com ações e contador | ✅ `FooterGlobal` estendido (01/09) |
| **Busca global** | barra de busca fixa na navbar, índice pré-carregado, resultados em dropdown, sem sair para /busca | ✅ `BuscaGlobal` na `TopNav` (01/09) |

**Onde mora o padrão:** o rodapé padrão com ações é `FooterGlobal` (aparece nas
seis frentes). O índice e os relacionados são por página; a estratégia é um
componente genérico client (`IndicePagina`) montado no cabeçalho de conteúdo de
cada layout de zona, e não em cada uma das ~1.400 páginas.

## Guarda-corpos (LGPD e anti-spam)

1. **E-mail de quem pede é dado pessoal.** Consentimento no próprio pedido; não
   guardar lista sem querer; apagar após atender, salvo consentimento explícito.
2. **Nada de lista comprada ou raspada** — só pedido espontâneo.
3. **Nunca usar a caixa para disparo em massa** (reputação do domínio).
4. **Só se envia o que já é público** na página ou nos datasets da API v1.
5. **Anti-abuso:** rate limit por IP (padrão do `/api/pageview`), honeypot no
   formulário (Tier 1/2), começo manual para calibrar volume.

## Pedidos de dados por e-mail — 3 camadas

### Tier 0 — botão `mailto` (imediato, zero backend) — ✅ no rodapé em 01/09

Botão "Pedir dados por e-mail" (ícone de envelope) abre o cliente de e-mail com
assunto e corpo pré-preenchidos para contato@controlepopular.com.br. O dono
responde anexando o arquivo (o portal já exporta CSV/PDF em quase toda tela).

### Tier 1 — formulário de pedido (sem backend próprio)

Botão abre Google Forms (gratuito): nome, e-mail, URL, formato, mensagem e
checkbox LGPD. Cada resposta notifica o dono (e-mail do Forms + aviso opcional
no bot via AppScript). Resposta manual com o arquivo.

### Tier 2 — endpoint próprio + SMTP (automação)

Rota `/api/pedido-dados` (padrão das `route.din.ts`): valida (rate limit por
IP, honeypot), gera o CSV na hora no padrão da tela (BOM UTF-8, `;`), envia via
SMTP Umbler **no `next start` do home-pc** (o Worker free não fala SMTP — ver
Riscos), notifica o dono no Telegram e não armazena e-mail (ou armazena com
consentimento em D1 dedicado + rota de exclusão).

## Contador público de envios/downloads — ✅ implementado em 01/09

- **Tabela `contadores` no D1** (`lib/db/schema.d1.ts`): `tipo` (PK), `contagem`,
  `atualizado_em`. Tipos: `pedido`, `download`, `notificacao`.
- **Rota `/api/contador`** (`apps/web/app/api/contador/route.din.ts`):
  - `POST ?tipo=...` incrementa (fogo-e-esqueça, rate limit por IP, mesmo
    desenho do `/api/pageview`);
  - `GET` devolve os totais.
- **Mostrador público** (`ContadorPublico.tsx`, client): "📧 N pedidos · ⬇ M
  downloads · 🔔 K inscrições" no rodapé, lê `/api/contador` ao carregar;
  sem D1, renderiza nada (não bloqueia).
- **Beacon de pedido**: o clique em "Pedir dados por e-mail" conta `pedido`.
- **Honestidade da medida:** contador é de **clique** (pedido iniciado), não de
  e-mail enviado — no Tier 0 o envio acontece no cliente do visitante. A
  contagem de atendimentos reais é manual (registrar no `DIVULGACAO-LOG.md`).
- **Falta ligar (próximo passo):** contar `download` nos botões de exportação
  CSV (disparar beacon no clique do export) e nos links de PDF do acervo; e
  `notificacao` nos cliques dos botões de inscrição.

## Busca global na navbar — ✅ implementado em 01/09

Barra de busca **sempre visível** na navbar superior (todas as páginas),
sem sair para /busca: digita e vê os resultados no dropdown.

- **Motor:** reusa o buscador estático do portal (`lib/busca/indice.ts`,
  radicalização embarcada, casamento por prefixo e distância de edição).
- **Índice pré-carregado:** `BuscaGlobal` carrega o índice fatiado
  (`/busca-indice`, gerado no prebuild) no primeiro monte e o cacheia em
  módulo — a primeira busca pode mostrar "carregando", as seguintes são
  instantâneas, nenhum keystroke espera rede.
- **Dropdown:** 8 melhores resultados (título + ementa), link "ver todos
  os resultados" levando a `/busca?q=...`, Enter idem.
- **Acessibilidade:** `role="search"`, `aria-label`, Escape e clique fora
  fecham; sem D1/índice ausente, a barra desabilita com aviso em vez de
  quebrar a navegação (o índice é artefato de build; em `next dev` sem
  Postgres ele responde 404 — comportamento já documentado).

## Botões de notificação (Telegram e e-mail) — ✅ no rodapé em 01/09

- **Telegram:** link para `t.me/ControlePopularBOT` ("Receber no Telegram").
  Hoje abre o chat com o bot; para o bot **enviar** novidades a quem pedir,
  falta (a) criar canal/lista de inscritos e (b) o gatilho do home-pc
  (`gatilho-remoto.mts`) broadcast para os inscritos — decisão do dono + item
  de implementação.
- **E-mail:** "Receber novidades por e-mail" abre `mailto` pré-preenchido
  (double opt-in: o dono confirma antes de incluir em qualquer lista).
- Ambas as inscrições, quando existirem de verdade, incrementam o contador
  `notificacao` (beacon no clique).

## Fluxo de atendimento (manual)

1. Pedido chega em contato@controlepopular.com.br (Tier 0/1).
2. Dono exporta o arquivo (CSV pela tela; PDF do acervo; resumo = texto da
   página) e responde com o modelo abaixo.
3. Registra no `DIVULGACAO-LOG.md` (data, pedido, formato, entregue).
4. Confirma recebimento e apaga o e-mail do solicitante sem consentimento.

## Inventário do que pode ser pedido

| Tipo | Exemplos | Onde está |
|---|---|---|
| CSV | contratos, licitações, diário oficial, proposições, votações, licenças, autos, repasses | exportação da tela (regra das cinco coisas) |
| PDF | EIA/RIMA, AJRI, ATIs, perícia UFMG, documentos do Paraopeba | acervo documental / biblioteca |
| Resumo | conteúdo da própria página em texto | página estática |
| Dataset | 14 datasets da API v1, ComunicaBR, Rouanet, terras | `/api` e `public/data` |

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| SMTP não roda no Worker free (porta 587 não é HTTPS) | Tier 2 envia do `next start` do home-pc (já provado com o kit por e-mail em 01/09); no Worker, API de e-mail (ex.: Resend — `RESEND_FROM_EMAIL` já existe no `.env.example`); decisão em aberto |
| Contador mentir (medir clique, não envio) | rotular no mostrador e no código ("pedidos iniciados"); atendimentos reais no log |
| Abuso (spam no formulário) | rate limit por IP no D1, honeypot, confirmação |
| LGPD (guardar e-mail sem querer) | não armazenar; com consentimento + rota de exclusão |
| Telegram sem canal real | botão existe e abre o chat; broadcast depende de canal/lista (item em aberto) |
| Caixa vira lixeira | filtros, modelos prontos, nunca disparo em massa |

## Critérios de aceite

- [x] Rodapé padrão com ações em toda página (pedir dados, Telegram, e-mail, contador) — 01/09.
- [x] Contador público funcional (tabela D1, rota, mostrador, beacon de pedido) — 01/09.
- [x] Busca global na navbar com índice pré-carregado — 01/09.
- [ ] Componente genérico `IndicePagina` (TOC de h2/h3) nos layouts de zona.
- [ ] Beacon de `download` nos botões de exportação CSV e links de PDF.
- [ ] Modelo de resposta testado em 1 pedido real.
- [ ] (Opcional) Formulário Google (Tier 1).
- [ ] (Opcional) `/api/pedido-dados` com SMTP automático (Tier 2).
- [ ] (Opcional) Canal/lista de inscritos no Telegram + broadcast do gatilho.

## Modelo de resposta pronto

> Assunto: `Dados solicitados — [página/tema]`
>
> Olá [nome],
>
> Segue em anexo o que você pediu, com a fonte ao lado:
> - [arquivo CSV/PDF/resumo] — fonte: [link da página]
>
> Este envio é gratuito e usa apenas dados públicos já publicados no portal.
> Se precisar de outro formato ou recorte, é só responder.
> Para não receber mais nada, responda "remover".
>
> Abraço,
> Controle Popular — contato@controlepopular.com.br
