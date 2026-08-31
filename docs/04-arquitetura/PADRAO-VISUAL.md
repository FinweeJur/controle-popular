# Padrão Visual — Controle Popular

## Regra de Ouro

**Tabelas/gráficos curtos/expansíveis → Texto explicativo → Lista ordenável/filtrável/pesquisável**

Cada página segue esta ordem:
1. **Dados primeiro**: cards resumo, gráficos curtos, tabelas compactas
2. **Explicação**: texto sobre os dados, contexto, methodologia
3. **Detalhes**: lista completa com busca, ordenação e paginação

## Componentes Disponíveis

### Tabelas
- **`TabelaEstatica`**: tabela reutilizável com busca, ordenação, paginação e export CSV
  - Definir `ColunaTabela[]` com `chave`, `rotulo`, `formatar`, `ordenavel`, `numerica`
  - Passar `camposBusca` para busca por texto
  - Usar para listas grandes (>10 itens)
- **`<details>/<summary>`**: para conteúdo expansível sem JS (SSG-safe)
  - Usar `line-clamp-3` + `group-open:line-clamp-none` para reveal progressivo
  - Toggle: "mostrar mais" / "mostrar menos"
- **`<table>` inline**: para tabelas pequenas (<10 itens) sem paginação

### Gráficos
- **`BarrasValor`**: barras horizontais proporcionais (CSS puro, Server Component)
- **`RankingVereadores`**: ranking com toggle entre gráfico e tabela
- **`ComposicaoCamara`**: barras empilhadas de composição
- **NUNCA usar recharts, nivo ou similares** (limite 3MiB no Cloudflare Workers)

### Cards de Navegação
- **`PortaCard`**: card com etiqueta, título, descrição, número e CTA
- **`CartaoTopico`**: card de índice com ícone, badge, cor e link
- **`DataCard`**: card com título, botão compartilhar e link fonte

### Busca/Filtro
- **`BuscaMunicipio`**: busca por município com grade de resultados
- **`BuscaUniversal`**: combobox ARIA global
- **`BuscaLegislacaoUnificada`**: busca unificada de legislação

### Animações (CSS)
- `cp-card-hover`: elevação no hover
- `cp-btn-anim`: micro-animação em botões
- `cp-icon-spin`: rotação contínua (loading)
- `cp-pensando-ponto`: três pontos cascata (pensando)
- `cp-painel-entra`: slide-in de painéis

## Layout Padrão de Página

```tsx
<main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
  {/* 1. Breadcrumb */}
  <nav className="mb-4 text-[.82em] text-text-soft">...</nav>

  {/* 2. Título + descrição */}
  <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
    Título da Página
  </h1>
  <p className="mt-3 max-w-2xl text-[1.02em] leading-relaxed text-text-soft">
    Descrição do que a página mostra e quais dados ela contém.
  </p>

  {/* 3. Cards resumo / gráficos curtos */}
  <div className="mt-8 grid gap-4 sm:grid-cols-2">
    <CardResumo ... />
  </div>

  {/* 4. Tabela principal ou gráfico */}
  <section className="mt-10">
    <TabelaEstatica ... />
  </section>

  {/* 5. Texto explicativo / methodologia */}
  <section className="mt-10">
    <h2>Como estes dados foram coletados</h2>
    <p>...</p>
  </section>

  {/* 6. Lista detalhável */}
  <section className="mt-10">
    <details>
      <summary>Ver todos os itens</summary>
      ...
    </details>
  </section>

  {/* 7. Footer */}
  <FooterGlobal />
</main>
```

## Regras de Acessibilidade

- Todo gráfico tem alternativa textual
- Tabelas têm `<thead>` e `<th>` com escopo
- Cores nunca são o único canal de informação (ver `CORES-E-PALETA.md`)
- `prefers-reduced-motion: reduce` desativa todas as animações
- Alto contraste (eMAG) desativa efeitos decorativos

## Regras de Performance

- Server Components por padrão; `"use client"` só quando necessário
- Imagens com `loading="lazy"`
- Nenhum bundle de biblioteca externa de gráficos
- `output: 'export'` (SSG) — todas as páginas devem ser estáticas
- Limite: 3MiB por chunk no Cloudflare Workers
