# PLANO — Cloudflare Tunnel como acesso remoto ao home-pc

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [GATILHO-REMOTO.md](../../05-operacao/GATILHO-REMOTO.md), [OPERACAO.md](../../05-operacao/OPERACAO.md), [ESTADO.md](../../02-estado/ESTADO.md)
> **Palavras-chave:** cloudflare, tunnel, cloudflared, home-pc, deploy, infraestrutura

## Sumário

- [Propósito](#propósito)
- [Por que contingência, não fila](#por-que-contingência-não-fila)
- [Arquitetura proposta](#arquitetura-proposta)
- [Segurança — pré-requisito inegociável](#segurança--pré-requisito-inegociável)
- [Passos de execução](#passos-de-execução)
- [Custos](#custos)
- [Riscos e mitigações](#riscos-e-mitigações)
- [Rollback](#rollback)
- [Critério de aceite](#critério-de-aceite)

## Propósito

Hoje o `home-pc` publica o portal e expõe dois canais de controle:

1. **Telegram** (`gatilho-remoto.mts`, ouvinte permanente desde 25/08) — `/status` e `/sincronizar`;
2. **HTTP no Tailscale** (`http://100.91.10.1:3029/sincronizar`) — só dentro do tailnet;
3. Painel de edição — `next dev` no home-pc, acessível pelo tailnet.

O Cloudflare Tunnel entraria para **não depender do Tailscale** em nenhuma dessas
três frentes: o mesmo túnel criptografado de saída (sem porta aberta, sem
firewall) publicaria o gatilho HTTP e o painel de edição sob o domínio que a
zona `controlepopular.com.br` já tem na Cloudflare — acessível de qualquer
máquina do dono, com autenticação por e-mail na borda.

## Por que contingência, não fila

O Telegram já cobre o caso de uso principal (disparar sincronização/publicação
de qualquer lugar). O Tunnel agrega valor em três cenários ainda não vivos:

- abrir o **painel de edição** fora de casa (ex.: revisar uma entrega no celular);
- máquinas novas sem Tailscale instalado;
- diagnóstico quando o tailnet estiver instável.

Executar antes disso seria superfície nova de exposição sem demanda medida.

## Arquitetura proposta

```
internet ──▶ Cloudflare Edge ──▶ cloudflared (serviço no home-pc) ──▶ localhost
                                   │
   gatilho.controlepopular.com.br ─┼─▶ http://localhost:3029   (gatilho-remoto)
   painel.controlepopular.com.br ──┘   http://localhost:3000     (next dev, painel)
```

- `cloudflared` roda como **serviço do Windows** (inicia com o PC, reconecta sozinho).
- Tráfego é **somente de saída** do home-pc — nada de abrir porta no roteador.
- DNS/CNAME e certificado TLS são provisionados pela própria Cloudflare.

## Segurança — pré-requisito inegociável

Nenhum hostname vai ao ar **antes** de existir política de **Cloudflare Access**
(Zero Trust, plano Free cobre até 50 usuários):

| Hostname | Política Access | Defesa adicional |
|---|---|---|
| `gatilho.*` | E-mail do dono (OTP) | Bearer `GATILHO_TOKEN` já exigido pelo próprio endpoint |
| `painel.*` | E-mail do dono (OTP) | `PAINEL_TOKEN` + painel só existe em `next dev` (fail-closed) |

Regra do projeto que continua valendo: **credenciais nunca vão ao repo** — o
token do túnel fica no serviço do Windows; os segredos existentes ficam nos
`.env` locais já ignorados pelo git.

## Passos de execução

1. Instalar `cloudflared` no home-pc (`winget install Cloudflare.cloudflared`).
2. Autenticar: `cloudflared tunnel login` (abre o painel; escolher a zona).
3. Criar o túnel: `cloudflared tunnel create home-pc` → anotar o UUID.
4. Rotas: `cloudflared tunnel route dns home-pc gatilho.controlepopular.com.br`
   (e idem para `painel.`), ou declarar no `config.yml`.
5. `config.yml` com dois ingress (3029 e 3000) + regra final 404.
6. Instalar como serviço: `cloudflared service install`.
7. **Antes do primeiro acesso público:** criar as duas políticas no Zero Trust
   (Access → Applications → Self-hosted) restritas ao e-mail do dono.
8. Teste de aceite (abaixo).

## Custos

US$ 0. Túnel e Access (até 50 usuários) são Free. Consumo de banda do túnel é
desprezível perto dos assets já servidos pelo plano Free do Workers.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Painel de edição exposto sem querer | Access na frente + painel fail-closed (`PAINEL_TOKEN`); monitorar logs do Access |
| `/sincronizar` acionado por terceiro | Access + Bearer token; gatilho nunca publica com árvore suja nem força deploy |
| `cloudflared` cair silenciosamente | Serviço com restart automático; `/status` do Telegram continua como canal independente |
| Dependência de fornecedor único (Cloudflare já hospeda o site) | Documentado aqui: rollback é apagar túnel + registros DNS |

## Rollback

`cloudflared tunnel delete home-pc -f` + remover os dois CNAME na zona. Nenhum
estado local além do serviço instalado.

## Critério de aceite

Do lado de fora do tailnet (ex.: 4G do celular):

- [x] `https://controlepopular.com.br/` responde 200 servido pelo home-pc via túnel.
- [x] `https://controlepopular.com.br/betim/painel-do-cidadao` e outras rotas respondem 200.
- [ ] `https://painel.controlepopular.com.br` autenticar por OTP de e-mail e ver o painel.
- [ ] Disparar `/sincronizar` via `curl -H "Authorization: Bearer $GATILHO_TOKEN" https://gatilho.controlepopular.com.br/sincronizar` e receber a resposta assíncrona no Telegram.
- [x] POST `/api/pageview` escreve no D1 via REST fallback.

## Execução — 26/08/2026 ✅

| Passo | Resultado |
|---|---|
| cloudflared instalado | `C:\DevCoder\tools\cloudflared.exe` (2026.8.2) — winget travou; download direto do GitHub com retomada |
| Login | cert.pem JÁ existia (máquina já autorizada) — mas na conta da zona errada (ver desvios) |
| Túnel criado | `controle-popular` (`e0d8ef85-e1c2-4958-b503-d7cc71556876`) |
| config.yml | `C:\Users\Home\.cloudflared\config.yml`, ingress validado |
| Access apps | gatilho + painel, e-mail do dono, OTP — **criadas pelo dono antes de rotear DNS** (gate respeitado) |
| CNAMEs | criados na zona correta após re-login (desvio 1) |
| Serviço Windows | Running/Automatic — exigiu `--config` explícito no binPath (desvio 2) |
| Conexões edge | 2× ativas (`2xcnf01, 2xgig09`) |

**Testes de borda:** `painel.*` → HTTP 302 para OTP ✅ · `gatilho.*` sem token →
página *Sign in · Cloudflare Access* ✅ (Access intercepta antes do Bearer).
Fluxo completo `/sincronizar` autenticado fica para a próxima janela de deploy
(Worker está bloqueado por tamanho — fila #30 — e a árvore precisa limpa).

## Fase 2 — domínio principal no ar via túnel (26/08/2026) ✅

Após o Worker Free bater no teto de 3 MiB gzip (erro 10027) mesmo com ~2 MB de dado externalizado, o dono decidiu migrar a origem do tráfego público para o túnel. O Worker continua deployado como fallback técnico, mas sem custom domains ativas.

| Passo | Resultado |
|---|---|
| `next start -p 3000` | rodando como processo hidden no home-pc (PID confirmado) |
| Túnel | `controle-popular` conectado com 2 conexões edge ativas |
| DNS | `controlepopular.com.br` e `www.controlepopular.com.br` roteados para o túnel |
| Smoke local | `/`, `/betim/painel-do-cidadao`, `/paraopeba/auditoria` → HTTP 200, conteúdo não-vazio |
| Smoke público completo | `/`, `/betim/painel-do-cidadao`, `/betim/prefeitura/contratos`, `/betim/legislacao`, `/betim/terras/cruzamentos`, `/empresas`, `/paraopeba/auditoria`, `/ambiental/convenios`, `/judiciario/inspecoes`, `/ambiental/decisoes-lai`, `/ambiental/tac`, `/assistente` → HTTP 200, conteúdo não-vazio |
| Escrita D1 via REST | POST `/api/pageview?path=/` → `{"ok":true}`; GET `/api/pageview?limit=5` retorna ranking |

### Próximas ações

- Monitorar estabilidade do `next start` e do serviço `cloudflared`.
- Quando o limite do Worker Free for resolvido (plano pago ou nova redução de bundle), reavaliar retorno ao deploy direto no Worker.

### Desvios e aprendizados

1. **Conta/zona do cert**: o `cert.pem` inicial era da conta cuja zona
   `fozjuris.com.br` existe, então o primeiro `route dns` criou os CNAMEs
   **dentro dessa zona** (`gatilho.controlepopular.com.br.fozjuris.com.br`) e
   o hostname público não resolvia. Correção: novo `tunnel login` escolhendo a
   conta dona de `controlepopular.com.br` → CNAMEs corretos.
   **Pendência cosmética:** apagar o par de registros órfãos na zona
   `fozjuris.com.br`.
2. **Serviço sem ingress**: `service install` roda como LocalSystem e procura
   config em `C:\Windows\System32\config\systemprofile\.cloudflared\` — subia
   sem túnel nenhum. Correção: `sc config cloudflared binPath= "... --config
   C:\Users\Home\.cloudflared\config.yml tunnel run"`.
3. **Console visível recebeu Ctrl+C**: primeira tentativa de deixar o ouvinte
   rodando via WMI abriu console na área de trabalho e morreu quando fechado.
   Padrão adotado para processos longos do canário: `Start-Process -WindowStyle
   Hidden` + stdin de `NUL`.
4. **getUpdates em conflito**: três ouvintes duplicados disputando o mesmo bot
   devolviam erro silencioso. Regra: matar toda a cadeia (cmd+npx+tsx+node)
   antes de relançar — o contador de processos node conta a CADEIA inteira,
   não ouvintes.
