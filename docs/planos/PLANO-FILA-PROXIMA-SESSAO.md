# PLANO — fila da próxima sessão (19/09, ranqueado por dificuldade)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-19
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [ESTADO.md § fila](../02-estado/ESTADO.md#fila-viva), [AGENTS.md](/AGENTS.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [PLANO-SEU-NONO-NOTEBOOKLM.md](PLANO-SEU-NONO-NOTEBOOKLM.md)
> **Palavras-chave:** plano, sessão, fila, 1014, cname, fase 4, postgres, tts, exportação, laboratório, shield, skill

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

## Resgate

O que ficou aberto da sessão de 19/09:

| Item | Estado | Referência |
|---|---|---|
| `DATABASE_URL` no Guara (runtime + build) | ✅ | [ESTADO.md](../02-estado/ESTADO.md) |
| Domínio `www` ativo no Guara | ✅ | `guara domains list --json` |
| Vulnerabilidades do container (Guara Shield) | 🚧 | 3 CRITICAL / 28 HIGH / 22 MEDIUM; `npm audit fix` aplicado; **upgrade de `next` não iniciado** |
| Testes do assistente (4 corrigidos) | ✅ | commit `34983f01` |
| TTS microresumo + loader `DotsRing` | ✅ | commit `34983f01` |
| Documentação reescrita (14 arquivos) | ✅ | commit `1a72a843` |
| `/dados/populares` mais densa (25 itens) | ✅ | mesmo commit |
| Validar banco no site (`/ambiental/licenciamento`) | 🚧 | precisa do DNS resolvido primeiro |
| Redirect da raiz no Cloudflare | ⛔ | ação do dono |
| **Fase 4 — Postgres do Guara** | ⛔ | não iniciada |
| Spike Vozz/Piper no browser (TTS) | ⛔ | não iniciado |

## Resposta honesta: mudamos de escopo rápido?

Sim, mudou várias vezes — e está registrado. **Fechamos 6 frentes completas**
(TTS microresumo, loader, testes do assistente, `DATABASE_URL`, domínio
`www`, documentação inteira) e as **4 abertas** vivem no
[ESTADO.md § fila](../02-estado/ESTADO.md#fila-viva).

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

Ordem sugerida: o trivial primeiro — destrava a leitura do resto.
O Lab fica por último: é a maior peça, e também o maior ganho.

## Detalhe por item

### 1 e 2 — DNS e redirect

Feitos quando os passos do dono rodarem. Depois volta
[A1 do ESTADO.md](../02-estado/ESTADO.md#bloco-a-fazer-agora): validar dado
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

Já detalhado no [ESTADO.md](../02-estado/ESTADO.md#bloco-a-fazer-agora).
Resumo:

1. `guara services create` PostgreSQL 17 (ou a variante **pgvector** —
   matar os dois coelhos: banco + embeddings do assistente num serviço só);
2. `guara services credentials` → string privada;
3. `pg_dump` Neon → `psql` no Guara (downtime zero);
4. `guara env set -b DATABASE_URL=...` + runtime;
5. `guara deploy` e validar o site.

Custo: conta como serviço (2 de 3 no plano Starter). Destrava em sequência
o [ROTEIRO-PGVECTOR-CHATBOT.md](ROTEIRO-PGVECTOR-CHATBOT.md) e a coleta nova
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
[PLANO-SEU-NONO-NOTEBOOKLM.md](PLANO-SEU-NONO-NOTEBOOKLM.md):
citação clicável, ressalva de IA visível, nenhum número reinventado.

Critério de pronto: o dono monta em `/laboratorio`, sem escrever código,
uma comparação "contratos em Betim × renda média", com gráfico dither e o
Seu Nonô ativando a tela.

## Origem

Pedido do dono em 19/09 à noite: resgatar pendências, ranquear por
dificuldade e documentar para as próximas sessões.
