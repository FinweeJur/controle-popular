# F0 — Descoberta de fontes

Registro linha a linha do que foi testado ao vivo, o que funcionou e o que
está bloqueado. Mesma função do `docs/F0-discovery.md` do app irmão
(/betim): impedir que alguém (inclusive uma sessão futura) refaça uma
investigação já concluída ou volte a bater numa porta comprovadamente
fechada.

> **Arquivo histórico, anterior à unificação em monorepo (2026-07-28).**
> Caminho de repo/banco citado aqui pode ser do `controle-popular-congresso`
> separado — no monorepo atual é `etl/congresso/etl/...`, banco é Neon
> (`apps/web/lib/db/client.ts`), não Supabase. O achado de fonte continua
> valendo, só o mapa de arquivo mudou.

---

## 1. Câmara dos Deputados — `dadosabertos.camara.leg.br/api/v2` ✅

**Verificado em 2026-07-22.** REST, JSON, **sem autenticação**, paginação por
`links[rel=next]`. É a espinha dorsal do projeto.

| Endpoint | Status | Observação |
|---|---|---|
| `/proposicoes?siglaTipo=&ano=&codTema=&dataApresentacaoInicio=` | ✅ | 2196 páginas × 2 itens só de PL/2026 (~4.400 PLs/ano) |
| `/proposicoes/{id}` | ✅ | única fonte de `keywords`, `urlInteiroTeor`, `statusProposicao` |
| `/proposicoes/{id}/temas` | ✅ | `codTema` + `tema` + **`relevancia`** (0 = mais relevante) |
| `/proposicoes/{id}/tramitacoes` | ✅ | histórico completo com despacho |
| `/proposicoes/{id}/autores` | ✅ | `uri` do deputado, `ordemAssinatura`, `proponente` |
| `/deputados` | ✅ | **`email` preenchido** — ver armadilha §1.1 |
| `/deputados/{id}` | ⚠️ | expõe **CPF** e data de nascimento — não gravar (LGPD) |
| `/orgaos?codTipoOrgao=2` | ✅ | comissões permanentes; **sem e-mail** — ver §1.2 |
| `/frentes` + `/frentes/{id}/membros` | ✅ | frentes parlamentares (= "bancadas temáticas"), membros com `titulo` |
| `/blocos`, `/partidos` | ✅ | `federacao: true` distingue federação de bloco |
| `/votacoes`, `/votacoes/{id}/votos` | ✅ | votações nominais |
| `/referencias/proposicoes/codTema` | ✅ | taxonomia oficial (34 Adm. Pública, 43 Direito Penal, 44 Direitos Humanos, 46 Educação, 48 Meio Ambiente, 52 Previdência, 56 Saúde, 57 Defesa e Segurança, 58 Trabalho…) |

### 1.1 ARMADILHA — o e-mail do deputado muda de lugar entre endpoints

```
/deputados       (lista)   → email no topo do objeto        ✅ preenchido
/deputados/{id}  (detalhe) → ultimoStatus.email             ❌ NULL
                           → ultimoStatus.gabinete.email    ✅ preenchido
```

Quem escrevesse `detalhe["ultimoStatus"]["email"]` — o campo de nome óbvio
— gravaria e-mail nulo para os 513 deputados e só descobriria ao enviar o
primeiro ofício. `etl/camara/parlamentares.py` lê a **lista** como fonte
primária e só usa o detalhe (pelo caminho do gabinete) como fallback.

Este é exatamente o caso que a regra "inspecione o JSON cru antes de
confiar no mapeamento" existe para pegar.

### 1.2 Comissões não têm e-mail na API

`/orgaos/{id}` devolve `sigla`, `nome`, `urlWebsite`, `sala`, datas — e
nada de e-mail. Para endereçar ofício à comissão como instituição, os
e-mails precisam ser semeados à mão a partir do site de cada uma (~25
permanentes, trabalho de uma vez). Enquanto isso, o app endereça a
comissão via seus **membros**, cujos e-mails a API entrega.

### 1.3 Não replicar classificador temático

A Câmara já classifica por tema oficial e por palavras-chave de indexação.
No app irmão, construir um classificador temático por regex custou uma
sessão inteira de calibração contra falso positivo. Aqui usa-se o oficial;
o esforço próprio vai todo para o eixo garantista/reducionista.

---

## 2. Senado Federal — parcial ⚠️

**API nova ✅** — `legis.senado.leg.br/dadosabertos/processo?sigla=PL&ano=2026&v=1`
devolve JSON limpo: `identificacao`, `ementa`, `situacaoAtual`,
`tramitando`, `dataUltimaAtualizacao`, `urlDocumento`, `objetivo`
(Iniciadora/Revisora). O detalhe (`/processo/{id}?v=1`) traz
`documento.indexacao` (palavras-chave oficiais do Senado) e
`conteudo.tipoNormaIndicada`.

**API legada ❌ bloqueada deste ambiente.** `/dadosabertos/senador/lista/atual`
e `/dadosabertos/materia/pesquisa/lista` caem em "Verificação de segurança
— Senado Federal" (challenge anti-bot) ou dão timeout (HTTP 000).
`/dadosabertos/parlamentar/*` e `/dadosabertos/comissao` devolvem **404** na
API nova — ou seja, ainda não foram migrados.

**`[VERIFY]` pendente:** lista de senadores + e-mails + comissões do Senado.
Ordem de tentativa recomendada:
1. API legada com `User-Agent` de browser, a partir do **GitHub Actions**
   (IP diferente do local — o bloqueio pode ser por reputação de IP);
2. **Playwright real** via script Python — no app irmão essa foi a saída
   quando o browser sandboxed falhava em domínio cross-origin;
3. CSV do portal de dados abertos do Senado.

Não bloqueia o lançamento: a Câmara sozinha sustenta o produto.

---

## 3. LexML ❌ e Planalto ⚠️

- **LexML** (`lexml.gov.br/busca/SRU`) cai no **mesmo challenge do Senado**.
  Não contar com ele como base de legislação existente.
- **Planalto** (`planalto.gov.br/ccivil_03/...`) responde 301/redirect a
  requisição simples. Usado só como **link de saída** para o usuário, não
  como fonte raspada.

**Consequência de desenho:** o grafo "PL → lei que ele altera" sai de um
extrator regex determinístico (`etl/normas.py`), não de LexML nem de LLM.

### 3.1 `etl/normas.py` — calibrado contra dado real ✅

Testado em 2026-07-22 contra **60 ementas reais** de PL/2026 da Câmara:

- 21/60 com referência normativa extraída, 39/60 sem;
- as 39 sem referência são genuinamente **leis novas** ("Institui a Política
  Nacional de…", "Institui o Dia Nacional de…") — negativo correto, não
  falso negativo;
- **zero falso positivo** na amostra inspecionada;
- casos multi-norma funcionam (uma ementa produziu
  `['lei:8078:1990', 'lei:13709:2018']`);
- 7 casos de regressão em `python -m etl.normas --testar`, todos passando.

Detalhes de calibração que já custaram caro em outro projeto e estão
resolvidos aqui: `nº`/`n.`/`n°`/`no` são todas variações reais; lookbehind
impede `lei` recapturar o que `lei complementar` e `decreto-lei` já
pegaram; artigos só são atribuídos quando há **uma única** norma citada
(com várias, atribuir artigo a norma exigiria análise sintática — e um
link errado é pior que link nenhum num app cuja premissa é ser auditável).

---

## 4. LLM local (Ollama) — testado ponta a ponta ✅ com ressalva

**Ambiente:** `llama3.1:8b-instruct-q4_K_M`, contexto 131k, em
`http://localhost:11434`. `format: "json"` do Ollama é *constrained
decoding* real, o que torna viável exigir saída estruturada de um 8B.

### 4.1 Resultado da primeira calibração da rubrica (2026-07-22)

Rodado com `python -m etl.smoke_analise` contra PLs reais da Câmara:

| Versão do prompt | Taxa de descarte |
|---|---|
| v0 (inicial) | **75%** |
| v1 (com fallback de âncora + exemplo) | **20%** |

**Modo de falha da v0, e por que ele é uma boa notícia:** o modelo devolvia
`dispositivo` **vazio** — não um artigo inventado. Ou seja, o guarda-corpo
("item sem dispositivo válido não entra no score") funcionou como
projetado: nenhuma citação falsa chegou ao banco. O problema era de
rendimento, não de veracidade.

**Correção:** o prompt passou a instruir explicitamente que, quando a
ementa não disser qual artigo é alterado, o modelo use uma das **âncoras**
do direito escolhido — que são, por definição da própria rubrica, a base
legal daquele direito, logo uma citação sempre correta. Mais um exemplo
resolvido no system prompt.

**Citações conferidas à mão depois da correção:**

| PL | Dispositivo citado | Confere? |
|---|---|---|
| 4764/2026 | Lei 10.406/2002 (Código Civil), art. 1.336 | ✅ é literalmente o que a ementa altera |
| 4763/2026 | Decreto-Lei 2.848/1940 (Código Penal), art. 217-A | ✅ idem |
| 4762/2026 | Lei 8.078/1990 (CDC), art. 4º | ✅ âncora correta para direitos do consumidor |
| 4761/2026 | Lei 8.080/1990 | ✅ âncora correta para saúde |

### 4.2 ⚠️ QUESTÃO EM ABERTO — possível viés de positividade

**Nas 5 proposições testadas, TODAS as classificadas saíram "garantista".**
Isso pode ser:
- (a) viés de amostra — os 5 PLs mais recentes são genuinamente protetivos; ou
- (b) viés do modelo, que tende a ler qualquer proposta como benéfica.

**Não dá para distinguir com 5 casos, e a diferença é decisiva:** se for (b),
o eixo inteiro do produto está quebrado, porque um classificador que nunca
diz "reducionista" não classifica nada.

**Só o conjunto balanceado de 30 PLs previsto em F4 responde isso** (10
claramente garantistas, 10 claramente reducionistas, 10 técnicos). **Não
construir nada em cima da análise antes desse teste.**

Sinal adicional a observar: o PL 4764 (honorários advocatícios em cobrança
de cota condominial) foi classificado como `direitos_consumidor` /
`amplia`. É defensável, mas contestável — a proposta também pode ser lida
como ampliação de ônus sobre o condômino inadimplente. Julgamento de
direção é justamente o que o conjunto balanceado precisa medir.

---

## Adendo — 2026-07-23 (implementação de F2/F3 e Senado)

Achados novos, todos verificados contra resposta real da API.

### Câmara — `/votacoes` tem limite de janela de data
`GET /votacoes?dataInicio=..&dataFim=..` devolve **504 upstream request
timeout** quando a janela é larga. Um mês estoura; uma semana passa.
Testado: `2025-06-01..2025-07-31` → 504; `2025-04-08..2025-04-15` → 200 com
40 votações. `etl/camara/votacoes.py` fatia em janelas de 7 dias por causa
disso, e trata falha de janela isoladamente — uma janela ruim não pode
derrubar o período inteiro.

### Câmara — voto nominal só existe em parte das votações
Amostra de votações de CCOM e SECAP(SGM): `/votos` devolveu **lista vazia**
em todas. Uma votação de **PLEN** (`2283136-39`, 2025-04-10) devolveu
**317 votos**. Não é erro nem falta de parâmetro: votação simbólica e
requerimento deferido por despacho não têm voto individual. A votação é
gravada mesmo assim; só não gera linhas em `votos`.

Shape do voto (conferido, não suposto):
```json
{ "tipoVoto": "Não", "dataRegistroVoto": "...",
  "deputado_": { "id": 141391, "nome": "...", "email": "dep...@camara.leg.br" } }
```
Atenção ao **underscore final** em `deputado_`.

### Câmara — inteiro teor é PDF
`urlInteiroTeor` responde `content-type: application/pdf` (~110 KB para um
PL curto). Extração com `pypdf` funciona bem: 5.127 caracteres limpos do
PL 4764/2026, com o texto normativo e a justificação legíveis.

Duas decisões de qualidade em `etl/inteiro_teor.py`:
- PDF que extrai menos de 200 caracteres é tratado como **digitalização sem
  camada de texto** e registrado como não extraído. Devolver o cabeçalho e
  fingir que é o inteiro teor seria pior que devolver nada — a análise
  rodaria sobre lixo achando que tem o texto.
- A limpeza **junta linha que não terminou em pontuação**. O PDF quebra
  linha a cada linha visual; sem juntar, uma frase vira cinco, e o `trecho`
  literal que o modelo é obrigado a citar sairia picotado.

### Senado — a API nova funciona e tem duas pegadinhas
`GET /dadosabertos/processo?sigla=PL&ano=2026&v=1` → **388 processos**,
JSON limpo, sem autenticação. `v=1` é obrigatório: sem ele a rota dá 404 ou
cai na API legada bloqueada.

1. A rota devolve **lista na raiz**, não `{"dados": [...]}` como a Câmara.
2. `tramitando` vem como **texto** `"Sim"`/`"Não"`, não booleano — comparar
   com `True` daria falso para todos.

`/processo/{id}?v=1` traz `documento.indexacao`, o equivalente do `keywords`
da Câmara (caixa alta, separado por vírgula com espaço duplo).

**`objetivo: "Revisora"`** significa que a proposição já existe na Câmara.
Gravar as duas como registros independentes mostraria o mesmo projeto duas
vezes ao usuário. A de-duplicação fica em aberto: casar o par exige o número
de origem, que nem sempre vem preenchido — melhor duplicar visivelmente do
que casar errado.

### Segue bloqueado (sem novidade)
Senadores, comissões do Senado e LexML continuam atrás do desafio anti-bot.
