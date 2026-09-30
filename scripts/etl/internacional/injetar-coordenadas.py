#!/usr/bin/env python3
"""
scripts/etl/internacional/injetar-coordenadas.py
Adiciona latitude, longitude e localidadeFoco aos 56 documentos desclassificados em gerar-desclassificados-g20.mts.
"""

import re

COORDENADAS_MAP = {
    "DOC-CIA-1974-CONDOR": (-15.7939, -47.8828, "Brasília, DF, Brasil (Gabinete Geisel / CIA)"),
    "DOC-CIA-1964-BROTHER-SAM": (-22.9068, -43.1729, "Rio de Janeiro, RJ, Brasil (Baía de Guanabara)"),
    "DOC-SNI-1976-CONDOR": (-34.6037, -58.3816, "Buenos Aires, Argentina (Rede Condor Cone Sul)"),
    "DOC-DSI-1981-SERRA-PELADA": (-5.9458, -49.6644, "Serra Pelada / Curionópolis, PA, Brasil"),
    "DOC-UK-1983-JIC-NUCLEAR": (-23.0067, -44.3181, "Angra dos Reis, RJ, Brasil (Usinas Nucleares / JIC)"),
    "DOC-CSIS-1989-MINING-AMAZON": (-3.1190, -60.0217, "Manaus / Amazônia Legal, Brasil (CSIS)"),
    "DOC-STASI-1977-KWU-NUCLEAR": (50.7374, 7.0982, "Bonn / Erlangen, Alemanha (KWU / Stasi)"),
    "DOC-DGSE-1985-ALCANTARA": (-2.4089, -44.4144, "Alcântara, MA, Brasil (Centro Espacial CLA)"),
    "DOC-ITALIA-1975-GLADIO-AMAZON": (41.9028, 12.4964, "Roma, Itália (Sede do SISMI / Operação Gladio)"),
    "DOC-ASIO-1972-MINERALS": (-35.2809, 149.1300, "Canberra, Austrália (ASIO / Mineração Global)"),
    "DOC-ARGENTINA-1977-CONDOR": (-34.6037, -58.3816, "Buenos Aires, Argentina (Batallón 601)"),
    "DOC-KGB-1969-AI5": (55.7558, 37.6173, "Moscou, Rússia (Lubyanka / Primeira Diretoria KGB)"),
    "DOC-FBI-1968-UNREST": (38.8951, -77.0364, "Washington, D.C., EUA (Quartel-General do FBI)"),
    "DOC-CSN-1973-ITAIPU": (-25.4089, -54.5889, "Foz do Iguaçu, PR, Brasil (Usina Binacional de Itaipu)"),
    "DOC-CIA-1984-NIE-EXPANSION": (38.9517, -77.1467, "Langley, Virgínia, EUA (Sede Central da CIA)"),
    "DOC-SSA-1979-SOUTH-ATLANTIC": (-25.7479, 28.2293, "Pretória, África do Sul (DANS / Atlântico Sul)"),
    "DOC-GIP-1983-OIL-COMMODITIES": (24.7136, 46.6753, "Riade, Arábia Saudita (GIP / Comércio de Petróleo)"),
    "DOC-MSS-1974-BEIJING-BRASILIA": (39.9042, 116.4074, "Pequim, China (Ministério da Segurança do Estado MSS)"),
    "DOC-KCIA-1978-STEEL-SUPPLY": (37.5665, 126.9780, "Seul / Pohang, Coreia do Sul (KCIA / POSCO)"),
    "DOC-CESID-1981-CONO-SUR": (40.4168, -3.7038, "Madri, Espanha (CESID / Redes Diplomáticas)"),
    "DOC-BVD-1979-ROTTERDAM-COMMODITIES": (51.9244, 4.4777, "Roterdã, Países Baixos (Porto de Roterdã e BVD)"),
    "DOC-RAW-1979-NON-ALIGNED-NUCLEAR": (28.6139, 77.2090, "Nova Délhi, Índia (R&AW / Não-Alinhados)"),
    "DOC-BAKIN-1982-TROPICAL-FORESTS": (-6.2088, 106.8456, "Jacarta, Indonésia (BAKIN / Soberania Florestal)"),
    "DOC-MOFA-1980-CARAJAS-INVESTMENT": (35.6762, 139.6503, "Tóquio, Japão (Kasumigaseki / Mitsui / PSIA)"),
    "DOC-DFS-1975-EXILADOS-UNAM": (19.4326, -99.1332, "Cidade do México, México (DFS / Vigilância UNAM)"),
    "DOC-PIDE-1973-LIGACOES-DOPS": (38.7223, -9.1393, "Lisboa, Portugal (PIDE/DGS / Prontuários DOPS)"),
    "DOC-MIT-1985-BRAZIL-DEFENSE": (39.9334, 32.8597, "Ancara, Turquia (MIT / Cooperação Militar)"),
    "DOC-HAEU-1992-MINERAL-SAFEGUARDS": (50.8503, 4.3517, "Bruxelas, Bélgica (Comissão Europeia / HAEU)"),
    "DOC-GLOBAL-USA-1962-MISSILES": (22.8167, -83.0500, "San Cristóbal, Pinar del Río, Cuba (Crise dos Mísseis)"),
    "DOC-GLOBAL-GBR-1963-PHILBY": (33.8938, 35.5018, "Beirute, Líbano (Fuga de Kim Philby / MI6)"),
    "DOC-GLOBAL-DEU-1961-BERLIN-WALL": (52.5075, 13.3904, "Berlim (Checkpoint Charlie), Alemanha"),
    "DOC-GLOBAL-FRA-1957-ALGERIA-BATTLE": (36.7538, 3.0588, "Argel (Casbah), Argélia (Batalha de Argel)"),
    "DOC-GLOBAL-ITA-1980-BOLOGNA-MASSACRE": (44.5058, 11.3431, "Bolonha, Itália (Estação Central / Estratégia da Tensão)"),
    "DOC-GLOBAL-CAN-1959-DEW-LINE": (68.3581, -133.7228, "Inuvik / Ártico Canadense (Linha DEW / NORAD)"),
    "DOC-GLOBAL-RUS-1979-AFGHANISTAN": (34.5553, 69.2075, "Cabul, Afeganistão (Palácio Tajbeg / Spetsnaz)"),
    "DOC-GLOBAL-CHN-1972-NIXON-BEIJING": (39.9042, 116.4074, "Pequim (Zhongnanhai), China (Nixon-Mao)"),
    "DOC-GLOBAL-JPN-1960-ANPO-SECURITY": (35.6762, 139.7547, "Tóquio, Japão (Dieta Nacional / Protestos ANPO)"),
    "DOC-GLOBAL-IND-1974-SMILING-BUDDHA": (27.0911, 71.7528, "Pokhran, Rajastão, Índia (Teste Nuclear)"),
    "DOC-GLOBAL-ZAF-1975-SAVANNAH-ANGOLA": (-12.3500, 15.7333, "Huambo, Angola (Operação Savannah)"),
    "DOC-GLOBAL-SAU-1973-OPEC-EMBARGO": (24.7136, 46.6753, "Riade, Arábia Saudita (Embargo da OPEP)"),
    "DOC-GLOBAL-ARG-1982-RATTENBACH-MALVINAS": (-51.6977, -57.8517, "Port Stanley / Malvinas (Comissão Rattenbach)"),
    "DOC-GLOBAL-AUS-1966-VIETNAM-DEPLOYMENT": (10.5167, 107.2167, "Nui Dat, Vietnã (Base Militar Australiana)"),
    "DOC-GLOBAL-KOR-1968-BLUE-HOUSE-PUEBLO": (37.5866, 126.9747, "Seul (Casa Azul), Coreia do Sul"),
    "DOC-GLOBAL-ESP-1981-GOLPE-23F": (40.4168, -3.6961, "Madri (Congresso dos Deputados), Espanha"),
    "DOC-GLOBAL-NLD-1947-INDONESIA-ACTIONS": (-7.2575, 112.7521, "Java / Surabaya, Indonésia (Operações Coloniais)"),
    "DOC-GLOBAL-IDN-1965-G30S-PURGE": (-6.2088, 106.8456, "Jacarta, Indonésia (Movimento 30 de Setembro)"),
    "DOC-GLOBAL-MEX-1968-TLATELOLCO": (19.4517, -99.1369, "Praça de Tlatelolco, Cidade do México"),
    "DOC-GLOBAL-PRT-1974-CRAVOS-REVOLUTION": (38.7119, -9.1436, "Largo do Carmo, Lisboa, Portugal"),
    "DOC-GLOBAL-TUR-1974-CYPRUS-OPERATION": (35.1856, 33.3823, "Kyrenia / Nicósia, Chipre (Operação Atila)"),
    "DOC-GLOBAL-EUR-1956-SPAAK-ROME": (50.8503, 4.3517, "Val Duchesse / Bruxelas, Bélgica (Relatório Spaak)"),
    "DOC-GLOBAL-GLEIF-TRANSNATIONAL-LEI": (47.3769, 8.5417, "Zurique / Basileia, Suíça (Sede Global GLEIF)"),
    "DOC-GLOBAL-GRID-TAILINGS-PORTAL": (58.3405, 8.5934, "Arendal, Noruega (GRID-Arendal UNEP)"),
    "DOC-GLOBAL-CLIMATE-TRACE-FACILITIES": (37.7749, -122.4194, "São Francisco, Califórnia, EUA (Climate TRACE)"),
    "DOC-GLOBAL-OPENALEX-MINING-EVIDENCE": (38.8951, -77.0364, "Washington, D.C., EUA (OpenAlex / OurResearch)"),
    "DOC-GLOBAL-SABIN-CLIMATE-LITIGATION": (40.8075, -73.9626, "Nova York (Columbia Law), EUA (Sabin Center)"),
    "DOC-GLOBAL-NATIVE-LAND-MAPPING": (49.2827, -123.1207, "Vancouver, BC, Canadá (Native Land Digital)"),
}

caminho = "scripts/etl/internacional/gerar-desclassificados-g20.mts"
with open(caminho, "r", encoding="utf-8") as f:
    conteudo = f.read()

modificado = 0
for doc_id, (lat, lng, loc) in COORDENADAS_MAP.items():
    # Procura o bloco com esse id e injeta latitude, longitude, localidadeFoco antes do fechamento }
    # Padrão: id: "DOC-..." até o próximo contextoBrasil: "..."
    pattern = rf'(id:\s*"{doc_id}",[\s\S]*?contextoBrasil:\s*"[^"]*",)'
    m = re.search(pattern, conteudo)
    if m:
        trecho_original = m.group(1)
        if "latitude:" not in trecho_original:
            trecho_novo = trecho_original + f'\n    latitude: {lat},\n    longitude: {lng},\n    localidadeFoco: "{loc}",'
            conteudo = conteudo.replace(trecho_original, trecho_novo, 1)
            modificado += 1
        else:
            print(f"Aviso: {doc_id} já possuía latitude.")
    else:
        print(f"Erro: {doc_id} não encontrado no arquivo.")

with open(caminho, "w", encoding="utf-8") as f:
    f.write(conteudo)

print(f"Sucesso: {modificado} documentos enriquecidos com coordenadas geográficas e localidadeFoco.")
