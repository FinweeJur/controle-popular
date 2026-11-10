# Prompt — polo das decisões pendentes do Rio Doce (Antigravity)

> **Tipo:** PROMPT
> **Domínio:** jurisprudência (Rio Doce, TJMG)
> **Última medição:** 2026-11-03
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PLANO-JURISPRUDENCIA-02-11.md](PLANO-JURISPRUDENCIA-02-11.md)
> **Palavras-chave:** prompt, antigravity, rio doce, tjmg, polo vencedor, classificação

## Sumário

- [0. Papel](#0-papel)
- [1. Onde está tudo](#1-onde-está-tudo)
- [2. Formato de saída (exato)](#2-formato-de-saída-exato)
- [3. Vocabulário fechado](#3-vocabulário-fechado)
- [4. As regras que não se negoceiam](#4-as-regras-que-não-se-negoceiam)
- [5. Erro que já aconteceu e não pode repetir](#5-erro-que-já-aconteceu-e-não-pode-repetir)
- [6. Como trabalhar](#6-como-trabalhar)
- [7. O que NÃO fazer](#7-o-que-não-fazer)
- [8. Entrega](#8-entrega)
- [9. Critérios de aceite](#9-critérios-de-aceite)
- [10. Como o desktop usa o que você entregar](#10-como-o-desktop-usa-o-que-você-entregar)

Cole daqui até o fim numa sessão nova. É autossuficiente.

---

## 0. Papel

Você vai **classificar o polo vencedor** de 282 decisões da frente Rio Doce
(TJMG) que ainda estão sem rótulo no acervo do Controle Popular.

Polo = quem venceu aquela decisão no litígio entre **atingido** e **empresa**
(Vale, Samarco, BHP, Renova, Fundação Rio Doce, estado).

Você **rotula**. Você não conta, não soma, não estima valor, não escreve
conclusão. Número é feito depois, por contagem determinística, aqui no desktop.

## 1. Onde está tudo

Repositório: `X:\DevCoder\OpenCode\tjmg-jurimetria`
(outra máquina: clone `https://github.com/FinweeJur/tjmg-jurimetria`)

| O quê | Caminho |
|---|---|
| Rubrica completa | `tabelas/lotes_riodoce/PROMPT-POLO.md` |
| Lotes de leitura (12 arquivos, 25 casos) | `tabelas/lotes_riodoce/polo-001.jsonl` … `polo-012.jsonl` |
| Sua saída | `tabelas/lotes_riodoce/polo-001.csv` … `polo-012.csv` |
| Validador do desktop | `scripts/mesclar_lotes_polo.py` |
| Texto integral, se precisar | `tabelas/rio_doce_decisoes.csv` |

Cada linha do `.jsonl` tem: `processo`, `classe`, `orgao`, `ano`, `texto`
(ementa + inteiro teor, cortados em 3.000 caracteres, com **cabeçalho e
desfecho** — o dispositivo fica no fim do acórdão).

## 2. Formato de saída (exato)

Uma linha por processo, na mesma ordem do lote:

```
processo,polo,resultado,confianca,motivo
```

- aspas duplas onde houver vírgula
- cabeçalho uma vez por arquivo
- nada além do CSV no arquivo

## 3. Vocabulário fechado

Fora disto, o validador descarta a linha:

- **polo**: `atingido` · `empresa` · `parcial` · `indeterminado`
- **resultado**: `provido` · `negado` · `parcialmente provido` · `parcial` ·
  `desprovido` · `nao consta`
- **confianca**: `alta` · `media` · `baixa`

Significado do polo:

| Valor | Quando |
|---|---|
| `atingido` | o pedido do atingido foi acolhido no todo, ou a condenação da empresa prevaleceu |
| `empresa` | o pedido do atingido foi rejeitado, ou o recurso da empresa foi provido |
| `parcial` | acolhimento parcial, ou acordo homologado com concessão dos dois lados |
| `indeterminado` | o texto não permite saber quem venceu |

## 4. As regras que não se negoceiam

1. **Na dúvida entre `atingido` e `parcial`, responda `parcial`.**
2. **Nunca escolha `atingido` para parecer favorável ao atingido.** Classifique
   o que o texto diz. Esta página é lida por gente que perdeu casa e rend
   — insinuação aqui é dano.
3. `motivo`: uma frase curta dizendo **o que no texto** sustentou a escolha.
   Obrigatório sempre, e sem exceção quando polo ou resultado for
   `indeterminado` / `nao consta`.
4. **Nenhum número seu.** Não some, não converta, não estime valor de
   indenização. Se o texto mostra R$ 20.000, você não copia isso no polo — o
   campo é só rótulo.
5. Texto de matéria **não relacionado ao desastre** (plano de saúde, cobrança
   bancária, consumo genérico) ainda recebe polo pelo resultado real, mas
   `confianca=baixa` e motivo dizendo que a matéria é estranha ao litígio.
6. Se o corte não alcança o desfecho: `indeterminado` + `nao consta`. **Chutar
   resultado é o pior erro possível** — é assim que se publica gráfico falso.

## 5. Erro que já aconteceu e não pode repetir

Em 02/11/2026 a frente penal foi classificada com a rubrica de desastre: 6.181
decisões criminais saíram como "Empresa venceu". A linha `empresa`/`atingido`
não existe no penal. **Aqui é o contrário: use só o vocabulário de desastre,
nunca `mp` nem `reu`.**

Também medimos o modelo devolvendo **o lado que pediu** em vez de quem venceu
("defesa", "acusação"). Se você sentir vontade de escrever quem recorreu, essa
não é a resposta: o campo é `polo`, e polo é o **vencedor**.

## 6. Como trabalhar

1. Rode um lote por vez, de ponta a ponta (25 casos). Não amostrar.
2. Antes de fechar o arquivo, confira linha a linha: processo igual ao do
   lote, vocabulário fechado, motivo preenchido.
3. Grave `polo-NNN.csv` e siga para o próximo.
4. Não rode os 12 de uma vez sem conferir o primeiro: se a rubrica estiver
   sendo lida torta, melhor errar 25 do que 300.

## 7. O que NÃO fazer

1. **Não** editar `tabelas/classificacao_polo.csv` nem `rio_doce_resumos.csv`.
2. **Não** editar `apps/web/data/jurisprudencia-casos.json` à mão.
3. **Não** commitar `.jsonl`, `.csv` de lote, `raw/`, `pdfs/`, `.env` nem
   credencial. Entrega é arquivo no disco; o desktop funde e valida.
4. **Não** rodar `git push --force`. Nunca.
5. **Não** fazer deploy.
6. **Não** gerar contagem, percentual ou gráfico.

## 8. Entrega

1. Os 12 arquivos `polo-001.csv` … `polo-012.csv` em `tabelas/lotes_riodoce/`.
2. Um relatório curto em `relatorios/POLO-RIODOCE.md` com:
   - quantas linhas por lote, e quantas falharam;
   - distribuição de polo e de confiança (contagem do que você escreveu);
   - 10 exemplos (processo + motivo) para o revisor humano conferir;
   - os casos que você marcou `indeterminado` e por quê;
   - o que ficou pendente.
3. Commit **só** do relatório; push. Os CSVs ficam no disco para o desktop
   fundir.

## 9. Critérios de aceite

- [ ] 282 linhas no total, sem processo repetido e sem processo inventado.
- [ ] Nenhum `polo` fora de atingido/empresa/parcial/indeterminado.
- [ ] Nenhum `resultado` fora do enum.
- [ ] Todo `indeterminado` com `motivo` preenchido.
- [ ] Nenhuma linha com valor monetário ou contagem.
- [ ] 10 exemplos conferidos à mão contra a ementa.
- [ ] Distribuição de `indeterminado` explicada no relatório (se passar de
      25%, dizer por quê: corte de texto, matéria estranha ou ambiguidade real).

## 10. Como o desktop usa o que você entregar

```powershell
cd X:\DevCoder\OpenCode\tjmg-jurimetria
$py = "C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
& $py -X utf8 scripts\mesclar_lotes_polo.py --simular   # conferência
& $py -X utf8 scripts\mesclar_lotes_polo.py             # anexa
```

O validador só aceita processo que ainda está sem polo no acervo, e rejeita
vocabulário fora do enum. Linha rejeitada volta listada para você corrigir.
