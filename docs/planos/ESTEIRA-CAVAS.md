# Plano: Esteira de Duas Calibrações para Cavas

> **Tipo:** PLANO
> **Domínio:** mineracao (cavas, modelo VLM)
> **Última medição:** 2026-10-14
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md), [MEDICOES-CAVAS-MINERACAO.md](MEDICOES-CAVAS-MINERACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** cavas, mineracao, modelo, esteira, cbers, anm, calibracao, clip, holdout

## Sumário

- [Problema atual](#problema-atual)
- [Arquitetura proposta](#arquitetura-proposta)
- [Passos](#passos)
- [Fontes de dados](#fontes-de-dados)
- [Custo Azure (estimativa)](#custo-azure-estimativa)

## Problema atual
Modelo v7 está colado em 0.65 — não discrimina bem. Precisa de:
1. Banco de cavas reais ANM como referência
2. Duas esteiras (zoom médio → zoom máximo)
3. Features geográficas além da imagem

## Arquitetura proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE CAVAS REAIS                     │
│  7.656 processos ANM com bbox (positivos-mg.json)           │
│  + features geográficas (rios, serras, relevo)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ESTEIRA 1: ZOOM MÉDIO (pré-seleção)            │
│  Entrada: recorte 2048x2048 (~2km)                          │
│  Objetivo: achar indícios de mineração                       │
│  Features: Chinese-CLIP + histograma de cor + relevo        │
│  Saída: candidatos (score_1)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ESTEIRA 2: ZOOM MÁXIMO (confirmação)           │
│  Entrada: recorte 512x512 (~400m)                           │
│  Objetivo: confirmar cava vs falso positivo                 │
│  Features: Chinese-CLIP + textura + tamanho + proximidade   │
│  Saída: pontuação final (score_2)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CALIBRAÇÃO COM BANCO REAL                       │
│  Positivos: cavas ANM confirmadas (7.656)                   │
│  Negativos: áreas sem mineração (amostragem stratificada)   │
│  Métrica: precisão ≥ 80% no holdout por cena                │
└─────────────────────────────────────────────────────────────┘
```

## Passos

### Fase 1: Banco de referência (hoje)
1. [ ] Extrair bbox dos 7.656 processos ANM
2. [ ] Baixar imagem CBERS em 2 escalas para cada
3. [ ] Calcular features geográficas (distância a rios, relevo)
4. [ ] Salvar em `scripts/.cache/cavas-banco/`

### Fase 2: Features geográficas
1. [ ] Baixar hidrografia IBGE (rios principais de MG)
2. [ ] Baixar relevo SRTM/ETOPO
3. [ ] Calcular distância a rios e inclinação do terreno
4. [ ] Adicionar ao banco como metadados

### Fase 3: Modelo de duas esteiras
1. [ ] Retreinar Esteira 1 (zoom médio) com features geográficas
2. [ ] Retreinar Esteira 2 (zoom máximo) nos candidatos da Esteira 1
3. [ ] Calibrar limiares separadamente
4. [ ] Avaliar no holdout por cena

### Fase 4: Armazenamento
1. [ ] Desktop: banco local em SSD
2. [ ] Home-PC: cópia para coleta noturna
3. [ ] Azure Container App: API de inferência (se custo ok)

## Fontes de dados

| Dado | Fonte | Status |
|---|---|---|
| Cavas ANM | SIGBM/ANM | ✅ 7.656 com bbox |
| Hidrografia | IBGE Hidrografia | ⬜ Precisa baixar |
| Relevo | SRTM/ETOPO | ⬜ Precisa baixar |
| Imagens CBERS | INPE DSA | ✅ Já baixando |
| Limites municipais | IBGE | ✅ No repo |

## Custo Azure (estimativa)

| Item | Custo/mês |
|---|---|
| Container Apps (2 vCPU, 4GB) | ~R$ 150 |
| Storage 50GB | ~R$ 15 |
| Bandeja 100GB | ~R$ 10 |
| **Total** | **~R$ 175** |

Alternativa mais barata: rodar tudo local e só servir resultados estáticos.
