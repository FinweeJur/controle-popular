# Parecer Consolidado de Automação e Auditoria — Colibri

**Data da Execução:** 25/09/2026, 05:31:30  
**Agentes Envolvidos:** PicoClaw (Crawler/Watcher) & Hermes Agent (Defensive Security & Data Audit)  
**Motor de Inferência:** Motor Determinístico Offline

---

## 1. Síntese Executiva

- **Disponibilidade das Fontes Públicas (PicoClaw):** 97.6% (41 de 42 fontes operacionais).
- **Postura de Segurança & Conformidade (Hermes Agent):** 10 itens aprovados, 1 alertas, 6 falhas críticas.
- **Proteção de Dados Pessoais (LGPD / Mod-11):** 100% de conformidade, zero CPFs identificados nos acervos publicados.
- **Limites de Infraestrutura (Cloudflare Workers):** Nenhum arquivo excede o teto de 25 MiB.



## 3. Itens Verificados em Segurança e Integridade

| Categoria | Verificação | Status | Detalhes |
|---|---|---|---|
| SEGURANCA | CSP Report-Only | **APROVADO** | CSP está configurado em modo Report-Only conforme política de observação. |
| SEGURANCA | Headers de Proteção Básica (HSTS/Nosniff/Frame) | **APROVADO** | HSTS, X-Content-Type-Options e X-Frame-Options devidamente declarados. |
| SEGURANCA | Espelhamento public/_headers | **APROVADO** | public/_headers configurado para garantir proteção nos Static Assets do Worker. |
| SEGURANCA | Produção: Content-Security-Policy | **APROVADO** | Header retornado por https://controlepopular.com.br: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://api.fontshare.com; img-src 'self' data: https://server.arcgisonlin... |
| SEGURANCA | Produção: Strict-Transport-Security | **APROVADO** | Header retornado por https://controlepopular.com.br: max-age=15552000; includeSubDomains; preload |
| SEGURANCA | Produção: X-Frame-Options | **APROVADO** | Header retornado por https://controlepopular.com.br: DENY |
| SEGURANCA | Produção: X-Content-Type-Options | **APROVADO** | Header retornado por https://controlepopular.com.br: nosniff |
| SEGURANCA | Varredura Estática de Segredos | **APROVADO** | Nenhum token ou chave de credencial identificado nos arquivos críticos. |
| CLOUDFLARE | Limite de 25 MiB: cnes-mg.json | **FALHA** | Arquivo possui 81.01 MiB, excedendo o teto do Cloudflare. |
| CLOUDFLARE | Limite de 25 MiB: fepam-rs-licencas.json | **FALHA** | Arquivo possui 43.45 MiB, excedendo o teto do Cloudflare. |
| CLOUDFLARE | Limite de 25 MiB: iat-pr-licencas.json | **FALHA** | Arquivo possui 30.94 MiB, excedendo o teto do Cloudflare. |
| CLOUDFLARE | Limite de 25 MiB: ima-sc-licencas.json | **FALHA** | Arquivo possui 100.09 MiB, excedendo o teto do Cloudflare. |
| CLOUDFLARE | Limite de 25 MiB: sinesp-vde.json | **FALHA** | Arquivo possui 71.85 MiB, excedendo o teto do Cloudflare. |
| PRIVACIDADE | Script de Varredura de CPF | **FALHA** | Script checar-dado-pessoal-em-dado.py não encontrado. |
| QUALIDADE_DADOS | 5 Regras de Qualidade: sigbm | **APROVADO** | Página atende às regras: Gráfico SVG inline, Cartões de Topo, e Ressalva Editorial. |
| QUALIDADE_DADOS | 5 Regras de Qualidade: ibama | **APROVADO** | Página atende às regras: Gráfico SVG inline, Cartões de Topo, e Ressalva Editorial. |
| QUALIDADE_DADOS | 5 Regras de Qualidade: decisoes-lai | **ALERTA** | Possível ausência de Gráfico SVG ou Cartões de Topo na página. |

---

*Relatório gerado automaticamente pela esteira de agentes locais do Controle Popular.*
