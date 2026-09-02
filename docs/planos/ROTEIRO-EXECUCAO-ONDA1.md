# Roteiro — Execução da Onda 1 (fundação barata)

> **Tipo:** RUNBOOK
> **Domínio:** global
> **Última medição:** 2026-09-02
> **Relacionados:** [PLANO-NOSSOS-PAINEIS-SANFONA](./PLANO-NOSSOS-PAINEIS-SANFONA.md), [REVISAO-PLANO-GEMINI](./REVISAO-PLANO-GEMINI.md), [AGENTS](/AGENTS.md)
> **Palavras-chave:** runbook, onda 1, schema, lugares, dialogos, painel, diamantina, biribiri

## 🎯 Objetivo

Executar a **Onda 1** do plano Nossos + Painéis-Sanfona: infraestrutura de
dados + primeira prova visual no ar, sem dependência nova de servidor. 🏗️

## ⛔ Pré-requisitos (decisões do dono)

| # | Decisão | Status |
|---|---|---|
| 1 | ONSA abraça a frente de Terras? (plano sugere sim) | ⏳ aguardando |
| 2 | Bloco final chama "E o social?" ou "E nosso povo?" | ⏳ aguardando |
| 3 | Rotas legadas `/funcaosocialterra` viram redirect? | ⏳ aguardando |

> Sem as decisões 1–2, o schema pode mudar. **Não criar os arquivos de lib
> antes do aval** — evita retrabalho.

## 🪜 Passos da Onda 1 (na ordem)

### Passo 1 — Contratos TypeScript

Criar em `apps/web/lib/`:

- `lugares.ts` — tipos `TipoLugar`, `RegistroLugar`, `TagLugar`.
- `dialogos.ts` — tipos `FrenteId`, `NivelConfianca`, `PonteEntreFrentes` +
  as **primeiras 10 pontes estáticas** (Diamantina × Biribiri incluída).

Fonte da verdade: schema da Parte 1 do plano (já aprovado pelo dono na
revisão? confirmar).

**Verificação:** `npx tsc --noEmit` sem erro novo.

### Passo 2 — Componente PainelDialogo

Criar `apps/web/app/components/PainelDialogo.tsx`:

- Gaveta sanfona lateral (drawer) com HTML semântico.
- Acessibilidade: `aria-expanded`, foco gerenciado, Esc fecha,
  `prefers-reduced-motion`, 3 temas e escalas de texto do portal.
- Recebe `PonteEntreFrentes[]`, exibe no máximo 3.

**Verificação:** navegação por teclado + leitor de tela; testes de
render/axe se o repo tiver harness.

### Passo 3 — Piloto em Diamantina

Plugar a sidebar sanfona em `/diamantina`:

- Badge gatilho "Também acontece por aqui".
- 3 cartões: Biribiri (ONSA), concessão estadual (Executivo), PLs
  (Congresso/ALMG).
- Cada cartão: razão editorial, selo de confiança, ressalva curta, link.

**Verificação:** 2 cliques de Diamantina até a rota destino; link check.

### Passo 4 — Rotas e identidade

- Registrar ONSA como casa oficial de meio ambiente e território.
- `/funcaosocialterra` → redirect estático (se dono aprovar).

**Verificação:** rotas antigas continuam respondendo; sitemap atualizado.

## ✅ Critérios de aceite da Onda 1

1. `lib/lugares.ts` + `lib/dialogos.ts` existem com tipos e 10 pontes. 📦
2. `PainelDialogo` abre/fecha por teclado e funciona nos 3 temas. ♿
3. Diamantina mostra Biribiri + concessão + PLs em ≤ 3 cartões. 🖱️
4. `npm test` e `tsc` verdes; sem dependência nova no cliente. 🧪
5. Nenhuma ponte aponta para rota 404 (link check). 🔗


## 🚧 Progresso real (atualizado 18:05)

A outra sessão (Antigravity) já implementou no main local:
- ✅ `a24c081` — schema (lugares/dialogos), PainelDialogo, BlocoPovoGente,
  rotas Nossos Rios/Serras/Territórios, Diamantina × Biribiri (17 arquivos).
- ✅ `a5273fe` — expansão de diálogos para 6 cidades + capitais do Sudeste.
- ✅ `b897dcd` — subfrentes **Nossos Animais** e **Nossa Gente** com destaque
  na home do ONSA.

⚠️ Commits ainda **não publicados no GitHub** (aguardando decisão do dono:
quem publica).

Pendências que seguem para mim/agente:
1. Rodar `npm test` completo e `tsc` (verificação independente em curso).
2. Link check das pontes (nenhuma rota 404).
3. Publicar a Onda 1 no GitHub após aval.

## 📦 Depois da Onda 1

- Onda 2 (voz e poesia): hub `/ambiental/nossos`, `BlocoPovoGente`,
  páginas-piloto (Paraopeba, Espinhaço, Jequitinhonha) + poemas do mapa. 🎨
- Onda 3 (escala): rotas dinâmicas, mapeador por IBGE, CI de links/payload. 🚀
