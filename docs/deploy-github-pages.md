# Publicar no GitHub Pages — o que funciona, o que quebra, o que decidir

> Verificado contra a documentação oficial em 2026-08-03 (Next.js 16.2.12,
> `actions/configure-pages@v5`, GitHub Terms for Additional Products).
> O alvo padrão do projeto continua sendo o Cloudflare Workers.

## Resumo

O build estático **funciona** — `next.config.ts` já suporta os dois alvos e
`.github/workflows/pages.yml` publica. O que o GitHub Pages não tem é
servidor, e é isso que decide o que sai do ar.

Duas questões são de decisão sua, não técnicas, e estão em §4.

## 1. Como está montado

`next.config.ts` liga o modo estático pela presença de `PAGES_BASE_PATH`:

```ts
const PAGES_BASE_PATH = process.env.PAGES_BASE_PATH;
const exportandoEstatico = PAGES_BASE_PATH !== undefined;
```

A variável é o output `base_path` de `actions/configure-pages@v5`. Ela vale
`/controle-popular` num repositório comum e **string vazia** quando há
domínio próprio configurado. Os dois são válidos — daí o teste ser
`!== undefined` e não `if (PAGES_BASE_PATH)`. O efeito prático é que plugar
um CNAME depois não exige tocar em código.

No modo estático o config passa a valer:

| Opção | Por quê |
|---|---|
| `output: 'export'` | gera HTML puro em `apps/web/out` |
| `basePath` | o site vive em `/<repo>`, não na raiz |
| `images: { unoptimized: true }` | o otimizador é um serviço de runtime; sem ele o build falha |
| `trailingSlash: true` | emite `rota/index.html`; sem isso, recarregar URL aninhada dá 404 |
| `pageExtensions: ["tsx","ts"]` | **exclui os arquivos `*.din.ts`** |
| `redirects()` ausente | não é suportado em export, e falharia em silêncio |

Rodar local:

```bash
cd apps/web && PAGES_BASE_PATH=/controle-popular npx next build
```

No Git Bash use `MSYS_NO_PATHCONV=1` ou rode pelo PowerShell: o MSYS
converte `/controle-popular` em `C:/Program Files/Git/controle-popular` e o
build morre com "basePath has to start with a /".

## 2. A convenção `*.din.ts`

As 16 rotas de API dependem da Request — as de `GET` leem `searchParams`, as
de escrita leem o corpo. Nenhuma sobrevive ao export. Todas foram renomeadas
para `route.din.ts`, e a lista de `pageExtensions` do alvo Cloudflare inclui
`din.ts` enquanto a do alvo estático não.

A alternativa seria apagá-las ou embrulhar cada uma num `if` de ambiente. As
duas fazem o build passar e o site perder função sem avisar; aqui a ausência
está declarada em um lugar só, no `next.config.ts`.

**Rotas que só existem no Cloudflare:**

| Rota | O que deixa de funcionar em Pages |
|---|---|
| `[municipio]/api/busca` | busca no cabeçalho da cidade |
| `[municipio]/api/chat` | assistente "Pergunte ao portal" |
| `[municipio]/api/contratos` | exportar CSV de contratos |
| `[municipio]/api/classificados` (GET+POST) | Compra e Venda: listar e publicar |
| `[municipio]/api/zap` (GET+POST) | Zap: listar e cadastrar negócio |
| `[municipio]/api/zap/[id]/clique` | contador de cliques |
| `[municipio]/api/coleta/[bairro]` | consulta de coleta por bairro |
| `[municipio]/api/admin/*` | painel de anúncios e moderação |
| `congresso/api/*`, `judiciario/api/*` | busca, chat e gerador de ofício |
| `api/auth/[...all]` | Better Auth (login por magic link) |

## 3. O que ainda falta para o export fechar

> **Inventário refeito em 2026-08-09 por varredura do código, e o número
> mudou: são 21 páginas, não 11.** A lista de 2026-08-03 estava errada em três
> pontos, todos verificados agora:
>
> - **10 páginas novas** entraram desde então e nunca foram inventariadas:
>   `/busca`, `camara/votacoes`, `camara/legislacao`, `prefeitura/licitacoes`,
>   `zap`, e as seis do eixo Congresso (`agenda`, `alertas`, `bancadas`,
>   `bons-exemplos`, `proposicoes`, `votacoes`). O inventário original só varreu
>   `[municipio]`, então o Congresso nunca esteve na conta.
> - **`congresso/bons-exemplos` estava explicitamente EXCLUÍDA** da lista ("lê
>   só `params`") e lê `searchParams` na linha 15.
> - **`prefeitura/legislacao` está na lista e não lê mais** `searchParams`; quem
>   lê hoje é `camara/legislacao`, com os mesmos quatro filtros. A rota mudou de
>   lugar e o documento ficou.
>
> Lição: este inventário precisa ser gerado, não escrito à mão.
> `grep -rl searchParams app --include=page.tsx` responde em um segundo, e
> qualquer página nova nasce fora de uma lista mantida manualmente.

As páginas abaixo leem `searchParams` no servidor. Em `output: 'export'`
isso é erro de build — não há request no momento da geração.

### 3.1 As 10 que faltavam no inventário (2026-08-09)

| Página | Filtros | Caminho |
|---|---|---|
| `zap` | filtros de listagem | filtrar no cliente |
| `camara/legislacao` | categoria, tema, ano, direito | filtrar no cliente |
| `congresso/agenda` | período | filtrar no cliente |
| `congresso/alertas` | listagem | filtrar no cliente |
| `congresso/bancadas` | listagem | filtrar no cliente |
| `camara/votacoes` | ano, q, **paginação** | **JSON estático + tabela cliente** |
| `prefeitura/licitacoes` | ano, situação, modalidade, q, **paginação** | **JSON estático + tabela cliente** |
| `congresso/bons-exemplos` | filtros + **paginação** | **JSON estático + tabela cliente** |
| `congresso/proposicoes` | filtros + **paginação** | **JSON estático + tabela cliente** |
| `congresso/votacoes` | filtros + **paginação** | **JSON estático + tabela cliente** |

**`/busca` é a exceção que não cabe em nenhuma das duas colunas.** Criada em
2026-08-09, é consulta de texto completo em português com `unaccent`, feita
**pelo Postgres**, sobre a legislação inteira. Não existe "filtrar no cliente":
o conjunto candidato é o corpus, não uma página de resultados. Em modo estático
ela exigiria um índice gerado no build mais um buscador no navegador — e o
resultado **não seria equivalente**, porque `to_tsvector('portuguese')` faz
radicalização que um índice ingênuo não faz. É a única página desta lista cuja
versão estática é funcionalmente inferior, e isso é decisão de produto.

### 3.2 O inventário de 2026-08-03 (mantido, com as correções acima)

| Página | Filtros | Caminho |
|---|---|---|
| `coleta-lixo` | bairro | filtrar no cliente |
| `postos-combustivel` | bandeira | filtrar no cliente |
| `compra-e-venda` | categoria, q | filtrar no cliente |
| `prefeitura/obras` | situação | filtrar no cliente |
| `prefeitura/despesas` | ano | filtrar no cliente |
| `prefeitura/legislacao` | categoria, tema, ano, **direito** | filtrar no cliente |
| `meio-ambiente/paraopeba` | status, ordem | filtrar no cliente |
| `prefeitura/contratos` | 6 filtros + paginação | **JSON estático + tabela cliente** |
| `camara/proposicoes` | 5 filtros + paginação | **JSON estático + tabela cliente** |
| `prefeitura/servidores` | q + paginação | **JSON estático + tabela cliente** |
| `vereadores/[slug]` | aba | filtrar no cliente |

~~`/[municipio]/legislacao/alertas` e `/bons-exemplos`, criadas depois deste
inventário, **não** entram na lista: lêem só `params`, não `searchParams`, e
saem no export sem trabalho nenhum.~~

**Errado, conferido em 2026-08-09**: `congresso/bons-exemplos` lê
`searchParams` na linha 15 e tem paginação — está na tabela §3.1. A linha de
`prefeitura/legislacao` na tabela abaixo também não vale mais: hoje quem lê os
quatro filtros é `camara/legislacao`.

Os sete primeiros são pequenos: o servidor renderiza o conjunto inteiro e um
componente cliente com `useSearchParams()` filtra. Os três em negrito têm
volume — em São Paulo, `servidores` passa de 100 mil linhas — e precisam de
índice JSON gerado no build (um Route Handler `GET` sem Request **é**
suportado em export e sai como arquivo) com paginação no cliente.

## 4. As duas decisões que não são técnicas

**Termos de Serviço.** Os *GitHub Terms for Additional Products and
Features*, seção Pages, dizem que o serviço não é permitido "as a free web
hosting service to run your online business, e-commerce site, or any other
website that is **primarily directed at** either facilitating commercial
transactions or providing commercial software as a service", e ressalvam que
"some monetization efforts are permitted on Pages, such as donation buttons
and crowdfunding links". A *Acceptable Use Policy* §10 acrescenta que "the
primary focus of the Content posted in or through your Account to the
Service should not be advertising or promotional marketing".

Este portal é de transparência pública; os anúncios de comércio local e o
Zap são acessórios. Sob a leitura literal do texto, o foco primário **não** é
publicidade nem transação comercial, então o uso é defensável. Mas "primarily
directed at" é linguagem vaga, o GitHub não dá parecer prévio (a discussion
community #74742 pergunta exatamente isso e não teve resposta definitiva), a
avaliação é feita depois do fato e a sanção prevista é "reclaim any GitHub
subdomain without liability".

É a mesma família de cláusula que tirou o projeto do Vercel Hobby. A
diferença é que lá a vedação a anúncios era direta, e aqui depende de o
portal ser lido como o que é. Se a monetização por anúncios crescer a ponto
de virar a cara do site, a leitura muda.

**Repositório privado.** GitHub Free só serve Pages a partir de repositório
**público**. Repositório privado com site público exige Pro (pessoal) ou Team
(organização), ambos pagos. Site com acesso restrito exige Enterprise Cloud.
O `controle-popular` é privado hoje.

## 5. Limites do plano gratuito

- Site publicado: **1 GB** (limite rígido).
- Banda: 100 GB/mês (*soft*).
- Builds: 10 por hora (*soft*).
- Actions: minutos ilimitados em repositório público; 2.000 min/mês no Free
  se o repositório for privado.

Com três cidades o build passa de ~1.400 páginas. Vale medir o tamanho de
`apps/web/out` antes de confiar na folga do 1 GB.

## 6. Se o chat e os formulários tiverem de continuar existindo

Um site estático não recebe POST e não pode guardar a chave de um LLM — toda
variável `NEXT_PUBLIC_*` é inlinada em texto claro no bundle.

- **Chat**: um Cloudflare Worker só para `/api/chat` (Free: 100 mil
  requisições/dia; o teto de 10 ms é de CPU, e esperar o upstream não conta),
  ou Workers AI (10 mil Neurons/dia, sem chave de terceiro).
- **Formulários** (Zap, classificados): escrita direta do navegador para o
  Postgres com RLS, ou um Worker gravando em D1. Em qualquer caso, um portão
  de moderação e Turnstile antes de publicar.

Ou seja: se essas funções são requisito, já existe um Worker no desenho — e
aí manter o resto no Cloudflare é mais simples do que dividir o site em dois
provedores.

---

## 7. "E se o servidor for o meu PC?" — as três arquiteturas, 2026-08-09

Pergunta levantada durante o bloqueio da Neon. Ela tem três respostas
diferentes, e a diferença entre elas decide se o site fica de pé.

**O fato que ordena tudo: o egress da Neon é queimado pelo BUILD, não pelo
site.** Cada `next build` lê o banco inteiro para pré-renderizar as ~715
páginas — é daí que saem os ~0,4 GB por rodada. O que o Worker gasta em
runtime é o tráfego das 15 rotas `.din.ts` e das páginas dinâmicas, ordens de
grandeza menor. Quem entende isso vê que "tirar a Neon" e "ter servidor
próprio" não são o mesmo problema.

### A. PC hospeda só o banco, site continua no Cloudflare ❌

O Worker teria de alcançar o Postgres da sua casa. Três problemas somados:
Worker não fala TCP puro com Postgres (o driver da Neon é HTTP, por isso ela
foi escolhida); expor Postgres à internet é superfície de ataque de primeira
grandeza; e a disponibilidade do portal passa a ser a da sua energia elétrica
e do seu link de subida. Pior dos três mundos — não fazer.

### B. PC hospeda tudo (Next.js + Postgres), Cloudflare Tunnel na frente ⚠️

Mata a Neon, mata o teto de 3 MiB do Worker (a **área logada voltaria**), e
mantém chat, formulários e todas as rotas dinâmicas funcionando. Tunnel é
grátis e não exige abrir porta no roteador.

O preço é honesto e é grande: **a disponibilidade do portal de transparência
vira a disponibilidade do seu PC.** Queda de luz, reinício do Windows,
atualização, viagem — o site cai junto. Para um portal que existe para ser
consultado por terceiros, isso é uma troca ruim, e não é reversível de graça
depois que o endereço estiver divulgado.

### C. PC é a máquina de BUILD; Cloudflare serve HTML estático ✅

O banco fica no seu PC, o `next build` roda contra `localhost` — **egress
zero, custo zero, sem cota** — e o resultado é HTML publicado no Cloudflare.
O PC **não precisa ficar ligado** para o site funcionar: só na hora de
atualizar o dado. A Neon vira opcional (backup, ou nada).

É a combinação que resolve a pergunta e o §3 ao mesmo tempo: C **é** fechar o
modo estático. O que falta é o que está na tabela do §3 — as 21 páginas com
`searchParams` — mais o §6 para chat e formulários, que já previa um Worker
pequeno de qualquer forma.

O que se perde em C, e é preciso dizer: `/busca` fica funcionalmente inferior
(ver §3.1), o painel de administração e o login precisam do Worker do §6, e o
dado passa a ter a idade do último build que **você** rodou — não há cron que
salve, porque o banco está na sua mesa.

**Recomendação:** C. B só se a área logada for requisito inegociável e a queda
ocasional for aceitável. A nunca.

---

## 8. O que a primeira tentativa real de export revelou (2026-08-09)

O §3 dizia que o que falta são as páginas com `searchParams`. **Rodar o build
provou que esse nem é o primeiro obstáculo.** Ordem real dos erros:

### 8.1 As 56 páginas sem `generateStaticParams` — blocker anterior, não documentado

O export morre em *Collecting page data*, antes de chegar perto de
`searchParams`:

```
Page "/[municipio]/citrolandia" is missing "generateStaticParams()"
so it cannot be used with "output: export" config.
```

`app/[municipio]/layout.tsx` **já declara** `generateStaticParams`, e no alvo
Cloudflare isso basta. Em `output: export` o Next confere **página por
página**: são 56 sob `[municipio]`, e só duas tinham a função (as que têm
segmento dinâmico próprio). Resolvido em 53 arquivos — `admin` é client
component e as outras duas já se viravam.

**Re-export não funciona, e isso custa uma rodada inteira para descobrir.**
A forma econômica seria `export { generateStaticParams } from "..."`. O build
continua abortando com a mesma mensagem: a coleta do Turbopack quer a função
DECLARADA no módulo da página. A armadilha é que o re-export **passa** no alvo
Cloudflare, onde a função nem é exigida por página — parece certo em todo lugar
menos onde importa. O formato que funciona está em `lib/betim/staticParams.ts`.

### 8.2 A conversão "filtrar no cliente" já foi feita em 7 páginas

`coleta-lixo`, `compra-e-venda`, `meio-ambiente/paraopeba`, `postos-combustivel`,
`prefeitura/despesas`, `prefeitura/obras` e `zap` já não leem `searchParams` no
servidor: têm componente de lista `"use client"` com `useSearchParams()` dentro
de `<Suspense>`. O §3 conta essas páginas como pendentes; **não são**.

### 8.3 "missing generateStaticParams()" quer dizer "retornou lista vazia" ✅ RESOLVIDO

Custou três hipóteses erradas, e o diagnóstico final é constrangedoramente
simples. A mensagem

```
Page "/[municipio]/qualquer-uma" is missing "generateStaticParams()"
```

aparece **também quando a função existe, é reconhecida e devolve `[]`**.

Prova: com `return [{ municipio: "betim" }]` fixo em `dados/page.tsx`, aquela
página passa e o erro anda para a próxima. Nada mais mudou.

E `paramsDasCidades()` devolve `[]` nesta máquina porque `slugsDasCidades()`
devolve `[]` quando não há `DATABASE_URL` — comportamento correto e deliberado
(`lib/db/client.ts` devolve `null` para o repo poder ser clonado sem
credencial).

**Consequência, e é a boa notícia:** não há bug nas páginas. O export não
fecha numa máquina sem banco, e **fecha assim que houver banco** — o que é
exatamente o que a máquina de build vai ter. As correções do §8.1 (as 53
páginas) continuam necessárias e corretas.

**As três hipóteses que eu queimei antes de testar a óbvia**, registradas para
ninguém repetir:
1. *"É o re-export que não é reconhecido"* — plausível, e falso. A declaração
   local falhou igual. (O re-export **também** não funciona, mas por outro
   motivo, e isso continua valendo.)
2. *"É `useSearchParams()` no filho cliente"* — falso: `dados/page.tsx` não tem
   filtro nenhum e falhava igual.
3. *"`export const dynamic = 'force-static'` resolve"* — falso; foi aplicado às
   sete páginas e nada mudou.

**A lição de método, que é o que realmente custou:** o erro parece
não-determinístico porque a coleta usa ~15 workers e nomeia uma página
arbitrária entre as que falham. Como TODAS estavam falhando, cada tentativa
mudava o nome e parecia progresso. **Antes de tentar consertar, isole**: tirar
duas páginas do caminho e ver que a terceira — sem `searchParams` nenhum —
falhava igual foi o que derrubou as três hipóteses de uma vez.
