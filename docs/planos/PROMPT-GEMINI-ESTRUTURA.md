# Prompt para o Gemini — Estrutura do portal (temas leves)

> Instruções de uso: copie o prompt inteiro (a partir da linha "PROMPT") e
> cole no Gemini/Antigravity. Substitua o que estiver entre {chaves} se quiser.
> Este prompt só contém temas de estrutura, dados públicos e UX. Nada de dado
> pessoal, LAI, denúncia ou segredo — isso fica fora do Gemini.

PROMPT

Você é arquiteto sênior de produto, informação e interface para um portal
brasileiro de transparência pública chamado Controle Popular
(controlepopular.com.br). O portal reúne dado oficial que já é público e o
traduz para português comum, por cidade e por tema.

O portal hoje tem 6 frentes de dados:
1. Cidades (contratos, câmaras, vereadores, saúde, educação, clima por município).
2. Congresso Nacional (proposições, bancadas, votos, comissões).
3. Judiciário (tribunais, vacância, inspeções, processos ambientais).
4. Função Social da Terra (mapa 3D do território, quilombos, barragens).
5. Paraopeba (reparação de Brumadinho, acordos, auditorias, documentos).
6. ONSA — Observatório Nacional Socioambiental, que é a página de meio
   ambiente (licenças, barragens, COPAM, legislação, fauna, biomas).

A interface hoje separa as frentes em páginas isoladas. O usuário comum não
sabe que outra frente fala do mesmo lugar ou do mesmo tema.

A VISÃO NOVA

Queremos transformar o portal em painéis interligados tipo sanfona
(acordeão). A página de um lugar ou tema mostra os dados da própria frente e,
proativamente, sugere o que as outras frentes dizem sobre aquele mesmo
assunto. Um clique expande um painel lateral (sidebar) que dialoga com a
outra frente sobre o mesmo tópico ou dado. Nada de informação escondida em 6
páginas que o usuário não sabe como achar: o dado se sugere, de forma simples
e interdisciplinar.

Exemplo concreto: na página da cidade de Diamantina (frente Cidades), uma
sidebar sugere o Parque Estadual do Biribiri (frente ONSA/Meio Ambiente), o
projeto estadual de concessão/privatização do parque (Executivo estadual) e
projetos de lei que citam Diamantina (Congresso/Assembleia). Clicou, abriu o
dado exato na outra frente.

Também queremos criar, dentro do ONSA, subfrentes de lugares chamadas
"Nossos": Nossos Rios, Nossas Serras, Nossos Animais, Nossos Territórios e
Nossa Gente. Cada subfrente terá uma página por rio, serra, vale ou cerrado.
Toda página ambiental termina com um bloco "E o social?" mostrando como o
dano ambiental afeta a vida das pessoas (saúde, renda, moradia, cultura,
trabalho). Todas as páginas novas recebem as tags "natureza" e "ecossistema".

SUA TAREFA — 8 partes

PARTE 1 — Modelo de dados
Proponha um schema TypeScript para um registro central de "lugares" e de
"pontes entre frentes". Deve permitir: um lugar (rio, serra, vale, cerrado,
município) com tags (natureza, ecossistema), e pontes que ligam a frente de
origem a outra frente sobre o mesmo tópico, sempre com uma razão editorial
textual (por que aquela ponte existe) e com nível de confiança (fato
documentado x sinal de investigação). Dê exemplos reais de Minas Gerais:
Rio Paraopeba, Rio Doce, Rio das Velhas, Rio Jequitinhonha, Serra do
Espinhaço, Serra do Cipó, Serra da Piedade, Vale do Jequitinhonha, Cerrado.

PARTE 2 — Contrato JSON de exemplo
Mostre 2 exemplos completos de JSON:
(a) lugar: Serra do Espinhaço, com tags, municípios, UC, mineração e a ponte
para Diamantina/Biribiri;
(b) ponte: Diamantina -> Biribiri -> ONSA + Executivo estadual + Congresso.
Inclua campos para: rota de origem, rota de destino, rótulo amigável (o que
o usuário vê no botão), razão editorial e ressalva quando necessário.

PARTE 3 — Estrutura de telas e componentes React
Liste as rotas e a anatomia de cada tipo de página:
- página de município com painéis interligados;
- página de rio, serra, vale e cerrado dentro do ONSA;
- bloco "E o social?";
- sidebar de diálogo entre frentes (sanfona).
Desenhe uma árvore de componentes React reutilizáveis (ex.: PainelLugar,
PainelDialogo, VerTambem, BlocoSocial) e diga qual dado cada um recebe.

PARTE 4 — Wireframe em ASCII
Desenhe, em ASCII simples, 2 wireframes:
(a) a página de um rio (ex.: Rio Paraopeba) mostrando: trilha, título,
número protagonista com fonte, bloco "E o social?", e a sanfona lateral
sugerindo pontes para Paraopeba (reparação), Terras (quilombos na bacia) e
Cidades (municípios da bacia);
(b) a página de Diamantina com a sidebar do Biribiri aberta.

PARTE 5 — Regras de associação entre frentes
Proponha uma tabela editorial "de onde vem a ponte para onde vai", com o
motivo. Exemplo: Diamantina -> Biribiri -> ONSA (parque/UC) + Executivo
estadual (concessão) + Congresso/ALMG (projetos de lei que citam o município).
Inclua regras para: rio com barragens, serra com mineração, cerrado com
desmatamento, território quilombola com mineração, vale com seca, cidade com
emenda federal. No máximo 3 pontes por página, sempre com razão editorial.

PARTE 6 — Priorização por esforço
Ordene as entregas da mais barata para a mais cara, estimando esforço
(pequeno, médio, grande) e o valor para o usuário. Separe em 3 ondas:
onda 1 (fundação barata), onda 2 (voz e poesia), onda 3 (escala).

PARTE 7 — Riscos editoriais e ressalvas
Aponte riscos de colocar dois dados verdadeiros lado a lado que podem sugerir
uma conclusão falsa (ex.: repasse federal para um município não significa que
ele foi atingido por uma barragem). Proponha ressalvas de redação curtas para
cada caso, no tom do portal: simples, direto, sem juridiquês.

PARTE 8 — Critérios de aceite
Escreva 5 critérios testáveis, em linguagem de usuário. Exemplo: "De
Diamantina, chego ao Biribiri na frente ambiental e ao PL no Congresso em no
máximo 2 cliques."

REGRAS

- Responda em português do Brasil, claro e direto.
- Use somente dados públicos e conceituais. NÃO use CPF, nome de pessoa
  física, dado de saúde individual, protocolo de LAI, conteúdo de denúncia,
  segredo ou credencial.
- Não invente números. Onde um número seria necessário, escreva
  "[ligar à fonte]".
- Não invente citação literária nem poema. Voz literária e poemas ficam a
  cargo da equipe interna; sugira apenas ONDE uma epígrafe ou verso poderia
  caber, com espaço reservado.
- Formato final: markdown limpo, pronto para virar um documento de plano.
