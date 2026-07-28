# F9 — Checklist de lançamento

> Status em 2026-07-25. O que **dá pra preparar sem deploy real** está feito; o que depende de conta/decisão do usuário (Vercel, domínio, Sentry) está listado como ação dele — sem inventar como se já existisse.

## ✅ Feito nesta sessão

- [x] **`/privacidade`** — LGPD: o que se coleta sobre magistrados (público, base legal transparência) vs. sobre conta de usuário (e-mail via Auth, monitoramentos), o que nunca se coleta (CPF, filiação, endereço), direitos do titular
- [x] **`/sobre`** — proposta do produto, independência, link para o código
- [x] Rodapé linkando `/sobre`, `/privacidade`, código no GitHub
- [x] Disclaimer de independência já existia no rodapé desde a F0
- [x] Metodologia pública (`/metodologia`) desde a F0 — pré-requisito de transparência que o `/privacidade` referencia

## ⏳ Ação do usuário — decisões que só ele pode tomar

| Item | O que falta | Por que não fiz sozinho |
|---|---|---|
| **Domínio próprio** | Registrar/apontar `controlepopular.br/judiciario` (ou equivalente) | Custo real (~R$ 40/ano) e decisão de marca — não é ação técnica que se tome sem pedir |
| **Deploy Vercel** | Criar o projeto Vercel apontando pro repo, configurar como zona do multi-zone junto de `/betim` e `/congresso` | Exige conta/permissão do usuário no Vercel — nunca crio conta nem manipulo config de terceiro em nome dele |
| **Auth: Site URL / Redirect URLs** | Configurar no painel do Supabase (Authentication → URL Configuration) para o domínio de produção, além do `localhost:3020` de dev | Settings de conta de terceiro — mesma regra do domínio/Vercel |
| **Analytics** | Vercel Analytics (gratuito, 1 clique) ou equivalente | Decisão do usuário se quer medir tráfego |
| **Sentry** | Conta + DSN para captura de erro em produção | Exige criar conta em serviço terceiro |
| **GitHub Actions secrets** | ✅ **já feito pelo usuário** (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — confirmado rodando com sucesso em 2026-07-25 | — |
| **`0005`/`0006` no SQL Editor** | Rodar as 2 migrations pendentes (alertas + mandatos idempotentes) — ver TODO.md | DDL, cliente Python não roda |

## Checklist técnico (§11 do plano original) — o que já dá pra verificar

| # | Item | Status |
|---|---|---|
| 1 | Contagem de PLs bate com fonte oficial | N/A — não é o domínio deste eixo (é do `/congresso`) |
| 2 | Amostra de dado conferida campo a campo | ✅ MSF 7/2026 (Messias) conferida linha a linha contra o texto oficial da ementa |
| 3 | Nenhuma análise cita dispositivo inexistente | ✅ 19/19 indicações ao STF sem inciso espúrio (bug corrigido, commit `afbf97b`) |
| 4 | Score reproduz soma dos itens | N/A neste domínio (não há score somado — cada número é uma fórmula única, ver `/metodologia`) |
| 5 | Reprocessar dá o mesmo resultado | ✅ `etl.senado.indicacoes --ano` roda com `on_conflict`, idempotente — reprocessado 2× nesta sessão sem duplicar |
| 6 | RLS: anônimo não lê `documentos`/`monitoramentos`/`alertas` de outro usuário | ⏳ policies escritas e aplicadas (`0002_rls.sql`), mas **nunca testadas com 2 contas reais** — falta usuário A vs. usuário B de verdade |
| 7 | Ofício em DOCX/PDF abre corretamente | ✅ `scripts/smoke-oficio.ts` gera os 3 formatos, 12 casos verdes |
| 8 | Alerta dispara em ≤24h de mudança real | ⏳ `etl.alertas` escrito e testado offline; não rodou contra o Action ainda (não está na rotina do `etl.yml`, só o ETL de indicações está) |
| 9 | Busca híbrida traz resultado relevante | Fora de escopo — este eixo não tem F8 semântica ainda |
| 10 | Chat recusa fora de escopo | N/A — não há chat neste eixo |
| 11 | App navega com LLM desligado | ✅ **invariante desde a F0** — nenhuma tela deste app jamais dependeu de LLM |
| 12 | Lighthouse mobile ≥ 90, 3 temas, A+/A− | ⏳ design system portado do `/congresso` (já valida lá); não medido especificamente neste repo |
| 13 | Nenhum `select` sem paginação | ✅ todo select usa `fetchAll`/`fetch_all` — regra herdada e seguida |

## O que isto NÃO é

Não é "pronto pra produção". É o que dava para preparar sem tocar em conta de terceiro. As 6 linhas da tabela de ação do usuário são o gate real entre "código funcionando localmente contra o Supabase real" (onde o projeto está agora) e "site público no ar".
