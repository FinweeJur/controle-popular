# Roteiros de vídeo para redes sociais — Controle Popular

> **Seis roteiros verticais (9:16), até 60 s cada**, um por frente do portal.
> Item **N6** de `docs/PLANO-2026-08-15.md`.
>
> **Nota de método.** Todo número citado num roteiro foi medido em
> **15/08/2026**, contra os arquivos deste repositório, ou copiado de um
> documento de `docs/` **com a data da medição escrita ao lado**. Onde não
> houve número medido, o roteiro usa **demonstração, não estatística** — é a
> regra que o arquivo-fonte desta proposta já mandava seguir, e ela vale mais
> aqui, porque o argumento inteiro do portal é que número sem procedência não
> se publica. Um vídeo que cobra procedência dos outros não pode inventar a
> própria.

---

## ⚠️ Antes de qualquer coisa: gravar depende do site estar no ar

**Todo roteiro deste arquivo manda gravar tela real.** Isso deixou de ser
detalhe de produção e virou pré-requisito: em **15/08/2026 o portal estava
desatualizado**, e gravar naquele estado publicaria como "isto funciona" uma
tela que não tem o trabalho das últimas 48 horas.

O que foi medido no dia, e as duas medições não concordam entre si — as duas
ficam registradas, porque escolher uma seria inventar:

| Fonte no repositório | O que ela afirma |
|---|---|
| `docs/PLANO-2026-08-15.md`, abertura | O site está **congelado desde 13/08**, por volta das 22h; nove commits do dia estão no GitHub e nenhum no ar |
| `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`, cabeçalho | **O site no ar é o build das 10:08 de 15/08**; o código está publicado (`b9e34c5`), o build passa, e é o `cf:deploy` que recusa |

**A causa medida do bloqueio não é falta de conteúdo — é tamanho de entrega.**
`.open-next/assets/.../ambiental/legislacao.cache` saiu com **35,5 MiB** contra
o teto de **25 MiB** do Cloudflare Workers. O texto real das 15.318 ementas
pesa **4,7 MiB**: a razão entre o dado e o pacote entregue é de **7,5×**, porque
o payload vai embutido duas vezes (HTML e RSC) e cada linha repete o nome de
todos os campos. Não é dado demais; é serialização cara. Os números e o plano
de conserto estão em `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`, e **três outras
rotas estão na mesma faixa** (`sp/educacao` a 21 MiB, `bh/camara/legislacao` a
11 MiB, `diamantina/camara/legislacao` a 9,5 MiB).

Some-se a isso o gargalo maior, do mesmo plano: `next build` lê a **Neon**, que
está em **HTTP 402 até 01/09**. Sem banco não há build; sem build não há deploy;
e a publicação roda na máquina do dono, não nesta.

### A regra de produção que sai daí

> **Confira que o deploy passou antes de ligar a câmera.** Grave só depois de
> abrir `controlepopular.com.br` e ver na tela o que o roteiro promete mostrar.
> Se a página não tiver o número que a fala diz, **o vídeo está errado, não a
> página** — e um vídeo de transparência gravado sobre tela defasada é
> exatamente o defeito que ele acusa nos outros.

Os roteiros 4, 5 e 6 são os mais expostos a isso: as camadas de 8 km, os seis
marcos novos da linha do tempo e a biblioteca das assessorias entraram no
repositório em **14–15/08** e, na data desta escrita, **nenhum deles tinha ido
ao ar**.

---

## O que mudou em relação à proposta anterior

A proposta de origem — `Obsidian Vault/Projetos/Clareira — Roteiros de Vídeo
(Anúncio dos Projetos).md`, de **29/07/2026** — tratava o Controle Popular como
três projetos entre treze. **O método daquele arquivo é bom e está mantido
inteiro aqui**: gancho de 5 s com alternativa e justificativa de qual usar,
tabela com marcação de tempo, linha "🎥 A prova" dizendo qual captura sustenta
a fala, banco de CTAs e avisos de honestidade.

O que envelheceu, e por quê:

| Defasagem | Estado em 29/07 | Medido em 15/08 |
|---|---|---|
| **Endereço** | `controlepopular.vercel.app/betim` | `controlepopular.com.br` — o domínio próprio está declarado em `apps/web/wrangler.jsonc` e o comentário de `apps/web/app/sitemap.ts` explica que o `.vercel.app` era o domínio auto-gerado do projeto antigo |
| **Quantas frentes** | três (Betim, Congresso, Judiciário) | **seis**, contadas em `apps/web/lib/zonas.ts` (`ZONAS_PUBLICADAS.length`) |
| **Volume do Congresso** | "670 PLs analisados" | **5.562 proposições** no acervo (medido 09/08, registrado em comentário de código; confirmado 12/08 em `docs/APRESENTACAO.md`). **Duas palavras estão erradas na frase antiga**: não são "PLs" — o ETL coleta seis tipos (PL, PEC, PLP, MPV, PDL, PLV) — e não foram todas "analisadas": a análise concluída cobre **676**, ou 12,2% |

### ⚠️ Duas correções de premissa, medidas, que mudam o recorte

**1. A sexta frente não é Direitos em Movimento — é a Ambiental.** As seis
zonas publicadas em `apps/web/lib/zonas.ts` são: Cidades, Congresso, Judiciário,
**Ambiental**, Terra e território (`/funcaosocialterra`) e Paraopeba. Direitos
em Movimento **não é uma frente por decisão explícita do dono**, registrada em
comentário na home (`apps/web/app/page.tsx`, 13/08):

> As frentes são eixos de poder — lugares onde alguém decide sobre a vida da
> pessoa. Esta seção não é mais um desses lugares; é o que a pessoa **faz** com
> o que achou nas outras — transversal, não paralela.

O roteiro 6 respeita isso: **vende a faixa transversal, não uma sétima frente.**
Chamá-la de frente no vídeo contradiria a própria home, que estampa
"Transversal às seis frentes".

**2. A frente Ambiental ficou sem roteiro, de propósito.** Ela é a mais rica em
número medido do portal (19.704 licenças, 6.378 normas estaduais, 454 reuniões
do COPAM, 12/08) — e é justamente a rota **cujo deploy está bloqueado** pelo
payload de 35,5 MiB. Escrever roteiro para a única tela que não pode ser
gravada seria trabalho para a gaveta. Entra na próxima rodada, depois do
conserto.

---

## ⚠️ Três avisos de honestidade (leia antes de gravar)

Os três do arquivo original, adaptados ao que **este** repositório é.

**1. Aqui "contribuir" pode significar "abra um PR" — e no arquivo original não
podia.** Conferido em 15/08: `github.com/FinweeJur/controle-popular` é
**PUBLIC**, licenciado em **AGPL-3.0-or-later**. Esse é o oposto do caso da
Clareira, onde quase todos os repositórios eram privados e o convite tinha de
ser "testar, achar bug, trazer dado". Aqui o convite pode ser o forte.

**Mas o dado não acompanha o código.** O portal é gerado a partir de um Postgres
que não é público, e a Neon está em HTTP 402 até 01/09 — quem clonar hoje **não
sobe o site sem banco**. Diga "o código está aberto", nunca "é só rodar".

**2. O portal NÃO recebe denúncia, e o vídeo não pode sugerir que recebe.**
`/direitos-em-movimento/denuncia` é um **gerador de documento**, não um canal:
não há botão de enviar, não há rota de API que aceite o texto, e uma varredura
por chamadas de rede no código do facilitador devolve zero. O roteiro 6 convida
a **revisar a rede de contatos e corrigir órgão errado** — que é o que de fato
está aberto, e é onde o erro machuca alguém. **Nunca convide a "mandar uma
denúncia de teste"**: não há para onde mandar, e a frase faria alguém em
situação real acreditar que escreveu para alguém.

**3. Dois números fortes desta rodada estão medidos e NÃO estão na tela.** O
caso de Belo Horizonte no AdaptaBrasil e a cobertura do ComunicaBR (detalhados
no fim deste arquivo) foram coletados em 15/08 e **não foram carregados em
página nenhuma**. Citá-los num vídeo que promete tela real seria vender como
publicado o que não está. **Ficaram fora dos seis roteiros de propósito** —
entram quando ligarem na tela, e aí viram vídeo próprio.

---

## Banco de CTAs — 3 variantes

Mesma disciplina do arquivo original: teste **um por lote de vídeos**, não um
por vídeo, senão não se sabe o que moveu o quê. Endereço único:
**controlepopular.com.br**.

| # | CTA | Quando usa | Por quê |
|---|---|---|---|
| **A** | *"Tá tudo em controlepopular.com.br. Entra, confere um número, e me diz se tá errado."* | **Padrão.** Roteiros 1, 5 e 6. | "Confere um número" é a ação que o portal foi construído para receber — cada tela tem link para a fonte oficial ao lado. Pede algo pequeno, concreto, e que a própria arquitetura suporta. |
| **B** | *"Controlepopular.com.br. Se você é [da área], eu preciso da sua revisão mais do que de mais um acesso."* | Nicho técnico: roteiros 2, 3 e 4. | Filtra por competência em vez de volume. Quando o que falta é revisão de método — e falta —, público pequeno e certo bate público grande e morno. |
| **C** | *"O código é aberto, licença AGPL, tá no GitHub. Se você programa, o repositório é FinweeJur barra controle-popular."* | Só onde a abertura do código **é** o argumento. | É verdade medida (repo PUBLIC, AGPL-3.0), e é o que o arquivo original não podia dizer. **Nunca prometa que roda fácil**: sem banco, não sobe. |

---

# 1 · Cidades — Betim e mais cinco

**Estado real (medido no banco em 12/08/2026, `docs/APRESENTACAO.md`):** seis
cidades no ar — **Araçuaí, Belo Horizonte, Betim, Diamantina, Itinga e São
Paulo**. 12.991 contratos, 21.582 licitações, 10.317 atos oficiais, 13.317
proposições de câmara, 139.052 vínculos de servidores, 158 vereadores, 59 obras.
Endereço: **controlepopular.com.br/betim** (e `/bh`, `/sp`, `/aracuai`,
`/diamantina`, `/itinga`).

> **🪝 Gancho (0–5 s)**
> *"A prefeitura publica tudo o que gasta. Em quarenta planilhas que ninguém abre."*
>
> **Alternativa:** *"Meu site publicou o dobro do dinheiro federal que Betim recebeu. Quinhentos e noventa e sete milhões, quando era duzentos e noventa e oito. Eu achei, eu consertei, e vou te contar como."*
> *Rationale:* a primeira é a do arquivo original e continua funcionando — ataca a instituição, é compartilhável. **A segunda é nova e é mais forte**, porque o erro é real, está documentado com data (`docs/DIARIO-2026-08-13.md`, §1) e a razão entre os dois valores é 2,0000 exato — não arredondamento, e sim `upsert` que nunca colidia. Um portal de transparência que conta o próprio erro compra credibilidade que nenhuma promessa compra. Use a segunda se o público já desconfia de projeto político; a primeira se o público é novo.

| Tempo | Fala | 🎥 Tela |
|---|---|---|
| 0–5 s | *(gancho)* | Portal oficial cheio de CSV, ou o painel de emendas |
| 5–18 s | "Transparência pública no Brasil não é segredo. É **excesso**. O dado tá lá — em CSV, em PDF escaneado, em três sistemas que não se falam. Publicar assim é uma forma elegante de esconder." | Scroll rápido e feio num portal real |
| 18–40 s | "Então eu juntei seis cidades num lugar só: Betim, Belo Horizonte, São Paulo, Araçuaí, Diamantina e Itinga. Contrato, licitação, obra, servidor, o que a câmara votou — e quanto sua cidade gasta por habitante." | Navegação real: cidade → contratos → um contrato → fornecedor |
| 40–52 s | "E quando alguma coisa foge do padrão, ele avisa **com o dispositivo legal junto**. Não é achismo meu: é a lei citada ali, e o link pra fonte oficial do lado." | Zoom num alerta de contrato com a base legal |
| 52–60 s | **CTA A** | Endereço na tela |

**🎥 A prova:** navegação em tempo real, sem corte, num contrato de verdade,
terminando no link que abre a fonte oficial. Corte no meio = parece mockup.

**⚠️ Não diga "seis cidades igualmente cobertas".** A cobertura é medida e é
desigual (12/08): Itinga tem **0 contratos** — lacuna de acesso, com pedido ao
TCE-MG redigido e não protocolado; Belo Horizonte tem **114 servidores
nominais** porque a fonte da prefeitura devolve o *número* de vínculos por órgão,
não os nomes. **Obras existem só em Betim (59).** Nem as rotas são iguais: são
**52 rotas fixas por cidade** no máximo, e só Betim tem as 52 — as outras cinco
ficam entre 49 e 50, porque rota sem fonte declarada não é gerada. Se o vídeo
passar por outra cidade, mostre a tela que declara a lacuna: ela existe
justamente para isso.

**⚠️ Dois blocos da fala renderizam condicionalmente.** "Custo por habitante" só
aparece quando o valor é maior que zero, e "doadores de campanha" só aparece se
houver linha no banco para aquele vereador — nenhum dos dois é garantido nas seis
cidades. **Abra a tela e confirme antes de narrar**, ou a fala promete um cartão
que o frame não tem.

---

# 2 · Congresso Nacional

**Estado real:** **5.562 proposições** acompanhadas (medido 09/08, registrado em
comentário de código; confirmado 12/08), de **seis tipos** — PL, PEC, PLP, MPV,
PDL e PLV. **7 temas** de filtro, contados hoje em `rubrica/temas.json`. **676
proposições com análise concluída — 12,2% de cobertura** (12/08). Rubrica
`rubrica.json` v1.0.0 com **24 direitos** e **17 mecanismos**; **608 itens** de
análise gravados, **nenhum sem dispositivo legal citado**. 593 parlamentares,
354 bancadas e frentes, 54 comissões. Gera ofício em **4 tipos** (apoio,
repúdio, pedido de vista, comentário técnico), em DOCX e PDF montados no
navegador.

> **🪝 Gancho (0–5 s)**
> *"Tem um projeto de lei tramitando agora sobre exatamente o assunto que você mais defende. Você não sabe qual é. Nem eu sabia."*
>
> **Alternativa:** *"Cinco mil quinhentas e sessenta e duas propostas em tramitação. Eu não li nenhuma. Uma máquina leu — e eu vou te mostrar como ela foi obrigada a provar cada coisa que disse."*
> *Rationale:* o gancho do arquivo original ("670 projetos… esse foi o volume que eu analisei") **não pode ser reciclado com o número novo**, e por duas razões medidas, não uma. Primeira: **não são "projetos de lei"** — o coletor traz seis tipos, e dizer "PL" é errado no detalhe que o público jurídico percebe. Segunda: **"analisei" é falso** — a análise concluída cobre **676 das 5.562**, 12,2%, e o número está publicado na própria tela. A alternativa acima resolve as duas virando o problema a favor: admitir que o volume é de máquina é justamente o que autoriza o resto do vídeo a falar de auditabilidade.

| Tempo | Fala | 🎥 Tela |
|---|---|---|
| 0–5 s | *(gancho)* | Lista de proposições passando |
| 5–17 s | "Acompanhar o Congresso é trabalho de gente paga pra isso. Lobby tem equipe. Movimento social tem uma pessoa cansada e um grupo de WhatsApp." | Tramitações passando rápido |
| 17–40 s | "Então tem um monitor: ele separa por **sete temas** e classifica entre **garantista** e **reducionista** — onde o texto amplia direito e onde restringe. E a régua não tá na minha cabeça: são vinte e quatro direitos e dezessete mecanismos num arquivo que a mesma página que te explica o método também lê." | Filtro por tema → uma proposição → a classificação |
| 40–53 s | "O modelo de linguagem **nunca é perguntado se é bom ou ruim**. Ele preenche um formulário e é obrigado a citar o dispositivo e o trecho literal. O rótulo é conta, feita por código. Item sem dispositivo é descartado antes de contar — e os seiscentos e oito que estão lá, todos têm." | Zoom no trecho citado embaixo da classificação |
| 53–60 s | **CTA B** ("se você acompanha o Congresso…") | Endereço |

**🎥 A prova:** abra uma proposição real e mostre **o trecho literal do projeto**
embaixo da classificação, com o dispositivo ao lado. O componente imprime, na
mesma linha: peso, direito, direção, grau, confiança, "Fundamento: {dispositivo}"
e a citação entre aspas — e o rodapé mostra "soma dos itens × score gravado",
com aviso vermelho se os dois divergirem. **Filme o rodapé.** Sem o trecho e sem
a conta batendo, a classificação vira opinião — e o vídeo inteiro depende de ela
não ser.

**⚠️ Três coisas que o vídeo não pode prometer:**

- **Votação nominal: zero linhas** no banco que gera o site (12/08). A página
  `/congresso/votacoes` existe e **abre vazia**. É a lacuna mais visível entre
  promessa e entrega do portal inteiro; repeti-la em vídeo seria piorá-la. E a
  coerência de voto do perfil de parlamentar depende dela — também não filme.
- **Não diga "analisei 5.562".** Diga "acompanho 5.562 e analisei 676, e a
  cobertura tá escrita na tela".
- **Cuidado ao filmar `/alertas`.** A base é pequena e assimétrica (12/08): dos
  676 rótulos, **350 garantista, 293 neutro, 16 reducionista, 10 fortemente
  garantista, 5 misto e 2 fortemente reducionista**. Ou seja, `/bons-exemplos`
  tem 360 casos e `/alertas` tem 18. Vender a página de alerta como o carro-chefe
  daria a impressão de um acervo que ela não tem — mostre as duas, ou mostre a de
  bons exemplos, que é onde o dado está.

---

# 3 · Judiciário

**Estado real (`apps/web/lib/judiciario/regras.json` v1.1.0 e banco, 12/08):**
7 tribunais registrados, **251 cadeiras previstas em lei**, das quais **93 estão
individuadas** e **57 têm ocupação registrada**. 252 magistrados cadastrados,
**69 com data de nascimento levantada** — e só esses 69 têm projeção de
vacância. 140 indicações registradas, das quais 88 ainda sem magistrado
vinculado: **52 dos 252** chegam à tela com quem os indicou. TJMG coberto com
**148 desembargadores**, todos com link para o currículo oficial, e **nenhum**
com cadeira ou projeção — a fonte não diz quem ocupa qual cadeira, e a tela diz
isso.

> **🪝 Gancho (0–5 s)**
> *"Pra ser indicado ao Supremo você precisa ter menos de setenta anos. Pra sair, setenta e cinco. A janela inteira é de cinco anos — e dá pra ver quem tá dentro dela."*
>
> **Alternativa:** *"A próxima cadeira do Supremo vaga em vinte e seis de abril de dois mil e vinte e oito. Não é previsão: é aniversário."*
> *Rationale:* a primeira é nova e usa **duas réguas medidas** em vez de uma — aposentadoria compulsória aos **75** (EC 88/2015 + LC 152/2015) e teto de indicação aos **70** (EC 122/2022), ambas gravadas com base legal em `regras.json`. Transformar dois artigos áridos numa janela de cinco anos prende sem exagerar em nada. **A segunda é mais forte, e é verificável**: calculei em 15/08, a partir de `etl/judiciario/etl/dados/magistrados-stf.json`, que Luiz Fux (nascido em 26/04/1953) completa 75 anos em 26/04/2028 — a primeira vacância do STF na fila. **Só use a segunda se a tela mostrar essa data logo em seguida**, senão soa vazia (mesma ressalva do arquivo original).

| Tempo | Fala | 🎥 Tela |
|---|---|---|
| 0–5 s | *(gancho)* | `/judiciario/vagas`, a fila de vacância |
| 5–20 s | "É o único Poder em que ninguém votou. E ministro sai compulsoriamente aos setenta e cinco — não é costume, é Emenda Constitucional oitenta e oito e Lei Complementar cento e cinquenta e dois. As duas estão citadas ali, no próprio app." | Zoom na régua com a base legal |
| 20–40 s | "Então dá pra saber quando cada cadeira vaga. E dá pra ver de onde cada um veio: no Superior Tribunal de Justiça, um terço vem de tribunal federal, um terço de tribunal estadual, e o resto se divide entre advocacia e Ministério Público — onze, onze, seis e cinco, que é exatamente o que dá trinta e três. Não é conta minha: é o artigo cento e quatro." | Página do tribunal → bloco de cotas com a soma batendo |
| 40–53 s | "E **eu vou te mostrar o que falta**: das duzentas e cinquenta e uma cadeiras previstas em lei, noventa e três estão individuadas aqui. A data de aposentadoria só existe pra sessenta e nove magistrados, porque data de nascimento é curadoria à mão e não terminou. Onde falta, o app escreve 'nascimento não localizado' — não chuta." | A própria tela que declara a lacuna |
| 53–60 s | **CTA B** | Endereço |

**🎥 A prova:** a soma das cotas do STJ batendo com o total de cadeiras
(11+11+6+5 = 33), com o artigo citado ao lado. É a demonstração mais barata e
mais convincente de que a régua é a lei, e não uma classificação do autor. E
mostre a tela de lacuna — **ela é a prova mais forte do vídeo, não a mais
fraca**: um app que declara cobertura parcial com número é mais confiável que um
que não declara.

**⚠️ Quatro correções obrigatórias em relação ao roteiro de 29/07:**

- **NÃO EXISTE GRAFO.** O roteiro antigo mandava filmar "o grafo de indicação,
  com as arestas acendendo". Conferido em 15/08: o que existe é uma **lista** —
  "autoridade nomeante → N de M cadeiras" (`lib/judiciario/agregado.ts`,
  `agregarPoder`). Não há componente de visualização de rede em `app/judiciario`
  nem em `lib/judiciario`. A palavra "grafo" aparece no texto de
  `/judiciario/sobre`, e **também está errada lá**. Filmar prometendo grafo e
  mostrar lista é o defeito que este arquivo inteiro existe para evitar.
- **Quem indicou quem não está filmável hoje.** Só 52 dos 252 magistrados têm o
  indicador vinculado, e o componente tem uma trava honesta: **abaixo de 1/3 de
  cobertura ele se recusa a afirmar concentração** e imprime "Cobertura
  insuficiente". Na prática, a maioria das páginas de tribunal cai nessa frase. É
  a coisa certa a fazer no código e um péssimo frame de vídeo.
- **Nunca diga "a composição dos próximos dez anos já está determinada".** Está
  determinada **para os 69**. Ficam de fora, por falta de data de nascimento, os
  148 do TJMG, 18 do TRF6, 8 do TST, 7 do STM e 6 do TSE.
- **Não repita a frase de `/judiciario/sobre`** que diz "com link para a fonte
  **em cada página**". Medido: o componente `DataCard`, que tem o botão "Ver
  fonte", **não é usado em nenhum lugar da frente**, e `nomeacoes.url_fonte`
  existe no tipo e não é renderizado. A base legal e o link de currículo estão na
  tela; o link de fonte por dado, não. A frase institucional é mais forte do que
  o código entrega — e um vídeo que a repete transporta o erro para fora.

**Nota de gravação:** `/judiciario/vagas` lê o banco, então **o que aparece no ar
depende do build ter rodado**. A fila que calculei nos arquivos estáticos em
15/08 começa assim: Og Fernandes (STJ) em 26/11/2026, Delaíde Alves Miranda
Arantes (TST) em 01/05/2027, Francisco Falcão (STJ) em 30/05/2027 — e o primeiro
do STF é Fux, em 26/04/2028. **Confira contra a tela antes de narrar qualquer
uma dessas datas.**

---

# 4 · Função social da terra — o globo 3D · **NOVO**

**Estado real (contado nos arquivos publicados em 15/08/2026):** mapa 3D em
`controlepopular.com.br/funcaosocialterra/mapa`, com **48 camadas no registro** e
**39 selecionáveis**, agrupadas em 8 assuntos. A proveniência
(`dados/proveniencia.json`, gerada 15/08 às 17:07 UTC) declara **40 camadas** —
33 automáticas e 7 manuais — **nenhuma sem origem declarada**, cada uma com
SHA-256, data e método. Somadas, **70.460 feições** contadas nos GeoJSON
automáticos. Página irmã `/funcaosocialterra/alertas` lista os alertas item a
item, e **nenhum número dela é digitado**: são contados no GeoJSON a cada build.

> **🪝 Gancho (0–5 s)**
> *"Eu rodei o cruzamento entre terra indígena e área de inundação de barragem em Minas. Deu zero. Vinte e um minutos de processador pra chegar em zero — e esse zero é a coisa mais importante que eu descobri."*
>
> **Alternativa:** *"Uma pesquisa dizia que seis barragens cruzavam a Aldeia Katurama. Fui medir de verdade: nenhuma cruza. Estão a quatrocentos e cinquenta metros da borda. Perto, e fora. E aí eu entendi que o meu alerta era cego."*
> *Rationale:* as duas contam a mesma história e as duas são medidas
> (`docs/DIARIO-2026-08-13.md` §6: 2.496 combinações, 16 TIs × 156 manchas,
> `shapely` sobre a malha completa, 21 min de CPU). **A segunda é a melhor de
> todo este arquivo**: tem antagonista (um número errado), reviravolta (a medição
> desmente) e consequência (o método muda) em 5 segundos. A primeira é mais
> segura se o público não aguentar nome próprio logo no início.

| Tempo | Fala | 🎥 Tela |
|---|---|---|
| 0–5 s | *(gancho)* | Globo girando, Aldeia Katurama em foco |
| 5–20 s | "Interseção é uma pergunta burra: ela só sabe dizer se uma coisa está **dentro** da outra. Zero interseções nunca foi zero risco. E a lei sabe disso: a Portaria Interministerial sessenta, de dois mil e quinze, manda ouvir a FUNAI quando a mineração está a menos de **oito quilômetros** da terra." | Camada de território entrando, depois a faixa |
| 20–42 s | "Então eu liguei a faixa de oito quilômetros — que **não é um círculo que eu inventei**, é camada que o órgão ambiental de Minas publica pronta. E ela enxerga **mil oitocentos e noventa e nove** processos minerários que a interseção não via. A Aldeia Katurama, que dá zero em todo alerta de sobreposição, tem **vinte minas em operação** dentro dela." | Ligar a camada de raio → os polígonos acendendo em volta da TI |
| 42–53 s | "E onde a sobreposição existe, ela aparece nominalmente. Território quilombola dentro de mancha de barragem: **seis casos**, em três territórios, sob cinco barragens. Metade deles é da Kinross, em Paracatu. Não é insinuação — tem o nome da empresa e o link pra fonte oficial do lado." | `/funcaosocialterra/alertas`, seção quilombola × mancha |
| 53–60 s | **CTA B** ("se você é da área fundiária ou de geo…") | Endereço |

**🎥 A prova:** ligue a camada de 8 km **na frente da câmera** e mostre os
polígonos aparecendo ao redor da terra indígena que dava zero. É literalmente o
argumento do vídeo acontecendo na tela. Depois clique num processo e mostre o
titular e a fase (concessão de lavra × requerimento).

**⚠️ Quatro coisas que este roteiro não pode dizer, e o motivo de cada uma:**

- **Não some "operação" com "interesse".** São categorias jurídicas distintas —
  extração autorizada × papel protocolado na ANM. Os 1.899 são a soma dos que
  **não** sobrepõem o território: 269 de operação + 1.630 de interesse, contados
  processo a processo por mim em 15/08 nos dois GeoJSON. Conferem com
  `docs/HANDOFF-ALERTA-RAIO-8KM.md`.
- **Não diga que as 6 sobreposições são "da Kinross".** Medido: são 6 pares, em
  3 territórios (AMAROS, MACHADINHO, SÃO SEBASTIÃO) e 5 barragens. **Três pares
  são da Kinross Brasil Mineração** (Paracatu) e **três são da Salitre
  Fertilizantes** (Serra do Salitre). Atribuir os seis a uma empresa é errado, e
  é o tipo de erro que destrói o projeto inteiro.
- **Não use a faixa de 8 km para falar de barragem.** Medido nas 5 barragens de
  Brumadinho: o círculo superestima a zona de autossalvamento real em **14× a
  127×** e erra a direção — inclui morro acima e exclui o vale abaixo, que é por
  onde a onda desce. Círculo não é vale.
- **A taxa de erro entra no vídeo se o vazio cadastral entrar.** Medida em
  09/08: **30,0%** (12 de 40 polígonos sorteados não se confirmaram, IC 95% de
  18,1% a 45,4%), causa única identificada — faixa de estrada entrando no
  polígono. A correção **já existe no pipeline e ainda não está no dado
  publicado** (`correcaoNoDadoPublicado: false`). Se a fala citar o vazio
  cadastral sem citar a taxa, o vídeo faz o que o portal se recusa a fazer.

---

# 5 · Paraopeba — a reparação de Brumadinho · **NOVO**

**Estado real (contado nos arquivos em 15/08/2026):** `/paraopeba`, com **8
páginas** — hub, entenda, clipping, linha do tempo, quem atua, auxílio,
documentos e biblioteca. **149 notícias** no clipping geral (08/04/2024 a
30/07/2026); **23 marcos** na linha do tempo; **18 órgãos e organizações** em
5 categorias; **9 pagamentos** mensais do Novo Auxílio Emergencial (dez/2025 a
ago/2026); **471 documentos** do processo publicados, de **7.107** no acervo —
**6,6%**, e a tela publica essa fração; **597 publicações** na biblioteca das
assessorias (AEDAS 435, Guaicuy 162), gerada 15/08 às 17:13 UTC; **46 itens** de
clipping de 3 assessorias técnicas e **59** de 3 instituições de justiça; **15
verbetes** e **9 perguntas**; **36 obras de reparação** mapeadas no globo
(22 áreas + 13 pontos + 1 linha). O radar diário roda em janela de 45 dias e
trouxe **14 notícias** de 3 fontes.

> **🪝 Gancho (0–5 s)**
> *"Eu montei um acervo sobre a reparação de Brumadinho. Levei meses. E hoje eu descobri que a linha do tempo dele não tinha o rompimento da barragem."*
>
> **Alternativa:** *"Duzentos e setenta homicídios qualificados. É assim que a denúncia do Ministério Público chama o que aconteceu em Brumadinho. Sete anos depois, quantas famílias foram reparadas? Ninguém publica isso num lugar só."*
> *Rationale:* **use a primeira.** É o gancho mais honesto e mais incomum de
> toda a série — o autor abrindo com o próprio defeito. E é verdade medida com
> hora: até **15/08/2026 às 14:51** (commit `96de91e`) a `MARCOS_PARAOPEBA`
> começava em **14/03/2025**, na ação civil pública contra o corte do auxílio;
> quem abria a linha do tempo via o processo começar pela *reação*, sem o fato
> que a originou. Os seis marcos anteriores a 2025 entraram naquele commit, item
> a item — 17 + 6 = 23 — **e o rompimento é o primeiro deles**. A segunda
> alternativa fica como reserva e **exige a formulação exata acima**: ver a
> ressalva sobre 270 × 272 no fim deste roteiro.

| Tempo | Fala | 🎥 Tela |
|---|---|---|
| 0–5 s | *(gancho)* | A linha do tempo, com 25/01/2019 na primeira posição |
| 5–20 s | "Um acervo sobre a reparação que não continha o rompimento tinha um buraco no meio. E o buraco não era falta de dado: o marco existia numa outra estrutura do mesmo arquivo, com outro nome. **Método que ninguém confere é método que envelhece sozinho.**" | Rolagem da linha do tempo, de 2019 até 2026 |
| 20–42 s | "O que tem aqui: a linha do tempo do processo, do rompimento à ADPF no Supremo. Cento e quarenta e nove notícias desde abril de dois mil e vinte e quatro. Os pagamentos do auxílio emergencial, mês a mês. E os órgãos e organizações que atuam na reparação — a maioria deles sem entrada em nenhum outro lugar do portal." | Navegação: linha do tempo → clipping → auxílio → quem atua |
| 42–53 s | "E tem a biblioteca das assessorias técnicas: quinhentas e noventa e sete publicações que as organizações que acompanham os atingidos produziram, num lugar só. Mais um glossário — porque 'PNAB', 'NAE' e 'IAC dezoito' são as palavras que decidem a vida de quem tá lá, e não são palavras de gente." | Biblioteca com filtro → um verbete do glossário |
| 53–60 s | **CTA A** | Endereço |

**🎥 A prova:** role a linha do tempo inteira de uma vez só, de 2019 a 2026,
**sem corte**. O gancho promete um buraco tapado; a rolagem contínua é a única
coisa que prova que ele foi tapado.

**⚠️ Quatro ressalvas de gravação:**

- **Três textos do portal ficaram para trás da correção das 14:51, e os três
  aparecem em tela.** Medidos em 15/08: `apps/web/lib/zonas.ts` ainda diz "os 17
  marcos" no card da home; `apps/web/app/paraopeba/page.tsx` ainda descreve a
  linha do tempo como indo "do corte de 50% do auxílio, em março de 2025" em
  diante; e `apps/web/lib/paraopeba/educacao.ts` ainda afirma "o portal já tem 17
  marcos". A página `/paraopeba/linha-do-tempo` em si **está certa** e já fala do
  rompimento. **Corrija os três antes de gravar** — ou o vídeo cujo gancho é
  "descobri um buraco e tapei" mostrará, no frame seguinte, o texto antigo.
- **O número de mortes tem duas versões no repositório, e isso não é detalhe.**
  Medido: `linha-do-tempo.ts` traz "272 vidas perdidas" (texto reproduzido do
  painel-fonte) e a página de `/paraopeba` traz "270 mortes". A denúncia do MPMG
  é por **270 homicídios qualificados**. **Se o vídeo citar um número, cite 270 e
  amarre à denúncia** — é a única formulação em que as duas fontes concordam.
  Errar o número de mortos de um crime deste tamanho é o pior erro possível.
- **Não prometa cobertura judicial em tempo real.** O radar declara a própria
  lacuna: TJMG e MPMG estão fora porque os endereços de RSS dos dois respondiam
  **HTTP 404 em 14/08/2026**. Decisão judicial chega ali pela imprensa, com o
  atraso dela.
- **Os números-resumo do painel-fonte não entram.** Três deles já existem no
  portal **com valores mais novos e diferentes** — o painel traz "R$ 6,8 bi
  pagos" onde o portal registra "R$ 21 bilhões+". Citar os antigos rebaixaria
  dado atual. Se o vídeo precisar de valor agregado, tire da tela do portal, e
  diga que é valor reproduzido da fonte, não cálculo do Controle Popular.

---

# 6 · Direitos em Movimento — a faixa transversal · **NOVO**

**Estado real (contado em 15/08/2026):** `/direitos-em-movimento`, com quatro
portas — que lei protege, onde buscar ajuda, como pedir informação, como
denunciar. **34 itens confirmados** na rede de proteção (25 organizações e
serviços + 4 canais estaduais de LAI + 5 federais), cobrindo **11 necessidades**,
e **10 itens publicados como NÃO verificados**, cada um com a nota do que falhou
e a data da última tentativa. O facilitador tem **9 passos** e **6 perfis de
roteamento** determinísticos. **Três telefones de urgência (190, 180, 100) vêm
antes de qualquer explicação na página.**

> **🪝 Gancho (0–5 s)**
> *"Você sofreu uma violação de direito. Agora me diz: é Defensoria, Ministério Público, Conselho Tutelar, delegacia comum ou delegacia especializada? Ninguém sabe. E o site que devia te dizer isso tá fora do ar desde ontem."*
>
> **Alternativa:** *"Eu publiquei uma lista de onde buscar ajuda em Minas. Dez itens dessa lista estão marcados como 'não consegui confirmar'. Eu deixei eles lá de propósito, e vou te explicar por quê."*
> *Rationale:* a primeira nomeia a paralisia real de quem precisa e termina com
> uma piada amarga que qualquer pessoa reconhece. **A segunda é mais forte para
> público que já desconfia** — anunciar o que **não** foi confirmado é o oposto
> do que todo diretório de serviços faz, e é verdade medida: dos 13 itens
> pendentes, 2 foram resolvidos na reconferência de **14/08/2026** e 10 seguem
> publicados como pendentes, com a nota de cada um. Prefira a segunda se o vídeo
> for para movimento social ou defensoria; a primeira para público amplo.

| Tempo | Fala | 🎥 Tela |
|---|---|---|
| 0–5 s | *(gancho)* | Tela inicial de Direitos em Movimento |
| 5–18 s | "Isso aqui **não é mais uma frente do portal**. É o que você faz com o que achou nas outras. Você não devia precisar saber em qual aba do site mora a resposta pra uma coisa que aconteceu com você." | As quatro portas: lei, ajuda, informação, denúncia |
| 18–40 s | "Você responde nove perguntas — quando foi, se ainda tá acontecendo, quem violou, que prova você tem — e ele monta o documento e diz **para onde levar**. Envolveu criança, o Conselho Tutelar tem plantão. Foi agente do Estado, não é caso pra resolver com a corporação dele: é Ministério Público e Defensoria. Cada sugestão vem com o motivo escrito do lado." | Entrevista sendo preenchida → sugestão com o motivo |
| 40–53 s | "E olha o detalhe que decide tudo: **não existe botão de enviar. Só de baixar.** Eu não recebo relato de violação de direito humano, porque não construí para onde ele iria. O documento nasce no seu navegador e morre aí." | **Modo avião ligado**, o facilitador funcionando até o download |
| 53–60 s | **CTA A** | Endereço |

**🎥 A prova:** **ative o modo avião na frente da câmera** e vá até o fim, até o
arquivo baixar. Essa é a única prova que vale para "não sai do seu aparelho" — e
aqui ela é literal e verificável no código: uma varredura por `fetch`,
`XMLHttpRequest`, `sendBeacon` e `axios` em `lib/denuncia/` e em
`app/direitos-em-movimento/` devolve **zero ocorrências**, e não existe rota de
API que receba denúncia. Não há caminho de rede possível para o texto.

**Segundo frame que vale filmar:** o botão **"Apagar tudo agora"**, sempre
visível, sem confirmação de duas etapas. O motivo está escrito no código —
*apreensão de aparelho não dá tempo para isso* — e o rascunho local é opt-in e
expira em 24 h. É o tipo de decisão que nenhum concorrente demonstra porque
nenhum a tomou.

**⚠️ Três coisas que o roteiro não pode fazer:**

- **Nunca diga "denúncia anônima".** Medido: a palavra "anônimo" **não aparece
  em lugar nenhum** do facilitador, e é correto que não apareça. O nome é campo
  opcional (em branco, o documento imprime "Não identificado"), mas quem leva o
  documento à Defensoria ou à delegacia é a pessoa — e a anonimidade *ali* não
  depende do portal. A formulação segura, e verdadeira, é a do roteiro:
  **"o portal não pede seu nome e não recebe nada do que você escreve"**.
- **Não chame de frente, e não chame de canal.** A home estampa "Transversal às
  seis frentes", por decisão registrada do dono em 13/08. E não é canal de
  denúncia: **é um gerador de documento**. Chamar de canal faria alguém escrever
  um relato esperando que ele chegasse a alguém.
- **Não prometa cobertura estadual.** O roteamento só cita órgão catalogado em
  `redeProtecao.ts`, e o próprio código registra que o MPMG/CAOMA **ficou de fora
  por não estar catalogado** — só CAODH, CAODCA, CAOVD e CAOIPCD estão. A regra
  do projeto é "órgão não confirmado não é publicado", e o vídeo herda a regra.

---

## Guia de produção (comum aos seis)

- **Ritmo:** ~2,4 palavras por segundo em português falado. Cada roteiro está
  entre 130 e 155 palavras. Se você fala rápido, sobra tempo **para respirar no
  gancho** — não para acrescentar frase.
- **Legenda queimada obrigatória.** Boa parte assiste sem som, e os seis
  roteiros dependem de números e nomes próprios.
- **Nunca mostre mockup.** Os seis vendem "isto funciona de verdade", e as três
  frentes novas têm tela real — não há desculpa aqui. Uma tela falsa destrói a
  tese inteira da série, e neste projeto destruiria também o argumento do
  produto.
- **Nunca leia um número de cabeça.** Leia o número **que está na tela naquele
  frame**. Se o card da home e a página interna divergirem — e em 15/08
  divergiam, no caso dos marcos do Paraopeba —, o vídeo mostra a divergência
  para todo mundo.
- **Ordem de publicação sugerida:** 4 (globo) → 1 (Cidades) → 5 (Paraopeba) →
  6 (Direitos em Movimento) → 2 (Congresso) → 3 (Judiciário). Começa pelo mais
  visual, emenda no mais concreto, e deixa os dois de nicho para quando já
  houver público.
- **O que dá para testar:** gancho A × B com mesmo corpo e mesmo CTA; e CTA A × C
  nos roteiros 4 e 6. **Não mude gancho e CTA no mesmo vídeo** — senão não se
  sabe o que moveu o quê.

---

## Ganchos que eu descartei, e por quê

Esta seção é parte do documento, não apêndice: registrar o que **não** virou
roteiro evita que a próxima rodada gaste tempo redescobrindo o mesmo obstáculo.

| Gancho | Situação medida | Veredito |
|---|---|---|
| **Belo Horizonte pontua 0,00 "risco muito baixo" com 389.218 pessoas em área de risco** | Medido em 15/08 e documentado em `docs/CLIMA-ADAPTABRASIL-E-INMET.md` §3.2 — e é forte: só BH e Funilândia zeram entre as 853 cidades de MG, com ameaça 0,86, exposição 0,91 e domicílios em risco no teto (1,00). Mas `apps/web/data/risco-climatico.json` foi **coletado e não carregado**; o plano marca o item como 🟡 | **Descartado por falta de tela.** Não há captura possível. É o melhor gancho não usado deste arquivo — vira vídeo próprio no dia em que a página existir |
| **ComunicaBR: 39% dos itens vêm vazios, e quatro categorias vêm zeradas em todos os municípios** | Medido em 15/08 (`docs/COMUNICABR-COLETA-MG.md`): 106.446 de 174.012 itens vazios; `mulheres` 0 de 100, `desenvolvimento-produtivo` 0 de 30, `minha-casa-minha-vida` 0 de 15, `governo-digital` 0 de 10 — idênticos nos 5 municípios testados, portanto **lacuna da fonte federal, não da cidade**. O próprio documento fecha com "ligar na tela" como pendência | **Descartado por falta de tela**, mesma razão. E este exige cuidado extra de tom: o achado acusa o governo federal de não publicar, não a prefeitura de esconder — inverter isso seria injusto e errado |
| **"O portal cobre Minas Gerais inteira"** | As camadas do globo são estaduais, mas o vazio cadastral cobre **2 regiões de estudo** e a legislação municipal cobre **6 dos 854 municípios** — declarado na própria tela | **Descartado por ser falso.** A tela diz a cobertura; a fala não pode dizer outra |
| **"Zero barragens da FEAM neste município"** como afirmação | O coletor documenta que sua cobertura é barragem de mineração e indústria fiscalizada pela FEAM — não cobre abastecimento, irrigação nem hidrelétrica | **Descartado.** "Zero barragens da FEAM" não é "nenhuma barragem no município", e um vídeo não tem espaço para essa nota de rodapé |
| **Frente Ambiental (roteiro próprio)** | É a frente com mais número medido do portal, e é **exatamente a rota cujo deploy está travado** pelo payload de 35,5 MiB | **Adiado, não descartado.** Escrever roteiro para a única tela que não pode ser gravada seria trabalho para a gaveta |
| **"Quem indicou quem" no Judiciário** | Existe como **contagem por autoridade nomeante**, não como grafo; e a cobertura é de 52 dos 252 magistrados, abaixo do 1/3 que o próprio componente exige para afirmar concentração | **Descartado por não ser filmável.** O roteiro 3 fica com vacância e cotas, que estão completas |
| **Voto nominal do Congresso** | A página existe e a tabela tem **zero linhas** (12/08) | **Descartado.** Era função anunciada no roteiro de 29/07 e continua sem dado |
| **Qualquer número "de hoje" que venha do banco** | O acervo do Congresso, os alertas por cidade, a cobertura da análise, as vacâncias projetadas em `/vagas` — todos saem do Postgres. A Neon está em **HTTP 402 até 01/09** e o banco de build é local à máquina do dono | **Não medível nesta sessão.** Por isso todo número deste arquivo carrega a data em que foi medido, e os de 09/08 e 12/08 estão marcados como tal em vez de apresentados como atuais |

---

## O que convém corrigir no portal ANTES de gravar

Achados de medição desta rodada, não do roteiro — mas todos aparecem em tela e
sabotariam um vídeo que promete tela real.

| Onde | O que está errado | Medido |
|---|---|---|
| `apps/web/lib/zonas.ts` | Card da home diz "os **17** marcos"; são **23** | 15/08 |
| `apps/web/app/paraopeba/page.tsx` | Cartão do hub descreve a linha do tempo começando em março de 2025; ela começa em **janeiro de 2019** | 15/08 |
| `apps/web/lib/paraopeba/educacao.ts` | Comentário afirma "o portal já tem 17 marcos" | 15/08 |
| `apps/web/app/judiciario/sobre/page.tsx` | Diz "monta o **grafo** de poder de indicação" — o que existe é uma lista; e diz "com link para a fonte **em cada página**", enquanto o componente `DataCard` (o do botão "Ver fonte") **não é usado em lugar nenhum** da frente | 15/08 |
| `docs/APRESENTACAO.md` | Abre a seção 2 com "**as cinco frentes**"; são seis desde que o Paraopeba publicou | 15/08 |

Os três primeiros são de um dia: a correção da linha do tempo entrou às 14:51 de
15/08 e três textos ficaram para trás dela. Os dois últimos são mais antigos e
mais graves, porque o do Judiciário **promete procedência que a tela não
entrega** — a única classe de erro que este portal trata como inaceitável em si
mesmo.

---

## Relacionados

`docs/APRESENTACAO.md` (os números do banco, 12/08) ·
`docs/HANDOFF-ALERTA-RAIO-8KM.md` (a faixa de 8 km) ·
`docs/HANDOFF-PAYLOAD-LEGISLACAO.md` (por que o deploy trava) ·
`docs/DIARIO-2026-08-13.md` (o erro de R$ 597 mi e o zero medido) ·
`docs/CLIMA-ADAPTABRASIL-E-INMET.md` · `docs/COMUNICABR-COLETA-MG.md` ·
`docs/PLANO-2026-08-15.md` §N6 (o pedido que originou este arquivo)
