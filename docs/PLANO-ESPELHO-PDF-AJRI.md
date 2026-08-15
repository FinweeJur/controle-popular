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
