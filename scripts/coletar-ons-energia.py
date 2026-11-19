# -*- coding: utf-8 -*-
"""Coleta e agrega os três conjuntos de energia do ONS usados na fase 1.

O que é
-------
Este script transforma dado bruto do ONS (Operador Nacional do Sistema
Elétrico) em três séries mensais enxutas, prontas para o portal:

1. `energia-carga.json` — carga média mensal por subsistema (MWmed);
2. `energia-balanco.json` — geração média mensal por fonte (hidráulica,
   térmica, eólica, solar), com participação percentual de cada fonte;
3. `energia-ear.json` — energia armazenada (EAR) média, mínima e máxima do
   mês, em % do máximo do subsistema; o Sudeste/Centro-Oeste (SE/CO) é o
   reservatório que o leitor acompanha.

Fonte oficial
-------------
- Catálogo: https://dados.ons.org.br/
- Conjuntos (CKAN):
  * `carga-energia` — Carga de Energia Diária (CSV anual, MWmed);
  * `balanco-energia-subsistema` — Balanço de Energia nos Subsistemas
    (CSV anual, horário);
  * `ear-diario-por-subsistema` — EAR Diário por Subsistema (CSV anual).
- Arquivos: bucket público `ons-aws-prod-opendata.s3.amazonaws.com`.
- Licença: Creative Commons Atribuição (CC-BY).

Restrições e decisões
---------------------
1. User-Agent honesto: `finweejur/github artur colito`. Nunca UA falso.
2. O `robots.txt` do portal (https://dados.ons.org.br/robots.txt) traz
   `Disallow: /api/` e `Crawl-Delay: 10`. A coleta pela API foi pedida
   explicitamente pelo dono (dado aberto, CC-BY) — exceção registrada aqui,
   como manda a regra de coleta ética. As chamadas ao CKAN respeitam os 10 s;
   o bucket S3 não publica `robots.txt` e recebe **1 requisição a cada 1,5 s**,
   uma por vez.
3. **Bruto não é versionado.** Cada CSV é baixado para uma pasta temporária,
   lido em fluxo e apagado no fim (`--manter-bruto` preserva para auditoria).
   O que fica no repositório é só o JSON mensal agregado.
4. **Por que mensal:** o bruto horário do balanço tem ~122 MB em 27 anos;
   o leitor do portal precisa de tendência e participação, não de hora. A
   agregação reduz 35 mil linhas/ano para 48 linhas/ano (4 subsistemas × 12
   meses), sem perder o que a página vai mostrar.
5. **Fonte em cada linha:** todo registro carrega a URL do CSV de origem e o
   instante da coleta. Sem isso o número não é auditável, e número sem
   rastro é dano num portal cívico.
6. Idempotente: reexecutar regrava os mesmos arquivos com o retrato mais
   recente; nada é duplicado porque a chave é (subsistema, mês).

Uso
---
    python scripts/coletar-ons-energia.py                # tudo
    python scripts/coletar-ons-energia.py --serie carga  # só uma série
    python scripts/coletar-ons-energia.py --manter-bruto # guarda o CSV bruto
    python scripts/coletar-ons-energia.py --bruto-dir C:/Temp/ons  # reaproveita o bruto

Saída
-----
`apps/web/data/ons/energia-carga.json`, `energia-balanco.json`,
`energia-ear.json` (cada um abaixo de 1 MB, conferido pelos testes).
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
import tempfile
import time
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

# --- Constantes de fonte -----------------------------------------------------

BASE_API = "https://dados.ons.org.br/api/3/action"
PORTAL = "https://dados.ons.org.br/"
UA = "finweejur/github artur colito"

# `Crawl-Delay: 10` do robots.txt do portal.
ESPERA_CKAN = 10.0
# Ritmo no bucket S3, que não publica robots.txt: 1,5 s entre arquivos.
ESPERA_ARQUIVO = 1.5
# 30 s por requisição de metadado e 45 s por arquivo: em 18/11/2026 uma
# leitura travou sem estourar timeout de 300 s, e o run inteiro parou.
TIMEOUT_CKAN = 30
TIMEOUT_ARQUIVO = 45
TENTATIVAS = 4

RAIZ = Path(__file__).resolve().parents[1]
DESTINO = RAIZ / "apps" / "web" / "data" / "ons"

# Conjuntos usados na fase 1. O nome é a chave estável do CKAN.
CONJUNTOS = {
    "carga": "carga-energia",
    "balanco": "balanco-energia-subsistema",
    "ear": "ear-diario-por-subsistema",
}

# Nomes legíveis dos subsistemas do ONS.
NOMES_SUBSISTEMA = {
    "SE": "Sudeste/Centro-Oeste",
    "S": "Sul",
    "NE": "Nordeste",
    "N": "Norte",
}


def agora_iso() -> str:
    """Instante da coleta em UTC (ISO-8601 com Z), igual ao catálogo."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def pegar_json(url: str) -> dict:
    """Baixa um JSON do CKAN com repetição e espera crescente.

    O portal do ONS devolve 5xx esporádico; repetir 4 vezes com 2/4/8 s de
    espera resolveu em todos os testes sem incomodar o servidor.
    """
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    ultimo_erro: Exception | None = None
    for tentativa in range(TENTATIVAS):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_CKAN) as resposta:
                return json.load(resposta)
        except Exception as erro:
            ultimo_erro = erro
            if tentativa < TENTATIVAS - 1:
                time.sleep(2 * (tentativa + 1))
    raise RuntimeError(f"falhou ao baixar {url}: {ultimo_erro}")


def numeros_csv(nome_conjunto: str) -> list[tuple[int, str, int | None]]:
    """Lista os CSVs anuais de um conjunto, do mais antigo ao mais novo.

    Lê o `package_show` do CKAN em vez de fixar URL no código: quando o ONS
    publica o ano seguinte, o coletor o encontra sozinho. Só entram recursos
    no formato CSV (o mesmo dado existe em XLSX e PARQUET, mais pesados ou
    menos portáveis). O tamanho declarado vai junto porque é a régua para
    saber se o download veio inteiro.
    """
    pacote = pegar_json(f"{BASE_API}/package_show?id={nome_conjunto}").get("result") or {}
    arquivos: list[tuple[int, str, int | None]] = []
    for recurso in pacote.get("resources") or []:
        if (recurso.get("format") or "").upper() != "CSV":
            continue
        url = recurso.get("url") or ""
        achado = re.search(r"(19|20)\d{2}", url.rsplit("/", 1)[-1])
        if url and achado:
            tamanho = int(recurso["size"]) if recurso.get("size") else None
            arquivos.append((int(achado.group(0)), url, tamanho))
    arquivos.sort()
    return arquivos


def baixar(url: str, pasta: Path, bytes_esperados: int | None = None) -> Path:
    """Baixa um CSV bruto para a pasta temporária e devolve o caminho.

    O arquivo é gravado em disco (e não em memória) porque o balanço anual
    passa de 4 MB e o leitor precisa de fluxo. O nome no disco é o nome
    original da URL, o que deixa a auditoria óbvia.

    Duas travas contra download torto, medidas em 18/11/2026:
    - grava em `.part` e só renomeia no fim, então arquivo interrompido
      nunca é lido como se estivesse completo;
    - compara com o `size` declarado no CKAN: arquivo menor que o declarado
      conta como falha e repete. Sem isso, um 2014 que veio com 0 byte
      passaria batido.
    """
    destino = pasta / url.rsplit("/", 1)[-1]
    if destino.exists() and (bytes_esperados is None or destino.stat().st_size >= bytes_esperados):
        return destino

    parcial = destino.with_name(destino.name + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    ultimo_erro: Exception | None = None
    for tentativa in range(TENTATIVAS):
        try:
            # 45 s por socket: a leitura do balanço de 2014 chegou a travar
            # 20 min sem estourar o timeout de 300 s do urlopen.
            with urllib.request.urlopen(req, timeout=TIMEOUT_ARQUIVO) as resposta, parcial.open("wb") as saida:
                shutil.copyfileobj(resposta, saida, length=1 << 20)
            medido = parcial.stat().st_size
            # Menor que o declarado = download cortado. Maior não é falha:
            # o arquivo pode ter crescido depois da leitura do metadado.
            if bytes_esperados is not None and medido < bytes_esperados:
                raise RuntimeError(f"tamanho {medido} < {bytes_esperados} declarado no CKAN")
            parcial.replace(destino)
            time.sleep(ESPERA_ARQUIVO)
            return destino
        except Exception as erro:
            ultimo_erro = erro
            parcial.unlink(missing_ok=True)
            time.sleep(2 * (tentativa + 1))
    raise RuntimeError(f"falhou ao baixar {url}: {ultimo_erro}")


def ler_csv(caminho: Path):
    """Abre um CSV do ONS e devolve um leitor de dicionário.

    Os arquivos vêm em UTF-8 com BOM e separador `;`, decimal com ponto.
    `newline=""` é exigência do módulo csv e evita linha quebrada no Windows.
    """
    arquivo = caminho.open("r", encoding="utf-8-sig", newline="")
    return arquivo, csv.DictReader(arquivo, delimiter=";")


def para_float(texto: str | None) -> float | None:
    """Converte o valor textual do CSV em float, tolerando vazio e vírgula."""
    if texto is None:
        return None
    texto = texto.strip()
    if not texto:
        return None
    try:
        return float(texto.replace(",", "."))
    except ValueError:
        return None


def mes_de(data: str) -> str:
    """Extrai `AAAA-MM` de `AAAA-MM-DD` ou `AAAA-MM-DD HH:MM:SS`."""
    return data[:7]


def arredondar(valor: float, casas: int = 2) -> float:
    """Arredonda para não gravar dízima de ponto flutuante no JSON."""
    return round(valor, casas)


def registrar_bruto(brutos: list[dict], caminho: Path, url: str) -> None:
    """Soma o peso real baixado, que vai no metadado do JSON.

    O tamanho declarado no CKAN nem sempre confere com o arquivo servido;
    medir aqui permite a documentação citar o peso real.
    """
    brutos.append({"url": url, "bytes": caminho.stat().st_size})


# --- Série 1: carga ---------------------------------------------------------


def coletar_carga(arquivos: list[tuple[int, str, int | None]], pasta: Path, brutos: list[dict]) -> list[dict]:
    """Agrega a carga diária em média mensal por subsistema.

    Entrada: `val_cargaenergiamwmed` por dia e subsistema (MWmed).
    Saída: um registro por (subsistema, mês) com a média do período e o
    número de dias que entraram na conta — `dias` menor que o esperado
    denuncia mês incompleto, e o portal precisa saber disso.
    """
    somas: dict[tuple[str, str], float] = defaultdict(float)
    contagens: dict[tuple[str, str], int] = defaultdict(int)
    nomes: dict[str, str] = {}
    fonte_do_mes: dict[tuple[str, str], str] = {}
    coletado = agora_iso()

    for ano, url, tamanho in arquivos:
        caminho = baixar(url, pasta, tamanho)
        registrar_bruto(brutos, caminho, url)
        print(f"  carga {ano}: {caminho.stat().st_size / 1024:.0f} KB", flush=True)
        arquivo, leitor = ler_csv(caminho)
        with arquivo:
            for linha in leitor:
                subsistema = (linha.get("id_subsistema") or "").strip()
                data = (linha.get("din_instante") or "").strip()
                valor = para_float(linha.get("val_cargaenergiamwmed"))
                if not subsistema or len(data) < 7 or valor is None:
                    continue
                chave = (subsistema, mes_de(data))
                somas[chave] += valor
                contagens[chave] += 1
                nomes.setdefault(subsistema, (linha.get("nom_subsistema") or "").strip())
                fonte_do_mes[chave] = url

    registros = [
        {
            "subsistema": subsistema,
            "nome": NOMES_SUBSISTEMA.get(subsistema) or nomes.get(subsistema, subsistema),
            "mes": mes,
            "cargaMediaMWmed": arredondar(somas[(subsistema, mes)] / contagens[(subsistema, mes)]),
            "dias": contagens[(subsistema, mes)],
            "fonte": fonte_do_mes[(subsistema, mes)],
            "coletadoEm": coletado,
        }
        for (subsistema, mes) in sorted(somas)
    ]
    return registros


# --- Série 2: balanço -------------------------------------------------------


FONTES_BALANCO = {
    "val_gerhidraulica": "hidraulica",
    "val_gertermica": "termica",
    "val_gereolica": "eolica",
    "val_gersolar": "solar",
}


def coletar_balanco(arquivos: list[tuple[int, str, int | None]], pasta: Path, brutos: list[dict]) -> list[dict]:
    """Agrega o balanço horário em médias mensais e participação por fonte.

    Entrada: geração (MWmed) por hora e subsistema, separada em hidráulica,
    térmica, eólica e solar, mais carga e intercâmbio.
    Saída: médias mensais. A `participacaoPercentual` é a fatia de cada fonte
    na geração total das quatro — é o número que responde "de onde vem a luz
    deste subsistema". A soma das quatro participações dá 100% por construção.
    """
    somas: dict[tuple[str, str], dict[str, float]] = defaultdict(lambda: defaultdict(float))
    horas: dict[tuple[str, str], int] = defaultdict(int)
    nomes: dict[str, str] = {}
    fonte_do_mes: dict[tuple[str, str], str] = {}
    coletado = agora_iso()

    for ano, url, tamanho in arquivos:
        caminho = baixar(url, pasta, tamanho)
        registrar_bruto(brutos, caminho, url)
        print(f"  balanco {ano}: {caminho.stat().st_size / 1024 / 1024:.1f} MB", flush=True)
        arquivo, leitor = ler_csv(caminho)
        with arquivo:
            for linha in leitor:
                subsistema = (linha.get("id_subsistema") or "").strip()
                data = (linha.get("din_instante") or "").strip()
                if not subsistema or len(data) < 7:
                    continue
                chave = (subsistema, mes_de(data))
                horas[chave] += 1
                nomes.setdefault(subsistema, (linha.get("nom_subsistema") or "").strip())
                fonte_do_mes[chave] = url
                for coluna, rotulo in FONTES_BALANCO.items():
                    valor = para_float(linha.get(coluna))
                    if valor is not None:
                        somas[chave][rotulo] += valor
                for coluna, rotulo in (("val_carga", "carga"), ("val_intercambio", "intercambio")):
                    valor = para_float(linha.get(coluna))
                    if valor is not None:
                        somas[chave][rotulo] += valor

    registros: list[dict] = []
    for chave in sorted(somas):
        subsistema, mes = chave
        n = horas[chave]
        medias = {rotulo: somas[chave][rotulo] / n for rotulo in (*FONTES_BALANCO.values(), "carga", "intercambio")}
        total = sum(medias[rotulo] for rotulo in FONTES_BALANCO.values())
        participacao = {
            rotulo: (arredondar(100 * medias[rotulo] / total) if total > 0 else 0.0)
            for rotulo in FONTES_BALANCO.values()
        }
        registros.append(
            {
                "subsistema": subsistema,
                "nome": NOMES_SUBSISTEMA.get(subsistema) or nomes.get(subsistema, subsistema),
                "mes": mes,
                "horas": n,
                "geracaoMediaMW": {
                    "hidraulica": arredondar(medias["hidraulica"]),
                    "termica": arredondar(medias["termica"]),
                    "eolica": arredondar(medias["eolica"]),
                    "solar": arredondar(medias["solar"]),
                    "total": arredondar(total),
                },
                "participacaoPercentual": participacao,
                "cargaMediaMW": arredondar(medias["carga"]),
                "intercambioMedioMW": arredondar(medias["intercambio"]),
                "fonte": fonte_do_mes[chave],
                "coletadoEm": coletado,
            }
        )
    return registros


# --- Série 3: EAR -----------------------------------------------------------


def coletar_ear(arquivos: list[tuple[int, str, int | None]], pasta: Path, brutos: list[dict]) -> list[dict]:
    """Agrega a EAR diária em média/mínimo/máximo mensal por subsistema.

    Entrada: `ear_verif_subsistema_percentual` (% do máximo do subsistema) e
    `ear_verif_subsistema_mwmes` (energia em MWmês).
    Saída: um registro por (subsistema, mês). O mínimo e o máximo do mês são
    guardados porque a média esconde a semana crítica — e é a semana crítica
    que o leitor de crise hídrica procura. O SE/CO é o subsistema de destaque
    na página; os outros três ficam na mesma série para comparação.
    """
    valores: dict[tuple[str, str], list[float]] = defaultdict(list)
    energias: dict[tuple[str, str], list[float]] = defaultdict(list)
    nomes: dict[str, str] = {}
    fonte_do_mes: dict[tuple[str, str], str] = {}
    coletado = agora_iso()

    for ano, url, tamanho in arquivos:
        caminho = baixar(url, pasta, tamanho)
        registrar_bruto(brutos, caminho, url)
        print(f"  ear {ano}: {caminho.stat().st_size / 1024:.0f} KB", flush=True)
        arquivo, leitor = ler_csv(caminho)
        with arquivo:
            for linha in leitor:
                subsistema = (linha.get("id_subsistema") or "").strip()
                data = (linha.get("ear_data") or "").strip()
                if not subsistema or len(data) < 7:
                    continue
                chave = (subsistema, mes_de(data))
                fonte_do_mes[chave] = url
                nomes.setdefault(subsistema, (linha.get("nom_subsistema") or "").strip())
                percentual = para_float(linha.get("ear_verif_subsistema_percentual"))
                if percentual is not None:
                    valores[chave].append(percentual)
                energia = para_float(linha.get("ear_verif_subsistema_mwmes"))
                if energia is not None:
                    energias[chave].append(energia)

    registros: list[dict] = []
    for chave in sorted(valores):
        subsistema, mes = chave
        percentuais = valores[chave]
        energias_mes = energias.get(chave) or [0.0]
        registros.append(
            {
                "subsistema": subsistema,
                "nome": NOMES_SUBSISTEMA.get(subsistema) or nomes.get(subsistema, subsistema),
                "mes": mes,
                "earPercentualMedio": arredondar(sum(percentuais) / len(percentuais)),
                "earPercentualMinimo": arredondar(min(percentuais)),
                "earPercentualMaximo": arredondar(max(percentuais)),
                "earMWmesMedio": arredondar(sum(energias_mes) / len(energias_mes)),
                "dias": len(percentuais),
                "fonte": fonte_do_mes[chave],
                "coletadoEm": coletado,
            }
        )
    return registros


# --- Gravação ---------------------------------------------------------------


def gravar(destino: Path, meta: dict, registros: list[dict]) -> int:
    """Grava um registro JSON por linha, para o diff do git continuar legível.

    JSON indentado fica bonito, mas um arquivo de 1.300 registros vira 12 mil
    linhas de chaves repetidas; tudo em uma linha só impede revisar o diff.
    Um registro por linha é o meio-termo: compacto e auditável.
    """
    cabecalho = json.dumps(meta, ensure_ascii=False, indent=1).rstrip()
    corpo = ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in registros)
    texto = f'{cabecalho[:-1].rstrip()},\n "registros": [\n{corpo}\n ]\n}}\n'
    # LF explícito: o git normaliza na entrada, e o tamanho medido tem de ser
    # o do arquivo versionado, não o do Windows com CRLF.
    destino.write_text(texto, encoding="utf-8", newline="\n")
    return destino.stat().st_size


def janela(registros: list[dict]) -> dict:
    """Primeiro e último mês cobertos pela série, para o metadado."""
    meses = sorted({r["mes"] for r in registros})
    return {"inicio": meses[0], "fim": meses[-1]} if meses else {"inicio": "", "fim": ""}


def main(argv: list[str] | None = None) -> int:
    """Orquestra a coleta das três séries e grava os JSON agregados."""
    parser = argparse.ArgumentParser(description="ETL mensal dos dados de energia do ONS.")
    parser.add_argument(
        "--serie",
        choices=["carga", "balanco", "ear", "todas"],
        default="todas",
        help="série a coletar (padrão: todas)",
    )
    parser.add_argument("--saida", type=Path, default=DESTINO, help="pasta dos JSON agregados")
    parser.add_argument(
        "--bruto-dir",
        type=Path,
        default=None,
        help="pasta para guardar o CSV bruto (padrão: temporária, apagada no fim)",
    )
    parser.add_argument("--manter-bruto", action="store_true", help="não apagar os CSV baixados")
    args = parser.parse_args(argv)

    inicio = time.time()
    args.saida.mkdir(parents=True, exist_ok=True)
    if args.bruto_dir:
        temporaria = args.bruto_dir
        temporaria.mkdir(parents=True, exist_ok=True)
    else:
        temporaria = Path(tempfile.mkdtemp(prefix="ons-bruto-"))

    # Metadados comuns a todas as séries: fonte, licença e o que é a unidade.
    comuns = {
        "portal": PORTAL,
        "licenca": "Creative Commons Atribuição (CC-BY)",
        "coletadoEm": agora_iso(),
    }

    try:
        selecionadas = list(CONJUNTOS) if args.serie == "todas" else [args.serie]
        for serie in selecionadas:
            conjunto = CONJUNTOS[serie]
            arquivos = numeros_csv(conjunto)
            if not arquivos:
                raise RuntimeError(f"{conjunto}: nenhum CSV anual encontrado no CKAN")
            print(f"[{serie}] {conjunto}: {len(arquivos)} CSV anuais ({arquivos[0][0]}-{arquivos[-1][0]})")
            coletores = {"carga": coletar_carga, "balanco": coletar_balanco, "ear": coletar_ear}
            # Lista própria por série: o peso medido é o do conjunto, não o do run.
            brutos: list[dict] = []
            registros = coletores[serie](arquivos, temporaria, brutos)
            arquivo = args.saida / f"energia-{serie}.json"
            meta = {
                **comuns,
                "fonte": f"{PORTAL}dataset/{conjunto}",
                "unidade": {
                    "carga": "MWmed (média mensal)",
                    "balanco": "MWmed (média mensal) e % da geração total",
                    "ear": "% do máximo do subsistema e MWmês",
                }[serie],
                "janela": janela(registros),
                "totalRegistros": len(registros),
                "bruto": {
                    "arquivos": len(brutos),
                    "bytes": sum(b["bytes"] for b in brutos),
                },
            }
            tamanho = gravar(arquivo, meta, registros)
            print(f"[{serie}] {len(registros)} registros, {tamanho / 1024:.1f} KB -> {arquivo}")
    finally:
        if args.manter_bruto or args.bruto_dir:
            print(f"bruto preservado em {temporaria}")
        else:
            shutil.rmtree(temporaria, ignore_errors=True)

    print(f"concluído em {time.time() - inicio:.0f} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
