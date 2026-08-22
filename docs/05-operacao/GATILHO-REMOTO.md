# Gatilho remoto — sincronizar e publicar de outra máquina

> **Tipo:** OPERACAO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [OPERACAO.md](OPERACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** gatilho remoto, tailscale, telegram, sincronizacao, publicacao

## Sumário

- [Propósito](#propósito)
- [Os três arquivos](#os-três-arquivos)
- [O que ele NUNCA faz sozinho](#o-que-ele-nunca-faz-sozinho)
- [Modelo de segurança](#modelo-de-segurança)
- [Configurar](#configurar)
- [Acionar](#acionar)
- [Checagem periódica (06:10 e 20:00)](#checagem-periódica-0610-e-2000)
- [Painel de edição, acessível do tailnet inteiro](#painel-de-edição-acessível-do-tailnet-inteiro)
- [Limitações conhecidas](#limitações-conhecidas)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

> Escrito em 2026-08-16. Fecha um buraco específico: `scripts/rotina-local.mts`
> builda e publica o que **já está** no checkout do `home-pc`, mas não faz
> nada de git — quem decide quando integrar commit novo (do
> `desktop-fefpddp`, ou de uma edição feita no painel) é sempre uma sessão
> manual aqui. Isto dá dois jeitos de pedir "sincronize e publique" **sem**
> abrir sessão no `home-pc`: um HTTP dentro do tailnet, e o mesmo bot do
> Telegram que hoje só manda alerta do canário.

## Os três arquivos

| arquivo | o que faz |
|---|---|
| `scripts/sincronizar-e-publicar.mts` | git fetch → merge (só se limpo) → guarda de dado pessoal → push → `rotina-local.mts --so-build`. Roda sozinho por linha de comando também. |
| `scripts/gatilho-remoto.mts` | processo que fica de pé, escutando HTTP e/ou Telegram, e chama o de cima quando autenticado |
| `scripts/gatilho-remoto.cmd` | invólucro para o Agendador de Tarefas, mesmo padrão de `rotina-local.cmd` |

## O que ele NUNCA faz sozinho

- **Não publica com árvore suja.** Mudança não commitada na hora do pedido
  aborta antes de tocar em qualquer coisa.
- **Não resolve conflito de merge.** Só integra se `git merge-tree` mostrar
  merge limpo; senão aborta e diz quais arquivos colidiriam — a mesma
  disciplina usada nas sessões manuais de hoje.
- **Não força deploy.** Chama `rotina-local.mts --so-build`, sem
  `--forcar-deploy`: a trava de contagem de páginas e a de tamanho de asset
  (`docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md`) continuam valendo. Se alguma
  acender, o gatilho reporta e para — forçar é decisão de quem está vendo o
  motivo.
- **Não roda o ETL de novo.** É para código/conteúdo novo, não para
  recoletar; o ETL tem a própria cadência em `etl-*.yml`.

## Modelo de segurança

1. **HTTP só escuta no IP do Tailscale** (`tailscale ip -4`, hoje
   `100.91.10.1`), nunca em `0.0.0.0`. Dispositivo fora do tailnet não
   alcança a porta mesmo sabendo o número.
2. **Token próprio** (`GATILHO_TOKEN`), comparado por hash com
   `crypto.timingSafeEqual` — nunca `PAINEL_TOKEN` nem `ADMIN_TOKEN` (cada um
   já tem seu raio de vazamento, ver `docs/_historico/PAINEL-EDICAO-COMO-USAR.md`).
3. **Telegram só aceita o `TELEGRAM_CHAT_ID` já configurado** — mensagem de
   qualquer outro chat é registrada em log e ignorada. Achar o bot no
   Telegram não basta.
4. **Fail-closed**: sem `GATILHO_TOKEN` o canal HTTP não sobe; sem
   `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` o canal Telegram não sobe. Nunca
   "libera tudo porque não configuraram".
5. **Não é SSH do Tailscale.** `tailscale up --ssh` resolveria isto num
   comando, mas é mudança de configuração de segurança da máquina — decisão
   de quem senta na frente dela, não deste documento. Se um dia for essa a
   escolha:
   ```powershell
   tailscale set --ssh
   ```

## Configurar

1. Copie o modelo e preencha:
   ```powershell
   Copy-Item scripts\.env.exemplo scripts\.env
   ```
   - `GATILHO_TOKEN`: gere um valor aleatório —
     ```powershell
     node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
     ```
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`: os mesmos já usados em
     `.github/workflows/canario-limites.yml` (secrets do GitHub) — copie de
     lá, ou do chat que já recebe os alertas do canário.

   `scripts/.env` é gitignored pelo padrão `.env` do `.gitignore` raiz — não
   precisa (e não deve) ser commitado.

2. Registre a tarefa do Agendador (**rode você mesmo** — registrar uma
   tarefa que pode disparar `git push` e deploy é decisão sua, não algo para
   automatizar sem olhar):
   ```powershell
   $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "C:\DevCoder\controle-popular\scripts\gatilho-remoto.cmd"' -WorkingDirectory "C:\DevCoder\controle-popular"
   $trigger = New-ScheduledTaskTrigger -AtLogOn -User "Home"
   $settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 0) -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
   $principal = New-ScheduledTaskPrincipal -UserId "Home" -LogonType Interactive -RunLevel Limited
   Register-ScheduledTask -TaskName "Controle Popular - gatilho remoto" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Escuta HTTP (dentro do tailnet) e Telegram para sincronizar e publicar remotamente."
   ```
   `RestartCount 999` + `RestartInterval 1 minuto`: diferente da rotina
   diária (que roda uma vez e termina), este processo **não termina
   sozinho** — fica escutando. Se cair (erro de rede, reinício do Node), o
   Agendador sobe de novo sem precisar ninguém notar.

3. Suba agora, sem esperar o próximo logon:
   ```powershell
   Start-ScheduledTask -TaskName "Controle Popular - gatilho remoto"
   ```

4. Confira que subiu:
   ```powershell
   Get-Content C:\DevCoder\controle-popular\logs\gatilho-remoto.log -Tail 5
   ```
   Deve aparecer `HTTP escutando em http://100.91.10.1:3029/...` e/ou
   `Telegram: long-poll iniciado.`, conforme o que foi preenchido no
   `scripts/.env`.

## Acionar

### Do desktop, via Tailscale (HTTP)

```bash
curl -X POST http://100.91.10.1:3029/sincronizar \
  -H "Authorization: Bearer <o GATILHO_TOKEN de scripts/.env>"
```

Resposta imediata (`202`) só confirma que começou — o resultado de verdade
está em `logs/gatilho-remoto.log` no `home-pc`. `401` é token errado; `409`
é "já tem uma sincronização rodando".

### Pelo Telegram

Mande `/sincronizar` para o bot, do chat já configurado em
`TELEGRAM_CHAT_ID`. Ele responde "sincronizando..." na hora e manda o
resultado (✅ ou ❌, com o motivo se abortou) quando termina. `/status` diz
se há uma sincronização em andamento.

## Checagem periódica (06:10 e 20:00)

Além dos dois gatilhos sob demanda, `sincronizar-e-publicar.mts` agora sai
rápido quando **não há novidade nenhuma** — nem commit novo no `origin`, nem
commit local para enviar (`etapa: "sem-novidades"`, sem tocar em build nem
deploy, que é a parte cara: ~7 min de build + o deploy). Isso é o que torna
seguro rodá-lo várias vezes ao dia sem custo quando ninguém mexeu em nada.

**Por que 06:10, não 06:00**: a tarefa `Controle Popular - rotina diaria` já
roda às 06:00 (ETL + build + deploy, sem git — ela nunca puxa `origin/main`,
só builda o que já está no checkout). Rodar OUTRO processo de git+build no
mesmo minuto arrisca as duas mexerem no repositório ao mesmo tempo. Dez
minutos de folga é decisão minha, não pedida — mude se quiser outro horário.

```powershell
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "cd /d C:\DevCoder\controle-popular && npx tsx scripts\sincronizar-e-publicar.mts"' -WorkingDirectory "C:\DevCoder\controle-popular"
$trigger1 = New-ScheduledTaskTrigger -Daily -At 6:10am
$trigger2 = New-ScheduledTaskTrigger -Daily -At 8:00pm
$principal = New-ScheduledTaskPrincipal -UserId "Home" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName "Controle Popular - checar novidades" -Action $action -Trigger @($trigger1, $trigger2) -Principal $principal -Description "Duas vezes ao dia: git fetch, e só sincroniza+publica se houver commit novo. Ver docs/GATILHO-REMOTO.md."
```

Resultado de cada rodada em `logs/gatilho-remoto.log`? Não — esta tarefa roda
`sincronizar-e-publicar.mts` diretamente (não passa pelo `gatilho-remoto.mts`
de pé), então o resultado vai para a saída padrão da tarefa. Para conferir:

```powershell
Get-ScheduledTaskInfo -TaskName "Controle Popular - checar novidades"
```

`LastTaskResult = 0` publicou OU não havia novidade (os dois são sucesso);
qualquer outro valor é abortado — o motivo é o mesmo texto que
`sincronizar-e-publicar.mts` imprime, mas o Agendador não guarda stdout por
padrão. Se quiser log persistente desta tarefa também, troque o `Argument`
acima para redirecionar: `... >> logs\checar-novidades.log 2>&1`.

## Painel de edição, acessível do tailnet inteiro

`docs/_historico/PAINEL-EDICAO-COMO-USAR.md` já sobe o painel com
`PAINEL_LOCAL=1 npx next dev --port 3028` — e **o `next dev` desta versão já
escuta em `0.0.0.0` por padrão** (`npx next dev --help` confirma). Ou seja:
**nenhuma mudança de código é necessária.** Rodando o mesmo comando de sempre
no `desktop-fefpddp`, o painel já fica alcançável de qualquer dispositivo do
tailnet em `http://100.126.160.109:3028/painel` — sem passar pela internet,
sem tocar na garantia estrutural (`*.local.tsx` só entra em `pageExtensions`
com `PAINEL_LOCAL=1` **e** `NODE_ENV !== "production"`; `next build` nunca
tem as duas).

No primeiro `next dev` bindando fora de `localhost`, o Windows pode mostrar
um prompt de firewall no desktop — é normal, é o SO perguntando se aceita a
conexão de entrada; aceitar para "Rede privada" basta (o tailnet aparece como
esse tipo de rede).

**O que continua igual**: `PAINEL_TOKEN` continua exigido (401 sem ele), e o
painel continua nunca indo para produção — isto só muda QUEM alcança o
`localhost:3028` do desktop, não o que o painel aceita sem token.

## Limitações conhecidas

- A tarefa roda como o usuário `Home`, gatilho `AtLogOn` — se ninguém tiver
  sessão aberta no `home-pc`, o processo não sobe. `LogonType: ServiceAccount`
  com credencial salva resolveria isso, mas é escopo maior (senha armazenada
  no Agendador) e fica de fora de propósito, por ora.
- Uma sincronização por vez — um segundo pedido durante uma em andamento só
  recebe aviso, não entra em fila.
- O long-poll do Telegram não usa webhook (não precisa de porta pública nem
  HTTPS), mas significa que a resposta a um comando pode demorar até a
  próxima rodada de `getUpdates` — na prática, quase imediato.
