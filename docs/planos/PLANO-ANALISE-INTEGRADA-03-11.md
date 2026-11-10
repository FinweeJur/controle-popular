# Plano — análise integrada: Guaicuy + NACAB + nosso acervo

> **Tipo:** PLANO
> **Domínio:** jurisprudência
> **Última medição:** 2026-11-03
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PROMPT-BATCH-SABIA-ANALISE-RIO-DOCE.md](PROMPT-BATCH-SABIA-ANALISE-RIO-DOCE.md), `tjmg-jurimetria/docs/PROMPT-BATCH-SABIA-RIO-DOCE.md`, [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** jurimetria, teses, guaicuy, nacab, pnab, peab, amostra, acórdão, processo, análise

## Sumário

- [As três fontes e o que cada uma mede](#1-as-três-fontes-e-o-que-cada-uma-mede)
- [Onde as unidades não batem](#2-onde-as-unidades-não-batem)
- [A ficha do caso: união das variáveis](#3-a-ficha-do-caso-união-das-variáveis)
- [Estrutura do relatório](#4-estrutura-do-relatório)
- [Números que já temos](#5-números-que-já-temos)
- [O que a integração não resolve](#6-o-que-a-integração-não-resolve)
- [Ordem de execução](#7-ordem-de-execução)

## 1. As três fontes e o que cada uma mede

| Fonte | Objeto | Desenho | Força | Limite |
|---|---|---|---|---|
| **Guaicuy**, *Dossiê das ações individuais de indenização — Regiões 4 e 5* (2024, 65 p.) | ação individual (processo) nas comarcas de Curvelo, Pompéu, Morada Nova de Minas, Abaeté, Patos de Minas e Três Marias | 2 etapas: quantitativo (campo + consulta ao TJMG, busca pela parte "Vale") e qualitativo (danos da inicial enquadrados na **PNAB** e na **PEAB**) | população 452 → **amostra 318**, confiança 99%, margem 4% (Bolfarine & Bussab, 2018); ficha por processo com 11 campos | olha a **1ª instância** e a inicial; não mede tese de 2º grau |
| **NACAB**, *Pesquisa Jurisprudencial* (2023, 49 p.) | acórdão de apelação cível (18ª Câmara Cível do TJMG) | censo nos dois primeiros blocos (176) e **amostra aleatória simples** de 143 no terceiro (95%, erro 5%) | tri-classe de favorabilidade (p.8) e separação **mérito × não-mérito** (p.9), com categorias de tese nomeadas (p.17-31) | só uma câmara e só apelação; termina em março de 2023 |
| **Nosso acervo** | acórdão/processo no TJMG e TJES, frente Rio Doce | **censo** do que foi coletado: 5.362 casos, 0 sem tese | cobre 1º e 2º grau, várias câmaras, 2015-2026; tese canônica por regra e polo por regra/leitura | 3.818 sem `recorrente`/`resultado` legíveis; 2.172 com inteiro teor |

A integração não é somar três relatórios: é usar **a régua de cada um** onde ela é
mais forte — a ficha de processo do Guaicuy, a classe de resultado do NACAB e o
censo do nosso acervo.

## 2. Onde as unidades não batem

- **Processo ≠ acórdão.** O Guaicuy conta processo; o NACAB conta acórdão. Um
  processo pode ter mais de um acórdão (agravo, embargos, apelação). Nosso
  acervo tem um caso por processo na maioria, mas há repetição de processo com
  decisões diferentes — por isso a contagem é **por processo** e a tese é lida no
  acórdão mais recente daquele processo.
- **Comarca de origem** existe nos dois; **região** (4 e 5) só no Guaicuy, por
  lista de comarcas. Podemos reconstruir a região por essa lista, mas é
  aproximação declarada: comarca nova ou fora da lista fica "região não
  classificada".
- **Recorte temporal**: Guaicuy até 1º semestre de 2023 (estado do processo até
  2024); NACAB até março de 2023. Nosso acervo vai até 2026 — comparação direta
  só no período comum (até 2023), e o resto é apresentado como **extensão**, não
  como comparação.

## 3. A ficha do caso: união das variáveis

Campos que já existem e vêm de contagem (não de modelo):

| Campo | Origem | Cobertura |
|---|---|---|
| processo, tribunal, classe, órgão, relator, comarca, ano | acervo/planilha | 100% |
| polo e resultado do recurso | regra (recorrente × resultado) + leitura | 1.544 legíveis |
| tese canônica, sentido, garantia | extração + regra de termo | 100% |
| dano PNAB/PEAB citado | resumidor | parcial (texto livre) |
| valor fixado | resumidor | 75 casos com número |

Campos do Guaicuy que **precisam de leitura** e entram na etapa 1 do batch:

| Campo | Valores | Observação |
|---|---|---|
| `competencia` | justica_estadual · justica_federal · nao_consta | o Guaicuy mede competência porque a federalização mudou o foro |
| `justica_gratuita` | concedida · negada · nao_requerida · nao_consta | já aparece em muitos acórdãos |
| `acordo` | homologado · proposto_e_recusado · nao_consta | inclui acordo com a Vale e PTR |
| `provas` | pericia · documental · testemunhal · nenhuma · nao_consta | o Guaicuy mede perícia e prova documental |
| `ptr_auxilio` | discutido · concedido · negado · nao_consta | auxílio emergencial / PTR |
| `estado_processo` | sentenca · acordo · recurso · extinto · nao_consta | estado no momento do acórdão |
| `tempo_duracao` | em dias, se o texto trouxer as duas datas | se não trouxer, `nao consta` — não estimar |

Regra de ouro: campo que o texto não mostra vira `nao consta`. Ficha incompleta
declarada vale mais que ficha preenchida por palpite.

## 4. Estrutura do relatório

Sete seções, fundindo o sumário do Guaicuy (3.1-3.7) com as seções do NACAB:

1. **Nota metodológica** — desenho, população, amostra ou censo, o que é contagem
   e o que é leitura, e quantos casos ficaram fora de cada taxa.
2. **Retrato quantitativo** — favorabilidade (tri-classe NACAB), quem recorre,
   taxa por comarca e por relator, com piso de N declarado.
3. **Danos e pedidos** — os 12 danos PNAB/PEAB com N e % (régua Guaicuy).
4. **Teses predominantes e perdedoras** — N, sentido dominante, se houve mérito.
5. **Divergências** — mesma tese com os dois sentidos, órgão nomeado dos dois
   lados.
6. **Provas, acordo e acesso à justiça** — as variáveis que o Guaicuy mede e que
   decidem resultado na prática.
7. **O que a literatura acrescenta e o que não decide** — achados do RAG com
   chave e DOI; e as lacunas.

## 5. Números que já temos

Do `relatorios/JURIMETRIA-RIO-DOCE.md` (contagem, não modelo):

- 5.362 casos; 1.544 com recorrente e resultado legíveis;
- desfavorável ao atingido 62,9% · totalmente favorável 25,3% · parcial 11,8%
  (NACAB no Paraopeba: 75,5% desfavoráveis);
- por comarca: Governador Valadares 35,6% de favorável (354 casos), Mariana 26,6%
  (267), Ponte Nova 8,9% (203), Aimorés 4,3% (187), Ipatinga 20,8% (130);
- teses: prescrição 716, gratuidade 338, inversão do ônus 333, dano moral 264,
  legitimidade 136;
- valor fixado: 75 casos com número, mediana R$ 30.000.

## 6. O que a integração não resolve

- **Tempo de duração** depende de data de distribuição, que o acervo não tem.
  Fica `nao consta` até existir fonte (consulta processual).
- **Documentos juntados na inicial** exigem o processo, não o acórdão. Fora de
  escopo declarado.
- **Região 4/5** é aproximação por lista de comarcas.
- **3.818 casos sem variável legível**: entram na etapa 1 do batch; enquanto não
  entrarem, não entram em percentual.

## 7. Ordem de execução

1. `fontes_para_analise.py` — bloco FONTES do prompt (feito).
2. Etapa 1 do batch, só nos 3.818 sem variável (custo ~R$ 2,40 no preço do
   sabiazinho em batch).
3. Fundir as etiquetas no CSV de override, com validador (mesma porta do
   `classificar_polo`).
4. Recalcular a jurimetria com as variáveis novas (`jurimetria_rio_doce.py`).
5. Etapa 2 do batch — a síntese, com os números prontos e as fontes fechadas.
6. Revisor acadêmico no texto final: cada número existe em DADOS, cada citação
   existe em FONTES.
7. Publicar em `/paraopeba/evidencias` (página) com a nota de licença do
   Consensus e a citação do Guaicuy e da NACAB como fontes de método.
