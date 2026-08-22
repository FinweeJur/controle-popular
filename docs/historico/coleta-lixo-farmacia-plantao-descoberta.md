# Descoberta — coleta de lixo e farmácia de plantão (6 cidades)

> Sessão 2026-08-11. Ponto de partida: nenhuma das 6 cidades (Araçuaí, Belo
> Horizonte, Betim, Diamantina, Itinga, São Paulo) tinha fonte confirmada
> pra `coleta_lixo` ou `farmacias_plantao`. Este arquivo registra o que foi
> tentado por cidade/tema, pra quem retomar não repetir o caminho.

## Resumo

| Cidade | Coleta de lixo | Farmácia de plantão |
|---|---|---|
| Betim | **Coletor escrito** — `etl/betim/etl/prefeitura/coleta_lixo.py` | Não encontrado |
| Belo Horizonte | Fonte rica achada, coletor **não** escrito (granularidade não bate) | Não encontrado |
| São Paulo | Ferramenta existe, API não identificada nesta sessão | Não encontrado |
| Araçuaí | Não encontrado | Não encontrado |
| Diamantina | Não encontrado | Não encontrado |
| Itinga | Não encontrado (achado lateral: prefeitura roda Simple System) | Não encontrado (idem) |

---

## Betim — coleta de lixo — CONFIRMADO, coletor escrito

Fonte: planilha XLSX oficial, linkada em
`https://www.betim.mg.gov.br/dias-e-horarios-da-coleta-de-lixo-domiciliar`
("Confira aqui os dias e horários..."). 39 abas de "setor" (coleta comum) +
1 aba "COLETA SELETIVA". Sem autenticação, `GET` puro.

Coletor: `etl/betim/etl/prefeitura/coleta_lixo.py` — todas as armadilhas
medidas ao vivo (URL do arquivo instável, mesmo bairro em setores com
horários diferentes, erro de preenchimento humano numa célula, grafias
inconsistentes, títulos de aba errados, entradas que são pontos de
referência e não bairro) estão documentadas no docstring do módulo, não
repetidas aqui. Rodado nesta sessão contra o banco local: 186 linhas
`comum` + 44 `seletiva` = 230 linhas, 0 duplicatas em
`(bairro, tipo, dias_semana, horario)`, idempotente (segunda rodada gravou
os mesmos totais).

**Achado secundário, não usado pelo coletor:** Betim também tem uma API
GeoWeb sem auth por ENDEREÇO (não por bairro) —
`GET sistemas.betim.mg.gov.br/geoweb/coletaLixo/GetInfoColetaLixo?cep={cep sem hífen}&num={número}`
devolve `{ondeEstou: {bairroOficial, logradouroMaisProximo, ...}, normal:
{turno, frequencia}, seletiva: {turno, frequencia}}`. Testado ao vivo:
`cep=32600035&num=100` (Av. Governador Valadares, Centro) devolveu
`normal.turno=NOTURNO, normal.frequencia=DIÁRIO` e
`seletiva.turno=DIURNO, seletiva.frequencia=QUARTA FEIRA`. Útil pra um
recurso futuro de "digite sua rua" mais preciso que a agenda por bairro;
fora do escopo desta rodada porque o schema atual (`coleta_lixo`) é por
bairro, não por endereço, e a planilha já cobre isso mais diretamente. O
mesmo GeoWeb também expõe `infbasica/GetBairros` (340 bairros/loteamentos
cadastrados, só id+nome, sem geometria) e um GeoServer
(`https://zeus.betim.mg.gov.br/geoserver/betim/wms`, workspace `betim`) cujo
WFS **não** tem camada de coleta (só `ARTGRADE500X300`, `PDIMACROZONEAMENTO`
etc. — conferido via `GetCapabilities`).

## Belo Horizonte — coleta de lixo — fonte rica, coletor NÃO escrito

`https://geoservicos.pbh.gov.br/geoserver/` (achado via
`bhmap.pbh.gov.br` → `v2/api/visualizador/.../js` → constante `Geoserver`
no JS de config) expõe, sem autenticação, via WFS `GetFeature`
(`outputFormat=application/json`):

- `ide_bhgeo:COLETA_RESIDUOS` — 100.764 feições, uma por trecho/quadra:
  `NOME_DISTRITO_COLETA` (código do distrito de coleta, ex. "S1D",
  "NE23B" — não é nome de bairro), `PROGRAMACAO` (texto livre, ex. "Seg a
  Sáb", "Ter, Qui e Sáb"), `TURNO` (Diurno/Noturno), `NUM_QUADRA`.
- `ide_bhgeo:COLETA_SELETIVA_PORTA_PORTA` — camada irmã pra seletiva porta
  a porta (schema não conferido em detalhe, mesma família de layer).
- `app_servicos:COLETARESIDUOS_ENDERECO` — 789.548 feições, uma por
  endereço: `NOME_LOGRADOURO`, `DESC_FREQUENCIA_COLETA` (ex. "Seg a Sáb"),
  `COD_FREQUENCIA_COLETA`. Também sem campo de bairro.

**Por que não virou coletor nesta rodada:** nenhuma das camadas testadas
tem atributo de BAIRRO — a BH organiza a coleta por "distrito de coleta"
(código de rota) e por logradouro, não por bairro administrativo. Popular
`coleta_lixo` (que é por bairro) exigiria um cruzamento espacial
(ponto-em-polígono ou interseção de linha) contra uma camada de bairro —
`ide_bhgeo:BAIRRO_OFICIAL` existe no mesmo GeoServer (confirmado no
`GetCapabilities`, schema não inspecionado) — usando `shapely`/`geopandas`,
que não estão em `etl/betim/requirements.txt` hoje. Registrado aqui como o
caminho concreto pra próxima sessão: baixar `BAIRRO_OFICIAL` +
`COLETA_RESIDUOS` (ou `COLETARESIDUOS_ENDERECO`, mais fino), fazer o join
espacial, agregar por bairro pegando a `PROGRAMACAO`/`TURNO` dominante (ou
gravando mais de uma linha por bairro quando ele cai em mais de um
distrito, do jeito que o coletor de Betim já faz para `(bairro, horário)`).

Query de teste usada (funciona sem chave/token):

```
https://geoservicos.pbh.gov.br/geoserver/ows?service=wfs&version=2.0.0&request=GetFeature&typeName=ide_bhgeo:COLETA_RESIDUOS&outputFormat=application/json&count=3
```

## São Paulo — coleta de lixo — ferramenta existe, API não identificada

A Prefeitura direciona pra `https://coleta.prefeitura.sp.gov.br/`
("Zelando pela Cidade" — digitar CEP ou nome de rua, comum/seletiva/
cata-bagulho, cobre os 96 distritos). A página é um portal **Liferay**
pesado (`psp-js`, múltiplos bundles combinados via `/combo?...`); o HTML
estático não carrega formulário nem endpoint algum visível (`curl` puro
devolve só o shell do Liferay, sem o widget de busca — ele é montado por um
portlet client-side não capturado nesta sessão). Tentativa de achar o
bundle certo (`o/psp-js/main.js`, 942KB) não tinha nenhuma ocorrência da
palavra "coleta" — bundle errado/genérico, não o do portlet de coleta.

**Caminho não percorrido, por quê:** o jeito confiável de achar a API real
é abrir a página num browser de verdade, preencher o formulário e ler a
aba Network (mesma técnica usada em Betim/BH) — o Browser Pane desta sessão
bateu no teto de abas (compartilhado com outros agentes rodando em
paralelo) e não foi liberado a tempo. Não force via engenharia reversa de
bundle: o Liferay carrega dezenas de módulos sob demanda, achar o certo às
cegas gastaria mais tempo que o orçamento desta rodada.

**Verificado e descartado:** GeoSampa (`wfs.geosampa.prefeitura.sp.gov.br`)
tem camadas `geoportal:sac_*` sobre coleta (reclamação, remoção de
contêiner, implantação de coleta seletiva) — são registros do canal SAC/156
georreferenciados, não a programação da coleta em si.

**Ação sugerida pra quem retomar:** abrir
`https://coleta.prefeitura.sp.gov.br/` num browser real, preencher CEP,
capturar a chamada de rede (provavelmente um portlet REST do próprio
Liferay, `/o/<algum-módulo>/...` ou um backend separado tipo
`api.prefeitura.sp.gov.br`). Alternativa: as concessionárias (Loga cobre
noroeste/norte/centro, Ecourbis cobre sul/leste) podem publicar dado
próprio — não pesquisado nesta rodada.

## Araçuaí, Diamantina, Itinga — coleta de lixo — não encontrado

Busca web (prefeitura + notícia local) não achou cronograma estruturado
(tabela, PDF, API) em nenhuma das três. Diamantina: reportagem confirma que
a Secretaria de Obras "fornece o cronograma periodicamente" mas só por
telefone/e-mail — não publicado. Itinga: uma notícia isolada menciona dias
de coleta só do bairro Mutirão — não é fonte estruturada/mantida, é um
post pontual. Araçuaí: nada achado além do contato geral da prefeitura.

## Todas as 6 cidades — farmácia de plantão — não encontrado

Tentado, sem sucesso, em todas as 6:

- **CRF-MG** (`site.crfmg.org.br`) e **CRF-SP** (`portal.crfsp.org.br`):
  são conselhos de registro profissional (inscrição de farmacêutico/CR),
  não publicam escala de plantão por cidade — confirma a suposição inicial
  da tarefa de que valeria checar, mas o CRF não é o dono desse dado.
- **Betim**: página de Vigilância à Saúde (`/portal/secretarias-paginas/
  116/vigilancia-a-saude/`) lista a seção "Vigilância Sanitária de
  Medicamentos" só com e-mail de contato, sem link de escala. Portal de
  dados abertos (`/portal/dados-abertos/`) não tem dataset de farmácia.
  Portal de transparência REST (`servicos.betim.mg.gov.br/transparencia/
  rest/APIServico/ListarServicos`) é só módulo fiscal, sem serviço de
  saúde. Busca por portaria de plantão farmacêutico no Diário Oficial não
  achou nada específico via busca web (não tentado: varrer o Diário Oficial
  PDF por PDF — ver `etl.prefeitura.b3106705`/`legislacao.py` pra como o
  Diário é lido, se alguém quiser tentar).
- **Belo Horizonte**: página de Assistência Farmacêutica
  (`prefeitura.pbh.gov.br/saude/.../assistencia-farmaceutica/farmacia`) e
  Vigilância Sanitária (`.../vigilancia/vigilancia-sanitaria`) não mencionam
  plantão.
- **São Paulo**: só agregadores privados (farmaciasdeplantao.app.br,
  farmacias24horas.com.br) — não são fonte oficial, dado não confiável pra
  citar como "a farmácia X está de plantão hoje" (o app poderia estar
  errado sem qualquer responsabilidade da prefeitura).
- **Araçuaí, Diamantina, Itinga**: nada nos sites das prefeituras. Achado
  lateral em Itinga: `www.itinga.mg.gov.br` (o domínio da PREFEITURA, não
  da câmara) também roda **Simple System** — o mesmo CMS que
  `etl/camaras/simplesystem.py` já lê para a Câmara de Itinga (fornecedor
  `pub.simpless.com.br`, ver docstring daquele módulo). Confirmado: `POST
  https://www.itinga.mg.gov.br/publicacao/listarCategoria/` responde com
  as categorias da prefeitura (CONTRATOS, DECRETOS, LEI, PORTARIAS, ...).
  **Não tem categoria de saúde/farmácia/vigilância sanitária** entre as 33
  categorias existentes — só "PORTARIAS" (genérica, 500+ itens, sem ementa
  no endpoint de listagem, só "PORTARIA Nº NNN/AAAA") poderia conter uma
  portaria de plantão farmacêutico escondida, mas não dá pra achar sem ler
  cada PDF (fora do escopo desta rodada — teria que abrir os 500 PDFs ou
  achar um endpoint de detalhe que exponha ementa, que a Câmara tem
  — `listarGridDocumento` — mas não confirmado pra prefeitura).

**Conclusão geral:** no Brasil, a escala de farmácia de plantão costuma ser
regulada por portaria/decreto MUNICIPAL (às vezes delegada ao sindicato
patronal local do comércio, não ao conselho profissional) — não existe um
sistema estadual ou de conselho que centralize isso pras 6 cidades deste
projeto. Sem uma fonte estruturada por cidade, popular `farmacias_plantao`
hoje significaria digitar dado manualmente (curadoria), que é uma decisão
de produto pendente, não uma pesquisa de fonte a mais.
