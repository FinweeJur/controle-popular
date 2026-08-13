# Direitos em Movimento — plano da seção

> Escrito em 13/08/2026, a pedido do dono. Este documento é o plano — não há
> código de feature nele. Todo número marcado como "medido" foi contado agora,
> contra o banco local e os arquivos do repositório; o resto é decisão a
> defender.

## O pedido, na frase do dono

> "Quais leis existem pra proteção dos ecossistemas, da fauna, flora e grupos
> sociais e onde é possível buscar ajuda / parcerias. Passo a passo e links
> para que ação cidadã seja possível por todos."

## O achado que muda o tamanho do trabalho

**Isto não é uma seção para construir. É uma seção para ABRIR.**

Três dos quatro cômodos já estão mobiliados e em produção. O que não existe é
a porta — nada na home diz que eles existem, e cada um mora num endereço que
só se acha por acidente.

Medido agora:

| Peça | Estado | Volume medido | Endereço hoje | Como se chega |
|---|---|---|---|---|
| Legislação e precedentes por tema | pronta | **30 normas + 15 precedentes**, 5 temas (`indigena`, `quilombola`, `povos_tradicionais`, `rios`, `direitos_humanos`) | `/ambiental/direito-critico` | dentro do eixo Ambiental |
| Rede de proteção | pronta | **24 organizações** — 18 oficiais, 4 populares, 2 acadêmicas — sobre **11 necessidades** | `/[cidade]/rede-de-protecao` | home da cidade → **Serviços** |
| Pedir informação (LAI) | pronta | **3 canais estaduais + 5 federais** + os municipais montados de `cidade.fontes` | componente `PedidoLAI` | rodapé e telas soltas |
| Passo a passo de denúncia | **não existe** | — | — | — |

Ou seja: **3 de 4 é encanamento de navegação; 1 de 4 é feature nova.**

## Decisão do dono: a seção é GERAL, e pergunta a cidade quando precisar

Havia duas saídas, e a escolha estava travando o começo:

- **(A)** seção geral no portal; quando a pessoa chega em "onde buscar ajuda",
  a seção pergunta a cidade.
- **(B)** seção geral para lei e denúncia, e a parte de ajuda joga para dentro
  da cidade que a pessoa já tivesse escolhido.

**Escolhida: (A).** A razão não é de arquitetura, é de quem usa: quem sofreu
violação não sabe em que aba do site está — sabe o que aconteceu com ele. Pedir
que escolha a cidade ANTES de dizer o que precisa inverte a ordem do problema
real. A cidade é detalhe de encaminhamento, e só a rede de proteção depende
dela; lei, precedente e o passo a passo de denúncia não dependem.

Consequência direta de (A): a seção mora em `/direitos-em-movimento`, na raiz
do portal, ao lado das cinco zonas — **não** em `/[municipio]/`.

## Desenho: quatro portas

```
/direitos-em-movimento
├── "Que lei protege isso"      → o acervo por tema (30 normas + 15 precedentes)
├── "Onde buscar ajuda"         → a rede (24 orgs), perguntando a cidade
├── "Como pedir informação"     → LAI, com o canal certo por esfera
└── "Como denunciar"            → o passo a passo guiado  ← ÚNICA parte nova
```

### Porta 1 — Que lei protege isso

O acervo NÃO se muda de lugar. `/ambiental/direito-critico` continua existindo
e continua sendo o endereço canônico: os motivos escritos no cabeçalho daquela
página (é acervo de norma vigente e decisão julgada, cruzado por assunto, não
por tramitação) seguem valendo. Mudar a URL quebraria link já compartilhado
para ganhar nada.

A seção **aponta** para ele, com o recorte que interessa aqui — e o recorte já
existe: os cinco temas do acervo são exatamente ecossistemas e grupos sociais.

### Porta 2 — Onde buscar ajuda

Reusa `lib/betim/redeProtecao.ts` inteiro, que é onde estão as 24
organizações, as 11 necessidades e os campos que importam (`gratuito`,
`telefone`, `prazo`, `verificadoEm`).

**A pergunta da cidade vem DEPOIS da necessidade, não antes.** Quem entra
escolhe "violência contra a mulher" ou "racismo", e só então a seção pergunta
onde a pessoa está, para separar o que é municipal do que é estadual e federal.
Item federal e estadual aparece antes mesmo de responder a cidade — Disque 100
não depende de saber o município.

Fora das 6 cidades cadastradas, a seção mostra o estadual e o federal e diz que
não tem canal municipal cadastrado ali. **Não some.**

### Porta 3 — Como pedir informação

Já existe como componente (`PedidoLAI`) e como dados (3 estaduais, 5 federais,
municipais montados de `cidade.fontes`). Falta ser uma porta com nome.

### Porta 4 — Como denunciar (a parte a construir)

Plano próprio, já escrito: `docs/PLANO-ACAO-CIDADA.md`.

**O requisito que decide a arquitetura está lá e não se negocia:** o documento
é gerado **no navegador da própria pessoa e nunca toca o servidor**. Quem
denuncia violação de direito pode estar em risco, e rascunho em servidor é
prova contra ela — obtível por intimação, vazamento ou apreensão. Se a
denúncia é contra agente do Estado, um portal de transparência é exatamente o
lugar que esse agente saberia pedir para investigar.

Não é promessa nova: o projeto já faz isso em
`lib/congresso/oficio/render-binario.ts`, com `await import()` de `docx` e
`pdf-lib` em chunk separado. Reusar aquele caminho é o que torna a garantia
verdadeira em vez de prometida.

Consequência: **o facilitador não tem "enviar". Tem "baixar".** Nenhuma rota
`route.din.ts` recebe o texto da denúncia.

## Honestidade de cobertura — regra do projeto, não enfeite

Duas lacunas **têm que estar visíveis na seção**, não em rodapé:

1. **13 itens não verificados**, listados em `NAO_VERIFICADO`. São canais que
   existem mas cujo endereço/telefone não foi confirmado agora — e-SIC de
   câmaras que devolveram 403, delegacias especializadas fora de BH sem
   endereço atual, comissão de direitos humanos da OAB-MG que bloqueou acesso.
   Mandar alguém em situação de urgência para um telefone não confirmado é pior
   que dizer "confirme antes de ir".

2. **Povos e comunidades tradicionais não indígenas e não quilombolas não têm
   base geográfica** (ver `docs/FONTES-TERRITORIO-E-MINERACAO.md` §5.1).
   Faiscadores, geraizeiros, apanhadoras de flores sempre-vivas, vazanteiros,
   povos de terreiro, pescadores artesanais. O acervo de LEI os alcança — o
   tema `povos_tradicionais` existe nas 30 normas. O MAPA não os representa. A
   seção não pode deixar ninguém ler "não aparece" como "não existe ali".

## Ordem sugerida — maior ganho, menor esforço primeiro

1. **A porta.** Card na home + `/direitos-em-movimento` com as quatro entradas,
   sendo três delas link para o que já está pronto. É a mudança que sozinha
   transforma três cômodos escondidos em três cômodos achados.
2. **A rede sem cidade obrigatória.** Fazer a necessidade vir antes da cidade,
   com estadual e federal aparecendo de imediato.
3. **Os avisos de cobertura**, junto com o item 1 — não depois. Publicar a
   porta sem eles é o único jeito de esta seção causar dano.
4. **O facilitador de denúncia**, seguindo `PLANO-ACAO-CIDADA.md`.

## O que este plano NÃO decide

- **Nome da URL.** `/direitos-em-movimento` é o que o dono falou; se virar
  outra coisa, é decisão dele, não achado técnico.
- **Se o acervo de lei sai do `/ambiental`.** A recomendação aqui é NÃO sair.
- **Texto de cada card.** Fica para quando a porta existir.

---

*Levantado em 2026-08-13. As contagens de normas, precedentes, organizações,
necessidades e itens não verificados foram medidas contra o banco local e os
arquivos do repositório na data — não estimadas.*
