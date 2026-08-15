# Leia primeiro

> `docs/` tem **46 arquivos na raiz** + **22 arquivados em `docs/_historico/`**
> (datados, entregues ou superados — lá só para arqueologia). O problema nunca
> foi o volume — é não haver onde descobrir quais quatro abrir. Este arquivo é
> essa porta.
>
> *(Contagem conferida em 16/08. Se for decidir por este número, conte de novo:*
> `ls -1 docs | wc -l`*.)*
>
> **Ninguém precisa ler `docs/` inteiro. Nunca.**

## Comece por aqui, sempre

| Arquivo | O que é |
|---|---|
| **`PLANO-2026-08-15.md`** | a fila viva, ranqueada por custo × benefício. **É o que está por fazer.** |
| **`TODO-PROXIMAS-RODADAS.md`** | dívida antes de feature |
| **`SESSOES-CONCORRENTES.md`** | como não atropelar outra sessão. Leia antes do primeiro commit |
| **`HANDOFF-2026-08-15-NOITE.md`** | o que ficou por fazer, separado pelo que **de fato** bloqueia cada item |

E na **raiz do repositório**, não aqui em `docs/`: **`AGENTS.md`** — as regras
que não se negociam e as nove armadilhas que já custaram tempo. Ferramenta de
agente lê esse arquivo sozinha; humano também deveria.

Quatro arquivos. Se você só ler estes, já trabalha sem quebrar nada.

## Depois, só o que a sua tarefa pede

| Vou mexer em… | Leia |
|---|---|
| deploy, build, publicação | `rotina-local.md`, `build-em-outro-pc.md`, `HANDOFF-PAYLOAD-LEGISLACAO.md` |
| uma fonte de dados nova | o `FONTES-*.md` do assunto — **são 8**, cada um de um domínio (`ls docs/FONTES-*.md` é mais confiável que este número) |
| Lei Rouanet, incentivo cultural | `FONTES-ROUANET-SALIC.md` — e a API mente de três jeitos, todos medidos |
| território, mineração, barragem | `FONTES-TERRITORIO-E-MINERACAO.md` |
| Paraopeba / Brumadinho | `PLANO-INGESTAO-PARAOPEBA.md`, `RADAR-NOTICIAS-PARAOPEBA.md` |
| dinheiro da reparação de Brumadinho | `FONTES-PRO-BRUMADINHO-E-FGV.md` — portal do Governo de MG e auditoria da FGV |
| legislação, normas | `LEGISLACAO-FEDERAL-MMA-CNDH.md`, `URN-LEXML-NORMAS-LEG-BR.md` |
| busca, assistente, payload pesado | `PLANO-INDICE-ESTATICO-E-ASSISTENTE.md` |
| edição de conteúdo sem código | `PAINEL-EDICAO-COMO-USAR.md` |
| privacidade, LGPD, dado pessoal | `ANTES-DO-PUSH.md` |
| apresentar o projeto | `APRESENTACAO.md` |

## Registro histórico — **não leia, salvo arqueologia**

Estes documentam **um dia** e não descrevem o estado atual. Servem para
responder "por que isto está assim", nunca "como está hoje". Se a resposta que
você quer é sobre o presente, o arquivo certo é outro.

Todos vivem em **`docs/_historico/`** — curadoria de 16/08 os tirou da raiz
para o GitBook espelhar só o essencial. A lista dos que ficaram lá:

`DIARIO-2026-08-13.md` · `auditoria-2026-08-11.md` ·
`auditoria-2026-08-14-normas-protecao.md` · `HANDOFF-ALERTA-RAIO-8KM.md` ·
`HANDOFF-ALERTAS-TERRITORIO.md` · `HANDOFF-CAMADA-DINHEIRO.md` ·
`HANDOFF-PAINEL-PARAOPEBA-PAGINAS-PERDIDAS.md` ·
`coleta-lixo-farmacia-plantao-descoberta.md` ·
`CAMADA-DOCUMENTOS-PROCESSO-MUNICIPIO.md` · `normas-mapa-viabilidade.md` ·
`REVISAO-COMPLETUDE.md` · `SPU-SEM-DESTINACAO.md` ·
`ROTEIROS-REDES-SOCIAIS.md` · `worktrees.md` ·
`FONTES-BRUMADINHO-UFMG.md` · `PLANO-IMAGENS-INPE.md` · `betim-F0-discovery.md` ·
`betim-ambiental-pecma-research.md` · `congresso-F0-discovery.md` ·
`judiciario-F0-discovery.md` · `judiciario-F9-lancamento.md`

⚠️ **Documento datado envelhece sem avisar.** Em 15/08 dois deles discordavam
sobre desde quando o site estava parado, e um terceiro dizia "17 marcos" horas
depois de virarem 23. Número em documento antigo **não** é medição atual — se
for decidir com ele, remeça. (A curadoria de 16/08 moveu os datados para
`docs/_historico/` — o que ainda está na raiz descreve o presente.)

## Regra para quem escrever aqui

Antes de criar arquivo novo, **pergunte se ele cabe num que já existe.** Nove
arquivos num dia foi excesso, e o excesso é meu: a maioria dos achados de
15/08 caberia como seção do plano do dia.

Um arquivo novo se justifica quando:

- é **referência de domínio** que vai ser consultada muitas vezes (`FONTES-*`);
- é **procedimento** que alguém executa (`rotina-local`, `PAINEL-EDICAO-COMO-USAR`);
- é **plano** de trabalho que ainda não começou.

Não se justifica para registrar o que foi feito num dia — isso é mensagem de
commit, e o `git log` já guarda. Se for indispensável, entra aqui na lista de
registro histórico, com a data no nome.
