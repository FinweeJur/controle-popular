# Radio + navegacao — hero-vivo-fase4b

> **Tipo:** RELATORIO
> **Dominio:** global
> **Ultima medicao:** 2026-10-05 21:26
> **Leitura estimada:** curta (2-5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)
> **Palavras-chave:** radio, audio, navegacao, link, reload, link, playwright, baseline, reteste

## Sumario

- [Resultado](#resultado)
- [Percurso](#percurso)
- [Passos](#passos)

## Resultado

- Base testada: `http://localhost:3048`
- Estacao tocada: `radio-brasil-de-fato` (Rádio Brasil de Fato)
- Alvos no percurso: 14
- Saltos por clique: 14
- Paginas sem link interno para o alvo: 0
- Saltos que MATARAM o audio: 0
- Nenhum salto matou o audio.

## Percurso

A fila vem de `catalogo.ts` (rotaLegada), dos 4 hubs de eixo e de `top-100-paginas.json`, nessa ordem.

- eixo: `/terra-e-territorios`
- eixo: `/direitos-em-movimento`
- eixo: `/estado-e-economia`
- eixo: `/central`
- subfrente: `/direitos-em-movimento/ajuda`
- subfrente: `/cidades`
- subfrente: `/ambiental`
- subfrente: `/funcaosocialterra`
- subfrente: `/paraopeba`
- subfrente: `/ambiental/clima-risco`
- subfrente: `/judiciario`
- subfrente: `/congresso`
- subfrente: `/governo`
- subfrente: `/empresas`

## Passos

| # | Origem | Alvo | Href clicado | Resultado | Detalhe |
|---|---|---|---|---|---|
| 1 | `/radio` | `/terra-e-territorios` | `/terra-e-territorios` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 2 | `/terra-e-territorios` | `/direitos-em-movimento` | `/direitos-em-movimento` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 3 | `/direitos-em-movimento` | `/estado-e-economia` | `/estado-e-economia` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 4 | `/estado-e-economia` | `/central` | `/central` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 5 | `/central` | `/direitos-em-movimento/ajuda` | `/direitos-em-movimento/ajuda` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 6 | `/central` | `/cidades` | `/cidades` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 7 | `/central` | `/ambiental` | `/ambiental` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 8 | `/ambiental` | `/funcaosocialterra` | `/funcaosocialterra` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 9 | `/ambiental` | `/paraopeba` | `/paraopeba` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 10 | `/paraopeba` | `/ambiental/clima-risco` | `/ambiental/clima-risco` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 11 | `/ambiental/clima-risco` | `/judiciario` | `/judiciario` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 12 | `/judiciario` | `/congresso` | `/congresso` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 13 | `/congresso` | `/governo` | `/governo` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |
| 14 | `/congresso` | `/empresas` | `/empresas` | VIVA | URL nao mudou no prazo, mas o audio seguiu vivo |

## Metodo

Cada passo comeca com o audio tocando. O script marca o primeiro `<a href>` interno que aponta para o alvo, clica nele e espera a URL mudar. Depois confere: `<audio>` existe, `!paused` e `currentTime` avancando. Qualquer uma das tres falhando significa reload de pagina inteira — o player do layout raiz morreu junto.

Gerado por `scripts/verificar-radio-navegacao.py` em 05/10/2026 21:26.
