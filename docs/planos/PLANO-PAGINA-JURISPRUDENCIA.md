# Plano — página `/jurisprudencia`

**Estado:** primeira versão no ar (commit `e3afc7d7`). Página server-side,
sem cliente, lendo `apps/web/data/jurisprudencia-resumo.json`.

## O que a v1 entrega

- **Cobertura**: processos únicos, com inteiro teor, resumos aprovados,
  amostra AAS (5%, 95%).
- **Agregados**: polo vencedor, resultado do recurso, quem recorreu, temas e
  as 12 categorias PNAB/PEAB — cada tabela com N e %.
- **Valores**: N, mediana, Q1 e Q3, com a ressalva de que o campo é o maior
  R$ mencionado no texto (média não é publicada).
- **Leitura crítica**: revisão humana pendente, processos sem dano PNAB,
  recorte de 2ª instância (não é o NACAB nem o Guaicuy).
- **Fonte e datas**: coleta, publicação, metodologia e link para o relatório
  completo.
- **Descoberta**: cartão no `/indice` (Por tema) e item no
  `/riodoce/indice` (índice expansível do Rio Doce).

## Regras de qualidade aplicadas

| Regra | Como |
|---|---|
| Link/fonte | todo número vem do JSON gerado no repo de origem; link para o relatório |
| Filtravel/ordenável/buscável | v1: tabelas ordenadas por N; busca global do portal cobre a rota |
| RAG | o acervo do assistente já tem normas, súmulas e TJES; a página aponta o assistente |
| Temas | tabela de temas com multi-tema (1.079 processos) |
| Gráficos | v1 usa tabelas; gráfico de barras é a fase 2 |
| Data de coleta e publicação | no cabeçalho |
| Metadados | N por linha, % calculado sobre o total |
| Fonte mínima 12 px | corpo `text-sm` (14 px), legendas `text-xs` (12 px); nenhum `text-[9/10/11px]` |
| Celular | `max-w-4xl`, tabelas com `overflow-x-auto`, `<main>` da casca |

## Fase 2 (quando o dono pedir)

1. **Lista por caso** com paginação no servidor (regra 5.1): 20 por página,
   filtros por polo, tema, comarca e ano; link oficial por processo.
2. **Gráficos**: polo por ano, tema por polo, danos PNAB por comarca.
3. **Busca dedicada** com índice invertido (mesma escada do `/busca`).
4. **Selo de revisão** por linha (`aprovado` × `revisao_humana`).
5. **Série temporal** da coleta (quantos entraram por mês).

## Dependências

- `tjmg-jurimetria/relatorios/agregados-guaicuy-nacab.json` → gera
  `apps/web/data/jurisprudencia-resumo.json`.
- `tjmg-jurimetria/tabelas/brumadinho_resumos.csv` (2.969) e
  `brumadinho_decisoes.csv` (3.188).
- RAG: `rag-normas.json` (4.831), `rag-tjes.json` (1.960) e o repo privado
  `rag-controle-popular`.
