# Fase 2 — espelho dos PDFs da auditoria socioambiental (AJRI)

> Escrito em 2026-08-15, na sessão que publicou a **fase 1**: o catálogo dos
> 467 documentos da auditoria independente (AECOM) em `/paraopeba/auditoria`,
> com link canônico para a fonte oficial em cada registro e nenhum arquivo
> baixado.
>
> Isto aqui é **plano, não execução**. Nada do que está descrito abaixo foi
> feito, e a fase 1 não depende de nada disto.

## O que já está no ar (fase 1) e por que ela é segura

- `apps/web/lib/paraopeba/auditoria-ajri.ts` — 467 documentos como dado
  versionado: código, descrição da própria AECOM, instrumento jurídico, tipo,
  temas, data. Sem arquivo, sem texto extraído de PDF.
- `/paraopeba/auditoria` — catálogo filtrável, crédito da AECOM em cada ficha,
  link canônico para o portal em cada registro, declaração de finalidade
  acadêmica e não comercial no topo.
- `scripts/coletor_auditoria.py` + `docs/FONTES-AUDITORIA-AJRI.md` — a
  proveniência: o que raspa e o mapa de rotas/facetas do portal.
- `apps/web/lib/paraopeba/ficha-legivel-ajri.ts` (15/08, à noite) — a **ficha
  legível** de cada documento: o que é, quando, sobre o quê, de onde vem, em
  linguagem comum. Função pura sobre os metadados, 24 testes, **zero modelo**.
  É a metade do pedido do dono que dava para entregar sem baixar nada; a outra
  metade — conclusões e recomendações — é o §6 deste documento.

Catálogo + link é **integralmente compatível** com os Termos de Uso do portal,
que proíbem modificar e usar comercialmente o material, e exigem manter os
avisos de autoria. Espelhar os PDFs é outra conversa — é ela que está aqui.

## 1. Os 467 PDFs não cabem no repositório nem no Worker

Não é opinião de arquitetura, é o teto medido:

| Limite | Valor | Fonte |
|---|---:|---|
| Asset do Cloudflare Workers | **25 MiB por arquivo** | `docs/PLANO-ARQUIVO-DE-FONTES.md` |
| Contagem de assets (plano gratuito) | 20.000 arquivos | idem |
| Bundle do Worker | 3 MiB gzip | limite estrutural do projeto |
| Objeto no R2 | 5 TB, sem limite prático de contagem | idem |

E o teto de asset **já cobrou a conta hoje**: em 15/08/2026 o deploy parou com
`Asset too large … 35.5 MiB` no cache da rota `/ambiental/legislacao`
(`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`). O site no ar é o das 10:08 daquele dia.
Somar centenas de PDFs ao mesmo bundle, no mesmo dia em que ele estourou por
outro motivo, é escolher travar o deploy de novo.

**Destino: R2.** Este plano é um caso particular de
`docs/PLANO-ARQUIVO-DE-FONTES.md` e segue as regras que ele já fixou:

1. o link original **nunca sai da tela** — a cópia aparece ao lado, rotulada
   como cópia, com a data da captura;
2. hash do conteúdo em cada captura, que é o que transforma cópia em prova de
   integridade (e o que denuncia documento alterado no mesmo endereço);
3. tabela própria de arquivo (`arquivo_fontes`), não coluna nova nas tabelas
   de dado;
4. sem credencial de R2 configurada, o capturador grava em
   `apps/web/.arquivo-local/` (gitignored) e a linha fica
   `modo_armazenamento='local'` — correto, e **inacessível ao Worker
   publicado**. Nesse estado não se constrói selo de "cópia arquivada" na tela:
   seria promessa sem link atrás.

**O que ainda não foi medido, e tem que ser antes de qualquer download em
massa:** o tamanho de um PDF desta auditoria. A régua de 112,7 KiB de
`PLANO-ARQUIVO-DE-FONTES.md` é de norma ambiental, não de relatório de
auditoria com anexo fotográfico e mapa — é plausível que estes sejam uma ou
duas ordens de grandeza maiores. Passo 1 é capturar ~10 documentos, medir, e só
então projetar os 467. Decidir com número, não com estimativa.

## 2. A marca d'água com nome e CPF — decisão do dono, e a consequência técnica

**O fato.** O `download_cover` do portal gera o PDF na hora e carimba nele o
**nome e o CPF de quem está logado**. Não há como pedir o arquivo sem a marca:
ela é aplicada na geração, do lado do servidor.

**A decisão.** O dono do projeto decidiu, como pesquisador, publicar assim e
**assumir o risco** — o CPF na marca d'água é o dele, não de terceiro. A decisão
está registrada aqui porque é dele, e porque quem executar a fase 2 precisa
saber que ela foi tomada de olhos abertos.

**A consequência técnica**, que independe da decisão e não é negociável por
ela:

- `apps/web/lib/sem-cpf-no-repo.test.ts` valida CPF por **mod-11** e reprova
  qualquer arquivo versionado que contenha um número que seria um CPF de
  verdade. A trava **ficou vermelha em 15/08/2026** por um CPF numa ementa do
  IBAMA — ela funciona, e vai disparar contra um espelho de PDFs marcados.
  (No worktree `cp-ajri`, em 15/08 à noite, ela está verde: os 401 testes
  passam. O ponto não é o estado dela hoje, é o que ela fará amanhã.)
- Portanto: **um espelho com CPF válido tem que ficar FORA do repositório
  versionado.** O R2 já resolve isso por construção — o bucket não é git —, mas
  a regra precisa estar escrita, porque o caminho fácil (`public/` ou
  `apps/web/data/`) é o que quebra a trava e, pior, publica o CPF no histórico
  de um repositório público, de onde não sai (ver `/termos`, §5: "o histórico
  já distribuído é o caso mais difícil").
- **A política do portal precisa dizer de quem é aquele CPF.** Um PDF público
  com um CPF carimbado, sem explicação, parece vazamento de dado de terceiro —
  para quem lê, para uma varredura automática e para a ANPD. A página tem que
  declarar, junto do acervo: *o CPF que aparece na marca d'água dos documentos
  é o do pesquisador que os obteve no portal da auditoria; nenhum dado pessoal
  de terceiro é publicado por este portal.*
- Consequência menor, mas real: a marca d'água é **modificação do arquivo pelo
  próprio portal-fonte**, então o hash de integridade da fase 2 identifica *a
  cópia entregue àquela sessão*, não o documento canônico da AECOM. Duas
  capturas do mesmo documento vão ter hashes diferentes sem que nada tenha
  mudado no conteúdo. O manifesto tem que registrar isso, senão a próxima
  varredura de integridade acusa alteração em 467 documentos de uma vez.

**Alternativa que continua na mesa** (§7 de `docs/FONTES-AUDITORIA-AJRI.md`):
espelho em acesso restrito, liberado sob solicitação para pesquisadores. Custa
uma decisão de produto, não de engenharia, e é a única variante que zera os
dois riscos ao mesmo tempo. Fica registrada; não é o que foi decidido.

## 3. Cadência de sincronização

Os números vêm do comportamento medido do portal e do que
`docs/FONTES-AUDITORIA-AJRI.md` (§6) registra:

| Parâmetro | Valor | Por quê |
|---|---:|---|
| Frequência | **1×/dia** | o portal publica ~1×/mês; mais que isso é gastar requisição para reler o mesmo acervo |
| Pausa entre requisições | **2 s** | é o `DELAY` que `scripts/coletor_auditoria.py` já usa; o portal é um Rails pequeno, não uma CDN |
| `timeout` | **180 s** | o PDF é gerado sob demanda, com marca d'água — a resposta leva dezenas de segundos |
| Retentativa | backoff exponencial, 4 tentativas | idem coletor |
| Detecção de novidade | `GET /documents?per_page=10&order=recentes`, comparar o maior `id` | ids são sequenciais crescentes |
| Sync incremental | só baixar `id` ausente do `manifest.json` | o processo é interrompível e retomável |
| `401`/`403` | "renove o cookie", não erro de rede | a sessão Devise expira |

O coletor já implementa os modos `pdfs` e `sync` com retomada por
`manifest.json`. A fase 2 **não precisa escrever coletor novo** — precisa de
credencial de R2, do upload, da tabela `arquivo_fontes` e da política escrita.

## 4. Ordem sugerida

1. Capturar ~10 PDFs, medir tamanho médio e projetar os 467. **Sem R2 ainda** —
   grava em `apps/web/.arquivo-local/`, que é gitignored.
2. Escrever a política (de quem é o CPF da marca d'água, finalidade, canal de
   correção) **antes** de qualquer upload. Publicar primeiro e explicar depois
   inverte a ordem que protege.
3. Credencial de R2 + bucket. Decidir público ou servido por Worker — decisão
   que `PLANO-ARQUIVO-DE-FONTES.md` deixou explicitamente em aberto.
4. Upload com hash e manifesto, respeitando a nota do §2 sobre hash de cópia
   marcada.
5. Só então a UI: "cópia arquivada em DD/MM/AAAA" **ao lado** do link oficial,
   nunca no lugar dele.

## 5. O que este plano NÃO decide

- Se o espelho é público ou restrito a pesquisadores mediante pedido.
- Retenção: por quanto tempo guardar a captura antiga quando o documento muda
  na origem.
- Se o texto extraído dos PDFs entra em busca (isso reabre a discussão de
  "modificar", que os Termos de Uso proíbem — e é decisão separada de guardar).

---

# 6. Fase 3 — resumir o **conteúdo** dos documentos

> Escrito em 15/08/2026, na sessão que entregou a ficha legível. **Isto é
> plano, e nada dele foi feito.** Vive aqui, e não em arquivo novo, porque não
> é um projeto paralelo: é a continuação literal do pipeline acima — sem os
> passos 1 a 5 deste documento, não existe texto para resumir.

## 6.1. O que ficou de fora da ficha legível, e por que não foi preguiça

O dono pediu, para cada documento, um resumo acessível com **tema, data, fato e
conclusões/recomendações**. Os três primeiros saíram inteiros do metadado, sem
modelo — é o que `ficha-legivel-ajri.ts` entrega hoje em 467/467.

**Conclusões e recomendações não existem em metadado nenhum.** Medido nas 467
descrições, em 15/08/2026:

| expressão procurada na `descricao` | documentos |
|---|---:|
| `conclus` (conclui / conclusão) | **0** |
| `recomenda` | 4 |
| `não conformidade` | 1 |
| `apontamento` | 0 |
| `destaque crítico` | 0 |

Zero de 467 para a palavra que dá nome ao pedido. O veredito do auditor está
**dentro do PDF**, e nenhum PDF foi baixado. Não há atalho, não há campo
escondido, não há inferência honesta a partir de "Relatório nº 84 referente aos
trabalhos de auditoria…". Quem tentar produzir conclusão a partir do metadado
está inventando.

Para dimensionar: as 467 descrições somam **151,2 KiB** de texto (média de 332
caracteres). É o acervo inteiro de texto que este portal tem hoje da auditoria
— e é, provavelmente, menos que **um** dos relatórios em PDF.

## 6.2. A ordem é obrigatória, e cada passo tem um dono anterior

```
1. baixar  →  2. extrair texto  →  3. varrer dado pessoal  →  4. resumir
```

**Inverter dois quaisquer desses passos publica dado pessoal.** Não é hipótese:

1. **Baixar** — é a fase 2, §§1–4 acima, e ela tem custo, teto e uma decisão de
   marca d'água já registrada. O `download_cover` **carimba nome e CPF de quem
   está logado** em cada PDF gerado. Enquanto a fase 2 não estiver executada,
   este passo não existe e a fase 3 não começa.
2. **Extrair texto** — e o texto extraído carrega a marca d'água junto, porque
   ela é conteúdo do arquivo, não decoração. Ou seja: **o texto de cada um dos
   467 PDFs contém um CPF**, antes de qualquer varredura.
3. **Varrer dado pessoal** — `scripts/checar-dado-pessoal.py` e
   `apps/web/lib/sem-cpf-no-repo.test.ts` (validação por mod-11) são as duas
   travas que já existem, e a segunda **ficou vermelha em 15/08/2026** por um
   CPF numa ementa do IBAMA. Elas funcionam, e vão disparar aqui. A varredura
   roda **antes** de o texto encostar em prompt, banco ou repositório —
   mandar para um modelo um texto não varrido é enviar o CPF para um terceiro,
   e isso não se desfaz.
4. **Resumir** — só depois dos três.

O passo 3 antes do 4 tem uma segunda razão, além da óbvia: os relatórios de
auditoria socioambiental citam **pessoas atingidas** — nome de proprietário
rural, de pescador, de morador de comunidade. Um resumo de modelo sobre texto
não varrido reescreve esses nomes num campo novo, indexável, num portal
público. `docs/ANTES-DO-PUSH.md` é o procedimento; ele não vira opcional
porque o texto veio de PDF.

## 6.3. Um resumo de modelo, publicado, é **o portal afirmando algo**

Esta é a regra que governa a fase 3 inteira.

Quando `/paraopeba/auditoria` imprime uma frase, o leitor a lê como frase do
Controle Popular. Hoje isso é seguro porque **toda** frase da tela é
determinística: a ficha legível é função pura de metadado, e a descrição é
transcrição literal da AECOM. Um resumo de modelo quebra essa propriedade —
ele é texto novo, sobre obra de terceiro, produzido por um sistema que erra
sem avisar, num portal cuja única moeda é a confiança.

O projeto já resolveu isso duas vezes, e as duas soluções valem aqui:

- **Sementeira** — *"a IA só sugere, o motor decide"*: o modelo nunca é a
  autoridade final; ele propõe, e um mecanismo determinístico resolve.
- **Eixo Congresso** — *"o LLM não decide o rótulo; a rubrica é
  determinística"* (`apps/web/lib/congresso/rubrica/rubrica.json`, versionada;
  `docs/APRESENTACAO.md` §"a rubrica é um arquivo"). O rótulo é reprodutível e
  auditável, e o leitor pode partir dele e chegar ao texto.
- E `docs/PLANO-INDICE-ESTATICO-E-ASSISTENTE.md` já fixou o limite para o
  assistente: o modelo **"nunca produz número"**, e "toda resposta cita a
  página e linka".

Traduzido para a fase 3, em quatro obrigações que não são negociáveis:

1. **Rótulo visível de origem de máquina**, na própria ficha, não em rodapé:
   *"Resumo gerado por máquina — não é texto da AECOM"*. O leitor tem que
   saber antes de ler, não depois.
2. **Data e modelo gravados junto do resumo**, no dado, não só na tela:
   `gerado_em`, `modelo`, `versao_prompt`. Sem isso não se responde "por que
   este resumo diz isso" seis meses depois, e não se reprocessa o acervo
   quando o prompt mudar. É o mesmo motivo pelo qual `versao_rubrica` existe
   no eixo Congresso.
3. **Nunca apresentado como conclusão do auditor.** A frase não pode ser "a
   auditoria apontou X"; tem que ser "este resumo, gerado por máquina, indica
   que o documento trata de X — leia o original". A diferença entre as duas é
   a diferença entre citar e afirmar.
4. **O resumo nunca substitui o link para a fonte.** Vale para as duas fases:
   a ficha legível de hoje mantém o link e a descrição original da AECOM em
   toda ficha; o resumo de amanhã entra **ao lado** deles, jamais no lugar. É
   a mesma regra que `PLANO-ARQUIVO-DE-FONTES.md` fixou para a cópia
   arquivada — *"o link original nunca sai da tela"*.

O teste `ficha-legivel-ajri.test.ts` já trava metade disso hoje: ele reprova
qualquer ficha que contenha "conclui", "recomend", "apontou", "não
conformidade", "irregularidade". Se a fase 3 acontecer, esse teste continua
válido **para a ficha determinística** — e o resumo de máquina nasce em campo
separado, com trava própria.

## 6.4. O custo real, e o que medir antes de assumir qualquer número

**O piso é 467 documentos × 1 chamada.** Não há como resumir 467 documentos com
menos de 467 chamadas, e esse é o caso feliz — o caso real é maior, porque um
relatório de auditoria não cabe numa chamada.

O que **não** dá para estimar hoje, e por isso não está escrito aqui como
número: tamanho médio do PDF, número de páginas, contagem de tokens. O §1 deste
mesmo documento já registra que o tamanho dos PDFs **não foi medido** e que o
passo 1 é capturar ~10 e medir. A régua de 112,7 KiB de
`PLANO-ARQUIVO-DE-FONTES.md` é de norma ambiental — um relatório mensal com
anexo fotográfico e mapa é outra ordem de grandeza. **Decidir com número, não
com estimativa**, vale aqui igual.

O que medir, nessa mesma captura de 10:

| medida | por que ela decide algo |
|---|---|
| páginas por documento (mín/mediana/máx) | separa "cabe numa chamada" de "precisa de fatiamento" |
| caracteres do texto extraído | é o insumo de token, e o PDF-imagem dá ~0 (ver abaixo) |
| existe seção "Conclusões" / "Recomendações"? em quantos dos 10 | se ela existe e é localizável, o custo despenca |
| o texto extraído tem CPF/nome? | confirma o §6.2 antes de escalar |

### Quando o PDF tem centenas de páginas

Três estratégias, em ordem de preferência — e a primeira é de longe a melhor:

1. **Resumir só a seção que interessa, não o documento.** O que o leitor quer é
   conclusão e recomendação, e num relatório de auditoria isso é uma seção
   nomeada. Localizá-la é trabalho **determinístico** (sumário, cabeçalho,
   expressão regular sobre "CONCLUSÕES", "RECOMENDAÇÕES", "CONSIDERAÇÕES
   FINAIS") e reduz o insumo de centenas de páginas para poucas. É o mesmo
   padrão do assistente: o modelo recebe **só o trecho recuperado**, nunca o
   acervo inteiro.
2. **Se a seção não for encontrada, não resuma.** Ficha sem resumo é honesta;
   resumo de um documento lido pela metade não é. Registrar
   `motivo_sem_resumo='secao_nao_localizada'` e seguir — o portal já tem o
   hábito de declarar lacuna em vez de omitir.
3. **Só em último caso, mapa-e-redução por capítulo** (resumir cada trecho,
   depois resumir os resumos). Custa N+1 chamadas por documento, multiplica o
   erro em duas camadas e é a variante mais difícil de auditar. Se for usada,
   `versao_prompt` tem que distinguir os dois níveis.

**Duas armadilhas que já custaram caro neste projeto e reaparecem aqui:**

- **PDF que é imagem digitalizada extrai texto vazio** — e um resumo sobre
  string vazia sai fluente e falso. A extração tem que abortar abaixo de um
  piso de caracteres por página, não seguir com o que veio. (É o mesmo modo de
  errar do `GeoServer` que devolve corpo abortado com HTTP 200: a guarda lê o
  conteúdo, não o status.)
- **Processar 467 documentos numa sessão é irretomável se não houver
  manifesto.** O coletor já resolve isso para download (`manifest.json`, modo
  `sync`); o resumo precisa do equivalente, ou uma interrupção no documento 300
  joga fora 300 chamadas pagas.

## 6.5. Ordem sugerida da fase 3

1. Executar a fase 2 (§4 acima). Sem PDF, nada disto começa.
2. Extrair texto de 10 documentos e preencher a tabela de medidas do §6.4.
3. Rodar a varredura de dado pessoal nesses 10 e **olhar o resultado** antes de
   decidir qualquer coisa. Se o CPF da marca d'água aparecer no texto — e vai —,
   a política do §2 deste documento precisa estar escrita antes do passo 4.
4. Só então decidir se o resumo por modelo se justifica, com o custo na mesa.
   **É uma decisão do dono, não de engenharia** — e a alternativa "não resumir,
   e melhorar a ficha determinística" continua sobre a mesa até ele decidir.
