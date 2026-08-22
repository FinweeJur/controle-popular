# Plano — transparência de MP, DP e Judiciário além do dinheiro

> **Aberto em 2026-08-22.** A pergunta que originou: *"além da parte financeira
> de MP, DP e TJ, o que podemos fazer sobre transparência?"*
>
> **Estado:** sondagem em curso contra as fontes reais. Os números marcados
> ⏳ ainda não foram medidos — **não citar em tela antes de medir.** Este
> documento nasce declarando o que ainda não sabe, em vez de estimar.

---

## 0. Como retomar

1. `docs/FONTES.md` — endpoint, armadilha e número medido de cada fonte
2. `AGENTS.md` — a regra editorial e a **regra das cinco coisas**
3. Este arquivo — o que fazer, em que ordem, e por quê

Trabalhar em worktree próprio. `git fetch` antes de descrever ou editar.

---

## 1. O que já existe, e que este plano NÃO refaz

| Já no ar | O que cobre |
|---|---|
| `/judiciario` — indicações, vagas, tribunais | **Quem ocupa a cadeira**: composição, quinto constitucional, vaga livre |
| Proxy do DataJud (`/api/datajud`) | **Consulta ao vivo** de processo. Não baixa, não guarda, não republica — cláusulas 3.8/3.9 da licença do CNJ |
| `/ambiental/decisoes-lai` — 753 decisões da CGE-MG | O único corpus de LAI de MG legível em texto |
| Rede de proteção de MG (30 itens curados) | Onde a pessoa encontra Defensoria, MPMG, delegacia especializada |

**A lacuna que dá nome a este plano:** o portal sabe dizer *quem entrou* no
tribunal e *o que diz um processo*. Não sabe dizer **se a instituição está
funcionando** — quanto demora, quanto acumula, o que acontece quando erra, e
quem fica de fora.

---

## 2. As quatro frentes sondadas

### A. Produtividade e acervo — *a prestação de contas mais básica, e a menos olhada*

Fontes: Justiça em Números (CNJ), Módulo de Produtividade Mensal, painéis do
CNJ, Metas Nacionais.

**Pergunta que passa a responder:** quanto tempo um processo leva no TJMG,
quanto acervo se acumula, e quantos casos cada magistrado carrega — comparável
entre tribunais, e não só no PDF anual.

⏳ *Medindo:* há CSV/API ou só relatório em PDF; se o painel tem endpoint por
trás; se o TJMG é isolável.

### B. Controle disciplinar — *o que acontece quando um juiz ou promotor erra*

Fontes: Corregedoria Nacional de Justiça (PADs contra magistrados), CNMP
(membros do MP), corregedorias do TJMG e do MPMG.

**Pergunta:** quantos processos disciplinares existem, quantos terminam em
punição, e quanto demoram.

⚠️ **Dado pessoal decide o desenho aqui.** Processo disciplinar nomeia pessoa
física. Medir o que existe é uma coisa; publicar nome é decisão editorial que
vem depois, e a regra da casa é conservadora. Ver [[flag_de_pessoa_fisica_mente]].

### C. Ouvidoria e acesso à informação — *quanta gente reclama, do quê, e o órgão responde*

Fontes: ouvidorias do TJMG, MPMG e DPMG; Ouvidoria Nacional de Justiça;
Ouvidoria Nacional do CNMP; Resolução CNJ 215 e Resolução CNMP 89 (o que elas
*obrigam* a publicar).

**Já medido, e é o gancho:** o e-SIC central da CGE-MG **exige login gov.br**;
o RSS do TJMG e do MPMG **respondem 404**; a **DPMG nunca foi verificada** —
está marcada como lacuna em `docs/FONTES.md` desde 13/08.

**Pergunta:** o órgão cumpre a própria resolução de transparência?

### D. Porta de entrada — *o lado de quem PRECISA da justiça*

Fontes: cobertura da Defensoria em MG (comarcas atendidas × total), Mapa da
Defensoria (ANADEP/IPEA), audiências de custódia (SISTAC), BNMP.

**Já medido:** Defensoria em **109–110 comarcas**; unidade de Araçuaí cobre
Itinga; Diamantina inaugurada em nov/2024.

**O que falta é o denominador** — quantas comarcas MG tem no total. Sem ele,
"109 comarcas atendidas" parece cobertura boa. Com ele, vira **déficit**.

**É a frente mais alinhada ao portal:** as outras três falam de quem administra
a justiça; esta fala de quem fica sem ela.

---

## 3. Princípios que decidem o que entra

1. **Fonte que só tem PDF ou painel sem dado por trás custa 10× mais e rende
   menos.** Isso pesa no ranking, não é detalhe de implementação.
2. **Lacuna é informação.** "O Estado não publica X" é matéria publicável, não
   fracasso de coleta. Foi assim com os 27% de EIA/RIMA que não abrem e com o
   `ft_convenio_metaetapa` que vem vazio.
3. **Validar o corpo, nunca o status.** Nesta frente já apanhamos de API que
   responde 200 e mente: catálogo inteiro quando o filtro não existe, 87 bytes
   só de cabeçalho, e **200 com 0 byte** no `buscarTac` do MPMG.
4. **O portal é para a pessoa atingida, não para o pesquisador.** Entre um
   indicador elegante e uma resposta que a pessoa usa, ganha a segunda.
5. **Regra das cinco coisas** (`AGENTS.md`): gráfico, cartões, CSV do filtrado,
   filtro e ordenação. Vale para toda página nova desta frente.

---

## 4. O que já se sabe que NÃO vai dar

| Fonte | Estado medido |
|---|---|
| `transparencia.mpmg.mp.br/buscarTac` | **Morto**: HTTP 200 com **0 byte** em todo id, com e sem Referer. Não há rota de listagem — nunca houve |
| RSS do TJMG e do MPMG | **404** — por isso ficaram fora do radar de notícias |
| e-SIC central CGE-MG | **Exige login gov.br** — interação humana, não automatizável |
| DataJud como acervo | A licença **veda redistribuir derivado**. O desenho é consulta ao vivo, e isso não muda |

---

## 5. Progresso

| # | frente | estado |
|---|---|---|
| S | sondagem das 4 frentes | ⏳ em curso |
| A | produtividade e acervo | ⬜ aguarda sondagem |
| B | controle disciplinar | ⬜ aguarda sondagem + decisão editorial sobre nome |
| C | ouvidoria e LAI institucional | ⬜ aguarda sondagem (DPMG é a lacuna conhecida) |
| D | porta de entrada / déficit da Defensoria | ⬜ aguarda o **denominador** de comarcas |

**Ao fechar a sondagem:** substituir os ⏳ por número medido com data, escolher
as 3 frentes que valem construir, e registrar em `docs/FONTES.md` o que foi
medido — inclusive as fontes descartadas, com o motivo.

---

Relacionado: [[controle_popular_estrutura_app]] · [[judiciario_project_state]] ·
[[apis_gov_status_200_mente]] · [[flag_de_pessoa_fisica_mente]]
