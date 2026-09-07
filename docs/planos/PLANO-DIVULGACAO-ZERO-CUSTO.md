# Plano de divulgação — custo zero

> **Tipo:** PLANO
> **Domínio:** global (Controle Popular + Floresta de Apps)
> **Última medição:** 2026-09-01
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PRODUTO.md](../01-produto/PRODUTO.md), [PLANO-SEO-VISIBILIDADE-BUSCADORES.md](PLANO-seo-visibilidade-buscadores.md), [PLANO-ESPELHO-GITEE.md](PLANO-ESPELHO-GITEE.md)
> **Palavras-chave:** plano, divulgacao, imprensa, email, whatsapp, instagram, video, zero-custo

## Sumário

- [Objetivo e princípios](#1-objetivo-e-princípios)
- [Mensagem central](#2-mensagem-central)
- [Prontidão — checklist antes do primeiro envio](#3-prontidão--checklist-antes-do-primeiro-envio)
- [Imprensa — lista de veículos e a pauta](#4-imprensa--lista-de-veículos-e-a-pauta)
- [Modelos de e-mail prontos](#5-modelos-de-e-mail-prontos)
- [WhatsApp](#6-whatsapp)
- [Instagram](#7-instagram)
- [Roteiro de vídeo](#8-roteiro-de-vídeo-60–90-s--reelstiktokshortsyoutube)
- [Fóruns e comunidades técnicas](#9-fóruns-e-comunidades-técnicas-postagem-única-com-valor)
- [Calendário de execução](#10-calendário-de-execução-30-dias)
- [Métricas e acompanhamento](#11-métricas-grátis-e-acompanhamento)
- [Guarda-corpos](#12-guarda-corpos)
- [Critérios de conclusão da 1ª rodada](#13-critérios-de-conclusão-da-1ª-rodada-30-dias)

---

## 1. Objetivo e princípios

Levar o Controle Popular (controlepopular.com.br) e o hub sementeiraprojetos.com.br
a quem pode **usar** — cidadão, jornalista, movimento, pesquisador — e a quem pode
**sustentar** — apoiador, órgão, universidade. Custo adicional: **zero reais**.
Tudo que este plano usa já existe: e-mail, WhatsApp, Instagram, GitHub, fóruns.

Princípios que não se negociam (são o argumento do projeto):

1. **Todo número tem fonte.** Toda peça de divulgação que cite número linka a
   fonte ou a página do portal.
2. **Lacuna é informação.** Não esconder o que ainda falta; usar "em revisão" como
   diferencial de honestidade, não como defeito.
3. **Sem vínculo com governo.** A divulgação nunca soa institucional.
4. **Sem spam.** Só contato institucional público, com opt-out e respeito à LGPD.
5. **Erro medido, não escondido** — mesma régua do portal aplicada à divulgação.

## 2. Mensagem central

**Uma frase (elevator pitch):**

> Um portal que junta o dinheiro público que já é seu — contratos, diários
> oficiais, o que o Congresso faz com seus direitos, quem ocupa os tribunais, o
> que a Vale paga e o que a reparação de Brumadinho ainda não fez — numa tela só,
> com a fonte ao lado de cada número e a taxa de erro quando é estimativa.

**Três ângulos por audiência:**

| Audiência | Ângulo | Porta de entrada |
|---|---|---|
| Jornalista | Pauta pronta: "o dado que faltava para fiscalizar X" | /sobre, /paraopeba, /ambiental |
| Movimento social | Ferramenta de pressão: ofício pronto, alerta de vaga em tribunal | /congresso, /judiciario |
| Pesquisador / técnico | Dado aberto, API pública, método auditável | /api, /sobre#metodologia |
| Cidadão comum | "Descubra o que sua prefeitura compra" | /betim, home |

## 3. Prontidão — checklist ANTES do primeiro envio

- [x] Hub sementeiraprojetos.com.br atualizado (domínio novo, cards novos).
- [x] Botões de contato → `contato@controlepopular.com.br`.
- [ ] Caixa de e-mail configurada e monitorada (responder em ≤ 48 h em qualquer
      disparo).
- [x] Página `/imprensa` no portal (criada em 01/09): o que é, números-chave com fonte, o que o portal não é, ganchos de pauta e contato. Faltou o logotipo — incluir quando existir.

- [ ] Link único para divulgar: encurtador gratuito (bit.ly) ou o próprio domínio
      com UTM (`?utm_source=imprensa&utm_medium=email`).
- [ ] Perfis públicos coerentes: GitHub (descrição dos repos), Instagram criado ou
      reativado, WhatsApp Business (ou número pessoal separado) com nome e foto.
- [ ] Espelho no Gitee (ver [PLANO-ESPELHO-GITEE.md](PLANO-ESPELHO-GITEE.md)) —
      é um gancho de pauta para público técnico ("código aberto, espelhado em 2
      plataformas").

### 3.1. Links prontos com UTM (copiar e colar)

O domínio já é o link mais curto que existe; o UTM só diz de onde veio o
visitante, para o log (DIVULGACAO-LOG.md) medir canal a canal. Usar estes
links como estão — trocar `2026-09` quando a campanha mudar:

| Canal | Link pronto |
|---|---|
| Imprensa (e-mail, modelo A) | `https://controlepopular.com.br/?utm_source=imprensa&utm_medium=email&utm_campaign=divulgacao-2026-09` |
| Organizações (e-mail, modelo B) | `https://controlepopular.com.br/?utm_source=organizacoes&utm_medium=email&utm_campaign=divulgacao-2026-09` |
| WhatsApp status/grupos | `https://controlepopular.com.br/?utm_source=whatsapp&utm_medium=mensagem&utm_campaign=divulgacao-2026-09` |
| Instagram (bio e link dos posts) | `https://controlepopular.com.br/?utm_source=instagram&utm_medium=perfil&utm_campaign=divulgacao-2026-09` |
| Fóruns (Reddit, DEV, HN) | `https://controlepopular.com.br/?utm_source=forum&utm_medium=post&utm_campaign=divulgacao-2026-09` |
| GitHub (README, issues, comentários) | `https://controlepopular.com.br/?utm_source=github&utm_medium=readme&utm_campaign=divulgacao-2026-09` |
| Matéria específica (ex.: Betim) | `https://controlepopular.com.br/betim/?utm_source=imprensa&utm_medium=email&utm_campaign=divulgacao-2026-09` |

Se preferir link encurtado (bit.ly/rel.ly gratuito), encurtar o link com UTM
depois de montado — nunca encurtar o domínio puro, senão o UTM se perde.

## 4. Imprensa — lista de veículos e a pauta

#### 4.1. A pauta (o que oferecer)

> **Assunto:** "Portal independente reúne R$ 251 bilhões em dados públicos, 199 cidades, tribunais de MG e Mariana/Brumadinho — com fonte em cada número"

Ganchos prontos para regionalizar:

- **R$ 251 bilhões sob fiscalização popular**: Mariana (R$ 171 bi repactuado), Brumadinho (R$ 37,7 bi do acordo global), transferências federais do ComunicaBR (R$ 139 bi nos 853 municípios de MG), orçamento de Belo Horizonte (R$ 19,4 bi) e Justiça de MG (mais de R$ 20 bi).
- **199 cidades estratégicas monitoradas**: painel nacional com contratos do PNCP, diários oficiais, compras emergenciais e dados fiscais.
- **Transparência da Justiça em MG (7 instituições)**: fichas detalhadas de TJMG (R$ 14,9 bi), MPMG (R$ 4,09 bi), DPMG (R$ 1,1 bi), TRT-3, TRF-6, DPU e TCE-MG, com abertura de gastos em diárias, alimentação, penduricalhos indenizatórios e terceirizados.
- **Central de Notícias & Relatórios Acadêmicos**: 18 matérias aprofundadas com citação pronta em normas ABNT e BibTeX para universitários e pesquisadores.
- **Reparação socioambiental**: execução mês a mês de Brumadinho (26 municípios, R$ 5,48 bi, 73,8% pago) e Mariana (R$ 677 mi para MG), com 597 documentos de assessorias técnicas (ATIs) e dados de barragens da ANM.
- **Tecnologia Livre & Seu Nonô**: assistente cívico inteligente com modelo nacional aberto (Sabiá 7B) e Kit Guias AppLivre (`applivre.pages.dev`).

### 4.2. Lista de contatos (verificar e-mail vigente antes de enviar)

**Minas Gerais / BH (prioridade máxima — o projeto é de MG):**

| Veículo | Contato (confirmar na hora) | Nota |
|---|---|---|
| O Tempo (BH) | `redacao@otempo.com.br` | maior jornal de MG; pauta local |
| Estado de Minas | fale conosco em em.com.br (formulário) | caderno de política/dados |
| Hoje em Dia (BH) | `redacao@hojeemdia.com.br` | |
| Rádio Itatiaia (BH) | `jornalismo@itatiaia.com.br` | rápidos; bom para dado local |
| G1 Minas / TV Globo Minas | formulário g1.com.br (Sua Pauta) | vídeo + texto |
| Rádio CBN BH / Band News FM | formulário/contato direto | |
| Jornal de Betim / Geraes (Betim) | formulário ou redes | veículos locais de Betim |
| Câmara/Betim imprensa | — | usar só para pauta, não apoio |
| UFMG (Ascom) | `imprensa@ufmg.br` | pauta acadêmica: perícia UFMG × auditoria |
| Jornal laboratório/agências de jornalismo UFMG e PUC Minas | contato direto de professores | divulgar como "estudo de caso" |

**Nacionais (direitos, ambiente, dados):**

| Veículo | Contato (confirmar na hora) | Nota |
|---|---|---|
| Brasil de Fato | `redacao@brasildefato.com.br` | movimentos sociais, Brumadinho |
| Repórter Brasil | `contato@reporterbrasil.org.br` | trabalho/ambiente; gosta de dado |
| Agência Pública | pauta pelo site (apublica.org.br/contato) | jornalismo investigativo |
| Marco Zero Conteúdo | `contato@marcozero.org` | direitos humanos |
| Agência Mural | `contato@agenciamural.com.br` | periferia; 6 cidades inclui SP |
| Alma Preta | `redacao@almapreta.com` | quilombolas, raça e território |
| ((o))eco | `contato@oeco.org.br` | ambiental; Mariana/Brumadinho |
| InfoAmazonia | `contato@infoamazonia.org` | se expandir para UCs/terras |
| De Olho nos Ruralistas | `contato@deolhonosruralistas.com.br` | função social da terra |
| JOTA | `jota@jota.info` | jurídico; Judiciário |
| ConJur | `redacao@conjur.com.br` | jurídico |
| Migalhas | `migalhas@migalhas.com.br` | jurídico |
| O Globo / Folha / UOL | formulários (Sua Pauta/Vc Repórter) | envio só com gancho nacional forte |
| CartaCapital | formulário | |
| Outras Palavras | `contato@outraspalavras.net` | ensaio/opinião |
| Mídia Ninja | `contato@midianinja.org` | |
| The Brazilian Report (EN) | `editorial@brazilian.report` | só se quiser audiência internacional |

**Organizações (parceria/uso, não pauta):**

| Organização | Contato (confirmar) | Por que |
|---|---|---|
| Open Knowledge Brasil | `contato@ok.org.br` | rede de dados abertos; divulgar e pedir revisão |
| Fiquem Sabendo | `contato@fiquemsabendo.com.br` | LAI; o portal usa LAI/CGE |
| Transparência Brasil | `comunicacao@transparencia.org.br` | transparência municipal |
| Artigo 19 Brasil | formulário | liberdade de informação |
| Conectas | formulário | direitos humanos |
| InternetLab | `contato@internetlab.org.br` | tecnologia e direitos |
| Comissão de Direitos Humanos OAB/MG | contato via site | já citada no acervo |
| MAB (Movimento dos Atingidos por Barragens) | `comunicacao@mabnacional.org.br` | parceiro natural do eixo Paraopeba (já está no portal) |
| Ministério Público de MG — comunicação | formulário | só para ciência, sem pedido de nada |

> **Regra de envio:** nunca comprar lista, nunca raspar e-mail pessoal, sempre
> personalizar o primeiro parágrafo com o nome do veículo/repórter e o gancho
> local. Um envio personalizado vale por dez disparos em massa.

## 5. Modelos de e-mail prontos

### 5.1. Modelo A — imprensa (curto, pauta pronta)

**Assunto:** Portal independente reúne R$ 251 bilhões em dados públicos, 199 cidades e tribunais de MG — fonte em cada número

Olá [Nome],

Sou [nome], integro o projeto independente **controlepopular.com.br** — uma plataforma cidadã que reúne mais de **R$ 251 bilhões** em dados públicos oficiais que estavam dispersos em dezenas de sistemas governamentais, apresentados em linguagem comum com a fonte ao lado de cada número.

Quatro ganchos de pauta prontos para o [nome do veículo]:

1. **Raio-x dos Tribunais de MG (7 órgãos):** apuração detalhada dos orçamentos de TJMG (R$ 14,9 bi), MPMG (R$ 4,09 bi) e DPMG (R$ 1,1 bi), com abertura de gastos em diárias, verbas de alimentação, penduricalhos indenizatórios e empresas terceirizadas: https://controlepopular.com.br/judiciario/instituicoes/tjmg
2. **Reparação de Desastres (Mariana e Brumadinho):** o Acordo de Mariana (R$ 171 bi repactuado, R$ 677 mi em MG) e o Acordo de Brumadinho (R$ 37,7 bi total, R$ 5,48 bi nos 26 municípios), cruzando relatórios de 597 ATIs e perícia da UFMG: https://controlepopular.com.br/ambiental/mariana e https://controlepopular.com.br/paraopeba/execucao
3. **199 Cidades & ComunicaBR:** contratos públicos (PNCP), diários oficiais minerados (16.601 atos em Betim) e R$ 139 bi em transferências federais para os 853 municípios de MG: https://controlepopular.com.br/cidades
4. **Central de Notícias com Citação ABNT:** 18 reportagens investigativas completas, com metadados científicos e citação acadêmica em um clique: https://controlepopular.com.br/noticias

Não é aplicativo governamental nem tem vínculo partidário — o código é aberto (AGPL) com metodologia 100% auditável: https://controlepopular.com.br/sobre

Se fizer sentido, envio release completo, planilhas com as fontes ou roteiro de entrevista. Release pronto anexo:
  [RELEASE-DIVULGACAO-2026-09.md](RELEASE-DIVULGACAO-2026-09.md).
  Contato direto: contato@controlepopular.com.br.

Abraço,
[nome]

### 5.2. Modelo B — organização/movimento (parceria e uso)

**Assunto:** Ferramenta gratuita para fiscalizar [tema da org] — pronto para usar

Olá [Nome],

O **Controle Popular** é um portal independente (sem vínculo com governo) que
reúne dado público em linguagem comum. Acho que ele serve diretamente ao trabalho
de [org] em [tema]:

- [Eixo X]: [1 linha do que tem, com link]
- [Eixo Y]: [1 linha, com link]

Ele já entrega **ação**, não só dado: ofício pronto para parlamentar, alerta de
vaga em tribunal, relatório de risco de contrato, mapa de sobreposição de terra.
É gratuito, sem cadastro, e o código é aberto.

Quer que eu prepare um mini-tutorial de 15 minutos para a equipe de [org], ou uma
pasta com os números-chave para o [seu movimento] usar? Sem custo.

Contato: contato@controlepopular.com.br

Abraço,
[nome]

### 5.3. Modelo C — comunidade técnica (GitHub/DEV/LinkedIn)

**Assunto:** [devs] Dado público com taxa de erro publicada — como fizemos

Post em tom de "case": monorepo Next.js 16 + OpenNext no Cloudflare, ETL em
Python, guarda de CPF por mod-11 antes do commit, API aberta sem chave, gráfico
SVG acessível sem biblioteca, análise garantista onde "o modelo extrai, o código
calcula". Encerrar com: "código aberto, espelhado no Gitee, review é bem-vinda:
github.com/FinweeJur/controle-popular".

### 5.4. Modelo D — newsletter/agregador (curto)

**Assunto:** Achamos um portal de transparência que mostra a taxa de erro

Texto de 3 parágrafos com o link, o princípio "lacuna é informação" e um
print/figura da tela.

## 6. WhatsApp

### 6.1. Status (story) — roteiro de 7 dias

Dia 1 (texto): "Você sabe para onde vão os R$ 251 bilhões do dinheiro público? Agora dá para fiscalizar com a fonte oficial ao lado: controlepopular.com.br"
Dia 2 (imagem): print da tela de Cidades (199 municípios e R$ 139 bi do ComunicaBR em MG) com link.
Dia 3 (texto): "Quanto custa o Judiciário de MG? Diárias, alimentação e penduricalhos do TJMG, MPMG e Defensoria abertos ao público: controlepopular.com.br/judiciario"
Dia 4 (imagem): card "R$ 171 bi em Mariana e R$ 37,7 bi em Brumadinho: acompanhe os acordos socioambientais mês a mês com documentos oficiais."
Dia 5 (texto): "18 reportagens investigativas completas com citação ABNT pronta para trabalhos de faculdade e pesquisas: controlepopular.com.br/noticias"
Dia 6 (imagem): card "Tire dúvidas sobre leis e orçamentos com o Seu Nonô, nosso assistente com IA livre e acolhimento mineiro."
Dia 7 (texto): "Tudo 100% gratuito, sem cadastro e com código aberto. A transparência pertence ao povo. Espalhe."

### 6.2. Grupos — mensagens permitidas (nunca diário)

- Grupos de bairro/associação (Minas Gerais, bacias do Rio Doce e Paraopeba): mensagem 1x/semana, modelo D + link.
- Grupos de jornalistas e pesquisadores: release curto e ganchos de pauta (modelo A).
- Grupos de movimentos sociais e estudantes: modelo B e matérias acadêmicas.

### 6.3. Mensagem para grupos de moradores e comunidades (pronta)

"Pessoal, conheçam o Controle Popular, uma ferramenta independente e gratuita que reúne mais de R$ 251 bilhões em recursos públicos, 199 cidades, acordos de Mariana e Brumadinho e gastos dos tribunais de MG, com o link do documento oficial do lado de cada número.
Dá pra tirar dúvidas com o Seu Nonô, nosso assistente com inteligência artificial livre.
Não tem vínculo com governo nem partido: https://controlepopular.com.br
Quem quiser ajuda para consultar sua cidade ou direitos, é só chamar!"

## 7. Instagram

### 7.1. Formato e identidade

- Nome: @controlepopular ou @florestadeapps.
- Bio: "Transparência cívica com prova documental. R$ 251 bi monitorados • 199 cidades • MG → Brasil. Código aberto."
- Link na bio: `https://controlepopular.com.br/?utm_source=instagram&utm_medium=bio`
- Artes: Canva gratuito, paleta oficial (tokens de cor pequi/verde), tipografia nítida e prints reais da plataforma.

### 7.2. Calendário 30 dias (3 posts/semana + 2 stories/dia)

| Semana | Post 1 (carrossel) | Post 2 (reels) | Post 3 (carrossel) |
|---|---|---|---|
| 1 | "R$ 251 bilhões: o que o portal fiscaliza" (4 telas) | Vídeo 60s "Tour de 1 minuto pelo portal" | "199 Cidades: contratos e compras públicas" |
| 2 | "Raio-x da Justiça em MG: salários e diárias" (4 telas) | Reels "Como achar contratos suspeitos" | "18 Investigações com citação ABNT" |
| 3 | "Mariana (R$ 171 bi) e Brumadinho (R$ 37,7 bi)" (4 telas) | Reels "Ofício pronto ao deputado em 1 minuto" | "Seu Nonô: IA brasileira sem vigilância" |
| 4 | "Kit Guias AppLivre: IA para o povo" (3 telas) | Reels "Mapa 3D da terra e barragens" | "Código aberto e API pública" |

### 7.3. Legendas prontas

**Carrossel 1 (R$ 251 bilhões sob a lupa popular):**
"📌 Para onde vai o dinheiro público?
São mais de R$ 251 bilhões em recursos do povo brasileiro agora reunidos numa única tela, em português simples e com link para a fonte oficial ao lado:
✅ 199 cidades monitoradas em contratos e diários oficiais
✅ R$ 171 bi da repactuação de Mariana e R$ 37,7 bi de Brumadinho
✅ Orçamento de 7 órgãos de Justiça de MG e gastos da cúpula
✅ 18 matérias jornalísticas com citação acadêmica em ABNT
Sem cadastro, sem mensalidades, sem vínculo com governos.
👉 Deslize para o lado e veja como fiscalizar sua cidade e seus direitos em 1 minuto.
Link na bio: controlepopular.com.br
#transparencia #dadosabertos #controlepopular #minasgerais #direitoshumanos #fiscalizacaocidada"

### 7.4. Hashtags (mix pequeno, repetível)

#transparencia #dadosabertos #controlepopular #minasgerais #mariana #brumadinho
#direitoshumanos #congresso #judiciario #tecnologia #opensource #applivre #lgpd

## 8. Roteiro de vídeo (60–90 s — Reels/TikTok/Shorts/YouTube)

**Formato:** vertical 9:16, celular, capa com título contrastado. **Custo:** zero (gravação de tela do portal + narração em voz natural; edição em CapCut gratuito).

| Tempo | Cena / imagem | Fala (off ou locução) |
|---|---|---|
| 0–5 s | Capa com zoom na Home: "Para onde vão R$ 251 bilhões do dinheiro público?" | "Você sabe como o dinheiro público é gasto na sua cidade e no seu Estado? A resposta sempre foi pública, mas ficava escondida." |
| 5–18 s | Navegação fluida pela Home, mostrando o cartão de R$ 251 bi e os 3 Eixos | "O Controle Popular junta mais de 251 bilhões de reais numa tela só. E a regra é rígida: cada número tem a fonte oficial do lado." |
| 18–32 s | Zoom na tela das 7 Instituições de Justiça (TJMG, MPMG, DPMG) mostrando diárias e alimentação | "Quer saber quanto os tribunais gastam em diárias, alimentação e terceirizados? Está tudo aberto e comparado." |
| 32–45 s | Transição para os painéis de Mariana (R$ 171 bi) e Brumadinho (R$ 37,7 bi) | "Os acordos de Mariana e Brumadinho são acompanhados mês a mês, documento por documento, para o atingido não ser enganado." |
| 45–60 s | Abertura do assistente Seu Nonô na tela respondendo uma dúvida em linguagem mineira acolhedora | "E se você tiver dúvida sobre uma lei ou contrato, o Seu Nonô explica tudo na hora com inteligência artificial brasileira e livre." |
| 60–75 s | Demonstração da Central de Notícias com o botão copiador de citação ABNT e BibTeX | "Para quem estuda ou faz pesquisa, são 18 matérias completas com citação acadêmica pronta em um clique." |
| 75–90 s | Tela final com o endereço `controlepopular.com.br` e logo AppLivre | "Tudo de graça, sem cadastro e 100% código aberto. Acesse agora: controlepopular.com.br. O link tá na bio!" |

**Legenda do vídeo:** o texto do carrossel 1 + "Comece a fiscalizar agora mesmo: controlepopular.com.br".

**Variação 30 s (para WhatsApp/Status):** cenas 1, 3, 5, 7 e final.

## 9. Fóruns e comunidades técnicas (postagem única, com valor)

| Comunidade | O que postar | Link |
|---|---|---|
| Reddit r/brdev | Case técnico: guarda de CPF mod-11, "modelo extrai, código calcula", API aberta | github + /api |
| Reddit r/brasil | "Ferramenta gratuita pra fiscalizar sua prefeitura" (tom de serviço, não propaganda) | home |
| Reddit r/direito | Análise garantista + ofício pronto | /congresso |
| Hacker News (EN) | "A Brazilian transparency portal that publishes its error rate" | github |
| DEV.to | Tutorial: "Como não publicar CPF: mod-11 antes do commit" | github |
| Comunidade OKBR (Slack/Discord) | Pedir revisão de método + divulgar API | /sobre |
| Fórum de jornalismo de dados (datajournalism.com) | "O que aprendemos cruzando AJRI e perícia da UFMG" | /paraopeba |
| LinkedIn | Post técnico semanal (modelo C), tag de dados abertos | github |
| Twitter/X | Thread de 5 tweets com prints + link | home |

Regra: 1 post por comunidade, com valor real (dado, método, achado). Responder
todo comentário por 72 h.

## 10. Calendário de execução (30 dias)

| Dias | Ação |
|---|---|
| 1–3 | Prontidão: página /imprensa, UTM, perfis, caixa de contato, logotipo |
| 3–7 | Espelho Gitee dos repos prioritários (ver plano próprio) + badge no README |
| 5–10 | Disparo personalizado: 10 veículos de MG (Modelo A) + 5 organizações (Modelo B) |
| 8–14 | Conteúdo: gravar/editar vídeo 60 s; montar 4 carrosséis no Canva |
| 10–20 | Instagram no ar: posts por calendário, stories diários (status do §6.1 adaptado) |
| 12–18 | WhatsApp: status 7 dias + 3 grupos de moradores + 1 grupo de jornalistas |
| 14–21 | Fóruns: r/brdev, r/brasil, DEV.to, LinkedIn (1 por semana) |
| 15–25 | Segunda onda de imprensa: veículos nacionais (Modelo A com gancho de 3ª via) |
| 20–28 | Seguidores das respostas: oferecer tutorial 15 min a quem respondeu |
| 25–30 | Medir, registrar, replanejar (abaixo) |

## 11. Métricas (grátis) e acompanhamento

- **Tráfego:** o portal já registra pageviews (rota `/api/pageview`); conferir
  antes/depois de cada onda. Google Search Console já configurado no plano de SEO.
- **E-mail:** taxa de resposta por veículo (planilha simples: enviado, respondeu,
  publicou). Meta honesta: 10% de resposta, 2–3 publicações/menções no 1º mês.
- **WhatsApp:** compartilhamentos e convites para grupos.
- **Instagram:** alcance e salvamentos por post (não só likes).
- **GitHub:** stars/forks como proxy de interesse técnico.
- **Registro:** uma linha por ação em `docs/relatorios-automacao/DIVULGACAO-LOG.md`
  (criar) para não repetir o mesmo veículo 3x e para medir o que funcionou.

## 12. Guarda-corpos

- **Não prometer o que o portal não faz.** Se um jornalista perguntar sobre dado
  que não existe, responder com a lacuna declarada (é o argumento do projeto).
- **Não parecer oficial.** Nunca usar símbolo de órgão, nunca "em parceria com"
  sem o outro lado concordar, nunca assinar como prefeitura/MP.
- **LGPD e anti-spam.** Só contato institucional público; remover da lista quem
  pedir; não usar e-mail pessoal de repórter achado por raspagem.
- **E-mail de contato.** Toda resposta passa por contato@controlepopular.com.br;
  nunca responder de conta pessoal em thread de imprensa.
- **Direito de imagem.** Prints do portal são do projeto; nada de foto de pessoa
  ou de terceiro sem licença.

## 13. Critérios de conclusão da 1ª rodada (30 dias)

- [ ] Página /imprensa no ar.
- [ ] 15 disparos personalizados (10 imprensa MG + 5 orgs) com registro.
- [ ] ≥ 2 respostas de veículos/orgs.
- [ ] Instagram com 12 posts + 20 stories publicados.
- [ ] WhatsApp com 7 status + 3 grupos atingidos.
- [ ] 6 posts em fóruns/comunidades técnicas.
- [ ] Log de divulgação criado e preenchido.
