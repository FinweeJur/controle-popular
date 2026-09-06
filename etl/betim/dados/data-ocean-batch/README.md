# Data Ocean Batch — Consultas em Lote via Maritaca AI

Arquivos JSONL para consulta de dados públicos brasileiros via Batch API da
Maritaca AI usando a ferramenta Data Ocean do modelo `sabia-4-thinking`.

## O que é

O Data Ocean é uma ferramenta integrada ao Sabiá 4 Thinking que acessa
dezenas de bases oficiais brasileiras (IBGE, INEP, MTE, Banco Central, TSE).
O modelo consulta a base, usa o dado na resposta e cita a fonte.

A Batch API permite enviar milhares de requisições de uma vez e receber os
resultados quando o processamento terminar (SLA de 24h, geralmente minutos).

## Arquivos

| Arquivo | Fonte | Descrição |
|---|---|---|
| `inep-educacao.jsonl` | INEP/Censo Escolar | Escolas, IDEB, evasão, infraestrutura em MG |
| `rais-emprego.jsonl` | MTE/RAIS | Vínculos empregatícios, remuneração, formalização |
| `caged-admissoes.jsonl` | MTE/CAGED | Admissões, desligamentos, rotatividade |
| `pib-municipal.jsonl` | IBGE/PIB | PIB municipal, per capita, série histórica |

## Como enviar

### Pré-requisitos

- Chave de API da Maritaca (`AI_API_KEY_MARITACA` em `.env.local`)
- Python com `requests` instalado

### Enviar um batch

```bash
# 1. Ativar a variável de ambiente
export AI_API_KEY_MARITACA="sua-chave-aqui"

# 2. Enviar via curl (exemplo com INEP)
curl -X POST https://chat.maritaca.ai/api/api/batches \
  -H "Authorization: Bearer $AI_API_KEY_MARITACA" \
  -H "Content-Type: application/json" \
  -F "file=@inep-educacao.jsonl" \
  -F "completion_window=24h"
```

### Enviar via Python

```python
import os
import requests

api_key = os.environ["AI_API_KEY_MARITACA"]
base_url = "https://chat.maritaca.ai/api"

# Enviar batch
with open("inep-educacao.jsonl", "rb") as f:
    resp = requests.post(
        f"{base_url}/api/batches",
        headers={"Authorization": f"Bearer {api_key}"},
        files={"file": ("inep-educacao.jsonl", f, "application/json")},
        data={"completion_window": "24h"},
    )

batch = resp.json()
batch_id = batch["id"]
print(f"Batch enviado: {batch_id}")

# Consultar status
status = requests.get(
    f"{base_url}/api/batches/{batch_id}",
    headers={"Authorization": f"Bearer {api_key}"},
).json()

print(f"Status: {status['status']}")
#validating | in_progress | completed | failed | expired
```

### Baixar resultados

Quando o batch estiver `completed`, o campo `output_file_id` terá o ID do
arquivo de saída. Baixe com:

```python
output_id = status["output_file_id"]
resultados = requests.get(
    f"{base_url}/api/files/{output_id}/content",
    headers={"Authorization": f"Bearer {api_key}"},
)

with open("resultados.jsonl", "wb") as f:
    f.write(resultados.content)
```

## Formato de saída

Cada linha do arquivo de saída é uma resposta do modelo, associada ao
`custom_id` da requisição original:

```jsonl
{"id": "batch_req_1", "custom_id": "inep-escolas-mg-2024", "response": {"status_code": 200, "body": {"choices": [{"message": {"content": "..."}}]}}}
```

## Consultas incluídas

### INEP Educação (5 consultas)

1. **inep-escolas-mg-2024** — Total de escolas, matrículas e docentes por município de MG
2. **inep-ideb-mg-2024** — IDEB por município: anos iniciais, finais, nota SAEB
3. **inep-escolas-betim** — Detalhe das escolas de Betim (nome, endereço, tipo, matrículas)
4. **inep-evasao-mg** — Evasão, abandono e distorção idade-série por município
5. **inep-infraestrutura-mg** — Internet, computadores, acessibilidade nas escolas

### RAIS Emprego (4 consultas)

1. **rais-vinculos-mg-2023** — Vínculos, remuneração média e mediana por município
2. **rais-setores-betim** — Setores econômicos e maiores empregadores de Betim
3. **rais-formalizacao-mg** — Taxa de formalização e tendência nos últimos 3 anos
4. **rais-escolaridade-mg** — Distribuição por grau de instrução e remuneração

### CAGED Admissões (3 consultas)

1. **caged-admissoes-mg-2024** — Admissões, desligamentos e saldo por município
2. **caged-movimentacoes-betim** — Detalhe mensal de Betim: causas de desligamento
3. **caged-cnae-mg** — Movimentação por setor econômico (CNAE) em MG

### PIB Municipal (4 consultas)

1. **pib-mg-2021** — PIB total, per capita e valor adicionado por município
2. **pib-betim-serie** — Série histórica de 10 anos de Betim
3. **pib-capitais-mg** — Top 10 cidades de MG por população
4. **pib-comparativo-mg** — Região Metropolitana de BH comparativa

## Custo estimado

| Item | Preço |
|---|---|
| Data Ocean | R$ 0,10 por GB processado |
| Busca na web | R$ 0,0165 por busca |
| Execução de código | R$ 0,016 por minuto |
| Batch API (tokens) | 50% de desconto sobre o preço normal |

Total estimado: 16 requisições × ~R$ 0,05–0,20 cada ≈ **R$ 0,80–3,20**

## Notas importantes

- O Data Ocean está disponível apenas no modelo `sabia-4-thinking`
- Cada resposta pode combinar Data Ocean + busca web + execução de código
- O campo `usage.tool_execution_details` indica o custo real de cada requisição
- Os dados vêm das bases oficiais (IBGE, INEP, MTE) — sempre com fonte citada
- Resultados são JSON; o modelo pode retornar Markdown com tabelas — prefira
  pedir "formate como JSON" nas consultas
