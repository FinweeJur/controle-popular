# Plano — índice estático como espinha dorsal, e o assistente em cima dele

> Escrito em 15/08/2026, no dia em que o deploy travou por payload. Números
> medidos contra o repositório nesta data; onde não medi, está dito.
>
> Junta duas coisas que o dono pediu separadas e que são **a mesma obra**:
> servir as páginas pesadas do índice estático, e um assistente que aproveite
> esse índice para ser útil. O assistente sem o índice vira um menu bonito; o
> índice sem o assistente continua servindo uma tela só.

---

## Parte 1 — Por que o índice estático deixa de ser detalhe da `/busca`

### O que quebrou hoje, e por que vai quebrar de novo

`docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md` mediu: `/ambiental/legislacao` entregava
todas as normas como props de um componente de cliente, e o `.cache` da rota
saiu com **35,5 MiB** contra o teto de **25 MiB** do Cloudflare Workers.

O número que importa não é o volume — é a inflação:

| | |
|---|---:|
| texto real das 15.318 ementas | **4,7 MiB** |
| `.cache` gerado | **35,5 MiB** |
| razão | **7,5×** |

O payload vai embutido **duas vezes** (HTML e RSC flight) e cada linha repete o
nome de todos os campos. Quinze mil normas cabem folgadas em 25 MiB; quinze mil
normas serializadas assim, não.

**E não é caso isolado** — medido no mesmo dia:

```
36 MiB  ambiental/legislacao.cache      ← estourou
21 MiB  sp/educacao.cache               ← a 4 MiB do teto, sem ninguém ter mexido
11 MiB  bh/camara/legislacao.cache
9,5 MiB diamantina/camara/legislacao.cache
```

`sp/educacao` cobra a conta sozinho na próxima ingestão. **Tratar como caso da
legislação é adiar o mesmo susto.**

### A infraestrutura que já existe — e é melhor do que o problema exige

Não é preciso inventar nada. `scripts/gerar-indice-busca.mts` já grava em
`public/busca-indice/` (artefato de build, fora do git) **três grupos fatiados
independentes** — `docs`, `vocabulario`, `formas` — cada um com seu
`manifesto.json`. E `lib/busca/carregarIndice.ts` já sabe remontá-los no
navegador: os três grupos **em paralelo entre si**, e as fatias **em sequência**
dentro de cada grupo, com progresso em bytes.

A busca em si (`lib/busca/indice.ts`) já tem o que um assistente precisaria e
que ninguém quer reescrever: **sem acento**, **distância de edição** com
tolerância por tamanho de palavra, prefixo, e radicais pedidos ao próprio
Postgres na geração.

**Hoje só `app/busca/BuscaClient.tsx` consome isso.** É uma infraestrutura de
primeira servindo uma tela só.

### A migração, em ordem de urgência medida

| # | Rota | `.cache` hoje | Por que nesta ordem |
|---|---|---:|---|
| 1 | `sp/educacao` | **21 MiB** | está a 4 MiB do teto **sem ninguém ter mexido**; é o próximo a estourar, e sozinho |
| 2 | `bh/camara/legislacao` | 11 MiB | mesma forma, mesmo destino |
| 3 | `diamantina/camara/legislacao` | 9,5 MiB | idem |
| 4 | `ambiental/legislacao` | corrigida em 15/08 pelo dono | entra depois **como conversão durável**, não como conserto |

O item 4 merece cuidado: já foi consertado hoje por enxugamento de payload (a
opção 1 do handoff). Convertê-lo para o índice é a opção 2 — a durável.
**Não refazer enquanto o deploy do dia não tiver assentado**, para não colidir
com a máquina que publica.

### A regra que evita a próxima ocorrência

> **Nenhuma rota entrega coleção inteira como props de componente de cliente.**
> Acima de ~2 mil linhas, ou serve do índice fatiado, ou pagina no servidor.

E uma trava barata que ainda não existe: **medir o maior `.cache` no fim do
build e falhar acima de 20 MiB** (não 25 — margem para o dado crescer entre
dois deploys). `scripts/preflight-deploy.mts` é o lugar. Hoje o estouro só
aparece no `cf:deploy`, ou seja, **depois** de 6 a 7 minutos de build gastos.

---

## Parte 2 — O que vai chegar, e como cada coisa entra no índice

O índice hoje indexa o que a `/busca` cobre. O que a sessão de 15/08 produziu
ainda está fora dele:

| Acervo | Volume medido | Como entra |
|---|---:|---|
| **ComunicaBR MG** | 853 municípios, 174.012 itens (67.566 com valor) | **por município**, nunca inteiro: cada cidade carrega a própria fatia |
| **Rouanet/SALIC** | 7.206 projetos MG; 20.785 incentivadores MG | por município e por CNPJ do incentivador |
| **Legislação** | 15.318 normas (6.378 est. + 8.940 fed.) | já é o caso de uso original; 651 com URN canônica |
| **Clipping Paraopeba** | 149 + 46 + 59 = 254 itens | pequeno, entra inteiro |
| **Linha do tempo** | 23 marcos | pequeno |
| **Alertas de território** | 21 lavra autorizada + 271 interesse | pequeno, mas é o de maior valor por item |

**A lição do ComunicaBR vale para todos.** Aquele acervo cabe em 2,26 MB porque
os 853 municípios compartilham a **mesma estrutura**: o arquivo interna **366
rótulos** e **um** esqueleto, e cada município referencia por índice. Gravar
objeto completo daria dezenas de MB. O índice fatiado deve usar o mesmo
princípio — e `lib/comunicabr/arquivo.ts` já é a implementação de referência
dentro deste repositório.

⚠️ **Cada acervo carrega a própria ressalva para dentro do índice.** O
ComunicaBR tem 39% dos itens vazios e **quatro categorias zeradas em todos os
municípios** — isso é lacuna do governo federal, não da cidade. Um índice que
guarde só o que tem valor faz o assistente responder com falsa completude, que
é pior que não responder.

---

## Parte 3 — O assistente: sem modelo por padrão, com modelo quando precisar

O dono pediu LLM, **e pediu que ele rode sem LLM sempre que possível**. Isso não
é meio-termo: é a arquitetura certa aqui, porque o portal é estático e a maioria
esmagadora dos pedidos é navegação, não conversa.

### A escada, e ela sobe um degrau por vez

| Degrau | O que resolve | Custo | Precisa de rede? |
|---|---|---|---|
| **0. Rota direta** | "abrir Betim no mapa", "saúde em BH", "termos" | ~0 | não |
| **1. Índice estático** | "onde fala de barragem em Brumadinho", "quantas normas de mineração" | baixar fatias | sim, sem modelo |
| **2. Composição determinística** | "compare Betim e Contagem", "o que falta em mulheres aqui" — junta respostas do degrau 1 com regra escrita | ~0 sobre o degrau 1 | não além dele |
| **3. LLM** | pergunta em linguagem livre que os degraus acima não casaram | chave + rota dinâmica | sim |

**O degrau 3 só é acionado quando os anteriores devolvem vazio** — e a tela diz
qual degrau respondeu. Não é detalhe de engenharia: um assistente de portal de
transparência que responde por modelo quando podia responder por índice troca
uma resposta verificável por uma plausível.

### Por que o degrau 0 e o 2 cobrem quase tudo

Os comandos que o dono descreveu — abrir página, abrir município no mapa,
voltar no menu — **não têm ambiguidade linguística**. `/funcaosocialterra/mapa`
já aceita `?camada=…&idx=…` (é o que o botão "Ver no mapa" dos alertas usa
hoje), e as rotas de cidade são `/[municipio]/[secao]`. Casar texto com essa
lista é comparação de string sem acento — o `lib/busca/normalizar.ts` já faz.

> ### ⚠️ Correção de 15/08, vinda da implementação
>
> Este plano dizia que "a lista de rotas e municípios **já existe** no índice
> estático da `/busca`". **Existe, e é a fonte errada para isso** — ela está
> misturada a 8.979 documentos, e o índice inteiro pesa **~5,0 MB** (docs
> 3.614 KB em 2 fatias, vocabulário 1.188 KB, formas 264 KB; e o vocabulário já
> subiu de 11.561 para 31.375 lexemas depois dessa medição).
>
> Baixar 5 MB para descobrir que "saúde em BH" é `/bh/saude` é **pagar o acervo
> inteiro por uma tabela de rotas**.
>
> O que a implementação fez, e é melhor: **catálogo próprio de navegação** — 33
> sufixos de cidade × 6 cidades + 43 rotas gerais = **241 destinos** em
> **2.467 B gzip (2,4 KiB)**, ou **0,078% do teto de 3 MiB** do Worker. Três
> ordens de grandeza de folga.
>
> O índice de documentos não sumiu do desenho: virou o **degrau 1**, carregado
> **sob demanda** e só quando a navegação não resolve. E é justamente por ele
> pesar 5 MB que o botão de interromper tem o que interromper — o requisito de
> interface e a decisão de arquitetura são a mesma coisa aqui.

O degrau 2 é o que transforma o assistente de menu em ferramenta: "o que este
município tem de pior" é uma **regra escrita** sobre os dados (maior lacuna,
maior sobreposição, maior valor monetário), não uma pergunta para modelo.

### O que o LLM entra fazendo, e o que ele nunca faz

**Entra:** interpretar pergunta torta ("e aquele negócio da barragem que caiu?"),
reformular para os termos do índice, e resumir vários resultados em uma frase.

**Nunca:** produzir número. O número vem do índice; o modelo só o embrulha. Toda
resposta cita a página e linka. Se o índice não tem, a resposta é **"não sei, e
aqui está o que existe perto"** — nunca uma estimativa.

**E o portal continua inteiro sem ele.** A chave é opcional: sem `LLM_API_KEY`
o assistente perde o degrau 3 e mantém 0, 1 e 2. Isso é exigência, não conforto
— o site é servido de Static Assets e não pode depender de terceiro para
navegar.

### Onde o modelo mora, já que o site é estático

Rota `*.din.ts` (o repositório já tem a convenção: essas extensões só entram no
alvo Cloudflare, e o export estático as ignora). A chave fica em secret do
Worker, nunca no cliente. **O prompt do modelo recebe só o trecho do índice já
recuperado** — nunca o acervo inteiro, que além de caro reintroduziria o
problema de payload por outra porta.

### O que a interface exige, e não é negociável

Já registrado no §N8 do plano de 15/08, repetido aqui porque agora tem
consequência de arquitetura:

- **`prefers-reduced-motion`** desliga a animação de "pensando". O portal é lido
  por quem está sob estresse.
- **Três temas, alto contraste em 7:1.** Todo estado novo passa nos três. Medir
  contraste nesta máquina tem a armadilha da transição congelada (`transition:
  background .3s` no `body`): injetar `transition:none !important` antes.
- **Interromper interrompe de verdade** (`AbortController`) — e no degrau 3 isso
  significa abortar a requisição, não só esconder a resposta.
- **A contagem de tempo permanece visível depois da resposta.** Num portal de
  transparência, quanto demorou é informação — e é o que deixa visível quando o
  degrau 3 foi acionado.
- **Nenhuma biblioteca de animação nova** sem medir o bundle. CSS puro.

---

## Ordem sugerida

1. **Trava de tamanho no `preflight-deploy.mts`** (falhar acima de 20 MiB) —
   barata, e impede a repetição enquanto o resto anda.
2. **`sp/educacao` para o índice fatiado** — é o próximo a estourar.
3. **Assistente degraus 0 e 2** — entrega os botões, os prompts sugeridos, o
   voltar e a execução de comando sem tocar em arquitetura.
4. **Indexar os acervos novos** (ComunicaBR por município primeiro), com a
   ressalva de cada um viajando junto.
5. **Degrau 1 no assistente** — busca de verdade, ainda sem modelo.
6. **Degrau 3 (LLM)** — por último, opcional, e com a obrigação de citar.

Os itens 1 e 2 são dívida de infraestrutura e destravam publicação; 3 a 6 são
produto. Se só houver fôlego para uma coisa, é o item 1: ele custa pouco e
impede que o próximo deploy morra depois de sete minutos de build.
