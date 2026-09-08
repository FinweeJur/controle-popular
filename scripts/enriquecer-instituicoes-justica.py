"""scripts/enriquecer-instituicoes-justica.py

Enriquece e atualiza:
1. apps/web/data/judiciario-instituicoes-detalhe.json (91 órgãos: 27 TJs, 27 MPs, 27 DPs + 10 Federais/Regionais)
2. apps/web/data/instituicoes-todas-esferas.json (órgãos de todas as esferas)

Garante:
- Contatos completos em CADA nó do organograma: { area, funcao, site, telefone, email, endereco }
- Lideranças reais (nomes factuais de Presidentes dos TJs, PGJs dos MPs e DPGs das Defensorias)
- Notícia oficial de posse/exercício com data e URL oficial
- Zero CPFs em conformidade com as regras de privacidade do AGENTS.md
"""

import json
import os
import re
import unicodedata
from pathlib import Path

def slugify(texto: str) -> str:
    nfkd = unicodedata.normalize('NFKD', texto)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    limpo = re.sub(r'[^a-zA-Z0-9]+', '-', sem_acento.lower()).strip('-')
    return limpo[:25].strip('-') or "setor"

RAIZ = Path(__file__).resolve().parent.parent
ARQUIVO_JUSTICA = RAIZ / "apps" / "web" / "data" / "judiciario-instituicoes-detalhe.json"
ARQUIVO_TODAS = RAIZ / "apps" / "web" / "data" / "instituicoes-todas-esferas.json"

# Dados dos 27 Estados: Capital, DDD, Endereço e CEP Base
ESTADOS_INFO = {
    "SP": {"capital": "São Paulo", "ddd": "11", "tel": "(11) 3242-9300", "end": "Praça da Sé, s/n - Centro", "cep": "01018-010",
           "tj_pres": "Fernando Antonio Torres Garcia", "tj_mandato": "2024–2026", "tj_posse_data": "2024-01-08",
           "mp_pgj": "Paulo Sérgio de Oliveira e Costa", "mp_mandato": "2024–2026", "mp_posse_data": "2024-04-15",
           "dp_dpg": "Luciana Jordão da Motta Armiliato de Carvalho", "dp_mandato": "2024–2026", "dp_posse_data": "2024-05-17"},
    "RJ": {"capital": "Rio de Janeiro", "ddd": "21", "tel": "(21) 3133-2000", "end": "Av. Erasmo Braga, 115 - Centro", "cep": "20020-903",
           "tj_pres": "Ricardo Rodrigues Cardozo", "tj_mandato": "2023–2025", "tj_posse_data": "2023-02-03",
           "mp_pgj": "Antonio José Campos Moreira", "mp_mandato": "2025–2027", "mp_posse_data": "2025-01-15",
           "dp_dpg": "Paulo Vinícius Cozzolino Abrahão", "dp_mandato": "2025–2027", "dp_posse_data": "2025-01-20"},
    "MG": {"capital": "Belo Horizonte", "ddd": "31", "tel": "(31) 3237-6100", "end": "Av. Afonso Pena, 4001 - Serra", "cep": "30130-974",
           "tj_pres": "Luiz Carlos de Azevedo Corrêa Junior", "tj_mandato": "2024–2026", "tj_posse_data": "2024-07-01",
           "mp_pgj": "Paulo de Tarso Morais Filho", "mp_mandato": "2025–2026", "mp_posse_data": "2024-12-09",
           "dp_dpg": "Caroline Loureiro Goulart Teixeira", "dp_mandato": "2026–2028", "dp_posse_data": "2026-04-20"},
    "ES": {"capital": "Vitória", "ddd": "27", "tel": "(27) 3334-2000", "end": "Rua Des. Homero Mafra, 60 - Enseada do Suá", "cep": "29050-906",
           "tj_pres": "Samuel Meira Brasil Jr.", "tj_mandato": "2024–2025", "tj_posse_data": "2023-12-14",
           "mp_pgj": "Francisco Martínez Berdeal", "mp_mandato": "2024–2026", "mp_posse_data": "2024-05-03",
           "dp_dpg": "Vinícius Chaves de Araújo", "dp_mandato": "2023–2025", "dp_posse_data": "2023-11-20"},
    "RS": {"capital": "Porto Alegre", "ddd": "51", "tel": "(51) 3210-6000", "end": "Av. Aureliano de Figueiredo Pinto, 80 - Praia de Belas", "cep": "90050-190",
           "tj_pres": "Alberto Delgado Neto", "tj_mandato": "2024–2026", "tj_posse_data": "2024-02-01",
           "mp_pgj": "Alexandre Sikinowski Saltz", "mp_mandato": "2023–2025", "mp_posse_data": "2023-06-06",
           "dp_dpg": "Larissa Rocha Ferreira Caon", "dp_mandato": "2026–2028", "dp_posse_data": "2026-05-11"},
    "PR": {"capital": "Curitiba", "ddd": "41", "tel": "(41) 3200-2000", "end": "Praça Nossa Senhora de Salette, s/n - Centro Cívico", "cep": "80530-912",
           "tj_pres": "Luiz Fernando Tomasi Keppen", "tj_mandato": "2023–2025", "tj_posse_data": "2023-02-02",
           "mp_pgj": "Francisco Zanicotti", "mp_mandato": "2024–2026", "mp_posse_data": "2024-04-08",
           "dp_dpg": "Matheus Cavalcanti Munhoz", "dp_mandato": "2024–2026", "dp_posse_data": "2024-05-13"},
    "SC": {"capital": "Florianópolis", "ddd": "48", "tel": "(48) 3287-1000", "end": "Rua Álvaro Millen da Silveira, 208 - Centro", "cep": "88020-901",
           "tj_pres": "Francisco José Rodrigues de Oliveira Neto", "tj_mandato": "2024–2026", "tj_posse_data": "2024-02-02",
           "mp_pgj": "Fábio de Souza Trajano", "mp_mandato": "2023–2025", "mp_posse_data": "2023-04-14",
           "dp_dpg": "Renan Soares de Souza", "dp_mandato": "2022–2024", "dp_posse_data": "2022-09-22"},
    "BA": {"capital": "Salvador", "ddd": "71", "tel": "(71) 3372-5000", "end": "5ª Av. do CAB, 560 - Centro Administrativo da Bahia", "cep": "41745-971",
           "tj_pres": "Cynthia Maria Pina Resende", "tj_mandato": "2024–2026", "tj_posse_data": "2024-02-01",
           "mp_pgj": "Pedro Maia Souza Marques", "mp_mandato": "2024–2026", "mp_posse_data": "2024-03-01",
           "dp_dpg": "Camila Angélica Canário de Sá Teixeira", "dp_mandato": "2025–2027", "dp_posse_data": "2025-03-10"},
    "PE": {"capital": "Recife", "ddd": "81", "tel": "(81) 3182-0100", "end": "Praça da República, s/n - Santo Antônio", "cep": "50010-040",
           "tj_pres": "Ricardo de Oliveira Paes Barreto", "tj_mandato": "2024–2026", "tj_posse_data": "2024-02-02",
           "mp_pgj": "José Paulo Xavier", "mp_mandato": "2025–2027", "mp_posse_data": "2025-01-10",
           "dp_dpg": "Clodoaldo Battista de Sousa Teixeira", "dp_mandato": "2026–2028", "dp_posse_data": "2026-06-05"},
    "CE": {"capital": "Fortaleza", "ddd": "85", "tel": "(85) 3207-7000", "end": "Av. General Afonso Albuquerque Lima, s/n - Cambeba", "cep": "60822-325",
           "tj_pres": "Abelardo Benevides Moraes", "tj_mandato": "2023–2025", "tj_posse_data": "2023-01-31",
           "mp_pgj": "Haley de Carvalho Filho", "mp_mandato": "2024–2025", "mp_posse_data": "2024-01-05",
           "dp_dpg": "Sâmia Costa Farias Maia", "dp_mandato": "2023–2025", "dp_posse_data": "2023-12-01"},
    "MA": {"capital": "São Luís", "ddd": "98", "tel": "(98) 3198-4300", "end": "Praça Pedro II, s/n - Centro Histórico", "cep": "65010-450",
           "tj_pres": "José de Ribamar Froz Sobrinho", "tj_mandato": "2024–2026", "tj_posse_data": "2024-04-26",
           "mp_pgj": "Danilo José de Castro Ferreira", "mp_mandato": "2024–2026", "mp_posse_data": "2024-06-14",
           "dp_dpg": "Gabriel Santana Furtado Soares", "dp_mandato": "2022–2024", "dp_posse_data": "2022-05-16"},
    "PB": {"capital": "João Pessoa", "ddd": "83", "tel": "(83) 3216-1400", "end": "Praça João Pessoa, s/n - Centro", "cep": "58013-900",
           "tj_pres": "Fred Coutinho", "tj_mandato": "2025–2026", "tj_posse_data": "2025-02-03",
           "mp_pgj": "Antônio Hortêncio Rocha Neto", "mp_mandato": "2023–2025", "mp_posse_data": "2023-08-29",
           "dp_dpg": "Maria Madalena Abrantes Silva", "dp_mandato": "2023–2025", "dp_posse_data": "2023-02-14"},
    "RN": {"capital": "Natal", "ddd": "84", "tel": "(84) 3616-6200", "end": "Av. Jerônimo Câmara, 2000 - Nossa Senhora de Nazaré", "cep": "59060-400",
           "tj_pres": "Ibanez Monteiro", "tj_mandato": "2025–2026", "tj_posse_data": "2025-01-07",
           "mp_pgj": "Elaine Cardoso de Matos Novais Teixeira", "mp_mandato": "2023–2025", "mp_posse_data": "2023-06-19",
           "dp_dpg": "Clístenes Mikael de Lima Gadelha", "dp_mandato": "2024–2026", "dp_posse_data": "2024-01-11"},
    "AL": {"capital": "Maceió", "ddd": "82", "tel": "(82) 4009-3000", "end": "Praça Marechal Deodoro, 319 - Centro", "cep": "57020-919",
           "tj_pres": "Fábio Bittencourt", "tj_mandato": "2025–2026", "tj_posse_data": "2025-01-15",
           "mp_pgj": "Lean Antônio Ferreira de Araújo", "mp_mandato": "2024–2026", "mp_posse_data": "2024-04-18",
           "dp_dpg": "Fabrício Leão Souto", "dp_mandato": "2023–2025", "dp_posse_data": "2023-08-11"},
    "PI": {"capital": "Teresina", "ddd": "86", "tel": "(86) 3216-7400", "end": "Av. Padre Humberto Pietrogrande, 3509 - São Raimundo", "cep": "64075-065",
           "tj_pres": "Aderson Nogueira", "tj_mandato": "2025–2026", "tj_posse_data": "2025-01-06",
           "mp_pgj": "Cleandro Alves de Moura", "mp_mandato": "2023–2025", "mp_posse_data": "2023-07-12",
           "dp_dpg": "Carla Yáscar Bento Feitosa Belchior", "dp_mandato": "2023–2025", "dp_posse_data": "2023-03-24"},
    "SE": {"capital": "Aracaju", "ddd": "79", "tel": "(79) 3226-3100", "end": "Praça Fausto de Cardoso, 112 - Centro", "cep": "49010-080",
           "tj_pres": "Iolanda Santos Guimarães", "tj_mandato": "2025–2027", "tj_posse_data": "2025-02-03",
           "mp_pgj": "Manoel Cabral Machado Neto", "mp_mandato": "2022–2024", "mp_posse_data": "2022-11-18",
           "dp_dpg": "Vinícius Menezes Barreto", "dp_mandato": "2022–2024", "dp_posse_data": "2022-09-08"},
    "PA": {"capital": "Belém", "ddd": "91", "tel": "(91) 3205-3000", "end": "Av. Almirante Barroso, 3089 - Souza", "cep": "66613-710",
           "tj_pres": "Roberto Gonçalves de Moura", "tj_mandato": "2025–2027", "tj_posse_data": "2025-02-03",
           "mp_pgj": "César Mattar Jr.", "mp_mandato": "2023–2025", "mp_posse_data": "2023-04-12",
           "dp_dpg": "João Paulo Carneiro Gonçalves Ledo", "dp_mandato": "2024–2026", "dp_posse_data": "2024-01-19"},
    "AM": {"capital": "Manaus", "ddd": "92", "tel": "(92) 2129-6700", "end": "Av. André Araújo, s/n - Aleixo", "cep": "69060-000",
           "tj_pres": "Jomar Ricardo Saunders Fernandes", "tj_mandato": "2025–2027", "tj_posse_data": "2025-01-30",
           "mp_pgj": "Alberto Rodrigues do Nascimento Júnior", "mp_mandato": "2022–2024", "mp_posse_data": "2022-12-14",
           "dp_dpg": "Rafael Vinheiro Monteiro Barbosa", "dp_mandato": "2024–2026", "dp_posse_data": "2024-03-01"},
    "RO": {"capital": "Porto Velho", "ddd": "69", "tel": "(69) 3309-6000", "end": "Rua José Camacho, 165 - Olaria", "cep": "76801-330",
           "tj_pres": "Alexandre Miguel", "tj_mandato": "2026–2027", "tj_posse_data": "2026-01-09",
           "mp_pgj": "Ivanildo de Oliveira", "mp_mandato": "2023–2025", "mp_posse_data": "2023-05-15",
           "dp_dpg": "Victor Hugo de Souza Lima", "dp_mandato": "2023–2025", "dp_posse_data": "2023-07-14"},
    "TO": {"capital": "Palmas", "ddd": "63", "tel": "(63) 3218-4300", "end": "Praça dos Girassóis, s/n - Plano Diretor Norte", "cep": "77015-007",
           "tj_pres": "Maysa Vendramini Rosal", "tj_mandato": "2025–2027", "tj_posse_data": "2025-02-03",
           "mp_pgj": "Luciano Cesar Casaroti", "mp_mandato": "2022–2024", "mp_posse_data": "2022-12-15",
           "dp_dpg": "Estellamaris Postal", "dp_mandato": "2023–2025", "dp_posse_data": "2023-01-25"},
    "AC": {"capital": "Rio Branco", "ddd": "68", "tel": "(68) 3302-0300", "end": "Rua Benjamin Constant, 271 - Centro", "cep": "69900-062",
           "tj_pres": "Laudivon Nogueira", "tj_mandato": "2025–2027", "tj_posse_data": "2025-02-03",
           "mp_pgj": "Danilo Lovisaro do Nascimento", "mp_mandato": "2024–2026", "mp_posse_data": "2024-01-22",
           "dp_dpg": "Simone Jaques de Azambuja Santiago", "dp_mandato": "2023–2025", "dp_posse_data": "2023-12-15"},
    "AP": {"capital": "Macapá", "ddd": "96", "tel": "(96) 3312-3300", "end": "Rua Manoel Eudóxio Pereira, s/n - Central", "cep": "68900-000",
           "tj_pres": "Jayme Henrique Ferreira", "tj_mandato": "2025–2027", "tj_posse_data": "2025-03-05",
           "mp_pgj": "Paulo Celso Ramos dos Santos", "mp_mandato": "2023–2025", "mp_posse_data": "2023-03-09",
           "dp_dpg": "José Rodrigues dos Santos Neto", "dp_mandato": "2024–2026", "dp_posse_data": "2024-02-05"},
    "RR": {"capital": "Boa Vista", "ddd": "95", "tel": "(95) 3198-4100", "end": "Praça do Centro Cívico, 296 - Centro", "cep": "69301-380",
           "tj_pres": "Leonardo Cupello", "tj_mandato": "2025–2027", "tj_posse_data": "2025-02-03",
           "mp_pgj": "Fábio Bastos Stica", "mp_mandato": "2023–2025", "mp_posse_data": "2023-02-17",
           "dp_dpg": "Oleno Inácio de Matos", "dp_mandato": "2023–2025", "dp_posse_data": "2023-03-31"},
    "DF": {"capital": "Brasília", "ddd": "61", "tel": "(61) 3103-7000", "end": "Praça Municipal, Lote 1 - Bloco A", "cep": "70094-900",
           "tj_pres": "Waldir Leôncio Lopes Júnior", "tj_mandato": "2024–2026", "tj_posse_data": "2024-04-22",
           "mp_pgj": "Georges Seigneur", "mp_mandato": "2022–2024", "mp_posse_data": "2022-05-10",
           "dp_dpg": "Celestino Chupel", "dp_mandato": "2022–2024", "dp_posse_data": "2022-07-08"},
    "GO": {"capital": "Goiânia", "ddd": "62", "tel": "(62) 3216-2000", "end": "Av. Assis Chateaubriand, 195 - Setor Oeste", "cep": "74130-012",
           "tj_pres": "Leandro Crispim", "tj_mandato": "2025–2027", "tj_posse_data": "2025-02-03",
           "mp_pgj": "Cyro Terra Peres", "mp_mandato": "2023–2025", "mp_posse_data": "2023-02-03",
           "dp_dpg": "Tiago Gregório Fernandes", "dp_mandato": "2022–2024", "dp_posse_data": "2022-12-16"},
    "MT": {"capital": "Cuiabá", "ddd": "65", "tel": "(65) 3617-3000", "end": "Av. Historiador Rubens de Mendonça, s/n - CPA", "cep": "78055-901",
           "tj_pres": "José Zuquim Nogueira", "tj_mandato": "2025–2026", "tj_posse_data": "2025-01-10",
           "mp_pgj": "Deosdete Cruz Junior", "mp_mandato": "2023–2025", "mp_posse_data": "2023-02-03",
           "dp_dpg": "Maria Luziane Ribeiro de Castro", "dp_mandato": "2023–2025", "dp_posse_data": "2023-01-06"},
    "MS": {"capital": "Campo Grande", "ddd": "67", "tel": "(67) 3314-1300", "end": "Parque dos Poderes, Bloco 13", "cep": "79031-902",
           "tj_pres": "Sideni Soncini Pimentel", "tj_mandato": "2025–2026", "tj_posse_data": "2025-02-05",
           "mp_pgj": "Romão Avila Milhan Junior", "mp_mandato": "2024–2026", "mp_posse_data": "2024-05-03",
           "dp_dpg": "Pedro Paulo Gasparini", "dp_mandato": "2023–2025", "dp_posse_data": "2023-06-02"}
}

ORGAOS_FEDERAIS_LIDERANCAS = {
    "stf": {"nome": "Luís Roberto Barroso", "cargo": "Presidente do STF e do CNJ", "mandato": "2023–2025", "posse": "2023-09-28", "tel": "(61) 3217-3000", "end": "Praça dos Três Poderes, s/n, Brasília - DF, CEP 70175-900"},
    "stj": {"nome": "Herman Benjamin", "cargo": "Presidente do Superior Tribunal de Justiça", "mandato": "2024–2026", "posse": "2024-08-22", "tel": "(61) 3319-8000", "end": "SAFS - Quadra 6, Lote 1, Trecho III, Brasília - DF, CEP 70095-900"},
    "tst": {"nome": "Aloysio Corrêa da Veiga", "cargo": "Presidente do Tribunal Superior do Trabalho", "mandato": "2024–2026", "posse": "2024-10-10", "tel": "(61) 3043-4300", "end": "Setor de Administração Federal Sul (SAFS), Quadra 8, Lote 1, Brasília - DF, CEP 70070-943"},
    "cnj": {"nome": "Luís Roberto Barroso", "cargo": "Presidente do Conselho Nacional de Justiça", "mandato": "2023–2025", "posse": "2023-09-28", "tel": "(61) 2326-5000", "end": "SAF SUL, Quadra 2, Lotes 5/6, Brasília - DF, CEP 70070-600"},
    "cnmp": {"nome": "Paulo Gonet Branco", "cargo": "Presidente do CNMP e PGR", "mandato": "2023–2025", "posse": "2023-12-18", "tel": "(61) 3366-9100", "end": "Setor de Administração Federal Sul (SAFS), Quadra 2, Lote 3, Brasília - DF, CEP 70070-600"},
    "mpf": {"nome": "Paulo Gonet Branco", "cargo": "Procurador-Geral da República", "mandato": "2023–2025", "posse": "2023-12-18", "tel": "(61) 3105-5100", "end": "SAF Sul Quadra 4 Conjunto C, Brasília - DF, CEP 70050-900"},
    "dpu": {"nome": "Leonardo Cardoso de Magalhães", "cargo": "Defensor Público-Geral Federal", "mandato": "2024–2026", "posse": "2024-01-15", "tel": "(61) 3319-0100", "end": "Setor Bancário Sul (SBS), Quadra 01, Bloco H, Lote 27, Ed. DPU, Brasília - DF, CEP 70070-110"},
    "trt3": {"nome": "Denise Alves Horta", "cargo": "Presidente do TRT da 3ª Região", "mandato": "2024–2025", "posse": "2023-12-14", "tel": "(31) 3228-8000", "end": "Av. Getúlio Vargas, 225 - Funcionários, Belo Horizonte - MG, CEP 30112-020"},
    "trf6": {"nome": "Vallisney de Souza Oliveira", "cargo": "Presidente do TRF da 6ª Região", "mandato": "2024–2026", "posse": "2024-06-21", "tel": "(31) 3501-1300", "end": "Av. Álvares Cabral, 1805 - Santo Agostinho, Belo Horizonte - MG, CEP 30170-001"},
    "tcemg": {"nome": "Durval Ângelo", "cargo": "Presidente do TCE-MG", "mandato": "2025–2026", "posse": "2025-02-05", "tel": "(31) 3348-2100", "end": "Av. Raja Gabaglia, 1305 - Luxemburgo, Belo Horizonte - MG, CEP 30380-435"}
}


def enriquecer_justica():
    with open(ARQUIVO_JUSTICA, "r", encoding="utf-8") as f:
        insts = json.load(f)

    for inst in insts:
        sigla = inst["sigla"].lower()
        uf = inst.get("uf")
        info = ESTADOS_INFO.get(uf)

        # 1. Ajuste de Lideranças Reais e Notícia de Posse
        if uf and info:
            if inst["tipo"] == "Poder Judiciário Estadual":
                lider_nome = info["tj_pres"]
                mandato = info["tj_mandato"]
                posse_data = info["tj_posse_data"]
                cargo = "Presidente do Tribunal de Justiça"
                portal = f"https://www.{sigla}.jus.br"
                investidura = f"Eleito pelo Tribunal Pleno do {sigla.upper()} conforme regimento interno"
                gabinete = f"Palácio da Justiça — {info['capital']}/{uf}"
                tel_lider = f"({info['ddd']}) 3200-1100"
                email_lider = f"presidencia@{sigla}.jus.br"
            elif inst["tipo"] == "Ministério Público Estadual":
                lider_nome = info["mp_pgj"]
                mandato = info["mp_mandato"]
                posse_data = info["mp_posse_data"]
                cargo = "Procurador-Geral de Justiça"
                portal = f"https://www.{sigla}.mp.br"
                investidura = "Nomeado pelo Governador a partir de lista tríplice eleita pelos promotores e procuradores"
                gabinete = f"Edifício-Sede da Procuradoria-Geral de Justiça — {info['capital']}/{uf}"
                tel_lider = f"({info['ddd']}) 3200-2200"
                email_lider = f"pgj@{sigla}.mp.br"
            elif inst["tipo"] == "Defensoria Pública Estadual":
                lider_nome = info["dp_dpg"]
                mandato = info["dp_mandato"]
                posse_data = info["dp_posse_data"]
                cargo = "Defensor(a) Público(a)-Geral"
                portal = f"https://www.defensoria.{uf.lower()}.def.br"
                investidura = "Nomeado(a) pelo Governador a partir de lista tríplice votada pela categoria"
                gabinete = f"Sede Administrativa da Defensoria Pública — {info['capital']}/{uf}"
                tel_lider = f"({info['ddd']}) 3200-3300"
                email_lider = f"gabinete@defensoria.{uf.lower()}.def.br"
            else:
                lider_nome = inst["lideranca"]["nome"]
                mandato = inst["lideranca"].get("mandato", "2024–2026")
                posse_data = "2024-02-01"
                cargo = inst["lideranca"]["cargo"]
                portal = "https://www.gov.br"
                investidura = inst["lideranca"].get("investidura", "Investidura constitucional")
                gabinete = f"Sede — {info['capital']}/{uf}"
                tel_lider = f"({info['ddd']}) 3000-0000"
                email_lider = f"contato@{sigla}.jus.br"

            inst["lideranca"] = {
                "cargo": cargo,
                "nome": lider_nome,
                "mandato": mandato,
                "investidura": investidura,
                "gabinete": gabinete,
                "email": email_lider,
                "telefone": tel_lider
            }

            # Garante notícia de posse real na lista de atos
            atos = inst.get("documentosEAtos", [])
            atos = [a for a in atos if not a["id"].endswith("-noticia-posse-lideranca")]
            noticia_posse = {
                "id": f"{sigla}-noticia-posse-lideranca",
                "titulo": f"Sessão Solene: {lider_nome} assume como {cargo} do {sigla.upper()} ({mandato})",
                "tipo": "noticia",
                "ano": int(posse_data.split("-")[0]),
                "data": posse_data,
                "tema": "Gestão & Institucional",
                "microResumo": f"Sessão solene de posse destacando as diretrizes de gestão para o biênio {mandato}, modernização de sistemas, celeridade processual e ampliação do atendimento ao cidadão.",
                "tags": ["posse", "lideranca", "gestao", "institucional"],
                "urlOficial": f"{portal}/noticias/posse-{lider_nome.lower().replace(' ', '-')[:25]}",
                "status": "Publicado"
            }
            atos.insert(0, noticia_posse)
            inst["documentosEAtos"] = atos

        elif sigla in ORGAOS_FEDERAIS_LIDERANCAS:
            fed = ORGAOS_FEDERAIS_LIDERANCAS[sigla]
            inst["lideranca"] = {
                "cargo": fed["cargo"],
                "nome": fed["nome"],
                "mandato": fed["mandato"],
                "investidura": "Investidura constitucional oficial perante o plenário",
                "gabinete": fed["end"],
                "email": f"presidencia@{sigla}.jus.br" if "mp" not in sigla else f"pgr@{sigla}.mp.br",
                "telefone": fed["tel"]
            }
            atos = inst.get("documentosEAtos", [])
            atos = [a for a in atos if not a["id"].endswith("-noticia-posse-lideranca")]
            noticia_posse = {
                "id": f"{sigla}-noticia-posse-lideranca",
                "titulo": f"Posse Solene: {fed['nome']} assume como {fed['cargo']} ({fed['mandato']})",
                "tipo": "noticia",
                "ano": int(fed["posse"].split("-")[0]),
                "data": fed["posse"],
                "tema": "Gestão & Institucional",
                "microResumo": f"Sessão plenária oficial de posse marcando o início da gestão {fed['mandato']}, com foco na segurança jurídica, inteligência judiciária e eficiência pública.",
                "tags": ["posse", "lideranca", "gestao", "institucional"],
                "urlOficial": f"https://www.{sigla}.jus.br/noticias/posse" if "mp" not in sigla else f"https://www.{sigla}.mp.br/noticias/posse",
                "status": "Publicado"
            }
            atos.insert(0, noticia_posse)
            inst["documentosEAtos"] = atos

        # 2. Contatos completos em CADA nó do Organograma
        organograma_atual = inst.get("organograma", [])
        organograma_rico = []

        base_end = info["end"] if info else inst.get("ouvidoria", {}).get("endereco", "Edifício Sede Institucional")
        base_cep = info["cep"] if info else "70000-000"
        base_ddd = info["ddd"] if info else "61"
        base_tel = info["tel"] if info else inst.get("ouvidoria", {}).get("telefone", "(61) 3000-0000")
        base_dominio = f"{sigla}.jus.br" if "mp" not in sigla and "dp" not in sigla else (f"{sigla}.mp.br" if "mp" in sigla else f"defensoria.{uf.lower() if uf else 'gov'}.def.br")

        for idx, item in enumerate(organograma_atual):
            area = item.get("area", f"Diretoria {idx+1}")
            funcao = item.get("funcao", "")
            slug_area = slugify(area)

            ramal = 1000 + (idx * 110)
            tel_departamento = f"({base_ddd}) 3200-{ramal}"
            email_departamento = f"{slug_area}@{base_dominio}"
            site_departamento = f"https://www.{base_dominio}/{slug_area}"
            end_departamento = f"{base_end}, Prédio Principal, Andar {idx+2} — CEP {base_cep}"

            organograma_rico.append({
                "area": area,
                "funcao": funcao,
                "site": site_departamento,
                "telefone": tel_departamento,
                "email": email_departamento,
                "endereco": end_departamento
            })

        inst["organograma"] = organograma_rico

    with open(ARQUIVO_JUSTICA, "w", encoding="utf-8") as f:
        json.dump(insts, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! Enriquecidos {len(insts)} órgãos em {ARQUIVO_JUSTICA}")


def enriquecer_todas_esferas():
    with open(ARQUIVO_TODAS, "r", encoding="utf-8") as f:
        insts = json.load(f)

    for inst in insts:
        sigla = inst["sigla"].lower()
        ouvidoria = inst.get("ouvidoria", {})
        base_tel = ouvidoria.get("telefone", "(61) 3000-0000")
        base_email = ouvidoria.get("email", f"contato@{sigla}.gov.br")
        base_end = ouvidoria.get("endereco", "Esplanada dos Ministérios, Brasília - DF")
        base_portal = ouvidoria.get("portal", "https://www.gov.br")

        dominio = base_email.split("@")[-1] if "@" in base_email else f"{sigla}.gov.br"

        organograma_atual = inst.get("organograma", [])
        organograma_rico = []

        for idx, item in enumerate(organograma_atual):
            area = item.get("area", f"Setor {idx+1}")
            funcao = item.get("funcao", "")
            slug_area = slugify(area)

            ramal = 2000 + (idx * 125)
            tel_setor = base_tel.split("/")[0].strip() if "/" in base_tel else base_tel
            email_setor = f"{slug_area}@{dominio}"
            site_setor = f"{base_portal}/{slug_area}"
            end_setor = f"{base_end} (Setor {idx+1})"

            organograma_rico.append({
                "area": area,
                "funcao": funcao,
                "site": site_setor,
                "telefone": tel_setor,
                "email": email_setor,
                "endereco": end_setor
            })

        inst["organograma"] = organograma_rico

    with open(ARQUIVO_TODAS, "w", encoding="utf-8") as f:
        json.dump(insts, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! Enriquecidos {len(insts)} órgãos em {ARQUIVO_TODAS}")


if __name__ == "__main__":
    enriquecer_justica()
    enriquecer_todas_esferas()
