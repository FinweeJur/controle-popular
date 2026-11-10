# Prompt — classificar o penal com rubrica própria (Antigravity)

> **Tipo:** PROMPT
> **Domínio:** jurisprudência (frente penal)
> **Última medição:** 2026-11-02
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PLANO-CLASSIFICACAO-GLM-02-11.md](PLANO-CLASSIFICACAO-GLM-02-11.md)
> **Palavras-chave:** prompt, antigravity, penal, classificação, polo, rubrica

## Sumário

- [0. Papel e objetivo](#0-papel-e-objetivo)
- [1. Por que isso está sendo delegado (e o erro que não pode repetir)](#1-por-que-isso-está-sendo-delegado-e-o-erro-que-não-pode-repetir)
- [2. Onde está tudo](#2-onde-está-tudo)
- [3. Preparo](#3-preparo)
- [4. Tarefa A — classificar](#4-tarefa-a--classificar)
- [5. Tarefa B — tese penal (se ainda faltar)](#5-tarefa-b--tese-penal-se-ainda-faltar)
- [6. A rubrica (não invente outra)](#6-a-rubrica-não-invente-outra)
- [7. Regras que não se negociam](#7-regras-que-não-se-negociam)
- [8. Entrega](#8-entrega)
- [9. Critérios de aceite](#9-critérios-de-aceite)
- [10. Como o desktop aplica o que você entregar](#10-como-o-desktop-aplica-o-que-você-entregar)

Cole daqui até o fim numa sessão nova. É autossuficiente: não precisa deste
histórico.

---

## 0. Papel e objetivo

Você vai **classificar os 6.182 casos da frente penal** do acervo de
jurisprudência do Controle Popular: dizer, em cada decisão, **quem venceu**
(acusação ou defesa) e **como terminou o recurso**, mais a confiança e o motivo.

É trabalho de leitura assistida por modelo, com checkpoint em CSV. Não é para
resumir, não é para julgar: é para rotular o que o texto já diz.

## 1. Por que isso está sendo delegado (e o erro que não pode repetir)

O penal foi classificado uma vez **com a rubrica errada** — a de desastre
(empresa × atingido). Resultado: 6.181 decisões criminais rotuladas como
"Empresa venceu", e a página `/jurisprudencia/penal` exibia isso.

As linhas erradas foram **apagadas** em 02/11/2026. O acervo está honesto e
vazio no penal. Sua tarefa é preencher com o vocabulário certo:

- **mp** — a acusação venceu (condenação, denúncia recebida, recurso do MP provido);
- **reu** — a defesa venceu (absolvição, trancamento, recurso da defesa provido);
- **parcial** — resultado misto;
- **indeterminado** — o texto não permite saber (exige `motivo`).

Nunca use `empresa` nem `atingido` nesta frente.

## 2. Onde está tudo

Repositório: `X:\DevCoder\OpenCode\tjmg-jurimetria` (se estiver em outra
máquina, clone `https://github.com/FinweeJur/tjmg-jurimetria`).

| O quê | Caminho |
|---|---|
| Acervo publicado (entrada) | `X:\DevCoder\OpenCode\controle-popular\apps\web\data\jurisprudencia-casos.json` |
| Script de classificação | `scripts/classificar_polo.py` |
| Script de tese | `scripts/analise_teses.py` |
| Saída esperada | `tabelas/classificacao_penal.csv` |
| Rubrica penal (no código) | `SISTEMA_PENAL` em `classificar_polo.py` |

## 3. Preparo

1. Python 3.11 com `requests` (o venv do projeto serve).
2. Variável de ambiente `ZAI_API_KEY` — a chave do provedor Zhipu/BigModel.
   Sem ela o script sai com "ZAI_API_KEY ausente no ambiente".
3. Confirme a fila antes de rodar:

```powershell
cd X:\DevCoder\OpenCode\tjmg-jurimetria
$py = ".venv\Scripts\python.exe"   # ou o python do venv
& $py -X utf8 -c "import sys; sys.path.insert(0,'scripts'); import classificar_polo as c; print(len(c.fila(0, penal=True)))"
```

Esperado: ~6.182 (menos o que já estiver no seu CSV de saída).

## 4. Tarefa A — classificar

Rode **com saída própria**, para não escrever no arquivo do desktop:

```powershell
& $py -X utf8 scripts\classificar_polo.py --penal --lote 60 --concorrencia 4 --saida tabelas\classificacao_penal.csv
```

- `--penal` troca a rubrica e o universo (só a frente penal).
- `--saida` evita conflito: o desktop pode estar rodando no CSV dele.
- O script é **retomável**: processo já no CSV é pulado. Interromper e rodar de
  novo não perde nada.
- Modelo: `glm-4.5-flash` (gratuito), com reserva automática quando dá 429.

Ritmo medido: ~2,5 s por caso com 4 em paralelo, com 429 intercalado. O lote
inteiro leva **~4 h**.

## 5. Tarefa B — tese penal (se ainda faltar)

O CSV `tabelas/teses-penal.csv` já tem ~6.133 de 6.182. Se faltar:

```powershell
& $py -X utf8 scripts\analise_teses.py --lente penal --lote 50
```

Não é obrigatório para a entrega: a classificação é a prioridade.

## 6. A rubrica (não invente outra)

A rubrica viva está em `SISTEMA_PENAL`, dentro de `scripts/classificar_polo.py`.
Se o arquivo da sua cópia estiver velho (`git pull` antes), a versão atual é a
**v2**, que obriga três passos — e ela existe porque a v1 errava a polaridade:

> Medição de 02/11/2026: a v1 lia "provido" e respondia `mp` sem olhar **quem
> recorreu**. Casos reais: HC com "ordem concedida" saiu `mp`; apelação do MP
> desprovida saiu `mp`; mandado de segurança concedido à defesa saiu `mp`.
> Cerca de 5% das linhas criminais ficaram com o vencedor invertido.

```
PASSO 1 - QUEM PEDIU:
  HC, mandado de seguranca criminal, revisao criminal, agravo em execucao:
    em regra quem pede e a DEFESA (paciente, impetrante, reu).
  apelacao, recurso especial, agravo: veja quem e o recorrente; se o texto
    nao disser, responda 'indeterminado'.

PASSO 2 - O QUE ACONTECEU com o pedido de quem pediu.

PASSO 3 - QUEM VENCEU:
  defesa pediu e foi acolhido (ordem concedida, seguranca concedida, revisao
    procedente, absolvicao, trancamento, pena reduzida) -> 'reu'
  defesa pediu e foi rejeitado (ordem denegada, HC nao conhecido, revisao
    improcedente, recurso da defesa desprovido) -> 'mp'
  MP pediu e foi acolhido (recurso do MP provido, denuncia recebida) -> 'mp'
  MP pediu e foi rejeitado (recurso do MP desprovido, absolvicao mantida) -> 'reu'
  acolhimento so parcial -> 'parcial'
  texto insuficiente ou materia nao criminal -> 'indeterminado' com motivo

ATENCAO: 'provido' e 'desprovido' NAO dizem quem venceu.
TRAVA FINAL: tributo, cobranca, execucao fiscal, consumidor ou contrato civil
  -> 'indeterminado', mesmo com 'provido'/'desprovido' no texto.

resultado: 'provido', 'negado', 'parcialmente provido', 'parcial', 'desprovido'
ou 'nao consta' -- o que aconteceu com o recurso.
confianca: alta, media ou baixa.
motivo: 1 frase curta dizendo QUEM PEDIU e O QUE ACONTECEU com o pedido.
```

Regra de ouro: **na dúvida, `indeterminado` com motivo**. Não invente
condenação onde a ementa só delimitou competência.

Antes de entregar, rode a auditoria determinística:

```powershell
& $py -X utf8 scripts\auditar_polo_penal.py
```

Ela cruza o verbo da decisão com o polo e mostra a taxa de contradição. Na v1
dava ~5% (`mp x defesa`); na v2 o esperado é abaixo de 2%.

## 7. Regras que não se negociam

1. **Não** rodar a rubrica de desastre no penal (foi o erro corrigido).
2. **Não** editar `apps/web/data/jurisprudencia-casos.json` à mão.
3. **Não** escrever no `tabelas/classificacao_polo.csv` do desktop — use o
   seu `classificacao_penal.csv`.
4. **Não** commitar `raw/`, `pdfs/`, `.env` nem credencial.
5. **Não** fazer deploy. Commit e push, sim; publicar só com ordem do dono.
6. Nada de dado pessoal: só processo, tese, sentido e motivo.
7. Confira o CSV antes de entregar: nenhuma linha com `polo` fora de
   mp/reu/parcial/indeterminado.

## 8. Entrega

1. O arquivo `tabelas/classificacao_penal.csv` (colunas: processo, polo,
   resultado, confianca, motivo, modelo).
2. Um relatório curto em `relatorios/PENAL-CLASSIFICACAO.md` com:
   - quantas linhas gravadas e quantas falharam;
   - distribuição de polo e de resultado;
   - 10 exemplos (processo, trecho do motivo) para o revisor humano conferir;
   - o que ficou pendente e por quê.
3. Commit com o CSV e o relatório; push.

## 9. Critérios de aceite

- [ ] Nenhuma linha com `polo` = empresa ou atingido.
- [ ] Todo `indeterminado` tem `motivo` preenchido.
- [ ] N de linhas ≈ 6.182 (diferença explicada no relatório).
- [ ] 10 exemplos conferidos à mão contra a ementa.
- [ ] CSV com cabeçalho exato: `processo,polo,resultado,confianca,motivo,modelo`.

## 10. Como o desktop aplica o que você entregar

O gerador do portal lê `tabelas/classificacao_polo.csv`. Para integrar o seu
arquivo, basta concatenar (sem repetir cabeçalho) e rodar:

```powershell
& $py -X utf8 scripts\gerar_jurisprudencia_casos.py
```

Isso é do desktop; você entrega o CSV e avisa.
