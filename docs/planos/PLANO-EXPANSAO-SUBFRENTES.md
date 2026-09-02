# Expansão da copy para as subfrentes — tópicos, capítulos e remissões (v7.2)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-02
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PLANO-COPY-VOZ.md](./PLANO-COPY-VOZ.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** copy, subfrentes, capitulos, topicos, remissoes, hiperlinks, botoes, navegacao, componente, lib, voz, expansao, home, frentes

## Sumário

- [Propósito](#propósito)
- [O que se unifica: anatomia única da página de subfrente](#o-que-se-unifica-anatomia-única-da-página-de-subfrente)
- [Capítulos nos hubs das frentes](#capítulos-nos-hubs-das-frentes)
- [Mapa de remissões (hiperlinks e botões)](#mapa-de-remissões-hiperlinks-e-botões)
- [As 31 telas estratégicas](#as-31-telas-estratégicas)
- [Fonte única: `lib/subfrentes.ts`](#fonte-única-libsubfrentests)
- [Réguas de aplicação](#réguas-de-aplicação)
- [Fases](#fases)

## Propósito

Levar a voz v7.1 — definida no [PLANO-COPY-VOZ.md](./PLANO-COPY-VOZ.md) e já aplicada à home e aos hubs das frentes — para as principais páginas de subfrente, **sem repetir e sem inflar**. A ideia central desta expansão é a de *capítulo*: a página da frente é o capítulo-mestre (com epígrafe, princípio e microensaio); cada subfrente é uma **seção de trabalho** desse capítulo, com a mesma anatomia, microresumo próprio e botões que ligam irmãs e frentes vizinhas. Nada aqui muda conteúdo, número ou tabela existente — a expansão é de moldura (kicker, display, microresumo, remissão), nunca de dado.

O levantamento partiu do inventário real do diretório `apps/web/app` em 02/09/2026: Congresso tem 10 subpáginas, Judiciário 14, Ambiental 15, Paraopeba 15, Terras 3 e cada cidade (`[municipio]`) mais de 30. Aplicar a voz em tudo seria inflação; este plano seleciona **31 telas estratégicas** (o pedido eram ~30; sobrou uma do Judiciário, frente densa) e define o padrão que depois cobre o resto.

## O que se unifica: anatomia única da página de subfrente

Toda página de subfrente passa a ter a mesma moldura de seis peças, nesta ordem. É o equivalente, dentro do app, ao padrão de capítulo da home:

1. **Trilha** — chips de navegação no topo: `FRENTE → SUBFRENTE`, ambos clicáveis. Substitui a sensação de página órfã.
2. **Kicker + display-pergunta** — o display da subfrente é **sempre a pergunta que a página responde** (≤ 6 palavras, mesma régua de forma da home). Pergunta, não poesia: a voz desce um andar em relação ao hub.
3. **Microresumo** — 1–2 frases dizendo o que a tela mostra e por que importa. Tom de serviço: útil, direto, sem epígrafe e sem poema (esses moram no hub).
4. **Número protagonista com `FONTE: {fonte} · {data}`** — quando a tela já tem card de número, ele continua mandando; o binding segue a régua "o número vem do dado".
5. **Conteúdo existente** — intocado.
6. **"Ver também"** — até 3 botões ao final: primeiro as irmãs dentro da frente, depois no máximo 1 ponte para outra frente, quando houver razão editorial registrada neste plano.

O que **não** desce para a subfrente: epígrafe literária, verso de poema, princípio carimbo e manifesto. Isso é o que impede a inflação — se cada uma das 31 telas ganhasse citação, a epígrafe viraria decoração e perderia a força que tem hoje no hub.

## Capítulos nos hubs das frentes

Cada página de frente (hub) ganha, depois do microensaio e do número protagonista, uma seção **`CAPÍTULOS DA FRENTE`**: grade de botões-pílula (o mesmo padrão visual da sanfona da prévia) com o nome de cada subfrente + microresumo de uma linha. É a mesma lógica da sanfona da home — seis frentes, um olho só — aplicada um nível abaixo: um hub, seus capítulos. O hub continua sendo o lugar da epígrafe, do princípio e da memória; a grade de capítulos é a porta de saída para o trabalho.

## Mapa de remissões (hiperlinks e botões)

Dois tipos de botão no "Ver também": **irmãs** (mesma frente) e **pontes** (outra frente). Toda ponte precisa de razão editorial — não é link por link, é o portal dizendo "esta conta continua ali".

**Irmãs (dentro da frente):**

- Congresso: parlamentares ↔ votações ↔ bancadas ↔ proposições; comissões ↔ agenda
- Judiciário: tribunais ↔ vagas ↔ indicações; instituições ↔ inspeções ↔ defensoria ↔ presídios
- Ambiental: licenciamento ↔ COPAM ↔ TAC ↔ decisões; barragens ↔ crimes socioambientais
- Paraopeba: entenda ↔ linha do tempo ↔ execução ↔ auditoria ↔ documentos ↔ quem atua
- Terras: mapa ↔ alertas
- Cidade: câmara ↔ vereadores ↔ emendas ↔ painel do cidadão

**Pontes (entre frentes), com a razão:**

| De | Para | Razão editorial |
|---|---|---|
| congresso/proposições | [municipio]/legislação | a lei federal chega na cidade — a mesma régua de classificação |
| ambiental/barragens | paraopeba/entenda | barragem tem história; o mapa encontra a memória |
| ambiental/judiciário | judiciario/sirenejud | o litígio ambiental vira processo — continuação natural |
| paraopeba/execução | ambiental/tac | a execução do acordo se lê junto com os compromissos dos TACs |
| funcaosocialterra/mapa | [municipio]/mineração | o território estadual desce para o recorte municipal |
| judiciario/defensoria | [municipio]/rede-de-protecao | quem não pode pagar encontra a porta certa na cidade |
| [municipio]/emendas | congresso/parlamentares | a emenda municipal tem autoria federal — seguir o dinheiro |

## As 31 telas estratégicas

Seleção das âncoras de cada frente (as demais subpáginas — índices, metodologias, APIs, utilidades — ficam para a fase seguinte, com o mesmo padrão já validado).

### Congresso (6)

| Rota | Display (pergunta) | Microresumo (1 linha) |
|---|---|---|
| `parlamentares` | QUEM TE REPRESENTA? | Cada parlamentar com nome, bancada, votos e faltas — gente, não sigla. |
| `votacoes` | COMO FOI O VOTO? | Cada votação nominal com placar e quem votou o quê, data a data. |
| `proposicoes` | O QUE TRAMITA LÁ? | Projetos classificados por direito ampliado ou restringido, com régua pública. |
| `bancadas` | QUEM VOTA EM BLOCO? | A geometria dos blocos: quem anda junto, tema a tema. |
| `comissoes` | ONDE A LEI GANHA CORPO? | As comissões que aprovam — ou engavetam — antes do plenário, com relator e data. |
| `agenda` | O QUE SE DECIDE ESTA SEMANA? | Pauta do plenário e das comissões, com sinal de urgência. |

### Judiciário (7)

| Rota | Display (pergunta) | Microresumo (1 linha) |
|---|---|---|
| `tribunais` | QUEM OCUPA CADA CADEIRA? | Os tribunais, seus magistrados e quem os indicou. |
| `vagas` | QUE CADEIRA VAGA QUANDO? | Aposentadoria aos 75 calculada por lei — vacância prevista com data, não boato. |
| `indicacoes` | QUEM INDICOU QUEM? | O caminho de cada nomeação, do ofício à sabatina. |
| `instituicoes` | COMO O SISTEMA SE LIGA? | O organograma — quem vigia quem dentro do próprio Judiciário. |
| `inspecoes` | A INSPEÇÃO FOI FEITA? | Relatórios de inspeção e o que apontaram, com data. |
| `defensoria` | QUEM DEFENDE QUEM NÃO PODE PAGAR? | A Defensoria em números: vagas, concurso e atendimento. |
| `presidios` | O QUE ACONTECE LÁ DENTRO? | Dados oficiais do sistema prisional — e a lacuna, quando a fonte não tem, com nome e data. |

### Ambiental (6)

| Rota | Display (pergunta) | Microresumo (1 linha) |
|---|---|---|
| `licenciamento` | QUE LICENÇA SAIU PERTO DE VOCÊ? | Licenças por classe de risco, município e empreendimento. |
| `copam` | O QUE O CONSELHO DECIDIU? | Atas e votos do COPAM, reunião a reunião. |
| `barragens` | QUE BARRAGEM FICA ONDE? | As barragens no mapa, por classe de dano e método de construção. |
| `decisoes` | O QUE JÁ FOI DECIDIDO? | Decisões ambientais com processo e data. |
| `tac` | O QUE O ACORDO MANDA FAZER? | TACs e seus compromissos, prazo a prazo. |
| `crimes-socioambientais` | O QUE VIROU PROCESSO? | Autos e registros — com a régua de sempre: sinal de investigação, não veredito. |

### Paraopeba (6) — registro de cuidado integral

| Rota | Display (pergunta) | Microresumo (1 linha) |
|---|---|---|
| `entenda` | O QUE ACONTECEU? | O rompimento explicado com documento e data. |
| `linha-do-tempo` | E DEPOIS, O QUE VEIO? | De 25/01/2019 a hoje, marco a marco. |
| `execucao` | O ACORDO ESTÁ SENDO CUMPRIDO? | A execução mês a mês: o que pagou, o que atrasou, o que falta. |
| `auditoria` | QUEM CONFERIU OS NÚMEROS? | Fichas de auditoria, item a item. |
| `quem-atua` | QUEM FAZ O QUÊ NA REPARAÇÃO? | Instituições, comissões e organismos — cada um no seu papel. |
| `documentos` | ONDE ESTÁ O PAPEL? | Acordos, atas e anexos, catalogados. |

### Terras (2)

| Rota | Display (pergunta) | Microresumo (1 linha) |
|---|---|---|
| `mapa` | DE QUEM É ESTA TERRA? | Territórios quilombolas, barragens e mineração sobrepostos — com o vazio cadastral nomeado ao lado do número. |
| `alertas` | O QUE MUDOU NO TERRITÓRIO? | Novos requerimentos e sobreposições, com data. |

### Cidade (`[municipio]`, 4)

| Rota | Display (pergunta) | Microresumo (1 linha) |
|---|---|---|
| `camara` | O QUE A CÂMARA VOTOU? | Sessões, pautas e presença, data a data. |
| `vereadores` | QUEM TE REPRESENTA NA CÂMARA? | Cada vereador, seus votos e suas propostas. |
| `emendas` | PRA ONDE FOI A EMENDA? | Quem destinou, quanto e pra quê. |
| `painel-do-cidadao` | O QUE A CIDADE TE DEVE? | Serviços e utilidades reunidos num painel só. |

## Fonte única: `lib/subfrentes.ts`

A copy das 31 telas vive em **um arquivo só**, no mesmo padrão de `lib/zonas.ts` e `lib/memoria-cidades.ts` — copy centralizada não deriva:

```ts
export interface SubfrenteCopy {
  slug: string;          // rota dentro da frente
  frente: string;        // zona/frente a que pertence
  display: string;       // a pergunta, <= 6 palavras
  microresumo: string;   // 1-2 frases, tom de servico
  verTambem: { href: string; rotulo: string; ponte?: boolean }[];
}
export function subfrenteDaRota(frente: string, slug: string): SubfrenteCopy | null;
```

As páginas leem da lib; quem quiser auditar a voz inteira do portal lê três arquivos (`zonas`, `memoria-cidades`, `subfrentes`). A seção "Capítulos da frente" dos hubs consome a mesma lib, filtrando por frente — assim o botão do hub e a trilha da subfrente nunca divergem.

## Réguas de aplicação

Herdam-se todas as réguas do [PLANO-COPY-VOZ.md](./PLANO-COPY-VOZ.md#réguas-de-aplicação) e do [AGENTS.md](/AGENTS.md). As novas, específicas desta expansão:

1. **Epígrafe e poema moram no hub.** Subfrente não recebe citação literária nem verso — recebe pergunta. A força da epígrafe é a raridade.
2. **Display de subfrente é pergunta que a página responde** (≤ 6 palavras). Sem exclamação; a interrogação é o convite.
3. **Máximo 3 botões no "Ver também"**, irmãs primeiro. Ponte entre frentes só com razão editorial registrada na tabela deste plano — remissão é argumento, não decoração.
4. **Paraopeba integralmente sóbria**: as perguntas da frente são factuais ("O que aconteceu?", "O acordo está sendo cumprido?"), zero humor, zero ornamento — a mesma guarda do capítulo 05 da home.
5. **Tom de serviço:** o alívio cômico mora na home e nos hubs; a subfrente é a bancada de trabalho — útil primeiro, bonita porque clara.
6. **Números seguem placeholders de binding** (`[entre colchetes]`) até ligarem nas constantes — nunca digitados à mão, em nenhuma das 31 telas.
7. **Lacuna continua informação** — em especial em `presidios`, `inspecoes` e `mapa` (vazio cadastral), onde a ausência do dado é parte da história que a tela conta.

## Fases

- **F1 — esqueleto:** criar `lib/subfrentes.ts` com as 31 entradas; componente `VerTambem` (botões-pílula); seção "Capítulos da frente" nos 5 hubs; trilha (chips `FRENTE → SUBFRENTE`) no layout compartilhado.
- **F2 — passada:** aplicar kicker + display + microresumo nas 31 telas, sem tocar conteúdo; bindings marcados entre colchetes.
- **F3 — remissões e auditoria:** conferir cada botão do "Ver também" contra rotas reais (link check), revisar pontes com o dono e atualizar a prévia com uma página de subfrente-exemplo.
