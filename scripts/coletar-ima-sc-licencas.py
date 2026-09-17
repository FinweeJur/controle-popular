"""coletar-ima-sc-licencas.py — Licenciamento ambiental de Santa Catarina (IMA-SC / Sinfat).

Coleta a base completa de licenciamento ambiental do Instituto do Meio Ambiente
de Santa Catarina (IMA-SC / Sinfat) através do serviço oficial OGC WFS do GeoServer
estadual (camada ima:sinfat_licenciamento_ima_pontos), higieniza CPFs com algoritmo
mod-11 rigoroso e grava JSON estruturado e auditado em apps/web/data/ima-sc-licencas.json.

Fontes oficiais:
  - WFS GeoServer IMA-SC: https://geo.ima.sc.gov.br/geoserver/ows
  - Portal de Consultas IMA-SC: https://consultas.ima.sc.gov.br
  - Sinfat (Sistema Integrado de Informações Ambientais): https://sinfat.ima.sc.gov.br

Uso:
  python scripts/coletar-ima-sc-licencas.py               # Coleta e processa base completa (~114k licenças)
  python scripts/coletar-ima-sc-licencas.py --limit 1000  # Amostra de teste
  python scripts/coletar-ima-sc-licencas.py --scan-cpf    # Executa auditoria oficial de CPF ao final
  python scripts/coletar-ima-sc-licencas.py --force       # Força novo download ignorando cache

Privacidade e LGPD:
  - Higienização de CPF por algoritmo mod-11 oficial em todos os campos de texto.
  - Substituição por '[CPF redigido]'.
  - Preservação integral de CNPJs de pessoas jurídicas (14 dígitos).
"""
from __future__ import annotations

import argparse
import csv
import datetime
import io
import json
import os
import re
import ssl
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

# Configuração de encoding para evitar falhas no Windows console
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL_WFS = "https://geo.ima.sc.gov.br/geoserver/ows"
LAYER_LICENCAS = "ima:sinfat_licenciamento_ima_pontos"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "SC"
ORGAO = "IMA (SC)"

SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "ima-sc-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "ima-sc"

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Dicionário de expansão de tipos de licença do Sinfat
MAPA_TIPO_LICENCA = {
    "REN. LAO": "Renovação de Licença Ambiental de Operação (LAO)",
    "LAO": "Licença Ambiental de Operação (LAO)",
    "LAO CORRETIVA": "Licença Ambiental de Operação Corretiva (LAO)",
    "LAP": "Licença Ambiental Prévia (LAP)",
    "LAI": "Licença Ambiental de Instalação (LAI)",
    "LAP+LAI": "Licença Ambiental Prévia e de Instalação (LAP/LAI)",
    "AMP. LAI": "Ampliação de Licença Ambiental de Instalação (LAI)",
    "AMP. LAO": "Ampliação de Licença Ambiental de Operação (LAO)",
    "REN. LAO AUTO": "Renovação Automática de Licença Ambiental de Operação (LAO)",
    "LAC": "Licença Ambiental por Adesão e Compromisso (LAC)",
    "AMP. LAP": "Ampliação de Licença Ambiental Prévia (LAP)",
    "REN. LAI": "Renovação de Licença Ambiental de Instalação (LAI)",
    "LAP+LAI+LAO": "Licença Ambiental Integrada (LAP/LAI/LAO)",
    "AMP. LAP+LAI": "Ampliação de Licença Prévia e de Instalação (LAP/LAI)",
    "AUC": "Autorização de Corte de Vegetação (AUC)",
    "AUA": "Autorização Ambiental (AUA)",
    "CONFORMIDADE AMBIENTAL": "Certidão de Conformidade Ambiental",
    "PARECER TÉCNICO": "Parecer Técnico Ambiental",
    "PARECER TECNICO": "Parecer Técnico Ambiental",
    "ATIVIDADE NÃO CONSTANTE": "Declaração de Atividade Não Constante",
    "ATIVIDADE NAO CONSTANTE": "Declaração de Atividade Não Constante",
}

# 24 Bacias Hidrográficas Oficiais do IMA-SC mapeadas aos municípios
BACIA_MAP = {
    # Araranguá
    "ARARANGUA": "Bacia do Rio Araranguá", "BALNEARIO ARROIO DO SILVA": "Bacia do Rio Araranguá",
    "BALNEARIO GAIVOTA": "Bacia do Rio Araranguá", "ERMO": "Bacia do Rio Araranguá",
    "JACINTO MACHADO": "Bacia do Rio Araranguá", "MARACAJA": "Bacia do Rio Araranguá",
    "MELEIRO": "Bacia do Rio Araranguá", "MORRO GRANDE": "Bacia do Rio Araranguá",
    "SOMBRIO": "Bacia do Rio Araranguá", "TIMBE DO SUL": "Bacia do Rio Araranguá", "TURVO": "Bacia do Rio Araranguá",

    # Mampituba
    "PASSO DE TORRES": "Bacia do Rio Mampituba", "PRAIA GRANDE": "Bacia do Rio Mampituba",
    "SANTA ROSA DO SUL": "Bacia do Rio Mampituba", "SAO JOAO DO SUL": "Bacia do Rio Mampituba",

    # Urussanga
    "URUSSANGA": "Bacia do Rio Urussanga", "COCAL DO SUL": "Bacia do Rio Urussanga",
    "CRICIUMA": "Bacia do Rio Urussanga", "FORQUILHINHA": "Bacia do Rio Urussanga",
    "ICARA": "Bacia do Rio Urussanga", "MORRO DA FUMACA": "Bacia do Rio Urussanga",
    "NOVA VENEZA": "Bacia do Rio Urussanga", "SIDEROPOLIS": "Bacia do Rio Urussanga",
    "TREVISO": "Bacia do Rio Urussanga", "BALNEARIO RINCAO": "Bacia do Rio Urussanga",
    "LAURO MULLER": "Bacia do Rio Urussanga",

    # Tubarão
    "TUBARAO": "Bacia do Rio Tubarão", "ARMAZEM": "Bacia do Rio Tubarão",
    "BRACO DO NORTE": "Bacia do Rio Tubarão", "CAPIVARI DE BAIXO": "Bacia do Rio Tubarão",
    "GRAO-PARA": "Bacia do Rio Tubarão", "GRAO PARA": "Bacia do Rio Tubarão",
    "GRAVATAL": "Bacia do Rio Tubarão", "JAGUARUNA": "Bacia do Rio Tubarão",
    "ORLEANS": "Bacia do Rio Tubarão", "PEDRAS GRANDES": "Bacia do Rio Tubarão",
    "PESCARIA BRAVA": "Bacia do Rio Tubarão", "RIO FORTUNA": "Bacia do Rio Tubarão",
    "SANTA ROSA DE LIMA": "Bacia do Rio Tubarão", "SAO LUDGERO": "Bacia do Rio Tubarão",
    "SAO MARTINHO": "Bacia do Rio Tubarão", "TREZE DE MAIO": "Bacia do Rio Tubarão",
    "LAGUNA": "Bacia do Rio Tubarão", "SANGAO": "Bacia do Rio Tubarão",

    # D'Una / Laguna / Madre
    "IMARUI": "Bacia da Lagoa do Imaruí / Rio D'Una", "IMBITUBA": "Bacia da Lagoa do Imaruí / Rio D'Una",
    "GAROPABA": "Bacia do Rio da Madre", "PAULO LOPES": "Bacia do Rio da Madre",

    # Tijucas
    "TIJUCAS": "Bacia do Rio Tijucas", "CANELINHA": "Bacia do Rio Tijucas",
    "SAO JOAO BATISTA": "Bacia do Rio Tijucas", "MAJOR GERCINO": "Bacia do Rio Tijucas",
    "NOVA TRENTO": "Bacia do Rio Tijucas", "PORTO BELO": "Bacia do Rio Tijucas",
    "BOMBINHAS": "Bacia do Rio Tijucas", "ITAPEMA": "Bacia do Rio Tijucas",

    # Camboriú
    "BALNEARIO CAMBORIU": "Bacia do Rio Camboriú", "CAMBORIU": "Bacia do Rio Camboriú",

    # Biguaçu
    "BIGUACU": "Bacia do Rio Biguaçu", "GOVERNADOR CELSO RAMOS": "Bacia do Rio Biguaçu",
    "ANTONIO CARLOS": "Bacia do Rio Biguaçu", "SAO PEDRO DE ALCANTARA": "Bacia do Rio Biguaçu",

    # Cubatão Sul / Grande Florianópolis
    "FLORIANOPOLIS": "Bacia do Rio Cubatão do Sul", "PALHOCA": "Bacia do Rio Cubatão do Sul",
    "SAO JOSE": "Bacia do Rio Cubatão do Sul", "SANTO AMARO DA IMPERATRIZ": "Bacia do Rio Cubatão do Sul",
    "AGUAS MORNAS": "Bacia do Rio Cubatão do Sul", "RANCHO QUEIMADO": "Bacia do Rio Cubatão do Sul",
    "ANITAPOLIS": "Bacia do Rio Cubatão do Sul", "ANGELINA": "Bacia do Rio Cubatão do Sul",
    "SAO BONIFACIO": "Bacia do Rio Cubatão do Sul",

    # Itapocu
    "JARAGUA DO SUL": "Bacia do Rio Itapocu", "GUARAMIRIM": "Bacia do Rio Itapocu",
    "CORUPA": "Bacia do Rio Itapocu", "SCHROEDER": "Bacia do Rio Itapocu",
    "MASSARANDUBA": "Bacia do Rio Itapocu", "BARRA VELHA": "Bacia do Rio Itapocu",
    "SAO JOAO DO ITAPERIU": "Bacia do Rio Itapocu",

    # Cubatão Norte
    "JOINVILLE": "Bacia do Rio Cubatão (Norte)", "GARUVA": "Bacia do Rio Cubatão (Norte)",
    "SAO FRANCISCO DO SUL": "Bacia do Rio Cubatão (Norte)", "ITAPOA": "Bacia do Rio Cubatão (Norte)",
    "ARAQUARI": "Bacia do Rio Cubatão (Norte)", "BALNEARIO BARRA DO SUL": "Bacia do Rio Cubatão (Norte)",

    # Itajaí-Açu
    "BLUMENAU": "Bacia do Rio Itajaí-Açu", "ITAJAI": "Bacia do Rio Itajaí-Açu",
    "GASPAR": "Bacia do Rio Itajaí-Açu", "BRUSQUE": "Bacia do Rio Itajaí-Açu",
    "INDAIAL": "Bacia do Rio Itajaí-Açu", "TIMBO": "Bacia do Rio Itajaí-Açu",
    "POMERODE": "Bacia do Rio Itajaí-Açu", "RIO DO SUL": "Bacia do Rio Itajaí-Açu",
    "NAVEGANTES": "Bacia do Rio Itajaí-Açu", "ILHOTA": "Bacia do Rio Itajaí-Açu",
    "IBIRAMA": "Bacia do Rio Itajaí-Açu", "BENEDITO NOVO": "Bacia do Rio Itajaí-Açu",
    "RODEIO": "Bacia do Rio Itajaí-Açu", "ASCURRA": "Bacia do Rio Itajaí-Açu",
    "APIUNA": "Bacia do Rio Itajaí-Açu", "PRESIDENTE GETULIO": "Bacia do Rio Itajaí-Açu",
    "TAIO": "Bacia do Rio Itajaí-Açu", "POUSO REDONDO": "Bacia do Rio Itajaí-Açu",
    "ITUPORANGA": "Bacia do Rio Itajaí-Açu", "AGRONOMICA": "Bacia do Rio Itajaí-Açu",
    "LAURENTINO": "Bacia do Rio Itajaí-Açu", "AURORA": "Bacia do Rio Itajaí-Açu",
    "RIO DOS CEDROS": "Bacia do Rio Itajaí-Açu", "DOUTOR PEDRINHO": "Bacia do Rio Itajaí-Açu",
    "GUABIRUBA": "Bacia do Rio Itajaí-Açu", "BOTUVERA": "Bacia do Rio Itajaí-Açu",
    "LUIZ Alves": "Bacia do Rio Itajaí-Açu", "DONA EMMA": "Bacia do Rio Itajaí-Açu",
    "WITMARSUM": "Bacia do Rio Itajaí-Açu", "JOSE BOITEUX": "Bacia do Rio Itajaí-Açu",
    "VITOR MEIRELES": "Bacia do Rio Itajaí-Açu", "ATALANTA": "Bacia do Rio Itajaí-Açu",
    "VIDAL RAMOS": "Bacia do Rio Itajaí-Açu", "IMBUIA": "Bacia do Rio Itajaí-Açu",
    "PETROLANDIA": "Bacia do Rio Itajaí-Açu", "CHAPADAO DO LAGEADO": "Bacia do Rio Itajaí-Açu",
    "MIRIM DOCE": "Bacia do Rio Itajaí-Açu", "SALETE": "Bacia do Rio Itajaí-Açu",
    "SANTA TEREZINHA": "Bacia do Rio Itajaí-Açu", "RIO DO CAMPO": "Bacia do Rio Itajaí-Açu",
    "AGROLANDIA": "Bacia do Rio Itajaí-Açu", "BRACO DO TROMBUDO": "Bacia do Rio Itajaí-Açu",
    "TROMBUDO CENTRAL": "Bacia do Rio Itajaí-Açu", "LEOBERTO LEAL": "Bacia do Rio Itajaí-Açu",
    "PRESIDENTE NEREU": "Bacia do Rio Itajaí-Açu", "RIO DO OESTE": "Bacia do Rio Itajaí-Açu",
    "LONTRAS": "Bacia do Rio Itajaí-Açu", "ALFREDO WAGNER": "Bacia do Rio Itajaí-Açu",
    "PENHA": "Bacia do Rio Itajaí-Açu", "BALNEARIO PICARRAS": "Bacia do Rio Itajaí-Açu",

    # Canoinhas / Negro / Iguaçu
    "CANOINHAS": "Bacia do Rio Canoinhas", "TRES BARRAS": "Bacia do Rio Canoinhas",
    "MAJOR VIEIRA": "Bacia do Rio Canoinhas", "BELA VISTA DO TOLDO": "Bacia do Rio Canoinhas",
    "PAPANDUVA": "Bacia do Rio Canoinhas", "MONTE CASTELO": "Bacia do Rio Canoinhas",
    "MAFRA": "Bacia do Rio Negro (SC)", "RIO NEGRINHO": "Bacia do Rio Negro (SC)",
    "SAO BENTO DO SUL": "Bacia do Rio Negro (SC)", "CAMPO ALEGRE": "Bacia do Rio Negro (SC)",
    "ITAIOPOLIS": "Bacia do Rio Negro (SC)",
    "PORTO UNIAO": "Bacia do Rio Iguaçu", "IRINEOPOLIS": "Bacia do Rio Iguaçu",
    "MATOS COSTA": "Bacia do Rio Iguaçu", "CALMON": "Bacia do Rio Iguaçu",

    # Do Peixe
    "CACADOR": "Bacia do Rio do Peixe", "VIDEIRA": "Bacia do Rio do Peixe",
    "JOACABA": "Bacia do Rio do Peixe", "HERVAL D OESTE": "Bacia do Rio do Peixe",
    "HERVAL D'OESTE": "Bacia do Rio do Peixe", "CAPINZAL": "Bacia do Rio do Peixe",
    "OURO": "Bacia do Rio do Peixe", "LUZERNA": "Bacia do Rio do Peixe",
    "TREZE TILIAS": "Bacia do Rio do Peixe", "IBICARE": "Bacia do Rio do Peixe",
    "TANGARA": "Bacia do Rio do Peixe", "PINHEIRO PRETO": "Bacia do Rio do Peixe",
    "RIO DAS ANTAS": "Bacia do Rio do Peixe", "FRAIBURGO": "Bacia do Rio do Peixe",
    "MACIEIRA": "Bacia do Rio do Peixe", "ARROIO TRINTA": "Bacia do Rio do Peixe",
    "SALTO VELOSO": "Bacia do Rio do Peixe", "IOMERE": "Bacia do Rio do Peixe",
    "LACERDOPOLIS": "Bacia do Rio do Peixe", "ERVAL VELHO": "Bacia do Rio do Peixe",
    "AGUA DOCE": "Bacia do Rio do Peixe", "LEBON REGIS": "Bacia do Rio do Peixe",
    "IBIAM": "Bacia do Rio do Peixe", "TIMBO GRANDE": "Bacia do Rio do Peixe",

    # Canoas
    "LAGES": "Bacia do Rio Canoas", "CURITIBANOS": "Bacia do Rio Canoas",
    "CAMPOS NOVOS": "Bacia do Rio Canoas", "SAO JOAQUIM": "Bacia do Rio Canoas",
    "PAINEL": "Bacia do Rio Canoas", "URUPEMA": "Bacia do Rio Canoas",
    "URUBICI": "Bacia do Rio Canoas", "BOM RETIRO": "Bacia do Rio Canoas",
    "RIO RUFINO": "Bacia do Rio Canoas", "BOCAINA DO SUL": "Bacia do Rio Canoas",
    "CORREIA PINTO": "Bacia do Rio Canoas", "PONTE ALTA": "Bacia do Rio Canoas",
    "PONTE ALTA DO NORTE": "Bacia do Rio Canoas", "SAO CRISTOVAO DO SUL": "Bacia do Rio Canoas",
    "SANTA CECILIA": "Bacia do Rio Canoas", "FREI ROGERIO": "Bacia do Rio Canoas",
    "MONTE CARLO": "Bacia do Rio Canoas", "BRUNOPOLIS": "Bacia do Rio Canoas",
    "VARGEM": "Bacia do Rio Canoas", "ZORTEA": "Bacia do Rio Canoas",
    "ABDON BATISTA": "Bacia do Rio Canoas", "CELSO RAMOS": "Bacia do Rio Canoas",
    "ANITA GARIBALDI": "Bacia do Rio Canoas", "CERRO NEGRO": "Bacia do Rio Canoas",
    "CAMPO BELO DO SUL": "Bacia do Rio Canoas", "SAO JOSE DO CERRITO": "Bacia do Rio Canoas",
    "VARGEM BONITA": "Bacia do Rio Canoas", "OTACILIO COSTA": "Bacia do Rio Canoas",
    "PALMEIRA": "Bacia do Rio Canoas", "CAPAO ALTO": "Bacia do Rio Canoas",

    # Pelotas
    "BOM JARDIM DA SERRA": "Bacia do Rio Pelotas",

    # Jacutinga
    "CONCORDIA": "Bacia do Rio Jacutinga", "ARABUTA": "Bacia do Rio Jacutinga",
    "ITA": "Bacia do Rio Jacutinga", "SEARA": "Bacia do Rio Jacutinga",
    "ARVOREDO": "Bacia do Rio Jacutinga", "XAVANTINA": "Bacia do Rio Jacutinga",
    "PAIAL": "Bacia do Rio Jacutinga", "IPUMIRIM": "Bacia do Rio Jacutinga",
    "LINDOIA DO SUL": "Bacia do Rio Jacutinga", "ALTO BELA VISTA": "Bacia do Rio Jacutinga",
    "PERITIBA": "Bacia do Rio Jacutinga", "PIRATUBA": "Bacia do Rio Jacutinga",
    "IPIRA": "Bacia do Rio Jacutinga", "JABORA": "Bacia do Rio Jacutinga",
    "PRESIDENTE CASTELO BRANCO": "Bacia do Rio Jacutinga",

    # Irani
    "CORDEILHEIRA ALTA": "Bacia do Rio Irani", "CORDILHEIRA ALTA": "Bacia do Rio Irani",
    "XAXIM": "Bacia do Rio Irani", "XANXERE": "Bacia do Rio Irani",
    "FAXINAL DOS GUEDES": "Bacia do Rio Irani", "PONTE SERRADA": "Bacia do Rio Irani",
    "VARGEAO": "Bacia do Rio Irani", "PASSOS MAIA": "Bacia do Rio Irani",
    "IRANI": "Bacia do Rio Irani", "MAREMA": "Bacia do Rio Irani",
    "LAJEADO GRANDE": "Bacia do Rio Irani",

    # Chapecó
    "CHAPECO": "Bacia do Rio Chapecó", "CORONEL FREITAS": "Bacia do Rio Chapecó",
    "QUILOMBO": "Bacia do Rio Chapecó", "FORMOSA DO SUL": "Bacia do Rio Chapecó",
    "SANTIAGO DO SUL": "Bacia do Rio Chapecó", "IRATI": "Bacia do Rio Chapecó",
    "JARDINOPOLIS": "Bacia do Rio Chapecó", "UNIAO DO OESTE": "Bacia do Rio Chapecó",
    "AGUAS FRIAS": "Bacia do Rio Chapecó", "NOVA ERECHIM": "Bacia do Rio Chapecó",
    "NOVA ITABERABA": "Bacia do Rio Chapecó", "PLANALTO ALEGRE": "Bacia do Rio Chapecó",
    "GUATAMBU": "Bacia do Rio Chapecó", "CAXAMBU DO SUL": "Bacia do Rio Chapecó",
    "AGUAS DE CHAPECO": "Bacia do Rio Chapecó", "SAO CARLOS": "Bacia do Rio Chapecó",
    "SAUDADES": "Bacia do Rio Chapecó", "PINHALZINHO": "Bacia do Rio Chapecó",
    "MODELO": "Bacia do Rio Chapecó", "SERRA ALTA": "Bacia do Rio Chapecó",
    "SUL BRASIL": "Bacia do Rio Chapecó", "BOM JESUS DO OESTE": "Bacia do Rio Chapecó",
    "SALTINHO": "Bacia do Rio Chapecó", "CAMPO ERE": "Bacia do Rio Chapecó",
    "SAO DOMINGOS": "Bacia do Rio Chapecó", "CORONEL MARTINS": "Bacia do Rio Chapecó",
    "GALVAO": "Bacia do Rio Chapecó", "JUPIA": "Bacia do Rio Chapecó",
    "NOVO HORIZONTE": "Bacia do Rio Chapecó", "SAO LOURENCO DO OESTE": "Bacia do Rio Chapecó",
    "ABELARDO LUZ": "Bacia do Rio Chapecó", "OURO VERDE": "Bacia do Rio Chapecó",
    "BOM JESUS": "Bacia do Rio Chapecó", "ENTRE RIOS": "Bacia do Rio Chapecó",
    "IPUACU": "Bacia do Rio Chapecó", "SAO BERNARDINO": "Bacia do Rio Chapecó",

    # Antas
    "MARAVILHA": "Bacia do Rio das Antas", "CUNHA PORA": "Bacia do Rio das Antas",
    "PALMITOS": "Bacia do Rio das Antas", "RIQUEZA": "Bacia do Rio das Antas",
    "CAIBI": "Bacia do Rio das Antas", "MONDAI": "Bacia do Rio das Antas",
    "IPORA DO OESTE": "Bacia do Rio das Antas", "TUNAPOLIS": "Bacia do Rio das Antas",
    "SANTA HELENA": "Bacia do Rio das Antas", "BELMONTE": "Bacia do Rio das Antas",
    "DESCANSO": "Bacia do Rio das Antas", "SAO MIGUEL DO OESTE": "Bacia do Rio das Antas",
    "FLOR DO SERTAO": "Bacia do Rio das Antas", "SAO MIGUEL DA BOA VISTA": "Bacia do Rio das Antas",
    "ROMELANDIA": "Bacia do Rio das Antas", "ANCHIETA": "Bacia do Rio das Antas",
    "TIGRINHOS": "Bacia do Rio das Antas", "SANTA TEREZINHA DO PROGRESSO": "Bacia do Rio das Antas",
    "IRACEMINHA": "Bacia do Rio das Antas", "CUNHATAI": "Bacia do Rio das Antas",
    "SAO JOAO DO OESTE": "Bacia do Rio das Antas",

    # Peperi-Guaçu
    "DIONISIO CERQUEIRA": "Bacia do Rio Peperi-Guaçu", "PRINCESA": "Bacia do Rio Peperi-Guaçu",
    "GUARUJA DO SUL": "Bacia do Rio Peperi-Guaçu", "SAO JOSE DO CEDRO": "Bacia do Rio Peperi-Guaçu",
    "PARAISO": "Bacia do Rio Peperi-Guaçu", "BANDEIRANTE": "Bacia do Rio Peperi-Guaçu",
    "ITAPIRANGA": "Bacia do Rio Peperi-Guaçu", "GUARACIABA": "Bacia do Rio Peperi-Guaçu",
    "PALMA SOLA": "Bacia do Rio Peperi-Guaçu",
}


def _normalizar_texto(s: str | None) -> str:
    if not s:
        return ""
    nfd = unicodedata.normalize("NFD", s.upper())
    sem_acento = re.sub(r"[\u0300-\u036f]", "", nfd)
    return " ".join(sem_acento.split())


def _cpf_valido(dig: str) -> bool:
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str | None) -> str | None:
    if not texto:
        return texto

    def _sub(m: re.Match) -> str:
        val = m.group(0)
        start, end = m.span()
        # Não substituir dígitos se fizer parte de um CNPJ (14 dígitos)
        if start > 0 and texto[start - 1].isdigit():
            return val
        if end < len(texto) and texto[end].isdigit():
            return val

        d = re.sub(r"\D", "", val)
        if len(d) == 11 and _cpf_valido(d):
            return "[CPF redigido]"
        return val

    return RE_CPF.sub(_sub, str(texto))


def _obter_bacia(municipio: str | None, setor: str | None) -> str:
    mun_norm = _normalizar_texto(municipio)
    if mun_norm in BACIA_MAP:
        return BACIA_MAP[mun_norm]

    # Fallback pelos setores regionais do IMA
    setor_norm = _normalizar_texto(setor)
    if any(k in setor_norm for k in ["BLUMENAU", "CVI", "RIO DO SUL", "CAV", "ITAJAI", "CFI"]):
        return "Bacia do Rio Itajaí-Açu"
    if any(k in setor_norm for k in ["CRICIUMA", "CRS"]):
        return "Bacia do Rio Urussanga"
    if any(k in setor_norm for k in ["TUBARAO", "CTB"]):
        return "Bacia do Rio Tubarão"
    if any(k in setor_norm for k in ["FLORIANOPOLIS", "CRF"]):
        return "Bacia do Rio Cubatão do Sul"
    if any(k in setor_norm for k in ["JARAGUA", "CJS"]):
        return "Bacia do Rio Itapocu"
    if any(k in setor_norm for k in ["JOINVILLE", "CRN"]):
        return "Bacia do Rio Cubatão (Norte)"
    if any(k in setor_norm for k in ["LAGES", "CPS"]):
        return "Bacia do Rio Canoas"
    if any(k in setor_norm for k in ["CACADOR", "CMO", "JOACABA", "CRP"]):
        return "Bacia do Rio do Peixe"
    if any(k in setor_norm for k in ["CANOINHAS", "CPN", "MAFRA", "CMF"]):
        return "Bacia do Rio Canoinhas"
    if any(k in setor_norm for k in ["CONCORDIA", "CAU"]):
        return "Bacia do Rio Jacutinga"
    if any(k in setor_norm for k in ["CHAPECO", "CRO"]):
        return "Bacia do Rio Chapecó"
    if any(k in setor_norm for k in ["MIGUEL", "CEO"]):
        return "Bacia do Rio das Antas"

    return "Bacia Hidrográfica de Santa Catarina"


def _gerar_tags(tipo_licenca: str, atividade: str, tipologia: str, porte: str, situacao: str) -> list[str]:
    tags = ["licenca", "ima", "sc"]
    combinado = f"{tipo_licenca} {atividade} {tipologia}".lower()
    tl_low = tipo_licenca.lower()

    if "lap" in tl_low or "previa" in combinado:
        tags.append("licenca_previa")
    if "lai" in tl_low or "instalacao" in combinado:
        tags.append("licenca_instalacao")
    if "lao" in tl_low or "operacao" in combinado:
        tags.append("licenca_operacao")
    if "lac" in tl_low or "adesao" in combinado:
        tags.append("licenca_adesao_compromisso")
    if "renovacao" in combinado or "ren." in tl_low:
        tags.append("renovacao")
    if "auto" in tl_low:
        tags.append("renovacao_automatica")
    if "corretiva" in tl_low:
        tags.append("licenca_corretiva")
    if "ampliacao" in combinado or "amp." in tl_low:
        tags.append("ampliacao")
    if "corte" in combinado or "auc" in tl_low or "vegetacao" in combinado:
        tags.append("autorizacao_corte")

    # Temas de atividade
    if any(k in combinado for k in ["energia", "hidreletrica", "cgh", "pch", "solar", "eolica", "uhe"]):
        tags.append("energia")
    if any(k in combinado for k in ["mineracao", "extracao", "areia", "brita", "argila", "saibro", "carvao"]):
        tags.append("mineracao")
    if any(k in combinado for k in ["saneamento", "esgoto", "aterro", "lixo", "residuos", "compostagem", "efluente"]):
        tags.append("saneamento")
    if any(k in combinado for k in ["posto", "combustivel", "gas", "petroleo", "tanque"]):
        tags.append("combustiveis")
    if any(k in combinado for k in ["loteamento", "habitacao", "condominio", "edificacao", "imobiliario", "terraplenagem"]):
        tags.append("urbanizacao")
    if any(k in combinado for k in ["industria", "fabrica", "quimica", "metalurgica", "textil", "alimentos", "madeira", "frigorifico"]):
        tags.append("industria")
    if any(k in combinado for k in ["agropecuaria", "suinocultura", "avicultura", "bovinocultura", "silvicultura", "piscicultura"]):
        tags.append("agropecuaria")
    if any(k in combinado for k in ["rodovia", "ferrovia", "ponte", "transporte", "porto", "aeroporto", "dragagem"]):
        tags.append("infraestrutura")

    # Porte
    p_up = (porte or "").strip().upper()
    if p_up == "P":
        tags.append("porte_pequeno")
    elif p_up == "M":
        tags.append("porte_medio")
    elif p_up == "G":
        tags.append("porte_grande")

    # Situação
    sit_l = (situacao or "").strip().lower()
    if "concedida" in sit_l:
        tags.append("concedida")
    elif "arquivada" in sit_l:
        tags.append("arquivada")
    elif "indeferida" in sit_l:
        tags.append("indeferida")
    elif "analise" in sit_l or "tramite" in sit_l or "cadastrado" in sit_l:
        tags.append("em_analise")

    return list(dict.fromkeys(tags))


def baixar_chunks(forcar: bool = False, chunk_size: int = 25000) -> list[Path]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    start = 0
    arquivos_chunks = []

    print(f"Verificando / baixando base WFS do IMA-SC ({LAYER_LICENCAS})...")

    while True:
        chunk_file = CACHE_DIR / f"chunk_{start}_{chunk_size}.csv"
        if not forcar and chunk_file.exists() and chunk_file.stat().st_size > 50000:
            print(f"  Chunk startIndex={start:,} lido do cache ({chunk_file.stat().st_size:,} bytes)")
            arquivos_chunks.append(chunk_file)
            start += chunk_size
            continue

        params = urllib.parse.urlencode({
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeName": LAYER_LICENCAS,
            "count": chunk_size,
            "startIndex": start,
            "outputFormat": "csv"
        })
        url = f"{URL_WFS}?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": UA})

        print(f"  Baixando lote startIndex={start:,}, tamanho={chunk_size:,}...")
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=180) as resp:
                data = resp.read()
                linhas_count = len(data.splitlines())
                if linhas_count <= 1:
                    print("  Fim dos registros recebidos.")
                    break
                chunk_file.write_bytes(data)
                t1 = time.time()
                print(f"  Salvo lote startIndex={start:,} ({len(data):,} bytes, {linhas_count:,} linhas) em {t1-t0:.2f}s")
                arquivos_chunks.append(chunk_file)
        except Exception as e:
            print(f"  Erro ao baixar chunk no índice {start}: {e}")
            break

        start += chunk_size
        time.sleep(1)

    return arquivos_chunks


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta e higieniza licenciamento ambiental do IMA-SC")
    parser.add_argument("--limit", type=int, default=0, help="Limite de registros a gravar (0 = todos)")
    parser.add_argument("--force", action="store_true", help="Força novo download ignorando cache")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao final")
    args = parser.parse_args()

    chunk_files = baixar_chunks(forcar=args.force)
    if not chunk_files:
        print("Erro: nenhum arquivo de lote encontrado ou baixado.")
        return 1

    print("Processando e deduplicando atos de licenciamento do IMA-SC...")
    total_linhas_lidas = 0
    dedup_map = {}

    for f in chunk_files:
        if f.stat().st_size < 1000:
            continue
        with open(f, "r", encoding="utf-8", errors="ignore") as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                total_linhas_lidas += 1
                key = (row.get("fce"), row.get("numero_licenca"), row.get("tipo_licenca"), row.get("processo"))
                if key not in dedup_map:
                    dedup_map[key] = row

    total_disponivel = len(dedup_map)
    print(f"Total de feições processadas: {total_linhas_lidas:,}")
    print(f"Total de atos de licenciamento únicos (deduplicados): {total_disponivel:,}")

    linhas = []
    for row in dedup_map.values():
        if args.limit > 0 and len(linhas) >= args.limit:
            break

        tipo_raw = (row.get("tipo_licenca") or "").strip()
        tipo_base = MAPA_TIPO_LICENCA.get(tipo_raw, tipo_raw or "Licença Ambiental")
        atividade = (row.get("atividade") or "").strip()
        tipologia = (row.get("tipologia") or "").strip()
        porte = (row.get("porte_empreendimento") or "").strip()
        potencial = (row.get("potencial_geral_atividade") or "").strip()

        tipo_completo = f"{tipo_base} — {atividade}" if atividade else tipo_base
        tipo_higienizado = _apagar_cpf(tipo_completo)

        nome_emp = (row.get("nome_empreendimento") or "").strip() or None
        empresa_sanitizada = _apagar_cpf(nome_emp) if nome_emp else None

        mun_raw = (row.get("municipio") or "").strip()
        municipio = mun_raw.title() if mun_raw else None

        setor = (row.get("setor") or "").strip()
        bacia = _obter_bacia(mun_raw, setor)

        dt_emissao = (row.get("licenca_emissao_data") or "").strip()
        dt_formalizacao = (row.get("formalizacao_data") or "").strip()
        dt_validade = (row.get("licenca_data_validade") or "").strip()

        data_inicio = None
        for dt_candidata in [dt_emissao, dt_formalizacao]:
            if dt_candidata:
                m = re.search(r"(\d{4}-\d{2}-\d{2})", dt_candidata)
                if m:
                    data_inicio = m.group(1)
                    break

        data_fim = None
        if dt_validade:
            m = re.search(r"(\d{4}-\d{2}-\d{2})", dt_validade)
            if m:
                data_fim = m.group(1)

        ano = None
        num_licenca = (row.get("numero_licenca") or "").strip()
        if data_inicio:
            try:
                ano = int(data_inicio[:4])
            except Exception:
                pass
        elif num_licenca and "/" in num_licenca:
            partes = num_licenca.split("/")
            if len(partes) == 2 and partes[1].isdigit() and len(partes[1]) == 4:
                ano = int(partes[1])

        num_proc = (row.get("processo") or "").strip()
        fce = (row.get("fce") or "").strip()
        if num_licenca and num_proc:
            processo_fmt = f"Licença {num_licenca} (Proc. {num_proc})"
        elif num_licenca:
            processo_fmt = f"Licença {num_licenca}"
        elif num_proc:
            processo_fmt = f"Proc. {num_proc}"
        elif fce:
            processo_fmt = f"FCE {fce}"
        else:
            processo_fmt = "S/N"
        processo_fmt = _apagar_cpf(processo_fmt)

        sit_raw = (row.get("licenca_status") or "").strip()
        if sit_raw:
            situacao = sit_raw.title()
        elif num_licenca:
            situacao = "Concedida"
        else:
            situacao = "Em Trâmite"

        # Microresumo de 1 linha
        porte_txt = f" · Porte {porte}" if porte else ""
        microresumo = f"{tipo_base} · {municipio or 'SC'}{porte_txt} · Empreendimento: {empresa_sanitizada or 'Não informado'} · Processo: {processo_fmt}"
        microresumo = _apagar_cpf(microresumo)

        tags = _gerar_tags(tipo_raw, atividade, tipologia, porte, situacao)

        linhas.append({
            "orgao": ORGAO,
            "uf": UF,
            "ano": ano,
            "categoria": "licenca",
            "tipo": tipo_higienizado,
            "empresa": empresa_sanitizada,
            "municipio": municipio,
            "bacia": bacia,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "situacao": situacao,
            "processo": processo_fmt,
            "microresumo": microresumo,
            "tags": tags,
        })

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": f"{URL_WFS}?service=WFS&version=2.0.0&request=GetFeature&typeName={LAYER_LICENCAS}",
        "truncado": args.limit > 0 and len(linhas) < total_disponivel,
        "total": len(linhas),
        "total_disponivel": total_disponivel,
        "ressalva_editorial": (
            "Base de licenciamento ambiental do Instituto do Meio Ambiente de Santa Catarina (IMA-SC), "
            "obtida através do Sistema Integrado de Informações Ambientais (Sinfat) e do Geosserviço WFS "
            "estadual. Os atos atestam a regularidade formal ou deliberação administrativa perante o órgão "
            "estadual na data de expedição."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    print(f"Gravando {len(linhas):,} registros em {SAIDA}...")
    t0 = time.time()
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    t1 = time.time()
    tam_bytes = SAIDA.stat().st_size
    tam_mb = tam_bytes / (1024 * 1024)
    print(f"Sucesso: gravado em {SAIDA} ({len(linhas):,} registros, {tam_mb:.2f} MB / {tam_bytes:,} bytes) em {t1-t0:.2f}s")

    if args.scan_cpf:
        print("\nExecutando auditoria oficial de privacidade e LGPD (scripts/checar-dado-pessoal-em-dado.py)...")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        print(r.stdout)
        if r.stderr:
            print(r.stderr, file=sys.stderr)
        if SAIDA.name in r.stdout and "PUSH BARRADO" in r.stdout:
            print(f"ERRO CRÍTICO: Dado pessoal detectado em {SAIDA.name}!")
            return 2
        print(f"✓ Auditoria de CPF em {SAIDA.name}: 100% LIMPA (0 CPFs encontrados)!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
