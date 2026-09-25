# PLANO — fila da próxima sessão (19/09, ranqueado por dificuldade)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [ESTADO.md § fila](../../02-estado/ESTADO.md#fila-viva), [HANDOFF-22-09-COLETA-GUARA.md](../entregas/HANDOFF-22-09-COLETA-GUARA.md), [AGENTS.md](/AGENTS.md), [OPERACAO.md](../../05-operacao/OPERACAO.md), [PLANO-SEU-NONO-NOTEBOOKLM.md](../../planos/PLANO-SEU-NONO-NOTEBOOKLM.md)
> **Palavras-chave:** plano, sessão, fila, 1014, cname, fase 4, postgres, tts, exportação, laboratório, shield, skill, etl, coleta, deploy

## Sumário

- [Propósito](#propósito)
- [Resgate da sessão de 19/09](#resgate)
- [Resposta honesta: mudamos de escopo rápido?](#escopo)
- [Diagnóstico do erro 1014 (medido)](#erro-1014)
- [Os itens, ranqueados por dificuldade](#ranking)
- [Detalhe por item](#detalhe)

## Propósito

Fila da próxima sessão, com os 6 pedidos do dono de 19/09 à noite.
Ranqueado da parte urgente e leve para a peça grande.
Cada item tem critério de pronto: quando roda no navegador e o dono confere.

**Topo da fila em 22/09 (ordem do dono):** terminar as coletas Betim no
Guara (COPAM, contratos 2025, licitações) e **só então** `guara deploy`.
Retomada exata: [HANDOFF-22-09-COLETA-GUARA.md](../entregas/HANDOFF-22-09-COLETA-GUARA.md).

## Resgate

Estado medido na madrugada de 19→20/09 (sessão fase 4):

| Item | Estado | Referência |
|---|---|---|
| Erro 1014 no www (proxy do Cloudflare) | ✅ | dono tirou o proxy; `Resolve-DnsName` aponta direto ao Guara |
| Redirect raiz → www | ✅ | Page Rule 301 medida (`curl` 301 → `www/…/sobre`) |
| Skill `/cp` de handoff | ✅ | commit `f329cd25` |
| Fase 4 — Postgres do Guara | 🚧 | serviço `cp-postgres-597bd0` (postgis 17) com carga validada igual à Neon (menos as 2 tabelas `embeddings`); `DATABASE_URL` trocada runtime+build |
| Driver no runtime do Guara | 🚧 | motor `pg` (TCP) para host não-Neon (`39225d91`); trace do `pg` no standalone (`3ea3a22`); **sombras restantes: chat do assistente ainda 502 em produção** |
| Catálogo sem pgvector | ⚠️ | extensão `vector` indisponível nas variantes do Guara (medido via `pg_available_extensions`); embeddingsguiória ficam p/ Fase 5 (alternativa: Qdrant do catálogo) |
| Deploy a cada ~5 dias | ✅ | política do dono: auto-deploy OFF, tarefa agendada `ControlePopular_DeployGuara_0555` (`deploy-guara-agendado.mts`: commit novo + ≥5 dias + CI verde) |
| Vulnerabilidades do container (Guara Shield) | 🚧 | 3 CRITICAL / 28 HIGH / 22 MEDIUM; `npm audit fix` aplicado; upgrade de `next` não iniciado |
| Laboratório F1 (`/laboratorio` dither) | ✅ | commit `b0655e00` em `agente/laboratorio-f1` — **aguardando merge na main** |
| Blog: 10 posts com 2 parágrafos novos | ✅ | commit `296ab78b` (subagente opencode) |
| DeepSeek sem saldo (HTTP 402) | ⛔ | chat de produção alterna para Maritaca/Sabiá (chave validada); falta validar ponta em produção |
| Validar banco no site (A1) | 🚧 | `/ambiental/licenciamento` ainda com placeholders no HTML; páginas do banco com dado: pendente deploy verificado |
| Watchdog falso alerta 22:30 | ✅ | relatório em UTF-16 reconhecido (`6fdf5eb9`) |

## Resposta honesta: mudamos de escopo rápido?

Sim, mudou várias vezes — e está registrado. **Fechamos 6 frentes completas**
(TTS microresumo, loader, testes do assistente, `DATABASE_URL`, domínio
`www`, documentação inteira) e as **4 abertas** vivem no
[ESTADO.md § fila](../../02-estado/ESTADO.md#fila-viva).

Nada foi feito pela metade sem registro.
Nenhum item foi abandonado silencioso — a fila atualiza com data.

## Diagnóstico do erro 1014 (medido)

O site hoje devolve **Error 1014 — CNAME Cross-User Banned**.

Causa medida: o registro `www.controlepopular.com.br` no Cloudflare está
**proxied** (nuvem laranja; o tráfego passa pela borda do Cloudflare) e o
destino do CNAME é `controle-popular-web-0b4895-controle-popular.guaracloud.com`
que é **outra conta do Cloudflare**. CNAME proxied entre contas é proibido.

Correção (dono, 5 minutos):

1. Cloudflare → DNS → registro `www`
2. **Proxy: OFF** (nuvem cinza, "DNS only")
3. Raiz `controlepopular.com.br` fica proxied + Redirect Rule → www
4. Testar `www.controlepopular.com.br` no navegador

## Ranking — por dificuldade estimada

| # | Item | Dificuldade | Responsável | Estimativa |
|---|---|---|---|---|
| 1 | Corrigir Error 1014 (proxy no CNAME do `www`) | 🟢 trivial | dono | 5 min |
| 2 | Redirect raiz → www (Cloudflare Rules) | 🟢 trivial | dono | 5 min |
| 3 | Skill `/cp` (handoff de sessão no opencode) | 🟢 fácil | agente | 30–60 min |
| 4 | Exportar PDF/CSV, imprimir, copiar — nas 100 páginas | 🟡 médio | agente | 1–2 dias |
| 5 | Bot de segurança + Guara Shield integrados | 🟡 médio | agente | 1–2 dias |
| 6 | Fase 4 — Postgres do Guara no lugar da Neon | 🟠 difícil | agente | 2–3 h + rodada |
| 7 | Laboratório: brincar com dados (dither-charts + dock + janelas + Seu Nonô) | 🔴 grande | agente, em fases | ~4 semanas |
| 8 | Remuneração de servidores + donos/conselheiros/sócios de empresas (novas APIs) | 🟡 médio | agente, por frente | 1–2 semanas |
| 9 | Mapeamento amplo de APIs (Brasil, LatAm, ONU) | 🟢 fácil | agente | 1–2 dias |
| 10 | Globo 3D: cavas de mineração — Fase 0 (sondagem: Copernicus, Monitor MapBiomas, licenças de modelo) | 🟡 médio | agente | 1–2 dias |

Ordem sugerida: o trivial primeiro — destrava a leitura do resto.
O Lab fica por último: é a maior peça, e também o maior ganho.

## Detalhe por item

### 1 e 2 — DNS e redirect

Feitos quando os passos do dono rodarem. Depois volta
[A1 do ESTADO.md](../../02-estado/ESTADO.md#bloco-a-fazer-agora): validar dado
no `/ambiental/licenciamento`.

### 3 — Skill `/cp`

Arquivo único: `.opencode/skills/cp/SKILL.md`. Conteúdo mínimo:

1. mapa de docs de entrada (`AGENTS.md`, `docs/README.md`, `ESTADO.md`);
2. setup de worktree + porta;
3. comandos `guara`/`neonctl`/`gh` prontos;
4. fila viva rápida (3 itens top, com link);
5. contratos: commit SEM acento, `-F`, pathspec, `--force` nunca.

Critério de pronto: digitar `/cp` numa sessão nova do opencode aponta o
próximo passo com link em menos de 1 minuto.

### 4 — `BotoesExportar` nas top-100

Um componente global, 4 ações — sem biblioteca nova:

| Fase | O que |
|---|---|
| F1 | novo componente: exportar CSV (do dado filtrado), PDF (via `window.print()` + CSS `@media print` — o PDF sai da impressão do navegador), Copiar texto, Imprimir |
| F2 | CSV no cliente para tabelas paginadas; CSV baseado no agregado para listas grandes |
| F3 | instalar no top-100 (é a `apps/web/lib/resumos-top100.ts` a lista das 100 rotas ativas) |
| F4 | testes: CSV com `;` e BOM UTF-8; copiar com `navigator.clipboard` |

### 5 — Bot de segurança + Guara Shield

- **Escudo (Telegram)** lê o scan Trivy diário via `guara services vulnerabilities`
  (o CLI `security findings` está com bug — registro no AGENTS § 6);
- lista CRITICAL/HIGH com "fix available", CVSS alto primeiro;
- nova vulnerabilidade ⇒ Telegram + JSON
  `docs/relatorios-automacao/hermes-auditoria-seguranca.json`;
- upgrade do `next` medido antes (o `npm audit fix --force` baixaria 16.3.5);
- `tar` sobe via transitive deps e reteste.

### 6 — Fase 4: Postgres do Guara

Já detalhado no [ESTADO.md](../../02-estado/ESTADO.md#bloco-a-fazer-agora).
Resumo:

1. `guara services create` PostgreSQL 17 (ou a variante **pgvector** —
   matar os dois coelhos: banco + embeddings do assistente num serviço só);
2. `guara services credentials` → string privada;
3. `pg_dump` Neon → `psql` no Guara (downtime zero);
4. `guara env set -b DATABASE_URL=...` + runtime;
5. `guara deploy` e validar o site.

Custo: conta como serviço (2 de 3 no plano Starter). Destrava em sequência
o [ROTEIRO-PGVECTOR-CHATBOT.md](../../planos/ROTEIRO-PGVECTOR-CHATBOT.md) e a coleta nova
que hoje vai para D1.

### 7 — Laboratório: brincar com os dados

Nome provisório: **`/laboratorio`**. Sem biblioteca de gráfico nova —
SVG inline, estilo dither-charts (gráfico feito de pontos, tipo mapa de
caracteres). Um "dock" (barra de atalhos no estilo da do macOS) escolhe
os blocos.

| Fase | O que |
|---|---|
| F1 | Página `/laboratorio` com 1 gráfico dither sobre dado fixo — prova de conceito |
| F2 | Dock flutuante de blocos: dados, gráfico, comparação, filtro |
| F3 | Duas micro janelas (metade da tela cada), com filtro e fonte próprias |
| F4 | Palavra-chave do buscador global alimenta as duas janelas |
| F5 | Painel lateral com o **Seu Nonô**: sugere filtros e aciona gráficos por botão |
| F6 | Sessão salva na URL (`?j1=…&j2=…`) e export copiável |
| F7 | Testes, documentação e handoff |

Fontes de dado do dock: datasets da API pública, acervo
`etl/betim/dados/**/*.json`, índice `/busca-indice`.
Conversa do Seu Nonô segue as regras do
[PLANO-SEU-NONO-NOTEBOOKLM.md](../../planos/PLANO-SEU-NONO-NOTEBOOKLM.md):
citação clicável, ressalva de IA visível, nenhum número reinventado.

Critério de pronto: o dono monta em `/laboratorio`, sem escrever código,
uma comparação "contratos em Betim × renda média", com gráfico dither e o
Seu Nonô ativando a tela.

### 8 — Remuneração de servidores públicos + donos e conselhos de empresas

**Pedido do dono:** quanto cada servidor público recebe, e os donos,
conselheiros e sócios majoritários das empresas — nas páginas
Congresso, Câmaras, Prefeituras, Governos Estaduais, Judiciário e Empresas.

Fontes de remuneração, por poder:

| Frente | Fonte | Endereço |
|---|---|---|
| Deputados federais | API Dados Abertos da Câmara — despesas do gabinete | `/deputados/{id}/despesas` |
| Senadores | API Dados Abertos do Senado — verba indenizatória | `/senador/{id}/despesas` |
| Servidores federais | Portal da Transparência — API de remuneração | `/api-de-dados/remuneracao-servidores` |
| Governos estaduais | Portal de transparência do estado (remuneração de pessoal) | ex.: `transparencia.mg.gov.br` |
| Judiciário | CNJ — relatórios de remuneração de magistrados e servidores | `dadosabertos.cnj.jus.br` |
| Câmaras municipais | portal de transparência da câmara, caso a caso | priorizar as 6 cidades atendidas |
| Prefeituras | portal de transparência municipal | Betim, BH, SP primeiro |

Fontes de CNPJ e de sociedades:

| Base | O que cobre |
|---|---|
| Receita Federal — Dados Abertos do CNPJ (arquivo mensal) | cadastro completo com QSA (quadro de sócios), CNAE, capital social |
| Brasil.io — Open Data CNPJ (também na Base dos Dados) | já usamos no M8 (`socios-vale.json`); filtrável |
| ReceitaWS | consulta individual de CNPJ (não para carga em massa) |
| QSA (dentro dos arquivos da Receita) | cargo do sócio: Administrador, Conselheiro, Presidente (`cargo_pessoa_socio`) |

Prioridade de implementação:

1. `/empresas` e `/empresas/[slug]` — sócio majoritário, conselheiros,
   grupo econômico; a base do CNPJ alimenta o painel existente.
2. Congresso — remuneração por página de deputado e senador.
3. Judiciário — remuneração publicada pelo CNJ, por tribunal.
4. Cidades — remuneração por portal municipal, cidade a cidade.

⚠️ Dado pessoal: remuneração de agente público em função é informação
de interesse social (LAI, art. 31). A guarda do AGENTS § 5.2 continua:
**nenhum CPF** vai para a tela.

Critério de pronto: cada frente exibindo valor mensal com fonte oficial
(formato ABNT, autor e data); Empresas informa sócio majoritário e
conselheiros no painel.

### 9 — Mapeamento amplo de APIs e bases de dados

**Pedido do dono:** mapear APIs e bases públicas e open source — Brasil,
Latino-américa e ONU — para coletar ou conectar ao portal.
Resultado: novo `docs/06-fontes/MAPEAMENTO-FONTES-AMPLAS.md`, no template
do [FONTES.md](../../06-fontes/FONTES.md): URL, acesso medido, licença, armadilha.

Blocos a mapear (coordenar impacto social, ver AGENTS § 1):

| Bloco | Fontes |
|---|---|
| Brasil federal | dados.gov.br, IBGE (SIDRA, Cidades), DATASUS (TABNET, CNES), Portal da Transparência (API), INEP, FNDE, PNCP, Transferegov, ANA, ANP, SUSEP |
| Ambientais e territoriais | MapBiomas, INPE — PRODES e DETER (desmatamento), CNUC (unidades de conservação), FUNAI e INCRA (já temos), SNIS (água e esgoto) |
| Social e cidade | TSE DivulgaCandContas, IBGE Cidades, Atlas do Desenvolvimento Humano (Brasil), CadÚnico, SLIS |
| Econômico | B3 (cotações), CADE (concentração de mercado), TCU (programas). Portal da Transparência |
| LatAm e ONU | CEPAL (estadísticas), UN Data, World Bank Data, OECD, UNDP (IDH), PAHO/OPS, UNODC, FAO, ILO, UNICEF, OpenDataLatam |

Regras que valem já no mapeamento: ler o `robots.txt`, User-Agent honesto,
pausa entre chamadas, e varredura de dado pessoal antes de commit (AGENTS § 11).

Critério de pronto: `MAPEAMENTO-FONTES-AMPLAS.md` criado com pelo menos
20 fontes sondadas (URL e status medido), priorizadas por impacto social.

### 10 — Globo 3D: cavas de mineração — Fase 0 (sondagem)

Plano completo: [PLANO-GLOBO-CAVAS-MINERACAO.md](../../planos/PLANO-GLOBO-CAVAS-MINERACAO.md)
(item **B4** da [fila do ESTADO.md](../../02-estado/ESTADO.md#fila-viva);
pedido do dono em 24/09). Objetivo: achar mineração sem cadastro ANM no
globo 3D, com satélite e modelos rodando **locais** (Chinese-CLIP +
Qwen2.5-VL; nada de API de nuvem — decisão do dono 24/09).

A Fase 0 é só medição e não disputa deploy — cabe numa sessão:

| # | Medir | Saída |
|---|---|---|
| M1 | Conta Copernicus CDSE + 1 cena Sentinel-2 de MG | cadastro do dono (5 min) + cena baixada |
| M2 | Monitor da Mineração (MapBiomas): shapefile e atributos | decisão anotada no FONTES |
| M3 | Licença de cada modelo no card do Hugging Face | linha no FONTES |
| M4 | Throughput de embedding na RTX 3050 (crops/s) | número com data |
| M5 | Cache de imagem cabe no disco (estimativa 15 GB de 65,7) | path fora do git |
| M6 | Termos da Esri: sem bulk download | regra escrita |
| M7 | SIGMINE nacional: colunas de fase e tamanho | número com data |

Critério de pronto: tabela M1–M7 preenchida no plano, com data.
Depois: gate G0 (MapBiomas baseline?) e Fase 1 (calibração em MG).

## Origem

Pedido do dono em 19/09 à noite: resgatar pendências, ranquear por
dificuldade e documentar para as próximas sessões. Item 10 acrescentado
em 24/09/2026 (sessão `/cp`, pedido do globo 3D).
