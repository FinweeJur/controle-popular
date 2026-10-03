# Radio + navegacao — baseline

> **Tipo:** RELATORIO
> **Dominio:** global
> **Ultima medicao:** 2026-10-03 15:45
> **Leitura estimada:** curta (2-5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)
> **Palavras-chave:** radio, audio, navegacao, link, reload, link, playwright, baseline, reteste

## Sumario

- [Resultado](#resultado)
- [Percurso](#percurso)
- [Passos](#passos)

## Resultado

- Base testada: `https://www.controlepopular.com.br`
- Estacao tocada: `radio-brasil-de-fato` (Rádio Brasil de Fato)
- Alvos no percurso: 100
- Saltos por clique: 7
- Paginas sem link interno para o alvo: 0
- Saltos que MATARAM o audio: 1
- Primeiro culpado: `/direitos-em-movimento/ajuda` -> `/ambiental` (alvo `/ambiental`)

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
- subfrente: `/dados/comunicabr`
- subfrente: `/busca`
- subfrente: `/laboratorio`
- subfrente: `/editais`
- subfrente: `/biblioteca`
- subfrente: `/noticias`
- subfrente: `/tecnologia`
- subfrente: `/documentacao`
- subfrente: `/alertas`
- subfrente: `/estudos-rurais`
- subfrente: `/imprensa`
- subfrente: `/sobre`
- subfrente: `/termos`
- top100: `/funcaosocialterra/mapa`
- top100: `/funcaosocialterra/alertas`
- top100: `/cidades/mg`
- top100: `/betim`
- top100: `/bh`
- top100: `/sp`
- top100: `/brumadinho`
- top100: `/mariana`
- top100: `/aracuai`
- top100: `/diamantina`
- top100: `/itinga`
- top100: `/governador-valadares`
- top100: `/uberlandia`
- top100: `/juiz-de-fora`
- top100: `/terra-e-territorios/vales`
- top100: `/terra-e-territorios/nossos-rios`
- top100: `/terra-e-territorios/nossas-serras`
- top100: `/paraopeba/execucao`
- top100: `/paraopeba/biblioteca`
- top100: `/paraopeba/linha-do-tempo`
- top100: `/ambiental/mariana`
- top100: `/ambiental/barragens`
- top100: `/ambiental/barragens/descaracterizacao`
- top100: `/ambiental/licenciamento`
- top100: `/ambiental/copam`
- top100: `/ambiental/tac`
- top100: `/ambiental/car`
- top100: `/mineracao/cavas`
- top100: `/canada`
- top100: `/america-latina`
- top100: `/memoria`
- top100: `/ambiental/legislacao`
- top100: `/direitos-em-movimento/saude-publica`
- top100: `/direitos-em-movimento/educacao`
- top100: `/direitos-em-movimento/trabalho-e-renda`
- top100: `/direitos-em-movimento/conselhos`
- top100: `/direitos-em-movimento/informacao`
- top100: `/direitos-em-movimento/denuncia`
- top100: `/ambiental/decisoes-lai`
- top100: `/ambiental/direitos-humanos`
- top100: `/ambiental/direito-critico`
- top100: `/ambiental/conselhos`
- top100: `/ambiental/capacidade-institucional`
- top100: `/ambiental/ecossistema`
- top100: `/ambiental/patrimonio-cultural`
- top100: `/recursos/estados`
- top100: `/estado-e-economia/orcamento`
- top100: `/judiciario/instituicoes`
- top100: `/judiciario/contatos`
- top100: `/assembleias`
- top100: `/ambiental/contratos`
- top100: `/judiciario/tribunais`
- top100: `/judiciario/sirenejud`
- top100: `/judiciario/recomendacoes`
- top100: `/congresso/proposicoes`
- top100: `/congresso/votacoes`
- top100: `/congresso/mg`
- top100: `/ambiental/convenios`
- top100: `/ambiental/ppp`
- top100: `/empresas/fortunas`
- top100: `/empresas/conglomerados`
- top100: `/empresas/executivos`
- top100: `/eua`
- top100: `/europa`
- top100: `/desclassificados`
- top100: `/`
- top100: `/laboratorio/arvore`
- top100: `/assistente`
- top100: `/indice`
- top100: `/radio`
- top100: `/api`
- top100: `/dados/populares`
- top100: `/internacional`

## Passos

| # | Origem | Alvo | Href clicado | Resultado | Detalhe |
|---|---|---|---|---|---|
| 1 | `/radio` | `/terra-e-territorios` | `/terra-e-territorios` | ERRO-NAV | a URL nao mudou |
| 2 | `/radio` | `/direitos-em-movimento` | `/direitos-em-movimento` | ERRO-NAV | a URL nao mudou |
| 3 | `/terra-e-territorios` | `/estado-e-economia` | `/estado-e-economia` | ERRO-NAV | a URL nao mudou |
| 4 | `/direitos-em-movimento` | `/central` | `/central` | ERRO-NAV | a URL nao mudou |
| 5 | `/estado-e-economia` | `/direitos-em-movimento/ajuda` | `/direitos-em-movimento/ajuda` | ERRO-NAV | a URL nao mudou |
| 6 | `/central` | `/cidades` | `/cidades` | ERRO-NAV | a URL nao mudou |
| 7 | `/direitos-em-movimento/ajuda` | `/ambiental` | `/ambiental` | MORTA | novo <audio> nasceu pausado (reload) |

## Metodo

Cada passo comeca com o audio tocando. O script marca o primeiro `<a href>` interno que aponta para o alvo, clica nele e espera a URL mudar. Depois confere: `<audio>` existe, `!paused` e `currentTime` avancando. Qualquer uma das tres falhando significa reload de pagina inteira — o player do layout raiz morreu junto.

Gerado por `scripts/verificar-radio-navegacao.py` em 03/10/2026 15:45.
