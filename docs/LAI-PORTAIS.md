# Portais de Lei de Acesso à Informação (LAI) — Controle Popular

> **Antes de usar:** todo item aqui foi aberto e conferido em **2026-08-13**,
> exceto onde marcado. Contato de órgão público muda com frequência — se este
> documento tiver mais de alguns meses quando você o ler, **reabra o link antes
> de mandar alguém até o balcão**. O que não foi possível confirmar ao vivo
> está isolado na seção "Não verificado" no fim, nunca misturado ao resto.

## Aviso de procedência — leia antes do resto

A tarefa que originou este documento afirmava que o repositório já continha
quatro pedidos de LAI redigidos (`docs/PEDIDO-LAI-INCRA.md`,
`PEDIDO-LAI-SPU.md`, `PEDIDO-LAI-SEAPA-MG.md`, `PEDIDO-LAI-PBH-FAZENDA.md`) e
que o pedido ao INCRA tinha prazo vencendo com protocolo do Fala.BR nunca
anotado. **Nenhum desses quatro arquivos existe neste repositório** — busquei
por nome exato, por conteúdo (`grep -ri "INCRA\|SPU\|SEAPA"` em `docs/`) e no
histórico de commits (`git log --all --diff-filter=A`); o único artefato real
correlato é o componente `PedidoLAI.tsx` (gerador de rascunho + link, não um
pedido já redigido — ver §"O que já existe no produto" abaixo). Não inventei
esses arquivos nem o caso do prazo vencendo. Se eles existem em algum outro
lugar (outro repo, rascunho local, e-mail), quem tiver essa informação precisa
trazê-la — este documento não pode referenciar o que não consegui achar nem
abrir.

Isso também corrige a premissa de "7 cidades": o banco (`municipios`, via
migrations `0027`, `0043`, `0057`) tem **6 cidades ativas**, não 7, e
**Contagem não é uma delas** — as ocorrências de "Contagem" no código são de
outro contexto (regiões de saúde/legislação), não da tabela `municipios`.

## As 6 cidades do eixo Cidades (conferido no banco)

| Cidade | UF | Código IBGE | Fonte da confirmação |
|---|---|---|---|
| Betim | MG | 3106705 | `0001_schema.sql` (cidade original) |
| Belo Horizonte | MG | 3106200 | `0027_seed_bh_sp.sql` |
| São Paulo | SP | 3550308 | `0027_seed_bh_sp.sql` |
| Araçuaí | MG | 3103405 | `0043_seed_vales_jequitinhonha.sql` |
| Itinga | MG | 3134004 | `0043_seed_vales_jequitinhonha.sql` |
| Diamantina | MG | 3121605 | `0043_seed_vales_jequitinhonha.sql` |

Não consegui rodar `psql` neste ambiente (binário ausente) para confirmar
contra o Postgres ao vivo — a leitura acima é das migrations aplicadas, que é
a fonte que `municipios.ts` também usa para popular a tabela. Se alguém
alterou o banco fora de migration, este documento não capturaria.

## O que já existe no produto (não é um pedido redigido, é um gerador)

`apps/web/app/betim/components/PedidoLAI.tsx` monta, no navegador, um
rascunho de pedido LAI (texto pronto pra copiar) + botão para o portal oficial
da Prefeitura ou da Câmara da cidade ativa, lendo `municipios.fontes.sic_prefeitura`
/ `sic_camara`. Não envia nada — só gera texto e leva ao canal certo. As URLs
que ele usa são as mesmas desta tabela (Betim/BH/SP, únicas com
`sic_prefeitura`/`sic_camara` no banco hoje).

---

## Nível municipal

Cada cidade tem **dois órgãos distintos** — Prefeitura e Câmara — com pedidos
de LAI separados; a Câmara não recebe pedido endereçado à Prefeitura.

### Betim (MG)

| Canal | URL | Verificado |
|---|---|---|
| Portal de Transparência (Prefeitura) | `http://servicos.betim.mg.gov.br/transparencia/` | Segundo `docs/betim/F0-discovery.md`; não reaberto nesta rodada |
| e-SIC / LAI da Prefeitura | https://www.betim.mg.gov.br/portal/sic | ✅ 2026-08-13 — WebFetch confirma: registra pedido, acompanha protocolo, recurso. Prazo: **20 dias, prorrogáveis por 10** (Decreto Municipal 43.201) |
| Ouvidoria da Prefeitura | https://www.betim.mg.gov.br/portal/ouvidoria | ⚠️ não confirmado hoje (WebFetch recebeu conteúdo vazio); URL vem de `0040_canais_de_acao_cidada.sql`, conferida ao vivo em 2026-08-04 pelo commit `1583fa4` |
| e-SIC / LAI da Câmara | https://www.camarabetim.mg.gov.br/LAI/LeiAcesso | ⚠️ **não confirmado hoje** — ver "Não verificado" abaixo |

### Belo Horizonte (MG)

| Canal | URL | Verificado |
|---|---|---|
| Portal de Transparência (Prefeitura) | https://prefeitura.pbh.gov.br/transparencia | ✅ 2026-08-13 — inclui sistema de pedido LAI, prazo de **20 dias** |
| e-SIC / LAI da Prefeitura | https://prefeitura.pbh.gov.br/lei-de-acesso-a-informacao | ✅ 2026-08-13 — prazo **20 dias, prorrogáveis por 10**. Atendimento presencial: Rua dos Caetes, 342, Centro, (31) 3429-8750, seg-sex 8h-17h. Responsável: Controladoria-Geral do Município |
| e-SIC / LAI da Câmara | https://www.cmbh.mg.gov.br/participe/fale-com-a-camara | ✅ 2026-08-13 — a Câmara de BH **não tem e-SIC separado**: o canal de LAI é a própria Ouvidoria Administrativa (Deliberação nº 5/2013), prazo até 20 dias + 10. Tel. (31) 3555-1112, sala B-210, protocolo@cmbh.mg.gov.br |

> Nota de armadilha herdada da migration `0040`: até 2026-08-04 o
> `sic_prefeitura` de BH apontava para `prefeitura.pbh.gov.br/e-sic`, que
> devolvia 404 — a PBH tinha movido a página. A URL acima já é a corrigida.

### São Paulo (SP)

| Canal | URL | Verificado |
|---|---|---|
| Portal de Transparência (Prefeitura) | https://transparencia.prefeitura.sp.gov.br/ | ⚠️ existe, mas está atrás de verificação anti-bot (captcha da Prodam-SP) — não deu para confirmar o conteúdo por trás, só que o domínio responde e é da Prefeitura |
| e-SIC / LAI da Prefeitura | https://esic.prefeitura.sp.gov.br/ | ✅ 2026-08-13 — pede nome, documento e e-mail; rege-se pela LAI + LGPD. Ouvidoria de apoio: `ogm@prefeitura.sp.gov.br` / portal SP156 |
| e-SIC / LAI da Câmara | https://www.saopaulo.sp.leg.br/transparencia/lei-de-acesso-informacao/ | ✅ 2026-08-13 — princípio declarado "sigilo é exceção". Palácio Anchieta, Viaduto Jacareí 100, Bela Vista, CEP 01319-900, (11) 3396-4000 |

> Tribunal de contas que fiscaliza São Paulo é o **TCM-SP**
> (`https://portal.tcm.sp.gov.br`), não o TCE-MG — troca já corrigida no
> rodapé do produto pelo commit `1583fa4`, registrada aqui para quem for
> escrever texto sobre fiscalização da cidade.

### Araçuaí (MG)

| Canal | URL | Verificado |
|---|---|---|
| Site da Prefeitura (não há portal de transparência separado) | https://www.aracuai.mg.gov.br/ | ✅ site responde; `/transparencia` isolado dá 404 — a seção vive dentro do site principal |
| e-SIC / LAI da Prefeitura | https://www.aracuai.mg.gov.br/transparencia/e-sic | ✅ 2026-08-13 — botões "Registrar manifestação" e "Acompanhar manifestação" ativos. Prazo: **até 20 dias, prorrogável por 10** |
| e-SIC / LAI da Câmara | — | ❌ **não encontrado**. O site institucional (SAPL, `sapl.aracuai.mg.leg.br`) não tem seção de LAI visível na home; único canal achado foi e-mail `administracao.cm@aracuai.mg.leg.br` ("Fale Conosco"), que **não é confirmado como canal formal de LAI** — não afirmo que seja |

### Itinga (MG)

| Canal | URL | Verificado |
|---|---|---|
| Site da Prefeitura (não há portal de transparência separado) | https://www.itinga.mg.gov.br/ | ✅ site responde; `/transparencia` isolado dá erro 500 |
| e-SIC / LAI da Prefeitura | https://www.itinga.mg.gov.br/esic | ✅ 2026-08-13 — formulário "Cadastrar pedido" + acompanhamento por protocolo. Prazo **não aparece na própria página** (vale o prazo legal padrão da Lei 12.527/2011: 20+10 dias, mas a página não repete isso) |
| e-SIC / LAI da Câmara | https://www.camaraitinga.mg.gov.br/esic | ✅ 2026-08-13 — Sistema Eletrônico de Informações ao Cidadão, gera protocolo. Prazo também **não aparece na página** |

### Diamantina (MG)

| Canal | URL | Verificado |
|---|---|---|
| Portal de Transparência (Prefeitura) | https://portaltransp.com.br/ | ✅ 2026-08-13 — é o portal dedicado de Diamantina (apesar do domínio genérico) |
| e-SIC / LAI da Prefeitura | https://portaltransp.com.br/contato-e-sic | ⚠️ 2026-08-13 — a página existe e tem opções de "Enviar Consulta" / "Consultar Estatística", **mas mostrou o aviso "Referência a Prefeitura perdida, acesse o Portal da Transparência pelo site da Prefeitura novamente"** ao ser aberta direto. Para não dar link quebrado a quem for usar, **entre por** https://www.diamantina.mg.gov.br/portal/ → link "Portal da Transparência" → "Contato e-SIC", não pelo link direto acima |
| e-SIC / LAI da Câmara | — | ❌ **site da Câmara bloqueia acesso automatizado**. `cmdiamantina.mg.gov.br` devolve HTTP 403 e o domínio alternativo `camaradiamantina.cam.mg.gov.br` tem certificado TLS que não bate com o host (confirmado hoje, mesmo achado já registrado em `0060_contatos_5_cidades.sql` de 2026-08-11). Telefone alternativo cross-validado por agregador, **não pela própria Câmara**: (38) 3531-1228 |

---

## Nível estadual (Minas Gerais)

| Órgão | O que atende | URL do canal de pedido | Prazo legal | Conta gov.br? | Verificado |
|---|---|---|---|---|---|
| Poder Executivo estadual (CGE-MG) | Toda a administração direta e indireta do Executivo mineiro | https://acessoainformacao.mg.gov.br/sistema/site/Oque.aspx | Página não repete o prazo; regra padrão da Lei 12.527: 20+10 dias | **Sim** — pede login/senha, tem fluxo de "Primeiro Acesso" | ✅ 2026-08-13 |
| ALMG (Assembleia Legislativa) | Atos e atividade legislativa estadual | https://www.almg.gov.br/apps/fale-com | Não há e-SIC dedicado visível; ALMG direciona pedidos de LAI ao "Centro de Atendimento ao Cidadão (CAC)" dentro deste canal multifuncional | Não verificado | ⚠️ 2026-08-13 — não achei página de e-SIC própria da ALMG, só a menção ao CAC dentro de "Fale com a Assembleia". Ligar antes de confiar só no formulário: (31) 2108-7000 |
| TCE-MG (Tribunal de Contas) | Fiscalização de contas de Estado e municípios mineiros | https://www.tce.mg.gov.br/fale_tce/ | **20 dias** para resposta, **5 dias** para recurso contra indeferimento | Não indicado | ✅ 2026-08-13 — Resolução nº 12/2014 regulamenta |
| MPMG (Ministério Público) | Atuação do MP estadual | https://www.mpmg.mp.br/portal/menu/servicos/atendimento-ao-cidadao/requerimento-de-informacoes-lai.shtml | Não especificado na página (aviso: formulário "pode ficar suspenso por dias" em recesso/feriados prolongados) | Não indicado | ✅ 2026-08-13. Alternativas: tel. (31) 3330-9504 / 127, presencial Rua Timbiras 2928, 5º andar, BH, seg-sex 9h-15h |
| Defensoria Pública de MG | Atuação da Defensoria estadual | https://transparencia.defensoria.mg.def.br/ | Não detalhado na página aberta | Não indicado | ⚠️ 2026-08-13 — a página confirma que a DPMG segue a Lei 12.527, mas **não mostra formulário de e-SIC operacional visível** na home; o link direto que a busca indicou (`/transparencias/acesso-a-informacao/`) deu **404** ao ser aberto. Alternativa confirmada por busca (não reaberta ao vivo): tel. (31) 3526-0500, Rua dos Guajaras 1707, Barro Preto, BH |
| Semad (Meio Ambiente e Desenvolvimento Sustentável) | Política ambiental estadual | https://meioambiente.mg.gov.br/serviço-de-informação-ao-cidadão | Página informativa; pedido real corre pelo e-SIC central (acima) | Sim (mesmo login estadual) | ✅ 2026-08-13 — confirma que pedidos vão pelo e-SIC central `acessoainformacao.mg.gov.br`, tel. 155, ou presencial em qualquer Posto Uai |
| Feam (Fundação Estadual do Meio Ambiente) | Licenciamento e fiscalização ambiental estadual | https://feam.br/serviço-de-informação-ao-cidadão | Idem Semad — mesma engrenagem central | Sim | ✅ 2026-08-13 — **atenção**: domínio oficial é `feam.br`, não `feam.mg.gov.br` (esse não resolve DNS) |
| Igam (Instituto Mineiro de Gestão das Águas) | Outorga de água, gestão hídrica estadual | https://igam.mg.gov.br/servico-de-informacao-ao-cidadao | Idem Semad/Feam | Sim | ✅ 2026-08-13 — página confirma redirecionamento ao e-SIC central; contato de acompanhamento: (31) 3915-1272 |

**Achado que vale registrar**: Semad, Feam e Igam **não têm e-SIC próprio** —
as três páginas de "SIC" são apenas informativas e todo pedido efetivamente
tramita em `acessoainformacao.mg.gov.br`, o mesmo sistema do Executivo
estadual. Selecionar o órgão certo dentro desse sistema único é o que importa,
não achar uma URL de e-SIC dedicada a cada um — ela não existe.

---

## Nível federal

O canal de pedido de LAI para **toda a administração pública federal** é hoje
o **Fala.BR** (`https://falabr.cgu.gov.br/`, redireciona para
`http://falabr.cgu.gov.br/web/home`) — confirmado ao vivo 2026-08-13: a
página se identifica como "Plataforma Integrada de Ouvidoria e Acesso à
Informação". Cada órgão federal abaixo também mantém uma página de
"Acesso à Informação" própria em `gov.br`, que existe para explicar o
processo e, em geral, encaminha para o mesmo Fala.BR — não é um sistema
paralelo.

| Órgão | O que atende | Página de Acesso à Informação | Verificado |
|---|---|---|---|
| CGU (Controladoria-Geral da União) | Controle interno, transparência, e é quem opera o Fala.BR | https://www.gov.br/cgu/pt-br/acesso-a-informacao | ✅ 2026-08-13 — página lista "Serviço de Informação ao Cidadão" e aponta pro Fala.BR |
| INCRA | Reforma agrária, imóveis rurais, questão fundiária | https://www.gov.br/incra/pt-br/acesso-a-informacao/servico-de-informacao-ao-cidadao | ✅ 2026-08-13 — página referencia o Fala.BR explicitamente |
| IBAMA | Licenciamento e fiscalização ambiental federal | https://www.gov.br/ibama/pt-br/acesso-a-informacao/servico-de-informacao-ao-cidadao-sic | ✅ 2026-08-13 — idem, aponta pro Fala.BR |
| ANA (Agência Nacional de Águas) | Recursos hídricos, outorga federal | https://www.gov.br/ana/pt-br/acesso-a-informacao/servicos-de-informacao-ao-cidadao-sic | ✅ 2026-08-13 |
| ANM (Agência Nacional de Mineração) | Mineração, CFEM | https://www.gov.br/anm/pt-br/acesso-a-informacao/servico-de-informacao-ao-cidadao-sic-1 | ✅ 2026-08-13 |
| SPU (Secretaria do Patrimônio da União) | Imóveis da União | Não localizada em `gov.br/spu` (a SPU migrou para dentro do Ministério da Gestão e Inovação em Serviços Públicos: `gov.br/gestao`) | ❌ **não verificado** — três tentativas de abrir `gov.br/gestao/...acesso-a-informacao` falharam por erro de conexão (`ECONNRESET`) neste ambiente. Não afirmo a URL exata; o caminho a seguir é abrir o Fala.BR direto e escolher "Ministério da Gestão e Inovação em Serviços Públicos" / SPU na lista de órgãos |

**Onde se guarda o número de protocolo — leia isto antes de abrir qualquer
pedido.** O Fala.BR gera um protocolo por pedido, visível na tela de
confirmação e reenviado por e-mail ao solicitante; é esse número que permite
consultar prazo e entrar com recurso se o órgão ficar em silêncio. **Nada
neste repositório grava esse protocolo automaticamente** — não há tabela,
arquivo ou convenção para isso hoje. Enquanto isso não existir como
mecanismo, quem abrir um pedido pelo Fala.BR deveria, no mínimo, anotar à mão
(nome do órgão, data, número de protocolo, prazo de resposta) em algum lugar
persistente e **avisar quem for usar este painel depois** — é exatamente a
lacuna que a tarefa original apontou (pedido ao INCRA com prazo vencendo e
protocolo nunca anotado), mesmo sem eu ter localizado o pedido em si.

---

## Não verificado

Itens que abri e **não consegui confirmar que respondem corretamente**, ou
que não consegui abrir de jeito nenhum. Não use estes para orientar alguém a
ir a um balcão sem religar antes.

- **Câmara de Betim — e-SIC/LAI** (`https://www.camarabetim.mg.gov.br/LAI/LeiAcesso`).
  WebFetch recebeu só "Algo deu errado. A aplicação não irá responder até ser
  recarregada" (erro de app JS/Angular). Tentei pelo navegador também: a
  navegação para `www.camarabetim.mg.gov.br` foi redirecionada para
  `camarabetim.mg.gov.br` (sem `www`) e a rota `/LAI/LeiAcesso` devolveu
  **Erro 404** dentro do próprio app. A URL vem de `0040_canais_de_acao_cidada.sql`,
  verificada ao vivo em 2026-08-04 (`curl_cffi`, outro método) — pode ter
  quebrado desde então, ou pode ser instabilidade pontual da SPA. **Religue
  antes de confiar.**
- **Câmara de Diamantina — qualquer canal**. Domínio oficial
  `cmdiamantina.mg.gov.br` devolve HTTP 403 a acesso automatizado; domínio
  alternativo `camaradiamantina.cam.mg.gov.br` tem certificado TLS que não
  bate com o host. Nenhum dos dois foi possível abrir e confirmar hoje.
- **Câmara de Araçuaí — LAI**. Não encontrei página de e-SIC/LAI no site
  institucional (SAPL). Único contato achado foi e-mail
  (`administracao.cm@aracuai.mg.leg.br`), que não confirmei como canal formal
  de LAI.
- **Ouvidoria da Prefeitura de Betim** (`https://www.betim.mg.gov.br/portal/ouvidoria`).
  WebFetch recebeu conteúdo vazio hoje; URL vem de verificação ao vivo de
  2026-08-04 registrada no commit `1583fa4`, não é invenção, só não foi
  reconfirmada agora.
- **e-SIC da Prefeitura de Diamantina, link direto** (`https://portaltransp.com.br/contato-e-sic`).
  Abre, mas mostra aviso de "referência à prefeitura perdida" quando acessado
  fora do fluxo normal (ver tabela de Diamantina acima para o caminho que
  funciona).
- **e-SIC/LAI da ALMG** — não achei página dedicada; só o canal genérico
  "Fale com a Assembleia", que menciona LAI mas não é um formulário
  específico confirmado.
- **e-SIC/LAI da Defensoria Pública de MG** — a URL específica de
  "acesso à informação" que a busca indicou devolveu 404; a página de
  transparência geral abre mas não mostra formulário operacional visível.
- **e-SIC/LAI da SPU (federal)** — três tentativas de abrir a página em
  `gov.br/gestao` falharam por erro de conexão. Caminho alternativo (Fala.BR)
  está descrito na tabela federal acima.
- **Portal de Transparência de São Paulo** (`https://transparencia.prefeitura.sp.gov.br/`) —
  domínio responde e é da Prefeitura, mas está atrás de um desafio
  anti-robô da Prodam-SP; não vi o conteúdo por trás.
- **Os quatro documentos `docs/PEDIDO-LAI-*.md`** citados na tarefa original
  — não existem neste repositório. Ver aviso no topo deste documento.

---

## Metodologia

Verificação feita com `WebFetch` (conteúdo renderizado + análise textual) e,
em um caso (Câmara de Betim), também com navegação real de browser para
confirmar comportamento de SPA. "✅ verificado" significa que abri a URL
**hoje, 2026-08-13**, e o conteúdo confirma o que a linha afirma. Onde a
verificação é de outra data (herdada de migration/commit já existente no
repo), isso está dito explicitamente ao lado, nunca misturado sem data.
Nenhum endereço, telefone ou competência de órgão foi inventado — onde a
fonte não diz o prazo de resposta, a tabela diz "não especificado", não um
número chutado.
