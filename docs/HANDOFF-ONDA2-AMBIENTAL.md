# HANDOFF ONDA2 AMBIENTAL

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-19
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](02-estado/ESTADO.md), [GUIA-DE-DOCUMENTACAO.md](GUIA-DE-DOCUMENTACAO.md)
> **Palavras-chave:** plano, expansão, fila

## Sumário

- [Propósito](#propósito)
- [O que já existe](#o-que-já-existe)


---

## O que já existe

### 6 estados com coletor comprometido + amostra no feed

| UF | Coletor | Fonte | Registros (amostra) | Status |
|---|---|---|---|---|
| MG | `coletar-igam-outorgas.py` | Grade IGAM (WFS) | 500 / 55.729 | truncado |
| MT | `coletar-sema-mt-licencas.py` | GeoServer WFS | 500 / 17.083 | truncado |
| BA | `coletar-inema-ba-licencas.py` | DOE-BA (Elasticsearch) | 71 / ~6.360 | truncado |
| PA | `coletar-semas-pa-licencas.py` | SIMLAM-PA (ASP.NET) | 141 / 114.038 | truncado |
| MA | `coletar-sema-ma-licencas.py` | DOEMA (Elasticsearch) | 498 / ~2.681 | truncado |
| GO | `coletar-semad-go-licencas.py` | SIGA GeoNode WFS | 500 / 3.745 | truncado |

**Todos truncados** — rodam full com `--limit 0` na home-pc.

### 2 fontes nacionais (cobrem todos os 27 estados)

| Fonte | Coletor | Registros (amostra) |
|---|---|---|
| IBAMA licenças | `coletar-ibama-licencas.py` | 500 / 14.155 |
| IBAMA autos infração | `coletar-ibama-autos.py` | 3.000 / 11.554 |
| ANA outorgas | `coletar-ana-outorgas.py` | 15.000 / 751.324 |

### 21 estados com NADA (sem coletor, sem dados, sem pesquisa)

AC · AL · AM · AP · CE · DF · ES · MS · PB · PE · PI · PR · RJ · RN · RO · RR · RS · SC · SE · SP · TO

### O que falta nos 6 estados já comprometidos

- **Full coleta**: rodar com `--limit 0` na home-pc
- **IGAM não está em `rotina-ambiental.mts`** — precisa adicionar ao orchestrator
- **Bacias IGAM** (URGA) não normalizadas para vocabulário ANA — rótulo "Regional/bacia" cobre, mas mapeamento formal falta

---

## Objetivos da Onda 2

1. **Pesquisar fontes** dos 21 estados restantes (mesma estrutura de `F0-discovery.md`): órgão, sistema, URL, formato,-API/wrapper, conselho, outorga delegada, infrações
2. **Criar coletores** para os estados com API/wrapper viável (WFS, GeoNode, Elasticsearch público)
3. **Amostra mínima** de 500 registros por estado (5.000 para estados >50k registros)
4. **Integrar no feed** `/ambiental/licencas` via `licencas-unificada.ts`
5. **Agendar no orchestrator** `rotina-ambiental.mts` — seção `FONTES.estados`
6. **Relatório de cobertura** atualizado em `docs/RELATORIO-TECNICO-PORTAL.md`

---

## Critérios de sucesso

| Critério | Métrica |
|---|---|
| Pesquisa completa | 27/27 estados com órgão + URL + formato documentado |
| Coletores criados | ≥ 15 dos 21 restantes (70%) com script funcional |
| Dados no feed | ≥ 15 novos estados com amostra em `REGISTROS_LICENCAS` |
| Orchestrator | ≥ 5 estados agendados em `rotina-ambiental.mts` |
| TSC limpo | `npx tsc --noEmit` sem erros |
| CPF audit limpo | `python scripts/checar-dado-pessoal-em-dado.py` sem positivos |
| Commit + push | stages separados (regra 5 do AGENTS.md), push sem `--no-verify` |

---

## Padrão de cada coletor (copiar dos existentes)

```
scripts/coletar-{sigla-sistema}-{sigla-uf}.py
```

Cabeçalho obrigatório:
- Nome do sistema, órgão, UF
- URL da API + endpoint usado
- Robots.txt: registrar decisão (seguir/não seguir) e justificativa
- Pausa entre requisições (≥ 2s; ≥ 5s se ASP.NET)
- User-Agent honesto: `controlepopular.com.br/1.0 (+contato@controlepopular.com.br)`
- Checkpoint por página (retomada em caso de falha)
- Varredura CPF/CNPJ antes de commitar (mod-11)
- Dado ingerido JSON no mesmo padrão: `{ gerado_em, fonte, truncado, linhas: [...] }`
- `--limit N` para amostra (default 500), `--limit 0` para full

### Integração no feed

Adicionar em `licencas-unificada.ts`:
1. `import dado from "@/data/{sigla}.json"`
2. `const linhasXxx = unificar("ÓRGÃO (UF)", "categoria", mapper, dado.linhas)`
3. Spread em `REGISTROS_LICENCAS`
4. `truncado` e `ressalva_editorial` em `LICENCAS_COBERTURA`

### Integração no orchestrator

Adicionar em `rotina-ambiental.mts` → `FONTES`:
```ts
"coletar-{sigla}": {
  cmd: "python scripts/coletar-{sigla}.py --limit 0",
  timeout: 60 * 60 * 1000,
}
```

---

## Restrições conhecidas

1. **Neon em 94%** — novos dados precisam de D1 (schema `schema.d1.ts`), não Neon
2. **home-pc não builda** — `next build` só na máquina de deploy
3. **jcode quebrado** — usar opencode Task tool
4. **Pre-push bloqueia CPF real** — sempre varrer antes de commitar
5. **AGENTS.md regra 5**: commit por `--only <pathspec>` por estágio
6. **AGENTS.md regra 6**: mensagem em arquivo, nunca `-m`
7. **Máquina deploy** é home-pc — segurar push durante build/deploy

---

## Fontes de referência para pesquisa

- `F0-discovery.md` — modelo de pesquisa MG (15 seções, 3 fontes)
- `docs/relatorio-mapeamento-27-estados.md` — NÃO EXISTE (precisa criar)
- Sites governamentais: SISAGUA, SIMLAM, SIGAM, SISCOMP, SIGEO, IDE-Sisema
- Catálogo IBGE: https://servicodados.ibge.gov.br/api/v1/localidades/estados
- API Dados Abertos: dados.gov.br, dados.mjus.br
