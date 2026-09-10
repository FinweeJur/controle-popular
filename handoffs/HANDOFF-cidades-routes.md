# 📤 HANDOFF — Routes de Cidades (Sessão Delegada)

## Contexto
Expansão nacional do Controle Popular — 5.570 municípios do Brasil já coletados em `apps/web/data/municipios-brasil.json`. A route `/cidades/sp` foi implementada como template em `apps/web/app/cidades/sp/page.tsx`.

## 🎯 Meta
Criar routes `/cidades/rj`, `/cidades/ba` e `/cidades/rs` replicando o padrão de SP.

## 📋 Handoff Técnico
1. **Arquivo template:** `apps/web/app/cidades/sp/page.tsx` (59 linhas)
2. **Dados de entrada:** `apps/web/data/municipios-{uf}.json`
   - `municipios-rj.json` → 92 municípios
   - `municipios-ba.json` → 417 municípios  
   - `municipios-rs.json` → 497 municípios
3. **Fatias:** `apps/web/public/municipios/{uf}/manifesto.json` + `0.json`

## ⚙️ Tarefas (em ordem)
1. **Fatiar dados** — para cada UF, gerar `public/municipios/{uf}/` usando a lógica inline do script:
   ```bash
   mkdir -p apps/web/public/municipios/rj
   node -e "<fatiar lógica de apps/web/lib/estatico/fatiar.ts>"
   ```
2. **Criar page.tsx** — copiar `app/cidades/sp/page.tsx`, substituir:
   - `"sp"` → `"rj"`, `"SP"` → `"RJ"`, `"35"` → `"33"`
   - `645` → `92`, `46,7M` → `16,7M`
3. **Repetir** para `ba` e `rs`.

## ✅ Critério de Finalização
- [ ] 3 routes criadas
- [ ] TypeScript sem erros (`npx tsc --noEmit --project apps/web/tsconfig.json`)
- [ ] Fatias JSON válidas (testar com `node -e "JSON.parse(...)"`)
- [ ] Commit por pasta (`--only`) com mensagem em português sem acento

## 🚨 Bloqueios
- **NÃO tocar** em `municipios-sp.json` (já publicado)
- **NÃO alterar** `TabelaEstatica.tsx` (componente compartilhado)
- **Usar** `--only` no commit para não pegar outros worktrees
