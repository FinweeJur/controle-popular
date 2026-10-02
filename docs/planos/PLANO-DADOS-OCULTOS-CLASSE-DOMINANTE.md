# Plano — Dados que as classes dominantes não querem mostrar

> **Tipo:** PLANO
> **Domínio:** transversal (Cidades, Congresso, Judiciário, Ambiental, Terra, Estado e Economia)
> **Última medição:** 01/10/2026
> **Leitura estimada:** média (~8 min)
> **Relacionados:** [PLANO-EXPANSAO-AMBIENTAL-ONDA-2.md](PLANO-EXPANSAO-AMBIENTAL-ONDA-2.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ESTADO.md](../02-estado/ESTADO.md)
> **Palavras-chave:** plano, classes dominantes, concentração, porta giratória, trabalho escravo, sonegação, encarceramento, violência policial, agrotóxicos, dados ocultos

## Sumário

- [Propósito](#propósito)
- [Fundamento filosófico](#fundamento-filosófico)
- [Inventário do que já existe](#inventário-do-que-já-existe)
- [Dado coletado e escondido](#dado-coletado-e-escondido)
- [Fase A — Integrar o escondido](#fase-a--integrar-o-escondido)
- [Fase B — Construir o que falta](#fase-b--construir-o-que-falta)
- [Fase C — Limpeza do repositório](#fase-c--limpeza-do-repositório)
- [Regras transversais](#regras-transversais)

## Propósito

Registrar o plano de ampliação do portal em torno de um eixo único: **revelar o custo do lucro**.
O portal já é um instrumento de desnaturalização. Este plano intensifica isso com dado público,
cruzamento cívico e vozes dos movimentos — sem mapear estruturas internas de organizações
(guia: o conhecimento serve ao cidadão que fiscaliza, não a quem reprime).

## Fundamento filosófico

- **Gramsci:** a hegemonia se mantém quando o dominante parece natural. O portal desnaturaliza — mostra o mecanismo.
- **Quijano / tradição decolonial:** a colonialidade do poder esconde quem paga a conta. O portal revela.
- **Fals Borda / tradição latino-americana:** o saber liberta quando volta ao povo. O portal devolve — CSV, impressão, Seu Nonô.

Pergunta-chave de cada publicação: **este conhecimento fortalece o movimento ou o Estado?**
Se a resposta for ambígua, não publica.

## Inventário do que já existe

Verificado em 01/10/2026 (commits até `8c2baa38`).

| Tema | Status | Onde |
|---|---|---|
| Concentração de riqueza (1000 fortunas) | ✅ Existe | `/empresas/fortunas` + `data/empresas/fortunas-mundiais.compact.json` |
| Conglomerados / holdings | ✅ Existe | `/empresas/conglomerados` (holdings, setores, arestas) |
| Porta giratória (executivos × conselhos) | ⚠️ Parcial | `/empresas/executivos` + `executivos-conselhos.compact.json` |
| Geopolítica / operações militares | ✅ Existe | `/internacional/operacoes-militares` (+ mapa) + `operacoes-militares.compact.json` |
| Desclassificados do G20 | ✅ Existe | `/internacional/desclassificados` (+ mapa) + `desclassificados-g20.compact.json` |
| Crise climática global | ✅ Existe | `/ambiental/crise-climatica` + `crise-climatica-global.compact.json` |
| Conflitos socioambientais globais | ✅ Existe | `/ambiental/conflitos-globais` |
| Barragens mundiais | ✅ Existe | `/ambiental/barragens-globais` |
| Ameaças nas Américas | ✅ Existe | `/ambiental/ameacas-americas` |
| EUA / Canadá / Europa / América Latina | ✅ Existe | `/eua`, `/canada`, `/europa`, `/america-latina`, `/transparencia-internacional` |
| Consumo corporativo G20 | ✅ Existe | `data/recursos/g20-consumo-setorial-corporativo.compact.json` |

## Dado coletado e escondido

| Dado | Situação |
|---|---|
| Licenças ambientais de ~15 estados (SEMAS-PA, SEMAR-PI, SEMAD-GO, SEMA-MT, SEMA-MA, SEDAM-RO, INEMA-BA, IMA-SC, CETESB-SP, FEPAM-RS, IAT-PR, IEMA-ES, IGAM-MG, IMASUL-MS, IBRAM-DF) | JSONs prontos em `data/amostras/` — Onda 2 parcialmente integrada |
| Fontes dos 27 estados (48 KB) | Integrada só ao índice de busca |
| Educação IBGE/INEP MG | `lib/educacao/mg-dados.ts` criado, exibido em `/direitos-em-movimento/educacao` |
| ESG da Vale | `lib/paraopeba/esg-vale.ts` criado |
| Vales Jequitinhonha/Mucuri (51 KB) | JSON solto, sem rota visível |
| Entidades completas (114 KB) | Modificado, sem commit |
| Mapeamento dos 27 estados | Untracked em `docs/relatorio-mapeamento-27-estados.md` |

## Fase A — Integrar o escondido

Rápido, alto retorno. O dado já foi coletado.

1. ✅ **Licenças por UF:** já existia — o feed unificado `/ambiental/licencas` cobre IBAMA,
   ANA, IGAM (MG) e 14 órgãos estaduais (BA, MA, PA, GO, MT, PI, PE, PI, ES, RO, MS, DF, SP, PR, SC, RS).
2. ✅ **Vales Jequitinhonha/Mucuri:** `/terra-e-territorios/vales` — 82 municípios, lítio,
   comunidades tradicionais, povo Maxakali, CSV e links oficiais (libs `lib/cidades/vales-*`).
3. ✅ **Porta giratória:** seção na `/empresas/executivos` — 713 administradores de companhias
   abertas que declararam cargo público (ministro, secretário, Banco Central, agência
   reguladora, Tribunal de Contas, MP/CGU, cargo eletivo) no item 12 do Formulário de
   Referência da CVM. Coletor: `scripts/etl/empresas/coletar-porta-giratoria-cvm.py`.
   Fonte é a declaração da companhia (FRE/CVM), com link por linha — não o Diário Oficial,
   que não publica histórico estruturado em dado aberto.

## Fase B — Construir o que falta

| # | Frente | Fonte oficial | Primeira etapa |
|---|---|---|---|
| 4 | ✅ **Trabalho escravo contemporâneo** — Cadastro de Empregadores (MTE) | MTE (Cadastro), PNCP, Portal da Transparência | Feito: `/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores` — 190 registros PJ, 181 empresas, 1.867 trabalhadores; pessoa física (388) contada e omitida (CPF nunca gravado). Coletor `scripts/etl/trabalho/coletar-lista-suja-mte.py`. Contratos por link oficial por CNPJ |
| 5 | ✅ **Financiamento de campanha → fornecedores** | TSE (prestação de contas 2022), PNCP, Portal da Transparência | Feito: `/congresso/financiamento-eleitoral` — 750 fornecedores PJ (de 11.317), R$ 257 mi contratados, escopo MG 2022. Doação de PJ é proibida desde 2015 (ADI 4650): o recorte cívico é a DESPESA (quem a campanha pagou). Coletor `scripts/etl/eleicoes/coletar-fornecedores-campanha-2022.py`. Contratos por link oficial por CNPJ |
| 6 | ✅ **Renúncia fiscal por setor e região** | Receita Federal (Gastos Tributários, Bases Efetivas) | Feito: `/estado-e-economia/renuncia-fiscal` — R$ 534 bi no ano-base 2023 (24,7% da arrecadação), por função orçamentária × região. Coletor `scripts/etl/receita/coletar-renuncia-fiscal.py` (download via curl; confere a soma contra a linha TOTAL). Portal da Transparência (por empresa) está atrás de WAF (403) — lacuna registrada |
| 7 | ✅ **Encarceramento** — população, lotação e perfil | SENAPPEN (SISDEPEN) | Feito: enriquece `/judiciario/presidios` — 960.976 presos no Brasil, ocupação 141,4% (superlotação), 25,4% sem condenação, 59,5% pretos/pardos; tabela por UF. Coletor `scripts/etl/sisdepen/coletar-sisdepen.py` (19º ciclo) |
| 8 | **Violência policial** — mortes por intervenção | Anuário FBSP, Sinesp, secretarias estaduais | Painel com perfil da vítima (raça, idade, local), fonte datada |
| 9 | **Agrotóxicos e desmatamento autuado** | IBAMA (autuações/embargos), ANVISA, INPE, MapBiomas | Ampliar `/ambiental/ibama` com cruzamento município × embargo |

Ordem sugerida: 4 e 5 primeiro (dado público e pronto), depois 6, 7, 8, 9.
Cada frente segue a regra das seis qualidades (AGENTS.md §8) e a régua editorial (§7):
número vem do dado; ressalva colada ao número; lacuna publicada.

## Fase C — Limpeza do repositório

**Não commitar sem ordem do dono.** Inventário medido em 01/10/2026:

- ~40 arquivos `commit_msg_*.txt` na raiz — lixo de sessões anteriores;
- scripts de teste soltos (`test_bots*.js`, `testar_endpoint_telegram.py`, `test_*.py` em `scripts/`);
- capturas de tela (`test_snap*.png`);
- arquivos modificados sem commit (notícias, entidades, relatórios de automação);
- documento `ORPHANED_DATA_INTEGRATION.md` na raiz — integrar conteúdo a docs/ e remover.

## Regras transversais

1. **Só dado público de fonte oficial** — ato público, portal oficial, documento judicial. Link direto e específico.
2. **Nada de estrutura interna** de partidos/movimentos: sem organograma, sem lista de membros, sem rede interna.
3. **Dado pessoal:** varrer com `scripts/checar-dado-pessoal-em-dado.py` e a guarda de CPF antes de commitar.
4. **Pausa e cortesia na coleta:** 1–2 s por host, User-Agent honesto, robots.txt lido e decisão registrada.
5. **Cada frente nova entra no índice de busca, no Seu Nonô e na página da cidade quando aplicável.**
6. **Verificação em camadas** (AGENTS.md §9): tsc + guarda de CPF + eslint no commit; suíte completa antes do push.
