# Ambiental — plano de execução das quatro seções

> Escrito em 2026-08-10, a pedido do usuário. **A descoberta de fontes já foi
> feita** e está em [`F0-discovery.md`](F0-discovery.md): endpoints testados
> contra o serviço real, com data de verificação e licença. Este documento não
> repete aquele — ele diz **em que ordem escrever os coletores** e o que cada
> um já se sabe que vai encontrar pela frente.

## O estado real, medido em 2026-08-10

A página `/ambiental` está no ar e se declara "em construção". O que ela
anuncia contra o que existe no banco:

| Seção | A página anuncia | No banco | Tabela |
|---|---:|---:|---|
| Reuniões do COPAM | 454 reuniões | **0** | não existe |
| Licenciamento | 19.162 licenças | **0** | não existe |
| Barragens | 249 em Minas | **4** (FEAM) + 52 (SNISB) | existe |
| Legislação | federal e estadual | **0** | não existe |

Os números anunciados são o que a FONTE publica — vieram do censo da F0, não
de coleta. Isso é honesto no contexto ("em construção", com badge de fase),
mas lido rápido soa como acervo. **Enquanto a seção não tiver dado, o número
da fonte deve vir com o verbo no futuro** — "a fonte publica 454 reuniões",
não "454 reuniões".

E o que já existe de ambiental no portal, funcionando, é por CIDADE e não por
estado: `/[municipio]/meio-ambiente` (autuações do CAP, barragens, Paraopeba).
O CAP fechou em 2026-08-10 com **78.039 linhas / 12.411 autos** nas cinco
cidades mineiras.

---

## Ordem, e por que esta

O critério não é dificuldade: é **quanto cada seção muda a decisão de alguém**.

1. **Barragens** — completar. É a única com tabela e tela; falta o inventário
   inteiro de Minas em vez das 4 linhas das cidades do portal.
2. **COPAM** — a "dor nº 1" da F0. É a única seção que age **antes** da
   decisão: a pauta sai com antecedência, e hoje não dá para saber o que será
   julgado sobre a sua cidade sem abrir PDF por PDF.
3. **Licenciamento** — o maior volume e o que dá contexto às outras duas.
4. **Legislação** — o que menos muda e o mais fácil de consultar na fonte.

---

## F5 · Barragens — completar o que já existe

**Fontes, já verificadas:**
- FEAM, inventário anual: `feam.br/documents/d/feam/lista-de-barragens-2024-xlsx`
  (XLSX + PDF por ano, 2008–2024). Resolve a condição de estabilidade.
- ANM, dashboard público:
  `geo.anm.gov.br/arcgis/rest/services/Producao/Barragens_Dashboard_Publico/MapServer/0/query?where=ATIVO>0&outFields=*&f=json`

**Tarefas:**
1. ~~Rodar o coletor da FEAM para as 249 barragens de Minas~~ — **feito em
   2026-08-11** (migration `0057_ref_municipios_mg.sql` + coletores
   reescritos): `feam_barragens` tem **249/249**, era 4. O bloqueio nunca foi
   a FK da tabela — era `carregar_municipio` abortando para qualquer cidade
   fora das 6 do portal; a correção soltou a FK de `municipios` para um
   catálogo novo (`ref_municipios_mg`, as ~853 cidades de MG) e o coletor
   passou a resolver o município de cada barragem pelo nome que a FEAM
   grafa, casamento normalizado + `pg_trgm` para erro de digitação.
2. ~~Idem SNISB~~ — **feito em 2026-08-11**: `snisb_barragens` tem
   **2.212/2.212** em MG (mais 28 de São Paulo, preexistentes e preservadas
   — o SNISB é nacional, ver o cuidado abaixo). Era 52 (24 de MG + 28 de SP).
3. Decidir o recorte da tela estadual: `/ambiental/barragens` com filtro por
   município, ou manter só a página por cidade. **A tela estadual só se
   justifica se o dado for estadual** — agora é. Não fiz esta parte: é
   decisão de produto/UI, fora do escopo da migration de dado.
4. Trocar o número do card assim que o inventário entrar — dado já está no
   banco; card não foi tocado nesta rodada (não achei JOIN nem contador de
   card lendo `feam_barragens`/`snisb_barragens` fora das duas queries por
   cidade em `lib/db/queries/betim.ts`, que já leem a tabela cheia).

**Cuidado registrado na F0:** o SNISB é nacional, não só mineiro. Somar SNISB
e FEAM sem deduplicar conta a mesma barragem duas vezes.

---

## F3 · COPAM — a pauta antes da decisão

**Fonte:** `sistemas.meioambiente.mg.gov.br/reunioes/reuniao-copam/index-externo`

> **Teste de viabilidade feito em 2026-08-11, ver `F0-discovery.md` §14: ✅ VIÁVEL.**
> 21 reuniões testadas ao vivo, 97,2% dos itens substantivos com município recuperado
> (100% dos que de fato tratam de um lugar — os "5%" restantes são itens administrativos
> que corretamente não têm município, não falha de extração). **O método muda a tarefa 3
> abaixo:** o município sai de um campo estruturado (`<td>Município</td>`) na própria
> página de detalhe, sem abrir PDF — a leitura de PDF (1 por reunião, a Pauta consolidada,
> não os anexos individuais) só entra como reforço nas reuniões onde esse campo veio
> vazio (§14.3 lista as armadilhas: item pode ter mais de um município, chave de junção
> é por prefixo numérico, classificador de "item administrativo" precisa de várias
> grafias). Isto é diferente do que a tarefa 3 original supunha ("ler o texto da âncora").

**Tarefas:**
1. Migration: `copam_reunioes` (data, câmara técnica, situação, link) e
   `copam_pauta_itens` (processo, empreendimento, município, tipo de decisão,
   link do anexo).
2. Coletor da lista de reuniões. Paginação e filtro por período.
3. Coletor dos anexos de pauta. **A armadilha está registrada na F0: o rótulo
   do anexo mora no texto da âncora, não no nome do arquivo** — ler o nome do
   PDF classifica errado.
4. Extrair o município de cada item da pauta. É o que permite responder "o que
   o COPAM vai decidir sobre a sua cidade" — sem isso a seção não cumpre o
   título que já está no ar.
5. Tela `/ambiental/copam` + bloco em `/[municipio]/meio-ambiente`.

**O que decide se vale a pena:** se o item da pauta não trouxer município de
forma confiável, a seção vira lista de reuniões — útil, mas não é a promessa.
Medir isso numa amostra ANTES de escrever a tela.

---

## F4 · Licenciamento — o volume

**Fontes:** IDE-Sisema WFS (`geoserver.meioambiente.mg.gov.br/IDE/ows`,
anônimo, `Fees: NONE`) e o SLA (`ecosistemas.meioambiente.mg.gov.br`, Next.js
com BFF) para a fila viva. A chave de junção WFS ↔ SLA **já foi resolvida** na
F0 §2.1.

**Tarefas:**
1. Migration `licencas_ambientais`, com o setor vindo da **Deliberação
   Normativa COPAM 217/2017** — taxonomia oficial, não classificação inventada
   aqui.
2. Coletor WFS paginado. A F0 §1.1 registra "a armadilha que decide o desenho
   do coletor" — ler antes de escrever a primeira linha.
3. Filtros da tela: município, empresa, setor, modalidade, classe, potencial
   poluidor, período.
4. **Corte de LGPD, e este é decisão do usuário, não minha:** a F0 §1.3
   registra um "achado de privacidade" — documento do titular exposto na
   fonte. Definir o que entra antes de coletar, não depois.

---

## F6 · Legislação

**Fontes:** ALMG dados abertos (`dadosabertos.almg.gov.br/api/v2/`, JSON, sem
auth), SEMAD Banco de Legislação Ambiental (Liferay, paginação já verificada) e
SIAM como arquivo histórico.

**Tarefas:**
1. Migration `legislacao_ambiental` (esfera, tipo, número, ano, ementa,
   situação, link).
2. Coletor ALMG + SEMAD.
3. Busca unificada — é a promessa da seção: "hoje a norma está partida entre
   cinco sistemas que não conversam".

**Duas armadilhas da F0:** não espelhar as 30 mil normas da ALMG (buscar por
URL direta o que interessa), e o `download.pdf` do SIAM devolve
`Content-Type: text/html` mesmo com HTTP 200 — confiar no content-type grava
HTML como se fosse PDF.

---

## F7 · CETESB — o ambiental de São Paulo

Pedido do usuário em 2026-08-10. **São Paulo não tem equivalente ao CAP**: a
CETESB publica dados abertos de **monitoramento**, não de autuação (os autos
ficam no e-CETESB, sistema de licenciamento). Conferido em 2026-08-10.

O que ela publica, e é bom:
`cetesb.sp.gov.br/cetesb/qualidade_ambiental/dados_abertos`

- **Qualidade do ar** — estações automáticas, índice, série histórica
- **Águas superficiais** — hidrografia, pontos de monitoramento, série
- **Águas subterrâneas** — pontos e série
- **Saneamento**

**Tarefas:**
1. Confirmar formato e endereço de download de cada conjunto (a página é
   índice; os arquivos estão atrás dela).
2. Migration `qualidade_ar` e `qualidade_agua`, com ponto de monitoramento
   georreferenciado — é o que permite ligar ao município.
3. Coletor por conjunto.
4. Tela em `/[municipio]/meio-ambiente` para São Paulo. **Monitoramento não é
   fiscalização** — a tela precisa dizer isso, senão o leitor compara o número
   de SP com o de autuações de Minas achando que mede a mesma coisa.

**A assimetria fica registrada, não escondida:** Minas tem autuação e São Paulo
tem monitoramento. São perguntas diferentes — "quem foi multado" e "como está o
ar" — e nenhuma das duas substitui a outra.
