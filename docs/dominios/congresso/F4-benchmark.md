# F4 — Benchmark da rubrica

> **Tipo:** DOMINIO
> **Domínio:** congresso
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** dominio, referencia

## Sumário

- [Propósito](#propósito)
- [1. A pergunta que motivou o teste](#1-a-pergunta-que-motivou-o-teste)
- [2. O conjunto — `etl/benchmark/casos.json`](#2-o-conjunto-etlbenchmarkcasosjson)
- [3. Resultado — Sonnet, 2026-07-22](#3-resultado-sonnet-2026-07-22)
- [4. O único caso fora do gabarito — e por que ele não é um erro](#4-o-único-caso-fora-do-gabarito-e-por-que-ele-não-é-um-erro)
- [5. Um bug encontrado — no verificador, não no modelo](#5-um-bug-encontrado-no-verificador-não-no-modelo)
- [6. O que este teste NÃO responde](#6-o-que-este-teste-não-responde)
- [7. Sinal secundário: magnitude do score diverge entre modelos](#7-sinal-secundário-magnitude-do-score-diverge-entre-modelos)
- [Origem](#origem)

Registro do teste que a F4 exige antes de qualquer UI de análise ser
construída. Método, números e o que ficou em aberto.

Reproduzir:

```bash
python -m etl.benchmark                              # modelo local (Ollama)
python -m etl.benchmark.pontuar_saidas --dir saidas_sonnet   # saídas já gravadas
```

---

## 1. A pergunta que motivou o teste

`../_historico/congresso-F0-discovery.md` §4.2: nas 5 primeiras proposições analisadas com o
Llama 3.1 8B local, **todas** saíram "garantista". Duas explicações
possíveis, indistinguíveis com 5 casos:

- **(a)** viés de amostra — os 5 PLs mais recentes eram mesmo protetivos;
- **(b)** viés do modelo — ele lê qualquer proposta como benéfica.

Se fosse (b), o eixo central do produto não existiria: um classificador
que nunca diz "reducionista" não classifica nada.

## 2. O conjunto — `etl/benchmark/casos.json`

30 proposições reais da Câmara (PL/2026), montadas em 2026-07-22:
**10 garantistas · 10 reducionistas · 10 honoríficas/técnicas**.

O gabarito é **julgamento humano sobre a ementa**, feito na montagem e
revisável — a Câmara não classifica proposição por eixo de direitos, então
não existe verdade oficial para comparar. Cada caso carrega a
justificativa no próprio JSON.

Duas armadilhas propositais entre as honoríficas:

| Caso | Armadilha |
|---|---|
| PL 3739/2026 — Betinho no Livro dos Heróis | tema fortemente associado a direitos humanos, efeito jurídico nenhum |
| PL 3575/2026 — denomina aeroporto | a ementa contém "**revoga** a Lei nº 7.585" — só para trocar o nome |

**Por que o número que decide é o recall por classe, não a acurácia
global:** num conjunto com 1/3 de cada classe, responder "garantista"
sempre já dá 33% de acurácia — e 100% de acerto no subconjunto garantista.
Só o recall de *reducionista* separa (a) de (b).

## 3. Resultado — Sonnet, 2026-07-22

Mesmos prompts, mesma rubrica v1.0.0, mesmo cálculo determinístico. Só
mudou quem respondeu.

```
ACURÁCIA GLOBAL           29/30 = 97%      (meta da F4: ≥ 80%)

RECALL POR CLASSE
  garantista              10/10 = 100%
  reducionista             9/10 =  90%     <-- responde ao §4.2
  tecnico                 10/10 = 100%

MATRIZ DE CONFUSÃO (linha = esperado, coluna = obtido)
                  garantista    misto   reducionista   tecnico
  garantista              10        0              0         0
  reducionista             0        1              9         0
  tecnico                  0        0              0        10

EXTRAÇÃO      29 itens válidos · 0 descartados · taxa de descarte 0%
CITAÇÕES      7 da ementa · 22 de âncora · 0 não rastreáveis
```

**A hipótese (b) está descartada.** O modelo produz "reducionista" onde um
humano lê "reducionista", em 9 dos 10 casos, incluindo os difíceis:
aumento de pena, prisão temporária mais longa, vedação de cotas raciais em
empresa privada, advertência prévia antes de multa ambiental.

As 10 honoríficas devolveram `direitos_afetados` **vazio**, as duas
armadilhas inclusive. A regra 3 do system prompt ("não force uma
classificação que não existe") está funcionando.

Taxa de descarte **0%** — contra 20% do 8B local depois da calibração e
75% antes dela (§4.1 do F0-discovery do congresso, em `../_historico/`).

## 4. O único caso fora do gabarito — e por que ele não é um erro

**PL 3619/2026** (altera a Lei 14.701/2023, marco temporal). Gabarito:
`reducionista`. Obtido: `misto` (score +0,30).

A extração está **certa** e viu os dois lados:

| Direito | Direção | Dispositivo | Peso |
|---|---|---|---|
| `propriedade_funcao_social` | amplia | CF/88, art. 5º, XXII | +1,80 |
| `direitos_indigenas_quilombolas` | restringe | CF/88, art. 231 | −1,50 |

O rótulo veio da regra de `misto` em `etl/rubrica.py`, que dispara quando
há peso positivo e negativo ao mesmo tempo — regra que existe justamente
para um PL controverso não somar perto de zero e aparecer como "neutro".

**Decisão de produto em aberto, não bug:** "misto" trata os dois lados como
equivalentes. Aqui um lado é garantia patrimonial de proprietário e o
outro é direito constitucional de minoria — o modelo, aliás, marcou
`clausula_petrea: true`. Opções, para decidir depois:

1. deixar como está — "misto" é honesto, mostra os dois lados e deixa o
   julgamento com o leitor. É a leitura mais alinhada ao "viés declarado";
2. exibir o selo de cláusula pétrea com destaque sobre o rótulo;
3. rever o gabarito — talvez `misto` seja a leitura correta e quem estava
   errado era o julgamento humano na montagem do conjunto.

**Não ajustar o caso para o modelo acertar.** Se a régua mudar, muda em
`rubrica.json` com bump de `versao`, e reanalisa-se o que ficou para trás.

## 5. Um bug encontrado — no verificador, não no modelo

A primeira rodada acusou 2 "candidatas a citação inventada". Falso
positivo do próprio verificador: a ementa escreve
`Lei nº 9.605, de 12 de fevereiro de 1998` (vira `lei:9605:1998`) e o
modelo respondeu `Lei 9.605/1998` (vira `lei:9605:?` — `etl/normas.py` não
lê ano depois de barra). A comparação por identificador cru tratava as
duas como normas diferentes.

Corrigido em `rastrear()`: compara `(tipo, número)` e usa o ano só quando
os dois lados o têm. Depois do fix: **0 não rastreáveis**.

Vale como regra geral: **falso alarme numa métrica de alucinação é pior
que não ter a métrica** — ensina a ignorá-la. Toda checagem de citação
precisa ser testada contra as duas grafias antes de virar número de
relatório.

## 6. O que este teste NÃO responde

- **Comparação com o modelo local está incompleta.** A rodada dos 30 casos
  com Llama 3.1 8B foi interrompida com 2 casos concluídos (ambos
  corretos, `reducionista`). Os 97% acima são de Sonnet. **O `.env.example`
  ainda tem `LLM_PROVIDER=ollama` como padrão** — enquanto os 30 não
  rodarem no 8B, não se sabe qual é a qualidade da configuração padrão do
  projeto, só a do teto. Rodar `python -m etl.benchmark` fecha isso.
- **Reprodutibilidade não foi medida** (`--repetir` existe, não foi usado).
- **Análise sobre ementa, não sobre inteiro teor.** A F3 ainda não existe;
  a ementa às vezes não diz o que o PL realmente faz. O gabarito também
  foi montado só com a ementa, então o teste é justo — mas mede um cenário
  mais fácil que o real.
- **O nº do artigo citado não é validado**, só a lei. Validar artigo exige
  base normativa completa e o LexML está bloqueado (§3 do F0-discovery do congresso, em `../_historico/`).
- **30 casos são poucos** para medir subgrupo: 9/10 e 10/10 têm intervalo
  de confiança largo. Serve para descartar a hipótese (b), que era o
  objetivo, não para afirmar "97% em produção".

## 7. Sinal secundário: magnitude do score diverge entre modelos

Nos 2 casos em que os dois modelos rodaram, o rótulo bateu mas a
intensidade não: PL 3631/2026 deu **−6,00** (`reducionista_forte`) no 8B e
**−1,80** (`reducionista`) em Sonnet — o 8B leu `grau: estrutural` onde
Sonnet leu `moderado`, com confiança menor.

Consequência prática: **`analises.modelo` precisa aparecer na UI junto do
score**. Comparar score entre proposições analisadas por modelos
diferentes não é válido, e o campo já existe no schema justamente para
isso.
