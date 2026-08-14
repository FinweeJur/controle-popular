# Revisão de completude — páginas com buraco

> Item 6 de `docs/TODO-PROXIMAS-RODADAS.md`. Pedido literal do dono: *"tem
> várias páginas com dados incompletos, faltando contatos, telefones,
> links"*. Executado em 2026-08-14, com o Postgres LOCAL desta máquina
> (nunca a Neon).

## O que este documento é (e não é)

Isto **não é** um levantamento zero-a-zero de todo campo de todo formulário
do portal — o portal tem dezenas de tabelas de dado bruto (OSM, CNES,
SIGMINE) cuja esparsidade é da fonte, não do portal, e listar cada uma
inflaria o documento sem ajudar ninguém a agir. O foco foi:

1. Os três buracos que **já se sabia que existiam** (pedido literal do
   dono): os 13 itens `NAO_VERIFICADO` de `lib/betim/redeProtecao.ts`, a
   comissão da OAB de Contagem, e a amostra pequena da auditoria de
   hiperlinks de 13/08.
2. Varredura das 8 zonas indicadas (`/betim` e demais cidades, `/congresso`,
   `/judiciario`, `/ambiental`, `/funcaosocialterra`, `/paraopeba`,
   `/direitos-em-movimento`, `/sobre`) atrás de **campo de contato que chega
   vazio à tela** — telefone, endereço, site, e-mail de órgão ou canal de
   ajuda. Prioridade: o que falta que impede alguém de agir, não o que é
   só esteticamente incompleto (uma nota "—" numa tabela de dado numérico
   não entra aqui; um card de rede de proteção sem telefone, entra).

---

## 1. Os 13 itens `NAO_VERIFICADO` — reconferidos ao vivo

Cada um foi rechecado ao vivo em 2026-08-14 (o levantamento anterior era de
13/08). Dois saíram da lista por terem sido **resolvidos**; um foi
**promovido** a item confirmado; os demais ficaram com nota mais precisa,
a maioria **sem mudança**.

| Item | Tipo antes | O que foi feito | Tipo depois |
|---|---|---|---|
| Defensoria Pública de MG — e-SIC/LAI | não verificado | O SIC mora em subdomínio diferente do site institucional (`transparencia.defensoria.mg.def.br`, não `defensoria.mg.def.br`) — a URL testada antes simplesmente era a errada. Formulário SEI confirmado ao vivo, com telefone (31) 3526-0500 e endereço. Virou item confirmado em `LAI_ESTADUAL`. | **resolvido** |
| Ouvidoria da Prefeitura de Betim | não verificado (URL viva em 2026-08-04, sem resposta em 13/08) | A URL antiga voltou vazia **dois dias seguidos** (13 e 14/08) — deixou de ser instabilidade pontual. Trocada por alternativa viva no mesmo domínio institucional via migration `0073_ouvidoria_betim_link_morto.sql`, aplicada ao Postgres local. É o link real que `PedidoLAI`/`FooterGlobal` usam (`municipios.fontes.ouvidoria`). | **desatualizado → corrigido com fonte confirmada** |
| NAJUP / AJUP-UFMG | não verificado | Página institucional (`ufmg.br/proex/ajup/`) achada e ativa — edital de seleção 2026 aberto. Contato real é o Instagram @ajupufmg, citado na própria página oficial. Virou item confirmado em `REDE_ITENS` (académico). | **resolvido** |
| Câmara de Betim — e-SIC/LAI | não verificado | Reconferido: SPA mostra tela de erro, 2º dia seguido quebrado. | **não verificado, nota atualizada** |
| Câmara de Diamantina — qualquer canal | não verificado | Domínio oficial não conecta mais (antes 403, agora ECONNRESET); alternativo segue com TLS de terceiro. Telefone segue só em agregador. | **sem mudança** |
| Câmara de Araçuaí — LAI | não verificado | Site inteiro (SAPL) carregado, menu completo, nenhuma seção de LAI. | **sem mudança** |
| ALMG — e-SIC/LAI dedicado | não verificado | Canal genérico "Fale com a Assembleia" confirma tratar LAI/LGPD explicitamente — mais preciso, mas ainda não é formulário dedicado. | **parcial** |
| SPU (federal) — SIC | não verificado | Página de contato agora exige login gov.br (antes, erro de conexão) — mesma ausência de fato de SIC público dedicado. | **sem mudança (forma diferente)** |
| Portal de Transparência de São Paulo | não verificado | Ainda atrás de captcha anti-bot da Prodam-SP; texto do desafio citado ao pé da letra na nota. | **sem mudança** |
| Núcleo de MG da RENAP | não verificado | Site nacional segue sem citar MG. Achado (só por busca, não confirmado no site oficial) um Instagram @renap_mg. | **parcial, não promovido** |
| Comissão de Direitos Humanos da OAB-MG (seccional) | não verificado | Página de comissões segue bloqueando acesso automatizado (403). | **sem mudança** |
| Comissões de Direitos Humanos das câmaras municipais | não verificado | Betim tem comissão nomeada e real ("Comissão de Direitos Humanos, Promoção da Igualdade Racial e das Minorias", mandato 2025/2026) — mas sem contato direto. Diamantina: nenhuma evidência, só conselhos do Executivo. | **parcial** |
| Delegacias especializadas fora de BH | não verificado | Betim como amostra: DEAM com endereço/telefone confirmados numa fonte federal (gov.br/mdh), mas **divergente** de um agregador não-oficial (outro endereço, outro telefone, outro e-mail) — as duas fontes discordam, então não foi promovido a item confirmado. | **parcial** |

**Contagem final:** 13 → 11 no `NAO_VERIFICADO`, 2 promovidos a itens
confirmados (`LAI_ESTADUAL` e `REDE_ITENS`). Nenhum item foi apagado —
os dois resolvidos migraram de lista, o resto ficou com nota atualizada e
data de reconfirmação.

---

## 2. Comissão da OAB de Contagem

Reconferida ao vivo: `oabcontagem.org.br/comissoes/` segue sem nenhuma
"Comissão de Direitos Humanos" — a lista atual tem 38 comissões (Assuntos
Penitenciários, Direito das Famílias, Enfrentamento à Violência Contra a
Mulher, Promoção da Igualdade Racial, Pessoa Idosa, Criança e Adolescente,
entre outras correlatas), nenhuma com esse nome exato. **Sem mudança** —
a lacuna declarada já existente em `lib/betim/redeProtecao.ts`
(`site: null`, endereço/telefone institucionais mantidos) continua correta
e não precisou de ajuste.

---

## 3. Auditoria de hiperlinks — amostra ampliada

A auditoria de 13/08 cobriu 129 URLs externas do código-fonte e amostrou 42
de um total então medido em 25.729 links de fonte guardados no banco (essa
contagem não foi reproduzida à risca nesta rodada — o dado do portal mudou
no mesmo dia, ver `docs/DIARIO-2026-08-13.md` §5-6 sobre ingestões que
entraram depois — a população medida agora é **29.137** URLs distintas
somando as 9 colunas do tipo `link_fonte`/`url_fonte` do Postgres local:
`contratos`, `verbas_indenizatorias`, `atos_oficiais`, `proposicoes`
(municipal e Congresso), `nomeacoes`, `fontes_externas`, `noticias` e
`diarias`).

**Amostra desta rodada: 700 URLs** (16,7× a amostra anterior), sorteadas
aleatoriamente sobre o total de 29.137, checadas por HTTP (HEAD com
fallback GET, `redirect: follow`, timeout 12s).

**Primeira passada:** 557 OK, 143 marcadas como quebradas (20,4%) — mas
concentradas em **3 domínios só**: `pncp.gov.br` (79, todas
`TypeError: fetch failed`), `splegisconsulta.saopaulo.sp.leg.br` (61,
todas HTTP 403) e `legislativo.camarabetim.mg.gov.br` (3, HTTP 500).

**Rechecagem com concorrência baixa** (sequencial por domínio, pausa entre
requisições, até 3 tentativas): as 143 caíram para **0 continuando
quebradas**. `curl` confirmou o padrão para `pncp.gov.br`: de 5 tentativas
sequenciais, 3 OK e 2 `Connection was reset` — rate-limit/anti-flood do
lado do PNCP sob 25 requisições simultâneas, não um link morto.

**Taxa medida: 0/700 (0%) confirmadas quebradas**, contra as 20,4% brutas
da primeira passada. A lição prática: checar hiperlink em lote **precisa**
de concorrência baixa por domínio, ou o próprio método de verificação
fabrica falso positivo em escala. Método registrado nos scripts temporários
usados nesta rodada (não versionados — rodar de novo é refazer a consulta
+ a checagem, ambas descritas acima).

---

## 4. Achados novos na varredura das 8 zonas — consertados

| Página | Campo | Tipo | O que foi feito |
|---|---|---|---|
| `/paraopeba/quem-atua` (Ascotélite) | `contatos: []`, sem nenhum contato na tela | **ausente** | E-mail e CNPJ confirmados no Mapa das OSC (IPEA, cadastro federal por CNPJ) — fonte diferente do painel original. Telefone do cadastro tem um dígito a mais que o esperado para um fixo da região; não virou link `tel:`, só ficou na nota. |
| `/paraopeba/quem-atua` (IEM — Instituto Esperança Maria) | `contatos: []`, sem nenhum contato na tela | **ausente** | Nenhum canal direto encontrado. Usa o mesmo desvio "Contato via MAB" já aceito para a ABA, co-autora da mesma ação civil pública. |
| `/[municipio]/vereadores/[slug]` (Contato) | `{row.email ?? "—"}` — traço mudo para 36 de 158 vereadores | **ausente, sem explicação** | Traço virou texto ("E-mail individual não divulgado pela Câmara") e, quando a cidade tem `camara_host`, oferece o canal da própria Câmara como caminho alternativo até o vereador. |
| `municipios.fontes.ouvidoria` de Betim (via `/[municipio]` rodapé "Denunciar") | URL morta 2 dias seguidos | **desatualizado** | Migration `0073` trocou para URL viva no mesmo domínio institucional, com telefones (Ouvidoria Geral, da Mulher, do SUS) e endereço confirmados ao vivo. |
| `docs/ambiental/F0-discovery.md` / `PROVENIENCIA.json` (InfoHidro) | nota de bloqueio de 2026-08-09 | **não verificado → reconfirmado** | Reconferido ao vivo: mesmo bloqueio eleitoral (Lei 9.504/1997), agora com o aviso citado ao pé da letra e URL corrigida (`/sobre`). Religar após a eleição de outubro/2026. |

## 5. Achados na varredura — registrados, não consertados nesta rodada

Nenhum destes é um "campo mudo": todos já têm ausência tratada com honestidade
na tela (nenhum "—" sem explicação, nenhuma imagem quebrada), então ficam
aqui como registro de cobertura, não como pendência urgente.

| Página / dado | Campo | Tipo | Por que não foi consertado agora |
|---|---|---|---|
| `/[municipio]/plantao-farmacias` | tabela `farmacias_plantao` **vazia em todas as 6 cidades** (0 linhas) | **ausente** | Já declarado com honestidade na tela: "depende da publicação oficial da escala pela Prefeitura/CRF-MG, ainda não integrada". Falta integração de fonte, não conserto de exibição. |
| `saude_estabelecimentos` (36.157 linhas) | `nome`, `endereco`, `bairro`, `lat`, `lng` 100% nulos em todas as cidades | **ausente, mas invisível ao leitor** | A tabela só alimenta uma **contagem agregada** (`totalEstabelecimentos`) em `lib/betim/saude.ts` — nenhum `.tsx` itera linha a linha, então o campo vazio nunca chega à tela. Registrado como nota de qualidade de dado do ETL do CNES, não como lacuna de UI. |
| `/[municipio]/vereadores/[slug]` (foto) | `foto_url` ausente para 12 de 158 vereadores, concentrado em Diamantina (1 de 13) | **ausente** | Já tratado sem quebra visual (sem `<img>`, sem ícone quebrado, sem traço) — card só fica sem foto. Não impede ninguém de agir (diferente de telefone/endereço), então ficou fora da prioridade desta rodada. |
| `judiciario.tribunais.url_composicao` | nulo em 5 dos 7 tribunais (STJ, STM, STF, TST, TSE) | **ausente** | Campo não é lido por nenhuma página (`app/judiciario/tribunais/[sigla]/page.tsx` não usa `url_composicao`) — coluna morta, sem efeito no que o leitor vê. |
| Comissões de Direitos Humanos das câmaras municipais fora de Betim/Diamantina | existência não checada | **não verificado** | Fora do escopo desta rodada (portal tem 6 cidades; só Betim e Diamantina foram checadas como amostra representativa do achado já registrado no `NAO_VERIFICADO`). |
| Delegacias especializadas fora de Belo Horizonte, exceto Betim | endereço/telefone não conferidos individualmente | **não verificado** | Mesma razão — dezenas de municípios, amostra de 1 (Betim) já revelou divergência entre fontes que merece resolução antes de expandir para mais cidades. |

---

## 6. Resumo por tipo

| Tipo | Quantos | O que significa |
|---|---|---|
| **Ausente, corrigido com fonte confirmada** | 4 | Ascotélite, IEM, vereador sem e-mail (explicado), Ouvidoria de Betim (URL trocada) |
| **Não verificado, resolvido/promovido** | 3 | Defensoria MG (LAI), AJUP-UFMG, Ouvidoria de Betim (também conta aqui — resolvia duas classificações ao mesmo tempo: URL desatualizada E ausência de reconfirmação) |
| **Não verificado, nota atualizada (sem promoção)** | 8 | Câmara de Betim, Diamantina, Araçuaí; ALMG; SPU; Portal SP; RENAP-MG; OAB-MG seccional; comissões municipais; delegacias fora de BH (alguns ganharam detalhe parcial, nenhum virou confirmado) |
| **Ausente, registrado sem conserto de exibição** (já honesto na tela) | 4 | Farmácias de plantão (tabela vazia), `saude_estabelecimentos` (campos não exibidos), foto de vereador (Diamantina), `url_composicao` de tribunais (coluna morta) |
| **Hiperlinks — taxa medida** | 0/700 (0%) | Amostra 16,7× maior que a de 13/08; a taxa bruta de 20,4% da primeira passada era artefato de rate-limit em 3 domínios, não link morto |

---

## 7. Verificação técnica

- `cd apps/web && npx tsc --noEmit` — limpo, sem erros.
- `npm run test:lib` — 247/247 passando, nenhum quebrado pelas mudanças.
- `python scripts/checar-dado-pessoal.py` — sem CPF/segredo em código, rodado antes de cada commit desta rodada.
- Migration `0073_ouvidoria_betim_link_morto.sql` aplicada ao Postgres
  local desta máquina (nunca a Neon — enquanto a Neon estiver em HTTP 402,
  esta correção só existe aqui; ver item 2 do `TODO-PROXIMAS-RODADAS.md`
  sobre o mesmo problema já valendo para a migration `0071`).

*Registrado em 2026-08-14.*
