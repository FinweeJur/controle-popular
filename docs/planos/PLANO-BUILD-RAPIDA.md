# Plano — build mais rápida

> **Tipo:** PLANO
> **Domínio:** build, CI, Next.js, banco, worktree
> **Última medição:** 2026-11-02
> **Leitura estimada:** curta (5–15 min)
> **Relacionados:** [PLANO-PAINEL-INTEGRADO-02-11.md](PLANO-PAINEL-INTEGRADO-02-11.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [DESENVOLVIMENTO.md](../03-desenvolvimento/DESENVOLVIMENTO.md)
> **Palavras-chave:** build, turbopack, webpack, typecheck, prerender, cache, worktree, juncao, node_modules

## Sumário

- [O que motivou](#1-o-que-motivou)
- [O que já está otimizado](#2-o-que-já-está-otimizado)
- [Onde o tempo vai](#3-onde-o-tempo-vai)
- [As três medidas](#4-as-três-medidas)
- [Como medir](#5-como-medir)
- [Quando executar](#6-quando-executar)

## 1. O que motivou

Build medida em 02/11/2026, no worktree `painel-facetas`, alvo padrão:
**~19 min** no total, 714 páginas prerenderizadas.

| Etapa | Tempo |
|---|---:|
| Prebuild (banco, índice de busca, provas, API) | ~7 min |
| Compile | 5,4 min |
| TypeScript dentro do build | 6,0 min |
| Prerender das 714 páginas | 75 s |

## 2. O que já está otimizado

- **Turbopack é o padrão do build** desde 05/10/2026: `next build --turbopack`.
  Medido na adoção: 338 s contra 369–398 s do webpack, e metade do `.next`.
- **Type-check sai do build pago** no alvo standalone (Guara cobra por minuto);
  roda no CI do GitHub.
- **Concorrência por alvo:** 16 no standalone, 3 nos demais, com retry 3.
- **`optimizePackageImports`** para `lucide-react`.

## 3. Onde o tempo vai

1. **O `tsc` roda dentro do build** em todo alvo que não seja standalone. São
   6 min repetindo o que o `npx tsc --noEmit` já faz em 2 min.
2. **Leitura de banco repetida no prerender.** O log traz
   `[banco:congresso] principal (Guara) vazio` **139 vezes** — cada linha é
   uma tentativa de reserva, não uma página. Memoizar a leitura por build
   troca 139 tentativas por uma.
3. **Worktree não usa Turbopack.** A junção de `node_modules`
   (`New-Item -ItemType Junction`) é recusada: *“Symlink points out of the
   filesystem root”*. O build cai para webpack, que é mais lento e mais
   gordo — e é o que qualquer sessão paralela sofre hoje.

## 4. As três medidas

### 4.1 Type-check fora do build, em todos os alvos

Repetir o que já existe para o standalone (`next.config.ts`, bloco
`typescript.ignoreBuildErrors`), com o `typecheck` obrigatório no CI. Ganho
esperado: ~6 min. Custo: um passo de CI a mais, que já existe.

### 4.2 Memoizar leitura de banco no prerender

`lib/db/reserva.ts` já cai para a reserva quando a principal está vazia.
Envolver as consultas de catálogo em cache de módulo por build (não
`unstable_cache`, que é por request) evita repetir a mesma consulta 139 vezes.
Ganho esperado: minutos no prebuild e no prerender; medir antes de afirmar.

### 4.3 Worktree com dependências locais

Duas saídas, na ordem de preferência:

- `npm ci --prefer-offline` dentro do worktree: build hermético, Turbopack
  funciona. Custa disco e ~2–3 min uma vez por worktree.
- `turbopack.root` apontando para o repositório canônico: ganha o Turbopack,
  mas quebra o isolamento entre sessões — só se a primeira não servir.

## 5. Como medir

```powershell
Measure-Command { npm run build }        # total
# no log: "Compiled successfully", "Finished TypeScript", "Generating static pages"
```

Registrar antes e depois na tabela da seção 1. Build mais rápida que não
prerenderiza as mesmas 714 páginas não é ganho — é regressão disfarçada.

## 6. Quando executar

**Depois do painel integrado dos eixos.** Rodar as duas frentes juntas junta
duas medições no mesmo build, e o painel é justamente quem mais acrescenta
página para prerenderizar. Executar antes seria otimizar um alvo que muda em
seguida.

A ordem combinada com o dono em 02/11/2026: primeiro reunir as frentes em menos
páginas (fases 2 a 4 do plano do painel), depois as três medidas acima.
