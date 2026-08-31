# Design System de Cores — Controle Popular

> **Tipo:** ARQUITETURA
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** rápida (< 5 min)
> **Relacionados:** [ARQUITETURA.md](ARQUITETURA.md), [PADRAO-VISUAL.md](PADRAO-VISUAL.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** cores, paleta, tokens, oklch, acessibilidade, daltonismo, cvd, alto contraste

## Sumário

- [Visão Geral](#visão-geral)
- [Paleta Padrão (light / dark)](#paleta-padrão-light--dark)
- [Paleta CVD (daltonismo)](#paleta-cvd-daltonismo)
- [Paleta de Alto Contraste](#paleta-de-alto-contraste)
- [Tokens de Superfície e Texto](#tokens-de-superfície-e-texto)
- [Regras de Acessibilidade](#regras-de-acessibilidade)

## Visão Geral

O Controle Popular usa um sistema de cores com **três camadas**: paleta padrão,
paleta para daltonismo (CVD) e paleta de alto contraste. Cada camada é um
conjunto de tokens CSS aplicados ao `<html>` via atributo `data-theme`.

## Paleta Padrão (light / dark)

A paleta padrão usa o par **verde/vermelho** para indicadores semânticos
binários (garantista/reducionista, sim/não, alerta/ok). Este par é
**intencionalmente** o mais intuitivo para visão normal — verde = amplia
direitos, vermelho = restringe.

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--cp-accent` | `#0e8f6e` (verde) | `#2fbf9a` (verde claro) | Links, badges garantistas, votos "sim" |
| `--cp-alert` | `#c0392b` (vermelho) | `#e5736a` (vermelho claro) | Alertas, badges reducionistas, votos "não" |
| `--cp-accent-ink` | `#ffffff` | `#06231c` | Texto sobre fundo accent |
| `--cp-primary` | `#12467b` | — | Cor principal (azul escuro) |
| `--cp-secondary` | `#6d28d9` | — | Cor secundária (roxo) |
| `--cp-tertiary` | `#8a5300` | — | Cor terciária (âmbar) |

### Regra de Ouro

> **NUNCA usa cor sozinha para carregar significado.**
> Todo elemento visual que depende de cor também tem texto, ícone ou
> textura como canal redundante. Ref: `RotuloBadge.tsx:8`.

## Paleta CVD (daltonismo)

Ativada pelo botão "Cores para daltônicos" (`CvdToggle.tsx`). Troca
verde/vermelho por **azul/laranja** — o par que a literatura de
acessibilidade recomenda para deuteranopia/protanopia.

| Token | Light CVD | Dark CVD | High-Contrast CVD |
|-------|-----------|----------|-------------------|
| `--cp-accent` | `#2a78d6` (azul) | `#3987e5` (azul) | `#004c77` (azul escuro) |
| `--cp-alert` | `#c74e00` (laranja) | `#d95926` (laranja) | `#8f3000` (laranja escuro) |
| `--cp-accent-ink` | `#ffffff` | `#06211f` | `#ffffff` |

### Validação

- Delta-E de separação CVD: 27.1 / 26.8 (meta: > 8)
- Contraste sobre surface: validado para os três temas

## Paleta Alto Contraste (eMAG)

Tema próprio com contraste mínimo 7:1 (WCAG AAA). Ativado pelo seletor
de tema "Alto contraste" (`ThemeSwitcher.tsx`).

| Token | Valor |
|-------|-------|
| `--cp-accent` | `#006644` |
| `--cp-alert` | `#990000` |

## Paleta Ordinal (gráficos)

Rampa navy→olive para gráficos de barra e ranqueamento. Validada com
métricas de separação Machado 2009. Inclui textura (hatch 45°) na
categoria mais leve para suporte a `forced-colors` mode.

| Token | Uso |
|-------|-----|
| `--cp-ord-1` | Nível mais baixo |
| `--cp-ord-2` | — |
| `--cp-ord-3` | — |
| `--cp-ord-4` | Nível mais alto |

## Elementos que Usam accent/alert

- **Votações**: `ListaVotacoes.tsx` — verde=sim, vermelho=não
- **Rótulos garantista/reducionista**: `RotuloBadge.tsx`, `PerfilAgregado.tsx`
- **Alertas legais**: `Facilitador.tsx`, `BuscaUniversal.tsx`
- **Barragens**: borders e textos de alerta
- **Cards de perigo**: home, denúncia

## Como Adicionar Cores Novas

1. Definir token CSS em `globals.css` (blocos `[data-theme="light"]`, etc.)
2. Usar APENAS tokens existentes — nunca hex direto
3. Se for indicador binário, usar `--cp-accent` / `--cp-alert`
4. Documentar neste arquivo
5. Verificar contraste com ferramenta (ex: WebAIM Contrast Checker)
