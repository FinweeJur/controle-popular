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

As páginas abaixo leem `searchParams` no servidor. Em `output: 'export'`
isso é erro de build — não há request no momento da geração.

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

`/[municipio]/legislacao/alertas` e `/bons-exemplos`, criadas depois deste
inventário, **não** entram na lista: lêem só `params`, não `searchParams`, e
saem no export sem trabalho nenhum.

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
