# Clima e risco: AdaptaBrasil e INMET — o que foi medido, o que ficou

Primeira fatia de `docs/PLANO-BASES-CLIMA-E-RISCO.md`, a rodada que o plano
coloca em primeiro e terceiro lugares da lista de prioridade: **AdaptaBrasil**
(índice de risco climático por município, licença clara, 853 cidades numa
chamada) e **INMET avisos ativos** (o "agora" que nenhuma outra fonte de
clima do plano dá).

Tudo abaixo foi **medido em execução real contra as fontes ao vivo em
2026-08-15**. Nenhum número é estimativa. Onde não deu para medir — e há um
caso grande, a carga no banco —, está dito que não deu.

O BATER (IBGE/CEMADEN), que é o item que responde "não é risco, é gente"
(**1.377.577 pessoas expostas em MG**), **não foi tentado nesta rodada**, por
decisão de escopo: o plano registra a geometria dele atrás de desafio do
Cloudflare (403 em duas tentativas) e o caminho é navegador manual ou pedido
ao IBGE, não código.

---

## 1. Resumo

| | AdaptaBrasil | INMET avisos ativos |
|---|---|---|
| Coletor | `etl/betim/etl/apis/adaptabrasil_risco.py` | `etl/betim/etl/apis/inmet_avisos.py` |
| Tabela | `adaptabrasil_indicadores` (`0074`) | **nenhuma nesta rodada** |
| Linhas medidas | **6.824** (853 municípios × 8 indicadores) | 9 avisos distintos, 4 tocando MG |
| Estado | migration **commitada, NÃO aplicada** | leitura funcionando (`--sondar`) |
| Licença | **CC-BY-SA**, confirmada | **domínio público**, confirmada |
| Natureza do dado | ETL periódico (ano-base 2015) | vivo, muda por hora |

---

## 2. ⚠️ A carga NÃO rodou — e por quê

**Nenhuma linha foi gravada em banco nenhum nesta rodada.** Não é escolha de
escopo, é ambiente:

- A **Neon** está em **HTTP 402** até 01/09 e, por instrução, não se toca
  nela nesta rodada de qualquer forma.
- O **Postgres local desta máquina** existe (serviço `postgresql-x64-18`,
  ouvindo em **5433**, não na 5432 que `docs/build-em-outro-pc.md`
  documenta), mas **exige senha que não está em nenhum arquivo do repositório
  nem do ambiente** (`etl/betim/.env` aponta para a Neon; não há `pgpass`;
  `pg_hba.conf` é `scram-sha-256` em todas as linhas). Esta máquina não é a
  máquina de build — não há `logs/` de rotina aqui.

Então o que dá para afirmar sobre a carga, sem banco, foi verificado offline
e está verificado:

- **Colunas batem**: as 13 chaves que o coletor produz são um subconjunto
  exato das 17 colunas da `0074` (as 4 restantes são `id`, `created_at`,
  `updated_at` e default). Sem coluna sobrando, sem coluna faltando.
- **`on_conflict` bate com a `unique`**: `id_municipio, indicador_id, ano,
  cenario_id` nos dois lados.
- **A FK não vai estourar**: os **853** `geocod_ibge` do AdaptaBrasil casam
  com os **853** `id_ibge` semeados na `0057_ref_municipios_mg.sql` —
  **0 sem correspondência**, 0 sobrando dos dois lados.

Para aplicar, na máquina de build (com `DATABASE_URL` **local**, nunca a
Neon):

```bash
psql "$DATABASE_URL" -f supabase/betim/migrations/0074_adaptabrasil_risco_climatico.sql
cd etl/betim && python -m etl.apis.adaptabrasil_risco     # grava as 6.824 linhas
```

(O runner `apps/web/scripts/aplicar-migration.mts` **não serve** para banco
local — fala WebSocket com a Neon. `psql -f`, como o próprio
`docs/build-em-outro-pc.md` avisa.)

---

## 3. AdaptaBrasil — 853 municípios, 8 indicadores, 6.824 linhas

Fonte: `https://sistema.adaptabrasil.mcti.gov.br/api/`, REST, sem
autenticação.

```
GET /api/hierarquia/adaptabrasil
    → HTTP 200, 1.486.690 bytes, 558 indicadores
GET /api/mapa-dados/MG/municipio/{indicador}/2015/null/adaptabrasil
    → HTTP 200, 853 registros por indicador (174.590 bytes no 60001)
```

O que foi coletado (medido, `--sondar`, 2026-08-15):

| id | Indicador | Dentro de | Municípios |
|---:|---|---:|---:|
| 60001 | Deslizamento de terra | 60000 | 853 |
| 60002 | └ Vulnerabilidade | 60001 | 853 |
| 60003 | └ Exposição | 60001 | 853 |
| 60004 | └ Ameaça | 60001 | 853 |
| 60041 | Inundações, enxurradas e alagamentos | 60000 | 853 |
| 60042 | └ Vulnerabilidade | 60041 | 853 |
| 60043 | └ Exposição | 60041 | 853 |
| 60044 | └ Ameaça | 60041 | 853 |
| | **Total** | | **6.824** |

Distribuição por faixa dos dois índices de manchete (as 853 cidades de MG,
ano-base 2015):

| Faixa | Deslizamento (60001) | Inundação (60041) |
|---|---:|---:|
| Muito baixo | 31 | 11 |
| Baixo | 287 | 188 |
| Médio | 342 | 407 |
| Alto | 161 | 228 |
| Muito alto | 32 | 19 |

Extremos medidos: **Santa Cruz de Minas** é o teto nos dois (1,00 em
deslizamento, 0,94 em inundação).

### 3.1 ISTO É ÍNDICE, NÃO É GENTE

Todo `valor` é um **índice composto de 0 a 1** calculado pela metodologia do
AdaptaBrasil. **Não é porcentagem, não é número de pessoas, não é número de
domicílios** — nem quando o nome do indicador parece dizer isso: o
subindicador 60039 chama-se "Domicílios em áreas de risco" e vale **0,32** em
Brumadinho; isso é posição na escala, não 32 domicílios.

Quem quiser publicar **gente** precisa do BATER (§2 do plano), que não está
aqui. É a razão de a `0074` guardar `faixa` (o rótulo da própria fonte) junto
de todo número: a faixa é o que a fonte autoriza dizer em linguagem comum; o
número solto, não.

### 3.2 O caso que prova a regra: **Belo Horizonte vale 0,00**

O achado mais importante desta rodada, e ele não estava no plano.

**Belo Horizonte pontua 0,00 ("Muito baixo") nos DOIS índices de manchete** —
deslizamento e inundação. Só ela e Funilândia zeram entre as 853. É a mesma
capital que o BATER/IBGE mede com **389.218 pessoas em área de risco**
(16,4% da população do município).

Não é erro de coleta. Abrindo as componentes de BH na mesma chamada:

| Componente | Valor | Faixa |
|---|---:|---|
| Ameaça (60004) | 0,86 | Muito alto |
| Exposição (60003) | 0,91 | Muito alto |
| Domicílios em áreas de risco (60039) | **1,00** | Muito alto (o teto) |
| Vulnerabilidade (60002) | **0,00** | Muito baixo |
| **Risco (60001) = Ameaça × Exposição × Vulnerabilidade** | **0,00** | **Muito baixo** |

A capacidade adaptativa da capital zera o produto — e leva junto a ameaça, a
exposição e as moradias em risco. **Publicar só o 60001 diria à cidade com
mais gente em área de risco de Minas que o risco dela é muito baixo.**

Consequências, já embutidas no código e no esquema:

1. O coletor coleta **8 indicadores por padrão**, não 2: os índices de
   manchete e as três componentes de cada um. A tela pode escolher o que
   mostrar; o banco não pode escolher não ter a decomposição.
2. A `0074` guarda `indicador_pai_id` e `nivel`, porque os nomes das
   componentes se repetem ("Vulnerabilidade" é 60002 **e** 60042) e agrupar
   por nome mostraria o mesmo rótulo duas vezes com números diferentes.
3. **Requisito de tela, não implementado nesta rodada**: qualquer superfície
   que mostre o índice de nível 2 tem de poder abrir as três componentes ao
   lado, com link para a metodologia do AdaptaBrasil.

Comparação útil para calibrar a leitura (medido):

| Município | Deslizamento | Vulnerab. | Exposição | Ameaça |
|---|---:|---:|---:|---:|
| Betim (3106705) | 0,59 Médio | 0,12 | 0,84 | 0,86 |
| Brumadinho (3109006) | 0,37 Baixo | 0,24 | 0,34 | 0,46 |
| Belo Horizonte (3106200) | **0,00** | **0,00** | 0,91 | 0,86 |

### 3.3 Armadilhas medidas

1. **Sem `User-Agent`, a API devolve HTTP 403** (919 bytes). O plano não
   registrava esta. Não é bloqueio a robô: o UA do projeto
   (`ControlePopular/1.0`) responde 200 — não é preciso fingir navegador.
2. **Ano errado devolve `[]` com HTTP 200**, em silêncio (armadilha que o
   plano já tinha registrado). O coletor **não** tem ano hardcoded: lê
   `years` da hierarquia por indicador e usa o menor (o presente). Resposta
   vazia é ABORT, nunca "coletei zero".
3. **Ano futuro exige cenário, e o id do cenário está no nó do SETOR.** O
   60001 tem `scenarios: null`; quem lista é o 60000 (**40** Otimista/RCP4.5,
   **41** Pessimista). Medido: `/60001/2030/null/` → `[]` (2 bytes);
   `/60001/2030/40/` → **853 registros, 172.785 bytes**. Esta rodada carrega
   só o presente; a tabela já cabe a projeção.
4. **`geocod_ibge` já vem como texto de 7 dígitos**, no formato de
   `ref_municipios_mg.id_ibge` — sem `LPAD`.
5. **`unique` com `NULL` não deduplica.** `cenario_id` é NULL no presente; um
   `unique` comum nunca casaria essas linhas e cada rodada duplicaria as
   6.824 em silêncio. A `0074` usa `unique nulls not distinct` (Postgres 15+;
   a Neon roda **17.6**, medido no cabeçalho do dump em
   `X:/DevCoder/_migracao-neon/dump/schema.sql`).

### 3.4 Licença

**CC-BY-SA**, confirmada em `adaptabrasil.mcti.gov.br/sobre/termos-de-uso`,
uso comercial permitido, com **citação obrigatória** no formato:

> "AdaptaBrasil MCTI – Setor(es) Estratégico(s) [nome], acessado em [data]
> através do link [LINK]"

Por isso `setor_nome`, `fonte_url` e `atualizado_em` são colunas NOT NULL da
`0074` e o coletor grava `atualizado_em` a cada rodada em vez de deixar no
default: sem os três, a citação exigida pela licença não pode ser montada na
tela — e sem a citação, o uso descumpre a licença.

---

## 4. INMET avisos ativos — 9 avisos, 4 sobre MG

Fonte: `https://apiprevmet3.inmet.gov.br/avisos/ativos`, sem autenticação.
**HTTP 200, 466.361 bytes** na coleta de 2026-08-15 (o plano mediu 374.887
bytes em 13–14/08 — o tamanho acompanha quantos avisos estão no ar).

**Esta rodada entrega só o coletor, em modo leitura (`--sondar`)**. A tabela
`inmet_avisos` (DDL pronta no plano §4) fica para a próxima: o escopo desta
rodada deu coletor + tabela + carga ao AdaptaBrasil e só o coletor ao INMET.
Um `sync()` gravando em tabela inexistente falharia na cara; um `sync()`
vazio mentiria.

### 4.1 O que o INMET devolveu no momento da coleta

**11 entradas** (7 em `hoje`, 4 em `futuro`) = **9 avisos distintos** por
`id_aviso`. Quatro cobrem municípios de Minas:

| id_aviso | Tipo | Severidade | Janela (como a fonte escreve) | Municípios | em MG |
|---:|---|---|---|---:|---:|
| 28030 | Baixa Umidade | Perigo Potencial | 14/08 10:00 → 16/08 22:00 | 2.680 | **636** |
| 28033 | Baixa Umidade | **Perigo** | 14/08 12:00 → 15/08 18:00 | 1.450 | **237** |
| 28043 | **Tempestade** | Perigo Potencial | 15/08 11:00 → 15/08 23:59 | 249 | **74** |
| 28044 | Baixa Umidade | **Perigo** | 16/08 12:00 → 16/08 18:00 | 570 | **11** |
| 28036 | Tempestade | Perigo Potencial | 15/08 00:00 → 23:59 | 1.081 | 0 |
| 28038 | Tempestade | Perigo | 15/08 00:00 → 23:59 | 839 | 0 |
| 28039 | Tempestade | Perigo Potencial | 16/08 00:00 → 23:59 | 266 | 0 |
| 28041 | Ventos Costeiros | Perigo | 15/08 12:00 → 23:59 | 23 | 0 |
| 28042 | Ventos Costeiros | Perigo Potencial | 15/08 08:03 → 16/08 23:59 | 67 | 0 |

**Isto muda o que o plano registrou.** Em 13–14/08 o levantamento mediu
"zero avisos de chuva intensa/tempestade ativos para MG — as tempestades
ativas hoje são só na região Sul". Em 15/08 há um: o **28043, Tempestade,
cobrindo 74 municípios de Minas**, com texto do próprio INMET:

> risco: "Chuva entre 20 e 30 mm/h ou até 50 mm/dia, ventos intensos
> (40-60 km/h), e queda de granizo. Baixo risco de corte de energia
> elétrica, estragos em plantações, queda de galhos de árvores e de
> alagamentos."

Os municípios cobertos são do sul/sudeste do estado (Aiuruoca, Alagoa, Além
Paraíba, Arantina, Argirita...). É exatamente o caso de uso que o plano
descreve: cruzar aviso ativo com a camada de barragens/ZAS que o portal já
publica.

### 4.2 Armadilhas medidas

1. **`municipios` e `geocodes` são STRING, não lista.** O plano os descreve
   como lista; na resposta real são texto único separado por vírgula
   (`"Abadia dos Dourados - MG (3100104),Abaeté - MG (3100203),..."` —
   74.908 caracteres no maior aviso de hoje). Iterar como lista percorre
   caractere a caractere.
2. **`poligono` é string com JSON dentro**, não objeto — precisa de um
   `json.loads` a mais.
3. **`hoje` e `futuro` se sobrepõem**: 28030 e 28042 aparecem nos dois
   blocos, mesmo `id_aviso` e mesmo `id_sequencia`. Somar os blocos conta
   aviso duas vezes (11 ≠ 9).
4. **Data com fuso, hora sem fuso.** `data_inicio` é
   `"2026-08-14T00:00:00.000Z"` (meia-noite UTC) e `hora_inicio` é `"10:00"`
   à parte. Colar as duas e chamar de UTC desloca o aviso em 3 h. O coletor
   mostra a janela como a fonte escreve; **resolver o fuso é requisito da
   migration que ainda não existe**, e é a primeira decisão da próxima
   rodada.
5. **UA de navegador NÃO é obrigatório hoje.** O plano registrou conexão
   recusada sem UA; medido em 15/08, o endpoint respondeu HTTP 200 sem UA
   nenhum, com UA de `python-requests` e com o UA do projeto. Quem depurar
   não deve procurar aqui a causa de uma falha de rede. (Ao contrário do
   AdaptaBrasil, onde o UA ausente **é** 403 — as duas fontes se comportam
   ao contrário do que o plano supunha.)

### 4.3 Licença

**Domínio público**, confirmada na própria resposta do INMET
(`<copyright>public domain</copyright>` no XML de `/avisos/rss`, com o texto
"O conteudo deste site, podera ser reproduzido desde que citada a fonte").
Citar "INMET — Aviso Meteorológico" basta.

---

## 5. O que ficou para a próxima rodada

1. **Aplicar a `0074` e rodar a carga** na máquina de build, com
   `DATABASE_URL` local. É o único item bloqueado por ambiente, não por
   trabalho: tudo que dava para verificar sem banco (colunas, `on_conflict`,
   FK contra as 853 da `0057`) está verificado acima.
2. **Tabela `inmet_avisos` + job periódico** (DDL no plano §4). Primeira
   decisão: o fuso da janela (armadilha 4.2.4). Segunda: cruzar `geocodes`
   com `ref_municipios_mg` para gravar só os municípios de MG, ou guardar o
   array nacional inteiro.
3. **Tela.** Nada de front-end entrou nesta rodada. O requisito não
   negociável está no §3.2: **índice de manchete nunca aparece sozinho** —
   ou vem com as três componentes e o link da metodologia, ou não vem.
4. **Projeção 2030/2050** (cenários 40/41): a tabela já cabe, o coletor já
   aceita `--ano`/`--cenario`, a chamada já foi medida. É decisão de produto.
5. **BATER (IBGE/CEMADEN)** — as **1.377.577 pessoas expostas em MG**
   continuam fora do portal, e é o maior ganho cívico da lista. A tabela por
   município não depende da geometria; a geometria depende de acesso manual
   ao site do IBGE ou de pedido direto ao instituto. **Não foi tentado nesta
   rodada, por instrução.**

---

*Coletado e medido em 2026-08-15. Todo endpoint citado foi chamado; toda
contagem saiu de execução real. A carga no banco não rodou, e isso está dito
no §2 em vez de escondido.*
