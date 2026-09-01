# Fonte: Portal Pro-Brumadinho (Governo de MG)

> **Tipo:** fonte
> **Domínio:** Paraopeba
> **Última medição:** 2026-08-31
> **Leitura estimada:** 5 min
> **Relacionados:** [FONTES.md](FONTES.md)
> **Palavras-chave:** probrumadinho, acordo judicial, biblioteca, governo MG

## Sumário

Documentos oficiais do Acordo Judicial de Reparacao de Brumadinho publicados em
mg.gov.br/pro-brumadinho. 129 itens coletados em 31/08/2026, 115 com resumo
gerado por IA. Aparece como segunda secao da rota `/paraopeba/biblioteca`.

## Detalhes

| Campo | Valor |
|---|---|
| Site | https://www.mg.gov.br/pro-brumadinho |
| Rota no portal | `/paraopeba/biblioteca` (segunda secao) |
| Itens coletados | 129 de 134 encontrados (5 links 404) |
| Itens com resumo | 115 (89%) |
| Periodo | 2019 a 2026 |
| Coleta | 31/08/2026 |
| Licenca | Atos normativos de orgao publico (Lei 9.610/98, art. 8, IV). Artigos academicos podem ter direito reservado dos autores. |

## O que e e de onde vem

O portal Pro-Brumadinho e mantido pelo Governo de Minas Gerais para publicar
documentos oficiais do Acordo Judicial de Reparacao de Brumadinho:

- **Deliberacoes** do Conselho Superior do Comite Gestor (59 itens)
- **Legislacao** (leis, decretos, resolucoes — 16 itens)
- **Relatorios de prestacao de contas** semestrais (10 itens)
- **Artigos academicos** sobre a experiencia de reparacao (23 itens)
- **Relatorios ambientais** de qualidade da agua (5 itens)
- **Financeiro** (orcamento, cronogramas — 5 itens)
- **Outros** (termos, manuais, catalogos, comunicados — 11 itens)

## Como a coleta funciona

1. **Mapeamento**: script `scripts/probrumadinho-extrair-texto.py` navega
   `mg.gov.br/pro-brumadinho`, cataloga URLs de PDFs, baixa e extrai texto com
   `pdfplumber`.

2. **Mascaramento de CPF**: CPFs encontrados no texto extraido sao mascarados
   (mod-11 + regex) antes de qualquer processamento posterior. Validacao via
   `scripts/checar-dado-pessoal-em-dado.py`.

3. **Resumos por IA**: texto extraido enviado em lotes para modelo de
   linguagem, que gera resumo factual de ate 4 linhas + tags do vocabulario
   controlado. Resumos rotulados como `resumo_origem: "modelo"` e exibidos na
   tela com etiqueta "resumo gerado por IA".

4. **Montagem**: script `scripts/montar-biblioteca-probrumadinho.py` cruza
   CSV de metadados + resumos por lote e gera
   `apps/web/public/data/biblioteca-pro-brumadinho.json`.

## Vocabulario de tags

15 tags no vocabulario fechado, validadas pelo teste
`apps/web/lib/paraopeba/biblioteca-probrumadinho.test.ts`:

`legislacao`, `acordo-judicial`, `governanca-comites`, `prestacao-de-contas`,
`valores-e-financas`, `seguranca-hidrica`, `reparacao-socioambiental`,
`reparacao-socioeconomica`, `mobilidade`, `fortalecimento-servico-publico`,
`participacao-popular`, `saude`, `qualidade-da-agua`, `pesquisa-academica`,
`historico-rompimento`.

## O que ficou de fora

- 5 documentos com link 404 no portal em 31/08/2026 (Relatorio 2o sem/2022,
  Cartilha dos 4 anos, Cartilha 1o ano, 2 artigos CLAD 2024).
- Planilhas XLSX (tabelas de deliberacoes) foram incluidas com metadado, sem
  resumo do conteudo das celulas.
- ~10 PDFs cujas primeiras paginas sao do Diario Oficial (o ato esta em pagina
  posterior); o resumo nesses casos se baseia no titulo e no trecho parcial
  identificado.
- ~10 PNGs em branco na renderizacao de PDFs escaneados — resumo do titulo.
- 14 itens sem resumo (XLSX, PDFs escaneados sem texto extraivel).

## Diferenca para o acervo das ATIs

O acervo das ATIs (AEDAS, Guaicuy, NACAB, ADAI) e o que as assessorias
tecnicas independentes publicaram para as pessoas atingidas. Este acervo e
o que o Governo de MG e os orgaos compromitentes do Acordo publicaram como
atos oficiais de governanca, prestacao de contas e reparacao. Autoria,
finalidade e risco sao diferentes — por isso vivem em modulos separados e na
tela aparecem em secoes distintas.

## Arquivos envolvidos

| Arquivo | Funcao |
|---|---|
| `apps/web/public/data/biblioteca-pro-brumadinho.json` | Dado versionado |
| `apps/web/lib/paraopeba/biblioteca-probrumadinho.ts` | Modulo de leitura |
| `apps/web/lib/paraopeba/biblioteca-probrumadinho.test.ts` | Testes |
| `apps/web/lib/paraopeba/biblioteca.ts` | Interface compartilhada |
| `apps/web/app/paraopeba/biblioteca/page.tsx` | Pagina servidora |
| `apps/web/app/paraopeba/biblioteca/BibliotecaClient.tsx` | Componente cliente |
| `scripts/probrumadinho-extrair-texto.py` | Coletor + extracao de texto |
| `scripts/montar-biblioteca-probrumadinho.py` | Montagem do JSON final |
| `scripts/checar-dado-pessoal-em-dado.py` | Varredura de CPF |
