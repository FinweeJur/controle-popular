# As oito qualidades da informação

> **Tipo:** GUIA
> **Domínio:** global (padrão de dados de toda página de acervo)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [PLANO-DATA-DO-DADO.md](/docs/historico/planos/PLANO-DATA-DO-DADO.md)
> **Palavras-chave:** qualidades, dados, fonte-oficial, busca, filtro, ordenacao, resumo, chatbot, csv, impressao, responsivo, data-de-coleta

## Sumário

- [As oito qualidades](#as-oito-qualidades)

## As oito qualidades

**Regra do dono, 21/08/2026 (consolidada e expandida em 25/09/2026;
sétima qualidade acrescentada em 10/10/2026; oitava em 15/10/2026 —
rastreabilidade temporal, PLANO-DATA-DO-DADO).**
Vale para toda página que publica acervo ou lista de dados — licenciamento,
TACs, convênios, decisões, barragens, estudos, contratos, compras e territórios:

1. **Linkável e Verificado à Fonte Oficial Direta:** Todo registro publicado
   (contrato, convênio, lei, processo, ato oficial, órgão, edital, parlamentar,
   fornecedor) deve ter hiperlink direto e específico para a fonte pública
   (aberto e verificado pelo agente na hora da coleta). É expressamente proibido
   link solto para home page genérica quando o ato tem URL canônica própria ou protocolo.
2. **Buscável e Filtrável:** Busca textual em tempo real tolerante a acentos e
   filtros por facetas reais (status, UF, ano, categoria, tags). Filtro que
   devolve vazio sempre é pior que filtro nenhum.
3. **Classificável e Ordenável por Coluna:** Ordenação crescente/decrescente em
   todas as colunas relevantes, contemplando tipos nominais (classes/categorias),
   valores monetários e datas, nunca restrito apenas à data.
4. **Resumo / Microresumo e Cartões de Topo:** Resumo claro em português direto
   e cartões de topo com agregados que respondem de imediato ao leitor "quanto é isso no total?"
   com números medidos e datados (nunca digitados à mão).
5. **Chatbot com Contexto Cívico (Seu Nonô / Alceu Dispor):** Toda base ou
   entidade alimenta o assistente cívico (RAG) com tags contextuais, metadados
   e respostas acolhedoras em orações diretas com frases curtas de até 13 palavras,
   apontando sempre links oficiais.
6. **Exportável Multi-formato (CSV com BOM e Impressão Nativa):** Download de
   planilha CSV estritamente do que está filtrado na tela, com separador `;` e
   BOM UTF-8 (`\uFEFF`) para compatibilidade perfeita com o Excel brasileiro, além
   de gráfico SVG nativo acessível (sem bibliotecas externas pesadas) e layout de
   impressão vetorial via CSS `@media print`.
7. **Responsiva — celular, tablet e desktop:** a mesma página se abre legível
   em 390 px (celular), 768 px (tablet) e desktop, sem rolagem lateral falsa,
   sem coluna cortada e sem rótulo escondido. Conteúdo largo (tabela, gráfico,
   mapa) **rola dentro do quadro**, nunca estoura a tela. Conferência em 390 px:
   `document.documentElement.scrollWidth === window.innerWidth`. Detalhe de
    implementação e o defeito medido em 10/10/2026 na §5.14.
 8. **Rastreável no tempo (15/10/2026 — PLANO-DATA-DO-DADO):** página de dado
    e post com número mostram a data da coleta da fonte, visível e derivada do
    dado (`<DataColeta>`, `<time>`, carimbo `geradoEm` do arquivo, nascido na
    escrita bem-sucedida do coletor), com a competência por programa quando os
    cortes diferem. Data digitada na mão é tão dano quanto número digitado na
    mão — ela apodrece sozinha e o leitor não tem como saber. Fiscalização:
    `scripts/checar-data-coleta.py` (porteiro D1, catraca) e
    `scripts/vigia-coletores.mts` (frescor das 34 fontes do registry, vermelho
    só para regressão de coletor). A checagem no browser (D2, Playwright) é a
    fase seguinte do plano.

Essa regra não dispensa:

- a página de servidor importa o **agregado** (`COBERTURA_*`), nunca o array
  inteiro — já houve `.ts` de 14,6 MB no repo por ignorar isso
  (`TS2590: union type too complex` foi o aviso do TypeScript);
- gráfico com alternativa em texto ou tabela; cor nunca é o único canal;
- número na tela vem de constante medida com data — não digite total à mão;
- **página que lê do banco só mostra as oito qualidades quando o banco responde.**
  Conferir `/ambiental/licenciamento` e `/ambiental/copam` exige HTML
  pré-renderizado com banco de pé. "Página vazia" ≠ "código faltando".
- **a régua do celular precede as demais (§5.14):** nenhuma das oito qualidades
  vale se a coluna não é legível e a página não cabe numa tela de 390 px.

## Origem / Histórico

Movido do AGENTS.md §8 em 18/10/2026, sem perda de texto.
