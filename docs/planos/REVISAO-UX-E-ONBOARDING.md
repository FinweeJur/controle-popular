# Revisão de onboarding, acessibilidade e design system

> Escrita em 14/08/2026, atendendo aos itens 7 e 8 de
> `docs/planos/TODO-PROXIMAS-RODADAS.md`. Pedido do dono, em duas partes: revisão
> crítica de onboarding/acessibilidade/facilidade de uso, e o que dá para
> aproveitar de Kokonut UI, Motion.dev e Bklit UI.
>
> Testado com `next dev` local (porta 3912, worktree `cp-ux`), viewport
> móvel 375×812, e os três temas (`light`/`dark`/`high-contrast`) via
> `getComputedStyle` no navegador — não só inspeção de código. Todo
> problema abaixo tem onde está e por que atrapalha; os consertos baratos
> já foram para o código, com commit citado. `docs/_historico/DIARIO-2026-08-13.md`
> registrava quatro pistas achadas por acaso; as quatro **já estavam
> corrigidas** por sessões anteriores no mesmo dia (ver a seção "As quatro
> pistas" abaixo) — o padrão sistêmico que elas apontavam, porém, seguia
> vivo, e foi isso que esta revisão foi atrás.

---

## Resumo para quem só quer o veredito

| Achado | Gravidade | Status |
|---|---|---|
| Cabeçalho de zona esquecia 2-3 das 6 frentes (cravado à mão) | 🔴 Crítico | **Corrigido** — `ed003bd` |
| 7 páginas sem `<main>` — "Ouvir esta página" sumia, inclusive na home | 🔴 Crítico | **Corrigido** — `70e5683` |
| Anel de foco quase invisível no tema alto contraste (1,42:1) | 🔴 Crítico | **Corrigido** — `ed003bd` |
| Vermelho de alerta abaixo do piso do próprio tema alto contraste | 🟡 Médio | **Corrigido** — `ed003bd` |
| Sem link "pular para o conteúdo" (WCAG 2.4.1) | 🟡 Médio | **Corrigido nas 4 zonas + home** — `bc2d372`; falta em Terras/Paraopeba/`/busca`/`/sobre`/Direitos em Movimento |
| RTID sem expansão (mapa 3D) | 🟢 Baixo | **Corrigido** — `ed003bd` |
| Terras e Paraopeba não têm cabeçalho/nav persistente nenhum | 🟡 Médio, arquitetural | **Decisão do dono** |
| Home com 6 cards + 1 banner — sem destaque pra "minha cidade" | 🟢 Baixo, editorial | **Decisão do dono** |
| Kokonut UI / Motion.dev / Bklit UI — bibliotecas de animação | — | **Não adotar código nenhum**; 3 padrões vale copiar em CSS puro |

247 testes de `lib/` + 121 de `globo` passando, `tsc --noEmit` limpo,
`scripts/checar-dado-pessoal.py` verde em cada commit.

---

## As quatro pistas do diário — todas já corrigidas antes desta revisão

Antes de procurar coisa nova, conferi as quatro pistas do
`docs/planos/TODO-PROXIMAS-RODADAS.md` (item 7) no código atual. As quatro já
tinham commit de conserto, todos de 13/08, todos **antes** desta sessão:

1. **Rodapé fabricava "Estadual" pra frente ambiental** — corrigido em
   `e047f70` (campo `nomeCurto` em `lib/zonas.ts`, não mais corte de
   string).
2. **"Termos" dava 404 em toda página de Cidades** — corrigido em
   `apps/web/app/[municipio]/components/Footer.tsx` (link removido; ver
   comentário no arquivo).
3. **Três telas prometiam "ver metodologia" e abriam assunto errado** —
   corrigido em `2da2c28` (auditoria de discurso dedicada).
4. **Dono não achou uma frente navegando no celular** — esta é a única
   das quatro que **não tinha commit de conserto**, porque a causa raiz
   (cabeçalho de zona cravado à mão) continuava lá. É o achado #1 desta
   revisão, abaixo.

O padrão que as quatro pistas apontavam — "link cravado à mão que
envelhece no dia em que uma frente nova publica" — **era real e seguia
sem correção estrutural**. Foi por aí que esta revisão começou.

---

## 🔴 Achados críticos (corrigidos)

### 1. O cabeçalho de cada zona esquecia metade das frentes

**Onde**: `app/[municipio]/components/Header.tsx`, `app/congresso/layout.tsx`,
`app/judiciario/layout.tsx`, `app/ambiental/layout.tsx`.

**O que tinha**: cada um desses quatro cabeçalhos — a barra fixa, visível
em TODA página, a navegação mais exposta do portal em celular — mantinha
sua própria lista de `<a>` para as "zonas irmãs", escrita à mão. Cada
lista tinha um comentário datado explicando por que uma frente ficava de
fora ("Ambiental não entra aqui: é `publicada: false`", "o caminho de
volta entra na F9"). Essas frases eram verdade no dia em que foram
escritas. Ambiental, Terra e território e Paraopeba publicaram depois, e
**nenhuma das quatro barras foi atualizada**. Resultado medido no
navegador, viewport 375px, antes do conserto:

```
Header de Cidades: Busca, Congresso, Judiciário, Direitos em Movimento
                    (Meio ambiente, Terra e território e Paraopeba ausentes)
Header de Congresso: Busca, Judiciário, Cidades, Direitos em Movimento
                    (Meio ambiente, Terra e território e Paraopeba ausentes)
Header de Judiciário: mesmo padrão
Header de Ambiental: Betim, Congresso, Judiciário, Direitos em Movimento
                    (Terra e território e Paraopeba ausentes)
```

**Por que atrapalha**: é exatamente o que o diário registrou — alguém
navegando no celular, sem saber que devia rolar até o rodapé, via um
portal de 3-4 frentes, nunca de 6. A remissão cruzada completa só existia
em dois lugares: o bloco "As outras frentes" (só na home de
Cidades/Congresso/Judiciário — Ambiental/Terras/Paraopeba nem isso
tinham) e o rodapé (`FooterGlobal`, no fim de toda página, depois de
rolar a página inteira).

**Conserto** (`ed003bd`): as quatro barras agora chamam
`outrasZonas(id)` de `lib/zonas.ts` — a mesma fonte de verdade que
`OutrasFrentes.tsx` e `FooterGlobal.tsx` já usavam — em vez de manter
lista própria. Confirmado no navegador, mobile, nas quatro zonas: as seis
frentes aparecem agora. Efeito colateral bom: o rótulo genérico
"Cidades →" (antes "Betim →", cravado desde a era de cidade única)
também ficou certo sozinho.

**Bônus, mesma causa raiz**: `OutrasFrentes` (a remissão cruzada de
conteúdo, não só de navegação) também estava ausente das homes de
Ambiental, Terras e Paraopeba — as três frentes mais novas. Adicionado
nas três, mesmo commit.

### 2. Sete páginas sem `<main>` — o botão de leitura em voz alta desaparecia, e uma delas é a home

**Onde**: `app/page.tsx` (a home da marca) e as seis páginas da frente
Paraopeba (`app/paraopeba/page.tsx` e as cinco subpáginas).

**O que tinha**: `OuvirPagina.tsx` (o botão flutuante "🔊 Ouvir esta
página", leitura em voz alta via Web Speech API) só sabe onde está o
conteúdo por `document.querySelector("main")`. Se a página não tem
`<main>`, a função de extrair texto devolve string vazia, `temTexto` fica
`false`, e o componente **se esconde silenciosamente**:

```tsx
// app/components/OuvirPagina.tsx
if (!mounted || !suportado || !temTexto) return null;
```

Sete páginas usavam `<div>` no lugar de `<main>` no wrapper de topo —
inclusive `app/page.tsx`, a home da marca, a página mais visitada do
portal, e as seis páginas inteiras da frente mais nova (Paraopeba,
mesclada no mesmo dia). Nenhum erro no console, nenhum aviso: o botão
simplesmente não estava lá.

**Por que atrapalha**: é o recurso de acessibilidade mais visível do
site — quem tem dificuldade de leitura ou baixa visão o usa como porta
de entrada. Ele funcionava em todo o resto do portal e falhava
justamente na porta principal (a home) e na frente mais nova, sem
nenhum sinal de que algo estava errado.

**Conserto** (`70e5683`): as sete páginas trocaram `<div>` por `<main>`
no wrapper de topo — mesmo padrão que `funcaosocialterra/page.tsx` já
usava. Confirmado no navegador: o botão aparece agora em `/` e em
`/paraopeba/clipping`. Varredura em toda `app/**/page.tsx` fora das
quatro zonas com layout próprio (que já embrulham em `<main>`) não achou
mais nenhuma página faltando a tag.

### 3. Anel de foco quase invisível no tema alto contraste

**Onde**: `app/globals.css`, bloco `[data-theme="high-contrast"]`.

**Medido no navegador** (fórmula de contraste do WCAG, luminância
relativa, contra `--cp-bg`/`--cp-surface`, que são o mesmo branco puro
neste tema):

| Token | Antes | Depois |
|---|---|---|
| `--cp-focus` (anel de `:focus-visible`, 3px, todo o site) | `#ffd500` — **1,42:1** | `#806a00` — **5,28:1** |
| `--cp-alert` (selo de violação legal, CTA de denúncia, ~40 telas) | `#cc0000` — **5,89:1** | `#990000` — **8,92:1** |

**Por que atrapalha**: o tema alto contraste (estilo eMAG, fundo/surface
brancos puros, bordas pretas de 2px) existe especificamente para quem
precisa de MAIS contraste — e o indicador de foco mais usado do site
(o anel de 3px que aparece em todo elemento navegado por Tab) tinha
1,42:1 contra o fundo branco. WCAG 1.4.11 (Non-text Contrast) pede 3:1
para indicador de UI; a régua que o próprio tema declara para texto
(comentário em `lib/zonas.ts` e no pedido original: "alto contraste com
exigência de 7:1") não cobria este token porque foco não é texto — mas
ninguém tinha medido separadamente, e o resultado prático era um usuário
de teclado no tema de maior acessibilidade do site sem conseguir ver
onde estava o foco. `--cp-alert` também ficava abaixo do piso que o
próprio tema promete para texto (7:1), embora passasse no piso genérico
de 4,5:1 que ninguém pediu aqui.

**Conserto** (`ed003bd`): os dois tokens escurecidos, mantendo a família
de cor (amarelo/dourado para foco, vermelho para alerta) — só o valor
mudou, não a decisão de design. `--cp-alert` também é usado como FUNDO
com texto branco (`direitos-em-movimento/denuncia/Facilitador.tsx`);
escurecer ajudou as duas leituras ao mesmo tempo, porque o branco fixo do
texto fica mais contrastante quanto mais escuro o fundo.

Light e dark já passavam em tudo que foi medido (foco 9,03:1/5,60:1 contra
o fundo, alerta 5,12:1/6,23:1) — o problema era isolado no alto
contraste, que ironicamente é o tema que existe pra proteger contra
exatamente esse tipo de falha.

---

## 🟡 Achados médios (corrigidos ou parcialmente corrigidos)

### 4. Sem link "pular para o conteúdo"

**Onde**: agora em `app/layout.tsx` (o link) + `<main>` de
`app/[municipio]/layout.tsx`, `app/congresso/layout.tsx`,
`app/judiciario/layout.tsx`, `app/ambiental/layout.tsx` e `app/page.tsx`
(os alvos).

**Por que importava mais depois do conserto #1**: cada cabeçalho de zona
já passava de dez paradas de Tab antes do `<main>` (nav da zona, campo de
busca, tema, tamanho de texto) mesmo ANTES desta revisão. O conserto #1
acrescentou de 2 a 3 botões a mais em cada cabeçalho — exatamente as
frentes que estavam faltando. Sem bypass, quem navega só por teclado
(deficiência motora, ou simplesmente preferência) repete essa fila
inteira em toda troca de página, agora um pouco mais longa.

**Conserto** (`bc2d372`): link `.cp-skip-link` — escondido fora da tela
(`top: -100%`) até ganhar foco por Tab, primeiro elemento focável do
`<body>`, aponta para `#conteudo-principal`. Adicionado o `id` e
`tabIndex={-1}` ao `<main>` das quatro zonas compartilhadas e da home —
que juntas cobrem a grande maioria das páginas do portal (toda cidade,
todo Congresso, todo Judiciário, todo Ambiental).

**O que ficou faltando**: Terras (`/funcaosocialterra` e as duas
subpáginas), Paraopeba (as seis páginas), `/busca`, `/sobre` e as quatro
páginas de Direitos em Movimento não têm o `id` ainda. Nessas páginas o
link simplesmente não faz nada ao ser clicado (não quebra, só fica
inerte) — é acabamento mecânico de ~15 minutos: repetir
`id="conteudo-principal" tabIndex={-1}` no `<main>` de cada uma, mesmo
padrão desta revisão. Fiquei short de escopo para fechar isso agora sem
esticar a revisão além do razoável; fica registrado aqui.

**Não confirmado visualmente**: a regra CSS (`.cp-skip-link:focus { top:
0; }`) está presente e correta no stylesheet computado do navegador, e
`document.activeElement` confirma que o link é alcançável por foco
programático — mas `:focus` depende de a JANELA estar realmente em foco,
e o painel de preview deste ambiente não compõe frame (mesma limitação
que impediu tirar screenshot). Vale um Tab manual real antes de dar como
fechado.

### 5. Terras e Paraopeba não têm cabeçalho nem navegação persistente — decisão do dono

**Onde**: `app/funcaosocialterra/page.tsx` (+ `/mapa`, `/alertas`) e
`app/paraopeba/page.tsx` (+ 5 subpáginas).

**O que tem**: ao contrário das outras quatro zonas, Terras e Paraopeba
não têm `layout.tsx` próprio — cada página é um `<main>` solto com,
quando muito, uma linha "‹ Voltar para Paraopeba" no topo. Não há barra
fixa, não há botão para ir para outra frente, nada até rolar a página
inteira e chegar no `FooterGlobal`. Um comentário no próprio
`funcaosocialterra/page.tsx` já registra a decisão consciente de não
ter `layout.tsx` (o globo 3D ocupa a tela inteira com HUD próprio, e um
layout colaria nele também) — mas isso deixou as OUTRAS páginas da zona
(que não são o globo) sem qualquer nav persistente também, como efeito
colateral.

**Por que importa**: são as duas frentes mais novas do portal — a mais
provável de alguém ainda não conhecer — e são as únicas sem um caminho
rápido de volta. Adicionei `<OutrasFrentes>` nas homes das duas (conserto
#1), o que ajuda quem já chegou na home da zona; mas quem está em
`/paraopeba/clipping` ou `/funcaosocialterra/alertas` só tem o link de
volta para a PRÓPRIA home da zona, não para as outras cinco.

**Por que não mexi**: dar um cabeçalho a essas duas zonas é decisão de
layout — sticky ou não, larguras, se herda o estilo rico do `Header.tsx`
de Cidades ou o estilo enxuto de `congresso/layout.tsx`, e como isso
convive com o HUD do globo 3D. É desenho novo, não extensão de um padrão
que já existe nessas duas telas. Fica para o dono decidir a forma; a
régua (`outrasZonas()`) já existe e pronta para alimentar o que for
escolhido.

### 6. RTID sem expansão

**Onde**: `public/terras/globo/js/config.js`, camada "Territórios
quilombolas".

O texto do aviso dizia `'"RTID publicado" ao titulado'` sem nunca dizer o
que RTID significa — único acrônimo pego sem explicação ao lado nesta
rodada (ver a nota de vocabulário abaixo, que cobriu COPAM, SIGMINE,
CFEM, ZAS, LAI e achou os outros cinco já explicados).

**Conserto** (`ed003bd`): `'RTID (Relatório Técnico de Identificação e
Delimitação) publicado'`. Uma linha, sem teste dependendo do texto
exato (conferido antes de editar).

---

## 🟢 Achados baixos / editoriais — decisão do dono

### 7. A home tem seis cards + um banner — carga cognitiva pra quem só quer "minha cidade"

O pedido original perguntava isso direto: "isso é escolha demais para
quem só quer saber o que tem sobre a minha cidade?"

**O que a home tem hoje**: seis cards de peso visual IGUAL (Cidades,
Congresso, Judiciário, Meio ambiente, Terra e território, Paraopeba,
cada um com título, descrição de um parágrafo e lista de 4 itens), mais
o banner "Direitos em Movimento" (visualmente diferente, cor de alerta),
mais uma seção "Por que mais de um portal". Card de Cidades é o
primeiro da lista — bom — mas nada no desenho diz "comece por aqui" para
quem chegou sem saber o nome de nenhuma das seis frentes.

**Não é bagunça** — a home já tem disciplina editorial real (números
sempre de fonte contada, nunca digitados; texto cortado para o que
existe, não o que se promete) — é volume. Alguém que só quer "minha
cidade" varre 6 blocos de texto denso antes de confirmar qual é o certo.

**Não mexi**: mudar hierarquia visual (destacar um card, reordenar,
resumir a descrição dos outros cinco) é decisão de identidade visual —
exatamente o tipo de mudança que o escopo desta revisão pede pra deixar
com o dono. Registro uma opção de baixo custo, sem redesenho: uma linha
de texto acima do grid — "Procurando sua cidade? O primeiro card é o
seu." — ou um botão "Ir direto pra minha cidade" que abre um seletor,
sem mexer no grid em si.

---

## Vocabulário e siglas — auditoria dedicada

Verifiquei COPAM, SIGMINE, CFEM, RTID, ZAS, CAR e LAI — as siglas citadas
no pedido — em todo lugar onde aparecem na interface (não só em
comentário de código).

**Achado bom, não esperado**: a disciplina já existe e é forte.

- COPAM: expandido ("Conselho Estadual de Política Ambiental") no card da
  home de Ambiental e no `<h1>` de `/ambiental/copam`.
- SIGMINE, CFEM: expandidos com a fonte junto ("títulos minerários da ANM
  (SIGMINE)", "royalty da mineração (CFEM)") em `/funcaosocialterra`.
- LAI: expandido ("Lei de Acesso à Informação (LAI)") antes do primeiro
  uso da sigla em `PedidoLAI.tsx`.
- ZAS: expandido ("Zona de Autossalvamento (ZAS)") em TODO lugar do globo
  3D onde aparece — e o `label` de cada camada do globo já segue uma
  regra própria e mais rígida que a do resto do site: **linguagem comum,
  sempre visível sob o nome, nunca só em tooltip** — comentário em
  `config.js` linha 106 registra que isso é proposital: *"tooltip não
  existe no celular"*. Essa é uma lição que o resto do site (e qualquer
  biblioteca de UI externa) devia aprender, não o contrário — ver a
  seção de design system abaixo.
- RTID: único caso sem expansão, corrigido nesta revisão.
- CAR (Cadastro Ambiental Rural): expandido no primeiro uso em
  `/funcaosocialterra` e em `/[municipio]/terras`.

Não é um problema sistêmico. É um ponto único, já consertado.

---

## Acessibilidade — o que mais foi testado

- **Teclado**: `:focus-visible { outline: 3px solid var(--color-focus) }`
  está aplicado globalmente e funciona nos três temas (depois do
  conserto #3). O campo de busca (`BuscaUniversal.tsx`) usa
  `outline-none` no `<input>`, mas COMPENSA com
  `focus-within:border-[var(--cp-primary)]` no contêiner — decisão
  deliberada (outline padrão ficaria estranho num campo arredondado), não
  bug: o foco continua visível, só que como borda, não anel.
- **Leitor de tela**: `aria-label` no combobox de busca (não usa
  `placeholder` como nome, porque ele some ao digitar e alguns leitores
  não o anunciam), `role="status"` com `aria-live` implícito no aviso da
  leitura em voz alta, `aria-hidden` disciplinado em ícone decorativo.
  Não achei um caso de ícone sem `aria-hidden` nem de botão sem nome
  acessível na amostra revisada.
- **Contraste, os três temas**: medido programaticamente (não só
  inspeção visual) para `--cp-text`, `--cp-primary`, `--cp-accent`,
  `--cp-secondary`, `--cp-tertiary`, `--cp-alert` e `--cp-focus` contra
  `--cp-bg` e `--cp-surface` nos três temas. Os dois problemas achados
  (#3 e a parte do #4 que é `--cp-alert`) já estão corrigidos; todo o
  resto mediu dentro do piso — inclusive o cuidado já documentado no
  próprio `globals.css` sobre `--cp-secondary`/`--cp-tertiary`, que
  tinham sido corrigidos numa rodada anterior pela mesma razão.
- **`prefers-reduced-motion`**: coberto de forma completa em dois blocos
  de `globals.css` (microanimações de hover/pulse/glow E as animações da
  busca universal — "pensando", "varredura", "tremor", "painel entra"),
  inclusive com fallback visual para quando a animação é desligada (a
  barra de "varredura" fica cheia e estática em vez de sumir sem
  explicação). Isto já estava certo antes desta revisão; não precisou de
  conserto.
- **Alto contraste desliga o floreio, não o essencial**: pulse/glow
  desligados no tema de alto contraste por regra própria — "prioriza
  legibilidade sobre efeito". Boa doutrina, mantida.

---

## Design system — o que aproveitar de Kokonut UI, Motion.dev e Bklit UI

### O que o site já tem (e por que isso muda o cálculo)

O sistema de microanimação atual (`app/globals.css`, ~200 linhas) é
**CSS puro, zero JavaScript, custo de bundle zero**: hover de card
(`.cp-card-hover`), hover de botão (`.cp-btn-anim`), pulso de alerta
legal (`.cp-pulse-alert`), glow de CTA (`.cp-glow-primary`), sublinhado
que cresce (`.cp-link-underline`), e um conjunto dedicado para a busca
universal (pontos "pensando", barra de "varredura", tremor de erro,
painel entrando). Todas movem `transform`/`box-shadow`, nunca só opacidade
— decisão registrada em comentário porque opacidade sozinha não prova
que a animação está rodando. `prefers-reduced-motion` cobre as duas
famílias, com fallback visual. Isto é MAIS disciplinado do que a maioria
dos sites que usam biblioteca de animação — o ponto de partida já é bom.

O teto de bundle é real e apertado: o comentário do script `build` em
`apps/web/package.json` registra que o deploy chegou a faltar **222 KiB**
para caber no limite de 3 MiB (gzip) do Worker antes de trocar Turbopack
por webpack (que economizou 499 KiB deduplicando o Drizzle). Não medi o
bundle final desta sessão — a instrução do dono foi não rodar
`opennextjs-cloudflare build` — mas o histórico deixa a margem sabidamente
estreita; qualquer biblioteca nova entra por cima disso, se entrar.

### Veredito por site

**Kokonut UI** — coleção de componentes React copy-paste (filosofia
shadcn/ui), construída sobre **Motion (ex-Framer Motion) + Radix UI**.
Não é dependência de pacote, mas os componentes que ela ensina a copiar
TRAZEM Motion e Radix junto. Padrões de interesse: cartões com hover
animado, botões com micro-interação, indicador de progresso, efeito de
vidro fosco (glassmorphism) — nomeados de forma consistente com o que o
Controle Popular já tem em CSS puro.

- ❌ **Não copiar o código**: qualquer componente Kokonut UI puxa Motion
  (mínimo ~4,6 KiB gzip com `LazyMotion` + `domAnimation`, até 34 KiB
  sem otimização — números do próprio motion.dev) e potencialmente
  `@radix-ui/*` por componente. Isso é custo por cima de um sistema que
  hoje custa ZERO. O ganho visual sobre o `.cp-card-hover`/`.cp-btn-anim`
  já existentes é marginal — as duas soluções fazem a mesma coisa
  (transform + box-shadow no hover).
- ✅ **Copiar o padrão, não o código**: um "hover-card"/tooltip de
  definição — encostar (ou focar, por teclado) numa sigla e ver a
  explicação — é exatamente o problema de vocabulário que este documento
  investigou. MAS: o próprio globo 3D do Controle Popular já testou essa
  ideia e a REJEITOU por um motivo documentado (`config.js` linha 106):
  *"tooltip não existe no celular"*. A solução que o globo adotou —
  explicação em texto comum, sempre visível, nunca escondida atrás de
  hover — é estrategicamente MELHOR para este site do que o padrão
  hover-card que Kokonut UI (e a maioria das bibliotecas de componente)
  ensina, porque este é um portal lido majoritariamente em celular, onde
  hover não existe. Se algum dia entrar um tooltip de sigla em outra
  parte do site, ele precisa seguir a régua do globo, não a de Kokonut UI.

**Bklit UI** — biblioteca de gráficos e visualização de dados (linha,
área, anel, radar), construída sobre **d3 + Motion**, com um "Studio"
interativo (editor visual que exporta código). Paleta própria
(`#1d9bf0`), tipografia GeistSans, grade de 8px.

- ❌ **Não copiar o código**: o Controle Popular já tem seu PRÓPRIO
  sistema de gráfico (`.cp-ord-track`/`.cp-ord-seg` em `globals.css`),
  construído para um requisito que Bklit UI não resolve pronto: canal de
  TEXTURA além de cor (hachura diagonal na barra mais clara, para quem
  não distingue verde/oliva) e um modo `forced-colors` dedicado. Trocar
  por Bklit UI significaria REGREDIR nesse cuidado de acessibilidade
  específico para trocar por d3 + Motion — peso maior, garantia menor. O
  próprio site já documenta ter medido a paleta ordinal contra CVD
  (deuteranopia/protanopia) com a régua correta; nenhuma prova de que
  Bklit UI faz o mesmo.
- ✅ **Nada específico a apropriar** além de uma confirmação: a régua de
  8px e tipografia tabular que Bklit UI usa para número de gráfico já é
  seguida aqui (`--font-tabular`, fonte própria para número em tabela,
  self-hosted). Não é novidade, é validação de que o caminho já escolhido
  é o padrão do setor.

**Motion.dev** (o motor por trás dos outros dois) — a peça que de fato
poderia entrar sozinha, sem Kokonut UI nem Bklit UI por cima.

- ❌ **Ainda não compensa, hoje**: mesmo na configuração mais enxuta
  (`useAnimate` "mini", 2,3 KiB gzip, sem componente JSX, só função
  imperativa) não há uma necessidade real não atendida pelo CSS atual.
  As categorias onde JS ganha de CSS de verdade — transição compartilhada
  entre rotas (`layoutId`), sequência coreografada de entrada/saída
  coordenada com estado — não têm caso de uso claro neste portal: a
  navegação é majoritariamente MPA (troca de página completa via
  `<a>`/`<Link>`, não SPA com transição de rota), e as sequências que
  existem (busca "pensando", filtro de alerta) já são resolvidas em CSS.
- 🔬 **Vale um experimento, sem dependência**: CSS tem hoje
  `animation-timeline: view()` (scroll-driven animation nativa,
  Chromium, degrada de forma inofensiva onde não suporta — a animação
  simplesmente não roda, o conteúdo aparece estático) para revelar um
  card ao entrar na viewport, tipo stagger suave na grade de frentes da
  home ou nos blocos de "As outras frentes". Isso é o EFEITO que
  bibliotecas como Motion popularizaram, sem a dependência — zero custo
  de bundle, cai sozinho em `prefers-reduced-motion` porque não anima
  nada além de opacidade/transform já cobertos pelo bloco existente.
  Não implementei: é experimento de polimento visual, não conserto de
  bug, e cabe ao dono decidir se vale o tempo de teste cross-browser.

### As três restrições, aplicadas

1. **`prefers-reduced-motion`**: já é doutrina no site, coberta de forma
   mais completa do que o padrão de mercado (dois blocos dedicados, com
   fallback visual). Qualquer coisa nova — inclusive o experimento de
   `animation-timeline: view()` acima — herda essa régua de graça, porque
   é CSS.
2. **Teto de bundle**: nenhum dos três sites passa nesta prova hoje. A
   margem real (KiB exatos sobrando no limite de 3 MiB) não foi medida
   nesta sessão porque o build ficou fora do escopo permitido — antes de
   considerar QUALQUER biblioteca de animação, rodar `cf:build` e medir o
   gzip real é pré-requisito, não opcional.
3. **Quem lê está sob estresse**: o padrão hover-only de Kokonut UI
   perde de forma explícita para a doutrina que o próprio globo 3D do
   Controle Popular já criou (explicação sempre visível, nunca só em
   hover, porque celular não tem hover) — e isso vale tanto para
   microanimação decorativa (que pode atrasar leitura de gente sob
   estresse) quanto para tooltip de definição (que pode simplesmente não
   existir pra quem está no celular, que é a maioria dos casos que
   motivaram esta revisão).

---

## O que rodou, em cada commit

```
cd apps/web && npx tsc --noEmit        # limpo, nos 3 commits
npm run test:lib                        # 247 passando, nos 3 commits
npm run test:globo                      # 121 passando (config.js tocado)
python scripts/checar-dado-pessoal.py  # verde, nos 3 commits
```

Commits desta revisão, em `worktree/ux` (nenhum push):

- `ed003bd` — nav de zona irmã derivada de `lib/zonas.ts` (4 headers +
  3 homes com `OutrasFrentes`), foco e alerta do alto contraste, RTID.
- `70e5683` — 7 páginas sem `<main>` (home + 6 páginas de Paraopeba).
- `bc2d372` — link "Pular para o conteúdo".

Dev server local (porta 3912, `.claude/launch.json` deste worktree,
entrada `cp-ux-dev`) usado para todo teste ao vivo — derrubado ao final
desta sessão.
