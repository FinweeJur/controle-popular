# Roteiro — retorno à Neon (atualizado em 2026-09-08)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-08
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [ROTEIRO-PGVECTOR-CHATBOT.md](ROTEIRO-PGVECTOR-CHATBOT.md)
> **Palavras-chave:** neon, postgres, migrations, runbook, build, egress
> **Status:** ✅ EXECUTADO em 08/09/2026 — Neon de volta com 87 migrations + cargas mínimas (124,4 MB de ~500 do plano free)

## Sumário

- [Situação real (08/09)](#situao-real-0809)
- [Passo 0 — reativar o projeto na Neon](#passo-0--reativar-o-projeto-na-neon)
- [Passo 1 — migrations pendentes (schema)](#passo-1-migrations-pendentes-schema)
- [Passo 2 — dado: cargas mínimas](#passo-2--dado-cargas-mnimas)
- [Passo 3 — sincronizar o resto do local para a Neon](#passo-3--sincronizar-o-resto-do-local-para-a-neon)
- [Passo 4 — varredura total dos links](#passo-4--varredura-total-dos-links)
- [Passo 5 — conferir](#passo-5--conferir)
- [Origem](#origem)

## Situação real (08/09)

- A produção já é `next start` no **home-pc com Postgres local** — a Neon NÃO
  é pré-requisito do site. Ela volta para: **CI no GitHub** (os 6 ETLs não
  alcançam o Postgres local) e **pgvector do chatbot** (Fase 5).
- A cota de egress do plano free estourou por causa dos builds. O guardião é
  `apps/web/scripts/orcamento-egress.mts` (85% build / 15% tráfego). **Builds
  continuam no Postgres local** — o build NUNCA aponta para a Neon de novo.
- ⚠️ A `DATABASE_URL` da Neon não existe em `.env` nenhum desta máquina
  (removida no incidente). O dono copia do console Neon e coloca em um lugar
  que não vá para o repo.
- As migrations chegaram a **0087** — a lista antiga (0071–0077) ficou curta.
- Os passos 2 e 3 do roteiro antigo (backfill de temas e URLs do TJMG) já
  rodaram no Postgres local em 26/08 — a sincronização do Passo 3 abaixo os
  leva para a Neon de uma vez.

## Passo 0 — reativar o projeto na Neon

1. Dono entra no console Neon, reativa o projeto e copia a connection string.
2. Guardar a string FORA do repo (o mesmo regime de `AI_API_KEY`).
3. Exportar `DATABASE_URL` da Neon só na sessão que roda o runbook — nunca
   sobrescrever os `.env` que apontam para o local.

## Passo 1 — migrations pendentes (schema)

Com a `DATABASE_URL` da Neon no ambiente, da raiz do repo:

```powershell
foreach ($m in (Get-ChildItem supabase\betim\migrations\*.sql | Where-Object { $_.Name -match '^00(7[1-9]|8[0-7])_' } | Sort-Object Name)) {
  npx tsx scripts/aplicar-migration.mts $m.FullName
}
```

A `0071` é a que conserta o **convênio de Betim duplicado**. Todas são
idempotentes (`if not exists` / `on conflict`) — rodar de novo é seguro.

## Passo 2 — dado: cargas mínimas

O que a Neon precisa ter para a CI e o pgvector funcionarem:

```powershell
$env:DATABASE_URL = '<string-da-neon>'   # só nesta sessão
npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-mma.json
npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-cndh.json
python -m etl.apis.classificar_temas_ambientais
python -m etl.apis.classificar_temas_atos_oficiais
```

## Passo 3 — sincronizar o resto do local para a Neon

O Postgres local está à frente da Neon (atos do diário, convênios, risco
climático, capitais/polos — tudo do diário oficial 16.601 atos e dos ETLs de
26/08–08/09). Usar `pg_dump`/`pg_restore` das tabelas de dado, TABELA A TABELA
(dump completo sobrescreveria o que o Passo 2 já carregou de forma
diferente):

```powershell
# listar tabelas e contagens no local, para decidir a lista
psql -h 127.0.0.1 -U postgres -d controle_popular -c "select relname, n_live_tup from pg_stat_user_tables order by n_live_tup desc limit 30"
```

Cada tabela: `pg_dump -t <tabela> --data-only` no local → `pg_restore`/`psql`
na Neon. Rodar com a guarda de dado pessoal em mente: dado que já passou a
guarda no local segue o mesmo regime.

## Passo 4 — varredura total dos links

```powershell
node scripts/auditoria-links-normas.mjs
```

E, novo em 08/09, a primeira rodada real do LinkMender v2:

```powershell
npx tsx scripts/agent-tools/linkmender-v2.mts
```

## Passo 5 — conferir

```powershell
npx tsx scripts/colunas-reais.mts convenios_federais atos_oficiais
```

E o convênio de Betim não duplicado:

```sql
select count(*), count(distinct (codigo, exercicio)) from convenios_federais
where id_municipio = '3106705';
```

## ✅ O que foi executado em 08/09 (com os achados)

1. **Zerado** o dado defasado (351 MB de agosto) — `drop schema public cascade`
2. **87 migrations aplicadas** (0001–0087). Dois obstáculos, ambos resolvidos:
   - a role `service_role` (padrão Supabase) não existia na Neon — criada junto com `anon` e `authenticated`, todas `nologin`
   - a `0002_rls` cita `storage.buckets` (Supabase Storage) — stub mínimo criado (buckets + objects); mídia real vai para o R2
3. **Cargas mínimas concluídas** (124,4 MB): legislação federal 8.940 (MMA 8.570 + CNDH 370, todas com tema), atos_oficiais 10.344, atos_diario 16.601, direito crítico 15, SNISB 2.240, FEAM 249, AdaptaBrasil 6.824, municípios 210 + referências (das seeds)
4. **Classificadores rodaram** contra a Neon (temas ambientais e de atos)
5. **Links TJMG corrigidos** (id 6/7/8) na Neon E no local (o conserto de 13/08 só tinha ido ao seed)

### Achados que valem registro

- ⚠️ **O endpoint `-pooler` da Neon zera o `search_path` a cada sessão** (`source: session`, `''`). Sincronização e scripts com SQL não-qualificado devem usar o **endpoint direto** (mesma URL sem `-pooler.`). O `ALTER ROLE neondb_owner IN DATABASE neondb SET search_path = public` colou no direto.
- `carregar-legislacao-federal.mts` ganhou a válvula `--permitir-nuvem` (opt-in explícito; a trava local continua sendo o padrão).

## Origem

Escrito em 17/08/2026 para a virada da cota de 01/09. Atualizado em 08/09: migrations 0071-0087, producao ja no Postgres local, foco da Neon em CI e pgvector, sincronizacao local -> Neon pelo pg_dump.

Escrito em 17/08/2026 para a virada da cota de 01/09. Atualizado e EXECUTADO em 08/09: 87 migrations, cargas minimas (124,4 MB), classificadores, links TJMG; quirk do pooler documentado.
