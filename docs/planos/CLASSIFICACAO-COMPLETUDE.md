# Classificação de completude — páginas com buraco (item 6, rodada 3)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [REVISAO-COMPLETUDE.md](../historico/procedimentos/REVISAO-COMPLETUDE.md) (rodada de 14/08), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** plano, ativo, tarefa

## Sumário

- [Propósito](#propósito)
- [1. Críticos para corrigir (código)](#1-críticos-para-corrigir-código)
- [2. AUSENTE (44)](#2-ausente-44)
- [3. NAO_VERIFICADO (18)](#3-nao-verificado-18)
- [4. DESATUALIZADO (5)](#4-desatualizado-5)
- [5. Decisões do dono necessárias](#5-decisões-do-dono-necessárias)
- [Origem](#origem)

Varredura de 2026-08-17 sobre as páginas públicas do portal, feita em
`redeProtecao.ts` (rodadas 1 e 2), `actors.ts`/`atores.ts`, páginas
`[municipio]/*`, `congresso/*`, `paraopeba/*`, rodapé e libs de dados.
Método: leitura de código + dados estáticos + confirmação ao vivo de URLs
críticas (curl, 2026-08-17). Nada rodou contra o banco (Neon 402 até
01/09).

Três classes, tratamento diferente:

- **AUSENTE** (44) — o campo não existe no registro; virar "buraco
  declarado" (mostrar o que falta, sem inventar).
- **NAO_VERIFICADO** (18) — o dado existe, mas ninguém confirmou; manter
  isolado (não misturar com confirmado).
- **DESATUALIZADO** (5) — o dado foi verificado e envelheceu; reconferir ou
  marcar data.

## 1. Críticos para corrigir (código)

| # | Onde | Classe | Buraco |
|---|---|---|---|
| 1 | `app/[municipio]/anuncie/page.tsx:16-18` | AUSENTE | ~~WhatsApp comercial é placeholder `5531999999999` com `TODO(F7.6)` em produção — link falso no ar~~ **✅ 17/08: número real 5531975709609 confirmado pelo dono** |
| 2 | `app/[municipio]/prefeitura/page.tsx:125` + `lib/betim/diarioOficial.ts:27` | DESATUALIZADO | ~~Card "Diário Oficial de {cidade.nome}" linka e busca SEMPRE o de Betim — nas 5 cidades não-Betim promete diário local e manda pro de Betim~~ **✅ 17/08: link usa `fontes.diario_oficial` de cada cidade; contagem de edições só em Betim (única com dataset); cidade sem fonte (Itinga) não renderiza o card** |
| 3 | `app/[municipio]/plantao-farmacias/page.tsx` | AUSENTE | ~~"—" renderizado quando farmácia sem endereço~~ **✅ 17/08: endereço omitido quando nulo (mesmo padrão do telefone). O dado real segue dependente da escala oficial — buscas de 17/08 não acharam escala estruturada de Betim (portal da prefeitura sem a página; post no Instagram da prefeitura não acessível por automação); fica como integração futura, não bug de página** |
| 4 | `lib/betim/zap.ts` + `app/[municipio]/api/zap/route.din.ts` | AUSENTE | ~~`normalizeWhatsapp` → null → card com `wa.me/...` quebrado (linhas legadas)~~ **✅ 17/08: `normalizarLinhasZap` descarta linha com whatsapp nulo/inválido nas DUAS pontas (build estático via `fetchZapEstabelecimentos` e API ao vivo D1) — mesmo padrão do telefone: link quebrado é pior que ausência. 10 testes novos** |

## 2. AUSENTE (44)

| Rota | arquivo:linha | campo |
|---|---|---|
| `/:municipio/rede-de-protecao` | redeProtecao.ts:474 | site Conselho Tutelar (`site: null`) |
| 〃 | redeProtecao.ts:627 | site OAB Contagem CDH (`site: null`) |
| 〃 | redeProtecao.ts:284-296 | telefone/endereço Defensoria Diamantina (campos inexistentes) |
| 〃 | redeProtecao.ts:315-375 | telefone/endereço 5 MPMG-CAOs (CAODH, CAODCA, CAOVD, CAOIPCD, PROCON) |
| 〃 | redeProtecao.ts:501-513 | telefone RENAP (só Instagram) |
| 〃 | redeProtecao.ts:533-550 | telefone/e-mail AJUP (canal real é Instagram) |
| 〃 | redeProtecao.ts:552-565 | telefone SAJ PUC ((31) 3319-9935/36 só na nota) |
| 〃 | redeProtecao.ts:583-595 | telefone/e-mail OAB Nacional CDH |
| 〃 | redeProtecao.ts:597-612 | telefone OAB JF |
| 〃 | redeProtecao.ts:143-155 | telefone LAI-MG MPMG ((31) 3330-9504/127 só na nota) |
| 〃 | redeProtecao.ts:679-713 | `itensLaiMunicipal` sem `sic_*` na fonte → card não existe (Câmara de Araçuaí e Diamantina) |
| `/:municipio/contatos` | migration 0060:36-42 | SAMU de Itinga omitido (fora das bases do CIS-NORJE) |
| 〃 | migration 0060:52-57 | Guarda Municipal de Araçuaí (página oficial 404; "não achei" ≠ "não existe") |
| `/:municipio/plantao-farmacias` | paridade-betim.mts:929-933 | telefone/endereço (renderiza "—") |
| `/:municipio/prefeitura` | prefeitura/page.tsx (card DO) | diário local das cidades não-Betim (ver crítico #2) |
| `/:municipio/camara` | camara/page.tsx:142 | `camara_youtube`/`camara_sessoes` sem seed em migration → seção some nas 3 cidades do Vale |
| `/:municipio/vereadores/:slug` | page.tsx:280, vereadores.ts:19 | e-mail (`string \| null`, fallback "não divulgado") |
| `/:municipio/anuncie` | anuncie/page.tsx:16-18 | WhatsApp comercial (ver crítico #1) |
| `/:municipio/zap` | zap.ts:35 | whatsapp (ver crítico #4) |
| `/:municipio/coleta-lixo` | migration 0001:309 | horário (nullable, sem seed) |
| `/:municipio/nota-transparencia` | notaTransparencia.ts:14,41 | `linkSite` (`string \| null`; "Quer conferir na fonte?" some) |
| `/paraopeba/quem-atua` | atores.ts:70-130 | telefone/e-mail STF/STJ/MPMG/MPF (só `web`) |
| 〃 | atores.ts:191-216 | telefone/e-mail AEDAS/NACAB |
| 〃 | atores.ts:235-247 | canal direto ABA ("Via MAB" — atalho) |
| 〃 | atores.ts:270-287 | canal direto IEM ("nenhum telefone/e-mail/site encontrado em 2026-08-14") |
| 〃 | atores.ts:288-340 | telefone/e-mail Pref. Brumadinho, Câmara, AGU, Presidência |
| `/congresso/comissoes/:sigla` | page.tsx:50-55,113 | `url_site`/`email` (null → link some) |
| `/congresso/parlamentares/:id` | page.tsx:74-78 | `email`/`url_perfil` (null → link some) |
| Rodapé | Footer.tsx:32 | ouvidoria "Denunciar" ausente em Araçuaí/Itinga/Diamantina |

## 3. NAO_VERIFICADO (18)

| Rota | arquivo:linha | campo |
|---|---|---|
| `/:municipio/rede-de-protecao` | redeProtecao.ts:660-671 | 10 canais da lista (Betim e-SIC quebrado, Diamantina DNS, Araçuaí sem LAI, ALMG canal genérico, SPU login, Transp. SP, RENAP-MG, OAB-MG, comissões CDH, delegacias fora de BH) |
| 〃 | redeProtecao.ts:295 | endereço/telefone Def. Diamantina ("não estáveis") |
| 〃 | redeProtecao.ts:549 | e-mail AJUP (blog de 2016) |
| `/:municipio/contatos` | migration 0060:97 | telefone Câmara de Diamantina (agregador) |
| 〃 | migration 0003:15-16 | `[VERIFY em F5]` pendente nos telefones de Betim |
| `/:municipio/defesa-civil` | defesa-civil/page.tsx:68-72 | canais de 5 cidades ("pesquisa ainda não feita") |
| `/:municipio/links-uteis-mg` | page.tsx:54 | status do GTAC |
| `/:municipio/supermercados-farmacias` | migration 0019:9-13; page.tsx:93-97 | OSM: 27 confirmados de ~106 (aviso na página) |
| `/paraopeba/quem-atua` | atores.ts:260-268 | e-mail/CNPJ Ascotélite (Mapa das OSC/IPEA, não confirmado) |

## 4. DESATUALIZADO (5)

| Rota | arquivo:linha | campo |
|---|---|---|
| `/:municipio/prefeitura` | prefeitura/page.tsx:125 + diarioOficial.ts:26-27 | Diário Oficial (ver crítico #2) |
| `/:municipio/contatos` | migration 0003:2 | telefones de Betim (verificação de 2026-07-20) |
| `/:municipio/links-uteis-mg` | page.tsx:75 | dados.mg.gov.br (confirmado 2026-07-21) |
| `/:municipio/nota-transparencia` | page.tsx:106 | fonte ATRICON (confirmada 2026-07-23) |

## 5. Decisões do dono necessárias

1. WhatsApp comercial do `/anuncie` — o número real existe? (só o dono sabe)
2. Diário Oficial das cidades do Vale — elas têm diário próprio? Onde?
3. Ajuda de quem tem visão para os canais sem contato (IEM, ABA, atores do
   Paraopeba) — mesmo método que desbloqueou a foto 00296.
4. Rodar a auditoria dos 25.729 links em banco quando o Neon voltar (01/09)
   — é a fatia que fecha a varredura de verdade.
