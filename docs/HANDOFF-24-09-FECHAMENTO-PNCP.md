# HANDOFF — Fechamento PNCP no home-pc (24/09)

> **Tipo:** HANDOFF
> **Domínio:** cidades
> **Última medição:** 2026-09-25 11:26
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-EXPANSAO-PNCP-199-CIDADES.md](planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md), [HANDOFF-23-09-PNCP-SP-CAPITAIS.md](HANDOFF-23-09-PNCP-SP-CAPITAIS.md), [AGENTS.md](/AGENTS.md), [ESTADO.md](02-estado/ESTADO.md), [FONTES.md](06-fontes/FONTES.md)
> **Palavras-chave:** handoff, pncp, home-pc, servidor, fila, verificacao, testes, litigios, cobertura, 429, paralelo

## Sumário

- [Por que este handoff](#por-que-este-handoff)
- [Divisão entre máquinas](#divisão-entre-máquinas)
- [Estado medido 25/09 11:26](#estado-medido-2509-1126)
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

Litígios foi publicado e **pushado** no commit `49f8db91` (24/09) — testes
5/5 e `tsc` limpos na hora do commit. Código Fase B/C também pushado em
`7c67a3a0`; plano de cavas em `cd60b79c`.

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

## Estado medido 25/09 11:26

| Métrica | Valor |
|---|---|
| Manifesto `dados/manifesto-pncp.csv` | **203** linhas — 136 `pronta`, 55 `delegada` (25 capitais fila B + 30 grandes delegadas ao Gemini), 6 `excluida-principal`, 6 `bloqueada-cnpj` |
| Cidades completas (ckpt contratos+licitações ok) | **47 / 136** prontas |
| Fila restante | **89** |
| Chaves checkpoint contratos | 402 (402 ok, 0 parcial) |
| Chaves checkpoint licitações | 4.281 (4.280 ok, 1 parcial) |
| Parcial aberta | Imperatriz/MA — modalidade 2026-9 (faltam 2026-10..13) |
| Fechadas na madrugada | Manacapuru, Parintins, Tefé (AM), Abaetetuba, Altamira (PA) |
| Fechadas na manhã | Ananindeua, Cametã, Castanhal, Itaituba, Marabá, Paragominas, Redenção, Santarém, Tucuruí (PA), Santana (AP), Gurupi (TO) |
| Próximas da fila | Imperatriz/MA (refaz 2026-9), Floriano, Parnaíba, Picos (PI), Crateús (CE) |
| Commit litígios | `49f8db91` — **pushado** |
| Código Fase B (ETL) | **commitado e pushado** (`7c67a3a0`) |

**Armadilha medida hoje:** cidade morta no timeout do shell deixa só
chaves `ok` no checkpoint e **passa no critério barato** de
`cidade_completa` — Ananindeua (16 de ~78) e Imperatriz (74 de 78)
contavam completas. Remoção de chaves (Ananindeua) ou marcação
`parcial` (Imperatriz) as devolvem à fila; conferir
`logs/pncp/<ibge>.out` (arquivo existe = rodou inteiro) antes de acreditar
em "completa". Timeout de 30 min não bate em cidade grande — suba o
`--timeout` da shell ou rode com `max-cidades 1` e retome.

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
2. **Revisar o diff B/C** — já pushado (`7c67a3a0`); conferir o diff no
   GitHub em vez de copiar pathspec.
3. **Atualizar docs de estado** com números medidos que chegarem:
   `docs/02-estado/ESTADO.md` (fila) e `docs/06-fontes/FONTES.md`
   (ritual PNCP), se necessário, em **commit próprio** pathspec.
4. **Conferir a rota** `/ambiental/litigios-climaticos` no build local
   do home-pc (card JUMA com âncora, link do painel, CSV com coluna
   Link Painel) — o commit `49f8db91` já passou vitest+tsc.

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

**Feito (24/09):** litígios `49f8db91`, handoff `5c440d4f`, Fase B/C
`7c67a3a0`, cavas `cd60b79c` — tudo pushado.

**Resta (desktop):**

1. Fecha C3 o quanto puder → C4 (`python -m etl.pncp.cobertura
   --manifesto dados/manifesto-pncp.csv`).
2. Commit de atualização de números com pathspec único (manifesto,
   cobertura, plano PNCP, ESTADO, handoff) se o manifesto mudar.
3. `git fetch && git rebase origin/main && git push origin HEAD:main`
   — **só com suíte verde**.

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

1. `git fetch` no home-pc e conferir o push mais novo (`cd60b79c` ou além).
2. Rodar o ritual de verificação acima em paralelo.
3. Avisar a desktop: verde/vermelho — a desktop só pusha com suíte verde.
