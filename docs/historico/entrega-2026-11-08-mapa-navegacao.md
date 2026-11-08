# Entrega — mapa de navegação de 9 eixos (08/11/2026)

> **Tipo:** HISTORICO
> **Domínio:** navegação e arquitetura da informação
> **Última medição:** 2026-11-08
> **Leitura estimada:** média (8-12 min)
> **Relacionados:** [UNIFICACAO-POR-EIXO.md](../planos/UNIFICACAO-POR-EIXO.md), [PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md](../planos/PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md), [PRODUTO.md](../01-produto/PRODUTO.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [README.md](../README.md), [AGENTS.md](../../AGENTS.md)
> **Palavras-chave:** navegação, eixos, frentes, trilha, CaminhoSistema, índice, IndiceEixos, MAB, Brasil de Fato, dock, Seu Nonô, rastro, acessibilidade

## Sumário

- [Para que serve este documento](#para-que-serve-este-documento)
- [O que mudou](#o-que-mudou)
- [Por que mudou](#por-que-mudou)
- [O que NÃO mudou de URL](#o-que-não-mudou-de-url)
- [Os 9 eixos](#os-9-eixos)
- [A trilha única](#a-trilha-única)
- [O índice expansível](#o-índice-expansível)
- [As referências do movimento](#as-referências-do-movimento)
- [O dock flutuante](#o-dock-flutuante)
- [Tabela de fusões](#tabela-de-fusões)
- [Como verificar](#como-verificar)
- [Arquivos tocados](#arquivos-tocados)

## Para que serve este documento

Registra a entrega de 08/11/2026: o portal ganhou um mapa de navegação
com 9 eixos, trilha única e índice expansível. Nenhuma URL antiga saiu do ar.

O mapa é a fonte de três coisas: a trilha (`CaminhoSistema`), o índice
(`IndiceEixos`) e a proposta de unificação. Corrigir um caminho é mexer em
um arquivo só.

## O que mudou

1. **Mapa de navegação** em `apps/web/lib/navegacao/mapa.ts`: 9 eixos,
   34 frentes, `caminhoDe()` e `paginasDoEixo()`.
2. **Testes do mapa** em `mapa.test.ts`: 8 casos, cobrindo trilha, prefixo
   antigo, porta do eixo, rota fora do mapa, query string e integridade
   dos eixos.
3. **Trilha única** (`CaminhoSistema`) em 8 páginas, substituindo
   breadcrumb escrito à mão.
4. **Índice expansível** (`IndiceEixos`) em `/indice`, lendo o mesmo mapa.
5. **Referências do movimento**: 10 links verificados do MAB e do Brasil
   de Fato, distribuídos por eixo.
6. **Dock flutuante**: tentado e removido no mesmo dia; a pilha da esquerda
   ficou só com o Seu Nonô.
7. **Menu do topo**: "Navegue por eixo" com os 9 eixos acima da grade
   curada dos 4 eixos antigos.

## Por que mudou

O portal chegou a 348 páginas e o mesmo assunto mora em até cinco rotas.
Sem um mapa único, cada página inventa a sua trilha e o leitor não sabe
onde está.

A divisão anterior era por produto do portal (barragens, atores,
transparência). A nova é por assunto que o leitor procura. A inspiração de
editoria é o Brasil de Fato; o portal acrescenta **Casos** (os desastres) e
**Dados**, que são a razão de existir dele.

O leitor está sob estresse: caminho confuso é dano. A trilha responde
"onde estou" antes de qualquer número.

## O que NÃO mudou de URL

- **Nenhuma rota antiga foi removida.** Não há redirect em massa nem 308.
- `/paraopeba/*` continua canônico: o mapa traduz o prefixo antigo para a
  trilha "Casos › Brumadinho".
- `/riodoce/*`, `/direitos-em-movimento/*`, `/ambiental/*`, `/memoria`,
  `/congresso`, `/empresas`, `/jurisprudencia` e as 68 páginas de município
  seguem onde estavam.
- `/jurisprudencia` continua sendo a página do acervo (o dado), não um
  índice.
- `/busca`, `/temas`, `/indice`, `/grafo` e `/painel` não mudaram.
- **Cross-listing é permitido; página duplicada não.** Uma página pode
  aparecer em dois eixos, com um endereço canônico só.

Quem já citou uma URL antiga em relatório, processo ou matéria não perde o
link.

## Os 9 eixos

| Eixo | Frentes | Porta | Estado |
|---|---|---|---|
| Casos | Brumadinho, Rio Doce, Itatiaiuçu (3) | `/casos` | no ar |
| Direitos | Em movimento, Saúde, Educação, Trabalho e renda, Memória das lutas, Globais, Comparados (7) | `/direitos` | no ar |
| Meio ambiente | Territórios e mapa (**destaque**), Função social, Barragens, Licenciamento, Fiscalização, Conflitos, Clima e risco (7) | `/ambiental` | no ar |
| Cidades | Cidades (índice), Página do município (2) | `/cidades` | no ar |
| Política | Congresso, Assembleias, Governo, Eleições (4) | `/congresso` | no ar |
| Economia | Empresas, Contas públicas (2) | `/estado-e-economia` | no ar |
| Justiça | Tribunais e varas, Jurisprudência, Instituições, Presídios e números (4) | `/judiciario` | no ar |
| Internacional | Europa, América do Norte, América Latina (3) | `/internacional` | no ar |
| Dados | Dados abertos, Meus dados (2) | `/dados` | no ar |

São **34 frentes** no total. O mapa do território abre o Meio ambiente,
com `destaque: true`: território e risco são a mesma pergunta.

## A trilha única

`CaminhoSistema` lê o mapa e desenha "Início › Eixo › Frente › Página".
Todo nível é link; o último leva `aria-current="page"`. O `<nav>` tem
`aria-label="Você está em"` e a lista é `<ol>`, para o leitor de tela
anunciar a posição.

Está em 8 páginas:

| Página | Trilha |
|---|---|
| `/riodoce` | Início › Casos › Rio Doce |
| `/riodoce/processos` | Início › Casos › Rio Doce › Processos |
| `/paraopeba/linha-do-tempo` | Início › Casos › Brumadinho › Linha do tempo |
| `/paraopeba` | Início › Casos › Brumadinho |
| `/jurisprudencia` | Início › Justiça › Jurisprudência |
| `/congresso` | Início › Política › Congresso |
| `/empresas` | Início › Economia › Empresas |
| `/memoria` | Início › Direitos › Memória das lutas |

As trilhas escritas à mão nessas páginas saíram. Rota fora do mapa
devolve só "Início › Página" — melhor curta que errada.

## O índice expansível

`IndiceEixos` vive em `/indice` e lê `EIXOS` e `paginasDoEixo()`, sem
lista paralela.

- `<details>/<summary>` nativo: abre sem JavaScript e funciona no teclado.
- "Comece por aqui" com quatro portas: Brumadinho, Rio Doce,
  Jurisprudência e Barragens.
- Cada eixo mostra "N frente(s) · N páginas".
- A frente em destaque (Territórios) ganha selo **mapa** e vem primeiro.
- O eixo com destaque abre por padrão.
- Eixo com porta ainda inexistente ganha o aviso "porta em construção".
- Cada eixo com referência exibe o bloco "Leia no movimento".

## As referências do movimento

Duas fontes só, escolhidas pelo vínculo com a luta: o **MAB** (Movimento
dos Atingidos por Barragens), que é parte interessada, e o **Brasil de
Fato**, que cobre os mesmos territórios. O arquivo é
`apps/web/lib/navegacao/referencias.ts`.

Regra de ouro: nenhum link inventado. Cada URL respondeu 200 em
08/11/2026. As do MAB vêm do RSS que o portal já coleta; as do Brasil de
Fato vêm do sitemap público. O `robots.txt` do site proíbe `/search/` e
`?s=`, e a coleta respeita isso.

São 10 URLs únicas em 5 eixos. O estudo sobre metais em Brumadinho aparece
em Casos e em Direitos (cross-listing), por isso são 11 entradas.

| Eixo | Veículo | Matéria |
|---|---|---|
| Casos | Brasil de Fato | [11 anos após o crime da Vale em Mariana-MG, atingidos cobram direitos e temem apagamento](https://www.brasildefato.com.br/2026/11/05/11-anos-apos-o-crime-da-vale-em-mariana-mg-atingidos-cobram-direitos-e-temem-apagamento/) |
| Casos | Brasil de Fato | [Filha do Rio leva às telas perdas culturais do crime da Samarco em Mariana-MG](https://www.brasildefato.com.br/2026/11/04/filha-do-rio-leva-as-telas-perdas-culturais-do-crime-da-samarco-em-mariana-mg-pelo-olhar-de-uma-menina/) |
| Casos e Direitos | Brasil de Fato | [Estudo detecta presença de metais na urina de crianças em Brumadinho](https://www.brasildefato.com.br/2025/01/25/estudo-detecta-presenca-de-metais-na-urina-de-criancas-em-brumadinho/) |
| Direitos | MAB | [Atingidos da Bacia do Paraopeba em luta pela continuidade do Auxílio Emergencial](https://mab.org.br/2026/10/29/nota-atingidos-da-bacia-do-paraopeba-em-luta-pela-continuidade-do-auxilio-emergencial/) |
| Meio ambiente | Brasil de Fato | [Espetáculo Zona de Sacrifício chega a Nova Lima-MG e debate os impactos da mineração](https://www.brasildefato.com.br/2026/11/06/espetaculo-zona-de-sacrificio-chega-a-nova-lima-mg-e-debate-os-impactos-da-mineracao/) |
| Meio ambiente | MAB | [Atingidos no Rio Madeira já sentem os efeitos do El Niño agravado pela crise climática](https://mab.org.br/2026/10/16/atingidos-no-rio-madeira-ja-sentem-os-efeitos-do-el-nino-agravado-pela-crise-climatica/) |
| Meio ambiente | Brasil de Fato | [Governo define 27 minerais estratégicos para impulsionar a industrialização do Brasil](https://www.brasildefato.com.br/2026/11/05/governo-define-27-minerais-estrategicos-para-impulsionar-a-industrializacao-do-brasil/) |
| Internacional | MAB | [MAB participa de jornada internacional em Genebra pelo avanço do Tratado dos Povos na ONU](https://mab.org.br/2026/10/30/mab-participa-de-jornada-internacional-em-genebra-pelo-avanco-do-tratado-dos-povos-na-onu/) |
| Internacional | Brasil de Fato | [Mineração na África do Sul: o que sobra para o povo sul-africano](https://www.brasildefato.com.br/especiais/especiais-mineracao-na-africa-do-sul-o-que-sobra-para-o-povo-sul-africano/) |
| Justiça | MAB | [MPMG declara Aedas para Assessoria Técnica a comunidades atingidas do Vale do Jequitinhonha](https://mab.org.br/2026/10/28/mpmg-declara-aedas-para-assessoria-tecnica-a-comunidades-atingidas-do-vale-do-jequitinhonha/) |

Cidades, Política, Economia e Dados ainda não têm referência. Lacuna
declarada é informação: o eixo sem cobertura não ganha bloco de enfeite.

## O dock flutuante (removido no mesmo dia)

O `DockFlutuante` existiu por poucas horas em 08/11/2026 e foi **removido a
pedido do dono**: a pilha da esquerda mostra só o Seu Nonô, a pata e o rádio
que já existiam. O dock adicionava três botões novos (rádio, bicho e rastro)
que disputavam a mesma área do FAB e cobriam a cara do assistente no celular.

O que ficou (regra final do dono, 08/11/2026):

- **Seu Nonô** no FAB da pilha da esquerda (64 px), sozinho, parado.
- **Pata, rádio e rastro mágico** entram quando o ponteiro chega no Seu Nonô
  (ou em tela sem hover) e cada um abre o nome no hover/foco.
- Item que fica visível por estar **ligado** (rádio tocando, menu do bicho
  aberto, trilha ativa) não guarda o lugar antigo: desce e encosta no FAB.
  Com só o rastro ligado, ele ocupa o primeiro degrau; com rádio e rastro,
  os dois primeiros.
- **Rádio** também no rodapé (`BotaoRadio`), como antes do dock.
- **Bicho e rastro** também ligam e desligam no cartão "Acessibilidade" do
  Seu Nonô e pelos comandos de texto.
- **Voltar ao topo** discreto no canto inferior direito: só a seta em 70% de
  opacidade; o rótulo "Voltar ao topo" cresce no hover/foco.

Regra para a próxima sessão: a pilha da esquerda não recebe botão novo sem
pedido explícito do dono.

## Tabela de fusões

O portal tinha 14 eixos. A decisão de 08/11/2026 reduziu para 9 sem mover
página e sem mudar dado.

| Etapa | Eixos | O que mudou |
|---|---|---|
| Inicial | 14 | Direitos, Meio ambiente, Movimentos, Terra, Trabalho, Saúde, Educação, Cidades, Política, Economia, Justiça, Internacional, Casos e Dados |
| 1 | 14 → 11 | Trabalho, Saúde e Educação viram frentes de Direitos; cada uma já tinha endereço em `/direitos-em-movimento/*` |
| 2 | 11 → 10 | Movimentos vira frente de Direitos como "Memória das lutas" (`/memoria`); memória das lutas é direito em movimento |
| 3 | 10 → 9 | Terra entra em Meio ambiente: "Territórios e mapa" (destaque) e "Função social"; o mapa do território abre o eixo |

O custo das três fusões foi só de índice e trilha. Nenhum dado mudou e
nenhuma rota saiu do ar.

## Como verificar

```bash
cd apps/web
npx vitest run lib/navegacao/mapa.test.ts
npx tsc --noEmit
```

O teste do mapa cobre: prefixo antigo resolvido pela trilha nova, página no
último nível com href completo, porta do eixo sem repetir frente, rota
fora do mapa com trilha curta, query string ignorada, slug de eixo sem
repetição, toda frente com rota de entrada e contagem de páginas por eixo.

## Arquivos tocados

| Arquivo | Papel |
|---|---|
| `apps/web/lib/navegacao/mapa.ts` | 9 eixos, 34 frentes, `caminhoDe()`, `paginasDoEixo()` |
| `apps/web/lib/navegacao/mapa.test.ts` | 8 testes do mapa e da trilha |
| `apps/web/lib/navegacao/referencias.ts` | 10 links verificados do MAB e do Brasil de Fato |
| `apps/web/app/components/CaminhoSistema.tsx` | trilha única |
| `apps/web/app/components/IndiceEixos.tsx` | índice expansível por eixo |
| `apps/web/app/indice/page.tsx` | usa o `IndiceEixos` |
| `apps/web/app/components/WidgetsFlutuantes.tsx` | liga os flutuantes ao layout (sem dock) |
| `apps/web/app/components/PlayerRadio.tsx` | rádio da pilha, 8 px acima da pata |
| `apps/web/app/components/MenuEixos.tsx` | 9 eixos no menu do topo |
| 8 páginas com trilha | riodoce, riodoce/processos, paraopeba, paraopeba/linha-do-tempo, jurisprudencia, congresso, empresas, memoria |

## Origem / Histórico

- **08/11/2026 — entrega registrada.** Mapa de 9 eixos, trilha em 8
  páginas, índice expansível e referências do MAB e do Brasil de Fato.
  Plano detalhado em [UNIFICACAO-POR-EIXO.md](../planos/UNIFICACAO-POR-EIXO.md).
- **08/11/2026 — dock removido.** O dono viu os três botões novos cobrindo
  o Seu Nonô e pediu que ficasse só o FAB que já existia. `DockFlutuante` e
  `app/components/dock/` saíram; o rádio voltou ao rodapé.
