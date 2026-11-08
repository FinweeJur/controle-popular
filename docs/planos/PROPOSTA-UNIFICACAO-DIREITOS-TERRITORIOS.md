# Proposta — unificar direitos, territórios, barragens e atores

> **Tipo:** PLANO
> **Domínio:** arquitetura da informação do portal
> **Última medição:** 2026-11-08
> **Leitura estimada:** media (10-15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md](PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md)
> **Palavras-chave:** unificação, arquitetura da informação, direitos, barragens, atores, redirect, canonicidade

## Sumário

- [Diagnóstico medido](#diagnóstico-medido)
- [Os três sintomas](#os-três-sintomas)
- [Princípio](#princípio)
- [Arquitetura proposta](#arquitetura-proposta)
- [Mapa de migração](#mapa-de-migração)
- [Canonicidade do número](#canonicidade-do-número)
- [O que não se mexe](#o-que-não-se-mexe)
- [Fases](#fases)
- [Riscos](#riscos)
- [Decisões pendentes](#decisões-pendentes)

## Diagnóstico medido

Contagem de rotas com `page.tsx` no app (08/11/2026). O portal tem **348 páginas**;
as frentes abaixo somam **76** e se sobrepõem.

| Assunto | Rotas hoje | Páginas | Exemplo de sobreposição |
|---|---|---:|---|
| Direitos | `/direitos-em-movimento`, `/direitos-globais`, `/direitos-comparados`, `/ambiental/direitos-humanos`, `/ambiental/direito-critico` | 25 | saúde aparece em três lugares |
| Brumadinho (Paraopeba) | `/paraopeba/*` | 18 | clipping, notícias e notícias-vale |
| Rio Doce | `/riodoce/*` | 3 | hub, índice, processos |
| Itatiaiuçu | só em `/jurisprudencia` | 0 | sem porta própria |
| Barragens | `/ambiental/barragens*`, `/ambiental/barragens-globais`, `/mineracao/*` | 8 | mesma barragem em duas rotas |
| Atores | `/instituicoes`, `/empresas/*`, `/estado-e-economia`, `/governo` | 13 | Vale em empresas e em estado-e-economia |
| Movimentos | `/memoria`, parte de `/direitos-em-movimento` | 2 | MAB em memória e em direitos |
| Internacional | `/internacional`, `/europa`, `/eua`, `/canada`, `/america-latina`, `/transparencia-internacional`, `/direitos-globais` | 20 | BHP em três rotas |

## Os três sintomas

1. **O leitor não sabe onde está.** Quem procura "saúde" acha `/direitos-em-movimento/saude-publica`,
   `/direitos-globais` e `/ambiental/direitos-humanos` — sem saber qual é a porta.
2. **O número mora em dois lugares.** Barragem, empresa e caso aparecem em rotas
   diferentes com contagens próprias, atualizadas em datas diferentes. Quando
   divergem, o portal se contradiz.
3. **A energia some.** Cada hub novo custa página, dados e manutenção; cinco hubs
   do mesmo assunto custam cinco vezes e entregam menos.

## Princípio

> **Um assunto, uma porta canônica. Hub agrega; não duplica.**

Três consequências práticas:

- cada número tem **uma página dona**; as outras linkam para ela;
- hub novo só nasce quando **absorve** rotas existentes, nunca ao lado delas;
- URL antiga que sai ganha **redirect 308** e a página nova diz o que mudou.

## Arquitetura proposta

Cinco portas, cada uma com um verbo:

```
/casos            → O QUE aconteceu (Rio Doce, Brumadinho, Itatiaiuçu)
/direitos         → O QUE foi violado (saúde, moradia, água, trabalho, educação…)
/barragens        → COMO o risco é medido (SIGBM, descaracterização, mundo)
/atores           → QUEM age (popular, estatal, empresarial, internacional)
/movimentos       → QUEM resiste (memória, MAB, ATIs)
```

### `/casos` — o território do desastre

```
/casos                        índice dos três casos, com número e estado de coleta
/casos/riodoce                hub do Fundão (absorve /riodoce)
/casos/riodoce/processos      (absorve /riodoce/processos)
/casos/brumadinho             hub do Córrego do Feijão (absorve /paraopeba)
/casos/brumadinho/linha-do-tempo
/casos/brumadinho/auxilio
/casos/brumadinho/execucao
/casos/brumadinho/documentos
/casos/brumadinho/clipping
/casos/itatiaiaucu            hub novo (7 acórdãos, Serra Azul)
```

Regra: `/paraopeba` continua existindo como **nome de bacia**, mas o hub de caso
passa a ser `/casos/brumadinho`; `/paraopeba` redireciona e mantém só as páginas
de bacia (rio, municípios).

### `/direitos` — o direito violado

```
/direitos                     índice por eixo, com contagem por caso
/direitos/saude               (absorve /direitos-em-movimento/saude-publica)
/direitos/moradia
/direitos/agua-saneamento
/direitos/trabalho-e-renda
/direitos/educacao
/direitos/seguranca-publica
/direitos/informacao
/direitos/globais             (absorve /direitos-globais/*)
/direitos/comparados          (absorve /direitos-comparados)
```

Cada eixo diz **em quais casos** o direito aparece e **quantos acórdãos** o
citam — puxando do catálogo da jurimetria, não de texto novo. É o que liga
direito a caso sem duplicar página.

### `/barragens` — o risco medido

```
/barragens                    índice: quantas, onde, em que nível
/barragens/sigbm              (absorve /ambiental/barragens/sigbm)
/barragens/descaracterizacao
/barragens/mundo              (absorve /ambiental/barragens-globais)
/barragens/mineracao          (absorve /mineracao)
```

### `/atores` — quem age

```
/atores                       índice por classe: popular, estatal, empresarial, internacional
/atores/popular               MAB, ATIs (AEDAS, NACAB, Guaicuy), comissões
/atores/estatal               MPMG, DPMG, MPF, AGU, AGE, prefeituras
/atores/empresarial           Vale, Samarco, BHP, Renova, TÜV SÜD
/atores/judiciario            TJMG, TJES, STF, STJ
/atores/[slug]                ficha do ator (absorve /instituicoes/[sigla] e /empresas/[slug])
```

A mesma classificação que já existe nos marcos da linha do tempo
(`ROTULO_ATOR`) vale aqui — um vocabulário só para o portal inteiro.

### `/movimentos` — memória e resistência

```
/movimentos                   (absorve /memoria)
/movimentos/[slug]            verbete ou luta
```

## Mapa de migração

| Rota atual | Destino | Ação |
|---|---|---|
| `/riodoce` | `/casos/riodoce` | 308 + página nova absorve |
| `/riodoce/processos` | `/casos/riodoce/processos` | 308 |
| `/paraopeba` | `/casos/brumadinho` | 308 no hub; bacia fica em `/paraopeba/bacia` |
| `/paraopeba/linha-do-tempo` | `/casos/brumadinho/linha-do-tempo` | 308 |
| `/paraopeba/auxilio`, `/execucao`, `/documentos`, `/clipping` | `/casos/brumadinho/*` | 308 |
| `/direitos-em-movimento/*` | `/direitos/*` | 308 por eixo |
| `/direitos-globais/*` | `/direitos/globais` | 308 |
| `/direitos-comparados` | `/direitos/comparados` | 308 |
| `/ambiental/direitos-humanos`, `/ambiental/direito-critico` | `/direitos` (seções) | 308 |
| `/ambiental/barragens*`, `/ambiental/barragens-globais`, `/mineracao/*` | `/barragens/*` | 308 |
| `/instituicoes`, `/instituicoes/[sigla]` | `/atores/*` | 308 |
| `/empresas`, `/empresas/[slug]` | `/atores/empresarial` e `/atores/[slug]` | 308 |
| `/memoria` | `/movimentos` | 308 |
| `/estado-e-economia`, `/governo` | `/atores/estatal` (o que for sobre órgão) | avaliar caso a caso |

Nada de redirect em massa de uma vez: cada linha vira um commit com o redirect, a
página nova e a atualização dos links internos.

## Canonicidade do número

Regra editorial que a migração precisa respeitar:

1. O número tem **dono**: ex. valor do auxílio mora em `/casos/brumadinho/auxilio`.
2. Quem cita o número **linka** para o dono com rótulo curto ("ver o auxílio").
3. Página que precisa mostrar o número **puxa do mesmo dado** — nunca digita de novo.
4. Divergência entre páginas é bug, não estilo.

## O que não se mexe

- `/jurisprudencia` — transversal, já cobre três casos e quatro frentes.
- `/busca`, `/temas`, `/indice`, `/grafo`, `/painel` — são ferramentas de travessia.
- `/internacional`, `/europa`, `/eua`, `/canada`, `/america-latina` — o recorte é
  geográfico e já tem fonte própria; `/direitos/globais` linka, não absorve.
- `/congresso`, `/assembleias`, `/eleicoes` — outro produto.

## Fases

| Fase | O que | Critério de pronto |
|---|---|---|
| 0 | medir uso (analytics/`busca`) das rotas candidatas | lista com as 10 rotas mais acessadas do cluster |
| 1 | criar os 5 hubs **como agregadores**, sem mover nada | hub abre, linka para as rotas atuais, zero duplicação de número |
| 2 | migrar um cluster por vez, com 308 e links internos | `rg` sem link para a rota antiga; 308 respondendo |
| 3 | limpar rotas vazias, atualizar sitemap e `indice` | build verde, sitemap sem 404 |

## Riscos

- **SEO**: 308 preserva, mas só se a página nova tiver o mesmo conteúdo — migrar
  conteúdo pela metade perde posição.
- **Link quebrado interno**: cada migração precisa de `rg` nas rotas antigas.
- **Duplicação temporária**: enquanto a fase 1 roda, hub e página antiga
  convivem; o hub não pode repetir número, só linkar.
- **Custo de manutenção**: cada hub novo é uma página a atualizar; por isso o
  teto de cinco.

## Decisões pendentes

1. `/casos` ou manter `/desastres`? (nome do guarda-chuva)
2. `/paraopeba` vira bacia ou some? (recomendo manter como bacia)
3. `/atores` absorve `/empresas` inteiro ou só a ficha da empresa?
4. `/movimentos` absorve `/memoria` ou a memória continua com nome próprio?
5. Migrar com 308 desde já, ou só depois de medir uso na fase 0?

## Origem / Histórico

- **08/11/2026 — proposta criada.** Nasce da constatação do dono: direitos,
  Paraopeba, Brumadinho, barragens, ambiental e estatais estão espalhados, e o
  mesmo assunto aparece em até cinco rotas.
