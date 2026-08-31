# Plano M7–M11 — Curadoria OSS para o pipeline de automação

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [linkmender-propostas.md](../relatorios-automacao/linkmender-propostas.md), [docvault-indice.json](../relatorios-automacao/docvault-indice.json)
> **Palavras-chave:** congresso, empresas, socios, brasil.io, dadosabertosbrasil, presidio, changedetection, n8n, docker, dado pessoal, coletor

## Sumário

- [Propósito](#propósito)
- [Estado da fila — M1 a M6 entregues](#estado-da-fila--m1-a-m6-entregues)
- [M7 — Coletor da frente Congresso via DadosAbertosBrasil](#m7--coletor-da-frente-congresso-via-dadosabertosbrasil)
- [M8 — Rede de sócios via brasil.io (frente Empresas)](#m8--rede-de-sócios-via-brasilio-frente-empresas)
- [M9 — changedetection.io como serviço Docker](#m9--changedetectionio-como-serviço-docker)
- [M10 — Migração do agendamento para n8n local](#m10--migração-do-agendamento-para-n8n-local)
- [M11 — Presidio no pipeline de privacidade](#m11--presidio-no-pipeline-de-privacidade)
- [Ordem de execução e regras de paralelização](#ordem-de-execução-e-regras-de-paralelização)
- [Verificação](#verificação)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Detalhar a execução das melhorias M7–M11 da curadoria OSS (2016-08-31), em ordem de custo × benefício, com as decisões de desenho, as armadilhas de dado pessoal e o estado de cada item. M1–M6 já foram entregues em 31/08/2026 (ver ESTADO.md, "Entregas de 31/08/2026").

## Estado da fila — M1 a M6 entregues

| Item | Entrega |
|---|---|
| M1 — URL do TransfereGov no registry | ✅ migrada para `api-publica.transferegov.gestao.gov.br` |
| M2 — Histórico JSONL no PicoClaw | ✅ `picoclaw-historico.jsonl` |
| M3 — Hash de conteúdo (8 KB) no PicoClaw | ✅ `hashConteudo` nas sondagens |
| M4 — validate-docbr na guarda de privacidade | ✅ fallback seguro + trava do zero-padding |
| M5 — Headers reais de produção no Hermes | ✅ `auditarHeadersProducao()` |
| M6 — Retry com backoff no PicoClaw | ✅ retry 1× com 5 s |

## M7 — Coletor da frente Congresso via DadosAbertosBrasil

**O que é:** coletor Python usando o pacote `DadosAbertosBrasil` (unifica IBGE, BACEN, IPEA, Câmara, Senado, IBAMA, ANEEL) para a frente Congresso, substituindo fetch manual de APIs heterogêneas por chamadas tipadas com paginação automática.

**Por quê:** as fontes `camara-dados-abertos` e `senado-dados-abertos` estão em camada `banco` e a Neon está em HTTP 402 até 01/09; um JSON estático de MG destrava leitura sem banco e alimenta o índice estático.

**Desenho:**
- `scripts/coletar-congresso-mg.py` (novo): `camara.lista_deputados(sigla_uf='MG', legislatura=57)` e `senado.lista_senadores(sigla_uf='MG')`; grava `apps/web/data/congresso-mg.json` com: nome, partido, UF, situacao, url da ficha; pausa honesta entre chamadas.
- ⚠️ **CPF:** a API da Câmara expõe `cpf` do deputado — **redigir na origem** (padrão dos coletores existentes: `redigirTextoLivre` do `coletar-ckan-mg.mts`), nunca gravar CPF completo. A guarda `checar-dado-pessoal-em-dado.py` varre `apps/web/data` automaticamente e barra pre-push.
- Registry: entrada nova `congresso-mg-parlamentares` (frente `congresso`, camada `data-json`, licença `dados-abertos-gov`).

**Estado:** ✅ **concluído em 31/08/2026** — 93 deputados + 3 senadores de MG, JSON de 17 KB em `apps/web/data/congresso-mg.json`, CPF redigido na origem com self-test e abort se sobreviver; guarda verde (88 arquivos). Observação da implementação: o parâmetro real da lib 2.1.0 é `uf`, não `sigla_uf` (corrigido no coletor).

**Verificação:** `python scripts/coletar-congresso-mg.py`; guarda limpa; `npx tsc --noEmit -p apps/web`; registry.test.ts verde.

## M8 — Rede de sócios via brasil.io (frente Empresas)

**O que é:** consumir `https://brasil.io/api/dataset/socios-brasil/socios/?q=...` para enriquecer a frente Empresas com a rede de sócios de empresas mineradoras (Vale e subsidiárias), sem raspar a Receita.

**Por quê:** dado estruturado e curado; substitui scraping lento do portal da Receita.

**Desenho:**
- Medir primeiro: resposta da API sem token (anonimato e limite), **e o mascaramento de CPF** — o brasil.io deve devolver CPF de pessoa física mascarado; se devolver completo, **não gravar** e manter só nome + tipo de participação.
- `scripts/coletar-socios-brasilio.mts` (novo, TS, sem SDK): GET com UA honesto, pausa 400 ms, paginação; grava `apps/web/data/socios-vale.json` com `{nome, tipo, participacaoPercentual, dataEntrada, cpfCnpjMascarado}` e campo `meta` com `fonte`, `dataColeta`, `ressalvaEditorial`.
- ⚠️ **Editorial (regra do AGENTS.md):** sócio registrado na Receita ≠ gestão atual nem responsável por dano. A ressalva viaja colada ao dado.
- ⚠️ **Dado pessoal:** nome de pessoa física + relação societária é dado público de registro, mas o **CPF nunca sai** do coletor; a guarda mod-11 barra pre-push.
- Registry: entrada nova `socios-brasil-empresas` (frente `empresas`, camada `data-json`).

**Estado:** 🟡 coletor pronto, **dado pendente de token** — medido em 31/08: a API do brasil.io exige `Authorization: Token` (401 sem token). O coletor é fail-closed (aborta sem gravar). Para concluir: criar token em `brasil.io/auth/tokens-api/`, pôr `BRASILIO_API_TOKEN` em `scripts/.env` e rodar `npx tsx scripts/coletar-socios-brasilio.mts`.

**Verificação:** mesmo conjunto do M7 + conferir manualmente 3 registros contra a fonte.

## M9 — changedetection.io como serviço de container

**O que é:** serviço self-hosted que monitora mudanças visuais e de conteúdo em páginas com JavaScript (portais Angular como CGE-MG) que o PicoClaw não renderiza.

**Bloco medido em 31/08:** nem Docker nem Podman estão instalados nesta máquina; **WSL2 com Ubuntu já existe** (backend pronto). Container da escolha: **Podman** (decisão registrada no fim) — roda na mesma WSL2, sem daemon de VM com privilégios do Docker Desktop.

**Desenho (quando o Podman existir):**
- `podman run -d --name changedetection -p 5000:5000 dgtlmoon/changedetection.io` + volume persistente (ou `podman compose` com o mesmo `docker-compose.yml`).
- Watches iniciais: página de novos documentos de LAI da CGE-MG, SIGBM via API JSON (filtro XPath/JSONPath no campo `total_barragens`), publicação de novas autuações do IBAMA.
- Alerta: webhook para o Telegram (canário já existente).
- **Fora da CI**: serviço local do home-pc, nunca CI.

**Estado:** 🟡 planejado, bloqueado por infra (Podman não instalado). Reavaliar quando o dono instalar o Podman.

## M10 — Migração do agendamento para n8n local

**O que é:** orquestrador visual de workflows substituindo os scripts PowerShell de agendamento (`executar-rotina-madrugada.ps1`, `executar-rotina-manha.ps1`).

**Bloqueio medido em 31/08:** o mesmo do M9 — **Podman ausente** (n8n roda em container).

**Desenho (quando o Podman existir):**
- Workflow `madrugada`: Cron 03:30 → PicoClaw → Argus → LinkMender → condicional (disponibilidade < 70% → alerta Telegram).
- Workflow `manha`: Cron 05:30 → Hermes → DocVault → Colibri → relatório.
- Os scripts PowerShell **não são apagados**: viram contingência documentada (rollback imediato).
- Custo real da migração: reescrever a orquestração em JSON de workflow + manter `scripts/.env` fora do n8n (segredos ficam no n8n? decisão do dono).

**Estado:** 🟡 planejado, bloqueado por infra (Podman). Prioridade abaixo do M9 (o agendamento atual funciona e é testado diariamente).

## M11 — Presidio no pipeline de privacidade

**O que é:** adicionar ao `checar-dado-pessoal-em-dado.py` um modo `--alta-confianca` usando o Microsoft Presidio com um reconhecedor de CPF por regra (regex + mod-11) — sem modelos de ML (evita dependência pesada de spacy).

**Por quê:** a régua atual (regex + mod-11) já cobre CPF puro; Presidio adiciona contexto (ex.: "CPF: 000.000.000-00" com palavra vizinha) e tolera texto longo com ruído — útil para ementas e PDFs convertidos. É **opcional**: sem a biblioteca, o script segue idêntico ao atual.

**Desenho:**
- `pip install presidio-analyzer` (medir: o pacote puxa spacy? se sim, avaliar instalação sem modelos — `AnalyzerEngine` rule-only com `RecognizerRegistry` customizado).
- Se a instalação for inviável na máquina (peso/dependências), o item fica documentado como pendente de medida — **não** muda a guarda atual.
- Modo `--alta-confianca`: só reporta candidatos em que o reconhecedor Presidio E o mod-11 concordam; resultado idêntico ao atual nos acervos (regressão zero).
- Import com fallback (mesmo padrão do validate-docbr, M4).

**Verificação:** self-tests do script com e sem a biblioteca; varredura dos 85 arquivos limpa; suíte `sem-cpf-no-repo.test.ts` verde.

**Estado:** ✅ **concluído em 31/08/2026** — `presidio-analyzer 2.2.364` instalado; `--alta-confianca` usa `PatternRecognizer` rule-only (sem engine de NLP, que baixaria `en_core_web_lg` de 400 MB — medido); o Presidio roda só quando há candidato (medição: varrer todo texto custava 290s; como confirmação, 28s no corpus limpo); fallback sem a biblioteca avisa e segue com a régua atual.

## Ordem de execução e regras de paralelização

1. **M7 e M8 em paralelo** (coletores independentes, arquivos e datasets distintos — regra do AGENTS.md: um agente por arquivo de saída).
2. **M11 em seguida, solo** — mexe na guarda de privacidade (arquivo sensível, ninguém mais toca).
3. **M9 e M10 documentados como bloqueados** — sem Docker não há código.

Proibido em paralelo: dois agentes no `registry.ts`, na guarda de privacidade ou nos `.ps1` das rotinas. Quem commita é um operador só, por pathspec.

## Verificação

- Guarda: `python scripts/checar-dado-pessoal-em-dado.py` (limpa antes de qualquer commit de dado coletado).
- `npx tsc --noEmit -p apps/web`.
- `npx vitest run` nos testes tocados (registry, sem-cpf-no-repo).
- Push com o pre-push hook (guarda) verde.

## Decisões registradas

- **Containers = Podman, não Docker Desktop** (decisão do dono, 31/08): daemonless e rootless, sem licença comercial restritiva nem daemon de VM com privilégios; WSL2 com Ubuntu já presente na máquina. Mesmas imagens OCI e `podman compose` compatível com o `docker-compose.yml` das ferramentas.
- **M9 e M10 ficam bloqueados por infra (Podman ausente), não por escolha** — medição em 31/08: `docker: not found` e `podman: not found`, WSL2 presente.
- **Dado pessoal de sócio**: CPF nunca sai do coletor do M8; só nome e identificador mascarado vão para o repo.
- **Presidio é opcional e rule-only** — sem modelos de ML; guarda atual é a régua base.
- **Coletores M7/M8 gravam JSON em `apps/web/data`** (camada data-json), dentro do escopo da guarda mod-11.

## Origem / Histórico

Este plano detalha os itens M7–M11 de `C:\Users\Home\Downloads\curadoria-oss-melhorias.md` (curadoria de repositórios e APIs públicas, 31/08/2026). M1–M6 constam como entregues em [ESTADO.md](../02-estado/ESTADO.md) — "Entregas de 31/08/2026".
