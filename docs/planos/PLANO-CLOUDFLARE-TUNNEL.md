# PLANO — Cloudflare Tunnel como acesso remoto ao home-pc

> **Tipo:** PLANO (contingência — executar só quando houver necessidade real)
> **Domínio:** global
> **Criado:** 2026-08-25, na esteira do bloqueio de deploy (fila #30 do ESTADO.md)
> **Relacionados:** [GATILHO-REMOTO.md](../05-operacao/GATILHO-REMOTO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [docs/planos/deploy-github-pages.md](deploy-github-pages.md)

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

Do lado de fora do tailnet (ex.: 4G do celular): abrir `painel.controlepopular.com.br`,
autenticar por OTP de e-mail e ver o painel; disparar `/sincronizar` via
`curl -H "Authorization: Bearer $GATILHO_TOKEN" https://gatilho.controlepopular.com.br/sincronizar`
e receber a resposta assíncrona no Telegram.
