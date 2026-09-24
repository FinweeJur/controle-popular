# HANDOFF — Fechamento PNCP no home-pc (24/09)

> **Tipo:** HANDOFF
> **Domínio:** cidades
> **Última medição:** 2026-09-24 14:15
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-EXPANSAO-PNCP-199-CIDADES.md](planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md), [HANDOFF-23-09-PNCP-SP-CAPITAIS.md](HANDOFF-23-09-PNCP-SP-CAPITAIS.md), [AGENTS.md](/AGENTS.md), [ESTADO.md](02-estado/ESTADO.md), [FONTES.md](06-fontes/FONTES.md)
> **Palavras-chave:** handoff, pncp, home-pc, servidor, fila, verificacao, testes, litigios, cobertura, 429, paralelo

## Sumário

- [Por que este handoff](#por-que-este-handoff)
- [Divisão entre máquinas](#divisão-entre-máquinas)
- [Estado medido 24/09 14:15](#estado-medido-2409-1415)
- [Escopo do home-pc](#escopo-do-home-pc)
- [Ritual de verificação (paralelo)](#ritual-de-verificação-paralelo)
- [O que NÃO fazer no home-pc](#o-que-não-fazer-no-home-pc)
- [Commit e push](#commit-e-push)
- [Armadilhas](#armadilhas)
- [Primeiro passo](#primeiro-passo)

## Por que este handoff

A desktop local coleta PNCP **sequencial** (1 comando, lock, timeout de
15 min, retomada por checkpoint). Enquanto o ETL mora nela, **a suíte
pesada não roda lá sem briga**.

O **home-pc é o servidor** e já fica de pé (túnel, testes, build).
Ele pode rodar **em paralelo** a verificação e a escrita de docs que a
desktop não consegue fazer durante a coleta.

Litígios já foi publicado no commit `0e3d4f2e` (24/09) — testes 5/5 e
`tsc` limpos na hora do commit.

## Divisão entre máquinas

| Máquina | Papel | Nunca |
|---|---|---|
| **Desktop local (sessão de coleta)** | Fila C3: `python -m etl.pncp.fila --manifesto dados/manifesto-pncp.csv --max-cidades 1` — retomar Araraquara, depois o resto | rodar `npm test` / `next build` no meio da coleta |
| **home-pc (este handoff)** | C5 em paralelo: suíte, `tsc`, dado pessoal, validação de docs, revisão do diff B/C, atualizar ESTADO/FONTES com números que a desktop mandar | lançar ETL PNCP por padrão (429 é compartilhado) |
| **Fila B (outra sessão)** | SP 3550308 + 25 capitais | tocar nas polos desta fila |

**Um ETL PNCP por máquina** (regra do plano). O home-pc *poderia*
coletar meia fila (outra máquina), mas a API PNCP responde **429 em
rajada** e o limite é do host da API, não do PC — dois ETLs em dobro
já foi medido (8 threads = 291×429). **Só coleta no home-pc se o dono
liberar por escrito.**

## Estado medido 24/09 14:15

| Métrica | Valor |
|---|---|
| Manifesto `dados/manifesto-pncp.csv` | **203** linhas — 166 `pronta`, 25 `delegada` (capitais), 6 `excluida-principal`, 6 `bloqueada-cnpj` |
| Cidades completas (ckpt contratos+licitações ok) | **23 / 166** prontas |
| Fila restante | **143** |
| Chaves checkpoint contratos | 258 (258 ok, 0 parcial) |
| Chaves checkpoint licitações | 2395 (2394 ok, **1 parcial**) |
| Parcial aberta | `3503208:2025-8` — Araraquara, página **73**, 3243 registros |
| Próximas da fila | Araraquara, Bauru, Campinas, Carapicuíba, Diadema, Franca… |
| Commit litígios | `0e3d4f2e` — **local, ainda sem push** |
| Código Fase B (ETL) | **ainda não commitado** (`manifesto.py`, `fila.py`, `cobertura.py`, `preencher_cnpj.py`, testes, CSVs) |
| `PLANO-EXPANSAO-PNCP-*.md` | modificado (medições da B/C) — entra no commit B/C |

Lock `.fila-pncp.lock` fica só na desktop. Checkpoints são **locais e
gitignored** — o home-pc não os vê até a desktop commitar/empurrar
(além de serem só de leitura para o home-pc neste papel).

## Escopo do home-pc

**Dentro:**

1. **Suíte completa em paralelo** (pode rodar enquanto a desktop coleta):
   - `npm test` (raiz)
   - `npx tsc --noEmit` (em `apps/web`)
   - pytest: `etl/betim/etl/pncp/*_test.py` com o venv hermes
   - `python scripts/checar-dado-pessoal-em-dado.py`
   - `python scripts/validar-documentacao.py`
2. **Revisar o diff B/C** quando a desktop mandar o recorte (pathspec
   proposto abaixo); acusar recebimento — **não commitar no lugar da
   desktop** para não misturar staging.
3. **Atualizar docs de estado** com números medidos que chegarem:
   `docs/02-estado/ESTADO.md` (fila) e `docs/06-fontes/FONTES.md`
   (ritual PNCP), se necessário, em **commit próprio** pathspec.
4. **Conferir a rota** `/ambiental/litigios-climaticos` no build local
   do home-pc (card JUMA com âncora, link do painel, CSV com coluna
   Link Painel) — o commit `0e3d4f2e` já passou vitest+tsc.

**Fora:**

- Qualquer `python -m etl.pncp.*` (coleta) sem ordem escrita do dono.
- Deploy Guara (cadência ~5 dias, política do dono).
- Fila B (SP + capitais).
- `--force`, push de trabalho dos outros, leitura de `.env`.

## Ritual de verificação (paralelo)

```bash
# na raiz do repo
npm test
python scripts/checar-dado-pessoal-em-dado.py
python scripts/validar-documentacao.py

# em apps/web
npx tsc --noEmit

# testes do ETL (venv hermes; workdir etl\betim)
C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe -m pytest etl\pncp
```

Se algo falhar: reportar à sessão da desktop **antes** de qualquer
commit. Não “consertar” o ETL de dentro do home-pc.

## O que NÃO fazer no home-pc

| Não | Por quê |
|---|---|
| Lançar fila/orgaos/contratos/licitações | 429 compartilhado; 1 ETL por máquina e a desktop está coletando |
| `guara deploy` | fora de escopo sem pedido do dono |
| Commitar os arquivos `??` do ETL | pathspec da desktop; dois commits no mesmo lote quebram a ordem |
| Ler/exibir `.env`, `guara-proxy.log` | segredo / lixo não versionado |
| `git commit` sem caminho | leva staging alheio (AGENTS § 5.5) |

## Commit e push

**Ordem combinada:**

1. Desktop: push do litígios `0e3d4f2e` (validado) — pode ir junto com
   o B/C se o dono preferir um único push.
2. Desktop: fecha C3 o quanto puder → C4 (`python -m etl.pncp.cobertura
   --manifesto dados/manifesto-pncp.csv`).
3. Desktop: commit **B/C** com pathspec único:

```text
etl/betim/etl/pncp/manifesto.py
etl/betim/etl/pncp/manifesto_test.py
etl/betim/etl/pncp/fila.py
etl/betim/etl/pncp/cobertura.py
etl/betim/etl/pncp/checkpoint_test.py
etl/betim/etl/pncp/preencher_cnpj.py
etl/betim/dados/manifesto-pncp.csv
etl/betim/dados/cobertura-pncp.csv
docs/planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md
```

4. Desktop: `git fetch && git rebase origin/main && git push origin HEAD:main`
   — **só com suíte do home-pc verde**.
5. home-pc: se mexer em ESTADO/FONTES, commit próprio depois do push da
   desktop (pathspec dele).

Mensagem PT sem acento, arquivo `-F`, trailer
`Co-Authored-By: opencode <noreply@opencode.ai>`. **`--force` nunca.**
**Não commitar:** `guara-proxy.log`, lock, checkpoints, `pncp*.out`.

## Armadilhas

| Custo já pago | Regra |
|---|---|
| Shell mata ETL em 15–18 min | na desktop, `--max-cidades 1` + retomada; no home-pc, não inicie outro |
| Lock `.fila-pncp.lock` órfão | ver `pid=` com `Get-Process`; se morto, remover — só na desktop |
| 429 persistente | esperar janela; testar GET simples antes de retomar |
| `orgaos` faltando | cidade só com CNPJ da prefeitura subconta; rodar `orgaos --gravar` **na desktop** antes da fila |
| API 200 e mente | validar conteúdo (registros), não só status |
| Dois ETLs = 429 em dobro | medido; não paralelizar coleta |
| Número errado = dano | só publicar contagem medida com data |
| Staging misturado | pathspec explícito; `git diff --cached` vazio antes |

## Primeiro passo

1. `git fetch` no home-pc e conferir `0e3d4f2e` (ou o push mais novo).
2. Rodar o ritual de verificação acima em paralelo.
3. Avisar a desktop: verde/vermelho — a desktop só pusha com suíte verde.
