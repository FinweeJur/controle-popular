# Análise de vício legislativo / indício de inconstitucionalidade — Itinga (3134004)

Cada arquivo `.txt` desta pasta é o prompt de UM objeto — lei municipal já
sancionada ou projeto em tramitação na Câmara Municipal.

Para cada `<id>.txt`, produza `<id>.json` na MESMA pasta (mesmo id,
extensão `.json`). `_SYSTEM.txt` é a instrução de sistema, vale para todos.

## Regra mais importante

NUNCA declare que uma proposição/lei "é inconstitucional". Aponte indício +
categoria + dispositivo citado. Quem decide é o Judiciário.

## Devolver lista vazia é a resposta CERTA na maioria dos casos

A maioria dos projetos municipais (pedidos de sinalização, indicação,
homenagem, crédito suplementar) não tem vício nenhum. `indicios: []` é o
acerto — não force uma categoria.

## Depois de responder tudo

    python -m etl.importar_analises_vicio --id-municipio 3134004 --dir calibracao_vicio/itinga
