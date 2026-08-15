# Arquitetura — controlepopular.com.br

Mapa do monorepo: como o dado chega, onde os dois tetos mandam e onde cada mecanismo mora. Regras que não se negociam e armadilhas vivem no `AGENTS.md`; este documento é a estrutura.

## Visão geral

```
scripts/ (coletores)  →  apps/web/data/ (versionado)  →  next build (output: export)  →  Cloudflare Workers (Static Assets)
                             ↑                                        ↑
      Postgres local (home-pc) / Neon — Drizzle (lib/db/),     *.din.ts só entra no alvo Workers;
      lido no build, só onde a rota precisa                    *.local.* só existe em next dev
```

- `apps/web/app/` — rotas (App Router). Hoje há 16 rotas `*.din.ts` (chat, busca, contratos, zap, classificados, coleta, moderação, anúncios, pageview), ignoradas pelo export estático.
- `apps/web/lib/` — lógica pura com teste ao lado; `data/` é lido no build; `scripts/` coleta e publica (`rotina-local.mts`).
- O site é estático nos dois alvos: nada de rede nem banco em tempo de execução — a tela abre com a Neon fora do ar.

## Os dois tetos

| Teto | Valor | Consequência |
|---|---|---|
| Cloudflare Workers | 25 MiB por asset, 3 MiB gzip de bundle, 20.000 arquivos | rota pesada derruba o deploy; medir `.cache` antes de decidir |
| Neon (Postgres) | HTTP 402 até 2026-09-01 | sem banco não há `next build`; quem publica é o `home-pc`, com Postgres local. Esta máquina não builda nem mede `.cache` |

Consequência prática: tarefa que depende de medir rota ou ler o banco não anda nesta máquina — dizer isso em vez de estimar.

## Regra de payload: coleção nunca como props de componente de cliente

Foi assim que `/ambiental/legislacao` chegou a 35,5 MiB contra o teto de 25 (medição em 16/08 — remeça antes de decidir com ele):

| | |
|---|---:|
| texto real das 15.318 ementas | 4,7 MiB |
| `.cache` gerado | 35,5 MiB |
| inflação | 7,5× |

O payload vai serializado duas vezes (HTML e RSC flight) e cada linha repete o nome de todos os campos — por isso a inflação, e por isso **constante importada pelo módulo cliente não paga nada** (entra uma vez no chunk, minificada, com gzip).

- Acima de ~2 mil linhas: serve do índice fatiado ou pagina no servidor.
- **`TabelaEstatica.tsx` é o mecanismo padrão**: busca, paginação e contagem no cliente sobre fatias. Medido em 16/08: 11 listas em 11 rotas o consomem (3 em Congresso, 8 em `[municipio]`) — siga uma delas, não invente mecanismo novo (medição em 16/08 — remeça antes de decidir com ele).
- Fatias: `lib/estatico/fatiar.ts` + `emitir.ts` geram grupos com `manifesto.json`, remontados no navegador com progresso em bytes.

## Compactação de dado: duas implementações, e por que não unificar

As duas aplicam a mesma técnica — **esqueleto + rótulos internados** — a formatos diferentes, e são **intencionalmente diferentes**:

| Implementação | Formato | Ganho medido |
|---|---|---|
| `lib/comunicabr/arquivo.ts` | esqueleto nacional compartilhado + codec específico do ComunicaBR: o texto é nacional, o número é municipal; `rotulos`, `esqueletos` (com assinatura anti-desalinhamento) e valores esparsos `v` | 853 municípios: 99 MiB → **2,16 MB** (`data/comunicabr-31.json` em disco, 16/08) |
| `lib/estatico/compactar.ts` | tabela plana genérica: esqueleto + dicionário, com a decisão de internar **medida por coluna** (internar errado aumenta o arquivo) | Rouanet: 7,9 MB → 2,4 MB (−69%); 7.206 projetos + 20.784 incentivadores |

**Decisão documentada: não unificar.** As duas nasceram em sessões que não se viram, mas cada uma serve a um formato — a do ComunicaBR carrega um esqueleto nacional com assinatura; a genérica decide coluna a coluna. Unificá-las descartaria exatamente a especialização que levou 99 MiB a 2,16 MB. Números em 16/08 — remeça antes de decidir com eles.

## Índice estático e assistente

O assistente é uma escada de quatro degraus, e cada degrau só é acionado quando o anterior não resolve — a tela diz qual respondeu:

| Degrau | O que resolve | Estado |
|---|---|---|
| 0 — rota direta | "saúde em BH" → `/bh/saude` | **no ar** |
| 1 — índice estático | "onde fala de barragem em Brumadinho" — busca no índice da `/busca` | **no ar** |
| 2 — composição determinística | "compare Betim e Contagem" — regra escrita sobre respostas do degrau 1 | **próximo trabalho** |
| 3 — LLM | pergunta livre que os anteriores não casaram; chave opcional | não iniciado |

- **Catálogo** (`lib/assistente/catalogo.ts`): ~380 destinos (6 cidades × 33 sufixos + 44 rotas gerais) como **constante de módulo** importada pelo cliente, nunca como prop — cabe em ~2,4 KiB gzip (medição em 16/08 — remeça antes de decidir com ele). Foi criado porque o índice da `/busca` é a fonte errada para isso: ~5,0 MB não comprimidos (docs 3.614 KB + vocabulário 1.188 KB + formas 264 KB; o vocabulário cresceu 11.561 → 31.375 lexemas) — pagar o acervo inteiro por uma tabela de rotas não.
- **Navegação** (`navegacao.ts`): `interpretar()` devolve candidatos (máx. 8), nunca um palpite único; vazio é resposta. Sem rede, sem banco.
- **Documentos** (`documentos.ts`): o degrau 1 carrega o índice sob demanda, **uma vez por sessão**, e interrompe de verdade (`AbortController`) — é o único passo caro, e por isso o botão de interromper existe.
- **Degrau 3**: mora em rota `*.din.ts`, chave em secret do Worker (nunca no cliente); o prompt recebe só o trecho do índice recuperado, nunca o acervo. Sem `LLM_API_KEY` o portal continua inteiro com os degraus 0–2.
- O degrau 3 nunca produz número: o número vem do índice; o modelo só embrulha, citando página e linkando. Sem dado no índice, a resposta é "não sei, e aqui está o que existe perto".

## Radar Paraopeba

- **Coleta de notícias**: coletor diário grava `data/noticias-paraopeba.json` (título, veículo, data e link — nunca o corpo da matéria), lido no build por `lib/paraopeba/radar.ts`. Fontes: MAB, Agência Brasil, Google Notícias e os feeds das 3 ATIs (AEDAS, ADAI, Guaicuy); TJMG e MPMG ficaram fora — os RSS respondem 404 — e a tela mostra a lacuna. Volume total do bloco: 254 itens (149 clipping + 46 ATIs + 59 radar) (medição em 16/08 — remeça antes de decidir com ele).
- **Triagem de dado pessoal** (`lib/paraopeba/triagem.ts`): régua dedicada ao acervo da Plataforma Brumadinho UFMG — CPF por mod-11, iniciais, contato pessoal e **nota de pesar** (nome por extenso de vítima é dado pessoal e é redigido). Complementa a varredura de código-fonte, que não cobre dado ingerido em massa.
- **Três ATIs**: AEDAS (Regiões 1 e 2), NACAB (Região 3) e Guaicuy (Regiões 4 e 5) — curadoria separada do painel-fonte, classificada por ATI e por tema da reparação.

## Painel de edição

- Rota `/painel` e API `/api/painel/*` só existem em `next dev` (`PAINEL_LOCAL=1`; extensões `.local.*` ficam fora do build).
- `PAINEL_TOKEN` vive em `apps/web/.env.local` — **nunca versionado**; sem ele a API nega tudo (fail-closed).
- A edição grava `data/edicoes.json` — **dado versionado**, mesmo formato do editor de linha de comando (`scripts/editar-pagina.mts`); as rotas aplicam as edições no build via `lib/edicoes.ts`.
- Estado do repositório e data do último build são lidos no servidor no primeiro render, para a tela abrir sabendo se está defasada.

## Código IBGE

- O de 6 dígitos é o de 7 **sem o dígito verificador**: Betim é `3106705` (7) / `310670` (6); `3106200` é **Belo Horizonte**.
- **Casamento por código, nunca por nome** — a grafia diverge entre tabelas oficiais (caixa alta, acento inconsistente). O que não casar é relatado, não forçado.
- A armadilha virou teste que compara código com nome; comentário errado já sobreviveu meses e foi propagado por cópia — por isso a regra vive em teste, não em comentário.

## Banco de dados

- `lib/db/` — Drizzle: `schema.ts` + `relations.ts` + `client.ts` (Postgres), com `queries/` por domínio (barragens, congresso, copam, judiciário, terras, licenciamento, legislação e outros).
- `CIDADES_DO_BUILD` é módulo, não prop — mesma razão do catálogo do assistente.
- Leitura do Postgres acontece no build (índice da busca, radicais, queries); acesso degrada a `null` fora do contexto certo em vez de quebrar rota.
- Além do Postgres há o **D1** (`schema.d1.ts` + `clientD1.ts`): as escritas ao vivo (pageview, zap, clique, classificados, moderação) vivem nele, como binding do Worker — fora do Worker devolve `null`.

## Origem

Documentos absorvidos por esta página:

- `docs/PLANO-INDICE-ESTATICO-E-ASSISTENTE.md` — **ATIVO** → `docs/planos/`; o degrau 2 do assistente é o próximo trabalho
- `docs/HANDOFF-PAYLOAD-LEGISLACAO.md` — absorvido (seção "Regra de payload") → `docs/_historico/`
- `docs/RADAR-NOTICIAS-PARAOPEBA.md` — absorvido (seção "Radar Paraopeba") → `docs/_historico/`