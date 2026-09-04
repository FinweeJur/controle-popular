# Revisão — Plano Nossos + Painéis-Sanfona (retorno Gemini integrado)

> **Tipo:** NOTA DE REVISÃO
> **Domínio:** global
> **Data:** 2026-09-02
> **Relacionados:** [PLANO-NOSSOS-PAINEIS-SANFONA](./PLANO-NOSSOS-PAINEIS-SANFONA.md), [MAPA-POEMAS-SUBFRENTES](./MAPA-POEMAS-SUBFRENTES.md), [SEU-NONO-GOLDEN-SET-VOZ](./SEU-NONO-GOLDEN-SET-VOZ.md)
> **Palavras-chave:** revisao, plano, schema, pontes, wireframe, componentes, bloco social
> **Última medição:** 2026-09-02
> **Leitura estimada:** curta (≤ 5 min)

## Sumário

- [✅ O que foi revisado](#o-que-foi-revisado)
- [🟢 Pontos fortes](#pontos-fortes)
- [🟡 Pontos de atenção (para a próxima rodada)](#pontos-de-atencao-para-a-proxima-rodada)
- [🚧 Estado atualizado (14:24)](#estado-atualizado-1424)
- [⏭️ Próximos passos sugeridos](#proximos-passos-sugeridos)

## ✅ O que foi revisado

O `PLANO-NOSSOS-PAINEIS-SANFONA.md` recebeu o **retorno do Gemini** (via
outra sessão/Antigravity, commit `4824927`) e agora tem:

- Schema TypeScript central (`lib/lugares.ts` + `lib/dialogos.ts`). 🧩
- Contratos JSON de exemplo (Serra do Espinhaço; Diamantina × Biribiri). 📄
- Catálogo de rotas e anatomia de páginas (município, rio, serra, território). 🗺️
- Árvore de componentes React (`PainelDialogo`, `PainelLugar`, `BlocoSocial`). 🌳
- Wireframes ASCII da sanfona lateral. 🪗
- Regras de associação com razão editorial, nível de confiança e ressalva. 📋
- Priorização em 3 ondas + 5 critérios de aceite testáveis. 🎯

## 🟢 Pontos fortes

1. Modelo com **razão editorial obrigatória** e **nível de confiança**
   (`fato_documentado` vs `sinal_investigacao`) — alinhado à régua
   anti-insinuação do AGENTS.md. ✅
2. Bloco "E nosso povo?" (varia com "E nossa gente?") com determinantes
   sociais reais: saúde, trabalho, moradia, cultura. ✅
3. Limite de **até 3 pontes por tela** — evita sobrecarga. ✅
4. Wireframe já prevê **ressalva colada** e badge de confiança no cartão. ✅
5. Rota de terras vira âncora de ONSA Territórios — integração territorial. ✅

## 🟡 Pontos de atenção (para a próxima rodada)

1. **ONSA passa a abrigar terras** — decisão forte: mexe na identidade da
   frente `/funcaosocialterra`. Confirmar com o dono antes de migrar rotas
   legadas (mantendo alias, como o plano sugere). ⚠️
2. **Nomenclatura do bloco:** o dono pediu inicialmente "E o social?";
   o retorno Gemini usa "E nosso povo?"/"E nossa gente?". Deixar a versão
   final com o dono. ✍️
3. **Dependência de dados:** bloco social precisa de SIH-SUS, Censo e
   AdaptaBrasil por município — já existem parcialmente (ver ESTADO). 📊
4. **Poemas:** o `MAPA-POEMAS-SUBFRENTES.md` agora casa os versos com as
   páginas novas; conferir que o hub ONSA encerra com o Poema 3. 📖
5. **Avatar e voz:** já aplicados (widget) e registrados (golden set). ✅


## 🚧 Estado atualizado (14:24)

A outra sessão (Antigravity) **já implementou a Onda 1 em código** no main
local (commit `a24c081`, 17 arquivos, ~1.933 linhas): `lib/lugares.ts`,
`lib/dialogos.ts` (com testes), `PainelDialogo`, `CartaoPonteSanfona`,
`PainelLugar`, `BlocoPovoGente`, rotas Nossos Rios/Serras/Territórios e a
integração Biribiri em Diamantina. ⚠️ Commit ainda não publicado no GitHub
(aguardando decisão do dono: quem publica). Não duplicar esta implementação.

## ⏭️ Próximos passos sugeridos

1. Dono valida: ONSA abraça terras? Bloco chama "E o social?" ou
   "E nosso povo?"? 
2. Aprovar schema → criar `lib/lugares.ts` + `lib/dialogos.ts` (onda 1).
3. Criar `PainelDialogo` com acessibilidade (onda 1).
4. Rodar `npm test` + `tsc` após cada componente.
