# AUDITORIA-FONTES — conferencia diaria dos links oficiais (TSE/TRE)

> **Tipo:** ESTADO
> **Domínio:** eleicoes-2026
> **Última medição:** 2026-10-19
> **Leitura estimada:** curta (1-5 min)
> **Relacionados:** [ESTADO.md](ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [PLANO-MONITORAMENTO-FONTES-19-10.yml](../planos/PLANO-MONITORAMENTO-FONTES-19-10.yml), [page.tsx](/apps/web/app/eleicoes/2026/locais-votacao-alterados/page.tsx)
> **Palavras-chave:** fontes, links, tse, tre, auditoria, monitoramento, 403, robots, ci

## Sumário

- [Propósito](#propósito)
- [Última conferência](#última-conferência)
- [Histórico de resumos](#histórico-de-resumos)

## Propósito

Registro objetivo da rotina `scripts/etl/eleicoes/verificar-fontes.py`.
Criterio: OK = 2xx/3xx; AVISO = 403/405/429/503 em host que bloqueia robot
(o portal so aponta o link); CRITICO = qualquer outro erro e bloqueia merge.

## Última conferência

19/10/2026 12:36 BRT — Total: 30 links. Criticos: 0. Avisos (403 robot esperado): 29.

| Link | Status | HTTP |
|---|---|---|
| tse-sig-eleicao | AVISO | 403 |
| tse-dados-abertos | OK | 200 |
| tse-eleicoes-2026 | AVISO | 403 |
| tre-* (27 UFs) | AVISO | 403 |

## Histórico de resumos

- 19/10/2026 12:36 BRT — 30 links, 0 criticos, 29 avisos. Primeira rodada apos correcao do dominio dos TREs (tre-<uf>.jus.br, o padrao tre-<uf>.tse.jus.br nao resolve DNS).
- 19/10/2026 12:42 BRT - 30 links; 0 criticos; 29 avisos.
- 20/10/2026 11:03 BRT - 30 links; 0 criticos; 29 avisos.
- 21/10/2026 11:18 BRT - 30 links; 0 criticos; 29 avisos.
- 22/10/2026 11:17 BRT - 30 links; 0 criticos; 29 avisos.
- 23/10/2026 11:01 BRT - 30 links; 0 criticos; 29 avisos.
- 24/10/2026 10:03 BRT - 30 links; 0 criticos; 29 avisos.
- 25/10/2026 10:31 BRT - 30 links; 0 criticos; 29 avisos.
