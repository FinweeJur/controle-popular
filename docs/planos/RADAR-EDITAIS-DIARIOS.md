# Plano — Radar diário de editais nos diários oficiais (DOMG-e)

> **Tipo:** PLANO
> **Domínio:** estado
> **Última medição:** 2026-09-10
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [diario-oficial-plano.md](diario-oficial-plano.md), [FONTES](../06-fontes/FONTES.md), [PRODUTO](../01-produto/PRODUTO.md), [OPERACAO](../05-operacao/OPERACAO.md)
> **Palavras-chave:** radar, editais, diário oficial, DOMG-e, jornalminasgerais, chamamento público, conselhos, sociedade civil, participação, telegram, agendamento, dado pessoal, pendentes

## Sumário

- [Propósito](#propósito)
- [O que já existia (reuso, nada reinventado)](#o-que-já-existia-reuso-nada-reinventado)
- [Fonte: DOMG-e / Jornal Minas Gerais (API e robots.txt)](#fonte-domg-e--jornal-minas-gerais-api-e-robotstxt)
- [Detecção: regras e score](#detecção-regras-e-score)
- [Fluxo completo (radar → pendentes → publicador)](#fluxo-completo-radar--pendentes--publicador)
- [Guardas de dado pessoal](#guardas-de-dado-pessoal)
- [Agendamento](#agendamento)
- [Limitações conhecidas e calibração](#limitações-conhecidas-e-calibração)
- [Decisões registradas](#decisões-registradas)

## Propósito

Este documento responde uma pergunta: **como o portal passa a acompanhar editais de
interesse social publicados em diários oficiais, sem intervenção humana diária.**
A primeira rodada real do radar (10/09/2026) achou 18 candidatos na edição do dia,
entre eles o Termo Aditivo 02/2026 do edital CONDEL-PPDDH/MG — exatamente a classe
de ato que o dono quer capturar (participação da sociedade civil, conselhos,
prazos de inscrição).

## O que já existia (reuso, nada reinventado)

| Mecanismo | Onde | Reuso no radar |
|---|---|---|
| Coletores de diário oficial | `etl/betim/etl/camaras/sigpub.py` (AMM-MG, Diamantina) e `domweb.py` (DOM-PBH) | padrão copiado: UA honesto, pausa 1,5 s, retry, bloqueio vira exceção, não "0 edições" |
| Agenda dos diários municipais | `scripts/coletar-diario-municipios.mts` | padrão de spawn de python com fallback `py -3` e env `RADAR_PYTHON` |
| Extração de texto de PDF | `scripts/probrumadinho-extrair-texto.py` (PyMuPDF) | helper novo `radar-editais-extrair-pdf.py` segue o mesmo padrão |
| Máscara de CPF mod-11 | `apps/web/lib/paraopeba/triagem.ts` | reimplementada no radar (twin documentada) — régua idêntica |
| Guardas de dado pessoal | `scripts/checar-dado-pessoal.py` + `checar-dado-pessoal-em-dado.py` | publicador roda as duas ANTES de escrever |
| Telegram com retry | `scripts/enviar-relatorio-telegram.mts` | publicador copia o padrão (env de `scripts/.env` via `process.env`, nunca imprime token) |
| Formato do blog | `apps/web/lib/noticias/portal.ts` + `apps/web/data/noticias-portal.json` | publicador grava `JSON.stringify(lista, null, 1)` — o mesmo indent de 1 espaço do arquivo atual |
| Agendamento Windows | `scripts/agendar-tarefas-windows.ps1` | tarefa `ControlePopular_RadarEditais`, padrão do bloco VigiaServidor |

Não existe coletor de DOMG-e no repo — o que havia era só URL citada em dados
(`etl/betim/dados/ambiental-estudos.json`, campo `link_iof`). A API foi medida
em 10/09/2026 e documentada na seção de fonte.

## Fonte: DOMG-e / Jornal Minas Gerais (API e robots.txt)

Fonte: **Jornal Minas Gerais** (`jornalminasgerais.mg.gov.br`), o Diário Oficial
Eletrônico de MG mantido pela Imprensa Oficial.

API medida em 10/09/2026 (SPA Angular; a API fica em `/api/v1/`):

```
GET https://www.jornalminasgerais.mg.gov.br/api/v1/Jornal/ObterEdicaoPorDataPublicacao?dataPublicacao=YYYY-MM-DD
→ {"dados": {"dataPublicacao", "cadernos": [{id, descricao, secoes: [{descricao, paginaInicial}]}],
   "arquivoCadernoPrincipal": {"arquivo": "<base64 do PDF assinado CMS>", "totalPaginas", "descricaoCaderno"}},
   "erros": []}
→ {"dados": null, "erros": []}   = dia sem publicação (fim de semana/feriado) — caso normal
GET https://www.jornalminasgerais.mg.gov.br/api/v1/Jornal/ObterUltimaEdicao
→ mesma forma, última edição publicada
```

**Decisão de robots.txt:** o site devolve o HTML do index para qualquer caminho,
inclusive `/robots.txt` (medido em 10/09/2026) — não há política de robots
publicada. Decisão conforme o padrão do repo: seguir sem política explícita, com
User-Agent que identifica o projeto, pausa de 1,5 s entre requisições e escopo
reduzido (UMA edição por rodada, sem crawlear acervo).

Link público citado nos pendentes: `edicao-do-dia?dataPublicacao=YYYY-MM-DD`
(best-effort — o site é SPA; o caderno correto é o do dia citado).

## Detecção: regras e score

Sem LLM nesta etapa. Tudo é regex + score sobre o texto normalizado (sem acento,
minúsculas — a normalização é 1:1 em comprimento, então os índices valem no
texto original):

- **Âncoras** (bloco só é candidato se tiver uma): `edital`, `chamada publica`,
  `chamamento publico`, `selecao publica`.
- **Bônus de cabeçalho forte** (+6): `edital de chamamento público`, `edital de
  convocação`, `edital de seleção`, `edital de credenciamento`, `pregão`,
  `leilão`, `tomada de preços`, `concorrência`, `processo seletivo`, etc.
- **Termos ponderados** (com teto de repetições): `chamamento publico` +5,
  `sociedade civil` +4, `selecao publica` +4, `chamada publica` +3,
  `credenciamento` +3, `termo de fomento/colaboracao` +3, `conselho` +2,
  `condel` +2, `ppddh` +2, `inscric` +2, `osc` +2, `premiac` +2, `eleic` +1,
  `defensor` +1, `prazo` +1, `recurso` +1, `entidade` +1, `data dd/mm/aaaa` +2.
- **Limiar:** score ≥ 7 (padrão; calibra com `--limiar N`). Janela do trecho:
  150 caracteres antes e 1.800 depois da âncora, por página, com mesclagem de
  sobreposições.
- **Título sugerido:** linha que contém a âncora (máx. 140 caracteres).
- Gancho `enriquecerComLlm` existe no radar mas está **desativado por padrão** —
  ligar exige a regra 8 do AGENTS.md (sanitizar antes do prompt) e o rótulo
  editorial de texto gerado por máquina.

## Fluxo completo (radar → pendentes → publicador)

1. `scripts/radar-editais-diarios.mts` (diário, 04:20): baixa a edição do dia
   (ou a última publicada, se a janela de `--dias` cair em fim de semana),
   extrai o texto do caderno principal, detecta candidatos e grava
   `apps/web/data/radar-editais/pendentes/<data>-<hash>.json` (status
   `pendente`, com fonte, data, URL, título sugerido, trecho com contexto,
   score, termos). **Nunca escreve em `noticias-portal.json`.**
2. `scripts/publicar-radar-editais.mts` (MANUAL — a publicação é decisão do
   dono): roda as duas guardas de dado pessoal (aborta se qualquer uma sair
   com ≠ 0), converte cada pendente em `NoticiaPortal` — categoria
   **Explicador**, frente **estado**, subfrente *Participação & Editais
   Públicos*, `declaracaoIa` "Texto gerado automaticamente pelo radar de
   editais a partir do Diário Oficial, revisado pela equipe" — grava com
   read-modify-write no formato atual do JSON (indent 1), move o pendente para
   `processados/` com status `publicado`, avisa o dono no Telegram e **não
   commita**.
3. O commit/deploy segue a regra 7 do AGENTS.md (cada um publica o próprio
   trabalho; a rotina do dono decide).

## Guardas de dado pessoal

- O radar mascara CPF (mod-11) nos trechos ANTES de gravar — régua gêmea de
  `apps/web/lib/paraopeba/triagem.ts` (`[CPF-REMOVIDO]`).
- O publicador roda `python scripts/checar-dado-pessoal.py` e
  `python scripts/checar-dado-pessoal-em-dado.py` antes de qualquer escrita —
  reprovou, aborta sem tocar em nada.
- `apps/web/data/**` já está em `DIRETORIOS_DADO` de
  `checar-dado-pessoal-em-dado.py`, então `radar-editais/` é varrido no
  pre-push e na CI sem editar a lista.
- Medido em 10/09/2026: guarda de dado passou sobre os 18 pendentes + todo o
  resto (264 arquivos, 0 CPF).

## Agendamento

- Task `ControlePopular_RadarEditais`, diária às **04:20**, registrada em
  10/09/2026 na máquina home-pc e presente em `scripts/agendar-tarefas-windows.ps1`
  (bloco ativo, padrão VigiaServidor: `cmd /c cd /d repo && npx tsx
  scripts/radar-editais-diarios.mts >> docs/relatorios-automacao/logs/rotina-radar-editais.log 2>&1`).
- 04:20 fica no buraco entre a coleta da madrugada (03:30) e a sondagem da
  manhã (05:30); a coleta mensal das 04:00 só age no dia 01. O radar faz UMA
  edição por rodada com pausa de 1,5 s — carga desprezível.
- **O publicador NÃO é agendado** — publicação no blog continua sendo decisão
  do dono. Agendar o publicador é o próximo passo quando o dono confiar na
  calibração.

## Limitações conhecidas e calibração

- Só o **caderno principal** (Diário do Executivo) é varrido — é onde fica a
  seção "Editais e Avisos". Diário dos Municípios Mineiros e Diário de
  Terceiros ficam para a próxima rodada (a API expõe o PDF deles por
  `Caderno/ObterArquivoCadernoPorId`).
- O limiar 7 privilegia sensibilidade (rascunho demais) sobre precisão —
  de propósito: pendente é fila de revisão, falso negativo é edital perdido.
  Se o ruído incomodar, subir para `--limiar 9` (a rodada de 10/09/2026
  passaria de 18 para ~12 candidatos; o CONDEL-PPDDH com score 40 continua).
- O link público citado é best-effort (SPA) — o que garante o achado é o
  conteúdo citado + data + página.
- Não há OCR: página escaneada (sem camada de texto) fica invisível para o
  detector. Lacuna é informação — o radar diz quantas páginas tinham texto.

## Decisões registradas

- **Detecção determinística sem LLM na coleta** — pedido do dono; gancho
  `enriquecerComLlm` fica desativado e documentado.
- **Radar nunca escreve em `noticias-portal.json`** — só o publicador escreve,
  e só depois das duas guardas de dado pessoal.
- **Publicação manual** — o publicador não entra na agenda até o dono decidir.
- **Máscara de CPF na gravação, guarda no publish** — duas redes independentes
  (regra 2 do AGENTS.md).
- **robots.txt inexistente no DOMG-e** — seguir com UA honesto, pausa e escopo
  mínimo, registrado no cabeçalho do radar (padrão do repo).
