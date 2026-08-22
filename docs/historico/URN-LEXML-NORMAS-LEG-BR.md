# URN LexML para o acervo de legislação — o que resolve, medido

Item **N5** de `docs/PLANO-2026-08-15.md`. O ganho pretendido não era mais
norma — o portal já publica **15.318** (6.378 estaduais + 8.940 federais) —
e sim **identificador canônico e permanente**: a URN LexML aponta para o
ATO, não para o endereço de hoje no site do órgão. `link_pdf` quebra quando
o órgão troca de CMS (é o que a auditoria de 2026-08-13 mede);
`urn:lex:br:federal:lei:1998-02-12;9605` continua sendo a Lei de Crimes
Ambientais em qualquer cenário.

**Tudo abaixo foi medido em execução real em 2026-08-15.** Onde não deu para
medir, está dito que não deu.

---

## 1. O número que decide: 16 de 17 resolveram (94,1%)

Amostra estratificada por tipo, tirada do acervo federal congelado em
`etl/betim/dados/legislacao-{mma,cndh}.json` (os mesmos dados que a carga
grava — ver `LEGISLACAO-FEDERAL-MMA-CNDH.md` §7), espalhada por década em
vez de pegar as primeiras linhas:

| tipo | montáveis no acervo | na amostra | resolveram |
|---|---:|---:|---:|
| Decreto | 508 | 12 | 11 |
| Lei | 124 | 3 | 3 |
| Decreto-Lei | 16 | 1 | 1 |
| Medida Provisória | 3 | 1 | 1 |
| **total** | **651** | **17** | **16 (94,1%)** |

Mais **5 controles negativos** — URNs que a lib se RECUSA a montar,
montadas à mão do jeito ingênuo só para conferir se a recusa está certa.
**Nenhum dos 5 resolveu**, ou seja, a lib não está jogando fora link bom.

Reproduzir: `cd apps/web && npx tsx scripts/verificar-urn-lexml.mts`. O
script lê arquivo, não banco (esta máquina não tem o acervo carregado e a
Neon está em cota 402 até 01/09), pausa 1,5 s entre requisições e manda
User-Agent identificando o projeto.

### O único que não resolveu, e por quê

`urn:lex:br:federal:decreto:1988-08-02;96000` — Decreto nº 96.000, sobre
pesquisa científica na plataforma continental.

**A data do acervo está certa.** Conferida na fonte oficial: a página do
Planalto (`d96000.htm`, a mesma que o acervo linka) escreve "DECRETO No
96.000, DE 2 DE AGOSTO DE 1988". E o portal tem, sim, decretos de 1988 —
95.733 (12/02), 96.044 (18/05) e 96.693 (14/09) resolvem, testados.

Então **é lacuna de cobertura do `normas.leg.br`**, não erro nosso. Isso põe
um piso realista na expectativa: ~6% dos links canônicos publicados podem
abrir uma página sem norma. É pouco, e é conhecido — não é o mesmo que
publicar às cegas.

---

## 2. Quanto do acervo ganha URN: 651 de 15.318 (4,2%)

Este é o número desconfortável, e ele é da FONTE, não do método.

| fatia do acervo | linhas | ganha URN? |
|---|---:|---|
| estaduais (ALMG, Semad, Siam) | 6.378 | **não** — o portal é federal |
| portarias, IN, resoluções, recomendações federais | 8.226 | **não** — tipo inexistente no vocabulário |
| Lei / Decreto / Decreto-Lei / MP federais, com data e número | **651** | **sim** |
| desses tipos, sem data completa | 30 | não |
| desses tipos, sem número em dígitos | 33 | não |

**Por que a estadual fica fora.** O `<title>` do portal é "Normas.leg.br:
Legislação Federal"; `/api/public/organizations` devolve **8 órgãos, todos
federais** (STF, Senado, Câmara, Congresso Nacional, Presidência da
República, Imprensa Nacional, Imperador, Assembleia Constituinte). Testado
com dado real: a Lei nº 26.040/2026 de Minas (colhida da API da ALMG hoje)
não resolve nem como `urn:lex:br;minas.gerais:estadual:lei:2026-08-06;26040`
nem sem o segmento `estadual`. A URN é bem-formada; o portal não a conhece.

**Por que portaria fica fora.** `/api/public/legislation-types` devolve
**77 códigos**, e os de norma inteira são os do processo legislativo federal
(`lei`, `lei.complementar`, `lei.delegada`, `decreto`, `decreto.lei`,
`decreto.legislativo`, `medida.provisoria`, `emenda.constitucional`,
`constituicao`, resoluções DAS CASAS). **Não existe `portaria`, não existe
`instrucao.normativa`, não existe `resolucao` genérica.** Isso exclui 2.368
portarias do Ibama, 2.166 do ICMBio, 1.061 do MMA, 511 Resoluções Conama e
as 370 do CNDH. Chutar a autoridade
(`urn:lex:br:ministerio.meio.ambiente:portaria:1990-03-14;349`) foi testado
e não resolve — chute não vira link.

---

## 3. As armadilhas (para quem for mexer nisso depois)

1. **⚠️ HTTP 200 não prova nada aqui, duas vezes.**
   `https://normas.leg.br/?urn=<qualquer coisa>` devolve **200 sempre**: é
   uma SPA Angular, o HTML é a casca e a norma chega depois por JSON — a
   página da Lei nº 9.605/1998 e a de uma lei inventada têm o **corpo byte a
   byte idêntico** (66.002 bytes, conferido com `cmp`). E a API por trás
   também responde **200 com o corpo `{ "urn": "<a urn que você mandou>" }`**
   quando não acha nada. O sinal de resolução é o corpo trazer
   `legislationIdentifier` — é o que `normaResolveu()` testa. Um verificador
   que contasse status 200 mediria **100% de sucesso** e estaria 100% errado.

2. **A API não é documentada; foi lida da rede da própria SPA.**
   `GET https://normas.leg.br/api/public/normas?urn=<URN>&&tipo_documento=maior-detalhe`
   devolve JSON-LD schema.org (`Legislation`). Dois detalhes que não são
   estilo: **sem `tipo_documento` a API devolve 400 até para a Lei nº
   9.605/1998**, que existe; e a URN vai **crua** — percent-encodar `:` e
   `;` também dá 400. O `&&` duplo é como o portal monta a URL. (`/api`
   sozinho devolve 404 com `content-type: application/json`, que foi a pista
   inicial do plano.)

3. **`decreto.numerado` NÃO é o código de um decreto numerado.** Parece
   óbvio pelo nome e está errado: o Decreto nº 47.446/1959 resolve com
   `decreto` e não resolve com `decreto.numerado` — os dois formatos
   testados com a mesma norma.

4. **⚠️ O SRU do LexML continua atrás de bot-check, confirmado hoje.**
   `https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve...` devolve
   a página **"Verificação de segurança — Senado Federal"**. É a mesma
   parede do TCE-MG. **Nada nesta rodada depende do SRU**, e nada futuro
   deveria: ele não responde a robô. O caminho que funciona é o
   `/api/public/` do `normas.leg.br`.

---

## 4. O que foi entregue

- **`apps/web/lib/ambiental/urn-lexml.ts`** — monta a URN a partir dos
  campos que o acervo JÁ tem (`esfera`, `tipo`, `numero`, `data`) e devolve
  o link canônico. Devolve `null` — o caso mais comum — quando a URN não
  resolveria. Função pura, sem rede.
- **`apps/web/lib/ambiental/urn-lexml.test.ts`** — 24 casos, com o peso nos
  quatro motivos de `null` (esfera, tipo, data ausente/incompleta/impossível,
  número ausente) e no eco de 200 que não é resolução.
- **`apps/web/scripts/verificar-urn-lexml.mts`** — o script que produziu o
  número da §1, reexecutável.
- **Tela**: o card de `/ambiental/legislacao` ganhou
  "Endereço permanente (LexML) →" **só quando há URN**, ao lado do link da
  fonte oficial, com o mesmo token de cor (`text-accent`) e a URN no
  `title`. Conferido no navegador com o acervo federal real carregado: a Lei
  nº 9.605/1998 mostra o link; 40 cards de portaria do Ibama mostram zero.

**Nada foi gravado em banco nenhum nesta rodada.** A URN é derivada dos
campos existentes a cada render — não há coluna nova, não há migration, não
há carga. Se um dia virar coluna, o valor congelaria e envelheceria sem
aviso; derivar custa uma função pura e acompanha qualquer correção de data
que a fonte faça.

---

## 5. O que NÃO foi feito, e por quê

- **Não se tentou o dataset "Acervo do portal LexML"** dos dados abertos do
  Senado (passo 1 do plano). O passo 2 — resolução por URN — já respondia a
  pergunta desta rodada, e sozinho ele não traz norma nova: traria a
  possibilidade de CONFERIR a URN antes de publicar, que é outra rodada.
- **Não se verifica a URN em tempo de build.** Daria para eliminar os ~6%
  de link morto conferindo as 651 contra a API e guardando só as que
  resolvem — mas isso são 651 requisições ao portal e um passo de build que
  depende de rede. Fica registrado como opção, não feito.
- **Nenhuma norma estadual ganhou link**, e nenhuma tentativa de contornar
  isso foi publicada. Se um dia houver resolvedor de URN estadual de Minas,
  o lugar de plugá-lo é `TIPO_PARA_URN_FEDERAL` + a guarda de esfera, num
  arquivo só.

---

*Medido em 2026-08-15 contra `normas.leg.br` ao vivo, com amostra pequena,
pausa entre requisições e User-Agent identificando o projeto.*
