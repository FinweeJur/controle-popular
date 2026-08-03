"""Fontes próprias da Prefeitura de Belo Horizonte (id_municipio 3106200).

Belo Horizonte publica em DOIS sistemas distintos, e a diferença de volume
entre eles é grande o bastante para mudar o que o portal consegue mostrar:

1. **CKAN** (`ckan.pbh.gov.br`) — o portal de dados abertos oficial, 602
   datasets de 26 órgãos. Bom para o que não existe no GRP: escolas,
   terceirizados, passagens aéreas, frota.

2. **GRP Ábaco** (`grp.pbh.gov.br/bh_prd_transparencia`) — o sistema de
   transparência administrativa. Não é anunciado como API, mas o front
   AngularJS conversa com um servlet REST genérico e sem autenticação. É
   ele que tem o dado bom: 6.832 contratos de toda a PBH (o CKAN só tem os
   3/mês da PBH Ativos S.A.), 5.439 licitações, folha de 79 mil vínculos
   com decomposição por rubrica (o CKAN traz 45 mil só da Administração
   Direta, e só o total).

**Os dois estão atrás de um WAF (GoCache) que bloqueia por fingerprint de
TLS, não por User-Agent.** `requests` recebe 403 "Acesso Bloqueado" mesmo
com cabeçalhos de Chrome completos; `curl` passa com os mesmos cabeçalhos.
Daí `curl_cffi` (`impersonate="chrome"`) em vez de `requests` em todo este
pacote — ver `cliente.py`.
"""
