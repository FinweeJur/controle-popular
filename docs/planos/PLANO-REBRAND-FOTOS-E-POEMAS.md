# Plano de rebrand visual: fotos Brasil com S + poesia da copy

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-03
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md), [PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md](PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md), [CITACOES-AUTORIZADAS.md](CITACOES-AUTORIZADAS.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** rebrand, brasil com s, fotos, poesia, faixa circulante, copy, headers, destaques, sem svg, icones do brasil, acessibilidade

## Sumário

- [Propósito](#propósito)
- [O que já existe (medido 03/09)](#o-que-ja-existe-medido-0309)
- [Decisão de escopo: sem SVG novo, só foto + ícone instalado](#decisao-de-escopo-sem-svg-novo-so-foto--icone-instalado)
- [Os três elementos pedidos e onde entram](#os-tres-elementos-pedidos-e-onde-entram)
- [Paleta: herdar, não inventar](#paleta-herdar-nao-inventar)
- [Fotos: acervo, layout e crédito](#fotos-acervo-layout-e-credito)
- [Ícones do Brasil: pendência de localização](#icones-do-brasil-pendencia-de-localizacao)
- [Roadmap em fases](#roadmap-em-fases)
- [Regras que este plano não negocia](#regras-que-este-plano-nao-negocia)
- [Critérios objetivos de validação](#critérios-objetivos-de-validação)
- [Riscos e mitigações](#riscos-e-mitigações)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Unificar em um só trabalho duas frentes que nasceram separadas e se
completam:

1. **A voz** — [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md) (v7.1, resgatada da
   branch `copy/voz-memoria-alegria` em 870bc3c): memória das lutas populares
   com leveza, epígrafes da literatura, léxico do campo popular (MAB/MBP).
2. **A cara** — o pacote de identidade "mosaico vivo" das três
   `resposta*.md` (maritaca/deepseek/jcode, manhã de 03/09), já vertido no
   [PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md](PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md),
   cuja Fase 1 (hero narrativo com GSAP na home) está entregue.

Este plano pega **três elementos concretos** que o dono pediu — a faixa de
poemas circulando, os destaques ao final e os headers com poesia — e os veste
com o que o portal **já tem**: fotos do acervo Brasil com S e a paleta
existente. Sem criar arte nova.

## O que já existe (medido 03/09)

| Peça | Onde | Estado |
|---|---|---|
| Hero narrativo (Fase 1 do plano de identidade) | `apps/web/app/components/HeroNarrative.tsx` + `lib/hero-narrativo.ts` | ✅ no ar desde o build de 03/09 |
| Fotos Brasil com S | `apps/web/public/brasilcoms/` — 23 `.webp` | ✅ servidas; componente `FotoBrasilComS.tsx` com layout 1-foto-direita no worktree `cp-hermes`, aguardando visto do dono |
| Voz e epígrafes (v7.1) | `PLANO-COPY-VOZ.md` + tabela autorizada em `CITACOES-AUTORIZADAS.md` | ✅ texto aprovado, código da branch copy NÃO fundido (PR #4 aberto) |
| Código do rebrand (home, hubs, nav, cidades) | branch `copy/voz-memoria-alegria`, 8 commits, PR #4 | 🚧 conflita com o hero-narrativo publicado |
| Paleta OKLCH por tema | `apps/web/app/tokens/colors.css` (radicais `--color-*`, `--color-glow`) | ✅ usar como está |

## Decisão de escopo: sem SVG novo, só foto + ícone instalado

Ordem do dono (03/09): **nenhum elemento SVG novo neste round.**

- O `HeroNarrative` publicado já embute padrões SVG (Bulcão, fauna) — **fica
  como está**, não se adicionam outros.
- Onde a proposta das `resposta*.md` pedia módulo geométrico novo, entra
  **foto do acervo Brasil com S** no lugar.
- Onde pedia pictograma (frente, categoria, badge), entra **ícone do pacote
  "ícones do Brasil" instalado neste home-pc** (ver
  [pendência](#icones-do-brasil-pendencia-de-localizacao)) — como imagem
  raster (`.png`/`.webp`), não como inline SVG no bundle.
- `FotoBrasilComS` e `CenasDoBrasil` continuam sendo os veículos da foto; a
  faixa de poemas é HTML/CSS puro (o mesmo mecanismo do ticker existente), não
  desenho.

Justificativa técnica, além do pedido: SVG inline em 848 páginas multiplica no
flight do RSC (regra 1 do AGENTS.md); `.webp` servido de `public/` não entra no
bundle de 3 MiB gzip e cacheia no CDN.

## Os três elementos pedidos e onde entram

### 1. Faixa de poemas circulando ("dizeres que vai circulando")

Ticker horizontal em CSS puro (`@keyframes` + `will-change: transform`),
**desligado sob `prefers-reduced-motion`** — aí o poema fica estático e
completo. Já existe um ticker na página de notícias de Mariana
(`noticias-vale/page.tsx:564`); o padrão visual é o mesmo, o conteúdo muda.

- **Conteúdo:** frases autorizadas de `CITACOES-AUTORIZADAS.md` (Rosa,
  Carolina, Galeano, Evaristo, Itamar) + versos dos poemas do acervo v7 —
  **uma única fonte de verdade**; a faixa não pode estrear frase que não
  esteja na tabela autorizada.
- **Onde:** faixa única abaixo do hero na home; nas 6 frentes, a faixa troca
  de verso pela epígrafe daquela frente (mapa "citação nova → frente" da copy
  v7).
- **Acessibilidade:** `aria-hidden="false"` só para o texto completo estático;
  a faixa em movimento é decorativa (`aria-hidden`), porque leitor de tela não
  persegue marquee.

### 2. Destaques ao final

Fecho editorial depois do último dado da página — o "depois do número, a
frase":

- **Onde:** home (fim da lista de frentes), `/congresso`, `/judiciario`,
  `/ambiental`, `/paraopeba`, `/funcaosocialterra`, `/onsa`, e rodapé do
  `[municipio]` para as 6 cidades.
- **Formato:** bloco `blockquote` com a frase grande, autor/obra/ano em corpo
  menor, e — onde couber — uma foto Brasil com S ao lado (mesma composição
  texto-esquerda/foto-direita do `FotoBrasilComS` do `cp-hermes`).
- **Regra editorial:** destaque ao final **comenta, não conclui por conta do
  autor** — nada de síntese que a fonte não sustenta (regra da insinuação).

### 3. Headers com poesia

Cabeçalho de seção/frente ganha epígrafe de **uma linha**, autor + obra + ano:

- Título da frente continua sendo o H1 funcional ("Congresso", não poema).
- A epígrafe entra como parágrafo `.text-muted` sob o H1 — nunca no lugar do
  nome da seção (SEO e clareza primeiro).
- Distribuição por frente vem da tabela "Distribuição das citações novas por
  frente" da copy v7.1.

## Paleta: herdar, não inventar

- **Sem token novo.** A copy visual usa `--color-primary`, `--color-accent`,
  `--color-glow` e os temas por frente que já existem em `tokens/colors.css`.
- Contraste AA continua obrigatório: epígrafe sobre fundo de tema escuro é
  texto, não imagem — se o dono quiser textura por trás, vira foto com overlay
  medido (a armadilha do OKLCH/`transition:none` do AGENTS.md vale aqui).

## Fotos: acervo, layout e crédito

- **Acervo atual:** 23 `.webp` em `public/brasilcoms/`. Cada frente recebe
  **uma foto fixa por página** (rotação aleatória quebra a promessa do
  screenshot e do cache).
- **Legenda:** exatamente `Créditos: Brasil com S` (decisão do dono, 03/09).
- **Layout:** foto à direita, texto à esquerda, coladas, perto do topo — já
  implementado no worktree `cp-hermes` (commit pendente do visto do dono).
- **Ampliação do acervo:** o projeto Brasil com S tem mais de 4 mil fotos
  livres; coletores novos seguem a regra de coleta do AGENTS.md (UA honesto,
  fora da CI, varredura de dado pessoal — aqui, rostos: a licença livre cobre
  uso, mas legenda com nome de pessoa identificada exige cautela editorial).

## Ícones do Brasil: pendência de localização

O dono mandou usar "os icons brazil e icones do brasil instalados nesse home
pc". Busca feita em 03/09 (varrida completa, documentada para ninguém repetir):

- `node_modules` do repo e globais (`npm ls -g`): nenhum pacote com "brazil"
  no nome (só `@svg-maps/brazil` existe no registro npm — não está instalado).
- `C:\Program Files*`, `AppData\Local\Programs`: nada.
- Fontes do Windows: nenhuma família "Brazil".
- `C:\jcode-ui\assets`: só `app-icons` (do próprio jcode, nada brasileiro).
- `Downloads`: pasta `brasilcoms` (fotos, não ícones) e zip de documentos.

**Bloqueio:** sem localizar o pacote, os itens 2 e 3 usam foto e texto; o
slot de ícone fica **vago, não improvisado**. Pedido ao dono: dizer onde os
ícones foram instalados (caminho, ou nome exato do pacote) — pode ser um
repositório clonado, um app (o "jcode-ui"?) ou um arquivo `.ico`/`.ttf` que a
busca por nome não pegou.

## Roadmap em fases

| Fase | Entregável | Tempo | Depende de |
|---|---|---|---|
| 0 | Decisão do dono: PR #4 (merge × cherry-pick × reescrever sobre o hero) + paradeiro dos ícones | — | dono |
| 1 | Faixa de poemas na home + 6 frentes (frases só da tabela autorizada) | 0,5 dia | Fase 0 |
| 2 | Destaques ao final (home, frentes, `[municipio]`) | 0,5 dia | Fase 0 |
| 3 | Headers com epígrafe por frente | 0,5 dia | Fase 0 |
| 4 | Fotos: landing do layout `cp-hermes` após visto + expansão medida do acervo Brasil com S | 1 dia | visto do dono |

Cada fase comita sozinha, com o pacote de fotos (Fase 4) separado do pacote de
texto (Fases 1–3) — são revisões diferentes: um mexe layout, o outro mexe voz.

## Regras que este plano não negocia

1. **Nenhuma frase nova sem passar por `CITACOES-AUTORIZADAS.md`** — a tabela
   é o contrato com os autores (direitos autorais vivos: Rosa, Evaristo,
   Itamar).
2. **Faixa que se move respeita `prefers-reduced-motion`.**
3. **Nada de biblioteca de animação nova** para a faixa (CSS resolve; GSAP já
   está dentro por causa do hero e não se expande sem medição).
4. **Foto não atrasa dado:** faixa e destaques ficam fora da primeira dobra
   útil de dados nas páginas de frente; na home, abaixo do hero.
5. **Teto de bundle:** fotos servem de `public/`; componente novo de faixa não
   pode arrastar lista grande como props (regra 1 do AGENTS.md).
6. **Resumo/destaque gerado por máquina** (se um dia a faixa puxar verso
   "sugerido" por modelo) é rotulado como tal — regra editorial do portal.

## Critérios objetivos de validação

- [ ] `npm run test` + `npx tsc --noEmit` verdes na raiz antes e depois de cada fase
- [ ] Faixa: com `prefers-reduced-motion: reduce` simulado, o poema aparece estático e inteiro
- [ ] Cada frase da faixa existe na tabela autorizada (teste de string: `faixa ⊆ CITACOES`)
- [ ] Contraste AA medido nos headers com epígrafe (com `transition:none` injetado, regra da armadilha)
- [ ] `Lighthouse`/inspeção: faixa não empurra o primeiro dado abaixo de 1.200 px na home
- [ ] Foto por página: exatamente 1 `FotoBrasilComS` visível por frente, legenda `Créditos: Brasil com S`
- [ ] Nenhuma string nova de poema hardcoded fora do módulo de citações

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Faixa vira enfeite que ofusca dado (portal é lido sob estresse) | posição fora da dobra útil; tamanho ≤ corpo do texto; pausa no `:hover` |
| Conflito PR #4 × hero publicado duplicar poesia (herói já cita?) | Fase 0 decide antes; se cherry-pick, o diff da copy é lido contra `HeroNarrative` |
| Ícone "não encontrado" virar ícone improvisado de outra origem | regra: slot vago até o dono apontar o pacote |
| Foto com rosto identificado ganhar contexto errado ao lado de dado sensível | curadoria manual das 23 atuais por frente; legibilidade de rosto vira escolha editorial explícita |

## Decisões registradas

- 2026-09-03 (dono): **sem SVG novo neste round**; fotos + ícones instalados
  no lugar de módulos geométricos novos.
- 2026-09-03 (dono): paleta e proposta visual das `resposta*.md` + copy v7.1
  entram juntas, num plano só.
- 2026-09-03 (sessão): faixa de poemas reusa o mecanismo do ticker de
  `noticias-vale` (CSS puro), não GSAP.

## Origem / Histórico

- Pedidos do dono em 03/09 (tarde e noite, via desktop e Telegram): espalhar
  fotos Brasil com S (uma por página, direita, texto esquerda, legenda curta);
  unificar branches e trabalho da Kimi; plano para aproveitar cores + faixa de
  poemas + destaques + headers da proposta maritaca/jcode/deepseek da manhã.
- Fontes primárias: `resposta (1).md`, `resposta (2).md`, `resposta (3).md`
  (em `Downloads`, não versionadas — este plano referencia as conclusões, não
  o texto bruto), `PLANO-COPY-VOZ.md` (870bc3c), PR #4 na branch
  `copy/voz-memoria-alegria`.
