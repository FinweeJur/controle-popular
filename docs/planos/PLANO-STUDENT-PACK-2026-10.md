# Plano — Ofertas do GitHub Student Developer Pack no Controle Popular

> **Tipo:** PLANO
> **Domínio:** global (infraestrutura, observabilidade, custo)
> **Última medição:** 2026-10-04
> **Leitura estimada:** média (5–10 min)
> **Relacionados:** [OPERACAO.md](../05-operacao/OPERACAO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** student pack, new relic, sentry, simple analytics, observabilidade, analytics, guara, cota, deploy, dados pessoais, expiracao

## Sumário

- [Propósito](#propósito)
- [Lacunas que o pack ataca](#lacunas-que-o-pack-ataca)
- [Avaliação das 16 ofertas](#avaliação-das-16-ofertas)
- [Integrado nesta rodada](#integrado-nesta-rodada)
- [Como ligar/desligar o New Relic](#como-ligardesligar-o-new-relic)
- [Datas de expiração e renovação](#datas-de-expiração-e-renovação)
- [Pendências](#pendências)
- [Régua](#régua)

## Propósito

Registra a avaliação das ofertas do GitHub Student Developer Pack (verificadas
em 04/10/2026 em education.github.com/pack) contra as lacunas medidas deste
repositório, o que ficou decidido, o que foi integrado e o que expira quando.
Oferta vencida sem aviso é surpresa — e cota já custou caro aqui.

## Lacunas que o pack ataca

Medidas no repositório (fonte entre parênteses):

- **Sem rastreio de erro em produção** — erro de servidor só aparece se um
  vigia de página notar (`judiciario-F9-lancamento.md`).
- **Sem analytics de tráfego** — só a contagem `page_views` no D1.
- **Sem staging** — deploy é manual e a cada ~5 dias por cota do Guara
  (`OPERACAO.md §0`); validar antes gasta os ~17 min de build pagos.
- **Sem backup remoto do Postgres local** — o local é a fonte da verdade dos
  coletores.

## Avaliação das 16 ofertas

| Oferta | O que dá | Veredito |
|---|---|---|
| **New Relic** | grátis enquanto estudante (valor ~US$ 300/mês) | ✅ **integrado** — erros + tempo por rota |
| **Simple Analytics** | plano do pack; sem cookie e sem DNT | ✅ **integrado** — lacuna de analytics |
| **Termius** | Pro grátis enquanto estudante | ✅ adotar — SSH no `home-pc` |
| **GitHub Pages** | grátis para todos | ✅ adotar — status page/docs estáticos |
| **Azure** | US$ 100 + 25 serviços (18+, sem cartão) | 🟡 staging/TTS — planejar consumo |
| **CodeScene** | conta grátis (repo público já é grátis) | 🟡 análise pontual de dívida |
| **IMG Bot** | otimiza imagem no repo | 🟡 só se houver imagem pesada |
| **MongoDB / Astra** | créditos Atlas / DataStax | 🟡 só se o RAG sair da memória |
| **CARTO** | upgrade espacial por 2 anos | 🟡 futuro do eixo Terra |
| **Camber** | 200 h CPU, 75 GB, 200 LLM/mês | 🟡 análise pesada — adiar |
| **Visme** | 3 meses Starter | 🟡 divulgação, sem número digitado (AGENTS §7) |
| **AstraSecurity** | firewall 6 meses | ❌ redundante com Cloudflare |
| **Pageclip** | forms hospedados | ❌ dado de cidadão a terceiro (§5.8) |
| **Datadog** | Pro 2 anos | ❌ cláusula "não comercial" + sem host no Guara |
| **Honeybadger** | Small 1 ano | ❌ redundante com New Relic |

## Integrado nesta rodada

**New Relic (APM, servidor).** Arquivos:

- `apps/web/instrumentation.ts` — carrega o agente no gancho oficial do Next,
  com três guardas (só Node, nunca no build, só com chave).
- `apps/web/newrelic.cjs` — configuração de privacidade: sem header, sem
  parâmetro de requisição (a busca pode conter nome/CPF), sem repasse de
  console, SQL ofuscado e sem RUM no navegador.
- `Dockerfile` — copia o `newrelic.cjs` para o runner e aponta
  `NEW_RELIC_CONFIG_FILENAME`.

O pacote `newrelic` já era dependência (`package.json`), adicionada sem uso no
commit `2f6a6ba3`; esta rodada o liga de verdade.

**Simple Analytics.** Script + pixel `noscript` no `app/layout.tsx`. Sem chave:
o domínio identifica a conta. Sem cookie, sem fingerprint, respeita DNT.

**Status page no GitHub Pages (04/10/2026).** A rota `/status` mostra, ao vivo,
se o portal está no ar — a medição roda no navegador de quem abre, para a página
continuar útil quando o portal cai. Arquivos:

- `apps/web/app/status/page.tsx` — casca estática (`force-static`), `noindex`,
  fora do sitemap.
- `apps/web/app/status/StatusAoVivo.tsx` — checagem no navegador, duas
  tentativas por alvo (leitura normal quando é o mesmo domínio; requisição
  opaca quando é outro, caso do Pages).

A cópia independente sai no export estático que o workflow "Publicar no GitHub
Pages" já publica — em `finweejur.github.io/controle-popular/status/`. Ela
sobrevive à queda da Guara porque é outro provedor. Limitação honesta: essa
cópia só existe depois que alguém roda aquele workflow (é manual e pesado).

## Como ligar/desligar o New Relic

1. Criar a conta no painel do New Relic e copiar a **license key**.
2. No Guara, definir `NEW_RELIC_LICENSE_KEY` **em runtime, SEM `-b`** (a flag
   `-b` é só para build — ver AGENTS §6).
3. `guara deploy --project controle-popular` (imagem nova). Só então o agente
   passa a existir no container.
4. **Medir a memória** logo depois: `guara logs`. O teto do Starter é 256 MB e
   o heap está capado em 192 MB (`Dockerfile`). Se houver OOM/crash_loop,
   **remover a chave no painel desliga o APM na hora**, sem redeploy.

## Datas de expiração e renovação

Todas são renovações anuais enquanto a verificação de estudante estiver
válida. Anotar no calendário e **revalidar antes de vencer**:

- **New Relic** — grátis enquanto estudante; renovar verificação no GitHub.
- **Simple Analytics** — plano do pack; confirmar duração no resgate.
- **CodeScene, Termius, IMG Bot, Polypane (1 ano), Azure (anual)** — 1 ano.

## Pendências

- ✅ **CSP resolvido (04/10/2026):** `scripts.simpleanalyticscdn.com` entrou em
  `script-src` e `queue.simpleanalyticscdn.com` em `connect-src` (o pixel
  `noscript` já era coberto por `img-src 'self' data: https:`). O
  `next.config.ts` do checkout principal tinha alteração não commitada de outra
  sessão; o ajuste foi feito num worktree limpo a partir do `origin/main`
  (§5.4), sem tocar no trabalho alheio.
- ✅ **Status page (04/10/2026):** rota `/status` feita. Falta a decisão de
  rodar o workflow "Publicar no GitHub Pages" (manual e pesado) para existir a
  cópia independente; até lá, `/status` funciona só dentro do portal.
- ✅ **Termius e SSH (04/10/2026):** OpenSSH Server ligado no `home-pc` com login
  por **chave** (`administrators_authorized_keys`); Tailscale já ativo
  (`100.126.160.109`). A mesma chave (`~/.ssh/id_rsa`) serve o `home-pc` e a VM.
- ✅ **Azure montado (04/10/2026):** espelho no **Container Apps**
  (`northcentralus` — a Student bloqueia o Brasil), **New Relic** conectado
  ("Controle Popular (Azure)"), **VM** `cp-vm` (B2ats_v2, desligada por padrão)
  e **Blob** `cpdados4751` para o preparador das cavas. Ver
  [HANDOFF-2026-10-04](../historico/entregas/HANDOFF-2026-10-04-AZURE-CAVAS.md).
- ✅ **Azure Speech + Translator — leitura traduzida (05/10/2026):** o "Ouvir"
  agora TRADUZ a página e fala no idioma escolhido (147 idiomas, inclui
  mandarim e italiano), com voz fixa do Azure em qualquer aparelho. Recursos
  `cp-onsa-traduz` (Translator F0) e `cp-onsa-voz` (Speech F0) em
  `northcentralus`; chaves como segredo do Container App do espelho. Rota
  `POST /api/ouvir` (`app/api/ouvir/route.ts`), lista gerada em
  `lib/ouvir/idiomas.ts`, player compartilhado em `lib/ouvir/leitor.ts`.
  Sem credencial, cai na voz do navegador (degradação honesta).
- ⏸️ **Adiado/sem uso:** Codespaces e alternativas (GitLab/chinês) — o par
  `home-pc` + VM cobre; `controlepopular.com` (livre, mas registrar é pago
  ~US$ 10/ano); as ofertas condicionais (MongoDB, Astra, CARTO, Camber, Visme).
- **Re-scan de segurança** após o deploy (ver `PLANO-SEGURANCA-TRIVY-2026-10.md`).

## Régua

- Erro em produção deixa de depender de alguém notar: aparece no painel do
  New Relic, com rota e horário.
- Nenhuma chave secreta entra no repositório; o agente só sobe com a env do
  painel.
- Toda oferta tem data de expiração anotada; revisar a cada ciclo.
