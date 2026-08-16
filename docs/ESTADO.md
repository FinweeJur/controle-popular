# ESTADO — o portal hoje, o que vem a seguir

Estado medido do portal controlepopular.com.br: o que está no ar, o que está bloqueado, o que vem a seguir, e as decisões que não podem ser reabertas sem remensurar. (medição em 16/08 — remeça antes de decidir com ele)

## No ar agora

Publicado em 15/08 (build no `home-pc`, deploy passou). Seis frentes:

| Frente | O que está no ar |
|---|---|
| **Cidades** | seis municípios com contrato, licitação, diário de câmaras, rede de proteção, clima e defesa civil; índice fatiado em `[municipio]/camara/legislacao` |
| **Congresso** | PLs e ofício ao Congresso com `.docx`/`.pdf` gerados no navegador; rubrica determinística |
| **Judiciário** | grafo de jurisprudência com link de fonte; página de privacidade |
| **Função Social da Terra** | globo 3D com imagem de satélite por zoom e tooltip de 2 s; camadas de barragem, mineração, quilombolas; 4 camadas de alerta de sobreposição ligadas; faixa de 8 km × SIGMINE (1.899 processos que a interseção pura não vê); alerta quilombola × mancha com 6 sobreposições |
| **Paraopeba** | auditoria AJRI com 467 fichas legíveis (sem modelo) e relacionados por tema+data; execução do Acordo (26 municípios, R$ 5,48 bi, 73,8% pago); repasse (1.214/1.214 linhas, R$ 1,65 bi); biblioteca das ATIs (597); clipping de ATIs (46) e IJs (59); radar de notícias; linha do tempo; ressalva `AvisoColetaEmCurso` em 5 páginas |
| **Ambiental** | direito crítico (30 normas + 15 precedentes em 5 temas); legislação estadual (6.378 normas); microssistema com instrumento e precedente por tema |

Transversais confirmados: **painel de edição web** (token, editar, publicar, sincronizar, último deploy); **termo LGPD** com canal de contato; **assistente** degraus 0 (navegação, 0,35 ms), 1 (busca no índice) e 2 (composição determinística) no ar; **Direitos em Movimento** com as quatro portas e o facilitador de denúncia (`.docx`/`.pdf` só no navegador, rascunho opt-in); **Rouanet** coletado e compactado no repo (7.206 projetos + 20.785 incentivadores de MG, 7,9 MB → 2,4 MB), tela adiada de propósito; **ComunicaBR** dos 853 municípios coletado (17fccf9, 61% dos itens vazios).

## Fila viva — ranqueada por custo × benefício

**Degrau 2 do assistente entregue (16/08)** — composição determinística, sem modelo: "compare Betim e Belo Horizonte", "o que falta em Betim", "Contagem não é atendida". Regra escrita em `apps/web/lib/assistente/compor.ts`, sobre o índice do degrau 1, sem rede além dele; 23 testes novos. Trabalho em andamento (16/08): **diário oficial D1** (coletor SIGPub — mecanismo de busca confirmado; a coleta em si aguarda o corte de LGPD). Depois: indexação do ComunicaBR por município no índice (item 6), que espera o banco local.

| # | Tarefa | Estado | Por quê / bloqueio |
|---|---|---|---|
| 1 | Degrau 2 do assistente | ✅ | entregue em 16/08: comparar/lacuna/não-atendida; 23 testes novos (681 vitest + 137 globo verdes); sem modelo, sem rede além do índice |
| 2 | Protocolo da LAI do INCRA no Fala.BR | ⛔ | `data_limite: 2026-08-18` — a única tarefa que fica **impossível** se atrasar; exige login humano e anotar o número |
| 3 | Carregar as 8.940 normas federais | ⛔ | código pronto e testado; sem a carga, `/ambiental/legislacao` mostra 0 nacionais (e a proteção animal fica invisível) |
| 4 | Clima e risco: aplicar migration `0074` e carregar o coletado | 🟡 | `381b467` coletado (AdaptaBrasil 6.824 linhas + INMET), não carregado; BH pontua 0,00 "muito baixo" — índice nunca vai sozinho para a tela |
| 5 | Migration `0071` na Neon | ⛔ | até 01/09; sem ela os 6 ETLs do GitHub reintroduzem convênio duplicado |
| 6 | ComunicaBR: indexação por município no índice estático | 🟡 | nunca o estado inteiro; ressalva viaja junto (61% dos itens vazios — índice que guarde só o que tem valor responde com falsa completude) |
| 7 | Arquivo de fontes em R2 (espelho) | 🟡 | 8.345/8.570 normas MMA têm `link_pdf` (97,4% — medição em 16/08); upload por fazer; medir antes em massa |
| 8 | 13 quilombolas + 103 barragens sem mancha | 🟡 | lacuna de dado; cobertura ainda é o maior risco de conclusão errada (a primeira lacuna desse tipo mudou um alerta de zero para seis) |
| 9 | Trava de dado pessoal que varre o DADO | ✅ | entregue em 16/08: `scripts/checar-dado-pessoal-em-dado.py` (CPF mod-11 sobre valores de JSON de acervo) no pre-push e na CI + teste gêmeo vitest; segue a amostragem dos 200 documentos do acervo (plano Brumadinho §3) quando o dump existir |
| 10 | Rouanet: junção incentivador × fornecedor + tela | 🟡 | 2.261 CNPJs (de 20.785 incentivadores) × `contratos.fornecedor_cnpj`; quantos casam só se sabe com banco; tela com ressalva colada ao número |
| 11 | Coletor de notícias diário | 🟡 | escrito e rodando à mão; agendamento depende do servidor |
| 12 | Três ATIs como fonte do radar | ✅ | entregue em 16/08: feeds AEDAS/ADAI/Guaicuy no coletor + regra "Nota de pesar" na triagem, com teste (35 testes verdes) |
| 13 | Resumir contratos/PLs/convênios truncados | 🟡 | escopo não definido: quantos, quais listagens |
| 14 | URN / normas.leg.br | 🟡 | lib no ar; verificação em build e resolvedor estadual abertos; caminho: dataset LexML, depois URN das 15.318 normas |
| 15 | Incentivo ao esporte | ⛔ | `DADOS_GOV_BR_API_TOKEN` é JWT expirado — renovar em `etl/betim/.env` e o item destrava inteiro |
| 16 | Conecta gov.br (CNPJ/CEP) | ⛔ | decisão do dono: credenciamento de PJ de direito privado ou não |
| 17 | AJRI fase 2 (espelho dos 467 PDFs) e fase 3 (resumo) | ⛔ | sem `AJRI_COOKIE` a fase B não começa; ordem obrigatória: baixar → extrair → varrer dado pessoal → resumir; medir 10 PDFs antes de projetar |
| 18 | Diário oficial (D0–D5) | 🟡 | D1 em andamento: mecanismo SIGPub confirmado, migration 0077 + classificador pronto; coleta espera o corte de LGPD (decisão do dono) |
| 19 | Pró-Brumadinho: outras duas páginas | 🟡 | obrigações da Vale (R$ 11,48 bi × R$ 16,38 bi) e 99 publicações; validar conteúdo (302 de período eleitoral), não status |
| 20 | ETL antigo da FGV | 🟡 | alinhar User-Agent honesto + pausa ou aposentar em favor do coletor novo — decisão do dono |
| 21 | Ordenar e filtrar as listas de dados | 🟡 | pedido do dono (16/08): ordenar/filtrar por valor, prestador, tema, data, tipo de alerta, emendas parlamentares e outros campos — estender o padrão `TabelaEstatica.tsx` (11 listas já usam), não criar mecanismo novo |
| 22 | Monitoramento da Vale — página dedicada | 🟡 | pedido do dono (16/08): documentos, prestação de contas, relatórios, notícias, onde investiu, benefícios fiscais recebidos, onde presta contas, pra quem vendeu — uma frente nova, camadas detalhadas no TODO-PROXIMAS-RODADAS.md (item 11) |
| 23 | Geocodificar os dados da Vale | 🟡 | pedido do dono (16/08): escrever o plano de georreferenciar o que o item 22 levantar, reutilizando a infra de mapa/geometria existente (TODO-PROXIMAS-RODADAS.md item 12); executar quando houver dado |
| 24 | Chatbot IA sobre o acervo | 🟡 | pedido do dono (16/08): adaptar criticamente o plano do "Notebook LM do negócio" pro portal — RAG sobre documentos públicos com citação, degrau 3 do assistente; decisões do dono em aberto (região do cérebro, acervo, ressalva); plano em `docs/planos/PLANO-CHATBOT-IA.md` |

## Bloqueios

| Bloqueio | Até | O que desbloqueia |
|---|---|---|
| Neon em HTTP 402 | 01/09 | pagar/vencer o prazo — sem banco não há `next build` nesta máquina |
| Build e publicação só no `home-pc` | — | rodar a rotina local no `home-pc`; ou abrir OpenSSH nele (uma configuração, e publicar deixa de depender de quem está no teclado) |
| Rede bloqueada na máquina de dev (WinError 10013) | — | navegador do dono para sondagens (foi assim que as duas correções do ComunicaBR saíram) |
| LAI INCRA — login humano | 2026-08-18 | acessar o Fala.BR, localizar o pedido e anotar o protocolo em `docs/LAI-PROTOCOLOS.json` |
| Índice estático pendente de Postgres local | — | banco local com as cargas novas (Rouanet, ComunicaBR por município, repasse) — quem mede índice precisa do banco |
| GitBook com convite pendente | — | dono aceitar o convite para espelhar `docs/` |

## Dívida técnica registrada

As **duas compactações** (`apps/web/lib/comunicabr/arquivo.ts` × `apps/web/lib/estatico/compactar.ts`) **não são a mesma coisa**: uma é codec de estrutura aninhada com esqueleto nacional compartilhado (é o que faz 99 MiB caberem em 2,16 MB nos 853 municípios); a outra é genérica para tabela plana (Rouanet, 7,9 MB → 2,4 MB). **Decisão documentada: não unificar** — aplainar o ComunicaBR perde o ganho de ordem de grandeza, e enxertar aninhamento no genérico é complexidade para um único consumidor. Remeça antes de reabrir.

## Rito de trabalho

Quem quer trabalhar entra por **PRODUTO.md** (a porta) e lê **DESENVOLVIMENTO.md** antes do primeiro commit; **FONTES.md**, **ARQUITETURA.md**, **OPERACAO.md** e **EDICAO.md** cobrem fonte, tetos, operação e edição conforme a tarefa. Dúvida entre dois caminhos: o registro de decisão e a medição vêm antes da escolha.

## Origem

Este documento absorve a fila viva e o estado de 16/08. Arquivos-fonte e classificação:

- `PLANO-2026-08-15.md` — **ENTREGUE** (executado até o fim; a fila viva dele é este documento)
- `HANDOFF-2026-08-15-NOITE.md` — **ENTREGUE** (entrega documentada; pendências e decisões migradas para as seções acima)
- `PLANO-DIREITOS-EM-MOVIMENTO.md` — **ENTREGUE** (quatro portas no ar: home, ajuda, informação e denúncia)
- `PLANO-ACAO-CIDADA.md` — **ENTREGUE** (facilitador de denúncia em produção, fases 1–3)
- `TODO-PROXIMAS-RODADAS.md` — **ATIVO** (dívidas que não couberam inteiras aqui: análise do commit CAR/INCRA, revisão de completude de páginas, ETL FGV)
- `diario-oficial-plano.md` — **ATIVO** (plano sem código; fases D0–D5)
- `PLANO-BASES-CLIMA-E-RISCO.md` — **ATIVO** (fatia 1 entregue; BATER, CEMADEN, INPE, SNIS e MapBiomas pendentes)
- `PLANO-ESPELHO-PDF-AJRI.md` — **ATIVO** (fase 1 entregue; fases 2–3 por fazer, bloqueadas por `AJRI_COOKIE`)