# Diário oficial — plano

> Escrito em 2026-08-10, a pedido do usuário: um resumo do que saiu de
> importante no diário de cada prefeitura — decretos, editais, convênios,
> contratos. **São Paulo fica por último**, por decisão dele.

## Por que isto vale mais do que parece

O portal hoje mostra o **resultado** (contrato assinado, licitação publicada no
PNCP) e não o **ato** (o decreto que criou a regra, o edital que abriu o prazo).
O diário é onde a decisão aparece primeiro, e é onde ela aparece *inteira* —
com prazo, com quem assina, com o processo administrativo.

E é o único lugar onde uma cidade pequena publica o que não vai para sistema
nenhum. Itinga tem 0 contratos no PNCP e 0 atos oficiais no banco; o diário
dela existe.

## A ordem sai da PLATAFORMA, não da cidade

O achado que organiza tudo: as cidades não têm cada uma o seu sistema — elas
compram de poucos fornecedores. Um coletor por plataforma cobre várias cidades.

| Fase | Plataforma | Cidades | Endereço |
|---|---|---|---|
| **D1** | **SIGPub** (Assoc. Mineira de Municípios) | Araçuaí, Diamantina, provavelmente Itinga | `diariomunicipal.com.br/amm-mg/` · busca em `/pesquisar` |
| **D2** | Portal próprio de Betim | Betim | `betim.mg.gov.br/portal/diario-oficial/` |
| **D3** | DOM-Web da PBH | Belo Horizonte | `dom-web.pbh.gov.br/` |
| **D4** | DOC paulistano | São Paulo | `diariooficial.prefeitura.sp.gov.br/` |

**D1 primeiro, e não é só por cobrir mais cidades:** SIGPub é a plataforma das
associações municipais de vários estados. Um coletor escrito por FORNECEDOR
— no molde de `etl.camaras.sapl` e `etl.camaras.syssolution` — atende Minas
hoje e qualquer estado que o portal ganhe depois. Escrever primeiro o de Betim
resolveria uma cidade e não ensinaria nada.

**Itinga precisa ser confirmada.** O `fontes` dela não tem `diario_oficial`
registrado, mas quase todo município pequeno de Minas publica no AMM-MG.
Confirmar é a primeira tarefa da D1 — se confirmar, D1 cobre metade do portal.

**São Paulo por último**, como pedido, e há razão técnica junto: é o maior
volume e o único com caderno diário de centenas de páginas.

## O que coletar, e o que NÃO coletar

Uma tabela `atos_diario`, uma linha por matéria publicada:

```
id_municipio · data_publicacao · edicao · pagina
tipo          decreto | portaria | edital | contrato | convenio | lei | outro
numero_ato · orgao · ementa · texto · link_fonte · chave_natural
```

**`link_fonte` é obrigatório desde o primeiro dia.** A lição de `contratos`,
que passou 1.268 linhas sem link nenhum, custou caro: um portal que mostra ato
administrativo sem apontar para o diário pede confiança.

**O que fica de fora:** nomeação e exoneração individual, e qualquer matéria
que traga CPF, endereço ou dado de saúde de pessoa física. O diário publica
isso; republicar em portal indexável é outra coisa. **O corte de LGPD é
decisão do usuário** — está na lista dele de "não decida sozinho", e a coleta
não começa antes dela.

## O resumo — e onde ele pode dar errado

O pedido é "resumo do que saiu de importante". Há duas maneiras, e elas se
somam:

1. **Classificação por tipo, determinística.** Regex sobre o cabeçalho da
   matéria. É o que `etl/temas.py` já faz para proposições e contratos:
   auditável, explicável ("é edital porque começa com EDITAL Nº"). Entrega
   sozinha a maior parte do valor: "esta semana saíram 3 decretos, 2 editais
   de licitação e 1 convênio".
2. **Resumo em linguagem comum, por modelo.** Só depois, e pelo mesmo caminho
   que a análise garantista usa: `exportar_prompts` → resposta → importador
   que valida. Nunca escrevendo direto no banco.

**A armadilha do resumo automático** é dizer que uma coisa é importante. O
critério de "importante" tem de ser explícito e mecânico — valor acima de X,
prazo que abre, direito que muda —, nunca um julgamento do modelo apresentado
como fato. O portal já separa "violação legal" de "heurística" nos alertas de
contrato; aqui vale a mesma disciplina.

## Fases

**D0 — confirmar as plataformas** (algumas horas)
Descobrir se Itinga publica no AMM-MG. Mapear a busca do SIGPub: parâmetros,
paginação, formato (HTML/JSON/PDF). Registrar em `municipios.fontes` como foi
feito com os portais de transparência na migration `0052`.

**D1 — coletor SIGPub** (o grosso do trabalho)
Migration + coletor por fornecedor + classificação por tipo. Meta: Araçuaí,
Diamantina e Itinga com diário indexado e buscável.

**D2 — Betim.** Portal próprio. Betim é a cidade mais completa do portal e a
que mais gente usa.

**D3 — BH.** DOM-Web.

**D4 — São Paulo.** Por último.

**D5 — resumo por modelo.** Só quando houver acervo em pelo menos três
cidades: um resumo bom precisa de série para comparar "o que saiu esta semana"
com o normal.

## O que medir para saber se funcionou

Não é o coletor rodar sem erro. É:

- **cobertura**: quantos dias do período têm pelo menos uma matéria (buraco de
  dias é o modo de falha silencioso da paginação);
- **classificação**: que fração das matérias recebeu tipo — se ficar como
  Diamantina ficou nos temas (9%), a regex foi calibrada na cidade errada;
- **link**: 100% com `link_fonte` resolvível. Sem exceção.
