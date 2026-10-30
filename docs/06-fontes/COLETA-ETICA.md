# Coleta ética e pesquisa na internet

> **Tipo:** GUIA
> **Domínio:** global (fontes públicas, robôs, termos de uso)
> **Última medição:** 2026-10-18
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [FONTES.md](FONTES.md), [DADOS-GOV-BR.md](DADOS-GOV-BR.md)
> **Palavras-chave:** coleta, etica, user-agent, robots, termos-de-uso, rate-limit, dados-publicos, documentacao, privacidade

## Sumário

- [Coleta de fonte pública](#coleta-de-fonte-pública)
- [Pesquisa na internet: identidade honesta, termos e robots](#pesquisa-na-internet-identidade-honesta-termos-e-robots)
- [Checklist rápido antes de coletar](#checklist-rápido-antes-de-coletar)

## Coleta de fonte pública



- Pausa entre requisições: 1–2 s por host (tabela completa em
  [FONTES.md, regras gerais](FONTES.md)).
- **User-Agent honesto** (é a "identificação" que o navegador envia ao
  servidor): o nome do projeto, nunca UA de navegador falso.
- Retomada por checkpoint; coleta fora da CI.
- Leia o `robots.txt` (o "aviso de cortesia" que cada site publica) e
  registre a decisão no cabeçalho do coletor se seguir mesmo assim — há um
  caso no repo (`www18.fgv.br` responde `Disallow: /`), a pedido do dono,
  com escopo reduzido e o raciocínio escrito.
- Varrer dado pessoal antes de commitar. Sempre.

## Pesquisa na internet: identidade honesta, termos e robots

Vale para este repositório e para qualquer agente que pesquise em nome dele.

1. **User-Agent honesto, sempre:** `finweejur/github artur colito`.
   Nunca UA de navegador falso, nunca UA vazio, nunca identidade de terceiro.
2. **Antes de acessar, leia nesta ordem:**
   - os **termos de uso** do site;
   - o `robots.txt` (e o `sitemap.xml` quando existir);
   - a **documentação pública** (`/docs`, `/api`, Swagger, help center);
   - a política de dados abertos e a licença.
3. **Respeite o que leu.** `Disallow`, `Crawl-delay`, limite de requisições
   e área autenticada são regra, não sugestão. Termo que proíbe coleta
   automatizada encerra a tarefa; registre a decisão.
4. **Uso ético:** só dado público, só finalidade cívica, nenhuma burla de
   login, CAPTCHA, paywall ou rate limit. Nada de dado pessoal bruto.
5. **Ritmo:** 1–2 s entre requisições por host; retomada por checkpoint;
   coleta fora da CI.
6. **Registre a decisão no cabeçalho do coletor** quando houver exceção
   aprovada pelo dono. O caso `www18.fgv.br` (`Disallow: /`) é precedente
   com escopo reduzido e raciocínio escrito.
7. **Varra dado pessoal antes de commitar.** Sempre.

## Checklist rápido antes de coletar

- [ ] Li os termos de uso e o `robots.txt`.
- [ ] Li a documentação pública (`/docs`, `/api`).
- [ ] O UA é `finweejur/github artur colito`.
- [ ] A pausa é de 1–2 s por host.
- [ ] Há checkpoint para retomar.
- [ ] Nenhum segredo e nenhum CPF saem do disco.
- [ ] A decisão está escrita no cabeçalho do coletor.


## Origem / Histórico

Movido do AGENTS.md §11 em 18/10/2026. A seção de identidade honesta, termos, robots e documentação foi acrescentada em 18/10/2026 por regra do dono.
