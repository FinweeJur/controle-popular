# Diário oficial — mapeamento do SIGPub (D0, sem coleta)

> Escrito em 2026-08-11, a pedido da auditoria: "engenharia pode adiantar o
> mapeamento em paralelo à decisão de LGPD" (item #25 de
> `docs/_historico/auditoria-2026-08-11.md`). **Esta tarefa não coletou dado nenhum** —
> nenhuma edição foi baixada, nenhuma matéria individual foi aberta, nada foi
> gravado no banco. Só confirma fonte, formato de busca e estrutura de URL.
> A coleta em si continua bloqueada até o usuário decidir o corte de LGPD
> (nomeação/exoneração, CPF — ver `docs/diario-oficial-plano.md`).

## O achado que muda o plano

`docs/diario-oficial-plano.md` (D1) supôs que Araçuaí, Diamantina e
"provavelmente Itinga" publicam via SIGPub/AMM-MG. **Medido agora: só
Diamantina bate com essa suposição de forma limpa.** Araçuaí e Itinga têm,
cada uma, um diário **próprio** hospedado no site da própria prefeitura —
plataforma nenhuma delas é o SIGPub. Isso não estava errado por acaso: é
fácil confundir as duas coisas porque `diariomunicipal.com.br/amm-mg` **é**
de fato uma instância do SIGPub (o rodapé do próprio site se identifica como
"Diário Oficial dos Municípios SIGPub — Sistema Gerenciador de Publicações
Legais", instituído pela Resolução AMM nº 10/2010) — então "AMM-MG" e
"SIGPub" não são duas plataformas concorrentes como o enunciado desta tarefa
supôs, são a mesma coisa (AMM-MG é a associação que contratou o SIGPub como
fornecedor para o diário estadual de Minas). A confusão real está em outro
lugar: **entre o diário estadual da AMM-MG e o diário próprio que cada
prefeitura pequena mantém no seu site.**

| Cidade | Usa SIGPub/AMM-MG? | Diário real (medido) |
|---|---|---|
| **Diamantina** | **Sim** — única confirmação limpa | `diariomunicipal.com.br/amm-mg/` |
| **Araçuaí** | Cadastrada, uso ativo **não confirmado** | Diário próprio: `aracuai.mg.gov.br` (CMS da prefeitura) |
| **Itinga** | Cadastrada, uso ativo **não confirmado** | Diário próprio: `itinga.mg.gov.br/diario` (plataforma "Simple System") |
| Betim | Não | Portal próprio, já mapeado e em uso (`apps/web/lib/betim/diarioOficial.ts`) |
| Belo Horizonte | Não | DOM-Web, sistema próprio da PBH (`dom-web.pbh.gov.br`) |
| São Paulo | Não | DOC + PubNet, sistema próprio (Decreto 62.177/23) — `diariooficial.prefeitura.sp.gov.br` |

Como cheguei em "não confirmado" para Araçuaí/Itinga: no seletor de
Município/Entidade da busca do SIGPub aparecem **"Prefeitura de Araçuaí"**,
**"Prefeitura Municipal de Itinga"** e **"Câmara Municipal de Itinga"** — ou
seja, as duas cidades têm cadastro/adesão na plataforma. Mas cadastro não é
uso: não achei nenhuma matéria real das duas indexada lá (busca por
`site:diariomunicipal.com.br/amm-mg` + nome da cidade não trouxe nenhum
resultado do próprio domínio), enquanto o diário próprio de cada uma está
visivelmente ativo — Araçuaí com edições numeradas correntes até pelo menos
a #901, datas indo até julho/2026. Pode ser que a adesão ao SIGPub exista só
como formalidade/backup e nunca tenha sido usada pra valer, ou que seja usada
em paralelo para atos que a plataforma própria não cobre — não dá pra saber
sem abrir uma matéria (que esta tarefa não fez). Fica como pergunta em aberto
pra quando a coleta for liberada.

## Diamantina — SIGPub/AMM-MG, confirmado

Achei uma matéria real e datada da **Câmara Municipal de Diamantina**
publicada no SIGPub (agosto/2025) e as duas entidades de Diamantina
(Prefeitura e Câmara) aparecem no seletor. Não achei diário próprio
alternativo no site da prefeitura — o que existe lá é
`diamantina.mg.gov.br/portal/leis_decretos/`, um banco de **legislação**
consolidada (plataforma Instar Tecnologia, só leis/decretos), não um diário
geral com portaria/edital/contrato. Isso é consistente com Diamantina
depender mesmo do SIGPub como diário oficial.

### Padrão de URL / busca

- **Base**: `https://www.diariomunicipal.com.br/amm-mg/`
- **Busca**: `https://www.diariomunicipal.com.br/amm-mg/pesquisar` — formulário
  HTML, sem API/JSON pública visível. Campos: Município (Entidade) — dropdown
  grande, cobre TODOS os municípios/câmaras/autarquias filiadas de MG, não só
  as 6 do portal —, Órgão (secretaria/departamento, dropdown separado),
  Título, Busca por palavra-chave, Data Início/Fim da Circulação.
- **Parâmetro do filtro por entidade**: `busca_avancada[entidadeUsuaria]=<id>`
  (visto em URL indexada: `...pesquisar?busca_avancada[page]=&busca_avancada[entidadeUsuaria]=320`).
  Os ids são numéricos e por entidade (não por município) — Prefeitura e
  Câmara da mesma cidade têm ids diferentes. Não consegui capturar os ids de
  Diamantina (o dropdown não renderiza a lista completa de valor/id em texto
  simples pro fetch usado aqui) — só o `320` de exemplo, que não é de nenhuma
  das 6 cidades. **Pegar os ids reais de Prefeitura/Câmara de Diamantina é o
  primeiro passo técnico de D1**, não algo que dá pra documentar sem abrir o
  HTML bruto do formulário.
- **Tentativa de busca via GET simples falhou**: montar a URL com
  `?busca_avancada[titulo]=Diamantina&busca_avancada[data_inicio]=...` só
  devolveu o formulário vazio ("NENHUMA MATÉRIA ENCONTRADA PARA ESTA DATA"),
  não um resultado filtrado. Ou a busca real é POST, ou depende de token/
  sessão, ou de algum campo oculto que não veio no fetch. **Confirmar o
  mecanismo real (inspecionar o JS da página, não só o HTML) é outro passo
  de D1** antes de escrever qualquer coletor.
- **Documento individual**: dois padrões de URL de detalhe vistos, ambos por
  hash opaco, não sequencial — `/materia/<hash>/<hash>` e `/load/<hash>`.
  Não dá para enumerar por número; só se chega lá pela lista de resultado de
  uma busca.
- **Filtro por tipo de ato**: **não existe no formulário de busca.** Os
  campos disponíveis são Entidade, Órgão, Título e palavra-chave — nenhum é
  "tipo/classificação/categoria" de ato (decreto, portaria, edital...). O
  documento individual internamente TEM um campo de tipo (ex.: "Extrato de
  Ata de Registro de Preços", visto na estrutura de uma matéria de outro
  município usada só pra conferir o formato), mas isso não é filtrável na
  busca pública — teria que ser classificado depois, por regex sobre o
  título, exatamente como `docs/diario-oficial-plano.md` já previa
  ("Classificação por tipo, determinística").
- **Estrutura de edição**: o SIGPub/AMM-MG publica **uma edição estadual por
  dia útil**, numerada sequencialmente e compartilhada por TODOS os entes
  filiados de Minas (vi edições como "Nº 4067", "Nº 4076", "Nº 4321" em
  datas de 2025 e 2026) — não é uma edição por cidade. As matérias de
  Diamantina ficam misturadas dentro dessa edição estadual e só se separam
  filtrando por entidade na busca.

### Estimativa de volume

Não abri nenhum resultado de busca filtrado (ver acima — a tentativa via GET
não funcionou, e não insisti para não arriscar puxar conteúdo de matéria por
engano). O que dá para estimar de forma estrutural, sem abrir nada:

- **Frequência da plataforma**: ~1 edição/dia útil → **por volta de 20 a 22
  edições por mês** no nível do SIGPub inteiro (não é o volume de
  Diamantina, é o volume de publicação da plataforma).
- **Volume de matérias de Diamantina por edição**: não medido. Uma prefeitura
  pequena costuma publicar poucas matérias por dia (às vezes zero — o
  próprio site mostrou "NENHUMA MATÉRIA ENCONTRADA PARA ESTA DATA" quando
  não filtrado por entidade nem data específica, mas isso pode ser só o
  estado padrão do formulário). **Fica pendente** de uma busca filtrada real
  por `entidadeUsuaria` de Diamantina — não fiz isso aqui por ser
  exatamente o tipo de coisa que aproxima de "abrir conteúdo".

## Araçuaí — diário próprio, não SIGPub

`aracuai.mg.gov.br` hospeda um "Diário Eletrônico" dentro do próprio CMS da
prefeitura, em `aracuai.mg.gov.br/diario-oficial-categorias` (listagem) e
`aracuai.mg.gov.br/transparencia/diario-oficial` (mesma coisa, view do
portal de transparência). Vi edições numeradas de forma sequencial e
crescente — exemplos reais nos títulos indexados: edição 122, 387, 463, 509,
842, 901 — cobrindo pelo menos março/2024 a julho/2026. Isso é volume
consistente com publicação quase diária, não esporádica.

- **URL de edição individual**: `aracuai.mg.gov.br/diario-oficial-categorias/<id>-diario-eletronico-edicao-<numero>/file` —
  id interno sequencial + número de edição no slug. Padrão previsível,
  mas o id interno e o número de edição não necessariamente batem 1:1
  (não confirmei a relação exata).
- **Busca**: a página de transparência tem "Pesquisar documentos" por
  título/descrição, mais filtro por categoria (`category[0]=35` = Diário
  Oficial, visto na URL). Sem API JSON visível — é listagem HTML paginada
  (~54 páginas, ~20 itens por página no momento observado).
- **Filtro por tipo de ato**: não existe um filtro de tipo separado — o
  "Diário Oficial" já é a própria categoria; dentro dela não há sub-tipo
  (decreto/portaria/edital) selecionável, só busca por texto no título.
- **Cadastro paralelo no SIGPub**: existe ("Prefeitura de Araçuaí" no
  seletor), uso ativo não confirmado (ver seção acima).
- **Não confundir com**: (1) `aracuai-mg.portaltp.com.br` — Portal da
  Transparência, fonte diferente, já mapeado em
  `supabase/betim/migrations/0052_portaltp_aracuai.sql`, cobre contrato/
  licitação, não diário; (2) a Câmara de Araçuaí roda SAPL
  (`sapl.aracuai.mg.leg.br`, já cadastrado em `fontes.camara_coletor`) — é
  outro sistema, outra fonte, cobre proposições da Câmara, não o diário da
  Prefeitura.

### Estimativa de volume

~54 páginas × ~20 itens/página no momento observado nessa categoria do CMS —
mas essa categoria mistura o Diário Eletrônico com outros documentos da
transparência (ex.: prestação de contas de Lei Paulo Gustavo, PNAB/Aldir
Blanc apareceram na mesma listagem), então esse total **não é** só edições
de diário. Não separei os dois porque isso exigiria abrir a listagem
paginada inteira item a item — não fiz. O sinal mais confiável que dá pra
tirar sem abrir nada é a numeração de edição em si: se a #901 é de
julho/2026 e a numeração parece ter começado perto de 2023/2024, a cadência
é compatível com publicação **quase diária** (bem mais frequente que
"algumas por mês").

## Itinga — diário próprio, não SIGPub

`itinga.mg.gov.br/diario` é uma página dinâmica (carrega via JS — apareceu
"Carregando edições..." no fetch), com busca por calendário (dias com
publicação destacados) e filtro detalhado por assunto, nome do documento,
ano, número de edição e intervalo de data. Rodapé identifica a plataforma
como **"Simple System"** — o mesmo fornecedor que a Câmara de Itinga já usa
para o módulo de proposições/legislação, confirmado e já documentado em
`supabase/betim/migrations/0055_itinga_simplesystem.sql` (27 categorias
mapeadas lá, arquivos hospedados em `pub.simpless.com.br`). É bem provável
que seja a mesma instalação de fornecedor por trás dos dois — prefeitura e
câmara de Itinga no mesmo produto —, mas a 0055 mapeou só a Câmara
(`camaraitinga.mg.gov.br/publicacao`); o diário da Prefeitura
(`itinga.mg.gov.br/diario`) é uma URL e front-end diferentes e não foi
confirmado como a mesma instalação técnica.

- **URL de edição individual**: não vista — o front-end é 100% dinâmico
  (JS busca via AJAX, sem link estático de listagem visível no HTML
  cru). Precisa inspecionar a chamada de rede real (o que o fetch usado
  aqui não faz) para achar o endpoint — provavelmente JSON, dado o padrão
  "Simple System" já visto na Câmara (`listarCategoria/`, conforme 0055).
- **Filtro por tipo de ato**: o campo "assunto" no formulário pode servir
  como proxy de tipo, mas não confirmei se é um dropdown fechado (tipos
  fixos) ou texto livre.
- **Cadastro paralelo no SIGPub**: existe ("Prefeitura Municipal de Itinga"
  e "Câmara Municipal de Itinga" no seletor), uso ativo não confirmado.
- **`fontes.diario_oficial` de Itinga no banco**: **não está preenchido
  ainda** (migration 0043 não incluiu essa chave para Itinga, diferente de
  Araçuaí/Diamantina que já têm — ver `supabase/betim/migrations/0043_seed_vales_jequitinhonha.sql`).
  Quando a coleta for liberada, o valor certo é `https://www.itinga.mg.gov.br/diario`
  (medido agora), não AMM-MG.

### Estimativa de volume

Não medida — a página estava sem edições carregadas no momento do fetch
("Nenhuma edição encontrada"), o que pode ser um intervalo de data padrão
vazio (não necessariamente ausência real de publicações) ou pode ser que o
fetch estático não executou o JS a tempo de carregar o resultado via AJAX.
Sem abrir a rede real da página (o que exigiria navegador, não só fetch de
HTML), não dá para estimar cadência aqui. **Primeiro passo de D1 para
Itinga**: abrir a página num navegador de verdade e olhar a aba de rede
para achar o endpoint JSON por trás do calendário — sem precisar interpretar
conteúdo de nenhuma matéria.

## As três que não usam SIGPub (confirmação rápida)

Só para fechar as 6 cidades do projeto, mesmo sem SIGPub nelas:

- **Betim** — portal próprio (`betim.mg.gov.br/portal/diario-oficial/`),
  com dataset de dados abertos em JSON por ano
  (`.../dados-abertos/diario-oficial/{ano}`), já consumido por
  `apps/web/lib/betim/diarioOficial.ts`. Fase D2 do plano, não D1.
- **Belo Horizonte** — DOM-Web, sistema próprio da PBH
  (`dom-web.pbh.gov.br`), com visualização por ato (`/visualizacao/ato/<id>`)
  e uma seção "Expediente". Fase D3.
- **São Paulo** — DOC (Diário Oficial da Cidade) em plataforma própria
  desde março/2023 (Decreto nº 62.177/23), alimentada por um sistema de
  transmissão de matérias separado ("PubNet") para quem publica; busca por
  palavra-chave/data/edição no front público. Fase D4, por último, como já
  decidido.

## O que fazer com isto (não fiz aqui)

- Atualizar `docs/diario-oficial-plano.md`, fase D1: trocar "Araçuaí,
  Diamantina, provavelmente Itinga via SIGPub" por "Diamantina via SIGPub;
  Araçuaí e Itinga via diário próprio de cada prefeitura — precisam de um
  coletor por-prefeitura (ou dois, se o CMS de cada uma for diferente), não
  do coletor único por-fornecedor que a D1 supunha para as três".
- Descobrir os `entidadeUsuaria` (Prefeitura e Câmara) de Diamantina no
  SIGPub — só dá abrindo o HTML bruto do `<select>` do formulário de busca.
- Confirmar via navegador real (não fetch estático) o mecanismo de busca do
  SIGPub (GET vs POST/AJAX) e o endpoint JSON por trás do calendário de
  `itinga.mg.gov.br/diario`.
- Decidir se vale a pena confirmar uso ativo do SIGPub por Araçuaí/Itinga
  (pode ser que nunca publicaram lá, ou que publiquem só tipos específicos
  de ato que a plataforma própria não cobre) — isso só se resolve abrindo
  uma busca filtrada de verdade, ou seja, só depois do corte de LGPD, porque
  já é "abrir conteúdo" de um jeito que esta tarefa evitou de propósito.
- Nada disto desbloqueia a coleta em si — o corte de LGPD (nomeação/
  exoneração, CPF) continua sendo decisão do usuário, para qualquer uma das
  três fontes mapeadas aqui.
