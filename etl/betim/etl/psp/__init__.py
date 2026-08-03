"""Fontes próprias de São Paulo (id_municipio 3550308).

Verificado ao vivo em 2026-08-03. São Paulo também publica em dois lugares,
mas o recorte é diferente do de Belo Horizonte (ver `etl/pbh/__init__.py`):

1. **CKAN municipal** (`dados.prefeitura.sp.gov.br`, CKAN 2.7.7, 474
   datasets, 81 organizações, sem token). A joia é a SEGES/SIGPEC, que
   publica MENSALMENTE dois arquivos gigantes e casáveis entre si:
   `servidores-ativos-da-prefeitura` (129.430 linhas em mai/2026) e
   `remuneracao-servidores-prefeitura-de-sao-paulo` (128.476 linhas). É o
   que `servidores.py` consome.

2. **API REST da SSP-SP** (`www.ssp.sp.gov.br/v1/...`). A Secretaria da
   Segurança Pública do estado NÃO tem portal de dados abertos nem CSV
   documentado; o que existe é o back-end do SPA Angular de
   `/estatistica/dados-mensais`, público e sem chave. É o que `crimes.py`
   consome, e é o que fecha a lacuna que São Paulo tinha: o eixo Cidades já
   lia criminalidade em MG (Sejusp, `etl/apis/crimes_mg.py`) e não tinha
   equivalente paulista.

**AQUI NÃO PRECISA DE `curl_cffi`** — ao contrário da PBH, cujos dois hosts
ficam atrás de um WAF que bloqueia por fingerprint de TLS. Os dois hosts de
SP respondem a `requests` puro, com qualquer User-Agent (inclusive o
`python-requests/2.x` padrão). Há UMA pegadinha de esquema, documentada em
`servidores.py`: em `http://` o CKAN devolve um desafio de bot com HTTP 200.
"""
