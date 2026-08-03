"""etl.pbh.obras — obras públicas de Belo Horizonte (SUDECAP) para `obras`.

    python -m etl.pbh.obras --id-municipio 3106200

FONTE: CKAN da PBH, dataset `obras-publicas_2` da SUDECAP (a empresa de
obras do município) — https://ckan.pbh.gov.br/dataset/obras-publicas_2.
É uma camada geográfica do IDE-BHGEO/PRODABEL publicada como CSV mensal:
um recurso novo por mês, sempre o retrato COMPLETO do Plano de Obras.

VERIFICADO AO VIVO EM 2026-08-03. O que foi medido, e por que cada coisa
está do jeito que está:

1. QUAL DOS DOIS DATASETS DA SUDECAP. `obras-publicas` (14 recursos) se
   chama literalmente "DESCONTINUADO - Obras Públicas" e o CSV mais novo
   dele é de 2024-03. `obras-publicas_2` (28 recursos) segue mensal, com
   `20260701_obras_publicas` publicado em 2026-07-15. É este.
   O recurso NÃO é fixo no código: o módulo lê o `package_show` e escolhe o
   de maior prefixo `AAAAMMDD` no nome, senão congelaria em julho/2026.

2. VOLUME REAL, não volume anunciado (armadilha já conhecida no projeto):
   595 linhas no CSV de 2026-07, contadas depois de baixar. Histórico
   medido: 626 (2024-05) → 564 (2024-06) → 580 (2025-07) → 594 (2026-05)
   → 595 (2026-07). Encolhe às vezes — daí `refresh_completo_seguro`.

3. ENCODING E SEPARADOR, medidos com `csv_do_recurso` (modo estrito):
   - encoding: **utf-8-sig** (com BOM) em todos os recursos testados, do
     mais antigo de 2023 ao de 2026-07.
   - separador: **muda entre recursos**. `20230301` é vírgula; de
     `20240301` em diante é PONTO E VÍRGULA. Por isso o separador é
     farejado por arquivo em `_separador()` e nunca fixado — ler o CSV de
     2026 com vírgula devolve 595 linhas de 2 colunas, sem erro nenhum.

4. O GRP NÃO TEM OBRAS. Antes de aceitar o CKAN eu baixei
   `web/js/controllers.js` do portal do GRP e extraí a lista de
   procedimentos: PContrato, PLicitacao, PFolhaPagto, PParceria, PAdesao,
   PRegistroPreco, PCongenere, PInstrumentoIngresso, PProcessoSelecao,
   PFiscalContrato e os `PLov*` (combos). **Nenhum de obra.** O CKAN da
   SUDECAP é a única fonte de obra pública municipal em BH.

5. NÃO USEI os datasets de obra da SMPU (`obra-em-logradouro-licenciada`,
   `alvaras-de-obra-em-logradouro-publico-emitidos`). São LICENÇA de obra
   PARTICULAR em logradouro — obra de terceiro, não obra da prefeitura.
   Misturá-las aqui inflaria a contagem de "obras públicas" da cidade com
   reforma de imóvel privado, que é erro de conteúdo, não de código.

O QUE ESTA FONTE NÃO TEM, e o efeito disso no portal:

* **Não tem valor.** Nem no CSV nem no dicionário de dados oficial (que
  lista 11 atributos e nenhum monetário). `valor` fica NULL — inventar,
  estimar ou puxar de contrato por semelhança de nome seria fabricar
  dinheiro público num portal de transparência.
* **Não tem percentual de execução.** Ver `_percentual()`: só é preenchido
  quando a própria fonte diz "Concluído", e aí é 100 por definição.
* **Desde 2024-06 só publica obra CONCLUÍDA.** Medido recurso a recurso:
  `20240502` ainda trazia 4 status (548 Concluído, 65 Em Execução, 7 Em
  Licitação, 6 Aguardando OS); `20240603` em diante traz 100% "Concluído".
  Não é filtro deste código — é o que a SUDECAP passou a publicar. O
  módulo não força isso em lugar nenhum: se a SUDECAP voltar a publicar
  obra em andamento, ela entra sozinha, com percentual NULL.

GEOMETRIA -> lat/lng. O CSV traz `GEOMETRIA` em WKT (492 POLYGON + 103
MULTIPOLYGON) em UTM zona 23S, e a tabela `obras` quer lat/lng. Como não há
`pyproj` no ambiente, `_utm23s_para_wgs84()` implementa a inversa de
Snyder à mão. Isso foi VALIDADO, não só escrito:
  - round-trip contra a série DIRETA de Snyder (fórmula independente da
    inversa): erro 0,0000 m em 4 pontos de BH;
  - o centróide médio de cada uma das 9 regionais cai na parte certa da
    cidade (Barreiro a sudoeste −19,993/−44,016; Venda Nova ao norte
    −19,811/−43,979; Centro-Sul no centro −19,934/−43,934);
  - bbox dos 595 pontos: lat −20,0197..−19,7852, lng −44,0549..−43,8679,
    dentro dos limites de BH.
Ainda assim cada ponto passa por `_plausivel()` antes de ser gravado: se
cair longe do centróide do município, vai NULL em vez de pôr uma obra de BH
no meio do oceano caso a PBH troque o CRS um dia.

IDEMPOTÊNCIA. `obras` não tem UNIQUE além da pk (só `obras_pkey` e a FK de
município — conferido no `information_schema`/`pg_constraint`), então não há
como fazer upsert. Duas saídas eram possíveis: criar uma UNIQUE natural nova
ou refazer o conjunto do município. Escolhi **refazer**, via
`refresh_completo_seguro`, por três motivos:
  - a fonte é um retrato mensal completo, não um incremento: reescrever é a
    semântica certa, e obra que sai do Plano de Obras some sozinha;
  - é o mesmo contrato de `etl/prefeitura/obras.py` (Betim), então a tabela
    tem UMA regra de escrita só, não duas;
  - uma UNIQUE natural exigiria uma coluna de código de origem que Betim
    não preenche, e uma unique com NULL não protege nada no Postgres.
O `refresh_completo_seguro` acrescenta o que o delete+insert cru de Betim
não tem: ele se RECUSA a apagar se a fonte trouxer menos linhas do que já
existem no banco (foi assim que `verbas_indenizatorias` perdeu 55 linhas em
2026-07-29). Como esta fonte já encolheu de 626 para 564, essa trava é para
valer — quando disparar, confira na fonte e rode com `--permitir-reducao`.

O delete é sempre filtrado por `id_municipio`, então as 59 obras de Betim
não são tocadas.
"""

import argparse
import csv
import io
import math
import re
import sys

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)
from etl.pbh.cliente import ckan_action, csv_do_recurso

# Dataset ativo da SUDECAP. Não é um default de cidade (não vai para o
# argparse): é o identificador do dataset no CKAN da PBH, e o módulo só roda
# depois de conferir em `municipios.fontes` que a cidade é servida por esse
# CKAN — ver a checagem no início de `sync()`.
DATASET = "obras-publicas_2"
PAGINA_DATASET = f"https://ckan.pbh.gov.br/dataset/{DATASET}"
HOST_ESPERADO = "ckan.pbh.gov.br"

# Piso de sanidade do volume. Todos os recursos medidos desde 2023 têm entre
# 564 e 626 linhas; um arquivo com um punhado de linhas significa publicação
# quebrada, e aí é melhor abortar do que reescrever a tabela com sobra.
MINIMO_LINHAS = 100


def _recurso_mais_recente(pacote: dict) -> dict:
    """O CSV de data mais alta do dataset.

    Os recursos se chamam `AAAAMMDD_obras_publicas[.csv]`, e é o NOME que
    carrega a competência — `last_modified` não serve para ordenar porque o
    CKAN reescreve esse carimbo quando o recurso é reprocessado (o
    `20251201` aparece com `last_modified` de 2026-01-06, depois do
    `20251103`). Ordenar por data de modificação escolheria o arquivo
    errado em alguns meses e o certo em outros — falha intermitente, a pior
    de diagnosticar.
    """
    candidatos = []
    for r in pacote.get("resources", []):
        if (r.get("format") or "").upper() != "CSV":
            continue  # o dataset também traz o dicionário de dados em PDF
        m = re.match(r"(\d{8})", r.get("name") or "")
        if m:
            candidatos.append((m.group(1), r))
    if not candidatos:
        raise RuntimeError(
            f"dataset {DATASET} não tem nenhum recurso CSV nomeado AAAAMMDD_* "
            "— a convenção de nomes da SUDECAP mudou; confira em "
            f"{PAGINA_DATASET} antes de mexer aqui."
        )
    candidatos.sort(key=lambda t: t[0])
    return candidatos[-1][1]


def _separador(cabecalho: str) -> str:
    """`;` ou `,`, decidido pelo cabeçalho do próprio arquivo.

    Não é preciosismo: o recurso de 2023-03 usa vírgula e os de 2024 em
    diante usam ponto e vírgula, no MESMO dataset. Fixar o separador não
    levanta exceção — o `DictReader` devolve o número certo de linhas com
    duas colunas gigantes, e o ETL grava 595 obras com o nome errado.
    """
    return ";" if cabecalho.count(";") > cabecalho.count(",") else ","


# --- geometria -------------------------------------------------------------

_A = 6378137.0                      # semieixo maior do GRS80/SIRGAS 2000
_F = 1 / 298.257222101              # achatamento
_K0 = 0.9996                        # fator de escala do UTM
_E2 = _F * (2 - _F)
_ZONA = 23                          # BH inteira cabe na zona 23S
_PAR_WKT = re.compile(r"(-?\d+\.?\d*)\s+(-?\d+\.?\d*)")


def _utm23s_para_wgs84(este: float, norte: float) -> tuple[float, float]:
    """Inversa da projeção Transversa de Mercator (Snyder), zona 23 sul.

    Feita à mão porque `pyproj` não está no ambiente do ETL e puxar uma
    dependência com binário nativo (PROJ) só para converter 595 pontos uma
    vez por mês não se paga. A validação está no docstring do módulo: a
    ida-e-volta contra a série direta fecha em 0,0000 m.
    """
    e1 = (1 - math.sqrt(1 - _E2)) / (1 + math.sqrt(1 - _E2))
    x = este - 500_000.0
    y = norte - 10_000_000.0  # falso norte do hemisfério SUL
    mu = (y / _K0) / (_A * (1 - _E2 / 4 - 3 * _E2**2 / 64 - 5 * _E2**3 / 256))
    lat1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
        + (1097 * e1**4 / 512) * math.sin(8 * mu)
    )
    ep2 = _E2 / (1 - _E2)
    c1 = ep2 * math.cos(lat1) ** 2
    t1 = math.tan(lat1) ** 2
    n1 = _A / math.sqrt(1 - _E2 * math.sin(lat1) ** 2)
    r1 = _A * (1 - _E2) / (1 - _E2 * math.sin(lat1) ** 2) ** 1.5
    d = x / (n1 * _K0)
    lat = lat1 - (n1 * math.tan(lat1) / r1) * (
        d**2 / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1**2 - 9 * ep2) * d**4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1**2 - 252 * ep2 - 3 * c1**2) * d**6 / 720
    )
    lng = (
        d
        - (1 + 2 * t1 + c1) * d**3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1**2 + 8 * ep2 + 24 * t1**2) * d**5 / 120
    ) / math.cos(lat1)
    return math.degrees(lat), (_ZONA * 6 - 183) + math.degrees(lng)


def _ponto_do_wkt(wkt: str | None) -> tuple[float, float] | None:
    """Um ponto representativo do polígono da obra, em lat/lng.

    É a média dos vértices, não o centróide de área — 103 das 595 feições
    são MULTIPOLYGON, e centróide de área de multipolígono exige uma
    biblioteca de geometria. Para um alfinete no mapa a diferença é de
    dezenas de metros, e o que a página precisa responder é "em que ponto
    da cidade fica", não a área exata.

    O regex casa dois números separados por ESPAÇO, o que faz o pareamento
    sair certo de graça: dentro de um vértice o separador é espaço, entre
    vértices é vírgula, então nenhum par atravessa a fronteira do vértice.
    """
    if not wkt or not wkt.strip():
        return None
    pares = _PAR_WKT.findall(wkt)
    if not pares:
        return None
    este = sum(float(p[0]) for p in pares) / len(pares)
    norte = sum(float(p[1]) for p in pares) / len(pares)
    return _utm23s_para_wgs84(este, norte)


# ~0,5° é uns 55 km: folgado para qualquer município (BH tem 30 km de
# ponta a ponta) e apertado o bastante para pegar troca de CRS, que joga o
# ponto para outro estado ou para o Atlântico.
TOLERANCIA_GRAUS = 0.5


def _plausivel(ponto: tuple[float, float] | None, cidade: dict) -> bool:
    """O ponto cai perto do centróide do município declarado em `municipios`?

    Rede de segurança contra a fonte trocar o sistema de coordenadas sem
    avisar. Um CRS diferente não gera exceção: gera número, e número errado
    vira alfinete no lugar errado do mapa sem ninguém perceber. Comparar
    com a lat/lng que o próprio banco tem da cidade transforma isso numa
    falha visível (o ponto vai NULL) em vez de silenciosa.
    """
    if ponto is None:
        return False
    clat, clng = cidade.get("lat"), cidade.get("lng")
    if clat is None or clng is None:
        return True  # sem referência no banco, não dá para julgar
    return (
        abs(ponto[0] - float(clat)) <= TOLERANCIA_GRAUS
        and abs(ponto[1] - float(clng)) <= TOLERANCIA_GRAUS
    )


# --- mapeamento ------------------------------------------------------------

def _percentual(status: str | None) -> float | None:
    """100 para obra concluída, NULL para todo o resto.

    Não é dado da fonte e não é estimativa: é a leitura direta do que a
    própria SUDECAP declara. "Concluído" e "0% executado" não podem ser
    verdade ao mesmo tempo, e deixar NULL faria a página esconder a barra
    de progresso de 595 obras que a prefeitura afirma ter terminado.

    O que este código NÃO faz é inferir andamento de obra não concluída —
    "Em Execução" continua NULL, porque aí qualquer número seria chute.
    """
    if not status:
        return None
    return 100.0 if status.strip().lower().startswith("conclu") else None


def _bairro(regional: str | None) -> str | None:
    """A regional, rotulada como regional.

    `obras.bairro` é a coluna mais fina que a tabela tem para localização
    textual, e o melhor que esta fonte dá é a REGIONAL (9 regionais
    administrativas de BH + "Diversos"). Gravar "Nordeste" cru faria a
    página exibir uma regional como se fosse bairro; o prefixo mantém a
    informação e evita a leitura errada.

    "Diversos" (25 obras) quer dizer obra que não fica numa regional só —
    vira NULL, porque "Regional Diversos" não existe.
    """
    if not regional or not regional.strip():
        return None
    limpo = regional.strip()
    if limpo.lower() == "diversos":
        return None
    return f"Regional {limpo}"


def _mapear(linha: dict, id_municipio: str, cidade: dict) -> dict:
    nome = (linha.get("NOME_PO") or "").strip()
    status = (linha.get("STATUS") or "").strip() or None
    ponto = _ponto_do_wkt(linha.get("GEOMETRIA"))
    if not _plausivel(ponto, cidade):
        ponto = None
    return {
        "id_municipio": id_municipio,
        "nome": nome or "(sem descrição)",
        "situacao": status,
        # A fonte não publica valor — ver o docstring do módulo. NULL é a
        # resposta honesta; qualquer número aqui seria inventado.
        "valor": None,
        "percentual_execucao": _percentual(status),
        "bairro": _bairro(linha.get("REGIONAL")),
        "lat": round(ponto[0], 7) if ponto else None,
        "lng": round(ponto[1], 7) if ponto else None,
        "link_fonte": PAGINA_DATASET,
    }


def sync(id_municipio: str, permitir_reducao: bool = False) -> int:
    cidade = carregar_municipio(id_municipio)
    host = str(cidade["fontes"].get("prefeitura_dados_abertos_host") or "")
    if HOST_ESPERADO not in host:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) não é servido por "
            f"{HOST_ESPERADO} (fontes.prefeitura_dados_abertos_host={host!r}). "
            f"Este módulo lê o dataset `{DATASET}` da SUDECAP, que só existe no "
            "CKAN da Prefeitura de Belo Horizonte."
        )

    pacote = ckan_action("package_show", id=DATASET)
    recurso = _recurso_mais_recente(pacote)
    print(f"[etl.pbh.obras] recurso escolhido: {recurso['name']} ({recurso['url']})")

    texto, encoding = csv_do_recurso(recurso["url"])
    cabecalho = texto.splitlines()[0] if texto else ""
    sep = _separador(cabecalho)
    print(f"[etl.pbh.obras] encoding={encoding} separador={sep!r}")

    brutas = list(csv.DictReader(io.StringIO(texto), delimiter=sep))
    if len(brutas) < MINIMO_LINHAS:
        raise RuntimeError(
            f"{recurso['name']} devolveu só {len(brutas)} linha(s) (piso {MINIMO_LINHAS}). "
            "Todos os recursos medidos desde 2023 têm 564+; isto é publicação "
            f"quebrada, não queda real. Confira em {PAGINA_DATASET}."
        )
    if "NOME_PO" not in (brutas[0] if brutas else {}):
        raise RuntimeError(
            f"{recurso['name']} não tem a coluna NOME_PO (colunas: "
            f"{list(brutas[0].keys())[:12]}). O layout do CSV mudou — remapeie "
            "antes de gravar, senão a tabela vira 595 '(sem descrição)'."
        )

    linhas = [_mapear(b, id_municipio, cidade) for b in brutas]

    sem_ponto = sum(1 for l in linhas if l["lat"] is None)
    if sem_ponto:
        # Não é erro: pode haver feição sem geometria. Vira erro se for a
        # maioria, porque aí o que quebrou foi a conversão, não a fonte.
        print(f"[etl.pbh.obras] AVISO: {sem_ponto}/{len(linhas)} obras sem lat/lng utilizável")
    if sem_ponto > len(linhas) / 2:
        raise RuntimeError(
            f"{sem_ponto} de {len(linhas)} obras ficaram sem coordenada plausível — "
            "provável troca de CRS na fonte (o esperado é UTM 23S). Nada foi gravado."
        )

    escreveu = refresh_completo_seguro(
        client=get_supabase_client(),
        table="obras",
        filtros={"id_municipio": id_municipio},
        rows=linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.pbh.obras",
    )
    if not escreveu:
        return 0

    print(f"[etl.pbh.obras] id_municipio={id_municipio} obras={len(linhas)}")
    return len(linhas)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="autoriza reescrever mesmo se a fonte trouxer menos obras que o banco",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"[etl.pbh.obras] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
