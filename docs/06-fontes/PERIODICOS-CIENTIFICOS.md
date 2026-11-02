# Periódicos Abertos e Oportunidades Acadêmicas Cíclicas

> **Tipo:** FONTE / DADOS
> **Domínio:** global (publicação científica, acesso aberto diamante, fluxo contínuo, chamadas cíclicas)
> **Última medição:** 2026-11-02
> **Leitura estimada:** média (~5 min)
> **Relacionados:** [FONTES.md](FONTES.md), [COLETA-ETICA.md](COLETA-ETICA.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** periodicos, artigos, fluxo-continuo, submissao-continua, ciclicos-confirmados, anuais, semestrais, acesso-aberto, diamond-oa, doi, ojs, scielo, doaj

## Sumário

- [O que é o acervo](#o-que-é-o-acervo)
- [Contínuos vs Cíclicos Confirmados](#contínuos-vs-cíclicos-confirmados)
- [Fontes e Procedência](#fontes-e-procedência)
- [As Oito Qualidades da Informação Atendidas](#as-oito-qualidades-da-informação-atendidas)
- [Estrutura dos Dados e Fases](#estrutura-dos-dados-e-fases)
- [Como Atualizar e Consultar](#como-atualizar-e-consultar)

## O que é o acervo

Catálogo mundial sistematizado de **23.577 periódicos científicos de acesso aberto** em **141 países**, com alcance completo unificado:
1. **Submissão e Publicação Contínua (6.759 títulos):** artigos aceitos e publicados no ato em fluxo aberto 365 dias/ano.
2. **Oportunidades Cíclicas Confirmadas (16.818 títulos):** revistas e chamadas periódicas previsíveis (semestrais, anuais, quadrimestrais e trimestrais).

O acervo destaca mais de **1.280 oportunidades vinculadas a universidades públicas, institutos estatais de pesquisa e órgãos governamentais** (Fiocruz, Embrapa, IPEA, IBGE, ENAP, Senado Federal, universidades federais e estaduais).

## Contínuos vs Cíclicos Confirmados

| Modelo | Funcionamento | Destaques no Catálogo |
|---|---|---|
| **Fluxo Contínuo** | Submissão aberta o ano todo; publicação imediata com DOI e elocation. | 6.759 periódicos (OJS e redes abertas) |
| **Semestral** | 2 edições/ano regulares. | 5.236 periódicos |
| **Trimestral** | 4 edições/ano regulares. | 5.107 periódicos |
| **Quadrimestral** | 3 edições/ano regulares (padrão Qualis A1/A2 no Brasil). | 3.486 periódicos |
| **Anual** | 1 edição/ano regular (anuários e relatórios científicos institucionais). | 2.986 periódicos |
| **Mensal / Bimestral** | Edições periódicas frequentes. | 3 periódicos |

## Fontes e Procedência

1. **DOAJ (Directory of Open Access Journals):** Licença CC BY-SA, dump diário oficial.
2. **Rede SciELO:** Coleções Brasil, Portugal e América Latina.
3. **Plataformas Universitárias OJS / SEER:** Mais de 10.700 portais integrados.

## As Oito Qualidades da Informação Atendidas

Conforme `docs/04-arquitetura/QUALIDADES-DA-INFORMACAO.md`, a entrega atende a todas as 8 qualidades:
1. **Linkável e Verificado:** Hiperlink direto para submissão e homepage oficial.
2. **Buscável e Filtrável:** Busca textual FTS5 em milissegundos e filtros reais por periodicidade, gratuidade e órgão governamental.
3. **Classificável e Ordenável:** Ordenação no cliente por título, tempo médio de avaliação e país.
4. **Resumo e Cartões de Topo:** Totais reais medidos derivados do arquivo JSON estático.
5. **Chatbot com Contexto Cívico:** Integração do botão do Seu Nonô (`BotaoPerguntarNono`).
6. **Exportável Multi-formato:** Botão que gera CSV com BOM UTF-8 (`\uFEFF`) e `;` para Excel brasileiro e estilo `@media print`.
7. **Responsiva:** Layout fluido para 390 px (celular) a 4K, sem rolagem lateral falsa.
8. **Rastreável no Tempo:** Carimbo de data de verificação derivado dos dados.

## Estrutura dos Dados e Fases

| Fase | Região | Títulos | % Diamante (Gratuito) |
|---|---|---|---|
| 1 | Brasil e Lusófonos | 1.565 | 89,5% |
| 2 | América Latina e Caribe | 1.970 | 85,2% |
| 3 | América do Norte | 1.576 | 48,1% |
| 4 | Europa | 10.478 | 58,3% |
| 5 | África | 910 | 66,4% |
| 6 | Ásia e China | 6.142 | 67,2% |
| 7 | Oceania e Resto do Mundo | 936 | 45,8% |
| **Total** | **Global (141 países)** | **23.577** | **62,5%** |

## Como Atualizar e Consultar

```bash
# Atualizar acervo e exportações
python scripts/dados/periodicos/coletar_periodicos.py
python scripts/dados/periodicos/banco_periodicos.py
python scripts/dados/periodicos/exportar_portal.py
python scripts/dados/periodicos/testar_integridade.py

# Consultas CLI
python scripts/dados/periodicos/consultar_periodicos.py --pais Brasil --modelo ciclico --periodicidade semestral
python scripts/dados/periodicos/consultar_periodicos.py --pais Brasil --governo --gratuitos
```
