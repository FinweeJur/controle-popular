# HANDOFF — PNCP SP + demais capitais (23/09)

> **Tipo:** HANDOFF
> **Domínio:** cidades
> **Última medição:** 2026-09-23 ~15:30
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-EXPANSAO-PNCP-199-CIDADES.md](planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md), [HANDOFF-22-09-COLETA-GUARA.md](historico/entregas/HANDOFF-22-09-COLETA-GUARA.md), [AGENTS.md](/AGENTS.md), [ESTADO.md](02-estado/ESTADO.md), [FONTES.md](06-fontes/FONTES.md)
> **Palavras-chave:** handoff, pncp, sao-paulo, capitais, contratos, licitacoes, checkpoint, orgaos, fila, 199, 203, guara

## Sumário

- [Propósito e dono de cada fila](#propósito-e-dono-de-cada-fila)
- [Estado medido 23/09 15:30](#estado-medido-2309-1530)
- [Escopo desta IA](#escopo-desta-ia)
- [Como rodar (ritual)](#como-rodar-ritual)
- [Ordem de execução](#ordem-de-execução)
- [Capitais — fila congelada](#capitais--fila-congelada)
- [Checkpoint e logs](#checkpoint-e-logs)
- [Verificação](#verificação)
- [Armadilhas](#armadilhas)
- [Commit e deploy](#commit-e-deploy)
- [Fora de escopo](#fora-de-escopo)

## Propósito e dono de cada fila

Duas IAs na mesma máquina. **Uma fila por sessão. BH não é desta IA.**

| Fila | Dono | Cidades |
|---|---|---|
| **A (esta sessão opencode local)** | sessão que já roda o PC | **BH 3106200** + fecha resíduo das 4 pequenas se precisar |
| **B (handoff — outra IA)** | você | **SP 3550308** + **demais 25 capitais** do JSON |
| Já fechadas | — | Betim, Diamantina, Araçuaí, Itinga |

**Um ETL PNCP por máquina** (decisão no plano; API já é o gargalo).
Se a fila A estiver viva, **não lance SP ao mesmo tempo** — espere o processo
A morrer ou o dono liberar paralelo. Dois runs juntos só geram 429 em dobro.

## Estado medido 23/09 15:30

### Fase A (6 principais)

| Cidade | IBGE | Contratos ckpt | Lic ckpt | Banco PNCP | Papel |
|---|---|---|---|---|---|
| Betim | 3106705 | ✅ 6/6 | ✅ 78/78 | 776 / 639 | fechada |
| Diamantina | 3121605 | ✅ 6/6 | ✅ 78/78 | 285 / 682 | fechada |
| Araçuaí | 3103405 | ✅ 6/6 | ✅ 78/78 | 254 / 332 | fechada |
| Itinga | 3134004 | ✅ 6/6 (0 reg) | ✅ 78/78 (3) | 0 / 3 | fechada (lacuna da fonte) |
| **BH** | **3106200** | ❌ 0 keys (1º run caiu RetryError 15:21) | ❌ não iniciado | 0 / 0 | **FILA A — não tocar** |
| **SP** | **3550308** | ❌ não iniciado | ❌ não iniciado | 0 / 0 | **FILA B — seu trabalho** |

- `municipios.fontes.cnpjs_orgao`: **BH tem 6 CNPJs**; SP ainda não.
- `contratos_fonte` / `licitacoes_fonte`: **NULL nas 6** → sem trava de fonte-dupla.
- Banco: Guara `cp-postgres-597bd0` em `127.0.0.1:15432` (proxy). Neon fora.
- Código PNCP **não commitado** (`client/contratos/licitacoes/checkpoint.py` + `.gitignore`).

### Expansão (JSON)

| Métrica | Medido 23/09 |
|---|---|
| `cidades-estrategicas.json` | **203** (27 capitais + 176 polo-interior) |
| Rótulo público | **199** — reconciliar antes de número ao leitor |
| `cnpj_prefeitura` preenchido | **27/27 capitais**; **0/176 polos** (null) → polos **bloqueados CNPJ** |
| `ativo: true` | só BH e SP |
| Nas 6 principais | BH e SP são as **única** capitais já no escopo Fase A |

## Escopo desta IA

**Dentro:**

1. SP (3550308): `orgaos --gravar` → `contratos` → `licitações` até ckpt ok.
2. Depois (Fase C, **só após Fase A fechada** = SP **e** BH ok): as **25 outras capitais**.
3. Fase B de código **enquanto espera** (fila, cobertura CSV, teste de namespace) — sem rodar coleta se A estiver viva.
4. Recontar 203 vs 199 antes de texto público.

**Fora desta IA:**

- BH (3106200) — qualquer comando `--id-municipio 3106200`.
- Deploy Guara (fica com quem fechar as 6 + suíte).
- Commit do código PNCP se a sessão A ainda não fechou (coordenar pathspec único).
- Polos do interior (sem CNPJ).
- SAPL, diários, TCE, GeneXus, ComunicaBR.

## Como rodar (ritual)

Ambiente (igual à sessão A):

- cwd: `X:\DevCoder\OpenCode\controle-popular\etl\betim`
- venv: `C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe`
- `DATABASE_URL` já em `etl/betim/.env` — **não ler nem exibir**
- `PYTHONIOENCODING=utf-8`, `PYTHONUNBUFFERED=1`
- Logs na **raiz** do repo: `pncp-*.out` / `.err` (append compartilhado — filtre pelo id)

Lançamento em background (**só WMI + bat ASCII**; não prenda ao shell da sessão):

```powershell
$root = "X:\DevCoder\OpenCode\controle-popular"
$mods = "orgaos"   # depois trocar para contratos / licitacoes
$args = "--id-municipio 3550308 --ano-inicio 2021 --gravar"  # --gravar só em orgaos
$bat = @"
@echo off
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1
cd /d "$root\etl\betim"
"C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" -m etl.pncp.$mods $args >> "$root\pncp-$mods.out" 2>> "$root\pncp-$mods.err"
echo EXIT=%ERRORLEVEL%>>"$root\pncp-$mods.err"
"@
[System.IO.File]::WriteAllText("$root\_tmp-pncp-$mods.bat", $bat, [System.Text.Encoding]::ASCII)
[System.IO.File]::WriteAllText("$root\pncp-$mods.err", "")
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "cmd.exe /c `"$root\_tmp-pncp-$mods.bat`"" }
```

**Antes de lançar:** confira se a fila A tem processo vivo
(`Get-CimInstance Win32_Process | ? { $_.CommandLine -like '*etl.pncp*' }`).
Se tiver, **espere**.

Árvore: cmd → venv hermes → uv python é **pai→filho da mesma execução**.
Nunca mate só o uv.

## Ordem de execução

### 1. SP (Fase A — urgente desta IA)

```text
1. orgaos  --id-municipio 3550308 --gravar
   → preenche municipios.fontes.cnpjs_orgao (dezenas de CNPJ; sem isso
     contratos só puxa a prefeitura central e subconta — medido: 114 em 3 anos)
2. contratos --id-municipio 3550308 --ano-inicio 2021
   → ckpt chave {ibge}:{cnpj}:{ano}; re-roda até 0 nonok
3. licitacoes --id-municipio 3550308 --ano-inicio 2021
   → ckpt {ibge}:{ano}-{modalidade}; esfera M; ABORT no fim se modalidade
     incompleta → re-roda o mesmo comando
```

SP é **lenta** (modalidade 6 sozinha tem milhares). Aceite dias, não horas.
Retry 8× / ~18 min é **normal**. `RetryError` sem checkpoint = relança.

### 2. Sinal de “Fase A fechada”

- ckpt contratos: 6 cidades com todos os anos `ok`
- ckpt licitações: idem 78 unidades/cidade
- Guara: `fonte='pncp'` > 0 nas 6 (Itinga contratos 0 = lacuna ok)
- Só então: `npm test`, `npx tsc --noEmit`, dado pessoal, **deploy na cadência**
  (quem opera deploy — não misturar com expansão se janela de ~5 dias não venceu)

### 3. Fase B (código, pode correr em paralelo se A/B não estiverem coletando)

Do plano `PLANO-EXPANSAO-PNCP-199-CIDADES.md` § Fase B:

1. Fila: ler JSON → excluir 6 principais → id 7 dítos → `cnpj_prefeitura` null = **bloqueada CNPJ**.
2. Checkpoint já namespaced `{ibge}:…` — **não reverter**.
3. Orquestrador opcional `etl.pncp.fila` (1 cidade/vez; logs `logs/pncp/{ibge}.out`).
4. CSV cobertura `;` + BOM: `ibge;nome;uf;tipo;contratos_n;licitacoes_n;anos_ok;ultimo_erro;atualizado_em`.
5. Piloto 2 capitais menores **antes** do lote grande (só após Fase A).
6. Teste do namespace + atualizar FONTES/ESTADO/este plano.

### 4. Fase C — 25 capitais (bloqueio: Fase A fechada)

**Lote 2 do plano = capitais restantes, um por rodada.**

Ordem sugerida (volume ~alto → controle; adapatável):

1. RJ, Salvador, Fortaleza, Brasília, Recife, Porto Alegre, Curitiba, Manaus, Belém, Goiânia  
2. Demais por UF/região  
3. Sempre: `orgaos` (gravar) → `contratos` → `licitacoes`  
4. Entre cidades: recontar Guara + olhar CSV  
5. Depois das capitais: polos **só quando** `cnpj_prefeitura` preenchido  

**Nunca** casar município por nome. Só IBGE 7.

## Capitais — fila congelada

Fonte: `apps/web/data/cidades-estrategicas.json` (23/09).
BH e SP riscadas da fila de expansão (BH=A, SP=acima).
Todas têm `cnpj_prefeitura` no JSON.

| IBGE | Capital | UF | CNPJ prefeitura |
|---|---|---|---|
| 2800308 | Aracaju | SE | 13128780000152 |
| 1501402 | Belém | PA | 05055009000113 |
| 1400100 | Boa Vista | RR | 05943030000130 |
| 5300108 | Brasília | DF | 00394601000100 |
| 5002704 | Campo Grande | MS | 03501509000106 |
| 5103403 | Cuiabá | MT | 03507530000194 |
| 4106902 | Curitiba | PR | 76417005000186 |
| 4205407 | Florianópolis | SC | 82892508000190 |
| 2304400 | Fortaleza | CE | 07954605000160 |
| 5208707 | Goiânia | GO | 01612092000123 |
| 2507507 | João Pessoa | PB | 08778326000134 |
| 1600303 | Macapá | AP | 05995766000180 |
| 2704302 | Maceió | AL | 12200135000180 |
| 1302603 | Manaus | AM | 04312677000112 |
| 2408102 | Natal | RN | 08241747000143 |
| 1721000 | Palmas | TO | 24851511000185 |
| 4314902 | Porto Alegre | RS | 92963560000160 |
| 1100205 | Porto Velho | RO | 04273099000101 |
| 2611606 | Recife | PE | 10565000000192 |
| 1200401 | Rio Branco | AC | 04034484000140 |
| 3304557 | Rio de Janeiro | RJ | 42498733000148 |
| 2927408 | Salvador | BA | 13927801000149 |
| 2111300 | São Luís | MA | 06307102000130 |
| 2211001 | Teresina | PI | 06554869000150 |
| 3205309 | Vitória | ES | 27142058000126 |

(+ SP 3550308 e BH 3106200 fora desta lista de expansão.)

## Checkpoint e logs

| Arquivo | Chave |
|---|---|
| `etl/betim/.checkpoint-pncp-contratos.json` | `{ibge}:{cnpj}:{ano}` |
| `etl/betim/.checkpoint-pncp-licitacoes.json` | `{ibge}:{ano}-{modalidade}` |

- `ok` pula; `parcial` retoma `pagina+1`; sem chave = página 1.
- Filtrar progresso **pelo prefixo do ibge** (arquivo é compartilhado).
- Logs `pncp-*.out` acumulam histórico de todas as cidades — grep pelo id.
- Checkpoints e `pncp*.out/err` / `_tmp-pncp-*.bat` ficam **fora do commit** (gitignore).

## Verificação

```powershell
# Processos PNCP vivos (não matar par venv→uv)
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*etl.pncp*' } |
  Select-Object ProcessId, Name, CommandLine

# Progresso SP
$c = Get-Content etl/betim/.checkpoint-pncp-contratos.json -Raw | ConvertFrom-Json
@($c.PSObject.Properties | Where-Object Name -like '3550308*')

# Guara (1 stmt, csv; nunca expor DATABASE_URL)
# node "C:\nodejs\node_modules\@guaracloud\cli\bin\run.js" catalog query \
#   -p controle-popular -s cp-postgres-597bd0 \
#   --query "select id_municipio, fonte, count(*) from contratos where id_municipio='3550308' group by 1,2" \
#   --format csv
```

Suíte antes de commitar código/dado:

```bash
npm test
npx tsc --noEmit
python scripts/checar-dado-pessoal-em-dado.py
python scripts/validar-documentacao.py
```

## Armadilhas

| Custo já pago | Regra |
|---|---|
| RetryError ~18 min sem linha | relança o **mesmo** módulo; não “conserta” código |
| `ABORT: N modalidade(s)-ano incompletas` | exit≠0; dado parcial ok; re-roda até limpar |
| 429/502/504 | espera no `client.py`; não paraleliza (8 threads = 291×429 medido) |
| Licitação de esfera federal em capital | **nunca** tirar filtro `esferaId=M` |
| `codigoMunicipioIbge` só sediava | orgaos + filtro M; não usar só IBGE em licitações |
| CNPJ null no JSON | polo = fila bloqueada; capital tem CNPJ |
| 203 ≠ 199 | recontar na data da fala |
| Dois ETLs / duas IAs | 1 por máquina; não atropelar a fila A |
| `cmd` e `*` | caminho direto, sem glob |
| Commit | pathspec explícito, `-F`, PT sem acento, `Co-Authored-By` |
| `--force` | proibido (AGENTS) |

## Commit e deploy

- **Código PNCP** (ainda `M`/`??` na árvore): quem fechar a Fase A commita
  **uma vez**, pathspec:
  `etl/betim/etl/pncp/*.py` + `.gitignore` se preciso.
  Mensagem PT sem acento, arquivo `-F`, trailer
  `Co-Authored-By: opencode <noreply@opencode.ai>`.
- **Não** commitar checkpoint, logs, bats.
- **Deploy Guara:** só Fase A fechada + suíte verdes + cadência ~5 dias.
  Expansão de capitais **não** mistura janela de deploy da Fase A.
- Push: `git fetch && git rebase origin/main && git push origin HEAD:main`
  — só com dono ciente; segurar push se build/deploy na máquina.

## Fora de escopo

- BH e fechamento residual das 4 MG pequenas (fila A).
- 176 polos sem CNPJ.
- Outras fontes (SAPL, TCE, portal, GeneXus).
- Migrar banco (Fase 4 Guara).
- Número público “199 cidades baixadas” sem recontagem.

---

**Primeiro passo desta IA:** checar se fila A (BH) está viva → se livre,
`orgaos` de SP 3550308 `--gravar` → contratos → licitações; em paralelo
(Fase B sem coleta) montar manifesto das 25 capitais + CSV de cobertura.
