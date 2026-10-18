# Plano: Esteira de Duas Calibrações para Cavas

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** mineracao (cavas, modelo VLM)
> **Última medição:** 2026-10-15
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-GLOBO-CAVAS-MINERACAO.md](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md), [MEDICOES-CAVAS-MINERACAO.md](/docs/historico/planos/MEDICOES-CAVAS-MINERACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** cavas, mineracao, modelo, esteira, cbers, anm, calibracao, clip, holdout

## Sumário

- [Problema atual](#problema-atual)
- [Achados da inspeção humana (15/10/2026)](#achados-da-inspecao-humana-15-10-2026)
- [Divisão de trabalho entre as máquinas](#divisao-de-trabalho-entre-as-maquinas)
- [Arquitetura proposta](#arquitetura-proposta)
- [Passos](#passos)
- [Fontes de dados](#fontes-de-dados)
- [Custo Azure (estimativa)](#custo-azure-estimativa)

## Problema atual
Modelo v7 está colado em 0.65 — não discrimina bem. Precisa de:
1. Banco de cavas reais ANM como referência
2. Duas esteiras (zoom médio → zoom máximo)
3. Features geográficas além da imagem

## Achados da inspeção humana (15/10/2026)

Calibração resolvida (T=0.5, medido por `calibrar-modelo.py`): o teto de
probabilidade subiu de 0,658 para ~0,79 e o F1 ficou estável em 0,834 do
limiar 0,5 ao 0,7. Mas a **discriminação continua ruim** — e a inspeção
humana provou por quê.

Decomposição dos "positivos confiantes" (score ≥ 0,65) pela verdade de terra
do checkpoint (`audit-positivos.py`):

| Origem | n | modelo chama de cava |
|---|---|---|
| autorizados ANM (positivos do treino) | 2035 | 1750 |
| pontos NEGATIVOS (fora de todo SIGBMINE) | 3137 | **1109** |

Os 1.750 são o modelo reconhecendo o que já lhe demos — não descoberta. Os
**1109 são quase todos falso positivo**: dos 30 mais fortes que um humano olhou
(`exportar-suspeitas.py` + folha-contato), **0 eram cava ilegal**. Eram rio,
lago, ilha, cidade, círculo de irrigação, pasto, desmate e nuvem.

`assinatura.py` testou peneira por cor e a **negativa é o achado**: a mediana
de solo nu (`bare`) é **0,97 tanto nas cavas reais quanto nos falsos**. Cava a
céu aberto, lavoura e desmate compartilham "muito chão pelado" no recorte de
4,3 km a 8,4 m/px. Cor não separa; o modelo aprendeu "chão pelado com borda" e
confunde os três.

**Consequência para o plano:** publicar contagem de "cavas encontradas" seria
dano (regra §7). A separação real exige **geometria em alta resolução**
(paredes, degraus, água no fundo) — que só o zoom máximo do banco dá — mais o
descarte de polígonos ANM, água e nuvem. O próximo treino entra com **negativos
difíceis** (lavoura, desmate, cidade, açude) para o modelo parar de tratar
"chão pelado" como cava.

### B: negativos difíceis medidos no mesmo holdout (15/10/2026)

Recolocamos os 1.109 pontos que o modelo erra como `--hard-negativos` e variamos
o peso no sorteio (`--peso-dificil`). Resultado (n=1039, mesma regra de gate):

| modelo | peso difícil | F1 | precisão | recall | falsos pos (de 476) |
|---|---|---|---|---|---|
| v7 | nenhum | 0.834 | 0.766 | 0.917 | 158 |
| v11 | 3,0 | 0.226 | 0.890 | 0.130 | 9 |
| v12 | 1,5 | 0.804 | 0.850 | 0.764 | 76 |

Leitura: em 3× o modelo **desaba o recall** (aprende a dizer "não" a quase
tudo, até às cava reais, que têm a mesma cara que a lavoura) — confirma que
cor não separa. Em 1,5× existe ponto útil: **corta os falsos positivos à metade
(158→76)** pagando recall (0.92→0.76). É o botão certo para descoberta
conservadora: quando o modelo flagra, é mais confiável. Não resolve o teto de
8,4 m/px (a separação de verdade ainda pede alta resolução), mas melhora a
precisão sem depender de publicar número inflado.

## Divisão de trabalho entre as máquinas

Os downloaders leem a mesma lista (`scripts/dados/cavas-mg/banco-anm.json`,
versionada 15/10) mas produzem saídas **diferentes** e **retomáveis por hash**,
então dá para dividir sem sobreposição. Critério: o que usa GPU fica no desktop;
o que é só rede/CPU vai para o `home-pc` (via Tailscale/Termius).

| Máquina | O que roda | Por quê |
|---|---|---|
| **desktop** (este) | `baixar-banco-paralelo.py` (RGB 8 m) + treino/re-pontuação | GPU livre para o modelo |
| **home-pc** | `gerar-recortes-finos.py` (PAN 2 m) | o mais lento e o que separa mina de campo; sem GPU |

Regra para não errar: **não ligar o PAN no desktop nem o RGB no home-pc** —
cada script numa máquina só. Os checkpoints são locais (`checkpoint-banco.jsonl`
e `checkpoint-finos.jsonl`); no fim a gente junta as duas máquinas por sha256,
sem duplicar imagem. Nada disso é commit (fica em `.cache`); só se commite um
`.py` consertado.

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