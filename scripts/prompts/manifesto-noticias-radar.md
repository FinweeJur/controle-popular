# Manifesto de Dados para Página Modelo (ACERVO): /noticias-radar

**Título:** Radar Diario de Noticias
**Tipo de Modelo:** acervo
**Total de Registros:** 25
**Caminho dos Dados:** `@/data/noticias-radar/dados.compact.json`

## Esqueleto de Campos (6 colunas)
- `titulo`
- `link`
- `veiculo`
- `fonte_id`
- `data`
- `ato_de_autoridade`

## Dicionários / Colunas de Atributos
- **`veiculo`** (7 valores distintos): ex: "ADAI — Associação de Defesa Ambiental e Desenvolvimento Social", "Guaicuy — Assessoria dos Atingidos pela Vale", "Diário do Comércio", "JOTA Info", "blogdopedlowski.com"
- **`fonte_id`** (3 valores distintos): ex: "adai", "guaicuy", "google-noticias"

---


### Instruções para o Agente (Modelo A: Acervo Transparente)
Gere a rota em `apps/web/app/noticias-radar/page.tsx`:
1. Importe dados de `@/data/noticias-radar/dados.compact.json` e descompacte com `descompactar`.
2. Implemente os 5 elementos de UI obrigatórios:
   - Cartões Agregados (Topo)
   - Gráfico SVG Inline
   - Exportação CSV (UTF-8 com BOM e `;`)
   - Componente `TabelaEstatica` para navegação
   - Filtros por coluna baseados nos dicionários

