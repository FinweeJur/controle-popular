# Plano — Frentes "Nossos" + Painéis-Sanfona + Seu Nonô (v9)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-02
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [RETROSPECTIVA-2026-09](../planos/Kimi_Agent_Retrospectiva%20do%20Projeto/repo-controle-popular/docs/historico/RETROSPECTIVA-2026-09.md), [PLANO-COPY-VOZ](../planos/Kimi_Agent_Retrospectiva%20do%20Projeto/repo-controle-popular/docs/planos/PLANO-COPY-VOZ.md), [PLANO-EXPANSAO-SUBFRENTES](../planos/Kimi_Agent_Retrospectiva%20do%20Projeto/repo-controle-popular/docs/planos/PLANO-EXPANSAO-SUBFRENTES.md), [PLANO-SEU-NONO-NOTEBOOKLM](./PLANO-SEU-NONO-NOTEBOOKLM.md), [PRODUTO](../01-produto/PRODUTO.md), [AGENTS](/AGENTS.md)
> **Palavras-chave:** nossos rios, nossas serras, animais, territorios, nossa gente, paineis, sanfona, sidebar, dialogo entre frentes, interdisciplinar, seu nono, avatar, voz mineira, poemas

## ✅ O que este plano resolve

O portal tem 6 frentes separadas. 💔

O dado mora numa frente e o usuário não sabe que a outra frente fala do mesmo assunto. 😕

Este plano faz o portal **conversar consigo mesmo**. 🗣️

Transforma as frentes em **painéis-sanfona integrados**. 🪗

E cria as **subfrentes "Nossos" dentro do ONSA** (Meio Ambiente): rios, serras, animais, territórios e nossa gente. 🌊⛰️🐆🌱👥

**Onde mora:** ONSA · Observatório Nacional Socioambiental = a página de meio ambiente. 🏞️

**Tags:** `natureza` e `ecossistema` marcam cada página nova. 🏷️

Tudo com **cruzamento dano ambiental × efeito social**. ⚖️

## 🎯 Objetivo em 5 linhas

1. **Um dado, várias frentes.** A página agrega o que as outras frentes dizem sobre aquele lugar/tema, em painéis que expandem.
2. **O dado se sugere.** O portal mostra proativamente o que está relacionado — sem o usuário precisar adivinhar o caminho.
3. **Frentes "Nossos".** Páginas por rio, serra, vale e cerrado, com a nossa gente no centro.
4. **Seu Nonô com cara e voz.** Avatar novo (imagem da retrospectiva do Kimi) + voz animada, positiva, leve e bem mineira.
5. **Poesia espalhada, nenhuma cortada.** Todo poema do acervo encontra uma casa — mesmo que feche uma página com tema vizinho.

## 📜 Regras herdadas (não negociar)

- Número vem do dado; modelo só embrulha. 🧮
- Lacuna é informação. 🕳️
- Ressalva viaja colada ao número. 📎
- Nunca dois dados verdadeiros lado a lado levando a conclusão falsa. 🚫
- Humor só sobre burocracia abstrata; nunca sobre pessoas, vítimas ou lutas. 😄→🙅
- Paraopeba e card de dado: sobriedade total. 🤍
- Epígrafe é voz atribuída: autor, obra e ano. ✍️
- **Poemas do acervo: nenhum cortado.** Distribuir por inteiro ou por verso, pelas subfrentes e páginas principais. 🧵

## 🗺️ As frentes "Nossos" (novas)

Tudo vive **dentro da frente ONSA** (`/ambiental`), que é a página de meio ambiente. 🏞️

Cada página recebe as tags `natureza` + `ecossistema`. 🏷️

| Subfrente | Rota (sob `/ambiental`) | O que conta | Exemplo de páginas |
|---|---|---|---|
| Nossos Rios | `nossos-rios` | Cada rio com bacia, qualidade, barragens, mineração, atingidos | Rio Paraopeba, Rio Doce, Rio Jequitinhonha, Rio das Velhas |
| Nossas Serras | `nossas-serras` | Serra, parque, unidade de conservação, mineração, turismo, comunidades | Serra do Espinhaço, Serra do Cipó, Serra da Piedade, Serra da Barriga |
| Nossos Animais | `nossos-animais` | Fauna, espécies ameaçadas, atropelamento, tráfico, desmatamento | Peixe-boi, lobo-guará, muriqui, arara-azul |
| Nossos Territórios | `nossos-territorios` | Terra, quilombo, indígena, assentamento, cerrado, vale | Vale do Jequitinhonha, Cerrado Mineiro, quilombos, terras indígenas |
| Nossa Gente | `nossa-gente` | Quem vive ali: saúde, renda, moradia, cultura, impacto social | Comunidades atingidas, ceramistas do Vale, ribeirinhos, cidades |

**Regra de ouro:** toda página ambiental termina com o bloco **"E o social?"** 👥

Mostra como o dano ambiental afeta a vida das pessoas: saúde, emprego, moradia, cultura, renda. 📉

## 🪗 Painéis-sanfona e o diálogo entre frentes

**Ideia central:** uma frente não é uma página isolada. 🧩

É um **painel expansível** dentro de um contexto maior. 🪗

### Como funciona

1. O usuário abre a página de um **lugar ou tema** (ex.: cidade de Diamantina). 🏘️
2. A página mostra os dados dela. 📊
3. Ao lado, um **painel "Também acontece por aqui"** sugere o que as OUTRAS frentes dizem sobre Diamantina. 💡
4. Clicou no painel? Ele expande como sanfona e mostra a **sidebar de diálogo**. 🪗
5. A sidebar conecta ao dado correspondente da outra frente. 🔗

### Exemplo real (Diamantina)

- Frente atual: **Cidades** → `/diamantina`. 🏛️
- Sidebar sugere: **Parque Estadual do Biribiri** 🏞️
  - Frente **Ambiental**: unidade de conservação, licenças, barragens na região. 🌳
  - Frente **Executivo estadual**: projeto de privatização/parceria em tramitação. 🏛️
  - Frente **Congresso/ALMG**: projetos de lei que citam Diamantina ou o parque. 📜
- Um clique leva o usuário ao dado exato na outra frente. ✅

### Modelo de dados (mínimo)

```ts
interface DialogoEntreFrentes {
  de: string;            // rota de origem, ex.: /diamantina
  topico: string;        // ex.: "Parque Estadual do Biribiri"
  pontes: {
    frente: string;      // ex.: ambiental, executivo, congresso
    rota: string;        // ex.: /ambiental/uc/biribiri
    rotulo: string;      // o que o usuário vê no botão
    razao: string;       // por que esta ponte existe (editorial)
  }[];
}
```

A fonte única vive em `lib/dialogos.ts`, no mesmo padrão de `lib/zonas.ts`. 🗄️

### Como o dado se sugere (proativo e simples)

- **Topônimos:** a página sabe o município, o rio, a serra, o bioma. 🗺️
- **Regras de associação:** lugar × tema × frente, com razão editorial registrada. 📋
- **Deep link:** cada ponte abre a rota certa, sem busca. 🎯
- **Idioma de gente:** botão diz "Ver o que o governo estadual faz com o Biribiri", não "crosslink entidade 42". 👇

## 🤠 Seu Nonô — avatar e voz

### Avatar

A imagem de perfil vem da retrospectiva do Kimi:

📁 `docs/planos/Kimi_Agent_Retrospectiva do Projeto/Gemini_Generated_Image_54tagj54tagj54ta.jfif`

Micro-etapa: converter para o formato do app, otimizar (alvo < 200 KB), colocar em `apps/web/public/seunono/avatar.webp` e trocar o ícone `Bot` do widget (lucide) pela imagem. 🖼️

### Voz

**Persona:** um mineiro animado, positivo e levemente engraçado. 😄

Que conhece o país e senta do seu lado pra olhar a tela junto. 🪑

**Trilhos da voz:**

- Animada, positiva, leve. ☀️
- Humor mineiro: "uai", "sô", "trem", "cê viu", "mode que", "num vai dar não". 🗣️
- Humor só contra a papelada e a burocracia. 📄
- Zero humor sobre vítimas, lutas, povos, empresas específicas ou tragédias. 🤐
- Termina com ferramenta: "apertou, achou, ó aqui o trem". 🛠️
- Fala a língua do dado: número com fonte, do mesmo jeito do portal. 🔢

**Fonte da persona:** [PLANO-COPY-VOZ](../planos/Kimi_Agent_Retrospectiva%20do%20Projeto/repo-controle-popular/docs/planos/PLANO-COPY-VOZ.md), capítulo "Princípio de voz". 🎙️

## 🧵 Poemas: distribuição (nenhum cortado)

A regra do dono é clara: **não cortar nenhum poema do acervo**. 🚫✂️

Mesmo que o poema feche uma página com tema ligeiramente diferente. ✅

| Poema | Casas possíveis |
|---|---|
| Poema 1 — catálogo de exemplos | Ação cidadã, manifestos, Judiciário (Luís Gama, Esperança Garcia), Congresso (Lélia) |
| Poema 2 — "Herança" (BH) | Cidade de BH, Capítulo Cidades, home |
| Poema 3 — "Passado e futuro" (Vale) | Frente **Nossos Territórios** (Vale do Jequitinhonha), Terras, Araçuaí, Itinga, Diamantina |
| Versos soltos do acervo (Marielle, Mãe Bernadete, Nego Bispo) | Registro reverente: manifesto e ação cidadã, longe de humor |
| Guimarães Rosa (lote novo) | Congresso, Ambiental, Terras, home |

**Como espalhar sem inflar:** a página principal do hub recebe o poema inteiro ou a estrofe-chave; as subfrentes recebem versos que dialogam com o tema; nenhum verso fica órfão. 🌱

**Encerrar com poesia:** se a página terminou sem poema e há um poema de tema vizinho, ele pode fechar a página como "canto de despedida" — nunca como piada. 🌇

## 🪜 Micro-etapas — do menor custo ao maior

Custo em esforço de agente/horas. P = pequeno, M = médio, G = grande.

### Bloco A — Fundação barata (P)

| # | Micro-etapa | Custo | Entrega |
|---|---|---|---|
| A1 | Criar `lib/dialogos.ts` com o modelo `DialogoEntreFrentes` + 5 pontes de exemplo (Diamantina × Biribiri) | P | Contrato de dados das pontes |
| A2 | Criar componente `PainelDialogo` (sanfona simples) com a sidebar de sugestões | P | Primeira sanfona funcionando |
| A3 | Instalar o painel em `/diamantina` como prova | P | Exemplo real no ar |
| A4 | Converter imagem do Seu Nonô + colocar avatar no widget | P | Avatar no ar |
| A5 | Copiar `lib/subfrentes.ts` (31 telas) e aplicar trilha `FRENTE → SUBFRENTE` | P | Navegação sem página órfã |

### Bloco B — Voz e poesia (P–M)

| # | Micro-etapa | Custo | Entrega |
|---|---|---|---|
| B1 | Registrar a persona mineira do Seu Nonô em `docs/planos` (este plano é o rascunho) | P | Voz definida por escrito |
| B2 | Escrever 10 respostas-exemplo do Seu Nonô com a voz (uai, sô, positivo, leve) | P | Golden set da voz |
| B3 | Aplicar as 12 epígrafes + versos do acervo nas páginas principais (home, hubs, sobre) | M | Voz v7 no ar |
| B4 | Distribuir os 3 poemas + versos soltos pelas subfrentes e páginas principais, sem cortar nenhum | M | Nenhum poema órfão |
| B5 | Microcopy mineira de estado (lacuna, 404, CSV, alerta) | P | Tom consistente |

### Bloco C — Subfrentes "Nossos" dentro do ONSA (M–G)

O hub vive em `/ambiental/nossos`, sob o ONSA. 🏞️

| # | Micro-etapa | Custo | Entrega |
|---|---|---|---|
| C1 | Hub `/ambiental/nossos` com os 5 cards (rios, serras, animais, territórios, gente) | M | Porta das subfrentes |
| C2 | `lib/nossos.ts`: registro dos lugares (rios, serras, vales, cerrados) com tags `natureza` + `ecossistema` | M | Fonte única de lugares |
| C3 | Página do **Rio Paraopeba** (primeira de Nossos Rios), reusando dados de `/paraopeba` | M | Primeira página de rio |
| C4 | Página da **Serra do Espinhaço** (primeira de Nossas Serras), reusando UC/licenças | M | Primeira página de serra |
| C4b | Registrar rótulo "ONSA · Meio Ambiente" (ou "ONSA · Observatório Nacional Socioambiental") nas páginas novas + tags `natureza`/`ecossistema` | P | Identidade do ONSA |
| C5 | Bloco "E o social?" com dados de saúde/renda/moradia por município (SIH-SUS, Censo, AdaptaBrasil) | M | Dano ambiental × social |
| C6 | Página do **Vale do Jequitinhonha** (territórios) + bloco de nossa gente (ceramistas, cultura) | M | Território + gente |
| C7 | Modelo de página genérico: rio, serra, vale, cerrado (uma rota dinâmica por tipo) | G | Escala para N lugares |
| C8 | Segunda leva: Rio Doce, Rio das Velhas, Serra do Cipó, Serra da Piedade | G | Cobertura cresce |

### Bloco D — Painéis-sanfona em escala (M–G)

| # | Micro-etapa | Custo | Entrega |
|---|---|---|---|
| D1 | Regras de associação lugar × tema × frente em `lib/dialogos.ts` (tabela editorial) | M | Pontes com razão |
| D2 | Instalar `PainelDialogo` nos 6 hubs de frente | M | Portal conversa consigo |
| D3 | Pontes entre frentes já mapeadas no PLANO-EXPANSAO-SUBFRENTES (7 pontes) | M | Ver também vira diálogo |
| D4 | Deep link das pontes para a rota certa + teste de link | M | Clicou, achou |
| D5 | Painel "Também acontece por aqui" nas páginas de cidade (6 municípios) | G | Proatividade por cidade |
| D6 | Painel nas páginas de Nossos (rios/serras) | G | Proatividade por lugar |

### Bloco E — Qualidade e medição (M)

| # | Micro-etapa | Custo | Entrega |
|---|---|---|---|
| E1 | Testes de `lib/dialogos.ts` e do componente (links válidos, razão presente) | M | Não quebra ponte |
| E2 | Auditoria: toda ponte com rota real (link check) | M | Sem link morto |
| E3 | `npm test` + `tsc` verdes + payload dentro do teto | M | Regressão |
| E4 | Contraste/teclado/leitor de tela nos painéis-sanfona | M | Acessibilidade |
| E5 | Guarda de dado pessoal sobre os novos JSONs | P | LGPD |

## 📐 Critérios de aceite

1. De Diamantina, chego ao Biribiri na frente ambiental e ao PL no Congresso em **no máximo 2 cliques**. 🖱️
2. Toda página "Nossos" termina com o bloco "E o social?". 👥
3. Nenhum poema do acervo fica fora de uma página. 📖
4. Seu Nonô responde com avatar + voz mineira, e toda resposta IA mantém ressalva + citação. 🤖
5. Número segue com fonte; lacuna segue com nome. ✅

## 🧨 Riscos e dependências

- Neon em HTTP 402 até 01/09 (já passou — remeça antes de decidir). ⚠️
- Build só no home-pc; máquina de dev não builda. 🏗️
- Banco local com cargas novas (Rouanet, ComunicaBR, repasse) para medir payload. 🗄️
- `AI_API_KEY` nunca vai para o repo. 🔐
- Repo precisa de sanitização antes de escalar (ver [PROPOSICAO-SANITIZACAO-REPO](./PROPOSICAO-SANITIZACAO-REPO.md)). 🧹

## 📚 Origem

Este plano nasce da leitura de README, ESTADO (Estágio), DESENVOLVIMENTO e dos documentos da retrospectiva do Kimi (RETROSPECTIVA-2026-09, PLANO-COPY-VOZ, PLANO-EXPANSAO-SUBFRENTES, PLANO-SEU-NONO-NOTEBOOKLM). Números deste plano são placeholders até binding nas constantes medidas.
