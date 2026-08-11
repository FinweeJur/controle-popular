# Análise garantista — Belo Horizonte (3106200)

Cada arquivo `.txt` desta pasta é o prompt de UM objeto — uma lei municipal
já sancionada ou um projeto em tramitação.

Para cada `<id>.txt`, produza `<id>.json` na MESMA pasta, com a resposta no
formato JSON pedido no fim do prompt. O nome do arquivo de saída tem de
bater exatamente com o de entrada (mesmo id, extensão `.json`).

O texto de `_SYSTEM.txt` é a instrução de sistema. Vale para todos.

## Depois de responder tudo

    python -m etl.importar_analises --id-municipio 3106200 --dir analises_lote1/bh

O importador valida cada resposta contra a rubrica: item sem dispositivo
legal citável é DESCARTADO antes de contar, e o score/rótulo é recalculado
de forma determinística por `rubrica.calcular()`. Ou seja: não dá para o
modelo "decidir" o rótulo, nem inventar artigo e ser levado a sério.

## Devolver lista vazia é uma resposta CERTA

Se o objeto for crédito suplementar, denominação de logradouro, homenagem
ou data comemorativa, `direitos_afetados: []` é o acerto — não force uma
classificação. A fila já despriorizou a maior parte desses casos, mas
alguns passam.
