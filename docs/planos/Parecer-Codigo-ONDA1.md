# Parecer — Código da Onda 1 (implementado pela outra sessão)

> **Tipo:** NOTA DE REVISÃO DE CÓDIGO
> **Domínio:** global
> **Data:** 2026-09-02 (14:27)
> **Relacionados:** [REVISAO-PLANO-GEMINI](./REVISAO-PLANO-GEMINI.md), [ROTEIRO-EXECUCAO-ONDA1](./ROTEIRO-EXECUCAO-ONDA1.md), [AGENTS](/AGENTS.md)
> **Palavras-chave:** revisao, codigo, onda 1, paineldialogo, bloco povo gente, lugares, dialogos, testes

## ✅ Escopo

Revisão estática do commit local `a24c081` (outra sessão/Antigravity), que
implementa a **Onda 1** do plano Nossos + Painéis-Sanfona. Não é merge nem
publicação — só parecer de qualidade.

## 🧪 Testes (rodados por mim)

```
✓ apps/web/lib/lugares.test.ts  (5 testes)
✓ apps/web/lib/dialogos.test.ts (6 testes)
Test Files: 2 passed | Tests: 11 passed
```

## 🟢 O que está bom

1. **`lib/dialogos.ts` + `lib/lugares.ts`** — schema segue o plano: razão
   editorial obrigatória, `nivelConfianca` (`fato_documentado` /
   `sinal_investigacao`), ressalva opcional, rota origem/destino. ✅
2. **Regra das 3 pontes** — testada e respeitada. ✅
3. **`PainelDialogo.tsx`** — `aria-expanded`, fecha com ESC, até 3 pontes,
   grid responsivo, mensagem explicando o diálogo entre frentes. ✅
4. **`BlocoPovoGente.tsx`** — suporta variação "E nosso povo?" /
   "E nossa gente?", com saúde, trabalho/renda, moradia e cultura. ✅
5. **Rotas Nossos** — `nossos-rios`, `nossas-serras`, `nossos-territorios`
   com páginas de índice e de slug sob `/ambiental`. ✅
6. **Integração Diamantina × Biribiri** — plugada na página do município. ✅

## 🟡 Pontos de atenção (sugestões, não bloqueios)

1. **`PainelDialogo` importa tipo de `@/lib/lugares` mas usa funções de
   `@/lib/dialogos`** — conferir se `PonteEntreFrentes` está exportado do
   lugar certo (lugares × dialogos) para não criar dependência circular. 🔄
2. **`BlocoPovoGente` não está em `PainelLugar`?** Confirmar se a página de
   slug (`nossos-rios/[slug]`) monta o bloco social com dados reais ou só
   placeholder. Se for placeholder, registrar como lacuna declarada. 📊
3. **`aria-label` do `PainelDialogo`** usa `section` com label — ok; conferir
   se o botão tem `aria-controls` apontando para o painel expansível. ♿
4. **Palavras-chave do AGENTS:** nenhum número inventado visto; bindings
   `[ligar à fonte]` presentes nos docs. ✅

## ⏭️ Recomendação

Publicar a Onda 1 no GitHub após:
1. Dono decidir quem publica (outra sessão ou via worktree limpo).
2. `npx tsc --noEmit` + `npm test` verdes no repo inteiro.
3. Link check das pontes (nenhuma rota 404).

Sem bloqueio técnico identificado até aqui. 🟢
