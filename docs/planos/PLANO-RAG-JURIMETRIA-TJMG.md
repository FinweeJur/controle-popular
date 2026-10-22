# Plano de RAG para a jurimetria do TJMG

> **Tipo:** PLANO
> **Domínio:** judiciário, RAG, dados públicos
> **Última medição:** 2026-10-21
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [MANUAL-RAG-E-LLM.md](../03-desenvolvimento/MANUAL-RAG-E-LLM.md), [PLANO-RAG-COMPLETO.md](../historico/planos/PLANO-RAG-COMPLETO.md), [ESTADO.md](../02-estado/ESTADO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** rag, jurimetria, tjmg, jurisprudência, mapa, índice, facetas, lgpd, captcha, brumadinho, mariana, barragens

## Sumário

- [Propósito](#propósito)
- [Veredito executivo](#veredito-executivo)
- [O que o RAG atual já faz bem](#o-que-o-rag-atual-já-faz-bem)
- [O que falta para receber o TJMG](#o-que-falta-para-receber-o-tjmg)
- [Diagnóstico medido do corpus](#diagnóstico-medido-do-corpus)
- [Gate 0 — conformidade e proveniência](#gate-0--conformidade-e-proveniência)
- [Arquitetura proposta](#arquitetura-proposta)
- [Contrato de dados](#contrato-de-dados)
- [Como o LLM consulta](#como-o-llm-consulta)
- [Temas, palavras-chave e relações](#temas-palavras-chave-e-relações)
- [RAG global e RAG de domínio](#rag-global-e-rag-de-domínio)
- [Fases de execução](#fases-de-execução)
- [Critérios de pronto](#critérios-de-pronto)
- [Riscos e decisões pendentes](#riscos-e-decisões-pendentes)
- [Origem / Histórico](#origem--histórico)

## Propósito

Planejar a entrada da jurimetria do TJMG no RAG do Controle Popular sem
transformar o assistente global em um depósito de 5 mil acórdãos. O corpus
tem ementa, metadados, PDFs e texto integral; o RAG atual tem 450 pedaços
curtos e curados. São escalas e naturezas diferentes.

**Decisão desta fase:** executar só a arquitetura, o contrato, o mapa e o
índice. Nenhum dado do TJMG entra no repositório enquanto o gate de
conformidade não fechar. O worktree é `rag-jurimetria-tjmg`.

## Veredito executivo

1. **O RAG atual segue boas práticas de base**, mas não está pronto para o
   TJMG. Ele é uma lista plana de 450 pedaços, com citação, abstenção e teste
   dourado; não tem facetas, mapa, hierarquia nem índice por domínio.
2. **Não é o caso de despejar os acórdãos no `montarAcervo()`.** Isso
   aumentaria o primeiro carregamento, pioraria a precisão e misturaria
   instituições com jurisprudência.
3. **É o caso de dividir por temas, sim — mas tema sozinho não basta.**
   O desenho precisa de três camadas: mapa curado, índice facetado e grafo de
   relações.
4. **Palavras-chave ajudam**, desde que sejam curadas, com sinônimos e
   aliases. Palavra-chave inventada pelo modelo não é índice.
5. **Hiperlink é parte do dado**, não enfeite: cada decisão aponta para a
   página do tema, a decisão, a fonte oficial e as relacionadas.
6. **O LLM deve consultar por ferramenta**, em sequência curta:
   `mapa` → `consultar` → `obter` → responder com citação. Não deve receber
   o corpus inteiro no prompt.

## O que o RAG atual já faz bem

Medido em 21/10/2026 no worktree:

| Item | Medição | Leitura |
|---|---|---|
| Acervo global | 450 pedaços; 0,27 MB de JSON | Pequeno, cabe em memória |
| Texto médio | 292 caracteres; máximo 1.552 | São cartões curados, não documentos longos |
| Frente Judiciário | 31 pedaços | Falta a jurisprudência do TJMG |
| Ranking | 0,6 cosseno + 0,4 lexical, com IDF | Híbrido e determinístico |
| Abstenção | top-1 abaixo de 0,10 (híbrido) ou 0,45 (lexical) | Existe e está testada |
| Citação | verificador + uma re-tentativa | Boa base, mas não valida número contra fonte |
| Golden set | 22 casos | Pequeno para um domínio jurídico |
| Segurança | sanitização de entrada e rate limit | Existe no endpoint global |

O que merece preservação:

- **pedaço sem rota/fonte não entra** (`exigirPecasCompletas`);
- **ids estáveis e deduplicação** para a numeração `[n]`;
- **fallback lexical** quando não há embedding;
- **abstenção antes de chamar o modelo**;
- **teste dourado** rodando a recuperação real.

## O que falta para receber o TJMG

| Lacuna | Efeito no TJMG | Correção |
|---|---|---|
| Acervo plano, sem facetas | “Água em Brumadinho” e “água em Mariana” competem no mesmo espaço | Índice por tema, comarca, norma, dano, ano e resultado |
| Um pedaço por fonte | Ementa de 1.300 caracteres vira um bloco único; texto integral nem entra | Chunk por ementa + trechos; texto integral fora do índice inicial |
| Sem mapa do acervo | O modelo não sabe quais temas existem nem onde procurar | `mapa.json` curado, com sinônimos e relações |
| Sem grafo | Não há “decisões relacionadas” | Links por processo, tema, norma, dano, câmara e comarca |
| Embedding no primeiro pedido | 450 pedaços já custam; 5 mil custariam muito mais | Índice lexical/facetado primeiro; embedding só nos candidatos |
| `topK = 3` | Insuficiente para pergunta jurídica multi-fonte | `topK` 8–12 no domínio, com contexto controlado |
| Golden set de 22 | Não cobre teses, normas e danos | 50–100 casos só de jurimetria |
| Sem ACL/classe de dado | Acórdão tem nome de pessoa | Sanitização, minimização e log sem PII |

## Diagnóstico medido do corpus

Fonte: `X:\DevCoder\OpenCode\tjmg-jurimetria`, em 21/10/2026. O repositório
tem alterações de outra sessão; esta leitura não tocou nelas.

### Volume

| Arquivo/base | Medição |
|---|---|
| `tabelas/*_jurimetria.csv` | 6.672 linhas em 3 temas |
| Processos únicos | 5.426 |
| Linhas duplicadas | 1.246 |
| Processos em mais de um arquivo | 409 |
| `tabelas/_/jurimetria_consolidado.csv` | 3.314 linhas; só Brumadinho; 27 colunas |
| `tabelas/brumadinho_decisoes.csv` | 3.188 decisões; 2.970 processos únicos; 2.702 com inteiro teor |
| `parsed/` | 4.486 arquivos; 90,7 MB |
| `pdfs/_unificados/` | 4.147 arquivos; 108,7 MB |
| Ementas (6.672 linhas) | 3,31 MB de texto; 3,38 MB em JSON |

Conclusão: **o texto integral não entra no build do portal**. A ementa e os
metadados cabem; os 90 MB de texto não. O PDF fica como fonte oficial
linkada, não como peso de bundle.

### Qualidade

| Campo | Problema medido | Regra |
|---|---|---|
| `processo` | 20 caracteres; não é o número CNJ completo | Usar como chave secundária, nunca como única |
| `numero_acordao` | 1.017 linhas com `pendente` | Não é id |
| `desfecho` | 2.669 de 3.314 `indeterminado` no consolidado | Não tratar como resultado; rotular |
| `normas` | 1.241 vazias; `Lucros cessantes` e `Risco à vida` não são normas | Separar norma de categoria jurídica |
| `danos_pnab_peab` | 975 vazias; `pendente` é ausência | `null`, não categoria |
| `comarca` | `BELO`, `Belo Horizonte`, `BRUMADINHO` | Canonicalizar |
| `parte_recorrente` | `re`, vazio, `ambos`, `autor` | Não usar sem validação |
| `url_espelho` | 386 vazias no consolidado | `semFonte`, não inventar link |
| `arquivo_txt` | 404 vazias | Ementa ainda serve; marcar fonte |
| Duplicatas | 1.246 linhas e 218 processos repetidos em Brumadinho | Deduplicar e fundir temas |

O corpus é útil, mas **não está pronto para responder com número**. A
classificação de desfecho é majoritariamente `indeterminado`; o RAG precisa dizer
“não classificado” em vez de inferir.

## Gate 0 — conformidade e proveniência

**Bloqueio atual.** O `AGENTS.md` do `tjmg-jurimetria` declara captcha
automático com GLM-4V-Flash; o `README.md` do mesmo repo diz que o captcha é
resolvido por humano. As duas coisas não podem ser verdade ao mesmo tempo.
A regra global deste projeto proíbe burlar CAPTCHA, login, paywall ou rate
limit. Enquanto a coleta não for regularizada, **não entra dado novo**.

O que precisa ser resolvido antes da Fase 1:

1. **Coleta:** humano no loop ou fonte oficial/API; registrar a decisão.
2. **Licença:** o README diz AGPL-3.0-or-later, mas não há arquivo `LICENSE`
   na raiz. Não copiar código do repo sem esclarecer.
3. **Dado pessoal:** acórdão público pode conter nome, CPF e endereço.
   Varrer o dado, minimizar o trecho e não logar PII.
4. **Fonte:** usar o link oficial do TJMG (`www5.tjmg.jus.br`) ou declarar
   `semFonte`; nunca inventar URL.
5. **Snapshot:** gravar commit do repo, data de geração e hash do arquivo
   normalizado.

Enquanto o Gate 0 não fecha, a execução permitida é esta: contrato, mapa,
índice e testes, sem dados reais.

## Arquitetura proposta

```text
[PDF/ementa + metadados do tjmg-jurimetria]
        |
        v
[exportador normalizado: acervo.json]   <- roda no repo de origem
        |
        v
[mapa.json]  [indice facetado]  [relações]
        |            |              |
        +------------+--------------+
                     |
                     v
        [RAG de domínio /judiciario/jurisprudencia]
                     |
        +------------+-------------+
        |                          |
        v                          v
[chat do domínio]          [cartões de tema no RAG global]
```

### Camada 1 — mapa curado

Não é embedding. É um JSON legível e auditável com:

- temas canônicos;
- sinônimos e palavras-chave;
- normas e danos de cada tema;
- temas relacionados;
- contagens medidas;
- casos-guia;
- rotas internas.

Serve para o modelo saber **onde procurar** antes de procurar.

### Camada 2 — índice facetado

Filtros reais antes do ranking:

- tema;
- norma;
- dano PNAB/PEAB;
- comarca;
- ano;
- resultado;
- fonte (PDF/ementa);
- confiança;
- câmara/relator (quando confiável).

O ranking textual entra depois do filtro. Isso evita que “água” traga um
acórdão de outra bacia.

### Camada 3 — relações

Links calculados por coocorrência:

- mesmo processo;
- mesmo tema;
- mesma norma;
- mesmo dano;
- mesma comarca;
- mesma câmara;
- mesmo relator (com cautela).

As relações viram “decisões relacionadas” na página e no contexto do chat.
Não é GraphRAG completo; é um grafo de coocorrência auditável.

## Contrato de dados

O repo de origem exporta **um** arquivo normalizado; o portal não lê CSV
cru nem PDF.

```text
acervo-jurimetria.json
  meta: { repositorio, commit, geradoEm, fonte, ressalva }
  decisoes: DecisaoJurimetria[]
```

Campos mínimos de cada decisão:

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | estável; derivado de acórdão + processo + data |
| `tribunal` | `"TJMG"` | fixo |
| `temas` | string[] | slugs canônicos |
| `temasFonte` | string[] | slugs originais, para auditoria |
| `processo` | string | como veio; chave secundária |
| `numeroAcordao` | string \| null | `null` quando `pendente` |
| `classe` | string | texto da fonte |
| `relator` | string | texto da fonte |
| `dataJulgamento` | ISO \| null | normalizada |
| `dataPublicacao` | ISO \| null | normalizada |
| `comarca` | string \| null | canônica |
| `resultado` | enum | `favoravel`, `desfavoravel`, `parcial`, `indeterminado`, `nao_classificado` |
| `nexo` | enum | `afirmado`, `negado`, `misto`, `nao_abordado`, `nao_classificado` |
| `normas` | string[] | ids canônicos |
| `normasBrutas` | string[] | texto original, para auditoria |
| `danos` | string[] | ids PNAB/PEAB |
| `valorIndenizacao` | number \| null | `pendente` vira `null` |
| `fonte` | `"pdf"` \| `"ementa"` | de onde veio a classificação |
| `confianca` | `"alta"` \| `"media"` \| `"baixa"` | da classificação |
| `ementa` | string | texto oficial; não reescrito |
| `urlEspelho` | string \| null | link oficial ou `null` |
| `arquivoTxt` | string \| null | caminho relativo no repo de origem |

Regras de exportação:

- deduplicar por `numeroAcordao + processo + dataJulgamento + classe`;
- fundir `temas` quando a mesma decisão aparece em mais de um arquivo;
- preferir `fonte=pdf` e `confianca=alta` ao fundir;
- `pendente` não é valor: vira `null` ou `nao_classificado`;
- ementa não é resumida por LLM; o texto é o da fonte;
- nenhum PDF ou texto integral no JSON do portal nesta fase.

## Como o LLM consulta

O chat do domínio não recebe o acervo. Recebe o mapa resumido e ferramentas:

```text
1. mapa_jurimetria()
   -> temas, contagens, normas, danos e rotas

2. consultar_jurimetria({
     tema?, norma?, dano?, comarca?, ano?, resultado?, texto?, limite?
   })
   -> até 12 decisões com id, ementa curta, fonte e motivo

3. obter_decisao(id)
   -> metadados completos, ementa, fonte e relacionadas

4. responder com [n] e link
```

Limites:

- no máximo 3 chamadas de ferramenta por pergunta;
- no máximo 12 decisões no contexto;
- se não houver decisão, abster;
- se o resultado for `nao_classificado`, dizer isso;
- não afirmar número que não esteja na ementa ou no campo estruturado;
- não misturar decisões de bacias diferentes sem dizer.

## Temas, palavras-chave e relações

Temas canônicos iniciais (os slugs originais viram aliases):

| Tema | Slugs de origem | Palavras-chave |
|---|---|---|
| Atingidos por barragens | `atingidos-barragem`, `atingidos-barragens` | atingido, barragem, rejeito, reparação, indenização, auxílio emergencial, PTR, PNAB, PEAB |
| Rompimento de Brumadinho | `rompimento-brumadinho` | Brumadinho, Córrego do Feijão, Vale, zona de autossalvamento, emergência |
| Rompimento de Mariana | `rompimento-mariana` | Mariana, Fundão, Samarco, Rio Doce, BHP, Renova, repactuação |
| Atingidos por mineração | `atingidos-mineracao` | mineração, mineradora, minério, lavra, cava, rejeito |
| Direitos humanos | `direitos-humanos` | direitos humanos, vulnerabilidade, saúde, moradia, trabalho, educação |
| Direitos ambientais | `direitos-ambientais` | dano ambiental, poluição, degradação, licenciamento, APP, bacia, água |

Danos canônicos: os 12 da PNAB/PEAB, com `outros_pnab_peab` separado de
`pendente`. Normas canônicas: CF/88 arts. 5º e 225, Lei 7.347/85 (ACP),
Lei 8.078/90 (CDC), Lei 6.938/81 (PNEA), Lei 14.066/2020, PEAB/MG, PNAB,
Lei 9.605/98, Lei 12.651/2012, Convenção 169/OIT e Súmulas. `TAC` entra como
instrumento, não como norma.

Relações mínimas:

- `atingidos-barragens` ↔ `rompimento-brumadinho` ↔ `rompimento-mariana`;
- `atingidos-mineracao` ↔ `direitos-ambientais`;
- `direitos-humanos` ↔ `direitos-ambientais`;
- dano `agua_abastecimento` ↔ normas CF/88 art. 225 e PNEA;
- tema Brumadinho ↔ comarcas Brumadinho, Betim, Ibirité e Belo Horizonte.

## RAG global e RAG de domínio

**Não misturar.**

- **RAG global (Seu Nonô):** recebe 1 cartão por tema, com contagem, rota e
  2–3 casos-guia. É o suficiente para o cidadão descobrir que existe a
  jurisprudência e para o assistente encaminhar.
- **RAG de domínio (`/judiciario/jurisprudencia`):** carrega o acervo
  facetado, responde perguntas jurídicas e mostra decisões relacionadas.
- **Rota determinística:** pergunta com “jurisprudência”, “acórdão”,
  “TJMG”, “barragem” e “dano” pode ser encaminhada ao domínio antes de
  chamar o modelo.

O RAG global não ganha 5 mil embeddings. O domínio ganha um índice próprio,
carregado sob demanda, no molde de `documentos.ts`/`busca-indice`, não no
molde do `montarAcervo()`.

## Fases de execução

### Fase 0 — gate (bloqueada)

Fechar captcha/proveniência, licença, PII e snapshot. Sem isso, não há
exportação de dado real.

### Fase 1 — exportador no repo de origem

- normalizar, deduplicar e validar;
- gerar `acervo-jurimetria.json` com ementa + metadados;
- não copiar PDFs nem texto integral;
- rodar varredura de dado pessoal;
- registrar commit, data e hash.

### Fase 2 — contrato, mapa e índice no portal

- tipos e normalização;
- `construirIndice()` e `consultar()`;
- `construirMapa()` e `relacionadas()`;
- testes com fixture sintética;
- ainda sem dados reais (esta fase).

Entregue nesta sessão: `apps/web/lib/judiciario/jurimetria/` com tipos,
taxonomia, normalização, índice, mapa e 12 testes. Nenhum CSV, PDF ou ementa
do TJMG foi copiado para o repositório.

### Fase 3 — página de domínio

- `/judiciario/jurisprudencia`;
- busca e filtros por tema, norma, dano, comarca, ano e resultado;
- detalhe da decisão com ementa, fonte e relacionadas;
- exportação CSV/print conforme as qualidades da informação.

### Fase 4 — chat de domínio

- endpoint próprio;
- ferramentas `mapa`, `consultar`, `obter`;
- citação e abstenção;
- limite de chamadas e de contexto.

### Fase 5 — ponte com o RAG global

- cartões de tema no acervo;
- rota determinística para o domínio;
- sem despejar o corpus no índice global.

### Fase 6 — avaliação e operação

- golden set de 50–100 perguntas;
- métricas de retrieval, citação e abstenção;
- geração versionada, hash e monitoramento;
- revisão humana dos `nao_classificado`.

## Critérios de pronto

1. Zero dado do TJMG no repo antes do Gate 0.
2. 5.426 processos únicos, sem id duplicado.
3. Todo `resultado` e `nexo` normalizado; `nao_classificado` explícito.
4. Toda decisão com `urlEspelho` oficial ou `semFonte`.
5. Ementa preservada; nenhum texto reescrito por LLM.
6. Mapa com 6 temas, 12 danos, normas e contagens medidas.
7. Consulta por tema/norma/dano/comarca/ano/resultado com motivos.
8. Relacionadas por tema, norma, dano e comarca.
9. Nenhum asset acima de 2 MB por fatia; texto integral fora.
10. Testes de índice, mapa, deduplicação e abstenção verdes.
11. Golden set de domínio com 50+ casos e citação verificada.
12. Nenhum número afirmado sem fonte.

## Riscos e decisões pendentes

- **Captcha automático** — bloqueio de conformidade; decisão do dono.
- **Licença** — README AGPL sem `LICENSE`; não copiar código.
- **Qualidade do desfecho** — 80% `indeterminado`; não vender como taxa.
- **Duplicatas** — 1.246 linhas; deduplicar antes de contar.
- **Nomes em acórdãos** — dado público, mas minimizar e não logar.
- **Texto integral** — 90,7 MB; não entra no portal nesta fase.
- **Escala** — 5.426 decisões; índice lexical/facetado antes de embedding.
- **Staleness** — o corpus muda; versionar e datar.

## Origem / Histórico

Criado em 21/10/2026 no worktree `rag-jurimetria-tjmg`, a partir do pedido
do dono para aplicar o manual de RAG/LLM ao `tjmg-jurimetria` e ao RAG
existente do Controle Popular. A decisão desta sessão foi **só arquitetura,
sem dados**, por causa do gate de captcha/proveniência. As medições de
volume, duplicidade e qualidade saíram dos CSVs do repo de origem; nenhum
dado foi copiado para este repositório.
